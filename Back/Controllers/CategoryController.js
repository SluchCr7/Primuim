const asyncHandler = require("express-async-handler");
const { 
    Category,
    validateCreateCategory,
    validateUpdateCategory 
} = require("../models/Category");

// ========================================
// @desc    Get All Categories (Hierarchical Tree or flat list)
// @route   GET /api/categories
// @access  Public
// ========================================
const getCategories = asyncHandler(async (req, res) => {
  const isTree = req.query.tree === undefined ? true : req.query.tree === "true";

  if (isTree) {
    const categories = await Category.find({ parent: null })
      .populate({
        path: "subcategories",
        populate: {
          path: "subcategories"
        }
      });
    return res.status(200).json({ success: true, count: categories.length, categories });
  }

  const categories = await Category.find().populate("parent", "name");
  res.status(200).json({ success: true, count: categories.length, categories });
});

// ========================================
// @desc    Get Category By ID
// @route   GET /api/categories/:id
// @access  Public
// ========================================
const getCategoryById = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id)
    .populate("parent", "name")
    .populate("subcategories");

  if (!category) {
    return res.status(404).json({ success: false, message: "Category not found" });
  }

  res.status(200).json({ success: true, category });
});

// ========================================
// @desc    Create Category
// @route   POST /api/categories
// @access  Private/Admin
// ========================================
const createCategory = asyncHandler(async (req, res) => {
  const { error } = validateCreateCategory(req.body);
  if (error) {
    return res.status(400).json({ success: false, message: error.details[0].message });
  }

  // 🔥 إضافة image هنا لاستخراجها من الـ body
  const { name, description, image, parent, isActive } = req.body;

  const exists = await Category.findOne({ name });
  if (exists) {
    return res.status(400).json({ success: false, message: "Category name already exists" });
  }

  if (parent) {
    const parentExists = await Category.findById(parent);
    if (!parentExists) {
      return res.status(404).json({ success: false, message: "Parent category not found" });
    }
  }

  // 🔥 تمرير حقل الـ image لكي يتم حفظه في قاعدة البيانات
  const category = await Category.create({
    name,
    description,
    image, 
    parent: parent || null,
    isActive,
  });

  res.status(201).json({ success: true, message: "Category created successfully", category });
});

// ========================================
// @desc    Update Category
// @route   PUT /api/categories/:id
// @access  Private/Admin
// ========================================
const updateCategory = asyncHandler(async (req, res) => {
  const { error } = validateUpdateCategory(req.body);
  if (error) {
    return res.status(400).json({ success: false, message: error.details[0].message });
  }

  const category = await Category.findById(req.params.id);
  if (!category) {
    return res.status(404).json({ success: false, message: "Category not found" });
  }

  // 🔥 إضافة image هنا لاستخراجها من الـ body
  const { name, description, image, parent, isActive } = req.body;

  if (name && name !== category.name) {
    const exists = await Category.findOne({ name });
    if (exists) {
      return res.status(400).json({ success: false, message: "Category name already exists" });
    }
    category.name = name;
  }

  if (parent !== undefined) {
    if (parent === category._id.toString()) {
      return res.status(400).json({ success: false, message: "A category cannot be its own parent" });
    }
    if (parent) {
      const parentExists = await Category.findById(parent);
      if (!parentExists) {
        return res.status(404).json({ success: false, message: "Parent category not found" });
      }
      category.parent = parent;
    } else {
      category.parent = null;
    }
  }

  if (description !== undefined) category.description = description;
  if (isActive !== undefined) category.isActive = isActive;
  
  // 🔥 تحديث الصورة في الكائن إذا تم إرسالها في الطلب
  if (image !== undefined) category.image = image;

  await category.save();
  res.status(200).json({ success: true, message: "Category updated successfully", category });
});

// ========================================
// @desc    Delete Category
// @route   DELETE /api/categories/:id
// @access  Private/Admin
// ========================================
const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) {
    return res.status(404).json({ success: false, message: "Category not found" });
  }

  await Category.updateMany({ parent: category._id }, { parent: null });

  await category.deleteOne();
  res.status(200).json({ success: true, message: "Category deleted successfully and child links updated" });
});

module.exports = {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory
};