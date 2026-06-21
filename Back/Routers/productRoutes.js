const express = require("express");
const router = express.Router();

const {
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
} = require("../Controllers/ProductController");
const { verifyToken, verifySeller } = require("../Middelwares/verifyToken");
const photoUpload = require("../Middelwares/UploadPhoto");

router.get("/", getProducts);
router.get("/top-selling", getTopSellingProducts);
router.get("/top-rated", getTopRatedProducts);
router.get("/mine", verifySeller, getMyProducts);
router.get("/best-sellers", getBestSellers);
router.get("/latest", getLatestCollections);
router.get("/search/suggest", getSearchSuggestions);
router.get("/search/trending", getTrendingSearches);
router.get("/category/:id", getProductsByCategory);
router.get("/seller/:id", getProductsBySeller);
router.get("/:id", getProductById);
router.post("/", verifySeller, photoUpload.array("images", 5), AddNewProduct);
router.put("/:id", verifySeller, updateProduct);
router.patch("/:id/publish", verifySeller, togglePublishProduct);
router.delete("/:id", verifySeller, deleteProduct);
router.get("/slug/:slug", getProductBySlug);

module.exports = router;