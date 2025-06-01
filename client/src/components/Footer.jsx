import React from 'react';

export default function Footer() {
  return (
    <footer className="bg-green-800 text-white py-6 px-4 text-center mt-12">
      <p className="text-sm font-light">
        Made with ❤️ by NeighbourNet Team — Ontario, Canada © {new Date().getFullYear()}
      </p>
    </footer>
  );
}
