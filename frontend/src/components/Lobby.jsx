import React, { useState, useEffect } from 'react';

function Lobby({ gameId, waiting, openGames, onCreateGame, onJoinGame, onRefreshGames, onCancel, error }) {
  const [joinId, setJoinId] = useState('');

  useEffect(() => {
    onRefreshGames();
    const interval = setInterval(onRefreshGames, 5000);
    return () => clearInterval(interval);
  }, [onRefreshGames]);

  if (waiting) {
    return (
      <div className="lobby">
        <h1 className="title">♟ Jogo de Damas</h1>
        <div className="waiting-card">
          <div className="waiting-icon">⏳</div>
          <h2>Aguardando Jogador 2...</h2>
          <p>Compartilhe o código abaixo com seu adversário:</p>
          <div className="game-code">{gameId}</div>
          <p className="hint">O segundo jogador deve entrar com este código</p>
          <button className="btn-outline-danger" style={{ marginTop: '20px' }} onClick={onCancel}>
            Cancelar Sala
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="lobby">
      <h1 className="title">♟ Jogo de Damas</h1>
      <p className="subtitle">Jogo multiplayer em tempo real</p>

      {error && <div className="error-toast">{error}</div>}

      <div className="lobby-card">
        <button className="btn-primary" onClick={onCreateGame}>
          + Criar Nova Partida
        </button>

        <div className="divider">ou</div>

        <div className="join-section">
          <label>Entrar com código:</label>
          <div className="join-row">
            <input
              type="text"
              placeholder="Ex: AB12CD34"
              value={joinId}
              onChange={e => setJoinId(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && joinId && onJoinGame(joinId)}
              maxLength={8}
            />
            <button
              className="btn-secondary"
              onClick={() => onJoinGame(joinId)}
              disabled={!joinId}
            >
              Entrar
            </button>
          </div>
        </div>

        {openGames.length > 0 && (
          <div className="open-games">
            <h3>Partidas disponíveis</h3>
            <div className="game-list">
              {openGames.map(g => (
                <div key={g.gameId} className="game-list-item">
                  <span className="game-list-id">{g.gameId}</span>
                  <span className="game-list-badge">Aguardando</span>
                  <button className="btn-small" onClick={() => onJoinGame(g.gameId)}>
                    Entrar
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <button className="btn-ghost" onClick={onRefreshGames}>
          ↻ Atualizar lista
        </button>
      </div>
    </div>
  );
}

export default Lobby;
