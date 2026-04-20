import React, { useMemo } from 'react';

const COLORS  = ['#ffd700', '#f85149', '#56d364', '#58a6ff', '#ff9a3c', '#d2a8ff', '#ff6eb4', '#ffffff'];
const COUNT   = 60;

function WinScreen({ onClose }) {
  const pieces = useMemo(() => (
    Array.from({ length: COUNT }, (_, i) => {
      const isRect = i % 3 !== 0;
      return {
        id:       i,
        color:    COLORS[i % COLORS.length],
        left:     `${(i / COUNT) * 100 + (Math.random() * 4 - 2)}%`,
        delay:    `${(Math.random() * 2.2).toFixed(2)}s`,
        duration: `${(2.8 + Math.random() * 2.4).toFixed(2)}s`,
        width:    isRect ? `${4 + Math.floor(Math.random() * 5)}px`  : `${7 + Math.floor(Math.random() * 5)}px`,
        height:   isRect ? `${10 + Math.floor(Math.random() * 8)}px` : `${7 + Math.floor(Math.random() * 5)}px`,
        radius:   isRect ? '2px' : '50%',
        startRot: `${Math.floor(Math.random() * 360)}deg`,
        endRot:   `${360 * (Math.random() > 0.5 ? 1 : -1) * (2 + Math.floor(Math.random() * 2))}deg`,
        wobble:   `${(Math.random() * 40 - 20).toFixed(0)}px`,
      };
    })
  ), []);

  return (
    <div className="win-overlay">

      {/* Confetes */}
      <div className="confetti-stage" aria-hidden="true">
        {pieces.map(p => (
          <div
            key={p.id}
            className="confetti-piece"
            style={{
              left:              p.left,
              width:             p.width,
              height:            p.height,
              background:        p.color,
              borderRadius:      p.radius,
              animationDelay:    p.delay,
              animationDuration: p.duration,
              '--wobble':        p.wobble,
              '--rot-start':     p.startRot,
              '--rot-end':       p.endRot,
            }}
          />
        ))}
      </div>

      {/* Card central */}
      <div className="win-card">
        <div className="win-trophy" aria-label="Troféu">🏆</div>
        <h1 className="win-title">Você Venceu!</h1>
        <p className="win-subtitle">Parabéns pela vitória!</p>
        <button className="btn-primary win-btn" onClick={onClose}>
          Voltar ao Lobby
        </button>
      </div>

    </div>
  );
}

export default WinScreen;
