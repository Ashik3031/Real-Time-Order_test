const { Server } = require('socket.io');
const Order = require('../models/Order');

let io = null;
let periodicInterval = null;
let changeStream = null;
let changeStreamActive = false;

const initSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: '*',
            methods: ['GET', 'POST', 'PATCH'],
        },
    });

    io.on('connection', (socket) => {
        console.log(`Socket connected: ${socket.id}`);

        // Client emits "join_admins" to join the admins room
        socket.on('join_admins', () => {
            socket.join('admins');
            console.log(`Socket ${socket.id} joined admins room`);
            socket.emit('joined_admins', {
                success: true,
                message: 'Successfully joined admins room',
            });
        });

        socket.on('disconnect', () => {
            console.log(`Socket disconnected: ${socket.id}`);
        });
    });


    initChangeStreams();

    if (!periodicInterval) {
        periodicInterval = setInterval(async () => {
            try {
                if (!io) return;
                const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
                const count = await Order.countDocuments({ createdAt: { $gte: fiveMinutesAgo } });

                io.to('admins').emit('recent_orders_count', {
                    count,
                    timestamp: new Date(),
                });
            } catch (err) {
            }
        }, 30000);
    }

    return io;
};


const initChangeStreams = () => {
    try {

        if (changeStream) return;

        changeStream = Order.watch([], { fullDocument: 'updateLookup' });

        changeStream.on('change', (change) => {
            changeStreamActive = true;
            if (!io) return;

            if (change.operationType === 'insert') {
                const newOrder = change.fullDocument;
                io.to('admins').emit('order_created', newOrder);
            } else if (change.operationType === 'update' || change.operationType === 'replace') {
                const updatedOrder = change.fullDocument;
                io.to('admins').emit('order_status_updated', updatedOrder);
            }
        });

        changeStream.on('error', (err) => {
            console.warn('⚠️ MongoDB Change Streams unavailable (requires replica set / Atlas). Falling back to manual controller emission.', err.message);
            changeStreamActive = false;
            if (changeStream) {
                changeStream.close().catch(() => { });
                changeStream = null;
            }
        });
    } catch (err) {
        console.warn('⚠️ Could not initialize Change Stream:', err.message);
        changeStreamActive = false;
    }
};

const getIO = () => {
    if (!io) {
        throw new Error('Socket.io has not been initialized. Call initSocket(server) first.');
    }
    return io;
};


const emitToAdmins = (event, payload) => {
    if (io && !changeStreamActive) {
        io.to('admins').emit(event, payload);
    }
};

module.exports = {
    initSocket,
    getIO,
    emitToAdmins,
    isChangeStreamActive: () => changeStreamActive,
};
