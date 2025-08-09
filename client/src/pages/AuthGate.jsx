import { useState } from 'react';
import api from '../api/axios';

export default function AuthGate({ onAuthed }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const register = async (e) => {
    e.preventDefault();
    await api.post('/users/register', { name, email, password });
    onAuthed();
  };
  const login = async (e) => {
    e.preventDefault();
    await api.post('/users/login', { email, password });
    onAuthed();
  };

  return (
    <div className="max-w-md mx-auto p-4 border rounded">
      <h2 className="text-xl font-semibold mb-2">Welcome</h2>
      <form className="space-y-2">
        <input className="w-full border p-2" placeholder="Name (register)" value={name} onChange={e=>setName(e.target.value)} />
        <input className="w-full border p-2" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
        <input className="w-full border p-2" placeholder="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
        <div className="flex gap-2">
          <button onClick={register} className="px-3 py-2 border rounded">Register</button>
          <button onClick={login} className="px-3 py-2 border rounded">Login</button>
        </div>
      </form>
    </div>
  );
}
