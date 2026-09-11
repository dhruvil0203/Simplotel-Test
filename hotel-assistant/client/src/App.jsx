import React from 'react';
import ChatWindow from './components/ChatWindow';

export default function App() {
  return (
    <div className="h-screen flex flex-col bg-gray-100 font-sans text-gray-900">
      <div className="flex-1 flex flex-col max-w-2xl w-full mx-auto bg-white shadow-sm sm:border-x sm:border-gray-200 overflow-hidden">
        <header className="flex-shrink-0 border-b border-gray-200 bg-white">
          <div className="px-4 sm:px-6 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gray-900 text-white flex items-center justify-center font-semibold text-sm">
                GH
              </div>
              <div>
                <h1 className="font-heading font-semibold text-base sm:text-lg text-gray-900 leading-tight">
                  Grand Horizon Hotel
                </h1>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-green-500"></span>
                  <span className="text-xs text-gray-500 font-medium">Guest Assistant • Online</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <a
                href="tel:+15559876543"
                className="text-xs font-medium text-gray-600 hover:text-gray-900 px-3 py-1.5 rounded-md border border-gray-200 hover:border-gray-300 transition-colors"
              >
                +1 (555) 987-6543
              </a>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-hidden w-full">
          <ChatWindow />
        </main>
      </div>
    </div>
  );
}
