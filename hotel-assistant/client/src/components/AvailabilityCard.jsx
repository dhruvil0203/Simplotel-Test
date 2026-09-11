import React from 'react';

export default function AvailabilityCard({ rooms, checkIn, checkOut, nights }) {
  if (!rooms || rooms.length === 0) return null;

  return (
    <div className="mt-3 space-y-2.5">
      {rooms.map((room) => (
        <div
          key={room.type}
          className={`rounded-lg border p-3.5 sm:p-4 transition-colors ${
            room.available
              ? 'border-gray-200 bg-white'
              : 'border-gray-200 bg-gray-50 opacity-60'
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <h4 className="font-heading font-semibold text-gray-900 text-sm sm:text-base">
                {room.type}
              </h4>
              <p className="text-xs text-gray-500 mt-0.5">
                {room.description}
              </p>
            </div>
            <span
              className={`flex-shrink-0 text-xs font-medium px-2 py-0.5 rounded ${
                room.available
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {room.available ? 'Available' : 'Unavailable'}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 my-2 text-xs text-gray-600">
            <span>{room.bedType}</span>
            <span>•</span>
            <span>Up to {room.maxAdults} guests</span>
            <span>•</span>
            <span>{room.size}</span>
          </div>

          {room.available && (
            <div className="mt-2.5 pt-2.5 border-t border-gray-100 flex items-center justify-between">
              <div>
                <span className="text-xs text-gray-500">
                  ${room.pricePerNight}/night • {nights || 1} night{(nights || 1) > 1 ? 's' : ''}
                </span>
                <span className="font-semibold text-gray-900 text-base ml-2">
                  ${room.totalPrice || room.pricePerNight * (nights || 1)}
                </span>
              </div>

              <a
                href="tel:+15559876543"
                className="px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition-colors"
              >
                Book Room
              </a>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
