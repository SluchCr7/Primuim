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
          { $inc: { count: 1 }, $set: { lastSearchedAt: new Date() } },
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
// ADVANCED SEARCH (dedicated search endpoint)
// ========================================
const getAdvancedSearch = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(48, Math.max(1, Number(req.query.limit) || 12));
  const skip = (page - 1) * limit;

  const q = (req.query.q || "").trim();
  const sort = req.query.sort || "relevance";

  // ── Base filter ──────────────────────────────────────────
  const baseFilter = { isDeleted: false, isPublished: true };

  // ── Category filter ──────────────────────────────────────
  if (req.query.category) {
    const subcats = await Category.find({ parent: req.query.category }).select("_id");
    const catIds = [req.query.category, ...subcats.map(c => c._id)];
    baseFilter.category = { $in: catIds };
  }

  // ── Brand filter (supports comma-separated multi-brand) ──
  if (req.query.brand) {
    const brands = req.query.brand.split(",").map(b => b.trim()).filter(Boolean);
    baseFilter.brand = brands.length === 1 ? brands[0] : { $in: brands };
  }

  // ── Price filter ─────────────────────────────────────────
  if (req.query.minPrice || req.query.maxPrice) {
    baseFilter.price = {};
    if (req.query.minPrice) baseFilter.price.$gte = Number(req.query.minPrice);
    if (req.query.maxPrice) baseFilter.price.$lte = Number(req.query.maxPrice);
  }

  // ── Tags filter ──────────────────────────────────────────
  if (req.query.tags) {
    const tagsArr = req.query.tags.split(",").map(t => t.trim()).filter(Boolean);
    if (tagsArr.length > 0) baseFilter.tags = { $in: tagsArr };
  }

  // ── Rating filter ────────────────────────────────────────
  if (req.query.rating) {
    baseFilter.ratingAverage = { $gte: Number(req.query.rating) };
  }

  // ── In Stock filter ──────────────────────────────────────
  if (req.query.inStock === "true") {
    baseFilter.stock = { $gt: 0 };
  }

  // ── Text search / sorting ────────────────────────────────
  let searchFilter = { ...baseFilter };
  let sortObj = { createdAt: -1 };
  let projection = {};

  if (q.length >= 2) {
    // Use text index for relevance scoring
    searchFilter.$text = { $search: q };
    projection = { score: { $meta: "textScore" } };

    if (sort === "relevance") {
      sortObj = { score: { $meta: "textScore" }, sold: -1 };
    }

    // Async analytics — don't await to keep response fast
    SearchAnalytics.findOneAndUpdate(
      { term: q.toLowerCase() },
      { $inc: { count: 1 }, $set: { lastSearchedAt: new Date() } },
      { upsert: true, new: true }
    ).catch(err => console.error("Search analytics error:", err));

  } else if (q.length === 1) {
    // Single character — regex only (text index requires >= 2 chars typically)
    searchFilter.$or = [
      { title: { $regex: q, $options: "i" } },
      { brand: { $regex: q, $options: "i" } },
      { tags: { $regex: q, $options: "i" } }
    ];
  }

  // Apply non-relevance sort
  if (sort !== "relevance") {
    switch (sort) {
      case "price-asc":    sortObj = { price: 1 };           break;
      case "price-desc":   sortObj = { price: -1 };          break;
      case "rating":       sortObj = { ratingAverage: -1 };  break;
      case "popular":      sortObj = { sold: -1 };           break;
      case "newest":
      default:             sortObj = { createdAt: -1 };      break;
    }
  }

  // ── Run search + facets in parallel ──────────────────────
  const [totalProducts, products, facetResults] = await Promise.all([
    Product.countDocuments(searchFilter),

    Product.find(searchFilter, projection)
      .populate("category", "name slug")
      .populate("seller", "username")
      .sort(sortObj)
      .skip(skip)
      .limit(limit)
      .lean(),

    // Single aggregation for all facets
    Product.aggregate([
      { $match: baseFilter }, // Facets based on base (no text filter for counts)
      {
        $facet: {
          brands: [
            { $group: { _id: "$brand", count: { $sum: 1 } } },
            { $match: { _id: { $ne: null } } },
            { $sort: { count: -1 } },
            { $limit: 20 }
          ],
          categories: [
            { $group: { _id: "$category", count: { $sum: 1 } } },
            {
              $lookup: {
                from: "categories",
                localField: "_id",
                foreignField: "_id",
                as: "cat"
              }
            },
            { $unwind: { path: "$cat", preserveNullAndEmpty: false } },
            { $project: { _id: 1, name: "$cat.name", slug: "$cat.slug", count: 1 } },
            { $sort: { count: -1 } }
          ],
          tags: [
            { $unwind: "$tags" },
            { $group: { _id: "$tags", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 30 }
          ],
          priceRange: [
            {
              $group: {
                _id: null,
                min: { $min: "$price" },
                max: { $max: "$price" }
              }
            }
          ],
          ratings: [
            {
              $group: {
                _id: { $floor: "$ratingAverage" },
                count: { $sum: 1 }
              }
            },
            { $sort: { _id: -1 } }
          ]
        }
      }
    ])
  ]);

  const facet = facetResults[0] || {};

  res.status(200).json({
    success: true,
    query: q,
    page,
    limit,
    totalProducts,
    totalPages: Math.ceil(totalProducts / limit),
    hasNextPage: page < Math.ceil(totalProducts / limit),
    hasPrevPage: page > 1,
    products,
    facets: {
      brands: facet.brands || [],
      categories: facet.categories || [],
      tags: facet.tags || [],
      priceRange: facet.priceRange?.[0] || { min: 0, max: 10000 },
      ratings: facet.ratings || []
    }
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
    
    // 1️⃣ Parse specifications (JSON string from FormData)
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

    // 2️⃣ Parse attributes (JSON string from FormData)
    // Expected shape: [{ name: "Color", values: ["Red","Black"] }, ...]
    if (req.body.attributes && typeof req.body.attributes === "string") {
        try {
            req.body.attributes = JSON.parse(req.body.attributes);
        } catch (error) {
            return res.status(400).json({
                success: false,
                errors: ["Invalid format for attributes. Must be a valid JSON array."]
            });
        }
    }

    // 3️⃣ Parse variants (JSON string from FormData)
    // Expected shape: [{ sku, price, stock, combination: { Color: "Red", Size: "M" } }, ...]
    if (req.body.variants && typeof req.body.variants === "string") {
        try {
            req.body.variants = JSON.parse(req.body.variants);
        } catch (error) {
            return res.status(400).json({
                success: false,
                errors: ["Invalid format for variants. Must be a valid JSON array."]
            });
        }
    }

    // 4️⃣ Parse tags (comma-separated string from FormData)
    if (req.body.tags && typeof req.body.tags === "string") {
        req.body.tags = req.body.tags.split(",").map(tag => tag.trim()).filter(Boolean);
    }

    // 3️⃣ التحقق من صحة البيانات باستخدام Joi
    const { error } = validateCreateProduct(req.body);

    if (error) {
        return res.status(400).json({
            success: false,
            errors: error.details.map(err => err.message)
        });
    }

    // 5️⃣ Destructure all fields including new attributes & variants
    const {
        title,
        description,
        category,
        subcategory,
        brand,
        price,
        comparePrice,
        stock,
        sku,
        isPublished,
        specifications,
        attributes,
        variants,
        tags
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

    // 6️⃣ Create product with all fields including dynamic attributes & variants
    const product = await Product.create({
        seller: req.user.id,
        title,
        slug,
        description,
        category,
        subcategory: subcategory || null,
        brand,
        price,
        comparePrice,
        stock: (variants && variants.length > 0)
            // If variants are provided, aggregate total stock from them
            ? variants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0)
            : (stock || 0),
        sku,
        isPublished,
        images,
        specifications: specifications || [],
        attributes: attributes || [],
        variants: variants || [],
        tags: tags || []
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
        "subcategory",
        "brand",
        "price",
        "comparePrice",
        "stock",
        "sku",
        "isPublished",
        "lowStockThreshold",
        "specifications",
        "attributes",
        "variants",
        "tags",
        "metaTitle",
        "metaDescription",
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
// GET SEARCH SUGGESTIONS (enriched with image + price)
// ========================================
const getSearchSuggestions = asyncHandler(async (req, res) => {
  const { q } = req.query;
  if (!q || q.trim().length < 1) {
    return res.status(200).json({ success: true, suggestions: [] });
  }

  const searchTerm = q.trim();

  // Get product suggestions with enriched data
  const products = await Product.find({
    isDeleted: false,
    isPublished: true,
    $or: [
      { title: { $regex: searchTerm, $options: "i" } },
      { tags: { $regex: searchTerm, $options: "i" } },
      { brand: { $regex: searchTerm, $options: "i" } }
    ]
  })
    .limit(6)
    .select("title tags brand images price comparePrice ratingAverage slug _id")
    .lean();

  // Build structured suggestions
  const productSuggestions = products.map(p => ({
    type: "product",
    id: p._id,
    title: p.title,
    brand: p.brand || null,
    price: p.price,
    comparePrice: p.comparePrice || null,
    rating: p.ratingAverage || 0,
    image: p.images?.[0]?.url || null,
    slug: p.slug,
    url: `/product/${p.slug}`
  }));

  // Also extract matching tags as keyword suggestions
  const tagSet = new Set();
  products.forEach(p => {
    (p.tags || []).forEach(tag => {
      if (tag.toLowerCase().includes(searchTerm.toLowerCase()) && tagSet.size < 4) {
        tagSet.add(tag);
      }
    });
  });

  const keywordSuggestions = [...tagSet].map(tag => ({
    type: "keyword",
    title: tag,
    url: `/search?q=${encodeURIComponent(tag)}`
  }));

  res.status(200).json({
    success: true,
    suggestions: {
      products: productSuggestions,
      keywords: keywordSuggestions
    }
  });
});


// ========================================
// GET TRENDING SEARCHES
// ========================================
const getTrendingSearches = asyncHandler(async (req, res) => {
  const trending = await SearchAnalytics.find()
    .sort({ count: -1, lastSearchedAt: -1 })
    .limit(10)
    .select("term count lastSearchedAt");
  res.status(200).json({ success: true, trending });
});


// ========================================
// EXPORT
// ========================================
module.exports = {
    getProducts,
    getAdvancedSearch,
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