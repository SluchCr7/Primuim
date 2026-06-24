const express    = require("express");
const router     = express.Router();

const {
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
  getProductBySlug,
} = require("../Controllers/ProductController");
const { verifyToken, verifySeller } = require("../Middelwares/verifyToken");
const photoUpload = require("../Middelwares/UploadPhoto");

/**
 * @swagger
 * tags:
 *   name: Products
 *   description: Full product catalog — CRUD, search, suggestions, top-lists
 */

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Get paginated list of published products with optional filters
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 12 }
 *       - in: query
 *         name: sort
 *         schema: { type: string, enum: [newest, price-asc, price-desc, rating, sold], default: newest }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Full-text search query
 *       - in: query
 *         name: minPrice
 *         schema: { type: number }
 *       - in: query
 *         name: maxPrice
 *         schema: { type: number }
 *       - in: query
 *         name: category
 *         schema: { type: string }
 *         description: Category ObjectId to filter by
 *       - in: query
 *         name: isDigital
 *         schema: { type: boolean }
 *       - in: query
 *         name: isBundle
 *         schema: { type: boolean }
 *     responses:
 *       200:
 *         description: Products returned with pagination metadata.
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/PaginationMeta'
 *                 - type: object
 *                   properties:
 *                     products:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Product'
 */
router.get("/", getProducts);

/**
 * @swagger
 * /api/products/top-selling:
 *   get:
 *     summary: Get top-selling products (by units sold)
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *     responses:
 *       200:
 *         description: Top-selling products list.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:  { type: boolean, example: true }
 *                 products: { type: array, items: { $ref: '#/components/schemas/Product' } }
 */
router.get("/top-selling", getTopSellingProducts);

/**
 * @swagger
 * /api/products/top-rated:
 *   get:
 *     summary: Get highest-rated products
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *     responses:
 *       200:
 *         description: Top-rated products list.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:  { type: boolean, example: true }
 *                 products: { type: array, items: { $ref: '#/components/schemas/Product' } }
 */
router.get("/top-rated", getTopRatedProducts);

/**
 * @swagger
 * /api/products/mine:
 *   get:
 *     summary: Get all products belonging to the authenticated seller
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 12 }
 *     responses:
 *       200:
 *         description: Seller's own product listing.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:  { type: boolean, example: true }
 *                 products: { type: array, items: { $ref: '#/components/schemas/Product' } }
 *       403:
 *         description: Seller role required.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/mine", verifySeller, getMyProducts);

/**
 * @swagger
 * /api/products/best-sellers:
 *   get:
 *     summary: Get products flagged as best sellers
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 8 }
 *     responses:
 *       200:
 *         description: Best-seller products.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:  { type: boolean, example: true }
 *                 products: { type: array, items: { $ref: '#/components/schemas/Product' } }
 */
router.get("/best-sellers", getBestSellers);

/**
 * @swagger
 * /api/products/latest:
 *   get:
 *     summary: Get the most recently added products (New Arrivals)
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 8 }
 *     responses:
 *       200:
 *         description: Latest products.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:  { type: boolean, example: true }
 *                 products: { type: array, items: { $ref: '#/components/schemas/Product' } }
 */
router.get("/latest", getLatestCollections);

/**
 * @swagger
 * /api/products/search:
 *   get:
 *     summary: Advanced product search with full filter support
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema: { type: string }
 *         description: Search keywords
 *       - in: query
 *         name: category
 *         schema: { type: string }
 *       - in: query
 *         name: minPrice
 *         schema: { type: number }
 *       - in: query
 *         name: maxPrice
 *         schema: { type: number }
 *       - in: query
 *         name: sort
 *         schema: { type: string, enum: [newest, price-asc, price-desc, rating, sold] }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 12 }
 *     responses:
 *       200:
 *         description: Search results with pagination.
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/PaginationMeta'
 *                 - type: object
 *                   properties:
 *                     products:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Product'
 */
router.get("/search", getAdvancedSearch);

/**
 * @swagger
 * /api/products/search/suggest:
 *   get:
 *     summary: Get autocomplete suggestions for the search bar
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema: { type: string }
 *         description: Partial search term (min 2 characters)
 *     responses:
 *       200:
 *         description: Suggestion strings returned.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:     { type: boolean, example: true }
 *                 suggestions: { type: array, items: { type: string }, example: ['leather bag', 'leather jacket'] }
 */
router.get("/search/suggest", getSearchSuggestions);

/**
 * @swagger
 * /api/products/search/trending:
 *   get:
 *     summary: Get currently trending search queries
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: Trending search terms.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:  { type: boolean, example: true }
 *                 trending: { type: array, items: { type: string }, example: ['Valentino', 'silk scarf'] }
 */
router.get("/search/trending", getTrendingSearches);

/**
 * @swagger
 * /api/products/category/{id}:
 *   get:
 *     summary: Get products filtered by category ObjectId
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: Category ObjectId
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 8 }
 *       - in: query
 *         name: sort
 *         schema: { type: string, enum: [newest, price-asc, price-desc, rating, sold] }
 *     responses:
 *       200:
 *         description: Products in the specified category.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:  { type: boolean, example: true }
 *                 products: { type: array, items: { $ref: '#/components/schemas/Product' } }
 */
router.get("/category/:id", getProductsByCategory);

/**
 * @swagger
 * /api/products/seller/{id}:
 *   get:
 *     summary: Get all products published by a specific seller
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: Seller ObjectId
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 12 }
 *     responses:
 *       200:
 *         description: Seller's products.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:  { type: boolean, example: true }
 *                 products: { type: array, items: { $ref: '#/components/schemas/Product' } }
 */
router.get("/seller/:id", getProductsBySeller);

/**
 * @swagger
 * /api/products/slug/{slug}:
 *   get:
 *     summary: Get a product by its SEO-friendly slug
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema: { type: string }
 *         example: luxury-leather-handbag
 *     responses:
 *       200:
 *         description: Product returned.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 product: { $ref: '#/components/schemas/Product' }
 *       404:
 *         description: Product not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/slug/:slug", getProductBySlug);

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Get a single product by ObjectId
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Product returned.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 product: { $ref: '#/components/schemas/Product' }
 *       404:
 *         description: Product not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/:id", getProductById);

/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Create a new product (seller only, supports up to 5 images)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             allOf:
 *               - $ref: '#/components/schemas/ProductInput'
 *               - type: object
 *                 properties:
 *                   images:
 *                     type: array
 *                     items:
 *                       type: string
 *                       format: binary
 *                     maxItems: 5
 *     responses:
 *       201:
 *         description: Product created.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 product: { $ref: '#/components/schemas/Product' }
 *       403:
 *         description: Seller role required.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/", verifySeller, photoUpload.array("images", 5), AddNewProduct);

/**
 * @swagger
 * /api/products/{id}:
 *   put:
 *     summary: Update an existing product (owner seller only)
 *     tags: [Products]
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
 *             $ref: '#/components/schemas/ProductInput'
 *     responses:
 *       200:
 *         description: Product updated.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 product: { $ref: '#/components/schemas/Product' }
 *       403:
 *         description: Not the product owner.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Product not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.put("/:id", verifySeller, updateProduct);

/**
 * @swagger
 * /api/products/{id}/publish:
 *   patch:
 *     summary: Toggle a product's published/draft status
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Publish status toggled.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 */
router.patch("/:id/publish", verifySeller, togglePublishProduct);

/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     summary: Permanently delete a product (owner seller only)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Product deleted.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       404:
 *         description: Product not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.delete("/:id", verifySeller, deleteProduct);

module.exports = router;