// client/src/pages/Home.jsx
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';

import WeatherHero from '../components/WeatherHero';
import ActionTiles from '../components/ActionTiles';

export default function Home({ onLogout }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [users, setUsers] = useState([]);

  const [friends, setFriends] = useState([]);                 // computed: mutual follows (NOT backend /friends)
  const [friendRequests, setFriendRequests] = useState([]);   // incoming requests (they follow me)
  const [outgoingRequests, setOutgoingRequests] = useState([]); // following − friends − incoming

  const [newPost, setNewPost] = useState('');
  const [preview, setPreview] = useState(null);

  const [friendMenuFor, setFriendMenuFor] = useState(null);   // which friend's popover is open

  const s = (v) => (v ?? '').toString();
  const arr = (v) => (Array.isArray(v) ? v : []);

  useEffect(() => {
    // Load session user (cookie/JWT) and bootstrap lists
    api.get('/users/me')
      .then(({ data }) => {
        setCurrentUser(data);
        bootstrap(data); // pass full /me (has followers/following)
      })
      .catch(() => {
        // Fallback if you cache user (may not include followers/following)
        try {
          const ls = JSON.parse(localStorage.getItem('user') || 'null');
          if (ls?._id) {
            setCurrentUser(ls);
            bootstrap(ls);
          }
        } catch {}
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function bootstrap(meOrId) {
    const me = typeof meOrId === 'string' ? null : meOrId;
    const userId = typeof meOrId === 'string' ? meOrId : meOrId?._id;
    if (!userId) return;

    try {
      // We do NOT trust /friends to determine "friend" UI — compute it ourselves as mutual follows.
      const [usersRes, incomingRes, feedRes, meRes] = await Promise.all([
        api.get('/users'),
        api.get(`/users/${userId}/friend-requests`), // incoming (they followed me)
        api.get('/posts/feed', { params: { limit: 50 } }),
        me ? Promise.resolve({ data: me }) : api.get('/users/me'),
      ]);

      const allUsers     = arr(usersRes.data);
      const incomingList = arr(incomingRes.data);
      const meFull       = meRes.data || {};
      const feed         = feedRes?.data || {};

      setUsers(allUsers);
      setCurrentUser(meFull); // ensure we have followers/following
      setFriendRequests(incomingList);

      // ---------- Compute mutual friends from /me ----------
      const followersIds = new Set(arr(meFull.followers).map((x) => s(x?._id ?? x)));
      const followingIds = new Set(arr(meFull.following).map((x) => s(x?._id ?? x)));
      const mutualIds    = new Set([...followingIds].filter((id) => followersIds.has(id)));

      // Build friend objects from allUsers (fall back to id-only if needed)
      const usersById = new Map(allUsers.map((u) => [s(u._id), u]));
      const friendsComputed = [...mutualIds].map((id) => usersById.get(id) || { _id: id, name: 'Friend' });

      setFriends(friendsComputed);

      // Outgoing pending = following − mutual − incoming
      const incomingIds = new Set(incomingList.map((r) => s(r._id)));
      const outgoing = [...followingIds].filter((id) => !mutualIds.has(id) && !incomingIds.has(id));
      setOutgoingRequests(outgoing);

      // Posts: only from mutual friends
      const friendIdSet = new Set([...mutualIds]);
      const onlyFriends = arr(feed.items).filter((p) =>
        friendIdSet.has(s(p.author?._id || p.author))
      );
      setPosts(onlyFriends);
    } catch (err) {
      console.error('Bootstrap load error:', err?.response?.data || err);
    }
  }

  // Central refresher to recompute all social states after any change
  const refreshSocialState = async () => {
    if (!currentUser?._id) return;
    try {
      const [{ data: meNew }, usersRes, incomingRes, feedRes] = await Promise.all([
        api.get('/users/me'),
        api.get('/users'),
        api.get(`/users/${currentUser._id}/friend-requests`),
        api.get('/posts/feed', { params: { limit: 50 } }),
      ]);

      setCurrentUser(meNew);

      const allUsers     = arr(usersRes.data);
      const incomingList = arr(incomingRes.data);
      setUsers(allUsers);
      setFriendRequests(incomingList);

      const followersIds = new Set(arr(meNew.followers).map((x) => s(x?._id ?? x)));
      const followingIds = new Set(arr(meNew.following).map((x) => s(x?._id ?? x)));
      const mutualIds    = new Set([...followingIds].filter((id) => followersIds.has(id)));

      const usersById    = new Map(allUsers.map((u) => [s(u._id), u]));
      const friendsComputed = [...mutualIds].map((id) => usersById.get(id) || { _id: id, name: 'Friend' });
      setFriends(friendsComputed);

      const incomingIds = new Set(incomingList.map((r) => s(r._id)));
      const outgoing    = [...followingIds].filter((id) => !mutualIds.has(id) && !incomingIds.has(id));
      setOutgoingRequests(outgoing);

      const feed = feedRes?.data || {};
      const friendIdSet = new Set([...mutualIds]);
      const onlyFriends = arr(feed.items).filter((p) =>
        friendIdSet.has(s(p.author?._id || p.author))
      );
      setPosts(onlyFriends);
    } catch (e) {
      console.error('Refresh state error:', e?.response?.data || e);
    }
  };

  // ----- Actions -----

  // Accept incoming (follow back -> becomes mutual friend)
  const acceptRequest = async (senderId) => {
    try {
      await api.post(`/users/${senderId}/follow`);
      await refreshSocialState();
    } catch (e) {
      console.error('Accept request error:', e?.response?.data || e);
      alert(e?.response?.data?.message || 'Could not accept request');
    }
  };

  // Send request (follow)
  const sendFriendRequest = async (targetId) => {
    try {
      await api.post(`/users/${targetId}/follow`);
      await refreshSocialState();
    } catch (e) {
      console.error('Send request error:', e?.response?.data || e);
      alert(e?.response?.data?.message || 'Could not send request');
    }
  };

  // Cancel outgoing request (unfollow)
  const cancelFriendRequest = async (targetId) => {
    const ok = window.confirm('Cancel friend request?');
    if (!ok) return;
    try {
      await api.post(`/users/${targetId}/unfollow`);
      await refreshSocialState();
    } catch (e) {
      console.error('Cancel request error:', e?.response?.data || e);
      alert(e?.response?.data?.message || 'Could not cancel request');
    }
  };

  // Remove an existing friend (we unfollow; if they still follow us, they’ll show as “Accept”)
  const removeFriend = async (friendId) => {
    try {
      await api.post(`/users/${friendId}/unfollow`);
      await refreshSocialState();
    } catch (e) {
      console.error('Remove friend error:', e?.response?.data || e);
      alert(e?.response?.data?.message || 'Could not remove friend');
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

  // ----- Rendering helpers -----
  const friendIdSet   = new Set(friends.map((f) => s(f._id)));
  const incomingIdSet = new Set(friendRequests.map((r) => s(r._id)));
  const outgoingIdSet = new Set(outgoingRequests.map(s));

  // close any open popover when navigating list
  useEffect(() => {
    setFriendMenuFor(null);
  }, [users.length, friends.length, friendRequests.length, outgoingRequests.length]);

  return (
    <div className="min-h-screen bg-[#f1f3ec] text-[#2f4235]">

      {/* Weather hero at the top */}
      <section className="max-w-6xl mx-auto px-6 pt-8">
        <WeatherHero city={currentUser?.city} />
        {/* Main buttons under the hero */}
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

      {/* Action tiles row */}
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
          {/* Friend Requests (incoming) */}
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
              {arr(users)
                .filter((u) => u._id !== (currentUser?._id || ''))
                .map((user) => {
                  const id = s(user._id);
                  const isFriend   = friendIdSet.has(id);     // mutual follows only
                  const isIncoming = incomingIdSet.has(id);   // they followed me
                  const isOutgoing = outgoingIdSet.has(id);   // I followed them (pending)

                  return (
                    <li key={id} className="flex items-center gap-3 relative">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center font-bold text-[#2f4235]">
                        {s(user?.name)[0] || '?'}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{s(user?.name)}</p>
                        <p className="text-xs text-gray-600">{s(user?.city)}</p>
                      </div>

                      {isFriend ? (
                        <div className="relative">
                          <button
                            className="text-xs bg-gray-300 px-3 py-1 rounded"
                            onClick={() => setFriendMenuFor(friendMenuFor === id ? null : id)}
                            aria-haspopup="menu"
                            aria-expanded={friendMenuFor === id}
                          >
                            Friend ▾
                          </button>
                          {friendMenuFor === id && (
                            <div
                              className="absolute right-0 z-10 mt-2 w-40 bg-white border border-gray-200 rounded-md shadow-lg"
                              role="menu"
                              onMouseLeave={() => setFriendMenuFor(null)}
                            >
                              <button
                                className="w-full text-left px-3 py-2 text-sm hover:bg-red-50 text-red-600"
                                onClick={() => { setFriendMenuFor(null); removeFriend(id); }}
                                role="menuitem"
                              >
                                Remove friend
                              </button>
                              <button
                                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                                onClick={() => setFriendMenuFor(null)}
                                role="menuitem"
                              >
                                Cancel
                              </button>
                            </div>
                          )}
                        </div>
                      ) : isIncoming ? (
                        <button
                          className="text-xs bg-green-200 px-3 py-1 rounded"
                          onClick={() => acceptRequest(id)}
                        >
                          Accept
                        </button>
                      ) : isOutgoing ? (
                        <button
                          className="text-xs bg-gray-300 px-3 py-1 rounded"
                          onClick={() => cancelFriendRequest(id)}
                          title="Cancel friend request"
                        >
                          Requested
                        </button>
                      ) : (
                        <button
                          onClick={() => sendFriendRequest(id)}
                          className="text-xs bg-yellow-200 px-3 py-1 rounded"
                        >
                          Add Friend
                        </button>
                      )}
                    </li>
                  );
                })}
            </ul>
          </div>

          {/* Friends List (same remove popover via trailing button) */}
          <div className="bg-[#e6f7ff] p-4 rounded-xl shadow">
            <h3 className="text-lg font-semibold mb-3">Your Friends</h3>
            {arr(friends).length === 0 ? (
              <p className="text-sm text-gray-500">You haven't added any friends yet</p>
            ) : (
              <ul className="space-y-4">
                {arr(friends).map((friend) => {
                  const id = s(friend._id);
                  return (
                    <li key={id} className="flex items-center gap-3 relative">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center font-bold text-[#2f4235]">
                        {s(friend?.name)[0] || '?'}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{s(friend?.name)}</p>
                        <p className="text-xs text-gray-600">{s(friend?.city)}</p>
                      </div>
                      <div className="relative">
                        <button
                          className="text-xs bg-gray-300 px-3 py-1 rounded"
                          onClick={() => setFriendMenuFor(friendMenuFor === id ? null : id)}
                          aria-haspopup="menu"
                          aria-expanded={friendMenuFor === id}
                        >
                          Friend ▾
                        </button>
                        {friendMenuFor === id && (
                          <div
                            className="absolute right-0 z-10 mt-2 w-40 bg-white border border-gray-200 rounded-md shadow-lg"
                            role="menu"
                            onMouseLeave={() => setFriendMenuFor(null)}
                          >
                            <button
                              className="w-full text-left px-3 py-2 text-sm hover:bg-red-50 text-red-600"
                              onClick={() => { setFriendMenuFor(null); removeFriend(id); }}
                              role="menuitem"
                            >
                              Remove friend
                            </button>
                            <button
                              className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                              onClick={() => setFriendMenuFor(null)}
                              role="menuitem"
                            >
                              Cancel
                            </button>
                          </div>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </aside>
      </main>
    </div>
  );
}
