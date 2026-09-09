const express = require('express');
const router = express.Router();
const { getSalesSummary } = require('../controllers/analyticsController');

// GET /api/analytics/sales-summary?range=7d
router.get('/sales-summary', getSalesSummary);

module.exports = router;
