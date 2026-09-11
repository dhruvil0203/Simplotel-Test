const { generateTemplateAnswer } = require('./templateResponder');
const logger = require('../utils/logger');

async function generateAnswer(context, question, history = []) {
  const useLLM = process.env.USE_LLM === 'true';
  const apiKey = process.env.GEMINI_API_KEY;

  if (useLLM && apiKey) {
    return callGemini(context, question, history, apiKey);
  }

  logger.info('LLM disabled — using template responder');
  return generateTemplateAnswer(context, question, history);
}

async function callGemini(context, question, history, apiKey) {
  const { GoogleGenerativeAI } = require('@google/generative-ai');

  const modelName = process.env.GEMINI_MODEL || 'gemini-3.6-flash';
  const systemPrompt = buildSystemPrompt(context);

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: modelName,
    systemInstruction: systemPrompt,
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 512,
    },
  });

  const rawContents = [];
  const recentHistory = history.slice(-6);
  for (const turn of recentHistory) {
    rawContents.push({
      role: turn.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: turn.content }],
    });
  }

  rawContents.push({
    role: 'user',
    parts: [{ text: question }],
  });

  while (rawContents.length > 0 && rawContents[0].role !== 'user') {
    rawContents.shift();
  }

  const contents = [];
  for (const item of rawContents) {
    if (contents.length > 0 && contents[contents.length - 1].role === item.role) {
      contents[contents.length - 1].parts[0].text += `\n${item.parts[0].text}`;
    } else {
      contents.push(item);
    }
  }

  if (contents.length === 0) {
    contents.push({
      role: 'user',
      parts: [{ text: question }],
    });
  }

  logger.info('Calling Gemini API', { model: modelName, questionLength: question.length });

  const result = await model.generateContent({ contents });
  const response = result.response;
  const text = response.text();

  logger.info('Gemini response received', { responseLength: text.length });
  return text;
}

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
