const mongoose = require("mongoose");

const systemSettingsSchema = new mongoose.Schema(
  {
    maintenanceMode: {
      type: Boolean,
      default: false
    },
    commissionRate: {
      type: Number,
      default: 10, // 10% platform fee
      min: 0,
      max: 100
    },
    storeCurrency: {
      type: String,
      default: "EGP"
    },
    allowSellerSelfRegistration: {
      type: Boolean,
      default: true
    },
    announcementBanner: {
      type: String,
      default: "Welcome to our Luxury Boutique! Free shipping on orders over 1000 EGP."
    },
    taxRate: {
      type: Number,
      default: 14 // 14% VAT
    },
    shippingFee: {
      type: Number,
      default: 50 // Standard shipping fee
    }
  },
  {
    timestamps: true
  }
);

const SystemSettings = mongoose.model("SystemSettings", systemSettingsSchema);
module.exports = SystemSettings;
