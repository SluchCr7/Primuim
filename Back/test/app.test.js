const { test, before } = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

// Mock sendEmail in require cache before requiring app/controllers
require.cache[require.resolve("../utils/sendEmail")] = {
  exports: async () => {
    console.log("Mocked email sent successfully");
  }
};

require.cache[require.resolve("../config/db")] = {
  exports: async () => {
    console.log("Mocked database connection success");
    mongoose.connection.readyState = 1;
    mongoose.connection.db = {
      admin: () => ({ ping: async () => ({ ok: 1 }) })
    };
    return mongoose.connection;
  }
};

const app = require("../index");
const { Product } = require("../models/Product");
const { User } = require("../models/User");
const Order = require("../models/Order");
const Notification = require("../models/Notification");
const CheckoutSession = require("../models/CheckoutSession");

// Setup JWT secret if not defined
process.env.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || "test-secret";

// Prepare mock data
const mockBestSellers = [
  {
    _id: "60c72b2f9b1d8e25d8888888",
    title: "Test Product BestSeller",
    isBestSeller: true,
    salesCount: 60,
  }
];

const mockLatest = [
  {
    _id: "60c72b2f9b1d8e25d8888889",
    title: "Test Product Regular",
    isBestSeller: false,
    salesCount: 10,
    createdAt: new Date(),
  }
];

const mockUser = {
  _id: "60c72b2f9b1d8e25d7777777",
  role: "seller",
  sellerStatus: "approved",
  isVerify: true,
  isBlocked: false,
  walletBalance: 0,
  loyaltyPoints: 0,
  activityLogs: [],
  save: async function() { return this; }
};

const mockProduct = {
  _id: "60c72b2f9b1d8e25d8888887",
  seller: "60c72b2f9b1d8e25d7777777",
  salesCount: 48,
  isBestSeller: false,
  save: async function() { return this; }
};

const mockOrder = {
  _id: "60c72b2f9b1d8e25d9999999",
  orderStatus: "processing",
  orderItems: [{
    product: "60c72b2f9b1d8e25d8888887",
    title: "Test Product Trigger",
    price: 200,
    quantity: 2,
  }],
  user: {
    username: "testbuyer",
    email: "testbuyer@example.com"
  },
  save: async function() { return this; }
};

const sellerToken = jwt.sign(
  { id: mockUser._id.toString(), role: "seller" },
  process.env.JWT_ACCESS_SECRET,
  { expiresIn: "1h" }
);

// Apply Mongoose mocks
before(() => {
  Product.find = (filter) => {
    const query = {
      select: () => Promise.resolve([ { _id: "60c72b2f9b1d8e25d8888887" } ]),
      sort: () => query,
      limit: () => query,
      lean: async () => {
        if (filter && filter.isBestSeller === true) {
          return mockBestSellers;
        }
        return mockLatest;
      }
    };
    return query;
  };

  Product.findById = async (id) => {
    return mockProduct;
  };

  User.findById = async (id) => {
    return mockUser;
  };

  Order.findById = (id) => {
    const query = {
      populate: () => Promise.resolve(mockOrder)
    };
    return query;
  };

  Notification.create = async (data) => {
    return data;
  };

  CheckoutSession.findOneAndUpdate = async (filter, update) => {
    return { ...update, save: async function() { return this; } };
  };

  CheckoutSession.findOne = async (filter) => {
    return {
      userId: "60c72b2f9b1d8e25d7777777",
      subtotal: 400,
      discountAmount: 0,
      save: async function() { return this; }
    };
  };

  CheckoutSession.deleteOne = () => {
    return {
      session: () => Promise.resolve({ deletedCount: 1 })
    };
  };
});

test("GET /health and /api/health report the database status", async () => {
  const response = await request(app).get("/health");
  assert.equal(response.status, 200);
  assert.equal(response.body.success, true);
  assert.equal(response.body.database, "connected");

  const apiResponse = await request(app).get("/api/health");
  assert.equal(apiResponse.status, 200);
  assert.equal(apiResponse.body.database, "connected");
});

test("GET unknown route returns 404", async () => {
  const response = await request(app).get("/does-not-exist");

  assert.equal(response.status, 404);
  assert.match(response.body.message, /Not Found/i);
});

test("POST social login is disabled until provider identity verification is configured", async () => {
  const response = await request(app)
    .post("/api/auth/social-login")
    .send({
      provider: "google",
      email: "someone@example.com",
      id: "unverified-provider-id"
    });

  assert.equal(response.status, 503);
  assert.equal(response.body.success, false);
});

test("authenticated routes reject users who have not verified their email", async () => {
  const originalFindById = User.findById;
  User.findById = async () => ({ ...mockUser, isVerify: false });

  try {
    const response = await request(app)
      .get("/api/cart")
      .set("Authorization", `Bearer ${sellerToken}`);

    assert.equal(response.status, 403);
  } finally {
    User.findById = originalFindById;
  }
});

test("GET /api/payments/methods returns payment methods", async () => {
  const response = await request(app).get("/api/payments/methods");

  assert.equal(response.status, 200);
  assert.equal(response.body.success, true);
  assert.ok(Array.isArray(response.body.paymentMethods));
  assert.deepEqual(response.body.paymentMethods.map((method) => method.key), ["cod"]);
});

test("payment status and unsigned webhooks cannot mark orders paid", async () => {
  const statusResponse = await request(app)
    .patch("/api/payments/untrusted-payment-id/status")
    .set("Authorization", `Bearer ${sellerToken}`)
    .send({ status: "paid" });
  const webhookResponse = await request(app)
    .post("/api/payments/webhook/stripe")
    .send({ status: "paid", transactionId: "unverified" });

  assert.equal(statusResponse.status, 503);
  assert.equal(webhookResponse.status, 503);
});

test("checkout rejects online payment methods without provider verification", async () => {
  const response = await request(app)
    .post("/api/checkout/payment")
    .set("Authorization", `Bearer ${sellerToken}`)
    .send({ paymentMethod: "card" });

  assert.equal(response.status, 503);
});

test("GET /api/products/best-sellers returns best selling products", async () => {
  const response = await request(app).get("/api/products/best-sellers");

  assert.equal(response.status, 200);
  assert.equal(response.body.success, true);
  assert.ok(Array.isArray(response.body.products));
  const hasBestSeller = response.body.products.some(p => p.title === "Test Product BestSeller");
  assert.ok(hasBestSeller);
});

test("GET /api/products/latest returns latest products", async () => {
  const response = await request(app).get("/api/products/latest");

  assert.equal(response.status, 200);
  assert.equal(response.body.success, true);
  assert.ok(Array.isArray(response.body.products));
  const hasRegularProduct = response.body.products.some(p => p.title === "Test Product Regular");
  assert.ok(hasRegularProduct);
});

test("GET /api/products applies the subcategory filter", async () => {
  const subcategoryId = "60c72b2f9b1d8e25d8888880";
  const originalFind = Product.find;
  const originalCountDocuments = Product.countDocuments;
  let appliedFilter;

  Product.countDocuments = async (filter) => {
    appliedFilter = filter;
    return 0;
  };
  Product.find = () => ({
    populate() { return this; },
    sort() { return this; },
    skip() { return this; },
    limit() { return Promise.resolve([]); }
  });

  try {
    const response = await request(app).get(`/api/products?subcategory=${subcategoryId}`);

    assert.equal(response.status, 200);
    assert.equal(appliedFilter.subcategory, subcategoryId);
  } finally {
    Product.find = originalFind;
    Product.countDocuments = originalCountDocuments;
  }
});

test("seller cannot cycle a delivered order or repeat wallet settlement", async () => {
  const previousStatus = mockOrder.orderStatus;
  const previousDelivered = mockOrder.isDelivered;
  const previousBalance = mockUser.walletBalance;
  mockOrder.orderStatus = "delivered";
  mockOrder.isDelivered = true;

  const response = await request(app)
    .patch("/api/sellers/orders/60c72b2f9b1d8e25d9999999")
    .set("Authorization", `Bearer ${sellerToken}`)
    .send({ status: "processing" });

  assert.equal(response.status, 409);
  assert.equal(mockUser.walletBalance, previousBalance);
  mockOrder.orderStatus = previousStatus;
  mockOrder.isDelivered = previousDelivered;
});

test("PATCH /api/sellers/orders/:id marks order as delivered, increments salesCount, and checks isBestSeller threshold", async () => {
  mockProduct.salesCount = 48;
  mockProduct.isBestSeller = false;

  const response = await request(app)
    .patch(`/api/sellers/orders/${mockOrder._id}`)
    .set("Authorization", `Bearer ${sellerToken}`)
    .send({ status: "delivered" });

  assert.equal(response.status, 200);
  assert.equal(response.body.success, true);
  assert.equal(mockProduct.salesCount, 50);
  assert.equal(mockProduct.isBestSeller, true);
});