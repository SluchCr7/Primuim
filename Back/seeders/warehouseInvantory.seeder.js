const mongoose = require("mongoose");
const connectDB = require("../config/db");
const { Product } = require("../models/Product");
const SellerInventory = require("../models/SellerInventory");
const WarehouseInventory = require("../models/WarehouseInventory");
const { initializeSellerInventory } = require("../utils/inventoryService");

const getInventoryRecords = (product) => {
  if (product.inventoryMode === "warehouse-managed") {
    return [];
  }
  if (product.variants?.length) {
    return product.variants.map(variant => ({
      sku: variant.sku,
      quantity: Number(variant.stock || 0),
      referenceType: "product_variant",
    }));
  }
  return [{
    sku: product.sku || product.slug,
    quantity: Number(product.stock || 0),
    referenceType: "product",
  }];
};

const seedSellerInventory = async () => {
  try {
    await connectDB();
    const products = await Product.collection.find({ isDeleted: { $ne: true } }).toArray();

    let created = 0;
    let skipped = 0;
    for (const product of products) {
      if (!product.inventoryMode) {
        const hasWarehouseInventory = await WarehouseInventory.exists({ product: product._id });
        product.inventoryMode = product.warehouse || hasWarehouseInventory
          ? "warehouse-managed"
          : "seller-managed";
        await Product.collection.updateOne(
          { _id: product._id, inventoryMode: { $exists: false } },
          { $set: { inventoryMode: product.inventoryMode } }
        );
      }
      if (!product.seller) {
        skipped++;
        continue;
      }
      for (const record of getInventoryRecords(product)) {
        if (!record.sku) {
          skipped++;
          continue;
        }
        const existing = await SellerInventory.findOne({
          seller: product.seller,
          product: product._id,
          sku: record.sku,
          warehouse: null,
        });
        if (existing) {
          skipped++;
          continue;
        }

        const session = await mongoose.startSession();
        try {
          session.startTransaction();
          await initializeSellerInventory({
            seller: product.seller,
            product: product._id,
            sku: record.sku,
            quantity: record.quantity,
            actor: "system",
            reason: "LEGACY_STOCK_MIGRATION",
            referenceType: record.referenceType,
            referenceId: String(product._id),
            session,
          });
          await session.commitTransaction();
          created++;
        } catch (error) {
          if (session.inTransaction()) await session.abortTransaction();
          throw error;
        } finally {
          await session.endSession();
        }
      }
    }

    console.log(`Seller inventory migration finished: ${created} created, ${skipped} skipped.`);
  } catch (error) {
    console.error("Seller inventory migration failed:", error);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
};

seedSellerInventory();
