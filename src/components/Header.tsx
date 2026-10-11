import React from 'react';
import { 
  Printer, 
  PlusCircle, 
  BookOpen, 
  FolderOpen,
  Clock, 
  Play, 
  Pause, 
  RotateCcw, 
  Cloud, 
  CloudCheck, 
  LogOut, 
  Sparkles 
} from 'lucide-react';
import { type User } from 'firebase/auth';

interface HeaderProps {
  puzzleTitle: string;
  totalPuzzlesCount?: number;
  customPuzzlesCount?: number;
  elapsedSeconds: number;
  isTimerRunning: boolean;
  onToggleTimer: () => void;
  onResetProgress: () => void;
  onOpenLibrary: () => void;
  onOpenCreator: () => void;
  onOpenPrint: () => void;
  user: User | null;
  isSyncing: boolean;
  onSignIn: () => void;
  onSignOut: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  puzzleTitle,
  totalPuzzlesCount = 0,
  customPuzzlesCount = 0,
  elapsedSeconds,
  isTimerRunning,
  onToggleTimer,
  onResetProgress,
  onOpenLibrary,
  onOpenCreator,
  onOpenPrint,
  user,
  isSyncing,
  onSignIn,
  onSignOut
}) => {
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <header className="no-print bg-stone-900 text-stone-100 border-b border-stone-800 sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Left: Brand & Puzzle Selector */}
          <div className="flex items-center space-x-2.5 sm:space-x-4">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-lg bg-amber-500 text-stone-950 flex items-center justify-center font-brand font-bold text-lg shadow-sm">
                CW
              </div>
              <div className="hidden md:block">
                <span className="font-serif-title text-xl font-bold tracking-tight text-amber-100">
                  Crossword Studio
                </span>
                <span className="block text-[10px] text-stone-400 font-sans uppercase tracking-widest -mt-1">
                  Craft • Solve • Print
                </span>
              </div>
            </div>

            <div className="h-6 w-px bg-stone-700 hidden sm:block" />

            {/* Prominent "My Puzzles / Library" Button */}
            <button
              onClick={onOpenLibrary}
              className="flex items-center space-x-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 hover:text-white px-3 py-1.5 rounded-lg border border-stone-700 text-xs sm:text-sm font-semibold transition-all shadow-sm group"
              title="Open all saved and generated crosswords"
            >
              <FolderOpen className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
              <span>My Puzzles</span>
              <span className="bg-amber-500 text-stone-950 text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                {customPuzzlesCount > 0 ? `${customPuzzlesCount} Created` : totalPuzzlesCount}
              </span>
            </button>

            {/* Current Puzzle Title pill */}
            <button
              onClick={onOpenLibrary}
              className="hidden lg:flex items-center space-x-1.5 bg-stone-950/80 hover:bg-stone-950 text-stone-300 hover:text-white px-2.5 py-1.5 rounded-lg border border-stone-800 text-xs transition-all max-w-[200px]"
              title="Click to switch active puzzle"
            >
              <span className="text-stone-500">Playing:</span>
              <span className="truncate font-serif-title font-medium text-amber-100">
                {puzzleTitle}
              </span>
            </button>
          </div>

          {/* Center: Timer & Controls */}
          <div className="hidden lg:flex items-center space-x-3 bg-stone-950/60 px-3.5 py-1.5 rounded-full border border-stone-800">
            <Clock className="w-4 h-4 text-amber-400" />
            <span className="font-mono-grid text-sm font-semibold tracking-wider text-amber-100 w-12 text-center">
              {formatTime(elapsedSeconds)}
            </span>
            <button
              onClick={onToggleTimer}
              className="p-1 hover:bg-stone-800 rounded-full text-stone-300 hover:text-white transition-colors"
              title={isTimerRunning ? 'Pause timer' : 'Resume timer'}
            >
              {isTimerRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={onResetProgress}
              className="p-1 hover:bg-stone-800 rounded-full text-stone-400 hover:text-stone-200 transition-colors"
              title="Reset progress & timer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Right: Actions & User Auth */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Create Custom Puzzle */}
            <button
              onClick={onOpenCreator}
              className="flex items-center space-x-1.5 bg-amber-600 hover:bg-amber-500 text-stone-950 font-semibold px-3 py-1.5 rounded-lg text-xs sm:text-sm shadow-sm transition-all hover:shadow"
            >
              <PlusCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Create Puzzle</span>
              <span className="sm:hidden">Create</span>
            </button>

            {/* Print / Export PDF */}
            <button
              onClick={onOpenPrint}
              className="flex items-center space-x-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 hover:text-white px-3 py-1.5 rounded-lg border border-stone-700 text-xs sm:text-sm transition-all shadow-sm"
              title="Print or Export PDF"
            >
              <Printer className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">Print / PDF</span>
            </button>

            {/* Google OAuth Login Status */}
            {user ? (
              <div className="flex items-center space-x-2 pl-1 border-l border-stone-800 ml-1">
                <div className="relative group">
                  <div className="flex items-center space-x-2 bg-stone-800/80 px-2 py-1 rounded-lg border border-stone-700 cursor-pointer">
                    {user.photoURL ? (
                      <img 
                        src={user.photoURL} 
                        alt={user.displayName || 'User'} 
                        className="w-6 h-6 rounded-full object-cover border border-amber-400/50" 
                      />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-amber-500 text-stone-950 text-xs font-bold flex items-center justify-center">
                        {(user.displayName || user.email || 'U')[0].toUpperCase()}
                      </div>
                    )}
                    <span className="hidden md:inline text-xs font-medium text-stone-200 max-w-[90px] truncate">
                      {user.displayName?.split(' ')[0] || 'User'}
                    </span>
                    {isSyncing ? (
                      <span title="Syncing...">
                        <Cloud className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                      </span>
                    ) : (
                      <span title="Cloud synced">
                        <CloudCheck className="w-3.5 h-3.5 text-emerald-400" />
                      </span>
                    )}
                  </div>

                  {/* Dropdown menu */}
                  <div className="absolute right-0 mt-1 w-48 bg-stone-800 rounded-lg shadow-xl border border-stone-700 py-1 hidden group-hover:block group-focus-within:block z-50">
                    <div className="px-3 py-2 border-b border-stone-700">
                      <p className="text-xs font-semibold text-stone-200 truncate">{user.displayName || 'Account'}</p>
                      <p className="text-[11px] text-stone-400 truncate">{user.email}</p>
                      <div className="flex items-center space-x-1 mt-1 text-[10px] text-emerald-400">
                        <CloudCheck className="w-3 h-3" />
                        <span>Google Sync Active</span>
                      </div>
                    </div>
                    <button
                      onClick={onOpenLibrary}
                      className="w-full text-left px-3 py-2 text-xs text-stone-200 hover:bg-stone-700/60 flex items-center space-x-2"
                    >
                      <FolderOpen className="w-3.5 h-3.5 text-amber-400" />
                      <span>Saved Puzzles Library</span>
                    </button>
                    <button
                      onClick={onSignOut}
                      className="w-full text-left px-3 py-2 text-xs text-rose-300 hover:bg-stone-700/60 flex items-center space-x-2 border-t border-stone-700"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <button
                onClick={onSignIn}
                className="flex items-center space-x-1.5 bg-white hover:bg-stone-100 text-stone-800 font-medium px-2.5 sm:px-3 py-1.5 rounded-lg text-xs shadow-sm transition-all ml-1 border border-stone-300"
                title="Sign in with Google to sync progress across devices"
              >
                {/* Google Multi-color G Icon */}
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.03h3.88c2.27-2.09 3.665-5.17 3.665-9.12z" />
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.03c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.13C3.27 21.41 7.34 24 12 24z" />
                  <path fill="#FBBC05" d="M5.28 14.29c-.25-.72-.38-1.49-.38-2.29s.13-1.57.38-2.29V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.13z" />
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.27 2.59 1.25 6.58l4.03 3.13c.95-2.83 3.6-4.96 6.72-4.96z" />
                </svg>
                <span className="hidden sm:inline">Google Sync</span>
                <span className="sm:hidden">Login</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
