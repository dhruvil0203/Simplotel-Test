import React, { useState } from 'react';

function getNextDay(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';
  date.setDate(date.getDate() + 1);
  return date.toISOString().split('T')[0];
}

export default function AvailabilityForm({ missingFields, initialDetails = {}, onSubmit }) {
  const today = new Date().toISOString().split('T')[0];
  const defaultCheckIn = initialDetails?.checkIn || today;
  const defaultCheckOut = initialDetails?.checkOut || getNextDay(defaultCheckIn);

  const [checkIn, setCheckIn] = useState(defaultCheckIn);
  const [checkOut, setCheckOut] = useState(defaultCheckOut);
  const [adults, setAdults] = useState(initialDetails?.adults || 2);
  const [error, setError] = useState('');

  const showCheckIn = missingFields.includes('checkInDate');
  const showCheckOut = missingFields.includes('checkOutDate');
  const showAdults = missingFields.includes('numberOfAdults');

  const minCheckOut = checkIn ? getNextDay(checkIn) : getNextDay(today);

  function handleCheckInChange(val) {
    setCheckIn(val);
    setError('');
    if (val && (!checkOut || checkOut <= val)) {
      setCheckOut(getNextDay(val));
    }
  }

  function handleCheckOutChange(val) {
    setCheckOut(val);
    setError('');
  }

  function handleAdultsChange(val) {
    setAdults(val);
    setError('');
  }

  function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (showCheckIn && !checkIn) {
      setError('Please select a check-in date.');
      return;
    }
    if (showCheckOut && !checkOut) {
      setError('Please select a check-out date.');
      return;
    }
    if ((showCheckIn || showCheckOut) && checkIn && checkOut && checkOut <= checkIn) {
      setError('Check-out date must be at least 1 day after the check-in date.');
      return;
    }
    if (showAdults && (!adults || adults < 1)) {
      setError('Please enter at least 1 adult.');
      return;
    }

    const parts = [];
    if (checkIn) parts.push(`from ${checkIn}`);
    if (checkOut) parts.push(`to ${checkOut}`);
    if (adults) parts.push(`for ${adults} adult${adults > 1 ? 's' : ''}`);

    const message = `I'd like to check availability ${parts.join(' ')}`;
    onSubmit(message);
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 p-4 rounded-lg bg-gray-50 border border-gray-200 space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {showCheckIn && (
          <div>
            <label
              htmlFor="availability-checkin"
              className="block text-xs font-medium text-gray-700 mb-1"
            >
              Check-in Date
            </label>
            <input
              id="availability-checkin"
              type="date"
              min={today}
              value={checkIn}
              onChange={(e) => handleCheckInChange(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
            />
          </div>
        )}

        {showCheckOut && (
          <div>
            <label
              htmlFor="availability-checkout"
              className="block text-xs font-medium text-gray-700 mb-1"
            >
              Check-out Date
            </label>
            <input
              id="availability-checkout"
              type="date"
              min={minCheckOut}
              value={checkOut}
              onChange={(e) => handleCheckOutChange(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
            />
          </div>
        )}

        {showAdults && (
          <div>
            <label
              htmlFor="availability-adults"
              className="block text-xs font-medium text-gray-700 mb-1"
            >
              Number of Adults
            </label>
            <input
              id="availability-adults"
              type="number"
              min={1}
              max={10}
              value={adults}
              onChange={(e) => handleAdultsChange(parseInt(e.target.value, 10) || 1)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
            />
          </div>
        )}
      </div>

      {error && (
        <p className="text-xs text-red-600 font-medium">{error}</p>
      )}

      <button
        type="submit"
        className="w-full sm:w-auto px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm transition-colors"
      >
        Check Availability
      </button>
    </form>
  );
}
