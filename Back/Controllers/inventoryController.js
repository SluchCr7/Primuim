const asyncHandler = require("express-async-handler");
const Warehouse = require("../models/Warehouse");
const WarehouseInventory = require("../models/WarehouseInventory");
const Order = require("../models/Order");
const Product = require("../models/Product").Product || require("../models/Product");
const Cart = require("../models/Cart");
const mongoose = require("mongoose");
const {
  releaseCartReservations,
  reserveStock,
  routeOrderInventory
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
  const { warehouseId, sku, productId, physicalStockChange, reorderPoint, safetyStock } = req.body;

  if (!warehouseId || !sku || !productId) {
    return res.status(400).json({ success: false, message: "warehouseId, sku, and productId are required." });
  }

  // Find or create inventory mapping
  let inventory = await WarehouseInventory.findOne({ warehouse: warehouseId, sku });

  if (!inventory) {
    inventory = new WarehouseInventory({
      warehouse: warehouseId,
      product: productId,
      sku,
      physicalStock: 0,
      reservedStock: 0,
      availableStock: 0
    });
  }

  if (physicalStockChange !== undefined) {
    inventory.physicalStock = Math.max(0, inventory.physicalStock + physicalStockChange);
  }
  if (reorderPoint !== undefined) {
    inventory.reorderPoint = reorderPoint;
  }
  if (safetyStock !== undefined) {
    inventory.safetyStock = safetyStock;
  }

  // Available stock recalculated in pre-save hook
  await inventory.save();

  // Also update overall product total stock in standard Product model for backward compatibility
  try {
    const ProductModel = require("../models/Product");
    const product = await ProductModel.findById(productId);
    if (product) {
      // Recalculate total physical stock across all warehouses for this SKU/product
      const allInventoriesForProduct = await WarehouseInventory.find({ product: productId });
      const totalPhysicalStock = allInventoriesForProduct.reduce((sum, inv) => sum + inv.physicalStock, 0);
      product.stock = totalPhysicalStock;
      await product.save();
    }
  } catch (err) {
    console.error("Failed to sync main product stock level:", err.message);
  }

  res.status(200).json({
    success: true,
    message: "Stock adjusted successfully",
    inventory
  });
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
  const inventoryValueResult = await WarehouseInventory.aggregate([
    {
      $lookup: {
        from: "products",
        localField: "product",
        foreignField: "_id",
        as: "productDetails"
      }
    },
    { $unwind: "$productDetails" },
    {
      $group: {
        _id: null,
        totalValue: { $sum: { $multiply: ["$physicalStock", "$productDetails.price"] } }
      }
    }
  ]);
  const currentInventoryValue = inventoryValueResult[0]?.totalValue || 0;

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

  const items = [];
  for (const item of cart.items) {
    const product = item.product;
    if (!product) {
      return res.status(400).json({ success: false, message: "A cart product is no longer available." });
    }
    if (product.isDeleted || !product.isPublished) {
      return res.status(409).json({ success: false, message: `Product ${product.title} is no longer available.` });
    }
    if (product.variants?.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Variant products are currently unavailable for purchase."
      });
    }
    if (!Number.isSafeInteger(item.quantity) || item.quantity < 1 || product.stock < item.quantity) {
      return res.status(409).json({ success: false, message: `Insufficient stock for product ${product.title}.` });
    }
    items.push({
      sku: product.sku || product.title,
      quantity: item.quantity,
      productId: product._id
    });
  }

  const cartId = cart._id.toString();
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    await releaseCartReservations(cartId, req.user.id, session);
    const allocations = await routeOrderInventory(items, undefined, session);
    await reserveStock(cartId, req.user.id, allocations, session);
    await session.commitTransaction();
    return res.status(200).json({
      success: true,
      message: "Stock successfully reserved for 15 minutes",
      allocations
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
