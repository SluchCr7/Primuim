const { test } = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");
const { Product } = require("../models/Product");
const { User } = require("../models/User");
const { Category } = require("../models/Category");
const inventoryService = require("../utils/inventoryService");
const {
  getInventoryRecords,
  seedProducts,
  validateSeedProducts,
  validateSellerAndCategories,
} = require("../seeders/product.seeder");

const sellerId = "6afb253cb669c3195b023c45";
const categoryId = "60c72b2f9b1d8e25d8888801";
const subcategoryId = "60c72b2f9b1d8e25d8888802";

const makeProduct = (overrides = {}) => ({
  seller: new mongoose.Types.ObjectId(sellerId),
  title: "Test catalog product",
  slug: "test-catalog-product",
  description: "A sufficiently long test product description.",
  category: categoryId,
  subcategory: null,
  brand: "Test brand",
  images: [{ publicId: "seed-test", url: "https://example.com/product.jpg" }],
  price: 100,
  comparePrice: 120,
  stock: 7,
  lowStockThreshold: 5,
  reservedStock: 0,
  variants: [],
  attributes: [],
  specifications: [],
  tags: ["test"],
  ...overrides,
});

const activeSeller = () => ({
  _id: new mongoose.Types.ObjectId(sellerId),
  role: "seller",
  sellerStatus: "approved",
  isBlocked: false,
  isVerify: true,
});

const categoriesFor = (product) => {
  const root = { _id: new mongoose.Types.ObjectId(product.category), parent: null, isActive: true };
  if (!product.subcategory) return [root];
  return [
    root,
    {
      _id: new mongoose.Types.ObjectId(product.subcategory),
      parent: root._id,
      isActive: true,
    },
  ];
};

const installSeederMocks = (t, { seller = activeSeller(), catalogCategories, topology = "Single" } = {}) => {
  const originals = {
    userFindById: User.findById,
    categoryFind: Category.find,
    productFindOne: Product.findOne,
    productSave: Product.prototype.save,
    getClient: mongoose.connection.getClient,
    startSession: mongoose.startSession,
    getSellerInventory: inventoryService.getSellerInventory,
    initializeSellerInventory: inventoryService.initializeSellerInventory,
    syncSellerProductStock: inventoryService.syncSellerProductStock,
    consoleLog: console.log,
  };
  const productsBySlug = new Map();
  const inventories = new Map();
  const getInventoryKey = ({ product, sku }) => `${product}:${String(sku).toUpperCase()}`;
  let movementCount = 0;

  User.findById = () => ({
    select: () => Promise.resolve(seller),
  });
  Category.find = () => ({
    select: () => Promise.resolve(catalogCategories || []),
  });
  Product.findOne = ({ slug }) => ({
    session() { return this; },
    then(resolve, reject) {
      return Promise.resolve(productsBySlug.get(slug) || null).then(resolve, reject);
    },
  });
  Product.prototype.save = async function saveMock() {
    productsBySlug.set(this.slug, this);
    return this;
  };
  mongoose.connection.getClient = () => ({
    topology: { description: { type: topology } },
  });
  inventoryService.getSellerInventory = async (options) =>
    inventories.get(getInventoryKey(options)) || null;
  inventoryService.initializeSellerInventory = async (options) => {
    const key = getInventoryKey(options);
    const existing = inventories.get(key);
    if (existing && existing.stockInitialized !== false) {
      const error = new Error("Seller inventory has already been initialized.");
      error.statusCode = 409;
      throw error;
    }
    if (existing && existing.declaredStock !== 0 && existing.declaredStock !== options.quantity) {
      throw new Error("Pending inventory stock does not match the requested initialization.");
    }
    const inventory = {
      _id: existing?._id || new mongoose.Types.ObjectId(),
      seller: options.seller,
      product: options.product,
      sku: options.sku,
      declaredStock: options.quantity,
      reservedStock: 0,
      availableStock: options.quantity,
      lowStockThreshold: options.lowStockThreshold,
      stockInitialized: true,
    };
    inventories.set(key, inventory);
    movementCount += options.quantity > 0 && !existing?.movementRecorded ? 1 : 0;
    inventory.movementRecorded = true;
    return inventory;
  };
  inventoryService.syncSellerProductStock = async ({ product: productId }) => {
    const product = [...productsBySlug.values()].find((item) => String(item._id) === String(productId));
    const productInventories = [...inventories.values()].filter(
      (inventory) => String(inventory.product) === String(productId)
    );
    product.stock = productInventories.reduce((sum, inventory) => sum + inventory.availableStock, 0);
    product.reservedStock = productInventories.reduce((sum, inventory) => sum + inventory.reservedStock, 0);
    product.variants = product.variants.map((variant) => ({
      ...variant.toObject(),
      stock: productInventories.find((inventory) => inventory.sku === variant.sku)?.availableStock || 0,
    }));
    await product.save();
  };
  console.log = () => {};

  t.after(() => {
    User.findById = originals.userFindById;
    Category.find = originals.categoryFind;
    Product.findOne = originals.productFindOne;
    Product.prototype.save = originals.productSave;
    mongoose.connection.getClient = originals.getClient;
    mongoose.startSession = originals.startSession;
    inventoryService.getSellerInventory = originals.getSellerInventory;
    inventoryService.initializeSellerInventory = originals.initializeSellerInventory;
    inventoryService.syncSellerProductStock = originals.syncSellerProductStock;
    console.log = originals.consoleLog;
  });

  return {
    inventories,
    productsBySlug,
    get movementCount() { return movementCount; },
  };
};

test("product seeder validates seller eligibility and category hierarchy", async (t) => {
  const product = makeProduct({ subcategory: subcategoryId });
  installSeederMocks(t, { catalogCategories: categoriesFor(product) });
  await assert.doesNotReject(validateSellerAndCategories([product]));
});

test("product seeder rejects missing or ineligible sellers", async (t) => {
  installSeederMocks(t, { seller: null });
  await assert.rejects(validateSellerAndCategories([makeProduct()]), /does not exist/);

  for (const changes of [
    { role: "customer" },
    { sellerStatus: "pending" },
    { isBlocked: true },
    { isVerify: false },
  ]) {
    const seller = { ...activeSeller(), ...changes };
    User.findById = () => ({ select: () => Promise.resolve(seller) });
    await assert.rejects(validateSellerAndCategories([makeProduct()]), /not eligible to sell/);
  }
});

test("product seeder rejects missing, inactive, or incorrectly-parented categories", async (t) => {
  const product = makeProduct({ subcategory: subcategoryId });
  installSeederMocks(t, { catalogCategories: [] });
  await assert.rejects(validateSellerAndCategories([product]), /Category .* does not exist/);

  Category.find = () => ({
    select: () => Promise.resolve([
      ...categoriesFor(product).slice(0, 1),
      { ...categoriesFor(product)[1], isActive: false },
    ]),
  });
  await assert.rejects(validateSellerAndCategories([product]), /Subcategory .* is inactive/);

  Category.find = () => ({
    select: () => Promise.resolve([
      categoriesFor(product)[0],
      { ...categoriesFor(product)[1], parent: new mongoose.Types.ObjectId("60c72b2f9b1d8e25d8888899") },
    ]),
  });
  await assert.rejects(validateSellerAndCategories([product]), /is not a child/);
});

test("product seeder validates catalog fields and rejects duplicate SKUs", async () => {
  const variantProduct = makeProduct({
    slug: "variant-test-product",
    attributes: [{ name: "Color", values: ["Red", "Blue"] }],
    variants: [
      { sku: "TEST-RED", price: 100, stock: 2, combination: { Color: "Red" } },
      { sku: "TEST-BLUE", price: 100, stock: 3, combination: { Color: "Blue" } },
    ],
  });
  await assert.doesNotReject(validateSeedProducts([variantProduct]));
  await assert.rejects(
    validateSeedProducts([variantProduct, { ...makeProduct(), slug: "second-product", variants: [
      { sku: "test-red", price: 100, stock: 1 },
    ] }]),
    /Duplicate product or variant SKU/
  );
  await assert.rejects(
    validateSeedProducts([{ ...makeProduct(), category: "not-an-object-id" }]),
    /Invalid category reference/
  );
});

test("product seeder creates simple inventory and preserves product and inventory on reruns", async (t) => {
  const productSeed = makeProduct();
  const mocks = installSeederMocks(t, { catalogCategories: categoriesFor(productSeed) });

  const firstResult = await seedProducts({ productCatalog: [productSeed] });
  const savedProduct = mocks.productsBySlug.get(productSeed.slug);
  const inventory = [...mocks.inventories.values()][0];
  assert.equal(firstResult.createdProducts, 1);
  assert.equal(firstResult.createdInventories, 1);
  assert.equal(inventory.sku, productSeed.slug);
  assert.equal(inventory.declaredStock, 7);
  assert.equal(inventory.lowStockThreshold, 5);
  assert.equal(savedProduct.inventoryMode, "seller-managed");
  assert.equal(savedProduct.warehouse, null);
  assert.equal(savedProduct.stock, 7);
  assert.equal(savedProduct.reservedStock, 0);

  savedProduct.price = 88;
  savedProduct.sold = 12;
  inventory.declaredStock = 9;
  inventory.availableStock = 6;
  inventory.reservedStock = 3;
  const beforeMovementCount = mocks.movementCount;
  const secondResult = await seedProducts({ productCatalog: [productSeed] });

  assert.equal(secondResult.createdProducts, 0);
  assert.equal(secondResult.createdInventories, 0);
  assert.equal(secondResult.preservedInventories, 1);
  assert.equal(savedProduct.price, 88);
  assert.equal(savedProduct.sold, 12);
  assert.equal(savedProduct.stock, 6);
  assert.equal(savedProduct.reservedStock, 3);
  assert.equal(inventory.declaredStock, 9);
  assert.equal(mocks.inventories.size, 1);
  assert.equal(mocks.movementCount, beforeMovementCount);
});

test("product seeder initializes one exact-SKU inventory per variant and repairs pending initialization", async (t) => {
  const productSeed = makeProduct({
    slug: "variant-test-product",
    stock: 40,
    attributes: [{ name: "Color", values: ["Black", "White", "Navy"] }],
    variants: [
      { sku: "CT-BLK-M", price: 100, stock: 15, combination: { Color: "Black" } },
      { sku: "CT-WHT-L", price: 100, stock: 15, combination: { Color: "White" } },
      { sku: "CT-NAV-XL", price: 100, stock: 10, combination: { Color: "Navy" } },
    ],
  });
  const mocks = installSeederMocks(t, { catalogCategories: categoriesFor(productSeed) });
  const result = await seedProducts({ productCatalog: [productSeed] });
  const product = mocks.productsBySlug.get(productSeed.slug);
  assert.equal(result.createdInventories, 3);
  assert.deepEqual(
    [...mocks.inventories.values()].map(({ sku, declaredStock }) => [sku, declaredStock]),
    [["CT-BLK-M", 15], ["CT-WHT-L", 15], ["CT-NAV-XL", 10]]
  );
  assert.equal(product.stock, 40);
  assert.deepEqual(product.variants.map((variant) => variant.stock), [15, 15, 10]);
  assert.deepEqual(
    getInventoryRecords(productSeed).map(({ sku }) => sku),
    ["CT-BLK-M", "CT-WHT-L", "CT-NAV-XL"]
  );

  const pendingKey = `${product._id}:CT-BLK-M`;
  const pending = mocks.inventories.get(pendingKey);
  pending.stockInitialized = false;
  pending.declaredStock = 0;
  pending.availableStock = 0;
  pending.movementRecorded = false;
  await seedProducts({ productCatalog: [productSeed] });
  const resumed = mocks.inventories.get(pendingKey);
  assert.equal(resumed.declaredStock, 15);
  assert.equal(resumed.stockInitialized, true);
});

test("product seeder aborts a supported transaction and reports the product failure", async (t) => {
  const productSeed = makeProduct();
  const mocks = installSeederMocks(t, {
    catalogCategories: categoriesFor(productSeed),
    topology: "ReplicaSetWithPrimary",
  });
  let abortCount = 0;
  const session = {
    active: false,
    startTransaction() { this.active = true; },
    inTransaction() { return this.active; },
    async abortTransaction() {
      abortCount += 1;
      this.active = false;
      mocks.productsBySlug.delete(productSeed.slug);
    },
    async commitTransaction() { this.active = false; },
    async endSession() {},
  };
  mongoose.startSession = async () => session;
  inventoryService.initializeSellerInventory = async () => {
    throw new Error("inventory movement write failed");
  };

  await assert.rejects(
    seedProducts({ productCatalog: [productSeed] }),
    /Failed to seed product "test-catalog-product": inventory movement write failed/
  );
  assert.equal(abortCount, 1);
  assert.equal(mocks.productsBySlug.has(productSeed.slug), false);
});
