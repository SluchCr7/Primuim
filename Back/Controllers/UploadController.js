const asyncHandler = require("express-async-handler");
const { cloudUpload } = require("../config/cloudUplaod");

// ========================================
// UPLOAD A SINGLE IMAGE (Public — used for registration)
// ========================================
const uploadImage = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: "No image file provided"
    });
  }

  const uploaded = await cloudUpload(req.file);

  res.status(200).json({
    success: true,
    url: uploaded.secure_url,
    publicId: uploaded.public_id
  });
});

module.exports = { uploadImage };
