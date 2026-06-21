const express = require("express");
const router = express.Router();
const testimonialController = require("../Controllers/TestimonialController");
const { verifyToken, verifyAdmin } = require("../Middelwares/verifyToken"); // عدل المسميات حسب الـ Middlewares لديك

// مسار جلب الكل (متاح للجميع) وإنشاء رأي جديد (للمسجلين فقط)
router.route("/")
    .get(testimonialController.getAllTestimonials)
    .post(verifyToken, testimonialController.createTestimonial);

// مسار تحديث الحالة (خاص بالأدمن فقط)
router.patch("/:id/status", verifyToken, verifyAdmin, testimonialController.updateTestimonialStatus);

// مسار الحذف (لصاحب التقييم أو الأدمن)
router.delete("/:id", verifyToken, testimonialController.deleteTestimonial);

module.exports = router;