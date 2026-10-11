import { RawWordInput, PlacedWord, GridCell, CrosswordLayout, Direction } from '../types/crossword';

export function parseRawInput(input: string): RawWordInput[] {
  if (!input || !input.trim()) return [];

  // Split by semicolons or newlines
  const segments = input
    .split(/;|\n+/)
    .map(s => s.trim())
    .filter(Boolean);

  const results: RawWordInput[] = [];

  for (const segment of segments) {
    // Look for comma separator first: "APPLE, a red fruit"
    let parts: string[] = [];
    if (segment.includes(',')) {
      const idx = segment.indexOf(',');
      parts = [segment.slice(0, idx), segment.slice(idx + 1)];
    } else if (segment.includes(':')) {
      const idx = segment.indexOf(':');
      parts = [segment.slice(0, idx), segment.slice(idx + 1)];
    } else if (segment.includes(' - ')) {
      const idx = segment.indexOf(' - ');
      parts = [segment.slice(0, idx), segment.slice(idx + 3)];
    }

    if (parts.length >= 2) {
      const rawAnswer = parts[0].trim();
      const rawClue = parts.slice(1).join(',').trim();

      // Clean answer: letters only, uppercase
      const cleanedAnswer = rawAnswer.toUpperCase().replace(/[^A-Z]/g, '');

      if (cleanedAnswer.length >= 2 && rawClue.length > 0) {
        results.push({
          answer: cleanedAnswer,
          clue: rawClue
        });
      }
    }
  }

  return results;
}

interface CandidatePlacement {
  row: number;
  col: number;
  direction: Direction;
  intersections: number;
  score: number;
}

interface InternalPlacedWord {
  wordInput: RawWordInput;
  row: number;
  col: number;
  direction: Direction;
}

export function generateCrosswordLayout(
  inputs: RawWordInput[], 
  options: { maxGridSize?: number; trials?: number } = {}
): CrosswordLayout {
  if (!inputs || inputs.length === 0) {
    return {
      width: 10,
      height: 10,
      cells: Array(10).fill(null).map((_, r) =>
        Array(10).fill(null).map((_, c) => ({
          row: r,
          col: c,
          letter: '',
          isBlocked: true
        }))
      ),
      words: [],
      unplacedWords: []
    };
  }

  // Remove duplicates based on answer
  const uniqueMap = new Map<string, RawWordInput>();
  inputs.forEach(item => {
    if (!uniqueMap.has(item.answer)) {
      uniqueMap.set(item.answer, item);
    }
  });
  const wordList = Array.from(uniqueMap.values());

  const maxGrid = options.maxGridSize || 32;
  const numTrials = options.trials || 45;

  let bestResult: {
    grid: (string | null)[][];
    placed: InternalPlacedWord[];
    unplaced: RawWordInput[];
    minR: number;
    maxR: number;
    minC: number;
    maxC: number;
    score: number;
  } | null = null;

  for (let trial = 0; trial < numTrials; trial++) {
    // Clone and shuffle with slight preference for longer words first
    const shuffled = [...wordList].sort((a, b) => {
      // First 2 trials strictly by length, others with random jitter
      if (trial < 2) return b.answer.length - a.answer.length;
      return (b.answer.length + (Math.random() * 3 - 1.5)) - (a.answer.length + (Math.random() * 3 - 1.5));
    });

    const grid: (string | null)[][] = Array(maxGrid)
      .fill(null)
      .map(() => Array(maxGrid).fill(null));

    const placed: InternalPlacedWord[] = [];
    const unplaced: RawWordInput[] = [];

    // Place first word in middle horizontally
    const first = shuffled[0];
    const firstRow = Math.floor(maxGrid / 2);
    const firstCol = Math.floor((maxGrid - first.answer.length) / 2);

    for (let i = 0; i < first.answer.length; i++) {
      grid[firstRow][firstCol + i] = first.answer[i];
    }
    placed.push({
      wordInput: first,
      row: firstRow,
      col: firstCol,
      direction: 'across'
    });

    // Try placing remaining words
    for (let w = 1; w < shuffled.length; w++) {
      const current = shuffled[w];
      const validPlacements: CandidatePlacement[] = [];

      // Find intersection points with already placed words
      for (const p of placed) {
        const targetDir: Direction = p.direction === 'across' ? 'down' : 'across';

        for (let i = 0; i < current.answer.length; i++) {
          const char = current.answer[i];

          for (let j = 0; j < p.wordInput.answer.length; j++) {
            if (p.wordInput.answer[j] === char) {
              // Potential intersection!
              let candRow = 0;
              let candCol = 0;

              if (targetDir === 'down') {
                candRow = p.row - i;
                candCol = p.col + j;
              } else {
                candRow = p.row + j;
                candCol = p.col - i;
              }

              // Test if this candidate placement is valid
              if (canPlaceWord(grid, maxGrid, current.answer, candRow, candCol, targetDir)) {
                const intersections = countIntersections(grid, current.answer, candRow, candCol, targetDir);
                // Calculate score
                const centerDist = Math.abs(candRow - maxGrid / 2) + Math.abs(candCol - maxGrid / 2);
                const score = (intersections * 25) - (centerDist * 1.5);
                validPlacements.push({
                  row: candRow,
                  col: candCol,
                  direction: targetDir,
                  intersections,
                  score
                });
              }
            }
          }
        }
      }

      if (validPlacements.length > 0) {
        // Pick best placement (highest score)
        validPlacements.sort((a, b) => b.score - a.score);
        const chosen = validPlacements[0];

        // Apply to grid
        for (let i = 0; i < current.answer.length; i++) {
          const r = chosen.direction === 'down' ? chosen.row + i : chosen.row;
          const c = chosen.direction === 'across' ? chosen.col + i : chosen.col;
          grid[r][c] = current.answer[i];
        }

        placed.push({
          wordInput: current,
          row: chosen.row,
          col: chosen.col,
          direction: chosen.direction
        });
      } else {
        unplaced.push(current);
      }
    }

    // Calculate bounding box
    let minR = maxGrid, maxR = 0, minC = maxGrid, maxC = 0;
    for (let r = 0; r < maxGrid; r++) {
      for (let c = 0; c < maxGrid; c++) {
        if (grid[r][c] !== null) {
          if (r < minR) minR = r;
          if (r > maxR) maxR = r;
          if (c < minC) minC = c;
          if (c > maxC) maxC = c;
        }
      }
    }

    const bboxWidth = maxC - minC + 1;
    const bboxHeight = maxR - minR + 1;
    const totalIntersections = placed.reduce((sum, p) => {
      // rough intersection measure
      return sum + p.wordInput.answer.length;
    }, 0);

    const overallScore = 
      (placed.length * 1000) - 
      (bboxWidth * bboxHeight * 2) - 
      (Math.abs(bboxWidth - bboxHeight) * 20) + 
      (totalIntersections * 5);

    if (!bestResult || placed.length > bestResult.placed.length || 
        (placed.length === bestResult.placed.length && overallScore > bestResult.score)) {
      bestResult = {
        grid,
        placed,
        unplaced,
        minR,
        maxR,
        minC,
        maxC,
        score: overallScore
      };
    }

    // If 100% placed with good aspect ratio, can break early
    if (placed.length === wordList.length && Math.abs(bboxWidth - bboxHeight) <= 3 && trial > 15) {
      break;
    }
  }

  if (!bestResult) {
    throw new Error('Could not generate crossword layout');
  }

  // Add 1 cell padding if possible for aesthetic margin
  const minR = Math.max(0, bestResult.minR - 1);
  const maxR = Math.min(maxGrid - 1, bestResult.maxR + 1);
  const minC = Math.max(0, bestResult.minC - 1);
  const maxC = Math.min(maxGrid - 1, bestResult.maxC + 1);

  const croppedHeight = maxR - minR + 1;
  const croppedWidth = maxC - minC + 1;

  // Build adjusted words list
  const adjustedWords = bestResult.placed.map(p => ({
    ...p,
    row: p.row - minR,
    col: p.col - minC
  }));

  // Build 2D Cells matrix
  const finalCells: GridCell[][] = Array(croppedHeight)
    .fill(null)
    .map((_, r) =>
      Array(croppedWidth)
        .fill(null)
        .map((_, c) => {
          const origR = minR + r;
          const origC = minC + c;
          const letter = bestResult!.grid[origR][origC];
          return {
            row: r,
            col: c,
            letter: letter || '',
            isBlocked: letter === null
          };
        })
    );

  // Standard Crossword Numbering:
  // Top-to-bottom, left-to-right scan
  let clueCounter = 1;
  const placedWordsOut: PlacedWord[] = [];

  for (let r = 0; r < croppedHeight; r++) {
    for (let c = 0; c < croppedWidth; c++) {
      if (finalCells[r][c].isBlocked) continue;

      const isAcrossStart = 
        (c === 0 || finalCells[r][c - 1].isBlocked) &&
        (c + 1 < croppedWidth && !finalCells[r][c + 1].isBlocked);

      const isDownStart = 
        (r === 0 || finalCells[r - 1][c].isBlocked) &&
        (r + 1 < croppedHeight && !finalCells[r + 1][c].isBlocked);

      if (isAcrossStart || isDownStart) {
        finalCells[r][c].number = clueCounter;

        if (isAcrossStart) {
          // Find matching word
          const matched = adjustedWords.find(w => w.direction === 'across' && w.row === r && w.col === c);
          if (matched) {
            const wordId = `across_${clueCounter}`;
            finalCells[r][c].acrossWordId = wordId;
            placedWordsOut.push({
              id: wordId,
              number: clueCounter,
              direction: 'across',
              answer: matched.wordInput.answer,
              clue: matched.wordInput.clue,
              row: r,
              col: c,
              length: matched.wordInput.answer.length
            });
          }
        }

        if (isDownStart) {
          const matched = adjustedWords.find(w => w.direction === 'down' && w.row === r && w.col === c);
          if (matched) {
            const wordId = `down_${clueCounter}`;
            finalCells[r][c].downWordId = wordId;
            placedWordsOut.push({
              id: wordId,
              number: clueCounter,
              direction: 'down',
              answer: matched.wordInput.answer,
              clue: matched.wordInput.clue,
              row: r,
              col: c,
              length: matched.wordInput.answer.length
            });
          }
        }

        clueCounter++;
      }
    }
  }

  // Tag all cells in each placed word with acrossWordId / downWordId
  for (const pw of placedWordsOut) {
    for (let i = 0; i < pw.length; i++) {
      const cr = pw.direction === 'down' ? pw.row + i : pw.row;
      const cc = pw.direction === 'across' ? pw.col + i : pw.col;
      if (finalCells[cr] && finalCells[cr][cc]) {
        if (pw.direction === 'across') {
          finalCells[cr][cc].acrossWordId = pw.id;
        } else {
          finalCells[cr][cc].downWordId = pw.id;
        }
      }
    }
  }

  return {
    width: croppedWidth,
    height: croppedHeight,
    cells: finalCells,
    words: placedWordsOut,
    unplacedWords: bestResult.unplaced
  };
}

function canPlaceWord(
  grid: (string | null)[][],
  maxGrid: number,
  word: string,
  startRow: number,
  startCol: number,
  direction: Direction
): boolean {
  const len = word.length;

  // Boundary checks
  if (direction === 'across') {
    if (startRow < 0 || startRow >= maxGrid) return false;
    if (startCol < 0 || startCol + len > maxGrid) return false;

    // Cell before must be blank
    if (startCol > 0 && grid[startRow][startCol - 1] !== null) return false;
    // Cell after must be blank
    if (startCol + len < maxGrid && grid[startRow][startCol + len] !== null) return false;

    let hasIntersection = false;

    for (let i = 0; i < len; i++) {
      const r = startRow;
      const c = startCol + i;
      const existing = grid[r][c];

      if (existing !== null) {
        if (existing !== word[i]) return false; // Clash
        hasIntersection = true;
      } else {
        // Parallel adjacent checks: above and below must be blank
        if (r > 0 && grid[r - 1][c] !== null) return false;
        if (r < maxGrid - 1 && grid[r + 1][c] !== null) return false;
      }
    }

    return hasIntersection;
  } else {
    // Down
    if (startCol < 0 || startCol >= maxGrid) return false;
    if (startRow < 0 || startRow + len > maxGrid) return false;

    // Cell above must be blank
    if (startRow > 0 && grid[startRow - 1][startCol] !== null) return false;
    // Cell below must be blank
    if (startRow + len < maxGrid && grid[startRow + len][startCol] !== null) return false;

    let hasIntersection = false;

    for (let i = 0; i < len; i++) {
      const r = startRow + i;
      const c = startCol;
      const existing = grid[r][c];

      if (existing !== null) {
        if (existing !== word[i]) return false; // Clash
        hasIntersection = true;
      } else {
        // Parallel adjacent checks: left and right must be blank
        if (c > 0 && grid[r][c - 1] !== null) return false;
        if (c < maxGrid - 1 && grid[r][c + 1] !== null) return false;
      }
    }

    return hasIntersection;
  }
}

function countIntersections(
  grid: (string | null)[][],
  word: string,
  startRow: number,
  startCol: number,
  direction: Direction
): number {
  let count = 0;
  for (let i = 0; i < word.length; i++) {
    const r = direction === 'down' ? startRow + i : startRow;
    const c = direction === 'across' ? startCol + i : startCol;
    if (grid[r] && grid[r][c] !== null) {
      count++;
    }
  }
  return count;
}
