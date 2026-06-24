const mongoose = require("mongoose");
const Joi = require("joi");

const imageSchema = new mongoose.Schema(
  {
    publicId: {
      type: String,
      required: true,
      trim: true,
    },
    url: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { _id: false }
);

const inventoryLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      enum: ["sale", "restock", "adjustment", "refund"],
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
    },
    note: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

// ── Attribute axis: one entry per selectable dimension (e.g. Color, Size) ──
const attributeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      // e.g. "Color", "Size", "RAM", "Storage"
    },
    values: {
      type: [String],
      required: true,
      validate: {
        validator: (arr) => Array.isArray(arr) && arr.length > 0,
        message: "Attribute must have at least one value.",
      },
    },
  },
  { _id: false }
);

// ── Variant: one document per unique combination of attribute values ─────────
// e.g. { combination: { Color: "Red", Size: "M" }, stock: 10, price: 29.99 }
const productVariantSchema = new mongoose.Schema(
  {
    sku: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    stock: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    /**
     * combination stores the exact attribute key→value pair for this variant.
     * Using Map<String,String> keeps it schema-flexible for any category.
     * Example: { "Color": "Red", "Size": "M" }
     */
    combination: {
      type: Map,
      of: String,
      default: {},
    },
    /**
     * @deprecated – kept for backward-compatibility with older products
     * that used a generic attributes Map before this system was introduced.
     * New products should use `combination` instead.
     */
    attributes: {
      type: Map,
      of: String,
      default: {},
    },
    image: {
      type: String,
      default: "",
    },
  },
  { _id: false }
);

const specificationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    value: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, "Product title is required"],
      trim: true,
      minlength: 3,
      maxlength: 200,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      required: [true, "Product description is required"],
      minlength: 10,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Category is required"],
      index: true,
    },
    subcategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      default: null,
      index: true,
    },
    brand: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    images: {
      type: [imageSchema],
      default: [],
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: 0,
    },
    comparePrice: {
      type: Number,
      min: 0,
    },
    stock: {
      type: Number,
      default: 0,
      min: 0,
    },
    lowStockThreshold: {
      type: Number,
      default: 5,
      min: 0,
    },
    reservedStock: {
      type: Number,
      default: 0,
      min: 0,
    },
    sku: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      uppercase: true,
    },
    ratingAverage: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    ratingCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    sold: {
      type: Number,
      default: 0,
      min: 0,
    },
    salesCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    isBestSeller: {
      type: Boolean,
      default: false,
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
    inventoryLogs: {
      type: [inventoryLogSchema],
      default: [],
    },

    // Extended Enterprise E-commerce Fields

    /**
     * attributes — describes the available selection axes for this product.
     * e.g. [{ name: "Color", values: ["Red","Black"] }, { name: "Size", values: ["S","M","L"] }]
     * Products without variants (Electronics specs, simple products) can leave this empty.
     */
    attributes: {
      type: [attributeSchema],
      default: [],
    },

    /**
     * variants — one document per unique combination of attribute values.
     * Auto-generated by the cartesian product of all attribute axes.
     * Each variant tracks its own stock and (optional) price override.
     */
    variants: {
      type: [productVariantSchema],
      default: [],
    },

    specifications: {
      type: [specificationSchema],
      default: [],
    },
    isDigital: {
      type: Boolean,
      default: false,
    },
    digitalFileUrl: {
      type: String,
      default: "",
    },
    isBundle: {
      type: Boolean,
      default: false,
    },
    bundleProducts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
    ],
    tags: {
      type: [String],
      default: [],
    },
    metaTitle: {
      type: String,
      trim: true,
      default: "",
    },
    metaDescription: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

productSchema.index({
  title: "text",
  description: "text",
  tags: "text",
});

productSchema.index({
  createdAt: -1,
});

productSchema.index({ isBestSeller: 1, isDeleted: 1, isPublished: 1 });
productSchema.index({ isDeleted: 1, isPublished: 1, category: 1, createdAt: -1 });
productSchema.index({ seller: 1, isDeleted: 1, createdAt: -1 });

const Product = mongoose.model("Product", productSchema);

const validateCreateProduct = (obj) => {
  const schema = Joi.object({
    title: Joi.string().trim().min(3).max(200).required(),
    description: Joi.string().min(10).required(),
    category: Joi.string().hex().length(24).required(),
    subcategory: Joi.string().hex().length(24).optional().allow(null, ""),
    brand: Joi.string().trim().max(100).allow("").optional(),
    price: Joi.number().min(0).required(),
    comparePrice: Joi.number().min(0).optional(),
    stock: Joi.number().integer().min(0).default(0),
    sku: Joi.string().trim().max(100).optional(),
    isPublished: Joi.boolean().optional(),
    images: Joi.array()
      .items(
        Joi.object({
          publicId: Joi.string().required(),
          url: Joi.string().uri().required(),
        })
      )
      .optional(),
    attributes: Joi.array()
      .items(
        Joi.object({
          name: Joi.string().trim().required(),
          values: Joi.array().items(Joi.string().trim()).min(1).required(),
        })
      )
      .optional(),
    variants: Joi.array()
      .items(
        Joi.object({
          sku: Joi.string().trim().required(),
          price: Joi.number().min(0).required(),
          stock: Joi.number().integer().min(0).required(),
          // New explicit combination map (e.g. { Color: "Red", Size: "M" })
          combination: Joi.object().pattern(Joi.string(), Joi.string()).optional(),
          // Legacy field — kept for backward-compat
          attributes: Joi.object().pattern(Joi.string(), Joi.string()).optional(),
          image: Joi.string().allow("").optional(),
        })
      )
      .optional(),
    specifications: Joi.array()
      .items(
        Joi.object({
          name: Joi.string().required(),
          value: Joi.string().required(),
        })
      )
      .optional(),
    isDigital: Joi.boolean().optional(),
    digitalFileUrl: Joi.string().allow("").optional(),
    isBundle: Joi.boolean().optional(),
    bundleProducts: Joi.array().items(Joi.string().hex().length(24)).optional(),
    tags: Joi.array().items(Joi.string()).optional(),
    metaTitle: Joi.string().max(100).allow("").optional(),
    metaDescription: Joi.string().max(200).allow("").optional(),
  });

  return schema.validate(obj);
};

module.exports = { Product, validateCreateProduct };