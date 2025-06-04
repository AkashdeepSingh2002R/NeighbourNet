import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Footer from '../components/Footer';
import { FaUserCircle } from 'react-icons/fa';
import c1 from '../assets/c1.webp';
import c2 from '../assets/c2.jpeg';
import c3 from '../assets/c3.jpg';
import axios from 'axios';

export default function LandingLogin({ onLogin }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: '',
    password: '',
    name: '',
    postalCode: '',
    city: '',
  });
  const [error, setError] = useState('');
  const [isSignup, setIsSignup] = useState(false);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmedEmail = form.email.trim();
    const trimmedPassword = form.password.trim();

    try {
      if (isSignup) {
        const res = await axios.post(' https://neighbournet-42ys.onrender.com/api/users/register', {
          name: form.name.trim(),
          email: trimmedEmail,
          password: trimmedPassword,
          city: form.city.trim(),
          postalCode: form.postalCode.trim()
        });

        localStorage.setItem('user', JSON.stringify(res.data));
        onLogin(res.data);
        navigate('/home');
      } else {
        const res = await axios.post(' https://neighbournet-42ys.onrender.com/api/users/login', {
          email: trimmedEmail,
          password: trimmedPassword,
        });

        localStorage.setItem('user', JSON.stringify(res.data));
        onLogin(res.data);
        navigate('/home');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f1f3ec] text-[#2f4235]">
      <header className="flex justify-between items-center px-8 py-4 bg-[#f1f3ec] border-b border-[#d9e0d1]">
        <h1 className="text-3xl font-bold text-[#3a5942]">🌿 NeighbourNet</h1>
        <div className="flex items-center gap-2 text-[#3a5942]">
          <FaUserCircle className="text-2xl" />
          <span className="text-sm">Account</span>
        </div>
      </header>

      <section className="text-center py-6">
        <h2 className="text-4xl font-bold text-[#2f4235]">Welcome to NeighbourNet</h2>
        <p className="text-[#6a7b6d] text-md mt-2">We connect neighbours across communities 🤝</p>
      </section>

      <main className="flex flex-col md:flex-row justify-center items-start gap-12 px-8 py-6 max-w-7xl mx-auto w-full">
        <div className="md:w-1/2 space-y-4">
          <h3 className="text-2xl font-semibold text-[#3a5942]">
            {isSignup ? 'Why we need your info?' : 'Why Join?'}
          </h3>
          <ul className="text-[#4b5e4a] list-disc ml-5 space-y-1 text-sm">
            {isSignup ? (
              <>
                <li>We use your city & postal code to connect you with local content</li>
                <li>Your email & password will help you securely log in</li>
                <li>Your name personalizes your NeighbourNet profile</li>
              </>
            ) : (
              <>
                <li>Access local events and alerts</li>
                <li>Connect with neighbours and groups</li>
                <li>Find housing and rentals near you</li>
              </>
            )}
          </ul>

          <div className="mt-6 relative h-[220px] w-full overflow-hidden rounded-lg">
            <img
              src={c2}
              alt="center"
              className="absolute left-1/2 top-0 transform -translate-x-1/2 w-2/3 h-full object-cover rounded shadow-lg z-10"
            />
            <img
              src={c1}
              alt="left"
              className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1/4 h-3/4 object-cover rounded opacity-70"
            />
            <img
              src={c3}
              alt="right"
              className="absolute right-0 top-1/2 transform -translate-y-1/2 w-1/4 h-3/4 object-cover rounded opacity-70"
            />
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-[#f7f7ec] border border-[#d6d6c2] rounded-xl shadow-md p-8 w-full md:w-[400px]"
        >
          <h3 className="text-2xl font-semibold text-[#2f4430] mb-6">
            {isSignup ? 'Create Account' : 'Log in'}
          </h3>

          {error && <p className="text-sm text-red-600 mb-3 font-medium">{error}</p>}

          <div className="mb-4">
            <label className="block text-[#49584c] text-sm mb-1">Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-[#cccbb8] rounded-md focus:outline-none"
            />
          </div>

          <div className="mb-4">
            <label className="block text-[#49584c] text-sm mb-1">Password</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-[#cccbb8] rounded-md focus:outline-none"
            />
          </div>

          {isSignup && (
            <>
              <div className="mb-4">
                <label className="block text-[#49584c] text-sm mb-1">Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-[#cccbb8] rounded-md focus:outline-none"
                />
              </div>
              <div className="mb-4">
                <label className="block text-[#49584c] text-sm mb-1">City</label>
                <input
                  type="text"
                  name="city"
                  value={form.city}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-[#cccbb8] rounded-md focus:outline-none"
                />
              </div>
              <div className="mb-4">
                <label className="block text-[#49584c] text-sm mb-1">Postal Code</label>
                <input
                  type="text"
                  name="postalCode"
                  value={form.postalCode}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-[#cccbb8] rounded-md focus:outline-none"
                />
              </div>
            </>
          )}

          <button
            type="submit"
            className="w-full bg-[#dcd5bb] hover:bg-[#cfc6a1] text-[#2f4430] font-semibold py-2 rounded transition"
          >
            {isSignup ? 'Sign up' : 'Log in'}
          </button>

          <p className="mt-4 text-center text-sm text-[#5f705e]">
            {isSignup ? 'Already have an account?' : 'Don’t have an account?'}{' '}
            <span
              className="text-[#325a42] underline cursor-pointer"
              onClick={() => {
                setError('');
                setIsSignup(!isSignup);
              }}
            >
              {isSignup ? 'Log in' : 'Create an account'}
            </span>
          </p>
        </form>
      </main>

      <Footer />
    </div>
  );
}
