const mongoose = require("mongoose");
const Joi = require("joi");
const slugify = require("slugify");

const categorySchema = new mongoose.Schema(
{
    name: {
        type: String,
        required: true,
        trim: true,
        minlength: 2,
        maxlength: 100
    },

    slug: {
        type: String,
        lowercase: true,
        trim: true,
        index: true 
    },

    // 🔥 إضافة حقل الصورة هنا
    image: {
        type: String,
        trim: true,
        default: "https://via.placeholder.com/150" // صورة افتراضية في حال لم يتم إرسال صورة
    },

    description: {
        type: String,
        trim: true,
        maxlength: 1000
    },

    parent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
        default: null,
        index: true
    },

    level: {
        type: Number,
        default: 0
    },

    isActive: {
        type: Boolean,
        default: true
    }
},
{
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

categorySchema.index({ parent: 1, isActive: 1 });
categorySchema.index({ name: "text" });

categorySchema.virtual("subcategories", {
    ref: "Category",
    localField: "_id",
    foreignField: "parent"
});

categorySchema.pre("save", async function () {
    if (this.isModified("name")) {
        this.slug = slugify(this.name, { lower: true, strict: true });
    }

    if (this.isModified("parent") || this.isNew) {
        if (this.parent) {
            const parentCategory = await mongoose.model("Category").findById(this.parent);
            this.level = parentCategory ? parentCategory.level + 1 : 0;
        } else {
            this.level = 0;
        }
    }
});

const Category = mongoose.model("Category", categorySchema);

// 1️⃣ تحديث التحقق عند الإنشاء
const validateCreateCategory = (obj) => {
    const schema = Joi.object({
        name: Joi.string().trim().min(2).max(100).required(),
        image: Joi.string().uri().optional(), // 🔥 التحقق من أنه رابط URL صحيح
        description: Joi.string().trim().max(1000).optional().allow(""),
        parent: Joi.string().hex().length(24).optional().allow(null, ""), 
        isActive: Joi.boolean().optional(),
    });
    return schema.validate(obj);
};

// 2️⃣ تحديث التحقق عند التعديل
const validateUpdateCategory = (obj) => {
    const schema = Joi.object({
        name: Joi.string().trim().min(2).max(100).optional(),
        image: Joi.string().uri().optional(), // 🔥
        description: Joi.string().trim().max(1000).optional().allow(""),
        parent: Joi.string().hex().length(24).optional().allow(null, ""),
        isActive: Joi.boolean().optional(),
    });
    return schema.validate(obj);
};

module.exports = {
    Category,
    validateCreateCategory,
    validateUpdateCategory
};