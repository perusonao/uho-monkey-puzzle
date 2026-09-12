// Monkey Combo MVP: board and match engine
const MonkeyCombo = (() => {
  const COLS = 6;
  const ROWS = 5;
  const TYPES = 5;

  function randomType() {
    return Math.floor(Math.random() * TYPES);
  }

  function findMatches(board) {
    const hit = new Set();
    for (let r = 0; r < ROWS; r++) {
      let start = 0;
      for (let c = 1; c <= COLS; c++) {
        if (c === COLS || board[r][c] !== board[r][start]) {
          if (c - start >= 3) {
            for (let k = start; k < c; k++) hit.add(`${r},${k}`);
          }
          start = c;
        }
      }
    }
    for (let c = 0; c < COLS; c++) {
      let start = 0;
      for (let r = 1; r <= ROWS; r++) {
        if (r === ROWS || board[r][c] !== board[start][c]) {
          if (r - start >= 3) {
            for (let k = start; k < r; k++) hit.add(`${k},${c}`);
          }
          start = r;
        }
      }
    }
    return hit;
  }

  function createBoard() {
    let board;
    do {
      board = Array.from({ length: ROWS }, () =>
        Array.from({ length: COLS }, randomType)
      );
    } while (findMatches(board).size);
    return board;
  }

  function swap(board, from, to) {
    const adjacent = Math.abs(from.r - to.r) + Math.abs(from.c - to.c) === 1;
    if (!adjacent) return false;
    [board[from.r][from.c], board[to.r][to.c]] =
      [board[to.r][to.c], board[from.r][from.c]];
    return true;
  }

  function collapse(board) {
    for (let c = 0; c < COLS; c++) {
      const values = [];
      for (let r = ROWS - 1; r >= 0; r--) {
        if (board[r][c] != null) values.push(board[r][c]);
      }
      for (let r = ROWS - 1, i = 0; r >= 0; r--, i++) {
        board[r][c] = i < values.length ? values[i] : randomType();
      }
    }
  }

  function clearMatches(board, matches) {
    for (const key of matches) {
      const [r, c] = key.split(',').map(Number);
      board[r][c] = null;
    }
  }

  return { COLS, ROWS, TYPES, createBoard, findMatches, swap, clearMatches, collapse };
})();
