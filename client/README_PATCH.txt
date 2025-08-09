NeighbourNet Pro v1 — CLIENT patch-only

Apply these files on top of your existing /client folder.
- Overwrite existing files with the same names
- Add new ones if missing

Changed/New files:
- .env.example (VITE_API_URL)
- src/api/axios.js (shared axios with auto-refresh and withCredentials)
- src/context/AuthContext.jsx (new)
- src/components/ProtectedRoute.jsx (new)
- src/main.jsx (wrap in <AuthProvider>)
- src/pages/LandingLogin.jsx (use shared api + relative paths)
- src/pages/Home.jsx (use shared api + relative paths)
- src/pages/Communities.jsx (use shared api + relative paths)
- src/pages/CommunityDetail.jsx (use shared api + relative paths)

After patch:
npm i
npm run dev
