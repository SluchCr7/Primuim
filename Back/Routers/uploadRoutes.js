const express = require("express");
const router = express.Router();
const { uploadImage } = require("../Controllers/UploadController");
const photoUpload = require("../Middelwares/UploadPhoto");

// Public image upload — returns Cloudinary URL
// Used for seller registration before an account exists
router.post("/image", photoUpload.single("image"), uploadImage);

module.exports = router;
