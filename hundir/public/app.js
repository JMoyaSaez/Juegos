"use strict";

const SIZE = 10;
const SHIP_SIZES = [5, 4, 3, 3, 2];

// UI
const mePill = document.getElementById("mePill");
const roomPill = document.getElementById("roomPill");
const turnPill = document.getElementById("turnPill");
const statusEl = document.getElementById("status");

const btnCreate = document.getElementById("btnCreate");
const btnJoin = document.getElementById("btnJoin");
const roomInput = document.getElementById("roomInput");

const btnRandom = document.getElementById("btnRandom");
const btnReady = document.getElementById("btnReady");

const myBoardEl = document.getElementById("myBoard");
const enemyBoardEl = document.getElementById("enemyBoard");

// State
let ws = null;
let roomId = null;
let playerNum = null;   // 1 or 2
let turnPlayer = null;  // 1 or 2
let gameStarted = false;

let myGrid = emptyGrid();      // includes ships
let myShips = [];              // placement ships
let enemyView = emptyGrid();   // 0 unknown, 2 miss, 3 hit (local view only)
let readySent = false;

function setStatus(t){ statusEl.textContent = t; }

function emptyGrid(){
  return Array.from({length: SIZE}, () => Array(SIZE).fill(0));
}

function connectIfNeeded(){
  if (ws && ws.readyState === WebSocket.OPEN) return;

  // IMPORTANT: put your server url here
  // - local: ws://localhost:8080
  // - deployed: wss://your-domain
  const WS_URL = (location.protocol === "https:" ? "wss://" : "ws://") + location.hostname + ":8080";
  ws = new WebSocket(WS_URL);

  ws.onopen = () => setStatus("Conectado al servidor.");
  ws.onclose = () => setStatus("Desconectado. (Recarga para reconectar)");
  ws.onerror = () => setStatus("Error de conexión WS.");

  ws.onmessage = (ev) => {
    const msg = JSON.parse(ev.data);

    if (msg.type === "hello") {
      setStatus(msg.message);
      return;
    }
    if (msg.type === "error") {
      setStatus("❌ " + msg.message);
      return;
    }

    if (msg.type === "room_created") {
      roomId = msg.roomId;
      playerNum = msg.player;
      updatePills();
      setStatus(`✅ Sala creada: ${roomId}. Pásale el código al otro jugador.`);
      return;
    }

    if (msg.type === "room_joined") {
      roomId = msg.roomId;
      playerNum = msg.player;
      updatePills();
      setStatus(`✅ Unido a sala: ${roomId}.`);
      return;
    }

    if (msg.type === "player_joined") {
      setStatus("✅ Segundo jugador conectado. Colocad barcos y pulsad READY.");
      return;
    }

    if (msg.type === "status") {
      setStatus(msg.message);
      return;
    }

    if (msg.type === "ready_ok") {
      readySent = true;
      setStatus("✅ READY enviado. Esperando al rival...");
      return;
    }

    if (msg.type === "game_start") {
      gameStarted = true;
      turnPlayer = msg.turnPlayer;
      updatePills();
      setStatus(`🎮 Empieza la partida. Turno del Jugador ${turnPlayer}.`);
      renderAll();
      return;
    }

    if (msg.type === "turn") {
      turnPlayer = msg.turnPlayer;
      updatePills();
      setStatus(`👉 Turno del Jugador ${turnPlayer}.`);
      renderAll();
      return;
    }

    if (msg.type === "shot_result") {
      // This is attacker view
      const {x,y,hit,sunk,win} = msg;
      enemyView[y][x] = hit ? 3 : 2;

      if (sunk) setStatus(`💥 TOCADO y HUNDIDO en (${x+1},${y+1})`);
      else setStatus(hit ? `💥 TOCADO en (${x+1},${y+1})` : `🌊 AGUA en (${x+1},${y+1})`);

      if (win) {
        setStatus("🏆 ¡Has ganado!");
      }
      renderAll();
      return;
    }

    if (msg.type === "got_shot") {
      // Defender view (server already updated my grid, but client also updates locally for UI)
      const {x,y,hit,sunk,lose} = msg;
      myGrid[y][x] = hit ? 3 : 2;

      if (sunk) setStatus(`😬 Te han hundido un barco en (${x+1},${y+1})`);
      else setStatus(hit ? `😬 Te han dado en (${x+1},${y+1})` : `😌 El rival falló en (${x+1},${y+1})`);

      if (lose) {
        setStatus("💀 Has perdido.");
      }
      renderAll();
      return;
    }

    if (msg.type === "game_over") {
      setStatus(`🏁 Fin: ganador Jugador ${msg.winner}.`);
      renderAll();
      return;
    }
  };
}

function updatePills(){
  mePill.textContent = `Jugador ${playerNum ?? "—"}`;
  roomPill.textContent = `Sala ${roomId ?? "—"}`;
  turnPill.textContent = `Turno ${turnPlayer ?? "—"}`;
}

btnCreate.addEventListener("click", () => {
  connectIfNeeded();
  ws.send(JSON.stringify({ type: "create_room" }));
});

btnJoin.addEventListener("click", () => {
  connectIfNeeded();
  const rid = roomInput.value.trim().toUpperCase();
  if (!rid) return setStatus("Pon un código de sala.");
  ws.send(JSON.stringify({ type: "join_room", roomId: rid }));
});

btnRandom.addEventListener("click", () => {
  const placement = randomPlacement();
  myShips = placement.ships;
  myGrid = placement.grid;
  readySent = false;
  setStatus("✅ Barcos colocados (aleatorio). Pulsa READY.");
  renderAll();
});

btnReady.addEventListener("click", () => {
  if (!roomId || !playerNum) return setStatus("Crea o únete a una sala primero.");
  if (!myShips.length) return setStatus("Coloca barcos primero (botón aleatorio).");
  connectIfNeeded();

  const placement = { ships: myShips };
  ws.send(JSON.stringify({ type: "place_ready", placement }));
});

function canShoot(){
  return gameStarted && playerNum && turnPlayer === playerNum;
}

function renderAll(){
  renderBoard(myBoardEl, myGrid, { showShips: true, clickable: false });
  renderBoard(enemyBoardEl, enemyView, {
    showShips: false,
    clickable: true,
    onClick: (x,y) => {
      if (!canShoot()) return;
      if (!roomId) return;
      // prevent double shots locally
      if (enemyView[y][x] === 2 || enemyView[y][x] === 3) return;

      ws.send(JSON.stringify({ type: "shot", x, y }));
      // no local optimistic update; wait server
    }
  });

  // Make enemy clickable highlight
  const cells = enemyBoardEl.querySelectorAll(".cell");
  cells.forEach(c => {
    const disabled = !canShoot();
    c.classList.toggle("disabled", disabled);
    c.classList.toggle("clickable", canShoot());
  });
}

function renderBoard(root, grid, { showShips, clickable, onClick }){
  root.innerHTML = "";
  for (let y=0;y<SIZE;y++){
    for (let x=0;x<SIZE;x++){
      const v = grid[y][x];
      const d = document.createElement("div");
      d.className = "cell";

      // v: 0 unk/empty, 1 ship, 2 miss, 3 hit
      if (showShips && v === 1) d.classList.add("ship");
      if (v === 2) d.classList.add("miss");
      if (v === 3) d.classList.add("hit");

      if (clickable && onClick){
        d.addEventListener("click", () => onClick(x,y));
      }
      root.appendChild(d);
    }
  }
}

// Random placement helper
function randomPlacement(){
  const grid = emptyGrid();
  const ships = [];

  for (const size of SHIP_SIZES){
    let placed = false;
    for (let tries=0; tries<500 && !placed; tries++){
      const dir = Math.random() < 0.5 ? "H" : "V";
      const x0 = Math.floor(Math.random()*SIZE);
      const y0 = Math.floor(Math.random()*SIZE);

      const cells = [];
      for (let i=0;i<size;i++){
        const x = dir === "H" ? x0 + i : x0;
        const y = dir === "V" ? y0 + i : y0;
        if (x<0||x>=SIZE||y<0||y>=SIZE) { cells.length=0; break; }
        if (grid[y][x] === 1) { cells.length=0; break; }
        cells.push({x,y});
      }
      if (!cells.length) continue;

      // Place it
      for (const c of cells) grid[c.y][c.x] = 1;
      ships.push({ size, dir, cells });
      placed = true;
    }
    if (!placed) throw new Error("Failed to place ships");
  }

  return { grid, ships };
}

// initial render
renderAll();
setStatus("Crea una partida o únete con un código.");
updatePills();
