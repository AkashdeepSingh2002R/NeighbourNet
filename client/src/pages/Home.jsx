import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import WeatherHero from '../components/WeatherHero';
import ActionTiles from '../components/ActionTiles';

export default function Home({ onLogout }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [friends, setFriends] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [users, setUsers] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [newPost, setNewPost] = useState('');
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || !user._id) return;
    setCurrentUser(user);

    axios.get(`http://localhost:5000/api/users/${user._id}/friends`)
      .then(res => {
        setFriends(res.data);
        const friendIds = res.data.map(f => f._id);
        axios.get('http://localhost:5000/api/posts')
          .then(postRes => {
            const filtered = postRes.data.filter(post => friendIds.includes(post.userId));
            setPosts(filtered);
          });
      });

    axios.get(`http://localhost:5000/api/users/${user._id}/friend-requests`)
      .then(res => setFriendRequests(res.data));

    axios.get('http://localhost:5000/api/users').then(res => {
      setUsers(res.data);

      const requestedTo = res.data.filter(u =>
        u.friendRequests.includes(user._id)
      ).map(u => u._id);

      setSentRequests(requestedTo);
    });
  }, []);

  const acceptRequest = async (senderId) => {
    await axios.post(`http://localhost:5000/api/users/${currentUser._id}/accept-request`, { senderId });
    const updatedFriends = await axios.get(`http://localhost:5000/api/users/${currentUser._id}/friends`);
    const updatedRequests = await axios.get(`http://localhost:5000/api/users/${currentUser._id}/friend-requests`);
    setFriends(updatedFriends.data);
    setFriendRequests(updatedRequests.data);
  };

  const sendFriendRequest = async (targetId) => {
    await axios.post(`http://localhost:5000/api/users/${currentUser._id}/send-request`, { targetId });
    setSentRequests([...sentRequests, targetId]);
  };

  const cancelFriendRequest = async (targetId) => {
    const confirm = window.confirm('Cancel friend request?');
    if (!confirm) return;

    await axios.post(`http://localhost:5000/api/users/${currentUser._id}/cancel-request`, { targetId });
    setSentRequests(sentRequests.filter(id => id !== targetId));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setPreview(url);
    }
  };

  const handlePost = async (e) => {
    e.preventDefault();
    if (!newPost.trim()) return;

    const postPayload = {
      userId: currentUser._id,
      name: currentUser.name,
      message: newPost,
      image: preview || '',
    };

    await axios.post('http://localhost:5000/api/posts', postPayload);
    setNewPost('');
    setPreview(null);
    alert('Post shared!');
  };

  const confirmedFriendIds = friends.map(f => f._id);

  return (
    <div className="min-h-screen bg-[#f1f3ec] text-[#2f4235]">
      <Navbar onLogout={onLogout} />
      <WeatherHero />
      <ActionTiles />

      <main className="max-w-6xl mx-auto px-6 py-10 flex flex-col md:flex-row gap-8">
        {/* Posts and New Post Form */}
        <section className="flex-1 space-y-6">
          <form onSubmit={handlePost} className="bg-white p-4 rounded shadow space-y-2">
            <textarea
              rows="3"
              placeholder="Share something..."
              className="w-full p-2 border rounded resize-none text-sm"
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
            />
            <input type="file" accept="image/*" onChange={handleImageChange} />
            {preview && <img src={preview} alt="Preview" className="w-full h-48 object-cover rounded" />}
            <button type="submit" className="bg-[#d4e7ba] px-4 py-2 rounded font-semibold text-sm">Post</button>
          </form>

          <h2 className="text-xl font-semibold">Posts from Friends</h2>
          {posts.length === 0 ? (
            <p className="text-gray-500">No posts yet.</p>
          ) : (
            posts.map(post => (
              <div key={post._id} className="bg-white p-4 rounded-lg shadow space-y-2">
                <h3 className="font-semibold">{post.name}</h3>
                <p className="text-sm">{post.message}</p>
                {post.image && <img src={post.image} alt="Post" className="w-full rounded mt-2" />}
              </div>
            ))
          )}
        </section>

        {/* Sidebar */}
        <aside className="w-full md:w-[300px] space-y-6">
          {/* Friend Requests */}
          <div className="bg-[#fff8dc] p-4 rounded-xl shadow">
            <h3 className="text-lg font-semibold mb-3">Friend Requests</h3>
            {friendRequests.length === 0 ? (
              <p className="text-sm text-gray-500">No pending requests</p>
            ) : (
              <ul className="space-y-4">
                {friendRequests.map((req) => (
                  <li key={req._id} className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-yellow-200 rounded-full flex items-center justify-center font-bold text-[#2f4235]">
                      {req.name[0]}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{req.name}</p>
                      <p className="text-xs text-gray-600">{req.city}</p>
                    </div>
                    <button
                      onClick={() => acceptRequest(req._id)}
                      className="text-xs bg-green-200 px-2 py-1 rounded"
                    >
                      Accept
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* People Nearby */}
          <div className="bg-[#f6fadd] p-4 rounded-xl shadow">
            <h3 className="text-lg font-semibold mb-3">People Nearby</h3>
            <ul className="space-y-4">
              {users
                .filter(u => u._id !== currentUser._id && !confirmedFriendIds.includes(u._id))
                .map(user => (
                  <li key={user._id} className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center font-bold text-[#2f4235]">
                      {user.name[0]}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{user.name}</p>
                      <p className="text-xs text-gray-600">{user.city}</p>
                    </div>
                    {sentRequests.includes(user._id) ? (
                      <button
                        className="text-xs bg-gray-300 px-3 py-1 rounded"
                        onClick={() => cancelFriendRequest(user._id)}
                      >
                        Requested
                      </button>
                    ) : (
                      <button
                        onClick={() => sendFriendRequest(user._id)}
                        className="text-xs bg-yellow-200 px-3 py-1 rounded"
                      >
                        Add Friend
                      </button>
                    )}
                  </li>
                ))}
            </ul>
          </div>

          {/* Friends List */}
          <div className="bg-[#e6f7ff] p-4 rounded-xl shadow">
            <h3 className="text-lg font-semibold mb-3">Your Friends</h3>
            {friends.length === 0 ? (
              <p className="text-sm text-gray-500">You haven't added any friends yet</p>
            ) : (
              <ul className="space-y-4">
                {friends.map((friend) => (
                  <li key={friend._id} className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center font-bold text-[#2f4235]">
                      {friend.name[0]}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{friend.name}</p>
                      <p className="text-xs text-gray-600">{friend.city}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      </main>

      <Footer />
    </div>
  );
}
