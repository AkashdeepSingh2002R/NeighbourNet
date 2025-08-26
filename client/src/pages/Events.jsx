// client/src/pages/Events.jsx
import React, { useEffect, useMemo, useState } from 'react';
import api from '../api/axios';
import { Link } from 'react-router-dom';

const s = (v) => (v ?? '').toString();
const arr = (v) => (Array.isArray(v) ? v : []);

export default function Events() {
  const [me, setMe] = useState(null);

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState('');
  const [startsAt, setStartsAt] = useState(''); // ISO local: "2025-08-26T19:30"
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [ticketUrl, setTicketUrl] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  // ---------- bootstrap ----------
  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/users/me');
        setMe(data);
      } catch {
        try {
          const saved = JSON.parse(localStorage.getItem('user') || 'null');
          if (saved?._id) setMe(saved);
        } catch {}
      }
    })();
  }, []);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/events');
      setEvents(normalizeEvents(arr(data)));
    } catch {
      // fallback to localStorage
      try {
        const local = JSON.parse(localStorage.getItem('events') || '[]');
        setEvents(normalizeEvents(arr(local)));
      } catch {
        setEvents([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const normalizeEvents = (items) =>
    items
      .map(e => ({
        _id: e._id || cryptoRandom(),
        title: s(e.title),
        startsAt: e.startsAt || e.date || new Date().toISOString(),
        location: s(e.location),
        description: s(e.description),
        ticketUrl: s(e.ticketUrl),
        imageUrl: s(e.imageUrl),
        createdBy: e.createdBy || e.owner || null,
        goingCount: typeof e.goingCount === 'number' ? e.goingCount : (arr(e.attendees).length || 0),
        attendees: arr(e.attendees || []),
      }))
      .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());

  const cryptoRandom = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

  const upcoming = useMemo(
    () => events.filter(e => new Date(e.startsAt) >= new Date()),
    [events]
  );
  const past = useMemo(
    () => events.filter(e => new Date(e.startsAt) < new Date()),
    [events]
  );

  // ---------- create ----------
  const resetForm = () => {
    setTitle(''); setStartsAt(''); setLocation('');
    setDescription(''); setTicketUrl(''); setImageUrl('');
  };

  const createEvent = async (e) => {
    e.preventDefault();
    if (!title.trim() || !startsAt) return;

    const payload = {
      title: title.trim(),
      startsAt: new Date(startsAt).toISOString(),
      location: location.trim(),
      description: description.trim(),
      ticketUrl: ticketUrl.trim(),
      imageUrl: imageUrl.trim(),
    };

    setSaving(true);
    try {
      // try backend
      const { data } = await api.post('/events', payload);
      const normalized = normalizeEvents([data])[0];
      setEvents(prev => normalizeEvents([normalized, ...prev]));
      setShowForm(false);
      resetForm();
    } catch {
      // fallback to localStorage
      const local = {
        ...payload,
        _id: cryptoRandom(),
        createdBy: me?._id || null,
        goingCount: 0,
        attendees: [],
      };
      try {
        const existing = JSON.parse(localStorage.getItem('events') || '[]');
        const next = [local, ...existing];
        localStorage.setItem('events', JSON.stringify(next));
      } catch {}
      setEvents(prev => normalizeEvents([local, ...prev]));
      setShowForm(false);
      resetForm();
    } finally {
      setSaving(false);
    }
  };

  // ---------- RSVP ----------
  const amIGoing = (event) => {
    const myId = s(me?._id);
    if (!myId) return false;
    return arr(event.attendees).some(a => s(a?._id || a) === myId);
  };

  const toggleGoing = async (event) => {
    const myId = s(me?._id);
    if (!myId) return;

    // optimistic
    setEvents(prev =>
      prev.map(e => {
        if (e._id !== event._id) return e;
        const going = amIGoing(e);
        if (going) {
          return {
            ...e,
            attendees: e.attendees.filter(a => s(a?._id || a) !== myId),
            goingCount: Math.max(0, e.goingCount - 1),
          };
        }
        return {
          ...e,
          attendees: [...e.attendees, me],
          goingCount: e.goingCount + 1,
        };
      })
    );

    // backend, else localStorage
    try {
      await api.post(`/events/${event._id}/rsvp`);
    } catch {
      try {
        const all = JSON.parse(localStorage.getItem('events') || '[]');
        const next = all.map(e => {
          if ((e._id || '') !== event._id) return e;
          const going = arr(e.attendees).some(a => s(a?._id || a) === myId);
          if (going) {
            return {
              ...e,
              attendees: arr(e.attendees).filter(a => s(a?._id || a) !== myId),
              goingCount: Math.max(0, (e.goingCount || 0) - 1),
            };
          }
          return {
            ...e,
            attendees: [...arr(e.attendees), { _id: myId, name: s(me?.name) }],
            goingCount: (e.goingCount || 0) + 1,
          };
        });
        localStorage.setItem('events', JSON.stringify(next));
      } catch {}
    }
  };

  // ---------- UI ----------
  return (
    <div className="min-h-screen bg-[#f1f3ec] text-[#2f4235]">
      {/* Top hero like Home */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-6">
        <div className="bg-white/90 shadow rounded-xl p-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h1 className="text-2xl font-bold text-[#2f4430]">Events</h1>
            <div className="flex items-center gap-2">
              <button
                className="bg-[#d4e7ba] hover:opacity-90 px-4 py-2 rounded font-semibold text-sm"
                onClick={() => setShowForm(v => !v)}
              >
                {showForm ? 'Close' : 'Create Event'}
              </button>
            </div>
          </div>

          {showForm && (
            <form onSubmit={createEvent} className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="text-sm font-medium">Title</label>
                <input className="w-full border rounded px-3 py-2" value={title} onChange={e => setTitle(e.target.value)} placeholder="Community Picnic" required />
              </div>
              <div>
                <label className="text-sm font-medium">Date & Time</label>
                <input type="datetime-local" className="w-full border rounded px-3 py-2"
                  value={startsAt} onChange={e => setStartsAt(e.target.value)} required />
              </div>
              <div>
                <label className="text-sm font-medium">Location</label>
                <input className="w-full border rounded px-3 py-2" value={location} onChange={e => setLocation(e.target.value)} placeholder="Central Park, Toronto" />
              </div>
              <div className="sm:col-span-2">
                <label className="text-sm font-medium">Description</label>
                <textarea className="w-full border rounded px-3 py-2" rows={3}
                  value={description} onChange={e => setDescription(e.target.value)} placeholder="Bring snacks, games, and good vibes!" />
              </div>
              <div>
                <label className="text-sm font-medium">Ticket URL (optional)</label>
                <input className="w-full border rounded px-3 py-2" value={ticketUrl} onChange={e => setTicketUrl(e.target.value)} placeholder="https://tickets.example.com/abc" />
              </div>
              <div>
                <label className="text-sm font-medium">Image URL (optional)</label>
                <input className="w-full border rounded px-3 py-2" value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="https://images.example.com/event.jpg" />
              </div>
              <div className="sm:col-span-2 flex items-center gap-3">
                <button type="submit" disabled={saving} className="bg-[#2f4430] text-white px-4 py-2 rounded">
                  {saving ? 'Saving…' : 'Add Event'}
                </button>
                <button type="button" className="border px-4 py-2 rounded" onClick={() => { setShowForm(false); resetForm(); }}>
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </section>

      {/* Lists */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-8">
        {/* Upcoming */}
        <div>
          <h2 className="text-lg font-semibold mb-3">Upcoming</h2>
          {loading ? (
            <div className="text-gray-600">Loading…</div>
          ) : upcoming.length === 0 ? (
            <div className="bg-white rounded-xl shadow p-6 text-gray-600">No upcoming events.</div>
          ) : (
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {upcoming.map(ev => <EventCard key={ev._id} ev={ev} me={me} onToggleGoing={() => toggleGoing(ev)} />)}
            </ul>
          )}
        </div>

        {/* Past */}
        <div>
          <h2 className="text-lg font-semibold mb-3">Past</h2>
          {loading ? (
            <div className="text-gray-600">Loading…</div>
          ) : past.length === 0 ? (
            <div className="bg-white rounded-xl shadow p-6 text-gray-600">No past events.</div>
          ) : (
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {past.map(ev => <EventCard key={ev._id} ev={ev} me={me} onToggleGoing={() => toggleGoing(ev)} />)}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}

function EventCard({ ev, me, onToggleGoing }) {
  const date = new Date(ev.startsAt);
  const going = me ? arr(ev.attendees).some(a => s(a?._id || a) === s(me?._id)) : false;

  return (
    <li className="bg-white rounded-xl shadow p-4 flex gap-4">
      <div className="w-20 shrink-0 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
        {ev.imageUrl ? (
          <img src={ev.imageUrl} alt={ev.title} className="w-full h-full object-cover" />
        ) : (
          <span className="text-3xl">📅</span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-base font-semibold truncate">{ev.title}</h3>
          <span className="text-xs text-gray-500">{date.toLocaleString()}</span>
        </div>
        <div className="text-sm text-gray-600 mt-1">{ev.location || 'TBA'}</div>
        {ev.description && (
          <p className="text-sm mt-2 line-clamp-4 whitespace-pre-wrap">{ev.description}</p>
        )}

        <div className="flex flex-wrap items-center gap-2 mt-3">
          <button
            className={`px-3 py-1 rounded text-sm ${going ? 'bg-green-200' : 'bg-yellow-200'}`}
            onClick={onToggleGoing}
            title={going ? 'You are going' : 'RSVP'}
          >
            {going ? 'Going ✓' : 'I’m Interested'}
          </button>
          <span className="text-xs text-gray-600">👥 {ev.goingCount || 0}</span>

          {ev.ticketUrl && (
            <a
              href={ev.ticketUrl}
              target="_blank"
              rel="noreferrer"
              className="ml-auto px-3 py-1 rounded text-sm bg-[#2f4430] text-white"
            >
              Get Tickets
            </a>
          )}
        </div>
      </div>
    </li>
  );
}
