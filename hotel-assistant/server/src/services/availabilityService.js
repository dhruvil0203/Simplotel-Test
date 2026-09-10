const chrono = require('chrono-node');
const hotelData = require('../../data/hotel.json');

/**
 * Extract booking details (checkIn, checkOut, adults) from a natural-language message.
 * Uses chrono-node for date parsing and regex for guest count.
 */
function extractBookingDetails(message) {
  const result = { checkIn: null, checkOut: null, adults: null };

  // --- Date extraction via chrono-node ---
  const parsedDates = chrono.parse(message, new Date(), { forwardDate: true });

  if (parsedDates.length >= 2) {
    // Two separate date mentions → first is check-in, second is check-out
    result.checkIn = parsedDates[0].start.date().toISOString().split('T')[0];
    result.checkOut = parsedDates[1].start.date().toISOString().split('T')[0];
  } else if (parsedDates.length === 1) {
    const parsed = parsedDates[0];
    if (parsed.end) {
      // Range expression like "January 5 to January 8"
      result.checkIn = parsed.start.date().toISOString().split('T')[0];
      result.checkOut = parsed.end.date().toISOString().split('T')[0];
    } else {
      // Only one date found — treat as check-in
      result.checkIn = parsed.start.date().toISOString().split('T')[0];
    }
  }

  // --- Guest count extraction ---
  const guestPatterns = [
    /(\d+)\s*(?:adult|grown)/i,
    /(?:for)\s+(\d+)\s*(?:people|person|guest|pax)?/i,
    /(\d+)\s*(?:people|person|guest|pax)/i,
  ];

  for (const pattern of guestPatterns) {
    const match = message.match(pattern);
    if (match) {
      result.adults = parseInt(match[1], 10);
      break;
    }
  }

  return result;
}

/**
 * Determine which fields are still missing from a booking request.
 */
function getMissingFields(details) {
  const missing = [];
  if (!details.checkIn) missing.push('checkInDate');
  if (!details.checkOut) missing.push('checkOutDate');
  if (!details.adults) missing.push('numberOfAdults');
  return missing;
}

/**
 * Pure, deterministic availability checker — no LLM involvement.
 *
 * @param {string} checkIn  - ISO date string (YYYY-MM-DD)
 * @param {string} checkOut - ISO date string (YYYY-MM-DD)
 * @param {number} adults   - Number of adult guests
 * @returns {{ valid: boolean, error?: string, rooms?: Array }}
 */
function checkAvailability(checkIn, checkOut, adults) {
  const inDate = new Date(checkIn);
  const outDate = new Date(checkOut);

  // Validate date range
  if (isNaN(inDate.getTime()) || isNaN(outDate.getTime())) {
    return { valid: false, error: 'Invalid date format. Please use YYYY-MM-DD.' };
  }
  if (outDate <= inDate) {
    return { valid: false, error: 'Check-out date must be after the check-in date.' };
  }

  const nights = Math.ceil((outDate - inDate) / (1000 * 60 * 60 * 24));
  const numAdults = Number(adults) || 1;

  // Filter rooms that can accommodate the requested number of adults
  const rooms = hotelData.rooms.map((room) => {
    const canAccommodate = room.maxAdults >= numAdults;
    return {
      type: room.type,
      description: room.description,
      bedType: room.bedType,
      maxAdults: room.maxAdults,
      maxChildren: room.maxChildren,
      size: room.size,
      pricePerNight: room.pricePerNight,
      totalPrice: room.pricePerNight * nights,
      nights,
      available: canAccommodate && room.available,
      amenities: room.amenities,
    };
  });

  return { valid: true, rooms };
}

module.exports = { extractBookingDetails, getMissingFields, checkAvailability };
