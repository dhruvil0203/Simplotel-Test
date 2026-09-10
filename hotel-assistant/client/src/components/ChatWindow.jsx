import React, { useState, useRef, useEffect, useCallback } from 'react';
import { sendMessage } from '../api/chatApi';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';
import AvailabilityCard from './AvailabilityCard';
import AvailabilityForm from './AvailabilityForm';

const QUICK_SUGGESTIONS = [
  { label: 'Check availability', query: 'I want to check room availability for 2 adults' },
  { label: 'Pool & gym hours', query: 'What are the pool and gym hours?' },
  { label: 'Restaurant & breakfast', query: 'What dining and breakfast options do you have?' },
  { label: 'Check-in & cancellation', query: 'What are the check-in and cancellation policies?' },
  { label: 'Airport shuttle', query: 'Do you have an airport shuttle service?' },
  { label: 'Parking & address', query: 'Where is the hotel located and how much is parking?' },
];

const WELCOME_MESSAGE = {
  id: 'welcome',
  role: 'assistant',
  content:
    'Hello! Welcome to Grand Horizon Hotel. How can I assist you with your stay today?',
  type: 'faq',
  timestamp: Date.now(),
  data: {},
};

export default function ChatWindow() {
  const [messages, setMessages] = useState([WELCOME_MESSAGE]);
  const [history, setHistory] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastFailedMessage, setLastFailedMessage] = useState(null);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [loading, messages]);

  const handleSend = useCallback(
    async (messageText) => {
      const text = (messageText || input).trim();
      if (!text || loading) return;

      setInput('');
      setError(null);
      setLastFailedMessage(null);

      inputRef.current?.focus();

      const userMsg = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: text,
        type: 'user',
        timestamp: Date.now(),
        data: {},
      };
      setMessages((prev) => [...prev, userMsg]);
      setLoading(true);

      try {
        const response = await sendMessage(text, history);

        const assistantMsg = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: response.reply,
          type: response.type,
          timestamp: Date.now(),
          data: response.data || {},
        };
        setMessages((prev) => [...prev, assistantMsg]);

        setHistory((prev) => [
          ...prev,
          { role: 'user', content: text },
          { role: 'assistant', content: response.reply },
        ]);
      } catch (err) {
        setError(err.message || 'Failed to send message. Please try again.');
        setLastFailedMessage(text);

        const errorMsg = {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: 'Something went wrong. Please try again or contact our front desk.',
          type: 'error',
          timestamp: Date.now(),
          data: {},
        };
        setMessages((prev) => [...prev, errorMsg]);
      } finally {
        setLoading(false);
        setTimeout(() => {
          inputRef.current?.focus();
        }, 0);
      }
    },
    [input, loading, history]
  );

  const handleRetry = useCallback(() => {
    if (lastFailedMessage) {
      setMessages((prev) => prev.filter((m) => m.type !== 'error' || m.id !== prev[prev.length - 1]?.id));
      handleSend(lastFailedMessage);
    }
  }, [lastFailedMessage, handleSend]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleAvailabilityFormSubmit = (formMessage) => {
    handleSend(formMessage);
  };

  const handleResetChat = () => {
    setMessages([
      {
        ...WELCOME_MESSAGE,
        id: `welcome-${Date.now()}`,
        timestamp: Date.now(),
      },
    ]);
    setHistory([]);
    setInput('');
    setError(null);
    setLastFailedMessage(null);
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="flex-1 overflow-y-auto py-4 space-y-1">
        {messages.map((msg) => (
          <div key={msg.id}>
            <MessageBubble role={msg.role} content={msg.content} timestamp={msg.timestamp}>
              {msg.type === 'availability_result' && msg.data?.rooms && (
                <AvailabilityCard
                  rooms={msg.data.rooms}
                  checkIn={msg.data.checkIn}
                  checkOut={msg.data.checkOut}
                  nights={msg.data.nights}
                />
              )}

              {msg.type === 'availability_needs_info' && msg.data?.missingFields && (
                <AvailabilityForm
                  missingFields={msg.data.missingFields}
                  initialDetails={msg.data.details}
                  onSubmit={handleAvailabilityFormSubmit}
                />
              )}

              {msg.type === 'error' && lastFailedMessage && (
                <button
                  onClick={handleRetry}
                  className="mt-2 px-3 py-1 rounded bg-red-50 text-red-700 text-xs font-medium hover:bg-red-100 transition-colors"
                >
                  Retry message
                </button>
              )}
            </MessageBubble>
          </div>
        ))}

        {loading && <TypingIndicator />}

        <div ref={messagesEndRef} />
      </div>

      <div className="flex-shrink-0 px-4 py-2 border-t border-gray-100 bg-white">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {QUICK_SUGGESTIONS.map((s, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSend(s.query)}
              disabled={loading}
              className="flex-shrink-0 px-3 py-1 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium transition-colors disabled:opacity-50 cursor-pointer"
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="border-t border-gray-200 bg-white px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <input
              ref={inputRef}
              id="chat-input"
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a question..."
              autoFocus
              className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
            {input && (
              <button
                type="button"
                onClick={() => {
                  setInput('');
                  inputRef.current?.focus();
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
              >
                ✕
              </button>
            )}
          </div>

          <button
            id="send-button"
            onClick={() => handleSend()}
            disabled={loading || !input.trim()}
            className="flex-shrink-0 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            aria-label="Send message"
          >
            Send
          </button>
        </div>

        <div className="flex items-center justify-between mt-2 text-[11px] text-gray-400">
          <span>742 Sunset Blvd, Metropolis</span>
          <button
            onClick={handleResetChat}
            className="hover:text-gray-600 underline transition-colors cursor-pointer"
          >
            Restart Chat
          </button>
        </div>
      </div>
    </div>
  );
}
