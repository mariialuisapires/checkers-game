import React from 'react';

function GameInfo({ gameState }) {
  if (!gameState) return null;

  const { currentPlayer, status, winner, redPieces, blackPieces,
          inMultiCapture, playerRole } = gameState;

  const isYourTurn = playerRole && playerRole === currentPlayer;

  return (
    <div className="game-info-sidebar">

      {/* Preto */}
      <div className={`sidebar-player ${currentPlayer === 'black' ? 'sidebar-player-active' : ''}`}>
        <div className="black-piece-demo sidebar-piece" />
        <span className="sidebar-player-name">Preto</span>
        <span className="sidebar-player-count">{blackPieces}</span>
      </div>

      {/* Badge de vez / resultado */}
      <div className="sidebar-badge-area">
        {status === 'playing' && (
          inMultiCapture
            ? <span className="badge badge-capture">✕2</span>
            : isYourTurn
              ? <span className="badge badge-your-turn">Sua<br/>vez!</span>
              : <span className="badge badge-wait">Aguarde</span>
        )}
        {status === 'finished' && (
          <span className="badge badge-win">
            {winner === playerRole ? '🏆' : `${winner === 'red' ? '🔴' : '⚫'}`}
          </span>
        )}
      </div>

      {/* Vermelho */}
      <div className={`sidebar-player ${currentPlayer === 'red' ? 'sidebar-player-active' : ''}`}>
        <div className="red-piece-demo sidebar-piece" />
        <span className="sidebar-player-name">Vermelho</span>
        <span className="sidebar-player-count">{redPieces}</span>
      </div>

    </div>
  );
}

export default GameInfo;
