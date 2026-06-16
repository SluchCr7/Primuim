const mongoose = require("mongoose");

const searchAnalyticsSchema = new mongoose.Schema(
  {
    term: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    count: {
      type: Number,
      default: 1,
    },
  },
  {
    timestamps: true,
  }
);

const SearchAnalytics = mongoose.model("SearchAnalytics", searchAnalyticsSchema);

module.exports = SearchAnalytics;
