const test = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");

const app = require("../index");

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