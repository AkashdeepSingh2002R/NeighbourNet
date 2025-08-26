import React, { useEffect, useState } from 'react';
import api from '../api/axios'; // optional (for greeting); safe to keep

export default function WeatherHero({ onThemeChange /*, city (ignored) */ }) {
  const [user, setUser] = useState(null);          // greeting only
  const [weather, setWeather] = useState(null);
  const [place, setPlace] = useState('');          // e.g., "Brampton, Ontario, Canada"
  const [err, setErr] = useState('');
  const [queryUsed, setQueryUsed] = useState('');  // debug

  const API_KEY = 'd2f197eb7d1d4b73aee04612250605';

  // Load a user for greeting (does NOT block weather)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      // try localStorage first
      try {
        const ls = JSON.parse(localStorage.getItem('user') || 'null');
        if (!cancelled && ls) setUser(ls);
      } catch {}
      // backend fallback
      if (!user) {
        try {
          const { data } = await api.get('/users/me');
          if (!cancelled && data) setUser(data);
        } catch {}
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // On first render: geolocate → fallback to IP
  useEffect(() => {
    let cancelled = false;

    const locateAndFetch = async () => {
      setErr('');
      const fetchByIP = async () => {
        const q = 'auto:ip';
        if (cancelled) return;
        setQueryUsed(q);
        await fetchWeather(q);
      };

      if ('geolocation' in navigator) {
        const getPos = () =>
          new Promise((resolve, reject) =>
            navigator.geolocation.getCurrentPosition(
              resolve,
              reject,
              { enableHighAccuracy: true, timeout: 7000, maximumAge: 60000 }
            )
          );
        try {
          const pos = await getPos();
          if (cancelled) return;
          const q = `${pos.coords.latitude},${pos.coords.longitude}`;
          setQueryUsed(q);
          await fetchWeather(q);
          return;
        } catch {
          await fetchByIP();
          return;
        }
      }
      await fetchByIP();
    };

    locateAndFetch();
    return () => { cancelled = true; };
  }, []);

  const fetchWeather = async (q) => {
    try {
      const res = await fetch(
        `https://api.weatherapi.com/v1/current.json?key=${API_KEY}&q=${encodeURIComponent(q)}&aqi=no`,
        { cache: 'no-store' }
      );
      const data = await res.json();

      if (data?.error) {
        setWeather(null);
        setPlace('');
        setErr(data.error.message || 'Weather service error');
        return;
      }
      if (!data?.current) {
        setWeather(null);
        setPlace('');
        setErr('Invalid weather data');
        return;
      }

      setErr('');
      setWeather(data);
      setPlace(
        [data?.location?.name, data?.location?.region, data?.location?.country]
          .filter(Boolean)
          .join(', ')
      );
      onThemeChange?.(data.current.condition.text);
    } catch {
      setErr('Network error while fetching weather');
      setWeather(null);
      setPlace('');
    }
  };

  return (
    <section className="bg-white/90 shadow rounded-xl p-6 mx-4 my-6 md:mx-12">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#2f4430]">
            Welcome {user?.name ? `, ${user.name}` : ''}
          </h1>
          <p className="text-[#4b5e4a] text-sm mt-1">
            {place || (err ? '—' : 'Detecting your location…')}
          </p>
          {err && <p className="text-xs text-red-600 mt-1">{err}</p>}
          
        </div>

        {weather?.current ? (
          <div className="flex items-center gap-4">
            <img
              src={
                weather.current.condition.icon?.startsWith('//')
                  ? `https:${weather.current.condition.icon}`
                  : weather.current.condition.icon
              }
              alt="icon"
              className="w-10 h-10"
            />
            <div>
              <p className="text-[#3a5942] font-medium">
                {weather.current.condition.text}
              </p>
              <p className="text-[#5f705e] text-sm">
                {weather.current.temp_c}°C
              </p>
            </div>
          </div>
        ) : (
          !err && <p className="text-sm text-gray-500">Weather data unavailable</p>
        )}
      </div>
    </section>
  );
}
