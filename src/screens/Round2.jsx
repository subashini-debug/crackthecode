import React, { useState } from 'react';
import Timer from '../components/Timer';

export default function Round2({ challenge, endTime, onSubmit }) {
  const [answers, setAnswers] = useState({});

  const handleChange = (id, value) => {
    setAnswers({ ...answers, [id]: value });
  };

  const handleSubmit = () => {
    onSubmit(answers);
  };

  return (
    <div className="card wide">
      <div className="round-header">
        <h2>💻 Round 2 — Code Breaker</h2>
        <Timer endTime={endTime} onExpire={handleSubmit} />
      </div>
      <div>
        {challenge.map((q, idx) => (
          <div key={q.id} className="question-block">
            <p className="q-text">{idx + 1}. {q.title}</p>
            <p>{q.prompt}</p>
            {q.codeTemplate && <pre className="code-template">{q.codeTemplate}</pre>}
            <div className="field">
              <label>Your answer / fixed line / code:</label>
              <textarea
                rows="3"
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #2a3556', background: '#0e1526', color: '#eef1f8', fontFamily: "'Courier New', monospace" }}
                value={answers[q.id] || ''}
                onChange={(e) => handleChange(q.id, e.target.value)}
              ></textarea>
            </div>
          </div>
        ))}
      </div>
      <button onClick={handleSubmit}>Submit Round 2</button>
    </div>
  );
}
