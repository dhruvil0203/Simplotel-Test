const express = require('express');
const cors = require('cors');
const chatRouter = require('./routes/chat');
const errorHandler = require('./middleware/errorHandler');
const logger = require('./utils/logger');

const app = express();

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
  process.env.CLIENT_ORIGIN,
].filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      logger.warn('CORS blocked request', { origin });
      return callback(new Error('Not allowed by CORS'));
    },
  })
);

app.use(express.json());

app.use((req, res, next) => {
  logger.info('Request received', {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
  });
  next();
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/chat', chatRouter);

app.use(errorHandler);

module.exports = app;
