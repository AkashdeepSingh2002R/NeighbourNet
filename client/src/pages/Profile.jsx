import React, { useEffect, useMemo, useRef, useState } from "react";
import api from "../api/axios";

/* ----------------------------- Helpers ----------------------------- */
async function uploadToCloudinary(file) {
  const { data: sig } = await api.get("/uploads/sign");
  const form = new FormData();
  form.append("file", file);
  form.append("api_key", sig.apiKey);
  form.append("timestamp", sig.timestamp);
  if (sig.folder) form.append("folder", sig.folder);
  form.append("signature", sig.signature);
  const endpoint = `https://api.cloudinary.com/v1_1/${sig.cloudName}/auto/upload`;
  const res = await fetch(endpoint, { method: "POST", body: form });
  if (!res.ok) throw new Error("Cloudinary upload failed");
  return res.json();
}

function dicebearUrl(name) {
  const seed = encodeURIComponent(name || "NeighbourNet");
  return `https://api.dicebear.com/7.x/initials/svg?seed=${seed}&backgroundType=gradientLinear&fontFamily=Arial`;
}

function isLikelyUrl(u) {
  if (!u || typeof u !== "string") return false;
  const s = u.trim();
  if (!s) return false;
  // reject literal "undefined"/"null"
  if (s === "undefined" || s === "null") return false;
  // basic http(s) check
  return /^https?:\/\/[^ ]+$/i.test(s);
}

const gradientClasses = "bg-gradient-to-r from-[#f8d878] to-[#f5ca4e]";

/* -------------------------------- Page -------------------------------- */
export default function Profile() {
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [errorVisible, setErrorVisible] = useState(true);

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState("overview");

  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [city, setCity] = useState("");
  const [area, setArea] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [links, setLinks] = useState([""]);
  const [avatar, setAvatar] = useState("");
  const [cover, setCover] = useState("");

  const [friends, setFriends] = useState([]);

  const avatarInputRef = useRef(null);
  const coverInputRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data } = await api.get("/users/me");
        if (!mounted) return;
        setMe(data || null);
        setName(data?.name || "");
        setBio(data?.bio || "");
        setCity(data?.city || "");
        setArea(data?.area || "");
        setPostalCode(data?.postalCode || "");
        setLinks(Array.isArray(data?.links) ? data.links : []);
        setAvatar(data?.avatar || "");
        setCover(data?.cover || "");
      } catch (e) {
        setError(e?.response?.data?.message || e.message || "Failed to load profile");
        setErrorVisible(true);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => (mounted = false);
  }, []);

  useEffect(() => {
    if (!me?._id) return;
    (async () => {
      try {
        const { data } = await api.get(`/users/${me._id}/friends`);
        setFriends(Array.isArray(data) ? data : []);
      } catch {}
    })();
  }, [me?._id]);

  // Only require core text fields; avatar/cover have defaults
  const needsUpdate = useMemo(() => {
    const n = name || me?.name;
    const b = bio || me?.bio;
    const c = city || me?.city;
    const a = area || me?.area;
    return !(n && b && c && a);
  }, [name, bio, city, area, me]);

  const stats = useMemo(
    () => ({
      posts: me?.postsCount ?? 0,
      communities: me?.communitiesCount ?? (me?.communities?.length || 0),
      friends: friends.length,
    }),
    [me, friends]
  );

  async function handleSave(e) {
    e?.preventDefault?.();
    setSaving(true);
    setError("");
    try {
      const payload = { name, bio, city, area, postalCode, links, avatar, cover };
      const { data } = await api.put("/users/me", payload);
      setMe(data);
      setEditing(false);
      setError("");
      setErrorVisible(false);
    } catch (e) {
      setError(e?.response?.data?.message || e.message || "Failed to save");
      setErrorVisible(true);
    } finally {
      setSaving(false);
    }
  }

  async function onAvatarPick(file) {
    if (!file) return;
    try {
      const up = await uploadToCloudinary(file);
      setAvatar(up.secure_url || up.url);
    } catch (e) {
      setError("Avatar upload failed: " + (e.message || "unknown error"));
      setErrorVisible(true);
    }
  }

  async function onCoverPick(file) {
    if (!file) return;
    try {
      const up = await uploadToCloudinary(file);
      setCover(up.secure_url || up.url);
    } catch (e) {
      setError("Cover upload failed: " + (e.message || "unknown error"));
      setErrorVisible(true);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f1f3ec] text-[#2f4235] grid place-items-center">
        <div className="animate-pulse text-sm">Loading profile…</div>
      </div>
    );
  }

  const displayName = name || me?.name || "Your Name";
  const displayCity = city || me?.city || "City";
  const displayArea = area || me?.area || "Area";

  const rawAvatar = (typeof avatar === "string" ? avatar.trim() : "") || (typeof me?.avatar === "string" ? me.avatar.trim() : "");
  const avatarSrc = isLikelyUrl(rawAvatar) ? rawAvatar : dicebearUrl(displayName);

  const rawCover = (typeof cover === "string" ? cover.trim() : "") || (typeof me?.cover === "string" ? me.cover.trim() : "");
  const coverSrc = isLikelyUrl(rawCover) ? rawCover : null;

  return (
    <div className="min-h-screen bg-[#f1f3ec] text-[#2f4235]">
      {/* Header: gradient base + optional cover image + actions */}
      <div className="relative w-full rounded-b-2xl overflow-visible">
        {/* Base gradient */}
        <div className={`w-full h-72 ${gradientClasses}`} />
        {/* Only render cover <img> if URL is valid */}
        {coverSrc && (
          <img
            src={coverSrc}
            alt="Cover"
            className="absolute inset-0 w-full h-72 object-cover"
            onError={(e) => {
              // if the image fails, hide it (keep gradient)
              e.currentTarget.style.display = "none";
            }}
          />
        )}
        {/* Change cover */}
        <button
          onClick={() => coverInputRef.current?.click()}
          className="absolute right-4 bottom-4 bg-white/85 hover:bg-white text-sm px-3 py-1.5 rounded shadow"
        >
          Change cover
        </button>
        <input
          ref={coverInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => onCoverPick(e.target.files?.[0])}
        />

        {/* Avatar + identity */}
        <div className="absolute -bottom-16 left-6 flex items-end gap-4 z-10">
          <button
            onClick={() => avatarInputRef.current?.click()}
            className="relative group rounded-full"
            title="Change avatar"
          >
            <img
              src={avatarSrc}
              alt="Avatar"
              className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg bg-white"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = dicebearUrl(displayName);
              }}
            />
            <span className="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/25 transition" />
            <span className="absolute bottom-1 left-1/2 -translate-x-1/2 text-xs text-white opacity-0 group-hover:opacity-100">
              Change
            </span>
          </button>
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => onAvatarPick(e.target.files?.[0])}
          />
          <div className="pb-2">
            <h1 className="text-3xl font-bold drop-shadow text-white">{displayName}</h1>
            <p className="text-white/95 text-sm">
              {displayCity}, {displayArea}
            </p>
          </div>
        </div>
      </div>

      {/* spacer for avatar overlap */}
      <div className="h-20" />

      <div className="max-w-6xl mx-auto px-6">
        {/* stats + action */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <Stat label="Posts" value={stats.posts} />
            <Stat label="Communities" value={stats.communities} />
            <Stat label="Friends" value={stats.friends} />
          </div>
          <button
            onClick={() => setEditing(true)}
            className="self-start md:self-auto px-4 py-2 rounded bg-[#bfe3bf] hover:bg-[#a9d7a9] text-[#2f4235]"
          >
            Edit profile
          </button>
        </div>

        {/* profile completion prompt */}
        {needsUpdate && (
          <div className="mt-6 bg-yellow-100 border border-yellow-300 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="font-semibold">Complete your profile</p>
              <p className="text-sm text-yellow-800">Add your bio, location, avatar, and cover.</p>
            </div>
            <button
              className="px-3 py-2 rounded bg-[#f8d878] hover:bg-[#f5ca4e] text-[#2f4235]"
              onClick={() => setEditing(true)}
            >
              Update now
            </button>
          </div>
        )}

        {/* error banner */}
        {error && errorVisible && (
          <div className="mt-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded p-3 flex items-start justify-between gap-4">
            <span>{error}</span>
            <button
              className="text-red-700/70 hover:text-red-900 text-xs"
              onClick={() => setErrorVisible(false)}
            >
              Dismiss
            </button>
          </div>
        )}

        {/* tabs */}
        <div className="mt-8">
          <div className="flex gap-6 overflow-x-auto">
            <TabButton active={tab === "overview"} onClick={() => setTab("overview")}>Overview</TabButton>
            <TabButton active={tab === "posts"} onClick={() => setTab("posts")}>Posts</TabButton>
            <TabButton active={tab === "media"} onClick={() => setTab("media")}>Media</TabButton>
            <TabButton active={tab === "friends"} onClick={() => setTab("friends")}>Friends</TabButton>
          </div>

          <div className="mt-4">
            {tab === "overview" && (
              <div className="bg-white rounded-2xl shadow p-6 space-y-4">
                <Section title="About">
                  <p className="whitespace-pre-line">
                    {bio || me?.bio || "Write something about yourself…"}
                  </p>
                </Section>

                <div className="grid sm:grid-cols-2 gap-4">
                  <CardRow icon="📍" label="Location" value={`${displayCity}, ${displayArea}`} />
                  <CardRow icon="📫" label="Postal Code" value={postalCode || me?.postalCode || "—"} />
                  {me?.email && <CardRow icon="✉️" label="Email" value={me.email} />}
                </div>

                {Array.isArray(links) && links.filter(Boolean).length > 0 && (
                  <Section title="Links">
                    <ul className="list-disc pl-5 space-y-1">
                      {links.filter(Boolean).map((l, i) => (
                        <li key={i}>
                          <a className="underline" href={l} target="_blank" rel="noreferrer">
                            {l}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </Section>
                )}
              </div>
            )}

            {tab === "posts" && <EmptyCard text="No posts yet." />}
            {tab === "media" && <EmptyCard text="No media yet — upload when you post!" />}

            {tab === "friends" && (
              <div className="bg-white rounded-2xl shadow p-6">
                {friends.length === 0 ? (
                  <EmptyCard text="No friends yet — find neighbours to follow." />
                ) : (
                  <ul className="divide-y">
                    {friends.map((f) => (
                      <li key={f._id} className="py-3 flex items-center gap-3">
                        <img
                          src={isLikelyUrl(f.avatar) ? f.avatar : dicebearUrl(f.name)}
                          alt={f.name}
                          className="w-10 h-10 rounded-full object-cover bg-white border"
                        />
                        <div className="flex-1">
                          <div className="font-medium">{f.name}</div>
                          <div className="text-xs opacity-70">
                            {[f.city, f.area].filter(Boolean).join(", ")}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/40 grid place-items-center z-50" role="dialog" aria-modal="true">
          <div className="bg-white rounded-2xl shadow-xl w-[95vw] max-w-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold">Edit profile</h3>
              <button className="text-sm px-2 py-1 rounded hover:bg-gray-100" onClick={() => setEditing(false)}>Close</button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <label className="flex flex-col gap-1">
                  <span className="text-sm font-medium">Name</span>
                  <input className="border rounded px-3 py-2" value={name} onChange={(e)=> setName(e.target.value)} placeholder="Your full name" />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-sm font-medium">City</span>
                  <input className="border rounded px-3 py-2" value={city} onChange={(e)=> setCity(e.target.value)} placeholder="City" />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-sm font-medium">Area</span>
                  <input className="border rounded px-3 py-2" value={area} onChange={(e)=> setArea(e.target.value)} placeholder="Neighbourhood / Area" />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-sm font-medium">Postal Code</span>
                  <input className="border rounded px-3 py-2" value={postalCode} onChange={(e)=> setPostalCode(e.target.value)} placeholder="e.g., M5V 2T6" />
                </label>
              </div>

              <label className="flex flex-col gap-1">
                <span className="text-sm font-medium">Bio</span>
                <textarea className="border rounded px-3 py-2 min-h-[100px]" value={bio} onChange={(e)=> setBio(e.target.value)} placeholder="Tell others about you…" />
              </label>

              <div>
                <span className="text-sm font-medium">Links</span>
                <div className="mt-2 space-y-2">
                  {links.map((l,i)=> (
                    <div className="flex gap-2" key={i}>
                      <input className="border rounded px-3 py-2 flex-1" value={l} onChange={(e)=> {
                        const copy=[...links]; copy[i]=e.target.value; setLinks(copy);
                      }} placeholder="https://example.com" />
                      <button type="button" className="px-3 py-2 rounded border" onClick={()=> setLinks(links.filter((_,idx)=> idx!==i))}>Remove</button>
                    </div>
                  ))}
                  <button type="button" className="px-3 py-2 rounded bg-[#bfe3bf]" onClick={()=> setLinks([...(links||[]), ""])}>Add link</button>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm font-medium mb-2">Avatar</p>
                  <div className="flex items-center gap-3">
                    <img src={avatar || dicebearUrl(name)} alt="avatar prev" className="w-16 h-16 rounded-full object-cover border" onError={(e)=>{e.currentTarget.onerror=null; e.currentTarget.src=dicebearUrl(name);}} />
                    <button type="button" className="px-3 py-2 rounded border" onClick={()=> avatarInputRef.current?.click()}>Upload</button>
                    <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={(e)=> onAvatarPick(e.target.files?.[0])} />
                  </div>
                </div>

                {/* Cover upload here also (optional quick access) */}
                <div>
                  <p className="text-sm font-medium mb-2">Cover</p>
                  <div className="flex items-center gap-3">
                    <div className={`w-28 h-16 rounded ${coverSrc ? "" : gradientClasses} overflow-hidden`}>
                      {coverSrc && <img src={coverSrc} alt="cover prev" className="w-full h-full object-cover" onError={(e)=>{e.currentTarget.style.display='none';}} />}
                    </div>
                    <button type="button" className="px-3 py-2 rounded border" onClick={()=> coverInputRef.current?.click()}>Upload</button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" className="px-4 py-2 rounded border" onClick={()=> setEditing(false)}>Cancel</button>
                <button type="submit" disabled={saving} className="px-4 py-2 rounded bg-[#f8d878] hover:bg-[#f5ca4e] text-[#2f4235]">
                  {saving ? "Saving…" : "Save changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------------------- UI components ---------------------------- */
function Stat({ label, value }) {
  return (
    <div className="bg-white rounded-xl shadow px-5 py-3 min-w-[7rem] text-center">
      <div className="text-xl font-semibold">{value}</div>
      <div className="text-xs opacity-70">{label}</div>
    </div>
  );
}
function TabButton({ active, onClick, children }) {
  return (
    <button
      className={`pb-2 text-sm ${active ? "font-semibold text-[#2f4235] border-b-2 border-[#2f4235]" : "text-[#2f4235]/70 hover:text-[#2f4235]"}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
function Section({ title, children }) {
  return (
    <div>
      <h4 className="font-semibold mb-2">{title}</h4>
      {children}
    </div>
  );
}
function CardRow({ icon, label, value }) {
  return (
    <div className="flex items-center gap-3 bg-[#f7f9f3] rounded-lg px-4 py-3">
      <span className="text-lg">{icon}</span>
      <div className="text-sm">
        <div className="font-medium">{label}</div>
        <div className="opacity-80">{value}</div>
      </div>
    </div>
  );
}
function EmptyCard({ text }) {
  return (
    <div className="bg-white rounded-2xl shadow p-10 text-center text-sm text-[#2f4235]/70">
      {text}
    </div>
  );
}
