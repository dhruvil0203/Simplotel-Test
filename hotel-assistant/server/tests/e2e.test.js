const request = require('supertest');
const app = require('../src/app');

jest.mock('../src/services/llmClient', () => ({
  generateAnswer: jest.fn(),
}));

const { generateAnswer } = require('../src/services/llmClient');

beforeEach(() => {
  generateAnswer.mockReset();
});

describe('End-to-end conversation flow', () => {
  const conversationId = 'e2e-test-1';
  const history = [];

  test('Step 1: Greeting returns a welcome message', async () => {
    const res = await request(app)
      .post('/api/chat')
      .send({ message: 'Hello!', conversationId, history: [...history] });

    expect(res.status).toBe(200);
    expect(res.body.type).toBe('greeting');
    expect(res.body.reply.toLowerCase()).toMatch(/welcome|hello|assist/);

    history.push({ role: 'user', content: 'Hello!' });
    history.push({ role: 'assistant', content: res.body.reply });
  });

  test('Step 2: FAQ question returns hotel info', async () => {
    generateAnswer.mockResolvedValue(
      'Check-in time at The Grand Horizon Hotel is 3:00 PM. Early check-in is available from 12:00 PM.'
    );

    const res = await request(app)
      .post('/api/chat')
      .send({
        message: 'What time is check-in?',
        conversationId,
        history: [...history],
      });

    expect(res.status).toBe(200);
    expect(res.body.type).toBe('faq');
    expect(res.body.reply.length).toBeGreaterThan(0);

    history.push({ role: 'user', content: 'What time is check-in?' });
    history.push({ role: 'assistant', content: res.body.reply });
  });

  test('Step 3: Availability request with missing dates returns needs_info', async () => {
    const res = await request(app)
      .post('/api/chat')
      .send({
        message: 'I want to book a room for 2 guests',
        conversationId,
        history: [...history],
      });

    expect(res.status).toBe(200);
    expect(res.body.type).toBe('availability_needs_info');
    expect(res.body.data.missingFields).toBeDefined();
    expect(
      res.body.data.missingFields.some((f) => f.includes('Date'))
    ).toBe(true);

    history.push({ role: 'user', content: 'I want to book a room for 2 guests' });
    history.push({ role: 'assistant', content: res.body.reply });
  });

  test('Step 4: Full availability request returns rooms with pricing', async () => {
    const res = await request(app)
      .post('/api/chat')
      .send({
        message: "I'd like to check availability from 2026-12-20 to 2026-12-25 for 2 guests",
        conversationId,
        history: [...history],
      });

    expect(res.status).toBe(200);
    expect(res.body.type).toBe('availability_result');
    expect(res.body.data.rooms).toBeDefined();
    expect(Array.isArray(res.body.data.rooms)).toBe(true);
    expect(res.body.data.nights).toBe(5);

    const availableRooms = res.body.data.rooms.filter((r) => r.available);
    expect(availableRooms.length).toBeGreaterThan(0);
    availableRooms.forEach((room) => {
      expect(room.totalPrice).toBe(room.pricePerNight * 5);
    });

    history.push({ role: 'user', content: "I'd like to check availability from 2026-12-20 to 2026-12-25 for 2 guests" });
    history.push({ role: 'assistant', content: res.body.reply });
  });

  test('Step 5: Follow-up with different guest count reuses dates from context', async () => {
    const res = await request(app)
      .post('/api/chat')
      .send({
        message: 'What about for 3 guests?',
        conversationId,
        history: [...history],
      });

    expect(res.status).toBe(200);
    expect(res.body.type).toBe('availability_result');
    expect(res.body.data.guests).toBe(3);
    expect(res.body.data.checkIn).toBeDefined();
    expect(res.body.data.checkOut).toBeDefined();

    const availableRooms = res.body.data.rooms.filter((r) => r.available);
    expect(availableRooms.length).toBeGreaterThan(0);
    availableRooms.forEach((room) => {
      expect(room.maxAdults).toBeGreaterThanOrEqual(3);
    });
  });
});
