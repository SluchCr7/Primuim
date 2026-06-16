const express = require("express");
const router = express.Router();

const {
  getMe,
  updateProfile,
  updatePassword,
  uploadProfilePhoto,
  deleteProfilePhoto,
  toggleWishlist,
  getWishlist,
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
  followSeller,
  getSharedWishlist
} = require("../Controllers/UserController");
const { verifyToken } = require("../Middelwares/verifyToken");
const photoUpload = require("../Middelwares/UploadPhoto");

router.get("/me", verifyToken, getMe);
router.put("/profile", verifyToken, updateProfile);
router.put("/password", verifyToken, updatePassword);
router.patch("/profile-photo", verifyToken, photoUpload.single("image"), uploadProfilePhoto);
router.delete("/profile-photo", verifyToken, deleteProfilePhoto);
router.post("/wishlist/:id", verifyToken, toggleWishlist);
router.get("/wishlist", verifyToken, getWishlist);
router.post("/follow/:sellerId", verifyToken, followSeller);
router.get("/wishlist/share/:userId", getSharedWishlist);

// Address Routes
router.get("/addresses", verifyToken, getAddresses);
router.post("/addresses", verifyToken, addAddress);
router.put("/addresses/:addressId", verifyToken, updateAddress);
router.delete("/addresses/:addressId", verifyToken, deleteAddress);
router.patch("/addresses/:addressId/default", verifyToken, setDefaultAddress);

module.exports = router;