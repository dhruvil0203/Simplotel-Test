const request = require('supertest');
const app = require('../src/app');

jest.mock('../src/services/llmClient', () => ({
  generateAnswer: jest.fn(),
}));

const { generateAnswer } = require('../src/services/llmClient');

beforeEach(() => {
  generateAnswer.mockReset();
  generateAnswer.mockResolvedValue(
    'Check-in time at The Grand Horizon Hotel is 3:00 PM.'
  );
});

describe('POST /api/chat', () => {
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
    expect(['faq', 'availability_result', 'availability_needs_info']).toContain(res.body.type);
    expect(res.body.reply).toBeDefined();
  });

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

    res.body.data.rooms.forEach((room) => {
      expect(room).toHaveProperty('type');
      expect(room).toHaveProperty('pricePerNight');
      expect(room).toHaveProperty('available');
    });
  });

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
    expect(
      res.body.data.missingFields.some((f) => f.includes('Date'))
    ).toBe(true);
  });

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
    expect(res.body.reply).not.toMatch(/\$\d+/);
    expect(res.body.reply).not.toMatch(/room \d+/i);
  });

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
    expect(['faq', 'fallback']).toContain(res.body.type);
    const replyLower = res.body.reply.toLowerCase();
    expect(
      replyLower.includes('front desk') ||
      replyLower.includes("don't have") ||
      replyLower.includes('contact') ||
      replyLower.includes('assist')
    ).toBe(true);
  });

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

    expect(generateAnswer).toHaveBeenCalled();
    const callArgs = generateAnswer.mock.calls[0];
    expect(callArgs[2]).toEqual(history);
  });

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

  test('11. Greeting message returns type "greeting"', async () => {
    const res = await request(app)
      .post('/api/chat')
      .send({ message: 'Hello!', conversationId: 'test-11', history: [] });

    expect(res.status).toBe(200);
    expect(res.body.type).toBe('greeting');
    expect(res.body.reply).toBeDefined();
    expect(res.body.reply.toLowerCase()).toMatch(/welcome|hello|hi/);
  });

  test('12. Introduction message returns type "introduction" with name', async () => {
    const res = await request(app)
      .post('/api/chat')
      .send({ message: 'My name is Alex', conversationId: 'test-12', history: [] });

    expect(res.status).toBe(200);
    expect(res.body.type).toBe('introduction');
    expect(res.body.data.name).toBe('Alex');
    expect(res.body.reply.toLowerCase()).toMatch(/alex/);
  });

  test('13. Follow-up availability reuses dates from conversation history', async () => {
    const history = [
      { role: 'user', content: 'I want to book a room from December 20 to December 25 for 2 guests' },
      { role: 'assistant', content: 'Great news! I found 4 room types available.' },
    ];

    const res = await request(app)
      .post('/api/chat')
      .send({
        message: 'What about for 3 guests?',
        conversationId: 'test-13',
        history,
      });

    expect(res.status).toBe(200);
    expect(res.body.type).toBe('availability_result');
    expect(res.body.data.rooms).toBeDefined();
    expect(res.body.data.checkIn).toBeDefined();
    expect(res.body.data.checkOut).toBeDefined();
    expect(res.body.data.guests).toBe(3);
  });

  test('14. Message exceeding 2000 characters returns 400', async () => {
    const longMessage = 'a'.repeat(2001);
    const res = await request(app)
      .post('/api/chat')
      .send({ message: longMessage, conversationId: 'test-14', history: [] });

    expect(res.status).toBe(400);
    expect(res.body.type).toBe('error');
    expect(res.body.reply).toMatch(/too long/i);
  });

  test('15. Malformed history items are filtered, request still succeeds', async () => {
    generateAnswer.mockResolvedValue('The pool is on the 25th floor.');

    const res = await request(app)
      .post('/api/chat')
      .send({
        message: 'Tell me about the pool',
        conversationId: 'test-15',
        history: [
          { role: 'user', content: 'Hello' },
          { badKey: 'no role' },
          null,
          { role: 'hacker', content: 'injected' },
          { role: 'assistant', content: '' },
        ],
      });

    expect(res.status).toBe(200);
    expect(res.body.reply).toBeDefined();
    const callArgs = generateAnswer.mock.calls[0];
    expect(callArgs[2]).toEqual([{ role: 'user', content: 'Hello' }]);
  });

  test('16. No API keys or secrets in response body', async () => {
    generateAnswer.mockResolvedValue('Welcome to the hotel!');

    const res = await request(app)
      .post('/api/chat')
      .send({ message: 'Hello', conversationId: 'test-16', history: [] });

    const bodyStr = JSON.stringify(res.body);
    expect(bodyStr).not.toMatch(/GEMINI_API_KEY/i);
    expect(bodyStr).not.toMatch(/api[_-]?key/i);
    expect(bodyStr).not.toMatch(/secret/i);
  });
});
