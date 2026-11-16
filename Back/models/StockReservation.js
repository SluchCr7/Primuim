const mongoose = require('mongoose');

const StockReservationSchema = new mongoose.Schema({
  cartId: { type: String, required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
  sku: { type: String, required: true, uppercase: true, trim: true },
  variantSku: { type: String, default: null, uppercase: true, trim: true },
  source: {
    type: String,
    enum: ['seller-managed', 'warehouse-managed'],
    required: true,
    index: true,
  },
  inventory: { type: mongoose.Schema.Types.ObjectId, refPath: 'inventoryModel', default: null },
  inventoryModel: {
    type: String,
    enum: ['SellerInventory', 'WarehouseInventory'],
    required: true,
  },
  warehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', default: null },
  quantity: { type: Number, required: true, min: 1 },
  reservationKey: { type: String, required: true },
  status: {
    type: String,
    enum: ['active', 'committed', 'released', 'expired'],
    default: 'active',
    index: true,
  },
  expiresAt: { type: Date, required: true, index: true }
}, { timestamps: true });

StockReservationSchema.index(
  { reservationKey: 1 },
  { unique: true, partialFilterExpression: { status: 'active' } }
);
StockReservationSchema.index({ status: 1, expiresAt: 1 });

module.exports = mongoose.model('StockReservation', StockReservationSchema);
