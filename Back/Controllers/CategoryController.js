const asyncHandler = require("express-async-handler");
const { 
    Category,
    validateCreateCategory,
    validateUpdateCategory 
} = require("../models/Category");

// استيراد دوال Cloudinary التي قمت بإنشائها
const { cloudUpload, cloudRemove } = require("../config/cloudUplaod"); // تأكد من المسار الصحيح للملف

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
    .populate({
      path: "parent",
      populate: {
        path: "parent",
        populate: {
          path: "parent"
        }
      }
    })
    .populate("subcategories");

  if (!category) {
    return res.status(404).json({ success: false, message: "Category not found" });
  }

  res.status(200).json({ success: true, category });
});

// ========================================
// @desc    Get Category By Slug
// @route   GET /api/categories/slug/:slug
// @access  Public
// ========================================
const getCategoryBySlug = asyncHandler(async (req, res) => {
  const category = await Category.findOne({ slug: req.params.slug })
    .populate({
      path: "parent",
      populate: {
        path: "parent",
        populate: {
          path: "parent"
        }
      }
    })
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
  // 1. التحقق من صحة البيانات النصية قادمة من req.body
  const { error } = validateCreateCategory(req.body);
  if (error) {
    return res.status(400).json({ success: false, message: error.details[0].message });
  }

  const { name, description, parent, isActive } = req.body;

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

  // 2. التحقق من وجود ملف الصورة المرفوع عبر Multer
  if (!req.file) {
    return res.status(400).json({ success: false, message: "Please upload a category image" });
  }

  // 3. رفع الصورة إلى Cloudinary باستخدام الـ Buffer
  const uploadResult = await cloudUpload(req.file);

  // 4. إنشاء القسم وحفظ رابط Cloudinary المستقر (secure_url)
  const category = await Category.create({
    name,
    description,
    image: uploadResult.secure_url, // هنا يتم حفظ الرابط بالكامل تلقائياً
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

  const { name, description, parent, isActive } = req.body;

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
  
  // 5. إذا قام الأدمن برفع صورة جديدة لتحديث القسم
  if (req.file) {
    // اختياري: يمكنك هنا استخراج الـ publicId الخاص بالصورة القديمة من الرابط وحذفها باستخدام cloudRemove لتوفير مساحة Cloudinary
    
    // رفع الصورة الجديدة
    const uploadResult = await cloudUpload(req.file);
    category.image = uploadResult.secure_url;
  }

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

  // اختياري: يمكنك حذف الصورة من Cloudinary هنا أيضاً قبل مسح الـ category نهائياً

  await category.deleteOne();
  res.status(200).json({ success: true, message: "Category deleted successfully and child links updated" });
});

module.exports = {
  getCategories,
  getCategoryById,
  getCategoryBySlug,
  createCategory,
  updateCategory,
  deleteCategory
};