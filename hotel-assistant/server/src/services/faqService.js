const hotelData = require('../../data/hotel.json');
const { generateAnswer } = require('./llmClient');
const logger = require('../utils/logger');

function buildSearchableSections() {
  const sections = [];

  sections.push({
    title: 'Hotel Overview',
    text: `${hotelData.hotel.name}. ${hotelData.hotel.description} Address: ${hotelData.hotel.address}. Phone: ${hotelData.hotel.phone}. Email: ${hotelData.hotel.email}.`,
  });

  for (const [key, value] of Object.entries(hotelData.policies)) {
    sections.push({
      title: `Policy: ${key}`,
      text: typeof value === 'string' ? value : JSON.stringify(value),
    });
  }

  for (const [key, amenity] of Object.entries(hotelData.amenities)) {
    const parts = [amenity.name, amenity.description];
    if (amenity.hours) parts.push(`Hours: ${amenity.hours}`);
    if (amenity.price) parts.push(`Price: ${amenity.price}`);
    if (amenity.location) parts.push(`Location: ${amenity.location}`);

    for (const [k, v] of Object.entries(amenity)) {
      if (!['name', 'description', 'hours', 'price', 'location'].includes(k)) {
        if (typeof v === 'string') parts.push(`${k}: ${v}`);
        else if (Array.isArray(v)) parts.push(`${k}: ${JSON.stringify(v)}`);
      }
    }

    sections.push({ title: `Amenity: ${key}`, text: parts.join('. ') });
  }

  for (const room of hotelData.rooms) {
    sections.push({
      title: `Room: ${room.type}`,
      text: `${room.type} — ${room.description} Bed: ${room.bedType}. Max adults: ${room.maxAdults}, Max children: ${room.maxChildren}. Size: ${room.size}. Price: $${room.pricePerNight}/night. Amenities: ${room.amenities.join(', ')}.`,
    });
  }

  sections.push({
    title: 'Dining: Breakfast',
    text: `${hotelData.dining.breakfast.description} Price: ${hotelData.dining.breakfast.price}. ${hotelData.dining.breakfast.included} Hours: ${hotelData.dining.breakfast.hours}.`,
  });
  sections.push({
    title: 'Dining: Meal Plans',
    text: `${hotelData.dining.mealPlans.halfBoard}. ${hotelData.dining.mealPlans.fullBoard}. ${hotelData.dining.mealPlans.note}`,
  });

  for (const faq of hotelData.faqs) {
    sections.push({
      title: `FAQ: ${faq.question}`,
      text: `Q: ${faq.question} A: ${faq.answer}`,
    });
  }

  return sections;
}

function scoreSection(section, queryTokens) {
  const sectionText = `${section.title} ${section.text}`.toLowerCase();
  let score = 0;

  for (const token of queryTokens) {
    if (token.length < 2) continue;

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

function retrieveContext(query, topK = 5) {
  const sections = buildSearchableSections();

  const stopWords = new Set(['the', 'a', 'an', 'is', 'are', 'do', 'does', 'you', 'your', 'have', 'has', 'what', 'where', 'when', 'how', 'can', 'i', 'we', 'my', 'at', 'to', 'for', 'of', 'in', 'on', 'it', 'and', 'or', 'but', 'there']);
  const queryTokens = query
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .split(/\s+/)
    .filter((t) => t.length > 1 && !stopWords.has(t));

  if (queryTokens.length === 0) {
    return sections
      .filter((s) => s.title.startsWith('FAQ') || s.title === 'Hotel Overview')
      .map((s) => `[${s.title}]\n${s.text}`)
      .join('\n\n');
  }

  const scored = sections
    .map((s) => ({ ...s, score: scoreSection(s, queryTokens) }))
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);

  if (scored.length === 0) {
    return sections
      .filter((s) => s.title.startsWith('FAQ') || s.title === 'Hotel Overview')
      .map((s) => `[${s.title}]\n${s.text}`)
      .join('\n\n');
  }

  return scored.map((s) => `[${s.title}]\n${s.text}`).join('\n\n');
}

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
