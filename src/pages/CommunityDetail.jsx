import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function CommunityDetail() {
  const { id } = useParams();
  const [community, setCommunity] = useState(null);

  useEffect(() => {
    const created = JSON.parse(localStorage.getItem('created')) || [];
    const joined = JSON.parse(localStorage.getItem('joined')) || [];
    const global = JSON.parse(localStorage.getItem('global')) || [];

    const all = [...created, ...joined, ...global];
    const found = all.find((c) => c.id.toString() === id);
    setCommunity(found);
  }, [id]);

  if (!community) {
    return <div className="p-10 text-center text-lg">Community not found.</div>;
  }

  return (
    <div className="min-h-screen bg-[#f1f3ec] text-[#2f4235]">
      <Navbar />
      <div className="max-w-4xl mx-auto px-6 py-10 bg-white rounded shadow-md mt-6">
        <img
          src={community.image}
          alt={community.name}
          className="w-full h-64 object-cover rounded mb-4"
        />
        <h2 className="text-3xl font-bold text-[#2f4430]">{community.name}</h2>
        <p className="text-sm text-[#5f705e] mt-1">
          {community.street}, {community.postal}
        </p>
        <p className="mt-4 text-[#3a4e38] text-base">{community.description}</p>

        <Link
          to="/communities"
          className="inline-block mt-6 text-sm text-[#325a42] underline"
        >
          ← Back to Communities
        </Link>
      </div>
      <Footer />
    </div>
  );
}
