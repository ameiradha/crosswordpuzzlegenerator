import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { 
  auth, 
  signInWithGoogle, 
  logOut, 
  saveProgressToCloud, 
  fetchProgressFromCloud,
  savePuzzleToCloud,
  fetchUserPuzzlesFromCloud,
  testConnection
} from './lib/firebase';
import { 
  CrosswordPuzzle, 
  Direction, 
  PlacedWord, 
  UserAnswers, 
  UserProgress 
} from './types/crossword';
import { buildPresetPuzzles } from './lib/samplePuzzles';
import { Header } from './components/Header';
import { CrosswordGridComponent } from './components/CrosswordGridComponent';
import { ClueList } from './components/ClueList';
import { VirtualKeyboard } from './components/VirtualKeyboard';
import { PuzzleCreatorModal } from './components/PuzzleCreatorModal';
import { PrintExportModal } from './components/PrintExportModal';
import { PuzzleLibraryModal } from './components/PuzzleLibraryModal';
import { CelebrationModal } from './components/CelebrationModal';
import { LoginPage } from './components/LoginPage';
import { 
  Check, 
  Eye, 
  RotateCcw, 
  Eraser, 
  Sparkles, 
  Printer, 
  ChevronDown,
  Info,
  FolderOpen
} from 'lucide-react';

export default function App() {
  // Preset and custom puzzles list
  const [puzzles, setPuzzles] = useState<CrosswordPuzzle[]>(() => {
    const presets = buildPresetPuzzles();
    try {
      const stored = localStorage.getItem('crossword_custom_puzzles');
      if (stored) {
        const parsedCustom: CrosswordPuzzle[] = JSON.parse(stored);
        return [...parsedCustom, ...presets];
      }
    } catch (e) {
      console.warn('Failed to load local custom puzzles', e);
    }
    return presets;
  });

  // Current active puzzle
  const [currentPuzzle, setCurrentPuzzle] = useState<CrosswordPuzzle>(() => puzzles[0]);

  // Auth & Session state
  const [user, setUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState<boolean>(false);
  const [isGuestMode, setIsGuestMode] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Playing state
  const [userAnswers, setUserAnswers] = useState<UserAnswers>({});
  const [selectedRow, setSelectedRow] = useState<number>(0);
  const [selectedCol, setSelectedCol] = useState<number>(0);
  const [direction, setDirection] = useState<Direction>('across');
  const [checkedCells, setCheckedCells] = useState<{ [key: string]: 'correct' | 'incorrect' }>({});
  const [revealedCells, setRevealedCells] = useState<{ [key: string]: boolean }>({});
  
  // Timer state
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(true);

  // Modals state
  const [isCreatorOpen, setIsCreatorOpen] = useState(false);
  const [isPrintOpen, setIsPrintOpen] = useState(false);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [isCelebrationOpen, setIsCelebrationOpen] = useState(false);
  const [showCheckMenu, setShowCheckMenu] = useState(false);
  const [showRevealMenu, setShowRevealMenu] = useState(false);

  // Cloud sync debounce ref
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Test Firebase on load
  useEffect(() => {
    testConnection();
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthChecked(true);
      if (currentUser) {
        setIsGuestMode(false);
        // Fetch user custom puzzles from cloud
        fetchUserPuzzlesFromCloud(currentUser.uid).then(cloudPuzzles => {
          if (cloudPuzzles.length > 0) {
            setPuzzles(prev => {
              const ids = new Set(prev.map(p => p.id));
              const fresh = cloudPuzzles.filter(p => !ids.has(p.id));
              return [...fresh, ...prev];
            });
          }
        });
      }
    });
    return () => unsubscribe();
  }, []);

  // Set initial selected cell when puzzle changes
  useEffect(() => {
    if (!currentPuzzle || !currentPuzzle.layout) return;
    const firstWord = currentPuzzle.layout.words[0];
    if (firstWord) {
      setSelectedRow(firstWord.row);
      setSelectedCol(firstWord.col);
      setDirection(firstWord.direction);
    }
  }, [currentPuzzle.id]);

  // Load saved progress for the current puzzle
  useEffect(() => {
    if (!currentPuzzle) return;
    const puzzleId = currentPuzzle.id;

    // Check localStorage first for instant load
    const localKey = `crossword_progress_${puzzleId}`;
    const localSaved = localStorage.getItem(localKey);
    let loadedAnswers: UserAnswers = {};
    let loadedTime = 0;

    if (localSaved) {
      try {
        const parsed: UserProgress = JSON.parse(localSaved);
        loadedAnswers = parsed.answers || {};
        loadedTime = parsed.elapsedSeconds || 0;
      } catch (e) {
        console.warn('Error reading local progress', e);
      }
    }

    setUserAnswers(loadedAnswers);
    setElapsedSeconds(loadedTime);
    setCheckedCells({});
    setRevealedCells({});
    setIsTimerRunning(true);

    // If user is logged in, attempt to fetch from cloud and merge
    if (user) {
      setIsSyncing(true);
      fetchProgressFromCloud(user.uid, puzzleId).then((cloudProg) => {
        setIsSyncing(false);
        if (cloudProg && cloudProg.answers) {
          // Merge or prioritize cloud if newer
          setUserAnswers(prev => ({ ...prev, ...cloudProg.answers }));
          if (cloudProg.elapsedSeconds > loadedTime) {
            setElapsedSeconds(cloudProg.elapsedSeconds);
          }
        }
      });
    }
  }, [currentPuzzle.id, user?.uid]);

  // Timer tick
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isTimerRunning) {
      timer = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isTimerRunning]);

  // Find currently active word
  const activeWord = useMemo<PlacedWord | null>(() => {
    if (!currentPuzzle || !currentPuzzle.layout) return null;
    const words = currentPuzzle.layout.words;

    // Find a word matching the current direction that covers selectedRow, selectedCol
    const match = words.find(w => {
      if (w.direction !== direction) return false;
      if (direction === 'across') {
        return w.row === selectedRow && selectedCol >= w.col && selectedCol < w.col + w.length;
      } else {
        return w.col === selectedCol && selectedRow >= w.row && selectedRow < w.row + w.length;
      }
    });

    if (match) return match;

    // Fallback: word in the other direction that contains this cell
    const fallback = words.find(w => {
      if (w.direction === 'across') {
        return w.row === selectedRow && selectedCol >= w.col && selectedCol < w.col + w.length;
      } else {
        return w.col === selectedCol && selectedRow >= w.row && selectedRow < w.row + w.length;
      }
    });

    return fallback || null;
  }, [currentPuzzle, selectedRow, selectedCol, direction]);

  // Check completion
  const checkCompletion = useCallback((answers: UserAnswers) => {
    if (!currentPuzzle) return;
    const cells = currentPuzzle.layout.cells;
    let totalPlayable = 0;
    let correctCount = 0;

    for (let r = 0; r < currentPuzzle.layout.height; r++) {
      for (let c = 0; c < currentPuzzle.layout.width; c++) {
        const cell = cells[r]?.[c];
        if (cell && !cell.isBlocked) {
          totalPlayable++;
          const entered = answers[`${r}_${c}`];
          if (entered === cell.letter) {
            correctCount++;
          }
        }
      }
    }

    if (totalPlayable > 0 && correctCount === totalPlayable) {
      setIsTimerRunning(false);
      setIsCelebrationOpen(true);
      return true;
    }
    return false;
  }, [currentPuzzle]);

  // Auto-save progress helper
  const triggerAutoSave = useCallback((newAnswers: UserAnswers, time: number) => {
    if (!currentPuzzle) return;
    const puzzleId = currentPuzzle.id;

    // 1. Save to local storage immediately
    const progressData: UserProgress = {
      puzzleId,
      answers: newAnswers,
      completed: false,
      elapsedSeconds: time,
      updatedAt: new Date().toISOString()
    };
    try {
      localStorage.setItem(`crossword_progress_${puzzleId}`, JSON.stringify(progressData));
    } catch (e) {
      console.warn('Local storage write error', e);
    }

    // 2. Debounced save to Google Cloud (Firestore) if authenticated
    if (user) {
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
      setIsSyncing(true);
      syncTimeoutRef.current = setTimeout(async () => {
        await saveProgressToCloud(user.uid, puzzleId, progressData);
        setIsSyncing(false);
      }, 1200);
    }
  }, [currentPuzzle, user]);

  // Cell Selection
  const handleSelectCell = (row: number, col: number) => {
    const cell = currentPuzzle.layout.cells[row]?.[col];
    if (!cell || cell.isBlocked) return;

    // Check if cell is part of words in both directions
    const hasAcross = currentPuzzle.layout.words.some(
      w => w.direction === 'across' && w.row === row && col >= w.col && col < w.col + w.length
    );
    const hasDown = currentPuzzle.layout.words.some(
      w => w.direction === 'down' && w.col === col && row >= w.row && row < w.row + w.length
    );

    setSelectedRow(row);
    setSelectedCol(col);

    if (direction === 'across' && !hasAcross && hasDown) {
      setDirection('down');
    } else if (direction === 'down' && !hasDown && hasAcross) {
      setDirection('across');
    }
  };

  // Toggle Direction
  const handleToggleDirection = () => {
    setDirection(prev => prev === 'across' ? 'down' : 'across');
  };

  // Enter Letter
  const handleEnterLetter = useCallback((letter: string) => {
    const key = `${selectedRow}_${selectedCol}`;
    const newAnswers = { ...userAnswers, [key]: letter.toUpperCase() };
    setUserAnswers(newAnswers);

    // Clear any previous incorrect check marker on this cell
    if (checkedCells[key]) {
      setCheckedCells(prev => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }

    // Auto-save
    triggerAutoSave(newAnswers, elapsedSeconds);

    // Check if complete
    checkCompletion(newAnswers);

    // Advance to next cell in current word
    if (activeWord) {
      const idx = activeWord.direction === 'across' 
        ? selectedCol - activeWord.col 
        : selectedRow - activeWord.row;

      if (idx < activeWord.length - 1) {
        if (activeWord.direction === 'across') {
          setSelectedCol(selectedCol + 1);
        } else {
          setSelectedRow(selectedRow + 1);
        }
      }
    }
  }, [selectedRow, selectedCol, userAnswers, checkedCells, triggerAutoSave, elapsedSeconds, checkCompletion, activeWord]);

  // Backspace
  const handleBackspace = useCallback(() => {
    const key = `${selectedRow}_${selectedCol}`;
    const hadLetter = !!userAnswers[key];

    // Clear current cell
    const newAnswers = { ...userAnswers };
    delete newAnswers[key];
    setUserAnswers(newAnswers);
    triggerAutoSave(newAnswers, elapsedSeconds);

    // Move to previous cell in active word
    if (activeWord) {
      const idx = activeWord.direction === 'across' 
        ? selectedCol - activeWord.col 
        : selectedRow - activeWord.row;

      if (idx > 0 && !hadLetter) {
        if (activeWord.direction === 'across') {
          const prevCol = selectedCol - 1;
          setSelectedCol(prevCol);
          delete newAnswers[`${selectedRow}_${prevCol}`];
          setUserAnswers(newAnswers);
        } else {
          const prevRow = selectedRow - 1;
          setSelectedRow(prevRow);
          delete newAnswers[`${prevRow}_${selectedCol}`];
          setUserAnswers(newAnswers);
        }
      } else if (idx > 0 && hadLetter) {
        if (activeWord.direction === 'across') {
          setSelectedCol(selectedCol - 1);
        } else {
          setSelectedRow(selectedRow - 1);
        }
      }
    }
  }, [selectedRow, selectedCol, userAnswers, triggerAutoSave, elapsedSeconds, activeWord]);

  // Arrow Key Navigation
  const handleNavigateArrow = useCallback((key: 'ArrowUp' | 'ArrowDown' | 'ArrowLeft' | 'ArrowRight') => {
    let newR = selectedRow;
    let newC = selectedCol;
    const { width, height, cells } = currentPuzzle.layout;

    if (key === 'ArrowUp') newR = Math.max(0, newR - 1);
    if (key === 'ArrowDown') newR = Math.min(height - 1, newR + 1);
    if (key === 'ArrowLeft') newC = Math.max(0, newC - 1);
    if (key === 'ArrowRight') newC = Math.min(width - 1, newC + 1);

    if (cells[newR]?.[newC] && !cells[newR][newC].isBlocked) {
      setSelectedRow(newR);
      setSelectedCol(newC);
      if (key === 'ArrowUp' || key === 'ArrowDown') {
        setDirection('down');
      } else {
        setDirection('across');
      }
    }
  }, [selectedRow, selectedCol, currentPuzzle]);

  // Jump to Next / Prev Word
  const handleNextWord = useCallback((forward = true) => {
    const words = currentPuzzle.layout.words;
    if (words.length === 0) return;

    const currentIdx = activeWord ? words.findIndex(w => w.id === activeWord.id) : 0;
    let nextIdx = forward ? currentIdx + 1 : currentIdx - 1;
    if (nextIdx >= words.length) nextIdx = 0;
    if (nextIdx < 0) nextIdx = words.length - 1;

    const targetWord = words[nextIdx];
    setSelectedRow(targetWord.row);
    setSelectedCol(targetWord.col);
    setDirection(targetWord.direction);
  }, [currentPuzzle, activeWord]);

  // Select Word from Clue List
  const handleSelectWord = (word: PlacedWord) => {
    setSelectedRow(word.row);
    setSelectedCol(word.col);
    setDirection(word.direction);
  };

  // Reset Progress
  const handleResetProgress = () => {
    if (confirm('Clear all your answers and reset progress for this crossword?')) {
      setUserAnswers({});
      setCheckedCells({});
      setRevealedCells({});
      setElapsedSeconds(0);
      try {
        localStorage.removeItem(`crossword_progress_${currentPuzzle.id}`);
      } catch (e) {}
      if (user) {
        saveProgressToCloud(user.uid, currentPuzzle.id, {
          puzzleId: currentPuzzle.id,
          answers: {},
          completed: false,
          elapsedSeconds: 0,
          updatedAt: new Date().toISOString()
        });
      }
    }
  };

  // Check Actions
  const handleCheckLetter = () => {
    const cell = currentPuzzle.layout.cells[selectedRow]?.[selectedCol];
    if (!cell || cell.isBlocked) return;
    const key = `${selectedRow}_${selectedCol}`;
    const entered = userAnswers[key];
    setCheckedCells(prev => ({
      ...prev,
      [key]: entered === cell.letter ? 'correct' : 'incorrect'
    }));
    setShowCheckMenu(false);
  };

  const handleCheckWord = () => {
    if (!activeWord) return;
    const newChecked = { ...checkedCells };
    for (let i = 0; i < activeWord.length; i++) {
      const r = activeWord.direction === 'down' ? activeWord.row + i : activeWord.row;
      const c = activeWord.direction === 'across' ? activeWord.col + i : activeWord.col;
      const key = `${r}_${c}`;
      const entered = userAnswers[key];
      const correct = currentPuzzle.layout.cells[r]?.[c]?.letter;
      if (entered) {
        newChecked[key] = entered === correct ? 'correct' : 'incorrect';
      }
    }
    setCheckedCells(newChecked);
    setShowCheckMenu(false);
  };

  const handleCheckPuzzle = () => {
    const newChecked = { ...checkedCells };
    for (let r = 0; r < currentPuzzle.layout.height; r++) {
      for (let c = 0; c < currentPuzzle.layout.width; c++) {
        const cell = currentPuzzle.layout.cells[r]?.[c];
        if (cell && !cell.isBlocked) {
          const key = `${r}_${c}`;
          const entered = userAnswers[key];
          if (entered) {
            newChecked[key] = entered === cell.letter ? 'correct' : 'incorrect';
          }
        }
      }
    }
    setCheckedCells(newChecked);
    setShowCheckMenu(false);
  };

  // Reveal Actions
  const handleRevealLetter = () => {
    const cell = currentPuzzle.layout.cells[selectedRow]?.[selectedCol];
    if (!cell || cell.isBlocked) return;
    const key = `${selectedRow}_${selectedCol}`;
    const newAnswers = { ...userAnswers, [key]: cell.letter };
    setUserAnswers(newAnswers);
    setRevealedCells(prev => ({ ...prev, [key]: true }));
    triggerAutoSave(newAnswers, elapsedSeconds);
    setShowRevealMenu(false);
    checkCompletion(newAnswers);
  };

  const handleRevealWord = () => {
    if (!activeWord) return;
    const newAnswers = { ...userAnswers };
    const newRevealed = { ...revealedCells };
    for (let i = 0; i < activeWord.length; i++) {
      const r = activeWord.direction === 'down' ? activeWord.row + i : activeWord.row;
      const c = activeWord.direction === 'across' ? activeWord.col + i : activeWord.col;
      const key = `${r}_${c}`;
      const correct = currentPuzzle.layout.cells[r]?.[c]?.letter;
      if (correct) {
        newAnswers[key] = correct;
        newRevealed[key] = true;
      }
    }
    setUserAnswers(newAnswers);
    setRevealedCells(newRevealed);
    triggerAutoSave(newAnswers, elapsedSeconds);
    setShowRevealMenu(false);
    checkCompletion(newAnswers);
  };

  const handleRevealPuzzle = () => {
    if (confirm('Reveal all solution answers for this puzzle?')) {
      const newAnswers = { ...userAnswers };
      const newRevealed = { ...revealedCells };
      for (let r = 0; r < currentPuzzle.layout.height; r++) {
        for (let c = 0; c < currentPuzzle.layout.width; c++) {
          const cell = currentPuzzle.layout.cells[r]?.[c];
          if (cell && !cell.isBlocked) {
            const key = `${r}_${c}`;
            newAnswers[key] = cell.letter;
            newRevealed[key] = true;
          }
        }
      }
      setUserAnswers(newAnswers);
      setRevealedCells(newRevealed);
      triggerAutoSave(newAnswers, elapsedSeconds);
      setShowRevealMenu(false);
      checkCompletion(newAnswers);
    }
  };

  // Save new custom puzzle
  const handleSaveCustomPuzzle = (newPuzzle: CrosswordPuzzle) => {
    setPuzzles(prev => [newPuzzle, ...prev]);
    setCurrentPuzzle(newPuzzle);

    // Save to localStorage
    try {
      const existing = localStorage.getItem('crossword_custom_puzzles');
      const list = existing ? JSON.parse(existing) : [];
      localStorage.setItem('crossword_custom_puzzles', JSON.stringify([newPuzzle, ...list]));
    } catch (e) {
      console.warn('Failed saving custom puzzle to storage', e);
    }

    // Save to Firestore if user logged in
    if (user) {
      savePuzzleToCloud(newPuzzle, user.uid, user.displayName || 'Author');
    }
  };

  // Delete puzzle
  const handleDeletePuzzle = (id: string) => {
    setPuzzles(prev => prev.filter(p => p.id !== id));
    try {
      const existing = localStorage.getItem('crossword_custom_puzzles');
      if (existing) {
        const list: CrosswordPuzzle[] = JSON.parse(existing);
        localStorage.setItem('crossword_custom_puzzles', JSON.stringify(list.filter(p => p.id !== id)));
      }
    } catch (e) {}
    if (currentPuzzle.id === id) {
      const remaining = puzzles.filter(p => p.id !== id);
      if (remaining.length > 0) {
        setCurrentPuzzle(remaining[0]);
      }
    }
  };

  // Google Login / Logout handlers
  const handleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error('Sign in error:', error);
    }
  };

  const handleSignOut = async () => {
    try {
      await logOut();
      setUser(null);
      setIsGuestMode(false);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  // Calculate solving progress stats
  const totalLetters = useMemo(() => {
    let count = 0;
    for (const row of currentPuzzle.layout.cells) {
      for (const cell of row) {
        if (!cell.isBlocked) count++;
      }
    }
    return count;
  }, [currentPuzzle]);

  const filledLetters = Object.keys(userAnswers).filter(k => userAnswers[k]?.trim()).length;
  const progressPercent = totalLetters > 0 ? Math.min(100, Math.round((filledLetters / totalLetters) * 100)) : 0;

  // Loading state while checking auth
  if (!authChecked) {
    return (
      <div className="min-h-screen bg-stone-950 text-amber-200 flex flex-col items-center justify-center">
        <div className="w-12 h-12 rounded-2xl bg-amber-500 text-stone-950 flex items-center justify-center font-brand font-bold text-2xl shadow-xl animate-pulse mb-4">
          CG
        </div>
        <p className="font-serif-title text-lg tracking-wide text-stone-300">Loading Crossgen...</p>
      </div>
    );
  }

  // FIRST PAGE: Login Page (when not signed in and not in guest mode)
  if (!user && !isGuestMode) {
    return (
      <LoginPage
        onSignInWithGoogle={handleSignIn}
        onContinueAsGuest={() => setIsGuestMode(true)}
        presetCount={puzzles.length}
      />
    );
  }

  return (
    <div className="min-h-screen bg-stone-100 text-stone-900 flex flex-col">
      
      {/* Guest Mode Alert Banner */}
      {isGuestMode && (
        <div className="bg-amber-500/10 border-b border-amber-500/30 px-4 py-2 text-xs text-amber-900 bg-amber-100/90 flex flex-wrap items-center justify-between gap-2 shadow-xs">
          <span className="font-medium">
            You are playing in Guest Mode. Answers are stored in your browser.
          </span>
          <button
            onClick={handleSignIn}
            className="font-bold underline hover:text-amber-950 transition-colors"
          >
            Sign in with Google to sync across all devices &rarr;
          </button>
        </div>
      )}
      
      {/* App Header */}
      <Header
        puzzleTitle={currentPuzzle.title}
        totalPuzzlesCount={puzzles.length}
        customPuzzlesCount={puzzles.filter(p => p.isCustom).length}
        elapsedSeconds={elapsedSeconds}
        isTimerRunning={isTimerRunning}
        onToggleTimer={() => setIsTimerRunning(!isTimerRunning)}
        onResetProgress={handleResetProgress}
        onOpenLibrary={() => setIsLibraryOpen(true)}
        onOpenCreator={() => setIsCreatorOpen(true)}
        onOpenPrint={() => setIsPrintOpen(true)}
        user={user}
        isSyncing={isSyncing}
        onSignIn={handleSignIn}
        onSignOut={handleSignOut}
      />

      {/* Main Interactive Solving Workspace */}
      <main className="no-print flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 lg:p-8 flex flex-col">
        
        {/* Top Solving Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4 bg-white/90 p-3 sm:p-4 rounded-xl border border-stone-200 shadow-xs">
          
          {/* Left: Puzzle Title & Progress pill */}
          <div className="flex items-center space-x-3">
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="font-serif-title font-bold text-lg sm:text-2xl text-stone-900">
                  {currentPuzzle.title}
                </h1>
                <button
                  onClick={() => setIsLibraryOpen(true)}
                  className="text-xs bg-amber-100 hover:bg-amber-200 text-amber-900 px-2 py-0.5 rounded font-medium border border-amber-300 transition-colors"
                  title="Switch to another puzzle"
                >
                  Change
                </button>
              </div>
              <div className="flex items-center space-x-2 text-xs text-stone-500 mt-0.5">
                <span>{currentPuzzle.layout.words.length} Words</span>
                <span>•</span>
                <span>{currentPuzzle.layout.width} × {currentPuzzle.layout.height} Grid</span>
                <span>•</span>
                <span className="font-medium text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-full">
                  {progressPercent}% Solved ({filledLetters}/{totalLetters})
                </span>
              </div>
            </div>
          </div>

          {/* Right: Assistive Tools (Library, Check, Reveal, Reset, Print) */}
          <div className="flex items-center space-x-2">
            
            {/* View All Saved Puzzles Library Button */}
            <button
              onClick={() => setIsLibraryOpen(true)}
              className="flex items-center space-x-1.5 bg-stone-800 hover:bg-stone-700 text-stone-100 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shadow-xs"
              title="View all saved and generated crossword puzzles"
            >
              <FolderOpen className="w-3.5 h-3.5 text-amber-400" />
              <span>Saved Puzzles ({puzzles.length})</span>
            </button>
            
            {/* Check Menu */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setShowCheckMenu(!showCheckMenu);
                  setShowRevealMenu(false);
                }}
                className="flex items-center space-x-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 px-3 py-1.5 rounded-lg border border-stone-300 text-xs font-semibold transition-colors"
              >
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>Check</span>
                <ChevronDown className="w-3 h-3 text-stone-500" />
              </button>

              {showCheckMenu && (
                <div className="absolute right-0 mt-1 w-36 bg-white rounded-lg shadow-xl border border-stone-200 py-1 z-40 text-xs">
                  <button
                    onClick={handleCheckLetter}
                    className="w-full text-left px-3 py-1.5 hover:bg-amber-50 text-stone-800"
                  >
                    Check Letter
                  </button>
                  <button
                    onClick={handleCheckWord}
                    className="w-full text-left px-3 py-1.5 hover:bg-amber-50 text-stone-800"
                  >
                    Check Word
                  </button>
                  <button
                    onClick={handleCheckPuzzle}
                    className="w-full text-left px-3 py-1.5 hover:bg-amber-50 text-stone-800 font-medium"
                  >
                    Check Puzzle
                  </button>
                </div>
              )}
            </div>

            {/* Reveal Menu */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setShowRevealMenu(!showRevealMenu);
                  setShowCheckMenu(false);
                }}
                className="flex items-center space-x-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 px-3 py-1.5 rounded-lg border border-stone-300 text-xs font-semibold transition-colors"
              >
                <Eye className="w-3.5 h-3.5 text-blue-600" />
                <span>Reveal</span>
                <ChevronDown className="w-3 h-3 text-stone-500" />
              </button>

              {showRevealMenu && (
                <div className="absolute right-0 mt-1 w-36 bg-white rounded-lg shadow-xl border border-stone-200 py-1 z-40 text-xs">
                  <button
                    onClick={handleRevealLetter}
                    className="w-full text-left px-3 py-1.5 hover:bg-amber-50 text-stone-800"
                  >
                    Reveal Letter
                  </button>
                  <button
                    onClick={handleRevealWord}
                    className="w-full text-left px-3 py-1.5 hover:bg-amber-50 text-stone-800"
                  >
                    Reveal Word
                  </button>
                  <button
                    onClick={handleRevealPuzzle}
                    className="w-full text-left px-3 py-1.5 hover:bg-amber-50 text-stone-800 font-medium text-rose-700"
                  >
                    Reveal All
                  </button>
                </div>
              )}
            </div>

            {/* Print / Export Shortcut */}
            <button
              onClick={() => setIsPrintOpen(true)}
              className="flex items-center space-x-1 bg-amber-100 hover:bg-amber-200 text-amber-950 px-3 py-1.5 rounded-lg border border-amber-300 text-xs font-semibold transition-colors"
              title="Print worksheet or keysheet"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Print / PDF</span>
            </button>
          </div>

        </div>

        {/* 2-Column Responsive Layout: Grid on Left, Clues on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1 items-start">
          
          {/* Left: The Crossword Grid Board */}
          <div className="lg:col-span-7 flex flex-col items-center bg-white p-3 sm:p-5 rounded-2xl border border-stone-200 shadow-xs">
            <CrosswordGridComponent
              layout={currentPuzzle.layout}
              userAnswers={userAnswers}
              selectedRow={selectedRow}
              selectedCol={selectedCol}
              direction={direction}
              activeWord={activeWord}
              checkedCells={checkedCells}
              revealedCells={revealedCells}
              onSelectCell={handleSelectCell}
              onToggleDirection={handleToggleDirection}
              onEnterLetter={handleEnterLetter}
              onBackspace={handleBackspace}
              onNavigateArrow={handleNavigateArrow}
              onNextWord={handleNextWord}
            />

            {/* Mobile Touch Keyboard */}
            <div className="w-full block md:hidden mt-2">
              <VirtualKeyboard
                onEnterLetter={handleEnterLetter}
                onBackspace={handleBackspace}
                onToggleDirection={handleToggleDirection}
                onNextWord={handleNextWord}
              />
            </div>
          </div>

          {/* Right: Across & Down Clue Lists */}
          <div className="lg:col-span-5 h-full">
            <ClueList
              words={currentPuzzle.layout.words}
              activeWord={activeWord}
              direction={direction}
              userAnswers={userAnswers}
              onSelectWord={handleSelectWord}
            />
          </div>

        </div>

      </main>

      {/* Hidden Printable Document for native Ctrl+P / Cmd+P browser printing */}
      <div className="hidden printable-document p-8 bg-white text-black">
        <div className="border-b-2 border-black pb-4 mb-5">
          <div className="mb-2">
            <h1 className="text-3xl font-bold tracking-tight">{currentPuzzle.title}</h1>
            <p className="text-xs font-bold uppercase tracking-wider text-stone-600 mt-0.5">
              Student Crossword Worksheet
            </p>
          </div>
          
          {/* 1. Name, Date, Score section placed BELOW and AFTER the title */}
          <div className="mt-3 border border-black p-2.5 flex items-center justify-between text-sm font-semibold">
            <div className="flex-1 flex items-center mr-6">
              <span>Name:</span>
              <span className="flex-1 border-b border-black ml-2 inline-block h-4"></span>
            </div>
            <div className="w-56 flex items-center mr-6">
              <span>Date:</span>
              <span className="flex-1 border-b border-black ml-2 inline-block h-4"></span>
            </div>
            <div className="w-36 flex items-center">
              <span>Score:</span>
              <span className="flex-1 border-b border-black ml-2 inline-block h-4"></span>
            </div>
          </div>
        </div>

        {/* 2. Bigger Printable Grid */}
        <div className="flex justify-center my-6">
          <div 
            className="grid gap-0 border-2 border-black shadow-sm"
            style={{
              gridTemplateColumns: `repeat(${currentPuzzle.layout.width}, 38px)`
            }}
          >
            {currentPuzzle.layout.cells.map((rowCells, r) =>
              rowCells.map((cell, c) => (
                <div
                  key={`${r}_${c}`}
                  className={`w-[38px] h-[38px] relative flex items-center justify-center font-bold text-base ${
                    cell.isBlocked ? 'print-grid-blocked' : 'print-grid-cell'
                  }`}
                >
                  {!cell.isBlocked && cell.number && (
                    <span className="absolute top-[1.5px] left-[2.5px] text-[10px] font-bold text-black leading-none">
                      {cell.number}
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* 3. Bigger Printable Clues for Students */}
        <div className="grid grid-cols-2 gap-8 pt-6 border-t-2 border-black text-sm leading-relaxed">
          <div>
            <h2 className="font-bold text-base uppercase tracking-wider border-b-2 border-black pb-1 mb-2">
              Across
            </h2>
            <ul className="space-y-2">
              {currentPuzzle.layout.words
                .filter(w => w.direction === 'across')
                .sort((a, b) => a.number - b.number)
                .map(w => (
                  <li key={w.id} className="flex items-start space-x-1.5">
                    <span className="font-bold font-mono mr-1 shrink-0">{w.number}.</span>
                    <span>{w.clue}</span>
                  </li>
                ))}
            </ul>
          </div>
          <div>
            <h2 className="font-bold text-base uppercase tracking-wider border-b-2 border-black pb-1 mb-2">
              Down
            </h2>
            <ul className="space-y-2">
              {currentPuzzle.layout.words
                .filter(w => w.direction === 'down')
                .sort((a, b) => a.number - b.number)
                .map(w => (
                  <li key={w.id} className="flex items-start space-x-1.5">
                    <span className="font-bold font-mono mr-1 shrink-0">{w.number}.</span>
                    <span>{w.clue}</span>
                  </li>
                ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Modals */}
      <PuzzleCreatorModal
        isOpen={isCreatorOpen}
        onClose={() => setIsCreatorOpen(false)}
        onSaveAndPlay={handleSaveCustomPuzzle}
      />

      <PrintExportModal
        isOpen={isPrintOpen}
        onClose={() => setIsPrintOpen(false)}
        puzzle={currentPuzzle}
      />

      <PuzzleLibraryModal
        isOpen={isLibraryOpen}
        onClose={() => setIsLibraryOpen(false)}
        puzzles={puzzles}
        currentPuzzleId={currentPuzzle.id}
        onSelectPuzzle={(p) => setCurrentPuzzle(p)}
        onOpenCreator={() => setIsCreatorOpen(true)}
        onOpenPrint={(p) => {
          setCurrentPuzzle(p);
          setIsPrintOpen(true);
        }}
        onDeletePuzzle={handleDeletePuzzle}
      />

      <CelebrationModal
        isOpen={isCelebrationOpen}
        onClose={() => setIsCelebrationOpen(false)}
        puzzleTitle={currentPuzzle.title}
        elapsedSeconds={elapsedSeconds}
        wordCount={currentPuzzle.layout.words.length}
        onOpenPrint={() => setIsPrintOpen(true)}
        onOpenLibrary={() => setIsLibraryOpen(true)}
        onReset={handleResetProgress}
      />

    </div>
  );
}
