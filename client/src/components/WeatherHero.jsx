import React, { useEffect, useState } from 'react';
import api from '../api/axios'; // ✅ used only for the /users/me fallback

export default function WeatherHero({ onThemeChange }) {
  const [user, setUser] = useState(null);
  const [weather, setWeather] = useState(null);

  const API_KEY = import.meta.env.VITE_WEATHER_API_KEY; // <-- from Netlify env

  useEffect(() => {
    let cancelled = false;

    const boot = async () => {
      // 1) Try localStorage (your original flow)
      let stored = null;
      try {
        stored = JSON.parse(localStorage.getItem('user') || 'null');
      } catch {}

      if (stored?.city) {
        if (!cancelled) {
          setUser(stored);
          fetchWeather(stored.city);
        }
        return;
      }

      // 2) Fallback: ask backend for full profile (adds city/postal if missing)
      try {
        const { data } = await api.get('/users/me');
        if (!cancelled && data) {
          try { localStorage.setItem('user', JSON.stringify(data)); } catch {}
          setUser(data);
          if (data.city) fetchWeather(data.city);
        }
      } catch {
        // silently ignore — component will render nothing (same as your original)
      }
    };

    boot();
    return () => { cancelled = true; };
  }, []); // run once like before

  const fetchWeather = async (city) => {
    if (!city) return;
    try {
      const res = await fetch(
        `https://api.weatherapi.com/v1/current.json?key=${API_KEY}&q=${encodeURIComponent(city)}`
      );
      const data = await res.json();

      if (data && data.current) {
        setWeather(data);
        onThemeChange?.(data.current.condition.text);
      } else {
        console.error('Invalid weather data:', data);
      }
    } catch (error) {
      console.log('Weather fetch failed', error);
    }
  };

  // Keep original behavior: render nothing if we have no user yet
  if (!user) return null;

  return (
    <section className="bg-white/90 shadow rounded-xl p-6 mx-4 my-6 md:mx-12">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#2f4430]">
            Welcome back, {user.name}
          </h1>
          <p className="text-[#4b5e4a] text-sm mt-1">
            Location: {user.city || '—'}, {user.postalCode || '—'}
          </p>
        </div>

        {weather?.current ? (
          <div className="flex items-center gap-4">
            <img src={weather.current.condition.icon} alt="icon" className="w-10 h-10" />
            <div>
              <p className="text-[#3a5942] font-medium">{weather.current.condition.text}</p>
              <p className="text-[#5f705e] text-sm">{weather.current.temp_c}°C</p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-500">Weather data unavailable</p>
        )}
      </div>
    </section>
  );
}
