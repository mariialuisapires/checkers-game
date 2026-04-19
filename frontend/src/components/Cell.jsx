import React, { useState } from 'react';

function Cell({
  row, col, piece, isDark, isSelected, isValidMove,
  playerRole, isMyTurn, isShaking,
  onClick, onDragStart, onDrop,
}) {
  const [isDragOver, setIsDragOver] = useState(false);

  const canDrag = piece && piece.color === playerRole && isMyTurn;

  /* ── Handlers de clique ───────────────────────────────── */
  const handleClick = () => {
    if (!isDark) return;
    onClick(row, col);
  };

  /* ── Handlers de drag ────────────────────────────────── */
  const handleDragStart = (e) => {
    e.dataTransfer.effectAllowed = 'move';
    // Pequeno delay para o ghost aparecer antes de disparar o evento
    setTimeout(() => onDragStart(row, col), 0);
  };

  const handleDragOver = (e) => {
    if (!isDark) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setIsDragOver(true);
  };

  const handleDragLeave = () => setIsDragOver(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    onDrop(row, col);
  };

  /* ── Classes ─────────────────────────────────────────── */
  const cellClass = [
    'cell',
    isDark ? 'cell-dark' : 'cell-light',
    isSelected   ? 'cell-selected'  : '',
    isValidMove  ? 'cell-valid'     : '',
    isDragOver && isDark ? 'cell-drag-over' : '',
    isDark && isMyTurn ? 'cell-interactive' : '',
  ].filter(Boolean).join(' ');

  const pieceClass = piece ? [
    'piece',
    `piece-${piece.color}`,
    piece.type === 'king' ? 'piece-king'     : '',
    canDrag                ? 'piece-selectable piece-draggable' : '',
    isShaking              ? 'piece-shake'   : '',
  ].filter(Boolean).join(' ') : '';

  return (
    <div
      className={cellClass}
      onClick={handleClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      role="button"
      aria-label={`Casa ${row},${col}`}
    >
      {piece && (
        <div
          className={pieceClass}
          draggable={canDrag}
          onDragStart={canDrag ? handleDragStart : undefined}
        >
          {piece.type === 'king' && <span className="crown" aria-label="Dama">♛</span>}
        </div>
      )}
      {isValidMove && !piece && <div className="move-dot" />}
    </div>
  );
}

export default React.memo(Cell);
