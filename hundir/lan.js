(() => {
const $ = id => document.getElementById(id);
const statusEl = $("status");
const roleEl   = $("role");
const qrEl     = $("qr");
const logEl    = $("log");
const video    = $("video");

let scanner;
let sendMsg = () => {};

const log = t => (logEl.innerHTML = t + "<br>" + logEl.innerHTML);
const setStatus = (ok, t) => {
  statusEl.textContent = t;
  statusEl.className = ok ? "ok" : "bad";
};

// ✅ QR más fácil de leer: tamaño grande + corrección baja (L)
function showQR(text) {
  qrEl.innerHTML = "";
  new QRCode(qrEl, {
    text,
    width: 380,
    height: 380,
    correctLevel: QRCode.CorrectLevel.L
  });
}

async function scan(onText) {
  if (!scanner) scanner = new QrScanner(video, r => onText(r.data), { highlightScanRegion: true });
  await scanner.start();
}

const pcConfig = { iceServers: [] }; // LAN only

// --- ✅ pack/unpack con compresión (pako deflate) + base64url ---
function u8ToB64url(u8) {
  let s = "";
  for (let i = 0; i < u8.length; i++) s += String.fromCharCode(u8[i]);
  return btoa(s).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");
}
function b64urlToU8(b64url) {
  const b64 = b64url.replace(/-/g,"+").replace(/_/g,"/") + "===".slice((b64url.length+3)%4);
  const bin = atob(b64);
  const u8 = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
  return u8;
}

function pack(prefix, obj) {
  const json = JSON.stringify(obj);
  const def = pako.deflate(json);              // ✅ comprime
  const b64u = u8ToB64url(def);
  return `${prefix}|${b64u}`;
}
function unpack(text, expectedPrefix) {
  const [pr, b64u] = text.split("|");
  if (pr !== expectedPrefix) throw new Error("Prefijo incorrecto: " + pr);
  const u8 = b64urlToU8(b64u);
  const json = pako.inflate(u8, { to: "string" }); // ✅ descomprime
  return JSON.parse(json);
}

const waitIce = pc => new Promise(r => {
  if (pc.iceGatheringState === "complete") return r();
  pc.onicegatheringstatechange = () => pc.iceGatheringState === "complete" && r();
  // en LAN a veces “complete” tarda; pero no bloqueamos infinito
  setTimeout(r, 1200);
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

  // ✅ Offer comprimida = QR legible
  showQR(pack("BATTLESHIP_OFFER", pc.localDescription));
  setStatus(false,"Escanea este QR con el cliente");

  await scan(async txt => {
    if (!txt.startsWith("BATTLESHIP_ANSWER|")) return;
    await pc.setRemoteDescription(unpack(txt,"BATTLESHIP_ANSWER"));
    log("✅ Answer recibida");
  });
}

async function createClient() {
  roleEl.textContent = "Rol: CLIENTE";
  setStatus(false,"Escanea la oferta del host");

  const pc = new RTCPeerConnection(pcConfig);
  pc.ondatachannel = e => setupDC(e.channel);

  await scan(async txt => {
    if (!txt.startsWith("BATTLESHIP_OFFER|")) return;

    await pc.setRemoteDescription(unpack(txt,"BATTLESHIP_OFFER"));
    await pc.setLocalDescription(await pc.createAnswer());
    await waitIce(pc);

    // ✅ Answer comprimida = QR legible
    showQR(pack("BATTLESHIP_ANSWER", pc.localDescription));
    setStatus(false,"Enseña este QR al host");
    log("📤 Answer generada");
  });
}

$("btnHost").onclick = createHost;
$("btnJoin").onclick = createClient;
$("btnCam").onclick  = () => scan(()=>{});

})();
