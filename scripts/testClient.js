

const { io } = require('socket.io-client');

const clientName = process.argv[2] || 'AdminClient-1';
const SERVER_URL = process.env.SERVER_URL || 'http://localhost:5000';

const socket = io(SERVER_URL);

console.log(`[${clientName}] Connecting to ${SERVER_URL}...`);

socket.on('connect', () => {
  console.log(`[${clientName}] Connected with socket ID: ${socket.id}`);

  // Join the admins room
  console.log(`[${clientName}] Emitting "join_admins"...`);
  socket.emit('join_admins');
});

socket.on('joined_admins', (data) => {
  console.log(`[${clientName}] ✅ Server confirmed joined_admins:`, data);
});

socket.on('order_created', (order) => {
  console.log(`\n[${clientName}] ⚡ Received "order_created":`);
  console.log(JSON.stringify(order, null, 2));
});

socket.on('order_status_updated', (order) => {
  console.log(`\n[${clientName}] 🔄 Received "order_status_updated":`);
  console.log(JSON.stringify(order, null, 2));
});

socket.on('recent_orders_count', (data) => {
  console.log(`\n[${clientName}] ⏱️ Received "recent_orders_count":`, data);
});

socket.on('disconnect', () => {
  console.log(`[${clientName}] Disconnected from server.`);
});
