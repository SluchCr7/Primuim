const mongoose = require('mongoose');

const sellerInventorySchema = new mongoose.Schema(
  {
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true,
    },
    variant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      default: null,
      index: true,
    },
    warehouse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Warehouse',
      default: null,
      index: true,
    },
    sku: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    declaredStock: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    reservedStock: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    availableStock: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    inventoryStatus: {
      type: String,
      enum: ['active', 'paused', 'out_of_stock', 'archived'],
      default: 'active',
    },
    lowStockThreshold: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastStockUpdate: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

sellerInventorySchema.index({ seller: 1, product: 1, sku: 1 }, { unique: true });

sellerInventorySchema.pre('save', function nextHook(next) {
  this.availableStock = Math.max(0, this.declaredStock - this.reservedStock);
  this.lastStockUpdate = new Date();
  next();
});

module.exports = mongoose.model('SellerInventory', sellerInventorySchema);
