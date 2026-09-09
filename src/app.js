const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const app = express();

// Middleware  
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// HTTP request logger (only in development)
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});


app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

//Global error handler 
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

module.exports = app;
