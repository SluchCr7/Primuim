const asyncHandler = require("express-async-handler");
const bcrypt = require("bcrypt");
const Joi = require("joi");

const Wishlist = require("../models/Wishlist");
const { User, validateUpdateUser } = require("../models/User");
const { cloudUpload, cloudRemove } = require("../config/cloudUplaod");

// ========================================
// @desc    Get Current User
// @route   GET /api/users/me
// @access  Private
// ========================================
const getMe = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id);

    if (!user) {
        return res.status(404).json({
            success: false,
            message: "User not found"
        });
    }

    res.status(200).json({
        success: true,
        user
    });
});

// ========================================
// @desc    Update User Profile
// @route   PUT /api/users/profile
// @access  Private
// ========================================
const updateProfile = asyncHandler(async (req, res) => {
    const { error } = validateUpdateUser(req.body);

    if (error) {
        return res.status(400).json({
            success: false,
            message: error.details[0].message
        });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
        return res.status(404).json({
            success: false,
            message: "User not found"
        });
    }

    const allowedFields = [
        "username",
        "email",
        "profileName",
        "description",
        "phone"
    ];

    if (req.body.email && req.body.email !== user.email) {
        const emailExists = await User.findOne({ email: req.body.email });

        if (emailExists) {
            return res.status(400).json({
                success: false,
                message: "Email already exists"
            });
        }

        user.isVerify = false;
        user.verifyAt = undefined;
    }

    allowedFields.forEach((field) => {
        if (req.body[field] !== undefined) {
            user[field] = req.body[field];
        }
    });

    await user.save();

    res.status(200).json({
        success: true,
        message: "Profile updated successfully",
        user
    });
});

// ========================================
// @desc    Update Password
// @route   PUT /api/users/password
// @access  Private
// ========================================
const updatePassword = asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
        return res.status(400).json({
            success: false,
            message: "Current password and new password are required"
        });
    }

    if (newPassword.length < 8) {
        return res.status(400).json({
            success: false,
            message: "Password must be at least 8 characters"
        });
    }

    const user = await User.findById(req.user.id).select("+password");

    if (!user) {
        return res.status(404).json({
            success: false,
            message: "User not found"
        });
    }

    const isMatch = await bcrypt.compare(
        currentPassword,
        user.password
    );

    if (!isMatch) {
        return res.status(401).json({
            success: false,
            message: "Current password is incorrect"
        });
    }

    // لو عندك pre-save middleware للهاش
    user.password = newPassword;

    // لو معندكش middleware استخدم:
    // user.password = await bcrypt.hash(newPassword, 12);

    await user.save();

    res.status(200).json({
        success: true,
        message: "Password updated successfully"
    });
});

// ========================================
// @desc    Upload Profile Photo
// @route   PATCH /api/users/profile-photo
// @access  Private
// ========================================
const uploadProfilePhoto = asyncHandler(async (req, res) => {
    if (!req.file) {
        return res.status(400).json({
            success: false,
            message: "No image file provided"
        });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
        return res.status(404).json({
            success: false,
            message: "User not found"
        });
    }

    // Upload new image first
    const uploadedImage = await cloudUpload(req.file);

    // Remove old image after successful upload
    if (
        user.profilePhoto?.publicId &&
        user.profilePhoto.publicId !== null
    ) {
        await cloudRemove(user.profilePhoto.publicId);
    }

    user.profilePhoto = {
        url: uploadedImage.secure_url,
        publicId: uploadedImage.public_id
    };

    await user.save();

    res.status(200).json({
        success: true,
        message: "Profile photo uploaded successfully",
        profilePhoto: user.profilePhoto
    });
});

// ========================================
// @desc    Delete Profile Photo
// @route   DELETE /api/users/profile-photo
// @access  Private
// ========================================
const deleteProfilePhoto = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id);

    if (!user) {
        return res.status(404).json({
            success: false,
            message: "User not found"
        });
    }

    if (!user.profilePhoto?.publicId) {
        return res.status(400).json({
            success: false,
            message: "No profile photo found"
        });
    }

    await cloudRemove(user.profilePhoto.publicId);

    user.profilePhoto = {
        url: "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png",
        publicId: null
    };

    await user.save();

    res.status(200).json({
        success: true,
        message: "Profile photo removed successfully"
    });
});

// ========================================
// @desc    Toggle Wishlist
// @route   POST /api/users/wishlist/:id
// @access  Private
// ========================================
const toggleWishlist = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const productId = req.params.id;

    const existing = await Wishlist.findOne({
        user: userId,
        product: productId
    });

    if (existing) {
        await Wishlist.deleteOne({
            _id: existing._id
        });

        return res.status(200).json({
            success: true,
            message: "Removed from wishlist",
            isLoved: false
        });
    }

    await Wishlist.create({
        user: userId,
        product: productId
    });

    res.status(200).json({
        success: true,
        message: "Added to wishlist",
        isLoved: true
    });
});

// ========================================
// @desc    Get User Wishlist
// @route   GET /api/users/wishlist
// @access  Private
// ========================================
const getWishlist = asyncHandler(async (req, res) => {
    const wishlist = await Wishlist.find({
        user: req.user.id
    }).populate("product");

    res.status(200).json({
        success: true,
        count: wishlist.length,
        wishlist
    });
});

// ========================================
// @desc    Get User Addresses
// @route   GET /api/users/addresses
// @access  Private
// ========================================
const getAddresses = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id);
    if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
    }
    res.status(200).json({ success: true, addresses: user.addresses || [] });
});

// ========================================
// @desc    Add User Address
// @route   POST /api/users/addresses
// @access  Private
// ========================================
const addAddress = asyncHandler(async (req, res) => {
    const { fullName, phone, city, street, postalCode, country, isDefault } = req.body;
    
    const addressSchema = Joi.object({
        fullName: Joi.string().required(),
        phone: Joi.string().required(),
        city: Joi.string().required(),
        street: Joi.string().required(),
        postalCode: Joi.string().allow("").optional(),
        country: Joi.string().optional(),
        isDefault: Joi.boolean().optional()
    });

    const { error } = addressSchema.validate(req.body);
    if (error) {
        return res.status(400).json({ success: false, message: error.details[0].message });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
    }

    if (isDefault) {
        user.addresses.forEach(addr => addr.isDefault = false);
    }

    const defaultFlag = user.addresses.length === 0 ? true : !!isDefault;

    user.addresses.push({
        fullName,
        phone,
        city,
        street,
        postalCode,
        country: country || "Egypt",
        isDefault: defaultFlag
    });

    await user.save();
    res.status(201).json({ success: true, message: "Address added successfully", addresses: user.addresses });
});

// ========================================
// @desc    Update User Address
// @route   PUT /api/users/addresses/:addressId
// @access  Private
// ========================================
const updateAddress = asyncHandler(async (req, res) => {
    const addressId = req.params.addressId;
    const { fullName, phone, city, street, postalCode, country, isDefault } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
    }

    const address = user.addresses.id(addressId);
    if (!address) {
        return res.status(404).json({ success: false, message: "Address not found" });
    }

    if (isDefault) {
        user.addresses.forEach(addr => {
            if (addr._id.toString() !== addressId) {
                addr.isDefault = false;
            }
        });
        address.isDefault = true;
    }

    if (fullName) address.fullName = fullName;
    if (phone) address.phone = phone;
    if (city) address.city = city;
    if (street) address.street = street;
    if (postalCode !== undefined) address.postalCode = postalCode;
    if (country) address.country = country;

    await user.save();
    res.status(200).json({ success: true, message: "Address updated successfully", addresses: user.addresses });
});

// ========================================
// @desc    Delete User Address
// @route   DELETE /api/users/addresses/:addressId
// @access  Private
// ========================================
const deleteAddress = asyncHandler(async (req, res) => {
    const addressId = req.params.addressId;
    const user = await User.findById(req.user.id);
    if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
    }

    const address = user.addresses.id(addressId);
    if (!address) {
        return res.status(404).json({ success: false, message: "Address not found" });
    }

    const wasDefault = address.isDefault;
    user.addresses.pull(addressId);

    if (wasDefault && user.addresses.length > 0) {
        user.addresses[0].isDefault = true;
    }

    await user.save();
    res.status(200).json({ success: true, message: "Address deleted successfully", addresses: user.addresses });
});

// ========================================
// @desc    Set Default Address
// @route   PATCH /api/users/addresses/:addressId/default
// @access  Private
// ========================================
const setDefaultAddress = asyncHandler(async (req, res) => {
    const addressId = req.params.addressId;
    const user = await User.findById(req.user.id);
    if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
    }

    const address = user.addresses.id(addressId);
    if (!address) {
        return res.status(404).json({ success: false, message: "Address not found" });
    }

    user.addresses.forEach(addr => {
        addr.isDefault = addr._id.toString() === addressId;
    });

    await user.save();
    res.status(200).json({ success: true, message: "Default address set successfully", addresses: user.addresses });
});

// ========================================
// @desc    Follow/Unfollow a Seller Store
// @route   POST /api/users/follow/:sellerId
// @access  Private
// ========================================
const followSeller = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { sellerId } = req.params;

    if (userId === sellerId) {
        return res.status(400).json({ success: false, message: "You cannot follow yourself" });
    }

    const seller = await User.findById(sellerId);
    if (!seller || seller.role !== "seller") {
        return res.status(404).json({ success: false, message: "Seller store not found" });
    }

    const user = await User.findById(userId);
    if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
    }

    const isFollowing = user.followingSellers.includes(sellerId);
    const { createNotification } = require("../utils/notifications");

    if (isFollowing) {
        user.followingSellers = user.followingSellers.filter(id => id.toString() !== sellerId);
        seller.followers = seller.followers.filter(id => id.toString() !== userId);
        
        await user.save();
        await seller.save();

        res.status(200).json({
            success: true,
            message: `You have unfollowed "${seller.storeName || seller.username}"`,
            isFollowing: false,
            followersCount: seller.followers.length
        });
    } else {
        user.followingSellers.push(sellerId);
        seller.followers.push(userId);

        await user.save();
        await seller.save();

        await createNotification({
            user: seller._id,
            title: "New Store Follower",
            message: `User "${user.username}" is now following your store!`
        });

        res.status(200).json({
            success: true,
            message: `You are now following "${seller.storeName || seller.username}"`,
            isFollowing: true,
            followersCount: seller.followers.length
        });
    }
});

// ========================================
// @desc    Get Shared Wishlist of a user
// @route   GET /api/users/wishlist/share/:userId
// @access  Public
// ========================================
const getSharedWishlist = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const Wishlist = require("../models/Wishlist");

    const wishlist = await Wishlist.find({ user: userId })
        .populate("product");

    const targetUser = await User.findById(userId).select("username profilePhoto");
    if (!targetUser) {
        return res.status(404).json({ success: false, message: "User not found" });
    }

    res.status(200).json({
        success: true,
        user: targetUser,
        count: wishlist.length,
        wishlist
    });
});

module.exports = {
    getMe,
    updateProfile,
    updatePassword,
    uploadProfilePhoto,
    deleteProfilePhoto,
    toggleWishlist,
    getWishlist,
    getAddresses,
    addAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
    followSeller,
    getSharedWishlist
};