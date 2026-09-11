const { classifyIntent, extractName } = require('../src/services/intentClassifier');

describe('Intent Classifier', () => {
  describe('AVAILABILITY intent', () => {
    test('detects "availability" keyword', () => {
      expect(classifyIntent('Do you have availability for next week?')).toBe('AVAILABILITY');
    });

    test('detects "book a room" keyword', () => {
      expect(classifyIntent('I want to book a room')).toBe('AVAILABILITY');
    });

    test('detects "reservation" keyword', () => {
      expect(classifyIntent('Can I make a reservation?')).toBe('AVAILABILITY');
    });

    test('detects room + date language', () => {
      expect(classifyIntent('I need a room for January 15')).toBe('AVAILABILITY');
    });

    test('detects room + guest count', () => {
      expect(classifyIntent('Room for 3 adults please')).toBe('AVAILABILITY');
    });

    test('detects "I want to book hotel for 4 people/"', () => {
      expect(classifyIntent('I want to book hotel for 4 people/')).toBe('AVAILABILITY');
    });

    test('detects "hotel for 2 people"', () => {
      expect(classifyIntent('hotel for 2 people')).toBe('AVAILABILITY');
    });
  });

  describe('GREETING and INTRODUCTION intent', () => {
    test('classifies origin statement "I am From US" as GREETING rather than INTRODUCTION', () => {
      expect(classifyIntent('I am From US')).toBe('GREETING');
    });

    test('classifies "My name is Alex" as INTRODUCTION', () => {
      expect(classifyIntent('My name is Alex')).toBe('INTRODUCTION');
      expect(extractName('My name is Alex')).toBe('Alex');
    });

    test('classifies "My name is Dhruvil. and what\'s your?" as INTRODUCTION', () => {
      expect(classifyIntent("My name is Dhruvil. and what's your?")).toBe('INTRODUCTION');
      expect(extractName("My name is Dhruvil. and what's your?")).toBe('Dhruvil');
    });

    test('classifies "Dk here." and "Karan here." as INTRODUCTION', () => {
      expect(classifyIntent('Dk here.')).toBe('INTRODUCTION');
      expect(extractName('Dk here.')).toBe('Dk');

      expect(classifyIntent('Karan here.')).toBe('INTRODUCTION');
      expect(extractName('Karan here.')).toBe('Karan');

      expect(classifyIntent('Alex here')).toBe('INTRODUCTION');
      expect(extractName('Alex here')).toBe('Alex');

      expect(classifyIntent('This is Sarah')).toBe('INTRODUCTION');
      expect(extractName('This is Sarah')).toBe('Sarah');
    });

    test('classifies conversational starters like "let\'s get discussion" as GREETING', () => {
      expect(classifyIntent("let's get discussion")).toBe('GREETING');
      expect(classifyIntent("let's talk")).toBe('GREETING');
      expect(classifyIntent("can we chat")).toBe('GREETING');
      expect(classifyIntent("let's discuss")).toBe('GREETING');
    });

    test('classifies "I just arrived at the hotel" as GREETING', () => {
      expect(classifyIntent('I just arrived at the hotel')).toBe('GREETING');
    });
  });

  describe('FAQ intent', () => {
    test('classifies general hotel questions as FAQ', () => {
      expect(classifyIntent('What is the check-in time?')).toBe('FAQ');
    });

    test('classifies amenity questions as FAQ', () => {
      expect(classifyIntent('Do you have a swimming pool?')).toBe('FAQ');
    });

    test('classifies policy questions as FAQ', () => {
      expect(classifyIntent('What is the cancellation policy?')).toBe('FAQ');
    });

    test('classifies greeting with question as FAQ', () => {
      expect(classifyIntent('Hello, I have a question')).toBe('FAQ');
    });

    test('handles empty input gracefully', () => {
      expect(classifyIntent('')).toBe('FAQ');
    });

    test('handles non-string input gracefully', () => {
      expect(classifyIntent(null)).toBe('FAQ');
      expect(classifyIntent(undefined)).toBe('FAQ');
      expect(classifyIntent(42)).toBe('FAQ');
    });
  });
});
