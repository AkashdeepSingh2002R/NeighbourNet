NEIGHBOURNET — FIXED BUILD (Netlify + Render)

WHAT CHANGED
- Removed old server/controllers/authController.js (caused bcryptjs + JWT mismatches)
- Standardized routes to use controllers/userController.js
- Cookies: SameSite=None; Secure in production, trust proxy enabled
- CORS with credentials + allowlist via CLIENT_ORIGIN env
- Client now uses same-origin /api (and socket) via Netlify redirects
- Socket.io proxied through Netlify so cookies stay first‑party on mobile

ENV REQUIRED (Render server)
- NODE_ENV=production
- PORT=5000 (or your value)
- JWT_SECRET=<your secret>   (or JWT_ACCESS_SECRET / JWT_REFRESH_SECRET, consistently used)
- CLIENT_ORIGIN=https://<your-site>.netlify.app,https://<your-domain-if-any>

CLIENT ENV
- client/.env.production: VITE_API_URL=/api

INSTALL & RUN (local)
cd "nn tester/server"
npm install
npm run dev   # or npm start

cd "../client"
npm install
npm run dev   # local dev
npm run build # prod build for Netlify

NETLIFY
- Ensure client/public/_redirects is deployed and contains:
  /api/*        https://neighbournet-42ys.onrender.com/api/:splat    200
  /socket.io/*  https://neighbournet-42ys.onrender.com/socket.io/:splat 200
  /*            /index.html 200

REDEPLOY
- Render: redeploy server (clear build cache)
- Netlify: redeploy site
- On mobile: clear site data for your Netlify origin once, then login again
