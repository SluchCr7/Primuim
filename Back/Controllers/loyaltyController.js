const asyncHandler = require("express-async-handler");
const LoyaltyWallet = require("../models/LoyaltyWallet");
const LoyaltyTransaction = require("../models/LoyaltyTransaction");

// @desc    Get current user's loyalty wallet state
// @route   GET /api/loyalty/wallet
// @access  Private
const getWallet = asyncHandler(async (req, res) => {
  let wallet = await LoyaltyWallet.findOne({ user: req.user.id });
  
  if (!wallet) {
    // Return a default mock wallet if user hasn't earned points yet
    wallet = {
      balance: 0,
      tier: "Bronze",
      lifetimePointsEarned: 0,
      rollingAnnualSpend: 0,
      pointBuckets: []
    };
  }

  res.status(200).json({
    success: true,
    wallet
  });
});

// @desc    Get user's loyalty transactions ledger
// @route   GET /api/loyalty/transactions
// @access  Private
const getTransactions = asyncHandler(async (req, res) => {
  const transactions = await LoyaltyTransaction.find({ user: req.user.id })
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    transactions
  });
});

module.exports = {
  getWallet,
  getTransactions
};
