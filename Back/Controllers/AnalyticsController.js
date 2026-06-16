const asyncHandler = require("express-async-handler");
const AnalyticsEvent = require("../models/AnalyticsEvent");
const { Order } = require("../models/Order");
const { User } = require("../models/User");
const { Product } = require("../models/Product");
const Payment = require("../models/Payment");

// ========================================
// @desc    Log Analytics Event
// @route   POST /api/analytics/event
// @access  Public/Private
// ========================================
const logEvent = asyncHandler(async (req, res) => {
  const { sessionId, eventType, metadata } = req.body;

  if (!sessionId || !eventType) {
    return res.status(400).json({ success: false, message: "Session ID and Event Type are required" });
  }

  const event = await AnalyticsEvent.create({
    user: req.user ? req.user.id : null,
    sessionId,
    eventType,
    metadata: metadata || {}
  });

  res.status(201).json({ success: true, event });
});

// ========================================
// @desc    Get Funnel Analytics (Checkout Drop-off rates)
// @route   GET /api/analytics/funnel
// @access  Private/Admin
// ========================================
const getFunnelAnalytics = asyncHandler(async (req, res) => {
  const days = Number(req.query.days) || 30;
  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - days);

  // Group and count unique sessions for each funnel stage
  const stages = [
    "product_view",
    "add_to_cart",
    "checkout_shipping",
    "checkout_payment",
    "purchase"
  ];

  const funnelData = await Promise.all(
    stages.map(async (stage) => {
      const result = await AnalyticsEvent.aggregate([
        {
          $match: {
            eventType: stage,
            createdAt: { $gte: fromDate }
          }
        },
        {
          $group: {
            _id: null,
            uniqueSessions: { $addToSet: "$sessionId" }
          }
        },
        {
          $project: {
            count: { $size: "$uniqueSessions" }
          }
        }
      ]);
      return {
        stage,
        count: result[0] ? result[0].count : 0
      };
    })
  );

  // Calculate conversion and drop-off percentages
  const reports = funnelData.map((data, index) => {
    const prevCount = index === 0 ? data.count : funnelData[index - 1].count;
    const initialCount = funnelData[0].count;

    const conversionFromPrev = prevCount === 0 ? 0 : Math.round((data.count / prevCount) * 10000) / 100;
    const overallConversion = initialCount === 0 ? 0 : Math.round((data.count / initialCount) * 10000) / 100;
    const dropOffRate = prevCount === 0 ? 0 : Math.round((100 - (data.count / prevCount) * 100) * 100) / 100;

    return {
      ...data,
      conversionFromPrev,
      overallConversion,
      dropOffRate
    };
  });

  res.status(200).json({ success: true, days, funnel: reports });
});

// ========================================
// @desc    Get Cohort Analytics (User retention based on registration month)
// @route   GET /api/analytics/cohort
// @access  Private/Admin
// ========================================
const getCohortAnalytics = asyncHandler(async (req, res) => {
  // Let's group users by their registration month
  const cohortGroup = await User.aggregate([
    {
      $project: {
        registrationMonth: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
        _id: 1
      }
    },
    {
      $group: {
        _id: "$registrationMonth",
        cohortSize: { $sum: 1 },
        userIds: { $push: "$_id" }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  const cohortReport = await Promise.all(
    cohortGroup.map(async (cohort) => {
      const { _id: month, cohortSize, userIds } = cohort;
      const retention = [];

      // Calculate order retention for subsequent months (up to 4 months)
      for (let m = 0; m < 4; m++) {
        const startMonth = new Date(month + "-01");
        startMonth.setMonth(startMonth.getMonth() + m);
        
        const endMonth = new Date(startMonth);
        endMonth.setMonth(endMonth.getMonth() + 1);

        const retainedCount = await Order.aggregate([
          {
            $match: {
              user: { $in: userIds },
              createdAt: { $gte: startMonth, $lt: endMonth },
              orderStatus: { $ne: "cancelled" }
            }
          },
          {
            $group: {
              _id: "$user"
            }
          },
          {
            $count: "retained"
          }
        ]);

        const count = retainedCount[0] ? retainedCount[0].retained : 0;
        const rate = cohortSize === 0 ? 0 : Math.round((count / cohortSize) * 10000) / 100;

        retention.push({
          monthIndex: m,
          periodName: `Month ${m}`,
          activeUsers: count,
          retentionRate: rate
        });
      }

      return {
        cohortMonth: month,
        cohortSize,
        retention
      };
    })
  );

  res.status(200).json({ success: true, cohorts: cohortReport });
});

// ========================================
// @desc    Get Revenue & Margin Analytics
// @route   GET /api/analytics/revenue
// @access  Private/Admin
// ========================================
const getRevenueAnalytics = asyncHandler(async (req, res) => {
  const days = Number(req.query.days) || 30;
  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - days);

  const stats = await Payment.aggregate([
    {
      $match: {
        status: "paid",
        paidAt: { $gte: fromDate }
      }
    },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: "$amount" },
        ordersCount: { $sum: 1 },
        averageOrderValue: { $avg: "$amount" }
      }
    }
  ]);

  const dailyBreakdown = await Payment.aggregate([
    {
      $match: {
        status: "paid",
        paidAt: { $gte: fromDate }
      }
    },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$paidAt" } },
        revenue: { $sum: "$amount" },
        orders: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  const summary = stats[0] || { totalRevenue: 0, ordersCount: 0, averageOrderValue: 0 };

  res.status(200).json({
    success: true,
    summary: {
      totalRevenue: summary.totalRevenue,
      ordersCount: summary.ordersCount,
      averageOrderValue: Math.round(summary.averageOrderValue * 100) / 100
    },
    dailyBreakdown
  });
});

// ========================================
// @desc    Get Customer Acquisition & Retention Stats
// @route   GET /api/analytics/customers
// @access  Private/Admin
// ========================================
const getCustomerAnalytics = asyncHandler(async (req, res) => {
  // 1. Repeat customer rate: buyers with > 1 order
  const orderCounts = await Order.aggregate([
    { $match: { orderStatus: { $ne: "cancelled" } } },
    { $group: { _id: "$user", count: { $sum: 1 } } }
  ]);

  const totalBuyers = orderCounts.length;
  const repeatBuyers = orderCounts.filter(o => o.count > 1).length;
  const repeatRate = totalBuyers === 0 ? 0 : Math.round((repeatBuyers / totalBuyers) * 10000) / 100;

  // 2. Customer Lifetime Value (LTV) average per customer
  const lifetimeValue = await Order.aggregate([
    { $match: { orderStatus: { $ne: "cancelled" }, paymentStatus: "paid" } },
    { $group: { _id: "$user", totalSpent: { $sum: "$totalPrice" } } },
    { $group: { _id: null, averageLTV: { $avg: "$totalSpent" } } }
  ]);

  // 3. Daily User signup trend
  const signups = await User.aggregate([
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: -1 } },
    { $limit: 30 }
  ]);

  res.status(200).json({
    success: true,
    repeatCustomerRate: repeatRate,
    averageLTV: lifetimeValue[0] ? Math.round(lifetimeValue[0].averageLTV * 100) / 100 : 0,
    dailySignups: signups.reverse()
  });
});

// ========================================
// @desc    Get Product Views & Conversion Rates
// @route   GET /api/analytics/products
// @access  Private/Admin
// ========================================
const getProductAnalytics = asyncHandler(async (req, res) => {
  // Top product views from analytics events
  const productViews = await AnalyticsEvent.aggregate([
    { $match: { eventType: "product_view" } },
    { $group: { _id: "$metadata.productId", views: { $sum: 1 } } },
    { $sort: { views: -1 } },
    { $limit: 10 }
  ]);

  // Hydrate views with title
  const popularViews = await Promise.all(
    productViews.map(async (v) => {
      const p = await Product.findById(v._id).select("title price sold");
      return {
        productId: v._id,
        title: p ? p.title : "Unknown Product",
        price: p ? p.price : 0,
        views: v.views,
        sold: p ? p.sold : 0,
        // Conversion rate: sold / views
        conversion: v.views === 0 ? 0 : Math.round(((p ? p.sold : 0) / v.views) * 10000) / 100
      };
    })
  );

  // Top selling products by volume
  const topSellers = await Product.find({ isDeleted: false })
    .sort({ sold: -1 })
    .limit(10)
    .select("title price sold stock");

  res.status(200).json({
    success: true,
    mostViewed: popularViews,
    topSellers
  });
});

module.exports = {
  logEvent,
  getFunnelAnalytics,
  getCohortAnalytics,
  getRevenueAnalytics,
  getCustomerAnalytics,
  getProductAnalytics
};
