const express    = require("express");
const router     = express.Router();
const { uploadImage } = require("../Controllers/UploadController");
const photoUpload     = require("../Middelwares/UploadPhoto");

/**
 * @swagger
 * tags:
 *   name: Upload
 *   description: Cloudinary image upload — used during seller registration before account creation
 */

/**
 * @swagger
 * /api/upload/image:
 *   post:
 *     summary: Upload a single image to Cloudinary and receive the public URL
 *     tags: [Upload]
 *     description: >
 *       Public endpoint — no authentication required.
 *       Primarily used during the seller onboarding flow to upload a store logo
 *       before the seller account is formally created.
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [image]
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Image file (jpg, png, webp — max 5 MB)
 *     responses:
 *       200:
 *         description: Image uploaded successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UploadResponse'
 *       400:
 *         description: No file provided or invalid file type.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       413:
 *         description: File size exceeds the 5 MB limit.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/image", photoUpload.single("image"), uploadImage);

module.exports = router;
