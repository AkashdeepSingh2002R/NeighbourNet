import React from 'react';
import { Link } from 'react-router-dom';

const tiles = [
  { label: 'Communities', icon: '🏘️', to: '/communities' },
  { label: 'Weather',     icon: '🌤️', to: '/weather' },
  { label: 'Rentals',     icon: '🏠', to: '/rentals' },
  { label: 'Events',      icon: '📅', to: '/events' }, // change if you don't have this route yet
];

export default function ActionTiles() {
  return (
    <section className="py-10 px-6 bg-green-100 flex flex-wrap justify-center gap-6">
      {tiles.map(({ label, icon, to }) => (
        <Link
          key={label}
          to={to}
          className="bg-white w-40 h-32 rounded-xl shadow-md flex flex-col items-center justify-center text-center hover:scale-105 transition-all focus:outline-none focus:ring-2 focus:ring-green-400"
          aria-label={label}
        >
          <div className="text-3xl mb-2">{icon}</div>
          <div className="text-lg font-semibold text-gray-700">{label}</div>
        </Link>
      ))}
    </section>
  );
}
