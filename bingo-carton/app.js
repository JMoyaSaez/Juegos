"use strict";

/* ===== CONFIG ===== */
const ROWS = 3;
const COLS = 9;
const PER_ROW = 5;
const TOTAL = ROWS * PER_ROW;

const CARTON_KEY = "bingo_carton_data";
const MARKED_KEY = "bingo_carton_marked";
const CARTON_CREATED_AT_MS_KEY = "carton_created_at_ms";
const CARTON_CREATED_AT_HMS_KEY = "carton_created_at_hms";

const BOMBO_HMS_MANUAL_KEY = "bingo_started_at_hms_manual";
const THEME_KEY = "bingo_theme";

/* ===== DOM ===== */
const boardEl = document.getElementById("board");
const statusEl = document.getElementById("status");
const createdAtLabel = document.getElementById("createdAtLabel");
const bomboLabel = document.getElementById("bomboLabel");

const bomboTimeInput = document.getElementById("bomboTime");
const saveBomboBtn = document.getElementById("saveBomboBtn");

const newBtn = document.getElementById("newBtn");
const clearBtn = document.getElementById("clearBtn");
const themeBtn = document.getElementById("themeBtn");

/* ===== STATE ===== */
let card = emptyCard();  // 3x9 numbers or null
let marked = new Set();

/* ===== HELPERS ===== */
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

function formatHMS(ms){
  const d = new Date(ms);
  const hh = String(d.getHours()).padStart(2,"0");
  const mm = String(d.getMinutes()).padStart(2,"0");
  const ss = String(d.getSeconds()).padStart(2,"0");
  return `${hh}:${mm}:${ss}`;
}

function hmsToSeconds(hms){
  const m = /^(\d{2}):(\d{2}):(\d{2})$/.exec((hms || "").trim());
  if (!m) return null;
  const hh = +m[1], mm = +m[2], ss = +m[3];
  if (hh > 23 || mm > 59 || ss > 59) return null;
  return hh * 3600 + mm * 60 + ss;
}

/* === sonido + vibración === */
function beep(freq = 520, dur = 70){
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

function vib(ms){
  if (navigator.vibrate) navigator.vibrate(ms);
}

/* ===== THEME ===== */
function setTheme(t){
  document.documentElement.setAttribute("data-theme", t);
  localStorage.setItem(THEME_KEY, t);
  if (themeBtn) themeBtn.textContent = t === "dark" ? "🌙" : "☀️";
}
function toggleTheme(){
  const now = document.documentElement.getAttribute("data-theme") || "dark";
  setTheme(now === "dark" ? "light" : "dark");
}

/* ===== BOMBO TIME (manual, cross-device) ===== */
function getBomboHMS(){
  return localStorage.getItem(BOMBO_HMS_MANUAL_KEY) || "--:--:--";
}

function saveBomboHMS(){
  const v = (bomboTimeInput.value || "").trim();
  if (hmsToSeconds(v) == null){
    alert("Formato inválido. Usa HH:MM:SS");
    return;
  }
  localStorage.setItem(BOMBO_HMS_MANUAL_KEY, v);
  renderMeta();
  updateStatus();
}

/* ===== VALIDACIÓN ===== */
function cartonValid(){
  const cartonH = localStorage.getItem(CARTON_CREATED_AT_HMS_KEY) || "";
  const bomboH = getBomboHMS();
  const c = hmsToSeconds(cartonH);
  const b = hmsToSeconds(bomboH);
  if (c == null || b == null) return false;
  return c < b;
}

/* ===== GENERACIÓN CARTÓN (90 bingo) ===== */
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

  // columnas activas por fila (5)
  const rowCols = [];
  for (let r = 0; r < ROWS; r++){
    const cols = Array.from({ length: COLS }, (_, i) => i);
    shuffle(cols);
    rowCols.push(cols.slice(0, PER_ROW).sort((a,b)=>a-b));
  }

  // recuento por columna
  const colCount = Array(COLS).fill(0);
  for (let r = 0; r < ROWS; r++){
    for (const c of rowCols[r]) colCount[c]++;
  }

  const usedGlobal = new Set();

  for (let c = 0; c < COLS; c++){
    const k = colCount[c];
    if (k === 0) continue;

    const [min, max] = colRange(c);
    const nums = pickUnique(k, min, max, usedGlobal);

    // ✅ ORDEN POR COLUMNA: menor → mayor (arriba → abajo)
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

  // timestamp cartón
  const now = Date.now();
  localStorage.setItem(CARTON_CREATED_AT_MS_KEY, String(now));
  localStorage.setItem(CARTON_CREATED_AT_HMS_KEY, formatHMS(now));

  saveState();
  renderMeta();
  render();
}

/* ===== PERSISTENCIA ===== */
function saveState(){
  localStorage.setItem(CARTON_KEY, JSON.stringify(card));
  localStorage.setItem(MARKED_KEY, JSON.stringify([...marked]));
}

function loadState(){
  try{
    const c = localStorage.getItem(CARTON_KEY);
    if (!c) return false;
    card = JSON.parse(c);
    marked = new Set(JSON.parse(localStorage.getItem(MARKED_KEY) || "[]"));
    return Array.isArray(card) && card.length === ROWS;
  }catch{
    return false;
  }
}

/* ===== UI ===== */
function updateHeat(){
  const progress = Math.min(1, marked.size / TOTAL);
  const hue = 220 - progress * 220; // azul -> rojo
  boardEl.style.setProperty("--hit-hue", String(hue));
}

function renderMeta(){
  const cartonH = localStorage.getItem(CARTON_CREATED_AT_HMS_KEY) || "--:--:--";
  const bomboH = getBomboHMS();
  createdAtLabel.textContent = cartonH;
  bomboLabel.textContent = bomboH;
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

        cell.addEventListener("click", () => {
          const wasMarked = marked.has(v);
          if (wasMarked) marked.delete(v);
          else {
            marked.add(v);

            // sonido / vibración con “nervios”
            const hits = marked.size;
            beep(520 + Math.min(380, hits * 24), 70);
            if (hits >= 12) vib(18);
            if (hits >= 14) vib(28);
          }

          saveState();
          updateHeat();
          updateStatus();
          render(); // simple y fiable
        });
      }

      boardEl.appendChild(cell);
    }
  }

  updateHeat();
  updateStatus();
}

function hasLine(){
  for (let r = 0; r < ROWS; r++){
    const nums = card[r].filter(x => x != null);
    if (nums.length === PER_ROW && nums.every(n => marked.has(n))) return true;
  }
  return false;
}

function updateStatus(){
  const valid = cartonValid();
  const hits = marked.size;
  const line = hasLine();
  const bingo = hits === TOTAL;

  if (!valid){
    statusEl.textContent = `❌ Cartón NO válido · ${hits}/15`;
    statusEl.className = "statusText invalid";
    return;
  }

  if (bingo){
    statusEl.textContent = `🎉 BINGO ✅`;
    statusEl.className = "statusText bingo";
    beep(900, 180);
    vib(60);
    return;
  }

  if (line){
    statusEl.textContent = `✔ LÍNEA ✅ · ${hits}/15`;
    statusEl.className = "statusText line";
    return;
  }

  statusEl.textContent = `— Marcados: ${hits}/15`;
  statusEl.className = "statusText";
}

/* ===== ACTIONS ===== */
function clearMarks(){
  marked.clear();
  saveState();
  updateHeat();
  updateStatus();
  render();
}

/* ===== EVENTS ===== */
newBtn.addEventListener("click", buildNewCard);
clearBtn.addEventListener("click", clearMarks);
themeBtn.addEventListener("click", toggleTheme);
saveBomboBtn.addEventListener("click", saveBomboHMS);

/* ===== BOOT ===== */
(function boot(){
  // theme
  setTheme(localStorage.getItem(THEME_KEY) || "dark");

  // bombo input preload
  const savedBombo = localStorage.getItem(BOMBO_HMS_MANUAL_KEY);
  if (savedBombo) bomboTimeInput.value = savedBombo;

  // carton state
  if (!loadState()){
    buildNewCard();
  } else {
    // si faltan timestamps, los creamos
    if (!localStorage.getItem(CARTON_CREATED_AT_HMS_KEY)){
      const now = Date.now();
      localStorage.setItem(CARTON_CREATED_AT_MS_KEY, String(now));
      localStorage.setItem(CARTON_CREATED_AT_HMS_KEY, formatHMS(now));
    }
    renderMeta();
    render();
  }
})();
