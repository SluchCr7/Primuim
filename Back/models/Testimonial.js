const mongoose = require("mongoose")
const joi = require("joi")

const TestimonialSchema = new mongoose.Schema({
    User : {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    body : {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ["pending", "approved", "rejected"],
        default: "pending"
    }
},{
    timestamps: true
})

const Testimonial = mongoose.model("Testimonial", TestimonialSchema)

const validateTestimonial = (testimonial) => {
    const schema = joi.object({
        User: joi.string().required(),
        body: joi.string().min(50).max(500).required()
    })
    return schema.validate(testimonial)
}

module.exports = { Testimonial, validateTestimonial }
