"use strict";

/* =======================
   CONFIGURACIÓN
======================= */
const MIN = 1;
const MAX = 90;

// Keys LocalStorage
const DRAWN_KEY = "bingo90_drawn_numbers";
const BINGO_STARTED_AT_MS_KEY = "bingo_started_at_ms";
const BINGO_STARTED_AT_HMS_KEY = "bingo_started_at_hms";

const THEME_KEY = "bingo_theme";
const VOICE_KEY = "bingo_voice_on";
const VOICE_LANG_KEY = "bingo_voice_lang";
const VOICE_RATE_KEY = "bingo_voice_rate";

/* =======================
   ELEMENTOS UI
======================= */
const elCurrent = document.getElementById("current");
const elRemaining = document.getElementById("remaining");
const elHistory = document.getElementById("history");
const elStartedAt = document.getElementById("startedAtLabel");

const drawBtn = document.getElementById("drawBtn");
const undoBtn = document.getElementById("undoBtn");
const resetBtn = document.getElementById("resetBtn");
const autoBtn = document.getElementById("autoBtn");

const intervalInput = document.getElementById("intervalInput");
const syncToggle = document.getElementById("syncToggle");
const themeBtn = document.getElementById("themeBtn");

const voiceToggle = document.getElementById("voiceToggle");
const voiceLang = document.getElementById("voiceLang");
const voiceRate = document.getElementById("voiceRate");
const voiceHint = document.getElementById("voiceHint");

/* =======================
   ESTADO
======================= */
let pool = [];
let drawn = [];
let autoTimer = null;

/* =======================
   UTILIDADES
======================= */
function shuffle(arr){
  for (let i = arr.length - 1; i > 0; i--){
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

function initPool(){
  pool = [];
  for (let n = MIN; n <= MAX; n++) pool.push(n);
  shuffle(pool);
}

function formatHMS(ms){
  const d = new Date(ms);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}

function setCurrent(val){
  elCurrent.textContent = val ?? "—";
}

/* =======================
   TIMESTAMP PARTIDA
======================= */
function setStartedAt(ms){
  const hms = formatHMS(ms);
  localStorage.setItem(BINGO_STARTED_AT_MS_KEY, String(ms));
  localStorage.setItem(BINGO_STARTED_AT_HMS_KEY, hms);
  elStartedAt.textContent = hms;
}

function getStartedAtMs(){
  const raw = localStorage.getItem(BINGO_STARTED_AT_MS_KEY);
  const n = raw ? Number(raw) : NaN;
  return Number.isFinite(n) ? n : null;
}

/* =======================
   VOZ
======================= */
function speechSupported(){
  return "speechSynthesis" in window;
}

function speakNumber(n){
  if (!voiceToggle.checked) return;
  if (!speechSupported()) return;

  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(String(n));
  u.lang = voiceLang.value;
  u.rate = Number(voiceRate.value) || 1;
  window.speechSynthesis.speak(u);
}

/* =======================
   RENDER
======================= */
function render(){
  elRemaining.textContent = pool.length;
  elHistory.innerHTML = "";

  [...drawn].reverse().forEach(n => {
    const el = document.createElement("div");
    el.className = "pill";
    el.textContent = n;
    elHistory.appendChild(el);
  });

  undoBtn.disabled = drawn.length === 0;
  drawBtn.disabled = pool.length === 0;
}

/* =======================
   ACCIONES
======================= */
function drawNumber(){
  if (!pool.length) return;
  const n = pool.pop();
  drawn.push(n);
  setCurrent(n);
  speakNumber(n);

  if (syncToggle.checked){
    localStorage.setItem(DRAWN_KEY, JSON.stringify(drawn));
  }
  render();
}

function undo(){
  if (!drawn.length) return;
  const n = drawn.pop();
  pool.push(n);
  shuffle(pool);
  setCurrent(drawn.at(-1) ?? "—");
  localStorage.setItem(DRAWN_KEY, JSON.stringify(drawn));
  render();
}

function resetAll(){
  stopAuto();
  initPool();
  drawn = [];
  setCurrent("—");

  const now = Date.now();
  setStartedAt(now);

  localStorage.setItem(DRAWN_KEY, JSON.stringify([]));
  render();
}

/* =======================
   AUTO
======================= */
function startAuto(){
  const sec = Math.max(1, Number(intervalInput.value) || 2);
  autoTimer = setInterval(() => {
    if (!pool.length) stopAuto();
    else drawNumber();
  }, sec * 1000);
  autoBtn.textContent = "Stop";
}

function stopAuto(){
  clearInterval(autoTimer);
  autoTimer = null;
  autoBtn.textContent = "Auto";
}

function toggleAuto(){
  autoTimer ? stopAuto() : startAuto();
}

/* =======================
   THEME
======================= */
function setTheme(t){
  document.documentElement.setAttribute("data-theme", t);
  localStorage.setItem(THEME_KEY, t);
  themeBtn.textContent = t === "dark" ? "🌙" : "☀️";
}

function toggleTheme(){
  const t = document.documentElement.getAttribute("data-theme") || "dark";
  setTheme(t === "dark" ? "light" : "dark");
}

/* =======================
   EVENTOS
======================= */
drawBtn.onclick = drawNumber;
undoBtn.onclick = undo;
resetBtn.onclick = resetAll;
autoBtn.onclick = toggleAuto;
themeBtn.onclick = toggleTheme;

voiceToggle.onchange = () =>
  localStorage.setItem(VOICE_KEY, voiceToggle.checked ? "1" : "0");
voiceLang.onchange = () =>
  localStorage.setItem(VOICE_LANG_KEY, voiceLang.value);
voiceRate.oninput = () =>
  localStorage.setItem(VOICE_RATE_KEY, voiceRate.value);

window.addEventListener("keydown", e => {
  if (e.key === " ") { e.preventDefault(); drawNumber(); }
  if (e.key.toLowerCase() === "r") resetAll();
  if (e.key.toLowerCase() === "z") undo();
});

/* =======================
   INIT
======================= */
(function init(){
  // Theme
  setTheme(localStorage.getItem(THEME_KEY) || "dark");

  // Voz
  voiceToggle.checked = localStorage.getItem(VOICE_KEY) !== "0";
  voiceLang.value = localStorage.getItem(VOICE_LANG_KEY) || "es-ES";
  voiceRate.value = localStorage.getItem(VOICE_RATE_KEY) || "1";

  if (!speechSupported()){
    voiceToggle.checked = false;
    voiceToggle.disabled = true;
    voiceLang.disabled = true;
    voiceRate.disabled = true;
    voiceHint.textContent = "Este navegador no soporta voz.";
  }

  // Timestamp partida
  const startedAt = getStartedAtMs();
  if (startedAt === null) setStartedAt(Date.now());
  else elStartedAt.textContent =
    localStorage.getItem(BINGO_STARTED_AT_HMS_KEY);

  // Pool + historial
  initPool();
  const saved = JSON.parse(localStorage.getItem(DRAWN_KEY) || "[]");
  drawn = saved.filter(n => n >= MIN && n <= MAX);

  pool = pool.filter(n => !drawn.includes(n));
  setCurrent(drawn.at(-1) ?? "—");

  render();
})();
