const mongoose = require('mongoose');

const PointBucketSchema = new mongoose.Schema({
  points: { type: Number, required: true, min: 1 },
  expiryDate: { type: Date, required: true },
  transactionId: { type: mongoose.Schema.Types.ObjectId, ref: 'LoyaltyTransaction', required: true }
}, { _id: false });

const LoyaltyWalletSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true, 
    unique: true, 
    index: true 
  },
  balance: { 
    type: Number, 
    default: 0, 
    min: 0 
  },
  tier: { 
    type: String, 
    enum: ['Bronze', 'Silver', 'Gold', 'Platinum'], 
    default: 'Bronze',
    index: true
  },
  lifetimePointsEarned: { 
    type: Number, 
    default: 0 
  },
  rollingAnnualSpend: { 
    type: Number, 
    default: 0 
  },
  pointBuckets: [PointBucketSchema]
}, { timestamps: true });

module.exports = mongoose.model('LoyaltyWallet', LoyaltyWalletSchema);
