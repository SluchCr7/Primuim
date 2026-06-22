const { test, before } = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");
const jwt = require("jsonwebtoken");

// Mock sendEmail in require cache before requiring app/controllers
require.cache[require.resolve("../utils/sendEmail")] = {
  exports: async () => {
    console.log("Mocked email sent successfully");
  }
};

require.cache[require.resolve("../config/db")] = {
  exports: async () => {
    console.log("Mocked database connection success");
    return {};
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

test("GET /health returns ok", async () => {
  const response = await request(app).get("/health");

  assert.equal(response.status, 200);
  assert.equal(response.body.success, true);
  assert.equal(response.body.status, "ok");
});

test("GET unknown route returns 404", async () => {
  const response = await request(app).get("/does-not-exist");

  assert.equal(response.status, 404);
  assert.match(response.body.message, /Not Found/i);
});

test("GET /api/payments/methods returns payment methods", async () => {
  const response = await request(app).get("/api/payments/methods");

  assert.equal(response.status, 200);
  assert.equal(response.body.success, true);
  assert.ok(Array.isArray(response.body.paymentMethods));
  assert.ok(response.body.paymentMethods.length >= 3);
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