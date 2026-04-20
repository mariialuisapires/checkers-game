import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createConnection, startConnection } from './services/signalRService.js';
import { GameController } from './controllers/gameController.js';
import Lobby from './components/Lobby.jsx';
import GameBoard from './components/GameBoard.jsx';
import GameInfo from './components/GameInfo.jsx';
import HelpModal from './components/HelpModal.jsx';

function App() {
  const [connected, setConnected] = useState(false);
  const [gameId, setGameId] = useState(null);
  const [gameState, setGameState] = useState(null);
  const [selectedPiece, setSelectedPiece] = useState(null);
  const [validMoves, setValidMoves] = useState([]);
  const [openGames, setOpenGames] = useState([]);
  const [error, setError] = useState(null);
  const [confirmAbandon, setConfirmAbandon] = useState(false);
  const [joinRequest, setJoinRequest] = useState(false);   // Player 1: tem solicitação pendente
  const [joinPending, setJoinPending] = useState(null);    // Player 2: aguardando aprovação (gameId)
  const [dragSource, setDragSource] = useState(null);
  const [shakingCell, setShakingCell] = useState(null);
  const [opponentAbandoned, setOpponentAbandoned] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [showHelp, setShowHelp] = useState(false);

  // Refs para evitar stale closures nos handlers do SignalR
  const controllerRef = useRef(null);
  const gameIdRef = useRef(null);
  const validMovesRef = useRef([]);   // ref para evitar stale closure no drop
  const dragSourceRef = useRef(null);

  useEffect(() => { gameIdRef.current = gameId; }, [gameId]);
  useEffect(() => { validMovesRef.current = validMoves; }, [validMoves]);
  useEffect(() => { dragSourceRef.current = dragSource; }, [dragSource]);

  // Temporizador: inicia quando a partida começa, para quando termina ou é resetada
  useEffect(() => {
    if (gameState?.status === 'playing') {
      setElapsedTime(0);
      const interval = setInterval(() => setElapsedTime(t => t + 1), 1000);
      return () => clearInterval(interval);
    }
    if (!gameState || gameState.status === 'waiting') {
      setElapsedTime(0);
    }
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
      // Garante que o gameId fique definido para ambos os jogadores
      // (o criador recebe via GameCreated; quem entra só recebe GameStateUpdated)
      setGameId(state.gameId);
      setGameState(state);
      setSelectedPiece(null);
      setValidMoves([]);
      setError(null);
      setJoinRequest(false);
      setJoinPending(null);

      // Captura múltipla: auto-seleciona a peça e busca destinos válidos
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

    conn.on('OpponentAbandoned', () => {
      setOpponentAbandoned(true);
    });

    // Player 2: servidor confirmou que a solicitação foi enviada ao criador
    conn.on('JoinRequested', (gId) => setJoinPending(gId));

    // Player 1: chegou uma solicitação de entrada
    conn.on('JoinRequest', () => setJoinRequest(true));

    // Player 2: criador recusou
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
    const gId = gameIdRef.current;
    if (!gameState || !ctrl || !gId) return;
    if (gameState.status !== 'playing') return;
    if (!gameState.playerRole) return;
    if (gameState.playerRole !== gameState.currentPlayer) return;

    const piece = gameState.board[row][col];

    if (selectedPiece) {
      const isTarget = validMoves.some(m => m.row === row && m.col === col);

      if (isTarget) {
        await ctrl.makeMove(gId, selectedPiece.row, selectedPiece.col, row, col)
          .catch(showError);
        return;
      }

      // Clicou em outra peça própria: troca seleção
      if (piece && piece.color === gameState.playerRole && !gameState.inMultiCapture) {
        await ctrl.selectPiece(gId, row, col).catch(showError);
        return;
      }

      // Deseleciona
      if (!gameState.inMultiCapture) {
        setSelectedPiece(null);
        setValidMoves([]);
      }
      return;
    }

    if (piece && piece.color === gameState.playerRole) {
      await ctrl.selectPiece(gId, row, col).catch(showError);
    }
  }, [gameState, selectedPiece, validMoves]);

  const handleRefreshGames = useCallback(() => {
    controllerRef.current?.getOpenGames().catch(console.error);
  }, []);

  const handleCreateGame = useCallback(() => {
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

  // Dispara vibração na peça por 520ms e limpa
  const triggerShake = useCallback((row, col) => {
    setShakingCell({ row, col });
    setTimeout(() => setShakingCell(null), 520);
  }, []);

  /* ── Drag & Drop ─────────────────────────────────────── */
  const handleDragStart = useCallback((row, col) => {
    const ctrl = controllerRef.current;
    const gId  = gameIdRef.current;
    setDragSource({ row, col });
    // Seleciona a peça para carregar movimentos válidos
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

    // Soltou na mesma casa → ignora sem vibrar
    if (fromRow === toRow && fromCol === toCol) return;

    const isValid = moves.some(m => m.row === toRow && m.col === toCol);

    if (!isValid) {
      triggerShake(fromRow, fromCol);
      return;
    }

    try {
      await ctrl.makeMove(gId, fromRow, fromCol, toRow, toCol);
    } catch {
      triggerShake(fromRow, fromCol);
    }
  }, [triggerShake]);

  const handleAbandon = useCallback(() => {
    const gId = gameIdRef.current;
    if (!gId) return;
    controllerRef.current?.abandonGame(gId).catch(showError);
    setConfirmAbandon(false);
  }, []);

  if (!connected) {
    return (
      <div className="loading">
        <div className="spinner" />
        Conectando ao servidor...
      </div>
    );
  }

  const inGame = gameId && gameState && gameState.status !== 'waiting';
  const waiting = gameId && gameState?.status === 'waiting';

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

  const isFinished = gameState.status === 'finished';

  const handleBackToLobby = () => {
    setGameId(null);
    setGameState(null);
    setOpponentAbandoned(false);
  };

  return (
    <div className="app">
      <div className="app-header">
        <h1 className="title">♟ Jogo de Damas</h1>
        <button className="btn-help" onClick={() => setShowHelp(true)} title="Regras do jogo">
          ?
        </button>
      </div>

      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
      {error && <div className="error-toast">{error}</div>}

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

      <GameInfo gameState={gameState} elapsedTime={elapsedTime} />
      <GameBoard
        gameState={gameState}
        selectedPiece={selectedPiece}
        validMoves={validMoves}
        shakingCell={shakingCell}
        onCellClick={handleCellClick}
        onDragStart={handleDragStart}
        onDrop={handleDrop}
      />

      <div className="game-actions">
        {isFinished ? (
          <button className="btn-primary" onClick={handleBackToLobby}>
            Voltar ao Lobby
          </button>
        ) : confirmAbandon ? (
          <div className="confirm-abandon">
            <span>Tem certeza? {gameState.status === 'playing' ? 'Você perderá a partida.' : 'A sala será cancelada.'}</span>
            <button className="btn-danger" onClick={handleAbandon}>Sim, sair</button>
            <button className="btn-ghost" onClick={() => setConfirmAbandon(false)}>Cancelar</button>
          </div>
        ) : (
          <button className="btn-outline-danger" onClick={() => setConfirmAbandon(true)}>
            {gameState.status === 'playing' ? 'Abandonar Partida' : 'Cancelar Sala'}
          </button>
        )}
      </div>
    </div>
  );
}

export default App;
