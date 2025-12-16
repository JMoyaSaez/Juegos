"use strict";

/* =========================
   CONFIGURACIÓN
========================= */
const ROWS = 3;
const COLS = 9;
const NUMBERS_PER_ROW = 5;

// LocalStorage keys
const CARTON_KEY = "bingo_carton_data";
const MARKED_KEY = "bingo_carton_marked";
const CARTON_CREATED_AT_MS_KEY = "carton_created_at_ms";
const CARTON_CREATED_AT_HMS_KEY = "carton_created_at_hms";

const BINGO_STARTED_AT_MS_KEY = "bingo_started_at_ms";
const BINGO_STARTED_AT_HMS_KEY = "bingo_started_at_hms";

/* =========================
   UI
========================= */
const boardEl = document.querySelector(".board");
const statusEl = document.getElementById("status");
const createdAtLabel = document.getElementById("createdAtLabel");

/* =========================
   ESTADO
========================= */
let carton = [];     // matriz 3x9 (números o null)
let marked = new Set();

/* =========================
   UTILIDADES
========================= */
function formatHMS(ms){
  const d = new Date(ms);
  return [
    String(d.getHours()).padStart(2,"0"),
    String(d.getMinutes()).padStart(2,"0"),
    String(d.getSeconds()).padStart(2,"0")
  ].join(":");
}

function playBeep(freq = 440, dur = 80){
  try{
    const ctx = new AudioContext();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.frequency.value = freq;
    o.connect(g);
    g.connect(ctx.destination);
    o.start();
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur/1000);
    setTimeout(() => ctx.close(), dur + 50);
  }catch{}
}

function vibrate(ms = 15){
  if (navigator.vibrate) navigator.vibrate(ms);
}

/* =========================
   TIMESTAMPS
========================= */
function getBingoStartedAtMs(){
  return Number(localStorage.getItem(BINGO_STARTED_AT_MS_KEY) || 0);
}

function isCartonValid(){
  const created = Number(localStorage.getItem(CARTON_CREATED_AT_MS_KEY) || 0);
  const bingoStart = getBingoStartedAtMs();
  return created > 0 && bingoStart > 0 && created < bingoStart;
}

/* =========================
   GENERACIÓN CARTÓN
========================= */
function generateCarton(){
  // Inicializa vacío
  carton = Array.from({ length: ROWS }, () => Array(COLS).fill(null));

  for (let row = 0; row < ROWS; row++){
    // Elegir 5 columnas distintas
    const cols = [...Array(COLS).keys()]
      .sort(() => Math.random() - 0.5)
      .slice(0, NUMBERS_PER_ROW);

    cols.forEach(col => {
      const min = col === 0 ? 1 : col * 10;
      const max = col === 8 ? 90 : col * 10 + 9;
      carton[row][col] = Math.floor(Math.random() * (max - min + 1)) + min;
    });
  }

  // Ordenar cada columna de menor → mayor (arriba → abajo)
  for (let col = 0; col < COLS; col++){
    const nums = [];
    for (let row = 0; row < ROWS; row++){
      if (carton[row][col] !== null) nums.push(carton[row][col]);
    }
    nums.sort((a,b) => a - b);
    let i = 0;
    for (let row = 0; row < ROWS; row++){
      if (carton[row][col] !== null){
        carton[row][col] = nums[i++];
      }
    }
  }

  // Timestamp cartón
  const now = Date.now();
  localStorage.setItem(CARTON_CREATED_AT_MS_KEY, now);
  localStorage.setItem(CARTON_CREATED_AT_HMS_KEY, formatHMS(now));

  marked.clear();
  saveState();
}

/* =========================
   PERSISTENCIA
========================= */
function saveState(){
  localStorage.setItem(CARTON_KEY, JSON.stringify(carton));
  localStorage.setItem(MARKED_KEY, JSON.stringify([...marked]));
}

function loadState(){
  const c = localStorage.getItem(CARTON_KEY);
  const m = localStorage.getItem(MARKED_KEY);
  if (c){
    carton = JSON.parse(c);
    marked = new Set(m ? JSON.parse(m) : []);
    return true;
  }
  return false;
}

/* =========================
   RENDER
========================= */
function updateTension(){
  const hits = marked.size;
  const progress = hits / 15;
  const hue = 220 - Math.min(220, progress * 220); // azul → rojo
  boardEl.style.setProperty("--hit-hue", hue);
}

function render(){
  boardEl.innerHTML = "";

  carton.forEach((row, r) => {
    row.forEach((cell, c) => {
      const div = document.createElement("div");
      div.className = "cell";
      if (cell === null){
        div.classList.add("empty");
      } else {
        div.textContent = cell;
        if (marked.has(cell)) div.classList.add("marked");
        div.onclick = () => toggleMark(cell, div);
      }
      boardEl.appendChild(div);
    });
  });

  updateTension();
  updateStatus();
}

/* =========================
   INTERACCIÓN
========================= */
function toggleMark(n, el){
  if (marked.has(n)){
    marked.delete(n);
  } else {
    marked.add(n);
    playBeep(600);
    if (marked.size >= 12) vibrate(20);
  }
  el.classList.toggle("marked");
  saveState();
  updateTension();
  updateStatus();
}

/* =========================
   LÍNEA / BINGO
========================= */
function updateStatus(){
  const valid = isCartonValid();
  let line = false;

  for (let r = 0; r < ROWS; r++){
    const nums = carton[r].filter(n => n !== null);
    if (nums.every(n => marked.has(n))) line = true;
  }

  if (!valid){
    statusEl.textContent = "❌ Cartón no válido (hora posterior al bombo)";
    statusEl.className = "invalid";
    return;
  }

  if (marked.size === 15){
    statusEl.textContent = "🎉 BINGO";
    statusEl.className = "bingo";
    playBeep(900, 200);
    vibrate(60);
  } else if (line){
    statusEl.textContent = "✔ Línea";
    statusEl.className = "line";
  } else {
    statusEl.textContent = "—";
    statusEl.className = "";
  }
}

/* =========================
   INIT
========================= */
(function init(){
  // Hora del cartón
  const hms = localStorage.getItem(CARTON_CREATED_AT_HMS_KEY);
  if (hms) createdAtLabel.textContent = hms;

  // Cargar o crear
  if (!loadState()){
    generateCarton();
  }

  createdAtLabel.textContent =
    localStorage.getItem(CARTON_CREATED_AT_HMS_KEY);

  render();
})();
