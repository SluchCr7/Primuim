const Warehouse = require('../models/Warehouse');
const WarehouseInventory = require('../models/WarehouseInventory');
const StockReservation = require('../models/StockReservation');
const mongoose = require('mongoose');

function inventoryConflict(message) {
  const error = new Error(message);
  error.statusCode = 409;
  return error;
}

/**
 * Finds the optimal warehouses to fulfill items in an order based on customer location.
 * @param {Array} items - [{ sku, quantity }]
 * @param {Array} customerCoordinates - [longitude, latitude]
 */
async function routeOrderInventory(items, customerCoordinates, session) {
  // If coordinates are missing or invalid, default to a fallback sorting order (e.g., ID or default warehouse)
  let nearbyWarehouses;
  if (customerCoordinates && customerCoordinates.length === 2) {
    const aggregate = Warehouse.aggregate([
      {
        $geoNear: {
          near: { type: "Point", coordinates: customerCoordinates },
          distanceField: "distance",
          spherical: true,
          query: { isActive: true }
        }
      }
    ]);
    if (session) aggregate.session(session);
    nearbyWarehouses = await aggregate;
  } else {
    // Fallback: get all active warehouses
    const query = Warehouse.find({ isActive: true });
    if (session) query.session(session);
    nearbyWarehouses = await query;
  }

  if (!nearbyWarehouses.length) {
    throw inventoryConflict("No active fulfillment warehouses found.");
  }

  const fulfillmentPlan = [];
  // Clone items to avoid mutating inputs
  const groupedItems = new Map();
  for (const item of items) {
    const existing = groupedItems.get(item.sku);
    if (existing && existing.productId?.toString() !== item.productId?.toString()) {
      throw inventoryConflict(`SKU ${item.sku} is assigned to multiple products.`);
    }
    if (existing) {
      existing.quantity += item.quantity;
    } else {
      groupedItems.set(item.sku, { sku: item.sku, quantity: item.quantity, productId: item.productId });
    }
  }
  const unfulfilledItems = [...groupedItems.values()];

  for (const warehouse of nearbyWarehouses) {
    if (unfulfilledItems.length === 0) break;

    const warehouseId = warehouse._id;

    for (let i = unfulfilledItems.length - 1; i >= 0; i--) {
      const targetItem = unfulfilledItems[i];

      const inventoryQuery = WarehouseInventory.findOne({
        warehouse: warehouseId,
        sku: targetItem.sku
      });
      if (session) inventoryQuery.session(session);
      const inventory = await inventoryQuery;

      if (inventory && inventory.availableStock > 0) {
        const allocatedQty = Math.min(inventory.availableStock, targetItem.quantity);
        
        fulfillmentPlan.push({
          warehouseId,
          warehouseName: warehouse.name,
          sku: targetItem.sku,
          productId: targetItem.productId,
          quantity: allocatedQty
        });

        targetItem.quantity -= allocatedQty;

        if (targetItem.quantity === 0) {
          unfulfilledItems.splice(i, 1);
        }
      }
    }
  }

  if (unfulfilledItems.length > 0) {
    throw inventoryConflict(`Insufficient aggregate stock to fulfill current order. Unfulfilled: ${JSON.stringify(unfulfilledItems)}`);
  }

  return fulfillmentPlan;
}

/**
 * Creates temporary reservations for cart items, incrementing reservedStock in WarehouseInventory.
 */
async function releaseCartReservations(cartId, userId, session) {
  const existingReservations = await StockReservation.find({ cartId, user: userId }).session(session);
  for (const reservation of existingReservations) {
    const releasedInventory = await WarehouseInventory.findOneAndUpdate(
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
    if (!releasedInventory) {
      throw inventoryConflict(`Unable to release existing reservation for SKU ${reservation.sku}.`);
    }
  }
  if (existingReservations.length) {
    await StockReservation.deleteMany({ cartId, user: userId }).session(session);
  }
}

async function reserveStock(cartId, userId, allocations, session) {
  const expiryTime = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes TTL
  await releaseCartReservations(cartId, userId, session);

  for (const alloc of allocations) {
    // Find and update atomically
    const updatedInventory = await WarehouseInventory.findOneAndUpdate(
      {
        warehouse: alloc.warehouseId,
        sku: alloc.sku,
        availableStock: { $gte: alloc.quantity }
      },
      {
        $inc: { 
          reservedStock: alloc.quantity,
          availableStock: -alloc.quantity 
        }
      },
      { session, new: true }
    );

    if (!updatedInventory) {
      throw inventoryConflict(`Stock allocation failed for SKU ${alloc.sku} in Warehouse ${alloc.warehouseId}. Insufficient stock.`);
    }

    // Write reservation record
    await StockReservation.findOneAndUpdate(
      { cartId, sku: alloc.sku, warehouse: alloc.warehouseId },
      {
        $set: {
          user: userId,
          sku: alloc.sku,
          warehouse: alloc.warehouseId,
          quantity: alloc.quantity,
          expiresAt: expiryTime
        }
      },
      { session, upsert: true, new: true }
    );
  }
}

/**
 * Releases stock from expired reservations
 */
async function releaseExpiredReservations() {
  const expiredRes = await StockReservation.find({ expiresAt: { $lte: new Date() } }).select("_id");

  for (const res of expiredRes) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const reservation = await StockReservation.findOneAndDelete({
        _id: res._id,
        expiresAt: { $lte: new Date() }
      }).session(session);
      if (!reservation) {
        await session.commitTransaction();
        continue;
      }

      // Revert reservation levels in WarehouseInventory
      const inventory = await WarehouseInventory.findOneAndUpdate(
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
      if (!inventory) {
        throw inventoryConflict(`Reserved stock is inconsistent for reservation ${reservation._id}.`);
      }

      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
      console.error(`Failed to release reservation ${res._id}:`, error);
    } finally {
      session.endSession();
    }
  }
}

/**
 * Triggers reorder warning/notification if stock falls below ROP.
 */
async function checkAndAlertReorder(warehouseId, sku) {
  const inventory = await WarehouseInventory.findOne({ warehouse: warehouseId, sku });
  
  if (inventory && inventory.availableStock <= inventory.reorderPoint) {
    console.warn(`[REORDER ALERT] Stock low for SKU: ${sku} at Warehouse: ${warehouseId}. Current available: ${inventory.availableStock}, Reorder Point: ${inventory.reorderPoint}`);
    
    // Attempt notifications integration if available
    try {
      const { createNotification } = require("./notifications");
      // Find warehouse admin or product seller
      const Product = mongoose.model('Product');
      const product = await Product.findOne({ sku });
      if (product && product.seller) {
        await createNotification({
          user: product.seller,
          title: "Low Stock Alert (Warehouse)",
          message: `SKU "${sku}" has reached a low stock level in warehouse (${inventory.availableStock} available).`,
          type: "stock"
        });
      }
    } catch (err) {
      // Ignore if notifications utility is not configured or fails
    }
  }
}

module.exports = {
  routeOrderInventory,
  releaseCartReservations,
  reserveStock,
  releaseExpiredReservations,
  checkAndAlertReorder
};
