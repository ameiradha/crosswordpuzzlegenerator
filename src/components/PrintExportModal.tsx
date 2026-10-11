import React, { useState } from 'react';
import { 
  X, 
  Printer, 
  Download, 
  FileText, 
  KeyRound, 
  Settings2, 
  Check, 
  HelpCircle 
} from 'lucide-react';
import { CrosswordPuzzle, PrintOptions } from '../types/crossword';
import { exportPuzzleToPDF } from '../lib/pdfExport';

interface PrintExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  puzzle: CrosswordPuzzle;
}

export const PrintExportModal: React.FC<PrintExportModalProps> = ({
  isOpen,
  onClose,
  puzzle
}) => {
  const [options, setOptions] = useState<PrintOptions>({
    mode: 'puzzle',
    showWordBank: false,
    includeNameHeader: true,
    fontSize: 'medium',
    paperSize: 'letter'
  });

  if (!isOpen) return null;

  const handleBrowserPrint = () => {
    window.print();
  };

  const handleDownloadPdf = () => {
    exportPuzzleToPDF(puzzle, options);
  };

  const acrossWords = puzzle.layout.words.filter(w => w.direction === 'across').sort((a, b) => a.number - b.number);
  const downWords = puzzle.layout.words.filter(w => w.direction === 'down').sort((a, b) => a.number - b.number);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-stone-900 border border-stone-800 text-stone-100 rounded-2xl max-w-4xl w-full p-4 sm:p-6 shadow-2xl relative my-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-stone-800 mb-4">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-serif-title text-amber-100">
                Print & Export Crossword
              </h2>
              <p className="text-xs text-stone-400">
                Generate clean printable paper worksheets and solution keysheets
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

        {/* Configuration Bar */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5 bg-stone-950 p-4 rounded-xl border border-stone-800">
          
          {/* Mode Selector */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-400 mb-2">
              Document Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setOptions(prev => ({ ...prev, mode: 'puzzle' }))}
                className={`flex items-center justify-center space-x-2 py-2 px-3 rounded-lg border text-xs font-bold transition-all ${
                  options.mode === 'puzzle'
                    ? 'bg-amber-500 text-stone-950 border-amber-500 shadow-sm'
                    : 'bg-stone-900 text-stone-300 border-stone-700 hover:bg-stone-800'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>Blank Worksheet</span>
              </button>

              <button
                type="button"
                onClick={() => setOptions(prev => ({ ...prev, mode: 'keysheet' }))}
                className={`flex items-center justify-center space-x-2 py-2 px-3 rounded-lg border text-xs font-bold transition-all ${
                  options.mode === 'keysheet'
                    ? 'bg-emerald-500 text-stone-950 border-emerald-500 shadow-sm'
                    : 'bg-stone-900 text-stone-300 border-stone-700 hover:bg-stone-800'
                }`}
              >
                <KeyRound className="w-4 h-4" />
                <span>Answer Keysheet</span>
              </button>
            </div>
          </div>

          {/* Options Toggles */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-400 mb-2">
              Page Formatting Options
            </label>
            <div className="flex flex-wrap items-center gap-3 text-xs">
              
              {options.mode === 'puzzle' && (
                <label className="flex items-center space-x-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={options.includeNameHeader}
                    onChange={(e) => setOptions(prev => ({ ...prev, includeNameHeader: e.target.checked }))}
                    className="rounded border-stone-700 bg-stone-900 text-amber-500 focus:ring-amber-500"
                  />
                  <span className="text-stone-300">Name & Date line</span>
                </label>
              )}

              {options.mode === 'puzzle' && (
                <label className="flex items-center space-x-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={options.showWordBank}
                    onChange={(e) => setOptions(prev => ({ ...prev, showWordBank: e.target.checked }))}
                    className="rounded border-stone-700 bg-stone-900 text-amber-500 focus:ring-amber-500"
                  />
                  <span className="text-stone-300">Word Bank box</span>
                </label>
              )}

              <div className="flex items-center space-x-1.5 ml-auto">
                <span className="text-stone-400 text-xs">Paper:</span>
                <select
                  value={options.paperSize}
                  onChange={(e) => setOptions(prev => ({ ...prev, paperSize: e.target.value as 'letter' | 'a4' }))}
                  className="bg-stone-900 border border-stone-700 text-stone-200 text-xs rounded px-2 py-1"
                >
                  <option value="letter">US Letter (8.5x11)</option>
                  <option value="a4">A4 Standard</option>
                </select>
              </div>

            </div>
          </div>

        </div>

        {/* Live Sheet Preview */}
        <div className="bg-stone-950 p-3 sm:p-4 rounded-xl border border-stone-800 mb-5 max-h-[460px] overflow-y-auto">
          <div className="text-xs font-semibold uppercase tracking-wider text-stone-400 mb-2 flex items-center justify-between">
            <span>Live Document Preview</span>
            <span className="text-[11px] text-amber-400 lowercase">
              {options.mode === 'keysheet' ? 'Includes filled answers' : 'Standard blank grid'}
            </span>
          </div>

          {/* White Paper Mockup */}
          <div className="bg-white text-stone-900 p-6 sm:p-8 rounded-lg shadow-xl max-w-2xl mx-auto border border-stone-300 select-none">
            
            {/* Sheet Header */}
            <div className="border-b-2 border-stone-900 pb-3 mb-4">
              <div className="mb-2">
                <h3 className="font-serif-title text-2xl sm:text-3xl font-bold tracking-tight text-stone-900">
                  {puzzle.title}
                </h3>
                <p className="text-xs font-semibold uppercase tracking-wider text-stone-500 mt-0.5">
                  {options.mode === 'keysheet' ? 'Official Answer Key & Solution' : 'Student Crossword Worksheet'}
                </p>
              </div>

              {/* 1. Name, Date, Score section placed BELOW and AFTER the title */}
              {options.includeNameHeader && options.mode === 'puzzle' && (
                <div className="mt-3 bg-stone-50 border border-stone-300 rounded-lg p-2.5 flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm font-medium text-stone-800">
                  <div className="flex-1 min-w-[140px] flex items-center space-x-1.5">
                    <span className="font-bold text-stone-900">Name:</span>
                    <span className="flex-1 border-b border-stone-400 inline-block h-4"></span>
                  </div>
                  <div className="flex-1 min-w-[110px] flex items-center space-x-1.5">
                    <span className="font-bold text-stone-900">Date:</span>
                    <span className="flex-1 border-b border-stone-400 inline-block h-4"></span>
                  </div>
                  <div className="w-28 flex items-center space-x-1.5">
                    <span className="font-bold text-stone-900">Score:</span>
                    <span className="flex-1 border-b border-stone-400 inline-block h-4"></span>
                  </div>
                </div>
              )}

              {options.mode === 'keysheet' && (
                <div className="mt-3 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-lg px-3 py-1.5 text-xs font-bold uppercase tracking-wide">
                  Teacher / Instructor Answer Key — Complete Solutions
                </div>
              )}
            </div>

            {/* 2. Bigger Crossword Grid Preview */}
            <div className="flex justify-center my-6 overflow-x-auto">
              <div 
                className="grid gap-[1px] bg-stone-900 p-[1.5px] border-2 border-stone-950 shadow-md"
                style={{
                  gridTemplateColumns: `repeat(${puzzle.layout.width}, minmax(26px, 38px))`,
                }}
              >
                {puzzle.layout.cells.map((rowCells, r) =>
                  rowCells.map((cell, c) => {
                    return (
                      <div
                        key={`${r}_${c}`}
                        className={`relative flex items-center justify-center font-bold font-mono-grid text-sm sm:text-base ${
                          cell.isBlocked ? 'bg-stone-950' : 'bg-white text-stone-950'
                        }`}
                        style={{ aspectRatio: '1 / 1' }}
                      >
                        {!cell.isBlocked && cell.number && (
                          <span className="absolute top-[1.5px] left-[2.5px] text-[9px] sm:text-[10px] font-bold text-stone-600 leading-none">
                            {cell.number}
                          </span>
                        )}
                        {!cell.isBlocked && options.mode === 'keysheet' && (
                          <span className="text-stone-950 font-black text-sm sm:text-base">
                            {cell.letter}
                          </span>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* 3. Bigger Clues / Questions for Students */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t-2 border-stone-300 text-sm">
              {/* Across */}
              <div>
                <h4 className="font-bold text-sm uppercase tracking-wider text-stone-900 mb-2 pb-1 border-b border-stone-200">
                  Across
                </h4>
                <ul className="space-y-2 text-stone-800 text-sm leading-relaxed">
                  {acrossWords.map(w => (
                    <li key={w.id} className="flex items-start space-x-1.5">
                      <span className="font-bold text-stone-950 font-mono-grid shrink-0">{w.number}.</span>
                      <span className="flex-1">
                        {w.clue}
                        {options.mode === 'keysheet' && (
                          <span className="font-bold text-emerald-800 ml-1.5">[{w.answer}]</span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Down */}
              <div>
                <h4 className="font-bold text-sm uppercase tracking-wider text-stone-900 mb-2 pb-1 border-b border-stone-200">
                  Down
                </h4>
                <ul className="space-y-2 text-stone-800 text-sm leading-relaxed">
                  {downWords.map(w => (
                    <li key={w.id} className="flex items-start space-x-1.5">
                      <span className="font-bold text-stone-950 font-mono-grid shrink-0">{w.number}.</span>
                      <span className="flex-1">
                        {w.clue}
                        {options.mode === 'keysheet' && (
                          <span className="font-bold text-emerald-800 ml-1.5">[{w.answer}]</span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Word Bank Preview */}
            {options.showWordBank && options.mode === 'puzzle' && (
              <div className="mt-5 pt-3 border-t-2 border-dashed border-stone-300 bg-stone-50 p-3 rounded-lg text-xs sm:text-sm">
                <span className="font-bold text-stone-900 mr-2 uppercase tracking-wide">Word Bank:</span>
                <span className="text-stone-700 font-mono">
                  {[...puzzle.layout.words.map(w => w.answer)].sort().join('   •   ')}
                </span>
              </div>
            )}

          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-stone-800">
          <div className="text-xs text-stone-400">
            Export directly as a PDF file or use the browser print dialog.
          </div>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 text-xs text-stone-400 hover:text-white"
            >
              Close
            </button>

            {/* Download PDF button */}
            <button
              type="button"
              onClick={handleDownloadPdf}
              className="flex items-center space-x-2 bg-stone-800 hover:bg-stone-700 text-stone-100 border border-stone-700 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all shadow-sm"
            >
              <Download className="w-4 h-4 text-amber-400" />
              <span>Download .PDF</span>
            </button>

            {/* Browser Print / Save as PDF */}
            <button
              type="button"
              onClick={handleBrowserPrint}
              className="flex items-center space-x-2 bg-amber-500 hover:bg-amber-400 text-stone-950 px-5 py-2 rounded-lg text-xs sm:text-sm font-bold shadow-md transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save as PDF</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
