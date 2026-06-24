const express    = require("express");
const router     = express.Router();
const {
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
  getSingleArticleAnalytics,
} = require("../Controllers/ArticleController");

const { verifyToken, verifySeller, verifyAdmin } = require("../Middelwares/verifyToken");
const photoUpload = require("../Middelwares/UploadPhoto");

/**
 * @swagger
 * tags:
 *   name: Articles
 *   description: Seller blog articles — CRUD, likes, comments, analytics, admin moderation
 */

/**
 * @swagger
 * /api/articles:
 *   get:
 *     summary: Get all published articles with pagination and filters
 *     tags: [Articles]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: tag
 *         schema: { type: string }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Articles returned.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:    { type: boolean, example: true }
 *                 articles:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Article'
 *                 totalPages: { type: integer, example: 5 }
 */
router.get("/", getArticles);

/**
 * @swagger
 * /api/articles/slug/{slug}:
 *   get:
 *     summary: Get a published article by its SEO slug
 *     tags: [Articles]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema: { type: string }
 *         example: 5-luxury-fashion-trends-2026
 *     responses:
 *       200:
 *         description: Article returned.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 article: { $ref: '#/components/schemas/Article' }
 *       404:
 *         description: Article not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/slug/:slug", getArticleBySlug);

/**
 * @swagger
 * /api/articles/{id}:
 *   get:
 *     summary: Get a single article by ObjectId
 *     tags: [Articles]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Article returned.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 article: { $ref: '#/components/schemas/Article' }
 */
router.get("/:id", getArticleById);

/**
 * @swagger
 * /api/articles/{id}/like:
 *   post:
 *     summary: Toggle a like on an article
 *     tags: [Articles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Like toggled.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 likes:   { type: integer, example: 48 }
 */
router.post("/:id/like", verifyToken, likeArticle);

/**
 * @swagger
 * /api/articles/{id}/comments:
 *   post:
 *     summary: Add a comment to an article
 *     tags: [Articles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CommentInput'
 *     responses:
 *       201:
 *         description: Comment added.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 */
router.post("/:id/comments", verifyToken, commentArticle);

/**
 * @swagger
 * /api/articles/{articleId}/comments/{commentId}:
 *   delete:
 *     summary: Delete a comment (comment author or admin only)
 *     tags: [Articles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: articleId
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Comment deleted.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 */
router.delete("/:articleId/comments/:commentId", verifyToken, deleteComment);

/**
 * @swagger
 * /api/articles/mine:
 *   get:
 *     summary: Get all articles authored by the authenticated seller (including drafts)
 *     tags: [Articles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *     responses:
 *       200:
 *         description: Seller's articles returned.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:  { type: boolean, example: true }
 *                 articles: { type: array, items: { $ref: '#/components/schemas/Article' } }
 */
router.get("/mine", verifySeller, getMyArticles);

/**
 * @swagger
 * /api/articles/analytics/dashboard:
 *   get:
 *     summary: Get aggregate analytics for all articles authored by the seller
 *     tags: [Articles]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Article analytics dashboard returned.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:    { type: boolean, example: true }
 *                 totalViews: { type: integer, example: 12400 }
 *                 totalLikes: { type: integer, example: 847 }
 */
router.get("/analytics/dashboard", verifySeller, getArticleAnalyticsDashboard);

/**
 * @swagger
 * /api/articles/analytics/{id}:
 *   get:
 *     summary: Get analytics for a single article (views, likes, comments over time)
 *     tags: [Articles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Single article analytics returned.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:    { type: object }
 */
router.get("/analytics/:id", verifySeller, getSingleArticleAnalytics);

/**
 * @swagger
 * /api/articles/{id}/duplicate:
 *   post:
 *     summary: Duplicate an existing article as a draft
 *     tags: [Articles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       201:
 *         description: Article duplicated.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 article: { $ref: '#/components/schemas/Article' }
 */
router.post("/:id/duplicate", verifySeller, duplicateArticle);

/**
 * @swagger
 * /api/articles/admin/pending:
 *   get:
 *     summary: Get articles pending admin approval
 *     tags: [Articles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *     responses:
 *       200:
 *         description: Pending articles returned.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:  { type: boolean, example: true }
 *                 articles: { type: array, items: { $ref: '#/components/schemas/Article' } }
 */
router.get("/admin/pending", verifyAdmin, getPendingArticles);

/**
 * @swagger
 * /api/articles/admin/all:
 *   get:
 *     summary: Get all articles regardless of status (admin only)
 *     tags: [Articles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [published, draft, pending, rejected] }
 *     responses:
 *       200:
 *         description: All articles returned.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:  { type: boolean, example: true }
 *                 articles: { type: array, items: { $ref: '#/components/schemas/Article' } }
 */
router.get("/admin/all", verifyAdmin, getAdminArticles);

/**
 * @swagger
 * /api/articles/{id}/moderate:
 *   patch:
 *     summary: Approve or reject an article (admin only)
 *     tags: [Articles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [action]
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [approve, reject]
 *                 example: approve
 *               reason:
 *                 type: string
 *                 example: Content meets quality standards
 *     responses:
 *       200:
 *         description: Article moderated.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 */
router.patch("/:id/moderate", verifyAdmin, moderateArticle);

/**
 * @swagger
 * /api/articles:
 *   post:
 *     summary: Create a new article (seller only, optional cover image)
 *     tags: [Articles]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             allOf:
 *               - $ref: '#/components/schemas/ArticleInput'
 *               - type: object
 *                 properties:
 *                   image:
 *                     type: string
 *                     format: binary
 *     responses:
 *       201:
 *         description: Article created and submitted for moderation.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 article: { $ref: '#/components/schemas/Article' }
 */
router.post("/", verifySeller, photoUpload.single("image"), createArticle);

/**
 * @swagger
 * /api/articles/{id}:
 *   put:
 *     summary: Update an article (author seller only)
 *     tags: [Articles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             allOf:
 *               - $ref: '#/components/schemas/ArticleInput'
 *               - type: object
 *                 properties:
 *                   image:
 *                     type: string
 *                     format: binary
 *     responses:
 *       200:
 *         description: Article updated.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 article: { $ref: '#/components/schemas/Article' }
 *   delete:
 *     summary: Delete an article (author seller only)
 *     tags: [Articles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Article deleted.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 */
router.put("/:id", verifySeller, photoUpload.single("image"), updateArticle);
router.delete("/:id", verifySeller, deleteArticle);

module.exports = router;