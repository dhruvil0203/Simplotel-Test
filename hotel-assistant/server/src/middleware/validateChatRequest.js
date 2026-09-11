const logger = require('../utils/logger');

const MAX_MESSAGE_LENGTH = 2000;
const VALID_HISTORY_ROLES = new Set(['user', 'assistant']);

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

  if (message.trim().length > MAX_MESSAGE_LENGTH) {
    logger.warn('Validation failed: message too long', {
      length: message.trim().length,
    });
    return res.status(400).json({
      type: 'error',
      reply: `Message is too long. Please keep it under ${MAX_MESSAGE_LENGTH} characters.`,
      data: {},
    });
  }

  req.body.message = message.trim();

  if (!Array.isArray(req.body.history)) {
    req.body.history = [];
  }

  const validHistory = req.body.history.filter((item) => {
    return (
      item &&
      typeof item === 'object' &&
      typeof item.content === 'string' &&
      item.content.trim().length > 0 &&
      VALID_HISTORY_ROLES.has(item.role)
    );
  });
  req.body.history = validHistory;

  if (typeof req.body.conversationId !== 'string') {
    req.body.conversationId = '';
  }

  next();
}

module.exports = validateChatRequest;
