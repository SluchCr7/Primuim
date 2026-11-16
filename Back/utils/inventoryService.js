const Warehouse = require('../models/Warehouse');
const WarehouseInventory = require('../models/WarehouseInventory');
const InventoryMovement = require('../models/InventoryMovement');
const StockReservation = require('../models/StockReservation');
const ProductModel = require('../models/Product');
const mongoose = require('mongoose');
const sellerInventoryService = require('./sellerInventoryService');

function inventoryConflict(message, statusCode = 409) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
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
        product: targetItem.productId,
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

async function adjustWarehouseInventory({ seller, product, warehouse, sku, operation, quantity, actor = 'admin', reason = 'MANUAL_ADJUSTMENT', referenceType = 'manual', referenceId = '', session }) {
  const Product = ProductModel.Product || ProductModel;
  const productDoc = await Product.findOne({ _id: product, seller }).session(session);
  if (!productDoc) {
    throw inventoryConflict('The product does not belong to the specified seller.', 403);
  }
  if (productDoc.inventoryMode !== 'warehouse-managed') {
    throw inventoryConflict('Warehouse stock cannot be changed for a seller-managed product.', 409);
  }
  const requestedSku = String(sku || '').trim().toUpperCase();
  const validSku = productDoc.variants?.length
    ? productDoc.variants.some(variant => String(variant.sku || '').toUpperCase() === requestedSku)
    : String(productDoc.sku || productDoc.slug || '').toUpperCase() === requestedSku;
  if (!validSku) {
    throw inventoryConflict('SKU does not belong to this product.', 400);
  }
  const activeWarehouse = await Warehouse.findOne({ _id: warehouse, isActive: true }).session(session);
  if (!activeWarehouse) {
    throw inventoryConflict('An active warehouse is required for warehouse-managed stock.', 400);
  }
  if (!Number.isSafeInteger(quantity) || quantity < 0 ||
      !['set', 'increase', 'decrease'].includes(operation) ||
      (operation !== 'set' && quantity === 0)) {
    throw inventoryConflict('Invalid stock operation or quantity.', 400);
  }

  let inventory = await WarehouseInventory.findOne({ warehouse, product, sku }).session(session);
  if (!inventory) {
    try {
      inventory = new WarehouseInventory({
        seller,
        warehouse,
        product,
        sku,
        physicalStock: 0,
        reservedStock: 0,
        availableStock: 0,
      });
      await inventory.save({ session });
    } catch (error) {
      if (error.code !== 11000) throw error;
      inventory = await WarehouseInventory.findOne({ warehouse, product, sku }).session(session);
      if (!inventory) throw error;
    }
  }

  const delta = operation === 'increase'
    ? quantity
    : operation === 'decrease'
      ? -quantity
      : quantity - inventory.physicalStock;
  const updated = operation === 'set'
    ? await WarehouseInventory.findOneAndUpdate(
      { _id: inventory._id, $expr: { $lte: ['$reservedStock', quantity] } },
      [{
        $set: {
          physicalStock: quantity,
          availableStock: { $subtract: [quantity, '$reservedStock'] },
        },
      }],
      { new: true, session }
    )
    : await WarehouseInventory.findOneAndUpdate(
      {
        _id: inventory._id,
        $expr: {
          $and: [
            { $gte: [{ $add: ['$physicalStock', delta] }, 0] },
            { $gte: [{ $add: ['$physicalStock', delta] }, '$reservedStock'] },
          ],
        },
      },
      { $inc: { physicalStock: delta, availableStock: delta } },
      { new: true, session }
    );
  if (!updated) {
    throw inventoryConflict('Stock cannot be changed below the quantity currently reserved.', 409);
  }
  await InventoryMovement.create([{
    seller,
    product,
    sku,
    warehouse,
    previousQuantity: inventory.physicalStock,
    changedQuantity: delta,
    newQuantity: updated.physicalStock,
    movementType: operation === 'increase' ? 'STOCK_INCREASE' : operation === 'decrease' ? 'STOCK_DECREASE' : 'MANUAL_ADJUSTMENT',
    reason,
    referenceType,
    referenceId,
    actor,
  }], { session });
  await syncWarehouseProductStock(product, seller, session);
  return updated;
}

async function syncWarehouseProductStock(productId, sellerId, session) {
  const Product = ProductModel.Product || ProductModel;
  const product = await Product.findOne({ _id: productId, seller: sellerId }).session(session);
  if (!product) return;
  const activeWarehouses = await Warehouse.find({ isActive: true }).select('_id').session(session);
  const inventories = activeWarehouses.length
    ? await WarehouseInventory.find({
      product: productId,
      warehouse: { $in: activeWarehouses.map(warehouse => warehouse._id) },
    }).session(session)
    : [];
  product.stock = inventories.reduce((sum, inventory) => sum + Number(inventory.availableStock || 0), 0);
  product.reservedStock = inventories.reduce((sum, inventory) => sum + Number(inventory.reservedStock || 0), 0);
  const availableBySku = new Map(
    inventories.map(inventory => [String(inventory.sku || '').toUpperCase(), Number(inventory.availableStock || 0)])
  );
  product.variants = (product.variants || []).map(variant => ({
    ...variant.toObject?.() || variant,
    stock: availableBySku.get(String(variant.sku || '').toUpperCase()) || 0,
  }));
  await product.save({ session });
}

async function restoreWarehouseStock({ seller, product, warehouse, sku, quantity, reason = 'RESTORE_STOCK', referenceType = 'order', referenceId = '', session, idempotencyKey }) {
  const Product = ProductModel.Product || ProductModel;
  const productDoc = await Product.findOne({ _id: product, seller }).session(session);
  if (!productDoc || productDoc.inventoryMode !== 'warehouse-managed') {
    throw inventoryConflict('The product is not owned by the specified seller in warehouse-managed mode.', 409);
  }
  const requestedSku = String(sku || '').trim().toUpperCase();
  const skuBelongsToProduct = productDoc.variants?.length
    ? productDoc.variants.some(variant => String(variant.sku || '').toUpperCase() === requestedSku)
    : String(productDoc.sku || productDoc.slug || '').toUpperCase() === requestedSku;
  if (!skuBelongsToProduct) {
    throw inventoryConflict('SKU does not belong to this product.', 400);
  }
  if (!Number.isSafeInteger(quantity) || quantity < 1) {
    throw inventoryConflict('Restored stock must be a positive whole number.', 400);
  }
  if (idempotencyKey) {
    const existingMovement = await InventoryMovement.findOne({ idempotencyKey }).session(session);
    if (existingMovement) {
      return WarehouseInventory.findOne({ warehouse, product, sku }).session(session);
    }
  }
  const inventory = await WarehouseInventory.findOneAndUpdate(
    { warehouse, product, sku },
    { $inc: { physicalStock: quantity, availableStock: quantity } },
    { new: true, session }
  );
  if (!inventory) {
    throw inventoryConflict(`Warehouse inventory was not found for SKU ${sku}.`);
  }
  await InventoryMovement.create([{
    seller,
    product,
    sku,
    warehouse,
    previousQuantity: inventory.physicalStock - quantity,
    changedQuantity: quantity,
    newQuantity: inventory.physicalStock,
    movementType: 'RESTORE_STOCK',
    reason,
    referenceType,
    referenceId,
    actor: 'system',
    idempotencyKey,
  }], { session });
  await syncWarehouseProductStock(product, seller, session);
  return inventory;
}

async function releaseWarehouseReservation(reservation, { session, expired = false } = {}) {
  const current = await StockReservation.findById(reservation._id).session(session);
  if (!current || current.status !== 'active') {
    return current;
  }
  const updatedInventory = await WarehouseInventory.findOneAndUpdate(
    {
      ...(current.inventory ? { _id: current.inventory } : {}),
      warehouse: current.warehouse,
      sku: current.sku,
      reservedStock: { $gte: current.quantity },
    },
    {
      $inc: { reservedStock: -current.quantity, availableStock: current.quantity },
    },
    { new: true, session }
  );
  if (!updatedInventory) {
    throw inventoryConflict(`Unable to release warehouse reservation for SKU ${current.sku}.`);
  }
  const Product = ProductModel.Product || ProductModel;
  const ownerProduct = await Product.findById(updatedInventory.product).session(session);
  if (!ownerProduct?.seller) {
    throw inventoryConflict(`Seller information is missing for SKU ${current.sku}.`);
  }
  await InventoryMovement.create([{
    seller: current.seller || ownerProduct.seller,
    product: updatedInventory.product,
    sku: current.sku,
    warehouse: current.warehouse,
    previousQuantity: updatedInventory.reservedStock + current.quantity,
    changedQuantity: -current.quantity,
    newQuantity: updatedInventory.reservedStock,
    movementType: 'RESERVATION_RELEASE',
    reason: expired ? 'RESERVATION_EXPIRED' : 'RESERVATION_RELEASE',
    referenceType: 'reservation',
    referenceId: String(current._id),
    actor: 'system',
  }], { session });
  return StockReservation.findOneAndUpdate(
    { _id: current._id, status: 'active' },
    { $set: { status: expired || current.expiresAt <= new Date() ? 'expired' : 'released' } },
    { new: true, session }
  );
}

async function releaseCartReservations(cartId, userId, session) {
  const existingReservations = await StockReservation.find({
    cartId: String(cartId),
    user: userId,
    $and: [
      { $or: [{ source: 'warehouse-managed' }, { source: { $exists: false } }] },
      { $or: [{ status: 'active' }, { status: { $exists: false } }] },
    ],
  }).session(session);
  for (const reservation of existingReservations) {
    await releaseWarehouseReservation(reservation, { session });
  }
}

async function reserveStock(cartId, userId, allocations, session) {
  const Product = ProductModel.Product || ProductModel;
  const expiryTime = new Date(Date.now() + 15 * 60 * 1000);
  const reservations = [];

  for (const alloc of allocations) {
    const inventory = await WarehouseInventory.findOneAndUpdate(
      {
        warehouse: alloc.warehouseId,
        product: alloc.productId,
        sku: alloc.sku,
        availableStock: { $gte: alloc.quantity },
      },
      {
        $inc: { reservedStock: alloc.quantity, availableStock: -alloc.quantity },
      },
      { session, new: true }
    );
    if (!inventory) {
      throw inventoryConflict(`Insufficient warehouse stock for SKU ${alloc.sku}.`);
    }

    const product = await Product.findById(alloc.productId).session(session);
    if (!product || !product.seller) {
      throw inventoryConflict(`Seller information is missing for SKU ${alloc.sku}.`);
    }
    await InventoryMovement.create([{
      seller: product.seller,
      product: alloc.productId,
      sku: alloc.sku,
      warehouse: alloc.warehouseId,
      previousQuantity: inventory.reservedStock - alloc.quantity,
      changedQuantity: alloc.quantity,
      newQuantity: inventory.reservedStock,
      movementType: 'ORDER_RESERVATION',
      reason: 'ORDER_RESERVATION',
      referenceType: 'cart',
      referenceId: String(cartId),
      actor: 'system',
    }], { session });
    const key = [userId, cartId, alloc.productId, alloc.sku, alloc.warehouseId].join(':');
    const [reservation] = await StockReservation.create([{
      cartId: String(cartId),
      user: userId,
      seller: product.seller,
      product: alloc.productId,
      sku: alloc.sku,
      source: 'warehouse-managed',
      inventory: inventory._id,
      inventoryModel: 'WarehouseInventory',
      warehouse: alloc.warehouseId,
      quantity: alloc.quantity,
      reservationKey: key,
      status: 'active',
      expiresAt: expiryTime,
    }], { session });
    reservations.push(reservation);
  }
  return reservations;
}

async function reserveWarehouseCart({ cartId, userId, items, coordinates, session }) {
  await releaseCartReservations(cartId, userId, session);
  const allocations = await routeOrderInventory(items, coordinates, session);
  const reservations = await reserveStock(cartId, userId, allocations, session);
  return { allocations, reservations };
}

async function commitWarehouseCartItem({ cartId, userId, product, sku, quantity, session }) {
  const reservations = await StockReservation.find({
    cartId: String(cartId),
    user: userId,
    product,
    sku,
    source: 'warehouse-managed',
    status: 'active',
  }).session(session);
  const activeReservations = reservations.filter(item => item.expiresAt > new Date());
  if (activeReservations.reduce((sum, item) => sum + item.quantity, 0) !== quantity) {
    for (const reservation of reservations) {
      await releaseWarehouseReservation(reservation, {
        session,
        expired: reservation.expiresAt <= new Date(),
      });
    }
    return null;
  }

  const allocations = [];
  for (const reservation of activeReservations) {
    const claimed = await StockReservation.findOneAndUpdate(
      { _id: reservation._id, status: 'active', expiresAt: { $gt: new Date() } },
      { $set: { status: 'committed' } },
      { new: true, session }
    );
    if (!claimed) {
      throw inventoryConflict(`Warehouse reservation for SKU ${sku} is no longer active.`);
    }
    const inventory = await WarehouseInventory.findOneAndUpdate(
      {
        _id: reservation.inventory,
        physicalStock: { $gte: reservation.quantity },
        reservedStock: { $gte: reservation.quantity },
      },
      { $inc: { physicalStock: -reservation.quantity, reservedStock: -reservation.quantity } },
      { new: true, session }
    );
    if (!inventory) {
      throw inventoryConflict(`Warehouse reservation is inconsistent for SKU ${sku}.`);
    }
    const Product = ProductModel.Product || ProductModel;
    const productDoc = await Product.findById(reservation.product).session(session);
    if (!productDoc?.seller) {
      throw inventoryConflict(`Seller information is missing for SKU ${sku}.`);
    }
    await InventoryMovement.create([{
      seller: reservation.seller || productDoc.seller,
      product: reservation.product,
      sku: reservation.sku,
      warehouse: reservation.warehouse,
      previousQuantity: inventory.physicalStock + reservation.quantity,
      changedQuantity: -reservation.quantity,
      newQuantity: inventory.physicalStock,
      movementType: 'ORDER_COMMIT',
      reason: 'ORDER_COMMIT',
      referenceType: 'reservation',
      referenceId: String(reservation._id),
      actor: 'system',
    }], { session });
    allocations.push({
      warehouse: reservation.warehouse,
      inventory: inventory._id,
      sku: reservation.sku,
      quantity: reservation.quantity,
      returnedQuantity: 0,
      cancelledQuantity: 0,
    });
  }
  await syncWarehouseProductStock(product, reservations[0]?.seller, session);
  return allocations;
}

async function releaseExpiredReservations() {
  const expiredRes = await StockReservation.find({
    $and: [
      { $or: [{ source: 'warehouse-managed' }, { source: { $exists: false } }] },
      { $or: [{ status: 'active' }, { status: { $exists: false } }] },
    ],
    expiresAt: { $lte: new Date() }
  }).select('_id');

  for (const res of expiredRes) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const reservation = await StockReservation.findById(res._id).session(session);
      if (!reservation) {
        await session.commitTransaction();
        continue;
      }
      await releaseWarehouseReservation(reservation, { session, expired: true });
      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
      console.error(`Failed to release reservation ${res._id}:`, error);
    } finally {
      session.endSession();
    }
  }
  await sellerInventoryService.releaseExpiredSellerReservations();
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
  reserveWarehouseCart,
  commitWarehouseCartItem,
  adjustWarehouseInventory,
  restoreWarehouseStock,
  releaseExpiredReservations,
  checkAndAlertReorder,
  ...sellerInventoryService,
};
