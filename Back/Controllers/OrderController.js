const Cart = require("../models/Cart");
const Order = require("../models/Order");
const asyncHandler = require("express-async-handler");
const { Product } = require("../models/Product");
const mongoose = require("mongoose");
const generateInvoice = require("../utils/generateInvoice");
const CheckoutSession = require("../models/CheckoutSession");


// ========================================
// GET MY ORDERS
// ========================================
const getMyOrders = asyncHandler(async (req, res) => {

    const orders = await Order.find({ user: req.user.id })
        .populate("orderItems.product", "title images")
        .sort({ createdAt: -1 });

    res.status(200).json({
        success: true,
        orders
    });
});


// ========================================
// CREATE ORDER (FROM CART)
// ========================================
const createOrder = asyncHandler(async (req, res) => {

    const session = await mongoose.startSession();
    session.startTransaction();

    try {

        const cart = await Cart.findOne({ user: req.user.id }).session(session);

        const { shippingAddress } = req.body;
        const allowedPaymentMethods = ["cod", "card", "paypal"];
        const paymentMethod = req.body.paymentMethod || "cod";

        if (!shippingAddress || !shippingAddress.fullName || !shippingAddress.phone || !shippingAddress.city || !shippingAddress.street) {
            return res.status(400).json({
                success: false,
                message: "Shipping address is required"
            });
        }

        if (!allowedPaymentMethods.includes(paymentMethod)) {
            return res.status(400).json({
                success: false,
                message: "Invalid payment method"
            });
        }

        if (!cart || cart.items.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Cart is empty"
            });
        }

        // Build order items with product snapshot
        const orderItems = [];

        for (const item of cart.items) {

            const product = await Product.findById(item.product).session(session);

            if (!product) {
                throw new Error("Product not found");
            }

            // Check if the user is the seller of the product
            if (product.seller && product.seller.toString() === req.user.id) {
                throw new Error(`You cannot purchase your own product: ${product.title}`);
            }

            // check stock
            if (product.stock < item.quantity) {
                throw new Error(`Not enough stock for ${product.title}`);
            }

            // reduce stock
            product.stock -= item.quantity;
            product.sold += item.quantity;
            product.inventoryLogs.push({
                action: "sale",
                quantity: item.quantity,
                note: `Sold via order draft for user ${req.user.id}`,
                createdBy: req.user.id
            });

            await product.save({ session });

            // Trigger low-stock real-time alert
            if (product.stock <= product.lowStockThreshold && product.seller) {
                try {
                    const { createNotification } = require("../utils/notifications");
                    await createNotification({
                        user: product.seller,
                        title: "Low Stock Alert",
                        message: `Product "${product.title}" has reached critical low stock level (${product.stock} left).`
                    });
                } catch (err) {
                    console.error("Failed to generate low-stock alert notification:", err.message);
                }
            }

            orderItems.push({
                product: product._id,
                title: product.title,
                image: product.images?.[0]?.url || "",
                quantity: item.quantity,
                price: product.price   // snapshot
            });
        }

        const itemsPrice = orderItems.reduce(
            (sum, item) => sum + item.price * item.quantity,
            0
        );

        const orderStatus = paymentMethod === "cod" ? "pending" : "processing";
        const paymentStatus = paymentMethod === "cod" ? "pending" : "processing";

        const order = await Order.create([{
            user: req.user.id,
            orderItems,
            shippingAddress,
            paymentMethod,
            itemsPrice,
            shippingPrice: req.body.shippingPrice || 0,
            taxPrice: req.body.taxPrice || 0,
            totalPrice: itemsPrice + (req.body.shippingPrice || 0) + (req.body.taxPrice || 0),
            orderStatus,
            paymentStatus
        }], { session });

        // clear cart
        cart.items = [];
        await cart.save({ session });

        // Delete checkout session
        await CheckoutSession.deleteOne({ userId: req.user.id }).session(session);

        await session.commitTransaction();
        session.endSession();

        // Send order confirmation email asynchronously
        try {
            const populatedOrder = await Order.findById(order[0]._id).populate("user", "username email");
            if (populatedOrder && populatedOrder.user && populatedOrder.user.email) {
                const sendEmail = require("../utils/sendEmail");
                const itemsHtml = populatedOrder.orderItems.map(item => `
                    <tr>
                        <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.title}</td>
                        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
                        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${item.price.toLocaleString()} EGP</td>
                    </tr>
                `).join('');

                await sendEmail({
                    email: populatedOrder.user.email,
                    subject: `Order Confirmation #${populatedOrder._id.toString().substring(18).toUpperCase()} - Shop Premium`,
                    html: `
                        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
                            <h2 style="font-family: serif; color: #c5a880;">Thank you for your order!</h2>
                            <p>Hi ${populatedOrder.user.username},</p>
                            <p>Your order <strong>#${populatedOrder._id.toString().substring(18).toUpperCase()}</strong> has been successfully placed. We are processing it right now.</p>
                            
                            <h3>Order Summary</h3>
                            <table style="width: 100%; border-collapse: collapse;">
                                <thead>
                                    <tr style="background-color: #f7fafc;">
                                        <th style="padding: 8px; text-align: left;">Item</th>
                                        <th style="padding: 8px; text-align: center;">Qty</th>
                                        <th style="padding: 8px; text-align: right;">Price</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${itemsHtml}
                                </tbody>
                            </table>
                            
                            <div style="margin-top: 20px; text-align: right; font-weight: bold;">
                                <p>Subtotal: ${populatedOrder.itemsPrice.toLocaleString()} EGP</p>
                                <p>Shipping: ${populatedOrder.shippingPrice.toLocaleString()} EGP</p>
                                <p>Tax (14% VAT): ${populatedOrder.taxPrice.toLocaleString()} EGP</p>
                                <p style="font-size: 18px; color: #c5a880;">Total: ${populatedOrder.totalPrice.toLocaleString()} EGP</p>
                            </div>
                            
                            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;" />
                            <p style="font-size: 12px; color: #718096; text-align: center;">Shop Premium - 123 Luxury Avenue, Cairo, Egypt</p>
                        </div>
                    `
                });
            }
        } catch (emailErr) {
            console.error("Order confirmation email failed:", emailErr.message);
        }

        res.status(201).json({
            success: true,
            order: order[0]
        });

    } catch (error) {

        await session.abortTransaction();
        session.endSession();

        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});


// ========================================
// GET ORDER BY ID
// ========================================
const getOrderById = asyncHandler(async (req, res) => {

    const order = await Order.findById(req.params.id)
        .populate("user", "username email");

    if (!order) {
        return res.status(404).json({
            success: false,
            message: "Order not found"
        });
    }

    // ownership check
    if (order.user._id.toString() !== req.user.id) {
        return res.status(403).json({
            success: false,
            message: "Not authorized"
        });
    }

    res.status(200).json({
        success: true,
        order
    });
});


// ========================================
// CANCEL ORDER (OPTIONAL BUT IMPORTANT)
// ========================================
const cancelOrder = asyncHandler(async (req, res) => {

    const order = await Order.findById(req.params.id);

    if (!order) {
        return res.status(404).json({
            success: false,
            message: "Order not found"
        });
    }

    if (order.user.toString() !== req.user.id) {
        return res.status(403).json({
            success: false,
            message: "Not authorized"
        });
    }

    if (order.orderStatus !== "pending") {
        return res.status(400).json({
            success: false,
            message: "Order cannot be cancelled"
        });
    }

    order.orderStatus = "cancelled";

    for (const item of order.orderItems) {
        const product = await Product.findById(item.product);
        if (product) {
            product.stock += item.quantity;
            product.sold = Math.max(0, product.sold - item.quantity);
            product.inventoryLogs.push({
                action: "refund",
                quantity: item.quantity,
                note: `Order ${order._id} cancelled`,
                createdBy: req.user.id
            });
            await product.save();
        }
    }

    await order.save();

    res.json({
        success: true,
        message: "Order cancelled"
    });
});

// ========================================
// DOWNLOAD PDF INVOICE
// ========================================
const downloadInvoice = asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id).populate("user", "username email");

    if (!order) {
        return res.status(404).json({
            success: false,
            message: "Order not found"
        });
    }

    if (order.user._id.toString() !== req.user.id && req.user.role !== "admin") {
        return res.status(403).json({
            success: false,
            message: "Not authorized"
        });
    }

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
        "Content-Disposition",
        `attachment; filename=invoice-${order._id}.pdf`
    );

    generateInvoice(order, res);
});

// ========================================
module.exports = {
    getMyOrders,
    createOrder,
    getOrderById,
    cancelOrder,
    downloadInvoice
};