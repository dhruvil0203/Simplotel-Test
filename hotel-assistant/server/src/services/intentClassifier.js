/**
 * Rule-based intent classifier.
 *
 * Returns one of:
 *   - 'GREETING'      — casual greetings (hello, hi, hey, etc.)
 *   - 'INTRODUCTION'  — user is introducing themselves (my name is X, I'm X)
 *   - 'AVAILABILITY'  — user is asking about room availability, booking, or dates
 *   - 'FAQ'           — everything else (general hotel questions)
 *
 * This is a pure function with no side effects.
 */

// Words that frequently follow "I am / I'm" but are NOT names
const NON_NAME_PREFIXES = new Set([
  'from', 'looking', 'interested', 'staying', 'planning', 'arriving',
  'traveling', 'travelling', 'visiting', 'here', 'booking', 'going',
  'sorry', 'fine', 'good', 'ok', 'okay', 'ready', 'asking', 'wondering',
  'just', 'a', 'an', 'the', 'not', 'new', 'with', 'at', 'in', 'on', 'for',
  'trying', 'writing', 'calling', 'checking', 'hoping', 'seeking', 'having',
  'coming', 'leaving', 'reaching', 'booking', 'staying'
]);

// Greeting patterns — casual hellos, goodbyes, origins, and pleasantries
const GREETING_PATTERNS = [
  /^\s*(hi|hello|hey|hola|howdy|hii+|heyy+|helloo+)\s*[!.,?]*\s*$/i,
  /^\s*(good\s*(morning|afternoon|evening|day|night))\s*[!.,?]*\s*$/i,
  /^\s*(what'?s\s*up|sup|yo)\s*[!.,?]*\s*$/i,
  /^\s*(greetings|namaste|salut)\s*[!.,?]*\s*$/i,
  /^\s*(how\s*are\s*you|how\s*do\s*you\s*do)\s*[!.,?\s]*$/i,
  /^\s*(thanks?|thank\s*you|thx)\s*[!.,?]*\s*$/i,
  /^\s*(bye|goodbye|see\s*you|good\s*bye)\s*[!.,?]*\s*$/i,
  /^\s*(?:i\s*am|i'?m)\s+from\s+[\w\s.,!?-]+$/i,
  /^\s*greetings\s+from\s+[\w\s.,!?-]+$/i,
];

// Stop words that shouldn't be captured as part of a name
const STOP_WORDS = new Set([
  'and', 'what', 'whats', "what's", 'who', 'whos', "who's", 'how', 'is', 'are', 'from', 'where',
  'nice', 'pleased', 'good', 'here', 'with', 'but', 'so', 'can', 'could', 'would', 'the', 'a', 'an'
]);

// Introduction patterns — user telling their name
const INTRODUCTION_PATTERNS = [
  /\b(?:my\s+name\s+is|call\s+me|they\s+call\s+me|name'?s)\s+([a-zA-Z]+(?:\s+[a-zA-Z]+)?)/i,
  /^\s*(?:hi|hello|hey)[,!]?\s+(?:my\s+name\s+is|call\s+me)\s+([a-zA-Z]+(?:\s+[a-zA-Z]+)?)/i,
  /^\s*(?:hi|hello|hey)[,!]?\s+(?:this\s+is)\s+([a-zA-Z]+(?:\s+[a-zA-Z]+)?)/i,
  /^\s*(?:i'?m|i\s+am)\s+([a-zA-Z]{2,}(?:\s+[a-zA-Z]{2,})?)(?:[.,!?]|\s|$)/i,
  /^\s*(?:hi|hello|hey)[,!]?\s+(?:i'?m|i\s+am)\s+([a-zA-Z]{2,}(?:\s+[a-zA-Z]{2,})?)(?:[.,!?]|\s|$)/i,
];

// Patterns that signal an availability / booking intent for hotel rooms
const AVAILABILITY_PATTERNS = [
  /\bavailab/i,
  /\b(?:book|reserve|booking|make\s+a\s+reservation)\s+(?:a\s+)?(?:room|suite|stay|hotel|accommodation|night|bed|place)\b/i,
  /\b(?:book|reserve|reservation|booking)\s+(?:for\s+\d+|from|to|between|on|this|next|tomorrow|today|tonight)\b/i,
  /\b(?:want|need|like|looking)\s+to\s+(?:book|stay|reserve)\b/i,
  /\b(?:room|suite|stay|hotel|accommodation)s?\s+for\s+\d+/i,
  /\b(?:for|accommodat\w*)\s+\d+\s*(?:adult|person|people|guest|pax)/i,
  /\bhow\s+much\s+(?:is|for|per)\s+(?:a\s+)?(?:room|night|stay)\b/i,
  /\b(?:room|stay|night)\s*(?:rates?|prices?|costs?)\b/i,
  /\bper\s+night\b/i,
  /\bcheck.?in.*date\b/i,
  /\bcheck.?out.*date\b/i,
  /\bnights?.*stay\b/i,
  /\bstay.*nights?\b/i,
  /\bvacanc(?:y|ies)\b/i,
  /^\s*(?:make\s+a\s+)?(?:reservation|booking)\s*[!.,?]*\s*$/i,
  /\b(?:make|have)\s+a\s+reservation\b/i,
];

// Date-like or guest-count language that, combined with room keywords, signals availability
const DATE_GUEST_PATTERNS = [
  /\b\d{1,2}[\/\-]\d{1,2}[\/\-]?\d{0,4}\b/,              // 12/25, 12-25-2025
  /\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\s+\d{1,2}/i,  // January 5
  /\b\d{1,2}\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*/i,  // 5 January
  /\b(?:today|tomorrow|next\s+week|next\s+month|this\s+weekend)\b/i,
  /\b\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}\b/,                  // 2025-12-25
  /\b(?:\d+)\s*(?:adult|guest|people|person|pax|member)\b/i,      // 2 adults, 4 people
  /\bfor\s+\d+\b/i,                                        // "for 3"
  /\b\d+\s+(?:night|day)s?\b/i,                           // 3 nights
];

const ROOM_MENTION_RE = /\b(?:room|suite|stay|night|accommodat\w*|hotel|property|place|bed)\b/i;

function classifyIntent(message) {
  if (typeof message !== 'string') return 'FAQ';

  const cleanMessage = message.trim();
  const lower = cleanMessage.toLowerCase();

  // 0. Introduction check — "my name is X", "I'm X" (only if a valid name is extracted)
  const name = extractName(cleanMessage);
  if (name) {
    return 'INTRODUCTION';
  }

  // 0b. Greeting check — handle greetings and origin statements
  for (const pattern of GREETING_PATTERNS) {
    if (pattern.test(cleanMessage)) {
      return 'GREETING';
    }
  }

  // 1. Direct availability patterns match
  for (const pattern of AVAILABILITY_PATTERNS) {
    if (pattern.test(cleanMessage)) {
      return 'AVAILABILITY';
    }
  }

  // 2. Room/hotel mention + date or guest count language
  if (ROOM_MENTION_RE.test(lower)) {
    for (const pattern of DATE_GUEST_PATTERNS) {
      if (pattern.test(cleanMessage)) {
        return 'AVAILABILITY';
      }
    }
  }

  return 'FAQ';
}

/**
 * Extract the user's name from an introduction message.
 * @param {string} message
 * @returns {string|null} The extracted name, or null
 */
function extractName(message) {
  for (const pattern of INTRODUCTION_PATTERNS) {
    const match = message.trim().match(pattern);
    if (match) {
      let rawName = (match[1] || match[2] || '').trim();
      const words = rawName.split(/\s+/).filter(Boolean);
      if (words.length === 0) continue;

      const firstWord = words[0].toLowerCase();
      if (NON_NAME_PREFIXES.has(firstWord) || STOP_WORDS.has(firstWord)) {
        continue;
      }

      // If second word is a stop word or non-name prefix, drop it
      if (words.length > 1 && (STOP_WORDS.has(words[1].toLowerCase()) || NON_NAME_PREFIXES.has(words[1].toLowerCase()))) {
        rawName = words[0];
      } else if (words.length > 2) {
        rawName = words.slice(0, 2).join(' ');
      }

      rawName = rawName.trim();
      if (rawName.length > 0 && rawName.length <= 30) {
        // Capitalize first letter of each word
        return rawName.replace(/\b\w/g, (c) => c.toUpperCase());
      }
    }
  }
  return null;
}

module.exports = { classifyIntent, extractName };
