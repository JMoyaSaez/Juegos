(() => {
const $ = id => document.getElementById(id);
const statusEl = $("status"), roleEl = $("role"), qrEl = $("qr");
const progressEl = $("progress"), logEl = $("log"), video = $("video");
const prevBtn = $("prev"), nextBtn = $("next");

let scanner;
let chunks = [];
let chunkIndex = 0;

const log = (t) => logEl.innerHTML = t + "<br>" + logEl.innerHTML;
const setStatus = (ok, t) => { statusEl.textContent = t; statusEl.className = ok ? "ok" : "bad"; };

function showChunk(i){
  if (!chunks.length) return;
  chunkIndex = Math.max(0, Math.min(i, chunks.length-1));
  qrEl.innerHTML = "";
  const size = Math.min(420, Math.floor(window.innerWidth * 0.92));
  new QRCode(qrEl, { text: chunks[chunkIndex], width: size, height: size, correctLevel: QRCode.CorrectLevel.L });
  progressEl.textContent = `QR ${chunkIndex+1}/${chunks.length}`;
}

prevBtn.onclick = () => showChunk(chunkIndex-1);
nextBtn.onclick = () => showChunk(chunkIndex+1);

async function startScan(onText){
  if (!scanner) scanner = new QrScanner(video, r => onText(r.data), { highlightScanRegion:true });
  await scanner.start();
}

const pcConfig = { iceServers: [], bundlePolicy:"max-bundle" };

// compress + base64url
function u8ToB64url(u8){ let s=""; for (let i=0;i<u8.length;i++) s+=String.fromCharCode(u8[i]);
  return btoa(s).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");
}
function b64urlToU8(b){ const b64=b.replace(/-/g,"+").replace(/_/g,"/")+"===".slice((b.length+3)%4);
  const bin=atob(b64); const u8=new Uint8Array(bin.length); for(let i=0;i<bin.length;i++) u8[i]=bin.charCodeAt(i); return u8;
}
function pack(prefix, obj){
  const json = JSON.stringify(obj);
  const def = pako.deflate(json);
  return `${prefix}|${u8ToB64url(def)}`;
}
function unpack(text, expectedPrefix){
  const [pr,b64u]=text.split("|");
  if(pr!==expectedPrefix) throw new Error("Prefijo incorrecto: "+pr);
  const json = pako.inflate(b64urlToU8(b64u), {to:"string"});
  return JSON.parse(json);
}

// ✅ Troceo: cada QR lleva un “sobre” con id/parte/total y payload
function chunkify(kind, packed, maxLen=380){
  const id = Math.random().toString(36).slice(2,8).toUpperCase();
  const parts = [];
  for (let i=0; i<packed.length; i+=maxLen) parts.push(packed.slice(i,i+maxLen));
  const total = parts.length;
  return parts.map((payload, idx) => `BS1|${kind}|${id}|${idx+1}|${total}|${payload}`);
}
function parseChunk(str){
  // BS1|OFFER|ABC123|2|6|payload...
  const m = str.split("|");
  if (m.length < 7 || m[0] !== "BS1") return null;
  const kind = m[1], id = m[2], idx = parseInt(m[3],10), total = parseInt(m[4],10);
  const payload = m.slice(5).join("|"); // por si hubiera |
  return { kind, id, idx, total, payload };
}
function assemble(all){
  // all: array payloads in order 1..total
  return all.join("");
}

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
    pc.addEventListener("icecandidate", (e) => { if(!e.candidate) resolve(); });
  });
}

function wireLogs(pc, tag){
  pc.onconnectionstatechange = () => log(`${tag} connectionState: ${pc.connectionState}`);
  pc.oniceconnectionstatechange = () => log(`${tag} ice: ${pc.iceConnectionState}`);
  pc.onsignalingstatechange = () => log(`${tag} signaling: ${pc.signalingState}`);
  pc.onicegatheringstatechange = () => log(`${tag} gathering: ${pc.iceGatheringState}`);
}

function onConnected(){
  setStatus(true,"Conectado ✅");
  // salto a juego
  setTimeout(()=> location.href = "game.html", 500);
}

async function hostFlow(){
  roleEl.textContent = "Rol: HOST";
  setStatus(false,"Creando offer…");

  const pc = new RTCPeerConnection(pcConfig);
  wireLogs(pc, "HOST");

  const dc = pc.createDataChannel("game",{ordered:true});
  dc.onopen = onConnected;
  dc.onmessage = (e)=>log("⬅ "+e.data);

  await pc.setLocalDescription(await pc.createOffer());
  await waitIceComplete(pc);

  const packed = pack("BATTLESHIP_OFFER", pc.localDescription);
  chunks = chunkify("OFFER", packed, 360); // ✅ QR poco denso
  showChunk(0);
  setStatus(false,"Cliente escanea tus QRs (offer)");

  // Host recopila ANSWER por chunks
  const bucket = new Map(); // id -> {total, arr}
  await startScan(async (txt) => {
    const c = parseChunk(txt);
    if(!c || c.kind!=="ANSWER") return;

    if(!bucket.has(c.id)) bucket.set(c.id, { total:c.total, arr:Array(c.total).fill(null) });
    const b = bucket.get(c.id);
    b.arr[c.idx-1] = c.payload;

    const got = b.arr.filter(Boolean).length;
    setStatus(false, `Recibiendo answer… (${got}/${b.total})`);
    if (got === b.total){
      const fullPacked = assemble(b.arr);
      await pc.setRemoteDescription(unpack(fullPacked,"BATTLESHIP_ANSWER"));
      log("✅ Answer completa aplicada");
      setStatus(false,"Esperando conexión…");
    }
  });
}

async function clientFlow(){
  roleEl.textContent = "Rol: CLIENTE";
  setStatus(false,"Escanea QRs del host (offer)");

  const pc = new RTCPeerConnection(pcConfig);
  wireLogs(pc, "CLI");

  pc.ondatachannel = (e) => {
    e.channel.onopen = onConnected;
    e.channel.onmessage = (ev)=>log("⬅ "+ev.data);
  };

  // Cliente recopila OFFER por chunks
  const bucket = new Map();
  await startScan(async (txt) => {
    const c = parseChunk(txt);
    if(!c || c.kind!=="OFFER") return;

    if(!bucket.has(c.id)) bucket.set(c.id, { total:c.total, arr:Array(c.total).fill(null) });
    const b = bucket.get(c.id);
    b.arr[c.idx-1] = c.payload;

    const got = b.arr.filter(Boolean).length;
    setStatus(false, `Recibiendo offer… (${got}/${b.total})`);

    if (got === b.total){
      const fullPacked = assemble(b.arr);
      await pc.setRemoteDescription(unpack(fullPacked,"BATTLESHIP_OFFER"));

      await pc.setLocalDescription(await pc.createAnswer());
      setStatus(false,"Generando answer…");
      await waitIceComplete(pc);

      const packedAnswer = pack("BATTLESHIP_ANSWER", pc.localDescription);
      chunks = chunkify("ANSWER", packedAnswer, 360);
      showChunk(0);
      setStatus(false,"Host escanea tus QRs (answer)");
      log("📤 Answer lista en varios QRs");
    }
  });
}

$("btnHost").onclick = hostFlow;
$("btnJoin").onclick = clientFlow;
$("btnCam").onclick  = () => startScan(()=>{});

})();
