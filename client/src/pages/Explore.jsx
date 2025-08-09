import React, { useEffect, useState } from 'react';
import api from '../api/axios';

export default function Explore() {
  const [q, setQ] = useState('');
  const [res, setRes] = useState(null);
  const [trending, setTrending] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [communities, setCommunities] = useState([]);
  const [photos, setPhotos] = useState([]);

  async function search() {
    const { data } = await api.get('/search', { params: { q } });
    setRes(data);
  }

  useEffect(() => {
    async function boot() {
      const [tagsRes, sugRes, comRes] = await Promise.all([
        api.get('/posts/trending'),
        api.get('/users/suggestions'),
        api.get('/communities')
      ]);
      setTrending(tagsRes.data || []);
      setSuggestions(sugRes.data || []);
      setCommunities(comRes.data || []);

      // External pictorial data
      fetch('https://picsum.photos/v2/list?page=1&limit=12')
        .then(r => r.json())
        .then(j => setPhotos(Array.isArray(j) ? j : []))
        .catch(() => setPhotos([]));
    }
    boot();
  }, []);

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      <div className="bg-white p-4 rounded-xl shadow">
        <h2 className="text-xl font-semibold mb-3">Explore</h2>
        <div className="flex gap-2">
          <input className="border p-2 rounded flex-1" placeholder="Search users, communities, posts, #tags" value={q} onChange={e => setQ(e.target.value)} />
          <button onClick={search} className="border px-3 rounded">Search</button>
        </div>
        {res && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div>
              <h3 className="font-semibold mb-1">Users</h3>
              <ul className="text-sm space-y-1">{(res.users || []).map(u => <li key={u._id}>{u.name} • {u.city}</li>)}</ul>
            </div>
            <div>
              <h3 className="font-semibold mb-1">Posts</h3>
              <ul className="text-sm space-y-1">{(res.posts || []).map(p => <li key={p._id}>{(p.text || '').slice(0, 80)}</li>)}</ul>
            </div>
            <div>
              <h3 className="font-semibold mb-1">Communities</h3>
              <ul className="text-sm space-y-1">{(res.communities || []).map(c => <li key={c._id}>{c.name}</li>)}</ul>
            </div>
          </div>
        )}
      </div>

      {/* Visual grid */}
      <section className="bg-white p-4 rounded-xl shadow">
        <h3 className="font-semibold mb-3">From around the world</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {photos.map(p => (
            <a key={p.id} href={p.url} target="_blank" rel="noreferrer" className="block rounded overflow-hidden">
              <img src={`https://picsum.photos/id/${p.id}/400/300`} alt={p.author} className="w-full h-36 object-cover hover:opacity-90 transition" />
              <div className="text-xs text-gray-600 mt-1">by {p.author}</div>
            </a>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <section className="bg-white p-4 rounded-xl shadow">
          <h3 className="font-semibold mb-2">Trending Hashtags</h3>
          <ul className="space-y-1 text-sm">
            {trending.map(t => (
              <li key={t.tag} className="flex justify-between">
                <span>#{t.tag.replace(/^#/, '')}</span>
                <span className="text-gray-500">{t.count}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="bg-white p-4 rounded-xl shadow">
          <h3 className="font-semibold mb-2">People you may know</h3>
          <ul className="space-y-2 text-sm">
            {suggestions.map(u => (
              <li key={u._id} className="flex items-center justify-between">
                <span>{u.name} • {u.city || '—'}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="bg-white p-4 rounded-xl shadow">
          <h3 className="font-semibold mb-2">Communities</h3>
          <ul className="space-y-1 text-sm">
            {communities.map(c => <li key={c._id}>{c.name}</li>)}
          </ul>
        </section>
      </div>
    </div>
  );
}
