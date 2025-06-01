import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const API_KEY = 'd2f197eb7d1d4b73aee04612250605&q'; // Replace with your working key

export default function WeatherPage() {
  const user = JSON.parse(localStorage.getItem('user'));
  const postal = user?.postal || 'M1V 1A2';
  const city = user?.city || 'Toronto';

  const [weather, setWeather] = useState(null);
  const [newReview, setNewReview] = useState('');
  const [reviews, setReviews] = useState([]);

  const predefined = [
    {
      id: 1,
      name: 'Alice',
      postal: 'M1V 1A2',
      text: 'Woke up to the most gorgeous sunny morning! Perfect day for a walk in the park.',
      time: '2d ago',
    },
    {
      id: 2,
      name: 'Jamie',
      postal: 'M1V 1A2',
      text: 'Remember to take an umbrella when heading out. 🌧️',
      time: '5d ago',
    },
    {
      id: 3,
      name: 'Alex',
      postal: 'M1V 1A2',
      text: 'The sunshine is back! Planning a BBQ with the neighbours later.',
      time: '1w ago',
    },
  ];

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const res = await fetch(
          `https://api.weatherapi.com/v1/current.json?key=${API_KEY}&q=${postal}`
        );
        const data = await res.json();
        setWeather(data.current);
      } catch (err) {
        console.error('Weather fetch error:', err);
      }
    };

    fetchWeather();

    const stored = JSON.parse(localStorage.getItem('weather_reviews')) || [];
    const all = [...predefined, ...stored].filter((r) => r.postal === postal);
    setReviews(all);
  }, [postal]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newReview.trim()) return;

    const newEntry = {
      id: Date.now(),
      name: user?.name || 'Anonymous',
      postal,
      text: newReview.trim(),
      time: 'Just now',
    };

    const updated = [...reviews, newEntry];
    setReviews(updated);
    setNewReview('');

    const stored = JSON.parse(localStorage.getItem('weather_reviews')) || [];
    localStorage.setItem('weather_reviews', JSON.stringify([...stored, newEntry]));
  };

  return (
    <div className="min-h-screen bg-[#e8f1d8] text-[#2f4430]">
      <Navbar />

      {/* Top Weather Section */}
      <section className="px-8 py-12 max-w-6xl mx-auto">
        <h2 className="text-4xl font-bold mb-4">{postal} Weather</h2>

        {weather ? (
          <div className="flex flex-col md:flex-row items-center justify-between bg-[#f6fadd] p-8 rounded-xl shadow">
            <div className="flex items-center space-x-6">
              <img src={weather.condition.icon} alt="icon" className="w-20 h-20" />
              <div>
                <h3 className="text-5xl font-bold">{weather.temp_c}°C</h3>
                <p className="text-xl">{weather.condition.text}</p>
              </div>
            </div>
            <div className="mt-6 md:mt-0 text-sm space-y-1">
              <p>Feels like: <strong>{weather.feelslike_c}°C</strong></p>
              <p>Wind: <strong>{weather.wind_kph} km/h {weather.wind_dir}</strong></p>
              <p>Humidity: <strong>{weather.humidity}%</strong></p>
            </div>
          </div>
        ) : (
          <p className="text-gray-500 mt-4">Loading weather...</p>
        )}
      </section>

      {/* Reviews & Form */}
      <section className="bg-[#cfe1b9] px-8 py-10">
        <div className="max-w-6xl mx-auto">
          <h3 className="text-2xl font-bold mb-6">User Reviews</h3>

          <div className="grid md:grid-cols-3 gap-6 mb-10">
            {reviews.map((r) => (
              <div
                key={r.id}
                className="bg-[#e8f1d8] p-5 rounded-xl shadow text-sm"
              >
                <h4 className="font-bold mb-1">{r.name}</h4>
                <p className="text-[#2f4430] mb-2">{r.text}</p>
                <p className="text-xs text-[#6c7e67]">{r.time}</p>
              </div>
            ))}
          </div>

          {/* Post Form */}
          <div className="md:w-1/2">
            <h4 className="text-lg font-semibold mb-2">Share Your Review</h4>
            <form onSubmit={handleSubmit} className="space-y-3">
              <textarea
                rows="3"
                value={newReview}
                onChange={(e) => setNewReview(e.target.value)}
                placeholder="Share a weather update with your neighbours..."
                className="w-full p-3 border border-[#cbdaba] rounded-lg text-sm resize-none"
                required
              />
              <button
                type="submit"
                className="w-full bg-[#f8d878] hover:bg-[#f5ca4e] text-[#2f4430] py-2 rounded-lg font-medium"
              >
                Post
              </button>
            </form>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
