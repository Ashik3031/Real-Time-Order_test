const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema(
    {
        productName: {
            type: String,
            required: [true, 'Product name is required'],
            trim: true,
        },
        qty: {
            type: Number,
            required: [true, 'Quantity is required'],
            min: [1, 'Quantity must be a positive number'],
        },
        price: {
            type: Number,
            required: [true, 'Price is required'],
            min: [0, 'Price must be a positive number'],
        },
    },
    { _id: false } // embedded sub-documents don't need their own _id
);

const orderSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            required: [true, 'User ID is required'],
            ref: 'User', // logical reference for future population
        },

        items: {
            type: [itemSchema],
            validate: {
                validator: (arr) => Array.isArray(arr) && arr.length > 0,
                message: 'An order must contain at least one item',
            },
        },

        totalAmount: {
            type: Number,
            required: [true, 'Total amount is required'],
            min: [0, 'Total amount must be non-negative'],
        },

        status: {
            type: String,
            required: true,
            enum: {
                values: ['pending', 'processing', 'shipped', 'delivered'],
                message: 'Status must be one of: pending, processing, shipped, delivered',
            },
            default: 'pending',
        },

        createdAt: {
            type: Date,
            default: Date.now,
        },
    },
    {
        // Disable the automatic createdAt/updatedAt from timestamps option
        // because managing createdAt manually per spec.
        timestamps: false,
        versionKey: false,
    }
);

//Indexes 

// 1. status — filters orders by their lifecycle stage 
orderSchema.index({ status: 1 });

// 2. createdAt — sorts/filters orders chronologically; used heavily by analytics
orderSchema.index({ createdAt: -1 });

// 3. userId — looks up all orders that belong to a specific user
orderSchema.index({ userId: 1 });

//Model
const Order = mongoose.model('Order', orderSchema);

module.exports = Order;