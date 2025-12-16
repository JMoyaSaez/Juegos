"use strict";

/* ===== CONFIG ===== */
const ROWS = 3, COLS = 9, TOTAL = 15;

const CARTON_KEY = "bingo_carton";
const MARKED_KEY = "bingo_carton_marked";
const CARTON_MS = "carton_created_at_ms";
const CARTON_HMS = "carton_created_at_hms";

const BINGO_MS = "bingo_started_at_ms";
const BINGO_HMS = "bingo_started_at_hms";

/* ===== DOM ===== */
const board = document.getElementById("board");
const statusEl = document.getElementById("status");
const createdAtLabel = document.getElementById("createdAtLabel");
const newBtn = document.getElementById("newBtn");
const clearBtn = document.getElementById("clearBtn");

/* ===== STATE ===== */
let carton = [];
let marked = new Set();

/* ===== HELPERS ===== */
const hms = ms=>{
  const d=new Date(ms);
  return `${d.getHours().toString().padStart(2,"0")}:${d.getMinutes().toString().padStart(2,"0")}:${d.getSeconds().toString().padStart(2,"0")}`;
};

const beep=(f=500,d=70)=>{
  try{
    const a=new AudioContext(),o=a.createOscillator(),g=a.createGain();
    o.frequency.value=f; o.connect(g); g.connect(a.destination);
    o.start(); g.gain.exponentialRampToValueAtTime(0.0001,a.currentTime+d/1000);
    setTimeout(()=>a.close(),d+50);
  }catch{}
};

const vibrate=ms=>navigator.vibrate&&navigator.vibrate(ms);

/* ===== VALIDATION ===== */
const cartonValid=()=>{
  const c=+localStorage.getItem(CARTON_MS)||0;
  const b=+localStorage.getItem(BINGO_MS)||0;
  return c>0 && b>0 && c<b;
};

/* ===== GENERATION ===== */
function genCarton(){
  carton=Array.from({length:ROWS},()=>Array(COLS).fill(null));
  const used=new Set();

  for(let c=0;c<COLS;c++){
    const rows=[0,1,2].sort(()=>Math.random()-0.5).slice(0,Math.floor(Math.random()*2)+1);
    const min=c===0?1:c*10;
    const max=c===8?90:c*10+9;
    const nums=[];
    for(let n=min;n<=max;n++) if(!used.has(n)) nums.push(n);
    nums.sort(()=>Math.random()-0.5);
    const sel=nums.slice(0,rows.length).sort((a,b)=>a-b);
    rows.sort((a,b)=>a-b).forEach((r,i)=>{
      carton[r][c]=sel[i]; used.add(sel[i]);
    });
  }

  let count=carton.flat().filter(Boolean).length;
  if(count!==TOTAL) return genCarton();

  marked.clear();
  const now=Date.now();
  localStorage.setItem(CARTON_MS,now);
  localStorage.setItem(CARTON_HMS,hms(now));
  save();
}

/* ===== STORAGE ===== */
const save=()=>{
  localStorage.setItem(CARTON_KEY,JSON.stringify(carton));
  localStorage.setItem(MARKED_KEY,JSON.stringify([...marked]));
};

const load=()=>{
  const c=localStorage.getItem(CARTON_KEY);
  if(!c) return false;
  carton=JSON.parse(c);
  marked=new Set(JSON.parse(localStorage.getItem(MARKED_KEY)||"[]"));
  return true;
};

/* ===== UI ===== */
function updateHeat(){
  const p=Math.min(1,marked.size/TOTAL);
  board.style.setProperty("--hit-hue",220-p*220);
}

function render(){
  board.innerHTML="";
  carton.forEach(r=>r.forEach(v=>{
    const d=document.createElement("div");
    d.className="cell";
    if(v==null){
      d.classList.add("empty");
    }else{
      d.textContent=v;
      d.classList.add("clickable");
      if(marked.has(v)) d.classList.add("marked");
      d.onclick=()=>{
        if(marked.has(v)) marked.delete(v);
        else{
          marked.add(v); beep(520+marked.size*20);
          if(marked.size>=12) vibrate(20);
        }
        save(); updateHeat(); render();
      };
    }
    board.appendChild(d);
  }));
  updateStatus();
}

function updateStatus(){
  const valid=cartonValid();
  const hits=marked.size;
  createdAtLabel.textContent=
    `Cartón: ${localStorage.getItem(CARTON_HMS)||"--"} · Bombo: ${localStorage.getItem(BINGO_HMS)||"--"}`;

  if(!valid){
    statusEl.textContent="❌ Cartón NO válido";
    statusEl.className="statusText invalid";
    return;
  }
  if(hits===TOTAL){
    statusEl.textContent="🎉 BINGO";
    statusEl.className="statusText bingo";
    beep(900,200); vibrate(60);
    return;
  }
  if(carton.some(r=>r.filter(Boolean).every(n=>marked.has(n)))){
    statusEl.textContent="✔ LÍNEA";
    statusEl.className="statusText line";
    return;
  }
  statusEl.textContent=`— ${hits}/15`;
  statusEl.className="statusText";
}

/* ===== EVENTS ===== */
newBtn.onclick=()=>{ genCarton(); save(); render(); };
clearBtn.onclick=()=>{ marked.clear(); save(); render(); };

/* ===== INIT ===== */
if(!load()) genCarton();
render();
