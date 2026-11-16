const asyncHandler = require("express-async-handler");
const Warehouse = require("../models/Warehouse");
const WarehouseInventory = require("../models/WarehouseInventory");
const SellerInventory = require("../models/SellerInventory");
const Order = require("../models/Order");
const Product = require("../models/Product").Product || require("../models/Product");
const { User } = require("../models/User");
const Cart = require("../models/Cart");
const mongoose = require("mongoose");
const {
  reserveWarehouseCart,
  reserveSellerInventory,
  releaseSellerCartReservations,
  setSellerStock,
  adjustSellerInventory,
  adjustWarehouseInventory,
} = require("../utils/inventoryService");

// @desc    Create a new warehouse
// @route   POST /api/inventory/warehouses
// @access  Private/Admin
const createWarehouse = asyncHandler(async (req, res) => {
  const { name, code, coordinates, address } = req.body;

  if (!name || !code || !coordinates || coordinates.length !== 2) {
    return res.status(400).json({ success: false, message: "Name, unique code, and [lng, lat] coordinates are required." });
  }

  const warehouse = await Warehouse.create({
    name,
    code,
    location: {
      type: "Point",
      coordinates
    },
    address
  });

  res.status(201).json({
    success: true,
    message: "Warehouse created successfully",
    warehouse
  });
});

// @desc    Adjust or restock inventory for a product variant at a warehouse
// @route   POST /api/inventory/stock-adjustment
// @access  Private/Admin
const adjustStock = asyncHandler(async (req, res) => {
  const {
    warehouseId,
    sku,
    productId,
    quantity,
    sellerId,
    mode,
    reason,
    operation,
    physicalStockChange,
  } = req.body;

  if (!productId || !sku) {
    return res.status(400).json({ success: false, message: "productId and sku are required." });
  }

  const product = await Product.findById(productId);
  if (!product || product.isDeleted) {
    return res.status(404).json({ success: false, message: "Product not found." });
  }
  const inventoryMode = mode || product.inventoryMode || "seller-managed";
  if (inventoryMode !== (product.inventoryMode || "seller-managed")) {
    return res.status(409).json({ success: false, message: "Inventory mode does not match the product." });
  }
  const isAdmin = ["admin", "superadmin"].includes(req.user.role);
  if (!isAdmin && req.user.role !== "seller") {
    return res.status(403).json({ success: false, message: "Not authorized to manage inventory." });
  }
  if (req.user.role === "seller" && sellerId && sellerId !== req.user.id) {
    return res.status(403).json({ success: false, message: "Sellers may only manage their own inventory." });
  }
  const ownerId = req.user.role === "seller" ? req.user.id : sellerId;
  if (!ownerId) {
    return res.status(400).json({ success: false, message: "sellerId is required for administrator stock adjustments." });
  }
  const seller = await User.findById(ownerId).select("_id role");
  if (!seller || seller.role !== "seller") {
    return res.status(404).json({ success: false, message: "Seller not found." });
  }
  if (String(product.seller) !== String(ownerId)) {
    return res.status(403).json({ success: false, message: "The product does not belong to the specified seller." });
  }

  let resolvedOperation = operation;
  let resolvedQuantity = quantity;
  if (!resolvedOperation && Number.isSafeInteger(physicalStockChange) && physicalStockChange !== 0) {
    resolvedOperation = physicalStockChange > 0 ? "increase" : "decrease";
    resolvedQuantity = Math.abs(physicalStockChange);
  }
  if (!["set", "increase", "decrease"].includes(resolvedOperation) ||
      !Number.isSafeInteger(resolvedQuantity) ||
      resolvedQuantity < 0 ||
      (resolvedOperation !== "set" && resolvedQuantity === 0)) {
    return res.status(400).json({
      success: false,
      message: "Provide operation=set|increase|decrease and a valid whole-number quantity.",
    });
  }
  if (inventoryMode === "warehouse-managed" && (!isAdmin || !warehouseId)) {
    return res.status(403).json({ success: false, message: "Warehouse stock requires an administrator and an active warehouse." });
  }

  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const options = {
      seller: ownerId,
      product: productId,
      sku,
      quantity: resolvedQuantity,
      actor: isAdmin ? "admin" : "seller",
      reason: reason || "MANUAL_ADJUSTMENT",
      referenceType: "inventory",
      referenceId: productId,
      session,
    };
    const inventory = inventoryMode === "warehouse-managed"
      ? await adjustWarehouseInventory({ ...options, warehouse: warehouseId, operation: resolvedOperation })
      : resolvedOperation === "set"
        ? await setSellerStock(options)
        : await adjustSellerInventory({
          ...options,
          quantity: resolvedOperation === "increase" ? resolvedQuantity : -resolvedQuantity,
        });
    await session.commitTransaction();
    return res.status(200).json({
      success: true,
      message: "Inventory updated successfully.",
      inventory,
      availableStock: inventory.availableStock,
    });
  } catch (error) {
    if (session.inTransaction()) await session.abortTransaction();
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    throw error;
  } finally {
    await session.endSession();
  }
});

// @desc    Get Inventory Turnover Report
// @route   GET /api/inventory/turnover-report
// @access  Private/Admin
const getTurnoverReport = asyncHandler(async (req, res) => {
  const startDate = req.query.startDate ? new Date(req.query.startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Default 30 days
  const endDate = req.query.endDate ? new Date(req.query.endDate) : new Date();

  // 1. Calculate Cost of Goods Sold (COGS)
  // We sum items' snapshot prices as a standard COGS metric
  const cogsResult = await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate, $lte: endDate },
        orderStatus: { $in: ["processing", "confirmed", "shipped", "delivered"] }
      }
    },
    { $unwind: "$orderItems" },
    {
      $group: {
        _id: null,
        totalCOGS: { $sum: { $multiply: ["$orderItems.price", "$orderItems.quantity"] } }
      }
    }
  ]);
  const cogs = cogsResult[0]?.totalCOGS || 0;

  // 2. Calculate Average Inventory Value
  // We multiply physical stock by the product's base price
  const [warehouseInventoryValue, sellerInventoryValue] = await Promise.all([
    WarehouseInventory.aggregate([
      {
        $lookup: {
          from: "products",
          localField: "product",
          foreignField: "_id",
          as: "productDetails"
        }
      },
      { $unwind: "$productDetails" },
      { $match: { "productDetails.inventoryMode": "warehouse-managed" } },
      {
        $group: {
          _id: null,
          totalValue: { $sum: { $multiply: ["$physicalStock", "$productDetails.price"] } }
        }
      }
    ]),
    SellerInventory.aggregate([
      { $match: { warehouse: null } },
      {
        $lookup: {
          from: "products",
          localField: "product",
          foreignField: "_id",
          as: "productDetails"
        }
      },
      { $unwind: "$productDetails" },
      { $match: { "productDetails.inventoryMode": "seller-managed" } },
      {
        $group: {
          _id: null,
          totalValue: { $sum: { $multiply: ["$declaredStock", "$productDetails.price"] } }
        }
      }
    ])
  ]);
  const currentInventoryValue =
    (warehouseInventoryValue[0]?.totalValue || 0) +
    (sellerInventoryValue[0]?.totalValue || 0);

  // For reporting, we simulate historical starting value, or use current value as baseline average
  const averageInventory = currentInventoryValue || 1; // Prevent division by zero
  const turnoverRatio = cogs / averageInventory;

  res.status(200).json({
    success: true,
    report: {
      startDate,
      endDate,
      costOfGoodsSold: cogs,
      averageInventoryValue: averageInventory,
      inventoryTurnoverRatio: parseFloat(turnoverRatio.toFixed(4)),
      daysInPeriod: Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24))
    }
  });
});

// @desc    Temporarily reserve stock from cart/checkout
// @route   POST /api/inventory/reserve
// @access  Private
const reserveCartStock = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user.id }).populate("items.product");
  if (!cart || cart.items.length === 0) {
    return res.status(400).json({ success: false, message: "Your cart is empty." });
  }

  const sellerItems = [];
  const warehouseItems = [];
  for (const item of cart.items) {
    const product = item.product;
    if (!product) {
      return res.status(400).json({ success: false, message: "A cart product is no longer available." });
    }
    if (product.isDeleted || product.isPublished === false) {
      return res.status(409).json({ success: false, message: `Product ${product.title} is no longer available.` });
    }
    if (product.seller && product.seller.toString() === req.user.id) {
      return res.status(400).json({ success: false, message: "You cannot reserve your own product." });
    }
    const variant = product.variants?.length
      ? product.variants.find(
        entry => entry.sku.toUpperCase() === String(item.variantSku || "").trim().toUpperCase()
      )
      : null;
    if (product.variants?.length && !variant) {
      return res.status(400).json({ success: false, message: `Choose a valid variant for ${product.title}.` });
    }
    if (!product.variants?.length && item.variantSku) {
      return res.status(400).json({ success: false, message: `${product.title} does not have variants.` });
    }
    if (!Number.isSafeInteger(item.quantity) || item.quantity < 1) {
      return res.status(400).json({ success: false, message: `Invalid quantity for ${product.title}.` });
    }
    const stockItem = {
      seller: product.seller,
      sku: variant?.sku || product.sku || product.slug,
      quantity: item.quantity,
      productId: product._id,
      variantSku: variant?.sku || null,
    };
    if ((product.inventoryMode || "seller-managed") === "warehouse-managed") {
      warehouseItems.push(stockItem);
    } else {
      sellerItems.push(stockItem);
    }
  }

  const cartId = cart._id.toString();
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const sellerReservations = [];
    for (const item of sellerItems) {
      sellerReservations.push(await reserveSellerInventory({
        ...item,
        user: req.user.id,
        cartId,
        session,
      }));
    }
    await releaseSellerCartReservations({
      cartId,
      user: req.user.id,
      keepKeys: sellerReservations.map(reservation => reservation.reservationKey),
      session,
    });
    const warehouseReservationResult = warehouseItems.length
      ? await reserveWarehouseCart({
        cartId,
        userId: req.user.id,
        items: warehouseItems.map(({ sku, quantity, productId }) => ({ sku, quantity, productId })),
        session,
      })
      : { allocations: [], reservations: [] };
    await session.commitTransaction();
    return res.status(200).json({
      success: true,
      message: "Stock successfully reserved for 15 minutes",
      sellerReservations,
      allocations: warehouseReservationResult.allocations,
    });
  } catch (err) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    if (err.statusCode) {
      return res.status(err.statusCode).json({ success: false, message: err.message });
    }
    throw err;
  } finally {
    await session.endSession();
  }
});

module.exports = {
  createWarehouse,
  adjustStock,
  getTurnoverReport,
  reserveCartStock
};
