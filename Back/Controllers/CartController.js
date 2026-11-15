const Cart = require("../models/Cart");
const asyncHandler = require("express-async-handler");
const { Product } = require("../models/Product");

const isValidQuantity = (quantity) => Number.isSafeInteger(quantity) && quantity > 0;

// ========================================
// GET CART
// ========================================
const getCart = asyncHandler(async (req, res) => {

    const cart = await Cart.findOne({ user: req.user.id })
        .populate("items.product", "title price images stock");

    if (!cart) {
        return res.status(200).json({
            success: true,
            cart: {
                items: [],
                totalItems: 0,
                totalPrice: 0
            }
        });
    }

    res.json({
        success: true,
        cart
    });
});


// ========================================
// ADD TO CART
// ========================================
const addToCart = asyncHandler(async (req, res) => {

    const { productId, quantity } = req.body;

    if (!productId || !isValidQuantity(quantity)) {
        return res.status(400).json({
            success: false,
            message: "Invalid product or quantity"
        });
    }

    const product = await Product.findById(productId);

    if (!product) {
        return res.status(404).json({
            success: false,
            message: "Product not found"
        });
    }
    if (product.isDeleted || !product.isPublished) {
        return res.status(409).json({
            success: false,
            message: "Product is no longer available"
        });
    }

    if (product.variants?.length > 0) {
        return res.status(400).json({
            success: false,
            message: "Variant products are currently unavailable for purchase."
        });
    }

    if (product.seller && product.seller.toString() === req.user.id) {
        return res.status(400).json({
            success: false,
            message: "You cannot add your own product to the cart"
        });
    }

    let cart = await Cart.findOne({ user: req.user.id });

    if (!cart) {
        cart = new Cart({
            user: req.user.id,
            items: []
        });
    }

    const existingItem = cart.items.find(
        item => item.product.toString() === productId
    );

    if (existingItem) {
        if (existingItem.quantity + quantity > product.stock) {
            return res.status(409).json({
                success: false,
                message: `Only ${product.stock} units are available`
            });
        }
        existingItem.quantity += quantity;
        existingItem.price = product.price;
    } else {
        if (quantity > product.stock) {
            return res.status(409).json({
                success: false,
                message: `Only ${product.stock} units are available`
            });
        }
        cart.items.push({
            product: productId,
            quantity,
            price: product.price
        });
    }

    await cart.save();

    // Recalculate totals (IMPORTANT)
    await cart.populate("items.product");

    cart.totalItems = cart.items.reduce(
        (sum, item) => sum + item.quantity,
        0
    );

    cart.totalPrice = cart.items.reduce(
        (sum, item) => sum + item.quantity * item.product.price,
        0
    );

    await cart.save();

    res.json({
        success: true,
        cart
    });
});


// ========================================
// REMOVE FROM CART
// ========================================
const removeFromCart = asyncHandler(async (req, res) => {

    const productId = req.params.productId;

    const cart = await Cart.findOne({ user: req.user.id });

    if (!cart) {
        return res.status(404).json({
            success: false,
            message: "Cart not found"
        });
    }

    cart.items = cart.items.filter(
        item => item.product.toString() !== productId
    );

    await cart.save();

    await cart.populate("items.product");

    cart.totalItems = cart.items.reduce(
        (sum, item) => sum + item.quantity,
        0
    );

    cart.totalPrice = cart.items.reduce(
        (sum, item) => sum + item.quantity * item.product.price,
        0
    );

    await cart.save();

    res.json({
        success: true,
        cart
    });
});


// ========================================
// CLEAR CART
// ========================================
const clearCart = asyncHandler(async (req, res) => {

    await Cart.findOneAndDelete({ user: req.user.id });

    res.json({
        success: true,
        message: "Cart cleared"
    });
});

// ========================================
// MERGE GUEST CART
// ========================================
const mergeCart = asyncHandler(async (req, res) => {
    const { items } = req.body; // array of { productId, quantity }

    if (!items || !Array.isArray(items)) {
        return res.status(400).json({
            success: false,
            message: "Guest items array is required"
        });
    }

    let cart = await Cart.findOne({ user: req.user.id });

    if (!cart) {
        cart = new Cart({
            user: req.user.id,
            items: []
        });
    }

    for (const item of items) {
        if (!item || typeof item !== "object") {
            return res.status(400).json({
                success: false,
                message: "Each guest cart item must be an object."
            });
        }
        const { productId, quantity } = item;
        if (!productId || !isValidQuantity(quantity)) {
            return res.status(400).json({
                success: false,
                message: "Guest cart items must have a product ID and a positive whole-number quantity."
            });
        }

        const product = await Product.findById(productId);
        if (!product || product.isDeleted || !product.isPublished) {
            return res.status(409).json({
                success: false,
                message: "A guest cart product is no longer available."
            });
        }
        if (product.variants?.length > 0) {
            return res.status(400).json({
                success: false,
                message: "Variant products are currently unavailable for purchase."
            });
        }
        if (product.seller && product.seller.toString() === req.user.id) {
            return res.status(400).json({
                success: false,
                message: "You cannot add your own product to the cart."
            });
        }

        const existingItem = cart.items.find(
            ci => ci.product.toString() === productId
        );

        const nextQuantity = (existingItem?.quantity || 0) + quantity;
        if (nextQuantity > product.stock) {
            return res.status(409).json({
                success: false,
                message: `Only ${product.stock} units of ${product.title} are available.`
            });
        }
        if (existingItem) {
            existingItem.quantity = nextQuantity;
            existingItem.price = product.price;
        } else {
            cart.items.push({
                product: productId,
                quantity,
                price: product.price
            });
        }
    }

    await cart.save();

    await cart.populate("items.product");

    cart.totalItems = cart.items.reduce(
        (sum, item) => sum + item.quantity,
        0
    );

    cart.totalPrice = cart.items.reduce(
        (sum, item) => sum + item.quantity * (item.product ? item.product.price : item.price),
        0
    );

    await cart.save();

    res.status(200).json({
        success: true,
        message: "Guest cart merged successfully",
        cart
    });
});

// ========================================
// UPDATE CART ITEM QUANTITY
// ========================================
const updateCartItemQuantity = asyncHandler(async (req, res) => {
    const { productId, quantity } = req.body;

    if (!productId || !Number.isSafeInteger(quantity) || quantity < 0) {
        return res.status(400).json({
            success: false,
            message: "Invalid product or quantity"
        });
    }

    const cart = await Cart.findOne({ user: req.user.id });

    if (!cart) {
        return res.status(404).json({
            success: false,
            message: "Cart not found"
        });
    }

    const itemIndex = cart.items.findIndex(
        item => item.product.toString() === productId
    );

    if (itemIndex > -1) {
        if (quantity === 0) {
            cart.items.splice(itemIndex, 1);
        } else {
            const product = await Product.findById(productId);
            if (!product) {
                return res.status(404).json({
                    success: false,
                    message: "Product not found"
                });
            }
            if (product.variants?.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: "Variant products are currently unavailable for purchase."
                });
            }
            if (product.isDeleted || !product.isPublished) {
                return res.status(409).json({
                    success: false,
                    message: "Product is no longer available"
                });
            }
            if (quantity > product.stock) {
                return res.status(409).json({
                    success: false,
                    message: `Only ${product.stock} units are available`
                });
            }
            cart.items[itemIndex].quantity = quantity;
        }
    } else {
        return res.status(404).json({
            success: false,
            message: "Item not found in cart"
        });
    }

    await cart.save();
    await cart.populate("items.product");

    cart.totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);
    cart.totalPrice = cart.items.reduce(
        (sum, item) => sum + item.quantity * (item.product ? item.product.price : item.price),
        0
    );

    await cart.save();

    res.json({
        success: true,
        cart
    });
});

// ========================================
module.exports = {
    getCart,
    addToCart,
    removeFromCart,
    clearCart,
    mergeCart,
    updateCartItemQuantity
};