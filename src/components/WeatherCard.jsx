import React, { useEffect, useState } from 'react';

export default function WeatherHero({ onThemeChange }) {
  const [user, setUser] = useState(null);
  const [weather, setWeather] = useState(null);

  const API_KEY = 'd2f197eb7d1d4b73aee04612250605'; // Replace with your valid key

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('user'));
    if (stored) {
      setUser(stored);
      fetchWeather(stored.city);
    }
  }, []);

  const fetchWeather = async (city) => {
    try {
      const response = await fetch(
        `https://api.weatherapi.com/v1/current.json?key=${API_KEY}&q=${city}`
      );
      const data = await response.json();
      setWeather(data);
      onThemeChange(data.current.condition.text); // update background
    } catch (err) {
      console.error('Weather fetch error:', err);
    }
  };

  if (!user) return null;

  return (
    <section className="px-6 py-10 text-white bg-black/40">
      <h1 className="text-3xl font-bold">Welcome back, {user.name}</h1>
      <p className="text-sm mt-1">
        Connected to {user.city} — {user.postalCode}
      </p>

      {weather ? (
        <div className="mt-4 flex items-center gap-6">
          <img src={weather.current.condition.icon} alt="icon" />
          <div>
            <p className="text-lg font-semibold">{weather.current.condition.text}</p>
            <p>{weather.current.temp_c}°C</p>
          </div>
        </div>
      ) : (
        <p className="text-sm italic">Loading weather...</p>
      )}
    </section>
  );
}
