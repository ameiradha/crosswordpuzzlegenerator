import React, { useEffect, useRef } from 'react';
import { 
  CrosswordLayout, 
  Direction, 
  PlacedWord, 
  UserAnswers 
} from '../types/crossword';

interface CrosswordGridProps {
  layout: CrosswordLayout;
  userAnswers: UserAnswers;
  selectedRow: number;
  selectedCol: number;
  direction: Direction;
  activeWord: PlacedWord | null;
  checkedCells: { [key: string]: 'correct' | 'incorrect' };
  revealedCells: { [key: string]: boolean };
  onSelectCell: (row: number, col: number) => void;
  onToggleDirection: () => void;
  onEnterLetter: (letter: string) => void;
  onBackspace: () => void;
  onNavigateArrow: (key: 'ArrowUp' | 'ArrowDown' | 'ArrowLeft' | 'ArrowRight') => void;
  onNextWord: (forward: boolean) => void;
}

export const CrosswordGridComponent: React.FC<CrosswordGridProps> = ({
  layout,
  userAnswers,
  selectedRow,
  selectedCol,
  direction,
  activeWord,
  checkedCells,
  revealedCells,
  onSelectCell,
  onToggleDirection,
  onEnterLetter,
  onBackspace,
  onNavigateArrow,
  onNextWord
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Active word coordinates set for fast lookup
  const activeWordCoords = new Set<string>();
  if (activeWord) {
    for (let i = 0; i < activeWord.length; i++) {
      const r = activeWord.direction === 'down' ? activeWord.row + i : activeWord.row;
      const c = activeWord.direction === 'across' ? activeWord.col + i : activeWord.col;
      activeWordCoords.add(`${r}_${c}`);
    }
  }

  // Handle global keyboard typing when grid container or document is focused
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in an input or textarea
      const targetTag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (targetTag === 'input' || targetTag === 'textarea') return;

      if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        onNavigateArrow(e.key);
      } else if (e.key === 'Backspace' || e.key === 'Delete') {
        e.preventDefault();
        onBackspace();
      } else if (e.key === ' ') {
        e.preventDefault();
        onToggleDirection();
      } else if (e.key === 'Tab') {
        e.preventDefault();
        onNextWord(!e.shiftKey);
      } else if (/^[a-zA-Z]$/.test(e.key) && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        onEnterLetter(e.key.toUpperCase());
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onEnterLetter, onBackspace, onNavigateArrow, onToggleDirection, onNextWord]);

  const { width, height, cells } = layout;

  return (
    <div 
      ref={containerRef}
      className="flex flex-col items-center justify-center p-2 sm:p-4 outline-none select-none"
      tabIndex={0}
    >
      <div 
        className="inline-block bg-stone-900 p-2 sm:p-3 rounded-xl shadow-2xl border border-stone-800"
        style={{
          maxWidth: '100%',
          overflowX: 'auto'
        }}
      >
        <div 
          className="grid gap-[1.5px] sm:gap-[2px] bg-stone-700/60 p-[1.5px] rounded-lg"
          style={{
            gridTemplateColumns: `repeat(${width}, minmax(0, 1fr))`,
            width: `min(86vw, ${width * 38}px)`,
            aspectRatio: `${width} / ${height}`
          }}
        >
          {cells.map((rowCells, r) =>
            rowCells.map((cell, c) => {
              const cellKey = `${r}_${c}`;
              const isSelected = selectedRow === r && selectedCol === c;
              const isInActiveWord = activeWordCoords.has(cellKey);
              const letter = userAnswers[cellKey] || '';
              const checkState = checkedCells[cellKey];
              const isRevealed = revealedCells[cellKey];

              if (cell.isBlocked) {
                return (
                  <div 
                    key={cellKey} 
                    className="bg-stone-900 rounded-[2px] transition-colors"
                  />
                );
              }

              // Color states
              let bgClass = "bg-white text-stone-900";
              if (isSelected) {
                bgClass = "bg-amber-300 text-stone-950 font-bold ring-2 ring-amber-500 ring-offset-1 z-10";
              } else if (isInActiveWord) {
                bgClass = "bg-amber-100/90 text-stone-900";
              }

              return (
                <div
                  key={cellKey}
                  onClick={() => {
                    if (isSelected) {
                      onToggleDirection();
                    } else {
                      onSelectCell(r, c);
                    }
                  }}
                  className={`relative flex items-center justify-center cursor-pointer transition-all rounded-[2px] ${bgClass} select-none group`}
                  style={{ aspectRatio: '1 / 1' }}
                >
                  {/* Clue Number (if present) */}
                  {cell.number && (
                    <span className="absolute top-[1px] left-[2px] sm:top-[2px] sm:left-[3px] text-[8px] sm:text-[10px] md:text-[11px] font-bold text-stone-600 leading-none pointer-events-none font-mono-grid">
                      {cell.number}
                    </span>
                  )}

                  {/* Letter Content */}
                  <span className={`font-mono-grid text-sm sm:text-lg md:text-xl font-bold uppercase transition-transform ${
                    isSelected ? 'scale-105' : ''
                  } ${checkState === 'incorrect' ? 'text-rose-600 line-through decoration-rose-500 decoration-2' : ''} ${
                    isRevealed ? 'text-blue-600' : ''
                  }`}>
                    {letter}
                  </span>

                  {/* Revealed or Checked Badge Marker */}
                  {isRevealed && (
                    <span 
                      className="absolute bottom-0.5 right-0.5 w-1.5 h-1.5 bg-blue-500 rounded-full" 
                      title="Revealed letter"
                    />
                  )}
                  {checkState === 'incorrect' && (
                    <span 
                      className="absolute bottom-0.5 right-0.5 w-1.5 h-1.5 bg-rose-500 rounded-full" 
                      title="Incorrect letter"
                    />
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Helper cue beneath grid */}
      <div className="mt-2 text-center text-xs text-stone-500 flex items-center justify-center space-x-2">
        <span className="inline-flex items-center px-2 py-0.5 rounded bg-stone-200/80 text-stone-700 font-medium">
          Space: Toggle Across/Down
        </span>
        <span className="inline-flex items-center px-2 py-0.5 rounded bg-stone-200/80 text-stone-700 font-medium hidden sm:inline-flex">
          Tab: Next clue
        </span>
      </div>
    </div>
  );
};
