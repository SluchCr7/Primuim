const express = require("express");
const router  = express.Router();

const {
  getCategories,
  getCategoryById,
  getCategoryBySlug,
  createCategory,
  updateCategory,
  deleteCategory,
} = require("../Controllers/CategoryController");
const { verifyAdmin } = require("../Middelwares/verifyToken");
const photoUpload      = require("../Middelwares/UploadPhoto");

/**
 * @swagger
 * tags:
 *   name: Categories
 *   description: Product category tree — public fetch & admin CRUD
 */

/**
 * @swagger
 * /api/categories:
 *   get:
 *     summary: Get all categories (optionally as a nested tree)
 *     tags: [Categories]
 *     parameters:
 *       - in: query
 *         name: tree
 *         schema: { type: boolean }
 *         description: Set to true to receive a nested parent→children tree structure
 *     responses:
 *       200:
 *         description: Category list returned.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:    { type: boolean, example: true }
 *                 categories:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Category'
 */
router.get("/", getCategories);

/**
 * @swagger
 * /api/categories/slug/{slug}:
 *   get:
 *     summary: Get a category by its SEO-friendly slug
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema: { type: string }
 *         example: handbags
 *     responses:
 *       200:
 *         description: Category returned.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:  { type: boolean, example: true }
 *                 category: { $ref: '#/components/schemas/Category' }
 *       404:
 *         description: Category not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/slug/:slug", getCategoryBySlug);

/**
 * @swagger
 * /api/categories/{id}:
 *   get:
 *     summary: Get a single category by ObjectId
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Category returned.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:  { type: boolean, example: true }
 *                 category: { $ref: '#/components/schemas/Category' }
 *       404:
 *         description: Category not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/:id", getCategoryById);

/**
 * @swagger
 * /api/categories:
 *   post:
 *     summary: Create a new category (admin only, optional image upload)
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             allOf:
 *               - $ref: '#/components/schemas/CategoryInput'
 *               - type: object
 *                 properties:
 *                   image:
 *                     type: string
 *                     format: binary
 *     responses:
 *       201:
 *         description: Category created.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:  { type: boolean, example: true }
 *                 category: { $ref: '#/components/schemas/Category' }
 *       403:
 *         description: Admin role required.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/", verifyAdmin, photoUpload.single("image"), createCategory);

/**
 * @swagger
 * /api/categories/{id}:
 *   put:
 *     summary: Update a category (admin only, optional image upload)
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             allOf:
 *               - $ref: '#/components/schemas/CategoryInput'
 *               - type: object
 *                 properties:
 *                   image:
 *                     type: string
 *                     format: binary
 *     responses:
 *       200:
 *         description: Category updated.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:  { type: boolean, example: true }
 *                 category: { $ref: '#/components/schemas/Category' }
 *   delete:
 *     summary: Delete a category and optionally reassign children (admin only)
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Category deleted.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       404:
 *         description: Category not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.put("/:id", verifyAdmin, photoUpload.single("image"), updateCategory);
router.delete("/:id", verifyAdmin, deleteCategory);

module.exports = router;