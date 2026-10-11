import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, Clock, Printer, RotateCcw, BookOpen, X, Sparkles } from 'lucide-react';

interface CelebrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  puzzleTitle: string;
  elapsedSeconds: number;
  wordCount: number;
  onOpenPrint: () => void;
  onOpenLibrary: () => void;
  onReset: () => void;
}

export const CelebrationModal: React.FC<CelebrationModalProps> = ({
  isOpen,
  onClose,
  puzzleTitle,
  elapsedSeconds,
  wordCount,
  onOpenPrint,
  onOpenLibrary,
  onReset
}) => {
  useEffect(() => {
    if (isOpen) {
      // Fire confetti bursts
      const count = 200;
      const defaults = {
        origin: { y: 0.7 }
      };

      const fire = (particleRatio: number, opts: confetti.Options) => {
        confetti({
          ...defaults,
          ...opts,
          particleCount: Math.floor(count * particleRatio)
        });
      };

      fire(0.25, {
        spread: 26,
        startVelocity: 55,
      });
      fire(0.2, {
        spread: 60,
      });
      fire(0.35, {
        spread: 100,
        decay: 0.91,
        scalar: 0.8
      });
      fire(0.1, {
        spread: 120,
        startVelocity: 25,
        decay: 0.92,
        scalar: 1.2
      });
      fire(0.1, {
        spread: 120,
        startVelocity: 45,
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins}m ${s}s`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="bg-stone-900 border border-amber-500/50 text-stone-100 rounded-3xl max-w-md w-full p-6 shadow-2xl text-center relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Glow backdrop */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />

        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Trophy icon */}
        <div className="w-16 h-16 bg-amber-500 text-stone-950 rounded-2xl mx-auto flex items-center justify-center shadow-lg mb-4">
          <Trophy className="w-9 h-9" />
        </div>

        <h2 className="text-2xl font-bold font-serif-title text-amber-200 mb-1">
          Puzzle Solved!
        </h2>
        <p className="text-sm text-stone-300 font-serif-title mb-4">
          {puzzleTitle}
        </p>

        {/* Stats card */}
        <div className="grid grid-cols-2 gap-3 bg-stone-950/80 p-3.5 rounded-xl border border-stone-800 mb-6">
          <div className="text-center border-r border-stone-800">
            <span className="block text-[11px] uppercase tracking-wider text-stone-400 mb-0.5">Time</span>
            <div className="flex items-center justify-center space-x-1 text-amber-300 font-mono font-bold text-lg">
              <Clock className="w-4 h-4" />
              <span>{formatTime(elapsedSeconds)}</span>
            </div>
          </div>
          <div className="text-center">
            <span className="block text-[11px] uppercase tracking-wider text-stone-400 mb-0.5">Words</span>
            <div className="flex items-center justify-center space-x-1 text-emerald-400 font-mono font-bold text-lg">
              <Sparkles className="w-4 h-4" />
              <span>{wordCount} / {wordCount}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          <button
            onClick={() => {
              onClose();
              onOpenPrint();
            }}
            className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold rounded-xl text-sm transition-all flex items-center justify-center space-x-2 shadow-md"
          >
            <Printer className="w-4 h-4" />
            <span>Print or Export Answer Key PDF</span>
          </button>

          <button
            onClick={() => {
              onClose();
              onOpenLibrary();
            }}
            className="w-full py-2.5 bg-stone-800 hover:bg-stone-700 text-stone-200 font-semibold rounded-xl text-sm transition-all flex items-center justify-center space-x-2 border border-stone-700"
          >
            <BookOpen className="w-4 h-4 text-amber-400" />
            <span>Solve Another Puzzle</span>
          </button>

          <button
            onClick={() => {
              onClose();
              onReset();
            }}
            className="w-full py-2 text-stone-400 hover:text-stone-200 text-xs font-medium transition-colors flex items-center justify-center space-x-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Play Again from Scratch</span>
          </button>
        </div>

      </div>
    </div>
  );
};
