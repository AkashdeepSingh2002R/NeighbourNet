// client/src/api/auth.js
import api, { setAuth } from './axios';

export async function logout() {
  try {
    await api.post('/users/logout');
  } catch {}
  setAuth(null);
}
