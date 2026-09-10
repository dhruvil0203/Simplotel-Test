const { checkAvailability } = require('../src/services/availabilityService');

describe('Availability Service — checkAvailability', () => {
  test('returns valid rooms for a valid date range and guest count', () => {
    const result = checkAvailability('2026-12-20', '2026-12-25', 2);

    expect(result.valid).toBe(true);
    expect(result.rooms).toBeDefined();
    expect(Array.isArray(result.rooms)).toBe(true);
    expect(result.rooms.length).toBeGreaterThan(0);

    // All rooms should have the expected shape
    result.rooms.forEach((room) => {
      expect(room).toHaveProperty('type');
      expect(room).toHaveProperty('pricePerNight');
      expect(room).toHaveProperty('totalPrice');
      expect(room).toHaveProperty('available');
      expect(room).toHaveProperty('nights');
      expect(room.nights).toBe(5);
    });

    // At least some rooms should be available for 2 adults
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
    // Request for 4 adults — most rooms max out at 2-3
    const result = checkAvailability('2026-12-20', '2026-12-22', 4);

    expect(result.valid).toBe(true);
    // Standard (max 2), Deluxe (max 2), Executive (max 2) should be unavailable
    const standardRoom = result.rooms.find((r) => r.type === 'Standard Room');
    expect(standardRoom.available).toBe(false);

    const deluxeRoom = result.rooms.find((r) => r.type === 'Deluxe Room');
    expect(deluxeRoom.available).toBe(false);
  });

  test('calculates total price correctly based on number of nights', () => {
    const result = checkAvailability('2026-12-20', '2026-12-23', 1); // 3 nights

    expect(result.valid).toBe(true);
    result.rooms.forEach((room) => {
      expect(room.totalPrice).toBe(room.pricePerNight * 3);
      expect(room.nights).toBe(3);
    });
  });

  test('defaults to 1 adult when adults param is falsy', () => {
    const result = checkAvailability('2026-12-20', '2026-12-22', 0);

    expect(result.valid).toBe(true);
    // All rooms should accommodate at least 1 adult
    const available = result.rooms.filter((r) => r.available);
    expect(available.length).toBeGreaterThan(0);
  });
});
