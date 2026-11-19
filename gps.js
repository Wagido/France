/* Télécoms, chapitre 17 : le GPS de A à Z. Simulateur de corrélation (acquisition) et de trilatération. */
(() => {
"use strict";
const $ = s => document.querySelector(s);
const f0 = v => Math.round(v).toLocaleString("fr-FR"), f1 = v => v.toLocaleString("fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

/* ---------- codes C/A (norme IS-GPS-200 : registres G1 et G2) ---------- */
const SEL = { 1: [2, 6], 2: [3, 7], 3: [4, 8], 4: [5, 9], 5: [1, 9], 6: [2, 10], 7: [1, 8], 8: [2, 9], 9: [3, 10], 10: [2, 3] };
function codeCA(prn) {
  const g1 = Array(10).fill(1), g2 = Array(10).fill(1), out = new Int8Array(1023), [a, b] = SEL[prn];
  for (let i = 0; i < 1023; i++) {
    out[i] = (g1[9] ^ g2[a - 1] ^ g2[b - 1]) ? -1 : 1;
    const f1 = g1[2] ^ g1[9], f2 = g2[1] ^ g2[2] ^ g2[5] ^ g2[7] ^ g2[8] ^ g2[9];
    g1.pop(); g1.unshift(f1); g2.pop(); g2.unshift(f2);
  }
  return out;
}

/* ---------- FFT radix 2 en place ---------- */
function fft(re, im, inv) {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) { [re[i], re[j]] = [re[j], re[i]]; [im[i], im[j]] = [im[j], im[i]]; }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = 2 * Math.PI / len * (inv ? 1 : -1), wr = Math.cos(ang), wi = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let cr = 1, ci = 0;
      for (let k = 0; k < len / 2; k++) {
        const ar = re[i + k + len / 2] * cr - im[i + k + len / 2] * ci, ai = re[i + k + len / 2] * ci + im[i + k + len / 2] * cr;
        re[i + k + len / 2] = re[i + k] - ar; im[i + k + len / 2] = im[i + k] - ai;
        re[i + k] += ar; im[i + k] += ai;
        const t = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = t;
      }
    }
  }
  if (inv) for (let i = 0; i < n; i++) { re[i] /= n; im[i] /= n; }
}

/* ---------- simulateur 1 : acquisition par corrélation ---------- */
const N = 2048, FS = 2.048e6, FC = 1.023e6;   // 1 ms de signal à 2,048 Méchantillons/s (comme une clé RTL-SDR)
let rngSeed = 12345;
const rnd = () => { rngSeed = (rngSeed * 1103515245 + 12345) & 0x7fffffff; return rngSeed / 0x7fffffff; };
const gauss = () => { let u = 0; while (u === 0) u = rnd(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rnd()); };
function echantillons(code, delaiChips, dopplerHz, t0) {
  const re = new Float64Array(N), im = new Float64Array(N);
  for (let n = 0; n < N; n++) {
    let c = Math.floor((n * FC / FS - delaiChips) % 1023); if (c < 0) c += 1023;
    const ph = 2 * Math.PI * dopplerHz * (t0 + n / FS);
    re[n] = code[c] * Math.cos(ph); im[n] = code[c] * Math.sin(ph);
  }
  return [re, im];
}
function acquisition() {
  const el = $("#gps-corr"); if (!el) return;
  const snr = +$("#gps-snr").value, ms = +$("#gps-ms").value, prnCherche = +$("#gps-prn").value, dfErr = +$("#gps-df").value;
  $("#gps-snr-v").textContent = snr + " dB"; $("#gps-ms-v").textContent = ms + " ms"; $("#gps-df-v").textContent = dfErr + " Hz";
  rngSeed = 4242;
  const PRN_VRAI = 7, DELAI = 400.5, DOPPLER = 2350;          // satellite présent dans le signal
  const vrai = codeCA(PRN_VRAI), rep = codeCA(prnCherche);
  const amp = Math.pow(10, snr / 20), sig = 1 / Math.SQRT2;   // bruit complexe de puissance 1
  const acc = new Float64Array(N);
  const [rr, ri] = echantillons(rep, 0, 0, 0);   // réplique locale (sans Doppler : on l'enlève du signal)
  fft(rr, ri, false);
  for (let m = 0; m < ms; m++) {
    const [sr, si] = echantillons(vrai, DELAI, DOPPLER, m * 1e-3);
    const xr = new Float64Array(N), xi = new Float64Array(N);
    const fEst = DOPPLER + dfErr;                                 // fréquence testée par le récepteur
    for (let n = 0; n < N; n++) {
      const yr = amp * sr[n] + sig * gauss(), yi = amp * si[n] + sig * gauss();
      const ph = -2 * Math.PI * fEst * (m * 1e-3 + n / FS), c = Math.cos(ph), s = Math.sin(ph);
      xr[n] = yr * c - yi * s; xi[n] = yr * s + yi * c;             // on retire la fréquence supposée
    }
    fft(xr, xi, false);
    for (let k = 0; k < N; k++) { const a = xr[k], b = xi[k]; xr[k] = a * rr[k] + b * ri[k]; xi[k] = b * rr[k] - a * ri[k]; }
    fft(xr, xi, true);
    for (let k = 0; k < N; k++) acc[k] += xr[k] * xr[k] + xi[k] * xi[k];
  }
  let kmax = 0; for (let k = 1; k < N; k++) if (acc[k] > acc[kmax]) kmax = k;
  let s = 0, s2 = 0, c = 0; for (let k = 0; k < N; k++) if (Math.abs(k - kmax) > 4 && Math.abs(k - kmax) < N - 4) { s += acc[k]; s2 += acc[k] * acc[k]; c++; }
  const moy = s / c, sd = Math.sqrt(Math.max(1e-12, s2 / c - moy * moy)), ratio = (acc[kmax] - moy) / sd;   // en écarts-types du bruit
  const detecte = ratio > 9;
  const delaiTrouve = kmax * FC / FS;
  // graphique
  const W = Math.max(520, el.clientWidth || 760), H = 230, mg = { l: 40, r: 12, t: 12, b: 30 };
  const x = d3.scaleLinear().domain([0, 1023]).range([mg.l, W - mg.r]);
  const ymax = d3.max(acc) || 1, y = d3.scaleLinear().domain([0, ymax]).range([H - mg.b, mg.t]);
  const pts = Array.from(acc, (v, k) => [k * FC / FS, v]);
  const svg = d3.create("svg").attr("viewBox", `0 0 ${W} ${H}`).attr("width", "100%").style("font-size", "11px");
  svg.append("g").attr("transform", `translate(0,${H - mg.b})`).call(d3.axisBottom(x).ticks(8).tickFormat(v => v + " chips"));
  svg.append("path").datum(pts).attr("fill", "none").attr("stroke", detecte ? "#16a34a" : "#94a3b8").attr("stroke-width", 1).attr("d", d3.line().x(d => x(d[0])).y(d => y(d[1])));
  svg.append("line").attr("x1", x(DELAI)).attr("x2", x(DELAI)).attr("y1", mg.t).attr("y2", H - mg.b).attr("stroke", "#dc2626").attr("stroke-dasharray", "4 3").attr("opacity", .6);
  svg.append("text").attr("x", x(DELAI) + 4).attr("y", mg.t + 10).style("fill", "#dc2626").text("vrai décalage");
  el.replaceChildren(svg.node());
  const okPrn = prnCherche === PRN_VRAI;
  $("#gps-corr-out").innerHTML = `<b style="color:${detecte ? "var(--pos)" : "var(--neg)"}">${detecte ? "Satellite détecté" : "Rien de détecté"}</b> : le pic dépasse le niveau moyen du bruit de ${f1(ratio)} fois ses fluctuations (écart-type) ; seuil de détection ≈ 9${detecte ? `, décalage trouvé ${f1(delaiTrouve)} chips (vrai : ${DELAI})` : ""}. ${!okPrn ? "Vous cherchez le code d'un autre satellite : il ne ressemble pas au signal reçu, aucun pic n'apparaît, quel que soit le temps d'intégration." : Math.abs(dfErr) > 500 ? "La fréquence testée est trop loin du vrai Doppler : sur 1 ms, la phase tourne et la somme s'annule. Le récepteur doit tester les fréquences par pas d'environ 500 Hz." : !detecte ? "Le signal est trop faible pour cette durée : augmentez le temps d'intégration : en additionnant plusieurs millisecondes, les fluctuations du bruit se moyennent et le pic finit par émerger." : "Le pic sort du bruit : la corrélation sur 2 048 échantillons a « concentré » l'énergie du code."}`;
}

/* ---------- simulateur 2 : trilatération 2D ---------- */
const C = 299792458, RT = 6371e3, RS = 26560e3;
function trilat() {
  const el = $("#gps-tri"); if (!el) return;
  const ouv = +$("#gps-ouv").value, biais = +$("#gps-biais").value, bruit = +$("#gps-bruit").value, horloge = $("#gps-hor").checked;
  $("#gps-ouv-v").textContent = ouv + "°"; $("#gps-biais-v").textContent = f1(biais) + " µs"; $("#gps-bruit-v").textContent = bruit + " m";
  rngSeed = 777;
  const r = [0, RT];                                               // récepteur au « sommet » de la Terre (vue en coupe)
  const angles = [-ouv / 2, -ouv / 6, ouv / 6, ouv / 2].map(a => a * Math.PI / 180);
  const sats = angles.map(a => [RS * Math.sin(a), RS * Math.cos(a)]);
  const dist = s => Math.hypot(s[0] - r[0], s[1] - r[1]);
  const rho = sats.map(s => dist(s) + C * biais * 1e-6 + bruit * gauss());
  // Gauss-Newton : inconnues (x, y) ou (x, y, b)
  let p = [0, RT - 1e4], b = 0;
  for (let it = 0; it < 12; it++) {
    const H = [], res = [];
    sats.forEach((s, i) => {
      const d = Math.hypot(s[0] - p[0], s[1] - p[1]), ux = (p[0] - s[0]) / d, uy = (p[1] - s[1]) / d;
      H.push(horloge ? [ux, uy, 1] : [ux, uy]); res.push(rho[i] - (d + b));
    });
    const n = H[0].length, A = Array.from({ length: n }, () => Array(n).fill(0)), v = Array(n).fill(0);
    H.forEach((h, i) => { for (let a = 0; a < n; a++) { v[a] += h[a] * res[i]; for (let c = 0; c < n; c++) A[a][c] += h[a] * h[c]; } });
    const dx = resoudre(A, v); p = [p[0] + dx[0], p[1] + dx[1]]; if (horloge) b += dx[2];
  }
  const err = Math.hypot(p[0] - r[0], p[1] - r[1]);
  // dilution de précision (DOP) avec les inconnues choisies
  const Hd = sats.map(s => { const d = dist(s); const u = [(r[0] - s[0]) / d, (r[1] - s[1]) / d]; return horloge ? [...u, 1] : u; });
  const n = Hd[0].length, A = Array.from({ length: n }, () => Array(n).fill(0));
  Hd.forEach(h => { for (let a = 0; a < n; a++) for (let c = 0; c < n; c++) A[a][c] += h[a] * h[c]; });
  const Ai = inverse(A), dop = Math.sqrt(Ai[0][0] + Ai[1][1]);
  // dessin : à gauche la géométrie, à droite le zoom autour du récepteur
  const W = Math.max(560, el.clientWidth || 800), H = 320, half = W / 2;
  const svg = d3.create("svg").attr("viewBox", `0 0 ${W} ${H}`).attr("width", "100%").style("font-size", "11px");
  const g1 = svg.append("g"), sc = (H - 30) / (RS * 2.1), ox = half / 2, oy = H - 20 - RT * sc * 0.2;
  const P = q => [ox + q[0] * sc, oy - (q[1] - RT * 0.8) * sc];
  g1.append("circle").attr("cx", P([0, 0])[0]).attr("cy", P([0, 0])[1]).attr("r", RT * sc).attr("fill", "#bfdbfe").attr("stroke", "#3b82f6");
  sats.forEach(s => { const a = P(s), bb = P(r); g1.append("line").attr("x1", a[0]).attr("y1", a[1]).attr("x2", bb[0]).attr("y2", bb[1]).attr("stroke", "#94a3b8").attr("stroke-dasharray", "3 3"); g1.append("circle").attr("cx", a[0]).attr("cy", a[1]).attr("r", 5).attr("fill", "#f59e0b"); });
  const pr = P(r); g1.append("circle").attr("cx", pr[0]).attr("cy", pr[1]).attr("r", 4).attr("fill", "#dc2626");
  g1.append("text").attr("x", 8).attr("y", 14).style("fill", "var(--ink)").style("font-weight", 600).text("Vue d'ensemble : 4 satellites à 20 200 km");
  // zoom
  const g2 = svg.append("g").attr("transform", `translate(${half},0)`), Z = Math.max(30, err * 2.5, Math.abs(C * biais * 1e-6) * (horloge ? 0 : 1.5) + 30);
  const zx = d3.scaleLinear().domain([-Z, Z]).range([20, half - 20]), zy = d3.scaleLinear().domain([-Z, Z]).range([H - 20, 30]);
  g2.append("rect").attr("x", 20).attr("y", 30).attr("width", half - 40).attr("height", H - 50).attr("fill", "none").attr("stroke", "var(--line)");
  sats.forEach((s, i) => {
    const d = dist(s), u = [(s[0] - r[0]) / d, (s[1] - r[1]) / d], R = rho[i] - b, off = d - R;   // ligne : u·q = off
    const t = [-u[1], u[0]], L = Z * 3, c0 = [u[0] * off, u[1] * off];
    g2.append("line").attr("x1", zx(c0[0] - t[0] * L)).attr("y1", zy(c0[1] - t[1] * L)).attr("x2", zx(c0[0] + t[0] * L)).attr("y2", zy(c0[1] + t[1] * L)).attr("stroke", "#f59e0b").attr("stroke-width", 1.5).attr("clip-path", "url(#gpsclip)");
  });
  g2.append("clipPath").attr("id", "gpsclip").append("rect").attr("x", 20).attr("y", 30).attr("width", half - 40).attr("height", H - 50);
  g2.append("circle").attr("cx", zx(0)).attr("cy", zy(0)).attr("r", 5).attr("fill", "#dc2626");
  g2.append("circle").attr("cx", zx(p[0] - r[0])).attr("cy", zy(p[1] - r[1])).attr("r", 5).attr("fill", "none").attr("stroke", "#16a34a").attr("stroke-width", 2.5);
  g2.append("text").attr("x", 20).attr("y", 14).style("fill", "var(--ink)").style("font-weight", 600).text(`Zoom (±${f0(Z)} m) : rouge = vraie position, vert = calculée`);
  g2.append("text").attr("x", 20).attr("y", 26).style("fill", "var(--muted)").text("traits orange : distance mesurée à chaque satellite");
  el.replaceChildren(svg.node());
  $("#gps-tri-out").innerHTML = `Erreur de position : <b style="color:${err > 50 ? "var(--neg)" : "var(--pos)"}">${err < 1000 ? f1(err) + " m" : f1(err / 1000) + " km"}</b>. Dilution de précision (DOP) : <b>${f1(dop)}</b>${horloge ? `, horloge estimée : ${f1(b / C * 1e6)} µs (vraie : ${f1(biais)} µs)` : ""}. ${!horloge && Math.abs(biais) > 0.01 ? "Sans estimer l'horloge, toutes les distances sont faussées de c × biais (300 m par microseconde) : les traits orange ne se croisent plus en un point. Cochez « estimer l'horloge » : avec une inconnue de plus, le récepteur la retrouve." : horloge && ouv < 40 ? "Satellites trop regroupés : les traits sont presque parallèles, le moindre bruit déplace beaucoup leur intersection (DOP élevée)." : "Avec des satellites bien répartis, l'erreur reste de l'ordre du bruit de mesure."}`;
}
function resoudre(A, v) {   // Gauss
  const n = v.length, M = A.map((r, i) => [...r, v[i]]);
  for (let c = 0; c < n; c++) {
    let p = c; for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
    [M[c], M[p]] = [M[p], M[c]];
    for (let r = 0; r < n; r++) if (r !== c) { const f = M[r][c] / M[c][c]; for (let k = c; k <= n; k++) M[r][k] -= f * M[c][k]; }
  }
  return M.map((r, i) => r[n] / r[i]);
}
function inverse(A) {   // colonnes de l'inverse : A x = e_j
  const n = A.length, cols = Array.from({ length: n }, (_, j) => resoudre(A, Array.from({ length: n }, (_, i) => i === j ? 1 : 0)));
  return cols[0].map((_, i) => cols.map(c => c[i]));
}

function init() {
  if (!$("#gps-corr")) return;
  ["#gps-snr", "#gps-ms", "#gps-prn", "#gps-df"].forEach(s => $(s).addEventListener("input", acquisition));
  ["#gps-ouv", "#gps-biais", "#gps-bruit", "#gps-hor"].forEach(s => $(s).addEventListener("input", trilat));
  acquisition(); trilat();
  addEventListener("hashchange", () => { if (location.hash === "#telecom") setTimeout(() => { acquisition(); trilat(); }, 50); });
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
