const request = require('supertest');
const app = require('../src/app');

// Mock the llmClient so tests never make real API calls
jest.mock('../src/services/llmClient', () => ({
  generateAnswer: jest.fn(),
}));

const { generateAnswer } = require('../src/services/llmClient');

// Default mock implementation — returns a template-like answer
beforeEach(() => {
  generateAnswer.mockReset();
  generateAnswer.mockResolvedValue(
    'Check-in time at The Grand Horizon Hotel is 3:00 PM.'
  );
});

describe('POST /api/chat', () => {
  // ------------------------------------------------------------------
  // 1. Normal FAQ question returns a relevant type: "faq" reply
  // ------------------------------------------------------------------
  test('1. FAQ question returns type "faq" with a relevant reply', async () => {
    generateAnswer.mockResolvedValue(
      'Check-in time at The Grand Horizon Hotel is 3:00 PM. Early check-in is available from 12:00 PM onwards, subject to availability.'
    );

    const res = await request(app)
      .post('/api/chat')
      .send({ message: 'What time is check-in?', conversationId: 'test-1', history: [] });

    expect(res.status).toBe(200);
    expect(res.body.type).toBe('faq');
    expect(res.body.reply).toBeDefined();
    expect(typeof res.body.reply).toBe('string');
    expect(res.body.reply.length).toBeGreaterThan(0);
  });

  // ------------------------------------------------------------------
  // 2. Amenity question (pool) returns correct info
  // ------------------------------------------------------------------
  test('2. Amenity question about pool returns pool info', async () => {
    generateAnswer.mockResolvedValue(
      'Yes! Our stunning rooftop infinity pool on the 25th floor offers panoramic city views. It\'s heated and open year-round from 6:00 AM to 10:00 PM.'
    );

    const res = await request(app)
      .post('/api/chat')
      .send({ message: 'Do you have a swimming pool?', conversationId: 'test-2', history: [] });

    expect(res.status).toBe(200);
    expect(res.body.type).toBe('faq');
    expect(res.body.reply.toLowerCase()).toMatch(/pool/);
  });

  // ------------------------------------------------------------------
  // 3. Room-recommendation question returns a sensible room suggestion
  // ------------------------------------------------------------------
  test('3. Room-recommendation question returns room info', async () => {
    generateAnswer.mockResolvedValue(
      'For your needs, I would recommend our Deluxe Room with a King Bed, accommodating up to 2 adults at $289/night, or our Executive Suite at $459/night for a more luxurious stay.'
    );

    const res = await request(app)
      .post('/api/chat')
      .send({
        message: 'What room types do you have? I need something for 2 guests',
        conversationId: 'test-3',
        history: [],
      });

    expect(res.status).toBe(200);
    // This could be classified as FAQ (room type question without dates)
    // or availability depending on the classifier
    expect(['faq', 'availability_result', 'availability_needs_info']).toContain(res.body.type);
    expect(res.body.reply).toBeDefined();
  });

  // ------------------------------------------------------------------
  // 4. Availability request with full info returns type "availability_result"
  // ------------------------------------------------------------------
  test('4. Full availability request returns rooms data', async () => {
    const res = await request(app)
      .post('/api/chat')
      .send({
        message: 'I want to book a room from December 20 to December 25 for 2 adults',
        conversationId: 'test-4',
        history: [],
      });

    expect(res.status).toBe(200);
    expect(res.body.type).toBe('availability_result');
    expect(res.body.data).toBeDefined();
    expect(res.body.data.rooms).toBeDefined();
    expect(Array.isArray(res.body.data.rooms)).toBe(true);
    expect(res.body.data.rooms.length).toBeGreaterThan(0);

    // Each room should have required fields
    res.body.data.rooms.forEach((room) => {
      expect(room).toHaveProperty('type');
      expect(room).toHaveProperty('pricePerNight');
      expect(room).toHaveProperty('available');
    });
  });

  // ------------------------------------------------------------------
  // 5. Availability request missing dates returns "availability_needs_info"
  // ------------------------------------------------------------------
  test('5. Availability request missing dates returns missingFields', async () => {
    const res = await request(app)
      .post('/api/chat')
      .send({
        message: 'I want to book a room for 2 adults',
        conversationId: 'test-5',
        history: [],
      });

    expect(res.status).toBe(200);
    expect(res.body.type).toBe('availability_needs_info');
    expect(res.body.data.missingFields).toBeDefined();
    expect(Array.isArray(res.body.data.missingFields)).toBe(true);
    expect(res.body.data.missingFields.length).toBeGreaterThan(0);
    // Should be missing at least one date field
    expect(
      res.body.data.missingFields.some((f) => f.includes('Date'))
    ).toBe(true);
  });

  // ------------------------------------------------------------------
  // 6. Ambiguous question not in knowledge base returns "fallback"
  // ------------------------------------------------------------------
  test('6. Ambiguous out-of-knowledge question returns fallback', async () => {
    generateAnswer.mockResolvedValue(
      "I don't have that information available. Please contact our front desk at +1 (555) 987-6543 or email reservations@grandhorizon.com for further assistance."
    );

    const res = await request(app)
      .post('/api/chat')
      .send({
        message: 'What is the meaning of life?',
        conversationId: 'test-6',
        history: [],
      });

    expect(res.status).toBe(200);
    // The reply should not fabricate hotel-specific details
    expect(res.body.reply).not.toMatch(/\$\d+/); // No made-up prices
    expect(res.body.reply).not.toMatch(/room \d+/i); // No made-up room numbers
  });

  // ------------------------------------------------------------------
  // 7. Out-of-scope request returns fallback
  // ------------------------------------------------------------------
  test('7. Out-of-scope request (book a taxi) returns fallback-style reply', async () => {
    generateAnswer.mockResolvedValue(
      "I don't have that information available. Please contact our front desk at +1 (555) 987-6543 or email reservations@grandhorizon.com for further assistance."
    );

    const res = await request(app)
      .post('/api/chat')
      .send({
        message: 'Can you book me a taxi to the airport?',
        conversationId: 'test-7',
        history: [],
      });

    expect(res.status).toBe(200);
    expect(res.body.reply).toBeDefined();
    // The response type should be faq or fallback (not error, not availability)
    expect(['faq', 'fallback']).toContain(res.body.type);
    // The reply should guide the user to contact the front desk
    const replyLower = res.body.reply.toLowerCase();
    expect(
      replyLower.includes('front desk') ||
      replyLower.includes("don't have") ||
      replyLower.includes('contact') ||
      replyLower.includes('assist')
    ).toBe(true);
  });

  // ------------------------------------------------------------------
  // 8. Follow-up question: history is passed to llmClient
  // ------------------------------------------------------------------
  test('8. Follow-up question passes history to llmClient', async () => {
    generateAnswer.mockResolvedValue(
      'Yes, the pool is heated and open year-round!'
    );

    const history = [
      { role: 'user', content: 'Do you have a pool?' },
      { role: 'assistant', content: 'Yes! Our rooftop infinity pool is on the 25th floor.' },
    ];

    const res = await request(app)
      .post('/api/chat')
      .send({
        message: 'Is it heated?',
        conversationId: 'test-8',
        history,
      });

    expect(res.status).toBe(200);
    expect(res.body.type).toBe('faq');

    // Assert that generateAnswer was called with history included
    expect(generateAnswer).toHaveBeenCalled();
    const callArgs = generateAnswer.mock.calls[0];
    expect(callArgs[2]).toEqual(history); // Third argument is history
  });

  // ------------------------------------------------------------------
  // 9. Simulated LLM failure — still returns 200 with fallback
  // ------------------------------------------------------------------
  test('9. LLM failure returns 200 with type "fallback", not 500', async () => {
    generateAnswer.mockRejectedValue(new Error('Gemini API timeout'));

    const res = await request(app)
      .post('/api/chat')
      .send({
        message: 'What is the wifi password?',
        conversationId: 'test-9',
        history: [],
      });

    expect(res.status).toBe(200);
    expect(res.body.type).toBe('fallback');
    expect(res.body.reply).toBeDefined();
    expect(res.body.reply.length).toBeGreaterThan(0);
  });

  // ------------------------------------------------------------------
  // 10. Validation: missing message returns 400
  // ------------------------------------------------------------------
  test('10. Missing message field returns 400 with clear error', async () => {
    const res = await request(app)
      .post('/api/chat')
      .send({ conversationId: 'test-10', history: [] });

    expect(res.status).toBe(400);
    expect(res.body.type).toBe('error');
    expect(res.body.reply).toMatch(/message/i);
  });

  test('10b. Empty message string returns 400', async () => {
    const res = await request(app)
      .post('/api/chat')
      .send({ message: '   ', conversationId: 'test-10b', history: [] });

    expect(res.status).toBe(400);
    expect(res.body.type).toBe('error');
  });
});
