"use strict";

/**
 * Cartón 3x9 (bingo 90):
 * - 3 filas x 9 columnas
 * - 15 números (5 por fila)
 * - Columnas por decenas:
 *   1–9, 10–19, 20–29, ... 70–79, 80–90
 * - Ordenación en cada columna: mayor -> menor (arriba->abajo)
 */

const ROWS = 3;
const COLS = 9;
const PER_ROW = 5;
const TOTAL = ROWS * PER_ROW;

// Tu logo para los huecos:
const EMPTY_LOGO_URL = "https://jmoyasaez.github.io/Juegos/bingo-carton/img/logo_lula_bw.jpeg";

// Theme
const THEME_KEY = "bingo_theme_v2";

// UI
const boardEl = document.getElementById("board");
const newBtn = document.getElementById("newBtn");
const clearBtn = document.getElementById("clearBtn");
const themeBtn = document.getElementById("themeBtn");
const lineChip = document.getElementById("lineChip");
const bingoChip = document.getElementById("bingoChip");
const countChip = document.getElementById("countChip");

let card = emptyCard();     // 3x9 con null o número
let marked = new Set();     // números marcados
let lastLineState = false;
let lastBingoState = false;

function emptyCard(){
  return Array.from({ length: ROWS }, () => Array(COLS).fill(null));
}

function shuffle(arr){
  for (let i = arr.length - 1; i > 0; i--){
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function colRange(col){
  if (col === 0) return [1, 9];
  if (col === 8) return [80, 90];
  const start = col * 10;
  return [start, start + 9];
}

function pickUnique(count, min, max, used){
  const pool = [];
  for (let n = min; n <= max; n++){
    if (!used.has(n)) pool.push(n);
  }
  shuffle(pool);
  return pool.slice(0, count);
}

function buildNewCard(){
  card = emptyCard();
  marked.clear();
  lastLineState = false;
  lastBingoState = false;

  // 1) En cada fila: escoger 5 columnas con número
  const rowCols = [];
  for (let r = 0; r < ROWS; r++){
    const cols = Array.from({ length: COLS }, (_, i) => i);
    shuffle(cols);
    rowCols.push(cols.slice(0, PER_ROW).sort((a,b)=>a-b));
  }

  // 2) Contar cuántos números por columna
  const colCount = Array(COLS).fill(0);
  for (let r = 0; r < ROWS; r++){
    for (const c of rowCols[r]) colCount[c]++;
  }

  // 3) Generar números por columna y colocarlos en filas correspondientes
  const usedGlobal = new Set();

  for (let c = 0; c < COLS; c++){
    const k = colCount[c];
    if (k === 0) continue;

    const [min, max] = colRange(c);
    const nums = pickUnique(k, min, max, usedGlobal);

    // ✅ Ordenación por columna: mayor->menor de arriba hacia abajo
    nums.sort((a,b)=>b-a);
    nums.forEach(n => usedGlobal.add(n));

    const rowsWith = [];
    for (let r = 0; r < ROWS; r++){
      if (rowCols[r].includes(c)) rowsWith.push(r);
    }
    rowsWith.sort((a,b)=>a-b); // fila 0 arriba

    for (let i = 0; i < rowsWith.length; i++){
      card[rowsWith[i]][c] = nums[i];
    }
  }

  render();
  updateStatus();
}

function render(){
  boardEl.innerHTML = "";

  for (let r = 0; r < ROWS; r++){
    for (let c = 0; c < COLS; c++){
      const v = card[r][c];
      const cell = document.createElement("div");
      cell.className = "cell";

      if (v == null){
        cell.classList.add("empty");
        const img = document.createElement("img");
        img.src = EMPTY_LOGO_URL;
        img.alt = "";
        img.loading = "lazy";
        cell.appendChild(img);
      } else {
        cell.classList.add("clickable");
        cell.textContent = String(v);
        if (marked.has(v)) cell.classList.add("marked");
        cell.addEventListener("click", () => toggleMark(v));
      }

      boardEl.appendChild(cell);
    }
  }
}

function toggleMark(n){
  if (marked.has(n)) marked.delete(n);
  else marked.add(n);
  render();
  updateStatus();
}

function clearMarks(){
  marked.clear();
  render();
  updateStatus();
}

function rowNumbers(r){
  return card[r].filter(x => x != null);
}

function hasLine(){
  // Línea = alguna fila con sus 5 números marcados
  for (let r = 0; r < ROWS; r++){
    const nums = rowNumbers(r);
    if (nums.length !== PER_ROW) continue;
    if (nums.every(n => marked.has(n))) return true;
  }
  return false;
}

function hasBingo(){
  // Bingo = 15 marcados
  let count = 0;
  for (let r = 0; r < ROWS; r++){
    for (let c = 0; c < COLS; c++){
      const v = card[r][c];
      if (v != null && marked.has(v)) count++;
    }
  }
  return count === TOTAL;
}

function markedCount(){
  let count = 0;
  for (let r = 0; r < ROWS; r++){
    for (let c = 0; c < COLS; c++){
      const v = card[r][c];
      if (v != null && marked.has(v)) count++;
    }
  }
  return count;
}

function pulseWin(){
  boardEl.classList.add("winflash");
  setTimeout(() => boardEl.classList.remove("winflash"), 450);
}

function updateStatus(){
  const line = hasLine();
  const bingo = hasBingo();
  const mc = markedCount();

  // contador
  countChip.textContent = `Marcados: ${mc}/${TOTAL}`;

  // chips
  lineChip.textContent = `Línea: ${line ? "SÍ" : "no"}`;
  bingoChip.textContent = `Bingo: ${bingo ? "SÍ" : "no"}`;
  lineChip.className = "chip " + (line ? "warn" : "ok");
  bingoChip.className = "chip " + (bingo ? "win" : "ok");

  // ✅ tensión progresiva (0..1)
  const t = mc / TOTAL;
  boardEl.style.setProperty("--tension", String(t));
  boardEl.classList.remove("tension-low","tension-mid","tension-high");

  if (t >= 0.25 && t < 0.6) boardEl.classList.add("tension-low");
  if (t >= 0.6  && t < 0.9) boardEl.classList.add("tension-mid");
  if (t >= 0.9)            boardEl.classList.add("tension-high");

  // flash solo cuando cambia el estado (no cada click)
  if ((line && !lastLineState) || (bingo && !lastBingoState)) pulseWin();
  lastLineState = line;
  lastBingoState = bingo;
}

// Theme
function getTheme(){
  const saved = localStorage.getItem(THEME_KEY);
  return (saved === "light" || saved === "dark") ? saved : "dark";
}
function setTheme(theme){
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem(THEME_KEY, theme);
  themeBtn.textContent = theme === "dark" ? "🌙" : "☀️";
}
function toggleTheme(){
  const now = document.documentElement.getAttribute("data-theme") || "dark";
  setTheme(now === "dark" ? "light" : "dark");
}

// Events
newBtn.addEventListener("click", buildNewCard);
clearBtn.addEventListener("click", clearMarks);
themeBtn.addEventListener("click", toggleTheme);

// Boot
setTheme(getTheme());
buildNewCard();
