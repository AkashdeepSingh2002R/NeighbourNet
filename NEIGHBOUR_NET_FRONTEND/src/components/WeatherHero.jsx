import React, { useEffect, useState } from 'react';

export default function WeatherHero({ onThemeChange }) {
  const [user, setUser] = useState(null);
  const [weather, setWeather] = useState(null);

  const API_KEY = 'd2f197eb7d1d4b73aee04612250605'; // ✅ Corrected

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('user'));
    if (stored?.city) {
      setUser(stored);
      fetchWeather(stored.city);
    }
  }, []);

  const fetchWeather = async (city) => {
    try {
      const res = await fetch(
        `https://api.weatherapi.com/v1/current.json?key=${API_KEY}&q=${city}`
      );
      const data = await res.json();

      if (data && data.current) {
        setWeather(data);
        onThemeChange?.(data.current.condition.text); // optional chaining
      } else {
        console.error('Invalid weather data:', data);
      }
    } catch (error) {
      console.log('Weather fetch failed', error);
    }
  };

  if (!user) return null;

  return (
    <section className="bg-white/90 shadow rounded-xl p-6 mx-4 my-6 md:mx-12">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#2f4430]">
            Welcome back, {user.name}
          </h1>
          <p className="text-[#4b5e4a] text-sm mt-1">
            Location: {user.city}, {user.postalCode}
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
