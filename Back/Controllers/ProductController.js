const { Product, validateCreateProduct } = require("../models/Product");
const { Category } = require("../models/Category");
const Wishlist = require("../models/Wishlist");
const SearchAnalytics = require("../models/SearchAnalytics");
const asyncHandler = require("express-async-handler");
const slugify = require("slugify");
const { cloudUpload, cloudRemove } = require("../config/cloudUplaod");


// ========================================
// GET ALL PRODUCTS (with filters + pagination)
// ========================================
const getProducts = asyncHandler(async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const filter = {
    isDeleted: false,
    isPublished: true
  };

  // Search (Text index & Fuzzy fallback)
  if (req.query.search) {
    const searchTerm = req.query.search.trim();
    filter.$or = [
      { $text: { $search: searchTerm } },
      { title: { $regex: searchTerm, $options: "i" } },
      { brand: { $regex: searchTerm, $options: "i" } },
      { tags: { $regex: searchTerm, $options: "i" } }
    ];

    // Log the search term asynchronously for analytics
    if (searchTerm.length >= 2) {
      try {
        await SearchAnalytics.findOneAndUpdate(
          { term: searchTerm.toLowerCase() },
          { $inc: { count: 1 } },
          { upsert: true, new: true }
        );
      } catch (err) {
        console.error("Error logging search term:", err);
      }
    }
  }

  // Category filter (supports subcategories too!)
  if (req.query.category) {
    const subcats = await Category.find({ parent: req.query.category });
    const catIds = [req.query.category, ...subcats.map(c => c._id)];
    filter.category = { $in: catIds };
  }

  // Price filter
  if (req.query.minPrice || req.query.maxPrice) {
    filter.price = {};
    if (req.query.minPrice) filter.price.$gte = Number(req.query.minPrice);
    if (req.query.maxPrice) filter.price.$lte = Number(req.query.maxPrice);
  }

  // Brand filter
  if (req.query.brand) {
    filter.brand = req.query.brand;
  }

  // Tags filter
  if (req.query.tags) {
    const tagsArr = req.query.tags.split(",");
    filter.tags = { $in: tagsArr };
  }

  // Rating filter
  if (req.query.rating) {
    filter.ratingAverage = { $gte: Number(req.query.rating) };
  }

  // Sorting
  let sortObj = { createdAt: -1 };
  if (req.query.sort) {
    switch (req.query.sort) {
      case "price-asc":
        sortObj = { price: 1 };
        break;
      case "price-desc":
        sortObj = { price: -1 };
        break;
      case "rating":
        sortObj = { ratingAverage: -1 };
        break;
      case "sold":
        sortObj = { sold: -1 };
        break;
      case "newest":
        sortObj = { createdAt: -1 };
        break;
    }
  }

  // Run main query
  const totalProducts = await Product.countDocuments(filter);
  const products = await Product.find(filter)
    .populate("category", "name")
    .populate("seller", "username")
    .sort(sortObj)
    .skip(skip)
    .limit(limit);

  // Faceted Search calculations (if facets=true)
  let facets = null;
  if (req.query.facets === "true") {
    const facetFilter = { ...filter };
    
    const [brandFacets, categoryFacets, tagFacets, priceFacets] = await Promise.all([
      Product.aggregate([
        { $match: facetFilter },
        { $group: { _id: "$brand", count: { $sum: 1 } } },
        { $match: { _id: { $ne: null } } },
        { $sort: { count: -1 } }
      ]),
      Product.aggregate([
        { $match: facetFilter },
        { $group: { _id: "$category", count: { $sum: 1 } } },
        { $lookup: { from: "categories", localField: "_id", foreignField: "_id", as: "catDetails" } },
        { $unwind: "$catDetails" },
        { $project: { name: "$catDetails.name", count: 1 } }
      ]),
      Product.aggregate([
        { $match: facetFilter },
        { $unwind: "$tags" },
        { $group: { _id: "$tags", count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      Product.aggregate([
        { $match: facetFilter },
        {
          $group: {
            _id: null,
            min: { $min: "$price" },
            max: { $max: "$price" }
          }
        }
      ])
    ]);

    facets = {
      brands: brandFacets,
      categories: categoryFacets,
      tags: tagFacets,
      priceLimits: priceFacets[0] || { min: 0, max: 0 }
    };
  }

  res.status(200).json({
    success: true,
    page,
    limit,
    totalProducts,
    totalPages: Math.ceil(totalProducts / limit),
    facets,
    products
  });
});


// ========================================
// GET PRODUCT BY ID
// ========================================
const getProductById = asyncHandler(async (req, res) => {

    const product = await Product.findById(req.params.id)
        .populate("category", "name")
        .populate("seller", "username");

    if (!product || product.isDeleted || !product.isPublished) {
        return res.status(404).json({
            success: false,
            message: "Product not found"
        });
    }

    res.status(200).json({
        success: true,
        product
    });
});

// ========================================
// GET PRODUCT BY SLUG
// ========================================
const getProductBySlug = asyncHandler(async (req, res) => {
    const product = await Product.findOne({ slug: req.params.slug })
        .populate("category", "name")
        .populate("seller", "username");
    // أضف السطرين القادمين في الـ terminal عندك لتفحص النتيجة
    console.log("الـ Slug المطلوب:", req.params.slug);
    console.log("المنتج الموجود في الداتابيز:", product);
    if (!product || product.isDeleted || !product.isPublished) {
        return res.status(404).json({
            success: false,
            message: "Product not found"
        });
    }

    res.status(200).json({
        success: true,
        product
    });

});
// ========================================
// GET PRODUCTS BY CATEGORY
// ========================================
const getProductsByCategory = asyncHandler(async (req, res) => {

    const products = await Product.find({
        category: req.params.id,
        isDeleted: false,
        isPublished: true
    });

    res.status(200).json({
        success: true,
        products
    });
});


// ========================================
// GET PRODUCTS BY SELLER
// ========================================
const getProductsBySeller = asyncHandler(async (req, res) => {

    const products = await Product.find({
        seller: req.params.id,
        isDeleted: false,
        isPublished: true
    });

    res.status(200).json({
        success: true,
        products
    });
});


// ========================================
// ADD NEW PRODUCT
// ========================================
const AddNewProduct = asyncHandler(async (req, res) => {
    
    // 1️⃣ تحويل حقل specifications من نص JSON إلى مصفوفة فعليّة قبل الـ Validation
    if (req.body.specifications && typeof req.body.specifications === "string") {
        try {
            req.body.specifications = JSON.parse(req.body.specifications);
        } catch (error) {
            return res.status(400).json({
                success: false,
                errors: ["Invalid format for specifications. Must be a valid JSON array."]
            });
        }
    }

    // 2️⃣ تحويل حقل tags إذا كان مرسلاً كنص مفصول بفاصلة (من الفرونت-إند) إلى مصفوفة
    if (req.body.tags && typeof req.body.tags === "string") {
        req.body.tags = req.body.tags.split(",").map(tag => tag.trim());
    }

    // 3️⃣ التحقق من صحة البيانات باستخدام Joi
    const { error } = validateCreateProduct(req.body);

    if (error) {
        return res.status(400).json({
            success: false,
            errors: error.details.map(err => err.message)
        });
    }

    // 4️⃣ تفكيك البيانات (تأكد من سحب الحقول الجديدة هنا)
    const {
        title,
        description,
        category,
        brand,
        price,
        comparePrice,
        stock,
        sku,
        isPublished,
        specifications, // تم فكّها هنا لإنزالها بالـ create
        tags           // تم فكّها هنا لإنزالها بالـ create
    } = req.body;

    const categoryExists = await Category.findById(category);

    if (!categoryExists) {
        return res.status(404).json({
            success: false,
            message: "Category not found"
        });
    }

    // Check SKU uniqueness
    if (sku) {
        const skuExists = await Product.findOne({ sku });
        if (skuExists) {
            return res.status(400).json({
                success: false,
                message: "SKU already exists"
            });
        }
    }

    // Upload images
    const images = [];

    if (req.files && req.files.length > 0) {
        const uploadedImages = await Promise.all(
            req.files.map(file => cloudUpload(file))
        );

        uploadedImages.forEach(img => {
            images.push({
                publicId: img.public_id,
                url: img.secure_url
            });
        });
    }

    // slug
    let slug = slugify(title, {
        lower: true,
        strict: true
    });

    const slugExists = await Product.findOne({ slug });

    if (slugExists) {
        slug = `${slug}-${Date.now()}`;
    }

    // 5️⃣ إنشاء المنتج مع الحقول الجديدة
    const product = await Product.create({
        seller: req.user.id,
        title,
        slug,
        description,
        category,
        brand,
        price,
        comparePrice,
        stock,
        sku,
        isPublished,
        images,
        specifications: specifications || [], // حفظ المواصفات في الداتابيز
        tags: tags || []                      // حفظ الـ tags في الداتابيز
    });

    res.status(201).json({
        success: true,
        message: "Product created successfully",
        product
    });
});

// ========================================
// UPDATE PRODUCT
// ========================================
const updateProduct = asyncHandler(async (req, res) => {

    const product = await Product.findById(req.params.id);

    if (!product || product.isDeleted) {
        return res.status(404).json({
            success: false,
            message: "Product not found"
        });
    }

    // only owner or admin/moderator
    if (product.seller.toString() !== req.user.id && req.user.role !== "admin" && req.user.role !== "moderator") {
        return res.status(403).json({
            success: false,
            message: "Not authorized"
        });
    }

    const allowedFields = [
        "title",
        "description",
        "category",
        "brand",
        "price",
        "comparePrice",
        "sku",
        "isPublished",
        "lowStockThreshold"
    ];

    const updatePayload = {};

    allowedFields.forEach((field) => {
        if (req.body[field] !== undefined) {
            updatePayload[field] = req.body[field];
        }
    });

    if (updatePayload.category) {
        const categoryExists = await Category.findById(updatePayload.category);
        if (!categoryExists) {
            return res.status(404).json({
                success: false,
                message: "Category not found"
            });
        }
    }

    if (updatePayload.sku) {
        const skuExists = await Product.findOne({
            sku: updatePayload.sku,
            _id: { $ne: product._id }
        });

        if (skuExists) {
            return res.status(400).json({
                success: false,
                message: "SKU already exists"
            });
        }
    }

    Object.assign(product, updatePayload);
    const updated = await product.save();

    res.status(200).json({
        success: true,
        message: "Product updated successfully",
        product: updated
    });
});


// ========================================
// DELETE PRODUCT (SOFT DELETE)
// ========================================
const deleteProduct = asyncHandler(async (req, res) => {

    const product = await Product.findById(req.params.id);

    if (!product || product.isDeleted) {
        return res.status(404).json({
            success: false,
            message: "Product not found"
        });
    }

    if (product.seller.toString() !== req.user.id && req.user.role !== "admin" && req.user.role !== "moderator") {
        return res.status(403).json({
            success: false,
            message: "Not authorized"
        });
    }

    product.isDeleted = true;
    product.deletedAt = new Date();
    await product.save();

    res.status(200).json({
        success: true,
        message: "Product deleted successfully"
    });
});


// ========================================
// TOGGLE PRODUCT PUBLISH
// ========================================
const togglePublishProduct = asyncHandler(async (req, res) => {

    const product = await Product.findById(req.params.id);

    if (!product || product.isDeleted) {
        return res.status(404).json({
            success: false,
            message: "Product not found"
        });
    }

    if (product.seller.toString() !== req.user.id && req.user.role !== "admin" && req.user.role !== "moderator") {
        return res.status(403).json({
            success: false,
            message: "Not authorized"
        });
    }

    product.isPublished = !product.isPublished;
    await product.save();

    res.status(200).json({
        success: true,
        isPublished: product.isPublished
    });
});


// ========================================
// GET SELLER PRODUCTS (OWN PRODUCTS)
// ========================================
const getMyProducts = asyncHandler(async (req, res) => {

    const products = await Product.find({
        seller: req.user.id
    });

    res.status(200).json({
        success: true,
        products
    });
});


// ========================================
// TOP SELLING PRODUCTS
// ========================================
const getTopSellingProducts = asyncHandler(async (req, res) => {

    const products = await Product.find()
        .sort({ sold: -1 })
        .limit(10);

    res.status(200).json({
        success: true,
        products
    });
});


// ========================================
// TOP RATED PRODUCTS
// ========================================
const getTopRatedProducts = asyncHandler(async (req, res) => {

    const products = await Product.find()
        .sort({ ratingAverage: -1 })
        .limit(10);

    res.status(200).json({
        success: true,
        products
    });
});


// ========================================
// BEST SELLERS HOMEPAGE SECTION
// ========================================
const getBestSellers = asyncHandler(async (req, res) => {
    const products = await Product.find({
        isBestSeller: true,
        isDeleted: false,
        isPublished: true
    })
    .sort({ salesCount: -1 })
    .limit(8)
    .lean();

    res.status(200).json({
        success: true,
        products
    });
});


// ========================================
// LATEST COLLECTIONS HOMEPAGE SECTION
// ========================================
const getLatestCollections = asyncHandler(async (req, res) => {
    const products = await Product.find({
        isDeleted: false,
        isPublished: true
    })
    .sort({ createdAt: -1 })
    .limit(8)
    .lean();

    res.status(200).json({
        success: true,
        products
    });
});


// ========================================
// EXPORT
// ========================================
const getSearchSuggestions = asyncHandler(async (req, res) => {
  const { q } = req.query;
  if (!q) {
    return res.status(200).json({ success: true, suggestions: [] });
  }

  const products = await Product.find({
    isDeleted: false,
    isPublished: true,
    $or: [
      { title: { $regex: q, $options: "i" } },
      { tags: { $regex: q, $options: "i" } }
    ]
  })
    .limit(8)
    .select("title tags");

  const suggestions = [];
  products.forEach(p => {
    if (p.title && !suggestions.includes(p.title)) {
      suggestions.push(p.title);
    }
    p.tags.forEach(t => {
      if (t.toLowerCase().includes(q.toLowerCase()) && !suggestions.includes(t)) {
        suggestions.push(t);
      }
    });
  });

  res.status(200).json({ success: true, suggestions: suggestions.slice(0, 10) });
});

const getTrendingSearches = asyncHandler(async (req, res) => {
  const trending = await SearchAnalytics.find()
    .sort({ count: -1 })
    .limit(10)
    .select("term count");
  res.status(200).json({ success: true, trending });
});

module.exports = {
    getProducts,
    getProductById,
    getProductsByCategory,
    getProductsBySeller,
    AddNewProduct,
    updateProduct,
    deleteProduct,
    togglePublishProduct,
    getMyProducts,
    getTopSellingProducts,
    getTopRatedProducts,
    getBestSellers,
    getLatestCollections,
    getSearchSuggestions,
    getTrendingSearches,
    getProductBySlug
};