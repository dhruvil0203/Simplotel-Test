const logger = require('../utils/logger');

function errorHandler(err, req, res, _next) {
  logger.error('Unhandled error in request', {
    method: req.method,
    url: req.originalUrl,
    error: err.message,
    stack: err.stack,
  });

  const statusCode = err.statusCode || 500;

  res.status(statusCode).json({
    type: 'error',
    reply: 'Something went wrong, please try again.',
    data: {},
  });
}

module.exports = errorHandler;
