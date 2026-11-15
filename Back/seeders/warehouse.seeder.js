
const mongoose = require("mongoose");
const path = require("path");

require("dotenv").config({
  path: path.resolve(__dirname, "../.env"),
});

const connectDB = require("../config/db");
const Warehouse = require("../models/Warehouse");

// ============================================
// Warehouse Seed Data
// ============================================

const warehouses = [
  {
    name: "Main Warehouse",
    code: "WH-001",

    location: {
      type: "Point",
      coordinates: [31.2357, 30.0444], // [longitude, latitude]
    },

    address: {
      street: "Main Warehouse Street",
      city: "Cairo",
      state: "Cairo Governorate",
      postalCode: "11511",
      country: "Egypt",
    },

    isActive: true,
  },
];

// ============================================
// Validation
// ============================================

const validateSeedData = (data) => {
  const codes = new Set();

  for (const warehouse of data) {
    if (codes.has(warehouse.code)) {
      throw new Error(`Duplicate warehouse code: ${warehouse.code}`);
    }

    codes.add(warehouse.code);

    if (
      !Array.isArray(warehouse.location.coordinates) ||
      warehouse.location.coordinates.length !== 2
    ) {
      throw new Error(
        `Invalid coordinates for warehouse: ${warehouse.name}`
      );
    }
  }
};

// ============================================
// Seeder
// ============================================

const seedWarehouses = async () => {
  try {
    validateSeedData(warehouses);

    console.log(
      `Starting warehouse seeder (${warehouses.length} warehouses)...`
    );

    let inserted = 0;
    let skipped = 0;

    for (const warehouse of warehouses) {
      const result = await Warehouse.updateOne(
        { code: warehouse.code },
        {
          $setOnInsert: warehouse,
        },
        {
          upsert: true,
          runValidators: true,
        }
      );

      if (result.upsertedCount > 0) {
        inserted++;
        console.log(`+ Created: ${warehouse.name}`);
      } else {
        skipped++;
        console.log(`= Skipped (already exists): ${warehouse.name}`);
      }
    }

    console.log("\n================================");
    console.log("Warehouse seeder completed!");
    console.log("================================");
    console.log(`Total: ${warehouses.length}`);
    console.log(`Inserted: ${inserted}`);
    console.log(`Skipped: ${skipped}`);
    console.log("================================");
  } catch (error) {
    console.error("Warehouse seeder failed:", error);
    throw error;
  }
};

// ============================================
// Direct Execution
// ============================================

if (require.main === module) {
  (async () => {
    try {
      await connectDB();
      await seedWarehouses();

      await mongoose.disconnect();
      process.exit(0);
    } catch (error) {
      console.error(error);

      await mongoose.disconnect().catch(() => {});
      process.exit(1);
    }
  })();
}

