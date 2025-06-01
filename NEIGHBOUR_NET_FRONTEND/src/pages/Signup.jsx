import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Signup() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    email: '',
    city: '',
    postal: '',
    password: '',
    confirmPassword: ''
  });

  const [error, setError] = useState('');

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    const userData = {
      name: form.name,
      email: form.email,
      city: form.city,
      postal: form.postal,
      password: form.password
    };

    localStorage.setItem('user', JSON.stringify(userData));
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-100">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded shadow-md w-full max-w-md space-y-4"
      >
        <h2 className="text-2xl font-bold mb-2 text-center">Create Account</h2>
        {error && <p className="text-red-500 text-sm text-center">{error}</p>}
        <input name="name" placeholder="Name" required onChange={handleChange} className="w-full p-2 border rounded" />
        <input type="email" name="email" placeholder="Email" required onChange={handleChange} className="w-full p-2 border rounded" />
        <input name="city" placeholder="City" required onChange={handleChange} className="w-full p-2 border rounded" />
        <input name="postal" placeholder="Postal Code" required onChange={handleChange} className="w-full p-2 border rounded" />
        <input type="password" name="password" placeholder="Password" required onChange={handleChange} className="w-full p-2 border rounded" />
        <input type="password" name="confirmPassword" placeholder="Confirm Password" required onChange={handleChange} className="w-full p-2 border rounded" />
        <button className="bg-blue-500 text-white px-4 py-2 rounded w-full">Sign Up</button>
      </form>
    </div>
  );
}
