import React from 'react';
import Timer from '../components/Timer';

export default function Round3({ challenge, endTime, onSubmit }) {
  const handleSubmit = () => {
    onSubmit({});
  };

  return (
    <div className="card wide">
      <div className="round-header">
        <h2>⚔️ Round 3 — Rival Zone</h2>
        <Timer endTime={endTime} onExpire={handleSubmit} />
      </div>
      <p className="sub">This round is run live by your facilitator. Watch for Shield 🛡️ / Scanner 🔎 / Boost ⚡ / Trap 🪤 power-up challenges — the admin will award points directly.</p>
      <div>
        {challenge && challenge.length > 0 ? (
          challenge.map((p, idx) => (
            <div key={idx} className="power-card"><b>⚡ Power Challenge:</b> {p.prompt}</div>
          ))
        ) : (
          <p className="sub">Follow your facilitator's instructions for this round.</p>
        )}
      </div>
      <button onClick={handleSubmit}>Mark Round 3 Complete</button>
    </div>
  );
}
