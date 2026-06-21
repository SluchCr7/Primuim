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

// Calculate average rating and ratings count for a product
reviewSchema.statics.calculateAverageRating = async function(productId) {
  const stats = await this.aggregate([
    {
      $match: { product: productId, isApproved: true }
    },
    {
      $group: {
        _id: "$product",
        nRating: { $sum: 1 },
        avgRating: { $avg: "$rating" }
      }
    }
  ]);

  const { Product } = require("./Product");
  
  if (stats.length > 0) {
    await Product.findByIdAndUpdate(productId, {
      ratingCount: stats[0].nRating,
      ratingAverage: Math.round(stats[0].avgRating * 10) / 10
    });
  } else {
    await Product.findByIdAndUpdate(productId, {
      ratingCount: 0,
      ratingAverage: 0
    });
  }
};

// Call calculateAverageRating after save
reviewSchema.post("save", function() {
  this.constructor.calculateAverageRating(this.product);
});

// Call calculateAverageRating after findOneAndDelete (for moderations/deletions)
reviewSchema.post("findOneAndDelete", async function(doc) {
  if (doc) {
    await doc.constructor.calculateAverageRating(doc.product);
  }
});

const Review = mongoose.model("Review", reviewSchema);
const validateCreateReview = (review) => {
    const schema = Joi.object({
        product: Joi.string().hex().length(24).required(),
        user:Joi.string().hex().length(24).required(),
        rating: Joi.number().min(1).max(5).required(),
        comment: Joi.string().max(1000).allow("")
    });
    return schema.validate(review);
}
const validateUpdateReview = (review) => {
    const schema = Joi.object({
        rating: Joi.number().min(1).max(5),
        comment: Joi.string().max(1000).allow("")
    });
    return schema.validate(review);
}


module.exports = {  
    Review,
    validateCreateReview,
    validateUpdateReview
};
