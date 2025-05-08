import React from 'react';

const tiles = [
  { label: 'Communities', icon: '🏘️', link: '/Communities' },
  { label: 'Weather', icon: '🌤️', link: '/weather' },
  { label: 'Rentals', icon: '🏠', link: '/Rentals' },
  { label: 'Events', icon: '📅', link: '#' },
];

export default function ActionTiles() {
  return (
    <section className="py-10 px-6 bg-green-100 flex flex-wrap justify-center gap-6">
      {tiles.map((tile, index) => (
        <a
          key={index}
          href={tile.link}
          className="bg-white w-40 h-32 rounded-xl shadow-md flex flex-col items-center justify-center text-center hover:scale-105 transition-all"
        >
          <div className="text-3xl mb-2">{tile.icon}</div>
          <div className="text-lg font-semibold text-gray-700">{tile.label}</div>
        </a>
      ))}
    </section>
  );
}
