const mongoose = require("mongoose");

const analyticsEventSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    sessionId: {
      type: String,
      required: true,
      index: true,
    },
    eventType: {
      type: String,
      enum: [
        "page_view",
        "product_view",
        "add_to_cart",
        "checkout_shipping",
        "checkout_payment",
        "checkout_confirm",
        "purchase",
        "search",
      ],
      required: true,
      index: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false }, // only track when the event occurred
  }
);

analyticsEventSchema.index({ eventType: 1, createdAt: -1 });

const AnalyticsEvent = mongoose.model("AnalyticsEvent", analyticsEventSchema);

module.exports = AnalyticsEvent;
