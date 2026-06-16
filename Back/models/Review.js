const mongoose = require("mongoose");
const Joi = require("joi");

const reviewSchema = new mongoose.Schema(
{
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true,
        index: true
    },

    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true
    },

    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },

    comment: {
        type: String,
        trim: true,
        maxlength: 1000
    }
},
{
    timestamps: true
});

const Review = mongoose.model("Review", reviewSchema);

const validateReview = (review) => {
    const schema = Joi.object({
        product: Joi.string().hex().length(24).required(),
        user:Joi.string().hex().length(24).required(),
        rating: Joi.number().min(1).max(5).required(),
        comment: Joi.string().max(1000).allow("")
    });
    return schema.validate(review);
}

module.exports = {  
    Review,
    validateReview
};