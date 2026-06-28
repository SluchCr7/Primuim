const mongoose = require("mongoose");
const Joi = require("joi");

const commentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  username: String,
  profilePhoto: String,
  text: {
    type: String,
    required: true
  },
  reply: {
    text: String,
    createdAt: Date
  }
}, { timestamps: true });

const articleSchema = new mongoose.Schema(
{
    title: {
        type: String,
        required: true,
        trim: true
    },
    subtitle: {
        type: String,
        default: ""
    },
    content: {
        type: String,
        required: true,
        max: 15000
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true
    },
    authorName: {
        type: String,
        default: ""
    },
    image: {
        publicId: String,
        url: String
    },
    status: {
        type: String,
        enum: ["pending", "approved", "rejected", "archived", "draft", "deleted"],
        default: "draft"
    },
    rejectionReason: {
        type: String,
        default: ""
    },
    category: {
        type: String,
        default: "Lifestyle"
    },
    tags: {
        type: [String],
        default: []
    },
    views: {
        type: Number,
        default: 0
    },
    uniqueVisitors: {
        type: [String],
        default: []
    },
    likes: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }
    ],
    comments: [commentSchema],
    isFeatured: {
        type: Boolean,
        default: false
    },
    metaTitle: {
        type: String,
        default: ""
    },
    metaDescription: {
        type: String,
        default: ""
    },
    keywords: {
        type: [String],
        default: []
    },
    canonicalUrl: {
        type: String,
        default: ""
    }
},
{
    timestamps: true
});

const Article = mongoose.model("Article", articleSchema);

const validateArticle = (article) => {
    const schema = Joi.object({
        title: Joi.string().max(255).required(),
        subtitle: Joi.string().max(255).allow("").optional(),
        content: Joi.string().max(15000).required(),
        author: Joi.string().required(),
        authorName: Joi.string().allow("").optional(),
        image: Joi.object({
            publicId: Joi.string().required(),
            url: Joi.string().uri().required()
        }).optional(),
        status: Joi.string().valid("pending", "approved", "rejected", "archived", "draft", "deleted").optional(),
        rejectionReason: Joi.string().allow("").optional(),
        category: Joi.string().max(100).optional(),
        tags: Joi.array().items(Joi.string()).optional(),
        metaTitle: Joi.string().max(255).allow("").optional(),
        metaDescription: Joi.string().max(500).allow("").optional(),
        keywords: Joi.array().items(Joi.string()).optional(),
        canonicalUrl: Joi.string().uri().allow("").optional(),
        isPublished: Joi.boolean().optional()
    });
    return schema.validate(article);
}

module.exports = {
    Article,
    validateArticle
};