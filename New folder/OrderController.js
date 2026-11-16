const Cart = require("../models/Cart");
const Order = require("../models/Order");
const asyncHandler = require("express-async-handler");
const { Product } = require("../models/Product");
const mongoose = require("mongoose");
const CheckoutSession = require("../models/CheckoutSession");
const generateInvoice = require("../utils/generateInvoice");
const WarehouseInventory = require("../models/WarehouseInventory");
const StockReservation = require("../models/StockReservation");
const { redeemLoyaltyPoints } = require("../utils/loyaltyService");
const { routeOrderInventory, checkAndAlertReorder } = require("../utils/inventoryService");

const createOrderError = (message, statusCode = 400) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
};

const allocateUnitsByWeights = (totalUnits, weights) => {
    if (weights.length === 0) return [];
    const normalizedWeights = weights.map(weight => Math.max(0, Math.round(weight)));
    let totalWeight = normalizedWeights.reduce((sum, weight) => sum + weight, 0);
    if (totalWeight === 0) {
        normalizedWeights.fill(1);
        totalWeight = normalizedWeights.length;
    }

    let remainingUnits = totalUnits;
    return normalizedWeights.map((weight, index) => {
        const units = index === normalizedWeights.length - 1
            ? remainingUnits
            : Math.floor(totalUnits * weight / totalWeight);
        remainingUnits -= units;
        return units;
    });
};

const allocateMoneyByWeights = (amount, weights) =>
    allocateUnitsByWeights(Math.round(amount * 100), weights).map(cents => cents / 100);


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
const createOrder = asyncHandler(async (req, res, next) => {
    const session = await mongoose.startSession();

    try {
        session.startTransaction();
        const cart = await Cart.findOne({ user: req.user.id }).session(session);
        const { coordinates, redeemPoints } = req.body;
        const checkoutSession = await CheckoutSession.findOne({ userId: req.user.id }).session(session);
        if (
          !checkoutSession ||
          !checkoutSession.shippingAddress ||
          !checkoutSession.shippingMethod ||
          !checkoutSession.paymentMethod
        ) {
          throw createOrderError("Complete checkout shipping and payment details before placing the order.");
        }
        if (!checkoutSession.expiresAt || checkoutSession.expiresAt <= new Date()) {
            throw createOrderError("Checkout session has expired. Please start checkout again.");
        }

        const allowedPaymentMethods = ["cod"];
        const paymentMethod = checkoutSession.paymentMethod;
        const shippingAddress = checkoutSession.shippingAddress;

        if (!shippingAddress || !shippingAddress.fullName || !shippingAddress.phone || !shippingAddress.city || !shippingAddress.street) {
            throw createOrderError("Shipping address is required");
        }

        if (!allowedPaymentMethods.includes(paymentMethod)) {
            throw createOrderError("Invalid payment method");
        }

        if (!cart || cart.items.length === 0) {
            throw createOrderError("Cart is empty");
        }
        if (
            coordinates !== undefined &&
            (!Array.isArray(coordinates) ||
                coordinates.length !== 2 ||
                !coordinates.every(Number.isFinite) ||
                coordinates[0] < -180 ||
                coordinates[0] > 180 ||
                coordinates[1] < -90 ||
                coordinates[1] > 90)
        ) {
            throw createOrderError("Coordinates must be [longitude, latitude] within valid ranges.");
        }
        if (redeemPoints !== undefined && (!Number.isSafeInteger(redeemPoints) || redeemPoints < 0)) {
            throw createOrderError("Redeemed points must be a non-negative whole number.");
        }

        const orderItems = [];

        for (const item of cart.items) {
            const product = await Product.findById(item.product).session(session);

            if (!product) {
                throw createOrderError("Product not found", 404);
            }

            if (product.variants?.length > 0) {
                throw createOrderError("Variant products are currently unavailable for purchase.");
            }

            if (product.seller && product.seller.toString() === req.user.id) {
                throw createOrderError(`You cannot purchase your own product: ${product.title}`);
            }

            const sku = product.sku || product.title;
            const reservations = await StockReservation.find({
                cartId: cart._id.toString(),
                user: req.user.id,
                sku
            }).session(session);
            const now = new Date();
            const activeReservations = reservations.filter(reservation => reservation.expiresAt > now);
            const reservedQuantity = activeReservations.reduce((sum, reservation) => sum + reservation.quantity, 0);
            const inventoryAllocations = [];

            if (reservedQuantity === item.quantity) {
                for (const reservation of activeReservations) {
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
                        throw createOrderError(`Failed to commit reserved warehouse stock for SKU ${reservation.sku}.`, 409);
                    }
                    inventoryAllocations.push({
                        warehouse: reservation.warehouse,
                        sku: reservation.sku,
                        quantity: reservation.quantity
                    });
                    await StockReservation.findByIdAndDelete(reservation._id).session(session);
                    await checkAndAlertReorder(reservation.warehouse, reservation.sku);
                }
                for (const reservation of reservations.filter(entry => entry.expiresAt <= now)) {
                    const released = await WarehouseInventory.findOneAndUpdate(
                        {
                            warehouse: reservation.warehouse,
                            sku: reservation.sku,
                            reservedStock: { $gte: reservation.quantity }
                        },
                        {
                            $inc: {
                                reservedStock: -reservation.quantity,
                                availableStock: reservation.quantity
                            }
                        },
                        { session, new: true }
                    );
                    if (!released) {
                        throw createOrderError(`Failed to release expired reservation for SKU ${reservation.sku}.`, 409);
                    }
                    await StockReservation.findByIdAndDelete(reservation._id).session(session);
                }
            } else {
                for (const reservation of reservations) {
                    const released = await WarehouseInventory.findOneAndUpdate(
                        {
                            warehouse: reservation.warehouse,
                            sku: reservation.sku,
                            reservedStock: { $gte: reservation.quantity }
                        },
                        {
                            $inc: {
                                reservedStock: -reservation.quantity,
                                availableStock: reservation.quantity
                            }
                        },
                        { session, new: true }
                    );
                    if (!released) {
                        throw createOrderError(`Failed to release stale reservation for SKU ${reservation.sku}.`, 409);
                    }
                    await StockReservation.findByIdAndDelete(reservation._id).session(session);
                }
                const allocations = await routeOrderInventory(
                    [{ sku, quantity: item.quantity, productId: product._id }],
                    coordinates,
                    session
                );

                for (const alloc of allocations) {
                    const invUpdate = await WarehouseInventory.findOneAndUpdate(
                        {
                            warehouse: alloc.warehouseId,
                            sku: alloc.sku,
                            physicalStock: { $gte: alloc.quantity },
                            availableStock: { $gte: alloc.quantity }
                        },
                        {
                            $inc: {
                                physicalStock: -alloc.quantity,
                                availableStock: -alloc.quantity
                            }
                        },
                        { session, new: true }
                    );

                    if (!invUpdate) {
                        throw createOrderError(`Insufficient warehouse stock for SKU: ${alloc.sku}`, 409);
                    }
                    inventoryAllocations.push({
                        warehouse: alloc.warehouseId,
                        sku: alloc.sku,
                        quantity: alloc.quantity
                    });

                    // Run reorder trigger warnings
                    await checkAndAlertReorder(alloc.warehouseId, alloc.sku);
                }
            }

            // 2. Adjust legacy/global product stock & stats
            if (product.stock < item.quantity) {
                throw createOrderError(`Not enough stock for ${product.title}`, 409);
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
                seller: product.seller || null,
                title: product.title,
                image: product.images?.[0]?.url || "",
                quantity: item.quantity,
                price: product.price,
                inventoryAllocations
            });
        }

        const itemsPrice = Math.round(orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0) * 100) / 100;

        const shippingPrices = {
            "Standard Shipping": 50,
            "Express Shipping": 150,
            "Free Shipping": itemsPrice >= 1000 ? 0 : 50
        };
        const shippingPrice = shippingPrices[checkoutSession.shippingMethod];
        if (shippingPrice === undefined) {
            throw createOrderError("The selected shipping method is invalid.");
        }
        const taxPrice = Math.round(itemsPrice * 0.14 * 100) / 100;
        const pointsDiscount = redeemPoints || 0;
        const preDiscountTotal = itemsPrice + shippingPrice + taxPrice;
        if (pointsDiscount > preDiscountTotal) {
            throw createOrderError("Redeemed points cannot exceed the order total.");
        }

        const orderStatus = paymentMethod === "cod" ? "pending" : "processing";
        const paymentStatus = paymentMethod === "cod" ? "pending" : "processing";
        const checkoutGroupId = new mongoose.Types.ObjectId();
        const groupsBySeller = new Map();
        for (const item of orderItems) {
            const sellerKey = item.seller ? item.seller.toString() : "platform";
            if (!groupsBySeller.has(sellerKey)) {
                groupsBySeller.set(sellerKey, { seller: item.seller, orderItems: [] });
            }
            groupsBySeller.get(sellerKey).orderItems.push(item);
        }

        const storeGroups = Array.from(groupsBySeller.values());
        const storeSubtotals = storeGroups.map(group =>
            Math.round(group.orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0) * 100) / 100
        );
        const storeSubtotalCents = storeSubtotals.map(subtotal => Math.round(subtotal * 100));
        const storeShippingPrices = allocateMoneyByWeights(shippingPrice, storeSubtotalCents);
        const storeTaxPrices = allocateMoneyByWeights(taxPrice, storeSubtotalCents);
        const storePreDiscountTotals = storeGroups.map((_, index) =>
            Math.round((storeSubtotals[index] + storeShippingPrices[index] + storeTaxPrices[index]) * 100)
        );
        const storeDiscounts = allocateUnitsByWeights(pointsDiscount, storePreDiscountTotals);
        const orderDocuments = storeGroups.map((group, index) => {
            const storeTotal = storeSubtotals[index] + storeShippingPrices[index] + storeTaxPrices[index] - storeDiscounts[index];
            return {
                _id: new mongoose.Types.ObjectId(),
                checkoutGroupId,
                user: req.user.id,
                seller: group.seller,
                orderItems: group.orderItems,
                shippingAddress,
                paymentMethod,
                itemsPrice: storeSubtotals[index],
                shippingPrice: storeShippingPrices[index],
                taxPrice: storeTaxPrices[index],
                discountPrice: storeDiscounts[index],
                totalPrice: Math.round(storeTotal * 100) / 100,
                orderStatus,
                paymentStatus
            };
        });

        const orders = await Order.create(orderDocuments, { session });

        for (let index = 0; index < orders.length; index += 1) {
            if (storeDiscounts[index] > 0) {
                await redeemLoyaltyPoints(req.user.id, storeDiscounts[index], orders[index]._id, session);
            }
        }

        // Clear cart
        cart.items = [];
        await cart.save({ session });

        // Delete checkout session
        await CheckoutSession.deleteOne({ userId: req.user.id }).session(session);

        await session.commitTransaction();

        // Send one confirmation for the complete multi-store checkout.
        try {
            const firstOrder = await Order.findById(orders[0]._id).populate("user", "username email");
            if (firstOrder) {
                const orderNumbers = orders.map(order => `#${order._id.toString().substring(18).toUpperCase()}`);
                const grandTotal = orders.reduce((sum, order) => sum + order.totalPrice, 0);
                const { createNotification } = require("../utils/notifications");

                try {
                    await createNotification({
                        user: firstOrder.user._id || firstOrder.user,
                        title: orders.length > 1 ? "Store Orders Placed" : "Order Placed Successfully",
                        message: `Your ${orders.length > 1 ? "store orders" : "order"} ${orderNumbers.join(", ")} were placed. Total: ${grandTotal.toLocaleString()} EGP.`,
                        type: "order"
                    });

                    for (const order of orders) {
                        if (!order.seller) continue;
                        const orderNumber = order._id.toString().substring(18).toUpperCase();
                        const products = order.orderItems.map(item => `"${item.title}" (x${item.quantity})`).join(", ");
                        await createNotification({
                            user: order.seller,
                            title: "New Order Received",
                            message: `Order #${orderNumber} has been placed for your store containing: ${products}.`,
                            type: "order"
                        });
                    }
                } catch (notifErr) {
                    console.error("Order creation notifications failed:", notifErr.message);
                }

                if (firstOrder.user && firstOrder.user.email) {
                    const sendEmail = require("../utils/sendEmail");
                    const orderSummaries = orders.map(order => {
                        const orderNumber = order._id.toString().substring(18).toUpperCase();
                        const itemsHtml = order.orderItems.map(item => `
                            <tr>
                                <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.title}</td>
                                <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
                                <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${item.price.toLocaleString()} EGP</td>
                            </tr>
                        `).join("");
                        return `
                            <h3>Store Order #${orderNumber}</h3>
                            <table style="width: 100%; border-collapse: collapse;">
                                <tbody>${itemsHtml}</tbody>
                            </table>
                            <p>Subtotal: ${order.itemsPrice.toLocaleString()} EGP · Shipping: ${order.shippingPrice.toLocaleString()} EGP · Tax: ${order.taxPrice.toLocaleString()} EGP · Discount: ${order.discountPrice.toLocaleString()} EGP</p>
                            <p><strong>Total: ${order.totalPrice.toLocaleString()} EGP</strong></p>
                        `;
                    }).join("");

                    await sendEmail({
                        email: firstOrder.user.email,
                        subject: `${orders.length} store order${orders.length === 1 ? "" : "s"} confirmed - Shop Premium`,
                        html: `
                            <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
                                <h2 style="font-family: serif; color: #c5a880;">Thank you for your order!</h2>
                                <p>Hi ${firstOrder.user.username}, your checkout is now split into ${orders.length} store order${orders.length === 1 ? "" : "s"}.</p>
                                ${orderSummaries}
                                <p style="font-size: 18px; color: #c5a880;">Checkout total: ${grandTotal.toLocaleString()} EGP</p>
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
            order: orders[0],
            orders,
            checkoutGroupId
        });

    } catch (error) {
        if (session.inTransaction()) {
            await session.abortTransaction();
        }
        if (error.statusCode) {
            return res.status(error.statusCode).json({ success: false, message: error.message });
        }
        return next(error);
    } finally {
        await session.endSession();
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
    const session = await mongoose.startSession();
    try {
        session.startTransaction();
        const existingOrder = await Order.findById(req.params.id).session(session);
        if (!existingOrder) {
            throw createOrderError("Order not found", 404);
        }
        if (existingOrder.user.toString() !== req.user.id) {
            throw createOrderError("Not authorized", 403);
        }
        if (existingOrder.orderStatus !== "pending") {
            throw createOrderError("Order cannot be cancelled");
        }

        const order = await Order.findOneAndUpdate(
            { _id: existingOrder._id, user: req.user.id, orderStatus: "pending" },
            { $set: { orderStatus: "cancelled" } },
            { new: true, session }
        );
        if (!order) {
            throw createOrderError("Order cannot be cancelled", 409);
        }

        for (const item of order.orderItems) {
            for (const allocation of item.inventoryAllocations || []) {
                const inventory = await WarehouseInventory.findOneAndUpdate(
                    { warehouse: allocation.warehouse, sku: allocation.sku },
                    {
                        $inc: {
                            physicalStock: allocation.quantity,
                            availableStock: allocation.quantity
                        }
                    },
                    { session, new: true }
                );
                if (!inventory) {
                    throw createOrderError(`Warehouse inventory was not found for SKU ${allocation.sku}.`, 409);
                }
            }

            const product = await Product.findById(item.product).session(session);
            if (product) {
                product.stock += item.quantity;
                product.sold = Math.max(0, product.sold - item.quantity);
                product.inventoryLogs.push({
                    action: "refund",
                    quantity: item.quantity,
                    note: `Order ${order._id} cancelled`,
                    createdBy: req.user.id
                });
                await product.save({ session });
            }
        }

        await session.commitTransaction();
        res.json({ success: true, message: "Order cancelled" });
    } catch (error) {
        if (session.inTransaction()) {
            await session.abortTransaction();
        }
        if (error.statusCode) {
            return res.status(error.statusCode).json({ success: false, message: error.message });
        }
        throw error;
    } finally {
        await session.endSession();
    }
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

    if (!orderId || !Array.isArray(returnedItems) || returnedItems.length === 0) {
        return res.status(400).json({ success: false, message: "orderId and returnedItems are required." });
    }

    const session = await mongoose.startSession();
    try {
        session.startTransaction();
        const order = await Order.findById(orderId).session(session);
        if (!order) throw createOrderError("Order not found", 404);
        if (order.orderStatus !== "delivered") {
            throw createOrderError("Only delivered orders can be returned.");
        }

        for (const returnedItem of returnedItems) {
            if (
                !returnedItem ||
                !Number.isSafeInteger(returnedItem.quantity) ||
                returnedItem.quantity < 1 ||
                (!returnedItem.productId && !returnedItem.sku)
            ) {
                throw createOrderError("Each returned item needs a product ID or SKU and a positive whole-number quantity.");
            }

            let product = returnedItem.productId
                ? await Product.findById(returnedItem.productId).session(session)
                : await Product.findOne({ sku: returnedItem.sku }).session(session);
            if (!product && returnedItem.sku) {
                product = await Product.findOne({ title: returnedItem.sku }).session(session);
            }
            if (!product) throw createOrderError("Returned product was not found.", 404);

            const orderItem = order.orderItems.find(item =>
                item.product.toString() === product._id.toString()
            );
            if (!orderItem) throw createOrderError("The product is not part of this order.");

            const alreadyReturned = orderItem.returnedQuantity || 0;
            if (alreadyReturned + returnedItem.quantity > orderItem.quantity) {
                throw createOrderError("Return quantity exceeds the unreturned quantity for this product.");
            }

            const allocations = orderItem.inventoryAllocations || [];
            if (!allocations.length) {
                throw createOrderError("This order has no warehouse allocation history; its return cannot be restocked automatically.", 409);
            }

            let quantityToRestock = returnedItem.quantity;
            for (const allocation of allocations) {
                const unreturnedAllocationQuantity =
                    allocation.quantity - (allocation.returnedQuantity || 0);
                const allocatedReturnQuantity = Math.min(quantityToRestock, unreturnedAllocationQuantity);
                if (allocatedReturnQuantity <= 0) continue;

                const inventory = await WarehouseInventory.findOneAndUpdate(
                    { warehouse: allocation.warehouse, sku: allocation.sku },
                    {
                        $inc: {
                            physicalStock: allocatedReturnQuantity,
                            availableStock: allocatedReturnQuantity
                        }
                    },
                    { session, new: true }
                );
                if (!inventory) {
                    throw createOrderError(`Warehouse inventory was not found for SKU ${allocation.sku}.`, 409);
                }

                allocation.returnedQuantity = (allocation.returnedQuantity || 0) + allocatedReturnQuantity;
                quantityToRestock -= allocatedReturnQuantity;
                if (quantityToRestock === 0) break;
            }
            if (quantityToRestock > 0) {
                throw createOrderError("Return quantity exceeds the warehouse allocation history.", 409);
            }

            orderItem.returnedQuantity = alreadyReturned + returnedItem.quantity;
            product.stock += returnedItem.quantity;
            product.sold = Math.max(0, product.sold - returnedItem.quantity);
            product.inventoryLogs.push({
                action: "refund",
                quantity: returnedItem.quantity,
                note: `Restocked return from Order ${orderId}`,
                createdBy: req.user.id
            });
            await product.save({ session });
        }

        order.returnStatus = order.orderItems.every(item =>
            (item.returnedQuantity || 0) >= item.quantity
        ) ? "returned" : "partial";
        await order.save({ session });

        await session.commitTransaction();
        return res.status(200).json({
            success: true,
            message: "Returned items were recorded and restocked. Payment refunds must be processed separately.",
            order
        });
    } catch (error) {
        if (session.inTransaction()) {
            await session.abortTransaction();
        }
        if (error.statusCode) {
            return res.status(error.statusCode).json({ success: false, message: error.message });
        }
        throw error;
    } finally {
        await session.endSession();
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
