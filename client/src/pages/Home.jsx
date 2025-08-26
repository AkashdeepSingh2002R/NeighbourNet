import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';

import WeatherHero from '../components/WeatherHero';
import ActionTiles from '../components/ActionTiles';

export default function Home() {
  const navigate = useNavigate();

  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]);

  // social state
  const [friends, setFriends] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [outgoingRequests, setOutgoingRequests] = useState([]);

  // UI state
  const [newPost, setNewPost] = useState('');
  const [preview, setPreview] = useState(null);
  const [friendMenuFor, setFriendMenuFor] = useState(null);
  const [editingPostId, setEditingPostId] = useState(null);
  const [editText, setEditText] = useState('');
  const [commentInputs, setCommentInputs] = useState({});

  // polling
  const pollTimer = useRef(null);
  const [authMuted, setAuthMuted] = useState(false); // stop spamming logs on 401

  const s = (v) => (v ?? '').toString();
  const arr = (v) => (Array.isArray(v) ? v : []);
  const idOf = (objOrId) => s(objOrId?._id ?? objOrId ?? '');

  const usersById = useMemo(() => new Map(users.map((u) => [s(u._id), u])), [users]);
  const getAvatar = (author) => {
    const a = author && typeof author === 'object' ? author : usersById.get(s(author));
    return a?.avatar || a?.photoUrl || a?.imageUrl || '';
  };

  const normalizeAuthor = (post, me) => {
    const aid = idOf(post.author);
    if (post.author && post.author.name) return post;
    const fromUsers = usersById.get(aid);
    if (fromUsers) return { ...post, author: { _id: fromUsers._id, name: fromUsers.name, avatar: getAvatar(fromUsers) } };
    if (aid && aid === s(me?._id)) return { ...post, author: { _id: me._id, name: me.name, avatar: getAvatar(me) } };
    return { ...post, author: { _id: aid, name: post.author?.name || '', avatar: '' } };
  };

  const normalizePost = (raw, me) => {
    const p = normalizeAuthor(raw, me);
    return {
      _id: p._id,
      author: p.author,
      text: p.text || p.message || '',
      imageUrl: p.imageUrl || p.image || '',
      createdAt: p.createdAt || Date.now(),
      likes: typeof p.likes === 'number' ? p.likes : (arr(p.likedBy)?.length || p.likesCount || 0),
      likedByMe: typeof p.likedByMe === 'boolean'
        ? p.likedByMe
        : arr(p.likedBy).map(idOf).includes(s(me?._id)) || false,
      comments: arr(p.comments).map(c => ({
        _id: c._id || Math.random().toString(36).slice(2),
        author: c.author && c.author.name
          ? c.author
          : (usersById.get(idOf(c.author)) || { _id: idOf(c.author), name: '' }),
        text: c.text || '',
        createdAt: c.createdAt || Date.now(),
      })),
      mine: s(idOf(p.author)) === s(me?._id),
    };
  };

  const filterFeedToFriendsAndMe = (items, friendIds, meId) => {
    const allowed = new Set([...friendIds, s(meId)]);
    return arr(items).filter((p) => allowed.has(s(p.author?._id || p.author)));
  };

  // ---------- Bootstrap ----------
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.get('/users/me');
        if (cancelled) return;
        setCurrentUser(data);
        await bootstrap(data);
        startLivePolling(data._id);
      } catch {
        try {
          const ls = JSON.parse(localStorage.getItem('user') || 'null');
          if (ls?._id && !cancelled) {
            setCurrentUser(ls);
            await bootstrap(ls);
            startLivePolling(ls._id);
          }
        } catch {}
      }
    })();
    return () => { cancelled = true; stopLivePolling(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function bootstrap(meOrId) {
    const me = typeof meOrId === 'string' ? null : meOrId;
    const meId = typeof meOrId === 'string' ? meOrId : meOrId?._id;
    if (!meId) return;

    const [usersRes, incomingRes, feedRes, meRes] = await Promise.all([
      api.get('/users'),
      api.get(`/users/${meId}/friend-requests`),
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

    const followersIds = new Set(arr(meFull.followers).map(idOf));
    const followingIds = new Set(arr(meFull.following).map(idOf));
    const mutualIds    = new Set([...followingIds].filter((id) => followersIds.has(id)));

    const friendsComputed = [...mutualIds].map((id) => allUsers.find(u => s(u._id) === id) || { _id: id, name: 'Friend' });
    setFriends(friendsComputed);

    const incomingIds = new Set(incomingList.map((r) => s(r._id)));
    const outgoing    = [...followingIds].filter((id) => !mutualIds.has(id) && !incomingIds.has(id));
    setOutgoingRequests(outgoing);

    const friendIdSet = new Set([...mutualIds]);
    const visible = filterFeedToFriendsAndMe(arr(feed.items), friendIdSet, meFull._id)
      .map((p) => normalizePost(p, meFull));
    setPosts(visible);
  }

  // ---------- Light polling (no spam on 401) ----------
  const startLivePolling = (meId) => {
    stopLivePolling();
    pollTimer.current = setInterval(() => { lightRefresh(meId).catch(() => {}); }, 6000);
  };
  const stopLivePolling = () => { if (pollTimer.current) clearInterval(pollTimer.current); pollTimer.current = null; };

  const lightRefresh = async (meIdParam) => {
    const meId = meIdParam || currentUser?._id; if (!meId) return;
    try {
      const [{ data: meNew }, incomingRes] = await Promise.all([
        api.get('/users/me'),
        api.get(`/users/${meId}/friend-requests`),
      ]);

      const incomingList = arr(incomingRes.data);

      const changed =
        arr(incomingList).map((r) => s(r._id)).sort().join(',') !== arr(friendRequests).map((r) => s(r._id)).sort().join(',') ||
        arr(meNew.followers).map(idOf).sort().join(',') !== arr(currentUser?.followers).map(idOf).sort().join(',') ||
        arr(meNew.following).map(idOf).sort().join(',') !== arr(currentUser?.following).map(idOf).sort().join(',');

      if (!changed) return;

      setCurrentUser(meNew);
      setFriendRequests(incomingList);

      const followersIds = new Set(arr(meNew.followers).map(idOf));
      const followingIds = new Set(arr(meNew.following).map(idOf));
      const mutualIds    = new Set([...followingIds].filter((id) => followersIds.has(id)));

      const friendsComputed = [...mutualIds].map((id) => users.find(u => s(u._id) === id) || { _id: id, name: 'Friend' });
      setFriends(friendsComputed);

      const incomingIds = new Set(incomingList.map((r) => s(r._id)));
      const outgoing    = [...followingIds].filter((id) => !mutualIds.has(id) && !incomingIds.has(id));
      setOutgoingRequests(outgoing);

      // immediately hide posts from non-friends after changes
      const allowed = new Set([...mutualIds, s(meId)]);
      setPosts((prev) => prev.filter((p) => allowed.has(s(p.author?._id || p.author))));
    } catch (e) {
      // Stop polling on auth loss to avoid console spam
      if (e?.response?.status === 401 && !authMuted) {
        stopLivePolling();
        setAuthMuted(true);
        // Optional: route to login
        // navigate('/welcome');
      }
    }
  };

  // ---------- Social actions ----------
  const acceptRequest = async (senderId) => {
    try { await api.post(`/users/${senderId}/follow`); await lightRefresh(); }
    catch (e) { alert(e?.response?.data?.message || 'Could not accept request'); }
  };
  const sendFriendRequest = async (targetId) => {
    try { await api.post(`/users/${targetId}/follow`); await lightRefresh(); }
    catch (e) { alert(e?.response?.data?.message || 'Could not send request'); }
  };
  const cancelFriendRequest = async (targetId) => {
    if (!window.confirm('Cancel friend request?')) return;
    try { await api.post(`/users/${targetId}/unfollow`); await lightRefresh(); }
    catch (e) { alert(e?.response?.data?.message || 'Could not cancel request'); }
  };
  const removeFriend = async (friendId) => {
    try {
      await api.post(`/users/${friendId}/unfollow`);
      setPosts((prev) => prev.filter((p) => s(idOf(p.author)) !== s(friendId)));
      await lightRefresh();
    } catch (e) {
      alert(e?.response?.data?.message || 'Could not remove friend');
    }
  };

  // ---------- Post actions ----------
  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) setPreview(URL.createObjectURL(file));
  };

  const handlePost = async (e) => {
    e.preventDefault(); if (!newPost.trim()) return;
    const payload = { text: newPost, imageUrl: preview || '' };
    try {
      const { data } = await api.post('/posts', payload);
      const normalized = normalizePost(data, currentUser);
      setNewPost(''); setPreview(null);
      setPosts((prev) => [normalized, ...prev]);
    } catch (e2) {
      alert(e2?.response?.data?.message || 'Could not create post');
    }
  };

  const toggleLike = async (postId) => {
    setPosts((prev) =>
      prev.map((p) =>
        p._id === postId ? { ...p, likedByMe: !p.likedByMe, likes: p.likes + (p.likedByMe ? -1 : 1) } : p
      )
    );
    try {
      const { data } = await api.post(`/posts/${postId}/like`);
      if (data && typeof data.likes === 'number') {
        setPosts((prev) => prev.map((p) => (p._id === postId ? { ...p, likes: data.likes, likedByMe: !!data.liked } : p)));
      }
    } catch {
      // revert on failure
      setPosts((prev) =>
        prev.map((p) =>
          p._id === postId ? { ...p, likedByMe: !p.likedByMe, likes: p.likes + (p.likedByMe ? -1 : 1) } : p
        )
      );
    }
  };

  // ✅ matches your router: POST /posts/:id/comment
  const addComment = async (postId) => {
    const text = (commentInputs[postId] || '').trim();
    if (!text) return;

    // optimistic add
    const tempId = `temp-${Math.random().toString(36).slice(2)}`;
    const optimistic = {
      _id: tempId,
      author: { _id: currentUser?._id, name: currentUser?.name, avatar: getAvatar(currentUser) },
      text,
      createdAt: Date.now(),
    };
    setPosts((prev) => prev.map((p) => (p._id === postId ? { ...p, comments: [...p.comments, optimistic] } : p)));
    setCommentInputs((m) => ({ ...m, [postId]: '' }));

    try {
      const { data } = await api.post(`/posts/${postId}/comment`, { text });
      setPosts((prev) =>
        prev.map((p) => {
          if (p._id !== postId) return p;

          // Server returns the created comment
          if (data && (data.text || data.author)) {
            const newComment = {
              _id: data._id || tempId,
              author: data.author?.name ? data.author : optimistic.author,
              text: data.text || text,
              createdAt: data.createdAt || Date.now(),
            };
            return { ...p, comments: p.comments.map((c) => (c._id === tempId ? newComment : c)) };
          }

          // Or server returns the updated post with comments
          if (data && Array.isArray(data.comments)) {
            const norm = normalizePost(data, currentUser);
            return { ...p, comments: norm.comments };
          }

          return p;
        })
      );
    } catch (e) {
      // If auth lost, stop polling noise and suggest login
      if (e?.response?.status === 401 && !authMuted) {
        stopLivePolling();
        setAuthMuted(true);
        alert('Session expired. Please log in again to comment.');
        // navigate('/welcome'); // uncomment if you want automatic redirect
      }
      // remove optimistic
      setPosts((prev) =>
        prev.map((p) =>
          p._id === postId ? { ...p, comments: p.comments.filter((c) => c._id !== tempId) } : p
        )
      );
    }
  };

  const beginEditPost = (p) => { setEditingPostId(p._id); setEditText(p.text); };
  const cancelEditPost = () => { setEditingPostId(null); setEditText(''); };
  const saveEditPost = async (postId) => {
    const text = editText.trim(); if (!text) return;
    setPosts((prev) => prev.map((p) => (p._id === postId ? { ...p, text } : p)));
    setEditingPostId(null);
    try { await api.patch(`/posts/${postId}`, { text }); }
    catch { alert('Could not update post'); }
  };
  const deletePost = async (postId) => {
    if (!window.confirm('Delete this post?')) return;
    const prev = posts;
    setPosts((p) => p.filter((x) => x._id !== postId));
    try { await api.delete(`/posts/${postId}`); }
    catch { setPosts(prev); alert('Could not delete post'); }
  };

  // ---------- Derived sets ----------
  const friendIdSet   = new Set(friends.map((f) => s(f._id)));
  const incomingIdSet = new Set(friendRequests.map((r) => s(r._id)));
  const outgoingIdSet = new Set(outgoingRequests.map(s));

  useEffect(() => { setFriendMenuFor(null); }, [users.length, friends.length, friendRequests.length, outgoingRequests.length]);

  // If friends change (e.g., unfriended), hide removed users' posts instantly
  useEffect(() => {
    if (!currentUser?._id) return;
    const allowed = new Set([...friends.map((f) => s(f._id)), s(currentUser._id)]);
    setPosts((prev) => prev.filter((p) => allowed.has(s(idOf(p.author)))));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [friends, currentUser?._id]);

  return (
    <div className="min-h-screen">
      {/* Weather hero */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-4 sm:pt-8">
        <WeatherHero city={currentUser?.city} />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
          <Link to="/profile" className="bg-[#e8f4e1] hover:opacity-90 transition rounded-lg p-3 text-center font-medium">Profile</Link>
          <Link to="/messages" className="bg-[#e1f0ff] hover:opacity-90 transition rounded-lg p-3 text-center font-medium">Messages</Link>
          <Link to="/notifications" className="bg-[#fff1cc] hover:opacity-90 transition rounded-lg p-3 text-center font-medium">Notifications</Link>
          <Link to="/explore" className="bg-[#f2e9ff] hover:opacity-90 transition rounded-lg p-3 text-center font-medium">Explore</Link>
        </div>
      </section>

      {/* Action tiles */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 mt-6">
        <ActionTiles />
      </section>

      {/* Main content — NO inner scrollbars, mobile-first stack */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 grid grid-cols-1 md:grid-cols-[1fr_320px] gap-8">
        {/* Posts column */}
        <section className="space-y-6">
          {/* Composer */}
          <form onSubmit={handlePost} className="bg-white p-4 rounded shadow space-y-2">
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center overflow-hidden">
                {getAvatar(currentUser)
                  ? <img src={getAvatar(currentUser)} alt="me" className="w-full h-full object-cover" />
                  : <span className="font-bold text-[#2f4235]">{s(currentUser?.name)[0] || '?'}</span>}
              </div>
              <textarea
                rows="3"
                placeholder="Share something..."
                className="flex-1 p-2 border rounded resize-none text-sm"
                value={newPost}
                onChange={(e) => setNewPost(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-3">
              <input type="file" accept="image/*" onChange={handleImageChange} />
              <button type="submit" className="bg-[#d4e7ba] px-4 py-2 rounded font-semibold text-sm">Post</button>
            </div>
            {preview && <img src={preview} alt="Preview" className="w-full h-48 object-cover rounded" />}
          </form>

          <h2 className="text-xl font-semibold">Posts</h2>

          {posts.length === 0 ? (
            <p className="text-gray-500">No posts yet.</p>
          ) : (
            posts.map((post) => {
              const authorId = s(idOf(post.author));
              const authorName = post.author?.name || usersById.get(authorId)?.name || 'Unknown';
              const avatar = getAvatar(post.author);
              const mine = post.mine || authorId === s(currentUser?._id);

              return (
                <article key={post._id} className="bg-white p-4 rounded-lg shadow space-y-3">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center">
                        {avatar
                          ? <img src={avatar} alt={authorName} className="w-full h-full object-cover" />
                          : <span className="font-bold text-[#2f4235]">{authorName[0] || '?'}</span>}
                      </div>
                      <div>
                        <div className="font-semibold">{authorName}</div>
                        <div className="text-xs text-gray-500">{new Date(post.createdAt).toLocaleString()}</div>
                      </div>
                    </div>

                    {/* Menu */}
                    {mine && editingPostId !== post._id && (
                      <div className="relative">
                        <button className="text-xs px-2 py-1 rounded border" onClick={() => { setEditingPostId(post._id); setEditText(post.text); }}>
                          Edit
                        </button>
                        <button className="text-xs px-2 py-1 rounded border ml-2 text-red-600" onClick={() => deletePost(post._id)}>
                          Delete
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Body */}
                  {editingPostId === post._id ? (
                    <div className="space-y-2">
                      <textarea className="w-full p-2 border rounded text-sm" rows={3} value={editText} onChange={(e) => setEditText(e.target.value)} />
                      <div className="flex gap-2">
                        <button className="bg-[#d4e7ba] px-3 py-1 rounded text-sm" onClick={() => saveEditPost(post._id)}>Save</button>
                        <button className="px-3 py-1 rounded text-sm border" onClick={() => { setEditingPostId(null); setEditText(''); }}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {post.text && <p className="text-sm whitespace-pre-wrap">{post.text}</p>}
                      {post.imageUrl && (
                        <img src={post.imageUrl} alt="Post" className="w-full rounded" onError={(e) => (e.currentTarget.style.display = 'none')} />
                      )}
                    </>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-4 pt-1">
                    <button
                      className={`text-sm ${post.likedByMe ? 'text-red-600 font-semibold' : 'text-gray-700'}`}
                      onClick={() => toggleLike(post._id)}
                    >
                      ❤️ {post.likes || 0}
                    </button>
                    <div className="text-sm text-gray-500">💬 {post.comments?.length || 0}</div>
                  </div>

                  {/* Comments */}
                  <div className="space-y-2 pt-1">
                    {arr(post.comments).map((c) => {
                      const cName = c.author?.name || usersById.get(s(idOf(c.author)))?.name || 'Unknown';
                      const cAvatar = getAvatar(c.author);
                      return (
                        <div key={c._id} className="flex items-start gap-2">
                          <div className="w-8 h-8 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center">
                            {cAvatar
                              ? <img src={cAvatar} alt={cName} className="w-full h-full object-cover" />
                              : <span className="text-xs font-bold text-[#2f4235]">{cName[0] || '?'}</span>}
                          </div>
                          <div className="flex-1 bg-gray-50 rounded px-3 py-2">
                            <div className="text-xs font-semibold">{cName}</div>
                            <div className="text-sm">{c.text}</div>
                            <div className="text-[10px] text-gray-500 mt-1">{new Date(c.createdAt).toLocaleString()}</div>
                          </div>
                        </div>
                      );
                    })}

                    {/* Add comment */}
                    <div className="flex items-center gap-2 mt-2">
                      <input
                        className="flex-1 text-sm border rounded px-2 py-1"
                        placeholder="Write a comment…"
                        value={commentInputs[post._id] || ''}
                        onChange={(e) => setCommentInputs((m) => ({ ...m, [post._id]: e.target.value }))}
                      />
                      <button className="text-sm px-3 py-1 rounded bg-blue-100" onClick={() => addComment(post._id)}>
                        Send
                      </button>
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </section>

        {/* Sidebar (stacks under posts on mobile; sticky only on md+) */}
        <aside className="space-y-6 md:sticky md:top-20 self-start">
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
              {users
                .filter((u) => u._id !== (currentUser?._id || ''))
                .map((user) => {
                  const id = s(user._id);
                  const isFriend   = new Set(friends.map((f) => s(f._id))).has(id);
                  const isIncoming = new Set(friendRequests.map((r) => s(r._id))).has(id);
                  const isOutgoing = new Set(outgoingRequests.map(s)).has(id);

                  return (
                    <li key={id} className="flex items-center gap-3 relative">
                      <div className="w-10 h-10 bg-green-100 rounded-full overflow-hidden flex items-center justify-center font-bold text-[#2f4235]">
                        {getAvatar(user)
                          ? <img src={getAvatar(user)} alt={s(user?.name)} className="w-full h-full object-cover" />
                          : <span>{s(user?.name)[0] || '?'}</span>}
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
                        <button className="text-xs bg-green-200 px-3 py-1 rounded" onClick={() => acceptRequest(id)}>Accept</button>
                      ) : isOutgoing ? (
                        <button className="text-xs bg-gray-300 px-3 py-1 rounded" onClick={() => cancelFriendRequest(id)} title="Cancel friend request">
                          Requested
                        </button>
                      ) : (
                        <button className="text-xs bg-yellow-200 px-3 py-1 rounded" onClick={() => sendFriendRequest(id)}>Add Friend</button>
                      )}
                    </li>
                  );
                })}
            </ul>
          </div>

          {/* Friends */}
          <div className="bg-[#e6f7ff] p-4 rounded-xl shadow">
            <h3 className="text-lg font-semibold mb-3">Your Friends</h3>
            {friends.length === 0 ? (
              <p className="text-sm text-gray-500">You haven't added any friends yet</p>
            ) : (
              <ul className="space-y-4">
                {friends.map((friend) => {
                  const id = s(friend._id);
                  return (
                    <li key={id} className="flex items-center gap-3 relative">
                      <div className="w-10 h-10 bg-blue-100 rounded-full overflow-hidden flex items-center justify-center font-bold text-[#2f4235]">
                        {getAvatar(friend)
                          ? <img src={getAvatar(friend)} alt={s(friend?.name)} className="w-full h-full object-cover" />
                          : <span>{s(friend?.name)[0] || '?'}</span>}
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
                            <button className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50" onClick={() => setFriendMenuFor(null)} role="menuitem">
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
