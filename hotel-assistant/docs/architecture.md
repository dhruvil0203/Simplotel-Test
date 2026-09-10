# System Architecture & Workflows

This document outlines the complete architectural design, component separation, data flow, and sequence workflows for **The Grand Horizon Hotel AI Guest Assistant**.

---

## 1. Architectural Overview & Layering

The system is designed with a **layered, decoupled architecture** separating presentation, API routing, business logic, RAG retrieval, and AI orchestration.

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                     PRESENTATION LAYER (React)                                   │
│  App.jsx                                                                                         │
│  ├── Header (Branding, Status, Direct Phone Link)                                                │
│  └── ChatWindow.jsx (State orchestration, Auto-focus, Suggestions)                               │
│       ├── MessageBubble.jsx (User & Assistant bubbles, Timestamps)                               │
│       ├── TypingIndicator.jsx (Smooth bounce animation)                                          │
│       ├── AvailabilityCard.jsx (Structured room results, pricing, booking trigger)              │
│       └── AvailabilityForm.jsx (Dynamic missing-parameter collection)                            │
└──────────────────────────────────────────────────────────────────────────────────────────────────┘
                                                │
                                                ▼ HTTP / REST (chatApi.js)
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                   API & GATEWAY LAYER (Express)                                  │
│  server.js ──► app.js                                                                            │
│  ├── CORS Filter (Whitelist allowed origins)                                                     │
│  ├── JSON Body Parser                                                                            │
│  ├── Request Logger (Structured JSON with timestamps)                                            │
│  └── validateChatRequest.js (Body sanity, trimming, string safety)                                │
└──────────────────────────────────────────────────────────────────────────────────────────────────┘
                                                │
                                                ▼
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                              NLP & INTENT CLASSIFICATION LAYER                                   │
│  intentClassifier.js                                                                             │
│  ├── Rule-based pattern matching (Regex + Contextual Token Analysis)                             │
│  ├── Name & Origin extraction (Sanitized stop-word filtering)                                    │
│  └── Classifies: GREETING | INTRODUCTION | AVAILABILITY | FAQ                                    │
└──────────────────────────────────────────────────────────────────────────────────────────────────┘
                                                │
                   ┌────────────────────────────┴────────────────────────────┐
                   ▼                                                         ▼
┌──────────────────────────────────────┐  ┌────────────────────────────────────────────────────────┐
│     DETERMINISTIC DOMAIN SERVICE     │  │                CONVERSATIONAL RAG & AI                 │
│  availabilityService.js              │  │  faqService.js                                         │
│  ├── chrono-node Natural Date Parser │  │  ├── Token Overlap Context Retrieval                   │
│  ├── Multi-night calculations        │  │  ├── System Prompt Guardrails (Zero Hallucinations)    │
│  ├── Guest capacity verification     │  │  └── llmClient.js                                      │
│  └── Static Inventory Query          │  │       ├── USE_LLM=true  ──► Google Gemini API          │
│                                      │  │       └── USE_LLM=false ──► templateResponder.js      │
└──────────────────────────────────────┘  └────────────────────────────────────────────────────────┘
                   │                                                         │
                   └────────────────────────────┬────────────────────────────┘
                                                ▼
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                          DATA LAYER                                              │
│  server/data/hotel.json                                                                          │
│  ├── Hotel Metadata (Name, Address, Phone, Star Rating)                                          │
│  ├── Policies (Check-in, Check-out, Early/Late, Cancellation, Pet, Smoking)                      │
│  ├── Amenities (Pool, Gym, Spa, Dining, WiFi, Parking, Business Center, Shuttle)                 │
│  ├── Room Catalog (Inventory, Max Adults/Children, Dimensions, Pricing)                          │
│  └── FAQ Knowledge Base                                                                          │
└──────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Sequence Workflows

### Workflow A: General Hotel FAQ Query (RAG Flow)
```mermaid
sequenceDiagram
    autonumber
    actor Guest
    participant UI as ChatWindow (React)
    participant API as Express Router (/api/chat)
    participant Intent as intentClassifier
    participant FAQ as faqService
    participant LLM as llmClient / Gemini
    participant Data as hotel.json

    Guest->>UI: Types "What time is check-out?"
    UI->>API: POST /api/chat { message, history }
    API->>Intent: classifyIntent(message)
    Intent-->>API: returns "FAQ"
    API->>FAQ: handleFaqQuestion(message, history)
    FAQ->>Data: retrieveContext(message)
    Data-->>FAQ: Returns relevant policy & hours context
    FAQ->>LLM: generateAnswer(context, question, history)
    LLM-->>FAQ: Formulates accurate, grounded answer
    FAQ-->>API: { reply: "Check-out is at 11:00 AM...", type: "faq" }
    API-->>UI: 200 OK JSON Response
    UI->>Guest: Renders MessageBubble with answer
```

---

### Workflow B: Availability Request with Missing Parameters
```mermaid
sequenceDiagram
    autonumber
    actor Guest
    participant UI as ChatWindow (React)
    participant API as Express Router (/api/chat)
    participant Intent as intentClassifier
    participant Avail as availabilityService
    participant Form as AvailabilityForm (React)

    Guest->>UI: Types "I want to check room availability for 2 adults"
    UI->>API: POST /api/chat { message, history }
    API->>Intent: classifyIntent(message)
    Intent-->>API: returns "AVAILABILITY"
    API->>Avail: extractBookingDetails(message)
    Avail-->>API: { checkIn: null, checkOut: null, adults: 2 }
    API->>Avail: getMissingFields(details)
    Avail-->>API: ["checkInDate", "checkOutDate"]
    API-->>UI: 200 OK { type: "availability_needs_info", data: { missingFields, details } }
    UI->>Form: Mounts inline date pickers with validation
    Guest->>Form: Selects Check-In & Check-Out dates -> Submits
    Form->>UI: Dispatches follow-up availability message
    UI->>API: POST /api/chat { message: "I'd like to check availability from 2026-12-20 to 2026-12-25 for 2 adults" }
```

---

### Workflow C: Full Availability Calculation & Card Presentation
```mermaid
sequenceDiagram
    autonumber
    actor Guest
    participant UI as ChatWindow (React)
    participant API as Express Router (/api/chat)
    participant Intent as intentClassifier
    participant Avail as availabilityService
    participant Data as hotel.json
    participant Card as AvailabilityCard (React)

    UI->>API: POST /api/chat { message: "Check availability 2026-12-20 to 2026-12-25 for 2 adults" }
    API->>Intent: classifyIntent(message)
    Intent-->>API: returns "AVAILABILITY"
    API->>Avail: extractBookingDetails(message)
    Avail-->>API: { checkIn: "2026-12-20", checkOut: "2026-12-25", adults: 2 }
    API->>Avail: checkAvailability(checkIn, checkOut, adults)
    Avail->>Data: Filters room catalog by capacity & calculates total price (5 nights)
    Data-->>Avail: Room list with availability flags & pricing
    Avail-->>API: { valid: true, rooms: [...] }
    API-->>UI: 200 OK { type: "availability_result", data: { rooms, nights: 5 } }
    UI->>Card: Renders room cards with specs, pricing, and "Book Room" call action
```

---

### Workflow D: Graceful Error & Fallback Recovery
```mermaid
sequenceDiagram
    autonumber
    actor Guest
    participant UI as ChatWindow (React)
    participant API as Express Router (/api/chat)
    participant LLM as llmClient (Gemini API)
    participant Err as Central Error Handler

    Guest->>UI: Asks out-of-scope or unanswerable query
    UI->>API: POST /api/chat
    alt Network Outage / API Exception
        API-xLLM: Timeout / Rate limit / Error
        API->>Err: Catch error
        Err-->>API: 200 OK { type: "fallback", reply: "I don't have that information. Please contact our front desk at +1 (555) 987-6543." }
        API-->>UI: Graceful response (No 500 crash)
    else Browser Fetch Failure
        UI-xAPI: Network offline / Connection dropped
        UI->>UI: Displays error bubble with "Retry message" button
        Guest->>UI: Clicks "Retry message"
        UI->>API: Re-transmits previous payload
    end
```

---

## 3. Component Responsibilities

| Layer / Component | File | Responsibilities |
|---|---|---|
| **App Shell** | `client/src/App.jsx` | Layout container, responsive header, active status indicator, direct telephone link. |
| **Chat Orchestrator** | `client/src/components/ChatWindow.jsx` | Conversation state, auto-scroll ref, persistent input focus retention, suggestion pills, reset chat action. |
| **Message View** | `client/src/components/MessageBubble.jsx` | Renders user and assistant bubbles, timestamps, avatars, and embeds dynamic child components. |
| **Availability Form** | `client/src/components/AvailabilityForm.jsx` | Dynamic form for missing date/guest fields with dynamic min date and date-range validation. |
| **Availability Cards** | `client/src/components/AvailabilityCard.jsx` | Scannable room cards displaying capacity, size, nightly and total pricing, availability status, and booking trigger. |
| **API Client** | `client/src/api/chatApi.js` | Single point of network communication to `POST /api/chat`. |
| **Server Gateway** | `server/src/app.js` | Express app setup, CORS whitelist, JSON parsing, request logging, and health endpoint. |
| **Chat Route** | `server/src/routes/chat.js` | Controller routing user requests to introduction, greeting, availability, or FAQ handlers. |
| **Intent Classifier** | `server/src/services/intentClassifier.js` | Deterministic intent classification (GREETING, INTRODUCTION, AVAILABILITY, FAQ) and name extraction. |
| **Availability Service** | `server/src/services/availabilityService.js` | Natural language date parsing (`chrono-node`), missing-field detection, and multi-night price calculation. |
| **FAQ & RAG Service** | `server/src/services/faqService.js` | Tokenizes user query, scores knowledge base sections, and builds strictly grounded RAG context. |
| **LLM Gateway** | `server/src/services/llmClient.js` | Dispatches RAG prompt to Google Gemini API or falls back to template responder. |
| **Template Responder** | `server/src/services/templateResponder.js` | Deterministic offline response generator for all hotel queries, timings, amenities, and policies. |
| **Logger** | `server/src/utils/logger.js` | Structured JSON-line logger with ISO timestamps for request and error tracing. |

---

## 4. Key Architectural Decisions

1. **Separation of Deterministic vs. Probabilistic Logic**:
   - **Deterministic**: Room availability checking, date arithmetic, pricing calculations, and body validation.
   - **Probabilistic (LLM)**: Natural language summarization, varied conversational phrasing, and friendly tone generation.
2. **Context-Grounded RAG Guardrails**:
   - System prompts strictly forbid the model from guessing or fabricating details.
   - Ambiguous queries return structured fallback messages containing verified contact channels.
3. **No Direct Frontend-to-LLM Calls**:
   - Prevents exposing API keys or secrets in client bundles.
   - Ensures all user input is sanitized, validated, and logged centrally.
