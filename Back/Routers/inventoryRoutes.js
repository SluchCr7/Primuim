const express = require("express");
const router = express.Router();
const { 
  createWarehouse, 
  adjustStock, 
  getTurnoverReport, 
  reserveCartStock 
} = require("../Controllers/inventoryController");
const { verifyToken, verifyAdmin } = require("../Middelwares/verifyToken");

router.post("/warehouses", verifyAdmin, createWarehouse);
router.post("/stock-adjustment", verifyAdmin, adjustStock);
router.get("/turnover-report", verifyAdmin, getTurnoverReport);
router.post("/reserve", verifyToken, reserveCartStock);

module.exports = router;
