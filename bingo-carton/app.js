"use strict";

/* =========================
   CONFIGURACIÓN
========================= */
const ROWS = 3;
const COLS = 9;
const NUMBERS_PER_ROW = 5;
const TOTAL_NUMBERS = 15;

// LocalStorage keys
const CARTON_KEY = "bingo_carton_data";
const MARKED_KEY = "bingo_carton_marked";
const CARTON_CREATED_AT_MS_KEY = "carton_created_at_ms";
const CARTON_CREATED_AT_HMS_KEY = "carton_created_at_hms";

const BINGO_STARTED_AT_MS_KEY = "bingo_started_at_ms";
const BINGO_STARTED_AT_HMS_KEY = "bingo_started_at_hms";

/* =========================
   UTILIDADES DOM (robustas)
========================= */
function qs(sel) { return document.querySelector(sel); }
function byId(id) { return document.getElementById(id); }

function ensureEl({ selector, id, parentSelector = "body", tag = "div", className = "", text = "" }) {
  let el = selector ? qs(selector) : null;
  if (!el && id) el = byId(id);
  if (el) return el;

  const parent = qs(parentSelector) || document.body;
  el = document.createElement(tag);
  if (id) el.id = id;
  if (className) el.className = className;
  if (text) el.textContent = text;
  parent.appendChild(el);
  return el;
}

/* =========================
   UI (no fallará aunque falte HTML)
========================= */
const boardEl = ensureEl({
  selector: ".board",
  parentSelector: "main, body",
  tag: "div",
  className: "board"
});

const statusEl = ensureEl({
  id: "status",
  parentSelector: "main, body",
  tag: "div",
  className: "status",
  text: "—"
});

const createdAtLabel = ensureEl({
  id: "createdAtLabel",
  parentSelector: "main, body",
  tag: "div",
  className: "meta",
  text: ""
});

// Botones opcionales (si existen en tu HTML los engancha; si no, no pasa nada)
const newBtn = byId("newBtn");
const clearBtn = byId("clearBtn");

/* =========================
   ESTADO
========================= */
let carton = [];     // matriz 3x9 (números o null)
let marked = new Set();

/* =========================
   HELPERS
========================= */
function formatHMS(ms){
  const d = new Date(ms);
  const hh = String(d.getHours()).padStart(2,"0");
  const mm = String(d.getMinutes()).padStart(2,"0");
  const ss = String(d.getSeconds()).padStart(2,"0");
  return `${hh}:${mm}:${ss}`;
}

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

/* =========================
   TIMESTAMPS
========================= */
function getBingoStartedAtMs(){
  const raw = localStorage.getItem(BINGO_STARTED_AT_MS_KEY);
  const n = raw ? Number(raw) : NaN;
  return Number.isFinite(n) ? n : 0;
}

function getCartonCreatedAtMs(){
  const raw = localStorage.getItem(CARTON_CREATED_AT_MS_KEY);
  const n = raw ? Number(raw) : NaN;
  return Number.isFinite(n) ? n : 0;
}

function isCartonValid(){
  const created = getCartonCreatedAtMs();
  const bingoStart = getBingoStartedAtMs();
  // válido si ambos existen y created < bingoStart
  return created > 0 && bingoStart > 0 && created < bingoStart;
}

/* =========================
   PERSISTENCIA
========================= */
function saveState(){
  localStorage.setItem(CARTON_KEY, JSON.stringify(carton));
  localStorage.setItem(MARKED_KEY, JSON.stringify([...marked]));
}

function loadState(){
  try{
    const c = localStorage.getItem(CARTON_KEY);
    const m = localStorage.getItem(MARKED_KEY);
    if (!c) return false;
    carton = JSON.parse(c);
    marked = new Set(m ? JSON.parse(m) : []);
    return Array.isArray(carton) && carton.length === ROWS;
  }catch{
    return false;
  }
}

function setCartonTimestampNow(){
  const now = Date.now();
  localStorage.setItem(CARTON_CREATED_AT_MS_KEY, String(now));
  localStorage.setItem(CARTON_CREATED_AT_HMS_KEY, formatHMS(now));
  createdAtLabel.textContent = `Cartón: ${localStorage.getItem(CARTON_CREATED_AT_HMS_KEY) || ""}`;
}

/* =========================
   GENERACIÓN DE CARTÓN
========================= */
function colRange(col){
  if (col === 0) return [1, 9];
  if (col === 8) return [80, 90];
  const start = col * 10;
  return [start, start + 9];
}

function generateCarton(){
  carton = Array.from({ length: ROWS }, () => Array(COLS).fill(null));

  // 1) Elegir 5 columnas por fila
  const rowCols = [];
  for (let r = 0; r < ROWS; r++){
    const cols = Array.from({ length: COLS }, (_, i) => i);
    cols.sort(() => Math.random() - 0.5);
    rowCols.push(cols.slice(0, NUMBERS_PER_ROW).sort((a,b)=>a-b));
  }

  // 2) Contar cuántos números por columna
  const colCount = Array(COLS).fill(0);
  for (let r = 0; r < ROWS; r++){
    for (const c of rowCols[r]) colCount[c]++;
  }

  // 3) Generar números por columna sin repetir globalmente
  const used = new Set();

  for (let c = 0; c < COLS; c++){
    const k = colCount[c];
    if (k === 0) continue;

    const [min, max] = colRange(c);
    const pool = [];
    for (let n = min; n <= max; n++){
      if (!used.has(n)) pool.push(n);
    }
    pool.sort(() => Math.random() - 0.5);
    const nums = pool.slice(0, k);

    // ✅ ORDEN por columna: menor → mayor (arriba → abajo)
    nums.sort((a,b)=>a-b);
    nums.forEach(n => used.add(n));

    const rowsWith = [];
    for (let r = 0; r < ROWS; r++){
      if (rowCols[r].includes(c)) rowsWith.push(r);
    }
    rowsWith.sort((a,b)=>a-b);

    for (let i = 0; i < rowsWith.length; i++){
      carton[rowsWith[i]][c] = nums[i];
    }
  }

  marked.clear();
  setCartonTimestampNow();
  saveState();
}

/* =========================
   UI: tensión y render
========================= */
function updateHeat(){
  const hits = marked.size;
  const progress = Math.min(1, hits / TOTAL_NUMBERS);
  // azul (220) -> rojo (0)
  const hue = 220 - progress * 220;
  boardEl.style.setProperty("--hit-hue", String(hue));
  boardEl.style.setProperty("--progress", String(progress));
}

function render(){
  boardEl.innerHTML = "";
  for (let r = 0; r < ROWS; r++){
    for (let c = 0; c < COLS; c++){
      const v = carton[r][c];
      const cell = document.createElement("div");
      cell.className = "cell";

      if (v == null){
        cell.classList.add("empty");
        // si tu CSS pinta logo en .empty, perfecto
      } else {
        cell.classList.add("clickable");
        cell.textContent = String(v);

        if (marked.has(v)) cell.classList.add("marked");

        cell.addEventListener("click", () => {
          if (marked.has(v)) marked.delete(v);
          else {
            marked.add(v);
            playBeep(520 + Math.min(400, marked.size * 22), 70);
            if (marked.size >= 12) vibrate(18);
            if (marked.size >= 14) vibrate(28);
          }
          saveState();
          updateHeat();
          updateStatus();
          render(); // re-render para reflejar marcado (simple y fiable)
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
    const nums = carton[r].filter(x => x != null);
    if (nums.length === NUMBERS_PER_ROW && nums.every(n => marked.has(n))) return true;
  }
  return false;
}

function updateStatus(){
  const valid = isCartonValid();
  const hits = marked.size;
  const line = hasLine();
  const bingo = hits === TOTAL_NUMBERS;

  const cartonH = localStorage.getItem(CARTON_CREATED_AT_HMS_KEY) || "";
  const bingoH = localStorage.getItem(BINGO_STARTED_AT_HMS_KEY) || "";

  // Siempre mostramos horas para verificación “a ojo”
  createdAtLabel.textContent = `Cartón: ${cartonH} · Bombo: ${bingoH}`;

  if (!valid){
    statusEl.textContent = `❌ Cartón NO válido (creado después del bombo) · Marcados: ${hits}/15`;
    statusEl.className = "status invalid";
    return;
  }

  if (bingo){
    statusEl.textContent = `🎉 BINGO ✅ · Marcados: 15/15`;
    statusEl.className = "status bingo";
    playBeep(900, 180);
    vibrate(60);
    return;
  }

  if (line){
    statusEl.textContent = `✔ LÍNEA ✅ · Marcados: ${hits}/15`;
    statusEl.className = "status line";
    return;
  }

  statusEl.textContent = `— Marcados: ${hits}/15`;
  statusEl.className = "status";
}

/* =========================
   BOTONES (si existen)
========================= */
function clearMarks(){
  marked.clear();
  saveState();
  render();
}

function newCarton(){
  generateCarton();
  render();
}

if (newBtn) newBtn.addEventListener("click", newCarton);
if (clearBtn) clearBtn.addEventListener("click", clearMarks);

/* =========================
   INIT
========================= */
(function init(){
  // Si existe estado guardado, lo cargamos; si no, generamos.
  if (!loadState()){
    generateCarton();
  } else {
    // Asegura que existan labels aunque sea un cartón antiguo
    if (!localStorage.getItem(CARTON_CREATED_AT_MS_KEY) || !localStorage.getItem(CARTON_CREATED_AT_HMS_KEY)){
      setCartonTimestampNow();
      saveState();
    }
  }

  render();
})();
