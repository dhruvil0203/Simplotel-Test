const express = require('express');
const { classifyIntent, extractName } = require('../services/intentClassifier');
const { extractBookingDetails, getMissingFields, checkAvailability } = require('../services/availabilityService');
const { handleFaqQuestion } = require('../services/faqService');
const validateChatRequest = require('../middleware/validateChatRequest');
const logger = require('../utils/logger');
const hotelData = require('../../data/hotel.json');

const router = express.Router();

const GREETING_RESPONSES = [
  `Hello! Welcome to ${hotelData.hotel.name}. I am your guest assistant. I can help you with room availability, hotel amenities, dining options, policies, and more. How can I assist you today?`,
  `Hi there! Welcome to ${hotelData.hotel.name}. I am here to help with anything you need during your stay. What can I do for you?`,
  `Hello! Welcome to ${hotelData.hotel.name}. Feel free to ask about our rooms, amenities, check-in and check-out policies, dining, and more. How can I help?`,
];

const THANKS_RESPONSES = [
  `You're welcome! If you need anything else about ${hotelData.hotel.name}, feel free to ask anytime.`,
  `Happy to help! Please let me know if you have any other questions. Enjoy your stay at ${hotelData.hotel.name}.`,
];

const GOODBYE_RESPONSES = [
  `Goodbye! We hope to welcome you to ${hotelData.hotel.name} soon. Have a wonderful day!`,
  `Take care! If you need anything in the future, I am always here to help.`,
];

const INTRODUCTION_RESPONSES = [
  `Hello {name}! Nice to meet you. Welcome to ${hotelData.hotel.name}. I am your virtual guest assistant. How can I assist you today?`,
  `Hi {name}! It is great to meet you. Welcome to ${hotelData.hotel.name}. How can I help with your stay?`,
  `Nice to meet you, {name}! Welcome to ${hotelData.hotel.name}. Feel free to ask me about room availability, amenities, dining, and hotel policies.`,
];

router.post('/', validateChatRequest, async (req, res, next) => {
  try {
    const { message, conversationId, history } = req.body;

    logger.info('Incoming chat request', { conversationId, message });

    const intent = classifyIntent(message);
    logger.info('Intent classified', { intent, message });

    if (intent === 'INTRODUCTION') {
      return handleIntroductionIntent(message, res);
    }

    if (intent === 'GREETING') {
      return handleGreetingIntent(message, res);
    }

    if (intent === 'AVAILABILITY') {
      return await handleAvailabilityIntent(message, history, res);
    }

    const result = await handleFaqQuestion(message, history);
    return res.json(result);

  } catch (err) {
    next(err);
  }
});

function extractPreviousBookingContext(history) {
  const context = { checkIn: null, checkOut: null, adults: null };
  if (!Array.isArray(history)) return context;

  for (let i = history.length - 1; i >= 0; i--) {
    const turn = history[i];
    if (turn.role !== 'user') continue;

    const prevDetails = extractBookingDetails(turn.content);
    if (prevDetails.checkIn && !context.checkIn) context.checkIn = prevDetails.checkIn;
    if (prevDetails.checkOut && !context.checkOut) context.checkOut = prevDetails.checkOut;
    if (prevDetails.adults && !context.adults) context.adults = prevDetails.adults;

    if (context.checkIn && context.checkOut && context.adults) break;
  }

  return context;
}

async function handleAvailabilityIntent(message, history, res) {
  const details = extractBookingDetails(message);

  const previousContext = extractPreviousBookingContext(history);
  if (!details.checkIn && previousContext.checkIn) details.checkIn = previousContext.checkIn;
  if (!details.checkOut && previousContext.checkOut) details.checkOut = previousContext.checkOut;
  if (!details.adults && previousContext.adults) details.adults = previousContext.adults;

  const missingFields = getMissingFields(details);

  logger.info('Availability details extracted', { details, missingFields, usedPreviousContext: !!(previousContext.checkIn || previousContext.checkOut || previousContext.adults) });

  if (missingFields.length > 0) {
    const fieldLabels = {
      checkInDate: 'check-in date',
      checkOutDate: 'check-out date',
      numberOfAdults: 'number of guests',
    };
    const missingLabels = missingFields.map((f) => fieldLabels[f] || f);

    return res.json({
      reply: `I'd love to help you find a room! To check availability, I'll need a few more details. Could you please provide your ${missingLabels.join(' and ')}?`,
      type: 'availability_needs_info',
      data: { missingFields, details },
    });
  }

  const result = checkAvailability(details.checkIn, details.checkOut, details.adults);

  if (!result.valid) {
    return res.json({
      reply: result.error,
      type: 'error',
      data: {},
    });
  }

  const availableRooms = result.rooms.filter((r) => r.available);
  const nights = result.rooms[0]?.nights || 1;

  let reply;
  if (availableRooms.length > 0) {
    reply = `Great news! I found ${availableRooms.length} room type${availableRooms.length > 1 ? 's' : ''} available for your ${nights}-night stay (${details.checkIn} to ${details.checkOut}) for ${details.adults} guest${details.adults > 1 ? 's' : ''}. Here are your options:`;
  } else {
    reply = `I'm sorry, we don't have any rooms that can accommodate ${details.adults} guest${details.adults > 1 ? 's' : ''} for those dates. Please contact our front desk for alternative arrangements.`;
  }

  return res.json({
    reply,
    type: 'availability_result',
    data: { rooms: result.rooms, checkIn: details.checkIn, checkOut: details.checkOut, nights, guests: details.adults },
  });
}

function handleGreetingIntent(message, res) {
  const lower = message.toLowerCase().trim();

  let responses;

  if (/\b(?:just\s+(?:arrived|checked\s+in|reached)|(?:i|we)\s+(?:just\s+)?arrived)\b/i.test(lower)) {
    return res.json({
      reply: `Welcome to ${hotelData.hotel.name}! We hope you had a smooth journey. Our front desk is located on the ground floor to assist with your keys and check-in. If you need assistance with WiFi, pool access, restaurant reservations, or luggage, feel free to ask me anytime. Enjoy your stay!`,
      type: 'greeting',
      data: {},
    });
  } else if (/\b(?:i\s*am|i'?m)\s+from\s+([a-zA-Z\s]+)/i.test(lower)) {
    const match = message.trim().match(/\b(?:i\s*am|i'?m)\s+from\s+([a-zA-Z\s]+)/i);
    const place = match ? match[1].trim().replace(/\b\w/g, (c) => c.toUpperCase()) : 'your hometown';
    return res.json({
      reply: `Welcome to ${hotelData.hotel.name}! We are delighted to welcome guests from ${place}. I can help you check room availability, explore amenities, or answer any questions about your stay. How can I assist you today?`,
      type: 'greeting',
      data: {},
    });
  } else if (/\b(bye|goodbye|see\s*you|good\s*bye)\b/i.test(lower)) {
    responses = GOODBYE_RESPONSES;
  } else if (/\b(thanks?|thank\s*you|thx)\b/i.test(lower)) {
    responses = THANKS_RESPONSES;
  } else {
    responses = GREETING_RESPONSES;
  }

  const reply = responses[Math.floor(Math.random() * responses.length)];

  return res.json({
    reply,
    type: 'greeting',
    data: {},
  });
}

function handleIntroductionIntent(message, res) {
  const name = extractName(message) || 'there';
  const lower = message.toLowerCase().trim();

  if (/\b(?:what(?:'s|\s+is)\s+(?:your|yours)|who\s+are\s+you|and\s+your(?:s|\s+name)?|what\s+about\s+you)\b/i.test(lower)) {
    return res.json({
      reply: `Hello ${name}! Nice to meet you. I am the virtual guest assistant for ${hotelData.hotel.name}. I can help you check room availability, explore hotel amenities, answer dining questions, and assist with hotel policies. How can I help you today?`,
      type: 'introduction',
      data: { name },
    });
  }

  const template = INTRODUCTION_RESPONSES[Math.floor(Math.random() * INTRODUCTION_RESPONSES.length)];
  const reply = template.replace(/\{name\}/g, name);

  return res.json({
    reply,
    type: 'introduction',
    data: { name },
  });
}

module.exports = router;
