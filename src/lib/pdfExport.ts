import { jsPDF } from 'jspdf';
import { CrosswordPuzzle, PrintOptions } from '../types/crossword';

export function exportPuzzleToPDF(puzzle: CrosswordPuzzle, options: PrintOptions): void {
  const isA4 = options.paperSize === 'a4';
  // A4: 210 x 297 mm, Letter: 215.9 x 279.4 mm
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: isA4 ? 'a4' : 'letter'
  });

  const pageWidth = isA4 ? 210 : 215.9;
  const pageHeight = isA4 ? 297 : 279.4;
  const margin = 14;
  const contentWidth = pageWidth - (margin * 2);

  // ==========================================
  // 1. Header Section
  // ==========================================
  let currentY = margin + 2;

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(20, 20, 20);
  doc.text(puzzle.title, margin, currentY + 6);
  currentY += 10;

  // Subtitle
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(90, 90, 90);
  const modeLabel = options.mode === 'keysheet' 
    ? 'OFFICIAL ANSWER KEY & SOLUTION' 
    : 'STUDENT CROSSWORD WORKSHEET';
  doc.text(modeLabel, margin, currentY + 3);
  currentY += 7;

  // 1. Requirement: Put Name, Date, Score section BELOW and AFTER the title
  if (options.includeNameHeader && options.mode === 'puzzle') {
    doc.setFillColor(248, 249, 250);
    doc.setDrawColor(180, 185, 190);
    doc.setLineWidth(0.35);
    doc.roundedRect(margin, currentY, contentWidth, 12, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(30, 30, 30);
    
    // Name field
    const nameLabelY = currentY + 8;
    doc.text('Name:', margin + 4, nameLabelY);
    doc.setDrawColor(150, 150, 150);
    doc.setLineWidth(0.4);
    const nameLineStart = margin + 19;
    const nameLineEnd = margin + 85;
    doc.line(nameLineStart, nameLabelY + 0.5, nameLineEnd, nameLabelY + 0.5);

    // Date field
    doc.text('Date:', margin + 92, nameLabelY);
    const dateLineStart = margin + 104;
    const dateLineEnd = margin + 140;
    doc.line(dateLineStart, nameLabelY + 0.5, dateLineEnd, nameLabelY + 0.5);

    // Score field
    doc.text('Score:', margin + 146, nameLabelY);
    const scoreLineStart = margin + 160;
    const scoreLineEnd = margin + contentWidth - 4;
    doc.line(scoreLineStart, nameLabelY + 0.5, scoreLineEnd, nameLabelY + 0.5);

    currentY += 16;
  } else if (options.mode === 'keysheet') {
    doc.setFillColor(236, 253, 245); // emerald-50
    doc.setDrawColor(16, 185, 129); // emerald-500
    doc.setLineWidth(0.4);
    doc.roundedRect(margin, currentY, contentWidth, 9, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(4, 120, 87);
    doc.text('TEACHER / INSTRUCTOR ANSWER KEY — COMPLETE SOLUTIONS', margin + 4, currentY + 6);
    currentY += 13;
  } else {
    currentY += 4;
  }

  // Divider line
  doc.setDrawColor(210, 210, 210);
  doc.setLineWidth(0.4);
  doc.line(margin, currentY, pageWidth - margin, currentY);
  currentY += 6;

  // ==========================================
  // 2. Requirement: Make the Grid Crossword BIGGER
  // ==========================================
  const cols = puzzle.layout.width;
  const rows = puzzle.layout.height;

  // Allow up to 165mm width for large, spacious cells that students can comfortably write in
  const maxAllowedGridWidth = Math.min(contentWidth, 165);
  const maxCellByWidth = maxAllowedGridWidth / cols;
  
  // Available height remaining on current page for grid
  const maxAvailableHeightForGrid = 135; 
  const maxCellByHeight = maxAvailableHeightForGrid / rows;

  // Cell size: generous minimum 8.5mm, up to 13.5mm!
  const cellSize = Math.min(13.5, Math.max(8.0, Math.min(maxCellByWidth, maxCellByHeight)));

  const gridPixelWidth = cols * cellSize;
  const gridPixelHeight = rows * cellSize;
  const gridStartX = margin + (contentWidth - gridPixelWidth) / 2;
  const gridStartY = currentY;

  // Draw Grid Cells
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = puzzle.layout.cells[r]?.[c];
      const x = gridStartX + (c * cellSize);
      const y = gridStartY + (r * cellSize);

      if (!cell || cell.isBlocked) {
        // Blocked / Black cell
        doc.setFillColor(30, 30, 30);
        doc.rect(x, y, cellSize, cellSize, 'F');
      } else {
        // Playable cell with crisp, clear borders
        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(30, 30, 30);
        doc.setLineWidth(0.45);
        doc.rect(x, y, cellSize, cellSize, 'FD');

        // Draw Clue Number in top-left
        if (cell.number) {
          doc.setFont('helvetica', 'bold');
          // Scale font size according to bigger cell
          const numFontSize = Math.min(8.5, Math.max(6.5, cellSize * 0.65));
          doc.setFontSize(numFontSize);
          doc.setTextColor(40, 40, 40);
          doc.text(String(cell.number), x + 1.1, y + (cellSize * 0.32));
        }

        // In Answer Keysheet mode, draw bold solution letter in center
        if (options.mode === 'keysheet' && cell.letter) {
          doc.setFont('helvetica', 'bold');
          const letterFontSize = Math.min(18, Math.max(11, cellSize * 1.35));
          doc.setFontSize(letterFontSize);
          doc.setTextColor(15, 15, 15);
          const textX = x + (cellSize / 2);
          const textY = y + (cellSize * 0.76);
          doc.text(cell.letter, textX, textY, { align: 'center' });
        }
      }
    }
  }

  currentY = gridStartY + gridPixelHeight + 8;

  // ==========================================
  // 3. Requirement: Make question/clue font size BIGGER for students
  // ==========================================
  // Student-friendly font sizing:
  // Compact: 10pt, Medium (Default): 11.5pt, Large: 13pt
  const clueFontSize = options.fontSize === 'compact' ? 10 : options.fontSize === 'large' ? 13 : 11.5;
  const lineHeight = clueFontSize * 0.48; // mm per line of text
  const itemGap = 3.6; // generous gap between clues for clear readability

  const acrossWords = puzzle.layout.words.filter(w => w.direction === 'across').sort((a, b) => a.number - b.number);
  const downWords = puzzle.layout.words.filter(w => w.direction === 'down').sort((a, b) => a.number - b.number);

  // Check if clues will fit on Page 1 or if we should break to Page 2 cleanly
  // A clean student worksheet either has clues below if space >= 65mm, or moves clues to Page 2
  const spaceLeftOnPage1 = pageHeight - margin - currentY;
  const estimatedCluesHeight = Math.max(acrossWords.length, downWords.length) * (lineHeight * 1.5 + itemGap);

  if (spaceLeftOnPage1 < 60 && estimatedCluesHeight > 50) {
    // Move clues to Page 2 for maximum spaciousness and clarity
    doc.addPage();
    currentY = margin + 4;
    
    // Page 2 Header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(25, 25, 25);
    doc.text(`${puzzle.title} — Clues`, margin, currentY + 4);
    currentY += 10;
  } else {
    // Divider above clues on Page 1
    doc.setDrawColor(210, 210, 210);
    doc.setLineWidth(0.4);
    doc.line(margin, currentY, pageWidth - margin, currentY);
    currentY += 6;
  }

  // Two columns for Across and Down with wide gutter
  const gutter = 10;
  const colWidth = (contentWidth - gutter) / 2;
  const col1X = margin;
  const col2X = margin + colWidth + gutter;

  // Column Headers
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(20, 20, 20);
  doc.text('ACROSS', col1X, currentY);
  doc.text('DOWN', col2X, currentY);
  currentY += 6;

  let yAcross = currentY;
  let yDown = currentY;

  // Render ACROSS Clues with larger student-friendly font
  doc.setFontSize(clueFontSize);
  for (const item of acrossWords) {
    if (yAcross > pageHeight - margin - 15) {
      doc.addPage();
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(20, 20, 20);
      doc.text('ACROSS (continued)', col1X, margin + 6);
      doc.text('DOWN (continued)', col2X, margin + 6);
      yAcross = margin + 14;
      yDown = margin + 14;
      doc.setFontSize(clueFontSize);
    }

    // Clue number in bold
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(20, 20, 20);
    const numPrefix = `${item.number}. `;
    const numWidth = doc.getTextWidth(numPrefix);
    doc.text(numPrefix, col1X, yAcross);

    // Clue text in normal font
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(40, 40, 40);
    let clueText = item.clue;
    if (options.mode === 'keysheet') {
      clueText += ` [${item.answer}]`;
    }

    const wrappedLines = doc.splitTextToSize(clueText, colWidth - numWidth - 1);
    doc.text(wrappedLines, col1X + numWidth, yAcross);
    yAcross += (wrappedLines.length * lineHeight) + itemGap;
  }

  // Render DOWN Clues with larger student-friendly font
  for (const item of downWords) {
    if (yDown > pageHeight - margin - 15) {
      doc.addPage();
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(20, 20, 20);
      doc.text('ACROSS (continued)', col1X, margin + 6);
      doc.text('DOWN (continued)', col2X, margin + 6);
      yAcross = margin + 14;
      yDown = margin + 14;
      doc.setFontSize(clueFontSize);
    }

    // Clue number in bold
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(20, 20, 20);
    const numPrefix = `${item.number}. `;
    const numWidth = doc.getTextWidth(numPrefix);
    doc.text(numPrefix, col2X, yDown);

    // Clue text in normal font
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(40, 40, 40);
    let clueText = item.clue;
    if (options.mode === 'keysheet') {
      clueText += ` [${item.answer}]`;
    }

    const wrappedLines = doc.splitTextToSize(clueText, colWidth - numWidth - 1);
    doc.text(wrappedLines, col2X + numWidth, yDown);
    yDown += (wrappedLines.length * lineHeight) + itemGap;
  }

  // ==========================================
  // 4. Optional Word Bank (For student worksheets)
  // ==========================================
  if (options.showWordBank && options.mode === 'puzzle') {
    let maxY = Math.max(yAcross, yDown) + 6;
    if (maxY > pageHeight - margin - 26) {
      doc.addPage();
      maxY = margin + 6;
    }

    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(margin, maxY, contentWidth, 20, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(30, 41, 59);
    doc.text('WORD BANK:', margin + 4, maxY + 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);
    const sortedWords = [...puzzle.layout.words.map(w => w.answer)].sort().join('   •   ');
    const bankLines = doc.splitTextToSize(sortedWords, contentWidth - 8);
    doc.text(bankLines, margin + 4, maxY + 12);
  }

  // ==========================================
  // 5. Footer with page numbering
  // ==========================================
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(130, 130, 130);
    doc.text(
      `Crossword Studio  •  Page ${i} of ${totalPages}`,
      pageWidth / 2,
      pageHeight - (margin / 2),
      { align: 'center' }
    );
  }

  // Download PDF file
  const sanitizedTitle = puzzle.title.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
  doc.save(`${sanitizedTitle}_${options.mode}.pdf`);
}
