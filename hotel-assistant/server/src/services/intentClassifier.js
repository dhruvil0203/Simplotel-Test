const NON_NAME_PREFIXES = new Set([
  'from', 'looking', 'interested', 'staying', 'planning', 'arriving',
  'traveling', 'travelling', 'visiting', 'here', 'booking', 'going',
  'sorry', 'fine', 'good', 'ok', 'okay', 'ready', 'asking', 'wondering',
  'just', 'a', 'an', 'the', 'not', 'new', 'with', 'at', 'in', 'on', 'for',
  'trying', 'writing', 'calling', 'checking', 'hoping', 'seeking', 'having',
  'coming', 'leaving', 'reaching', 'booking', 'staying', 'standing', 'sitting',
  'waiting', 'clicking', 'still', 'always', 'already', 'also', 'back', 'out',
  'i', 'we', 'you', 'they', 'he', 'she', 'it', 'who', 'anyone', 'someone',
  'everyone', 'nobody', 'all', 'over', 'down', 'up', 'right', 'left'
]);

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
  /\b(?:just\s+(?:arrived|checked\s+in|reached)|(?:i|we)\s+(?:just\s+)?arrived)\b/i,
  /^\s*(?:let'?s\s+(?:have\s+(?:a\s+)?|get\s+(?:a\s+)?|start\s+(?:a\s+)?)?(?:discussion|chat|talk|conversation)|let'?s\s+(?:talk|chat|discuss|start|begin))\b/i,
  /^\s*(?:can\s+we\s+(?:talk|chat|discuss|have\s+a\s+chat)|shall\s+we\s+(?:talk|chat|discuss|start)|ready\s+to\s+(?:talk|chat|discuss|start))\b/i,
  /^\s*(?:i\s+(?:want|would\s+like)\s+to\s+(?:chat|talk|discuss|have\s+a\s+chat))\s*[!.,?]*\s*$/i,
  /^\s*(?:start|begin)\s+(?:chat|discussion|conversation)\s*[!.,?]*\s*$/i,
];

const STOP_WORDS = new Set([
  'and', 'what', 'whats', "what's", 'who', 'whos', "who's", 'how', 'is', 'are', 'am', 'from', 'where',
  'nice', 'pleased', 'good', 'here', 'with', 'but', 'so', 'can', 'could', 'would', 'the', 'a', 'an',
  'i', 'me', 'my', 'we', 'our', 'us', 'you', 'your', 'he', 'him', 'his', 'she', 'her', 'they', 'them', 'their', 'it', 'its'
]);

const INTRODUCTION_PATTERNS = [
  /\b(?:my\s+name\s+is|call\s+me|they\s+call\s+me|name'?s)\s+([a-zA-Z]+(?:\s+[a-zA-Z]+)?)/i,
  /^\s*(?:hi|hello|hey)[,!]?\s+(?:my\s+name\s+is|call\s+me)\s+([a-zA-Z]+(?:\s+[a-zA-Z]+)?)/i,
  /^\s*(?:hi|hello|hey)[,!]?\s+(?:this\s+is|it'?s)\s+([a-zA-Z]+(?:\s+[a-zA-Z]+)?)/i,
  /^\s*(?:this\s+is|it'?s)\s+([a-zA-Z]{2,}(?:\s+[a-zA-Z]{2,})?)(?:[.,!?]|\s|$)/i,
  /^\s*(?:i'?m|i\s+am)\s+([a-zA-Z]{2,}(?:\s+[a-zA-Z]{2,})?)(?:[.,!?]|\s|$)/i,
  /^\s*(?:hi|hello|hey)[,!]?\s+(?:i'?m|i\s+am)\s+([a-zA-Z]{2,}(?:\s+[a-zA-Z]{2,})?)(?:[.,!?]|\s|$)/i,
  /^\s*(?:hi|hello|hey)[,!]?\s+([a-zA-Z]{2,}(?:\s+[a-zA-Z]{2,})?)\s+here\b[.,!?]*\s*$/i,
  /^\s*([a-zA-Z]{2,}(?:\s+[a-zA-Z]{2,})?)\s+here\b[.,!?]*\s*$/i,
  /^\s*([a-zA-Z]{2,}(?:\s+[a-zA-Z]{2,})?)\s+speaking\b[.,!?]*\s*$/i,
];

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

const DATE_GUEST_PATTERNS = [
  /\b\d{1,2}[\/\-]\d{1,2}[\/\-]?\d{0,4}\b/,
  /\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\s+\d{1,2}/i,
  /\b\d{1,2}\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*/i,
  /\b(?:today|tomorrow|next\s+week|next\s+month|this\s+weekend)\b/i,
  /\b\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}\b/,
  /\b(?:\d+)\s*(?:adult|guest|people|person|pax|member)\b/i,
  /\bfor\s+\d+\b/i,
  /\b\d+\s+(?:night|day)s?\b/i,
];

const ROOM_MENTION_RE = /\b(?:room|suite|stay|night|accommodat\w*|hotel|property|place|bed)\b/i;

function classifyIntent(message) {
  if (typeof message !== 'string') return 'FAQ';

  const cleanMessage = message.trim();
  const lower = cleanMessage.toLowerCase();

  const name = extractName(cleanMessage);
  if (name) {
    return 'INTRODUCTION';
  }

  for (const pattern of GREETING_PATTERNS) {
    if (pattern.test(cleanMessage)) {
      return 'GREETING';
    }
  }

  for (const pattern of AVAILABILITY_PATTERNS) {
    if (pattern.test(cleanMessage)) {
      return 'AVAILABILITY';
    }
  }

  if (ROOM_MENTION_RE.test(lower)) {
    for (const pattern of DATE_GUEST_PATTERNS) {
      if (pattern.test(cleanMessage)) {
        return 'AVAILABILITY';
      }
    }
  }

  return 'FAQ';
}

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

      if (words.length > 1 && (STOP_WORDS.has(words[1].toLowerCase()) || NON_NAME_PREFIXES.has(words[1].toLowerCase()))) {
        rawName = words[0];
      } else if (words.length > 2) {
        rawName = words.slice(0, 2).join(' ');
      }

      rawName = rawName.trim();
      if (rawName.length > 0 && rawName.length <= 30) {
        return rawName.split(/\s+/).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      }
    }
  }
  return null;
}

module.exports = { classifyIntent, extractName };
