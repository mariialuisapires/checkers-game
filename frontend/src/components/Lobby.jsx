import React, { useState, useEffect } from 'react';

function useCountdown(expiresAt) {
  const [remaining, setRemaining] = useState(null);

  useEffect(() => {
    if (!expiresAt) { setRemaining(null); return; }

    const tick = () => {
      const diff = Math.max(0, Math.floor((new Date(expiresAt) - Date.now()) / 1000));
      setRemaining(diff);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  if (remaining === null) return null;
  const m = String(Math.floor(remaining / 60)).padStart(2, '0');
  const s = String(remaining % 60).padStart(2, '0');
  return { display: `${m}:${s}`, urgent: remaining <= 30, expired: remaining === 0 };
}

function Lobby({
  gameId, waiting, joinRequest, joinPending,
  openGames, expiresAt,
  onCreateGame, onJoinGame,
  onApproveJoin, onDenyJoin,
  onRefreshGames, onCancel, error,
}) {
  const [joinId, setJoinId] = useState('');
  const countdown = useCountdown(expiresAt);

  useEffect(() => {
    onRefreshGames();
    const interval = setInterval(onRefreshGames, 5000);
    return () => clearInterval(interval);
  }, [onRefreshGames]);

  /* ── Player 2: aguardando aprovação ──────────────────────── */
  if (joinPending) {
    return (
      <div className="lobby">
        <h1 className="title">♟ Jogo de Damas</h1>
        <div className="waiting-card">
          <div className="waiting-icon pending-spin">⏳</div>
          <h2>Aguardando aprovação...</h2>
          <p>O criador da sala precisa aceitar sua entrada.</p>
          <div className="game-code">{joinPending}</div>
          <button
            className="btn-outline-danger"
            style={{ marginTop: '20px' }}
            onClick={() => window.location.reload()}
          >
            Cancelar solicitação
          </button>
        </div>
      </div>
    );
  }

  /* ── Player 1: sala de espera ────────────────────────────── */
  if (waiting) {
    return (
      <div className="lobby">
        <h1 className="title">♟ Jogo de Damas</h1>

        {joinRequest ? (
          <div className="waiting-card join-request-card">
            <div className="join-request-icon">🔔</div>
            <h2>Solicitação de entrada</h2>
            <p>Um jogador quer entrar na sua partida.<br />Deseja permitir?</p>
            {countdown && (
              <div className={`lobby-countdown ${countdown.urgent ? 'lobby-countdown-urgent' : ''}`}>
                ⏱ Expira em <strong>{countdown.display}</strong>
              </div>
            )}
            <div className="join-request-actions">
              <button className="btn-approve" onClick={onApproveJoin}>✓ Aceitar</button>
              <button className="btn-deny"    onClick={onDenyJoin}>✕ Recusar</button>
            </div>
          </div>
        ) : (
          <div className="waiting-card">
            <div className="waiting-icon">⏳</div>
            <h2>Aguardando Jogador 2...</h2>
            <p>Compartilhe o código abaixo com seu adversário:</p>
            <div className="game-code">{gameId}</div>

            {countdown && (
              <div className={`lobby-countdown ${countdown.urgent ? 'lobby-countdown-urgent' : ''}`}>
                {countdown.expired
                  ? '⌛ Expirando...'
                  : <>⏱ Expira em <strong>{countdown.display}</strong></>}
              </div>
            )}

            <p className="hint">O segundo jogador deve entrar com este código — você precisará aprovar a entrada.</p>
            <button className="btn-outline-danger" style={{ marginTop: '20px' }} onClick={onCancel}>
              Cancelar Sala
            </button>
          </div>
        )}
      </div>
    );
  }

  /* ── Lobby principal ─────────────────────────────────────── */
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
              Solicitar entrada
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
                    Solicitar
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
