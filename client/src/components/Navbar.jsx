import React from 'react';
import { useNavigate, NavLink } from 'react-router-dom';

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
        <NavLink to="/home" className="text-green-800 hover:underline">Home</NavLink>
        <NavLink to="/communities" className="text-green-800 hover:underline">Communities</NavLink>
        <NavLink to="/weather" className="text-green-800 hover:underline">Weather</NavLink>
        <NavLink to="/rentals" className="text-green-800 hover:underline">Rentals</NavLink>
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
