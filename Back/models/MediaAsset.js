const mongoose = require("mongoose");

const mediaAssetSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },
    url: {
      type: String,
      required: true
    },
    publicId: {
      type: String
    },
    size: {
      type: String,
      default: "Unknown"
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  },
  {
    timestamps: true
  }
);

const MediaAsset = mongoose.model("MediaAsset", mediaAssetSchema);
module.exports = MediaAsset;
