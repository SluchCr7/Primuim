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
    }
  },
  {
    timestamps: true
  }
);

const SystemSettings = mongoose.model("SystemSettings", systemSettingsSchema);
module.exports = SystemSettings;
