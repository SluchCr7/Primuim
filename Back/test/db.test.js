const test = require("node:test");
const assert = require("node:assert/strict");
const connectDB = require("../config/db");

test("connectDB reports a missing MongoDB URI without exiting the process", async () => {
  const previousMongoUri = process.env.MONGO_URI;
  delete process.env.MONGO_URI;

  try {
    await assert.rejects(connectDB(), /MONGO_URI is required/);
  } finally {
    if (previousMongoUri === undefined) {
      delete process.env.MONGO_URI;
    } else {
      process.env.MONGO_URI = previousMongoUri;
    }
  }
});
