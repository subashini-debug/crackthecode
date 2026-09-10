import React from 'react';

export default function ResultScreen({ result }) {
  const { round, score, maxScore, completionTimeMs } = result;
  
  const formatMs = (ms) => {
    if (!ms) return '00:00';
    const totalSec = Math.floor(ms / 1000);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div className="card">
      <h2>Round {round} submitted!</h2>
      <div id="result-body">
        {round === 3 ? (
          <p>Great job! Your facilitator will award Rival Zone points live.</p>
        ) : (
          <>
            <div className="score-big">{score}{maxScore ? ' / ' + maxScore : ''}</div>
            <p>Completed in {formatMs(completionTimeMs)}</p>
          </>
        )}
      </div>
      <p className="sub">Waiting for the admin to release the next round...</p>
    </div>
  );
}
