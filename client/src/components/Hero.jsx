import React, { useEffect, useState } from 'react';
import WeatherCard from './WeatherCard';

export default function Hero({ onThemeChange }) {
  const [weather, setWeather] = useState(null);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const res = await fetch(
          `https://cors-anywhere.herokuapp.com/https://api.weatherapi.com/v1/current.json?key=d2f197eb7d1d4b73aee04612250605&q=Toronto`
        );
        const data = await res.json();
        const desc = data.current.condition.text;

        setWeather({
          temp: data.current.temp_c,
          description: desc,
          icon: data.current.condition.icon,
        });

        if (onThemeChange) onThemeChange(desc);
      } catch (err) {
        console.error('Weather API error:', err);
      }
    };

    fetchWeather();
  }, []);

  return (
    <section className="py-20 px-4 text-center shadow-inner transition-all duration-500">
      <h2 className="text-4xl font-bold text-gray-800 mb-2">Good Morning, Akash 👋</h2>
      <p className="text-lg text-gray-700 mb-4">
        Explore your neighbourhood — join or contribute now!
      </p>
      <input
        className="px-5 py-3 border border-gray-300 rounded-md w-80 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        type="text"
        placeholder="Search your postal code"
      />
      {weather && <WeatherCard weather={weather} />}
    </section>
  );
}
