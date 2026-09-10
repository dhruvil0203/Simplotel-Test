const hotelData = require('../../data/hotel.json');

/**
 * Template-based responder — deterministic fallback when the LLM is disabled.
 *
 * Fills simple templates using the matched hotel.json sections so the bot
 * can still answer common questions without any network call.
 */

// Map of keyword → template builder
const templates = {
  'check-in': () =>
    `Check-in time at ${hotelData.hotel.name} is ${hotelData.policies.checkInTime}. ${hotelData.policies.earlyCheckIn}`,

  'check-out': () =>
    `Check-out time is ${hotelData.policies.checkOutTime}. ${hotelData.policies.lateCheckOut}`,

  'checkout': () =>
    `Check-out time is ${hotelData.policies.checkOutTime}. ${hotelData.policies.lateCheckOut}`,

  'checkin': () =>
    `Check-in time at ${hotelData.hotel.name} is ${hotelData.policies.checkInTime}. ${hotelData.policies.earlyCheckIn}`,

  'wifi': () =>
    `${hotelData.amenities.wifi.description} Speed: ${hotelData.amenities.wifi.speed}.`,

  'pool': () =>
    `${hotelData.amenities.pool.description} Hours: ${hotelData.amenities.pool.hours}. Location: ${hotelData.amenities.pool.location}.`,

  'gym': () =>
    `${hotelData.amenities.gym.description} Hours: ${hotelData.amenities.gym.hours}. Location: ${hotelData.amenities.gym.location}.`,

  'fitness': () =>
    `${hotelData.amenities.gym.description} Hours: ${hotelData.amenities.gym.hours}. Location: ${hotelData.amenities.gym.location}.`,

  'parking': () =>
    `${hotelData.amenities.parking.description} Self-parking: ${hotelData.amenities.parking.selfParking}. Valet: ${hotelData.amenities.parking.valetParking}. ${hotelData.amenities.parking.electricVehicleCharging}`,

  'restaurant': () =>
    `${hotelData.amenities.restaurant.description} Breakfast: ${hotelData.amenities.restaurant.breakfast}. Lunch: ${hotelData.amenities.restaurant.lunch}. Dinner: ${hotelData.amenities.restaurant.dinner}.`,

  'breakfast': () =>
    `${hotelData.dining.breakfast.description} Price: ${hotelData.dining.breakfast.price}. ${hotelData.dining.breakfast.included}`,

  'spa': () =>
    `${hotelData.amenities.spa.description} Hours: ${hotelData.amenities.spa.hours}. Location: ${hotelData.amenities.spa.location}.`,

  'pet': () =>
    hotelData.policies.petPolicy,

  'cancel': () =>
    hotelData.policies.cancellation,

  'cancellation': () =>
    hotelData.policies.cancellation,

  'smok': () =>
    hotelData.policies.smoking,

  'shuttle': () =>
    `${hotelData.amenities.airportShuttle.description} Price: ${hotelData.amenities.airportShuttle.price}. Private car: ${hotelData.amenities.airportShuttle.privateCar}`,

  'airport': () =>
    `${hotelData.amenities.airportShuttle.description} Price: ${hotelData.amenities.airportShuttle.price}. The airport is ${hotelData.amenities.airportShuttle.airportDistance}.`,

  'room service': () =>
    `Room service is ${hotelData.amenities.restaurant.roomService}`,

  'meal plan': () =>
    `Half-board (breakfast + dinner): ${hotelData.dining.mealPlans.halfBoard}. Full-board: ${hotelData.dining.mealPlans.fullBoard}. ${hotelData.dining.mealPlans.note}`,

  'concierge': () =>
    hotelData.amenities.concierge.description,

  'business': () =>
    `${hotelData.amenities.businessCenter.description} Hours: ${hotelData.amenities.businessCenter.hours}. Location: ${hotelData.amenities.businessCenter.location}.`,

  'address': () =>
    `${hotelData.hotel.name} is located at ${hotelData.hotel.address}. Phone: ${hotelData.hotel.phone}. Email: ${hotelData.hotel.email}.`,

  'location': () =>
    `${hotelData.hotel.name} is located at ${hotelData.hotel.address}.`,

  'contact': () =>
    `You can reach us at ${hotelData.hotel.phone} or ${hotelData.hotel.email}. Our website is ${hotelData.hotel.website}.`,
};

// Patterns for bot identity questions (strict matching so it doesn't match other "what's your..." questions)
const BOT_IDENTITY_PATTERNS = [
  /\b(?:what(?:'s|\s+is)\s+your\s+name|what(?:'s|\s+is)\s+yours)\b/i,
  /\b(?:who\s+are\s+you|what\s+are\s+you|what\s+can\s+you\s+do)\b/i,
  /\b(?:tell\s+me\s+about\s+yourself|introduce\s+yourself)\b/i,
  /^\s*(?:and\s+)?(?:what\s+about\s+you|what(?:'s|\s+is)\s+yours?)\s*[!.,?]*\s*$/i,
  /\byour\s+name\b/i,
];

// Patterns for hotel timing / opening hours / operational hours questions
const HOTEL_TIMING_PATTERNS = [
  /\b(?:hotel\s+timings?|hotel\s+timinig\w*|hotel\s+hours|opening\s+hours|hours\s+of\s+operation|operational\s+hours|front\s+desk\s+hours)\b/i,
  /\b(?:when\s+(?:does\s+the\s+hotel|are\s+you)\s+(?:open|close))\b/i,
  /\b(?:timings?|timinig\w*)\b/i,
];

// Keywords for room-related questions (non-availability)
const ROOM_KEYWORDS = [
  'room type',
  'room option',
  'what rooms',
  'types of room',
  'kind of room',
  'recommend a room',
  'suggest a room',
  'which room',
  'room rates',
  'room price',
];

// Patterns for hotel address and location questions
const LOCATION_PATTERNS = [
  /\bwhere\s+is\s+(?:the|your|this)?\s*hotel\b/i,
  /\bwhere\s+are\s+you(?:\s+located)?\b/i,
  /\bwhere\s+is\s+it(?:\s+located)?\b/i,
  /\bwhere(?:\s+is|\s+are)\s+(?:the\s+)?(?:property|grand\s+horizon)\b/i,
  /\bwhat(?:'s|\s+is)\s+(?:the|your)?\s*address\b/i,
  /\bhotel\s+address\b/i,
  /\bhotel\s+location\b/i,
  /\bhow\s+(?:do\s+i|to)\s+(?:get\s+to|reach|find)\s+(?:the\s+)?(?:hotel|you|grand\s+horizon)\b/i,
  /\bdirections?\b/i,
  /\baddress\b/i,
  /\blocation\b/i,
];

// Patterns for contact information
const CONTACT_PATTERNS = [
  /\b(?:phone\s*number|telephone|call\s+you|how\s+to\s+call|contact\s+number|email\s+address|website)\b/i,
  /\bhow\s+(?:can\s+i|to)\s+contact\s+(?:you|the\s+hotel|front\s+desk)\b/i,
  /\bcontact\s+(?:info|information|details)\b/i,
  /\bcontact\b/i,
];

// Patterns for hotel overview/about
const OVERVIEW_PATTERNS = [
  /\b(?:tell\s+me\s+about\s+(?:the\s+hotel|grand\s+horizon)|about\s+the\s+hotel|hotel\s+overview|hotel\s+info)\b/i,
  /\b(?:star\s+rating|how\s+many\s+stars|5\s*star)\b/i,
];

function handleCancellationQuestion(lower) {
  // Check for specific hours mentioned (e.g., "before 3 hours", "24 hours before")
  const hourMatch = lower.match(/(\d+)\s*hours?/i);
  const dayMatch = lower.match(/(\d+)\s*days?/i);

  if (hourMatch) {
    const hours = parseInt(hourMatch[1], 10);
    if (hours <= 48) {
      return `Cancelling ${hours} hour${hours > 1 ? 's' : ''} before check-in is within our 48-hour window. Under our policy, you will be charged a fee equivalent to one night's stay, and any amount paid for remaining nights will be refunded to you.`;
    } else {
      return `Cancelling ${hours} hours before check-in is outside our 48-hour window, so cancellation is 100% free and you will receive a full refund!`;
    }
  }

  if (dayMatch) {
    const days = parseInt(dayMatch[1], 10);
    if (days < 2) {
      return `Cancelling ${days} day before check-in is within the 48-hour window. You will be charged for one night's stay, and any balance for remaining nights will be refunded.`;
    } else {
      return `Cancelling ${days} days in advance qualifies for free cancellation with a 100% full refund!`;
    }
  }

  if (/\b(?:how\s+much\s+(?:will|do|can)\s+i\s+get|refund|money\s+back|penalty|cancellation\s+fee)\b/i.test(lower)) {
    return `For cancellations made up to 48 hours before check-in, you receive a 100% full refund. For cancellations made within 48 hours of check-in, you are charged a fee equivalent to one night's stay, and any remaining nights are refunded. No-shows are charged the full reservation amount.`;
  }

  return hotelData.policies.cancellation;
}

function handleCheckInQuestion(lower) {
  if (/\b(?:early|before\s+12|before\s+noon|morning\s+check.?in|fee|charge|cost)\b/i.test(lower)) {
    return `Early check-in is available from 12:00 PM onwards, subject to availability. For check-in before 12:00 PM, a fee of $50 applies. Standard check-in starts at ${hotelData.policies.checkInTime}.`;
  }
  return `Check-in time at ${hotelData.hotel.name} is ${hotelData.policies.checkInTime}. ${hotelData.policies.earlyCheckIn}`;
}

function handleCheckOutQuestion(lower) {
  if (/\b(?:late|after\s+11|afternoon\s+check.?out|fee|charge|cost|price)\b/i.test(lower)) {
    return `Standard check-out is at ${hotelData.policies.checkOutTime}. Late check-out until 2:00 PM is complimentary for loyalty members, or $40 for other guests. Late check-out until 4:00 PM is $75, subject to availability.`;
  }
  return `Check-out time is ${hotelData.policies.checkOutTime}. ${hotelData.policies.lateCheckOut}`;
}

// Patterns for room inclusions and amenities
const ROOM_INCLUSION_PATTERNS = [
  /\b(?:what(?:'s|\s+is)\s+(?:included|include)\s+in\s+(?:a\s+|one\s+day\s+|the\s+)?room(?:\s+book(?:ing)?)?)\b/i,
  /\b(?:what\s+(?:is|are)\s+the\s+room\s+amenities)\b/i,
  /\b(?:room\s+amenities|in.?room\s+amenities|room\s+inclusions?|amenities\s+in\s+(?:the\s+|a\s+)?room)\b/i,
  /\b(?:what\s+comes\s+with\s+(?:the\s+|a\s+)?room)\b/i,
  /\b(?:include|included|inclusions?)\s+in\s+(?:the\s+|a\s+|one\s+day\s+)?(?:room|stay|booking)\b/i,
  /\bwhat(?:'s|\s+is)\s+included\s+(?:in\s+(?:the\s+)?price|with\s+(?:a\s+)?room)\b/i,
];

// Patterns for general hotel amenities list
const ALL_AMENITIES_PATTERNS = [
  /\b(?:what\s+amenities\s+do\s+you\s+have|list\s+(?:of\s+)?amenities|hotel\s+amenities|all\s+amenities|facilities\s+(?:do\s+you\s+have|available))\b/i,
  /\bwhat\s+(?:amenities|services|facilities)\s+(?:are\s+)?available\b/i,
];

// Patterns for dining and food options
const DINING_PATTERNS = [
  /\b(?:in\s+food|about\s+food|food\s+included|food\s+inclusions?|what\s+food|food\s+options?|dining\s+options?|restaurants?|where\s+can\s+i\s+eat|eat\s+at\s+the\s+hotel|meals?|cuisines?|food|drinks?|beverages?|bar|lunch|dinner)\b/i,
];

// Patterns for spa treatments
const SPA_PATTERNS = [
  /\b(?:spa\s+treatments?|massages?|facial|spa\s+menu|spa\s+prices?|wellness|sauna|steam\s*room)\b/i,
];

/**
 * Generate a template-based answer from the hotel knowledge base.
 *
 * @param {string} context - The matched context section
 * @param {string} question - The user's question
 * @param {Array} history - Conversation history
 * @returns {string} A deterministic answer
 */
function generateTemplateAnswer(context, question, history = []) {
  const lower = question.toLowerCase().trim();

  // 1. Check for bot identity questions
  if (BOT_IDENTITY_PATTERNS.some((pat) => pat.test(lower))) {
    return `I am the virtual guest assistant for ${hotelData.hotel.name}. I can help you check room availability, explore hotel amenities, answer dining questions, and assist with hotel policies. How can I help you today?`;
  }

  // 1b. Check for hotel timings / operational hours
  if (HOTEL_TIMING_PATTERNS.some((pat) => pat.test(lower))) {
    return `${hotelData.hotel.name} front desk and concierge operate 24 hours a day, 7 days a week.\n\nFacility hours:\n• Check-in: 3:00 PM (Early check-in from 12:00 PM)\n• Check-out: 11:00 AM (Late check-out options available)\n• Rooftop Infinity Pool: 6:00 AM – 10:00 PM daily\n• Horizon Fitness Center: 24/7\n• Skyline Restaurant & Bar: Breakfast (6:30 AM – 10:30 AM), Lunch (12:00 PM – 2:30 PM), Dinner (6:00 PM – 10:30 PM), Bar (4:00 PM – 12:00 AM)\n• Serenity Spa: 9:00 AM – 9:00 PM daily`;
  }

  // 2. Check for hotel address / location questions
  if (LOCATION_PATTERNS.some((pat) => pat.test(lower))) {
    return `${hotelData.hotel.name} is located at ${hotelData.hotel.address}. For directions or transportation inquiries, our front desk is available 24/7 at ${hotelData.hotel.phone}.`;
  }

  // 3. Check for contact info questions
  if (CONTACT_PATTERNS.some((pat) => pat.test(lower))) {
    return `You can reach ${hotelData.hotel.name} by phone at ${hotelData.hotel.phone}, via email at ${hotelData.hotel.email}, or visit our website at ${hotelData.hotel.website}.`;
  }

  // 4. Check for hotel overview/about
  if (OVERVIEW_PATTERNS.some((pat) => pat.test(lower))) {
    return `${hotelData.hotel.name} (${hotelData.hotel.starRating}-star hotel): ${hotelData.hotel.description} Located at ${hotelData.hotel.address}.`;
  }

  // 5. Check for room inclusions
  if (ROOM_INCLUSION_PATTERNS.some((pat) => pat.test(lower))) {
    return `Every room booking at ${hotelData.hotel.name} includes:\n• High-Speed WiFi (up to 200 Mbps)\n• Smart TV and in-room safe\n• Coffee maker / Nespresso machine and mini fridge\n• Luxury bath amenities, bathrobes and slippers\n• 24/7 access to the Horizon Fitness Center (Level 3)\n• Access to the rooftop heated infinity pool and sundeck (Level 25)\n\nNote: Deluxe Rooms, Executive Suites, and Presidential Suites also include complimentary daily breakfast.`;
  }

  // 6. Check for all hotel amenities
  if (ALL_AMENITIES_PATTERNS.some((pat) => pat.test(lower))) {
    return `${hotelData.hotel.name} amenities:\n• Rooftop Heated Infinity Pool & Sundeck (6:00 AM – 10:00 PM, 25th floor)\n• 24/7 Horizon Fitness Center (Technogym, Peloton bikes, Level 3)\n• Serenity Spa & Wellness (massages, sauna, steam room, Level 2)\n• Skyline Restaurant & Bar with 24-hour room service\n• High-Speed WiFi throughout the hotel\n• Secure underground parking with Tesla and EV Superchargers\n• Scheduled Airport Shuttle to MIA ($30 one-way / $50 round-trip)\n• Business Center & Meeting Rooms (Level 1)\n• 24-Hour Front Desk and Concierge`;
  }

  // 7. Check for dining & food options
  if (DINING_PATTERNS.some((pat) => pat.test(lower))) {
    return `Dining options at ${hotelData.hotel.name}:\n• Skyline Restaurant & Bar: American dining with terrace sunset views. Breakfast (${hotelData.dining.breakfast.hours}), Lunch (12:00 PM – 2:30 PM), Dinner (6:00 PM – 10:30 PM), Bar (4:00 PM – 12:00 AM).\n• Breakfast Buffet: International dishes and live cooking stations ($35/adult, $18/child — complimentary for Deluxe and Suite guests).\n• 24-Hour Room Service: Full menu delivered to your room.\n• Meal Plans: Half-Board ($75/adult/night) and Full-Board ($110/adult/night) available.`;
  }

  // 8. Check for spa treatments
  if (SPA_PATTERNS.some((pat) => pat.test(lower))) {
    return `${hotelData.amenities.spa.description} Hours: ${hotelData.amenities.spa.hours}, located on Level 2.\nTreatments:\n• Classic Swedish Massage (60 min) — $120\n• Deep Tissue Massage (60 min) — $140\n• Signature Horizon Facial (75 min) — $160\n• Couples Retreat Package (90 min) — $280`;
  }

  // 9. Check for cancellation & refund questions
  if (/\b(?:cancel|cancellation|refund)\b/i.test(lower)) {
    return handleCancellationQuestion(lower);
  }

  // 10. Check for check-in / check-out questions
  if (/\b(?:check.?in|early\s+check.?in)\b/i.test(lower)) {
    return handleCheckInQuestion(lower);
  }
  if (/\b(?:check.?out|late\s+check.?out)\b/i.test(lower)) {
    return handleCheckOutQuestion(lower);
  }

  // 11. Check for room-type questions
  if (ROOM_KEYWORDS.some((kw) => lower.includes(kw))) {
    const roomList = hotelData.rooms
      .map(
        (r) =>
          `• ${r.type} — ${r.bedType}, up to ${r.maxAdults} adults, $${r.pricePerNight}/night. ${r.description}`
      )
      .join('\n');
    return `We offer the following room types:\n\n${roomList}\n\nWould you like to check availability for any of these?`;
  }

  // 12. Try template match for specific amenities and policies
  for (const [keyword, templateFn] of Object.entries(templates)) {
    if (lower.includes(keyword)) {
      return templateFn();
    }
  }

  // Fallback — answer not found in knowledge base
  return "I don't have that information available. Please contact our front desk at +1 (555) 987-6543 or email reservations@grandhorizon.com for further assistance.";
}

module.exports = { generateTemplateAnswer };
