const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
{
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true
    },

    order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Order",
        required: true,
        index: true
    },

    amount: {
        type: Number,
        required: true,
        min: 0
    },

    currency: {
        type: String,
        default: "EGP"
    },

    paymentMethod: {
        type: String,
        enum: ["cod", "card", "paypal", "fawry", "vodafone_cash", "paymob"],
        required: true
    },

    status: {
        type: String,
        enum: [
            "pending",
            "processing",
            "paid",
            "failed",
            "refunded"
        ],
        default: "pending",
        index: true
    },

    provider: {
        type: String,
        enum: ["stripe", "paypal", "paymob", "fawry", "vodafone_cash", "manual"],
        default: "manual"
    },

    providerReference: {
        type: String,
        trim: true,
        index: true,
        default: null
    },

    transactionId: {
        type: String,
        index: true
    },

    paymentResult: {
        id: String,
        status: String,
        email: String,
        updateTime: String
    },

    paidAt: {
        type: Date
    },

    failedAt: {
        type: Date
    },

    refundedAt: {
        type: Date
    },

    refundReason: {
        type: String,
        trim: true,
        maxlength: 500,
        default: ""
    },

    webhookEvents: {
        type: [
            {
                eventId: String,
                eventType: String,
                receivedAt: Date
            }
        ],
        default: []
    }
},
{
    timestamps: true
});

paymentSchema.index({ user: 1, createdAt: -1 });

const Payment = mongoose.model("Payment", paymentSchema);
module.exports = Payment;