const Cart = require("../models/Cart");
const Order = require("../models/Order");
const asyncHandler = require("express-async-handler");
const { Product } = require("../models/Product");
const mongoose = require("mongoose");
const generateInvoice = require("../utils/generateInvoice");
const CheckoutSession = require("../models/CheckoutSession");
const WarehouseInventory = require("../models/WarehouseInventory");
const StockReservation = require("../models/StockReservation");
const { awardLoyaltyPoints, redeemLoyaltyPoints } = require("../utils/loyaltyService");
const { routeOrderInventory, checkAndAlertReorder } = require("../utils/inventoryService");


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
        const { shippingAddress, coordinates, redeemPoints } = req.body;
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

        const orderItems = [];

        for (const item of cart.items) {
            const product = await Product.findById(item.product).session(session);

            if (!product) {
                throw new Error("Product not found");
            }

            if (product.seller && product.seller.toString() === req.user.id) {
                throw new Error(`You cannot purchase your own product: ${product.title}`);
            }

            // 1. Resolve Warehouse stock allocation
            // Check if there is an active reservation for this cart & SKU
            const reservation = await StockReservation.findOne({
                cartId: cart._id.toString(),
                sku: product.sku || product.title // Fallback if SKU is not defined
            }).session(session);

            if (reservation) {
                // Deduct physicalStock (since stock is sold) and release reservedStock
                const invUpdate = await WarehouseInventory.findOneAndUpdate(
                    { 
                        warehouse: reservation.warehouse, 
                        sku: reservation.sku,
                        reservedStock: { $gte: reservation.quantity },
                        physicalStock: { $gte: reservation.quantity }
                    },
                    {
                        $inc: { 
                            physicalStock: -reservation.quantity,
                            reservedStock: -reservation.quantity
                        }
                    },
                    { session, new: true }
                );

                if (!invUpdate) {
                    throw new Error(`Failed to commit warehouse stock deduction for reserved SKU: ${reservation.sku}`);
                }

                // Delete reservation record
                await StockReservation.findByIdAndDelete(reservation._id).session(session);

                // Run reorder trigger warnings
                await checkAndAlertReorder(reservation.warehouse, reservation.sku);
            } else {
                // Direct purchase routing: Find nearest warehouse with stock and deduct directly
                const allocations = await routeOrderInventory(
                    [{ sku: product.sku || product.title, quantity: item.quantity, productId: product._id }], 
                    coordinates
                );

                for (const alloc of allocations) {
                    const invUpdate = await WarehouseInventory.findOneAndUpdate(
                        {
                            warehouse: alloc.warehouseId,
                            sku: alloc.sku,
                            physicalStock: { $gte: alloc.quantity }
                        },
                        {
                            $inc: { physicalStock: -alloc.quantity }
                        },
                        { session, new: true }
                    );

                    if (!invUpdate) {
                        throw new Error(`Insufficient warehouse stock for SKU: ${alloc.sku}`);
                    }

                    // Run reorder trigger warnings
                    await checkAndAlertReorder(alloc.warehouseId, alloc.sku);
                }
            }

            // 2. Adjust legacy/global product stock & stats
            if (product.stock < item.quantity) {
                throw new Error(`Not enough stock for ${product.title}`);
            }
            product.stock -= item.quantity;
            product.sold += item.quantity;
            product.inventoryLogs.push({
                action: "sale",
                quantity: item.quantity,
                note: `Sold via order for user ${req.user.id}`,
                createdBy: req.user.id
            });

            await product.save({ session });

            // Trigger low-stock real-time alert (Legacy)
            if (product.stock <= product.lowStockThreshold && product.seller) {
                try {
                    const { createNotification } = require("../utils/notifications");
                    await createNotification({
                        user: product.seller,
                        title: "Low Stock Alert",
                        message: `Product "${product.title}" has reached critical low stock level (${product.stock} left).`,
                        type: "stock"
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
                price: product.price
            });
        }

        const itemsPrice = orderItems.reduce(
            (sum, item) => sum + item.price * item.quantity,
            0
        );

        // 3. Handle Loyalty Points Redemption
        let pointsDiscount = 0;
        if (redeemPoints && redeemPoints > 0) {
            // Assume 1 point = 1 EGP discount
            pointsDiscount = redeemPoints;
            const tempOrderId = new mongoose.Types.ObjectId(); // Temporary order ID for ledger mapping
            await redeemLoyaltyPoints(req.user.id, redeemPoints, tempOrderId, session);
        }

        const shippingPrice = req.body.shippingPrice || 0;
        const taxPrice = req.body.taxPrice || 0;
        const totalPrice = Math.max(0, itemsPrice + shippingPrice + taxPrice - pointsDiscount);

        const orderStatus = paymentMethod === "cod" ? "pending" : "processing";
        const paymentStatus = paymentMethod === "cod" ? "pending" : "processing";

        const order = await Order.create([{
            user: req.user.id,
            orderItems,
            shippingAddress,
            paymentMethod,
            itemsPrice,
            shippingPrice,
            taxPrice,
            discountPrice: pointsDiscount,
            totalPrice,
            orderStatus,
            paymentStatus
        }], { session });

        // 4. Award Loyalty Points based on final paid amount
        await awardLoyaltyPoints(req.user.id, order[0]._id, totalPrice, session);

        // Clear cart
        cart.items = [];
        await cart.save({ session });

        // Delete checkout session
        await CheckoutSession.deleteOne({ userId: req.user.id }).session(session);

        await session.commitTransaction();
        session.endSession();

        // Send order confirmation email asynchronously
        try {
            const populatedOrder = await Order.findById(order[0]._id).populate("user", "username email");
            if (populatedOrder) {
                // Send notifications
                try {
                    const { createNotification } = require("../utils/notifications");
                    const orderIdShort = populatedOrder._id.toString().substring(18).toUpperCase();
                    
                    // 1. Notify Customer
                    await createNotification({
                        user: populatedOrder.user._id || populatedOrder.user,
                        title: "Order Placed Successfully",
                        message: `Thank you! Your order #${orderIdShort} has been placed. Total: ${populatedOrder.totalPrice.toLocaleString()} EGP.`,
                        type: "order"
                    });

                    // 2. Notify Sellers
                    const sellerProducts = {};
                    populatedOrder.orderItems.forEach(item => {
                        if (item.seller) {
                            const sellerId = item.seller.toString();
                            if (!sellerProducts[sellerId]) {
                                sellerProducts[sellerId] = [];
                            }
                            sellerProducts[sellerId].push(`"${item.title}" (x${item.quantity})`);
                        }
                    });

                    for (const sellerId of Object.keys(sellerProducts)) {
                        await createNotification({
                            user: sellerId,
                            title: "New Order Received",
                            message: `A new order #${orderIdShort} has been placed for your store containing: ${sellerProducts[sellerId].join(", ")}.`,
                            type: "order"
                        });
                    }
                } catch (notifErr) {
                    console.error("Order creation notifications failed:", notifErr.message);
                }

                if (populatedOrder.user && populatedOrder.user.email) {
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
// PROCESS RETURN (ADMIN ONLY)
// ========================================
const processReturn = asyncHandler(async (req, res) => {
    const { orderId, returnedItems } = req.body;

    if (!orderId || !returnedItems || !returnedItems.length) {
        return res.status(400).json({ success: false, message: "orderId and returnedItems are required." });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const order = await Order.findById(orderId).session(session);
        if (!order) throw new Error("Order not found");

        for (const item of returnedItems) {
            // Restock items in the designated return warehouse
            await WarehouseInventory.findOneAndUpdate(
                { warehouse: item.returnWarehouseId, sku: item.sku },
                {
                    $inc: { 
                        physicalStock: item.quantity,
                        availableStock: item.quantity 
                    }
                },
                { session, upsert: true }
            );

            // Restock items in general product collection
            const product = await Product.findOne({ sku: item.sku }).session(session);
            if (product) {
                product.stock += item.quantity;
                product.sold = Math.max(0, product.sold - item.quantity);
                product.inventoryLogs.push({
                    action: "refund",
                    quantity: item.quantity,
                    note: `Restocked return from Order ${orderId}`,
                    createdBy: req.user.id
                });
                await product.save({ session });
            }
        }

        // Adjust loyalty points if any were earned/redeemed
        // Here we revoke points based on the returned items' cost value
        const returnedValue = returnedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const pointsToRevoke = Math.floor(returnedValue * 1.0); // Using 1x as base return multiplier or custom logic

        if (pointsToRevoke > 0) {
            const LoyaltyWallet = require("../models/LoyaltyWallet");
            const LoyaltyTransaction = require("../models/LoyaltyTransaction");
            
            const updatedWallet = await LoyaltyWallet.findOneAndUpdate(
                { user: order.user },
                { $inc: { balance: -pointsToRevoke } },
                { session, new: true }
            );

            if (updatedWallet) {
                await LoyaltyTransaction.create([{
                    wallet: updatedWallet._id,
                    user: order.user,
                    amount: -pointsToRevoke,
                    type: 'REFUNDED',
                    description: `Revoked loyalty points due to refund on Order #${orderId}`,
                    referenceId: orderId
                }], { session });
            }
        }

        order.orderStatus = "cancelled"; // or partially_refunded
        await order.save({ session });

        await session.commitTransaction();
        session.endSession();

        res.status(200).json({
            success: true,
            message: "Return processed successfully and stock restored."
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
module.exports = {
    getMyOrders,
    createOrder,
    getOrderById,
    cancelOrder,
    downloadInvoice,
    processReturn
};