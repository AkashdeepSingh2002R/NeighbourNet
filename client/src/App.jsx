import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import LandingLogin from './pages/LandingLogin';
import Home from './pages/Home';
import Communities from './pages/Communities';
import WeatherPage from './pages/WeatherPage';
import Rentals from './pages/Rentals';
import RentalDetail from './pages/RentalDetail';

export default function App() {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });

  const handleLogin = (userData) => {
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('user'); // logout only affects session
    setUser(null);
  };

  return (
    <Routes>
      <Route
        path="/"
        element={
          user ? <Navigate to="/home" replace /> : <Navigate to="/welcome" replace />
        }
      />
      <Route path="/welcome" element={<LandingLogin onLogin={handleLogin} />} />
      <Route path="/signup" element={<Navigate to="/welcome" replace />} />
      <Route path="/login" element={<Navigate to="/welcome" replace />} />
      <Route path="/home" element={<Home onLogout={handleLogout} />} />
      <Route path="/communities" element={<Communities />} />
      <Route path="/weather" element={<WeatherPage />} />
      <Route path="/rentals" element={<Rentals />} />
      <Route path="/rentals/:id" element={<RentalDetail />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}
