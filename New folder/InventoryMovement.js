const mongoose = require('mongoose');

const inventoryMovementSchema = new mongoose.Schema(
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
    sku: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    previousQuantity: {
      type: Number,
      required: true,
      default: 0,
    },
    changedQuantity: {
      type: Number,
      required: true,
      default: 0,
    },
    newQuantity: {
      type: Number,
      required: true,
      default: 0,
    },
    movementType: {
      type: String,
      enum: [
        'INITIAL_STOCK',
        'STOCK_INCREASE',
        'STOCK_DECREASE',
        'MANUAL_ADJUSTMENT',
        'ORDER_RESERVATION',
        'RESERVATION_RELEASE',
        'ORDER_COMMIT',
        'RESTORE_STOCK',
      ],
      required: true,
      index: true,
    },
    reason: {
      type: String,
      trim: true,
      default: '',
    },
    referenceType: {
      type: String,
      trim: true,
      default: 'manual',
    },
    referenceId: {
      type: String,
      trim: true,
      default: '',
    },
    actor: {
      type: String,
      enum: ['seller', 'admin', 'system'],
      default: 'system',
    },
    warehouse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Warehouse',
      default: null,
      index: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('InventoryMovement', inventoryMovementSchema);
