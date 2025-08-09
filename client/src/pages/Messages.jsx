import React, { useEffect, useMemo, useRef, useState } from 'react';
import api, { getSocketBase } from '../api/axios';
import { io } from 'socket.io-client';
import { Link } from 'react-router-dom';

export default function Messages() {
  const [me, setMe] = useState(null);
  const [friends, setFriends] = useState([]);
  const [withUser, setWithUser] = useState('');
  const [text, setText] = useState('');
  const [items, setItems] = useState([]);
  const socketRef = useRef(null);

  useEffect(() => {
    api.get('/users/me').then(({ data }) => setMe(data)).catch(() => setMe(null));
  }, []);

  useEffect(() => {
    if (!me?._id) return;
    api.get(`/users/${me._id}/friends`).then(({ data }) => setFriends(data || []));
  }, [me?._id]); // eslint-disable-line

  // Connect socket when a chat is selected
  useEffect(() => {
    if (!withUser) return;
    const base = getSocketBase();
    const s = io(base || 'http://localhost:5000', {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      auth: { userId: me?._id || undefined }
    });
    socketRef.current = s;

    s.on('message:new', (msg) => {
      if (msg.from === withUser || msg.to === withUser) {
        setItems((prev) => [...prev, msg]);
      }
    });

    (async () => {
      const { data } = await api.get('/messages', { params: { withUser } });
      setItems(data);
    })();

    return () => s.disconnect();
  }, [withUser, me?._id]); // eslint-disable-line

  const friendName = useMemo(
    () => friends.find(f => f._id === withUser)?.name || '',
    [friends, withUser]
  );

  async function send(e) {
    e.preventDefault();
    if (!withUser || !text.trim()) return;
    await api.post('/messages', { to: withUser, text });
    setText('');
    const { data } = await api.get('/messages', { params: { withUser } });
    setItems(data);
  }

  if (!me) return <div className="max-w-5xl mx-auto p-4">Please log in to use messages.</div>;

  const hasFriends = (friends || []).length > 0;

  return (
    <div className="max-w-5xl mx-auto p-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Friends list / empty-state */}
        <aside className="bg-white rounded-xl shadow p-3">
          <h2 className="font-semibold mb-2">Chats</h2>
          {!hasFriends ? (
            <div className="text-sm text-gray-600">
              You don’t have any friends yet. <Link to="/explore" className="underline">Add friends</Link> to start chatting.
            </div>
          ) : (
            <ul className="space-y-1">
              {friends.map(f => (
                <li key={f._id}>
                  <button
                    className={`w-full text-left px-3 py-2 rounded ${withUser === f._id ? 'bg-blue-100' : 'hover:bg-gray-100'}`}
                    onClick={() => setWithUser(f._id)}
                  >
                    {f.name}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>

        {/* Chat panel */}
        <section className="md:col-span-2 bg-white rounded-xl shadow p-3 flex flex-col h-[70vh]">
          {!withUser ? (
            <div className="m-auto text-gray-600">Select a friend to start chatting.</div>
          ) : (
            <>
              <div className="border-b pb-2 mb-2 font-semibold">{friendName}</div>
              <div className="flex-1 overflow-y-auto space-y-2">
                {items.map((m) => (
                  <div key={m._id} className={`max-w-[70%] rounded px-3 py-2 ${m.from === withUser ? 'bg-gray-100' : 'bg-blue-100 ml-auto'}`}>
                    {m.text}
                  </div>
                ))}
              </div>
              <form onSubmit={send} className="pt-2 flex gap-2">
                <input className="border rounded p-2 flex-1" value={text} onChange={e => setText(e.target.value)} placeholder="Type a message…" />
                <button className="border rounded px-3">Send</button>
              </form>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
