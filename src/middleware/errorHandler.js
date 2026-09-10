
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || err.status || 500;
  let message = err.message || 'Internal Server Error';
  let errors = null;

  //Mongoose Validation Error 
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation Error';
    errors = Object.values(err.errors).map((val) => ({
      field: val.path,
      message: val.message,
    }));
  }

  //Mongoose CastError 
  else if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid format for resource identifier '${err.path}': ${err.value}`;
  }

  //MongoDB Duplicate Key Error 
  else if (err.code === 11000) {
    statusCode = 409;
    const duplicatedField = Object.keys(err.keyValue || {})[0] || 'field';
    message = `Duplicate value entered for ${duplicatedField}`;
  }

  // Log server errors (500) for internal tracking
  if (statusCode >= 500) {
    console.error(`[SERVER ERROR] ${req.method} ${req.originalUrl}:`, err);
  }

  const isProduction = process.env.NODE_ENV === 'production';

  res.status(statusCode).json({
    success: false,
    statusCode,
    message: (isProduction && statusCode === 500) ? 'An unexpected server error occurred' : message,
    ...(errors && { errors }),
    ...(!isProduction && statusCode === 500 && { stack: err.stack }),
  });
};

module.exports = errorHandler;
