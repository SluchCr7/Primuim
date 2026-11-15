
const mongoose = require("mongoose");
const connectDB = require("../config/db");

const { Product } = require("../models/Product");
const Warehouse = require("../models/Warehouse");
const WarehouseInventory = require("../models/WarehouseInventory");

const WAREHOUSE_CODE = "WH-001";

const getInventoryRecords = (products, warehouseId) => {
  const records = [];

  for (const product of products) {
    // Products with variants: create a separate record per variant.
    if (product.variants?.length > 0) {
      for (const variant of product.variants) {
        if (!variant.sku) {
          console.warn(
            `Skipping variant without SKU: ${product.title}`
          );
          continue;
        }

        const physicalStock = variant.stock ?? 0;
        const reservedStock = 0;

        records.push({
          warehouse: warehouseId,
          product: product._id,
          sku: variant.sku,
          physicalStock,
          reservedStock,
          availableStock: physicalStock - reservedStock,
          reorderPoint: product.lowStockThreshold ?? 10,
          safetyStock: 5,
        });
      }

      continue;
    }

    // Simple products: use their SKU.
    // Fallback to product title to match existing order SKU format.
    const sku = product.sku || product.title;

    const physicalStock = product.stock ?? 0;
    const reservedStock = product.reservedStock ?? 0;

    records.push({
      warehouse: warehouseId,
      product: product._id,
      sku,
      physicalStock,
      reservedStock,
      availableStock: physicalStock - reservedStock,
      reorderPoint: product.lowStockThreshold ?? 10,
      safetyStock: 5,
    });
  }

  return records;
};

const seedWarehouseInventory = async () => {
  try {
    await connectDB();

    console.log("Starting warehouse inventory seeder...");

    const warehouse = await Warehouse.findOne({
      code: WAREHOUSE_CODE,
      isActive: true,
    });

    if (!warehouse) {
      throw new Error(
        `Active warehouse not found: ${WAREHOUSE_CODE}`
      );
    }

    const products = await Product.find({
      isDeleted: false,
      isDigital: false,
    }).select(
      "_id title sku stock reservedStock lowStockThreshold variants"
    );

    if (!products.length) {
      console.log("No eligible products found.");
      return;
    }

    const records = getInventoryRecords(products, warehouse._id);

    let inserted = 0;
    let skipped = 0;

    for (const record of records) {
      const result = await WarehouseInventory.updateOne(
        {
          warehouse: record.warehouse,
          sku: record.sku,
        },
        {
          $setOnInsert: record,
        },
        {
          upsert: true,
          runValidators: true,
        }
      );

      if (result.upsertedCount === 1) {
        inserted++;
        console.log(
          `Added inventory: ${record.sku} | Stock: ${record.physicalStock}`
        );
      } else {
        const existing = await WarehouseInventory.findOne({
          warehouse: record.warehouse,
          sku: record.sku,
        }).select("product");

        if (
          existing &&
          existing.product.toString() !== record.product.toString()
        ) {
          throw new Error(
            `SKU conflict: ${record.sku} belongs to another product.`
          );
        }

        skipped++;
        console.log(`Skipped existing inventory: ${record.sku}`);
      }
    }

    console.log("\n========== INVENTORY SEEDER SUMMARY ==========");
    console.log(`Products found: ${products.length}`);
    console.log(`Inventory records prepared: ${records.length}`);
    console.log(`Inserted: ${inserted}`);
    console.log(`Skipped: ${skipped}`);
    console.log("==============================================\n");
  } catch (error) {
    console.error("Inventory seeder failed:", error);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
};

seedWarehouseInventory();
