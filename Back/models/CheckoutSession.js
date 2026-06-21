const mongoose = require("mongoose");

const checkoutSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    sessionId: {
      type: String,
      required: true,
    },
    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
        },
        title: String,
        price: Number,
        quantity: Number,
      },
    ],
    subtotal: {
      type: Number,
      default: 0,
    },
    shippingAddress: {
      fullName: String,
      phone: String,
      country: String,
      city: String,
      street: String,
      postalCode: String,
    },
    shippingMethod: String,
    shippingCost: {
      type: Number,
      default: 0,
    },
    taxCost: {
      type: Number,
      default: 0,
    },
    paymentMethod: String,
    couponCode: String,
    discountAmount: {
      type: Number,
      default: 0,
    },
    total: {
      type: Number,
      default: 0,
    },
    step: {
      type: String,
      enum: ["shipping", "payment", "confirm"],
      default: "shipping",
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 60 * 60 * 1000), // expires in 1 hour
      index: { expires: 0 },
    },
  },
  { timestamps: true }
);

const CheckoutSession = mongoose.model("CheckoutSession", checkoutSessionSchema);
module.exports = CheckoutSession;
