import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  Shuffle, 
  Play, 
  AlertCircle, 
  CheckCircle, 
  BookOpen, 
  HelpCircle 
} from 'lucide-react';
import { parseRawInput, generateCrosswordLayout } from '../lib/crosswordGenerator';
import { CrosswordPuzzle, CrosswordLayout } from '../types/crossword';

interface PuzzleCreatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveAndPlay: (puzzle: CrosswordPuzzle) => void;
}

export const PuzzleCreatorModal: React.FC<PuzzleCreatorModalProps> = ({
  isOpen,
  onClose,
  onSaveAndPlay
}) => {
  const [title, setTitle] = useState('My Custom Crossword');
  const [rawText, setRawText] = useState(
    `APPLE, a red fruit; BANANA, a long yellow fruit; CHERRY, a small sweet stone fruit; ORANGE, citrus fruit and vibrant color; MANGO, sweet tropical fruit`
  );
  const [generatedLayout, setGeneratedLayout] = useState<CrosswordLayout | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const parsedWords = parseRawInput(rawText);

  const handleGenerate = () => {
    setErrorMsg(null);
    if (parsedWords.length < 2) {
      setErrorMsg('Please enter at least 2 answer-clue pairs to build an interlocking crossword.');
      return;
    }

    setIsGenerating(true);
    try {
      // Execute layout generator
      const layout = generateCrosswordLayout(parsedWords, { maxGridSize: 28, trials: 60 });
      setGeneratedLayout(layout);

      if (layout.words.length === 0) {
        setErrorMsg('Words could not be connected. Please ensure words share at least some matching letters.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to generate layout. Please check your words for overlapping letters.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleInsertSample = () => {
    setTitle('Garden & Orchard Harvest');
    setRawText(
      `APPLE, a red fruit;\nBANANA, a long yellow fruit;\nCHERRY, a small sweet stone fruit;\nORANGE, citrus fruit and vibrant color;\nLEMON, a sour yellow fruit;\nPEACH, fuzzy summer stone fruit;\nGRAPE, small fruit grown in bunches`
    );
    setGeneratedLayout(null);
    setErrorMsg(null);
  };

  const handleSave = () => {
    if (!title.trim()) {
      setErrorMsg('Please provide a title for your crossword puzzle.');
      return;
    }

    // If layout hasn't been generated yet, generate it now
    let layoutToUse = generatedLayout;
    if (!layoutToUse) {
      if (parsedWords.length < 2) {
        setErrorMsg('Please enter at least 2 valid words.');
        return;
      }
      layoutToUse = generateCrosswordLayout(parsedWords, { maxGridSize: 28, trials: 60 });
    }

    if (!layoutToUse || layoutToUse.words.length === 0) {
      setErrorMsg('Please generate a valid crossword layout before playing.');
      return;
    }

    const newPuzzle: CrosswordPuzzle = {
      id: `custom_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      title: title.trim(),
      rawInput: rawText,
      layout: layoutToUse,
      createdAt: new Date().toISOString(),
      isCustom: true
    };

    onSaveAndPlay(newPuzzle);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-stone-900 border border-stone-800 text-stone-100 rounded-2xl max-w-3xl w-full p-5 sm:p-6 shadow-2xl relative my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-stone-800 mb-5">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-serif-title text-amber-100">
                Crossword Puzzle Generator
              </h2>
              <p className="text-xs text-stone-400">
                Design custom puzzles with instant grid layout generation
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <div className="space-y-4">
          
          {/* Puzzle Title Field */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-300 mb-1.5">
              Puzzle Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Fruit Harvest, 90s Music Trivia..."
              className="w-full bg-stone-950 border border-stone-700 rounded-lg px-3.5 py-2 text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 placeholder-stone-500"
            />
          </div>

          {/* Word & Clue Format Input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-300">
                Words & Clues <span className="text-amber-400 font-normal">(`ANSWER, question`)</span>
              </label>
              <div className="flex items-center space-x-2 text-xs">
                <button
                  type="button"
                  onClick={handleInsertSample}
                  className="text-amber-400 hover:text-amber-300 font-medium underline"
                >
                  Insert Sample
                </button>
                <span className="text-stone-600">•</span>
                <button
                  type="button"
                  onClick={() => { setRawText(''); setGeneratedLayout(null); }}
                  className="text-stone-400 hover:text-stone-200"
                >
                  Clear
                </button>
              </div>
            </div>

            <textarea
              rows={5}
              value={rawText}
              onChange={(e) => {
                setRawText(e.target.value);
                setGeneratedLayout(null);
              }}
              placeholder="APPLE, a red fruit; BANANA, a long yellow fruit; ORANGE, citrus fruit..."
              className="w-full bg-stone-950 border border-stone-700 rounded-lg p-3 text-stone-100 font-mono text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 placeholder-stone-600 resize-y"
            />

            {/* Parsing summary */}
            <div className="flex flex-wrap items-center justify-between gap-2 mt-1.5 text-xs text-stone-400">
              <div className="flex items-center space-x-1.5">
                <span className="inline-block w-2 h-2 rounded-full bg-amber-500" />
                <span>
                  Format: <code className="text-amber-300">ANSWER, question</code> separated by semicolons (<code className="text-amber-300">;</code>) or newlines.
                </span>
              </div>
              <span className="font-medium text-stone-300">
                {parsedWords.length} words detected
              </span>
            </div>
          </div>

          {/* Action Row: Generate Layout */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              onClick={handleGenerate}
              disabled={isGenerating || parsedWords.length < 2}
              className="flex items-center space-x-2 bg-stone-800 hover:bg-stone-700 disabled:opacity-50 text-amber-300 px-4 py-2 rounded-lg border border-stone-700 font-semibold text-sm transition-all"
            >
              <Shuffle className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
              <span>{generatedLayout ? 'Regenerate Different Layout' : 'Generate Grid Layout'}</span>
            </button>

            {generatedLayout && (
              <span className="text-xs text-emerald-400 flex items-center space-x-1">
                <CheckCircle className="w-4 h-4" />
                <span>
                  Layout ready: {generatedLayout.words.length} of {parsedWords.length} words placed ({generatedLayout.width}x{generatedLayout.height})
                </span>
              </span>
            )}
          </div>

          {/* Error display */}
          {errorMsg && (
            <div className="bg-rose-950/60 border border-rose-800 rounded-lg p-3 text-rose-200 text-xs flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Mini Grid Preview if Generated */}
          {generatedLayout && (
            <div className="bg-stone-950 p-3 rounded-xl border border-stone-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-stone-400">
                  Grid Preview
                </span>
                <span className="text-xs text-stone-500">
                  {generatedLayout.words.filter(w => w.direction === 'across').length} Across • {generatedLayout.words.filter(w => w.direction === 'down').length} Down
                </span>
              </div>

              {/* Scaled Mini Grid */}
              <div className="flex justify-center p-2 bg-stone-900 rounded-lg overflow-x-auto">
                <div 
                  className="grid gap-[1px] bg-stone-800 p-1 rounded"
                  style={{
                    gridTemplateColumns: `repeat(${generatedLayout.width}, 18px)`,
                  }}
                >
                  {generatedLayout.cells.map((rowCells, r) =>
                    rowCells.map((cell, c) => (
                      <div
                        key={`${r}_${c}`}
                        className={`w-[18px] h-[18px] flex items-center justify-center text-[10px] font-mono-grid font-bold rounded-[1px] ${
                          cell.isBlocked ? 'bg-stone-950' : 'bg-white text-stone-950'
                        }`}
                      >
                        {!cell.isBlocked && cell.letter}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="mt-6 pt-4 border-t border-stone-800 flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-stone-400 hover:text-stone-200"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={parsedWords.length < 2}
            className="flex items-center space-x-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-stone-950 px-5 py-2 rounded-lg font-bold text-sm shadow-md transition-all"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Save & Play Crossword</span>
          </button>
        </div>

      </div>
    </div>
  );
};
