const $ = id => document.getElementById(id);
const statusEl = $("status");
const roleEl = $("role");
const qrEl = $("qr");

const setStatus = (ok, t) => {
  statusEl.textContent = t;
  statusEl.className = ok ? "ok" : "bad";
};

// --- Dark / Light ---
const KEY="theme";
$("themeBtn").onclick=()=>{
  const t=document.documentElement.dataset.theme==="dark"?"light":"dark";
  document.documentElement.dataset.theme=t;
  localStorage.setItem(KEY,t);
};
document.documentElement.dataset.theme=localStorage.getItem(KEY)||"dark";

// --- QR ---
function showQR(text){
  qrEl.innerHTML="";
  new QRCode(qrEl,{
    text,
    width:360,
    height:360,
    correctLevel:QRCode.CorrectLevel.L
  });
}

// --- WebRTC (LAN simple) ---
const pc = new RTCPeerConnection({iceServers:[]});
pc.ondatachannel = e => {
  e.channel.onopen = () => {
    setStatus(true,"Conectado");
    setTimeout(()=>location.href="game.html",500);
  };
};

function compress(o){
  return btoa(String.fromCharCode(...pako.deflate(JSON.stringify(o))));
}
function decompress(s){
  return JSON.parse(pako.inflate(
    Uint8Array.from(atob(s),c=>c.charCodeAt(0)),{to:"string"}
  ));
}

// --- Host ---
$("btnHost").onclick = async ()=>{
  roleEl.textContent="Rol: HOST";
  setStatus(false,"Generando QR…");

  const dc = pc.createDataChannel("game");
  dc.onopen = ()=>setStatus(true,"Conectado");

  await pc.setLocalDescription(await pc.createOffer());
  await new Promise(r=>pc.onicecandidate=e=>!e.candidate&&r());

  showQR("OFFER|"+compress(pc.localDescription));
};

// --- Cliente ---
$("btnJoin").onclick = ()=>{
  roleEl.textContent="Rol: CLIENTE";
  setStatus(false,"Escanea el QR del host");
};

const scanner = new Html5Qrcode("reader");

$("btnCam").onclick = async ()=>{
  await scanner.start(
    { facingMode: "environment" },
    { fps: 10, qrbox: 250 },
    async text => {
      if(!text.startsWith("OFFER|")) return;

      await scanner.stop();
      setStatus(false,"Procesando…");

      const offer = decompress(text.slice(6));
      await pc.setRemoteDescription(offer);
      await pc.setLocalDescription(await pc.createAnswer());
      await new Promise(r=>pc.onicecandidate=e=>!e.candidate&&r());

      showQR("ANSWER|"+compress(pc.localDescription));
      setStatus(false,"Enseña este QR al host");
    }
  );
};
