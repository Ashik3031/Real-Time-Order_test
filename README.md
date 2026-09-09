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

| Method | Endpoint            | Description           |
|--------|---------------------|-----------------------|
| GET    | `/api/health`       | Health check          |
| POST   | `/api/orders`       | Create an order *(coming soon)* |
| GET    | `/api/orders`       | List all orders *(coming soon)* |
| GET    | `/api/analytics/summary` | Analytics summary *(coming soon)* |

---

## Environment Variables

| Variable    | Description                        | Default                                    |
|-------------|------------------------------------|--------------------------------------------|
| `NODE_ENV`  | Environment (`development`/`production`) | `development`                        |
| `PORT`      | HTTP server port                   | `5000`                                     |
| `MONGO_URI` | MongoDB connection string          | `mongodb://localhost:27017/realtime_orders` |
| `JWT_SECRET`| Secret for JWT signing             | *(set before production)*                  |
