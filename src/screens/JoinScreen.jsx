import React, { useState } from 'react';
import { api, API_BASE } from '../api';

export default function JoinScreen({ setTeamState }) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handleJoin = async () => {
    setError('');
    if (!name.trim()) {
      setError('Please enter a team name.');
      return;
    }
    try {
      const data = await api('/api/team/join', { method: 'POST', body: JSON.stringify({ teamName: name.trim() }) });
      setTeamState({
        teamId: data.teamId,
        teamToken: data.teamToken,
        teamName: data.teamName,
      });
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div className="card">
      <h1>🔐 CRACK THE CODE</h1>
      <p className="sub">Enter your team name to join the event.</p>

      {!API_BASE ? (
        <div className="error" style={{ marginBottom: 12 }}>
          ⚠️ Backend URL not configured. Set <code>VITE_API_BASE</code> in this app's
          Vercel Environment Variables to your Render backend URL, then redeploy.
        </div>
      ) : null}

      <input
        type="text"
        placeholder="Team name"
        maxLength="40"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
      />
      <div className="error">{error}</div>
      <button onClick={handleJoin} disabled={!API_BASE}>Join Event</button>
      <p className="hint">Your join is private — only the event admin can see who has joined. Other teams won't see you.</p>
    </div>
  );
}
