const { generateTemplateAnswer } = require('./templateResponder');
const logger = require('../utils/logger');

/**
 * LLM client abstraction.
 *
 * If USE_LLM=true and GEMINI_API_KEY is set → calls Google Gemini.
 * Otherwise → delegates to the deterministic template responder.
 *
 * @param {string} context  - Retrieved hotel knowledge-base context
 * @param {string} question - The user's question
 * @param {Array}  history  - Conversation history [{role, content}, ...]
 * @returns {Promise<string>} The generated answer
 */
async function generateAnswer(context, question, history = []) {
  const useLLM = process.env.USE_LLM === 'true';
  const apiKey = process.env.GEMINI_API_KEY;

  if (useLLM && apiKey) {
    return callGemini(context, question, history, apiKey);
  }

  logger.info('LLM disabled — using template responder');
  return generateTemplateAnswer(context, question, history);
}

/**
 * Call Google Gemini via the @google/generative-ai SDK.
 */
async function callGemini(context, question, history, apiKey) {
  // Dynamic import so we don't crash if the SDK isn't installed
  // or when USE_LLM is false
  const { GoogleGenerativeAI } = require('@google/generative-ai');

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const systemPrompt = buildSystemPrompt(context);

  // Build the conversation history for the model
  const contents = [];

  // Add conversation history (last 6 turns max to keep context manageable)
  const recentHistory = history.slice(-6);
  for (const turn of recentHistory) {
    contents.push({
      role: turn.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: turn.content }],
    });
  }

  // Add the current question
  contents.push({
    role: 'user',
    parts: [{ text: question }],
  });

  logger.info('Calling Gemini API', { model: 'gemini-2.0-flash', questionLength: question.length });

  const result = await model.generateContent({
    contents,
    systemInstruction: { parts: [{ text: systemPrompt }] },
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 512,
    },
  });

  const response = result.response;
  const text = response.text();

  logger.info('Gemini response received', { responseLength: text.length });
  return text;
}

/**
 * Build the system prompt that restricts the model to the retrieved context.
 */
function buildSystemPrompt(context) {
  return `You are a helpful, friendly, and professional virtual concierge for The Grand Horizon Hotel. Your role is to assist hotel guests with their questions.

STRICT RULES — you must follow these exactly:
1. ONLY answer based on the hotel information provided below. Do NOT make up, guess, or invent any facts, prices, policies, phone numbers, or details.
2. If the answer to the guest's question is NOT present in the provided hotel information, respond with: "I don't have that information available. Please contact our front desk at +1 (555) 987-6543 or email reservations@grandhorizon.com for further assistance."
3. Do NOT answer questions unrelated to the hotel (e.g., general knowledge, weather, news, personal advice, booking taxis, etc.). Politely redirect them to the front desk.
4. Be warm, conversational, and concise. Use a friendly hotel concierge tone.
5. If the guest asks about room availability or booking, suggest they ask about specific dates and number of guests so you can check availability.

HOTEL INFORMATION:
${context}

Remember: NEVER fabricate information. If it's not in the hotel information above, say you don't have that information.`;
}

module.exports = { generateAnswer };
