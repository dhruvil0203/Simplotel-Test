const logger = require('../utils/logger');

/**
 * Validates the incoming chat request body.
 * Requires a non-empty `message` string field.
 */
function validateChatRequest(req, res, next) {
  const { message } = req.body;

  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    logger.warn('Validation failed: missing or empty message', {
      body: req.body,
    });
    return res.status(400).json({
      type: 'error',
      reply: 'The "message" field is required and must be a non-empty string.',
      data: {},
    });
  }

  // Normalise — trim whitespace
  req.body.message = message.trim();

  // Ensure history is an array (default to empty)
  if (!Array.isArray(req.body.history)) {
    req.body.history = [];
  }

  // Ensure conversationId is a string (default to empty)
  if (typeof req.body.conversationId !== 'string') {
    req.body.conversationId = '';
  }

  next();
}

module.exports = validateChatRequest;
