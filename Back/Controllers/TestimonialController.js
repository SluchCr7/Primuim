const { Testimonial, validateTestimonial } = require("../models/Testimonial"); // عدل المسار حسب مشروعك
const mongoose = require("mongoose");

/**
 * @desc    إنشاء رأي جديد (من قِبل العميل)
 * @route   POST /api/testimonials
 * @access  Private (للمستخدمين المسجلين فقط)
 */
exports.createTestimonial = async (req, res) => {
    try {
        // التحقق من صحة البيانات القادمة من الـ Request Body
        // نمرر الـ User من الـ req.user.id القادم من الـ Auth Middleware
        const { error } = validateTestimonial({ User: req.user.id, body: req.body.body });
        if (error) {
            return res.status(400).json({ message: error.details[0].message });
        }

        // التحقق مما إذا كان المستخدم قد أرسل رأياً من قبل (اختياري: لمنع التكرار)
        const alreadyExists = await Testimonial.findOne({ User: req.user.id });
        if (alreadyExists) {
            return res.status(400).json({ message: "لقد قمت بإضافة رأيك بالفعل سابقاً." });
        }

        const newTestimonial = new Testimonial({
            User: req.user.id,
            body: req.body.body,
            status: "pending" 
        });

        const savedTestimonial = await newTestimonial.save();
        res.status(201).json({ message: "تم إرسال رأيك بنجاح، وهو في انتظار مراجعة الإدارة.", data: savedTestimonial });
    } catch (error) {
        res.status(500).json({ message: "حدث خطأ في السيرفر", error: error.message });
    }
};

/**
 * @desc    جلب جميع الآراء مع نظام الـ Pagination (للعرض في الموقع أو لوحة التحكم)
 * @route   GET /api/testimonials
 * @access  Public
 */
exports.getAllTestimonials = async (req, res) => {
    try {
        // تحديد الصفحة الحالية وعدد العناصر في الصفحة من الـ Query Strings
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 6; // الافتراضي 6 آراء لتناسب الـ Layout
        const skip = (page - 1) * limit;

        // فلترة اختيارية: إذا كان القادم ليس أدمن، نجلب فقط المقبولة (status: "approved")
        // إذا لم تكن قد أضفت حقل الـ status بعد، يمكنك حذف هذا الفلتر والبحث بـ {}
        const filter = req.query.adminView === "true" ? {} : { status: "approved" }; 

        // جلب البيانات مع عمل populate لبيانات المستخدم (الاسم، الصورة الشخصية)
        const testimonials = await Testimonial.find(filter)
            .populate("User", "name avatar email username profileName") // جلب الحقول المحددة فقط من موديل الـ User
            .sort({ createdAt: -1 }) // جلب الأحدث أولاً
            .skip(skip)
            .limit(limit);

        // حساب العدد الإجمالي للآراء لبناء أزرار الـ Pagination في الفرونت إند
        const totalTestimonials = await Testimonial.countDocuments(filter);
        const totalPages = Math.ceil(totalTestimonials / limit);

        res.status(200).json({
            pagination: {
                totalItems: totalTestimonials,
                totalPages: totalPages,
                currentPage: page,
                limit: limit,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
            },
            data: testimonials
        });
    } catch (error) {
        res.status(500).json({ message: "حدث خطأ في السيرفر", error: error.message });
    }
};

/**
 * @desc    تحديث حالة الرأي (قبول / رفض) من قِبل الأدمن
 * @route   PATCH /api/testimonials/:id/status
 * @access  Private (Admin Only)
 */
exports.updateTestimonialStatus = async (req, res) => {
    try {
        const { status } = req.body; // المتوقع: "approved" أو "rejected"
        if (!["approved", "rejected", "pending"].includes(status)) {
            return res.status(400).json({ message: "حالة غير صالحة" });
        }

        const testimonial = await Testimonial.findByIdAndUpdate(
            req.params.id,
            { status: status },
            { new: true }
        ).populate("User", "name avatar email username profileName");

        if (!testimonial) {
            return res.status(404).json({ message: "هذا التقييم غير موجود" });
        }

        res.status(200).json({ message: `تم تحديث حالة التقييم إلى ${status}`, data: testimonial });
    } catch (error) {
        res.status(500).json({ message: "حدث خطأ في السيرفر", error: error.message });
    }
};

/**
 * @desc    حذف رأي معين
 * @route   DELETE /api/testimonials/:id
 * @access  Private (Admin أو صاحب الرأي نفسه)
 */
exports.deleteTestimonial = async (req, res) => {
    try {
        const testimonial = await Testimonial.findById(req.params.id);
        if (!testimonial) {
            return res.status(404).json({ message: "هذا التقييم غير موجود" });
        }

        // التحقق من الصلاحية: هل الحاذف هو الأدمن أم صاحب التقييم نفسه؟
        if (testimonial.User.toString() !== req.user.id && req.user.role !== "admin") {
            return res.status(403).json({ message: "غير مسموح لك بحذف هذا التقييم" });
        }

        await testimonial.deleteOne();
        res.status(200).json({ message: "تم حذف التقييم بنجاح" });
    } catch (error) {
        res.status(500).json({ message: "حدث خطأ في السيرفر", error: error.message });
    }
};