const mongoose = require("mongoose");

/**
 * Order Item (Snapshot Pattern)
 */
const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    title: {
      type: String,
      required: true,
    },

    image: {
      type: String,
    },

    price: {
      type: Number,
      required: true,
    },

    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    sku: {
      type: String,
      default: "",
      trim: true,
      uppercase: true,
    },
    variantSku: {
      type: String,
      default: null,
      trim: true,
      uppercase: true,
    },
    inventorySource: {
      type: String,
      enum: ["seller-managed", "warehouse-managed"],
      default: "seller-managed",
    },
    inventory: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "orderItems.inventoryModel",
      default: null,
    },
    inventoryModel: {
      type: String,
      enum: ["SellerInventory", "WarehouseInventory"],
      default: "SellerInventory",
    },
    reservationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StockReservation",
      default: null,
    },
    cancelledQuantity: {
      type: Number,
      default: 0,
      min: 0,
    },
    inventoryAllocations: {
      type: [
        {
          warehouse: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Warehouse",
            required: true,
          },
          inventory: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "WarehouseInventory",
            default: null,
          },
          sku: {
            type: String,
            required: true,
          },
          quantity: {
            type: Number,
            required: true,
            min: 1,
          },
          returnedQuantity: {
            type: Number,
            default: 0,
            min: 0,
          },
          cancelledQuantity: {
            type: Number,
            default: 0,
            min: 0,
          },
        },
      ],
      default: [],
    },
    returnedQuantity: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { _id: false }
);

/**
 * Shipping Address Snapshot
 */
const shippingAddressSchema = new mongoose.Schema(
  {
    fullName: String,
    phone: String,
    country: String,
    city: String,
    street: String,
    postalCode: String,
  },
  { _id: false }
);

/**
 * Payment Result (for online payments)
 */
const paymentResultSchema = new mongoose.Schema(
  {
    provider: {
      type: String, // stripe, paymob, paypal
    },

    transactionId: String,
    status: String,
    email: String,
  },
  { _id: false }
);

/**
 * ORDER MODEL
 */
const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    checkoutGroupId: {
      type: mongoose.Schema.Types.ObjectId,
      index: true,
    },
    checkoutSessionId: {
      type: String,
      index: true,
    },

    orderItems: {
      type: [orderItemSchema],
      required: true,
    },

    shippingAddress: {
      type: shippingAddressSchema,
      required: true,
    },

    paymentMethod: {
      type: String,
      enum: ["cod", "card", "paypal"],
      required: true,
    },

    paymentResult: paymentResultSchema,

    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
    },

    orderStatus: {
      type: String,
      enum: [
        "pending",
        "processing",
        "confirmed",
        "shipped",
        "delivered",
        "partially_cancelled",
        "cancelled",
      ],
      default: "pending",
    },

    itemsPrice: {
      type: Number,
      required: true,
      default: 0,
    },

    shippingPrice: {
      type: Number,
      default: 0,
    },

    taxPrice: {
      type: Number,
      default: 0,
    },

    discountPrice: {
      type: Number,
      default: 0,
    },

    totalPrice: {
      type: Number,
      required: true,
    },

    isPaid: {
      type: Boolean,
      default: false,
    },

    paidAt: Date,

    isDelivered: {
      type: Boolean,
      default: false,
    },

    deliveredAt: Date,

    returnStatus: {
      type: String,
      enum: ["none", "partial", "returned"],
      default: "none",
    },

    note: {
      type: String,
      maxlength: 500,
    },
  },
  {
    timestamps: true,
  }
);

/**
 * INDEXES
 */
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ orderStatus: 1 });

const Order = mongoose.model("Order", orderSchema);

module.exports = Order;