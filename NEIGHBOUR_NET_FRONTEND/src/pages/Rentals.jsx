import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useNavigate } from 'react-router-dom';

const initialRentals = [
  {
    id: 1,
    price: 1600,
    address: '12 Oak St, M1V 1A2',
    community: 'Eco Warriors',
    image: '/rentals/house1.jpg',
    description: 'Spacious detached house with garden. Ideal for families.',
  },
  {
    id: 2,
    price: 1200,
    address: '34 Maple Ave, M1V 1A2',
    community: 'Food Share Club',
    image: '/rentals/house2.jpg',
    description: 'Beautiful townhouse near local park.',
  },
];

export default function Rentals() {
  const user = JSON.parse(localStorage.getItem('user'));
  const navigate = useNavigate();

  const [rentals, setRentals] = useState([]);
  const [form, setForm] = useState({
    price: '',
    address: '',
    community: '',
    description: '',
    image: '',
  });
  const [preview, setPreview] = useState('');

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('user_rentals')) || [];
    setRentals([...initialRentals, ...saved]);
  }, []);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setForm({ ...form, image: imageUrl });
      setPreview(imageUrl);
    }
  };

  const handlePost = (e) => {
    e.preventDefault();
    const newRental = {
      ...form,
      id: Date.now(),
    };
    const updated = [...rentals, newRental];
    setRentals(updated);
    localStorage.setItem(
      'user_rentals',
      JSON.stringify([...JSON.parse(localStorage.getItem('user_rentals') || '[]'), newRental])
    );
    setForm({ price: '', address: '', community: '', description: '', image: '' });
    setPreview('');
  };

  return (
    <div className="min-h-screen bg-[#e8f1d8] text-[#2f4235]">
      <Navbar />
      <main className="max-w-6xl mx-auto px-6 py-10">
        <h2 className="text-4xl font-bold mb-2">Rentals in {user?.postal || 'Your Area'}</h2>
        <p className="text-md mb-10 text-[#5a6d59]">Explore rental listings in your community.</p>

        <div className="flex flex-col lg:flex-row gap-10">
          {/* Rental Listings */}
          <div className="flex-1 space-y-6">
            {rentals.map((r) => (
              <div
                key={r.id}
                className="flex flex-col sm:flex-row bg-[#f6fadd] rounded-xl shadow overflow-hidden"
              >
                <img
                  src={r.image || '/rentals/default.jpg'}
                  alt={r.address}
                  className="w-full sm:w-48 h-48 object-cover"
                />
                <div className="p-4 flex flex-col justify-between flex-1">
                  <div>
                    <p className="text-2xl font-bold">${r.price} <span className="text-sm font-medium">/mo</span></p>
                    <p className="text-sm mt-1">{r.address}</p>
                    <p className="text-sm text-[#4f5d4d]">{r.community}</p>
                    <p className="text-sm mt-2 text-[#6b7c69]">{r.description}</p>
                  </div>
                  <button
                    className="mt-4 w-fit bg-[#f8d878] hover:bg-[#f5ca4e] text-[#2f4430] py-1 px-4 rounded"
                    onClick={() => navigate(`/rentals/${r.id}`)}
                  >
                    Interested
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Post Rental Form */}
          <div className="w-full lg:w-[350px] bg-[#f6fadd] rounded-xl p-6 shadow">
            <h3 className="text-xl font-semibold mb-4">Post Your Rental</h3>
            <form onSubmit={handlePost} className="space-y-3 text-sm">
              <input
                type="text"
                name="address"
                placeholder="Address"
                value={form.address}
                onChange={handleChange}
                className="w-full p-2 border rounded"
                required
              />
              <input
                type="number"
                name="price"
                placeholder="Rent Price"
                value={form.price}
                onChange={handleChange}
                className="w-full p-2 border rounded"
                required
              />
              <input
                type="text"
                name="community"
                placeholder="Community Name"
                value={form.community}
                onChange={handleChange}
                className="w-full p-2 border rounded"
              />
              <textarea
                name="description"
                placeholder="Details or features"
                rows={3}
                value={form.description}
                onChange={handleChange}
                className="w-full p-2 border rounded resize-none"
              />
              <div className="space-y-1">
                <label className="text-sm text-[#2f4235]">Upload Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="w-full p-2 border rounded bg-white"
                />
                {preview && (
                  <img
                    src={preview}
                    alt="Preview"
                    className="mt-2 rounded shadow-md w-full h-40 object-cover"
                  />
                )}
              </div>
              <button
                type="submit"
                className="w-full bg-[#f8d878] hover:bg-[#f5ca4e] text-[#2f4430] py-2 rounded font-medium"
              >
                Post Rental
              </button>
            </form>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
