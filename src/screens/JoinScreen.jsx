import React, { useState } from 'react';
import { api } from '../api';

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
      <input
        type="text"
        placeholder="Team name"
        maxLength="40"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
      />
      <div className="error">{error}</div>
      <button onClick={handleJoin}>Join Event</button>
      <p className="hint">Your join is private — only the event admin can see who has joined. Other teams won't see you.</p>
    </div>
  );
}
