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

  const rowOrder = playerRole === 'red'
    ? [7, 6, 5, 4, 3, 2, 1, 0]
    : [0, 1, 2, 3, 4, 5, 6, 7];

  const rowLabel = (r) => playerRole === 'red' ? r + 1 : 8 - r;

  return (
    <div className="board-wrapper">
      <div className="board-labels-top">
        {[0, 1, 2, 3, 4, 5, 6, 7].map(c => (
          <span key={c} className="board-label">
            {String.fromCharCode(65 + c)}
          </span>
        ))}
      </div>

      <div className="board-with-rows">
        <div className="board-labels-left">
          {rowOrder.map(r => (
            <span key={r} className="board-label">{rowLabel(r)}</span>
          ))}
        </div>

        <div className="board">
          {rowOrder.map(row => (
            <div key={row} className="board-row">
              {[0, 1, 2, 3, 4, 5, 6, 7].map(col => {
                const piece     = board[row][col];
                const isDark    = (row + col) % 2 === 1;
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
      </div>
    </div>
  );
}

export default GameBoard;
