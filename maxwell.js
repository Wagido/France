/* Télécoms 1.1 : les équations de Maxwell en images. Champs en 2D (coupe), roue à aubes (rotationnel),
   cercle de Gauss (flux / circulation), et propagation par différences finies (FDTD, schéma de Yee). */
(() => {
"use strict";
const $ = s => document.querySelector(s);
const f2 = v => (Math.abs(v) < 0.005 ? 0 : v).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
let cv, ctx, W = 800, H = 480, scene = "gauss", sub = "charge", t = 0, mouse = { x: 0.15, y: 0.1, in: false }, wheel = 0, rafOn = false, visible = false;
let rad = 0.18, sens = 1, freq = 20;
const X0 = -1, X1 = 1, Y0 = -0.62, Y1 = 0.62;
const sx = x => (x - X0) / (X1 - X0) * W, sy = y => (Y1 - y) / (Y1 - Y0) * H;
const wx = px => X0 + px / W * (X1 - X0), wy = py => Y1 - py / H * (Y1 - Y0);

/* ---------------- champs analytiques (unités arbitraires) ---------------- */
const CHARGES = { charge: [[0, 0, 1]], dipole: [[-0.3, 0, 1], [0.3, 0, -1]], deux: [[-0.3, 0, 1], [0.3, 0, 1]] };
function champ(x, y) {
  if (scene === "gauss") {              // E créé par des charges (fils chargés vus en coupe : E en 1/r)
    let ex = 0, ey = 0;
    for (const [cx, cy, q] of CHARGES[sub]) { const dx = x - cx, dy = y - cy, r2 = dx * dx + dy * dy + 1e-4; ex += q * dx / r2; ey += q * dy / r2; }
    return [ex, ey];
  }
  if (scene === "divb") {               // B de deux fils de courants opposés (coupe d'une boucle de courant)
    let bx = 0, by = 0;
    for (const [cx, cy, I] of [[-0.3, 0, sens], [0.3, 0, -sens]]) { const dx = x - cx, dy = y - cy, r2 = dx * dx + dy * dy + 1e-4; bx += -I * dy / r2; by += I * dx / r2; }
    return [bx, by];
  }
  if (scene === "faraday") {            // B uniforme dans un disque, variable : E induit tourne autour
    const R = 0.3, dB = Math.cos(t), r = Math.hypot(x, y) + 1e-6;
    const et = r < R ? -0.5 * r * dB * 4 : -0.5 * R * R / r * dB * 4;
    return [-et * y / r, et * x / r];
  }
  if (scene === "ampere") {             // fil de rayon a parcouru par un courant uniforme
    const a = 0.12, r = Math.hypot(x, y) + 1e-6, bt = sens * (r < a ? r / (a * a) : 1 / r);
    return [-bt * y / r, bt * x / r];
  }
  return [0, 0];
}
const LBL = { gauss: "E", divb: "B", faraday: "E", ampere: "B" };
function divRot(x, y) {
  const h = 0.004, [ax, ay] = champ(x + h, y), [bx, by] = champ(x - h, y), [cx, cy] = champ(x, y + h), [dx, dy] = champ(x, y - h);
  return [(ax - bx + cy - dy) / (2 * h), (ay - by - (cx - dx)) / (2 * h)];
}
function recouvrement(d, r1, r2) {      // aire commune de deux disques (rayons r1, r2, centres à distance d)
  if (d >= r1 + r2) return 0;
  if (d <= Math.abs(r1 - r2)) return Math.PI * Math.min(r1, r2) ** 2;
  const a = Math.acos((d * d + r1 * r1 - r2 * r2) / (2 * d * r1)), b = Math.acos((d * d + r2 * r2 - r1 * r1) / (2 * d * r2));
  return r1 * r1 * a + r2 * r2 * b - 0.5 * Math.sqrt((-d + r1 + r2) * (d + r1 - r2) * (d - r1 + r2) * (d + r1 + r2));
}
function fluxCirc(x, y, r) {             // flux sortant et circulation sur un cercle
  let fl = 0, ci = 0; const n = 360;
  for (let k = 0; k < n; k++) {
    const a = 2 * Math.PI * k / n, nx = Math.cos(a), ny = Math.sin(a), [fx, fy] = champ(x + r * nx, y + r * ny);
    fl += (fx * nx + fy * ny) * r * 2 * Math.PI / n; ci += (-fx * ny + fy * nx) * r * 2 * Math.PI / n;
  }
  return [fl, ci];
}

/* ---------------- dessin des champs ---------------- */
function fond() {
  ctx.fillStyle = "#0f172a"; ctx.fillRect(0, 0, W, H);
  if (scene === "faraday") {
    const b = Math.sin(t), R = 0.3;
    ctx.fillStyle = b > 0 ? `rgba(239,68,68,${0.15 + 0.5 * Math.abs(b)})` : `rgba(59,130,246,${0.15 + 0.5 * Math.abs(b)})`;
    ctx.beginPath(); ctx.arc(sx(0), sy(0), R / (X1 - X0) * W, 0, 7); ctx.fill();
    ctx.fillStyle = "#e2e8f0"; ctx.font = "12px sans-serif";
    ctx.fillText(`B ${b >= 0 ? "sort de l'écran" : "entre dans l'écran"} (${f2(b)}) ; il ${Math.cos(t) > 0 ? "augmente" : "diminue"}`, sx(-0.29), sy(0.34));
  }
  if (scene === "ampere") {
    ctx.fillStyle = "rgba(250,204,21,.35)"; ctx.beginPath(); ctx.arc(sx(0), sy(0), 0.12 / (X1 - X0) * W, 0, 7); ctx.fill();
    ctx.fillStyle = "#facc15"; ctx.font = "bold 16px sans-serif"; ctx.fillText(sens > 0 ? "⊙" : "⊗", sx(0) - 7, sy(0) + 6);
  }
  if (scene === "divb") for (const [cx, , I] of [[-0.3, 0, sens], [0.3, 0, -sens]]) {
    ctx.fillStyle = "#facc15"; ctx.font = "bold 18px sans-serif"; ctx.fillText(I > 0 ? "⊙" : "⊗", sx(cx) - 8, sy(0) + 6);
  }
  if (scene === "gauss") for (const [cx, cy, q] of CHARGES[sub]) {
    ctx.fillStyle = q > 0 ? "#ef4444" : "#3b82f6"; ctx.beginPath(); ctx.arc(sx(cx), sy(cy), 11, 0, 7); ctx.fill();
    ctx.fillStyle = "#fff"; ctx.font = "bold 16px sans-serif"; ctx.fillText(q > 0 ? "+" : "−", sx(cx) - 5, sy(cy) + 6);
  }
}
function fleches() {
  const nx = 30, ny = 19, col = scene === "gauss" || scene === "faraday" ? [251, 146, 60] : [94, 234, 212];
  for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) {
    const x = X0 + (i + 0.5) / nx * (X1 - X0), y = Y0 + (j + 0.5) / ny * (Y1 - Y0), [fx, fy] = champ(x, y), m = Math.hypot(fx, fy);
    if (m < 1e-6) continue;
    const ref = { gauss: 9, divb: 9, faraday: 0.35, ampere: 6 }[scene], q = Math.sqrt(m / ref);
    const L = Math.min(1, q) * 22, ux = fx / m, uy = -fy / m, px = sx(x), py = sy(y);
    const a = Math.min(1, 0.3 + q);
    ctx.strokeStyle = ctx.fillStyle = `rgba(${col},${a})`; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(px - ux * L / 2, py - uy * L / 2); ctx.lineTo(px + ux * L / 2, py + uy * L / 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(px + ux * L / 2, py + uy * L / 2); ctx.lineTo(px + ux * L / 2 - ux * 5 - uy * 3, py + uy * L / 2 - uy * 5 + ux * 3); ctx.lineTo(px + ux * L / 2 - ux * 5 + uy * 3, py + uy * L / 2 - uy * 5 - ux * 3); ctx.fill();
  }
}
function sonde() {
  const x = mouse.x, y = mouse.y, [dv, rt] = divRot(x, y), [fl, ci] = fluxCirc(x, y, rad);
  const px = sx(x), py = sy(y), pr = rad / (X1 - X0) * W;
  ctx.strokeStyle = "#f8fafc"; ctx.setLineDash([5, 4]); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(px, py, pr, 0, 7); ctx.stroke(); ctx.setLineDash([]);
  // roue à aubes : tourne à la vitesse du rotationnel local
  wheel += -rt * 0.004;
  ctx.save(); ctx.translate(px, py); ctx.rotate(wheel); ctx.strokeStyle = "#f8fafc"; ctx.lineWidth = 2;
  for (let k = 0; k < 4; k++) { ctx.rotate(Math.PI / 2); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(16, 0); ctx.stroke(); ctx.fillStyle = "#f8fafc"; ctx.fillRect(14, -4, 4, 8); }
  ctx.restore();
  const F = LBL[scene];
  let qenc = 0; if (scene === "gauss") for (const [cx, cy, q] of CHARGES[sub]) if (Math.hypot(cx - x, cy - y) < rad) qenc += q;
  const txt = [
    `div ${F} ici : ${Math.abs(dv) > 500 ? "très grande (vous êtes sur une charge)" : f2(dv)}   |   rot ${F} ici : ${Math.abs(dv) > 500 || Math.abs(rt) > 500 ? "non défini (point singulier)" : f2(rt)}`,
    `Flux de ${F} sortant du cercle : ${f2(fl / (2 * Math.PI))} × 2π   |   Circulation de ${F} sur le cercle : ${f2(ci / (2 * Math.PI))} × 2π`
  ];
  if (scene === "gauss") txt.push(`Charge à l'intérieur du cercle : ${qenc > 0 ? "+" : ""}${qenc}  →  le flux vaut charge × 2π (Gauss)`);
  if (scene === "faraday") { const A = recouvrement(Math.hypot(x, y), rad, 0.3); txt.push(`−dΦ/dt (variation du flux de B à travers le cercle) : ${f2(-4 * Math.cos(t) * A / (2 * Math.PI))} × 2π  →  égal à la circulation de E (Faraday)`); }
  if (scene === "ampere") { const a = 0.12, A = recouvrement(Math.hypot(x, y), rad, a); txt.push(`Courant qui traverse le cercle : ${f2(sens * A / (Math.PI * a * a))} (fraction du courant du fil)  →  la circulation de B vaut ce courant × 2π (Ampère)`); }
  ctx.fillStyle = "rgba(15,23,42,.8)"; ctx.fillRect(0, H - 18 * txt.length - 8, W, 18 * txt.length + 8);
  ctx.fillStyle = "#e2e8f0"; ctx.font = "12.5px sans-serif"; txt.forEach((s, i) => ctx.fillText(s, 10, H - 18 * (txt.length - i) + 6));
}

/* ---------------- propagation : FDTD 2D (mode TM : Ez, Hx, Hy) ---------------- */
let NX = 240, NY = 150, Ez, Hx, Hy, mur, damp, step = 0, img, off, octx;
function initFDTD() {
  Ez = new Float32Array(NX * NY); Hx = new Float32Array(NX * NY); Hy = new Float32Array(NX * NY); mur = new Uint8Array(NX * NY); damp = new Float32Array(NX * NY); step = 0;
  const P = 22;
  for (let i = 0; i < NX; i++) for (let j = 0; j < NY; j++) {
    const d = Math.min(i, j, NX - 1 - i, NY - 1 - j), s = d < P ? Math.pow((P - d) / P, 3) * 0.35 : 0;
    damp[i + j * NX] = 1 - s;
  }
  const xm = Math.round(NX * 0.55);
  if (sub === "fente" || sub === "deux" || sub === "mur") for (let j = 0; j < NY; j++) for (let i = xm; i < xm + 3; i++) {
    const c = NY / 2, ouvert = sub === "fente" ? Math.abs(j - c) < 6 : sub === "deux" ? (Math.abs(j - c - 14) < 4 || Math.abs(j - c + 14) < 4) : false;
    if (!ouvert) mur[i + j * NX] = 1;
  }
  off = document.createElement("canvas"); off.width = NX; off.height = NY; octx = off.getContext("2d"); img = octx.createImageData(NX, NY);
}
function pasFDTD() {
  const S = 0.5, lam = freq;  // cellules par longueur d'onde
  for (let j = 0; j < NY - 1; j++) for (let i = 0; i < NX; i++) { const k = i + j * NX; Hx[k] = (Hx[k] - S * (Ez[k + NX] - Ez[k])) * damp[k]; }
  for (let j = 0; j < NY; j++) for (let i = 0; i < NX - 1; i++) { const k = i + j * NX; Hy[k] = (Hy[k] + S * (Ez[k + 1] - Ez[k])) * damp[k]; }
  for (let j = 1; j < NY; j++) for (let i = 1; i < NX; i++) {
    const k = i + j * NX;
    if (mur[k]) { Ez[k] = 0; continue; }
    Ez[k] = (Ez[k] + S * ((Hy[k] - Hy[k - 1]) - (Hx[k] - Hx[k - NX]))) * damp[k];
  }
  step++;
  const w = 2 * Math.PI * S / lam, env = Math.min(1, step / 40);
  if (sub === "antenne") Ez[Math.round(NX * 0.4) + Math.round(NY / 2) * NX] += Math.sin(w * step) * env * 1.5;
  else for (let j = 24; j < NY - 24; j++) Ez[26 + j * NX] += Math.sin(w * step) * env * 0.35;   // onde plane venant de la gauche
}
function dessinFDTD() {
  for (let k = 0; k < 3; k++) pasFDTD();
  const d = img.data;
  for (let k = 0; k < NX * NY; k++) {
    const v = Math.max(-1, Math.min(1, Ez[k] * 1.6)), p = k * 4;
    if (mur[k]) { d[p] = 148; d[p + 1] = 163; d[p + 2] = 184; d[p + 3] = 255; continue; }
    d[p] = v > 0 ? 15 + 240 * v : 15; d[p + 1] = 23 + 60 * Math.abs(v); d[p + 2] = v < 0 ? 42 - 220 * v : 42; d[p + 3] = 255;
  }
  octx.putImageData(img, 0, 0);
  ctx.imageSmoothingEnabled = true; ctx.drawImage(off, 0, 0, W, H);
  if ($("#mx-h").checked) {        // flèches du champ magnétique H (dans le plan)
    ctx.strokeStyle = "rgba(94,234,212,.8)"; ctx.lineWidth = 1;
    for (let i = 6; i < NX; i += 8) for (let j = 6; j < NY; j += 8) {
      const k = i + j * NX, hx = Hx[k], hy = Hy[k], m = Math.hypot(hx, hy); if (m < 0.01) continue;
      const L = Math.min(12, m * 30), px = i / NX * W, py = j / NY * H;
      ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + hx / m * L, py + hy / m * L); ctx.stroke();
    }
  }
  ctx.fillStyle = "rgba(15,23,42,.75)"; ctx.fillRect(0, H - 26, W, 26); ctx.fillStyle = "#e2e8f0"; ctx.font = "12.5px sans-serif";
  ctx.fillText(`Couleur : champ électrique Ez (rouge vers l'avant, bleu vers l'arrière de l'écran)${$("#mx-h").checked ? " ; traits verts : champ magnétique dans le plan" : ""}. Les bords absorbent l'onde.`, 10, H - 9);
}

/* ---------------- boucle ---------------- */
function frame() {
  if (!visible) { rafOn = false; return; }
  t += 0.03;
  if (scene === "onde") dessinFDTD(); else { fond(); fleches(); sonde(); }
  requestAnimationFrame(frame);
}
function demarrer() { if (!rafOn && visible) { rafOn = true; requestAnimationFrame(frame); } }
function texte() {
  const T = {
    gauss: "<b>Gauss pour E : div E = ρ / ε₀.</b> Les charges sont les <b>sources</b> du champ électrique : il sort des charges + et rentre dans les charges −. La divergence mesure « combien il en sort » d'un tout petit volume : elle n'est non nulle que sur les charges. Déplacez le cercle : le flux sortant ne dépend que de la charge à l'intérieur, pas de la taille du cercle. La roue ne tourne nulle part : rot E = 0 (pas de B variable ici).",
    divb: "<b>Gauss pour B : div B = 0.</b> Il n'existe pas de « charge magnétique » (de monopôle) : les lignes du champ magnétique se referment toujours sur elles-mêmes. Ici, la coupe d'une boucle de courant (deux fils de sens opposés). Quel que soit le cercle, autant de champ y entre qu'il en sort : le flux vaut toujours 0. Couper un aimant en deux donne deux aimants, jamais un pôle nord seul.",
    faraday: "<b>Faraday : rot E = −∂B/∂t.</b> Un champ magnétique qui <b>varie</b> fait apparaître un champ électrique qui <b>tourne</b> autour de lui. C'est le principe de l'alternateur, du transformateur et de la plaque à induction. Dans le disque (où B varie), la roue à aubes tourne : rot E ≠ 0. À l'extérieur, E tourne encore autour du disque, mais la roue ne tourne plus : un champ peut « tourner autour » sans avoir de rotationnel local. La circulation de E sur le cercle vaut −dΦ/dt, le flux de B qui varie à l'intérieur.",
    ampere: "<b>Ampère (sans le terme de Maxwell) : rot B = μ₀ J.</b> Un courant électrique fait tourner un champ magnétique autour de lui (la règle de la main droite). La roue à aubes tourne seulement <b>dans</b> le fil, là où passe le courant ; dehors, B tourne autour du fil mais son rotationnel est nul. La circulation de B sur le cercle ne dépend que du courant qui le traverse : c'est le théorème d'Ampère. Maxwell a ajouté en 1865 un second terme, μ₀ε₀ ∂E/∂t : un champ électrique qui varie agit comme un courant (le « courant de déplacement »). C'est ce terme qui rend les ondes possibles.",
    onde: "<b>Les quatre ensemble : l'onde.</b> Ici, la machine résout directement les deux équations de rotationnel, pas à pas dans le temps (méthode FDTD de Yee, 1966) : un E qui varie crée un B qui tourne (Ampère-Maxwell), ce B qui varie crée un E qui tourne (Faraday), et ainsi de suite. Le champ se « détache » de la source et part à la vitesse c = 1/√(μ₀ε₀) ≈ 300 000 km/s : en calculant cette vitesse à partir de mesures purement électriques et magnétiques, Maxwell a compris en 1865 que la lumière est une onde électromagnétique. Essayez la fente (diffraction), les deux fentes (interférences, comme l'expérience de Young) et le mur (réflexion : c'est pourquoi le béton armé gêne le wifi)."
  };
  $("#mx-txt").innerHTML = T[scene];
}
function controles() {
  const subs = { gauss: [["charge", "une charge +"], ["dipole", "+ et −"], ["deux", "deux charges +"]], divb: [["1", "courant dans un sens"], ["-1", "courant inversé"]], faraday: [], ampere: [["1", "courant vers vous ⊙"], ["-1", "courant vers l'écran ⊗"]], onde: [["antenne", "antenne"], ["fente", "mur avec une fente"], ["deux", "deux fentes"], ["mur", "mur plein"]] };
  $("#mx-sub").innerHTML = subs[scene].map(([v, l]) => `<button type="button" data-v="${v}" aria-pressed="${(scene === "gauss" || scene === "onde") ? v === sub : +v === sens}">${l}</button>`).join("");
  $("#mx-sub").querySelectorAll("button").forEach(b => b.onclick = () => {
    if (scene === "gauss" || scene === "onde") sub = b.dataset.v; else sens = +b.dataset.v;
    $("#mx-sub").querySelectorAll("button").forEach(o => o.setAttribute("aria-pressed", o === b)); if (scene === "onde") initFDTD();
  });
  $("#mx-rad-l").hidden = scene === "onde"; $("#mx-f-l").hidden = $("#mx-h-l").hidden = scene !== "onde";
}
function init() {
  cv = $("#mx-canvas"); if (!cv) return;
  ctx = cv.getContext("2d");
  const resize = () => { W = Math.min(900, cv.parentElement.clientWidth || 800); H = Math.round(W * 0.6); cv.width = W; cv.height = H; };
  resize(); addEventListener("resize", resize);
  document.querySelectorAll("#mx-scene button").forEach(b => b.onclick = () => {
    scene = b.dataset.s; sub = scene === "gauss" ? "charge" : scene === "onde" ? "antenne" : sub; sens = 1;
    document.querySelectorAll("#mx-scene button").forEach(o => o.setAttribute("aria-pressed", o === b));
    if (scene === "onde") initFDTD(); controles(); texte();
  });
  $("#mx-rad").oninput = e => { rad = +e.target.value; };
  $("#mx-f").oninput = e => { freq = +e.target.value; };
  const pos = e => { const r = cv.getBoundingClientRect(), p = e.touches ? e.touches[0] : e; mouse.x = wx((p.clientX - r.left) * W / r.width); mouse.y = wy((p.clientY - r.top) * H / r.height); };
  cv.addEventListener("mousemove", pos); cv.addEventListener("touchmove", e => { pos(e); e.preventDefault(); }, { passive: false });
  cv.addEventListener("click", e => { if (scene === "onde") { pos(e); const i = Math.round((mouse.x - X0) / (X1 - X0) * NX), j = Math.round((Y1 - mouse.y) / (Y1 - Y0) * NY); for (let a = -2; a <= 2; a++) for (let b = -2; b <= 2; b++) { const k = i + a + (j + b) * NX; if (k >= 0 && k < NX * NY) Ez[k] += 3; } } });
  new IntersectionObserver(es => { visible = es[0].isIntersecting; demarrer(); }).observe(cv);
  controles(); texte();
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
