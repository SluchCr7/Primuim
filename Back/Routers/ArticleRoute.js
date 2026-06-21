const express = require("express");
const router = express.Router();
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
    getSingleArticleAnalytics
} = require("../Controllers/ArticleController");

const { verifyToken, verifySeller, verifyAdmin } = require("../Middelwares/verifyToken");
const photoUpload = require("../Middelwares/UploadPhoto");

// Public routes
router.get("/", getArticles);
router.get("/slug/:slug", getArticleBySlug);
router.get("/:id", getArticleById);

// Customer actions
router.post("/:id/like", verifyToken, likeArticle);
router.post("/:id/comments", verifyToken, commentArticle);
router.delete("/:articleId/comments/:commentId", verifyToken, deleteComment);

// Seller routes (order is critical: static paths must go before dynamic parameters)
router.get("/mine", verifySeller, getMyArticles);
router.get("/analytics/dashboard", verifySeller, getArticleAnalyticsDashboard);
router.get("/analytics/:id", verifySeller, getSingleArticleAnalytics);
router.post("/:id/duplicate", verifySeller, duplicateArticle);

// Admin moderation routes
router.get("/admin/pending", verifyAdmin, getPendingArticles);
router.get("/admin/all", verifyAdmin, getAdminArticles);
router.patch("/:id/moderate", verifyAdmin, moderateArticle);

// General writing/management routes
router.post("/", verifySeller, photoUpload.single("image"), createArticle);
router.put("/:id", verifySeller, photoUpload.single("image"), updateArticle);
router.delete("/:id", verifySeller, deleteArticle);

module.exports = router;