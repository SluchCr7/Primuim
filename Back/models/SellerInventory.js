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
      type: String,
      default: null,
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

sellerInventorySchema.index(
  { seller: 1, product: 1, sku: 1, warehouse: 1 },
  { unique: true }
);

sellerInventorySchema.pre('validate', function validateInventory() {
  if (this.reservedStock > this.declaredStock) {
    this.invalidate('declaredStock', 'Declared stock cannot be less than reserved stock.');
  }
  this.availableStock = this.declaredStock - this.reservedStock;
});

sellerInventorySchema.pre('save', function updateStockTimestamp() {
  this.lastStockUpdate = new Date();
});

module.exports = mongoose.model('SellerInventory', sellerInventorySchema);
