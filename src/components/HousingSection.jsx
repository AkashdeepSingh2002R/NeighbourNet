import React from 'react';

const listings = [
  {
    id: 1,
    title: 'Private Room in Etobicoke',
    location: 'M9V 1A2',
    price: '$650/mo',
    description: 'Fully furnished, utilities included, walk to transit.',
  },
  {
    id: 2,
    title: 'Basement Apartment in Brampton',
    location: 'L6T 2H2',
    price: '$1100/mo',
    description: 'Separate entrance, 1 bed, 1 bath. Ideal for couples.',
  },
  {
    id: 3,
    title: '1BHK in Scarborough',
    location: 'M1B 3K6',
    price: '$1350/mo',
    description: 'Bright and spacious, near Centennial College.',
  },
];

export default function HousingSection() {
  return (
    <section className="py-12 px-6 bg-gray-100">
      <h2 className="text-2xl md:text-3xl font-bold text-center text-gray-800 mb-6">
        🏠 Find a Home
      </h2>
      <div className="flex flex-wrap justify-center gap-6">
        {listings.map((home) => (
          <div
            key={home.id}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 w-full max-w-sm hover:shadow-lg transition"
          >
            <h3 className="text-lg font-bold text-gray-900">{home.title}</h3>
            <p className="text-sm text-gray-500 mb-2">{home.location}</p>
            <p className="text-green-700 font-semibold mb-2">{home.price}</p>
            <p className="text-sm text-gray-700 mb-4">{home.description}</p>
            <a
              href="#"
              className="text-sm text-blue-600 hover:underline font-medium"
            >
              More info →
            </a>
          </div>
        ))}
      </div>
    </section>
  );
}
