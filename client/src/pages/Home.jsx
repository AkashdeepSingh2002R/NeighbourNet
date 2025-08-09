import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';

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

  const s = (v) => (v ?? '').toString();
  const arr = (v) => (Array.isArray(v) ? v : []);

  useEffect(() => {
    // Try cookie auth /me, else fallback to localStorage user
    api.get('/users/me')
      .then(({ data }) => {
        setCurrentUser(data);
        bootstrap(data?._id);
      })
      .catch(() => {
        try {
          const ls = JSON.parse(localStorage.getItem('user') || 'null');
          if (ls?._id) {
            setCurrentUser(ls);
            bootstrap(ls._id);
          }
        } catch {}
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function bootstrap(userId) {
    if (!userId) return;
    try {
      const [friendsRes, requestsRes, usersRes] = await Promise.all([
        api.get(`/users/${userId}/friends`),
        api.get(`/users/${userId}/friend-requests`),
        api.get('/users'),
      ]);
      const friendList = arr(friendsRes.data);
      setFriends(friendList);
      setFriendRequests(arr(requestsRes.data));
      setUsers(arr(usersRes.data));

      const { data: feed } = await api.get('/posts/feed', { params: { limit: 50 } });
      const friendIds = new Set(friendList.map((f) => s(f._id)));
      const onlyFriends = arr(feed.items).filter((p) => friendIds.has(s(p.author?._id || p.author)));
      setPosts(onlyFriends);
    } catch (err) {
      console.error('Bootstrap load error:', err?.response?.data || err);
    }
  }

  const acceptRequest = async (senderId) => {
    try {
      await api.post(`/users/${senderId}/follow`);
      if (!currentUser?._id) return;
      const [friendsRes, reqRes] = await Promise.all([
        api.get(`/users/${currentUser._id}/friends`),
        api.get(`/users/${currentUser._id}/friend-requests`),
      ]);
        setFriends(arr(friendsRes.data));
        setFriendRequests(arr(reqRes.data));
    } catch (e) {
      console.error('Accept request error:', e?.response?.data || e);
      alert(e?.response?.data?.message || 'Could not accept request');
    }
  };

  const sendFriendRequest = async (targetId) => {
    try {
      await api.post(`/users/${targetId}/follow`);
      setSentRequests((prev) => [...prev, targetId]);
    } catch (e) {
      console.error('Send request error:', e?.response?.data || e);
      alert(e?.response?.data?.message || 'Could not send request');
    }
  };

  const cancelFriendRequest = async (targetId) => {
    const ok = window.confirm('Cancel friend request?');
    if (!ok) return;
    try {
      await api.post(`/users/${targetId}/unfollow`);
      setSentRequests((prev) => prev.filter((id) => id !== targetId));
    } catch (e) {
      console.error('Cancel request error:', e?.response?.data || e);
      alert(e?.response?.data?.message || 'Could not cancel request');
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) setPreview(URL.createObjectURL(file));
  };

  const handlePost = async (e) => {
    e.preventDefault();
    if (!newPost.trim()) return;
    const payload = { text: newPost, imageUrl: preview || '' };
    try {
      const { data } = await api.post('/posts', payload);
      setNewPost(''); setPreview(null);
      setPosts((prev) => [data, ...prev]);
    } catch (e) {
      console.error('Create post error:', e?.response?.data || e);
      alert(e?.response?.data?.message || 'Could not create post');
    }
  };

  const confirmedFriendIds = friends.map((f) => f._id);

  return (
    <div className="min-h-screen bg-[#f1f3ec] text-[#2f4235]">

      {/* Weather hero at the top */}
      <section className="max-w-6xl mx-auto px-6 pt-8">
        <WeatherHero city={currentUser?.city} />
        {/* Keep the main buttons under the hero */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
          <Link to="/profile" className="bg-[#e8f4e1] hover:opacity-90 transition rounded-lg p-3 text-center font-medium">
            Profile
          </Link>
          <Link to="/messages" className="bg-[#e1f0ff] hover:opacity-90 transition rounded-lg p-3 text-center font-medium">
            Messages
          </Link>
          <Link to="/notifications" className="bg-[#fff1cc] hover:opacity-90 transition rounded-lg p-3 text-center font-medium">
            Notifications
          </Link>
          <Link to="/explore" className="bg-[#f2e9ff] hover:opacity-90 transition rounded-lg p-3 text-center font-medium">
            Explore
          </Link>
        </div>
      </section>

      {/* Optional: keep your existing action tiles row */}
      <section className="max-w-6xl mx-auto px-6 mt-6">
        <ActionTiles />
      </section>

      <main className="max-w-6xl mx-auto px-6 py-8 flex flex-col md:flex-row gap-8">
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
            posts.map((post) => {
              const authorName = s(post?.author?.name || post?.name);
              const text = s(post?.text || post?.message);
              const image = s(post?.imageUrl || post?.image);
              return (
                <div key={post._id} className="bg-white p-4 rounded-lg shadow space-y-2">
                  <h3 className="font-semibold">{authorName || 'Unknown'}</h3>
                  <p className="text-sm">{text}</p>
                  {image ? (
                    <img
                      src={image}
                      alt="Post"
                      className="w-full rounded mt-2"
                      onError={(e) => (e.currentTarget.style.display = 'none')}
                    />
                  ) : null}
                </div>
              );
            })
          )}
        </section>

        {/* Sidebar */}
        <aside className="w-full md:w-[300px] space-y-6">
          {/* Friend Requests */}
          <div className="bg-[#fff8dc] p-4 rounded-xl shadow">
            <h3 className="text-lg font-semibold mb-3">Friend Requests</h3>
            {arr(friendRequests).length === 0 ? (
              <p className="text-sm text-gray-500">No pending requests</p>
            ) : (
              <ul className="space-y-4">
                {arr(friendRequests).map((req) => (
                  <li key={req._id} className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-yellow-200 rounded-full flex items-center justify-center font-bold text-[#2f4235]">
                      {s(req?.name)[0] || '?'}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{s(req?.name)}</p>
                      <p className="text-xs text-gray-600">{s(req?.city)}</p>
                    </div>
                    <button onClick={() => acceptRequest(req._id)} className="text-xs bg-green-200 px-2 py-1 rounded">
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
              {arr(users)
                .filter((u) => u._id !== (currentUser?._id || ''))
                .map((user) => {
                  const requested = sentRequests.includes(user._id);
                  return (
                    <li key={user._id} className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center font-bold text-[#2f4235]">
                        {s(user?.name)[0] || '?'}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{s(user?.name)}</p>
                        <p className="text-xs text-gray-600">{s(user?.city)}</p>
                      </div>
                      {requested ? (
                        <button className="text-xs bg-gray-300 px-3 py-1 rounded" onClick={() => cancelFriendRequest(user._id)}>
                          Requested
                        </button>
                      ) : (
                        <button onClick={() => sendFriendRequest(user._id)} className="text-xs bg-yellow-200 px-3 py-1 rounded">
                          Add Friend
                        </button>
                      )}
                    </li>
                  );
                })}
            </ul>
          </div>

          {/* Friends List */}
          <div className="bg-[#e6f7ff] p-4 rounded-xl shadow">
            <h3 className="text-lg font-semibold mb-3">Your Friends</h3>
            {arr(friends).length === 0 ? (
              <p className="text-sm text-gray-500">You haven't added any friends yet</p>
            ) : (
              <ul className="space-y-4">
                {arr(friends).map((friend) => (
                  <li key={friend._id} className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center font-bold text-[#2f4235]">
                      {s(friend?.name)[0] || '?'}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{s(friend?.name)}</p>
                      <p className="text-xs text-gray-600">{s(friend?.city)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      </main>
    </div>
  );
}
