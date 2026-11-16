// Desk Hub — realistic 3D direct-drive turntable (original design)
import * as THREE from 'three';
import { RoomEnvironment } from './vendor/RoomEnvironment.js';
import { RoundedBoxGeometry } from './vendor/RoundedBoxGeometry.js';

const RPM = 100 / 3;                 // 33⅓
const OMEGA = RPM * 2 * Math.PI / 60;

/* ---------------- procedural textures ---------------- */
function canvas(w, h = w) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }

function noiseTex(size, base, amp, seed = 1) {
  const c = canvas(size), x = c.getContext('2d'), img = x.createImageData(size, size), r = rng(seed);
  for (let i = 0; i < img.data.length; i += 4) { const v = base + (r() - .5) * amp; img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255; }
  x.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}

// Vinyl: grooves (color), roughness, and tangential anisotropy direction
function vinylTextures(N = 2048) {
  const R = N / 2, r = rng(7);
  const labelR = 0.335, runout = 0.40, leadIn = 0.965;
  const gaps = [0.52, 0.63, 0.73, 0.82, 0.90];
  const cCol = canvas(N), xc = cCol.getContext('2d');
  const cRgh = canvas(N), xr = cRgh.getContext('2d');
  xc.fillStyle = '#0b0b0c'; xc.fillRect(0, 0, N, N);
  xr.fillStyle = '#5a5a5a'; xr.fillRect(0, 0, N, N);
  xc.lineWidth = 1.15; xr.lineWidth = 1.15;
  for (let px = labelR * R; px < R; px += 1.0) {
    const f = px / R;
    const inGap = gaps.some(g => Math.abs(f - g) < 0.0045);
    const smooth = f < runout || f > leadIn || inGap;
    const l = smooth ? 12 : 13 + r() * 9;
    xc.strokeStyle = `rgb(${l},${l},${l + 1})`;
    xc.beginPath(); xc.arc(R, R, px, 0, Math.PI * 2); xc.stroke();
    const rg = smooth ? 40 : 95 + r() * 55;
    xr.strokeStyle = `rgb(${rg},${rg},${rg})`;
    xr.beginPath(); xr.arc(R, R, px, 0, Math.PI * 2); xr.stroke();
  }
  // outer bevel
  xc.strokeStyle = '#1b1b1d'; xc.lineWidth = 3; xc.beginPath(); xc.arc(R, R, R - 2, 0, Math.PI * 2); xc.stroke();

  // anisotropy: direction tangential (rg), strength (b)
  const A = 512, cAn = canvas(A), xa = cAn.getContext('2d'), img = xa.createImageData(A, A), h = A / 2;
  for (let y = 0; y < A; y++) for (let xx = 0; xx < A; xx++) {
    const dx = (xx + .5 - h) / h, dy = (y + .5 - h) / h, d = Math.hypot(dx, dy) || 1;
    const tx = -dy / d, ty = dx / d;
    const i = (y * A + xx) * 4;
    img.data[i] = (tx * .5 + .5) * 255; img.data[i + 1] = (-ty * .5 + .5) * 255;
    img.data[i + 2] = d > labelR && d < 1 ? 255 : 0; img.data[i + 3] = 255;
  }
  xa.putImageData(img, 0, 0);

  const col = new THREE.CanvasTexture(cCol); col.colorSpace = THREE.SRGBColorSpace; col.anisotropy = 8;
  const rgh = new THREE.CanvasTexture(cRgh); rgh.anisotropy = 8;
  const an = new THREE.CanvasTexture(cAn);
  return { col, rgh, an };
}

// Brushed circular aluminium (platter top) + strobe dots (platter side)
function brushedTextures() {
  const N = 1024, R = N / 2, r = rng(11);
  const c = canvas(N), x = c.getContext('2d');
  x.fillStyle = '#9a9a9a'; x.fillRect(0, 0, N, N); x.lineWidth = 1.2;
  for (let p = 0; p < R; p += 1.1) { const v = 120 + r() * 70; x.strokeStyle = `rgb(${v},${v},${v})`; x.beginPath(); x.arc(R, R, p, 0, Math.PI * 2); x.stroke(); }
  const rgh = new THREE.CanvasTexture(c);
  return { rgh };
}
function strobeTextures() {
  const W = 4096, H = 128, c = canvas(W, H), x = c.getContext('2d');
  const m = canvas(W, H), xm = m.getContext('2d');
  x.fillStyle = '#8d8f92'; x.fillRect(0, 0, W, H);
  xm.fillStyle = '#6a6a6a'; xm.fillRect(0, 0, W, H);
  // subtle horizontal brushing on rim
  const r = rng(3);
  for (let y = 0; y < H; y++) { const v = 130 + r() * 50; xm.fillStyle = `rgb(${v},${v},${v})`; xm.fillRect(0, y, W, 1); }
  const rows = [{ n: 180, y: .2 }, { n: 183, y: .42 }, { n: 216, y: .64 }, { n: 222, y: .84 }];
  rows.forEach(rw => {
    const step = W / rw.n, s = Math.min(step * .42, H * .085);
    for (let i = 0; i < rw.n; i++) {
      const cx = i * step + step / 2, cy = rw.y * H;
      x.fillStyle = '#d9dbde'; x.beginPath(); x.arc(cx, cy, s, 0, Math.PI * 2); x.fill();
      xm.fillStyle = '#141414'; xm.beginPath(); xm.arc(cx, cy, s, 0, Math.PI * 2); xm.fill();
    }
  });
  const col = new THREE.CanvasTexture(c); col.colorSpace = THREE.SRGBColorSpace; col.anisotropy = 8;
  const rgh = new THREE.CanvasTexture(m); rgh.anisotropy = 8;
  return { col, rgh };
}
function matTexture() {
  const N = 1024, R = N / 2, c = canvas(N), x = c.getContext('2d'), r = rng(5);
  x.fillStyle = '#1a1a1a'; x.fillRect(0, 0, N, N);
  for (let i = 0; i < 26000; i++) { const a = r() * Math.PI * 2, d = Math.sqrt(r()) * R; const v = 20 + r() * 14; x.fillStyle = `rgb(${v},${v},${v})`; x.fillRect(R + Math.cos(a) * d, R + Math.sin(a) * d, 1.4, 1.4); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function woodTextures() {
  const Wd = 2048, Hd = 1024, c = canvas(Wd, Hd), x = c.getContext('2d'), r = rng(21);
  const g = x.createLinearGradient(0, 0, 0, Hd); g.addColorStop(0, '#45260f'); g.addColorStop(.5, '#53301a'); g.addColorStop(1, '#3f2210');
  x.fillStyle = g; x.fillRect(0, 0, Wd, Hd);
  for (let i = 0; i < 900; i++) {
    const y0 = r() * Hd, amp = 6 + r() * 26, fr = .002 + r() * .004, ph = r() * 6.28, dark = r() < .55;
    x.strokeStyle = dark ? `rgba(30,14,5,${.06 + r() * .16})` : `rgba(160,98,52,${.04 + r() * .1})`;
    x.lineWidth = .6 + r() * 2.6; x.beginPath();
    for (let xx = 0; xx <= Wd; xx += 16) { const y = y0 + Math.sin(xx * fr + ph) * amp + Math.sin(xx * fr * 3.1 + ph * 2) * amp * .25; xx ? x.lineTo(xx, y) : x.moveTo(xx, y); }
    x.stroke();
  }
  for (let i = 0; i < 9000; i++) { x.fillStyle = `rgba(20,8,2,${r() * .18})`; x.fillRect(r() * Wd, r() * Hd, 2 + r() * 10, .8); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}
function contactShadowTex() {
  const N = 256, c = canvas(N), x = c.getContext('2d');
  const g = x.createRadialGradient(N / 2, N / 2, N * .05, N / 2, N / 2, N / 2);
  g.addColorStop(0, 'rgba(0,0,0,.55)'); g.addColorStop(.55, 'rgba(0,0,0,.28)'); g.addColorStop(1, 'rgba(0,0,0,0)');
  x.fillStyle = g; x.fillRect(0, 0, N, N);
  return new THREE.CanvasTexture(c);
}

/* ---------------- label ---------------- */
const labelCanvas = canvas(1024), labelTex = new THREE.CanvasTexture(labelCanvas);
labelTex.colorSpace = THREE.SRGBColorSpace; labelTex.anisotropy = 8;
let labelState = { name: '', sub: '', color: '#a8693a', img: null }, labelStyle = 'classic';
function drawLabel() {
  if (labelStyle === 'dot') return drawDotLabel();
  const c = labelCanvas, x = c.getContext('2d'), N = c.width, R = N / 2, s = labelState;
  x.clearRect(0, 0, N, N);
  x.save(); x.beginPath(); x.arc(R, R, R, 0, Math.PI * 2); x.clip();
  if (s.img) {
    x.drawImage(s.img, 0, 0, N, N);
    const v = x.createRadialGradient(R, R, R * .55, R, R, R); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.28)');
    x.fillStyle = v; x.fillRect(0, 0, N, N);
  } else {
    const g = x.createRadialGradient(R * .8, R * .7, R * .1, R, R, R);
    g.addColorStop(0, shade(s.color, 18)); g.addColorStop(1, shade(s.color, -22));
    x.fillStyle = g; x.fillRect(0, 0, N, N);
    // fine printed rings
    x.strokeStyle = 'rgba(255,245,230,.22)'; x.lineWidth = 3;
    [0.93, 0.89].forEach(f => { x.beginPath(); x.arc(R, R, R * f, 0, Math.PI * 2); x.stroke(); });
    x.fillStyle = 'rgba(255,248,236,.96)'; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.font = `500 ${fitFont(x, s.name, N * .6, 112)}px Fraunces, Georgia, serif`;
    x.fillText(s.name, R, R - N * .2);
    x.font = `600 34px Manrope, Helvetica, sans-serif`; x.fillStyle = 'rgba(255,248,236,.78)';
    x.fillText(spaced((s.sub || '').toUpperCase()), R, R + N * .2);
    x.font = `600 26px Manrope, Helvetica, sans-serif`; x.fillStyle = 'rgba(255,248,236,.55)';
    x.fillText('33⅓', R - N * .31, R); x.fillText('LIVE', R + N * .31, R);
    // curved rim text
    curved(x, 'DESK HUB · STEREO · HIGH FIDELITY · DESK HUB · STEREO · HIGH FIDELITY ·', R, R, R * .8, 22);
  }
  x.restore();
  // center hole shadow
  const h = x.createRadialGradient(R, R, 0, R, R, N * .05);
  h.addColorStop(0, 'rgba(0,0,0,.6)'); h.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = h;
  x.beginPath(); x.arc(R, R, N * .05, 0, Math.PI * 2); x.fill();
  labelTex.needsUpdate = true; requestRender();
}
// Dot-matrix label: monochrome, halftone cover, dotted type (works for any script)
function dotText(x, text, cx, cy, size, color, pitch, weight = 800) {
  const W = 1024, H = Math.ceil(size * 1.6), o = canvas(W, H), g = o.getContext('2d');
  g.font = `${weight} ${size}px Inter, Manrope, Helvetica, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#fff';
  let f = size; while (g.measureText(text).width > W * .66 && f > 30) { f -= 4; g.font = `${weight} ${f}px Inter, Manrope, Helvetica, sans-serif`; }
  g.fillText(text, W / 2, H / 2);
  const d = g.getImageData(0, 0, W, H).data; x.fillStyle = color;
  for (let y = pitch / 2; y < H; y += pitch) for (let xx = pitch / 2; xx < W; xx += pitch) {
    const a = d[(Math.floor(y) * W + Math.floor(xx)) * 4 + 3];
    if (a > 110) { x.beginPath(); x.arc(cx - W / 2 + xx, cy - H / 2 + y, pitch * .38, 0, Math.PI * 2); x.fill(); }
  }
}
function drawDotLabel() {
  const c = labelCanvas, x = c.getContext('2d'), N = c.width, R = N / 2, s = labelState;
  x.clearRect(0, 0, N, N); x.save(); x.beginPath(); x.arc(R, R, R, 0, Math.PI * 2); x.clip();
  x.fillStyle = '#0b0b0b'; x.fillRect(0, 0, N, N);
  if (s.img) {
    // halftone of the cover: white dots sized by brightness
    const G = 56, o = canvas(G), g = o.getContext('2d'); g.drawImage(s.img, 0, 0, G, G);
    const d = g.getImageData(0, 0, G, G).data, step = N / G; x.fillStyle = '#f2f2f2';
    for (let j = 0; j < G; j++) for (let i = 0; i < G; i++) {
      const k = (j * G + i) * 4, l = (.299 * d[k] + .587 * d[k + 1] + .114 * d[k + 2]) / 255;
      const r = Math.pow(l, 1.1) * step * .5; if (r > .6) { x.beginPath(); x.arc(i * step + step / 2, j * step + step / 2, r, 0, Math.PI * 2); x.fill(); }
    }
  } else {
    x.strokeStyle = 'rgba(255,255,255,.18)'; x.lineWidth = 2;
    x.setLineDash([2, 12]); x.beginPath(); x.arc(R, R, R * .9, 0, Math.PI * 2); x.stroke(); x.setLineDash([]);
    dotText(x, s.name || '', R, R - N * .13, 150, '#f2f2f2', 12);
    dotText(x, (s.sub || '').toUpperCase(), R, R + N * .14, 70, 'rgba(242,242,242,.6)', 8, 700);
    x.fillStyle = '#d71921'; x.beginPath(); x.arc(R + N * .3, R, N * .022, 0, Math.PI * 2); x.fill();
    x.fillStyle = 'rgba(242,242,242,.5)'; x.font = '600 24px "JetBrains Mono", monospace'; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillText('33 1/3', R - N * .3, R);
  }
  x.restore();
  x.fillStyle = '#d6d6d6'; x.beginPath(); x.arc(R, R, N * .022, 0, Math.PI * 2); x.fill();
  labelTex.needsUpdate = true; requestRender();
}
function spaced(t) { return t.split('').join(' '); }
function fitFont(x, t, maxW, start) { let f = start; do { x.font = `500 ${f}px Fraunces, Georgia, serif`; if (x.measureText(t).width <= maxW) break; f -= 4; } while (f > 40); return f; }
function curved(x, text, cx, cy, rad, size) {
  x.save(); x.font = `600 ${size}px Manrope, Helvetica, sans-serif`; x.fillStyle = 'rgba(255,248,236,.5)';
  x.textAlign = 'center'; x.textBaseline = 'middle';
  const total = x.measureText(text).width, ang = total / rad; let a = -Math.PI / 2 - ang / 2;
  for (const ch of text) { const w = x.measureText(ch).width; a += (w / 2) / rad; x.save(); x.translate(cx + Math.cos(a) * rad, cy + Math.sin(a) * rad); x.rotate(a + Math.PI / 2); x.fillText(ch, 0, 0); x.restore(); a += (w / 2) / rad; }
  x.restore();
}
function shade(hex, p) {
  let r, g, b;
  if (hex.startsWith('#')) { const n = parseInt(hex.slice(1), 16); r = n >> 16; g = n >> 8 & 255; b = n & 255; }
  else { [r, g, b] = hex.match(/\d+/g).map(Number); }
  const f = v => Math.max(0, Math.min(255, Math.round(v + (p / 100) * 255)));
  return `rgb(${f(r)},${f(g)},${f(b)})`;
}

/* ---------------- scene ---------------- */
let renderer, scene, camera, container, spinGroup, armYaw, armLift, cueLever, targetLamp, ledOn, led33;
let needs = true, paused = false, tapHandler = null, startBtn, recHolder, recSpin;
const SK = { feet: [], prints: [] };
function requestRender() { needs = true; }

const M = {}; // materials
function buildMaterials() {
  const tex = vinylTextures(), br = brushedTextures(), st = strobeTextures();
  M.plinth = new THREE.MeshPhysicalMaterial({ color: 0x0b0b0c, roughness: .66, metalness: 0, clearcoat: .22, clearcoatRoughness: .5, envMapIntensity: .55, roughnessMap: noiseTex(256, 190, 40, 2) });
  M.plinth.roughnessMap.repeat.set(6, 6);
  M.plinthTop = M.plinth.clone(); M.plinthTop.roughness = .6; M.plinthTop.color = new THREE.Color(0x0d0d0e);
  M.rubber = new THREE.MeshStandardMaterial({ color: 0x0c0c0c, roughness: .95 });
  M.alu = new THREE.MeshPhysicalMaterial({ color: 0xc9cbce, metalness: 1, roughness: .32, roughnessMap: br.rgh, anisotropy: .75, anisotropyMap: tex.an });
  M.strobe = new THREE.MeshStandardMaterial({ map: st.col, metalness: 1, roughness: .35, roughnessMap: st.rgh });
  M.mat = new THREE.MeshStandardMaterial({ map: matTexture(), roughness: .93 });
  M.vinylTop = new THREE.MeshPhysicalMaterial({ map: tex.col, roughness: .38, roughnessMap: tex.rgh, metalness: 0, clearcoat: .55, clearcoatRoughness: .18, anisotropy: .9, anisotropyMap: tex.an, specularIntensity: .9 });
  M.vinylEdge = new THREE.MeshPhysicalMaterial({ color: 0x0a0a0a, roughness: .25, clearcoat: .6 });
  M.label = new THREE.MeshStandardMaterial({ map: labelTex, roughness: .78 });
  M.chrome = new THREE.MeshStandardMaterial({ color: 0xe6e7e9, metalness: 1, roughness: .14 });
  M.satin = new THREE.MeshStandardMaterial({ color: 0xbfc1c4, metalness: 1, roughness: .3 });
  M.darkMetal = new THREE.MeshStandardMaterial({ color: 0x2a2b2d, metalness: .85, roughness: .38 });
  M.blackPlastic = new THREE.MeshStandardMaterial({ color: 0x0f0f10, roughness: .45 });
  M.cartridge = new THREE.MeshPhysicalMaterial({ color: 0x15161a, roughness: .3, clearcoat: .8, clearcoatRoughness: .2 });
  M.stylusGuard = new THREE.MeshStandardMaterial({ color: 0xb48a3c, metalness: .6, roughness: .35 });
  M.button = new THREE.MeshPhysicalMaterial({ color: 0x1b1c1e, roughness: .4, clearcoat: .5 });
  const wood = woodTextures();
  M.walnut = new THREE.MeshPhysicalMaterial({ map: wood, roughness: .48, clearcoat: .55, clearcoatRoughness: .28, envMapIntensity: .8 });
  M.walnutTop = M.walnut.clone();
  M.acrylic = new THREE.MeshPhysicalMaterial({ color: 0xffffff, metalness: 0, roughness: .06, transmission: 1, thickness: 3.5, ior: 1.49, clearcoat: 1, clearcoatRoughness: .05, attenuationColor: new THREE.Color(0xd8e6ec), attenuationDistance: 60, specularIntensity: 1 });
  M.mono = new THREE.MeshPhysicalMaterial({ color: 0xe8e8e5, roughness: .55, clearcoat: .25, clearcoatRoughness: .5, envMapIntensity: .6 });
  M.monoTop = M.mono.clone();
  M.red = new THREE.MeshPhysicalMaterial({ color: 0xd71921, roughness: .35, clearcoat: .5 });
  M.pcb = new THREE.MeshStandardMaterial({ color: 0x0f2a22, roughness: .55, metalness: .1 });
  M.copper = new THREE.MeshStandardMaterial({ color: 0xb87333, roughness: .35, metalness: 1 });
  M.print = new THREE.MeshBasicMaterial({ color: 0x8b8b8b, transparent: true });
  M.ledOff = new THREE.MeshStandardMaterial({ color: 0x2a1408, emissive: 0x000000, roughness: .3 });
  M.ledOn = new THREE.MeshStandardMaterial({ color: 0xff7a2a, emissive: 0xff6a1a, emissiveIntensity: 2.2, roughness: .3 });
  M.lampOn = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfff1d6, emissiveIntensity: 3.0 });
}

function mesh(geo, mat, cast = true, recv = true) { const m = new THREE.Mesh(geo, mat); m.castShadow = cast; m.receiveShadow = recv; return m; }

// geometry constants (cm)
const W = 46, D = 36, H = 6.2, FOOT = .9;
const TOP = FOOT + H;
const C = new THREE.Vector3(-5.6, TOP, -.6);         // spindle
const PIVOT = new THREE.Vector3(14.2, TOP, -9.4);     // tonearm pivot
const PLATTER_R = 15.4, PLATTER_H = 1.55, MAT_H = .26, REC_H = .17;
const RY = TOP + PLATTER_H + MAT_H + REC_H;           // record surface
const ARM_Y = RY + 1.62;                              // arm tube height
let tipLocal = new THREE.Vector3();

function buildDeck() {
  const deck = new THREE.Group();

  // plinth
  const pl = mesh(new RoundedBoxGeometry(W, H, D, 6, .7), M.plinth); pl.position.y = FOOT + H / 2; deck.add(pl); SK.plinth = pl;
  // subtle top inlay (slightly different sheen)
  const inlay = mesh(new RoundedBoxGeometry(W - 1.2, .06, D - 1.2, 4, .03), M.plinthTop, false, true); inlay.position.y = TOP + .005; deck.add(inlay); SK.inlay = inlay;

  // feet
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => {
    const f = mesh(new THREE.CylinderGeometry(2.6, 2.9, FOOT, 40), M.rubber); f.position.set(sx * (W / 2 - 4), FOOT / 2, sz * (D / 2 - 4)); deck.add(f); SK.feet.push(f);
    const ring = mesh(new THREE.CylinderGeometry(2.95, 2.95, .18, 40), M.satin); ring.position.set(sx * (W / 2 - 4), FOOT - .1, sz * (D / 2 - 4)); deck.add(ring);
  });

  // internals (only visible with the clear acrylic skin)
  const inner = new THREE.Group(); inner.visible = false; SK.inner = inner; deck.add(inner);
  const sub = mesh(new THREE.BoxGeometry(W - 6, .25, D - 6), M.darkMetal); sub.position.y = FOOT + .9; inner.add(sub);
  const motor = mesh(new THREE.CylinderGeometry(7.5, 7.5, 3.2, 64), M.darkMetal); motor.position.set(C.x, FOOT + 2.7, C.z); inner.add(motor);
  const coil = mesh(new THREE.TorusGeometry(5.6, .55, 16, 64), M.copper); coil.rotation.x = Math.PI / 2; coil.position.set(C.x, FOOT + 4.4, C.z); inner.add(coil);
  const bearing = mesh(new THREE.CylinderGeometry(1.4, 1.4, 2.2, 32), M.chrome); bearing.position.set(C.x, TOP - 1.4, C.z); inner.add(bearing);
  const pcb = mesh(new THREE.BoxGeometry(12, .16, 7), M.pcb); pcb.position.set(10.5, FOOT + 1.2, 10.5); inner.add(pcb);
  for (let i = 0; i < 7; i++) { const chip = mesh(new THREE.BoxGeometry(1 + (i % 3) * .5, .5, .9), M.blackPlastic); chip.position.set(6.2 + (i % 4) * 2.6, FOOT + 1.55, 8.6 + Math.floor(i / 4) * 2.8); inner.add(chip); }
  const armCol = mesh(new THREE.CylinderGeometry(1.1, 1.1, H - 1.2, 24), M.satin); armCol.position.set(PIVOT.x, FOOT + 1 + (H - 1.2) / 2, PIVOT.z); inner.add(armCol);
  // platter well (dark ring) + spinning group
  const well = mesh(new THREE.CylinderGeometry(PLATTER_R + .35, PLATTER_R + .35, .04, 96), M.blackPlastic, false, true);
  well.position.set(C.x, TOP + .02, C.z); deck.add(well);

  spinGroup = new THREE.Group(); spinGroup.position.copy(C); deck.add(spinGroup);
  const platter = mesh(new THREE.CylinderGeometry(PLATTER_R, PLATTER_R, PLATTER_H, 160, 1), [M.strobe, M.alu, M.alu]);
  platter.position.y = PLATTER_H / 2; spinGroup.add(platter);
  platter.material[0].map.repeat.set(1, 1);
  const mat = mesh(new THREE.CylinderGeometry(14.85, 14.85, MAT_H, 128), [M.rubber, M.mat, M.rubber]); mat.position.y = PLATTER_H + MAT_H / 2; spinGroup.add(mat);
  recHolder = new THREE.Group(); recHolder.position.copy(C); deck.add(recHolder);
  recSpin = new THREE.Group(); recHolder.add(recSpin);
  const rec = mesh(new THREE.CylinderGeometry(15.15, 15.15, REC_H, 160), [M.vinylEdge, M.vinylTop, M.vinylEdge]); rec.position.y = PLATTER_H + MAT_H + REC_H / 2; recSpin.add(rec);
  const label = mesh(new THREE.CircleGeometry(5.05, 96), M.label, false, true); label.rotation.x = -Math.PI / 2; label.position.y = RY - TOP + .008; recSpin.add(label);
  const spindle = mesh(new THREE.CylinderGeometry(.36, .36, 1.6, 24), M.chrome); spindle.position.y = RY - TOP + .7; spinGroup.add(spindle);
  const spTop = mesh(new THREE.SphereGeometry(.36, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), M.chrome); spTop.position.y = RY - TOP + 1.5; spinGroup.add(spTop);
  spinGroup.userData.tap = true; platter.userData.tap = rec.userData.tap = label.userData.tap = mat.userData.tap = true;

  // tonearm base
  const baseG = new THREE.Group(); baseG.position.set(PIVOT.x, TOP, PIVOT.z); deck.add(baseG);
  const b1 = mesh(new THREE.CylinderGeometry(3.4, 3.6, .9, 72), M.darkMetal); b1.position.y = .45; baseG.add(b1);
  const b1r = mesh(new THREE.TorusGeometry(3.4, .09, 12, 72), M.satin); b1r.rotation.x = Math.PI / 2; b1r.position.y = .9; baseG.add(b1r);
  const b2 = mesh(new THREE.CylinderGeometry(1.25, 1.35, ARM_Y - TOP - .9, 40), M.satin); b2.position.y = .9 + (ARM_Y - TOP - .9) / 2; baseG.add(b2);
  // anti-skate dial
  const as = mesh(new THREE.CylinderGeometry(1.25, 1.25, .55, 48), M.darkMetal); as.position.set(-3.6, .28 + .45, 3.2); baseG.add(as);
  const asTop = mesh(new THREE.CylinderGeometry(1.0, 1.0, .06, 48), M.satin); asTop.position.set(-3.6, 1.04, 3.2); baseG.add(asTop);
  // cue lever housing + lever
  const cueH = mesh(new RoundedBoxGeometry(1.1, 1.6, 1.1, 3, .2), M.darkMetal); cueH.position.set(3.2, 1.6, 4.4); baseG.add(cueH);
  cueLever = new THREE.Group(); cueLever.position.set(3.2, 2.3, 4.4); baseG.add(cueLever);
  const lev = mesh(new THREE.CylinderGeometry(.16, .16, 3.2, 16), M.chrome); lev.rotation.z = Math.PI / 2; lev.position.x = 1.4; cueLever.add(lev);
  const levKnob = mesh(new THREE.SphereGeometry(.3, 16, 12), M.blackPlastic); levKnob.position.x = 3.0; cueLever.add(levKnob);

  // tonearm (yaw group at pivot, lift group inside)
  armYaw = new THREE.Group(); armYaw.position.set(PIVOT.x, ARM_Y, PIVOT.z); deck.add(armYaw);
  armLift = new THREE.Group(); armYaw.add(armLift);
  const gimbal = mesh(new THREE.TorusGeometry(1.15, .22, 16, 48), M.satin); gimbal.rotation.x = Math.PI / 2; armLift.add(gimbal);
  const hub = mesh(new THREE.SphereGeometry(.85, 32, 20), M.chrome); armLift.add(hub);
  const pins = mesh(new THREE.CylinderGeometry(.16, .16, 2.8, 12), M.chrome); pins.rotation.z = Math.PI / 2; armLift.add(pins);

  // S-shaped arm tube
  const pts = [[0, 0, -1.2], [0, 0, 3], [.55, 0, 7.5], [1.25, 0, 12], [.85, 0, 15.6], [-.35, 0, 18.6], [-1.15, 0, 20.4]].map(p => new THREE.Vector3(...p));
  const curve = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', .5);
  const tube = mesh(new THREE.TubeGeometry(curve, 160, .38, 24, false), M.satin); armLift.add(tube);
  const collar = mesh(new THREE.CylinderGeometry(.5, .5, .9, 24), M.chrome); collar.rotation.x = Math.PI / 2; collar.position.set(0, 0, 1.6); armLift.add(collar);
  // counterweight
  const stub = mesh(new THREE.CylinderGeometry(.34, .34, 5.4, 20), M.satin); stub.rotation.x = Math.PI / 2; stub.position.z = -3.5; armLift.add(stub);
  const cw = mesh(new THREE.CylinderGeometry(1.75, 1.75, 2.6, 56), M.darkMetal); cw.rotation.x = Math.PI / 2; cw.position.z = -4.6; armLift.add(cw);
  const cwRing = mesh(new THREE.CylinderGeometry(1.82, 1.82, .5, 56), M.satin); cwRing.rotation.x = Math.PI / 2; cwRing.position.z = -3.3; armLift.add(cwRing);
  const cwCap = mesh(new THREE.CylinderGeometry(1.2, 1.5, .5, 48), M.darkMetal); cwCap.rotation.x = Math.PI / 2; cwCap.position.z = -6.1; armLift.add(cwCap);

  // headshell oriented along end tangent
  const endP = curve.getPoint(1), endT = curve.getTangent(1).normalize();
  const head = new THREE.Group(); head.position.copy(endP);
  head.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), endT); armLift.add(head);
  const hsConn = mesh(new THREE.CylinderGeometry(.48, .48, 1.1, 20), M.chrome); hsConn.rotation.x = Math.PI / 2; hsConn.position.z = .4; head.add(hsConn);
  const shell = mesh(new RoundedBoxGeometry(1.9, .32, 4.6, 3, .14), M.darkMetal); shell.position.set(0, -.1, 3.0); shell.rotation.y = .38; head.add(shell);
  const finger = mesh(new THREE.CylinderGeometry(.12, .12, 2.2, 12), M.satin); finger.rotation.z = Math.PI / 2 - .2; finger.position.set(1.6, .05, 4.6); head.add(finger);
  const cart = mesh(new RoundedBoxGeometry(1.45, 1.05, 2.15, 3, .12), M.cartridge); cart.position.set(-.35, -.75, 3.2); cart.rotation.y = .38; head.add(cart);
  const guard = mesh(new RoundedBoxGeometry(.9, .55, .7, 2, .1), M.stylusGuard); guard.position.set(-.05, -1.05, 4.15); guard.rotation.y = .38; head.add(guard);
  // stylus tip in arm-lift local space
  const tipObj = new THREE.Object3D(); tipObj.position.set(-.05, -1.45, 4.05); head.add(tipObj);
  armLift.updateMatrixWorld(true); armYaw.updateMatrixWorld(true);
  tipLocal = armLift.worldToLocal(tipObj.getWorldPosition(new THREE.Vector3()));

  // arm rest post + clip (positioned under arm at rest yaw)
  const restYaw = ARM.rest;
  const along = 12.2; const rx = PIVOT.x + Math.sin(restYaw) * along + Math.cos(restYaw) * 1.25, rz = PIVOT.z + Math.cos(restYaw) * along - Math.sin(restYaw) * 1.25;
  const post = mesh(new THREE.CylinderGeometry(.38, .5, ARM_Y - TOP - .4, 20), M.satin); post.position.set(rx, TOP + (ARM_Y - TOP - .4) / 2, rz); deck.add(post);
  const cradle = mesh(new RoundedBoxGeometry(1.4, .5, .9, 2, .15), M.rubber); cradle.position.set(rx, ARM_Y - .55, rz); cradle.rotation.y = restYaw; deck.add(cradle);
  const pBase = mesh(new THREE.CylinderGeometry(.9, 1.0, .3, 32), M.darkMetal); pBase.position.set(rx, TOP + .15, rz); deck.add(pBase);

  // front controls
  startBtn = mesh(new RoundedBoxGeometry(5.2, .55, 2.6, 4, .25), M.button); startBtn.position.set(-17.4, TOP + .2, 15.0); startBtn.userData.tap = true; deck.add(startBtn);
  addPrint(deck, 'START · STOP', -17.4, 13.25, 22);
  const b33 = mesh(new RoundedBoxGeometry(2.3, .5, 1.7, 3, .22), M.button); b33.position.set(3.0, TOP + .18, 15.4); deck.add(b33);
  const b45 = b33.clone(); b45.position.x = 6.1; deck.add(b45);
  addPrint(deck, '33', 3.0, 13.95, 20); addPrint(deck, '45', 6.1, 13.95, 20);
  led33 = mesh(new THREE.CylinderGeometry(.16, .16, .12, 16), M.ledOff); led33.position.set(1.4, TOP + .07, 15.4); deck.add(led33);
  // pitch slider
  const slot = mesh(new RoundedBoxGeometry(.7, .08, 11, 2, .03), M.rubber, false, true); slot.position.set(19.6, TOP + .03, 6.5); deck.add(slot);
  const knob = mesh(new RoundedBoxGeometry(2.0, .9, 1.1, 3, .2), M.button); knob.position.set(19.6, TOP + .45, 6.5); deck.add(knob);
  const knobLine = mesh(new THREE.BoxGeometry(1.6, .02, .08), new THREE.MeshBasicMaterial({ color: 0xdddddd })); knobLine.position.set(19.6, TOP + .91, 6.5); deck.add(knobLine);
  for (let i = -4; i <= 4; i++) { const t = mesh(new THREE.BoxGeometry(i === 0 ? 1.4 : .8, .01, .08), new THREE.MeshBasicMaterial({ color: i === 0 ? 0x9b9b9b : 0x555555 }), false, false); t.position.set(18.2, TOP + .012, 6.5 + i * 1.2); deck.add(t); }
  addPrint(deck, 'PITCH', 19.6, -.6, 18);
  // target light
  const tl = mesh(new THREE.CylinderGeometry(.85, .95, 1.4, 32), M.darkMetal); tl.position.set(-20.3, TOP + .7, -15.2); deck.add(tl);
  const tlNeck = mesh(new THREE.CylinderGeometry(.42, .42, 1.6, 20), M.satin); tlNeck.position.set(-20.3, TOP + 2.1, -15.2); deck.add(tlNeck);
  targetLamp = mesh(new THREE.CylinderGeometry(.62, .55, .9, 24), M.blackPlastic); targetLamp.position.set(-20.3, TOP + 3.2, -15.2); deck.add(targetLamp);
  const lampLens = mesh(new THREE.CircleGeometry(.5, 24), M.ledOff); lampLens.rotation.y = Math.PI * .72; lampLens.position.set(-20.3 + .5, TOP + 3.2, -15.2 + .25); deck.add(lampLens);
  targetLamp.userData.lens = lampLens;
  // brand-free model plate
  addPrint(deck, 'DESK HUB  ·  DIRECT DRIVE', 21.4, 16.7, 20, 'right');
  return deck;
}

function addPrint(parent, text, x, z, px = 20, align = 'center') {
  const c = canvas(512, 64), g = c.getContext('2d');
  g.fillStyle = 'rgba(190,190,190,.85)'; g.font = `600 ${px * 1.6}px Manrope, Helvetica, sans-serif`;
  g.textAlign = align; g.textBaseline = 'middle'; g.fillText(spaced(text), align === 'right' ? 506 : 256, 32);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(10, 1.25), new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false }));
  m.rotation.x = -Math.PI / 2; m.position.set(align === 'right' ? x - 5 : x, TOP + .07, z); parent.add(m); SK.prints.push(m);
}

/* ---------------- tonearm kinematics ---------------- */
const ARM = { rest: .045, yaw: .045, lift: 0, target: null, playing: false, t0: 0, phase: 'rest', anim: null };
function tipWorldAt(yaw) {
  const x = tipLocal.x * Math.cos(yaw) + tipLocal.z * Math.sin(yaw), z = -tipLocal.x * Math.sin(yaw) + tipLocal.z * Math.cos(yaw);
  return new THREE.Vector2(PIVOT.x + x, PIVOT.z + z);
}
function yawForRadius(r) {
  let lo = -1.2, hi = ARM.rest; // radius decreases as yaw decreases
  for (let i = 0; i < 40; i++) { const m = (lo + hi) / 2; const t = tipWorldAt(m); const rr = Math.hypot(t.x - C.x, t.y - C.z); if (rr > r) hi = m; else lo = m; }
  return (lo + hi) / 2;
}
const LIFT_ANGLE = .085; // rad, raises stylus ~1.7cm
let seq = [];
function runSeq(steps) { seq = steps.map(s => ({ ...s })); seq.length && (seq[0].start = performance.now()); }
function ease(t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }

function setPlaying(p) {
  if (p === ARM.playing) return; ARM.playing = p; requestRender();
  const yStart = yawForRadius(14.55);
  if (p) {
    ARM.playStart = performance.now();
    runSeq([
      { k: 'lift', from: ARM.lift, to: 1, dur: 450 },
      { k: 'yaw', from: ARM.yaw, to: yStart, dur: 1300 },
      { k: 'lift', from: 1, to: 0, dur: 900, after: () => { ARM.phase = 'groove'; ARM.grooveStart = performance.now(); ARM.grooveYaw = yStart; } },
    ]);
    ARM.phase = 'cue';
  } else {
    ARM.phase = 'return';
    runSeq([
      { k: 'lift', from: ARM.lift, to: 1, dur: 420 },
      { k: 'yaw', from: ARM.yaw, to: ARM.rest, dur: 1300 },
      { k: 'lift', from: 1, to: 0, dur: 520, after: () => { ARM.phase = 'rest'; } },
    ]);
  }
  M.ledOn && (led33.material = p ? M.ledOn : M.ledOff);
  targetLamp.userData.lens.material = p ? M.lampOn : M.ledOff;
}

/* ---------------- camera fit ---------------- */
const BOX = new THREE.Box3(new THREE.Vector3(-W / 2 - 1, 0, -D / 2 - 1), new THREE.Vector3(W / 2 + 1, ARM_Y + 3.5, D / 2 + 1));
let viewT = 0, viewFrom = 0, viewTo = 0, viewStart = 0, VIEW_DUR = 1600;
function setView(v) { viewFrom = viewT; viewTo = v === 'top' ? 1 : 0; viewStart = performance.now(); requestRender(); }
function fit() {
  const w = container.clientWidth, h = container.clientHeight; if (!w || !h) return;
  renderer.setSize(w, h, false); camera.aspect = w / h;
  const e = ease(viewT);
  const target = new THREE.Vector3(0, THREE.MathUtils.lerp(TOP - 1.0, TOP, e), THREE.MathUtils.lerp(1.4, 0, e));
  const el = THREE.MathUtils.degToRad(THREE.MathUtils.lerp(57, 90, e));
  camera.fov = THREE.MathUtils.lerp(26, 20, e);
  // from straight above the studio ceiling lights would mirror in the vinyl: tilt & dim the environment
  scene.environmentIntensity = THREE.MathUtils.lerp(.55, .2, e);
  scene.environmentRotation.set(THREE.MathUtils.lerp(0, 1.05, e), THREE.MathUtils.lerp(0, .5, e), 0);
  M.vinylTop.clearcoat = THREE.MathUtils.lerp(.55, .3, e);
  const dir = new THREE.Vector3(0, Math.sin(el), Math.cos(el)).normalize();
  const mx = THREE.MathUtils.lerp(.97, .94, e), my = THREE.MathUtils.lerp(.95, .92, e);
  const corners = []; for (const x of [BOX.min.x, BOX.max.x]) for (const y of [BOX.min.y, BOX.max.y]) for (const z of [BOX.min.z, BOX.max.z]) corners.push(new THREE.Vector3(x, y, z));
  let lo = 20, hi = 400;
  for (let i = 0; i < 30; i++) {
    const d = (lo + hi) / 2; camera.position.copy(target).addScaledVector(dir, d); camera.lookAt(target); camera.updateProjectionMatrix(); camera.updateMatrixWorld();
    const ok = corners.every(c => { const p = c.clone().project(camera); return Math.abs(p.x) < mx && Math.abs(p.y) < my; });
    if (ok) hi = d; else lo = d;
  }
  camera.position.copy(target).addScaledVector(dir, hi); camera.lookAt(target); camera.updateProjectionMatrix();
  requestRender();
}

/* ---------------- main loop ---------------- */
let last = performance.now(), speed = 0;
function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(.05, (now - last) / 1000); last = now;
  if (paused) return;
  // platter speed (direct drive: quick start, gentle stop)
  const targetSpeed = ARM.playing ? OMEGA : 0;
  const k = ARM.playing ? 3.2 : 1.1;
  speed += (targetSpeed - speed) * (1 - Math.exp(-k * dt));
  if (Math.abs(speed) < 1e-3 && !ARM.playing) speed = 0;
  if (speed) { spinGroup.rotation.y -= speed * dt; needs = true; }
  recSpin.rotation.y = spinGroup.rotation.y + recOffset;
  if (swap) { stepSwap(now); needs = true; }
  // arm sequence
  if (seq.length) {
    const s = seq[0]; const t = Math.min(1, (now - s.start) / s.dur), e = ease(t);
    if (s.k === 'lift') ARM.lift = s.from + (s.to - s.from) * e; else if (s.k === 'yaw') ARM.yaw = s.from + (s.to - s.from) * e;
    if (s.k === 'yawTo') { if (s.from == null) s.from = ARM.yaw; ARM.yaw = s.from + (s.to - s.from) * e; }
    if (t >= 1) { s.after && s.after(); seq.shift(); if (seq.length) seq[0].start = now; }
    needs = true;
  } else if (ARM.phase === 'groove') {
    // slow inward tracking: ~6.5 cm over 25 minutes, then hold
    const el = (now - ARM.grooveStart) / 1000, r = Math.max(7.4, 14.55 - el * (6.5 / 1500));
    ARM.yaw = yawForRadius(r); needs = true;
  }
  if (viewT !== viewTo) { const t = Math.min(1, (now - viewStart) / VIEW_DUR); viewT = viewFrom + (viewTo - viewFrom) * t; fit(); needs = true; }
  armYaw.rotation.y = ARM.yaw;
  armLift.rotation.x = -ARM.lift * LIFT_ANGLE;
  cueLever.rotation.z = ARM.lift * .5;
  if (needs) { renderer.render(scene, camera); needs = false; }
}

/* ---------------- skins ---------------- */
let skin = 'black';
function setSkin(name) {
  skin = name; const acr = name === 'acrylic';
  const mono = name === 'mono';
  SK.plinth.material = name === 'walnut' ? M.walnut : acr ? M.acrylic : mono ? M.mono : M.plinth;
  SK.inlay.material = name === 'walnut' ? M.walnutTop : mono ? M.monoTop : M.plinthTop;
  startBtn.material = mono ? M.red : M.button;
  SK.inlay.visible = !acr;
  SK.plinth.castShadow = !acr;
  SK.inner.visible = acr;
  SK.feet.forEach(f => f.material = acr ? M.chrome : M.rubber);
  M.button.color.set(name === 'walnut' ? 0x16110d : 0x1b1c1e);
  SK.prints.forEach(p => p.material.color.set(acr || mono ? 0x2a2a2a : 0xffffff));
  M.button.color.set(mono ? 0xcfcfcc : name === 'walnut' ? 0x16110d : 0x1b1c1e);
  requestRender();
}

/* ---------------- record swap ---------------- */
let swap = null, recOffset = 0, pending = [];
function swapRecord(dir = 1) {
  const now = performance.now();
  const k = window.__slow || 1; swap = { start: now, dir, phase: 'out', OUT: 520 * k, IN: 620 * k, swapped: false };
  if (ARM.playing) {
    const yStart = yawForRadius(14.55);
    ARM.phase = 'swap';
    runSeq([
      { k: 'lift', from: ARM.lift, to: 1, dur: 260 },
      { k: 'wait', dur: 720 },
      { k: 'yawTo', to: yStart, dur: 420 },
      { k: 'lift', from: 1, to: 0, dur: 600, after: () => { ARM.phase = 'groove'; ARM.grooveStart = performance.now(); } },
    ]);
  }
  requestRender();
}
function stepSwap(now) {
  const t = now - swap.start, away = new THREE.Vector3(C.x - 44 * swap.dir, C.y + 7, C.z - 6);
  if (t < swap.OUT) {
    const e = ease(t / swap.OUT); recHolder.position.lerpVectors(C, away, e);
    recHolder.rotation.z = .12 * swap.dir * e;
  } else {
    if (!swap.swapped) { swap.swapped = true; const p = pending; pending = []; p.forEach(f => f()); recOffset = Math.random() * Math.PI * 2; }
    const ti = Math.min(1, (t - swap.OUT) / swap.IN), e = 1 - Math.pow(1 - ti, 3);
    const from = new THREE.Vector3(C.x - 44 * swap.dir, C.y + 7, C.z + 6);
    recHolder.position.lerpVectors(from, C, e); recHolder.position.y += Math.sin(ti * Math.PI) * .6 * (1 - ti);
    recHolder.rotation.z = .12 * swap.dir * (1 - e);
    if (ti >= 1) { recHolder.position.copy(C); recHolder.rotation.z = 0; swap = null; }
  }
}
function deferIfSwapping(f) { if (swap && !swap.swapped) pending.push(f); else f(); }

/* ---------------- cover loading ---------------- */
let coverToken = 0;
function setCover(url) { deferIfSwapping(() => setCoverNow(url)); }
function setCoverNow(url) {
  const tok = ++coverToken;
  if (!url) { labelState.img = null; drawLabel(); return; }
  const img = new Image(); img.crossOrigin = 'anonymous';
  img.onload = () => { if (tok !== coverToken) return; labelState.img = img; drawLabel(); };
  img.onerror = () => { if (tok !== coverToken) return; labelState.img = null; drawLabel(); };
  img.src = url;
}
function setLabel({ name, sub, color }) { deferIfSwapping(() => { labelState = { ...labelState, name, sub, color, img: null }; coverToken++; drawLabel(); }); }

/* ---------------- init ---------------- */
export function init(el, opts = {}) {
  container = el;
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.domElement.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:manipulation';
  el.appendChild(renderer.domElement);

  scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), .04).texture;
  scene.environmentIntensity = .55;

  camera = new THREE.PerspectiveCamera(26, 1, 1, 1000); camera.up.set(0, 0, -1);

  const key = new THREE.DirectionalLight(0xfff3e4, 2.1);
  key.position.set(-26, 70, 30); key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  Object.assign(key.shadow.camera, { left: -36, right: 36, top: 36, bottom: -36, near: 10, far: 160 });
  key.shadow.bias = -.0004; key.shadow.normalBias = .03; key.shadow.radius = 5;
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xdfe8ff, .55); rim.position.set(40, 30, -40); scene.add(rim);
  scene.add(new THREE.HemisphereLight(0xfff5ea, 0x1a120c, .25));

  buildMaterials();
  const deck = buildDeck(); scene.add(deck);

  // soft ground: shadow catcher + contact shadow
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.ShadowMaterial({ opacity: .28 }));
  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
  const contact = new THREE.Mesh(new THREE.PlaneGeometry(W * 1.35, D * 1.45), new THREE.MeshBasicMaterial({ map: contactShadowTex(), transparent: true, depthWrite: false }));
  contact.rotation.x = -Math.PI / 2; contact.position.y = .02; scene.add(contact);

  // tap → toggle
  const ray = new THREE.Raycaster(), v = new THREE.Vector2();
  renderer.domElement.addEventListener('click', e => {
    const r = renderer.domElement.getBoundingClientRect();
    v.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(v, camera);
    const hit = ray.intersectObjects([spinGroup, recHolder, startBtn], true)[0];
    if (hit && tapHandler) {
      if (hit.object === startBtn) { startBtn.position.y = TOP + .08; setTimeout(() => { startBtn.position.y = TOP + .2; requestRender(); }, 160); }
      tapHandler();
    }
  });

  new ResizeObserver(fit).observe(el); fit();
  armYaw.rotation.y = ARM.rest;
  drawLabel();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(drawLabel);
  requestAnimationFrame(frame);
  return api;
}

const api = {
  setPlaying, setCover, setLabel, setView, swapRecord, setSkin,
  setLabelStyle(st) { labelStyle = st; drawLabel(); },
  onTap(fn) { tapHandler = fn; },
  pause(p) { paused = p; if (!p) { last = performance.now(); requestRender(); } },
};
