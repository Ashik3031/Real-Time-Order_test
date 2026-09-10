const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('http');
const mongoose = require('mongoose');
require('dotenv').config();

const app = require('../src/app');
const Order = require('../src/models/Order');

test('Integration Test: GET /api/analytics/sales-summary?range=7d', async () => {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGODB_URI);
  }

  const server = http.createServer(app);
  let baseUrl;

  await new Promise((resolve) => {
    server.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://localhost:${port}`;
      resolve();
    });
  });

  const testUserId = new mongoose.Types.ObjectId();
  const today = new Date();
  today.setUTCHours(12, 0, 0, 0);

  const testOrders = [
    {
      userId: testUserId,
      items: [
        { productName: 'IntegrationTest-Laptop', qty: 2, price: 50000 },
        { productName: 'IntegrationTest-Mouse', qty: 3, price: 1000 },
      ],
      totalAmount: 103000,
      status: 'delivered',
      createdAt: today,
    },
    {
      userId: testUserId,
      items: [
        { productName: 'IntegrationTest-Laptop', qty: 1, price: 50000 },
      ],
      totalAmount: 50000,
      status: 'pending',
      createdAt: today,
    },
  ];

  const inserted = await Order.insertMany(testOrders);
  const createdOrderIds = inserted.map((o) => o._id);

  try {
    // 1. Valid request test
    const response = await fetch(`${baseUrl}/api/analytics/sales-summary?range=7d`);
    assert.equal(response.status, 200);

    const body = await response.json();
    assert.equal(body.success, true);
    assert.ok(body.data);
    assert.ok(Array.isArray(body.data.dailySales));
    assert.ok(Array.isArray(body.data.topProducts));
    assert.equal(typeof body.data.averageOrderValue, 'number');
    assert.ok(Array.isArray(body.data.ordersByStatus));

    // Verify calculated values
    const laptopProduct = body.data.topProducts.find((p) => p.productName === 'IntegrationTest-Laptop');
    assert.ok(laptopProduct);
    assert.ok(laptopProduct.quantitySold >= 3);

    const deliveredStatus = body.data.ordersByStatus.find((s) => s.status === 'delivered');
    assert.ok(deliveredStatus);
    assert.ok(deliveredStatus.count >= 1);

    // 2. Invalid range test for centralized error handling
    const badResponse = await fetch(`${baseUrl}/api/analytics/sales-summary?range=invalid`);
    assert.equal(badResponse.status, 400);
    const badBody = await badResponse.json();
    assert.equal(badBody.success, false);
  } finally {
    // Cleanup
    if (createdOrderIds.length > 0) {
      await Order.deleteMany({ _id: { $in: createdOrderIds } });
    }
    await new Promise((resolve) => server.close(resolve));
    await mongoose.disconnect();
  }
});
