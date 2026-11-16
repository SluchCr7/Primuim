const ProductModel = require('../models/Product');
const SellerInventory = require('../models/SellerInventory');
const InventoryMovement = require('../models/InventoryMovement');
const StockReservation = require('../models/StockReservation');

const Product = ProductModel.Product || ProductModel;

function inventoryConflict(message, statusCode = 409) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function withSession(query, session) {
  return session ? query.session(session) : query;
}

function normalizedSku(sku) {
  return String(sku || '').trim().toUpperCase();
}

async function resolveSellerSku({ seller, product, sku, warehouse = null, session }) {
  if (!seller || !product || !sku) {
    throw inventoryConflict('Seller, product, and SKU are required.', 400);
  }

  const productDoc = await withSession(Product.findOne({ _id: product, seller }), session);
  if (!productDoc) {
    throw inventoryConflict('The product does not belong to the specified seller.', 403);
  }
  if ((productDoc.inventoryMode || 'seller-managed') !== 'seller-managed') {
    throw inventoryConflict('This product uses warehouse-managed inventory.');
  }

  const requestedSku = normalizedSku(sku);
  let variant = null;
  if (productDoc.variants && productDoc.variants.length) {
    variant = productDoc.variants.find(item => normalizedSku(item.sku) === requestedSku);
    if (!variant) {
      throw inventoryConflict('SKU does not identify a variant belonging to this product.', 400);
    }
  } else {
    const simpleSku = normalizedSku(productDoc.sku || productDoc.slug);
    if (requestedSku !== simpleSku) {
      throw inventoryConflict('SKU does not belong to this product.', 400);
    }
  }

  return {
    productDoc,
    sku: requestedSku,
    variantSku: variant ? requestedSku : null,
    warehouse: warehouse || null,
  };
}

async function findSellerInventory({ seller, product, sku, warehouse = null, session }) {
  return withSession(
    SellerInventory.findOne({ seller, product, sku: normalizedSku(sku), warehouse: warehouse || null }),
    session
  );
}

async function getSellerInventory({ seller, product, sku, warehouse = null, session }) {
  const resolved = await resolveSellerSku({ seller, product, sku, warehouse, session });
  return findSellerInventory({ seller, product, sku: resolved.sku, warehouse, session });
}

async function ensureSellerInventory({ seller, product, sku, warehouse = null, lowStockThreshold = 0, session }) {
  const resolved = await resolveSellerSku({ seller, product, sku, warehouse, session });
  let inventory = await findSellerInventory({ seller, product, sku: resolved.sku, warehouse, session });
  if (inventory) {
    return { inventory, ...resolved };
  }

  try {
    const created = new SellerInventory({
      seller,
      product,
      sku: resolved.sku,
      variant: resolved.variantSku,
      warehouse: warehouse || null,
      declaredStock: 0,
      reservedStock: 0,
      availableStock: 0,
      stockInitialized: false,
      lowStockThreshold,
      inventoryStatus: 'out_of_stock',
      lastStockUpdate: new Date(),
    });
    await created.save(session ? { session } : undefined);
    inventory = created;
  } catch (error) {
    if (error.code !== 11000) {
      throw error;
    }
    inventory = await findSellerInventory({ seller, product, sku: resolved.sku, warehouse, session });
    if (!inventory) {
      throw error;
    }
  }

  return { inventory, ...resolved };
}

async function logMovement({ inventory, previousQuantity, changedQuantity, newQuantity, movementType, reason, referenceType, referenceId, actor, session, idempotencyKey }) {
  const movement = {
    seller: inventory.seller,
    product: inventory.product,
    sku: inventory.sku,
    warehouse: inventory.warehouse || null,
    previousQuantity,
    changedQuantity,
    newQuantity,
    movementType,
    reason: reason || movementType,
    referenceType: referenceType || 'manual',
    referenceId: referenceId || '',
    actor: actor || 'system',
    idempotencyKey,
  };
  await InventoryMovement.create([movement], session ? { session } : {});
}

async function updateLegacyProductStock(productId, sellerId, session) {
  const query = Product.findOne({ _id: productId, seller: sellerId });
  const product = await withSession(query, session);
  if (!product) {
    return;
  }

  const inventoryQuery = SellerInventory.find({ product: productId, seller: sellerId, warehouse: null });
  const inventories = await withSession(inventoryQuery, session);
  product.stock = inventories.reduce((sum, inventory) => sum + Number(inventory.availableStock || 0), 0);
  product.reservedStock = inventories.reduce((sum, inventory) => sum + Number(inventory.reservedStock || 0), 0);
  const availableBySku = new Map(
    inventories.map(inventory => [normalizedSku(inventory.sku), Number(inventory.availableStock || 0)])
  );
  product.variants = (product.variants || []).map(variant => ({
    ...variant.toObject?.() || variant,
    stock: availableBySku.get(normalizedSku(variant.sku)) || 0,
  }));
  await product.save(session ? { session } : undefined);
}

async function getAvailableStock({ seller, product, sku, warehouse = null, user, cartId, session }) {
  const resolved = await resolveSellerSku({ seller, product, sku, warehouse, session });
  const inventory = await findSellerInventory({ seller, product, sku: resolved.sku, warehouse, session });
  const available = inventory ? Math.max(0, inventory.declaredStock - inventory.reservedStock) : 0;
  if (!inventory || !user || !cartId) {
    return available;
  }
  const ownReservations = await withSession(
    StockReservation.find({
      user,
      cartId: String(cartId),
      product,
      sku: resolved.sku,
      source: 'seller-managed',
      status: 'active',
      expiresAt: { $gt: new Date() },
    }),
    session
  );
  return available + ownReservations.reduce((sum, reservation) => sum + reservation.quantity, 0);
}

async function initializeSellerInventory({ seller, product, sku, quantity = 0, warehouse = null, lowStockThreshold = 0, actor = 'seller', reason, referenceType = 'product', referenceId = '', session }) {
  if (!Number.isSafeInteger(quantity) || quantity < 0) {
    throw inventoryConflict('Initial stock must be a non-negative whole number.', 400);
  }
  if (!Number.isFinite(lowStockThreshold) || lowStockThreshold < 0) {
    throw inventoryConflict('Low-stock threshold must be a non-negative number.', 400);
  }
  const { inventory } = await ensureSellerInventory({
    seller,
    product,
    sku,
    warehouse,
    lowStockThreshold,
    session,
  });
  if (inventory.stockInitialized) {
    throw inventoryConflict('Seller inventory has already been initialized.', 409);
  }
  let updated = inventory;
  const isPendingRetry =
    inventory.declaredStock === quantity &&
    inventory.reservedStock === 0 &&
    inventory.availableStock === quantity;
  if (!isPendingRetry) {
    if (inventory.declaredStock !== 0 || inventory.reservedStock !== 0) {
      throw inventoryConflict('Pending inventory stock does not match the requested initialization.', 409);
    }
    updated = await SellerInventory.findOneAndUpdate(
      { _id: inventory._id, stockInitialized: false, declaredStock: 0, reservedStock: 0 },
      {
        $set: {
          declaredStock: quantity,
          availableStock: quantity,
          inventoryStatus: quantity > 0 ? 'active' : 'out_of_stock',
          lastStockUpdate: new Date(),
        },
      },
      { new: true, runValidators: true, ...(session ? { session } : {}) }
    );
    if (!updated) {
      throw inventoryConflict('Inventory changed concurrently; retry the stock initialization.', 409);
    }
  }
  if (quantity > 0) {
    const idempotencyKey = `seller-initial-stock:${updated._id}`;
    const existingMovement = await withSession(
      InventoryMovement.findOne({ idempotencyKey }),
      session
    );
    if (!existingMovement) {
      try {
        await logMovement({
          inventory: updated,
          previousQuantity: 0,
          changedQuantity: quantity,
          newQuantity: quantity,
          movementType: 'INITIAL_STOCK',
          reason,
          referenceType,
          referenceId,
          actor,
          session,
          idempotencyKey,
        });
      } catch (error) {
        if (error.code !== 11000) throw error;
        const concurrentMovement = await withSession(
          InventoryMovement.findOne({ idempotencyKey }),
          session
        );
        if (!concurrentMovement) throw error;
      }
    }
  }
  await updateLegacyProductStock(product, seller, session);
  const initialized = await SellerInventory.findOneAndUpdate(
    { _id: updated._id, stockInitialized: false, declaredStock: quantity, reservedStock: 0 },
    { $set: { stockInitialized: true } },
    { new: true, runValidators: true, ...(session ? { session } : {}) }
  );
  if (!initialized) {
    throw inventoryConflict('Inventory initialization changed concurrently; retry the operation.', 409);
  }
  return initialized;
}

async function setSellerStock({ seller, product, sku, quantity, warehouse = null, actor = 'seller', reason = 'SET_STOCK', referenceType = 'manual', referenceId = '', session }) {
  if (!Number.isSafeInteger(quantity) || quantity < 0) {
    throw inventoryConflict('Stock must be a non-negative whole number.', 400);
  }
  const { inventory } = await ensureSellerInventory({ seller, product, sku, warehouse, session });
  if (inventory.declaredStock === quantity) {
    let unchangedInventory = inventory;
    if (inventory.stockInitialized === false) {
      unchangedInventory = await SellerInventory.findOneAndUpdate(
        { _id: inventory._id, stockInitialized: false, declaredStock: quantity },
        { $set: { stockInitialized: true, lastStockUpdate: new Date() } },
        { new: true, ...(session ? { session } : {}) }
      );
      if (!unchangedInventory) {
        throw inventoryConflict('Inventory changed concurrently; retry the stock update.', 409);
      }
    }
    await updateLegacyProductStock(product, seller, session);
    return unchangedInventory;
  }
  const updated = await SellerInventory.findOneAndUpdate(
    {
      _id: inventory._id,
      $expr: { $lte: ['$reservedStock', quantity] },
    },
    [
      {
        $set: {
          declaredStock: quantity,
          availableStock: { $subtract: [quantity, '$reservedStock'] },
          inventoryStatus: { $cond: [{ $gt: [quantity, 0] }, 'active', 'out_of_stock'] },
          stockInitialized: true,
          lastStockUpdate: new Date(),
        },
      },
    ],
    { new: true, ...(session ? { session } : {}) }
  );
  if (!updated) {
    throw inventoryConflict('Stock cannot be set below the quantity currently reserved.', 409);
  }
  const previous = inventory.declaredStock;
  await logMovement({
    inventory: updated,
    previousQuantity: previous,
    changedQuantity: quantity - previous,
    newQuantity: quantity,
    movementType: 'MANUAL_ADJUSTMENT',
    reason,
    referenceType,
    referenceId,
    actor,
    session,
  });
  await updateLegacyProductStock(product, seller, session);
  return updated;
}

async function adjustSellerInventory({ seller, product, sku, quantity, warehouse = null, actor = 'seller', reason = 'MANUAL_ADJUSTMENT', referenceType = 'manual', referenceId = '', session }) {
  if (!Number.isSafeInteger(quantity) || quantity === 0) {
    throw inventoryConflict('Stock adjustment must be a non-zero whole number.', 400);
  }
  const { inventory } = await ensureSellerInventory({ seller, product, sku, warehouse, session });
  const updated = await SellerInventory.findOneAndUpdate(
    {
      _id: inventory._id,
      $expr: {
        $and: [
          { $gte: [{ $add: ['$declaredStock', quantity] }, 0] },
          { $gte: [{ $add: ['$declaredStock', quantity] }, '$reservedStock'] },
        ],
      },
    },
    {
      $inc: { declaredStock: quantity, availableStock: quantity },
      $set: { stockInitialized: true, lastStockUpdate: new Date() },
    },
    { new: true, runValidators: true, ...(session ? { session } : {}) }
  );
  if (!updated) {
    throw inventoryConflict('Adjustment would make stock negative or lower than reserved stock.', 409);
  }
  await logMovement({
    inventory: updated,
    previousQuantity: updated.declaredStock - quantity,
    changedQuantity: quantity,
    newQuantity: updated.declaredStock,
    movementType: quantity > 0 ? 'STOCK_INCREASE' : 'STOCK_DECREASE',
    reason,
    referenceType,
    referenceId,
    actor,
    session,
  });
  await updateLegacyProductStock(product, seller, session);
  return updated;
}

function reservationKey({ user, cartId, product, sku, warehouse = null }) {
  return [user, cartId, product, normalizedSku(sku), warehouse || 'seller'].join(':');
}

async function reserveSellerInventory({ seller, product, sku, quantity, user, cartId, variantSku, warehouse = null, expiresAt = new Date(Date.now() + 15 * 60 * 1000), actor = 'system', reason = 'ORDER_RESERVATION', referenceType = 'checkout', referenceId = '', session }) {
  if (!Number.isSafeInteger(quantity) || quantity < 1 || !user || !cartId) {
    throw inventoryConflict('A user, cart, and positive whole-number reservation quantity are required.', 400);
  }
  const { inventory, sku: resolvedSku, variantSku: resolvedVariantSku } = await ensureSellerInventory({ seller, product, sku, warehouse, session });
  const key = reservationKey({ user, cartId, product, sku: resolvedSku, warehouse });
  let reservation = await withSession(
    StockReservation.findOne({ reservationKey: key, status: 'active' }),
    session
  );
  const now = new Date();
  if (reservation && reservation.expiresAt <= now) {
    await releaseSellerReservation({ reservationId: reservation._id, expired: true, session });
    reservation = null;
  }
  if (reservation) {
    const delta = quantity - reservation.quantity;
    let updatedInventory = inventory;
    if (delta > 0) {
      updatedInventory = await SellerInventory.findOneAndUpdate(
        {
          _id: inventory._id,
          $expr: { $gte: [{ $subtract: ['$declaredStock', '$reservedStock'] }, delta] },
        },
        { $inc: { reservedStock: delta, availableStock: -delta }, $set: { stockInitialized: true, lastStockUpdate: now } },
        { new: true, ...(session ? { session } : {}) }
      );
      if (!updatedInventory) {
        throw inventoryConflict(`Insufficient seller stock for SKU ${resolvedSku}.`);
      }
    } else if (delta < 0) {
      updatedInventory = await SellerInventory.findOneAndUpdate(
        { _id: inventory._id, reservedStock: { $gte: -delta } },
        { $inc: { reservedStock: delta, availableStock: -delta }, $set: { stockInitialized: true, lastStockUpdate: now } },
        { new: true, ...(session ? { session } : {}) }
      );
      if (!updatedInventory) {
        throw inventoryConflict(`Reservation quantity changed concurrently for SKU ${resolvedSku}.`);
      }
    }
    if (delta > 0 && !updatedInventory) {
      throw inventoryConflict(`Insufficient seller stock for SKU ${resolvedSku}.`);
    }
    reservation.quantity = quantity;
    reservation.expiresAt = expiresAt;
    await reservation.save(session ? { session } : undefined);
    if (delta !== 0) {
      await logMovement({
        inventory: updatedInventory,
        previousQuantity: inventory.reservedStock,
        changedQuantity: delta,
        newQuantity: updatedInventory.reservedStock,
        movementType: delta > 0 ? 'ORDER_RESERVATION' : 'RESERVATION_RELEASE',
        reason,
        referenceType,
        referenceId,
        actor,
        session,
      });
    }
    return reservation;
  }

  const reservedInventory = await SellerInventory.findOneAndUpdate(
    {
      _id: inventory._id,
      $expr: { $gte: [{ $subtract: ['$declaredStock', '$reservedStock'] }, quantity] },
    },
    { $inc: { reservedStock: quantity, availableStock: -quantity }, $set: { stockInitialized: true, lastStockUpdate: now } },
    { new: true, ...(session ? { session } : {}) }
  );
  if (!reservedInventory) {
    throw inventoryConflict(`Insufficient seller stock for SKU ${resolvedSku}.`);
  }

  [reservation] = await StockReservation.create([{
    cartId: String(cartId),
    user,
    seller,
    product,
    sku: resolvedSku,
    variantSku: variantSku || resolvedVariantSku,
    source: 'seller-managed',
    inventory: inventory._id,
    inventoryModel: 'SellerInventory',
    warehouse: warehouse || null,
    quantity,
    reservationKey: key,
    status: 'active',
    expiresAt,
  }], session ? { session } : {});
  await logMovement({
    inventory: reservedInventory,
    previousQuantity: reservedInventory.reservedStock - quantity,
    changedQuantity: quantity,
    newQuantity: reservedInventory.reservedStock,
    movementType: 'ORDER_RESERVATION',
    reason,
    referenceType,
    referenceId,
    actor,
    session,
  });
  return reservation;
}

async function commitSellerReservation({ reservationId, session, actor = 'system', referenceType = 'order', referenceId = '' }) {
  const reservationQuery = StockReservation.findById(reservationId);
  let reservation = await withSession(reservationQuery, session);
  if (!reservation || reservation.source !== 'seller-managed') {
    throw inventoryConflict('Seller stock reservation was not found.', 404);
  }
  await resolveSellerSku({
    seller: reservation.seller,
    product: reservation.product,
    sku: reservation.sku,
    session,
  });
  if (reservation.status === 'committed') {
    return reservation;
  }
  if (reservation.status !== 'active' || reservation.expiresAt <= new Date()) {
    throw inventoryConflict('The stock reservation is no longer active.', 409);
  }
  const claimed = await StockReservation.findOneAndUpdate(
    { _id: reservation._id, status: 'active', expiresAt: { $gt: new Date() } },
    { $set: { status: 'committed' } },
    { new: true, ...(session ? { session } : {}) }
  );
  if (!claimed) {
    throw inventoryConflict('The stock reservation has expired or was already processed.', 409);
  }
  const inventory = await SellerInventory.findOneAndUpdate(
    {
      _id: claimed.inventory,
      reservedStock: { $gte: claimed.quantity },
      declaredStock: { $gte: claimed.quantity },
    },
    {
      $inc: { declaredStock: -claimed.quantity, reservedStock: -claimed.quantity },
      $set: {
        inventoryStatus: 'active',
        stockInitialized: true,
        lastStockUpdate: new Date(),
      },
    },
    { new: true, ...(session ? { session } : {}) }
  );
  if (!inventory) {
    throw inventoryConflict(`Reserved stock is inconsistent for SKU ${claimed.sku}.`);
  }
  await logMovement({
    inventory,
    previousQuantity: inventory.declaredStock + claimed.quantity,
    changedQuantity: -claimed.quantity,
    newQuantity: inventory.declaredStock,
    movementType: 'ORDER_COMMIT',
    reason: 'ORDER_COMMIT',
    referenceType,
    referenceId: referenceId || String(claimed._id),
    actor,
    session,
  });
  await updateLegacyProductStock(claimed.product, claimed.seller, session);
  reservation = claimed;
  return reservation;
}

async function releaseSellerReservation({ reservationId, expired = false, session, actor = 'system', reason, referenceType = 'checkout', referenceId = '' }) {
  let reservation = reservationId
    ? await withSession(StockReservation.findById(reservationId), session)
    : null;
  if (!reservation || reservation.source !== 'seller-managed') {
    return null;
  }
  if (reservation.status === 'released' || reservation.status === 'expired') {
    return reservation;
  }
  if (reservation.status !== 'active') {
    throw inventoryConflict('Only active reservations can be released.', 409);
  }
  await resolveSellerSku({
    seller: reservation.seller,
    product: reservation.product,
    sku: reservation.sku,
    session,
  });
  const nextStatus = expired || reservation.expiresAt <= new Date() ? 'expired' : 'released';
  const claimed = await StockReservation.findOneAndUpdate(
    { _id: reservation._id, status: 'active' },
    { $set: { status: nextStatus } },
    { new: true, ...(session ? { session } : {}) }
  );
  if (!claimed) {
    return withSession(StockReservation.findById(reservation._id), session);
  }
  const inventory = await SellerInventory.findOneAndUpdate(
    { _id: claimed.inventory, reservedStock: { $gte: claimed.quantity } },
    {
      $inc: { reservedStock: -claimed.quantity, availableStock: claimed.quantity },
      $set: { stockInitialized: true, lastStockUpdate: new Date() },
    },
    { new: true, ...(session ? { session } : {}) }
  );
  if (!inventory) {
    throw inventoryConflict(`Reservation release is inconsistent for SKU ${claimed.sku}.`);
  }
  await logMovement({
    inventory,
    previousQuantity: inventory.reservedStock + claimed.quantity,
    changedQuantity: -claimed.quantity,
    newQuantity: inventory.reservedStock,
    movementType: 'RESERVATION_RELEASE',
    reason: reason || nextStatus.toUpperCase(),
    referenceType,
    referenceId: referenceId || String(claimed._id),
    actor,
    session,
  });
  return claimed;
}

async function restoreSellerStock({ seller, product, sku, quantity, warehouse = null, actor = 'system', reason = 'SELLABLE_RETURN', referenceType = 'return', referenceId = '', session, idempotencyKey }) {
  if (!Number.isSafeInteger(quantity) || quantity < 1) {
    throw inventoryConflict('Restored stock must be a positive whole number.', 400);
  }
  if (idempotencyKey) {
    const existing = await withSession(InventoryMovement.findOne({ idempotencyKey }), session);
    if (existing) {
      return findSellerInventory({ seller, product, sku, warehouse, session });
    }
  }
  const { inventory } = await ensureSellerInventory({ seller, product, sku, warehouse, session });
  const updated = await SellerInventory.findOneAndUpdate(
    { _id: inventory._id },
    {
      $inc: { declaredStock: quantity, availableStock: quantity },
      $set: { inventoryStatus: 'active', stockInitialized: true, lastStockUpdate: new Date() },
    },
    { new: true, runValidators: true, ...(session ? { session } : {}) }
  );
  await logMovement({
    inventory: updated,
    previousQuantity: updated.declaredStock - quantity,
    changedQuantity: quantity,
    newQuantity: updated.declaredStock,
    movementType: 'RESTORE_STOCK',
    reason,
    referenceType,
    referenceId,
    actor,
    session,
    idempotencyKey,
  });
  await updateLegacyProductStock(product, seller, session);
  return updated;
}

async function syncSellerProductStock({ seller, product, session }) {
  await updateLegacyProductStock(product, seller, session);
}

async function releaseExpiredSellerReservations({ limit = 100 } = {}) {
  const expired = await StockReservation.find({
    source: 'seller-managed',
    status: 'active',
    expiresAt: { $lte: new Date() },
  }).limit(limit).select('_id');
  for (const { _id } of expired) {
    const session = await StockReservation.startSession();
    try {
      session.startTransaction();
      await releaseSellerReservation({ reservationId: _id, expired: true, session });
      await session.commitTransaction();
    } catch (error) {
      if (session.inTransaction()) await session.abortTransaction();
      if (error.code !== 112 && error.code !== 11000) throw error;
    } finally {
      await session.endSession();
    }
  }
  return expired.length;
}

async function releaseSellerCartReservations({ cartId, user, keepKeys = [], session }) {
  const reservations = await withSession(
    StockReservation.find({
      cartId: String(cartId),
      user,
      source: 'seller-managed',
      status: 'active',
    }),
    session
  );
  const keep = new Set(keepKeys);
  for (const reservation of reservations) {
    if (!keep.has(reservation.reservationKey)) {
      await releaseSellerReservation({ reservationId: reservation._id, session });
    }
  }
}

module.exports = {
  getSellerInventory,
  ensureSellerInventory,
  initializeSellerInventory,
  setSellerStock,
  adjustSellerInventory,
  getAvailableStock,
  reserveSellerInventory,
  commitSellerReservation,
  releaseSellerReservation,
  restoreSellerStock,
  syncSellerProductStock,
  releaseExpiredSellerReservations,
  releaseSellerCartReservations,
  resolveSellerSku,
  reservationKey,
};
