const mongoose = require('mongoose');
const Joi = require('joi');

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        trim: true
    },
    email : {
        type: String,
        required: true,
        unique: true,
        index: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true,
        select: false
    },
    profileName : {
        type: String,
        default: ''
    },
    profilePhoto: {
        url: {
            type: String,
            default: "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png"
        },
        publicId: {
            type: String,
            default: null
        }
    },
    isAdmin: {
        type: Boolean,
        default: false
    },
    isVerify: {
        type: Boolean,
        default: false
    },
    verifyAt: {
        type: Date
    },
    description: {
        type: String,
        default: "Profile Description"
    },
    role: {
      type: String,
      enum: [
        "customer",
        "admin",
        "seller",
        "moderator",
        "superadmin"
      ],
      default: "customer"
    },
    lastLogin: Date,

    isBlocked: {
      type: Boolean,
      default: false
    },
    phone: {
        type: String,
        default: ""
    },
    
    // Store details for sellers
    brandName: {
        type: String,
        trim: true,
        default: ""
    },
    storeName: {
        type: String,
        trim: true,
        default: ""
    },
    storeSlug: {
        type: String,
        trim: true,
        lowercase: true,
        unique: true,
        sparse: true,
        index: true
    },
    storeLogo: {
        type: String,
        default: "https://via.placeholder.com/150"
    },
    storeCover: {
        type: String,
        default: "https://via.placeholder.com/800x300"
    },
    storeDescription: {
        type: String,
        trim: true,
        default: ""
    },
    country: {
        type: String,
        default: ""
    },
    sellerStatus: {
        type: String,
        enum: ["pending", "approved", "rejected", "suspended"],
        default: null
    },
    storeRating: {
        type: Number,
        default: 0
    },
    totalSales: {
        type: Number,
        default: 0
    },
    responseTime: {
        type: String,
        default: "Within 24 hours"
    },
    followers: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }
    ],
    followingSellers: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }
    ],
    
    // Security and Locking
    failedLoginAttempts: {
        type: Number,
        default: 0
    },
    lockUntil: {
        type: Date
    },
    otpSecret: {
        type: String,
        select: false
    },
    otpExpires: {
        type: Date
    },
    is2FAEnabled: {
        type: Boolean,
        default: false
    },
    passwordResetToken: {
        type: String,
        select: false
    },
    passwordResetExpires: {
        type: Date
    },

    // Ecommerce & Loyalty
    addresses: [
        {
            fullName: { type: String, required: true },
            phone: { type: String, required: true },
            city: { type: String, required: true },
            street: { type: String, required: true },
            postalCode: { type: String, default: "" },
            country: { type: String, default: "Egypt" },
            isDefault: { type: Boolean, default: false }
        }
    ],
    walletBalance: {
        type: Number,
        default: 0,
        min: 0
    },
    loyaltyPoints: {
        type: Number,
        default: 0,
        min: 0
    },
    referralCode: {
        type: String,
        unique: true,
        sparse: true
    },
    referredBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null
    },

    // Logs & History
    loginHistory: [
        {
            ip: String,
            device: String,
            loginAt: { type: Date, default: Date.now }
        }
    ],
    activityLogs: [
        {
            action: String,
            ip: String,
            details: String,
            createdAt: { type: Date, default: Date.now }
        }
    ]
},{
    timestamps: true
})

// Auto-generate referral code on save if missing
UserSchema.pre("save", async function () {
    if (!this.referralCode) {
        const crypto = require("crypto");
        this.referralCode = crypto.randomBytes(4).toString("hex").toUpperCase();
    }
    
    if (this.isModified("password")) {
        const bcrypt = require("bcrypt");
        this.password = await bcrypt.hash(this.password, 12);
    }

    if (this.role === "seller" && this.storeName && (this.isModified("storeName") || !this.storeSlug)) {
        const slugify = require("slugify");
        let baseSlug = slugify(this.storeName, { lower: true, strict: true });
        
        // Ensure uniqueness
        const existing = await mongoose.model("User").findOne({ storeSlug: baseSlug, _id: { $ne: this._id } });
        if (existing) {
            baseSlug = `${baseSlug}-${Math.floor(1000 + Math.random() * 9000)}`;
        }
        this.storeSlug = baseSlug;
    }
});

const User = mongoose.model('User', UserSchema);


const validateRegisterUser = (user) => {
    const schema = Joi.object({
        username: Joi.string().min(3).max(30).required(),
        email: Joi.string().email().lowercase().required(),
        // Enforce strong password: min 8 chars, 1 upper, 1 lower, 1 number, 1 special char
        password: Joi.string()
            .min(8)
            .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\\$%\\^&\\*])'))
            .message('Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character')
            .required(),
        referredByCode: Joi.string().uppercase().length(8).optional().allow("", null),
        role: Joi.string().valid("customer", "seller").optional(),
        
        // Seller specific fields
        brandName: Joi.string().when('role', { is: 'seller', then: Joi.string().required(), otherwise: Joi.string().optional() }),
        storeName: Joi.string().when('role', { is: 'seller', then: Joi.string().required(), otherwise: Joi.string().optional() }),
        country: Joi.string().when('role', { is: 'seller', then: Joi.string().required(), otherwise: Joi.string().optional() }),
        storeDescription: Joi.string().optional().allow(""),
        storeLogo: Joi.string().uri().optional().allow(""),
        storeCover: Joi.string().uri().optional().allow(""),
        phone: Joi.string().optional().allow("")
    });
    return schema.validate(user);
};

const validateLoginUser = (user) => {
    const schema = Joi.object({
        email: Joi.string().email().lowercase().required(),
        password: Joi.string().required(),
    });
    return schema.validate(user);
};

const validateUpdateUser = (user) => {
    const schema = Joi.object({
        username: Joi.string().min(3).max(30),
        email: Joi.string().email(),
        password: Joi.string().min(8),
        profileName: Joi.string().max(50).allow(""),
        description: Joi.string().max(500).allow(""),
        phone: Joi.string().max(20).allow(""),
        addresses: Joi.array().items(
            Joi.object({
                fullName: Joi.string().required(),
                phone: Joi.string().required(),
                city: Joi.string().required(),
                street: Joi.string().required(),
                postalCode: Joi.string().allow("").optional(),
                country: Joi.string().optional(),
                isDefault: Joi.boolean().optional()
            })
        ).optional()
    });
    return schema.validate(user);
}

const validateUpdateStoreProfile = (store) => {
    const schema = Joi.object({
        storeName: Joi.string().trim().min(3).max(100),
        brandName: Joi.string().trim().min(2).max(100),
        storeDescription: Joi.string().trim().max(1000).allow(""),
        storeLogo: Joi.string().uri().allow("").optional(),
        storeCover: Joi.string().uri().allow("").optional(),
        country: Joi.string().trim().max(100),
        responseTime: Joi.string().trim().max(100),
    });
    return schema.validate(store);
};

module.exports = {
    User,
    validateRegisterUser,
    validateLoginUser,
    validateUpdateUser,
    validateUpdateStoreProfile
};
