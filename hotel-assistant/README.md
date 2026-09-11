# Grand Horizon Hotel — AI Guest Assistant & Virtual Concierge

[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![React Version](https://img.shields.io/badge/react-18.x-blue.svg)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/vite-5.x-purple.svg)](https://vitejs.dev/)
[![Express](https://img.shields.io/badge/express-4.x-lightgrey.svg)](https://expressjs.com/)
[![Tailwind CSS](https://img.shields.io/badge/tailwindcss-3.x-38B2AC.svg)](https://tailwindcss.com/)
[![Tests](https://img.shields.io/badge/tests-54%20passing-success.svg)](https://jestjs.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A modern, production-ready full-stack AI virtual concierge designed for the hospitality industry. Built with **React 18**, **Vite**, **Tailwind CSS**, and an **Express (Node.js)** backend, featuring rule-grounded Retrieval-Augmented Generation (RAG), deterministic room availability and multi-night pricing engine, dynamic missing-parameter acquisition forms, and optional **Google Gemini LLM** acceleration.

---

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [System Architecture](#system-architecture)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Quick Start](#quick-start)
  - [Environment Configuration](#environment-configuration)
- [Execution Modes](#execution-modes)
  - [1. Offline Deterministic Mode (Default)](#1-offline-deterministic-mode-default)
  - [2. Live Gemini LLM Mode](#2-live-gemini-llm-mode)
- [API Reference & cURL Examples](#api-reference--curl-examples)
- [Automated Testing & Quality Assurance](#automated-testing--quality-assurance)
- [Engineering & Architecture Principles](#engineering--architecture-principles)
- [Production Roadmap](#production-roadmap)
- [Documentation & Deep Dives](#documentation--deep-dives)
- [License](#license)

---

## Overview

Hotel guests require instant, 24/7 answers regarding property policies (check-in/check-out, pets, smoking), amenities (pool, fitness center, spa, dining), parking, and room availability without waiting on hold with front desk staff or navigating multi-layered website menus.

This application provides an instant, natural conversational interface that:
1. **Answers property, amenity, policy, and FAQ queries** grounded strictly in the hotel knowledge base (`hotel.json`) with zero hallucination.
2. **Evaluates room availability deterministically**, calculating multi-night pricing, stay duration, and guest capacity constraints with mathematical precision.
3. **Dynamically requests missing booking details** via inline UI date/guest selectors when inquiries lack required parameters.
4. **Maintains conversation history and context**, allowing natural follow-up questions (e.g. reusing previously provided dates when changing guest count).
5. **Operates resiliently in both offline mode and live Gemini LLM mode**.

---

## Key Features

- **Grounded Conversational RAG**: Strictly scoped answering engine. When data is unavailable, the assistant provides verified front desk contact info rather than fabricating answers.
- **Deterministic Availability Engine**: Date parsing with `chrono-node`, multi-room inventory filtering, guest capacity checks, and accurate multi-night pricing calculations. Validates dates and computes total stay costs deterministically.
- **Smart Inline Availability Form**: When a user asks to book without providing dates or guest counts, an inline interactive form collects only the missing parameters with automatic check-out date validation.
- **Conversation Context Memory**: Follow-up availability questions reuse previously provided check-in/check-out dates and guest count from conversation history, eliminating repetitive data entry.
- **Structured Availability Cards**: Displays available rooms with bed types, guest capacity, room dimensions, nightly rates, total price, and direct reservation triggers.
- **Persistent Input Focus & UX Ergonomics**: Input auto-focus is preserved throughout message submission, async loading, and form interactions.
- **Graceful Error Recovery**: Non-blocking error bubbles with one-click retry for resilient communication over unstable networks.
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
│       ├─ extractPreviousContext         └─► llmClient.js                    │
│       ├─ getMissingFields                       │                          │
│       └─ checkAvailability             ┌────────┴────────┐                 │
│          (100% Deterministic)          ▼                 ▼                 │
│                                   USE_LLM=true      USE_LLM=false          │
│                                   Gemini API        templateResponder.js   │
│                                                     (Deterministic Grounded)│
│                                                                             │
│  errorHandler.js ── Centralized unhandled exception handler                 │
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
| **Testing** | Jest, Supertest (54 automated unit, integration & e2e tests) |

---

## Getting Started

### Prerequisites

- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher

### Quick Start

1. **Backend Setup**:
   ```bash
   cd server
   npm install
   npm run dev
   # Runs at http://localhost:5000
   ```

2. **Frontend Setup**:
   ```bash
   cd ../client
   npm install
   npm run dev
   # Runs at http://localhost:5173
   ```

3. **Running Backend Tests**:
   ```bash
   cd ../server
   npm test
   ```

---

### Environment Configuration

| File | Variable | Default | Description |
|------|----------|---------|-------------|
| `server/.env` | `PORT` | `5000` | Port the Express backend listens on |
| `server/.env` | `USE_LLM` | `false` | Set to `true` to enable live Gemini API calls; `false` for offline deterministic mode |
| `server/.env` | `GEMINI_API_KEY` | *(empty)* | Google Gemini API key (required only when `USE_LLM=true`). |
| `client/.env` | `VITE_API_URL` | `http://localhost:5000` | Backend API base URL for the React frontend |

> **Security Note**: `GEMINI_API_KEY` is strictly accessed server-side in `llmClient.js`. It is never exposed to the frontend bundle, never sent in API responses, and `.env` files are tracked in `.gitignore`. The platform operates out-of-the-box in deterministic offline mode without requiring an external API key.

---

## Execution Modes

### 1. Offline Deterministic Mode (Default)
By default, the server runs completely offline with `USE_LLM=false`. It uses a deterministic template engine grounded in `hotel.json`. **No external API key or internet access is required.**

### 2. Live Gemini LLM Mode
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
    "message": "I want to check room availability from 2026-12-20 to 2026-12-25 for 2 guests",
    "conversationId": "demo-2",
    "history": []
  }'
```

### 3. Check Room Availability (Missing Dates)
```bash
curl -X POST http://localhost:5000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "I want to book a room for 2 guests",
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

### 5. Validation Error (Missing Message)
```bash
curl -X POST http://localhost:5000/api/chat \
  -H "Content-Type: application/json" \
  -d '{ "conversationId": "demo-5", "history": [] }'
```
*Returns HTTP 400 with `{ "type": "error", "reply": "The \"message\" field is required..." }`*

### About `conversationId`

The `conversationId` field is a **client-generated identifier** (typically a UUID) passed along with each request for logging and correlation purposes. The backend is stateless; conversation context is maintained entirely through the `history` array passed by the client containing previous `{ role, content }` turns.

---

## Automated Testing & Quality Assurance

The test suite provides comprehensive test coverage across unit logic, domain services, intent classification, API routing, and full end-to-end multi-turn conversation flows.

### Running Tests

```bash
cd server
npm test
```

### Test Coverage Breakdown

| Test Suite | Tests | Scope & Scenarios Covered |
|---|---|---|
| `tests/chat.test.js` | 17 | FAQ responses, amenity queries, room recommendations, full availability, partial availability, ambiguous questions, out-of-scope redirection, follow-up history passing, simulated LLM failure fallbacks, body validation (missing/empty/too-long message), greeting intent, introduction intent, follow-up availability context reuse, malformed history filtering, API key non-exposure. |
| `tests/availabilityService.test.js` | 13 | Natural language date extraction (`chrono-node`), range parsing, guest extraction, "guests" terminology, single-date parsing, valid date availability calculation, invalid date ordering, high guest count room filtering, total price calculations, missing fields detection. |
| `tests/intentClassifier.test.js` | 19 | Keyword matching, compound sentences, guest introductions, origin greetings, out-of-scope request isolation, non-string input handling, conversational starters. |
| `tests/e2e.test.js` | 5 | Full end-to-end multi-turn conversation flow: greeting → FAQ → availability with missing info → full availability with pricing verification → follow-up context reuse with different guest count. |

---

## Engineering & Architecture Principles

### 1. Deterministic Availability vs. AI LLM
Availability and pricing require absolute numerical and inventory accuracy. Delegating pricing math or room availability logic to an LLM introduces hallucinated room types, invalid rates, and booking conflicts. We isolate date calculations and pricing into deterministic domain services and use AI solely for conversational fluency and contextual understanding.

### 2. Zero-Hallucination Guardrails
- The backend RAG pipeline strictly injects verified hotel knowledge from `hotel.json` into the model prompt.
- The model is instructed to provide verified front desk contact details (`+1 (555) 987-6543`) whenever an answer cannot be verified.
- Out-of-scope questions (e.g., flight reservations, third-party taxi bookings) are redirected to the concierge desk.

### 3. Fault Tolerance & Graceful Degradation
- **LLM Timeout / Failure**: Caught gracefully; returns HTTP 200 with `type: "fallback"` so the guest always receives an answer instead of a 500 error.
- **Frontend Network Error**: The UI catches fetch errors, renders an inline alert, and provides an instant **Retry** button.
- **Backend Unhandled Exception**: Handled by centralized error middleware logging structured JSON diagnostics.

---

## Production Roadmap

- [ ] **PMS / CRS Integration**: Direct connectors for Opera, Cloudbeds, and Mews for live room inventory synchronization and instant booking confirmation.
- [ ] **Vector Database RAG**: Upgrade keyword-overlap scoring to dense vector embeddings with Pinecone/pgvector for advanced semantic search.
- [ ] **Response Streaming**: Enable Server-Sent Events (SSE) for token-by-token streaming responses.
- [ ] **Live Concierge Handoff**: WebSocket-based live agent takeover when a guest requests human assistance.
- [ ] **Rate Limiting & Authentication**: Redis-backed token-bucket rate limiting and guest session authentication.

---

## Documentation & Deep Dives

For further architectural and UX documentation, see the [`docs/`](docs/) directory:
- [System Architecture & Workflows](docs/architecture.md)
- [Product, UX & Technical Design Notes](docs/product-and-ux-notes.md)
- [Test Suite Specifications & Verification Matrix](docs/evaluation-scenarios.md)

---

## License

This project is licensed under the [MIT License](LICENSE).
