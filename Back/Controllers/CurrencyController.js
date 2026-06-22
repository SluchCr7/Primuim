const asyncHandler = require("express-async-handler");

// ========================================
// @desc    Get Current Exchange Rates (Base: EGP)
// @route   GET /api/currency/rates
// @access  Public
// ========================================
const getExchangeRates = asyncHandler(async (req, res) => {
  // Static currency rates for high performance
  // 1 EGP = 1 EGP
  // 1 EGP = ~0.021 USD (approx 48 EGP per USD)
  // 1 EGP = ~0.019 EUR (approx 52 EGP per EUR)
  const rates = {
    EGP: 1.0,
    USD: 0.0208, // 1/48
    EUR: 0.0192  // 1/52
  };

  res.status(200).json({
    success: true,
    base: "EGP",
    rates,
  });
});

module.exports = {
  getExchangeRates,
};
