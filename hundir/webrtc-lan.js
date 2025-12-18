const cfgLAN = {
  iceServers: [], // LAN-only: sin STUN/TURN
  iceCandidatePoolSize: 0
};

const enc = new TextEncoder();
const dec = new TextDecoder();

function pack(prefix, obj) {
  const json = JSON.stringify(obj);
  // base64url simple para QR
  const b64 = btoa(String.fromCharCode(...enc.encode(json)))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
  return `${prefix}|${b64}`;
}

function unpack(text, expectedPrefix) {
  const [prefix, b64url] = text.split("|");
  if (prefix !== expectedPrefix) throw new Error("Prefijo incorrecto");
  const b64 = b64url.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((b64url.length + 3) % 4);
  const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
  return JSON.parse(dec.decode(bytes));
}

function waitIceComplete(pc) {
  // Espera a que el ICE gathering termine para que el SDP esté completo.
  return new Promise((resolve) => {
    if (pc.iceGatheringState === "complete") return resolve();
    const onState = () => {
      if (pc.iceGatheringState === "complete") {
        pc.removeEventListener("icegatheringstatechange", onState);
        resolve();
      }
    };
    pc.addEventListener("icegatheringstatechange", onState);
  });
}

function setupChannel(dc, { onConnected, onMessage, onLog }) {
  dc.onopen = () => { onLog?.("🔌 DataChannel open"); onConnected?.(); };
  dc.onclose = () => onLog?.("🔌 DataChannel close");
  dc.onerror = (e) => onLog?.("❌ DataChannel error: " + (e?.message || e));
  dc.onmessage = (ev) => onMessage?.(ev.data);

  // Test ping
  window.__sendPing = () => {
    try { dc.send("PING " + new Date().toISOString()); } catch {}
  };
}

export async function createHost({ onOffer, onConnected, onMessage, onLog }) {
  const pc = new RTCPeerConnection(cfgLAN);

  const dc = pc.createDataChannel("game", { ordered: true });
  setupChannel(dc, { onConnected, onMessage, onLog });

  pc.onicecandidate = () => { /* ignored */ };

  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);
  await waitIceComplete(pc);

  // En LAN suele bastar; si no se completa, puedes probar un timeout + mostrar igual.
  onOffer?.(pack("BATTLESHIP_OFFER", pc.localDescription));

  return {
    async applyAnswer(answerText) {
      const answer = unpack(answerText, "BATTLESHIP_ANSWER");
      await pc.setRemoteDescription(answer);
      onLog?.("✅ Answer aplicado. Esperando canal...");
    }
  };
}

export async function createClient({ onAnswer, onConnected, onMessage, onLog }) {
  const pc = new RTCPeerConnection(cfgLAN);

  pc.ondatachannel = (ev) => {
    const dc = ev.channel;
    setupChannel(dc, { onConnected, onMessage, onLog });
  };

  pc.onicecandidate = () => { /* ignored */ };

  return {
    async applyOffer(offerText) {
      const offer = unpack(offerText, "BATTLESHIP_OFFER");
      await pc.setRemoteDescription(offer);

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      await waitIceComplete(pc);

      onAnswer?.(pack("BATTLESHIP_ANSWER", pc.localDescription));
      onLog?.("✅ Answer generado (muestra el QR al host)");
    }
  };
}
