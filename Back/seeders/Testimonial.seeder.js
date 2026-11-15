
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const path = require("path");
require("dotenv").config({
  path: path.resolve(__dirname, "../.env"),
});     
const {User} = require("../models/User");
const {
  Testimonial,
  validateTestimonial,
} = require("../models/Testimonial");

// Customer accounts provided in the seed data.
const testimonialsData = [
  {
    User: "6af9c1e0fac85a0e1e17c529",
    body: "The shopping experience is simple and easy to navigate. I especially like how clearly the products and their details are presented.",
  },
  {
    User: "6a4b9ec418ddfe84d6f2920a",
    body: "I had a pleasant experience using the platform. The product browsing experience is smooth, and the overall interface is easy to understand.",
  },
  {
    User: "6a3bff15059bf3b8207cefea",
    body: "The platform provides a clean shopping experience with useful product information. I would like to see more products and features added in the future.",
  },
];

const seedTestimonials = async () => {
  try {
    await connectDB();

    console.log("Starting testimonial seeder...");

    let inserted = 0;
    let skipped = 0;

    for (const data of testimonialsData) {
      // Validate testimonial data using Joi.
      const { error } = validateTestimonial(data);

      if (error) {
        throw new Error(
          `Invalid testimonial for user ${data.User}: ${error.message}`
        );
      }

      // Make sure the user exists and is a customer.
      const user = await User.findOne({
        _id: data.User,
        role: "customer",
      }).select("_id");

      if (!user) {
        console.warn(
          `Skipped: Customer not found (${data.User})`
        );
        skipped++;
        continue;
      }

      // Insert only if this user doesn't already have a testimonial.
      const result = await Testimonial.updateOne(
        { User: user._id },
        {
          $setOnInsert: {
            User: user._id,
            body: data.body,
            status: "pending",
          },
        },
        {
          upsert: true,
          runValidators: true,
        }
      );

      if (result.upsertedCount === 1) {
        inserted++;
        console.log(`Inserted testimonial for user: ${user._id}`);
      } else {
        skipped++;
        console.log(`Skipped existing testimonial: ${user._id}`);
      }
    }

    console.log("\n========== TESTIMONIAL SEEDER SUMMARY ==========");
    console.log(`Total prepared: ${testimonialsData.length}`);
    console.log(`Inserted: ${inserted}`);
    console.log(`Skipped: ${skipped}`);
    console.log("================================================\n");

  } catch (error) {
    console.error("Testimonial seeder failed:", error);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
};

seedTestimonials();
