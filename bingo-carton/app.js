"use strict";

// --- Config ---
const MIN = 1;
const MAX = 49;
const SIZE = 7; // 7x7 = 49
const STORAGE_KEY = "bingo_drawn_numbers_v1";

// --- UI ---
const gridEl = document.getElementById("grid");
const newCardBtn = document.getElementById("newCardBtn");
const clearMarksBtn = document.getElementById("clearMarksBtn");

const syncReadToggle = document.getElementById("syncReadToggle");
const autoMarkToggle = document.getElementById("autoMarkToggle");

const lastCalledEl = document.getElementById("lastCalled");
const lineStatusEl = document.getElementById("lineStatus");
const bingoStatusEl = document.getElementById("bingoStatus");

let numbers = [];             // length 49 (grid values)
let marked = new Set();       // marked numbers
let called = new Set();       // called numbers read from storage

function shuffle(arr){
  for (let i = arr.length - 1; i > 0; i--){
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function buildNewCard(){
  numbers = [];
  for (let n = MIN; n <= MAX; n++) numbers.push(n);
  shuffle(numbers);

  marked = new Set();
  renderGrid();
  updateWinStates();
}

function renderGrid(){
  gridEl.innerHTML = "";
  numbers.forEach((n) => {
    const cell = document.createElement("div");
    cell.className = "cell";
    cell.textContent = n;
    cell.dataset.n = String(n);

    if (called.has(n)) cell.classList.add("called");
    if (marked.has(n)) cell.classList.add("marked");

    cell.addEventListener("click", () => toggleMark(n));
    gridEl.appendChild(cell);
  });
}

function toggleMark(n){
  if (marked.has(n)) marked.delete(n);
  else marked.add(n);

  renderGrid();
  updateWinStates();
}

function clearMarks(){
  marked.clear();
  renderGrid();
  updateWinStates();
}

function readCalledFromStorage(){
  if (!syncReadToggle.checked) return;

  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    const clean = Array.isArray(arr)
      ? arr.map(Number).filter(x => Number.isInteger(x) && x >= MIN && x <= MAX)
      : [];

    called = new Set(clean);

    const last = clean.length ? clean[clean.length - 1] : null;
    lastCalledEl.textContent = `Último cantado: ${last ?? "—"}`;

    // Auto-marcado (opcional): marca SOLO si el número está en el cartón
    if (autoMarkToggle.checked && last != null && numbers.includes(last)){
      marked.add(last);
    }

    renderGrid();
    updateWinStates();
  }catch{
    // si storage corrupto, no hacemos nada
  }
}

function indexToRC(i){
  return { r: Math.floor(i / SIZE), c: i % SIZE };
}
function rcToIndex(r,c){
  return r * SIZE + c;
}

function hasLine(){
  // Línea = una fila o una columna completa marcada
  // (si quieres diagonales, lo añadimos fácil)
  // filas
  for (let r = 0; r < SIZE; r++){
    let ok = true;
    for (let c = 0; c < SIZE; c++){
      const n = numbers[rcToIndex(r,c)];
      if (!marked.has(n)) { ok = false; break; }
    }
    if (ok) return true;
  }
  // columnas
  for (let c = 0; c < SIZE; c++){
    let ok = true;
    for (let r = 0; r < SIZE; r++){
      const n = numbers[rcToIndex(r,c)];
      if (!marked.has(n)) { ok = false; break; }
    }
    if (ok) return true;
  }
  return false;
}

function hasBingo(){
  // Bingo = todo el cartón marcado
  return numbers.every(n => marked.has(n));
}

function updateWinStates(){
  const line = hasLine();
  const bingo = hasBingo();

  lineStatusEl.textContent = `Línea: ${line ? "SÍ" : "no"}`;
  bingoStatusEl.textContent = `Bingo: ${bingo ? "SÍ" : "no"}`;

  lineStatusEl.className = "chip " + (line ? "warn" : "ok");
  bingoStatusEl.className = "chip " + (bingo ? "win" : "ok");
}

// --- Events ---
newCardBtn.addEventListener("click", buildNewCard);
clearMarksBtn.addEventListener("click", clearMarks);

// Poll storage (simple y robusto)
setInterval(readCalledFromStorage, 400);

// --- Boot ---
buildNewCard();
readCalledFromStorage();
