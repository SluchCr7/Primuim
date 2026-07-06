const mongoose = require('mongoose');

const StockReservationSchema = new mongoose.Schema({
  cartId: { type: String, required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  sku: { type: String, required: true },
  warehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
  quantity: { type: Number, required: true, min: 1 },
  expiresAt: { type: Date, required: true }
}, { timestamps: true });

// Auto-delete using MongoDB background TTL daemon
StockReservationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
StockReservationSchema.index({ cartId: 1, sku: 1 }, { unique: true });

module.exports = mongoose.model('StockReservation', StockReservationSchema);
