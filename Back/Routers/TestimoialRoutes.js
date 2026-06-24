const express = require("express");
const router  = express.Router();
const testimonialController = require("../Controllers/TestimonialController");
const { verifyToken, verifyAdmin } = require("../Middelwares/verifyToken");

/**
 * @swagger
 * tags:
 *   name: Testimonials
 *   description: Homepage customer testimonials — create, moderate, and delete
 */

/**
 * @swagger
 * /api/testimonials:
 *   get:
 *     summary: Get all approved testimonials (public)
 *     tags: [Testimonials]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *     responses:
 *       200:
 *         description: Testimonials returned.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:       { type: boolean, example: true }
 *                 testimonials:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Testimonial'
 *   post:
 *     summary: Submit a new testimonial (authenticated users only)
 *     tags: [Testimonials]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TestimonialInput'
 *     responses:
 *       201:
 *         description: Testimonial submitted and pending approval.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:     { type: boolean, example: true }
 *                 testimonial: { $ref: '#/components/schemas/Testimonial' }
 *       400:
 *         description: Validation error or already submitted.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.route("/")
  .get(testimonialController.getAllTestimonials)
  .post(verifyToken, testimonialController.createTestimonial);

/**
 * @swagger
 * /api/testimonials/{id}/status:
 *   patch:
 *     summary: Approve or reject a testimonial (admin only)
 *     tags: [Testimonials]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: Testimonial ObjectId
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
 *                 enum: [approved, rejected]
 *                 example: approved
 *     responses:
 *       200:
 *         description: Testimonial status updated.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       403:
 *         description: Admin role required.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.patch("/:id/status", verifyToken, verifyAdmin, testimonialController.updateTestimonialStatus);

/**
 * @swagger
 * /api/testimonials/{id}:
 *   delete:
 *     summary: Delete a testimonial (owner or admin)
 *     tags: [Testimonials]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Testimonial deleted.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       403:
 *         description: Not the owner.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.delete("/:id", verifyToken, testimonialController.deleteTestimonial);

module.exports = router;