const screens = {};
document.querySelectorAll('.screen').forEach(s => screens[s.id] = s);

function showScreen(id) {
  Object.values(screens).forEach(s => s.classList.remove('active'));
  screens[id].classList.add('active');
}

const state = {
  teamId: localStorage.getItem('ctc_teamId') || null,
  teamToken: localStorage.getItem('ctc_teamToken') || null,
  teamName: localStorage.getItem('ctc_teamName') || null,
  currentRound: 0,
  submittedRounds: new Set(),
  timers: {}
};

let socket = null;

async function api(path, opts = {}) {
  const headers = Object.assign({ 'Content-Type': 'application/json' }, opts.headers || {});
  if (state.teamToken) headers['x-team-token'] = state.teamToken;
  const res = await fetch(API_BASE + path, Object.assign({}, opts, { headers }));
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

// ---------- Join flow ----------

document.getElementById('join-btn').addEventListener('click', async () => {
  const name = document.getElementById('team-name-input').value.trim();
  const errEl = document.getElementById('join-error');
  errEl.textContent = '';
  if (!name) { errEl.textContent = 'Please enter a team name.'; return; }
  try {
    const data = await api('/api/team/join', { method: 'POST', body: JSON.stringify({ teamName: name }) });
    state.teamId = data.teamId;
    state.teamToken = data.teamToken;
    state.teamName = data.teamName;
    localStorage.setItem('ctc_teamId', state.teamId);
    localStorage.setItem('ctc_teamToken', state.teamToken);
    localStorage.setItem('ctc_teamName', state.teamName);
    initAfterJoin();
  } catch (e) {
    errEl.textContent = e.message;
  }
});

async function initAfterJoin() {
  document.getElementById('wait-team-name').textContent = state.teamName;
  connectSocket();
  await refreshState();
}

function connectSocket() {
  socket = io(API_BASE);
  socket.on('round-released', ({ round, startTime, endTime }) => {
    if (state.submittedRounds.has(round)) return;
    loadRound(round, startTime, endTime);
  });
  socket.on('round-closed', ({ round }) => {
    if (state.activeRound === round) {
      alert("Time's up for this round! Auto-submitting your current answers.");
      forceSubmitCurrentRound();
    }
  });
  socket.on('event-reset', () => {
    localStorage.clear();
    location.reload();
  });
}

async function refreshState() {
  try {
    const data = await api('/api/team/state');
    data.mySubmissions.forEach(s => state.submittedRounds.add(s.round));
    const event = data.event;
    // Find the highest released round not yet submitted
    let target = null;
    for (const r of [1, 2, 3, 4]) {
      if (event.rounds[r].released && !state.submittedRounds.has(r)) { target = r; break; }
    }
    if (event.currentRound === 4 && state.submittedRounds.has(4)) {
      showScreen('screen-finished');
      return;
    }
    if (target) {
      loadRound(target, event.rounds[target].startTime, event.rounds[target].endTime);
    } else {
      showScreen('screen-wait');
    }
  } catch (e) {
    showScreen('screen-wait');
  }
}

// ---------- Round loading ----------

async function loadRound(round, startTime, endTime) {
  state.activeRound = round;
  try {
    const data = await api(`/api/team/round/${round}`);
    if (data.alreadySubmitted) {
      state.submittedRounds.add(round);
      showScreen('screen-wait');
      return;
    }
    renderRound(round, data.challenge);
    startTimer(round, endTime);
    showScreen(`screen-round${round}`);
  } catch (e) {
    console.error(e);
    showScreen('screen-wait');
  }
}

function renderRound(round, challenge) {
  if (round === 1) renderRound1(challenge);
  if (round === 2) renderRound2(challenge);
  if (round === 3) renderRound3(challenge);
  if (round === 4) renderRound4(challenge);
}

function renderRound1(questions) {
  const container = document.getElementById('r1-questions');
  container.innerHTML = '';
  questions.forEach((q, idx) => {
    const block = document.createElement('div');
    block.className = 'question-block';
    block.innerHTML = `<p class="q-text">${idx + 1}. ${escapeHtml(q.question)}</p>
      <div class="options">
        ${Object.entries(q.options).map(([key, val]) => `
          <label class="option-label" data-key="${key}">
            <input type="radio" name="${q.id}" value="${key}" />
            <span><b>${key}.</b> ${escapeHtml(val)}</span>
          </label>
        `).join('')}
      </div>`;
    container.appendChild(block);
    block.querySelectorAll('.option-label').forEach(lbl => {
      lbl.addEventListener('click', () => {
        block.querySelectorAll('.option-label').forEach(l => l.classList.remove('selected'));
        lbl.classList.add('selected');
        lbl.querySelector('input').checked = true;
      });
    });
  });
}

document.getElementById('r1-submit').addEventListener('click', async () => {
  const container = document.getElementById('r1-questions');
  const answers = {};
  container.querySelectorAll('.question-block').forEach(block => {
    const checked = block.querySelector('input[type=radio]:checked');
    const name = block.querySelector('input[type=radio]').name;
    if (checked) answers[name] = checked.value;
  });
  await submitRound(1, answers);
});

function renderRound2(challenges) {
  const container = document.getElementById('r2-questions');
  container.innerHTML = '';
  challenges.forEach((q, idx) => {
    const block = document.createElement('div');
    block.className = 'question-block';
    block.innerHTML = `<p class="q-text">${idx + 1}. ${escapeHtml(q.title)}</p>
      <p>${escapeHtml(q.prompt)}</p>
      ${q.codeTemplate ? `<pre class="code-template">${escapeHtml(q.codeTemplate)}</pre>` : ''}
      <div class="field">
        <label>Your answer / fixed line / code:</label>
        <textarea data-id="${q.id}" rows="3" style="width:100%;padding:10px;border-radius:8px;border:1px solid #2a3556;background:#0e1526;color:#eef1f8;font-family:'Courier New',monospace;"></textarea>
      </div>`;
    container.appendChild(block);
  });
}

document.getElementById('r2-submit').addEventListener('click', async () => {
  const answers = {};
  document.querySelectorAll('#r2-questions textarea').forEach(ta => {
    answers[ta.dataset.id] = ta.value;
  });
  await submitRound(2, answers);
});

function renderRound3(powerChallenges) {
  const container = document.getElementById('r3-challenges');
  container.innerHTML = (powerChallenges || []).map(p => `
    <div class="power-card"><b>⚡ Power Challenge:</b> ${escapeHtml(p.prompt)}</div>
  `).join('') || '<p class="sub">Follow your facilitator\'s instructions for this round.</p>';
}

document.getElementById('r3-submit').addEventListener('click', async () => {
  await submitRound(3, {});
});

function renderRound4(v) {
  const container = document.getElementById('r4-content');
  container.innerHTML = `
    <div class="question-block">
      <p class="q-text">Stage 1</p>
      <p>${escapeHtml(v.stage1.instructions)}</p>
      <pre class="code-template">${escapeHtml(v.stage1.cipherText)}</pre>
    </div>
    <div class="question-block">
      <p class="q-text">Stage 2</p>
      <p>${escapeHtml(v.stage2.instructions)}</p>
      <pre class="code-template">${escapeHtml(v.stage2.cipherText)}</pre>
    </div>
    <div class="question-block">
      <p class="q-text">Final Instructions</p>
      <p>${escapeHtml(v.finalInstructions)}</p>
    </div>
  `;
}

document.getElementById('r4-submit').addEventListener('click', async () => {
  const answers = {
    stage1: document.getElementById('r4-stage1').value,
    stage2: document.getElementById('r4-stage2').value,
    finalCode: document.getElementById('r4-final').value
  };
  await submitRound(4, answers);
});

async function submitRound(round, answers) {
  try {
    const data = await api('/api/team/submit', { method: 'POST', body: JSON.stringify({ round, answers }) });
    state.submittedRounds.add(round);
    clearInterval(state.timers[round]);
    showResult(round, data);
  } catch (e) {
    alert(e.message);
  }
}

async function forceSubmitCurrentRound() {
  const round = state.activeRound;
  if (!round || state.submittedRounds.has(round)) return;
  let answers = {};
  if (round === 1) {
    document.querySelectorAll('#r1-questions .question-block').forEach(block => {
      const checked = block.querySelector('input[type=radio]:checked');
      const name = block.querySelector('input[type=radio]').name;
      if (checked) answers[name] = checked.value;
    });
  } else if (round === 2) {
    document.querySelectorAll('#r2-questions textarea').forEach(ta => { answers[ta.dataset.id] = ta.value; });
  } else if (round === 4) {
    answers = {
      stage1: document.getElementById('r4-stage1').value,
      stage2: document.getElementById('r4-stage2').value,
      finalCode: document.getElementById('r4-final').value
    };
  }
  await submitRound(round, answers);
}

function showResult(round, data) {
  document.getElementById('result-title').textContent = `Round ${round} submitted!`;
  const body = document.getElementById('result-body');
  if (round === 3) {
    body.innerHTML = `<p>Great job! Your facilitator will award Rival Zone points live.</p>`;
  } else {
    body.innerHTML = `<div class="score-big">${data.score}${data.maxScore ? ' / ' + data.maxScore : ''}</div>
      <p>Completed in ${formatMs(data.completionTimeMs)}</p>`;
  }
  showScreen('screen-result');
}

// ---------- Timer ----------

function startTimer(round, endTime) {
  clearInterval(state.timers[round]);
  const el = document.getElementById(`timer-${round}`);
  function tick() {
    const remaining = Math.max(0, endTime - Date.now());
    el.textContent = formatMs(remaining);
    el.classList.toggle('low', remaining < 60000);
    if (remaining <= 0) {
      clearInterval(state.timers[round]);
      if (!state.submittedRounds.has(round)) forceSubmitCurrentRound();
    }
  }
  tick();
  state.timers[round] = setInterval(tick, 1000);
}

function formatMs(ms) {
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
}

// ---------- Boot ----------

if (state.teamToken) {
  initAfterJoin();
} else {
  showScreen('screen-join');
}

// Periodic fallback poll in case a socket event is missed (e.g. reconnects)
setInterval(() => {
  if (state.teamToken && !state.activeRound) refreshState();
}, 5000);
