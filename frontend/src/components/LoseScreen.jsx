import React, { useMemo } from 'react';

const TEAR_COUNT = 35;

function LoseScreen({ onClose }) {
  const tears = useMemo(() => (
    Array.from({ length: TEAR_COUNT }, (_, i) => ({
      id:       i,
      left:     `${(i / TEAR_COUNT) * 100 + (Math.random() * 4 - 2)}%`,
      delay:    `${(Math.random() * 3).toFixed(2)}s`,
      duration: `${(2.2 + Math.random() * 2).toFixed(2)}s`,
      size:     `${5 + Math.floor(Math.random() * 5)}px`,
      opacity:  `${(0.4 + Math.random() * 0.5).toFixed(2)}`,
    }))
  ), []);

  return (
    <div className="lose-overlay">

      {/* Lágrimas caindo */}
      <div className="confetti-stage" aria-hidden="true">
        {tears.map(t => (
          <div
            key={t.id}
            className="tear-piece"
            style={{
              left:              t.left,
              width:             t.size,
              animationDelay:    t.delay,
              animationDuration: t.duration,
              opacity:           t.opacity,
            }}
          />
        ))}
      </div>

      {/* Card central */}
      <div className="lose-card">
        <div className="lose-emoji" aria-label="Triste">😢</div>
        <h1 className="lose-title">Você Perdeu...</h1>
        <p className="lose-subtitle">Não desanime, tente de novo!</p>
        <button className="btn-primary lose-btn" onClick={onClose}>
          Voltar ao Lobby
        </button>
      </div>

    </div>
  );
}

export default LoseScreen;
