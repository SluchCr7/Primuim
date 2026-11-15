
const mongoose = require("mongoose");
const path = require("path");

require("dotenv").config({
  path: path.resolve(__dirname, "../.env"),
});

const connectDB = require("../config/db");
const { Coupon } = require("../models/Discount");

// ============================================
// Coupon Seed Data
// ============================================

const getCouponDates = () => {
  const now = new Date();

  const startDate = new Date(now);
  startDate.setDate(startDate.getDate() - 1);

  const endDate = new Date(now);
  endDate.setMonth(endDate.getMonth() + 3);

  return { startDate, endDate };
};

const { startDate, endDate } = getCouponDates();

const coupons = [
  {
    code: "WELCOME10",
    type: "percentage",
    value: 10,
    minOrderAmount: 100,
    maxDiscount: 100,
    startDate,
    endDate,
    usageLimit: 1000,
    isActive: true,
  },
  {
    code: "SAVE15",
    type: "percentage",
    value: 15,
    minOrderAmount: 200,
    maxDiscount: 150,
    startDate,
    endDate,
    usageLimit: 500,
    isActive: true,
  },
  {
    code: "FLAT50",
    type: "fixed",
    value: 50,
    minOrderAmount: 250,
    startDate,
    endDate,
    usageLimit: 300,
    isActive: true,
  },
  {
    code: "FLAT100",
    type: "fixed",
    value: 100,
    minOrderAmount: 500,
    startDate,
    endDate,
    usageLimit: 200,
    isActive: true,
  },
  {
    code: "BIGSALE25",
    type: "percentage",
    value: 25,
    minOrderAmount: 1000,
    maxDiscount: 500,
    startDate,
    endDate,
    usageLimit: 100,
    isActive: true,
  },
  {
    code: "FREESHOP",
    type: "fixed",
    value: 30,
    minOrderAmount: 150,
    startDate,
    endDate,
    usageLimit: null,
    isActive: true,
  },
];

// ============================================
// Validation
// ============================================

const validateSeedData = (data) => {
  const codes = new Set();

  for (const coupon of data) {
    const code = coupon.code.toUpperCase();

    if (codes.has(code)) {
      throw new Error(`Duplicate coupon code: ${code}`);
    }

    codes.add(code);

    if (coupon.startDate >= coupon.endDate) {
      throw new Error(`Invalid dates for coupon: ${code}`);
    }

    if (coupon.type === "percentage" && coupon.value > 100) {
      throw new Error(
        `Percentage cannot exceed 100: ${code}`
      );
    }

    if (
      coupon.maxDiscount != null &&
      coupon.maxDiscount < 0
    ) {
      throw new Error(`Invalid maxDiscount: ${code}`);
    }
  }
};

// ============================================
// Seeder
// ============================================

const seedCoupons = async () => {
  try {
    validateSeedData(coupons);

    console.log(`Starting coupon seeder (${coupons.length} coupons)...`);

    let inserted = 0;
    let skipped = 0;

    for (const coupon of coupons) {
      const result = await Coupon.updateOne(
        { code: coupon.code },
        {
          $setOnInsert: coupon,
        },
        {
          upsert: true,
          runValidators: true,
        }
      );

      if (result.upsertedCount > 0) {
        inserted++;
        console.log(`+ Created: ${coupon.code}`);
      } else {
        skipped++;
        console.log(`= Skipped (already exists): ${coupon.code}`);
      }
    }

    console.log("\n================================");
    console.log("Coupon seeder completed!");
    console.log("================================");
    console.log(`Total: ${coupons.length}`);
    console.log(`Inserted: ${inserted}`);
    console.log(`Skipped: ${skipped}`);
    console.log("================================");
  } catch (error) {
    console.error("Coupon seeder failed:", error);
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
      await seedCoupons();

      await mongoose.disconnect();
      process.exit(0);
    } catch (error) {
      console.error(error);

      await mongoose.disconnect().catch(() => {});
      process.exit(1);
    }
  })();
}

