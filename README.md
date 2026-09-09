# Real-Time Order & Analytics API

A production-style REST + WebSocket API built with **Node.js**, **Express**, **MongoDB/Mongoose**, and **Socket.io**.

---

## Tech Stack

| Layer      | Technology          |
|------------|---------------------|
| Runtime    | Node.js             |
| Framework  | Express.js          |
| Database   | MongoDB + Mongoose  |
| Real-time  | Socket.io           |
| Dev server | Nodemon             |

---

## Project Structure

```
realtime-order-analytics-api/
├── src/
│   ├── config/
│   │   └── db.js                  # MongoDB connection
│   ├── controllers/
│   │   ├── orderController.js     # Order business logic
│   │   └── analyticsController.js # Analytics business logic
│   ├── models/
│   │   └── Order.js               # Mongoose Order schema
│   ├── routes/
│   │   ├── orderRoutes.js         # /api/orders endpoints
│   │   └── analyticsRoutes.js     # /api/analytics endpoints
│   ├── sockets/
│   │   └── index.js               # Socket.io event handlers
│   ├── app.js                     # Express app (middleware + routes)
│   └── server.js                  # Entry point (HTTP server + DB boot)
├── .env                           # Local environment variables (git-ignored)
├── .env.example                   # Template for environment variables
├── .gitignore
├── package.json
└── README.md
```

---

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env with your MongoDB URI and other values
```

### 3. Run the server

```bash
# Development (auto-restart on file changes)
npm run dev

# Production
npm start
```

---

## API Endpoints

| Method | Endpoint                            | Description                              |
|--------|-------------------------------------|------------------------------------------|
| GET    | `/api/health`                       | Health check                             |
| POST   | `/api/orders`                       | Create an order *(coming soon)*          |
| GET    | `/api/orders`                       | List all orders *(coming soon)*          |
| GET    | `/api/analytics/sales-summary?range=7d` | Sales analytics for the given range  |

---

## Seed Data

Populate the database with sample orders for testing:

```bash
npm run seed
```

---

## Environment Variables

| Variable       | Description                              | Default                                       |
|----------------|------------------------------------------|-----------------------------------------------|
| `NODE_ENV`     | Environment (`development`/`production`) | `development`                                 |
| `PORT`         | HTTP server port                         | `5000`                                        |
| `MONGODB_URI`  | MongoDB connection string                | `mongodb://localhost:27017/realtime_orders`   |
| `JWT_SECRET`   | Secret for JWT signing                   | *(set before production)*                     |

---

## Analytics Design

### Why a single aggregation with `$facet`?

The endpoint needs four independent metrics (daily sales, top products, average order value, status counts) from the **same filtered dataset**. The options were:

- **4 separate aggregation calls** — 4 round-trips to MongoDB, each re-scanning the same matched documents.
- **1 aggregation with `$facet`** — 1 round-trip. MongoDB matches once, then fans out to four sub-pipelines in parallel over the in-memory result set.

`$facet` wins on both latency and clarity.

---

### How daily revenue is calculated

```
$match   →  filter orders to the date window (uses createdAt index)
$group   →  _id: $dateToString(createdAt)
            revenue: $sum(totalAmount)
            orderCount: $sum(1)
$sort    →  date ascending
$project →  rename _id → date, expose revenue + orderCount
```

`totalAmount` is the authoritative order total stored on the document. No arithmetic is needed inside the aggregation — MongoDB simply sums it per day.

---

### How top 5 products are calculated

```
$unwind  →  explodes items[] so each line-item becomes its own document
$group   →  _id: productName
            quantitySold: $sum(items.qty)
$sort    →  quantitySold DESC
$limit   →  5
$project →  rename _id → productName
```

Revenue per product is `qty × price`. `$unwind` is essential here because `totalAmount` is the *order* total and cannot be partitioned back to individual products without exploding the array.

---

### How average order value is calculated

```
$group   →  _id: null (collapse all matched docs into one group)
            avg: $avg(totalAmount)
$project →  averageOrderValue: $ifNull(avg, 0)
```

`$avg` runs in a single pass. `$ifNull` ensures a numeric `0` is returned when the collection is empty rather than `null`.

---

### How status counts are calculated

```
$group   →  _id: status
            count: $sum(1)
$sort    →  status ASC (alphabetical)
$project →  rename _id → status
```

MongoDB can use the `{ status: 1 }` index to perform the group efficiently.

---

### Why the query is efficient

| Optimisation | Detail |
|---|---|
| `$match` first | Only matched documents flow into `$facet` — un-matched documents are never processed |
| `createdAt` index | The range filter `{ createdAt: { $gte: fromDate } }` performs an index-range scan, not a collection scan |
| Single round-trip | `$facet` eliminates 3 extra network calls compared to running each sub-pipeline separately |
| `$limit 5` inside facet | MongoDB stops accumulating top-products after 5 results, preventing unbounded sort memory usage |
