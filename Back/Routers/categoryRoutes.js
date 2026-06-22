const express = require("express");
const router = express.Router();

const {
  getCategories,
  getCategoryById,
  getCategoryBySlug,
  createCategory,
  updateCategory,
  deleteCategory
} = require("../Controllers/CategoryController");
const { verifyAdmin } = require("../Middelwares/verifyToken");
const photoUpload = require("../Middelwares/UploadPhoto");

router.get("/", getCategories);
router.get("/slug/:slug", getCategoryBySlug);
router.get("/:id", getCategoryById);

// أضف photoUpload.single("image") هنا
router.post("/", verifyAdmin, photoUpload.single("image"), createCategory);
router.put("/:id", verifyAdmin, photoUpload.single("image"), updateCategory);

router.delete("/:id", verifyAdmin, deleteCategory);

module.exports = router;