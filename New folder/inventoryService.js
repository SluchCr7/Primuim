const Warehouse = require('../models/Warehouse');
const WarehouseInventory = require('../models/WarehouseInventory');
const SellerInventory = require('../models/SellerInventory');
const InventoryMovement = require('../models/InventoryMovement');
const StockReservation = require('../models/StockReservation');
const mongoose = require('mongoose');

function inventoryConflict(message) {
  const error = new Error(message);
  error.statusCode = 409;
  return error;
}

async function logInventoryMovement({
  seller,
  product,
  sku,
  previousQuantity,
  changedQuantity,
  newQuantity,
  movementType,
  reason,
  referenceType,
  referenceId,
  actor = 'system',
  warehouse = null,
}) {
  if (!seller || !product || !sku) {
    return null;
  }

  return InventoryMovement.create({
    seller,
    product,
    sku,
    previousQuantity,
    changedQuantity,
    newQuantity,
    movementType,
    reason,
    referenceType,
    referenceId,
    actor,
    warehouse,
  });
}

async function syncLegacyProductStock(productId, sellerId) {
  const ProductModel = require('../models/Product').Product || require('../models/Product');
  const product = await ProductModel.findById(productId);

  if (!product || !productId) {
    return null;
  }

  if (sellerId && product.seller && product.seller.toString() !== sellerId.toString()) {
    return product;
  }

  const sellerInventory = await SellerInventory.find({ product: productId, seller: sellerId || product.seller });
  const totalDeclaredStock = sellerInventory.reduce((sum, item) => sum + Number(item.declaredStock || 0), 0);
  product.stock = Math.max(0, totalDeclaredStock);
  await product.save();
  return product;
}

async function getSellerInventory({ seller, product, sku, warehouse = null }) {
  if (!seller || !product || !sku) {
    return null;
  }

  return SellerInventory.findOne({ seller, product, sku, warehouse: warehouse || null });
}

async function ensureSellerInventory({
  seller,
  product,
  sku,
  warehouse = null,
  lowStockThreshold = 0,
  status = 'active',
}) {
  if (!seller || !product || !sku) {
    throw inventoryConflict('Seller, product, and sku are required for seller inventory operations.');
  }

  const inventory = await getSellerInventory({ seller, product, sku, warehouse });
  if (inventory) {
    return inventory;
  }

  const created = await SellerInventory.create({
    seller,
    product,
    sku,
    warehouse,
    declaredStock: 0,
    reservedStock: 0,
    availableStock: 0,
    inventoryStatus: status,
    lowStockThreshold,
    lastStockUpdate: new Date(),
  });

  return created;
}

async function initializeSellerInventory({
  seller,
  product,
  sku,
  quantity = 0,
  warehouse = null,
  lowStockThreshold = 0,
  actor = 'seller',
  reason = 'INITIAL_STOCK',
  referenceType = 'product',
  referenceId = '',
}) {
  if (!seller || !product || !sku) {
    throw inventoryConflict('Seller, product, and SKU are required to initialize inventory.');
  }

  const safeQuantity = Number(quantity) || 0;
  if (safeQuantity < 0) {
    throw inventoryConflict('Seller inventory cannot be initialized with a negative quantity.');
  }

  let inventory = await ensureSellerInventory({ seller, product, sku, warehouse, lowStockThreshold, status: 'active' });
  const previous = Number(inventory.declaredStock || 0);

  if (safeQuantity > 0 || previous > 0) {
    inventory.declaredStock = safeQuantity || previous;
    inventory.lowStockThreshold = Number(lowStockThreshold || inventory.lowStockThreshold || 0);
    inventory.inventoryStatus = safeQuantity > 0 ? 'active' : 'out_of_stock';
    await inventory.save();
    await logInventoryMovement({
      seller,
      product,
      sku,
      previousQuantity: previous,
      changedQuantity: inventory.declaredStock - previous,
      newQuantity: inventory.declaredStock,
      movementType: 'INITIAL_STOCK',
      reason,
      referenceType,
      referenceId,
      actor,
      warehouse,
    });
    await syncLegacyProductStock(product, seller);
  }

  return inventory;
}

async function adjustSellerInventory({
  seller,
  product,
  sku,
  quantity,
  warehouse = null,
  actor = 'seller',
  reason = 'MANUAL_ADJUSTMENT',
  referenceType = 'manual',
  referenceId = '',
}) {
  const change = Number(quantity) || 0;
  if (!seller || !product || !sku) {
    throw inventoryConflict('Seller, product, and sku are required to adjust inventory.');
  }

  const inventory = await ensureSellerInventory({ seller, product, sku, warehouse, status: 'active' });
  const previousQuantity = Number(inventory.declaredStock || 0);
  const nextQuantity = Math.max(0, previousQuantity + change);

  inventory.declaredStock = nextQuantity;
  inventory.inventoryStatus = nextQuantity > 0 ? 'active' : 'out_of_stock';
  await inventory.save();

  await logInventoryMovement({
    seller,
    product,
    sku,
    previousQuantity,
    changedQuantity: change,
    newQuantity: nextQuantity,
    movementType: change >= 0 ? 'STOCK_INCREASE' : 'STOCK_DECREASE',
    reason,
    referenceType,
    referenceId,
    actor,
    warehouse,
  });
  await syncLegacyProductStock(product, seller);

  return inventory;
}

async function reserveSellerInventory({
  seller,
  product,
  sku,
  quantity,
  warehouse = null,
  actor = 'system',
  reason = 'ORDER_RESERVATION',
  referenceType = 'order',
  referenceId = '',
}) {
  const qty = Number(quantity) || 0;
  if (qty <= 0) {
    return null;
  }

  const inventory = await ensureSellerInventory({ seller, product, sku, warehouse, status: 'active' });
  const available = Math.max(0, (inventory.declaredStock || 0) - (inventory.reservedStock || 0));

  if (available < qty) {
    throw inventoryConflict(`Insufficient seller stock for SKU ${sku}. Available ${available}, requested ${qty}.`);
  }

  const previousReserved = Number(inventory.reservedStock || 0);
  inventory.reservedStock = previousReserved + qty;
  inventory.availableStock = Math.max(0, inventory.declaredStock - inventory.reservedStock);
  await inventory.save();

  await logInventoryMovement({
    seller,
    product,
    sku,
    previousQuantity: previousReserved,
    changedQuantity: qty,
    newQuantity: inventory.reservedStock,
    movementType: 'ORDER_RESERVATION',
    reason,
    referenceType,
    referenceId,
    actor,
    warehouse,
  });
  await syncLegacyProductStock(product, seller);

  return inventory;
}

async function releaseSellerReservation({
  seller,
  product,
  sku,
  quantity,
  warehouse = null,
  actor = 'system',
  reason = 'RESERVATION_RELEASE',
  referenceType = 'order',
  referenceId = '',
}) {
  const qty = Number(quantity) || 0;
  if (qty <= 0) {
    return null;
  }

  const inventory = await ensureSellerInventory({ seller, product, sku, warehouse, status: 'active' });
  const previousReserved = Number(inventory.reservedStock || 0);

  if (previousReserved < qty) {
    throw inventoryConflict(`Reservation release exceeds reserved stock for SKU ${sku}.`);
  }

  inventory.reservedStock = Math.max(0, previousReserved - qty);
  inventory.availableStock = Math.max(0, inventory.declaredStock - inventory.reservedStock);
  await inventory.save();

  await logInventoryMovement({
    seller,
    product,
    sku,
    previousQuantity: previousReserved,
    changedQuantity: -qty,
    newQuantity: inventory.reservedStock,
    movementType: 'RESERVATION_RELEASE',
    reason,
    referenceType,
    referenceId,
    actor,
    warehouse,
  });
  await syncLegacyProductStock(product, seller);

  return inventory;
}

async function commitSellerReservation({
  seller,
  product,
  sku,
  quantity,
  warehouse = null,
  actor = 'system',
  reason = 'ORDER_COMMIT',
  referenceType = 'order',
  referenceId = '',
}) {
  const qty = Number(quantity) || 0;
  if (qty <= 0) {
    return null;
  }

  const inventory = await ensureSellerInventory({ seller, product, sku, warehouse, status: 'active' });
  const previousReserved = Number(inventory.reservedStock || 0);
  const previousDeclared = Number(inventory.declaredStock || 0);

  if (previousReserved < qty) {
    throw inventoryConflict(`Cannot commit more reserved stock than is currently reserved for SKU ${sku}.`);
  }

  inventory.reservedStock = Math.max(0, previousReserved - qty);
  inventory.declaredStock = Math.max(0, previousDeclared - qty);
  inventory.availableStock = Math.max(0, inventory.declaredStock - inventory.reservedStock);
  inventory.inventoryStatus = inventory.declaredStock > 0 ? 'active' : 'out_of_stock';
  await inventory.save();

  await logInventoryMovement({
    seller,
    product,
    sku,
    previousQuantity: previousDeclared,
    changedQuantity: -qty,
    newQuantity: inventory.declaredStock,
    movementType: 'ORDER_COMMIT',
    reason,
    referenceType,
    referenceId,
    actor,
    warehouse,
  });
  await syncLegacyProductStock(product, seller);

  return inventory;
}

async function restoreSellerStock({
  seller,
  product,
  sku,
  quantity,
  warehouse = null,
  actor = 'system',
  reason = 'RESTORE_STOCK',
  referenceType = 'return',
  referenceId = '',
}) {
  const qty = Number(quantity) || 0;
  if (qty <= 0) {
    return null;
  }

  const inventory = await ensureSellerInventory({ seller, product, sku, warehouse, status: 'active' });
  const previous = Number(inventory.declaredStock || 0);
  inventory.declaredStock = previous + qty;
  inventory.inventoryStatus = inventory.declaredStock > 0 ? 'active' : 'out_of_stock';
  await inventory.save();

  await logInventoryMovement({
    seller,
    product,
    sku,
    previousQuantity: previous,
    changedQuantity: qty,
    newQuantity: inventory.declaredStock,
    movementType: 'RESTORE_STOCK',
    reason,
    referenceType,
    referenceId,
    actor,
    warehouse,
  });
  await syncLegacyProductStock(product, seller);

  return inventory;
}

async function getAvailableStock({ seller, product, sku, warehouse = null }) {
  const inventory = await getSellerInventory({ seller, product, sku, warehouse });
  if (!inventory) {
    return 0;
  }
  return Math.max(0, Number(inventory.availableStock || 0));
}

/**
 * Finds the optimal warehouses to fulfill items in an order based on customer location.
 * @param {Array} items - [{ sku, quantity }]
 * @param {Array} customerCoordinates - [longitude, latitude]
 */
async function routeOrderInventory(items, customerCoordinates, session) {
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
    const query = Warehouse.find({ isActive: true });
    if (session) query.session(session);
    nearbyWarehouses = await query;
  }

  if (!nearbyWarehouses.length) {
    throw inventoryConflict("No active fulfillment warehouses found.");
  }

  const fulfillmentPlan = [];
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
  const expiryTime = new Date(Date.now() + 15 * 60 * 1000);
  await releaseCartReservations(cartId, userId, session);

  for (const alloc of allocations) {
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

async function releaseExpiredReservations() {
  const expiredRes = await StockReservation.find({ expiresAt: { $lte: new Date() } }).select('_id');

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

async function checkAndAlertReorder(warehouseId, sku) {
  const inventory = await WarehouseInventory.findOne({ warehouse: warehouseId, sku });

  if (inventory && inventory.availableStock <= inventory.reorderPoint) {
    console.warn(`[REORDER ALERT] Stock low for SKU: ${sku} at Warehouse: ${warehouseId}. Current available: ${inventory.availableStock}, Reorder Point: ${inventory.reorderPoint}`);

    try {
      const { createNotification } = require('./notifications');
      const Product = mongoose.model('Product');
      const product = await Product.findOne({ sku });
      if (product && product.seller) {
        await createNotification({
          user: product.seller,
          title: 'Low Stock Alert (Warehouse)',
          message: `SKU "${sku}" has reached a low stock level in warehouse (${inventory.availableStock} available).`,
          type: 'stock'
        });
      }
    } catch (err) {
      // Ignore if notifications utility is not configured or fails.
    }
  }
}

module.exports = {
  routeOrderInventory,
  releaseCartReservations,
  reserveStock,
  releaseExpiredReservations,
  checkAndAlertReorder,
  getSellerInventory,
  ensureSellerInventory,
  initializeSellerInventory,
  adjustSellerInventory,
  reserveSellerInventory,
  releaseSellerReservation,
  commitSellerReservation,
  restoreSellerStock,
  getAvailableStock,
  syncLegacyProductStock,
};
