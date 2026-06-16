const { Discount } = require("../models/Discount");
const asyncHandler = require("express-async-handler");


// ========================================
// GET ALL COUPONS
// ========================================
const getAllCoupons = asyncHandler(async (req, res) => {

    const coupons = await Discount.find()
        .sort({ createdAt: -1 });

    res.status(200).json({
        success: true,
        coupons
    });
});


// ========================================
// CREATE COUPON
// ========================================
const createCoupon = asyncHandler(async (req, res) => {

    const {
        code,
        type,
        value,
        startDate,
        endDate,
        usageLimit
    } = req.body;

    // check duplicate code
    const exists = await Discount.findOne({ code });

    if (exists) {
        return res.status(400).json({
            success: false,
            message: "Coupon code already exists"
        });
    }

    const coupon = await Discount.create({
        code,
        type,
        value,
        startDate,
        endDate,
        usageLimit,
        usedCount: 0,
        isActive: true
    });

    res.status(201).json({
        success: true,
        coupon
    });
});


// ========================================
// DELETE COUPON
// ========================================
const deleteCoupon = asyncHandler(async (req, res) => {

    const coupon = await Discount.findById(req.params.id);

    if (!coupon) {
        return res.status(404).json({
            success: false,
            message: "Coupon not found"
        });
    }

    await coupon.deleteOne();

    res.status(200).json({
        success: true,
        message: "Coupon deleted successfully"
    });
});


// ========================================
// VALIDATE COUPON (IMPORTANT LOGIC)
// ========================================
const validateCoupon = asyncHandler(async (req, res) => {

    const { code } = req.body;

    const coupon = await Discount.findOne({
        code,
        isActive: true
    });

    if (!coupon) {
        return res.status(404).json({
            success: false,
            message: "Invalid coupon"
        });
    }

    const now = new Date();

    if (now < coupon.startDate || now > coupon.endDate) {
        return res.status(400).json({
            success: false,
            message: "Coupon expired or not yet active"
        });
    }

    if (
        coupon.usageLimit > 0 &&
        coupon.usedCount >= coupon.usageLimit
    ) {
        return res.status(400).json({
            success: false,
            message: "Coupon usage limit reached"
        });
    }

    res.status(200).json({
        success: true,
        discount: {
            type: coupon.type,
            value: coupon.value
        }
    });
});


// ========================================
// APPLY COUPON TO ORDER PRICE
// ========================================
const applyCoupon = asyncHandler(async (req, res) => {

    const { code, totalPrice } = req.body;

    const coupon = await Discount.findOne({
        code,
        isActive: true
    });

    if (!coupon) {
        return res.status(404).json({
            success: false,
            message: "Invalid coupon"
        });
    }

    const now = new Date();

    if (now < coupon.startDate || now > coupon.endDate) {
        return res.status(400).json({
            success: false,
            message: "Coupon expired"
        });
    }

    let finalPrice = totalPrice;

    if (coupon.type === "percentage") {
        finalPrice = totalPrice - (totalPrice * coupon.value / 100);
    } else {
        finalPrice = totalPrice - coupon.value;
    }

    if (finalPrice < 0) finalPrice = 0;

    res.json({
        success: true,
        originalPrice: totalPrice,
        finalPrice,
        discount: coupon.value
    });
});


// ========================================
// INCREMENT USAGE (after order success)
// ========================================
const incrementCouponUsage = asyncHandler(async (req, res) => {

    const { code } = req.body;

    const coupon = await Discount.findOne({ code });

    if (!coupon) {
        return res.status(404).json({
            success: false,
            message: "Coupon not found"
        });
    }

    coupon.usedCount += 1;
    await coupon.save();

    res.json({
        success: true,
        message: "Coupon usage updated"
    });
});


// ========================================
module.exports = {
    getAllCoupons,
    createCoupon,
    deleteCoupon,
    validateCoupon,
    applyCoupon,
    incrementCouponUsage
};