const express     = require("express");
const router      = express.Router();

const {
  getMe,
  updateProfile,
  updatePassword,
  uploadProfilePhoto,
  deleteProfilePhoto,
  toggleWishlist,
  getWishlist,
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
  followSeller,
  getSharedWishlist,
  updateSizeProfile,
} = require("../Controllers/UserController");
const { verifyToken }  = require("../Middelwares/verifyToken");
const photoUpload       = require("../Middelwares/UploadPhoto");

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User profile & account management
 */

/**
 * @swagger
 * /api/users/me:
 *   get:
 *     summary: Get the currently authenticated user's full profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile returned.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 user:    { $ref: '#/components/schemas/UserPublic' }
 *       401:
 *         description: Unauthorized.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/me", verifyToken, getMe);

/**
 * @swagger
 * /api/users/profile:
 *   put:
 *     summary: Update profile info (name, phone, bio…)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateProfileInput'
 *     responses:
 *       200:
 *         description: Profile updated.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Validation error.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.put("/profile", verifyToken, updateProfile);

/**
 * @swagger
 * /api/users/password:
 *   put:
 *     summary: Change password (requires current password)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdatePasswordInput'
 *     responses:
 *       200:
 *         description: Password changed successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Incorrect current password or validation error.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.put("/password", verifyToken, updatePassword);

/**
 * @swagger
 * /api/users/profile-photo:
 *   patch:
 *     summary: Upload or replace profile photo (multipart/form-data)
 *     tags: [Users]
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
 *         description: Photo uploaded. Returns new photo URL.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *   delete:
 *     summary: Delete the current profile photo (reverts to default avatar)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Photo deleted.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 */
router.patch("/profile-photo", verifyToken, photoUpload.single("image"), uploadProfilePhoto);
router.delete("/profile-photo", verifyToken, deleteProfilePhoto);

/**
 * @swagger
 * /api/users/wishlist/{id}:
 *   post:
 *     summary: Toggle a product in the authenticated user's wishlist (add if absent, remove if present)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ObjectId
 *     responses:
 *       200:
 *         description: Wishlist updated.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       404:
 *         description: Product not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/wishlist/:id", verifyToken, toggleWishlist);

/**
 * @swagger
 * /api/users/wishlist:
 *   get:
 *     summary: Get the authenticated user's wishlist
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Wishlist returned.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:  { type: boolean, example: true }
 *                 wishlist:
 *                   type: object
 *                   properties:
 *                     products:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Product'
 */
router.get("/wishlist", verifyToken, getWishlist);

/**
 * @swagger
 * /api/users/follow/{sellerId}:
 *   post:
 *     summary: Follow or unfollow a seller's store
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sellerId
 *         required: true
 *         schema:
 *           type: string
 *         description: Seller ObjectId
 *     responses:
 *       200:
 *         description: Follow status toggled.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 */
router.post("/follow/:sellerId", verifyToken, followSeller);

/**
 * @swagger
 * /api/users/wishlist/share/{userId}:
 *   get:
 *     summary: View a public shared wishlist for any user (no auth required)
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: The user whose wishlist to display
 *     responses:
 *       200:
 *         description: Shared wishlist returned.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 wishlist:
 *                   type: object
 *                   properties:
 *                     products:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Product'
 *       404:
 *         description: User not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/wishlist/share/:userId", getSharedWishlist);

/**
 * @swagger
 * /api/users/addresses:
 *   get:
 *     summary: List all saved shipping addresses for the authenticated user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Address list returned.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:   { type: boolean, example: true }
 *                 addresses:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Address'
 *   post:
 *     summary: Add a new shipping address
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Address'
 *     responses:
 *       201:
 *         description: Address added.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 */
router.get("/addresses", verifyToken, getAddresses);
router.post("/addresses", verifyToken, addAddress);

/**
 * @swagger
 * /api/users/addresses/{addressId}:
 *   put:
 *     summary: Update an existing address
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: addressId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Address'
 *     responses:
 *       200:
 *         description: Address updated.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       404:
 *         description: Address not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *   delete:
 *     summary: Delete an address
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: addressId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Address deleted.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 */
router.put("/addresses/:addressId", verifyToken, updateAddress);
router.delete("/addresses/:addressId", verifyToken, deleteAddress);

/**
 * @swagger
 * /api/users/addresses/{addressId}/default:
 *   patch:
 *     summary: Mark an address as the default shipping address
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: addressId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Default address updated.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 */
router.patch("/addresses/:addressId/default", verifyToken, setDefaultAddress);

/**
 * @swagger
 * /api/users/size-profile:
 *   put:
 *     summary: Update the Smart Fit & Size Guide profile for the user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SizeProfileInput'
 *     responses:
 *       200:
 *         description: Size profile saved.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 */
router.put("/size-profile", verifyToken, updateSizeProfile);

module.exports = router;