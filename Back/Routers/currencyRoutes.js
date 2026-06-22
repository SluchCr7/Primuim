const express = require("express");
const router = express.Router();

const { getExchangeRates } = require("../Controllers/CurrencyController");

router.get("/rates", getExchangeRates);

module.exports = router;
