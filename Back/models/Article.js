const mongoose = require("mongoose");
const Joi = require("joi");

const articleSchema = new mongoose.Schema(
{
    title: {
        type: String,
        required: true,
        trim: true
    },
    content: {
        type: String,
        required: true,
        max : 5000
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true
    },
    image: {
        publicId: String,
        url: String
    },
    isPublished: {
        type: Boolean,
        default: false
    },
    publishedAt: {

        type: Date
    }
},
{
    timestamps: true
});

const Article = mongoose.model("Article", articleSchema);

const validateArticle = (article) => {
    const schema = Joi.object({
        title: Joi.string().max(255).required(),
        content: Joi.string().max(5000).required(),
        author: Joi.string().required(),
        image: Joi.object({
            publicId: Joi.string().required(),
            url: Joi.string().uri().required()
        }).optional(),
        isPublished: Joi.boolean().optional(),
        publishedAt: Joi.date().optional()
    });
    return schema.validate(article);
}

module.exports = {
    Article,validateArticle
};