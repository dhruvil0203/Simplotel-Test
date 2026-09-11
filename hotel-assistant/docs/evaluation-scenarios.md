# Test Suite Specifications & Verification Matrix

The following table documents all automated test specifications, synthetic guest inputs, expected behaviors, and verification results across the platform test suite. Tests can be executed using `cd server && npm test`.

| # | Scenario | Input | Expected Behavior | Observed Result |
|---|----------|-------|-------------------|-----------------
| 1 | Normal FAQ question | `"What time is check-in?"` | Returns `type: "faq"` with a relevant reply mentioning 3:00 PM | **PASS** — Status 200, returned `type: "faq"`, reply mentions check-in is at 3:00 PM |
| 2 | Amenity question (pool) | `"Do you have a swimming pool?"` | Returns `type: "faq"` with reply containing pool information | **PASS** — Status 200, returned `type: "faq"`, reply confirms outdoor heated pool & hours |
| 3 | Room-recommendation question | `"What room types do you have? I need something for 2 guests"` | Returns a response with room type information | **PASS** — Status 200, returned room details including Standard and Deluxe capacity |
| 4 | Full availability request | `"I want to book a room from December 20 to December 25 for 2 guests"` | Returns `type: "availability_result"` with `data.rooms` array containing room types with prices and availability | **PASS** — Status 200, returned `type: "availability_result"`, 5 room types with calculated 5-night totals |
| 5 | Availability missing dates | `"I want to book a room for 2 guests"` | Returns `type: "availability_needs_info"` with `data.missingFields` containing date fields | **PASS** — Status 200, returned `type: "availability_needs_info"`, missingFields: `["checkInDate", "checkOutDate"]` |
| 6 | Ambiguous out-of-knowledge question | `"What is the meaning of life?"` | Returns a response without fabricated hotel-specific details (no made-up prices or room numbers) | **PASS** — Status 200, handled safely without hallucinating hotel inventory or rates |
| 7 | Out-of-scope request | `"Can you book me a taxi to the airport?"` | Returns `type: "faq"` or `"fallback"` with reply redirecting to front desk | **PASS** — Status 200, returned helpful redirect to front desk phone/concierge |
| 8 | Follow-up with history | `"Is it heated?"` with history about pool | Returns `type: "faq"` and `generateAnswer` is called with the provided history | **PASS** — Status 200, correctly passed conversation history to model context |
| 9 | Simulated LLM failure | `"What is the wifi password?"` (with llmClient mocked to throw) | Returns HTTP 200 with `type: "fallback"` and friendly message — not a 500 crash | **PASS** — Status 200, returned graceful fallback message without throwing 500 |
| 10 | Missing message field | `{}` (no message field) | Returns HTTP 400 with `type: "error"` and message mentioning "message" field | **PASS** — Status 400, returned `{ type: "error", reply: "The \"message\" field is required..." }` |
| 11 | Greeting intent | `"Hello!"` | Returns `type: "greeting"` with welcome message | **PASS** — Status 200, returned `type: "greeting"` with hotel welcome |
| 12 | Introduction intent | `"My name is Alex"` | Returns `type: "introduction"` with extracted name | **PASS** — Status 200, returned `type: "introduction"`, `data.name: "Alex"` |
| 13 | Follow-up availability (context reuse) | `"What about for 3 guests?"` with availability history | Returns `type: "availability_result"` reusing dates from history | **PASS** — Status 200, reused check-in/check-out from context, `data.guests: 3` |
| 14 | Message too long | 2001-character string | Returns HTTP 400 with `type: "error"` mentioning length | **PASS** — Status 400, returned `"Message is too long"` |
| 15 | Malformed history items | Mix of valid/invalid history entries | Request succeeds; only valid history items are passed through | **PASS** — Status 200, invalid entries filtered, only `{ role: "user", content: "Hello" }` passed |
| 16 | API key security | Any request | No API keys, secrets, or sensitive config in response body | **PASS** — Response body contains no `GEMINI_API_KEY`, `api_key`, or `secret` strings |
| 17a | checkAvailability — valid range | `checkAvailability('2026-12-20', '2026-12-25', 2)` | Returns `valid: true` with rooms array, 5 nights, correct total prices | **PASS** — `valid: true`, 5 nights calculated, accurate pricing for all room tiers |
| 17b | checkAvailability — invalid range | `checkAvailability('2026-12-25', '2026-12-20', 2)` | Returns `valid: false` with error about check-out after check-in | **PASS** — `valid: false`, returned clear date order error |
| 17c | checkAvailability — high guest count | `checkAvailability('2026-12-20', '2026-12-22', 4)` | Returns `valid: true` but Standard and Deluxe rooms marked `available: false` | **PASS** — `valid: true`, Suite available, Standard/Deluxe capacity exceeded |
| 18 | E2E multi-turn conversation | Greeting → FAQ → availability (missing) → availability (full) → follow-up | Full flow: 5 sequential requests maintaining history and context | **PASS** — All 5 steps pass; context reuse verified at step 5 |
