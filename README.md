# Grand Horizon Hotel — AI Guest Assistant

A production-grade, full-stack AI-powered virtual concierge for **The Grand Horizon Hotel**. Built with a modern **React (Vite + Tailwind CSS)** frontend and an **Express (Node.js)** backend, featuring rule-grounded Retrieval-Augmented Generation (RAG) and deterministic room availability logic with optional **Google Gemini LLM** integration.

---

## Table of Contents

- [Overview & Scenario](#overview--scenario)
- [Key Features](#key-features)
- [System Architecture](#system-architecture)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation & Setup](#installation--setup)
  - [Running the Application](#running-the-application)
- [Execution Modes: Offline vs. Gemini LLM](#execution-modes-offline-vs-gemini-llm)
- [API Reference & cURL Examples](#api-reference--curl-examples)
- [Automated Testing & Evaluation](#automated-testing--evaluation)
- [Product, UX & Engineering Decisions](#product-ux--engineering-decisions)
- [Production Roadmap](#production-roadmap)
- [AI Tools Disclosure](#ai-tools-disclosure)

---

## Overview & Scenario

Hotel guests frequently have questions around the clock regarding check-in/check-out policies, amenities (pool, gym, spa), dining options, parking, cancellation rules, and room availability. Traditionally, answering these requires calling the front desk or navigating dense website menus.

This application provides an instant, natural conversational interface that:
1. **Answers property, amenity, policy, and FAQ queries** grounded strictly in the hotel knowledge base (`hotel.json`) without hallucinations.
2. **Evaluates room availability deterministically**, calculating multi-night pricing and guest capacity without leaving critical booking math to an LLM.
3. **Dynamically requests missing booking details** via inline UI date/guest selectors when inquiries lack required parameters.
4. **Maintains conversation history and context**, allowing natural follow-up questions.
5. **Operates in both offline mode and live Gemini LLM mode**.

---

## Key Features

- **Grounded Conversational RAG**: Strictly scoped answering engine. When data is unavailable, the assistant provides polite front desk contact info rather than fabricating answers.
- **Deterministic Availability Engine**: Date parsing with `chrono-node`, multi-room inventory filtering, guest capacity checks, and accurate multi-night pricing calculations.
- **Smart Inline Availability Form**: When a user asks to book without providing dates or guest counts, an inline interactive form collects only the missing parameters with automatic check-out validation.
- **Structured Availability Cards**: Displays available rooms with bed type, capacity, room dimensions, nightly rates, total price, and direct booking actions.
- **Persistent Input Focus & UX Ergonomics**: Auto-focus is preserved throughout message submission, async loading, and form interactions so guests never lose cursor focus.
- **Graceful Error Recovery**: Non-blocking error bubbles with one-click retry for resilient communication over unreliable networks.
- **Clean, Modern, Human-Centric UI**: Designed with **Inter** and **Manrope** typography, neutral color palettes, smooth message transitions, and responsive mobile-first layouts.

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       BROWSER (React + Vite + Tailwind)                     │
│                                                                             │
│  ChatWindow.jsx ──► chatApi.js ──► HTTP POST /api/chat ──────────────────┐  │
│        ▲                                                                 │  │
│        │◄── JSON Response { reply, type, data } ◄────────────────────────┘  │
│        │                                                                    │
│  MessageBubble.jsx | AvailabilityCard.jsx | AvailabilityForm.jsx            │
└─────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         NODE.JS / EXPRESS BACKEND                           │
│                                                                             │
│  POST /api/chat                                                             │
│       │                                                                     │
│  validateChatRequest ──► intentClassifier.js                                │
│                               │                                             │
│                ┌──────────────┴──────────────┐                              │
│                ▼                             ▼                              │
│        AVAILABILITY Intent               FAQ / GREETING Intent              │
│                │                             │                              │
│                ▼                             ▼                              │
│       availabilityService.js            faqService.js                       │
│       ├─ extractBookingDetails          ├─ Keyword-Overlap Context RAG      │
│       ├─ getMissingFields               └─► llmClient.js                    │
│       └─ checkAvailability                       │                          │
│          (100% Deterministic)           ┌────────┴────────┐                 │
│                                         ▼                 ▼                 │
│                                   USE_LLM=true      USE_LLM=false           │
│                                   Gemini API        templateResponder.js    │
│                                                     (Deterministic Grounded)│
│                                                                             │
│  errorHandler.js ── Catches all unhandled exceptions (No 500 crashes)       │
│  logger.js ──────── Structured JSON-line logging with ISO timestamps        │
└─────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                               DATA LAYER                                    │
│  server/data/hotel.json (Single source of truth for hotel knowledge & rooms)│
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite, Tailwind CSS, Google Fonts (Inter & Manrope) |
| **Backend** | Node.js, Express, CORS, Body-Parser |
| **NLP & Utilities** | `chrono-node` (natural language date parsing), Custom Token Overlap RAG |
| **AI / LLM** | Google Gemini API (`@google/generative-ai`, `gemini-2.0-flash`) |
| **Testing** | Jest, Supertest (34 automated unit & integration tests) |

---

## Getting Started

### Prerequisites

- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher

### Installation & Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/hotel-assistant.git
   cd hotel-assistant
   ```

2. **Install server dependencies**:
   ```bash
   cd server
   npm install
   ```

3. **Install client dependencies**:
   ```bash
   cd ../client
   npm install
   ```

4. **Set up environment variables**:
   ```bash
   # In server/
   cp .env.example .env

   # In client/
   cp .env.example .env
   ```

### Running the Application

1. **Start the Backend Server** (Port 5000):
   ```bash
   cd server
   npm run dev
   # Server runs at http://localhost:5000
   ```

2. **Start the Frontend Development Server** (Port 5173):
   ```bash
   cd client
   npm run dev
   # Client runs at http://localhost:5173
   ```

3. Open your browser and navigate to `http://localhost:5173`.

---

## Execution Modes: Offline vs. Gemini LLM

### 1. Offline Deterministic Mode (Default)
By default, the server runs completely offline with `USE_LLM=false`. It uses a deterministic template engine grounded in `hotel.json`. **No external API key or internet access is required.**

### 2. Live Google Gemini LLM Mode
To enable live AI generation using Gemini:
1. Obtain an API key from [Google AI Studio](https://aistudio.google.com/).
2. Edit `server/.env`:
   ```env
   PORT=5000
   USE_LLM=true
   GEMINI_API_KEY=your_actual_gemini_api_key
   ```
3. Restart the backend server. The RAG pipeline will automatically pass retrieved hotel context into `gemini-2.0-flash`.

---

## API Reference & cURL Examples

### Health Check
```bash
curl -X GET http://localhost:5000/api/health
```

### 1. Ask a Hotel FAQ Question
```bash
curl -X POST http://localhost:5000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What time is check-in and check-out?",
    "conversationId": "demo-1",
    "history": []
  }'
```

### 2. Check Room Availability (Full Details Provided)
```bash
curl -X POST http://localhost:5000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "I want to check room availability from 2026-12-20 to 2026-12-25 for 2 adults",
    "conversationId": "demo-2",
    "history": []
  }'
```

### 3. Check Room Availability (Missing Dates)
```bash
curl -X POST http://localhost:5000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "I want to book a room for 2 adults",
    "conversationId": "demo-3",
    "history": []
  }'
```
*Response will contain `type: "availability_needs_info"` and `data.missingFields: ["checkInDate", "checkOutDate"]` triggering the frontend inline date picker.*

### 4. Conversational Follow-Up with History
```bash
curl -X POST http://localhost:5000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Is it heated and what are the hours?",
    "conversationId": "demo-4",
    "history": [
      { "role": "user", "content": "Do you have a swimming pool?" },
      { "role": "assistant", "content": "Yes, our rooftop infinity pool is located on the 25th floor." }
    ]
  }'
```

---

## Automated Testing & Evaluation

The backend includes a comprehensive automated test suite covering all required evaluation scenarios.

### Running Tests

```bash
cd server
npm test
```

### Test Coverage Breakdown (34 / 34 Passing)

| Test Suite | Tests | Scenarios Covered |
|---|---|---|
| `tests/chat.test.js` | 11 | FAQ responses, amenity queries, room recommendations, full availability, partial availability, ambiguous questions, out-of-scope redirection, follow-up history passing, simulated LLM failure fallbacks, and body validation. |
| `tests/availabilityService.test.js` | 9 | Natural language date extraction (`chrono-node`), range parsing, guest extraction, valid date availability calculation, invalid date ordering, high guest count room filtering. |
| `tests/intentClassifier.test.js` | 14 | Keyword matching, compound sentences, guest introductions, origin greetings, out-of-scope request isolation. |

---

## Product, UX & Engineering Decisions

### 1. What Customer Problem Are We Solving?
Hotel guests need fast, reliable answers 24/7 without waiting on hold with the front desk or digging through dense web pages. This assistant resolves repetitive guest questions instantly and automates availability discovery while allowing hotel staff to focus on high-touch guest interactions.

### 2. Why Keep Availability Checking Deterministic?
Availability and pricing require mathematical and inventory precision. Delegating inventory math to an LLM introduces hallucinated room types, invalid rates, or overbooking. We isolate date calculation and pricing into pure deterministic functions and use AI solely for conversational fluency.

### 3. How Are Hallucinations Prevented?
- The backend RAG pipeline injects verified hotel knowledge into the system prompt.
- The model is strictly instructed to return a safe fallback message with the front desk phone number (`+1 (555) 987-6543`) whenever an answer cannot be verified.
- Out-of-scope questions (e.g. general trivia, third-party taxi bookings) are redirected to the concierge.

### 4. What Happens When Dependencies Fail?
- **LLM Timeout or Failure**: Caught gracefully; returns HTTP 200 with `type: "fallback"` so the guest always receives a polite message instead of a crash.
- **Frontend Network Error**: The UI catches fetch errors, renders an inline alert, and provides an instant **Retry** button.
- **Backend Unhandled Exception**: Handled by centralized error middleware logging structured JSON diagnostics.

---

## Production Roadmap

Before deploying to live hotel operations, the following upgrades are recommended:
1. **PMS / CRS Integration**: Connect to live Property Management Systems (Opera, Cloudbeds, Mews) for real-time inventory and direct reservation creation.
2. **Vector Database RAG**: Upgrade keyword-overlap scoring to dense vector embeddings with Pinecone/pgvector for deeper semantic search.
3. **Response Streaming**: Enable server-sent events (SSE) for token-by-token streaming responses.
4. **Live Human Escalation**: Implement WebSocket-based live agent takeover when a guest requests human assistance.
5. **Rate Limiting & Authentication**: Add Redis-backed token-bucket rate limiting and guest session authentication.

---

## AI Tools Disclosure

In accordance with assignment guidelines:
- **Antigravity AI / Google Gemini**: Utilized during development for architecture structuring, conversational RAG prompt engineering, edge-case analysis, and unit test suite design.
- **Google Gemini API (`gemini-2.0-flash`)**: Integrated as the backend LLM engine for natural-language FAQ response generation.

---

## License

This project is submitted as part of the technical assessment. All rights reserved.
