(() => {
const $ = id => document.getElementById(id);
const statusEl = $("status");
const roleEl   = $("role");
const qrEl     = $("qr");
const logEl    = $("log");
const video    = $("video");

let scanner;
let sendMsg = () => {};

const log = (t) => (logEl.innerHTML = t + "<br>" + logEl.innerHTML);
const setStatus = (ok, t) => {
  statusEl.textContent = t;
  statusEl.className = ok ? "ok" : "bad";
};

// QR más fácil de leer
function showQR(text) {
  qrEl.innerHTML = "";
  new QRCode(qrEl, {
    text,
    width: 380,
    height: 380,
    correctLevel: QRCode.CorrectLevel.L
  });
}

// Scanner
async function startScan(onText) {
  if (!scanner) {
    scanner = new QrScanner(
      video,
      (r) => onText(r.data),
      { highlightScanRegion: true, returnDetailedScanResult: false }
    );
  }
  await scanner.start();
}
async function stopScan() {
  if (scanner) await scanner.stop();
}

// WebRTC config LAN
const pcConfig = {
  iceServers: [],         // LAN only
  bundlePolicy: "max-bundle"
};

// --- pack/unpack con compresión (pako deflate) + base64url ---
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
  const def = pako.deflate(json);
  return `${prefix}|${u8ToB64url(def)}`;
}
function unpack(text, expectedPrefix) {
  const [pr, b64u] = text.split("|");
  if (pr !== expectedPrefix) throw new Error("Prefijo incorrecto: " + pr);
  const u8 = b64urlToU8(b64u);
  const json = pako.inflate(u8, { to: "string" });
  return JSON.parse(json);
}

// Espera *real* a ICE complete (sin cutre-timeout)
function waitIceComplete(pc) {
  return new Promise((resolve) => {
    if (pc.iceGatheringState === "complete") return resolve();
    const onState = () => {
      if (pc.iceGatheringState === "complete") {
        pc.removeEventListener("icegatheringstatechange", onState);
        resolve();
      }
    };
    pc.addEventListener("icegatheringstatechange", onState);

    // además: cuando onicecandidate recibe null, suele significar “fin”
    pc.addEventListener("icecandidate", (e) => {
      if (!e.candidate) resolve();
    });
  });
}

function wireStateLogs(pc, tag) {
  pc.onconnectionstatechange = () => log(`${tag} connectionState: ${pc.connectionState}`);
  pc.oniceconnectionstatechange = () => log(`${tag} iceConnectionState: ${pc.iceConnectionState}`);
  pc.onsignalingstatechange = () => log(`${tag} signalingState: ${pc.signalingState}`);
  pc.onicegatheringstatechange = () => log(`${tag} iceGatheringState: ${pc.iceGatheringState}`);
}

function setupDC(dc, tag) {
  dc.onopen = () => { setStatus(true,"Conectado"); log(`🔗 DataChannel open (${tag})`); };
  dc.onmessage = e => log("⬅ " + e.data);
  dc.onerror = e => log("❌ DC error " + (e?.message || e));

  sendMsg = (m) => dc.send(m);
}

async function createHost() {
  roleEl.textContent = "Rol: HOST";
  setStatus(false, "Creando oferta (espera 1–5s)...");
  log("HOST: creando RTCPeerConnection");

  const pc = new RTCPeerConnection(pcConfig);
  wireStateLogs(pc, "HOST");

  const dc = pc.createDataChannel("game", { ordered: true });
  setupDC(dc, "HOST");

  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);

  // ✅ aquí está la clave: esperar a SDP completo con candidates
  await waitIceComplete(pc);

  const offerText = pack("BATTLESHIP_OFFER", pc.localDescription);
  showQR(offerText);
  setStatus(false, "Escanea este QR con el CLIENTE (offer)");
  log("HOST: offer lista y mostrada");

  // Host escanea ANSWER
  await startScan(async (txt) => {
    if (!txt.startsWith("BATTLESHIP_ANSWER|")) return;
    await stopScan();
    setStatus(false, "Aplicando answer...");
    log("HOST: answer recibida");

    await pc.setRemoteDescription(unpack(txt, "BATTLESHIP_ANSWER"));
    log("HOST: remoteDescription aplicada (answer)");
    setStatus(false, "Esperando conexión...");
  });
}

async function createClient() {
  roleEl.textContent = "Rol: CLIENTE";
  setStatus(false, "Escanea la oferta del HOST (offer)");
  log("CLIENTE: creando RTCPeerConnection");

  const pc = new RTCPeerConnection(pcConfig);
  wireStateLogs(pc, "CLI");

  pc.ondatachannel = (e) => {
    log("CLIENTE: datachannel recibido");
    setupDC(e.channel, "CLIENTE");
  };

  // Cliente escanea OFFER
  await startScan(async (txt) => {
    if (!txt.startsWith("BATTLESHIP_OFFER|")) return;

    await stopScan();
    setStatus(false, "Aplicando offer...");
    log("CLIENTE: offer recibida");

    await pc.setRemoteDescription(unpack(txt, "BATTLESHIP_OFFER"));

    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    // ✅ esperar a answer completa con candidates
    setStatus(false, "Generando answer (espera 1–5s)...");
    await waitIceComplete(pc);

    const answerText = pack("BATTLESHIP_ANSWER", pc.localDescription);
    showQR(answerText);
    setStatus(false, "Enseña este QR al HOST (answer)");
    log("CLIENTE: answer lista y mostrada");
  });
}

$("btnHost").onclick = createHost;
$("btnJoin").onclick = createClient;
$("btnCam").onclick  = () => startScan(()=>{});

})();
