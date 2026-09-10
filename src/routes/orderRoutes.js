const express = require('express');
const router = express.Router();
const {
    createOrder,
    updateOrderStatus,
    getOrders,
} = require('../controllers/orderController');
const createRateLimiter = require('../middleware/rateLimiter');

// Rate limiting specifically on POST /api/orders
// Limit to 20 orders per minute per IP
const orderCreationLimiter = createRateLimiter({
    windowMs: 60 * 1000,
    max: 20,
    message: 'Too many order creation attempts from this IP. Please try again after 1 minute.',
});

// POST /api/orders (rate-limited)
router.post('/', orderCreationLimiter, createOrder);

// GET /api/orders
router.get('/', getOrders);

// PATCH /api/orders/:id/status
router.patch('/:id/status', updateOrderStatus);

module.exports = router;
