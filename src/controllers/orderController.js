const mongoose = require('mongoose');
const Order = require('../models/Order');
const { emitToAdmins } = require('../sockets');


const createOrder = async (req, res, next) => {
    try {
        const { userId, items, totalAmount, status } = req.body;

        // Validate items
        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Order must contain at least one item',
            });
        }

        // Calculate total if not explicitly provided or validate
        let calculatedTotal = 0;
        for (const item of items) {
            if (!item.productName || item.qty == null || item.price == null) {
                return res.status(400).json({
                    success: false,
                    message: 'Each item must have productName, qty, and price',
                });
            }
            calculatedTotal += item.qty * item.price;
        }

        const order = await Order.create({
            userId: userId || new mongoose.Types.ObjectId(),
            items,
            totalAmount: totalAmount != null ? totalAmount : calculatedTotal,
            status: status || 'pending',
        });

        // Emit event ONLY to "admins" room
        emitToAdmins('order_created', order);

        return res.status(201).json({
            success: true,
            data: order,
        });
    } catch (err) {
        next(err);
    }
};


const updateOrderStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const validStatuses = ['pending', 'processing', 'shipped', 'delivered'];
        if (!status || !validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Invalid status. Allowed values: ${validStatuses.join(', ')}`,
            });
        }

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid order ID format',
            });
        }

        const order = await Order.findByIdAndUpdate(
            id,
            { status },
            { new: true, runValidators: true }
        );

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found',
            });
        }

        // Emit event ONLY to "admins" room
        emitToAdmins('order_status_updated', order);

        return res.status(200).json({
            success: true,
            data: order,
        });
    } catch (err) {
        next(err);
    }
};


const getOrders = async (req, res, next) => {
    try {
        const orders = await Order.find().sort({ createdAt: -1 }).limit(50);
        return res.status(200).json({
            success: true,
            count: orders.length,
            data: orders,
        });
    } catch (err) {
        next(err);
    }
};

module.exports = {
    createOrder,
    updateOrderStatus,
    getOrders,
};
