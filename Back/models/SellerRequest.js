const mongoose = require("mongoose");

const sellerRequestSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true
    },
    storeName: {
      type: String,
      required: true,
      trim: true
    },
    storeDescription: {
      type: String,
      required: true,
      trim: true
    },
    storePhone: {
      type: String,
      required: true,
      trim: true
    },
    storeAddress: {
      type: String,
      required: true,
      trim: true
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true
    },
    adminNotes: {
      type: String,
      default: ""
    }
  },
  {
    timestamps: true
  }
);

const SellerRequest = mongoose.model("SellerRequest", sellerRequestSchema);
module.exports = SellerRequest;
