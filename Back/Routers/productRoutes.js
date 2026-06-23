const express = require("express");
const router = express.Router();

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
  getProductBySlug
} = require("../Controllers/ProductController");
const { verifyToken, verifySeller } = require("../Middelwares/verifyToken");
const photoUpload = require("../Middelwares/UploadPhoto");

// ── Specific named routes (must be before /:id wildcard) ──
router.get("/", getProducts);
router.get("/top-selling", getTopSellingProducts);
router.get("/top-rated", getTopRatedProducts);
router.get("/mine", verifySeller, getMyProducts);
router.get("/best-sellers", getBestSellers);
router.get("/latest", getLatestCollections);

// ── Search routes ─────────────────────────────────────────
router.get("/search", getAdvancedSearch);
router.get("/search/suggest", getSearchSuggestions);
router.get("/search/trending", getTrendingSearches);

// ── Category / Seller routes ──────────────────────────────
router.get("/category/:id", getProductsByCategory);
router.get("/seller/:id", getProductsBySeller);
router.get("/slug/:slug", getProductBySlug);

// ── CRUD ──────────────────────────────────────────────────
router.get("/:id", getProductById);
router.post("/", verifySeller, photoUpload.array("images", 5), AddNewProduct);
router.put("/:id", verifySeller, updateProduct);
router.patch("/:id/publish", verifySeller, togglePublishProduct);
router.delete("/:id", verifySeller, deleteProduct);

module.exports = router;