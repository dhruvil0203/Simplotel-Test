# Product & UX Notes

## What Customer Problem This Solves

Hotel guests frequently have questions at all hours — about check-in times, amenities, parking, cancellation policies, and room availability. Traditionally, these require calling the front desk or digging through a website. This AI-powered assistant provides instant, conversational answers 24/7, reducing wait times for guests and call volume for staff. It handles the most common queries autonomously so front desk agents can focus on complex requests that require a human touch.

## Guest Journey

- **Ask a question** → The guest types a natural-language question (e.g., "Do you have a pool?") and gets an immediate, contextual answer drawn from the hotel's knowledge base.
- **Get a relevant answer** → The assistant responds with accurate information sourced strictly from hotel data. If it doesn't know, it says so and provides front desk contact details — never a fabricated answer.
- **Ask a follow-up** → The guest can ask clarifying questions (e.g., "Is it heated?") and the assistant maintains conversational context, understanding what "it" refers to from prior turns.
- **Check availability** → When the guest asks about room availability, the system detects the intent and either asks for missing details (dates, guest count) via an inline form, or returns matching rooms with prices and availability badges.
- **Get results** → Room results are displayed as clean, scannable cards — not walls of text — so the guest can quickly compare options.

## Why the Frontend is Designed This Way

- **Chat-first interface**: Most guest queries are simple questions. A chat interface lets them ask naturally without navigating menus or filling out rigid forms. It feels like texting a concierge.
- **Inline forms only when needed**: The availability form appears only when the system detects a booking intent with missing information. This avoids forcing every user through a form-heavy flow when they might just want to ask "Is breakfast included?"
- **Cards for structured data**: Room availability results are inherently structured (type, price, capacity, availability). Rendering them as cards rather than prose makes comparison easy and looks professional.
- **Error state with retry**: Network failures and API errors are inevitable. Rather than letting the UI freeze or crash, we show a clear error message with a one-click retry button, keeping the user in control.

## Which Parts Use AI vs. Remain Deterministic, and Why

- **AI (LLM)**: FAQ answering — generating natural-language responses from retrieved hotel context. The LLM excels at understanding varied phrasings and producing human-like answers.
- **Deterministic**: Intent classification (rule-based keywords/regex), room availability checking (pure function against structured data), date/guest extraction (chrono-node parsing). These are kept deterministic because they must be reliable, predictable, and testable. An LLM could hallucinate room types, invent prices, or misparse dates.
- **Template responder**: When the LLM is disabled, a deterministic template filler provides accurate (if less conversational) answers from the same knowledge base — ensuring the system is always functional.

## What Can Go Wrong with AI Responses and Mitigations

- **Hallucination**: The LLM could invent facts not in the hotel data (e.g., a spa treatment that doesn't exist, a wrong price). **Mitigation**: The system prompt explicitly restricts the model to the provided context and instructs it to say "I don't have that information" when the answer isn't present.
- **Out-of-scope answers**: The guest might ask about topics beyond the hotel (weather, flights, general knowledge). **Mitigation**: The system prompt instructs the model to politely redirect to the front desk for anything not in the hotel information.
- **Stale context**: The knowledge base is a static JSON file. If hotel policies change, the assistant might give outdated answers. **Mitigation**: The JSON file is the single source of truth and is easy to update. In production, this would be backed by a CMS or PMS integration.
- **Context window overflow**: Very long conversations could push older context out of the model's window. **Mitigation**: Only the last 6 conversation turns are sent to the model, balancing context retention with token limits.

## What Happens on Model/API/Network Failure

- **LLM error**: If the Gemini API call throws or times out, the FAQ service catches the error and returns a `type: "fallback"` response with a friendly apology message. The request never returns a 500 to the user.
- **Network error (frontend)**: If the fetch to the backend fails entirely, the ChatWindow catches it, displays an error bubble, and shows a "Retry" button that re-sends the last message.
- **Validation error**: If the backend receives an invalid request (missing message), it returns a clear 400 error with an explanation.
- **Central error handler**: Any uncaught exception in a route is caught by the Express error handler middleware, logged server-side with full stack traces, and returns a safe generic error to the client.

## How to Measure Whether the Feature Is Useful

- **Fallback rate**: The percentage of queries that result in `type: "fallback"` — indicates how often the assistant fails to answer. A high rate suggests knowledge base gaps.
- **Resolution rate without human handoff**: The percentage of conversations that end without the guest needing to call the front desk. Higher is better.
- **Follow-up depth**: Average number of turns per conversation. Deeper conversations suggest the assistant is engaging and useful, but very deep ones might indicate it's struggling to resolve the query.
- **Availability conversion**: How often an availability check leads to a booking (requires integration with a PMS).
- **Thumbs up/down (future)**: Adding inline feedback buttons would let guests rate individual responses, providing direct signal on answer quality.
- **Response latency**: Time from message send to response render. Should stay under 2 seconds for the template responder, under 5 seconds for Gemini.

## What to Improve Before Production

- **Real database**: Replace the static JSON file with a proper database (PostgreSQL, MongoDB) for dynamic content management.
- **Real PMS integration**: Connect to the hotel's Property Management System for live room inventory, real-time pricing, and actual booking capability.
- **Proper RAG with embeddings**: Replace keyword-overlap scoring with vector embeddings and a similarity search engine (e.g., Pinecone, pgvector) for more accurate context retrieval.
- **Authentication & rate limiting**: Add user authentication, session management, and API rate limiting to prevent abuse.
- **Structured logging & monitoring**: Use a logging service (Datadog, CloudWatch) with structured logs, dashboards, and alerting on error rates and latency.
- **Streaming responses**: Stream LLM responses token-by-token for a more responsive feel instead of waiting for the full response.
- **Multi-language support**: Detect and respond in the guest's preferred language.
- **Booking completion**: Allow the assistant to complete bookings end-to-end, not just check availability.
- **Human handoff**: Implement an escalation path where the assistant can transfer the conversation to a live agent when it can't help.
- **A/B testing**: Test different system prompts, UI layouts, and response formats to optimise engagement and resolution rates.
