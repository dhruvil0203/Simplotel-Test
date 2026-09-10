import React from 'react';

function formatTime(timestamp) {
  if (!timestamp) {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  const date = new Date(timestamp);
  return isNaN(date.getTime())
    ? ''
    : date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function MessageBubble({ role, content, timestamp, children }) {
  const isUser = role === 'user';
  const timeString = formatTime(timestamp);

  return (
    <div
      className={`flex items-start gap-2.5 px-4 py-2 ${
        isUser ? 'flex-row-reverse' : 'flex-row'
      }`}
    >
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${
          isUser
            ? 'bg-blue-600 text-white'
            : 'bg-gray-900 text-white'
        }`}
      >
        {isUser ? 'You' : 'GH'}
      </div>

      <div className={`flex flex-col max-w-[85%] sm:max-w-[75%] ${isUser ? 'items-end' : 'items-start'}`}>
        <div
          className={`rounded-2xl px-4 py-2.5 text-sm sm:text-[15px] leading-relaxed ${
            isUser
              ? 'bg-blue-600 text-white rounded-tr-sm'
              : 'bg-gray-100 text-gray-900 rounded-tl-sm'
          }`}
        >
          {content && (
            <p className="whitespace-pre-wrap break-words">{content}</p>
          )}

          {children && <div className="mt-2">{children}</div>}
        </div>

        <span className="text-[11px] text-gray-400 mt-1 px-1">
          {timeString}
        </span>
      </div>
    </div>
  );
}
