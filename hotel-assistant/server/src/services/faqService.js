const hotelData = require('../../data/hotel.json');
const { generateAnswer } = require('./llmClient');
const logger = require('../utils/logger');

/**
 * FAQ service — retrieves relevant hotel context via keyword overlap scoring,
 * builds a restricted prompt, and calls the LLM client.
 */

/**
 * Flatten the hotel knowledge base into searchable sections.
 * Each section has a title and text content.
 */
function buildSearchableSections() {
  const sections = [];

  // Hotel info
  sections.push({
    title: 'Hotel Overview',
    text: `${hotelData.hotel.name}. ${hotelData.hotel.description} Address: ${hotelData.hotel.address}. Phone: ${hotelData.hotel.phone}. Email: ${hotelData.hotel.email}.`,
  });

  // Policies
  for (const [key, value] of Object.entries(hotelData.policies)) {
    sections.push({
      title: `Policy: ${key}`,
      text: typeof value === 'string' ? value : JSON.stringify(value),
    });
  }

  // Amenities
  for (const [key, amenity] of Object.entries(hotelData.amenities)) {
    const parts = [amenity.name, amenity.description];
    if (amenity.hours) parts.push(`Hours: ${amenity.hours}`);
    if (amenity.price) parts.push(`Price: ${amenity.price}`);
    if (amenity.location) parts.push(`Location: ${amenity.location}`);

    // Include extra fields
    for (const [k, v] of Object.entries(amenity)) {
      if (!['name', 'description', 'hours', 'price', 'location'].includes(k)) {
        if (typeof v === 'string') parts.push(`${k}: ${v}`);
        else if (Array.isArray(v)) parts.push(`${k}: ${JSON.stringify(v)}`);
      }
    }

    sections.push({ title: `Amenity: ${key}`, text: parts.join('. ') });
  }

  // Room types
  for (const room of hotelData.rooms) {
    sections.push({
      title: `Room: ${room.type}`,
      text: `${room.type} — ${room.description} Bed: ${room.bedType}. Max adults: ${room.maxAdults}, Max children: ${room.maxChildren}. Size: ${room.size}. Price: $${room.pricePerNight}/night. Amenities: ${room.amenities.join(', ')}.`,
    });
  }

  // Dining
  sections.push({
    title: 'Dining: Breakfast',
    text: `${hotelData.dining.breakfast.description} Price: ${hotelData.dining.breakfast.price}. ${hotelData.dining.breakfast.included} Hours: ${hotelData.dining.breakfast.hours}.`,
  });
  sections.push({
    title: 'Dining: Meal Plans',
    text: `${hotelData.dining.mealPlans.halfBoard}. ${hotelData.dining.mealPlans.fullBoard}. ${hotelData.dining.mealPlans.note}`,
  });

  // FAQs
  for (const faq of hotelData.faqs) {
    sections.push({
      title: `FAQ: ${faq.question}`,
      text: `Q: ${faq.question} A: ${faq.answer}`,
    });
  }

  return sections;
}

/**
 * Score a section's relevance to the query using keyword overlap.
 */
function scoreSection(section, queryTokens) {
  const sectionText = `${section.title} ${section.text}`.toLowerCase();
  let score = 0;

  for (const token of queryTokens) {
    if (token.length < 2) continue; // skip very short words

    // Count occurrences
    const regex = new RegExp(escapeRegex(token), 'gi');
    const matches = sectionText.match(regex);
    if (matches) {
      score += matches.length;
    }
  }

  return score;
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Retrieve the most relevant sections from the hotel knowledge base.
 *
 * @param {string} query - The user's question
 * @param {number} topK - Number of top sections to return
 * @returns {string} Concatenated context text
 */
function retrieveContext(query, topK = 5) {
  const sections = buildSearchableSections();

  // Tokenise the query
  const stopWords = new Set(['the', 'a', 'an', 'is', 'are', 'do', 'does', 'you', 'your', 'have', 'has', 'what', 'where', 'when', 'how', 'can', 'i', 'we', 'my', 'at', 'to', 'for', 'of', 'in', 'on', 'it', 'and', 'or', 'but', 'there']);
  const queryTokens = query
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .split(/\s+/)
    .filter((t) => t.length > 1 && !stopWords.has(t));

  if (queryTokens.length === 0) {
    // Fall back to returning the hotel overview + FAQs
    return sections
      .filter((s) => s.title.startsWith('FAQ') || s.title === 'Hotel Overview')
      .map((s) => `[${s.title}]\n${s.text}`)
      .join('\n\n');
  }

  // Score and sort
  const scored = sections
    .map((s) => ({ ...s, score: scoreSection(s, queryTokens) }))
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);

  if (scored.length === 0) {
    // Return the full FAQ list as fallback context
    return sections
      .filter((s) => s.title.startsWith('FAQ') || s.title === 'Hotel Overview')
      .map((s) => `[${s.title}]\n${s.text}`)
      .join('\n\n');
  }

  return scored.map((s) => `[${s.title}]\n${s.text}`).join('\n\n');
}

/**
 * Handle a FAQ-type question.
 *
 * @param {string} message - The user's question
 * @param {Array} history - Conversation history
 * @returns {Promise<{reply: string, type: string, data: object}>}
 */
async function handleFaqQuestion(message, history = []) {
  const context = retrieveContext(message);

  logger.info('FAQ context retrieved', {
    queryLength: message.length,
    contextLength: context.length,
  });

  try {
    const reply = await generateAnswer(context, message, history);
    return {
      reply,
      type: 'faq',
      data: {},
    };
  } catch (err) {
    logger.error('LLM call failed in FAQ handler', { error: err.message });
    return {
      reply: "I'm sorry, I'm having trouble processing your question right now. Please try again in a moment, or contact our front desk at +1 (555) 987-6543 for immediate assistance.",
      type: 'fallback',
      data: {},
    };
  }
}

module.exports = { handleFaqQuestion, retrieveContext };
