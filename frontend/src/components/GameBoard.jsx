import React from 'react';
import Cell from './Cell.jsx';

function GameBoard({
  gameState, selectedPiece, validMoves, shakingCell,
  onCellClick, onDragStart, onDrop,
}) {
  if (!gameState) return null;

  const { board, currentPlayer, status, playerRole, inMultiCapture } = gameState;
  const isMyTurn = playerRole === currentPlayer && status === 'playing';
  const validSet = new Set(validMoves.map(m => `${m.row}-${m.col}`));

  // Vermelho (linhas 0-2) inverte as linhas para ver suas peças embaixo
  const rowOrder = playerRole === 'red'
    ? [7, 6, 5, 4, 3, 2, 1, 0]
    : [0, 1, 2, 3, 4, 5, 6, 7];

  const rowLabel = (r) => playerRole === 'red' ? r + 1 : 8 - r;
  const cols = [0, 1, 2, 3, 4, 5, 6, 7];

  return (
    <div className="board-frame">

      {/* ── Topo: coordenadas de colunas ── */}
      <div className="board-edge board-edge-h">
        <div className="board-corner" />
        {cols.map(c => (
          <span key={c} className="edge-label">
            {String.fromCharCode(65 + c)}
          </span>
        ))}
        <div className="board-corner" />
      </div>

      {/* ── Meio: rótulos + tabuleiro + rótulos ── */}
      <div className="board-middle">

        {/* Rótulos de linhas (esquerda) */}
        <div className="board-edge board-edge-v">
          {rowOrder.map(r => (
            <span key={r} className="edge-label">{rowLabel(r)}</span>
          ))}
        </div>

        {/* Tabuleiro */}
        <div className="board">
          {rowOrder.map(row => (
            <div key={row} className="board-row">
              {cols.map(col => {
                const piece      = board[row][col];
                const isDark     = (row + col) % 2 === 1;
                const isSelected = selectedPiece?.row === row && selectedPiece?.col === col;
                const isValid    = validSet.has(`${row}-${col}`);
                const isMulti    = inMultiCapture
                  && gameState.multiCapturePiece?.row === row
                  && gameState.multiCapturePiece?.col === col;
                const isShaking  = shakingCell?.row === row && shakingCell?.col === col;

                return (
                  <Cell
                    key={`${row}-${col}`}
                    row={row}
                    col={col}
                    piece={piece}
                    isDark={isDark}
                    isSelected={isSelected || isMulti}
                    isValidMove={isValid}
                    playerRole={playerRole}
                    isMyTurn={isMyTurn}
                    isShaking={isShaking}
                    onClick={onCellClick}
                    onDragStart={onDragStart}
                    onDrop={onDrop}
                  />
                );
              })}
            </div>
          ))}
        </div>

        {/* Rótulos de linhas (direita) */}
        <div className="board-edge board-edge-v">
          {rowOrder.map(r => (
            <span key={r} className="edge-label">{rowLabel(r)}</span>
          ))}
        </div>

      </div>

      {/* ── Base: coordenadas de colunas ── */}
      <div className="board-edge board-edge-h">
        <div className="board-corner" />
        {cols.map(c => (
          <span key={c} className="edge-label">
            {String.fromCharCode(65 + c)}
          </span>
        ))}
        <div className="board-corner" />
      </div>

    </div>
  );
}

export default GameBoard;
