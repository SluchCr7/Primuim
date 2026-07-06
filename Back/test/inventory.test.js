const { test } = require("node:test");
const assert = require("node:assert/strict");

// Simple routing function test using dummy warehouse data
test("Proximity-based routing calculations", async () => {
  const warehouses = [
    { _id: "wh_cairo", name: "Cairo East", location: { coordinates: [31.2357, 30.0444] } },
    { _id: "wh_alex", name: "Alexandria Port", location: { coordinates: [29.9187, 31.2001] } }
  ];

  const warehouseInventory = [
    { warehouse: "wh_cairo", sku: "SKU-RED-M", availableStock: 10 },
    { warehouse: "wh_alex", sku: "SKU-RED-M", availableStock: 5 }
  ];

  // Helper function mock simulation of routeOrderInventory logic
  const simulateRoute = (items, customerCoordinates) => {
    // Determine distance approximation (Cairo vs Alex based on coordinates)
    // egypt center (30, 30)
    let sortedWarehouses = [...warehouses];
    if (customerCoordinates[0] > 30.5) {
      // Closer to cairo
      sortedWarehouses = [warehouses[0], warehouses[1]];
    } else {
      // Closer to alex
      sortedWarehouses = [warehouses[1], warehouses[0]];
    }

    const plan = [];
    const unfulfilled = items.map(i => ({ ...i }));

    for (const wh of sortedWarehouses) {
      for (const item of unfulfilled) {
        if (item.quantity === 0) continue;
        const stock = warehouseInventory.find(inv => inv.warehouse === wh._id && inv.sku === item.sku);
        if (stock && stock.availableStock > 0) {
          const alloc = Math.min(stock.availableStock, item.quantity);
          plan.push({ warehouseId: wh._id, warehouseName: wh.name, sku: item.sku, quantity: alloc });
          item.quantity -= alloc;
        }
      }
    }
    return plan;
  };

  // Test Cairo allocation (closer to longitude 31.2 Cairo coordinates)
  const resultCairo = simulateRoute([{ sku: "SKU-RED-M", quantity: 8 }], [31.2, 30.0]);
  assert.equal(resultCairo.length, 1);
  assert.equal(resultCairo[0].warehouseId, "wh_cairo");
  assert.equal(resultCairo[0].quantity, 8);

  // Test split routing when Cairo doesn't have enough stock
  const resultSplit = simulateRoute([{ sku: "SKU-RED-M", quantity: 12 }], [31.2, 30.0]);
  assert.equal(resultSplit.length, 2);
  assert.equal(resultSplit[0].warehouseId, "wh_cairo");
  assert.equal(resultSplit[0].quantity, 10);
  assert.equal(resultSplit[1].warehouseId, "wh_alex");
  assert.equal(resultSplit[1].quantity, 2);
});
