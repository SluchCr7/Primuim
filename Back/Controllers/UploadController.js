const asyncHandler = require("express-async-handler");
const { cloudUpload } = require("../config/cloudUplaod");
const MediaAsset = require("../models/MediaAsset");

// ========================================
// UPLOAD A SINGLE IMAGE (Public & Admin Media Library)
// ========================================
const uploadImage = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: "No image file provided"
    });
  }

  const uploaded = await cloudUpload(req.file);

  // Parse size to human readable format
  const sizeKb = req.file.size ? `${Math.round(req.file.size / 1024)} KB` : "Unknown";

  const asset = await MediaAsset.create({
    name: req.file.originalname || "image_upload.jpg",
    url: uploaded.secure_url,
    publicId: uploaded.public_id,
    size: sizeKb,
    uploadedBy: req.user ? req.user.id : null
  });

  res.status(200).json({
    success: true,
    url: uploaded.secure_url,
    publicId: uploaded.public_id,
    asset
  });
});

// ========================================
// GET ALL MEDIA ASSETS (Admin only)
// ========================================
const getMediaAssets = asyncHandler(async (req, res) => {
  const assets = await MediaAsset.find().sort({ createdAt: -1 });
  res.status(200).json({
    success: true,
    assets
  });
});

// ========================================
// DELETE MEDIA ASSET (Admin only)
// ========================================
const deleteMediaAsset = asyncHandler(async (req, res) => {
  const asset = await MediaAsset.findById(req.params.id);
  if (!asset) {
    return res.status(404).json({ success: false, message: "Asset not found" });
  }

  await MediaAsset.findByIdAndDelete(req.params.id);
  res.status(200).json({
    success: true,
    message: "Media asset deleted successfully"
  });
});

module.exports = { uploadImage, getMediaAssets, deleteMediaAsset };
