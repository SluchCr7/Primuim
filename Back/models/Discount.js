const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema(
{
    code: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        trim: true,
        minlength: 3,
        maxlength: 20,
        index: true
    },

    type: {
        type: String,
        required: true,
        enum: ["percentage", "fixed"]
    },

    value: {
        type: Number,
        required: true,
        min: 0
    },

    minOrderAmount: {
        type: Number,
        default: 0,
        min: 0
    },

    maxDiscount: {
        type: Number,
        default: null
    },

    startDate: {
        type: Date,
        required: true
    },

    endDate: {
        type: Date,
        required: true
    },

    usageLimit: {
        type: Number,
        default: null
    },

    usedCount: {
        type: Number,
        default: 0
    },

    isActive: {
        type: Boolean,
        default: true
    },

    applicableProducts: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product"
        }
    ],

    applicableCategories: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Category"
        }
    ]
},
{
    timestamps: true
});

const Coupon = mongoose.model("Coupon", couponSchema);

module.exports = {  
    Coupon,
    Discount: Coupon
};
