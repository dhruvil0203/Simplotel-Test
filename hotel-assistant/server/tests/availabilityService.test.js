const { checkAvailability, extractBookingDetails, getMissingFields } = require('../src/services/availabilityService');

describe('Availability Service — checkAvailability', () => {
  test('returns valid rooms for a valid date range and guest count', () => {
    const result = checkAvailability('2026-12-20', '2026-12-25', 2);

    expect(result.valid).toBe(true);
    expect(result.rooms).toBeDefined();
    expect(Array.isArray(result.rooms)).toBe(true);
    expect(result.rooms.length).toBeGreaterThan(0);

    result.rooms.forEach((room) => {
      expect(room).toHaveProperty('type');
      expect(room).toHaveProperty('pricePerNight');
      expect(room).toHaveProperty('totalPrice');
      expect(room).toHaveProperty('available');
      expect(room).toHaveProperty('nights');
      expect(room.nights).toBe(5);
    });

    const available = result.rooms.filter((r) => r.available);
    expect(available.length).toBeGreaterThan(0);
  });

  test('returns error when check-out is before check-in', () => {
    const result = checkAvailability('2026-12-25', '2026-12-20', 2);

    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/check-out.*after/i);
  });

  test('returns error when check-out equals check-in', () => {
    const result = checkAvailability('2026-12-25', '2026-12-25', 2);

    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/check-out.*after/i);
  });

  test('returns error for invalid date format', () => {
    const result = checkAvailability('not-a-date', '2026-12-25', 2);

    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/invalid date/i);
  });

  test('marks rooms as unavailable when guest count exceeds capacity', () => {
    const result = checkAvailability('2026-12-20', '2026-12-22', 4);

    expect(result.valid).toBe(true);
    const standardRoom = result.rooms.find((r) => r.type === 'Standard Room');
    expect(standardRoom.available).toBe(false);

    const deluxeRoom = result.rooms.find((r) => r.type === 'Deluxe Room');
    expect(deluxeRoom.available).toBe(false);
  });

  test('calculates total price correctly based on number of nights', () => {
    const result = checkAvailability('2026-12-20', '2026-12-23', 1);

    expect(result.valid).toBe(true);
    result.rooms.forEach((room) => {
      expect(room.totalPrice).toBe(room.pricePerNight * 3);
      expect(room.nights).toBe(3);
    });
  });

  test('defaults to 1 adult when adults param is falsy', () => {
    const result = checkAvailability('2026-12-20', '2026-12-22', 0);

    expect(result.valid).toBe(true);
    const available = result.rooms.filter((r) => r.available);
    expect(available.length).toBeGreaterThan(0);
  });
});

describe('Availability Service — extractBookingDetails', () => {
  test('extracts guest count from "3 guests" terminology', () => {
    const result = extractBookingDetails('I need a room for 3 guests');
    expect(result.adults).toBe(3);
  });

  test('extracts guest count from "2 people" terminology', () => {
    const result = extractBookingDetails('Room for 2 people please');
    expect(result.adults).toBe(2);
  });

  test('returns only check-in when single date is provided', () => {
    const result = extractBookingDetails('I want a room on January 15');
    expect(result.checkIn).toBeDefined();
    expect(result.checkOut).toBeNull();
  });

  test('extracts both dates from a range expression', () => {
    const result = extractBookingDetails('from December 20 to December 25');
    expect(result.checkIn).toBeDefined();
    expect(result.checkOut).toBeDefined();
  });
});

describe('Availability Service — getMissingFields', () => {
  test('returns all fields when nothing is provided', () => {
    const missing = getMissingFields({ checkIn: null, checkOut: null, adults: null });
    expect(missing).toContain('checkInDate');
    expect(missing).toContain('checkOutDate');
    expect(missing).toContain('numberOfAdults');
    expect(missing.length).toBe(3);
  });

  test('returns empty array when all fields provided', () => {
    const missing = getMissingFields({ checkIn: '2026-12-20', checkOut: '2026-12-25', adults: 2 });
    expect(missing.length).toBe(0);
  });
});
