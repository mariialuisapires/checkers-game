import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createConnection, startConnection } from './services/signalRService.js';
import { GameController } from './controllers/gameController.js';
import Lobby from './components/Lobby.jsx';
import GameBoard from './components/GameBoard.jsx';
import GameInfo from './components/GameInfo.jsx';
import HelpModal from './components/HelpModal.jsx';

/* ── SVG Icons ──────────────────────────────────────────────── */
const HelpSvg = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
    <circle cx="12" cy="17" r="0.5" fill="currentColor"/>
  </svg>
);

const ExitSvg = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/>
    <line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);

const HomeSvg = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
    <polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
);

/* ── App ────────────────────────────────────────────────────── */
function App() {
  const [connected, setConnected] = useState(false);
  const [gameId, setGameId] = useState(null);
  const [gameState, setGameState] = useState(null);
  const [selectedPiece, setSelectedPiece] = useState(null);
  const [validMoves, setValidMoves] = useState([]);
  const [openGames, setOpenGames] = useState([]);
  const [error, setError] = useState(null);
  const [confirmAbandon, setConfirmAbandon] = useState(false);
  const [joinRequest, setJoinRequest] = useState(false);
  const [joinPending, setJoinPending] = useState(null);
  const [dragSource, setDragSource] = useState(null);
  const [shakingCell, setShakingCell] = useState(null);
  const [opponentAbandoned, setOpponentAbandoned] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [showHelp, setShowHelp] = useState(false);

  const controllerRef = useRef(null);
  const gameIdRef     = useRef(null);
  const validMovesRef = useRef([]);
  const dragSourceRef = useRef(null);

  useEffect(() => { gameIdRef.current = gameId; }, [gameId]);
  useEffect(() => { validMovesRef.current = validMoves; }, [validMoves]);
  useEffect(() => { dragSourceRef.current = dragSource; }, [dragSource]);

  useEffect(() => {
    if (gameState?.status === 'playing') {
      setElapsedTime(0);
      const interval = setInterval(() => setElapsedTime(t => t + 1), 1000);
      return () => clearInterval(interval);
    }
    if (!gameState || gameState.status === 'waiting') setElapsedTime(0);
  }, [gameState?.status]);

  const showError = (msg) => {
    setError(msg);
    setTimeout(() => setError(null), 3500);
  };

  useEffect(() => {
    const conn = createConnection();
    const ctrl = new GameController(conn);
    controllerRef.current = ctrl;

    conn.on('GameCreated', (id) => setGameId(id));

    conn.on('GameStateUpdated', (state) => {
      setGameId(state.gameId);
      setGameState(state);
      setSelectedPiece(null);
      setValidMoves([]);
      setError(null);
      setJoinRequest(false);
      setJoinPending(null);

      if (state.inMultiCapture && state.multiCapturePiece
          && state.playerRole === state.currentPlayer) {
        const { row, col } = state.multiCapturePiece;
        setSelectedPiece({ row, col });
        ctrl.selectPiece(state.gameId, row, col).catch(console.error);
      }
    });

    conn.on('ValidMovesUpdated', ({ row, col, moves }) => {
      setSelectedPiece({ row, col });
      setValidMoves(moves);
    });

    conn.on('GameAbandoned', () => {
      setGameId(null);
      setGameState(null);
      setConfirmAbandon(false);
      setOpponentAbandoned(false);
    });

    conn.on('OpponentAbandoned', () => setOpponentAbandoned(true));
    conn.on('JoinRequested', (gId) => setJoinPending(gId));
    conn.on('JoinRequest', () => setJoinRequest(true));
    conn.on('JoinDenied', () => {
      setJoinPending(null);
      showError('Solicitação recusada pelo criador da partida.');
    });
    conn.on('OpenGames', (games) => setOpenGames(games));
    conn.on('Error', showError);
    conn.onreconnected(() => setConnected(true));
    conn.onclose(() => setConnected(false));

    startConnection()
      .then(() => setConnected(true))
      .catch(console.error);

    return () => conn.stop();
  }, []);

  const handleCellClick = useCallback(async (row, col) => {
    const ctrl = controllerRef.current;
    const gId  = gameIdRef.current;
    if (!gameState || !ctrl || !gId) return;
    if (gameState.status !== 'playing') return;
    if (!gameState.playerRole) return;
    if (gameState.playerRole !== gameState.currentPlayer) return;

    const piece = gameState.board[row][col];

    if (selectedPiece) {
      const isTarget = validMoves.some(m => m.row === row && m.col === col);
      if (isTarget) {
        await ctrl.makeMove(gId, selectedPiece.row, selectedPiece.col, row, col).catch(showError);
        return;
      }
      if (piece && piece.color === gameState.playerRole && !gameState.inMultiCapture) {
        await ctrl.selectPiece(gId, row, col).catch(showError);
        return;
      }
      if (!gameState.inMultiCapture) { setSelectedPiece(null); setValidMoves([]); }
      return;
    }

    if (piece && piece.color === gameState.playerRole)
      await ctrl.selectPiece(gId, row, col).catch(showError);
  }, [gameState, selectedPiece, validMoves]);

  const handleRefreshGames = useCallback(() => {
    controllerRef.current?.getOpenGames().catch(console.error);
  }, []);

  const handleCreateGame  = useCallback(() => {
    controllerRef.current?.createGame().catch(showError);
  }, []);

  const handleJoinGame = useCallback((id) => {
    controllerRef.current?.requestJoin(id).catch(showError);
  }, []);

  const handleApproveJoin = useCallback(() => {
    const gId = gameIdRef.current;
    if (gId) controllerRef.current?.approveJoin(gId).catch(showError);
    setJoinRequest(false);
  }, []);

  const handleDenyJoin = useCallback(() => {
    const gId = gameIdRef.current;
    if (gId) controllerRef.current?.denyJoin(gId).catch(showError);
    setJoinRequest(false);
  }, []);

  const triggerShake = useCallback((row, col) => {
    setShakingCell({ row, col });
    setTimeout(() => setShakingCell(null), 520);
  }, []);

  const handleDragStart = useCallback((row, col) => {
    const ctrl = controllerRef.current;
    const gId  = gameIdRef.current;
    setDragSource({ row, col });
    if (ctrl && gId) ctrl.selectPiece(gId, row, col).catch(console.error);
  }, []);

  const handleDrop = useCallback(async (toRow, toCol) => {
    const src   = dragSourceRef.current;
    const moves = validMovesRef.current;
    const ctrl  = controllerRef.current;
    const gId   = gameIdRef.current;
    setDragSource(null);
    if (!src || !ctrl || !gId) return;
    const { row: fromRow, col: fromCol } = src;
    if (fromRow === toRow && fromCol === toCol) return;
    const isValid = moves.some(m => m.row === toRow && m.col === toCol);
    if (!isValid) { triggerShake(fromRow, fromCol); return; }
    try {
      await ctrl.makeMove(gId, fromRow, fromCol, toRow, toCol);
    } catch { triggerShake(fromRow, fromCol); }
  }, [triggerShake]);

  const handleAbandon = useCallback(() => {
    const gId = gameIdRef.current;
    if (!gId) return;
    controllerRef.current?.abandonGame(gId).catch(showError);
    setConfirmAbandon(false);
  }, []);

  const handleBackToLobby = () => {
    setGameId(null);
    setGameState(null);
    setOpponentAbandoned(false);
  };

  /* ── Carregando ─────────────────────────────────────────── */
  if (!connected) {
    return (
      <div className="loading">
        <div className="spinner" />
        Conectando ao servidor...
      </div>
    );
  }

  const inGame  = gameId && gameState && gameState.status !== 'waiting';
  const waiting = gameId && gameState?.status === 'waiting';

  /* ── Lobby ──────────────────────────────────────────────── */
  if (!inGame) {
    return (
      <Lobby
        gameId={gameId}
        waiting={waiting}
        joinRequest={joinRequest}
        joinPending={joinPending}
        openGames={openGames}
        onCreateGame={handleCreateGame}
        onJoinGame={handleJoinGame}
        onApproveJoin={handleApproveJoin}
        onDenyJoin={handleDenyJoin}
        onRefreshGames={handleRefreshGames}
        onCancel={handleAbandon}
        error={error}
      />
    );
  }

  /* ── Partida ────────────────────────────────────────────── */
  const isFinished = gameState.status === 'finished';

  const mm = String(Math.floor(elapsedTime / 60)).padStart(2, '0');
  const ss = String(elapsedTime % 60).padStart(2, '0');

  return (
    <div className="app">

      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
      {error && <div className="error-toast">{error}</div>}

      {/* Adversário abandonou */}
      {opponentAbandoned && (
        <div className="abandon-overlay">
          <div className="abandon-card">
            <div className="abandon-icon">🏳️</div>
            <h2>Adversário abandonou!</h2>
            <p>Seu oponente saiu da partida.<br />Você venceu por W.O.!</p>
            <button className="btn-primary" onClick={handleBackToLobby}>
              Voltar ao Lobby
            </button>
          </div>
        </div>
      )}

      {/* Confirmação de abandono */}
      {confirmAbandon && (
        <div className="confirm-overlay">
          <div className="confirm-card">
            <p>
              {gameState.status === 'playing'
                ? 'Tem certeza? Você perderá a partida.'
                : 'Cancelar a sala?'}
            </p>
            <div className="confirm-actions">
              <button className="btn-danger" onClick={handleAbandon}>Sim, sair</button>
              <button className="btn-ghost-sm" onClick={() => setConfirmAbandon(false)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* Título */}
      <h1 className="title game-title">♟ Jogo de Damas</h1>

      {/* Temporizador acima do tabuleiro */}
      <div className={`board-timer ${isFinished ? 'board-timer-finished' : ''}`}>
        <span className="board-timer-icon">⏱</span>
        <span className="board-timer-value">{mm}:{ss}</span>
        {isFinished && <span className="board-timer-label">duração</span>}
      </div>

      {/* Área principal: lateral esquerda | tabuleiro | lateral direita */}
      <div className="game-area">

        {/* Painel esquerdo: ícones de ação */}
        <div className="side-panel side-left">
          {gameState.playerRole && (
            <div className="role-chip">
              <div className={`role-chip-piece ${gameState.playerRole === 'red' ? 'piece-red' : 'piece-black'}`} />
              <span className="role-chip-label">Você</span>
            </div>
          )}

          <button className="icon-btn" onClick={() => setShowHelp(true)} title="Regras do jogo">
            <HelpSvg />
          </button>

          <button
            className={`icon-btn ${isFinished ? 'icon-btn-home' : 'icon-btn-exit'}`}
            onClick={isFinished ? handleBackToLobby : () => setConfirmAbandon(true)}
            title={isFinished ? 'Voltar ao Lobby' : 'Abandonar partida'}
          >
            {isFinished ? <HomeSvg /> : <ExitSvg />}
          </button>
        </div>

        {/* Tabuleiro */}
        <GameBoard
          gameState={gameState}
          selectedPiece={selectedPiece}
          validMoves={validMoves}
          shakingCell={shakingCell}
          onCellClick={handleCellClick}
          onDragStart={handleDragStart}
          onDrop={handleDrop}
        />

        {/* Painel direito: info dos jogadores */}
        <div className="side-panel side-right">
          <GameInfo gameState={gameState} />
        </div>

      </div>
    </div>
  );
}

export default App;
