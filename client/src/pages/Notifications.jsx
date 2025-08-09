import React, { useEffect, useState } from 'react';
import api from '../api/axios';

export default function Notifications() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const { data } = await api.get('/notifications');
      setItems(data || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  return (
    <div className="max-w-3xl mx-auto p-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Notifications</h2>
        <button className="border px-2 py-1 rounded" onClick={() => api.post('/notifications/read-all').then(load)}>
          Mark all read
        </button>
      </div>

      {loading ? (
        <div className="mt-4 text-gray-600">Loading…</div>
      ) : items.length === 0 ? (
        <div className="mt-6 bg-white rounded-xl shadow p-6 text-center text-gray-600">
          You’re all caught up 🎉
        </div>
      ) : (
        <ul className="mt-3 space-y-2">
          {items.map(n => (
            <li key={n._id} className="bg-white p-3 rounded-xl shadow flex items-center gap-3">
              <div className="text-lg">
                {n.type === 'like' && '👍'}
                {n.type === 'comment' && '💬'}
                {n.type === 'follow' && '➕'}
                {n.type === 'message' && '✉️'}
              </div>
              <div className="flex-1">
                <div className="text-sm">
                  <span className="font-medium">{n.from?.name || 'Someone'}</span>{' '}
                  {n.type === 'like' && 'liked your post'}
                  {n.type === 'comment' && 'commented on your post'}
                  {n.type === 'follow' && 'started following you'}
                  {n.type === 'message' && 'sent you a message'}
                </div>
                <div className="text-xs text-gray-500">{new Date(n.createdAt).toLocaleString()}</div>
              </div>
              {!n.read && <span className="text-[10px] px-2 py-1 bg-blue-100 rounded">NEW</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
