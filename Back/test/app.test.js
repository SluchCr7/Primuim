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
const { Category } = require("../models/Category");
const { User } = require("../models/User");
const Cart = require("../models/Cart");
const SellerRequest = require("../models/SellerRequest");
const Verification = require("../models/VerificationToken");
const RefreshToken = require("../models/RefreshTOken");
const LoyaltyWallet = require("../models/LoyaltyWallet");
const LoyaltyTransaction = require("../models/LoyaltyTransaction");
const Order = require("../models/Order");
const Notification = require("../models/Notification");
const CheckoutSession = require("../models/CheckoutSession");
const StockReservation = require("../models/StockReservation");
const WarehouseInventory = require("../models/WarehouseInventory");

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
  totalPrice: 400,
  orderItems: [{
    product: "60c72b2f9b1d8e25d8888887",
    title: "Test Product Trigger",
    price: 200,
    quantity: 2,
  }],
  user: {
    _id: "60c72b2f9b1d8e25d7777778",
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

const queryStub = (value) => ({
  session() { return this; },
  select() { return this; },
  populate() { return this; },
  then(resolve, reject) {
    return Promise.resolve(value).then(resolve, reject);
  }
});

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

test("seller registration creates a pending seller profile and a complete application", async () => {
  const originals = {
    findOne: User.findOne,
    create: User.create,
    deleteOne: User.deleteOne,
    createRequest: SellerRequest.create,
    createVerification: Verification.create
  };
  let createdUserData;
  let createdRequest;

  User.findOne = async () => null;
  User.create = async (data) => {
    createdUserData = data;
    return { ...data, _id: "60c72b2f9b1d8e25d7777711" };
  };
  SellerRequest.create = async (data) => {
    createdRequest = data;
    return data;
  };
  Verification.create = async (data) => data;

  try {
    const response = await request(app)
      .post("/api/auth/register")
      .send({
        username: "new-seller",
        email: "new-seller@example.com",
        password: "SellerPass1!",
        role: "seller",
        brandName: "Example Brand",
        storeName: "Example Store",
        country: "Egypt",
        storeDescription: "A store selling quality handmade products.",
        storeAddress: "Downtown, Cairo, Egypt",
        phone: "+201001234567",
        storeLogo: "https://cdn.example.com/logo.png",
        storeCover: "https://cdn.example.com/cover.png"
      });

    assert.equal(response.status, 201);
    assert.equal(createdUserData.role, "seller");
    assert.equal(createdUserData.sellerStatus, "pending");
    assert.equal(createdUserData.storePhone, "+201001234567");
    assert.equal(createdUserData.storeAddress, "Downtown, Cairo, Egypt");
    assert.equal(createdRequest.storePhone, "+201001234567");
    assert.equal(createdRequest.storeAddress, "Downtown, Cairo, Egypt");
    assert.equal(response.body.user.sellerStatus, "pending");
  } finally {
    User.findOne = originals.findOne;
    User.create = originals.create;
    User.deleteOne = originals.deleteOne;
    SellerRequest.create = originals.createRequest;
    Verification.create = originals.createVerification;
  }
});

test("approved sellers can update store contact and address details", async () => {
  const originalFindById = User.findById;
  const seller = {
    ...mockUser,
    storeName: "Original Store",
    brandName: "Original Brand",
    country: "Egypt",
    storePhone: "+201001234567",
    storeAddress: "Old address",
    storeDescription: "Original description",
    responseTime: "Within 24 hours",
    save: async function() { return this; }
  };
  User.findById = async () => seller;

  try {
    const response = await request(app)
      .put("/api/sellers/profile")
      .set("Authorization", `Bearer ${sellerToken}`)
      .send({
        storeName: "Updated Store",
        brandName: "Updated Brand",
        country: "Egypt",
        storePhone: "+201009876543",
        storeAddress: "New address, Cairo",
        storeDescription: "Updated store description",
        responseTime: "Within 24 hours"
      });

    assert.equal(response.status, 200);
    assert.equal(seller.storePhone, "+201009876543");
    assert.equal(seller.storeAddress, "New address, Cairo");
    assert.equal(response.body.seller.storeAddress, "New address, Cairo");
  } finally {
    User.findById = originalFindById;
  }
});

test("seller product creation keeps repeated tags and payout requests debit atomically", async () => {
  const originals = {
    categoryFindById: Category.findById,
    productFindOne: Product.findOne,
    productCreate: Product.create,
    userFindOneAndUpdate: User.findOneAndUpdate
  };
  let createdProduct;
  let payoutFilter;
  let payoutUpdate;

  Category.findById = async () => ({ _id: "60c72b2f9b1d8e25d8888880" });
  Product.findOne = async () => null;
  Product.create = async (data) => {
    createdProduct = data;
    return data;
  };
  User.findOneAndUpdate = async (filter, update) => {
    payoutFilter = filter;
    payoutUpdate = update;
    return { _id: mockUser._id, walletBalance: 300 };
  };

  try {
    const productResponse = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${sellerToken}`)
      .field("title", "Premium Handmade Product")
      .field("description", "A detailed description for the handmade product.")
      .field("category", "60c72b2f9b1d8e25d8888880")
      .field("price", "125")
      .field("stock", "3")
      .field("isPublished", "true")
      .field("specifications", "[]")
      .field("tags", "premium")
      .field("tags", "handmade");

    assert.equal(productResponse.status, 201);
    assert.deepEqual(createdProduct.tags, ["premium", "handmade"]);

    const invalidPayout = await request(app)
      .post("/api/sellers/payout")
      .set("Authorization", `Bearer ${sellerToken}`)
      .send({ amount: "not-a-number" });

    assert.equal(invalidPayout.status, 400);
    assert.equal(payoutFilter, undefined);

    const payoutResponse = await request(app)
      .post("/api/sellers/payout")
      .set("Authorization", `Bearer ${sellerToken}`)
      .send({ amount: 200 });

    assert.equal(payoutResponse.status, 200);
    assert.equal(payoutResponse.body.walletBalance, 300);
    assert.deepEqual(payoutFilter.walletBalance, { $gte: 200 });
    assert.equal(payoutUpdate.$inc.walletBalance, -200);
  } finally {
    Category.findById = originals.categoryFindById;
    Product.findOne = originals.productFindOne;
    Product.create = originals.productCreate;
    User.findOneAndUpdate = originals.userFindOneAndUpdate;
  }
});

test("seller registration removes the account if its application cannot be saved", async () => {
  const originals = {
    findOne: User.findOne,
    create: User.create,
    deleteOne: User.deleteOne,
    createRequest: SellerRequest.create
  };
  let deletedUser;

  User.findOne = async () => null;
  User.create = async (data) => ({ ...data, _id: "60c72b2f9b1d8e25d7777722" });
  User.deleteOne = async (filter) => {
    deletedUser = filter._id;
    return { deletedCount: 1 };
  };
  SellerRequest.create = async () => {
    throw new Error("Application storage unavailable");
  };

  try {
    const response = await request(app)
      .post("/api/auth/register")
      .send({
        username: "another-seller",
        email: "another-seller@example.com",
        password: "SellerPass1!",
        role: "seller",
        brandName: "Another Brand",
        storeName: "Another Store",
        country: "Egypt",
        storeDescription: "A store selling quality handmade products.",
        storeAddress: "Downtown, Cairo, Egypt",
        phone: "+201001234567"
      });

    assert.equal(response.status, 500);
    assert.equal(deletedUser, "60c72b2f9b1d8e25d7777722");
  } finally {
    User.findOne = originals.findOne;
    User.create = originals.create;
    User.deleteOne = originals.deleteOne;
    SellerRequest.create = originals.createRequest;
  }
});

test("seller portal access remains blocked until a seller is approved", async () => {
  const originalFindById = User.findById;
  User.findById = async () => ({ ...mockUser, sellerStatus: "pending" });

  try {
    const response = await request(app)
      .get("/api/sellers/stats")
      .set("Authorization", `Bearer ${sellerToken}`);

    assert.equal(response.status, 403);
  } finally {
    User.findById = originalFindById;
  }
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

test("order placement rejects incomplete checkout and closes its transaction", async () => {
  const originals = {
    startSession: mongoose.startSession,
    cartFindOne: Cart.findOne,
    checkoutFindOne: CheckoutSession.findOne
  };
  const transaction = {
    active: false,
    ended: false,
    startTransaction() { this.active = true; },
    inTransaction() { return this.active; },
    async abortTransaction() { this.active = false; },
    async commitTransaction() { this.active = false; },
    async endSession() { this.ended = true; }
  };
  mongoose.startSession = async () => transaction;
  Cart.findOne = () => ({ session: async () => ({ items: [] }) });
  CheckoutSession.findOne = () => ({ session: async () => null });

  try {
    const response = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${sellerToken}`)
      .send({});

    assert.equal(response.status, 400);
    assert.match(response.body.message, /Complete checkout/i);
    assert.equal(transaction.active, false);
    assert.equal(transaction.ended, true);
  } finally {
    mongoose.startSession = originals.startSession;
    Cart.findOne = originals.cartFindOne;
    CheckoutSession.findOne = originals.checkoutFindOne;
  }
});

test("multi-store checkout creates one order per seller and preserves the checkout total", async () => {
  const originals = {
    startSession: mongoose.startSession,
    cartFindOne: Cart.findOne,
    checkoutFindOne: CheckoutSession.findOne,
    checkoutDeleteOne: CheckoutSession.deleteOne,
    productFindById: Product.findById,
    orderCreate: Order.create,
    orderFindById: Order.findById,
    reservationFind: StockReservation.find,
    reservationDelete: StockReservation.findByIdAndDelete,
    inventoryUpdate: WarehouseInventory.findOneAndUpdate,
    inventoryFind: WarehouseInventory.findOne,
    loyaltyUpdate: LoyaltyWallet.findOneAndUpdate,
    loyaltyCreate: LoyaltyTransaction.create
  };
  const transaction = {
    active: false,
    startTransaction() { this.active = true; },
    inTransaction() { return this.active; },
    async abortTransaction() { this.active = false; },
    async commitTransaction() { this.active = false; },
    async endSession() {}
  };
  const productIds = ["60c72b2f9b1d8e25d8888811", "60c72b2f9b1d8e25d8888812"];
  const sellers = ["60c72b2f9b1d8e25d7777711", "60c72b2f9b1d8e25d7777712"];
  const products = productIds.map((id, index) => ({
    _id: id,
    seller: sellers[index],
    sku: `TEST-SKU-${index}`,
    title: `Store Product ${index + 1}`,
    images: [],
    price: index === 0 ? 100 : 300,
    stock: 10,
    sold: 0,
    lowStockThreshold: 0,
    variants: [],
    inventoryLogs: [],
    save: async function() { return this; }
  }));
  const now = new Date();
  const cart = {
    _id: "60c72b2f9b1d8e25d8888899",
    items: productIds.map(product => ({ product, quantity: 1 })),
    save: async function() { return this; }
  };
  const checkoutSession = {
    shippingAddress: { fullName: "Buyer", phone: "01000000000", city: "Cairo", street: "Main Street" },
    shippingMethod: "Standard Shipping",
    paymentMethod: "cod",
    expiresAt: new Date(Date.now() + 60_000)
  };
  const reservations = products.map((product, index) => ({
    _id: `60c72b2f9b1d8e25d88888${31 + index}`,
    sku: product.sku,
    warehouse: "60c72b2f9b1d8e25d8888820",
    quantity: 1,
    expiresAt: new Date(now.getTime() + 60_000)
  }));
  let createdOrders = [];
  let walletBalance = 20;
  let pointBuckets = [{ points: 20, expiryDate: new Date(Date.now() + 86_400_000) }];

  mongoose.startSession = async () => transaction;
  Cart.findOne = () => queryStub(cart);
  CheckoutSession.findOne = () => queryStub(checkoutSession);
  CheckoutSession.deleteOne = () => queryStub({ deletedCount: 1 });
  Product.findById = (id) => queryStub(products.find(product => product._id === id.toString()));
  StockReservation.find = (filter) => queryStub(reservations.filter(reservation => reservation.sku === filter.sku));
  StockReservation.findByIdAndDelete = () => queryStub({ deletedCount: 1 });
  WarehouseInventory.findOneAndUpdate = async () => ({ availableStock: 10, reorderPoint: 0 });
  WarehouseInventory.findOne = async () => null;
  Order.create = async (documents) => {
    createdOrders = documents;
    return documents;
  };
  Order.findById = () => queryStub({
    ...createdOrders[0],
    user: { _id: mockUser._id, username: "testbuyer", email: "testbuyer@example.com" }
  });
  LoyaltyWallet.findOneAndUpdate = async (filter, update) => {
    walletBalance += update.$inc.balance;
    return {
      _id: "60c72b2f9b1d8e25d8888830",
      balance: walletBalance,
      pointBuckets: pointBuckets.map(bucket => ({ ...bucket })),
      save: async function() {
        pointBuckets = this.pointBuckets;
        return this;
      }
    };
  };
  LoyaltyTransaction.create = async () => [{ _id: "60c72b2f9b1d8e25d8888831" }];

  try {
    const response = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${sellerToken}`)
      .send({ redeemPoints: 20 });

    assert.equal(response.status, 201);
    assert.equal(response.body.orders.length, 2);
    assert.equal(response.body.order._id, response.body.orders[0]._id);
    assert.equal(response.body.orders[0].seller, sellers[0]);
    assert.equal(response.body.orders[1].seller, sellers[1]);
    assert.equal(response.body.orders[0].shippingPrice, 12.5);
    assert.equal(response.body.orders[1].shippingPrice, 37.5);
    assert.equal(response.body.orders[0].taxPrice, 14);
    assert.equal(response.body.orders[1].taxPrice, 42);
    assert.equal(response.body.orders[0].discountPrice, 5);
    assert.equal(response.body.orders[1].discountPrice, 15);
    assert.equal(response.body.orders.reduce((sum, order) => sum + order.totalPrice, 0), 486);
    assert.equal(response.body.orders[0].checkoutGroupId, response.body.orders[1].checkoutGroupId);
    assert.equal(transaction.active, false);
    assert.equal(cart.items.length, 0);
    assert.equal(walletBalance, 0);
  } finally {
    mongoose.startSession = originals.startSession;
    Cart.findOne = originals.cartFindOne;
    CheckoutSession.findOne = originals.checkoutFindOne;
    CheckoutSession.deleteOne = originals.checkoutDeleteOne;
    Product.findById = originals.productFindById;
    Order.create = originals.orderCreate;
    Order.findById = originals.orderFindById;
    StockReservation.find = originals.reservationFind;
    StockReservation.findByIdAndDelete = originals.reservationDelete;
    WarehouseInventory.findOneAndUpdate = originals.inventoryUpdate;
    WarehouseInventory.findOne = originals.inventoryFind;
    LoyaltyWallet.findOneAndUpdate = originals.loyaltyUpdate;
    LoyaltyTransaction.create = originals.loyaltyCreate;
  }
});

test("forgot-password response does not reveal whether an email is registered", async () => {
  const originalFindOne = User.findOne;
  const registeredUser = {
    _id: "60c72b2f9b1d8e25d7777799",
    email: "known@example.com",
    save: async function() { return this; }
  };
  User.findOne = async (filter) => filter.email === registeredUser.email ? registeredUser : null;

  try {
    const knownResponse = await request(app)
      .post("/api/auth/forgot-password")
      .send({ email: registeredUser.email });
    const unknownResponse = await request(app)
      .post("/api/auth/forgot-password")
      .send({ email: "unknown@example.com" });

    assert.equal(knownResponse.status, 200);
    assert.equal(unknownResponse.status, 200);
    assert.equal(knownResponse.body.message, unknownResponse.body.message);
  } finally {
    User.findOne = originalFindOne;
  }
});

test("password reset requires a strong password and invalidates prior sessions", async () => {
  const originals = {
    findOne: User.findOne,
    updateOne: User.updateOne,
    deleteMany: RefreshToken.deleteMany
  };
  const resetToken = "a".repeat(64);
  let updateFilter;
  let update;
  let deletedRefreshTokens;
  User.findOne = async () => ({ _id: "60c72b2f9b1d8e25d7777788" });
  User.updateOne = async (filter, updateData) => {
    updateFilter = filter;
    update = updateData;
    return { modifiedCount: 1 };
  };
  RefreshToken.deleteMany = async (filter) => {
    deletedRefreshTokens = filter;
    return { deletedCount: 1 };
  };

  try {
    const invalidResponse = await request(app)
      .post("/api/auth/reset-password")
      .send({ token: resetToken, newPassword: "weakpass" });
    assert.equal(invalidResponse.status, 400);
    assert.equal(updateFilter, undefined);

    const response = await request(app)
      .post("/api/auth/reset-password")
      .send({ token: resetToken, newPassword: "StrongPass1!" });

    assert.equal(response.status, 200);
    assert.equal(updateFilter.passwordResetToken, require("crypto").createHash("sha256").update(resetToken).digest("hex"));
    assert.equal(update.$inc.tokenVersion, 1);
    assert.notEqual(update.$set.password, "StrongPass1!");
    assert.deepEqual(deletedRefreshTokens, { user: "60c72b2f9b1d8e25d7777788" });
  } finally {
    User.findOne = originals.findOne;
    User.updateOne = originals.updateOne;
    RefreshToken.deleteMany = originals.deleteMany;
  }
});

test("access tokens issued before a password reset are rejected", async () => {
  const originalFindById = User.findById;
  const staleToken = jwt.sign(
    { id: mockUser._id.toString(), tokenVersion: 0 },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: "1h" }
  );
  User.findById = async () => ({ ...mockUser, tokenVersion: 1 });

  try {
    const response = await request(app)
      .get("/api/cart")
      .set("Authorization", `Bearer ${staleToken}`);

    assert.equal(response.status, 401);
  } finally {
    User.findById = originalFindById;
  }
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
  const originals = {
    startSession: mongoose.startSession,
    orderFindById: Order.findById
  };
  const session = {
    active: false,
    ended: false,
    startTransaction() { this.active = true; },
    inTransaction() { return this.active; },
    async abortTransaction() { this.active = false; },
    async commitTransaction() { this.active = false; },
    async endSession() { this.ended = true; }
  };
  mongoose.startSession = async () => session;
  Order.findById = () => queryStub({ ...mockOrder, orderStatus: "delivered" });

  try {
    const response = await request(app)
      .patch("/api/sellers/orders/60c72b2f9b1d8e25d9999999")
      .set("Authorization", `Bearer ${sellerToken}`)
      .send({ status: "processing" });

    assert.equal(response.status, 409);
    assert.equal(session.active, false);
    assert.equal(session.ended, true);
  } finally {
    mongoose.startSession = originals.startSession;
    Order.findById = originals.orderFindById;
  }
});

test("PATCH /api/sellers/orders/:id marks order as delivered, increments salesCount, and checks isBestSeller threshold", async () => {
  const originals = {
    startSession: mongoose.startSession,
    orderFindById: Order.findById,
    productFind: Product.find,
    productFindById: Product.findById,
    userFindById: User.findById,
    loyaltyWalletFindOne: LoyaltyWallet.findOne,
    loyaltyTransactionCreate: LoyaltyTransaction.create
  };
  const session = {
    active: false,
    startTransaction() { this.active = true; },
    inTransaction() { return this.active; },
    async abortTransaction() { this.active = false; },
    async commitTransaction() { this.active = false; },
    async endSession() {}
  };
  const order = { ...mockOrder, orderStatus: "processing", user: mockOrder.user._id, save: async function() { return this; } };
  const customer = { ...mockOrder.user };
  const wallet = {
    _id: "60c72b2f9b1d8e25d8888811",
    user: customer._id,
    tier: "Bronze",
    balance: 0,
    lifetimePointsEarned: 0,
    rollingAnnualSpend: 0,
    pointBuckets: [],
    save: async function() { return this; }
  };
  const previousSalesCount = mockProduct.salesCount;
  const previousBestSeller = mockProduct.isBestSeller;
  const previousWalletBalance = mockUser.walletBalance;

  mongoose.startSession = async () => session;
  Order.findById = () => queryStub(order);
  Product.find = () => queryStub([{ _id: mockProduct._id }]);
  Product.findById = () => queryStub(mockProduct);
  User.findById = (id) => queryStub(id.toString() === mockUser._id ? mockUser : customer);
  LoyaltyWallet.findOne = () => queryStub(wallet);
  LoyaltyTransaction.create = async () => [{ _id: "60c72b2f9b1d8e25d8888822" }];
  mockProduct.salesCount = 48;
  mockProduct.isBestSeller = false;

  try {
    const response = await request(app)
      .patch(`/api/sellers/orders/${mockOrder._id}`)
      .set("Authorization", `Bearer ${sellerToken}`)
      .send({ status: "delivered" });

    assert.equal(response.status, 200);
    assert.equal(response.body.success, true);
    assert.equal(mockProduct.salesCount, 50);
    assert.equal(mockProduct.isBestSeller, true);
    assert.equal(mockUser.walletBalance, previousWalletBalance + 400);
    assert.equal(session.active, false);
  } finally {
    mongoose.startSession = originals.startSession;
    Order.findById = originals.orderFindById;
    Product.find = originals.productFind;
    Product.findById = originals.productFindById;
    User.findById = originals.userFindById;
    LoyaltyWallet.findOne = originals.loyaltyWalletFindOne;
    LoyaltyTransaction.create = originals.loyaltyTransactionCreate;
    mockProduct.salesCount = previousSalesCount;
    mockProduct.isBestSeller = previousBestSeller;
    mockUser.walletBalance = previousWalletBalance;
  }
});