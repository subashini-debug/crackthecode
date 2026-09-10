import React from 'react';

export default function WaitScreen({ teamName }) {
  return (
    <div className="card">
      <h2>✅ You're in, {teamName}!</h2>
      <p className="sub">Waiting for the admin to release the next round...</p>
      <div className="spinner"></div>
    </div>
  );
}
