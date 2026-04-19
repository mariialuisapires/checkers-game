import React from 'react';

function GameInfo({ gameState, elapsedTime }) {
  if (!gameState) return null;

  const { currentPlayer, status, winner, redPieces, blackPieces,
          inMultiCapture, playerRole } = gameState;

  const isYourTurn  = playerRole && playerRole === currentPlayer;
  const currentName = currentPlayer === 'red' ? 'Vermelho' : 'Preto';
  const roleName    = playerRole === 'red' ? 'Vermelho' : playerRole === 'black' ? 'Preto' : null;

  const mm = String(Math.floor(elapsedTime / 60)).padStart(2, '0');
  const ss = String(elapsedTime % 60).padStart(2, '0');
  const timeLabel = `${mm}:${ss}`;

  return (
    <div className="game-info">
      <div className="scoreboard">
        <div className={`score-item ${currentPlayer === 'red' ? 'score-active' : ''}`}>
          <div className="score-piece red-piece-demo" />
          <div className="score-details">
            <span className="score-label">Vermelho</span>
            <span className="score-count">{redPieces}</span>
          </div>
        </div>

        <div className="turn-badge">
          {status === 'playing' && (
            inMultiCapture
              ? <span className="badge badge-capture">Captura Múltipla!</span>
              : isYourTurn
                ? <span className="badge badge-your-turn">Sua vez!</span>
                : <span className="badge badge-wait">Aguarde...</span>
          )}
          {status === 'finished' && (
            <span className="badge badge-win">
              {winner === playerRole
                ? '🏆 Você Venceu!'
                : `${winner === 'red' ? 'Vermelho' : 'Preto'} Venceu!`}
            </span>
          )}
        </div>

        <div className={`score-item ${currentPlayer === 'black' ? 'score-active' : ''}`}>
          <div className="score-piece black-piece-demo" />
          <div className="score-details">
            <span className="score-label">Preto</span>
            <span className="score-count">{blackPieces}</span>
          </div>
        </div>
      </div>

      {/* Temporizador */}
      <div className={`timer ${status === 'finished' ? 'timer-finished' : ''}`}>
        <span className="timer-icon">⏱</span>
        <span className="timer-value">{timeLabel}</span>
        {status === 'finished' && (
          <span className="timer-label">Duração da partida</span>
        )}
      </div>

      {roleName && (
        <div className="role-indicator">
          Você joga com as peças <strong>{roleName}</strong>
          {!isYourTurn && status === 'playing' && !inMultiCapture &&
            <span className="waiting-hint"> — vez de {currentName}</span>}
        </div>
      )}
    </div>
  );
}

export default GameInfo;
