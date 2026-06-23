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
    lastSearchedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for trending (count desc) and recency
searchAnalyticsSchema.index({ count: -1, lastSearchedAt: -1 });

const SearchAnalytics = mongoose.model("SearchAnalytics", searchAnalyticsSchema);

module.exports = SearchAnalytics;
