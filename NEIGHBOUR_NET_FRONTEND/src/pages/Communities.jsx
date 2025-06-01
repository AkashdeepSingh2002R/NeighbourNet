import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import WeatherHero from '../components/WeatherHero';
import placeholderImg from '../assets/communities/placeholder.jpg';

export default function Communities() {
  const [created, setCreated] = useState([]);
  const [joined, setJoined] = useState([]);
  const [global, setGlobal] = useState([]);
  const [form, setForm] = useState({
    name: '',
    street: '',
    postal: '',
    community: '',
    description: '',
  });

  const currentUser = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    if (!currentUser?._id) return;

    axios.get('http://localhost:5000/api/communities').then((res) => {
      setGlobal(res.data);
    });

    axios.get(`http://localhost:5000/api/communities/user/${currentUser._id}`).then((res) => {
      setCreated(res.data.created);
      setJoined(res.data.joined);
    });
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleCreate = async (e) => {
    e.preventDefault();

    const newCommunity = {
      name: form.community,
      street: form.street,
      postal: form.postal,
      description: form.description,
      image: placeholderImg,
      userId: currentUser._id,
    };

    const res = await axios.post('http://localhost:5000/api/communities', newCommunity);
    setCreated([res.data, ...created]);
    setGlobal([res.data, ...global]);
    setForm({ name: '', street: '', postal: '', community: '', description: '' });
  };

  const handleJoin = async (comm) => {
    await axios.post(`http://localhost:5000/api/communities/${comm._id}/join`, {
      userId: currentUser._id,
    });
    setJoined([comm, ...joined]);
  };

  const isYourCommunity = (comm) =>
    created.some((c) => c._id === comm._id) || joined.some((c) => c._id === comm._id);

  const availableGlobals = global.filter((comm) => !isYourCommunity(comm));
  const yourCommunities = [...created, ...joined];

  return (
    <div className="min-h-screen flex flex-col bg-[#f1f3ec] text-[#2f4235]">
      <Navbar />
      <WeatherHero hideButtons />

      <main className="flex flex-col md:flex-row gap-10 px-8 py-6">
        {/* LEFT SIDE */}
        <div className="md:w-2/3 space-y-6">
          <h2 className="text-2xl font-bold text-[#2f4430] mb-2">Communities</h2>

          {yourCommunities.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-[#3c5139] mb-2">Your Communities</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                {yourCommunities.map((comm) => (
                  <Link to={`/communities/${comm._id}`} key={comm._id}>
                    <div className="bg-white p-4 rounded-lg shadow hover:bg-[#f5f8ef]">
                      <img
                        src={comm.image}
                        alt={comm.name}
                        className="w-full h-32 object-cover rounded mb-2"
                      />
                      <h4 className="font-bold text-[#2f4235]">{comm.name}</h4>
                      <p className="text-sm text-[#5f705e]">
                        {comm.street}, {comm.postal}
                      </p>
                      <p className="text-xs mt-1">{comm.description}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div>
            <h3 className="text-lg font-semibold text-[#3c5139] mb-2">Global Communities</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              {availableGlobals.map((comm) => (
                <div key={comm._id} className="bg-white p-4 rounded-lg shadow hover:bg-[#f5f8ef]">
                  <Link to={`/communities/${comm._id}`}>
                    <img
                      src={comm.image}
                      alt={comm.name}
                      className="w-full h-32 object-cover rounded mb-2"
                    />
                    <h4 className="font-bold text-[#2f4235]">{comm.name}</h4>
                    <p className="text-sm text-[#5f705e]">
                      {comm.street}, {comm.postal}
                    </p>
                    <p className="text-xs mt-1">{comm.description}</p>
                  </Link>
                  <button
                    onClick={() => handleJoin(comm)}
                    className="mt-2 text-xs text-[#325a42] underline"
                  >
                    Join
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT FORM */}
        <div className="md:w-1/3 bg-[#f7f7ec] p-6 border border-[#d6d6c2] rounded-lg shadow">
          <h3 className="text-xl font-bold mb-4 text-[#2f4430]">Create Your Own Community</h3>
          <form onSubmit={handleCreate} className="space-y-4 text-sm">
            <input
              type="text"
              name="name"
              value={form.name}
              placeholder="Your Name"
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border rounded"
            />
            <input
              type="text"
              name="street"
              value={form.street}
              placeholder="Street"
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border rounded"
            />
            <input
              type="text"
              name="postal"
              value={form.postal}
              placeholder="Postal Code"
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border rounded"
            />
            <input
              type="text"
              name="community"
              value={form.community}
              placeholder="Community Name"
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border rounded"
            />
            <textarea
              name="description"
              value={form.description}
              placeholder="Community Description"
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border rounded"
            />
            <button
              type="submit"
              className="w-full bg-[#dcd5bb] hover:bg-[#cfc6a1] text-[#2f4430] font-semibold py-2 rounded"
            >
              Create Community
            </button>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
}
