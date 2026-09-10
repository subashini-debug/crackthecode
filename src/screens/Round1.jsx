import React, { useState } from 'react';
import Timer from '../components/Timer';

export default function Round1({ challenge, endTime, onSubmit }) {
  const [answers, setAnswers] = useState({});

  const handleSelect = (questionId, optionKey) => {
    setAnswers({ ...answers, [questionId]: optionKey });
  };

  const handleSubmit = () => {
    onSubmit(answers);
  };

  return (
    <div className="card wide">
      <div className="round-header">
        <h2>🧠 Round 1 — AI Intelligence</h2>
        <Timer endTime={endTime} onExpire={handleSubmit} />
      </div>
      <div>
        {challenge.map((q, idx) => (
          <div key={q.id} className="question-block">
            <p className="q-text">{idx + 1}. {q.question}</p>
            <div className="options">
              {Object.entries(q.options).map(([key, val]) => {
                const isSelected = answers[q.id] === key;
                return (
                  <label key={key} className={`option-label ${isSelected ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name={q.id}
                      value={key}
                      checked={isSelected}
                      onChange={() => handleSelect(q.id, key)}
                    />
                    <span><b>{key}.</b> {val}</span>
                  </label>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <button onClick={handleSubmit}>Submit Round 1</button>
    </div>
  );
}
