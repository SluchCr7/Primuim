const express = require("express");
const router = express.Router();

const {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory
} = require("../Controllers/CategoryController");
const { verifyAdmin } = require("../Middelwares/verifyToken");

router.get("/", getCategories);
router.get("/:id", getCategoryById);
router.post("/", verifyAdmin, createCategory);
router.put("/:id", verifyAdmin, updateCategory);
router.delete("/:id", verifyAdmin, deleteCategory);

module.exports = router;
