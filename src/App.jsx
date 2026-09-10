import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { api, API_BASE } from './api';

import JoinScreen from './screens/JoinScreen';
import WaitScreen from './screens/WaitScreen';
import Round1 from './screens/Round1';
import Round2 from './screens/Round2';
import Round3 from './screens/Round3';
import Round4 from './screens/Round4';
import ResultScreen from './screens/ResultScreen';
import FinishedScreen from './screens/FinishedScreen';

export default function App() {
  const [teamState, setTeamState] = useState(() => ({
    teamId: localStorage.getItem('ctc_teamId') || null,
    teamToken: localStorage.getItem('ctc_teamToken') || null,
    teamName: localStorage.getItem('ctc_teamName') || null,
  }));

  const [gameState, setGameState] = useState({
    activeRound: null,
    roundData: null,
    endTime: null,
    submittedRounds: new Set(),
    isFinished: false,
    result: null,
  });

  const socketRef = useRef(null);

  useEffect(() => {
    if (teamState.teamId) localStorage.setItem('ctc_teamId', teamState.teamId);
    if (teamState.teamToken) localStorage.setItem('ctc_teamToken', teamState.teamToken);
    if (teamState.teamName) localStorage.setItem('ctc_teamName', teamState.teamName);
  }, [teamState]);

  useEffect(() => {
    if (teamState.teamToken) {
      socketRef.current = io(API_BASE);
      
      socketRef.current.on('round-released', ({ round, startTime, endTime }) => {
        setGameState(prev => {
          if (prev.submittedRounds.has(round)) return prev;
          loadRound(round, endTime, prev);
          return prev;
        });
      });
      
      socketRef.current.on('round-closed', ({ round }) => {
        setGameState(prev => {
          if (prev.activeRound === round) {
            alert("Time's up for this round! Timer component will auto-submit your answers.");
          }
          return prev;
        });
      });
      
      socketRef.current.on('event-reset', () => {
        localStorage.clear();
        window.location.reload();
      });

      refreshState();

      const intervalId = setInterval(() => {
        setGameState(prev => {
          if (teamState.teamToken && !prev.activeRound && !prev.result && !prev.isFinished) {
            refreshState(prev);
          }
          return prev;
        });
      }, 5000);

      return () => {
        socketRef.current.disconnect();
        clearInterval(intervalId);
      };
    }
  }, [teamState.teamToken]);

  const refreshState = async (currentGameState = gameState) => {
    try {
      const data = await api('/api/team/state', {}, teamState.teamToken);
      const submitted = new Set(data.mySubmissions.map(s => s.round));
      const event = data.event;
      
      let target = null;
      for (const r of [1, 2, 3, 4]) {
        if (event.rounds[r].released && !submitted.has(r)) { target = r; break; }
      }
      
      if (event.currentRound === 4 && submitted.has(4)) {
        setGameState(prev => ({ ...prev, isFinished: true, submittedRounds: submitted, activeRound: null, result: null }));
        return;
      }
      
      if (target) {
        loadRound(target, event.rounds[target].endTime, { ...currentGameState, submittedRounds: submitted });
      } else {
        setGameState(prev => ({ ...prev, activeRound: null, submittedRounds: submitted }));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadRound = async (round, endTime, currentGameState) => {
    try {
      const data = await api(`/api/team/round/${round}`, {}, teamState.teamToken);
      if (data.alreadySubmitted) {
        setGameState(prev => {
          const newSub = new Set(prev.submittedRounds);
          newSub.add(round);
          return { ...prev, activeRound: null, result: null, submittedRounds: newSub };
        });
        return;
      }
      setGameState(prev => ({ ...prev, activeRound: round, roundData: data.challenge, endTime, result: null }));
    } catch (e) {
      console.error(e);
    }
  };

  const handleRoundSubmit = async (answers) => {
    const round = gameState.activeRound;
    try {
      const data = await api('/api/team/submit', { method: 'POST', body: JSON.stringify({ round, answers }) }, teamState.teamToken);
      setGameState(prev => {
        const newSub = new Set(prev.submittedRounds);
        newSub.add(round);
        return { ...prev, submittedRounds: newSub, activeRound: null, result: { ...data, round } };
      });
    } catch (e) {
      alert(e.message);
    }
  };

  if (!teamState.teamToken) {
    return <JoinScreen setTeamState={setTeamState} />;
  }

  if (gameState.isFinished) {
    return <FinishedScreen />;
  }

  if (gameState.result) {
    return <ResultScreen result={gameState.result} />;
  }

  if (gameState.activeRound === 1) return <Round1 challenge={gameState.roundData} endTime={gameState.endTime} onSubmit={handleRoundSubmit} />;
  if (gameState.activeRound === 2) return <Round2 challenge={gameState.roundData} endTime={gameState.endTime} onSubmit={handleRoundSubmit} />;
  if (gameState.activeRound === 3) return <Round3 challenge={gameState.roundData} endTime={gameState.endTime} onSubmit={handleRoundSubmit} />;
  if (gameState.activeRound === 4) return <Round4 challenge={gameState.roundData} endTime={gameState.endTime} onSubmit={handleRoundSubmit} />;

  return <WaitScreen teamName={teamState.teamName} />;
}
