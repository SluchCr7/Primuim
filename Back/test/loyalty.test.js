const { test } = require("node:test");
const assert = require("node:assert/strict");
const { calculateTier, TIER_CONFIGS } = require("../utils/loyaltyService");

test("Loyalty Tier Calculation logic", () => {
  // Test tier limits
  assert.equal(calculateTier(100), "Bronze");
  assert.equal(calculateTier(500), "Silver");
  assert.equal(calculateTier(1500), "Gold");
  assert.equal(calculateTier(6000), "Platinum");
});

test("Loyalty Tier configuration multipliers", () => {
  assert.equal(TIER_CONFIGS.Bronze.multiplier, 1.0);
  assert.equal(TIER_CONFIGS.Silver.multiplier, 1.25);
  assert.equal(TIER_CONFIGS.Gold.multiplier, 1.5);
  assert.equal(TIER_CONFIGS.Platinum.multiplier, 2.0);
});
