"use strict";

/**
 * Cartón tipo bingo.es:
 * - 3 filas x 9 columnas
 * - 15 números (5 por fila)
 * - Rangos típicos por columna:
 *   c0: 1–9, c1: 10–19, ... c7: 70–79, c8: 80–90
 * - Números ordenados dentro de cada columna de arriba a abajo
 */

// --- Config ---
const ROWS = 3;
const COLS = 9;
const NUMBERS_PER_ROW = 5; // 5 por fila => 15 total
const TOTAL_NUMBERS = ROWS * NUMBERS_PER_ROW;

// Si quieres sincronizar con un bombo, pon el mismo storage key en el bombo:
const STORAGE_KEY_CALLED = "bingo90_drawn_numbers_v1";

// Tema
const THEME_KEY = "bingo_theme_v1"; // "dark" | "light"

// --- UI ---
const gridEl = document.getElementById("grid");
const newCardBtn = document.getElementById("newCardBtn");
const clearMarksBtn = document.getElementById("clearMarksBtn");
const syncReadToggle = document.getElementById("syncReadToggle");
const autoMarkToggle = document.getElementById("autoMarkToggle");
const lastCalledEl = document.getElementById("lastCalled");
const lineStatusEl = document.getElementById("lineStatus");
const bingoStatusEl = document.getElementById("bingoStatus");
const themeBtn = document.getElementById("themeBtn");

let card = makeEmptyCard();      // matriz 3x9 con null o número
let marked = new Set();          // números marcados
let called = new Set();          // números cantados (si sync)
let lastCalled = null;

// --- Helpers ---
function makeEmptyCard(){
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
  // col 0: 1-9
  // col 1: 10-19
  // ...
  // col 8: 80-90
  if (col === 0) return [1, 9];
  if (col === 8) return [80, 90];
  const start = col * 10;
  return [start, start + 9];
}

function pickUniqueInRange(count, min, max, usedGlobal){
  const pool = [];
  for (let n = min; n <= max; n++){
    if (!usedGlobal.has(n)) pool.push(n);
  }
  shuffle(pool);
  return pool.slice(0, count);
}

// --- Generación del cartón ---
function buildNewCard(){
  card = makeEmptyCard();
  marked.clear();

  // 1) Elegimos en cada fila 5 columnas (posiciones con número)
  const rowCols = [];
  for (let r = 0; r < ROWS; r++){
    const cols = Array.from({ length: COLS }, (_, i) => i);
    shuffle(cols);
    rowCols.push(cols.slice(0, NUMBERS_PER_ROW).sort((a,b)=>a-b));
  }

  // 2) Contamos cuántos números habrá por columna (0..3)
  const colCount = Array(COLS).fill(0);
  for (let r = 0; r < ROWS; r++){
    for (const c of rowCols[r]) colCount[c]++;
  }
  // colCount suma 15 sí o sí

  // 3) Para cada columna con k>0: generamos k números del rango, únicos globalmente,
  //    y los asignamos a las filas seleccionadas de arriba a abajo en orden ascendente
  const usedGlobal = new Set();

  for (let c = 0; c < COLS; c++){
    const k = colCount[c];
    if (k === 0) continue;

    const [min, max] = colRange(c);
    const nums = pickUniqueInRange(k, min, max, usedGlobal).sort((a,b)=>a-b);
    nums.forEach(n => usedGlobal.add(n));

    // filas que tienen número en esta columna:
    const rowsWithThisCol = [];
    for (let r = 0; r < ROWS; r++){
      if (rowCols[r].includes(c)) rowsWithThisCol.push(r);
    }
    // asignar en orden ascendente a la fila superior primero
    rowsWithThisCol.sort((a,b)=>a-b);
    for (let i = 0; i < rowsWithThisCol.length; i++){
      card[rowsWithThisCol[i]][c] = nums[i];
    }
  }

  render();
  updateWinStates();
}

// --- Render + interacción ---
function render(){
  gridEl.innerHTML = "";

  for (let r = 0; r < ROWS; r++){
    for (let c = 0; c < COLS; c++){
      const val = card[r][c];
      const cell = document.createElement("div");
      cell.className = "cell";

      if (val == null){
        cell.classList.add("empty");
        cell.textContent = "";
      }else{
        cell.classList.add("clickable");
        cell.textContent = String(val);
        cell.dataset.n = String(val);

        if (called.has(val)) cell.classList.add("called");
        if (marked.has(val)) cell.classList.add("marked");

        cell.addEventListener("click", () => toggleMark(val));
      }

      gridEl.appendChild(cell);
    }
  }

  lastCalledEl.textContent = `Último cantado: ${lastCalled ?? "—"}`;
}

function toggleMark(n){
  if (marked.has(n)) marked.delete(n);
  else marked.add(n);

  render();
  updateWinStates();
}

function clearMarks(){
  marked.clear();
  render();
  updateWinStates();
}

// --- Línea / Bingo ---
function rowNumbers(r){
  return card[r].filter(x => x != null);
}

function hasLine(){
  // línea = una fila completa (sus 5 números marcados)
  for (let r = 0; r < ROWS; r++){
    const nums = rowNumbers(r);
    if (nums.length !== NUMBERS_PER_ROW) continue;
    if (nums.every(n => marked.has(n))) return true;
  }
  return false;
}

function hasBingo(){
  // bingo = 15 números marcados
  let count = 0;
  for (let r = 0; r < ROWS; r++){
    for (let c = 0; c < COLS; c++){
      const v = card[r][c];
      if (v != null && marked.has(v)) count++;
    }
  }
  return count === TOTAL_NUMBERS;
}

function updateWinStates(){
  const line = hasLine();
  const bingo = hasBingo();

  lineStatusEl.textContent = `Línea: ${line ? "SÍ" : "no"}`;
  bingoStatusEl.textContent = `Bingo: ${bingo ? "SÍ" : "no"}`;

  lineStatusEl.className = "chip " + (line ? "warn" : "ok");
  bingoStatusEl.className = "chip " + (bingo ? "win" : "ok");
}

// --- Sync opcional (leer cantados) ---
function readCalledFromStorage(){
  if (!syncReadToggle.checked) return;

  try{
    const raw = localStorage.getItem(STORAGE_KEY_CALLED);
    const arr = raw ? JSON.parse(raw) : [];
    const clean = Array.isArray(arr)
      ? arr.map(Number).filter(n => Number.isInteger(n) && n >= 1 && n <= 90)
      : [];

    called = new Set(clean);
    lastCalled = clean.length ? clean[clean.length - 1] : null;

    // auto-marcado: solo si el número está en el cartón
    if (autoMarkToggle.checked && lastCalled != null){
      // buscar si existe en el cartón
      let exists = false;
      for (let r = 0; r < ROWS; r++){
        for (let c = 0; c < COLS; c++){
          if (card[r][c] === lastCalled) { exists = true; break; }
        }
        if (exists) break;
      }
      if (exists) marked.add(lastCalled);
    }

    render();
    updateWinStates();
  }catch{
    // storage corrupto -> ignorar
  }
}

// --- Tema dark/light ---
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

// --- Events ---
newCardBtn.addEventListener("click", buildNewCard);
clearMarksBtn.addEventListener("click", clearMarks);
themeBtn.addEventListener("click", toggleTheme);

// Poll simple (si usas sincronización)
setInterval(readCalledFromStorage, 400);

// --- Boot ---
setTheme(getTheme());
buildNewCard();
