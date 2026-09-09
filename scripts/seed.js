/**
 * Seed script — populates the `orders` collection with sample data
 * spread across the last 7 days so the analytics endpoint returns
 * meaningful results immediately.
 *
 * Usage:
 *   node scripts/seed.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Order = require('../src/models/Order');

const STATUSES = ['pending', 'processing', 'shipped', 'delivered'];

// Helper: returns a Date N days before now, at a random hour
const daysAgo = (n) => {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  d.setUTCHours(Math.floor(Math.random() * 12) + 8, 0, 0, 0); // 08:00–19:00 UTC
  return d;
};

const SEED_ORDERS = [
  // Day 0 (today)
  {
    userId: new mongoose.Types.ObjectId(),
    items: [
      { productName: 'Laptop', qty: 2, price: 75000 },
      { productName: 'Mouse', qty: 1, price: 1500 },
    ],
    totalAmount: 151500,
    status: 'pending',
    createdAt: daysAgo(0),
  },
  {
    userId: new mongoose.Types.ObjectId(),
    items: [{ productName: 'Laptop', qty: 1, price: 75000 }],
    totalAmount: 75000,
    status: 'processing',
    createdAt: daysAgo(0),
  },

  // Day 1
  {
    userId: new mongoose.Types.ObjectId(),
    items: [
      { productName: 'Monitor', qty: 2, price: 18000 },
      { productName: 'Keyboard', qty: 3, price: 2500 },
    ],
    totalAmount: 43500,
    status: 'shipped',
    createdAt: daysAgo(1),
  },
  {
    userId: new mongoose.Types.ObjectId(),
    items: [{ productName: 'Mouse', qty: 4, price: 1500 }],
    totalAmount: 6000,
    status: 'delivered',
    createdAt: daysAgo(1),
  },

  // Day 2
  {
    userId: new mongoose.Types.ObjectId(),
    items: [
      { productName: 'Headphones', qty: 3, price: 4000 },
      { productName: 'Laptop', qty: 1, price: 75000 },
    ],
    totalAmount: 87000,
    status: 'delivered',
    createdAt: daysAgo(2),
  },
  {
    userId: new mongoose.Types.ObjectId(),
    items: [{ productName: 'Keyboard', qty: 5, price: 2500 }],
    totalAmount: 12500,
    status: 'pending',
    createdAt: daysAgo(2),
  },

  // Day 3
  {
    userId: new mongoose.Types.ObjectId(),
    items: [
      { productName: 'Monitor', qty: 1, price: 18000 },
      { productName: 'Headphones', qty: 2, price: 4000 },
    ],
    totalAmount: 26000,
    status: 'processing',
    createdAt: daysAgo(3),
  },

  // Day 4
  {
    userId: new mongoose.Types.ObjectId(),
    items: [
      { productName: 'Laptop', qty: 1, price: 75000 },
      { productName: 'Mouse', qty: 2, price: 1500 },
    ],
    totalAmount: 78000,
    status: 'shipped',
    createdAt: daysAgo(4),
  },

  // Day 5
  {
    userId: new mongoose.Types.ObjectId(),
    items: [{ productName: 'Webcam', qty: 6, price: 3500 }],
    totalAmount: 21000,
    status: 'delivered',
    createdAt: daysAgo(5),
  },
  {
    userId: new mongoose.Types.ObjectId(),
    items: [{ productName: 'Keyboard', qty: 2, price: 2500 }],
    totalAmount: 5000,
    status: 'delivered',
    createdAt: daysAgo(5),
  },

  // Day 6
  {
    userId: new mongoose.Types.ObjectId(),
    items: [
      { productName: 'Webcam', qty: 2, price: 3500 },
      { productName: 'Monitor', qty: 1, price: 18000 },
    ],
    totalAmount: 25000,
    status: 'pending',
    createdAt: daysAgo(6),
  },
];

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    await Order.deleteMany({});
    console.log('Cleared existing orders');

    const inserted = await Order.insertMany(SEED_ORDERS);
    console.log(`Inserted ${inserted.length} seed orders`);

    console.log('\nItem totals for manual verification:');
    console.log('  Laptop qty:      4 (2+1+1+1)');
    console.log('  Mouse qty:       7 (1+4+2)');
    console.log('  Keyboard qty:   10 (3+5+2)');
    console.log('  Headphones qty:  5 (3+2)');
    console.log('  Monitor qty:     4 (2+1+1)');
    console.log('  Webcam qty:      8 (6+2)');
    console.log('\nExpected top 5 by qty: Keyboard(10), Webcam(8), Mouse(7), Headphones(5), Laptop(4)');
  } catch (err) {
    console.error('Seed error:', err.message);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected. Done.');
  }
};

seed();
