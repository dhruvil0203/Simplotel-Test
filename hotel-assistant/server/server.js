require('dotenv').config();
const app = require('./src/app');
const logger = require('./src/utils/logger');

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  logger.info(`Hotel Assistant server running on port ${PORT}`, {
    port: PORT,
    useLLM: process.env.USE_LLM === 'true',
    hasApiKey: !!process.env.GEMINI_API_KEY,
  });
});
