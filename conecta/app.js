"use strict";

/**
 * Conecta 4 (7x6)
 * - Transiciones CSS + animación de caída
 * - Dark/Light con persistencia
 * - Tiempo visible (cronómetro de partida) + best time por color
 * - Sonidito (WebAudio) + vibración (si soporta)
 */

const ROWS = 6;
const COLS = 7;

const THEME_KEY = "connect4_theme_v1";
const STATS_KEY = "connect4_stats_v1";
const SETTINGS_KEY = "connect4_settings_v1";

const boardEl = document.getElementById("board");
const themeBtn = document.getElementById("themeBtn");
const newBtn = document.getElementById("newBtn");
const soundBtn = document.getElementById("soundBtn");
const vibeBtn = document.getElementById("vibeBtn");

const turnChip = document.getElementById("turnChip");
const timerEl = document.getElementById("timer");

const scoreREl = document.getElementById("scoreR");
const scoreYEl = document.getElementById("scoreY");
const scoreDEl = document.getElementById("scoreD");

const bestREl = document.getElementById("bestR");
const bestYEl = document.getElementById("bestY");

const overlay = document.getElementById("overlay");
const resultTitle = document.getElementById("resultTitle");
const resultText = document.getElementById("resultText");
const playAgainBtn = document.getElementById("playAgainBtn");
const resetAllBtn = document.getElementById("resetAllBtn");

let cells = []; // DOM cells in row-major [r*COLS+c]
let state = {
  board: [],          // 2D array [r][c] = 0 empty | 1 red | 2 yellow
  current: 1,         // 1 red, 2 yellow
  over: false,
  startedAt: null,
  raf: null,
  animating: false,
  stats: { red: 0, yellow: 0, draws: 0, bestRed: null, bestYellow: null },
  settings: { sound: true, vibe: true }
};

// ---------- Utils ----------
function pad2(n){ return String(n).padStart(2,"0"); }
function formatTime(ms){
  if (ms == null) return "—";
  const t = Math.max(0, ms);
  const m = Math.floor(t / 60000);
  const s = Math.floor((t % 60000) / 1000);
  const d = Math.floor((t % 1000) / 100);
  return `${pad2(m)}:${pad2(s)}.${d}`;
}
function now(){ return performance.now(); }

function setTheme(theme){
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem(THEME_KEY, theme);
}
function loadTheme(){
  const saved = localStorage.getItem(THEME_KEY);
  setTheme(saved === "light" ? "light" : "dark");
}

function loadSettings(){
  try{
    const s = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "null");
    if (s && typeof s.sound === "boolean" && typeof s.vibe === "boolean") {
      state.settings = s;
    }
  }catch(_){}
  renderSettingsBtns();
}
function saveSettings(){
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(state.settings));
}
function renderSettingsBtns(){
  soundBtn.textContent = state.settings.sound ? "🔊" : "🔇";
  vibeBtn.textContent = state.settings.vibe ? "📳" : "🚫";
}

function loadStats(){
  try{
    const st = JSON.parse(localStorage.getItem(STATS_KEY) || "null");
    if (st && typeof st.red==="number" && typeof st.yellow==="number" && typeof st.draws==="number"){
      state.stats = {
        red: st.red,
        yellow: st.yellow,
        draws: st.draws,
        bestRed: (st.bestRed == null || typeof st.bestRed==="number") ? st.bestRed : null,
        bestYellow: (st.bestYellow == null || typeof st.bestYellow==="number") ? st.bestYellow : null
      };
    }
  }catch(_){}
  scoreREl.textContent = String(state.stats.red);
  scoreYEl.textContent = String(state.stats.yellow);
  scoreDEl.textContent = String(state.stats.draws);
  bestREl.textContent = formatTime(state.stats.bestRed);
  bestYEl.textContent = formatTime(state.stats.bestYellow);
}
function saveStats(){
  localStorage.setItem(STATS_KEY, JSON.stringify(state.stats));
}

// ---------- Sound (WebAudio) ----------
let audioCtx = null;
function beep(freq=520, dur=0.07, type="sine", gain=0.04){
  if (!state.settings.sound) return;
  try{
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const t0 = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    g.gain.value = gain;
    osc.connect(g);
    g.connect(audioCtx.destination);
    osc.start(t0);
    osc.stop(t0 + dur);
  }catch(_){}
}
function sfxDrop(){ beep(420, 0.06, "triangle", 0.035); }
function sfxWin(){ beep(740, 0.07, "sine", 0.04); setTimeout(()=>beep(980,0.09,"sine",0.04), 85); }
function sfxDraw(){ beep(240, 0.08, "square", 0.02); }

// ---------- Vibration ----------
function vibe(pattern){
  if (!state.settings.vibe) return;
  if (navigator.vibrate) navigator.vibrate(pattern);
}
function vibeDrop(){ vibe(20); }
function vibeWin(){ vibe([40,30,40]); }
function vibeDraw(){ vibe([20,20,20]); }

// ---------- Timer ----------
function startTimer(){
  stopTimer();
  state.startedAt = now();
  const tick = () => {
    if (!state.startedAt) return;
    timerEl.textContent = formatTime(now() - state.startedAt);
    state.raf = requestAnimationFrame(tick);
  };
  state.raf = requestAnimationFrame(tick);
}
function stopTimer(){
  if (state.raf) cancelAnimationFrame(state.raf);
  state.raf = null;
}
function resetTimerDisplay(){
  timerEl.textContent = "00:00.0";
}

// ---------- UI build/render ----------
function idx(r,c){ return r*COLS + c; }

function buildBoard(){
  boardEl.innerHTML = "";
  cells = [];
  for (let r=0; r<ROWS; r++){
    for (let c=0; c<COLS; c++){
      const b = document.createElement("button");
      b.className = "cell";
      b.type = "button";
      b.dataset.r = String(r);
      b.dataset.c = String(c);
      b.setAttribute("role","gridcell");
      b.setAttribute("aria-label", `Fila ${r+1}, Columna ${c+1}`);
      boardEl.appendChild(b);
      cells.push(b);
    }
  }
}

function renderTurn(){
  if (state.current === 1){
    turnChip.innerHTML = `Turno: <strong><span class="dot red"></span> Rojo</strong>`;
  } else {
    turnChip.innerHTML = `Turno: <strong><span class="dot yellow"></span> Amarillo</strong>`;
  }
}

function clearHighlights(){
  cells.forEach(el => el.classList.remove("win","col-hover"));
}

function showOverlay(title, text){
  resultTitle.textContent = title;
  resultText.textContent = text;
  overlay.classList.add("show");
  overlay.setAttribute("aria-hidden","false");
}
function hideOverlay(){
  overlay.classList.remove("show");
  overlay.setAttribute("aria-hidden","true");
}

// ---------- Game logic ----------
function emptyBoard(){
  state.board = Array.from({length: ROWS}, () => Array(COLS).fill(0));
}

function lastEmptyRow(col){
  for (let r=ROWS-1; r>=0; r--){
    if (state.board[r][col] === 0) return r;
  }
  return -1;
}

function isDraw(){
  // si la fila 0 está llena en todas las columnas, no hay más jugadas
  for (let c=0; c<COLS; c++){
    if (state.board[0][c] === 0) return false;
  }
  return true;
}

function collectLine(r, c, dr, dc, player){
  // devuelve coords contiguas del mismo jugador en ambos sentidos
  const coords = [[r,c]];
  let rr=r+dr, cc=c+dc;
  while (rr>=0 && rr<ROWS && cc>=0 && cc<COLS && state.board[rr][cc]===player){
    coords.push([rr,cc]);
    rr+=dr; cc+=dc;
  }
  rr=r-dr; cc=c-dc;
  while (rr>=0 && rr<ROWS && cc>=0 && cc<COLS && state.board[rr][cc]===player){
    coords.unshift([rr,cc]);
    rr-=dr; cc-=dc;
  }
  return coords;
}

function findWinFrom(r, c, player){
  const dirs = [
    [0,1],  // horizontal
    [1,0],  // vertical
    [1,1],  // diag down-right
    [1,-1]  // diag down-left
  ];
  for (const [dr,dc] of dirs){
    const line = collectLine(r,c,dr,dc,player);
    if (line.length >= 4){
      // recorta un bloque de 4 que incluya (r,c) si quieres; aquí marcamos TODA la línea
      return line;
    }
  }
  return null;
}

function updateBestIfNeeded(player, elapsedMs){
  if (player === 1){
    const cur = state.stats.bestRed;
    if (cur == null || elapsedMs < cur){
      state.stats.bestRed = elapsedMs;
      bestREl.textContent = formatTime(elapsedMs);
    }
  } else {
    const cur = state.stats.bestYellow;
    if (cur == null || elapsedMs < cur){
      state.stats.bestYellow = elapsedMs;
      bestYEl.textContent = formatTime(elapsedMs);
    }
  }
  saveStats();
}

function paintDiscAt(r,c,player){
  const cell = cells[idx(r,c)];
  cell.classList.add("filled");
  cell.disabled = false; // seguirá clicable para columna, pero ignoramos por lógica
  cell.innerHTML = "";

  const disc = document.createElement("span");
  disc.className = "disc " + (player===1 ? "red" : "yellow");
  cell.appendChild(disc);
}

function disableBoard(disabled=true){
  cells.forEach(el => el.disabled = disabled);
}

function endGameWin(player, winCoords){
  state.over = true;
  stopTimer();

  // highlight
  winCoords.forEach(([r,c]) => cells[idx(r,c)].classList.add("win"));

  const elapsed = state.startedAt ? (now() - state.startedAt) : 0;
  if (player === 1){
    state.stats.red += 1;
    scoreREl.textContent = String(state.stats.red);
  } else {
    state.stats.yellow += 1;
    scoreYEl.textContent = String(state.stats.yellow);
  }
  saveStats();
  updateBestIfNeeded(player, elapsed);

  sfxWin(); vibeWin();
  showOverlay(
    player === 1 ? "Gana Rojo" : "Gana Amarillo",
    `Tiempo: ${formatTime(elapsed)} · Marcador actualizado`
  );
}

function endGameDraw(){
  state.over = true;
  stopTimer();
  const elapsed = state.startedAt ? (now() - state.startedAt) : 0;
  state.stats.draws += 1;
  scoreDEl.textContent = String(state.stats.draws);
  saveStats();

  sfxDraw(); vibeDraw();
  showOverlay("Empate", `Tiempo: ${formatTime(elapsed)} · ¡Otra!`);
}

// ---------- Drop animation ----------
function dropAnimation(col, targetRow, player){
  return new Promise((resolve) => {
    const firstCell = cells[idx(0,col)];
    const targetCell = cells[idx(targetRow,col)];

    const boardRect = boardEl.getBoundingClientRect();
    const fromRect = firstCell.getBoundingClientRect();
    const toRect = targetCell.getBoundingClientRect();

    // disc size based on cell inner size
    const discSize = Math.min(toRect.width, toRect.height) * 0.80;

    const wrapper = document.createElement("div");
    wrapper.className = "falling";
    wrapper.style.setProperty("--discSize", `${discSize}px`);
    wrapper.style.left = `${fromRect.left - boardRect.left + (fromRect.width - discSize)/2}px`;
    wrapper.style.top = `${fromRect.top - boardRect.top + (fromRect.height - discSize)/2}px`;

    const disc = document.createElement("div");
    disc.className = "disc " + (player===1 ? "red" : "yellow") + " bounce";
    disc.style.width = `${discSize}px`;
    disc.style.height = `${discSize}px`;
    wrapper.appendChild(disc);

    boardEl.appendChild(wrapper);

    // Force reflow to apply initial position
    wrapper.getBoundingClientRect();

    const deltaY = (toRect.top - fromRect.top) + (toRect.height - fromRect.height)/2;

    // Animate
    requestAnimationFrame(() => {
      disc.style.transform = `translateY(${deltaY}px)`;
    });

    // Cleanup on transition end
    const done = () => {
      disc.removeEventListener("transitionend", done);
      wrapper.remove();
      resolve();
    };
    disc.addEventListener("transitionend", done, { once: true });
  });
}

// ---------- Input helpers ----------
function setColHover(col){
  clearHighlights();
  for (let r=0; r<ROWS; r++){
    cells[idx(r,col)].classList.add("col-hover");
  }
}
function clearColHover(){
  cells.forEach(el => el.classList.remove("col-hover"));
}

async function playColumn(col){
  if (state.over || state.animating) return;

  const r = lastEmptyRow(col);
  if (r < 0) {
    // columna llena
    beep(180, 0.06, "square", 0.015);
    vibe([10,10,10]);
    return;
  }

  if (!state.startedAt) startTimer();

  state.animating = true;
  disableBoard(true);
  clearColHover();
  // sfx/vibe de “soltar”
  sfxDrop(); vibeDrop();

  await dropAnimation(col, r, state.current);

  // commit
  state.board[r][col] = state.current;
  paintDiscAt(r,col,state.current);

  // check win/draw
  const winCoords = findWinFrom(r,col,state.current);
  if (winCoords){
    state.animating = false;
    disableBoard(false);
    endGameWin(state.current, winCoords);
    return;
  }
  if (isDraw()){
    state.animating = false;
    disableBoard(false);
    endGameDraw();
    return;
  }

  // next
  state.current = (state.current === 1) ? 2 : 1;
  renderTurn();

  state.animating = false;
  disableBoard(false);
}

// ---------- Reset ----------
function newGame(){
  hideOverlay();
  stopTimer();
  resetTimerDisplay();
  state.over = false;
  state.animating = false;
  state.startedAt = null;
  state.current = 1;
  emptyBoard();
  clearHighlights();
  cells.forEach(el => { el.innerHTML = ""; el.classList.remove("filled","win"); el.disabled = false; });
  renderTurn();
}

function resetAll(){
  state.stats = { red: 0, yellow: 0, draws: 0, bestRed: null, bestYellow: null };
  saveStats();
  loadStats();
  newGame();
}

// ---------- Events ----------
function bindEvents(){
  // click (usa data-c de la celda)
  boardEl.addEventListener("click", (e) => {
    const cell = e.target.closest(".cell");
    if (!cell) return;
    const col = Number(cell.dataset.c);
    playColumn(col);
  });

  // hover mouse: previsualiza columna
  boardEl.addEventListener("mousemove", (e) => {
    const cell = e.target.closest(".cell");
    if (!cell || state.over || state.animating) return;
    setColHover(Number(cell.dataset.c));
  });
  boardEl.addEventListener("mouseleave", () => {
    if (!state.over && !state.animating) clearColHover();
  });

  // touch: previsualiza mientras arrastra
  boardEl.addEventListener("touchstart", (e) => {
    const touch = e.touches[0];
    if (!touch) return;
    const el = document.elementFromPoint(touch.clientX, touch.clientY);
    const cell = el && el.closest ? el.closest(".cell") : null;
    if (cell && !state.over && !state.animating) setColHover(Number(cell.dataset.c));
  }, { passive: true });

  boardEl.addEventListener("touchmove", (e) => {
    const touch = e.touches[0];
    if (!touch) return;
    const el = document.elementFromPoint(touch.clientX, touch.clientY);
    const cell = el && el.closest ? el.closest(".cell") : null;
    if (cell && !state.over && !state.animating) setColHover(Number(cell.dataset.c));
  }, { passive: true });

  boardEl.addEventListener("touchend", () => {
    if (!state.over && !state.animating) clearColHover();
  }, { passive: true });

  // buttons
  newBtn.addEventListener("click", newGame);
  playAgainBtn.addEventListener("click", newGame);
  resetAllBtn.addEventListener("click", resetAll);

  themeBtn.addEventListener("click", () => {
    const cur = document.documentElement.getAttribute("data-theme") || "dark";
    setTheme(cur === "dark" ? "light" : "dark");
  });

  soundBtn.addEventListener("click", () => {
    state.settings.sound = !state.settings.sound;
    saveSettings();
    renderSettingsBtns();
    // feedback
    beep(state.settings.sound ? 620 : 160, 0.06, "sine", 0.03);
  });

  vibeBtn.addEventListener("click", () => {
    state.settings.vibe = !state.settings.vibe;
    saveSettings();
    renderSettingsBtns();
    if (state.settings.vibe) vibe([20,20,20]);
  });

  // Teclado: 1..7 suelta en columna
  window.addEventListener("keydown", (e) => {
    if (state.over || state.animating) return;
    const k = e.key;
    if (k >= "1" && k <= "7") playColumn(Number(k) - 1);
    if (k === "Escape") hideOverlay();
  });
}

// ---------- Init ----------
loadTheme();
loadSettings();
loadStats();
buildBoard();
bindEvents();
newGame();

