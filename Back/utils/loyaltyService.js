const LoyaltyWallet = require('../models/LoyaltyWallet');
const LoyaltyTransaction = require('../models/LoyaltyTransaction');

const TIER_CONFIGS = {
  Bronze: { minSpend: 0, multiplier: 1.0 },
  Silver: { minSpend: 500, multiplier: 1.25 },
  Gold: { minSpend: 1500, multiplier: 1.5 },
  Platinum: { minSpend: 5000, multiplier: 2.0 }
};

/**
 * Calculates a user's loyalty tier based on rolling annual spend.
 */
function calculateTier(annualSpend) {
  if (annualSpend >= TIER_CONFIGS.Platinum.minSpend) return 'Platinum';
  if (annualSpend >= TIER_CONFIGS.Gold.minSpend) return 'Gold';
  if (annualSpend >= TIER_CONFIGS.Silver.minSpend) return 'Silver';
  return 'Bronze';
}

/**
 * Awards points to a user based on order value, updates tier, and appends transaction.
 */
async function awardLoyaltyPoints(userId, orderId, orderValue, session) {
  let wallet = await LoyaltyWallet.findOne({ user: userId }).session(session);
  if (!wallet) {
    wallet = new LoyaltyWallet({ user: userId });
  }

  const multiplier = TIER_CONFIGS[wallet.tier].multiplier;
  const pointsEarned = Math.floor(orderValue * multiplier);

  if (pointsEarned <= 0) return;

  const expiryDate = new Date();
  expiryDate.setFullYear(expiryDate.getFullYear() + 1); // Valid for 1 year

  // Create transaction record
  const [transaction] = await LoyaltyTransaction.create([{
    wallet: wallet._id,
    user: userId,
    amount: pointsEarned,
    type: 'EARNED',
    description: `Earned points on purchase. Tier multiplier: ${multiplier}x`,
    referenceId: orderId
  }], { session });

  // Update wallet
  wallet.balance += pointsEarned;
  wallet.lifetimePointsEarned += pointsEarned;
  wallet.rollingAnnualSpend += orderValue;
  wallet.tier = calculateTier(wallet.rollingAnnualSpend);
  
  wallet.pointBuckets.push({
    points: pointsEarned,
    expiryDate,
    transactionId: transaction._id
  });

  // Sort point buckets so closest to expiry is first (FIFO)
  wallet.pointBuckets.sort((a, b) => a.expiryDate - b.expiryDate);

  await wallet.save({ session });
}

/**
 * Safely redeems loyalty points using atomic queries and FIFO bucket deduction.
 */
async function redeemLoyaltyPoints(userId, pointsToRedeem, orderId, session) {
  if (pointsToRedeem <= 0) throw new Error("Invalid points amount to redeem.");

  // Atomic check and update of balance
  const updatedWallet = await LoyaltyWallet.findOneAndUpdate(
    { 
      user: userId, 
      balance: { $gte: pointsToRedeem } 
    },
    { 
      $inc: { balance: -pointsToRedeem } 
    },
    { 
      session, 
      new: true 
    }
  );

  if (!updatedWallet) {
    throw new Error("Insufficient loyalty points or concurrent modification lock occurred.");
  }

  // Create transaction
  const [transaction] = await LoyaltyTransaction.create([{
    wallet: updatedWallet._id,
    user: userId,
    amount: -pointsToRedeem,
    type: 'REDEEMED',
    description: `Redeemed points on order #${orderId}`,
    referenceId: orderId
  }], { session });

  // Deduct from point buckets in FIFO order
  let remainingToDeduct = pointsToRedeem;
  const activeBuckets = [...updatedWallet.pointBuckets];

  for (let i = 0; i < activeBuckets.length; i++) {
    if (activeBuckets[i].points <= remainingToDeduct) {
      remainingToDeduct -= activeBuckets[i].points;
      activeBuckets[i].points = 0;
    } else {
      activeBuckets[i].points -= remainingToDeduct;
      remainingToDeduct = 0;
      break;
    }
  }

  if (remainingToDeduct > 0) {
    throw new Error("Deduction overflow: Buckets did not contain enough points.");
  }

  updatedWallet.pointBuckets = activeBuckets.filter(b => b.points > 0);
  await updatedWallet.save({ session });
}

/**
 * Background / utility function to expire points.
 */
async function processExpiredPoints() {
  const now = new Date();
  // Find wallets that have expired buckets
  const wallets = await LoyaltyWallet.find({ 'pointBuckets.expiryDate': { $lte: now } });

  for (const wallet of wallets) {
    const session = await LoyaltyWallet.startSession();
    session.startTransaction();
    try {
      // Re-fetch inside transaction
      const w = await LoyaltyWallet.findById(wallet._id).session(session);
      let expiredTotal = 0;
      const unexpiredBuckets = [];

      for (const bucket of w.pointBuckets) {
        if (bucket.expiryDate <= now) {
          expiredTotal += bucket.points;
        } else {
          unexpiredBuckets.push(bucket);
        }
      }

      if (expiredTotal > 0) {
        // Create transaction
        await LoyaltyTransaction.create([{
          wallet: w._id,
          user: w.user,
          amount: -expiredTotal,
          type: 'EXPIRED',
          description: `Expired ${expiredTotal} loyalty points.`
        }], { session });

        // Update balance (cap balance at 0 to avoid negative values on expiration if already spent)
        w.balance = Math.max(0, w.balance - expiredTotal);
        w.pointBuckets = unexpiredBuckets;
        await w.save({ session });
      }

      await session.commitTransaction();
    } catch (err) {
      await session.abortTransaction();
      console.error(`Failed to expire points for wallet ${wallet._id}:`, err);
    } finally {
      session.endSession();
    }
  }
}

module.exports = {
  awardLoyaltyPoints,
  redeemLoyaltyPoints,
  processExpiredPoints,
  calculateTier,
  TIER_CONFIGS
};
