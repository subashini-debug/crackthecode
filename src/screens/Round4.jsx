import React, { useState } from 'react';
import Timer from '../components/Timer';

export default function Round4({ challenge, endTime, onSubmit }) {
  const [answers, setAnswers] = useState({ stage1: '', stage2: '', stage3: '', stage4: '', stage5: '', finalCode: '' });
  const handleChange = (field, value) => setAnswers(prev => ({ ...prev, [field]: value }));
  const handleSubmit = () => onSubmit(answers);

  const stages = [1, 2, 3, 4, 5];

  return (
    <div className="card wide">
      <div className="round-header">
        <h2>🔐 Round 4 — Final Vault</h2>
        <Timer endTime={endTime} onExpire={handleSubmit} />
      </div>
      <div>
        {stages.map(n => (
          <div className="question-block" key={n}>
            <p className="q-text">Stage {n}</p>
            <p>{challenge[`stage${n}`].instructions}</p>
            <pre className="code-template">{challenge[`stage${n}`].cipherText}</pre>
            <div className="field">
              <label>Decoded answer:</label>
              <input
                type="text"
                placeholder={`Stage ${n} answer`}
                autoComplete="off"
                value={answers[`stage${n}`]}
                onChange={e => handleChange(`stage${n}`, e.target.value)}
              />
            </div>
          </div>
        ))}
        <div className="question-block">
          <p className="q-text">Final Instructions</p>
          <p>{challenge.finalInstructions}</p>
        </div>
      </div>
      <div className="field">
        <label>Final vault code:</label>
        <input
          type="text"
          inputMode="numeric"
          maxLength="4"
          placeholder="4-digit code"
          autoComplete="off"
          value={answers.finalCode}
          onChange={e => handleChange('finalCode', e.target.value.replace(/\D/g, '').slice(0, 4))}
        />
      </div>
      <button onClick={handleSubmit}>Unlock Vault</button>
    </div>
  );
}
