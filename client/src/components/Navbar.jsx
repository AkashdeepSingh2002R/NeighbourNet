import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Navbar({ onLogout }) {
  const navigate = useNavigate();

  const handleLogoutClick = () => {
    onLogout();           // clear user from localStorage and state
    navigate('/welcome'); // redirect to login screen
  };

  return (
    <nav className="bg-green-100 px-6 py-3 shadow-md flex justify-between items-center">
      <div className="text-xl font-bold text-green-900">NeighbourNet</div>
      <div className="space-x-4">
        <a href="/home" className="text-green-800 hover:underline">Home</a>
        <a href="/communities" className="text-green-800 hover:underline">Communities</a>
        <a href="/weather" className="text-green-800 hover:underline">Weather</a>
        <a href="/rentals" className="text-green-800 hover:underline">Rentals</a>
        <button
          onClick={handleLogoutClick}
          className="ml-4 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
        >
          Logout
        </button>
      </div>
    </nav>
  );
}
