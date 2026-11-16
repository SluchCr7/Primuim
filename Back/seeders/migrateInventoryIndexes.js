const mongoose = require("mongoose");

mongoose.set("autoIndex", false);

const connectDB = require("../config/db");
const { Product } = require("../models/Product");
const SellerInventory = require("../models/SellerInventory");
const WarehouseInventory = require("../models/WarehouseInventory");
const StockReservation = require("../models/StockReservation");
const InventoryMovement = require("../models/InventoryMovement");

const sameKeys = (index, expected) =>
  JSON.stringify(Object.keys(index.key || {})) === JSON.stringify(expected);

const getIndexes = async collection => {
  try {
    return await collection.indexes();
  } catch (error) {
    if (error.code === 26) return [];
    throw error;
  }
};

const dropLegacyUniqueIndex = async (collection, expectedKeys) => {
  const indexes = await getIndexes(collection);
  const legacyIndex = indexes.find(index =>
    index.unique && sameKeys(index, expectedKeys)
  );
  if (legacyIndex) {
    await collection.dropIndex(legacyIndex.name);
    console.log(`Dropped legacy index ${legacyIndex.name}.`);
  }
};

const ensureActiveReservationKeys = async () => {
  const collection = StockReservation.collection;
  const activeReservations = await collection.find({
    expiresAt: { $gt: new Date() },
    $and: [
      { $or: [{ status: "active" }, { status: { $exists: false } }] },
      {
        $or: [
          { reservationKey: { $exists: false } },
          { reservationKey: null },
          { status: { $exists: false } },
        ],
      },
    ],
  }).toArray();

  for (const reservation of activeReservations) {
    const sku = String(reservation.sku || "").trim().toUpperCase();
    if (!reservation.user || !reservation.cartId || !sku) {
      throw new Error(`Active reservation ${reservation._id} is missing user, cart, or SKU.`);
    }
    let productId = reservation.product;
    let sellerId = reservation.seller;
    if (!productId) {
      const sourceSku = String(reservation.sku).trim();
      const matches = await Product.collection.find({
        $or: [
          { sku: { $in: [sourceSku, sku] } },
          { "variants.sku": { $in: [sourceSku, sku] } },
          { slug: { $in: [sourceSku, sourceSku.toLowerCase()] } },
        ],
      }).toArray();
      if (matches.length !== 1) {
        throw new Error(`Active reservation ${reservation._id} cannot be matched to exactly one product.`);
      }
      productId = matches[0]._id;
      sellerId = sellerId || matches[0].seller;
    }
    if (!sellerId) {
      throw new Error(`Active reservation ${reservation._id} has no seller reference.`);
    }
    const warehouse = reservation.warehouse || null;
    const key = reservation.reservationKey || [
        reservation.user,
        reservation.cartId,
        productId,
        sku,
        warehouse || "seller",
      ].join(":");
    const source = reservation.source ||
      (reservation.inventoryModel === "SellerInventory" ? "seller-managed" : "warehouse-managed");
    const inventoryModel = reservation.inventoryModel ||
      (source === "seller-managed" ? "SellerInventory" : "WarehouseInventory");
    let inventoryId = reservation.inventory;
    if (!inventoryId) {
      const inventoryCollection = source === "seller-managed"
        ? SellerInventory.collection
        : WarehouseInventory.collection;
      const inventoryFilter = {
        product: productId,
        sku: { $in: [String(reservation.sku).trim(), sku] },
        ...(source === "seller-managed"
          ? { seller: sellerId, warehouse: null }
          : { warehouse }),
      };
      const inventory = await inventoryCollection.findOne(inventoryFilter);
      if (!inventory) {
        throw new Error(`Active reservation ${reservation._id} has no matching inventory record.`);
      }
      inventoryId = inventory._id;
    }

    await collection.updateOne(
      { _id: reservation._id },
      {
        $set: {
          reservationKey: key,
          source,
          inventoryModel,
          product: productId,
          seller: sellerId,
          inventory: inventoryId,
          sku,
          status: "active",
        },
      }
    );
  }
};

const migrateInventoryIndexes = async () => {
  try {
    await connectDB();
    await ensureActiveReservationKeys();

    await SellerInventory.collection.createIndex(
      { seller: 1, product: 1, sku: 1, warehouse: 1 },
      { unique: true }
    );
    await StockReservation.collection.createIndex(
      { reservationKey: 1 },
      { unique: true, partialFilterExpression: { status: "active" } }
    );
    await StockReservation.collection.createIndex({ status: 1, expiresAt: 1 });
    await Product.collection.createIndex({ "variants.sku": 1 }, { unique: true, sparse: true });
    await InventoryMovement.collection.createIndex({ idempotencyKey: 1 }, { unique: true, sparse: true });
    await dropLegacyUniqueIndex(SellerInventory.collection, ["seller", "product", "sku"]);
    await dropLegacyUniqueIndex(StockReservation.collection, ["cartId", "sku", "warehouse"]);

    console.log("Inventory indexes migrated successfully.");
  } catch (error) {
    console.error("Inventory index migration failed:", error);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
};

migrateInventoryIndexes();
