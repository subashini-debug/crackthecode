import React, { useState } from 'react';
import Timer from '../components/Timer';

export default function Round4({ challenge, endTime, onSubmit }) {
  const [answers, setAnswers] = useState({ stage1: '', stage2: '', finalCode: '' });

  const handleChange = (field, value) => {
    setAnswers({ ...answers, [field]: value });
  };

  const handleSubmit = () => {
    onSubmit(answers);
  };

  return (
    <div className="card wide">
      <div className="round-header">
        <h2>🔐 Round 4 — Final Vault</h2>
        <Timer endTime={endTime} onExpire={handleSubmit} />
      </div>
      <div>
        <div className="question-block">
          <p className="q-text">Stage 1</p>
          <p>{challenge.stage1.instructions}</p>
          <pre className="code-template">{challenge.stage1.cipherText}</pre>
        </div>
        <div className="question-block">
          <p className="q-text">Stage 2</p>
          <p>{challenge.stage2.instructions}</p>
          <pre className="code-template">{challenge.stage2.cipherText}</pre>
        </div>
        <div className="question-block">
          <p className="q-text">Final Instructions</p>
          <p>{challenge.finalInstructions}</p>
        </div>
      </div>
      <div className="field">
        <label>Stage 1 decoded word:</label>
        <input type="text" placeholder="Answer" autoComplete="off" value={answers.stage1} onChange={(e) => handleChange('stage1', e.target.value)} />
      </div>
      <div className="field">
        <label>Stage 2 decoded phrase:</label>
        <input type="text" placeholder="Answer" autoComplete="off" value={answers.stage2} onChange={(e) => handleChange('stage2', e.target.value)} />
      </div>
      <div className="field">
        <label>Final vault code:</label>
        <input type="text" placeholder="Final code" autoComplete="off" value={answers.finalCode} onChange={(e) => handleChange('finalCode', e.target.value)} />
      </div>
      <button onClick={handleSubmit}>Unlock Vault</button>
    </div>
  );
}
