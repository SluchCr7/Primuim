const { test } = require("node:test");
const assert = require("node:assert/strict");
const { Product } = require("../models/Product");
const SellerInventory = require("../models/SellerInventory");
const InventoryMovement = require("../models/InventoryMovement");
const StockReservation = require("../models/StockReservation");
const {
  getAvailableStock,
  initializeSellerInventory,
  resolveSellerSku,
  reserveSellerInventory,
  restoreSellerStock,
  setSellerStock,
} = require("../utils/sellerInventoryService");

const queryStub = value => ({
  session() { return this; },
  then(resolve, reject) { return Promise.resolve(value).then(resolve, reject); },
});

test("seller inventory resolves exact variant SKUs and reports reserved availability", async () => {
  const originals = {
    productFindOne: Product.findOne,
    inventoryFindOne: SellerInventory.findOne,
    reservationFind: StockReservation.find,
  };
  const seller = "60c72b2f9b1d8e25d8888811";
  const productId = "60c72b2f9b1d8e25d8888822";
  const product = {
    _id: productId,
    seller,
    sku: "PARENT-SKU",
    slug: "variant-product",
    inventoryMode: "seller-managed",
    variants: [{ sku: "RED-S", price: 10, stock: 3 }],
  };

  Product.findOne = () => queryStub(product);
  SellerInventory.findOne = () => queryStub({
    seller,
    product: productId,
    sku: "RED-S",
    declaredStock: 8,
    reservedStock: 5,
    availableStock: 3,
  });
  StockReservation.find = () => queryStub([{ quantity: 2 }]);

  try {
    assert.equal((await resolveSellerSku({ seller, product: productId, sku: "red-s" })).variantSku, "RED-S");
    await assert.rejects(
      resolveSellerSku({ seller, product: productId, sku: "PARENT-SKU" }),
      error => error.statusCode === 400
    );
    assert.equal(await getAvailableStock({
      seller,
      product: productId,
      sku: "RED-S",
      user: "60c72b2f9b1d8e25d8888833",
      cartId: "cart-1",
    }), 5);
  } finally {
    Product.findOne = originals.productFindOne;
    SellerInventory.findOne = originals.inventoryFindOne;
    StockReservation.find = originals.reservationFind;
  }
});

test("seller stock set and reserve reject atomic updates below reserved stock or available quantity", async () => {
  const originals = {
    productFindOne: Product.findOne,
    inventoryFindOne: SellerInventory.findOne,
    inventoryUpdate: SellerInventory.findOneAndUpdate,
    reservationFindOne: StockReservation.findOne,
    reservationCreate: StockReservation.create,
  };
  const seller = "60c72b2f9b1d8e25d8888811";
  const productId = "60c72b2f9b1d8e25d8888822";
  const inventory = {
    _id: "60c72b2f9b1d8e25d8888844",
    seller,
    product: productId,
    sku: "SIMPLE-SKU",
    warehouse: null,
    declaredStock: 7,
    reservedStock: 5,
    availableStock: 2,
  };
  const product = {
    _id: productId,
    seller,
    sku: "SIMPLE-SKU",
    slug: "simple-product",
    inventoryMode: "seller-managed",
    variants: [],
  };
  let lastFilter;
  Product.findOne = () => queryStub(product);
  SellerInventory.findOne = () => queryStub(inventory);
  SellerInventory.findOneAndUpdate = async filter => {
    lastFilter = filter;
    return null;
  };
  StockReservation.findOne = () => queryStub(null);
  StockReservation.create = async () => {
    throw new Error("An unavailable quantity must not create a reservation.");
  };

  try {
    await assert.rejects(
      setSellerStock({ seller, product: productId, sku: "SIMPLE-SKU", quantity: 4 }),
      error => error.statusCode === 409
    );
    assert.ok(lastFilter.$expr);

    await assert.rejects(
      reserveSellerInventory({
        seller,
        product: productId,
        sku: "SIMPLE-SKU",
        quantity: 3,
        user: "60c72b2f9b1d8e25d8888833",
        cartId: "cart-1",
      }),
      error => error.statusCode === 409
    );
    assert.ok(lastFilter.$expr.$gte);
  } finally {
    Product.findOne = originals.productFindOne;
    SellerInventory.findOne = originals.inventoryFindOne;
    SellerInventory.findOneAndUpdate = originals.inventoryUpdate;
    StockReservation.findOne = originals.reservationFindOne;
    StockReservation.create = originals.reservationCreate;
  }
});

test("seller stock restoration is idempotent by reference key", async () => {
  const originals = {
    productFindOne: Product.findOne,
    inventoryFindOne: SellerInventory.findOne,
    inventoryFind: SellerInventory.find,
    inventoryUpdate: SellerInventory.findOneAndUpdate,
    movementFindOne: InventoryMovement.findOne,
    movementCreate: InventoryMovement.create,
  };
  const seller = "60c72b2f9b1d8e25d8888811";
  const productId = "60c72b2f9b1d8e25d8888822";
  const product = {
    _id: productId,
    seller,
    sku: "SIMPLE-SKU",
    slug: "simple-product",
    variants: [],
    save: async function() { return this; },
  };
  const inventory = {
    _id: "60c72b2f9b1d8e25d8888844",
    seller,
    product: productId,
    sku: "SIMPLE-SKU",
    warehouse: null,
    declaredStock: 4,
    reservedStock: 0,
    availableStock: 4,
  };
  const movements = [];
  let updateCount = 0;
  Product.findOne = () => queryStub(product);
  SellerInventory.findOne = () => queryStub(inventory);
  SellerInventory.find = () => queryStub([inventory]);
  SellerInventory.findOneAndUpdate = async (_filter, update) => {
    updateCount += 1;
    for (const [field, delta] of Object.entries(update.$inc || {})) {
      inventory[field] += delta;
    }
    return inventory;
  };
  InventoryMovement.findOne = filter => queryStub(
    movements.find(movement => movement.idempotencyKey === filter.idempotencyKey) || null
  );
  InventoryMovement.create = async documents => {
    movements.push(...documents);
    return documents;
  };

  try {
    const options = {
      seller,
      product: productId,
      sku: "SIMPLE-SKU",
      quantity: 2,
      referenceId: "order-1",
      idempotencyKey: "order-1:SIMPLE-SKU:return:2",
    };
    await restoreSellerStock(options);
    await restoreSellerStock(options);
    assert.equal(inventory.declaredStock, 6);
    assert.equal(inventory.availableStock, 6);
    assert.equal(updateCount, 1);
    assert.equal(movements.length, 1);
  } finally {
    Product.findOne = originals.productFindOne;
    SellerInventory.findOne = originals.inventoryFindOne;
    SellerInventory.find = originals.inventoryFind;
    SellerInventory.findOneAndUpdate = originals.inventoryUpdate;
    InventoryMovement.findOne = originals.movementFindOne;
    InventoryMovement.create = originals.movementCreate;
  }
});

test("pending seller inventory initialization resumes without duplicating its movement", async () => {
  const originals = {
    productFindOne: Product.findOne,
    inventoryFindOne: SellerInventory.findOne,
    inventoryFind: SellerInventory.find,
    inventoryUpdate: SellerInventory.findOneAndUpdate,
    movementFindOne: InventoryMovement.findOne,
    movementCreate: InventoryMovement.create,
  };
  const seller = "60c72b2f9b1d8e25d8888811";
  const productId = "60c72b2f9b1d8e25d8888822";
  const inventory = {
    _id: "60c72b2f9b1d8e25d8888844",
    seller,
    product: productId,
    sku: "SIMPLE-SKU",
    warehouse: null,
    declaredStock: 0,
    reservedStock: 0,
    availableStock: 0,
    stockInitialized: false,
    lowStockThreshold: 4,
  };
  const product = {
    _id: productId,
    seller,
    sku: "SIMPLE-SKU",
    slug: "simple-product",
    variants: [],
    saveAttempts: 0,
    async save() {
      this.saveAttempts += 1;
      if (this.saveAttempts === 1) throw new Error("Projection write failed.");
      return this;
    },
  };
  const movements = [];
  Product.findOne = () => queryStub(product);
  SellerInventory.findOne = () => queryStub(inventory);
  SellerInventory.find = () => queryStub([inventory]);
  SellerInventory.findOneAndUpdate = async (_filter, update) => {
    Object.assign(inventory, update.$set || {});
    return inventory;
  };
  InventoryMovement.findOne = filter => queryStub(
    movements.find(movement => movement.idempotencyKey === filter.idempotencyKey) || null
  );
  InventoryMovement.create = async (documents) => {
    movements.push(...documents);
    return documents;
  };

  try {
    const options = {
      seller,
      product: productId,
      sku: "SIMPLE-SKU",
      quantity: 6,
      lowStockThreshold: 4,
    };
    await assert.rejects(initializeSellerInventory(options), /Projection write failed/);
    assert.equal(inventory.stockInitialized, false);
    assert.equal(inventory.declaredStock, 6);
    assert.equal(movements.length, 1);

    await initializeSellerInventory(options);
    assert.equal(inventory.stockInitialized, true);
    assert.equal(product.stock, 6);
    assert.equal(inventory.lowStockThreshold, 4);
    assert.equal(movements.length, 1);
    await assert.rejects(initializeSellerInventory(options), error => error.statusCode === 409);
  } finally {
    Product.findOne = originals.productFindOne;
    SellerInventory.findOne = originals.inventoryFindOne;
    SellerInventory.find = originals.inventoryFind;
    SellerInventory.findOneAndUpdate = originals.inventoryUpdate;
    InventoryMovement.findOne = originals.movementFindOne;
    InventoryMovement.create = originals.movementCreate;
  }
});
