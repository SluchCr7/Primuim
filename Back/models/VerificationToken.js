const mongoose = require('mongoose');

const verificationToken = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    tokenVer: {
        type: String,
        required: true
    }
}, { timestamps: true })

verificationToken.index({ createdAt: 1 }, { expireAfterSeconds: 86400 });

const Verification = mongoose.model('Verification', verificationToken)

module.exports = Verification