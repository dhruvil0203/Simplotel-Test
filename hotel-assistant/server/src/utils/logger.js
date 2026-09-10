/**
 * Structured JSON-line logger with ISO timestamps.
 * Logs to stdout (info) and stderr (error/warn) for easy piping.
 */

function formatLog(level, message, meta = {}) {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...meta,
  };
  return JSON.stringify(entry);
}

const logger = {
  info(message, meta) {
    console.log(formatLog('info', message, meta));
  },

  warn(message, meta) {
    console.warn(formatLog('warn', message, meta));
  },

  error(message, meta) {
    console.error(formatLog('error', message, meta));
  },
};

module.exports = logger;
