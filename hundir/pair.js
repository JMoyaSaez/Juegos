(() => {
const $ = (id) => document.getElementById(id);

const statusEl = $("status");
const roleEl   = $("role");
const qrEl     = $("qr");
const progressEl = $("progress");
const logEl    = $("log");
const video    = $("video");
const prevBtn  = $("prev");
const nextBtn  = $("next");
const camBtn   = $("btnCam");

let scanner = null;

// --- estado QR por trozos ---
let chunks = [];
let chunkIndex = 0;

// --- buckets para ensamblar trozos escaneados ---
const buckets = new Map(); // id -> { total, arr, kind }

const log = (t) => { logEl.innerHTML = `${t}<br>${logEl.innerHTML}`; };
const setStatus = (ok, t) => {
  statusEl.textContent = t;
  statusEl.className = ok ? "ok" : "bad";
};

function showChunk(i){
  if (!chunks.length) return;
  chunkIndex = Math.max(0, Math.min(i, chunks.length - 1));
  qrEl.innerHTML = "";

  // Tamaño dinámico (nunca desborda)
  const size = Math.min(420, Math.floor(window.innerWidth * 0.92));

  // QRCodeJS crea un <img> dentro del contenedor
  new QRCode(qrEl, {
    text: chunks[chunkIndex],
    width: size,
    height: size,
    correctLevel: QRCode.CorrectLevel.L
  });

  progressEl.textContent = `QR ${chunkIndex + 1}/${chunks.length}`;
}

prevBtn.onclick = () => showChunk(chunkIndex - 1);
nextBtn.onclick = () => showChunk(chunkIndex + 1);

// --- WebRTC LAN ---
const pcConfig = { iceServers: [], bundlePolicy: "max-bundle" };

function waitIceComplete(pc){
  return new Promise((resolve) => {
    if (pc.iceGatheringState === "complete") return resolve();
    const onState = () => {
      if (pc.iceGatheringState === "complete") {
        pc.removeEventListener("icegatheringstatechange", onState);
        resolve();
      }
    };
    pc.addEventListener("icegatheringstatechange", onState);
    pc.addEventListener("icecandidate", (e) => { if (!e.candidate) resolve(); });
  });
}

function wireLogs(pc, tag){
  pc.onconnectionstatechange = () => log(`${tag} connectionState: ${pc.connectionState}`);
  pc.oniceconnectionstatechange = () => log(`${tag} ice: ${pc.iceConnectionState}`);
  pc.onsignalingstatechange = () => log(`${tag} signaling: ${pc.signalingState}`);
  pc.onicegatheringstatechange = () => log(`${tag} gathering: ${pc.iceGatheringState}`);
}

// --- compresión + base64url ---
function u8ToB64url(u8){
  let s = "";
  for (let i = 0; i < u8.length; i++) s += String.fromCharCode(u8[i]);
  return btoa(s).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");
}
function b64urlToU8(b64url){
  const b64 = b64url.replace(/-/g,"+").replace(/_/g,"/") + "===".slice((b64url.length + 3) % 4);
  const bin = atob(b64);
  const u8 = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
  return u8;
}
function pack(prefix, obj){
  const json = JSON.stringify(obj);
  const def = pako.deflate(json);
  return `${prefix}|${u8ToB64url(def)}`;
}
function unpack(text, expectedPrefix){
  const [pr, b64u] = text.split("|");
  if (pr !== expectedPrefix) throw new Error("Prefijo incorrecto: " + pr);
  const json = pako.inflate(b64urlToU8(b64u), { to: "string" });
  return JSON.parse(json);
}

// --- chunking: QRs cortos y fáciles de leer ---
// Formato: BS1|KIND|ID|IDX|TOTAL|PAYLOAD
function chunkify(kind, packed, maxLen = 360){
  const id = Math.random().toString(36).slice(2, 8).toUpperCase();
  const parts = [];
  for (let i = 0; i < packed.length; i += maxLen) parts.push(packed.slice(i, i + maxLen));
  const total = parts.length;
  return parts.map((payload, idx) => `BS1|${kind}|${id}|${idx + 1}|${total}|${payload}`);
}
function parseChunk(str){
  const a = str.split("|");
  if (a.length < 6 || a[0] !== "BS1") return null;
  const kind = a[1];
  const id = a[2];
  const idx = parseInt(a[3], 10);
  const total = parseInt(a[4], 10);
  const payload = a.slice(5).join("|");
  if (!kind || !id || !idx || !total || !payload) return null;
  return { kind, id, idx, total, payload };
}
function assemble(arr){ return arr.join(""); }

// --- QR scanner robusto (lo que te fallaba) ---
async function startScanner(onText){
  if (!scanner) {
    // Intenta usar cámara trasera
    try { QrScanner.setCameraPreference("environment"); } catch {}

    scanner = new QrScanner(
      video,
      (result) => {
        const data = result?.data ?? result; // compatible
        if (typeof data === "string") onText(data);
      },
      {
        // CLAVE: algunos QRs salen “invertidos” o con contraste raro
        inversionMode: "both",
        // Aumenta la probabilidad de captura
        maxScansPerSecond: 20,
        // Dibuja región, ayuda al usuario
        highlightScanRegion: true,
        highlightCodeOutline: true,
        // En muchos móviles mejora la tasa
        returnDetailedScanResult: true,
      }
    );
  }

  await scanner.start();
  log("📷 Cámara activa");
}

// Botón para activar permisos de cámara
camBtn.onclick = async () => {
  try { await startScanner(() => {}); }
  catch (e) { log("❌ Cámara: " + (e?.message || e)); }
};

// --- navegación al juego ---
function goGame(){
  setStatus(true, "Conectado ✅");
  log("🎮 Saltando a game.html…");
  setTimeout(() => { window.location.href = "game.html"; }, 500);
}

// --- HOST flow ---
async function hostFlow(){
  roleEl.textContent = "Rol: HOST";
  setStatus(false, "Creando offer…");
  log("HOST: creando RTCPeerConnection");

  const pc = new RTCPeerConnection(pcConfig);
  wireLogs(pc, "HOST");

  const dc = pc.createDataChannel("game", { ordered: true });
  dc.onopen = goGame;
  dc.onmessage = (e) => log("⬅ " + e.data);

  await pc.setLocalDescription(await pc.createOffer());
  await waitIceComplete(pc);

  const packedOffer = pack("BATTLESHIP_OFFER", pc.localDescription);
  chunks = chunkify("OFFER", packedOffer, 360);
  showChunk(0);

  setStatus(false, "Cliente escanea tus QRs (offer)");
  log(`HOST: offer en ${chunks.length} QRs`);

  await startScanner(async (txt) => {
    const c = parseChunk(txt);
    if (!c || c.kind !== "ANSWER") return;

    // bucket
    if (!buckets.has(c.id)) buckets.set(c.id, { total: c.total, arr: Array(c.total).fill(null), kind: c.kind });
    const b = buckets.get(c.id);
    b.arr[c.idx - 1] = c.payload;

    const got = b.arr.filter(Boolean).length;
    setStatus(false, `Recibiendo answer… (${got}/${b.total})`);

    if (got === b.total) {
      const fullPacked = assemble(b.arr);
      log("HOST: answer completa recibida");
      await pc.setRemoteDescription(unpack(fullPacked, "BATTLESHIP_ANSWER"));
      log("HOST: answer aplicada, esperando conexión…");
      setStatus(false, "Esperando conexión…");
    }
  });
}

// --- CLIENT flow ---
async function clientFlow(){
  roleEl.textContent = "Rol: CLIENTE";
  setStatus(false, "Escanea QRs del host (offer)");
  log("CLIENTE: creando RTCPeerConnection");

  const pc = new RTCPeerConnection(pcConfig);
  wireLogs(pc, "CLI");

  pc.ondatachannel = (e) => {
    const ch = e.channel;
    ch.onopen = goGame;
    ch.onmessage = (ev) => log("⬅ " + ev.data);
  };

  await startScanner(async (txt) => {
    const c = parseChunk(txt);
    if (!c || c.kind !== "OFFER") return;

    if (!buckets.has(c.id)) buckets.set(c.id, { total: c.total, arr: Array(c.total).fill(null), kind: c.kind });
    const b = buckets.get(c.id);
    b.arr[c.idx - 1] = c.payload;

    const got = b.arr.filter(Boolean).length;
    setStatus(false, `Recibiendo offer… (${got}/${b.total})`);

    if (got === b.total) {
      const fullPacked = assemble(b.arr);
      log("CLIENTE: offer completa recibida");

      await pc.setRemoteDescription(unpack(fullPacked, "BATTLESHIP_OFFER"));
      await pc.setLocalDescription(await pc.createAnswer());
      setStatus(false, "Generando answer…");
      await waitIceComplete(pc);

      const packedAnswer = pack("BATTLESHIP_ANSWER", pc.localDescription);
      chunks = chunkify("ANSWER", packedAnswer, 360);
      showChunk(0);

      setStatus(false, "Host escanea tus QRs (answer)");
      log(`CLIENTE: answer en ${chunks.length} QRs`);
    }
  });
}

// Hooks UI
$("btnHost").onclick = () => hostFlow().catch(e => log("❌ HOST: " + (e?.message || e)));
$("btnJoin").onclick = () => clientFlow().catch(e => log("❌ CLIENTE: " + (e?.message || e)));

})();
