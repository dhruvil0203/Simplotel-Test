const hotelData = require('../../data/hotel.json');

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

const BOT_IDENTITY_PATTERNS = [
  /\b(?:what(?:'s|\s+is)\s+your\s+name|what(?:'s|\s+is)\s+yours)\b/i,
  /\b(?:who\s+are\s+you|what\s+are\s+you|what\s+can\s+you\s+do)\b/i,
  /\b(?:tell\s+me\s+about\s+yourself|introduce\s+yourself)\b/i,
  /^\s*(?:and\s+)?(?:what\s+about\s+you|what(?:'s|\s+is)\s+yours?)\s*[!.,?]*\s*$/i,
  /\byour\s+name\b/i,
  /^\s*(?:let'?s\s+(?:have\s+(?:a\s+)?|get\s+(?:a\s+)?|start\s+(?:a\s+)?)?(?:discussion|chat|talk|conversation)|let'?s\s+(?:talk|chat|discuss|start|begin))\b/i,
  /^\s*(?:can\s+we\s+(?:talk|chat|discuss|have\s+a\s+chat)|shall\s+we\s+(?:talk|chat|discuss|start)|ready\s+to\s+(?:talk|chat|discuss|start))\b/i,
  /^\s*(?:i\s+(?:want|would\s+like)\s+to\s+(?:chat|talk|discuss|have\s+a\s+chat))\s*[!.,?]*\s*$/i,
  /^\s*(?:start|begin)\s+(?:chat|discussion|conversation)\s*[!.,?]*\s*$/i,
];

const HOTEL_TIMING_PATTERNS = [
  /\b(?:hotel\s+timings?|hotel\s+timinig\w*|hotel\s+hours|opening\s+hours|hours\s+of\s+operation|operational\s+hours|front\s+desk\s+hours)\b/i,
  /\b(?:when\s+(?:does\s+the\s+hotel|are\s+you)\s+(?:open|close))\b/i,
  /\b(?:timings?|timinig\w*)\b/i,
];

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

const CONTACT_PATTERNS = [
  /\b(?:phone\s*number|telephone|call\s+you|how\s+to\s+call|contact\s+number|email\s+address|website)\b/i,
  /\bhow\s+(?:can\s+i|to)\s+contact\s+(?:you|the\s+hotel|front\s+desk)\b/i,
  /\bcontact\s+(?:info|information|details)\b/i,
  /\bcontact\b/i,
];

const OVERVIEW_PATTERNS = [
  /\b(?:tell\s+me\s+about\s+(?:the\s+hotel|grand\s+horizon)|about\s+the\s+hotel|hotel\s+overview|hotel\s+info)\b/i,
  /\b(?:star\s+rating|how\s+many\s+stars|5\s*star)\b/i,
];

function handleCancellationQuestion(lower) {
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
    return `${hotelData.policies.earlyCheckIn} Standard check-in starts at ${hotelData.policies.checkInTime}.`;
  }
  return `Check-in time at ${hotelData.hotel.name} is ${hotelData.policies.checkInTime}. ${hotelData.policies.earlyCheckIn}`;
}

function handleCheckOutQuestion(lower) {
  if (/\b(?:late|after\s+11|afternoon\s+check.?out|fee|charge|cost|price)\b/i.test(lower)) {
    return `Standard check-out is at ${hotelData.policies.checkOutTime}. ${hotelData.policies.lateCheckOut}`;
  }
  return `Check-out time is ${hotelData.policies.checkOutTime}. ${hotelData.policies.lateCheckOut}`;
}

const ROOM_INCLUSION_PATTERNS = [
  /\b(?:what(?:'s|\s+is)\s+(?:included|include)\s+in\s+(?:a\s+|one\s+day\s+|the\s+)?room(?:\s+book(?:ing)?)?)\b/i,
  /\b(?:what\s+(?:is|are)\s+the\s+room\s+amenities)\b/i,
  /\b(?:room\s+amenities|in.?room\s+amenities|room\s+inclusions?|amenities\s+in\s+(?:the\s+|a\s+)?room)\b/i,
  /\b(?:what\s+comes\s+with\s+(?:the\s+|a\s+)?room)\b/i,
  /\b(?:include|included|inclusions?)\s+in\s+(?:the\s+|a\s+|one\s+day\s+)?(?:room|stay|booking)\b/i,
  /\bwhat(?:'s|\s+is)\s+included\s+(?:in\s+(?:the\s+)?price|with\s+(?:a\s+)?room)\b/i,
];

const ALL_AMENITIES_PATTERNS = [
  /\b(?:what\s+amenities\s+do\s+you\s+have|list\s+(?:of\s+)?amenities|hotel\s+amenities|all\s+amenities|facilities\s+(?:do\s+you\s+have|available))\b/i,
  /\bwhat\s+(?:amenities|services|facilities)\s+(?:are\s+)?available\b/i,
];

const DINING_PATTERNS = [
  /\b(?:in\s+food|about\s+food|food\s+included|food\s+inclusions?|what\s+food|food\s+options?|dining\s+options?|restaurants?|where\s+can\s+i\s+eat|eat\s+at\s+the\s+hotel|meals?|cuisines?|food|drinks?|beverages?|bar|lunch|dinner)\b/i,
];

const SPA_PATTERNS = [
  /\b(?:spa\s+treatments?|massages?|facial|spa\s+menu|spa\s+prices?|wellness|sauna|steam\s*room)\b/i,
];

function generateTemplateAnswer(context, question, history = []) {
  const lower = question.toLowerCase().trim();

  if (BOT_IDENTITY_PATTERNS.some((pat) => pat.test(lower))) {
    return `I am the virtual guest assistant for ${hotelData.hotel.name}. I can help you check room availability, explore hotel amenities, answer dining questions, and assist with hotel policies. How can I help you today?`;
  }

  if (HOTEL_TIMING_PATTERNS.some((pat) => pat.test(lower))) {
    const r = hotelData.amenities.restaurant;
    return `${hotelData.hotel.name} front desk and concierge operate 24 hours a day, 7 days a week.\n\nFacility hours:\n• Check-in: ${hotelData.policies.checkInTime} (${hotelData.policies.earlyCheckIn.split('.')[0]})\n• Check-out: ${hotelData.policies.checkOutTime} (${hotelData.policies.lateCheckOut.split('.')[0]})\n• ${hotelData.amenities.pool.name}: ${hotelData.amenities.pool.hours}\n• ${hotelData.amenities.gym.name}: ${hotelData.amenities.gym.hours}\n• ${r.name}: Breakfast (${r.breakfast}), Lunch (${r.lunch}), Dinner (${r.dinner}), Bar (${r.bar})\n• ${hotelData.amenities.spa.name}: ${hotelData.amenities.spa.hours}`;
  }

  if (LOCATION_PATTERNS.some((pat) => pat.test(lower))) {
    return `${hotelData.hotel.name} is located at ${hotelData.hotel.address}. For directions or transportation inquiries, our front desk is available 24/7 at ${hotelData.hotel.phone}.`;
  }

  if (CONTACT_PATTERNS.some((pat) => pat.test(lower))) {
    return `You can reach ${hotelData.hotel.name} by phone at ${hotelData.hotel.phone}, via email at ${hotelData.hotel.email}, or visit our website at ${hotelData.hotel.website}.`;
  }

  if (OVERVIEW_PATTERNS.some((pat) => pat.test(lower))) {
    return `${hotelData.hotel.name} (${hotelData.hotel.starRating}-star hotel): ${hotelData.hotel.description} Located at ${hotelData.hotel.address}.`;
  }

  if (ROOM_INCLUSION_PATTERNS.some((pat) => pat.test(lower))) {
    const standardRoom = hotelData.rooms.find((r) => r.type === 'Standard Room') || hotelData.rooms[0];
    const amenitiesList = standardRoom.amenities.map((a) => `• ${a}`).join('\n');
    const breakfastIncluded = hotelData.dining.breakfast.included;
    return `Every room booking at ${hotelData.hotel.name} includes:\n${amenitiesList}\n• Access to the ${hotelData.amenities.gym.name} (${hotelData.amenities.gym.location})\n• Access to the ${hotelData.amenities.pool.name} (${hotelData.amenities.pool.location})\n\n${breakfastIncluded}`;
  }

  if (ALL_AMENITIES_PATTERNS.some((pat) => pat.test(lower))) {
    const a = hotelData.amenities;
    const lines = [
      `• ${a.pool.name} (${a.pool.hours}, ${a.pool.location})`,
      `• ${a.gym.name} (${a.gym.hours}, ${a.gym.location})`,
      `• ${a.spa.name} (${a.spa.hours}, ${a.spa.location})`,
      `• ${a.restaurant.name} with ${a.restaurant.roomService.toLowerCase().startsWith('available') ? a.restaurant.roomService.toLowerCase() : 'room service: ' + a.restaurant.roomService}`,
      `• ${a.wifi.name} throughout the hotel`,
      `• ${a.parking.name} — Self-parking ${a.parking.selfParking}, Valet ${a.parking.valetParking}. ${a.parking.electricVehicleCharging}`,
      `• ${a.airportShuttle.name} (${a.airportShuttle.price})`,
      `• ${a.businessCenter.name} (${a.businessCenter.location})`,
      `• ${a.concierge.name}`,
    ];
    return `${hotelData.hotel.name} amenities:\n${lines.join('\n')}`;
  }

  if (DINING_PATTERNS.some((pat) => pat.test(lower))) {
    const r = hotelData.amenities.restaurant;
    const b = hotelData.dining.breakfast;
    const m = hotelData.dining.mealPlans;
    return `Dining options at ${hotelData.hotel.name}:\n• ${r.name}: ${r.description.split('.')[0]}. Breakfast (${r.breakfast}), Lunch (${r.lunch}), Dinner (${r.dinner}), Bar (${r.bar}).\n• Breakfast Buffet: ${b.description.split('.')[0]}. Price: ${b.price}. ${b.included.split('.')[0]}.\n• Room Service: ${r.roomService}\n• Meal Plans: Half-Board: ${m.halfBoard}. Full-Board: ${m.fullBoard}. ${m.note}`;
  }

  if (SPA_PATTERNS.some((pat) => pat.test(lower))) {
    const spa = hotelData.amenities.spa;
    const treatmentLines = (spa.popularTreatments || []).map(
      (t) => `• ${t.name} (${t.duration}) — ${t.price}`
    ).join('\n');
    return `${spa.description} Hours: ${spa.hours}, located at ${spa.location}.${treatmentLines ? '\nTreatments:\n' + treatmentLines : ''}`;
  }

  if (/\b(?:cancel|cancellation|refund)\b/i.test(lower)) {
    return handleCancellationQuestion(lower);
  }

  if (/\b(?:check.?in|early\s+check.?in)\b/i.test(lower)) {
    return handleCheckInQuestion(lower);
  }
  if (/\b(?:check.?out|late\s+check.?out)\b/i.test(lower)) {
    return handleCheckOutQuestion(lower);
  }

  if (ROOM_KEYWORDS.some((kw) => lower.includes(kw))) {
    const roomList = hotelData.rooms
      .map(
        (r) =>
          `• ${r.type} — ${r.bedType}, up to ${r.maxAdults} adults, $${r.pricePerNight}/night. ${r.description}`
      )
      .join('\n');
    return `We offer the following room types:\n\n${roomList}\n\nWould you like to check availability for any of these?`;
  }

  for (const [keyword, templateFn] of Object.entries(templates)) {
    if (lower.includes(keyword)) {
      return templateFn();
    }
  }

  return "I don't have that information available. Please contact our front desk at +1 (555) 987-6543 or email reservations@grandhorizon.com for further assistance.";
}

module.exports = { generateTemplateAnswer };
