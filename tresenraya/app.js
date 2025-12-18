"use strict";

/* 3 en raya con:
   - Transiciones CSS (entrada de X/O, overlay, winner)
   - Dark/Light con persistencia
   - Tiempo visible (cronómetro de partida) + best time por jugador
*/

const THEME_KEY = "tictactoe_theme_v1";
const SCORE_KEY = "tictactoe_score_v1";
const BEST_KEY  = "tictactoe_best_v1";

const boardEl = document.getElementById("board");
const cells = Array.from(document.querySelectorAll(".cell"));

const themeBtn = document.getElementById("themeBtn");
const newBtn = document.getElementById("newBtn");

const turnChip = document.getElementById("turnChip");
const timerEl = document.getElementById("timer");
const scoreXEl = document.getElementById("scoreX");
const scoreOEl = document.getElementById("scoreO");
const bestXEl = document.getElementById("bestX");
const bestOEl = document.getElementById("bestO");

const overlay = document.getElementById("overlay");
const resultTitle = document.getElementById("resultTitle");
const resultText = document.getElementById("resultText");
const playAgainBtn = document.getElementById("playAgainBtn");
const resetAllBtn = document.getElementById("resetAllBtn");

const WINS = [
  [0,1,2],[3,4,5],[6,7,8],
  [0,3,6],[1,4,7],[2,5,8],
  [0,4,8],[2,4,6]
];

let state = {
  board: Array(9).fill(null),  // "X" | "O" | null
  turn: "X",
  over: false,
  startedAt: null,
  raf: null,
  score: { X: 0, O: 0 },
  best:  { X: null, O: null } // ms
};

// ---------- Util ----------
function pad2(n){ return String(n).padStart(2,"0"); }

function formatTime(ms){
  if (ms == null) return "—";
  const total = Math.max(0, ms);
  const m = Math.floor(total / 60000);
  const s = Math.floor((total % 60000) / 1000);
  const d = Math.floor((total % 1000) / 100); // décimas
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

function loadStats(){
  try{
    const score = JSON.parse(localStorage.getItem(SCORE_KEY) || "null");
    if (score && typeof score.X === "number" && typeof score.O === "number"){
      state.score = score;
    }
  }catch(_){}

  try{
    const best = JSON.parse(localStorage.getItem(BEST_KEY) || "null");
    if (best && (best.X == null || typeof best.X === "number") && (best.O == null || typeof best.O === "number")){
      state.best = best;
    }
  }catch(_){}

  scoreXEl.textContent = String(state.score.X);
  scoreOEl.textContent = String(state.score.O);
  bestXEl.textContent = formatTime(state.best.X);
  bestOEl.textContent = formatTime(state.best.O);
}

function saveStats(){
  localStorage.setItem(SCORE_KEY, JSON.stringify(state.score));
  localStorage.setItem(BEST_KEY, JSON.stringify(state.best));
}

// ---------- Timer ----------
function startTimer(){
  stopTimer();
  state.startedAt = now();
  const tick = () => {
    if (!state.startedAt) return;
    const elapsed = now() - state.startedAt;
    timerEl.textContent = formatTime(elapsed);
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

// ---------- Render ----------
function renderTurn(){
  turnChip.innerHTML = `Turno: <strong>${state.turn}</strong>`;
}

function clearBoardUI(){
  cells.forEach(c => {
    c.classList.remove("filled","win");
    c.innerHTML = "";
    c.disabled = false;
  });
}

function placeMark(i, mark){
  const cell = cells[i];
  cell.classList.add("filled");
  cell.disabled = true;

  const span = document.createElement("span");
  span.className = `mark ${mark.toLowerCase()}`;
  span.textContent = mark;
  cell.appendChild(span);
}

function showOverlay(title, text){
  resultTitle.textContent = title;
  resultText.textContent = text;
  overlay.classList.add("show");
  overlay.setAttribute("aria-hidden", "false");
}

function hideOverlay(){
  overlay.classList.remove("show");
  overlay.setAttribute("aria-hidden", "true");
}

// ---------- Game logic ----------
function findWinner(){
  for (const line of WINS){
    const [a,b,c] = line;
    const v = state.board[a];
    if (v && v === state.board[b] && v === state.board[c]){
      return { winner: v, line };
    }
  }
  return null;
}

function isDraw(){
  return state.board.every(Boolean);
}

function endGame(messageTitle, messageText, winLine){
  state.over = true;
  stopTimer();

  if (winLine){
    winLine.forEach(i => cells[i].classList.add("win"));
    cells.forEach(c => c.disabled = true);
  } else {
    // Empate: bloquear
    cells.forEach(c => c.disabled = true);
  }

  showOverlay(messageTitle, messageText);
}

function updateBestIfNeeded(player, elapsedMs){
  const cur = state.best[player];
  if (cur == null || elapsedMs < cur){
    state.best[player] = elapsedMs;
    bestXEl.textContent = formatTime(state.best.X);
    bestOEl.textContent = formatTime(state.best.O);
    saveStats();
  }
}

function onMove(i){
  if (state.over) return;
  if (state.board[i]) return;

  // Arranca cronómetro en la primera jugada
  if (!state.startedAt) startTimer();

  const mark = state.turn;
  state.board[i] = mark;
  placeMark(i, mark);

  const win = findWinner();
  if (win){
    // tiempo final
    const elapsed = state.startedAt ? (now() - state.startedAt) : 0;

    state.score[mark] += 1;
    scoreXEl.textContent = String(state.score.X);
    scoreOEl.textContent = String(state.score.O);

    saveStats();
    updateBestIfNeeded(mark, elapsed);

    endGame(
      `Gana ${mark}`,
      `Tiempo: ${formatTime(elapsed)} · Marcador actualizado`,
      win.line
    );
    return;
  }

  if (isDraw()){
    const elapsed = state.startedAt ? (now() - state.startedAt) : 0;
    endGame("Empate", `Tiempo: ${formatTime(elapsed)} · ¡Otra!`, null);
    return;
  }

  // Siguiente turno
  state.turn = (state.turn === "X") ? "O" : "X";
  renderTurn();
}

// ---------- Reset ----------
function newGame(){
  hideOverlay();
  stopTimer();
  state.board = Array(9).fill(null);
  state.turn = "X";
  state.over = false;
  state.startedAt = null;

  clearBoardUI();
  renderTurn();
  resetTimerDisplay();
}

function resetAll(){
  state.score = { X: 0, O: 0 };
  state.best  = { X: null, O: null };
  saveStats();
  loadStats();
  newGame();
}

// ---------- Events ----------
cells.forEach(cell => {
  cell.addEventListener("click", () => {
    const i = Number(cell.dataset.i);
    onMove(i);
  });
});

newBtn.addEventListener("click", newGame);
playAgainBtn.addEventListener("click", newGame);
resetAllBtn.addEventListener("click", resetAll);

themeBtn.addEventListener("click", () => {
  const cur = document.documentElement.getAttribute("data-theme") || "dark";
  setTheme(cur === "dark" ? "light" : "dark");
});

// Teclado: 1..9 (numpad) para jugar rápido
window.addEventListener("keydown", (e) => {
  if (state.over) return;
  const key = e.key;
  const map = { "1":6, "2":7, "3":8, "4":3, "5":4, "6":5, "7":0, "8":1, "9":2 };
  if (map[key] != null) onMove(map[key]);
});

// ---------- Init ----------
loadTheme();
loadStats();
newGame();
