"use strict";

// --- Config ---
const MIN = 1;
const MAX = 49;
const STORAGE_KEY = "bingo_drawn_numbers_v1";

// --- UI ---
const elCurrent = document.getElementById("current");
const elRemaining = document.getElementById("remaining");
const elHistory = document.getElementById("history");

const drawBtn = document.getElementById("drawBtn");
const undoBtn = document.getElementById("undoBtn");
const resetBtn = document.getElementById("resetBtn");

const syncToggle = document.getElementById("syncToggle");
const autoBtn = document.getElementById("autoBtn");
const intervalInput = document.getElementById("intervalInput");

let pool = [];
let drawn = [];
let autoTimer = null;

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

function saveIfSyncOn(){
  if (!syncToggle.checked) return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(drawn));
}

function loadFromStorage(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    // Filtrado defensivo
    return arr
      .map(n => Number(n))
      .filter(n => Number.isInteger(n) && n >= MIN && n <= MAX);
  }catch{
    return [];
  }
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

function setCurrent(value){
  elCurrent.textContent = value ?? "—";
}

function drawNumber(){
  if (pool.length === 0) return;
  const n = pool.pop();
  drawn.push(n);
  setCurrent(n);
  saveIfSyncOn();
  render();
}

function undo(){
  if (drawn.length === 0) return;
  const last = drawn.pop();
  pool.push(last);
  shuffle(pool); // para mantener aleatoriedad tras deshacer
  setCurrent(drawn.length ? drawn[drawn.length - 1] : "—");
  saveIfSyncOn();
  render();
}

function resetAll(){
  stopAuto();
  initPool();
  drawn = [];
  setCurrent("—");
  saveIfSyncOn(); // vacía storage si sync está ON
  render();
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

function stopAuto(){
  if (!autoTimer) return;
  clearInterval(autoTimer);
  autoTimer = null;
  autoBtn.textContent = "Auto";
}

function toggleAuto(){
  if (autoTimer) stopAuto();
  else startAuto();
}

// --- Events ---
drawBtn.addEventListener("click", drawNumber);
undoBtn.addEventListener("click", undo);
resetBtn.addEventListener("click", () => {
  // reset también borra storage si sync está ON
  resetAll();
  localStorage.removeItem(STORAGE_KEY);
});

autoBtn.addEventListener("click", toggleAuto);

window.addEventListener("keydown", (e) => {
  if (e.key === " "){ e.preventDefault(); drawNumber(); }
  if (e.key.toLowerCase() === "r") resetAll();
  if (e.key.toLowerCase() === "z") undo();
});

// --- Boot ---
(function boot(){
  initPool();

  // Si hay storage, recupera (por si recargas bombo)
  const stored = loadFromStorage();
  if (stored.length){
    drawn = stored.slice();
    // reconstruir pool excluyendo drawn
    const drawnSet = new Set(drawn);
    pool = [];
    for (let n = MIN; n <= MAX; n++){
      if (!drawnSet.has(n)) pool.push(n);
    }
    shuffle(pool);
    setCurrent(drawn[drawn.length - 1]);
  }else{
    setCurrent("—");
  }

  render();
})();
