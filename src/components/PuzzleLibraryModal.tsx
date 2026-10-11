import React, { useState } from 'react';
import { 
  X, 
  BookOpen, 
  PlusCircle, 
  Trash2, 
  CheckCircle2, 
  Grid3X3, 
  Sparkles, 
  Search,
  Printer,
  Play,
  CloudCheck,
  FolderOpen,
  Calendar
} from 'lucide-react';
import { CrosswordPuzzle } from '../types/crossword';

interface PuzzleLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  puzzles: CrosswordPuzzle[];
  currentPuzzleId: string;
  onSelectPuzzle: (puzzle: CrosswordPuzzle) => void;
  onOpenCreator: () => void;
  onOpenPrint?: (puzzle: CrosswordPuzzle) => void;
  onDeletePuzzle?: (id: string) => void;
}

export const PuzzleLibraryModal: React.FC<PuzzleLibraryModalProps> = ({
  isOpen,
  onClose,
  puzzles,
  currentPuzzleId,
  onSelectPuzzle,
  onOpenCreator,
  onOpenPrint,
  onDeletePuzzle
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'custom' | 'presets'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const customPuzzles = puzzles.filter(p => p.isCustom);
  const presets = puzzles.filter(p => !p.isCustom);

  // Filter based on active tab and search query
  const filteredPuzzles = puzzles.filter(p => {
    if (activeTab === 'custom' && !p.isCustom) return false;
    if (activeTab === 'presets' && p.isCustom) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = p.title.toLowerCase().includes(q);
      const matchWords = p.layout.words.some(w => w.answer.toLowerCase().includes(q) || w.clue.toLowerCase().includes(q));
      return matchTitle || matchWords;
    }
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-xs overflow-y-auto">
      <div className="bg-stone-900 border border-stone-800 text-stone-100 rounded-2xl max-w-4xl w-full p-4 sm:p-6 shadow-2xl relative my-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-stone-800 mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <FolderOpen className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold font-serif-title text-amber-100 flex items-center space-x-2">
                <span>Crossword Library</span>
                <span className="text-xs font-sans font-semibold bg-stone-800 text-amber-300 px-2 py-0.5 rounded-full border border-stone-700">
                  {puzzles.length} Total
                </span>
              </h2>
              <p className="text-xs text-stone-400">
                Browse and manage all your generated, saved, and featured crossword puzzles
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                onClose();
                onOpenCreator();
              }}
              className="flex items-center space-x-1.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold px-3 py-1.5 rounded-lg text-xs sm:text-sm transition-all shadow-sm"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create New Puzzle</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter Tabs & Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-4 bg-stone-950 p-2.5 rounded-xl border border-stone-800">
          
          {/* Tabs */}
          <div className="flex items-center space-x-1 bg-stone-900 p-1 rounded-lg border border-stone-800">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center space-x-1.5 ${
                activeTab === 'all'
                  ? 'bg-amber-500 text-stone-950 shadow-xs'
                  : 'text-stone-300 hover:text-white'
              }`}
            >
              <span>All Puzzles</span>
              <span className="text-[10px] px-1.5 py-0.2 bg-black/20 rounded-full">
                {puzzles.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('custom')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center space-x-1.5 ${
                activeTab === 'custom'
                  ? 'bg-amber-500 text-stone-950 shadow-xs'
                  : 'text-stone-300 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>My Created</span>
              <span className="text-[10px] px-1.5 py-0.2 bg-black/20 rounded-full font-bold">
                {customPuzzles.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('presets')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center space-x-1.5 ${
                activeTab === 'presets'
                  ? 'bg-amber-500 text-stone-950 shadow-xs'
                  : 'text-stone-300 hover:text-white'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Featured Presets</span>
              <span className="text-[10px] px-1.5 py-0.2 bg-black/20 rounded-full">
                {presets.length}
              </span>
            </button>
          </div>

          {/* Search box */}
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title or clue..."
              className="w-full bg-stone-900 border border-stone-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-stone-100 placeholder-stone-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

        </div>

        {/* Puzzle Cards Grid */}
        <div className="max-h-[500px] overflow-y-auto pr-1">
          {filteredPuzzles.length === 0 ? (
            <div className="text-center py-12 bg-stone-950/50 rounded-xl border border-dashed border-stone-800">
              <Sparkles className="w-10 h-10 text-stone-600 mx-auto mb-2" />
              <p className="text-sm font-semibold text-stone-300">
                {activeTab === 'custom' 
                  ? "You haven't created any custom puzzles yet." 
                  : "No puzzles found matching your search."}
              </p>
              <p className="text-xs text-stone-500 mt-1 mb-4">
                {activeTab === 'custom'
                  ? "Use the Crossword Generator to input your answers and clues!"
                  : "Try clearing your search query or switching tabs."}
              </p>
              {activeTab === 'custom' && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenCreator();
                  }}
                  className="inline-flex items-center space-x-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold px-4 py-2 rounded-lg text-xs shadow-md transition-all"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Create Your First Crossword</span>
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filteredPuzzles.map((p) => {
                const isCurrent = p.id === currentPuzzleId;
                const isCustom = p.isCustom;

                return (
                  <div
                    key={p.id}
                    className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
                      isCurrent
                        ? 'bg-amber-950/30 border-amber-500 shadow-md ring-1 ring-amber-500'
                        : 'bg-stone-950 border-stone-800 hover:border-stone-700 hover:bg-stone-900/60'
                    }`}
                  >
                    <div>
                      {/* Top Badges */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-1.5">
                          {isCustom ? (
                            <span className="inline-flex items-center space-x-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                              <Sparkles className="w-3 h-3" />
                              <span>Custom Generated</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center space-x-1 bg-stone-800 text-stone-300 border border-stone-700 px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider">
                              <BookOpen className="w-3 h-3 text-stone-400" />
                              <span>Preset</span>
                            </span>
                          )}

                          {isCurrent && (
                            <span className="inline-flex items-center space-x-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-2 py-0.5 rounded text-[10px] font-bold">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Active Now</span>
                            </span>
                          )}
                        </div>

                        {/* Delete button for custom puzzle */}
                        {isCustom && onDeletePuzzle && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm(`Are you sure you want to delete "${p.title}"?`)) {
                                onDeletePuzzle(p.id);
                              }
                            }}
                            className="p-1 rounded text-stone-500 hover:text-rose-400 hover:bg-stone-800 transition-colors"
                            title="Delete puzzle"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Title & Description */}
                      <h3 className="font-serif-title font-bold text-base sm:text-lg text-stone-100 group-hover:text-amber-200">
                        {p.title}
                      </h3>
                      {p.description && (
                        <p className="text-xs text-stone-400 line-clamp-2 mt-1">
                          {p.description}
                        </p>
                      )}

                      {/* Puzzle Specs */}
                      <div className="flex flex-wrap items-center gap-3 text-xs text-stone-400 mt-2.5">
                        <span className="flex items-center space-x-1">
                          <Grid3X3 className="w-3.5 h-3.5 text-stone-500" />
                          <span>{p.layout.width} × {p.layout.height} Grid</span>
                        </span>
                        <span>•</span>
                        <span>{p.layout.words.length} Words ({p.layout.words.filter(w => w.direction === 'across').length} Across, {p.layout.words.filter(w => w.direction === 'down').length} Down)</span>
                      </div>
                    </div>

                    {/* Bottom Action Bar */}
                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-stone-800/80">
                      <span className="text-[11px] text-stone-500">
                        {p.createdAt ? new Date(p.createdAt).toLocaleDateString() : 'Ready'}
                      </span>

                      <div className="flex items-center space-x-2">
                        {/* Print shortcut */}
                        {onOpenPrint && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectPuzzle(p);
                              onClose();
                              onOpenPrint(p);
                            }}
                            className="p-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white rounded-lg text-xs transition-colors flex items-center space-x-1 border border-stone-700"
                            title="Print or export this puzzle"
                          >
                            <Printer className="w-3.5 h-3.5 text-amber-400" />
                            <span className="hidden sm:inline">Print</span>
                          </button>
                        )}

                        {/* Play button */}
                        <button
                          type="button"
                          onClick={() => {
                            onSelectPuzzle(p);
                            onClose();
                          }}
                          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm ${
                            isCurrent
                              ? 'bg-amber-500 text-stone-950 hover:bg-amber-400'
                              : 'bg-stone-800 hover:bg-stone-700 text-amber-300 hover:text-amber-200 border border-stone-700'
                          }`}
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>{isCurrent ? 'Continue Solving' : 'Load & Solve'}</span>
                        </button>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
