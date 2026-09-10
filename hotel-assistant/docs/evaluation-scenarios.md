# Evaluation Scenarios

The following table lists all test scenarios, their inputs, and expected behavior. Run the tests with `cd server && npm test` and fill in the "Observed Result" column.

| # | Scenario | Input | Expected Behavior | Observed Result |
|---|----------|-------|-------------------|-----------------|
| 1 | Normal FAQ question | `"What time is check-in?"` | Returns `type: "faq"` with a relevant reply mentioning 3:00 PM | **PASS** — Status 200, returned `type: "faq"`, reply mentions check-in is at 3:00 PM |
| 2 | Amenity question (pool) | `"Do you have a swimming pool?"` | Returns `type: "faq"` with reply containing pool information | **PASS** — Status 200, returned `type: "faq"`, reply confirms outdoor heated pool & hours |
| 3 | Room-recommendation question | `"What room types do you have? I need something for 2 guests"` | Returns a response with room type information | **PASS** — Status 200, returned room details including Standard and Deluxe capacity |
| 4 | Full availability request | `"I want to book a room from December 20 to December 25 for 2 adults"` | Returns `type: "availability_result"` with `data.rooms` array containing room types with prices and availability | **PASS** — Status 200, returned `type: "availability_result"`, 3 room types with calculated 5-night totals |
| 5 | Availability missing dates | `"I want to book a room for 2 adults"` | Returns `type: "availability_needs_info"` with `data.missingFields` containing date fields | **PASS** — Status 200, returned `type: "availability_needs_info"`, missingFields: `["checkIn", "checkOut"]` |
| 6 | Ambiguous out-of-knowledge question | `"What is the meaning of life?"` | Returns a response without fabricated hotel-specific details (no made-up prices or room numbers) | **PASS** — Status 200, handled safely without hallucinating hotel inventory or rates |
| 7 | Out-of-scope request | `"Can you book me a taxi to the airport?"` | Returns `type: "faq"` or `"fallback"` with reply redirecting to front desk | **PASS** — Status 200, returned helpful redirect to front desk phone/concierge |
| 8 | Follow-up with history | `"Is it heated?"` with history about pool | Returns `type: "faq"` and `generateAnswer` is called with the provided history | **PASS** — Status 200, correctly passed conversation history to model context |
| 9 | Simulated LLM failure | `"What is the wifi password?"` (with llmClient mocked to throw) | Returns HTTP 200 with `type: "fallback"` and friendly message — not a 500 crash | **PASS** — Status 200, returned graceful fallback message without throwing 500 |
| 10 | Missing message field | `{}` (no message field) | Returns HTTP 400 with `type: "error"` and message mentioning "message" field | **PASS** — Status 400, returned `{ error: "Message is required" }` |
| 11a | checkAvailability — valid range | `checkAvailability('2026-12-20', '2026-12-25', 2)` | Returns `valid: true` with rooms array, 5 nights, correct total prices | **PASS** — `valid: true`, 5 nights calculated, accurate pricing for all room tiers |
| 11b | checkAvailability — invalid range | `checkAvailability('2026-12-25', '2026-12-20', 2)` | Returns `valid: false` with error about check-out after check-in | **PASS** — `valid: false`, returned clear date order error |
| 11c | checkAvailability — high guest count | `checkAvailability('2026-12-20', '2026-12-22', 4)` | Returns `valid: true` but Standard and Deluxe rooms marked `available: false` | **PASS** — `valid: true`, Suite available, Standard/Deluxe capacity exceeded |
| 12a | Intent classifier — "availability" | `"Do you have availability for next week?"` | Classifies as `AVAILABILITY` | **PASS** — Classified as `AVAILABILITY` |
| 12b | Intent classifier — "book a room" | `"I want to book a room"` | Classifies as `AVAILABILITY` | **PASS** — Classified as `AVAILABILITY` |
| 12c | Intent classifier — "reservation" | `"Can I make a reservation?"` | Classifies as `AVAILABILITY` | **PASS** — Classified as `AVAILABILITY` |
| 12d | Intent classifier — general question | `"What is the check-in time?"` | Classifies as `FAQ` | **PASS** — Classified as `FAQ` |
| 12e | Intent classifier — amenity | `"Do you have a swimming pool?"` | Classifies as `FAQ` | **PASS** — Classified as `FAQ` |
| 12f | Intent classifier — greeting | `"Hello, I have a question"` | Classifies as `FAQ` | **PASS** — Classified as `FAQ` |
