import React, { useState, useEffect, useRef } from 'react';

export default function Timer({ endTime, onExpire }) {
  const [timeLeft, setTimeLeft] = useState(0);
  const onExpireRef = useRef(onExpire);

  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  useEffect(() => {
    const tick = () => {
      const remaining = Math.max(0, endTime - Date.now());
      setTimeLeft(remaining);
      if (remaining <= 0) {
        onExpireRef.current();
      }
    };
    
    tick(); // Initial tick
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [endTime]);

  const formatMs = (ms) => {
    const totalSec = Math.floor(ms / 1000);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const isLow = timeLeft < 60000;

  return (
    <div className={`timer ${isLow ? 'low' : ''}`}>
      {formatMs(timeLeft)}
    </div>
  );
}
