import React from 'react';
import { Delete, ArrowRight, RefreshCw } from 'lucide-react';

interface VirtualKeyboardProps {
  onEnterLetter: (letter: string) => void;
  onBackspace: () => void;
  onToggleDirection: () => void;
  onNextWord: () => void;
}

const KEYBOARD_ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['Z', 'X', 'C', 'V', 'B', 'N', 'M']
];

export const VirtualKeyboard: React.FC<VirtualKeyboardProps> = ({
  onEnterLetter,
  onBackspace,
  onToggleDirection,
  onNextWord
}) => {
  return (
    <div className="virtual-keyboard w-full max-w-lg mx-auto bg-stone-900/90 backdrop-blur-sm p-1.5 sm:p-2 rounded-xl border border-stone-800 shadow-lg mt-3 select-none">
      
      {/* Top Action Ribbon for mobile */}
      <div className="flex items-center justify-between gap-1.5 mb-1.5 px-0.5">
        <button
          onClick={onToggleDirection}
          className="flex-1 py-1.5 bg-stone-800 active:bg-stone-700 text-stone-200 text-xs font-semibold rounded-md border border-stone-700 flex items-center justify-center space-x-1"
        >
          <RefreshCw className="w-3 h-3 text-amber-400" />
          <span>Toggle Dir</span>
        </button>
        <button
          onClick={onNextWord}
          className="flex-1 py-1.5 bg-stone-800 active:bg-stone-700 text-stone-200 text-xs font-semibold rounded-md border border-stone-700 flex items-center justify-center space-x-1"
        >
          <span>Next Clue</span>
          <ArrowRight className="w-3 h-3 text-amber-400" />
        </button>
      </div>

      {/* Row 1 */}
      <div className="flex justify-center gap-1 mb-1">
        {KEYBOARD_ROWS[0].map(k => (
          <button
            key={k}
            onClick={() => onEnterLetter(k)}
            className="flex-1 max-w-[38px] h-10 bg-stone-800 active:bg-amber-500 text-stone-100 active:text-stone-950 font-bold font-mono-grid text-sm sm:text-base rounded shadow-xs flex items-center justify-center transition-transform active:scale-95"
          >
            {k}
          </button>
        ))}
      </div>

      {/* Row 2 */}
      <div className="flex justify-center gap-1 mb-1 px-2">
        {KEYBOARD_ROWS[1].map(k => (
          <button
            key={k}
            onClick={() => onEnterLetter(k)}
            className="flex-1 max-w-[38px] h-10 bg-stone-800 active:bg-amber-500 text-stone-100 active:text-stone-950 font-bold font-mono-grid text-sm sm:text-base rounded shadow-xs flex items-center justify-center transition-transform active:scale-95"
          >
            {k}
          </button>
        ))}
      </div>

      {/* Row 3 with Backspace */}
      <div className="flex justify-center gap-1">
        <div className="w-5" />
        {KEYBOARD_ROWS[2].map(k => (
          <button
            key={k}
            onClick={() => onEnterLetter(k)}
            className="flex-1 max-w-[38px] h-10 bg-stone-800 active:bg-amber-500 text-stone-100 active:text-stone-950 font-bold font-mono-grid text-sm sm:text-base rounded shadow-xs flex items-center justify-center transition-transform active:scale-95"
          >
            {k}
          </button>
        ))}
        <button
          onClick={onBackspace}
          className="flex-1 max-w-[46px] h-10 bg-stone-700 active:bg-rose-600 text-stone-200 active:text-white font-bold rounded shadow-xs flex items-center justify-center transition-transform active:scale-95"
          title="Backspace"
        >
          <Delete className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
};
