const express = require("express");
const router = express.Router();
const { getWallet, getTransactions } = require("../Controllers/loyaltyController");
const { verifyToken } = require("../Middelwares/verifyToken");

router.get("/wallet", verifyToken, getWallet);
router.get("/transactions", verifyToken, getTransactions);

module.exports = router;
