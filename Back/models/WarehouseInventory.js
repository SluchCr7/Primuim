const mongoose = require('mongoose');

const WarehouseInventorySchema = new mongoose.Schema({
  warehouse: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Warehouse', 
    required: true, 
    index: true 
  },
  product: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Product', 
    required: true, 
    index: true 
  },
  sku: { 
    type: String, 
    required: true, 
    index: true 
  }, // Variant SKU
  physicalStock: { 
    type: Number, 
    required: true, 
    default: 0, 
    min: 0 
  },
  reservedStock: { 
    type: Number, 
    required: true, 
    default: 0, 
    min: 0 
  },
  availableStock: { 
    type: Number, 
    required: true, 
    default: 0, 
    min: 0 
  }, // Synced availableStock (physical - reserved)
  reorderPoint: { 
    type: Number, 
    default: 10 
  },
  safetyStock: { 
    type: Number, 
    default: 5 
  }
}, { timestamps: true });

WarehouseInventorySchema.index({ warehouse: 1, sku: 1 }, { unique: true });

// Pre-save hook to ensure availableStock is always computed correctly
WarehouseInventorySchema.pre('save', function(next) {
  this.availableStock = this.physicalStock - this.reservedStock;
  next();
});

module.exports = mongoose.model('WarehouseInventory', WarehouseInventorySchema);
