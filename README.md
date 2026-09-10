# Real-Time Order & Analytics API

A backend API for an e-commerce admin panel.

The API allows orders to be created and managed, provides sales analytics using MongoDB aggregation, and sends real-time order updates to connected admin clients using Socket.io.

## Tech Stack

- Node.js
- Express.js
- MongoDB
- Mongoose
- Socket.io

## Project Structure

```text
src/
├── config/
│   └── db.js
├── controllers/
│   ├── orderController.js
│   └── analyticsController.js
├── middleware/
│   ├── errorHandler.js
│   └── rateLimiter.js
├── models/
│   └── Order.js
├── routes/
│   ├── orderRoutes.js
│   └── analyticsRoutes.js
├── sockets/
│   └── index.js
├── app.js
└── server.js

public/
└── index.html

scripts/
├── seed.js
└── testClient.js

tests/
└── analytics.test.js

.env.example
.gitignore
package.json
README.md
```

## Requirements

- Node.js 18+
- MongoDB (local or MongoDB Atlas)

## Setup

### 1. Clone the repository

```bash
git clone https://github.com/Ashik3031/Real-Time-Order_test.git
cd Real-Time-Order_test
```

### 2. Install dependencies

```bash
npm install
```

### 3. Create the environment file

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Update the MongoDB connection string in `.env`.

Example:

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/realtime_orders
JWT_SECRET=your_secret_here
```

For MongoDB Atlas, replace `MONGODB_URI` with your Atlas connection string.

### 4. Start the server

Development:

```bash
npm run dev
```

Production:

```bash
npm start
```

The server will run at:

```text
http://localhost:5000
```

## Seed Data

Sample orders can be added for testing:

```bash
npm run seed
```

## REST API

### 1. Create Order

```http
POST /api/orders
```

Example request:

```json
{
  "userId": "user001",
  "items": [
    {
      "productName": "Laptop",
      "qty": 2,
      "price": 50000
    },
    {
      "productName": "Mouse",
      "qty": 1,
      "price": 1000
    }
  ],
  "totalAmount": 101000
}
```

A successful request creates the order and sends an `order_created` event to the `admins` Socket.io room.

### 2. Get Orders

```http
GET /api/orders
```

Supported filters:

```text
/api/orders?status=pending
/api/orders?userId=user001
/api/orders?page=1&limit=10
```

Filters can also be combined.

### 3. Update Order Status

```http
PATCH /api/orders/:id/status
```

Example:

```json
{
  "status": "shipped"
}
```

Allowed statuses:

```text
pending
processing
shipped
delivered
```

After a successful update, an `order_status_updated` event is sent to the `admins` Socket.io room.

### 4. Sales Summary

```http
GET /api/analytics/sales-summary?range=7d
```

The response includes:

- Daily revenue
- Daily order count
- Top 5 products by quantity sold
- Average order value
- Order count by status

Supported ranges:

```text
7d
30d
90d
```

## Analytics

The sales summary is calculated using MongoDB aggregation.

The orders are first filtered by the selected date range. `$facet` is then used to calculate the required metrics:

```text
Orders
   ↓
$match
   ↓
$facet
   ├── Daily sales
   ├── Top 5 products
   ├── Average order value
   └── Orders by status
```

This keeps the analytics calculations inside MongoDB instead of loading all orders into Node.js.

The Order model has indexes on:

- `status`
- `createdAt`
- `userId`

## Socket.io

Socket.io runs on the same HTTP server as Express.

Admin clients can join the:

```text
admins
```

room.

The main events are:

```text
order_created
order_status_updated
```

When an order is created or its status is updated, the event is sent to the `admins` room.

## Testing Socket.io

A simple Socket.io test client is available at:

```text
http://localhost:5000
```

To test:

1. Start the server.

```bash
npm run dev
```

2. Open `http://localhost:5000` in two browser tabs.

3. Click **Join Admins Room** in both tabs.

4. Create an order using Postman:

```http
POST /api/orders
```

5. Both browser tabs should receive:

```text
order_created
```

6. Update the order status using Postman:

```http
PATCH /api/orders/:id/status
```

7. Both browser tabs should receive:

```text
order_status_updated
```

The browser page is only a test client for checking Socket.io. It is not the actual admin frontend.

## Testing

Run the automated tests:

```bash
npm test
```

A command-line Socket.io test client is also available:

```bash
node scripts/testClient.js AdminClient-1
```

## Additional Features

The project also includes:

- Rate limiting on order creation
- Centralized error handling
- Analytics integration test
- MongoDB Change Stream support

MongoDB Change Streams require a replica set. MongoDB Atlas supports this by default.

## Environment Variables

Create a `.env` file using `.env.example`.

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/realtime_orders
JWT_SECRET=your_secret_here
```

Do not commit the `.env` file to GitHub.

## Git Commits

The main development stages were committed separately:

```text
chore: initialize project structure
feat: add MongoDB connection and order model
feat: implement order REST APIs
feat: add sales analytics aggregation
feat: add real-time order updates with Socket.io
docs: complete project documentation
```

## Notes

This project was developed as an interview assignment to demonstrate:

- REST API development
- MongoDB data modeling
- MongoDB aggregation
- API validation and error handling
- Socket.io real-time communication
- Basic backend project structure