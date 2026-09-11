const chrono = require('chrono-node');
const hotelData = require('../../data/hotel.json');

function extractBookingDetails(message) {
  const result = { checkIn: null, checkOut: null, adults: null };

  const parsedDates = chrono.parse(message, new Date(), { forwardDate: true });

  if (parsedDates.length >= 2) {
    result.checkIn = parsedDates[0].start.date().toISOString().split('T')[0];
    result.checkOut = parsedDates[1].start.date().toISOString().split('T')[0];
  } else if (parsedDates.length === 1) {
    const parsed = parsedDates[0];
    if (parsed.end) {
      result.checkIn = parsed.start.date().toISOString().split('T')[0];
      result.checkOut = parsed.end.date().toISOString().split('T')[0];
    } else {
      result.checkIn = parsed.start.date().toISOString().split('T')[0];
    }
  }

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

function getMissingFields(details) {
  const missing = [];
  if (!details.checkIn) missing.push('checkInDate');
  if (!details.checkOut) missing.push('checkOutDate');
  if (!details.adults) missing.push('numberOfAdults');
  return missing;
}

function checkAvailability(checkIn, checkOut, adults) {
  const inDate = new Date(checkIn);
  const outDate = new Date(checkOut);

  if (isNaN(inDate.getTime()) || isNaN(outDate.getTime())) {
    return { valid: false, error: 'Invalid date format. Please use YYYY-MM-DD.' };
  }
  if (outDate <= inDate) {
    return { valid: false, error: 'Check-out date must be after the check-in date.' };
  }

  const nights = Math.ceil((outDate - inDate) / (1000 * 60 * 60 * 24));
  const numAdults = Number(adults) || 1;

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
