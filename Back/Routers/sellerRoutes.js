const express    = require("express");
const router     = express.Router();

const {
  applyAsSeller,
  getMyApplicationStatus,
  getSellerStats,
  getSellerOrders,
  updateSellerOrderStatus,
  requestPayout,
  getPublicStoreBySlug,
  getApprovedSellers,
  updateSellerStoreProfile,
  uploadStoreLogo,
  uploadStoreCover,
  getPublicStoreById,
} = require("../Controllers/SellerController");

const { verifyToken, verifySeller } = require("../Middelwares/verifyToken");
const photoUpload = require("../Middelwares/UploadPhoto");

/**
 * @swagger
 * tags:
 *   name: Sellers
 *   description: Seller onboarding, store profile management, orders, stats, and payouts
 */

/**
 * @swagger
 * /api/sellers/apply:
 *   post:
 *     summary: Submit a seller application (authenticated user)
 *     tags: [Sellers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SellerApplicationInput'
 *     responses:
 *       201:
 *         description: Application submitted and under review.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Already applied or validation error.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/apply", verifyToken, applyAsSeller);

/**
 * @swagger
 * /api/sellers/application-status:
 *   get:
 *     summary: Check the status of the authenticated user's seller application
 *     tags: [Sellers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Application status returned.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 status:  { type: string, enum: [pending, approved, rejected], example: pending }
 *                 remarks: { type: string, nullable: true }
 */
router.get("/application-status", verifyToken, getMyApplicationStatus);

/**
 * @swagger
 * /api/sellers/stats:
 *   get:
 *     summary: Get the authenticated seller's dashboard statistics
 *     tags: [Sellers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Seller stats returned.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:        { type: boolean, example: true }
 *                 totalRevenue:   { type: number, example: 85000 }
 *                 totalOrders:    { type: integer, example: 210 }
 *                 totalProducts:  { type: integer, example: 48 }
 *                 pendingPayouts: { type: number, example: 12000 }
 *       403:
 *         description: Approved seller role required.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/stats", verifySeller, getSellerStats);

/**
 * @swagger
 * /api/sellers/orders:
 *   get:
 *     summary: Get orders containing the seller's products
 *     tags: [Sellers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [pending, processing, shipped, delivered, cancelled] }
 *     responses:
 *       200:
 *         description: Seller orders returned.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 orders:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Order'
 */
router.get("/orders", verifySeller, getSellerOrders);

/**
 * @swagger
 * /api/sellers/orders/{orderId}:
 *   patch:
 *     summary: Update the fulfillment status of an order item (seller only)
 *     tags: [Sellers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [processing, shipped, delivered]
 *                 example: shipped
 *               trackingNumber:
 *                 type: string
 *                 example: EG123456789EG
 *     responses:
 *       200:
 *         description: Order status updated.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 */
router.patch("/orders/:orderId", verifySeller, updateSellerOrderStatus);

/**
 * @swagger
 * /api/sellers/payout:
 *   post:
 *     summary: Request a payout of available balance to the seller's bank account
 *     tags: [Sellers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PayoutRequestInput'
 *     responses:
 *       200:
 *         description: Payout request submitted.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Insufficient balance or below minimum threshold.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/payout", verifySeller, requestPayout);

/**
 * @swagger
 * /api/sellers/profile:
 *   put:
 *     summary: Update the seller's store profile (bio, policy, links…)
 *     tags: [Sellers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SellerProfileInput'
 *     responses:
 *       200:
 *         description: Store profile updated.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 */
router.put("/profile", verifySeller, updateSellerStoreProfile);

/**
 * @swagger
 * /api/sellers/store-logo:
 *   patch:
 *     summary: Upload or replace the store logo image
 *     tags: [Sellers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Logo updated.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 */
router.patch("/store-logo", verifySeller, photoUpload.single("image"), uploadStoreLogo);

/**
 * @swagger
 * /api/sellers/store-cover:
 *   patch:
 *     summary: Upload or replace the store cover banner image
 *     tags: [Sellers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Cover updated.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 */
router.patch("/store-cover", verifySeller, photoUpload.single("image"), uploadStoreCover);

/**
 * @swagger
 * /api/sellers/store/slug/{slug}:
 *   get:
 *     summary: Get a public seller store page by slug (for storefront display)
 *     tags: [Sellers]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema: { type: string }
 *         example: maison-elegance
 *     responses:
 *       200:
 *         description: Seller store data returned.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 seller:  { $ref: '#/components/schemas/SellerSummary' }
 *       404:
 *         description: Store not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/store/slug/:slug", getPublicStoreBySlug);

/**
 * @swagger
 * /api/sellers:
 *   get:
 *     summary: Get all approved seller stores (public marketplace listing)
 *     tags: [Sellers]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 12 }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Approved sellers list.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 sellers:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/SellerSummary'
 */
router.get("/", getApprovedSellers);

/**
 * @swagger
 * /api/sellers/{id}:
 *   get:
 *     summary: Get a seller's public store by ObjectId
 *     tags: [Sellers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Seller store returned.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 seller:  { $ref: '#/components/schemas/SellerSummary' }
 *       404:
 *         description: Seller not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/:id", getPublicStoreById);

module.exports = router;
