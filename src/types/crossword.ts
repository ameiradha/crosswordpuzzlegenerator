export type Direction = 'across' | 'down';

export interface RawWordInput {
  answer: string;
  clue: string;
}

export interface PlacedWord {
  id: string;
  number: number;
  direction: Direction;
  answer: string;
  clue: string;
  row: number;
  col: number;
  length: number;
}

export interface GridCell {
  row: number;
  col: number;
  letter: string; // The correct uppercase letter
  number?: number; // Clue number (if word starts here)
  acrossWordId?: string;
  downWordId?: string;
  isBlocked: boolean; // True if blank/black cell
}

export interface CrosswordLayout {
  width: number;
  height: number;
  cells: GridCell[][];
  words: PlacedWord[];
  unplacedWords: RawWordInput[];
}

export interface CrosswordPuzzle {
  id: string;
  title: string;
  description?: string;
  authorId?: string;
  authorName?: string;
  rawInput: string;
  layout: CrosswordLayout;
  createdAt: string;
  updatedAt?: string;
  isCustom?: boolean;
}

export interface UserAnswers {
  [cellKey: string]: string; // Key format: `${row}_${col}` -> uppercase letter
}

export interface UserProgress {
  userId?: string;
  puzzleId: string;
  answers: UserAnswers;
  completed: boolean;
  elapsedSeconds: number;
  updatedAt: string;
}

export interface PrintOptions {
  mode: 'puzzle' | 'keysheet'; // puzzle = blank, keysheet = solved answers
  showWordBank: boolean;
  includeNameHeader: boolean;
  fontSize: 'compact' | 'medium' | 'large';
  paperSize: 'letter' | 'a4';
}
