const mongoose = require('mongoose');

const LoyaltyTransactionSchema = new mongoose.Schema({
  wallet: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'LoyaltyWallet', 
    required: true, 
    index: true 
  },
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true, 
    index: true 
  },
  amount: { 
    type: Number, 
    required: true 
  }, // Positive for credit, negative for debit
  type: { 
    type: String, 
    enum: ['EARNED', 'REDEEMED', 'EXPIRED', 'REFUNDED', 'ADJUSTMENT'], 
    required: true,
    index: true
  },
  description: { 
    type: String, 
    required: true 
  },
  referenceId: { 
    type: mongoose.Schema.Types.ObjectId, 
    required: false 
  }
}, { timestamps: true });

LoyaltyTransactionSchema.index({ createdAt: -1 });

module.exports = mongoose.model('LoyaltyTransaction', LoyaltyTransactionSchema);
