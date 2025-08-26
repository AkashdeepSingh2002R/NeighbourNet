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

  // Social state (computed from /me)
  const [friends, setFriends] = useState([]);                 // mutual follows only
  const [friendRequests, setFriendRequests] = useState([]);   // incoming (they follow me)
  const [outgoingRequests, setOutgoingRequests] = useState([]); // following − mutual − incoming

  const [newPost, setNewPost] = useState('');
  const [preview, setPreview] = useState(null);
  const [friendMenuFor, setFriendMenuFor] = useState(null);

  const s = (v) => (v ?? '').toString();
  const arr = (v) => (Array.isArray(v) ? v : []);

  // ---------- Helpers ----------
  const idOf = (objOrId) => s(objOrId?._id ?? objOrId ?? '');

  const normalizeAuthor = (post, me, usersMap) => {
    const aid = idOf(post.author);
    // prefer populated author from server
    if (post.author && post.author.name) return post;
    // try users list
    const fromUsers = usersMap.get(aid);
    if (fromUsers) return { ...post, author: { _id: fromUsers._id, name: fromUsers.name } };
    // if it's me
    if (aid && aid === s(me?._id)) return { ...post, author: { _id: me._id, name: me.name } };
    // fallback to existing shape (may show empty name)
    return { ...post, author: post.author ? { _id: aid, name: post.author.name || '' } : { _id: aid, name: '' } };
  };

  const filterFeedToFriendsAndMe = (items, friendIds, meId) => {
    const allowed = new Set([...friendIds, s(meId)]);
    return arr(items).filter((p) => allowed.has(s(p.author?._id || p.author)));
  };

  // ---------- Bootstrap ----------
  useEffect(() => {
    api.get('/users/me')
      .then(({ data }) => {
        setCurrentUser(data);
        bootstrap(data);
      })
      .catch(() => {
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
    const meId = typeof meOrId === 'string' ? meOrId : meOrId?._id;
    if (!meId) return;

    try {
      const [usersRes, incomingRes, feedRes, meRes] = await Promise.all([
        api.get('/users'),
        api.get(`/users/${meId}/friend-requests`), // incoming
        api.get('/posts/feed', { params: { limit: 50 } }),
        me ? Promise.resolve({ data: me }) : api.get('/users/me'),
      ]);

      const allUsers     = arr(usersRes.data);
      const incomingList = arr(incomingRes.data);
      const meFull       = meRes.data || {};
      const feed         = feedRes?.data || {};

      setUsers(allUsers);
      setCurrentUser(meFull);
      setFriendRequests(incomingList);

      // --- compute mutual friends / outgoing ---
      const followersIds = new Set(arr(meFull.followers).map(idOf));
      const followingIds = new Set(arr(meFull.following).map(idOf));
      const mutualIds    = new Set([...followingIds].filter((id) => followersIds.has(id)));

      const usersById = new Map(allUsers.map((u) => [s(u._id), u]));
      const friendsComputed = [...mutualIds].map((id) => usersById.get(id) || { _id: id, name: 'Friend' });
      setFriends(friendsComputed);

      const incomingIds = new Set(incomingList.map((r) => s(r._id)));
      const outgoing    = [...followingIds].filter((id) => !mutualIds.has(id) && !incomingIds.has(id));
      setOutgoingRequests(outgoing);

      // --- posts: friends ∪ me ---
      const friendIdSet = new Set([...mutualIds]);
      const visible = filterFeedToFriendsAndMe(arr(feed.items), friendIdSet, meFull._id)
        .map((p) => normalizeAuthor(p, meFull, usersById));
      setPosts(visible);
    } catch (err) {
      console.error('Bootstrap load error:', err?.response?.data || err);
    }
  }

  // Central refresher
  const refreshSocialState = async () => {
    if (!currentUser?._id) return;
    try {
      const [{ data: meNew }, usersRes, incomingRes, feedRes] = await Promise.all([
        api.get('/users/me'),
        api.get('/users'),
        api.get(`/users/${currentUser._id}/friend-requests`),
        api.get('/posts/feed', { params: { limit: 50 } }),
      ]);

      const allUsers     = arr(usersRes.data);
      const incomingList = arr(incomingRes.data);
      const feed         = feedRes?.data || {};

      setCurrentUser(meNew);
      setUsers(allUsers);
      setFriendRequests(incomingList);

      const followersIds = new Set(arr(meNew.followers).map(idOf));
      const followingIds = new Set(arr(meNew.following).map(idOf));
      const mutualIds    = new Set([...followingIds].filter((id) => followersIds.has(id)));

      const usersById    = new Map(allUsers.map((u) => [s(u._id), u]));
      const friendsComputed = [...mutualIds].map((id) => usersById.get(id) || { _id: id, name: 'Friend' });
      setFriends(friendsComputed);

      const incomingIds = new Set(incomingList.map((r) => s(r._id)));
      const outgoing    = [...followingIds].filter((id) => !mutualIds.has(id) && !incomingIds.has(id));
      setOutgoingRequests(outgoing);

      const friendIdSet = new Set([...mutualIds]);
      const visible = filterFeedToFriendsAndMe(arr(feed.items), friendIdSet, meNew._id)
        .map((p) => normalizeAuthor(p, meNew, usersById));
      setPosts(visible);
    } catch (e) {
      console.error('Refresh state error:', e?.response?.data || e);
    }
  };

  // ---------- Actions ----------
  const acceptRequest = async (senderId) => {
    try { await api.post(`/users/${senderId}/follow`); await refreshSocialState(); }
    catch (e) { console.error('Accept request error:', e?.response?.data || e); alert(e?.response?.data?.message || 'Could not accept request'); }
  };

  const sendFriendRequest = async (targetId) => {
    try { await api.post(`/users/${targetId}/follow`); await refreshSocialState(); }
    catch (e) { console.error('Send request error:', e?.response?.data || e); alert(e?.response?.data?.message || 'Could not send request'); }
  };

  const cancelFriendRequest = async (targetId) => {
    if (!window.confirm('Cancel friend request?')) return;
    try { await api.post(`/users/${targetId}/unfollow`); await refreshSocialState(); }
    catch (e) { console.error('Cancel request error:', e?.response?.data || e); alert(e?.response?.data?.message || 'Could not cancel request'); }
  };

  const removeFriend = async (friendId) => {
    try { await api.post(`/users/${friendId}/unfollow`); await refreshSocialState(); }
    catch (e) { console.error('Remove friend error:', e?.response?.data || e); alert(e?.response?.data?.message || 'Could not remove friend'); }
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

      // Normalize returned post so author is my name immediately
      const usersById = new Map(users.map((u) => [s(u._id), u]));
      const normalized = normalizeAuthor(data, currentUser, usersById);

      setNewPost(''); setPreview(null);
      setPosts((prev) => [normalized, ...prev]);
    } catch (e2) {
      console.error('Create post error:', e2?.response?.data || e2);
      alert(e2?.response?.data?.message || 'Could not create post');
    }
  };

  // ---------- Rendering helpers ----------
  const friendIdSet   = new Set(friends.map((f) => s(f._id)));
  const incomingIdSet = new Set(friendRequests.map((r) => s(r._id)));
  const outgoingIdSet = new Set(outgoingRequests.map(s));

  useEffect(() => { setFriendMenuFor(null); }, [users.length, friends.length, friendRequests.length, outgoingRequests.length]);

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

          {/* Header text changed here */}
          <h2 className="text-xl font-semibold">Posts</h2>

          {posts.length === 0 ? (
            <p className="text-gray-500">No posts yet.</p>
          ) : (
            posts.map((post) => {
              const authorId = s(post?.author?._id || post?.author);
              let authorName = s(post?.author?.name || post?.name || '');
              if (!authorName && authorId === s(currentUser?._id)) authorName = s(currentUser?.name);

              const text  = s(post?.text || post?.message);
              const image = s(post?.imageUrl || post?.image);
              return (
                <div key={post._id || `${authorId}-${post.createdAt || Math.random()}`} className="bg-white p-4 rounded-lg shadow space-y-2">
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
                  const friendIds = new Set(friends.map((f) => s(f._id)));
                  const incomingIdSet = new Set(friendRequests.map((r) => s(r._id)));
                  const outgoingIdSet = new Set(outgoingRequests.map(s));

                  const isFriend   = friendIds.has(id);
                  const isIncoming = incomingIdSet.has(id);
                  const isOutgoing = outgoingIdSet.has(id);

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

          {/* Friends List with the same Friend ▾ menu */}
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
