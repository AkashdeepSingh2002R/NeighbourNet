// client/src/components/WeatherHero.jsx
import React, { useEffect, useState } from "react";

export default function WeatherHero({ onThemeChange }) {
  const [weather, setWeather] = useState(null);
  const [error, setError] = useState("");
  const [city, setCity] = useState(() => {
    try {
      const u = JSON.parse(localStorage.getItem("user"));
      return u?.city || "";
    } catch { return ""; }
  });

  const API_KEY =
    import.meta.env.VITE_WEATHER_API_KEY ||
    ""; // set this on Netlify and redeploy

  useEffect(() => {
    if (!city || !API_KEY) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `https://api.weatherapi.com/v1/current.json?key=${API_KEY}&q=${encodeURIComponent(city)}`
        );
        const data = await res.json();
        if (cancelled) return;
        if (data?.current) {
          setWeather(data);
          onThemeChange?.(data.current.condition?.text || "");
        } else {
          setError(data?.error?.message || "Unable to load weather");
        }
      } catch (e) {
        if (!cancelled) setError("Network error while loading weather");
      }
    })();
    return () => { cancelled = true; };
  }, [city, API_KEY, onThemeChange]);

  if (!city) {
    return (
      <div className="weather-hero p-4 rounded border bg-gray-50 text-gray-600">
        Set your city in profile to see the weather.
      </div>
    );
  }

  if (error && !weather) {
    return (
      <div className="weather-hero p-4 rounded border bg-red-50 text-red-700">
        {error}
      </div>
    );
  }

  if (!weather) {
    return <div className="weather-hero p-4">Loading weather…</div>;
  }

  return (
    <div className="weather-hero p-4 rounded border">
      <div className="text-lg font-semibold">{weather.location?.name}</div>
      <div>{weather.current?.condition?.text}</div>
      <div className="text-2xl font-bold">{Math.round(weather.current?.temp_c)}°C</div>
    </div>
  );
}
