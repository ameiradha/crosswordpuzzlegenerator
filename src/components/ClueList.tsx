import React, { useRef, useEffect } from 'react';
import { PlacedWord, Direction, UserAnswers } from '../types/crossword';
import { CheckCircle2 } from 'lucide-react';

interface ClueListProps {
  words: PlacedWord[];
  activeWord: PlacedWord | null;
  direction: Direction;
  userAnswers: UserAnswers;
  onSelectWord: (word: PlacedWord) => void;
}

export const ClueList: React.FC<ClueListProps> = ({
  words,
  activeWord,
  direction,
  userAnswers,
  onSelectWord
}) => {
  const activeClueRef = useRef<HTMLLIElement>(null);

  // Auto-scroll active clue into view smoothly
  useEffect(() => {
    if (activeClueRef.current) {
      activeClueRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest'
      });
    }
  }, [activeWord?.id]);

  const acrossWords = words.filter(w => w.direction === 'across').sort((a, b) => a.number - b.number);
  const downWords = words.filter(w => w.direction === 'down').sort((a, b) => a.number - b.number);

  const isWordFilled = (w: PlacedWord) => {
    for (let i = 0; i < w.length; i++) {
      const r = w.direction === 'down' ? w.row + i : w.row;
      const c = w.direction === 'across' ? w.col + i : w.col;
      const val = userAnswers[`${r}_${c}`];
      if (!val || val.trim() === '') return false;
    }
    return true;
  };

  return (
    <div className="flex flex-col h-full bg-stone-900/40 rounded-xl border border-stone-300/80 p-3 sm:p-4 backdrop-blur-xs shadow-sm">
      
      {/* Prominent Current Clue Bar */}
      <div className="mb-4 bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
        <div className="flex items-center justify-between text-xs font-semibold text-amber-800 uppercase tracking-wider mb-1">
          <span>Current Clue</span>
          <span className="font-mono bg-amber-200/80 text-amber-900 px-2 py-0.5 rounded font-bold">
            {activeWord ? `${activeWord.number} ${activeWord.direction.toUpperCase()}` : 'Select a word'}
          </span>
        </div>
        <p className="text-stone-900 font-serif-title font-semibold text-sm sm:text-base leading-snug">
          {activeWord ? activeWord.clue : 'Click any square or clue to begin solving'}
        </p>
      </div>

      {/* Clues Split Columns (Across & Down) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 min-h-[300px] overflow-hidden">
        
        {/* Across Column */}
        <div className="flex flex-col h-full border border-stone-200 bg-white/80 rounded-lg p-3 shadow-xs">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-stone-200">
            <h3 className="font-bold text-xs uppercase tracking-wider text-stone-800 flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-600 inline-block" />
              <span>Across</span>
            </h3>
            <span className="text-[11px] font-medium text-stone-500">
              {acrossWords.filter(isWordFilled).length} / {acrossWords.length} filled
            </span>
          </div>

          <ul className="space-y-1.5 overflow-y-auto max-h-[420px] custom-scrollbar pr-1 flex-1">
            {acrossWords.map((item) => {
              const isActive = activeWord?.id === item.id;
              const filled = isWordFilled(item);

              return (
                <li
                  key={item.id}
                  ref={isActive ? activeClueRef : null}
                  onClick={() => onSelectWord(item)}
                  className={`group flex items-start space-x-2.5 p-2 rounded-md cursor-pointer transition-all text-xs sm:text-sm ${
                    isActive
                      ? 'bg-amber-100 text-amber-950 font-semibold ring-1 ring-amber-400 shadow-xs'
                      : 'hover:bg-stone-100 text-stone-800'
                  }`}
                >
                  <span className={`font-mono-grid font-bold text-xs shrink-0 w-6 text-right ${
                    isActive ? 'text-amber-800' : 'text-stone-500'
                  }`}>
                    {item.number}.
                  </span>
                  <span className={`flex-1 leading-snug ${filled && !isActive ? 'text-stone-400 line-through' : ''}`}>
                    {item.clue}
                  </span>
                  {filled && (
                    <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${
                      isActive ? 'text-amber-700' : 'text-emerald-600'
                    }`} />
                  )}
                </li>
              );
            })}
          </ul>
        </div>

        {/* Down Column */}
        <div className="flex flex-col h-full border border-stone-200 bg-white/80 rounded-lg p-3 shadow-xs">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-stone-200">
            <h3 className="font-bold text-xs uppercase tracking-wider text-stone-800 flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-600 inline-block" />
              <span>Down</span>
            </h3>
            <span className="text-[11px] font-medium text-stone-500">
              {downWords.filter(isWordFilled).length} / {downWords.length} filled
            </span>
          </div>

          <ul className="space-y-1.5 overflow-y-auto max-h-[420px] custom-scrollbar pr-1 flex-1">
            {downWords.map((item) => {
              const isActive = activeWord?.id === item.id;
              const filled = isWordFilled(item);

              return (
                <li
                  key={item.id}
                  ref={isActive ? activeClueRef : null}
                  onClick={() => onSelectWord(item)}
                  className={`group flex items-start space-x-2.5 p-2 rounded-md cursor-pointer transition-all text-xs sm:text-sm ${
                    isActive
                      ? 'bg-blue-100 text-blue-950 font-semibold ring-1 ring-blue-400 shadow-xs'
                      : 'hover:bg-stone-100 text-stone-800'
                  }`}
                >
                  <span className={`font-mono-grid font-bold text-xs shrink-0 w-6 text-right ${
                    isActive ? 'text-blue-800' : 'text-stone-500'
                  }`}>
                    {item.number}.
                  </span>
                  <span className={`flex-1 leading-snug ${filled && !isActive ? 'text-stone-400 line-through' : ''}`}>
                    {item.clue}
                  </span>
                  {filled && (
                    <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${
                      isActive ? 'text-blue-700' : 'text-emerald-600'
                    }`} />
                  )}
                </li>
              );
            })}
          </ul>
        </div>

      </div>
    </div>
  );
};
