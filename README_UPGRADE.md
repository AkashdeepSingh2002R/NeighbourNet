# NeighbourNet Upgrade Pack (Drop-in)

This pack adds the features you requested without changing your existing layout.
It wires new endpoints and minimal client pages/hooks you can route to from your current UI.

## What’s inside
- **Auth**: register/login/logout, cookie-based JWT, `/users/me`, `/users/refresh`, strict rate-limit.
- **Profiles**: avatar, cover, bio, city/area/postal, links, privacy.
- **Posts**: text+image, edit/delete (soft), like, comments, bookmarks, trending hashtags.
- **Feeds**: global feed with cursor pagination (infinite-scroll ready).
- **Search**: users/communities/posts/hashtags.
- **Communities**: create/list/join/leave, feed.
- **Messaging**: Socket.io 1:1 with presence + typing hooks (server-side ready, simple client included).
- **Notifications**: like/comment/follow/message in-app list.
- **Security**: sane CORS, strict rate-limit, payload limits, cookie flags.
- **DX**: single Axios with safe refresh, React Query client.

## How to apply
1) Backup your project.
2) Copy **server/** files over your existing `server/` (keep your `.env`, add any new vars from `.env.example`).
3) Copy **client/src/** subfolders into your `client/src/`:
   - `api/axios.js`, `lib/queryClient.js`, `components/ProtectedRoute.jsx`,
     `hooks/useAuth.js`, and pages `Profile.jsx`, `Explore.jsx`, `Messages.jsx`, `Notifications.jsx`.
4) Add routes in your `client/src/App.jsx` (or wherever you define routes):
   ```jsx
   import { QueryClientProvider } from '@tanstack/react-query';
   import { queryClient } from './lib/queryClient';
   // pages
   import Profile from './pages/Profile';
   import Explore from './pages/Explore';
   import Messages from './pages/Messages';
   import Notifications from './pages/Notifications';
   // ...
   export default function App() {
     // keep your current layout
     return (
       <QueryClientProvider client={queryClient}>
         {/* your navbar / layout */}
         <Routes>
           {/* keep existing routes */}
           <Route path="/profile" element={<ProtectedRoute user={user}><Profile/></ProtectedRoute>} />
           <Route path="/explore" element={<Explore/>} />
           <Route path="/messages" element={<ProtectedRoute user={user}><Messages/></ProtectedRoute>} />
           <Route path="/notifications" element={<ProtectedRoute user={user}><Notifications/></ProtectedRoute>} />
         </Routes>
       </QueryClientProvider>
     )
   }
   ```
5) Client env: set `VITE_API_URL=http://localhost:5000/api`
6) Start backend, then frontend.

## Notes
- **Cloudinary**: client sends already-hosted URLs (`avatar`, `cover`, `imageUrl`). If you want signed uploads, we can add later.
- **Guarded routes**: `ProtectedRoute` uses your existing `user` state—no layout changes.
- **Infinite scroll**: `/api/posts/feed?cursor=<id>&limit=10`. Append items and pass the last `_id` as `cursor`.
- **Nearby**: use `city/area` fields to filter in the `/search` result for “nearby people”.
- **Moderation**: soft delete exists. Admin restore endpoint can be added easily.
- **Push**: not included; in-app notifications are ready.

Ping me when you want SMTP verification, media uploads, admin restore, or push.
