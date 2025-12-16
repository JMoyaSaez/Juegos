"use strict";

// 1–90
const MIN = 1;
const MAX = 90;

// LocalStorage keys
const STORAGE_KEY_DRAWN = "bingo90_drawn_numbers_v1"; // lista de cantados
const BINGO_STARTED_AT_KEY = "bingo_started_at";      // timestamp inicio partida (al reiniciar)

const THEME_KEY = "bingo_theme_v2";
const VOICE_KEY = "bingo_voice_on_v1";
const VOICE_LANG_KEY = "bingo_voice_lang_v1";
const VOICE_RATE_KEY = "bingo_voice_rate_v1";

// UI
const elCurrent = document.getElementById("current");
const elRemaining = document.getElementById("remaining");
const elHistory = document.getElementById("history");
const startedAtLabel = document.getElementById("startedAtLabel");

const drawBtn = document.getElementById("drawBtn");
const undoBtn = document.getElementById("undoBtn");
const resetBtn = document.getElementById("resetBtn");

const syncToggle = document.getElementById("syncToggle");
const autoBtn = document.getElementById("autoBtn");
const intervalInput = document.getElementById("intervalInput");

const themeBtn = document.getElementById("themeBtn");

const voiceToggle = document.getElementById("voiceToggle");
const voiceLang = document.getElementById("voiceLang");
const voiceRate = document.getElementById("voiceRate");
const voiceHint = document.getElementById("voiceHint");

let pool = [];
let drawn = [];
let autoTimer = null;

// Utils
function shuffle(arr){
  for (let i = arr.length - 1; i > 0; i--){
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function initPool(){
  pool = [];
  for (let n = MIN; n <= MAX; n++) pool.push(n);
  shuffle(pool);
}

function setCurrent(value){
  elCurrent.textContent = value ?? "—";
}

function loadJSON(key, fallback){
  try{
    const raw = localStorage.getItem(key);
    if (raw == null) return fallback;
    return JSON.parse(raw);
  }catch{
    return fallback;
  }
}

function saveDrawn(){
  if (!syncToggle.checked) return;
  localStorage.setItem(STORAGE_KEY_DRAWN, JSON.stringify(drawn));
}

function getStartedAt(){
  const raw = localStorage.getItem(BINGO_STARTED_AT_KEY);
  const n = raw ? Number(raw) : NaN;
  return Number.isFinite(n) ? n : null;
}

function setStartedAt(ts){
  localStorage.setItem(BINGO_STARTED_AT_KEY, String(ts));
  startedAtLabel.textContent = String(ts);
}

function render(){
  elRemaining.textContent = String(pool.length);
  elHistory.innerHTML = "";

  drawn.slice().reverse().forEach(n => {
    const pill = document.createElement("div");
    pill.className = "pill";
    pill.textContent = n;
    elHistory.appendChild(pill);
  });

  undoBtn.disabled = drawn.length === 0;
  drawBtn.disabled = pool.length === 0;
}

// Voice
function speechSupported(){
  return "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
}

function speakNumber(n){
  if (!voiceToggle.checked) return;
  if (!speechSupported()) return;

  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(String(n));
  u.lang = voiceLang.value || "es-ES";
  u.rate = Number(voiceRate.value) || 1;

  try{ window.speechSynthesis.speak(u); }catch{}
}

// Actions
function drawNumber(){
  if (pool.length === 0) return;
  const n = pool.pop();
  drawn.push(n);
  setCurrent(n);
  saveDrawn();
  render();
  speakNumber(n);
}

function undo(){
  if (drawn.length === 0) return;
  const last = drawn.pop();
  pool.push(last);
  shuffle(pool);
  setCurrent(drawn.length ? drawn[drawn.length - 1] : "—");
  saveDrawn();
  render();
}

function stopAuto(){
  if (!autoTimer) return;
  clearInterval(autoTimer);
  autoTimer = null;
  autoBtn.textContent = "Auto";
}

function startAuto(){
  const sec = Math.max(1, Math.min(10, Number(intervalInput.value) || 2));
  intervalInput.value = String(sec);

  if (autoTimer) return;
  autoTimer = setInterval(() => {
    if (pool.length === 0) stopAuto();
    else drawNumber();
  }, sec * 1000);

  autoBtn.textContent = "Stop";
}

function toggleAuto(){
  if (autoTimer) stopAuto();
  else startAuto();
}

/**
 * 🔥 REGLA CLAVE:
 * Al REINICIAR el bombo se genera el timestamp oficial de partida.
 */
function resetAll(){
  stopAuto();
  initPool();
  drawn = [];
  setCurrent("—");

  const startedAt = Date.now();
  setStartedAt(startedAt);

  // limpia historial guardado
  localStorage.setItem(STORAGE_KEY_DRAWN, JSON.stringify([]));

  render();
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

// Voice prefs
function loadVoicePrefs(){
  const on = localStorage.getItem(VOICE_KEY);
  if (on === "0") voiceToggle.checked = false;
  if (on === "1") voiceToggle.checked = true;

  const lang = localStorage.getItem(VOICE_LANG_KEY);
  if (lang) voiceLang.value = lang;

  const rate = localStorage.getItem(VOICE_RATE_KEY);
  if (rate) voiceRate.value = rate;
}

function saveVoicePrefs(){
  localStorage.setItem(VOICE_KEY, voiceToggle.checked ? "1" : "0");
  localStorage.setItem(VOICE_LANG_KEY, voiceLang.value);
  localStorage.setItem(VOICE_RATE_KEY, String(voiceRate.value));
}

// Events
drawBtn.addEventListener("click", drawNumber);
undoBtn.addEventListener("click", undo);
resetBtn.addEventListener("click", resetAll);

autoBtn.addEventListener("click", toggleAuto);

themeBtn.addEventListener("click", toggleTheme);

voiceToggle.addEventListener("change", saveVoicePrefs);
voiceLang.addEventListener("change", saveVoicePrefs);
voiceRate.addEventListener("input", saveVoicePrefs);

window.addEventListener("keydown", (e) => {
  if (e.key === " "){ e.preventDefault(); drawNumber(); }
  if (e.key.toLowerCase() === "r") resetAll();
  if (e.key.toLowerCase() === "z") undo();
});

// Boot
(function boot(){
  setTheme(getTheme());
  initPool();

  // timestamp: si no existe, créalo (para que el cartón tenga referencia inicial)
  const startedAt = getStartedAt();
  if (startedAt == null) setStartedAt(Date.now());
  else startedAtLabel.textContent = String(startedAt);

  // drawn (si recargas)
  const stored = loadJSON(STORAGE_KEY_DRAWN, []);
  if (Array.isArray(stored) && stored.length){
    drawn = stored.map(Number).filter(n => Number.isInteger(n) && n >= MIN && n <= MAX);

    const drawnSet = new Set(drawn);
    pool = [];
    for (let n = MIN; n <= MAX; n++){
      if (!drawnSet.has(n)) pool.push(n);
    }
    shuffle(pool);

    setCurrent(drawn[drawn.length - 1] ?? "—");
  }else{
    setCurrent("—");
  }

  loadVoicePrefs();
  if (!speechSupported()){
    voiceToggle.checked = false;
    voiceToggle.disabled = true;
    voiceLang.disabled = true;
    voiceRate.disabled = true;
    voiceHint.textContent = "Tu navegador no soporta Web Speech API (voz).";
  }

  render();
})();
