"use strict";

/**
 * Cartón 3x9 (bingo 90):
 * - 3 filas x 9 columnas
 * - 15 números (5 por fila)
 * - Columnas por decenas:
 *   1–9, 10–19, 20–29, ... 70–79, 80–90
 * - Ordenación en cada columna: menor -> mayor (arriba->abajo)
 * - Persistencia: cartón + marcados en localStorage
 * - Dark/Light con persistencia
 * - Color marcado frío->rojo según progreso + sonido/vibración
 */

const ROWS = 3;
const COLS = 9;
const PER_ROW = 5;
const TOTAL = ROWS * PER_ROW;

const THEME_KEY = "bingo_theme_carton_v1";
const CARD_KEY = "bingo_carton_card_v1";
const MARKED_KEY = "bingo_carton_marked_v1";

const boardEl = document.getElementById("board");
const statusEl = document.getElementById("status");
const themeBtn = document.getElementById("themeBtn");
const newBtn = document.getElementById("newBtn");
const clearBtn = document.getElementById("clearBtn");

const CARTON_TIME_KEY = "bingo_carton_time_hms";
const cartonTimeEl = document.getElementById("cartonTime");

let card = emptyCard();
let marked = new Set();


function nowHMS(){
  const d = new Date();
  return `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}:${String(d.getSeconds()).padStart(2,"0")}`;
}


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

/* ====== sonido/vibración ====== */
function playBeep(freq = 520, dur = 70){
  try{
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sine";
    o.frequency.value = freq;
    g.gain.value = 0.08;
    o.connect(g);
    g.connect(ctx.destination);
    o.start();
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur/1000);
    setTimeout(() => ctx.close(), dur + 60);
  }catch{}
}

function vibrate(ms = 15){
  if (navigator.vibrate) navigator.vibrate(ms);
}

/* ====== persistencia ====== */
function saveState(){
  localStorage.setItem(CARD_KEY, JSON.stringify(card));
  localStorage.setItem(MARKED_KEY, JSON.stringify([...marked]));
}

function loadState(){
  try{
    const c = localStorage.getItem(CARD_KEY);
    const m = localStorage.getItem(MARKED_KEY);
    if (!c) return false;
    const parsed = JSON.parse(c);
    if (!Array.isArray(parsed) || parsed.length !== ROWS) return false;
    card = parsed;
    marked = new Set(m ? JSON.parse(m) : []);
    return true;
  }catch{
    return false;
  }
}

/* ====== generación cartón ====== */
function buildNewCard(){
  card = emptyCard();
  marked.clear();

  const hms = nowHMS();
  localStorage.setItem(CARTON_TIME_KEY, hms);
  if (cartonTimeEl) cartonTimeEl.textContent = `Cartón: ${hms}`;

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

    // ✅ Ordenación por columna: menor->mayor (arriba->abajo)
    nums.sort((a,b)=>a-b);
    nums.forEach(n => usedGlobal.add(n));

    const rowsWith = [];
    for (let r = 0; r < ROWS; r++){
      if (rowCols[r].includes(c)) rowsWith.push(r);
    }
    rowsWith.sort((a,b)=>a-b);

    for (let i = 0; i < rowsWith.length; i++){
      card[rowsWith[i]][c] = nums[i];
    }
  }

  saveState();
  render();
  updateStatus();
}

/* ====== render ====== */
function updateHeat(){
  const hits = marked.size;
  const p = Math.min(1, hits / TOTAL);
  const hue = 220 - p * 220; // azul -> rojo
  boardEl.style.setProperty("--hit-hue", String(hue));
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
      } else {
        cell.classList.add("clickable");
        cell.textContent = String(v);
        if (marked.has(v)) cell.classList.add("marked");

        cell.addEventListener("click", () => toggleMark(v));
      }

      boardEl.appendChild(cell);
    }
  }

  updateHeat();
}

function toggleMark(n){
  if (marked.has(n)) {
    marked.delete(n);
  } else {
    marked.add(n);

    // sonido + “nervio” cerca del final
    playBeep(520 + Math.min(380, marked.size * 22), 70);
    if (marked.size >= 12) vibrate(18);
    if (marked.size >= 14) vibrate(28);
  }

  saveState();
  render();
  updateStatus();
}

/* ====== estado ====== */
function hasLine(){
  for (let r = 0; r < ROWS; r++){
    const nums = card[r].filter(x => x != null);
    if (nums.length !== PER_ROW) continue;
    if (nums.every(n => marked.has(n))) return true;
  }
  return false;
}

function updateStatus(){
  const hits = marked.size;
  const line = hasLine();
  const bingo = hits === TOTAL;

  if (bingo){
    statusEl.textContent = "🎉 BINGO";
    statusEl.style.color = "var(--text)";
    playBeep(900, 180);
    vibrate(60);
    return;
  }
  if (line){
    statusEl.textContent = "✔ LÍNEA";
    statusEl.style.color = "var(--muted)";
    return;
  }
  statusEl.textContent = `— ${hits}/${TOTAL}`;
  statusEl.style.color = "var(--muted)";
}

/* ====== theme ====== */
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

/* ====== events ====== */
themeBtn.addEventListener("click", toggleTheme);
newBtn.addEventListener("click", buildNewCard);
clearBtn.addEventListener("click", () => {
  marked.clear();
  saveState();
  render();
  updateStatus();
});

/* ====== boot ====== */
setTheme(getTheme());
if (!loadState()) buildNewCard();
else { render(); updateStatus(); }

const savedTime = localStorage.getItem(CARTON_TIME_KEY);
if (savedTime && cartonTimeEl){
  cartonTimeEl.textContent = `Cartón: ${savedTime}`;
}

let t = localStorage.getItem(CARTON_TIME_KEY);
if (!t) {
  t = nowHMS();
  localStorage.setItem(CARTON_TIME_KEY, t);
}
if (cartonTimeEl) cartonTimeEl.textContent = `Cartón: ${t}`;
