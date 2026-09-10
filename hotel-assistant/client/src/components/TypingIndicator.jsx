import React from 'react';

export default function TypingIndicator() {
  return (
    <div className="flex items-start gap-2.5 px-4 py-2">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center text-xs font-semibold">
        GH
      </div>

      <div className="bg-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5">
        <span
          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce-dot"
          style={{ animationDelay: '0s' }}
        />
        <span
          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce-dot"
          style={{ animationDelay: '0.16s' }}
        />
        <span
          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce-dot"
          style={{ animationDelay: '0.32s' }}
        />
      </div>
    </div>
  );
}
