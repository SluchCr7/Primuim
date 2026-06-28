const { Article, validateArticle } = require("../models/Article");
const { User } = require("../models/User");
const AnalyticsEvent = require("../models/AnalyticsEvent");
const { createNotification } = require("../utils/notifications");
const asyncHandler = require("express-async-handler");
const { cloudUpload, cloudRemove } = require("../config/cloudUplaod");

// ========================================
// @desc    Create new article (draft or pending review)
// @route   POST /api/articles
// @access  Private (Seller/Admin)
// ========================================
const createArticle = asyncHandler(async (req, res) => {
  if (req.user) {
    req.body.author = req.user.id;
  }

  const { error } = validateArticle(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  const { title, content, subtitle, category, tags, status, metaTitle, metaDescription, keywords, canonicalUrl } = req.body;
  let imageData = null;

  if (req.file) {
    try {
      const uploadResult = await cloudUpload(req.file);
      imageData = {
        publicId: uploadResult.public_id,
        url: uploadResult.secure_url
      };
    } catch (uploadError) {
      return res.status(500).json({ message: "Image upload failed, please try again." });
    }
  }

  // ── Determine status & authorName based on the user's role ────────────
  const isAdminUser = req.user.role === "admin" || req.user.role === "superadmin";

  let initialStatus;
  let authorName;

  if (isAdminUser) {
    // Admin-created articles bypass the moderation queue entirely
    initialStatus = (req.body.isPublished === "true" || req.body.isPublished === true)
      ? "approved"
      : (status || "approved");
    authorName = "Admin";
  } else {
    // Sellers/other roles must go through moderation — force "pending"
    initialStatus = "pending";
    const authorUser = await User.findById(req.user.id);
    authorName = authorUser ? authorUser.storeName || authorUser.username : "VIP Author";
  }

  const article = new Article({
    title,
    content,
    subtitle,
    category: category || "Lifestyle",
    tags: tags || [],
    author: req.user.id,
    authorName,
    image: imageData || undefined,
    status: initialStatus,
    metaTitle: metaTitle || "",
    metaDescription: metaDescription || "",
    keywords: keywords || [],
    canonicalUrl: canonicalUrl || ""
  });

  const savedArticle = await article.save();

  // If submitted for review (non-admin), notify admins
  if (initialStatus === "pending") {
    const admins = await User.find({ role: { $in: ["admin", "superadmin"] } });
    for (const admin of admins) {
      await createNotification({
        user: admin._id,
        title: "New Article Submitted for Review",
        message: `Seller "${authorName}" submitted a new article "${title}" for review.`,
        type: "article"
      });
    }
  }

  res.status(201).json({
    success: true,
    message: isAdminUser
      ? "Article published successfully"
      : "Article submitted for review",
    data: savedArticle
  });
});

// ========================================
// @desc    Get all approved articles (Public with pagination)
// @route   GET /api/articles
// @access  Public
// ========================================
const getArticles = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  
  const query = { status: "approved" };

  if (req.query.category) {
    query.category = req.query.category;
  }

  if (req.query.search) {
    query.$or = [
      { title: { $regex: req.query.search, $options: "i" } },
      { content: { $regex: req.query.search, $options: "i" } }
    ];
  }

  if (req.query.featured === "true") {
    query.isFeatured = true;
  }

  const totalArticles = await Article.countDocuments(query);
  const articles = await Article.find(query)
    .populate("author", "storeName storeSlug storeLogo brandName")
    .sort({ publishedAt: -1, createdAt: -1 })
    .skip(skip)
    .limit(limit);

  res.json({
    success: true,
    page,
    limit,
    totalArticles,
    totalPages: Math.ceil(totalArticles / limit),
    data: articles
  });
});

// ========================================
// @desc    Get article by slug (Public lookup + views counter + log event)
// @route   GET /api/articles/slug/:slug
// @access  Public
// ========================================
const getArticleBySlug = asyncHandler(async (req, res) => {
  const { slug } = req.params;
  const article = await Article.findOne({ slug })
    .populate("author", "storeName storeSlug storeLogo brandName followers responseTime storeRating");

  if (!article || article.status === "deleted") {
    return res.status(404).json({ success: false, message: "Article not found" });
  }

  // Increment views
  article.views += 1;

  // Track unique visitors using a mock sessionId in query or user authorization
  const sessionId = req.query.sessionId || req.ip || "anonymous";
  if (!article.uniqueVisitors.includes(sessionId)) {
    article.uniqueVisitors.push(sessionId);
  }

  await article.save();

  // Log analytics event asynchronously
  try {
    await AnalyticsEvent.create({
      sessionId,
      eventType: "page_view",
      user: req.user ? req.user.id : null,
      metadata: {
        type: "article",
        articleId: article._id,
        authorId: article.author._id
      }
    });
  } catch (err) {
    console.error("Analytics log error:", err.message);
  }

  res.json({
    success: true,
    article
  });
});

// ========================================
// @desc    Get article by ID (Legacy fallback support)
// @route   GET /api/articles/:id
// @access  Public
// ========================================
const getArticleById = asyncHandler(async (req, res) => {
  const article = await Article.findById(req.params.id)
    .populate("author", "storeName storeSlug storeLogo brandName followers responseTime storeRating");

  if (!article || article.status === "deleted") {
    return res.status(404).json({ success: false, message: "Article not found" });
  }

  // Increment views
  article.views += 1;

  // Track unique visitors using a mock sessionId in query or user authorization
  const sessionId = req.query.sessionId || req.ip || "anonymous";
  if (!article.uniqueVisitors.includes(sessionId)) {
    article.uniqueVisitors.push(sessionId);
  }

  await article.save();

  // Log analytics event asynchronously
  try {
    await AnalyticsEvent.create({
      sessionId,
      eventType: "page_view",
      user: req.user ? req.user.id : null,
      metadata: {
        type: "article",
        articleId: article._id,
        authorId: article.author._id
      }
    });
  } catch (err) {
    console.error("Analytics log error:", err.message);
  }

  res.json({ success: true, article });
});

// ========================================
// @desc    Update article
// @route   PUT /api/articles/:id
// @access  Private (Author/Admin)
// ========================================
const updateArticle = asyncHandler(async (req, res) => {
  let article = await Article.findById(req.params.id);
  if (!article || article.status === "deleted") {
    return res.status(404).json({ message: "Article not found" });
  }

  // Verify authorship or admin permissions
  if (article.author.toString() !== req.user.id && req.user.role !== "admin" && req.user.role !== "superadmin") {
    return res.status(403).json({ message: "Not authorized to update this article" });
  }

  // Handle image update
  if (req.file) {
    if (article.image && article.image.publicId) {
      await cloudRemove(article.image.publicId);
    }
    const uploadResult = await cloudUpload(req.file);
    req.body.image = {
      publicId: uploadResult.public_id,
      url: uploadResult.secure_url
    };
  }

  // Prevent direct publishing by sellers
  if (req.user.role === "seller" && req.body.status === "approved") {
    req.body.status = "pending";
  }

  // If seller edits a rejected or draft article and submits it
  if (req.body.status === "pending" && article.status !== "pending") {
    // Notify Admin
    const admins = await User.find({ role: { $in: ["admin", "superadmin"] } });
    for (const admin of admins) {
      await createNotification({
        user: admin._id,
        title: "Article Updated & Resubmitted",
        message: `Seller "${req.user.username}" resubmitted article "${article.title}" for review.`,
        type: "article"
      });
    }
  }

  const updatedArticle = await Article.findByIdAndUpdate(
    req.params.id,
    { $set: req.body },
    { new: true, runValidators: true }
  ).populate("author", "storeName storeSlug storeLogo brandName");

  res.json({
    success: true,
    message: "Article updated successfully",
    data: updatedArticle
  });
});

// ========================================
// @desc    Delete article (Soft Delete)
// @route   DELETE /api/articles/:id
// @access  Private (Author/Admin)
// ========================================
const deleteArticle = asyncHandler(async (req, res) => {
  const article = await Article.findById(req.params.id);
  if (!article || article.status === "deleted") {
    return res.status(404).json({ message: "Article not found" });
  }

  if (article.author.toString() !== req.user.id && req.user.role !== "admin" && req.user.role !== "superadmin") {
    return res.status(403).json({ message: "Not authorized to delete this article" });
  }

  // Soft Delete
  article.status = "deleted";
  await article.save();

  res.json({ success: true, message: "Article removed successfully" });
});

// ========================================
// @desc    Duplicate article (Seller duplication as draft)
// @route   POST /api/articles/:id/duplicate
// @access  Private (Seller/Admin)
// ========================================
const duplicateArticle = asyncHandler(async (req, res) => {
  const original = await Article.findById(req.params.id);

  if (!original || original.status === "deleted") {
    return res.status(404).json({ success: false, message: "Original article not found" });
  }

  if (original.author.toString() !== req.user.id && req.user.role !== "admin" && req.user.role !== "superadmin") {
    return res.status(403).json({ success: false, message: "Not authorized" });
  }

  const copy = new Article({
    title: `${original.title} (Copy) - ${Math.floor(100 + Math.random() * 900)}`,
    content: original.content,
    subtitle: original.subtitle,
    category: original.category,
    tags: original.tags,
    author: req.user.id,
    authorName: original.authorName,
    image: original.image ? { url: original.image.url, publicId: original.image.publicId } : undefined,
    status: "draft",
    metaTitle: original.metaTitle,
    metaDescription: original.metaDescription,
    keywords: original.keywords,
    canonicalUrl: original.canonicalUrl
  });

  const savedCopy = await copy.save();

  res.status(201).json({
    success: true,
    message: "Article duplicated successfully as a draft",
    data: savedCopy
  });
});

// ========================================
// @desc    Get articles owned by logged in seller
// @route   GET /api/articles/mine
// @access  Private (Seller only)
// ========================================
const getMyArticles = asyncHandler(async (req, res) => {
  const articles = await Article.find({ author: req.user.id, status: { $ne: "deleted" } })
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    articles
  });
});

// ========================================
// @desc    Like / Unlike Article
// @route   POST /api/articles/:id/like
// @access  Private
// ========================================
const likeArticle = asyncHandler(async (req, res) => {
  const article = await Article.findById(req.params.id);

  if (!article || article.status === "deleted") {
    return res.status(404).json({ message: "Article not found" });
  }

  const alreadyLiked = article.likes.includes(req.user.id);
  if (alreadyLiked) {
    article.likes = article.likes.filter(id => id.toString() !== req.user.id);
  } else {
    article.likes.push(req.user.id);
  }

  await article.save();
  res.status(200).json({
    success: true,
    isLiked: !alreadyLiked,
    likesCount: article.likes.length
  });
});

// ========================================
// @desc    Comment on Article
// @route   POST /api/articles/:id/comments
// @access  Private
// ========================================
const commentArticle = asyncHandler(async (req, res) => {
  const { text } = req.body;
  if (!text || text.trim() === "") {
    return res.status(400).json({ message: "Comment content cannot be empty" });
  }

  const article = await Article.findById(req.params.id);
  if (!article || article.status === "deleted") {
    return res.status(404).json({ message: "Article not found" });
  }

  article.comments.push({
    user: req.user.id,
    username: req.user.username || "Client",
    text
  });

  await article.save();

  res.status(201).json({
    success: true,
    message: "Comment added successfully",
    comments: article.comments
  });
});

// ========================================
// @desc    Delete Comment on Article
// @route   DELETE /api/articles/:articleId/comments/:commentId
// @access  Private
// ========================================
const deleteComment = asyncHandler(async (req, res) => {
  const { articleId, commentId } = req.params;
  const article = await Article.findById(articleId);

  if (!article || article.status === "deleted") {
    return res.status(404).json({ message: "Article not found" });
  }

  const comment = article.comments.id(commentId);
  if (!comment) {
    return res.status(404).json({ message: "Comment not found" });
  }

  // Authorized: comment owner, article author, or admin
  if (comment.user.toString() !== req.user.id && article.author.toString() !== req.user.id && req.user.role !== "admin" && req.user.role !== "superadmin") {
    return res.status(403).json({ message: "Not authorized to delete this comment" });
  }

  comment.deleteOne();
  await article.save();

  res.status(200).json({
    success: true,
    message: "Comment deleted successfully",
    comments: article.comments
  });
});

// ========================================
// @desc    Get pending articles for review (Admin only)
// @route   GET /api/articles/admin/pending
// @access  Private (Admin only)
// ========================================
const getPendingArticles = asyncHandler(async (req, res) => {
  const articles = await Article.find({ status: "pending" })
    .populate("author", "storeName username email")
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: articles.length,
    articles
  });
});

// ========================================
// @desc    Get all articles (Admin only)
// @route   GET /api/articles/admin/all
// @access  Private (Admin only)
// ========================================
const getAdminArticles = asyncHandler(async (req, res) => {
  const articles = await Article.find({ status: { $ne: "deleted" } })
    .populate("author", "storeName username email")
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: articles.length,
    articles
  });
});

// ========================================
// @desc    Moderate article (Approve / Reject / Archive / Feature)
// @route   PATCH /api/articles/admin/:id/moderate
// @access  Private (Admin only)
// ========================================
const moderateArticle = asyncHandler(async (req, res) => {
  const { status, rejectionReason, isFeatured } = req.body;
  const article = await Article.findById(req.params.id);

  if (!article || article.status === "deleted") {
    return res.status(404).json({ success: false, message: "Article not found" });
  }

  if (status) {
    const validStatuses = ["approved", "rejected", "archived", "draft"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status" });
    }

    if (status === "rejected" && (!rejectionReason || rejectionReason.trim() === "")) {
      return res.status(400).json({ success: false, message: "Rejection requires a reason" });
    }

    article.status = status;
    if (status === "rejected") {
      article.rejectionReason = rejectionReason;
    } else {
      article.rejectionReason = ""; // clear reason on approval
    }
  }

  if (isFeatured !== undefined) {
    article.isFeatured = !!isFeatured;
  }

  await article.save();

  // Send real-time notification to the seller/author
  let notificationTitle = "Article Update";
  let notificationMessage = `Your article "${article.title}" has been updated by administration.`;
  if (status === "approved") {
    notificationTitle = "Article Approved & Published";
    notificationMessage = `Congratulations! Your article "${article.title}" has been approved and published to the marketplace.`;
  } else if (status === "rejected") {
    notificationTitle = "Article Rejected";
    notificationMessage = `Your article "${article.title}" was rejected. Reason: ${rejectionReason}`;
  }

  await createNotification({
    user: article.author,
    title: notificationTitle,
    message: notificationMessage,
    type: "article"
  });

  res.status(200).json({
    success: true,
    message: `Article moderated successfully to status: ${article.status}`,
    article
  });
});

// ========================================
// @desc    Get Seller Article Analytics overview
// @route   GET /api/articles/analytics/dashboard
// @access  Private (Seller only)
// ========================================
const getArticleAnalyticsDashboard = asyncHandler(async (req, res) => {
  const sellerId = req.user.id;
  const articles = await Article.find({ author: sellerId, status: { $ne: "deleted" } });

  let totalViews = 0;
  let totalUniqueVisitors = 0;
  let totalReadTime = 0;
  let totalLikes = 0;
  let totalComments = 0;
  let totalShares = 0;
  let totalClicks = 0;

  articles.forEach(art => {
    totalViews += art.views || 0;
    totalUniqueVisitors += art.uniqueVisitors ? art.uniqueVisitors.length : 0;
    totalReadTime += (art.readTime || 0) * (art.views || 0);
    totalLikes += art.likes ? art.likes.length : 0;
    totalComments += art.comments ? art.comments.length : 0;
    totalShares += art.shares || 0;
    totalClicks += art.clicks || 0;
  });

  // Calculate overall Click-Through Rate (CTR)
  const ctr = totalViews === 0 ? 0 : Math.round((totalClicks / totalViews) * 10000) / 100;

  // Find top performing articles
  const topArticles = [...articles]
    .sort((a, b) => b.views - a.views)
    .slice(0, 5)
    .map(a => ({
      id: a._id,
      title: a.title,
      slug: a.slug,
      views: a.views,
      likes: a.likes.length,
      comments: a.comments.length,
      status: a.status
    }));

  res.status(200).json({
    success: true,
    analytics: {
      totalViews,
      totalUniqueVisitors,
      totalReadTimeMinutes: totalReadTime,
      totalLikes,
      totalComments,
      totalShares,
      totalClicks,
      ctr,
      topArticles
    }
  });
});

// ========================================
// @desc    Get chart statistics for a single article
// @route   GET /api/articles/analytics/:id
// @access  Private (Seller only)
// ========================================
const getSingleArticleAnalytics = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const article = await Article.findById(id);

  if (!article || article.status === "deleted") {
    return res.status(404).json({ success: false, message: "Article not found" });
  }

  if (article.author.toString() !== req.user.id && req.user.role !== "admin" && req.user.role !== "superadmin") {
    return res.status(403).json({ success: false, message: "Not authorized" });
  }

  const days = Number(req.query.days) || 30;
  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - days);

  // Group views by day
  const events = await AnalyticsEvent.aggregate([
    {
      $match: {
        eventType: "page_view",
        "metadata.type": "article",
        "metadata.articleId": article._id,
        createdAt: { $gte: fromDate }
      }
    },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        views: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  res.status(200).json({
    success: true,
    days,
    article: {
      title: article.title,
      views: article.views,
      likesCount: article.likes.length,
      commentsCount: article.comments.length,
      readTime: article.readTime,
      shares: article.shares,
      seoScore: article.seoScore
    },
    viewsOverTime: events
  });
});

module.exports = {
  createArticle,
  getArticles,
  getArticleBySlug,
  getArticleById,
  updateArticle,
  deleteArticle,
  duplicateArticle,
  getMyArticles,
  likeArticle,
  commentArticle,
  deleteComment,
  getPendingArticles,
  getAdminArticles,
  moderateArticle,
  getArticleAnalyticsDashboard,
  getSingleArticleAnalytics
};