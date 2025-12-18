(() => {

const $ = id => document.getElementById(id);
const statusEl = $("status");
const roleEl   = $("role");
const qrEl     = $("qr");
const logEl    = $("log");
const video    = $("video");

let scanner;
let sendMsg = () => {};

const log = t => logEl.innerHTML = t + "<br>" + logEl.innerHTML;
const setStatus = (ok, t) => {
  statusEl.textContent = t;
  statusEl.className = ok ? "ok" : "bad";
};

function showQR(text) {
  qrEl.innerHTML = "";
  new QRCode(qrEl, {
    text,
    width: 300,
    height: 300,
    correctLevel: QRCode.CorrectLevel.M
  });
}

async function scan(onText) {
  if (!scanner)
    scanner = new QrScanner(video, r => onText(r.data));
  await scanner.start();
}

const pcConfig = { iceServers: [] }; // LAN only

const enc = new TextEncoder();
const dec = new TextDecoder();

const pack = (p, o) =>
  p + "|" + btoa(String.fromCharCode(...enc.encode(JSON.stringify(o))))
        .replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");

const unpack = (t,p) => {
  const [pr,b] = t.split("|");
  if (pr !== p) throw "Prefijo incorrecto";
  const s = b.replace(/-/g,"+").replace(/_/g,"/") + "===".slice((b.length+3)%4);
  return JSON.parse(dec.decode(Uint8Array.from(atob(s), c=>c.charCodeAt(0))));
};

const waitIce = pc => new Promise(r => {
  if (pc.iceGatheringState === "complete") return r();
  pc.onicegatheringstatechange = () =>
    pc.iceGatheringState === "complete" && r();
  setTimeout(r, 1000);
});

function setupDC(dc) {
  dc.onopen = () => { setStatus(true,"Conectado"); log("🔗 Canal abierto"); };
  dc.onmessage = e => log("⬅ " + e.data);
  sendMsg = m => dc.send(m);
}

async function createHost() {
  roleEl.textContent = "Rol: HOST";
  setStatus(false,"Creando oferta");

  const pc = new RTCPeerConnection(pcConfig);
  setupDC(pc.createDataChannel("game"));

  await pc.setLocalDescription(await pc.createOffer());
  await waitIce(pc);
  showQR(pack("BATTLESHIP_OFFER", pc.localDescription));

  await scan(async txt => {
    if (!txt.startsWith("BATTLESHIP_ANSWER")) return;
    await pc.setRemoteDescription(unpack(txt,"BATTLESHIP_ANSWER"));
    log("✅ Answer recibido");
  });
}

async function createClient() {
  roleEl.textContent = "Rol: CLIENTE";
  setStatus(false,"Escanea oferta");

  const pc = new RTCPeerConnection(pcConfig);
  pc.ondatachannel = e => setupDC(e.channel);

  await scan(async txt => {
    if (!txt.startsWith("BATTLESHIP_OFFER")) return;
    await pc.setRemoteDescription(unpack(txt,"BATTLESHIP_OFFER"));
    await pc.setLocalDescription(await pc.createAnswer());
    await waitIce(pc);
    showQR(pack("BATTLESHIP_ANSWER", pc.localDescription));
    log("📤 Answer generado");
  });
}

$("btnHost").onclick = createHost;
$("btnJoin").onclick = createClient;
$("btnCam").onclick  = () => scan(()=>{});

})();
