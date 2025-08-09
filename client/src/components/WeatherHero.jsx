// client/src/components/WeatherHero.jsx
import React, { useEffect, useState } from 'react';

export default function WeatherHero({ onThemeChange }) {
  const [user, setUser] = useState(null);
  const [weather, setWeather] = useState(null);
  const [error, setError] = useState('');

  const API_KEY = import.meta.env.VITE_WEATHER_API_KEY; // <-- from Netlify env

  useEffect(() => {
    const boot = async () => {
      try {
        const stored = JSON.parse(localStorage.getItem('user'));
        setUser(stored || null);

        // pick a city: local user -> their city -> fallback
        const city =
          (stored && (stored.city || stored?.profile?.city)) ||
          'Toronto'; // safe fallback so hero never looks broken

        if (!API_KEY) {
          console.warn('Missing VITE_WEATHER_API_KEY');
          setError('Weather temporarily unavailable (missing API key).');
          return;
        }

        await fetchWeather(city);
      } catch (e) {
        setError('Could not initialize weather.');
      }
    };

    boot();
    // we only want to run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchWeather = async (city) => {
    try {
      setError('');
      const res = await fetch(
        `https://api.weatherapi.com/v1/current.json?key=${API_KEY}&q=${encodeURIComponent(
          city
        )}`
      );

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Weather API error: ${res.status} ${text}`);
      }

      const data = await res.json();
      if (data && data.current) {
        setWeather(data);
        onThemeChange?.(data.current.condition?.text || 'Default');
      } else {
        setError('Weather data unavailable.');
      }
    } catch (err) {
      console.error(err);
      setError('Failed to load weather.');
    }
  };

  return (
    <section className="w-full flex items-center justify-center py-8">
      <div className="max-w-2xl w-full text-center">
        {error && (
          <div className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700 mb-3">
            {error}
          </div>
        )}

        {weather ? (
          <>
            <h2 className="text-2xl font-semibold">
              {weather.location?.name}, {weather.location?.region}
            </h2>
            <p className="text-5xl font-bold mt-2">
              {Math.round(weather.current?.temp_c)}°C
            </p>
            <p className="mt-1">{weather.current?.condition?.text}</p>
            <p className="mt-1">
              Feels like {Math.round(weather.current?.feelslike_c)}°C • Humidity{' '}
              {weather.current?.humidity}%
            </p>
          </>
        ) : !error ? (
          <p className="opacity-70">Loading weather…</p>
        ) : null}
      </div>
    </section>
  );
}
