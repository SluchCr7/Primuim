const Cart = require("../models/Cart");
const asyncHandler = require("express-async-handler");
const { Product } = require("../models/Product");
const WarehouseInventory = require("../models/WarehouseInventory");
const Warehouse = require("../models/Warehouse");
const StockReservation = require("../models/StockReservation");
const { getAvailableStock } = require("../utils/inventoryService");

const isValidQuantity = (quantity) => Number.isSafeInteger(quantity) && quantity > 0;

const resolveCartSelection = async (product, variantSku, userId, cartId) => {
    let sku;
    let price = product.price;

    if (product.variants?.length) {
        const variant = product.variants.find(
            item => item.sku.toUpperCase() === String(variantSku || "").trim().toUpperCase()
        );
        if (!variant) {
            throw Object.assign(new Error("Select a valid product variant."), { statusCode: 400 });
        }
        sku = variant.sku;
        price = variant.price;
    } else {
        if (variantSku) {
            throw Object.assign(new Error("This product does not have selectable variants."), { statusCode: 400 });
        }
        sku = product.sku || product.slug;
    }

    let available;
    if ((product.inventoryMode || "seller-managed") === "warehouse-managed") {
        const warehouses = await Warehouse.find({ isActive: true }).select("_id");
        const rows = warehouses.length
            ? await WarehouseInventory.find({
                product: product._id,
                sku,
                warehouse: { $in: warehouses.map(warehouse => warehouse._id) },
            })
            : [];
        available = rows.reduce((sum, row) => sum + Number(row.availableStock || 0), 0);
        if (cartId) {
            const ownReservations = await StockReservation.find({
                user: userId,
                cartId: String(cartId),
                product: product._id,
                sku,
                $or: [{ source: "warehouse-managed" }, { source: { $exists: false } }],
                status: "active",
                expiresAt: { $gt: new Date() },
            });
            available += ownReservations.reduce((sum, reservation) => sum + reservation.quantity, 0);
        }
    } else {
        available = await getAvailableStock({
            seller: product.seller,
            product: product._id,
            sku,
            user: userId,
            cartId,
        });
    }

    return { sku, price, available };
};

const recalculateCart = async (cart) => {
    await cart.populate("items.product");
    cart.totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);
    cart.totalPrice = cart.items.reduce((sum, item) => sum + item.quantity * item.price, 0);
    await cart.save();
};

// ========================================
// GET CART
// ========================================
const getCart = asyncHandler(async (req, res) => {

    const cart = await Cart.findOne({ user: req.user.id })
        .populate("items.product", "title price images stock sku slug variants seller inventoryMode");

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

    for (const item of cart.items) {
        if (!item.product) continue;
        const selected = await resolveCartSelection(item.product, item.variantSku, req.user.id, cart._id);
        item.availableStock = selected.available;
        item.price = selected.price;
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

    const { productId, quantity, variantSku } = req.body;

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
    if (product.isDeleted || product.isPublished === false) {
        return res.status(409).json({
            success: false,
            message: "Product is no longer available"
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

    let selection;
    try {
        selection = await resolveCartSelection(product, variantSku, req.user.id, cart._id);
    } catch (error) {
        return res.status(error.statusCode || 400).json({ success: false, message: error.message });
    }

    const selectedVariantSku = product.variants?.length ? selection.sku : null;
    const existingItem = cart.items.find(item =>
        item.product.toString() === productId &&
        (item.variantSku || null) === selectedVariantSku
    );

    if (existingItem) {
        if (existingItem.quantity + quantity > selection.available) {
            return res.status(409).json({
                success: false,
                message: `Only ${selection.available} units are available`
            });
        }
        existingItem.quantity += quantity;
        existingItem.price = selection.price;
    } else {
        if (quantity > selection.available) {
            return res.status(409).json({
                success: false,
                message: `Only ${selection.available} units are available`
            });
        }
        cart.items.push({
            product: productId,
            variantSku: selectedVariantSku,
            quantity,
            price: selection.price
        });
    }

    await cart.save();
    await recalculateCart(cart);

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
    const variantSku = req.query.variantSku;

    const cart = await Cart.findOne({ user: req.user.id });

    if (!cart) {
        return res.status(404).json({
            success: false,
            message: "Cart not found"
        });
    }

    cart.items = cart.items.filter(item =>
        item.product.toString() !== productId ||
        (variantSku ? item.variantSku !== variantSku : Boolean(item.variantSku))
    );

    await cart.save();
    await recalculateCart(cart);

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
    const { items } = req.body; // array of { productId, quantity, variantSku }

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
        const { productId, quantity, variantSku } = item;
        if (!productId || !isValidQuantity(quantity)) {
            return res.status(400).json({
                success: false,
                message: "Guest cart items must have a product ID and a positive whole-number quantity."
            });
        }

        const product = await Product.findById(productId);
        if (!product || product.isDeleted || product.isPublished === false) {
            return res.status(409).json({
                success: false,
                message: "A guest cart product is no longer available."
            });
        }
        if (product.seller && product.seller.toString() === req.user.id) {
            return res.status(400).json({
                success: false,
                message: "You cannot add your own product to the cart."
            });
        }

        let selection;
        try {
            selection = await resolveCartSelection(product, variantSku, req.user.id, cart._id);
        } catch (error) {
            return res.status(error.statusCode || 400).json({ success: false, message: error.message });
        }
        const selectedVariantSku = product.variants?.length ? selection.sku : null;
        const existingItem = cart.items.find(ci =>
            ci.product.toString() === productId && (ci.variantSku || null) === selectedVariantSku
        );

        const nextQuantity = (existingItem?.quantity || 0) + quantity;
        if (nextQuantity > selection.available) {
            return res.status(409).json({
                success: false,
                message: `Only ${selection.available} units of ${product.title} are available.`
            });
        }
        if (existingItem) {
            existingItem.quantity = nextQuantity;
            existingItem.price = selection.price;
        } else {
            cart.items.push({
                product: productId,
                variantSku: selectedVariantSku,
                quantity,
                price: selection.price
            });
        }
    }

    await cart.save();

    cart.totalItems = cart.items.reduce(
        (sum, item) => sum + item.quantity,
        0
    );

    cart.totalPrice = cart.items.reduce(
        (sum, item) =>         sum + item.quantity * item.price,
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
    const { productId, quantity, variantSku } = req.body;

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
        item => item.product.toString() === productId &&
            (item.variantSku || null) === (variantSku || null)
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
            if (product.isDeleted || product.isPublished === false) {
                return res.status(409).json({
                    success: false,
                    message: "Product is no longer available"
                });
            }
            let selection;
            try {
                selection = await resolveCartSelection(product, variantSku, req.user.id, cart._id);
            } catch (error) {
                return res.status(error.statusCode || 400).json({ success: false, message: error.message });
            }
            if (quantity > selection.available) {
                return res.status(409).json({
                    success: false,
                    message: `Only ${selection.available} units are available`
                });
            }
            cart.items[itemIndex].quantity = quantity;
            cart.items[itemIndex].price = selection.price;
        }
    } else {
        return res.status(404).json({
            success: false,
            message: "Item not found in cart"
        });
    }

    await cart.save();
    cart.totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);
    cart.totalPrice = cart.items.reduce(
        (sum, item) => sum + item.quantity * item.price,
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