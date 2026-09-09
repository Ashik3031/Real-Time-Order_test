require('dotenv').config();
const http = require('http');
const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);


const start = async () => {
  await connectDB();
  server.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  });
};

start();
