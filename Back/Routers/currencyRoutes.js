const express = require("express");
const router  = express.Router();

const { getExchangeRates } = require("../Controllers/CurrencyController");

/**
 * @swagger
 * tags:
 *   name: Currency
 *   description: Real-time exchange rates (EGP base → USD, EUR, GBP, and more)
 */

/**
 * @swagger
 * /api/currency/rates:
 *   get:
 *     summary: Get current exchange rates relative to EGP base currency
 *     tags: [Currency]
 *     description: >
 *       Returns live exchange rates used by the front-end currency selector.
 *       Rates are cached server-side and refreshed every hour.
 *     responses:
 *       200:
 *         description: Exchange rates returned.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ExchangeRates'
 *             example:
 *               base: EGP
 *               rates:
 *                 USD: 0.021
 *                 EUR: 0.019
 *                 GBP: 0.016
 *                 SAR: 0.079
 *               updatedAt: '2026-06-24T10:00:00.000Z'
 *       503:
 *         description: Exchange rate provider unavailable.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/rates", getExchangeRates);

module.exports = router;
