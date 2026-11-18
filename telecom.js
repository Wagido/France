/* Onglet Télécommunications : ondes, antennes, propagation, signal, systèmes */
(() => {
"use strict";
const $ = s => document.querySelector(s);
const fr = (v, d = 0) => v == null ? "–" : v.toLocaleString("fr-FR", { minimumFractionDigits: d, maximumFractionDigits: d });
const C = 299792458;
const fHz = v => v >= 1e12 ? fr(v / 1e12, v < 1e13 ? 1 : 0) + " THz" : v >= 1e9 ? fr(v / 1e9, v < 1e10 ? 2 : 1) + " GHz" : v >= 1e6 ? fr(v / 1e6, v < 1e7 ? 2 : 1) + " MHz" : v >= 1e3 ? fr(v / 1e3, 1) + " kHz" : fr(v) + " Hz";
const lam = m => m >= 1000 ? fr(m / 1000, m < 1e4 ? 1 : 0) + " km" : m >= 1 ? fr(m, m < 10 ? 2 : 0) + " m" : m >= 0.01 ? fr(m * 100, 1) + " cm" : m >= 1e-3 ? fr(m * 1000, 1) + " mm" : fr(m * 1e6, 2) + " µm";
const svgOpen = (W, H, fs = 11) => `<svg viewBox="0 0 ${W} ${H}" width="100%" style="font-size:${fs}px">`;
function rng(seed) { let a = seed; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function gauss(r) { const u = Math.max(1e-12, r()), v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
function erfc(x) { const z = Math.abs(x), t = 1 / (1 + 0.5 * z), r = t * Math.exp(-z * z - 1.26551223 + t * (1.00002368 + t * (0.37409196 + t * (0.09678418 + t * (-0.18628806 + t * (0.27886807 + t * (-1.13520398 + t * (1.48851587 + t * (-0.82215223 + t * 0.17087277))))))))); return x >= 0 ? r : 2 - r; }
const Q = x => 0.5 * erfc(x / Math.SQRT2);
const logBars = (el, P, lo, hi, unit, fmt) => {
  const p = v => Math.max(0.5, (Math.log10(v) - lo) / (hi - lo) * 100);
  el.innerHTML = `<div class="bars">${P.map(([l, v, c, t]) => `<div class="bar-row"><span class="lab">${l}</span><span class="val">${t ?? (fmt ? fmt(v) : fr(v) + " " + unit)}</span><span class="track"><span class="fill" style="width:${p(v).toFixed(1)}%;background:${c}"></span></span></div>`).join("")}</div>`;
};

/* 1. spectre */
const BANDES = [[3e3, 3e4, "VLF", "#94a3b8"], [3e4, 3e5, "LF", "#a8a29e"], [3e5, 3e6, "MF", "#d6d3d1"], [3e6, 3e7, "HF", "#fde68a"], [3e7, 3e8, "VHF", "#bbf7d0"], [3e8, 3e9, "UHF", "#bae6fd"], [3e9, 3e10, "SHF", "#c7d2fe"], [3e10, 3e11, "EHF", "#e9d5ff"], [3e11, 3e14, "infrarouge", "#fecaca"], [3.8e14, 7.9e14, "visible", "url(#tcVis)"]];
const USAGES = [[2e4, "sous-marins"], [7.75e4, "horloge DCF77"], [1e6, "radio AM"], [1.4e7, "ondes courtes"], [9.8e7, "radio FM"], [5.5e8, "TNT"], [8e8, "4G/5G 800"], [1.575e9, "GPS"], [2.45e9, "wifi, micro-ondes"], [3.5e9, "5G"], [5.5e9, "wifi 5 GHz"], [1.2e10, "satellites TV"], [2.6e10, "5G 26 GHz"], [6e10, "60 GHz"], [7.7e10, "radar auto"], [1.934e14, "fibre 1,55 µm"], [5.4e14, "lumière"]];
function spectre() {
  const el = $("#tc-spectre"); if (!el) return;
  const f = 10 ** +$("#tc-f").value; $("#tc-f-v").textContent = fHz(f);
  const W = 900, H = 190, x = d3.scaleLog([3e3, 1e15], [20, W - 40]);
  let s = svgOpen(W, H) + `<defs><linearGradient id="tcVis"><stop offset="0" stop-color="#ef4444"/><stop offset=".3" stop-color="#f59e0b"/><stop offset=".5" stop-color="#22c55e"/><stop offset=".75" stop-color="#3b82f6"/><stop offset="1" stop-color="#8b5cf6"/></linearGradient></defs>`;
  BANDES.forEach(([a, b, l, c]) => { s += `<rect x="${x(a)}" y="40" width="${x(b) - x(a)}" height="34" fill="${c}"/><text x="${(x(a) + x(b)) / 2}" y="61" text-anchor="middle" font-weight="700" font-size="10">${l}</text>`; });
  [1e3, 1e6, 1e9, 1e12, 1e15].forEach(v => { if (v >= 3e3) s += `<line x1="${x(v)}" x2="${x(v)}" y1="74" y2="80" stroke="#64748b"/><text x="${x(v)}" y="92" text-anchor="middle" style="fill:#64748b">${fHz(v)}</text><text x="${x(v)}" y="34" text-anchor="middle" style="fill:#64748b">λ = ${lam(3e8 / v)}</text>`; });
  USAGES.forEach(([v, l], i) => { const X = x(v), y = 112 + (i % 4) * 18; s += `<line x1="${X}" x2="${X}" y1="74" y2="${y - 10}" stroke="#cbd5e1"/><text x="${X}" y="${y}" text-anchor="middle" style="fill:#334155" font-size="10">${l}</text>`; });
  const X = x(f); s += `<line x1="${X}" x2="${X}" y1="14" y2="80" stroke="#dc2626" stroke-width="3"/><circle cx="${X}" cy="14" r="5" fill="#dc2626"/>`;
  el.innerHTML = s + "</svg>";
  const l = C / f, E = 6.626e-34 * f / 1.602e-19, near = USAGES.reduce((a, u) => Math.abs(Math.log10(u[0] / f)) < Math.abs(Math.log10(a[0] / f)) ? u : a);
  window.TH.kpis("#tc-f-info", [[lam(l), ["longueur d'onde λ = c / f"], "Longueur d'onde"], [lam(l / 4), ["antenne quart d'onde", "taille typique d'une antenne"], "Antenne"], [E < 1e-3 ? fr(E * 1e6, E < 1e-5 ? 3 : 1) + " µeV" : fr(E, 2) + " eV", ["énergie d'un photon E = h f", E < 1 ? "trop faible pour casser une liaison" : "assez pour exciter les électrons"], "Photon"], [near[1], ["usage le plus proche"], "Usage"]]);
}

/* 2. antenne réseau */
function reseau() {
  const el = $("#tc-reseau"); if (!el) return;
  const N = +$("#tc-n").value, t0 = +$("#tc-th").value * Math.PI / 180, d = +$("#tc-d").value;
  $("#tc-n-v").textContent = N; $("#tc-th-v").textContent = $("#tc-th").value + "°";
  const af = t => { let re = 0, im = 0; for (let n = 0; n < N; n++) { const p = 2 * Math.PI * n * d * (Math.sin(t) - Math.sin(t0)); re += Math.cos(p); im += Math.sin(p); } return Math.hypot(re, im) / N; };
  const W = 900, H = 330, cx = 330, cy = 310, Rr = 280, floor = -40, r = db => Rr * (Math.max(floor, db) - floor) / -floor;
  let s = svgOpen(W, H);
  [0, -10, -20, -30].forEach(db => s += `<path d="M${cx - r(db)},${cy} A${r(db)},${r(db)} 0 0 1 ${cx + r(db)},${cy}" fill="none" stroke="#e2e8f0"/><text x="${cx + 4}" y="${cy - r(db) + 12}" style="fill:#94a3b8" font-size="10">${db} dB</text>`);
  [-90, -60, -30, 0, 30, 60, 90].forEach(a => { const t = a * Math.PI / 180; s += `<line x1="${cx}" y1="${cy}" x2="${cx + Rr * Math.sin(t)}" y2="${cy - Rr * Math.cos(t)}" stroke="#eef2f7"/><text x="${cx + (Rr + 12) * Math.sin(t)}" y="${cy - (Rr + 12) * Math.cos(t) + 4}" text-anchor="middle" style="fill:#64748b" font-size="10">${a}°</text>`; });
  const pts = d3.range(-90, 90.01, 0.25).map(a => { const t = a * Math.PI / 180, R = r(20 * Math.log10(af(t) + 1e-9)); return [cx + R * Math.sin(t), cy - R * Math.cos(t)]; });
  s += `<path d="M${cx},${cy} L${pts.map(p => p.map(v => v.toFixed(1)).join(",")).join(" L")} Z" fill="#7c3aed" fill-opacity=".18" stroke="#7c3aed" stroke-width="2"/>`;
  s += `<line x1="${cx}" y1="${cy}" x2="${cx + Rr * Math.sin(t0)}" y2="${cy - Rr * Math.cos(t0)}" stroke="#dc2626" stroke-dasharray="5 4" stroke-width="1.5"/>`;
  // les antennes et leurs phases
  const x0 = 680, w = 200, step = Math.min(24, w / Math.max(1, N - 1));
  s += `<text x="${x0}" y="40" font-weight="700">Les ${N} antennes et leur déphasage</text>`;
  for (let n = 0; n < Math.min(N, 9); n++) { const ph = ((-360 * n * d * Math.sin(t0)) % 360 + 360) % 360, X = x0 + 10 + n * 22; s += `<rect x="${X - 3}" y="70" width="6" height="30" fill="#334155"/><circle cx="${X}" cy="125" r="9" fill="none" stroke="#cbd5e1"/><line x1="${X}" y1="125" x2="${X + 9 * Math.cos(ph * Math.PI / 180)}" y2="${125 - 9 * Math.sin(ph * Math.PI / 180)}" stroke="#7c3aed" stroke-width="2"/>`; }
  if (N > 9) s += `<text x="${x0 + 10 + 9 * 22}" y="90" style="fill:#64748b">…</text>`;
  s += `<text x="${x0}" y="160" style="fill:#475569" font-size="10.5">aiguille = phase appliquée à chaque antenne</text>`;
  const bw = d <= 0.5 ? 102 / N / Math.cos(t0) : null;
  s += `<text x="${x0}" y="200" style="fill:#16a34a" font-weight="700">gain du réseau : +${fr(10 * Math.log10(N), 1)} dB</text><text x="${x0}" y="220" style="fill:#475569">(${N} fois plus de puissance dans l'axe)</text>`;
  if (bw && N > 1) s += `<text x="${x0}" y="250" style="fill:#7c3aed" font-weight="700">largeur du faisceau ≈ ${fr(Math.min(180, bw), 1)}°</text>`;
  el.innerHTML = s + "</svg>";
  $("#tc-reseau-txt").innerHTML = N === 1 ? "Une seule antenne rayonne dans toutes les directions : impossible de viser." : d > 0.5 ? "Avec un espacement de λ, des <b>lobes de réseau</b> apparaissent : le faisceau part aussi dans d'autres directions (le même phénomène que les ordres d'un réseau de diffraction). D'où la règle d'or : espacement ≤ λ/2." : `Le faisceau principal pointe vers ${$("#tc-th").value}°. Doubler le nombre d'antennes divise la largeur du faisceau par deux et ajoute 3 dB. Les lobes secondaires (à environ −13 dB) sont réduits en pratique en pondérant l'amplitude des antennes du bord.`;
}

/* 3. bilan de liaison */
const LIENS = {
  wifi: { f: 5500, P: 20, Ge: 3, Gr: 0, B: 80e6, NF: 7, d: [0.001, 0.1], mur: 12, nom: "routeur wifi → ordinateur" },
  "4g": { f: 800, P: 46, Ge: 17, Gr: -3, B: 10e6, NF: 7, d: [0.1, 40], mur: 6, nom: "antenne 4G (40 W) → téléphone" },
  "5g": { f: 3500, P: 49, Ge: 24, Gr: -3, B: 100e6, NF: 7, d: [0.05, 8], mur: 12, nom: "antenne 5G à faisceau orientable → téléphone" },
  geo: { f: 12000, P: 50, Ge: 30, Gr: 38, B: 36e6, NF: 1, d: [35786, 41000], mur: 0, nom: "satellite à 36 000 km → parabole de 60 cm" },
  leo: { f: 12000, P: 37, Ge: 35, Gr: 33, B: 240e6, NF: 2, d: [550, 1800], mur: 0, nom: "satellite à 550 km → antenne plate" },
  lune: { f: 144, P: 60, Ge: 21, Gr: 21, B: 50, NF: 1, d: [356500, 406700], mur: 0, nom: "écho radar sur la Lune (1 kW, antennes Yagi, morse)", eme: true }
};
function bilan() {
  const el = $("#tc-bilan"); if (!el) return;
  const L = LIENS[$("#tc-lien").value], u = +$("#tc-dist").value, d = L.d[0] * (L.d[1] / L.d[0]) ** u;
  const murs = L.mur ? +$("#tc-murs").value : 0; $("#tc-murs").disabled = !L.mur;
  $("#tc-dist-v").textContent = d < 1 ? fr(d * 1000) + " m" : fr(d, d < 10 ? 1 : 0) + " km"; $("#tc-murs-v").textContent = L.mur ? murs : "sans objet";
  let fspl = 20 * Math.log10(d) + 20 * Math.log10(L.f) + 32.44;
  let lossLab = "Distance (espace libre)";
  if (L.eme) { // équation radar : 2 trajets + surface équivalente de la Lune (≈ 6,5 % de sa section)
    const lm = C / (L.f * 1e6), sig = 0.065 * Math.PI * 1737e3 ** 2;
    fspl = -10 * Math.log10(lm ** 2 * sig / ((4 * Math.PI) ** 3 * (d * 1e3) ** 4)); lossLab = "Aller-retour Terre-Lune";
  }
  const Lm = murs * L.mur, Pr = L.P + L.Ge - fspl - Lm + L.Gr, Nn = -174 + 10 * Math.log10(L.B) + L.NF, snr = Pr - Nn;
  const steps0 = [["Puissance émise", L.P, "#2563eb"], ["Antenne d'émission", L.Ge, "#16a34a"], [lossLab, -fspl, "#dc2626"], ["Antenne de réception", L.Gr, "#16a34a"]];
  const steps = L.mur ? [...steps0.slice(0, 3), ["Murs", -Lm, "#f97316"], steps0[3]] : steps0;
  const W = 900, H = 260, m = { l: 60, r: 170, t: 16, b: 50 };
  let lv = 0; const lvls = [0]; steps.forEach(st => { lv += st[1]; lvls.push(lv); });
  const lo = Math.min(Nn - 10, ...lvls) - 5, hi = Math.max(...lvls, L.P + L.Ge) + 5, y = d3.scaleLinear([lo, hi], [H - m.b, m.t]), bw = (W - m.l - m.r) / (steps.length + 1);
  let s = svgOpen(W, H);
  y.ticks(6).forEach(v => s += `<line x1="${m.l}" x2="${W - m.r}" y1="${y(v)}" y2="${y(v)}" stroke="#eef2f7"/><text x="${m.l - 5}" y="${y(v) + 3}" text-anchor="end" style="fill:#64748b">${v} dBm</text>`);
  let cur = 0;
  steps.forEach(([l, v, c], i) => { const X = m.l + i * bw + 8; s += `<rect x="${X}" y="${y(Math.max(cur, cur + v))}" width="${bw - 16}" height="${Math.max(1, Math.abs(y(cur) - y(cur + v)))}" fill="${c}" opacity=".85"/><text x="${X + (bw - 16) / 2}" y="${H - 32}" text-anchor="middle" font-size="10">${l.length > 26 ? l.slice(0, 26) + "…" : l}</text><text x="${X + (bw - 16) / 2}" y="${H - 18}" text-anchor="middle" font-weight="700" style="fill:${c}">${v >= 0 ? "+" : ""}${fr(v, 1)} dB</text>`; cur += v; });
  const X = m.l + steps.length * bw + 8;
  s += `<rect x="${X}" y="${y(Pr) - 2}" width="${bw - 16}" height="4" fill="#111827"/><text x="${X + (bw - 16) / 2}" y="${y(Pr) - 8}" text-anchor="middle" font-weight="800">${fr(Pr, 1)} dBm</text><text x="${X + (bw - 16) / 2}" y="${H - 32}" text-anchor="middle" font-size="10">puissance reçue</text>`;
  s += `<line x1="${m.l}" x2="${W - m.r + 10}" y1="${y(Nn)}" y2="${y(Nn)}" stroke="#64748b" stroke-dasharray="6 4"/><text x="${W - m.r + 14}" y="${y(Nn) + 4}" style="fill:#64748b">bruit : ${fr(Nn, 1)} dBm</text>`;
  const yS = Math.abs(y(Pr) - y(Nn)) < 16 ? y(Nn) - 16 : y(Pr) + 4;
  s += `<text x="${W - m.r + 14}" y="${yS}" font-weight="700" style="fill:${snr > 10 ? "#16a34a" : snr > 0 ? "#f59e0b" : "#dc2626"}">S/B = ${fr(snr, 1)} dB</text>`;
  el.innerHTML = s + "</svg>";
  const cap = L.B * Math.log2(1 + 10 ** (snr / 10)) * 0.6;
  const cs = cap > 1e9 ? fr(cap / 1e9, 1) + " Gb/s" : cap > 1e6 ? fr(cap / 1e6, cap < 1e7 ? 1 : 0) + " Mb/s" : cap > 1e3 ? fr(cap / 1e3, 0) + " kb/s" : fr(cap, 0) + " b/s";
  $("#tc-bilan-txt").innerHTML = `<b>${L.nom}</b>, ${fHz(L.f * 1e6)}, bande ${L.B >= 1e6 ? fr(L.B / 1e6) + " MHz" : fr(L.B) + " Hz"}. ` + (snr < 0 ? "Le signal est sous le bruit : liaison impossible (sauf codes très robustes et débit minuscule)." : `Débit possible ≈ <b>${cs}</b> (60 % de la limite de Shannon C = B log₂(1 + S/B), par flux d'antenne).`) + (L.mur ? " Calcul en espace libre : en ville, les obstacles ajoutent souvent 20 à 40 dB de plus." : "") + (L.eme ? " Les radioamateurs réussissent cette liaison avec des signaux à peine au-dessus du bruit, en morse ou en modes numériques très lents." : "");
}
function atmo() {
  const el = $("#tc-atmo"); if (!el) return;
  const gaz = [[1, .006], [5, .008], [10, .015], [15, .03], [22.2, .22], [30, .1], [40, .12], [50, .5], [55, 4], [60, 15], [65, 4], [70, .4], [94, .4], [110, .9], [118.7, 3], [130, .9], [150, 1], [170, 3], [183.3, 35], [200, 4], [250, 3], [300, 6]];
  const pluie = [[1, .0003], [3, .005], [5, .03], [10, .6], [15, 1.5], [20, 2.8], [30, 5], [40, 7], [60, 10], [100, 12], [300, 13]];
  const W = 440, H = 260, m = { l: 44, r: 10, t: 10, b: 30 }, x = d3.scaleLog([1, 300], [m.l, W - m.r]), y = d3.scaleLog([1e-3, 50], [H - m.b, m.t]);
  let s = svgOpen(W, H, 10);
  [1e-3, 1e-2, .1, 1, 10].forEach(v => s += `<line x1="${m.l}" x2="${W - m.r}" y1="${y(v)}" y2="${y(v)}" stroke="#eef2f7"/><text x="${m.l - 4}" y="${y(v) + 3}" text-anchor="end" style="fill:#64748b">${String(v).replace(".", ",")}</text>`);
  [1, 3, 10, 30, 100, 300].forEach(v => s += `<text x="${x(v)}" y="${H - 12}" text-anchor="middle" style="fill:#64748b">${v} GHz</text>`);
  const line = (P, c, dash) => `<path d="M${P.map(([a, b]) => `${x(a).toFixed(1)},${y(Math.max(1e-3, b)).toFixed(1)}`).join(" L")}" fill="none" stroke="${c}" stroke-width="2.2" ${dash ? 'stroke-dasharray="6 4"' : ""}/>`;
  s += line(gaz, "#2563eb") + line(pluie, "#0ea5e9", 1);
  s += `<text x="${x(22)}" y="${y(.22) - 6}" text-anchor="middle" style="fill:#2563eb">vapeur d'eau</text><text x="${x(60)}" y="${y(15) - 6}" text-anchor="middle" style="fill:#2563eb">oxygène</text><text x="${x(183)}" y="${y(35) + 14}" text-anchor="end" style="fill:#2563eb">eau</text><text x="${x(4)}" y="${y(.02) - 6}" style="fill:#0ea5e9">forte pluie (25 mm/h)</text><text x="${x(1.2)}" y="${y(.006) - 10}" style="fill:#2563eb">air sec et humide</text>`;
  el.innerHTML = s + "</svg>";
}
function mursCh() {
  const el = $("#tc-murs-ch"); if (!el) return;
  const F = ["800 MHz", "2,4 GHz", "5 GHz", "28 GHz"], Cc = ["#16a34a", "#2563eb", "#7c3aed", "#dc2626"];
  const M = [["Cloison en plâtre", [1, 3, 4, 7]], ["Vitre simple", [1, 2, 3, 5]], ["Corps humain", [2, 4, 6, 15]], ["Mur de briques", [4, 6, 10, 20]], ["Béton (20 cm)", [10, 15, 25, 45]], ["Vitrage à couche métallique", [20, 25, 30, 40]]];
  const W = 440, H = 260, m = { l: 150, r: 20, t: 22, b: 22 }, x = d3.scaleLinear([0, 45], [m.l, W - m.r]), bh = (H - m.t - m.b) / M.length;
  let s = svgOpen(W, H, 10);
  F.forEach((f, i) => s += `<rect x="${m.l + i * 70}" y="4" width="10" height="10" fill="${Cc[i]}"/><text x="${m.l + i * 70 + 13}" y="13">${f}</text>`);
  [0, 10, 20, 30, 40].forEach(v => s += `<line x1="${x(v)}" x2="${x(v)}" y1="${m.t}" y2="${H - m.b}" stroke="#eef2f7"/><text x="${x(v)}" y="${H - 6}" text-anchor="middle" style="fill:#64748b">${v} dB</text>`);
  M.forEach(([l, v], i) => { const y0 = m.t + i * bh; s += `<text x="${m.l - 6}" y="${y0 + bh / 2 + 3}" text-anchor="end">${l}</text>`; v.forEach((d, k) => s += `<rect x="${m.l}" y="${y0 + 3 + k * (bh - 6) / 4}" width="${x(d) - m.l}" height="${(bh - 6) / 4 - 1}" fill="${Cc[k]}"/>`); });
  el.innerHTML = s + "</svg>";
}

/* 4. Fourier, repliement */
function carre() {
  const el = $("#tc-carre"); if (!el) return;
  const K = +$("#tc-harm").value; $("#tc-harm-v").textContent = K;
  const W = 440, H = 220, x = d3.scaleLinear([0, 2], [30, W - 10]), y = d3.scaleLinear([-1.4, 1.4], [H - 20, 10]);
  const f = t => { let v = 0; for (let k = 0; k < K; k++) { const n = 2 * k + 1; v += 4 / Math.PI * Math.sin(2 * Math.PI * n * t) / n; } return v; };
  let s = svgOpen(W, H, 10) + `<line x1="30" x2="${W - 10}" y1="${y(0)}" y2="${y(0)}" stroke="#cbd5e1"/>`;
  s += `<path d="M${x(0)},${y(1)} H${x(.5)} V${y(-1)} H${x(1)} V${y(1)} H${x(1.5)} V${y(-1)} H${x(2)}" fill="none" stroke="#cbd5e1" stroke-width="2"/>`;
  s += `<path d="M${d3.range(0, 2.0001, .002).map(t => `${x(t).toFixed(1)},${y(f(t)).toFixed(1)}`).join(" L")}" fill="none" stroke="#7c3aed" stroke-width="2"/>`;
  s += `<text x="${W - 12}" y="22" text-anchor="end" style="fill:#7c3aed">somme de ${K} sinusoïde${K > 1 ? "s" : ""}</text>`;
  el.innerHTML = s + "</svg>";
  const sp = $("#tc-carre-sp"), xs = d3.scaleLinear([0, 40], [30, W - 10]), ys = d3.scaleLinear([0, 1.35], [H - 20, 10]);
  let t = svgOpen(W, H, 10);
  for (let n = 1; n <= 39; n += 2) { const a = 4 / Math.PI / n, on = (n - 1) / 2 < K; t += `<line x1="${xs(n)}" x2="${xs(n)}" y1="${ys(0)}" y2="${ys(a)}" stroke="${on ? "#7c3aed" : "#e2e8f0"}" stroke-width="5"/>`; }
  [1, 5, 10, 20, 30, 40].forEach(v => t += `<text x="${xs(v)}" y="${H - 6}" text-anchor="middle" style="fill:#64748b">${v} f₀</text>`);
  t += `<text x="${W - 12}" y="22" text-anchor="end" style="fill:#475569">amplitude 4/(πn) : seules les harmoniques impaires</text>`;
  sp.innerHTML = t + "</svg>";
}
function alias() {
  const el = $("#tc-alias"); if (!el) return;
  const fe = +$("#tc-fe").value, f0 = 1; $("#tc-fe-v").textContent = fr(fe, 2) + " kHz";
  const fa = Math.abs(f0 - fe * Math.round(f0 / fe));
  const W = 900, H = 200, T = 4, x = d3.scaleLinear([0, T], [20, W - 10]), y = d3.scaleLinear([-1.2, 1.2], [H - 20, 10]);
  let s = svgOpen(W, H, 10) + `<line x1="20" x2="${W - 10}" y1="${y(0)}" y2="${y(0)}" stroke="#cbd5e1"/>`;
  s += `<path d="M${d3.range(0, T, .004).map(t => `${x(t).toFixed(1)},${y(Math.sin(2 * Math.PI * f0 * t)).toFixed(1)}`).join(" L")}" fill="none" stroke="#94a3b8" stroke-width="1.5"/>`;
  const sgn = Math.sign(f0 - fe * Math.round(f0 / fe)) || 1;
  if (fe < 2 * f0) s += `<path d="M${d3.range(0, T, .004).map(t => `${x(t).toFixed(1)},${y(sgn * Math.sin(2 * Math.PI * fa * t)).toFixed(1)}`).join(" L")}" fill="none" stroke="#dc2626" stroke-width="2" stroke-dasharray="6 4"/>`;
  for (let t = 0; t <= T; t += 1 / fe) s += `<line x1="${x(t)}" x2="${x(t)}" y1="${y(0)}" y2="${y(Math.sin(2 * Math.PI * f0 * t))}" stroke="#2563eb"/><circle cx="${x(t)}" cy="${y(Math.sin(2 * Math.PI * f0 * t))}" r="4" fill="#2563eb"/>`;
  s += `<text x="24" y="16" style="fill:#64748b">temps (ms) → ; gris : signal réel à 1 kHz ; points bleus : échantillons${fe < 2 ? " ; rouge : ce que l'on croit avoir reçu" : ""}</text>`;
  el.innerHTML = s + "</svg>";
  $("#tc-alias-txt").innerHTML = fe >= 2 ? `Échantillonnage à ${fr(fe, 2)} kHz ≥ 2 × 1 kHz : les échantillons suffisent à reconstruire exactement le signal.` : `<b>Repliement</b> : à ${fr(fe, 2)} kHz &lt; 2 kHz, les mêmes points sont ceux d'une sinusoïde à ${fr(fa * 1000)} Hz. L'information est perdue sans retour : c'est pourquoi on filtre toujours le signal avant de l'échantillonner.`;
}

/* 5. Shannon */
function capa() {
  const el = $("#tc-capa"); if (!el) return;
  const B = +$("#tc-B").value * 1e6, M = +$("#tc-M").value;
  const W = 900, H = 280, m = { l: 70, r: 140, t: 14, b: 34 }, x = d3.scaleLinear([-10, 40], [m.l, W - m.r]);
  const cap = (snr, k) => k * B * Math.log2(1 + 10 ** (snr / 10));
  const ymax = cap(40, M) * 1.05, y = d3.scaleLinear([0, ymax], [H - m.b, m.t]);
  const fmt = v => v >= 1e9 ? fr(v / 1e9, 1) + " Gb/s" : v >= 1e6 ? fr(v / 1e6, v < 1e7 ? 1 : 0) + " Mb/s" : fr(v / 1e3, 0) + " kb/s";
  let s = svgOpen(W, H);
  y.ticks(5).forEach(v => s += `<line x1="${m.l}" x2="${W - m.r}" y1="${y(v)}" y2="${y(v)}" stroke="#eef2f7"/><text x="${m.l - 5}" y="${y(v) + 3}" text-anchor="end" style="fill:#64748b">${fmt(v)}</text>`);
  [-10, 0, 10, 20, 30, 40].forEach(v => s += `<text x="${x(v)}" y="${H - 14}" text-anchor="middle" style="fill:#64748b">${v} dB</text>`);
  s += `<text x="${(m.l + W - m.r) / 2}" y="${H - 1}" text-anchor="middle" style="fill:#64748b">rapport signal sur bruit S/N</text>`;
  const ln = (k, c, w) => `<path d="M${d3.range(-10, 40.01, .5).map(v => `${x(v).toFixed(1)},${y(cap(v, k)).toFixed(1)}`).join(" L")}" fill="none" stroke="${c}" stroke-width="${w}"/>`;
  s += ln(1, "#94a3b8", 2) + `<text x="${W - m.r + 6}" y="${y(cap(40, 1)) + 4}" style="fill:#64748b">1 antenne : ${fmt(cap(40, 1))}</text>`;
  if (M > 1) s += ln(M, "#7c3aed", 3) + `<text x="${W - m.r + 6}" y="${y(cap(40, M)) + 4}" style="fill:#7c3aed" font-weight="700">MIMO ${M}×${M} : ${fmt(cap(40, M))}</text>`;
  // +3 dB
  const a = 20, c1 = cap(a, M), c2 = cap(a + 3, M);
  s += `<circle cx="${x(a)}" cy="${y(c1)}" r="4" fill="#dc2626"/><circle cx="${x(a + 3)}" cy="${y(c2)}" r="4" fill="#dc2626"/><text x="${x(a)}" y="${y(c1) + 18}" style="fill:#dc2626">+3 dB (puissance ×2) → +${fmt(c2 - c1)} seulement</text>`;
  el.innerHTML = s + "</svg>";
}

/* 6. modulations */
function points(Mo) {
  if (Mo === 2) return [[-1, 0], [1, 0]];
  const k = Math.round(Math.log2(Mo)), side = 2 ** Math.ceil(k / 2), side2 = Mo / side, P = [];
  for (let i = 0; i < side; i++) for (let j = 0; j < side2; j++) P.push([2 * i - side + 1, 2 * j - side2 + 1]);
  const e = Math.sqrt(d3.mean(P, p => p[0] ** 2 + p[1] ** 2)); return P.map(p => [p[0] / e, p[1] / e]);
}
function berTh(Mo, snrDb) {
  const s = 10 ** (snrDb / 10);
  if (Mo === 2) return Q(Math.sqrt(2 * s));
  if (Mo === 4) return Q(Math.sqrt(s));
  const k = Math.log2(Mo); return Math.min(.5, 4 / k * (1 - 1 / Math.sqrt(Mo)) * Q(Math.sqrt(3 * s / (Mo - 1))));
}
function constel() {
  const el = $("#tc-constel"); if (!el) return;
  const Mo = +$("#tc-qam").value, snr = +$("#tc-snr").value; $("#tc-snr-v").textContent = fr(snr, 1) + " dB";
  const P = points(Mo), sig = Math.sqrt(10 ** (-snr / 10) / 2), r = rng(7), W = 440, H = 440, lim = 1.75, x = d3.scaleLinear([-lim, lim], [10, W - 10]), y = d3.scaleLinear([-lim, lim], [H - 10, 10]);
  let s = svgOpen(W, H, 10) + `<line x1="${x(0)}" x2="${x(0)}" y1="10" y2="${H - 10}" stroke="#e2e8f0"/><line x1="10" x2="${W - 10}" y1="${y(0)}" y2="${y(0)}" stroke="#e2e8f0"/>`;
  let err = 0; const n = Math.min(4000, Math.max(1500, Mo * 6));
  let dots = "";
  for (let i = 0; i < n; i++) {
    const p = P[Math.floor(r() * P.length)], q = [p[0] + sig * gauss(r), p[1] + sig * gauss(r)];
    let best = 0, bd = 1e9; P.forEach((c, j) => { const d = (c[0] - q[0]) ** 2 + (c[1] - q[1]) ** 2; if (d < bd) { bd = d; best = j; } });
    const ok = P[best] === p; if (!ok) err++;
    if (Math.abs(q[0]) < lim && Math.abs(q[1]) < lim) dots += `<circle cx="${x(q[0]).toFixed(1)}" cy="${y(q[1]).toFixed(1)}" r="${Mo > 256 ? 1 : 1.6}" fill="${ok ? "#2563eb" : "#dc2626"}" fill-opacity=".55"/>`;
  }
  s += dots; P.forEach(p => s += `<circle cx="${x(p[0])}" cy="${y(p[1])}" r="${Mo > 256 ? 1.2 : 2.6}" fill="#111827"/>`);
  s += `<text x="14" y="22" font-weight="700">Constellation reçue</text><text x="14" y="38" style="fill:#475569">noir : points idéaux ; bleu : reçus, bien décodés ; rouge : erreurs</text><text x="14" y="${H - 16}" style="fill:#dc2626" font-weight="700">${fr(err / n * 100, 1)} % de symboles faux</text><text x="${W - 14}" y="${H - 16}" text-anchor="end" style="fill:#64748b">axe horizontal : I, vertical : Q</text>`;
  el.innerHTML = s + "</svg>";
  // courbes BER
  const b = $("#tc-ber"), W2 = 440, H2 = 300, m = { l: 46, r: 10, t: 10, b: 30 }, xx = d3.scaleLinear([0, 45], [m.l, W2 - m.r]), yy = d3.scaleLog([1e-7, .5], [H2 - m.b, m.t]);
  let t = svgOpen(W2, H2, 10);
  [[1e-6, "10⁻⁶"], [1e-4, "10⁻⁴"], [1e-2, "0,01"], [.5, "0,5"]].forEach(([v, l]) => t += `<line x1="${m.l}" x2="${W2 - m.r}" y1="${yy(v)}" y2="${yy(v)}" stroke="#eef2f7"/><text x="${m.l - 4}" y="${yy(v) + 3}" text-anchor="end" style="fill:#64748b">${l}</text>`);
  [0, 10, 20, 30, 40].forEach(v => t += `<text x="${xx(v)}" y="${H2 - 12}" text-anchor="middle" style="fill:#64748b">${v} dB</text>`);
  const cols = { 2: "#16a34a", 4: "#22c55e", 16: "#2563eb", 64: "#7c3aed", 256: "#a855f7", 1024: "#dc2626", 4096: "#f97316" };
  Object.entries(cols).forEach(([k, c]) => { const K = +k, pts = d3.range(0, 45.01, .25).map(v => [v, berTh(K, v)]).filter(p => p[1] > 1e-7); if (!pts.length) return; t += `<path d="M${pts.map(([a, v]) => `${xx(a).toFixed(1)},${yy(v).toFixed(1)}`).join(" L")}" fill="none" stroke="${c}" stroke-width="${K === Mo ? 3 : 1.3}" opacity="${K === Mo ? 1 : .6}"/>`; const last = pts[pts.length - 1]; t += `<text x="${xx(last[0]) + 2}" y="${yy(last[1]) - 3}" style="fill:${c}" font-size="9">${K === 2 ? "BPSK" : K === 4 ? "QPSK" : K + "-QAM"}</text>`; });
  const bv = berTh(Mo, snr); if (bv > 1e-7) t += `<circle cx="${xx(snr)}" cy="${yy(bv)}" r="5" fill="#111827"/>`;
  b.innerHTML = t + "</svg>";
  const k = Math.log2(Mo), need = d3.range(0, 50, .1).find(v => berTh(Mo, v) < 1e-5);
  $("#tc-qam-txt").innerHTML = `${Mo === 2 ? "BPSK" : Mo === 4 ? "QPSK" : Mo + "-QAM"} : <b>${k} bits par symbole</b>. Pour moins d'une erreur sur 100 000 bits sans code correcteur, il faut environ <b>${fr(need, 1)} dB</b> de rapport signal sur bruit. Chaque bit supplémentaire par symbole coûte environ 3 dB : c'est la loi de Shannon vue de près.`;
}
function ofdm() {
  const el = $("#tc-ofdm-ch"); if (!el) return;
  const W = 900, H = 220, x = d3.scaleLinear([-1.5, 9.5], [30, W - 10]), y = d3.scaleLinear([-.3, 1.1], [H - 26, 10]);
  const sinc = u => Math.abs(u) < 1e-9 ? 1 : Math.sin(Math.PI * u) / (Math.PI * u);
  const cols = d3.schemeTableau10;
  let s = svgOpen(W, H, 10) + `<line x1="30" x2="${W - 10}" y1="${y(0)}" y2="${y(0)}" stroke="#94a3b8"/>`;
  for (let k = 0; k < 9; k++) { s += `<path d="M${d3.range(-1.5, 9.5, .02).map(f => `${x(f).toFixed(1)},${y(sinc(f - k)).toFixed(1)}`).join(" L")}" fill="none" stroke="${cols[k]}" stroke-width="1.8"/><line x1="${x(k)}" x2="${x(k)}" y1="${y(0)}" y2="${y(1)}" stroke="${cols[k]}" stroke-dasharray="2 3"/>`; }
  s += `<text x="${x(4)}" y="${H - 8}" text-anchor="middle" style="fill:#475569">fréquence → (sous-porteuses espacées de 1/T) : au sommet de chacune, toutes les autres valent zéro</text>`;
  el.innerHTML = s + "</svg>";
}

/* 8. carte des usages */
function carte() {
  const el = $("#tc-carte"); if (!el) return;
  const P = [["VLF sous-marins", 8000, 1e-4, .02, "#94a3b8"], ["Ondes courtes", 5000, .01, .1, "#ca8a04"], ["Radio FM", 80, .2, .2, "#16a34a"], ["TNT", 60, 30, 8, "#0d9488"], ["4G 800 MHz", 10, 50, 10, "#2563eb"], ["4G 2,6 GHz", 2, 150, 20, "#3b82f6"], ["Wifi 2,4 GHz", .05, 300, 40, "#0ea5e9"], ["5G 3,5 GHz", 1, 1000, 100, "#7c3aed"], ["Wifi 6 GHz", .02, 2000, 320, "#a855f7"], ["5G 26 GHz", .2, 3000, 800, "#c026d3"], ["Wifi 60 GHz", .01, 7000, 2160, "#db2777"], ["Satellite Ka", 36000, 100, 500, "#f97316"], ["Bluetooth", .01, 2, 1, "#64748b"]];
  const W = 900, H = 360, m = { l: 70, r: 30, t: 14, b: 36 }, x = d3.scaleLog([.005, 4e5], [m.l, W - m.r]), y = d3.scaleLog([5e-5, 2e4], [H - m.b, m.t]);
  let s = svgOpen(W, H);
  [1e-4, 1e-2, 1, 100, 1e4].forEach(v => s += `<line x1="${m.l}" x2="${W - m.r}" y1="${y(v)}" y2="${y(v)}" stroke="#eef2f7"/><text x="${m.l - 5}" y="${y(v) + 3}" text-anchor="end" style="fill:#64748b">${v >= 1 ? fr(v) : fr(v * 1000, v < .001 ? 1 : 0)} ${v >= 1 ? "Mb/s" : "kb/s"}</text>`);
  [.01, .1, 1, 10, 100, 1000, 1e4].forEach(v => s += `<line x1="${x(v)}" x2="${x(v)}" y1="${m.t}" y2="${H - m.b}" stroke="#eef2f7"/><text x="${x(v)}" y="${H - 18}" text-anchor="middle" style="fill:#64748b">${v < 1 ? fr(v * 1000) + " m" : fr(v) + " km"}</text>`);
  s += `<text x="${(m.l + W) / 2}" y="${H - 2}" text-anchor="middle" style="fill:#64748b">portée typique →</text><text x="14" y="${H / 2}" transform="rotate(-90 14 ${H / 2})" text-anchor="middle" style="fill:#64748b">débit typique →</text>`;
  P.forEach(([l, d, r, b, c]) => { const R = 4 + 3 * Math.sqrt(Math.log10(b * 100 + 1)) ** 1.6; s += `<circle cx="${x(d)}" cy="${y(r)}" r="${R}" fill="${c}" fill-opacity=".35" stroke="${c}"/><text x="${x(d) + R + 3}" y="${y(r) + 4}" font-weight="700" style="fill:${c}">${l}</text>`; });
  s += `<text x="${W - m.r - 6}" y="${m.t + 14}" text-anchor="end" style="fill:#475569">fibre optique : 100 km et des dizaines de Tb/s, hors cadre ↗</text>`;
  s += `<path d="M${x(.02)},${y(.2)} L${x(3000)},${y(2e-4)}" stroke="#cbd5e1" stroke-dasharray="6 5"/><text x="${x(.06)}" y="${y(.03)}" style="fill:#94a3b8" transform="rotate(26 ${x(.06)} ${y(.03)})">loi générale : portée contre débit</text>`;
  el.innerHTML = s + "</svg>";
}

/* 9. wifi */
function wifiGen() {
  const el = $("#tc-wifi-gen"); if (!el) return;
  logBars(el, [["802.11 (1997)", 2, "#cbd5e1"], ["802.11b (1999)", 11, "#94a3b8"], ["802.11a/g (2003)", 54, "#64748b"], ["Wifi 4, 802.11n (2009)", 600, "#0ea5e9"], ["Wifi 5, 802.11ac (2013)", 6933, "#2563eb"], ["Wifi 6, 802.11ax (2019)", 9608, "#7c3aed"], ["Wifi 7, 802.11be (2024)", 46000, "#c026d3"]], 0, 4.8, "", v => v >= 1000 ? fr(v / 1000, 1) + " Gb/s" : fr(v) + " Mb/s");
}
function canaux() {
  const el = $("#tc-canaux"); if (!el) return;
  const W = 440, H = 220, x = d3.scaleLinear([2398, 2490], [20, W - 10]), y0 = 170;
  let s = svgOpen(W, H, 10) + `<line x1="20" x2="${W - 10}" y1="${y0}" y2="${y0}" stroke="#94a3b8"/>`;
  for (let c = 1; c <= 13; c++) { const f = 2407 + 5 * c, main = [1, 6, 11].includes(c), col = main ? ["#2563eb", "#16a34a", "#dc2626"][[1, 6, 11].indexOf(c)] : "#cbd5e1", h = main ? 110 : 80; s += `<path d="M${x(f - 11)},${y0} Q${x(f)},${y0 - h * 2} ${x(f + 11)},${y0}" fill="${main ? col : "none"}" fill-opacity="${main ? .18 : 0}" stroke="${col}" stroke-width="${main ? 2 : 1}"/><text x="${x(f)}" y="${y0 + 14}" text-anchor="middle" style="fill:${main ? col : "#94a3b8"}" font-weight="${main ? 700 : 400}">${c}</text>`; }
  s += `<text x="${x(2412)}" y="${y0 + 34}" style="fill:#64748b">2,412 GHz</text><text x="${x(2472)}" y="${y0 + 34}" text-anchor="end" style="fill:#64748b">2,472 GHz</text>`;
  el.innerHTML = s + "</svg>";
}
function gen() {
  const el = $("#tc-gen"); if (!el) return;
  const G = [["2G", .1, .24, "#94a3b8"], ["3G", 5, 42, "#0ea5e9"], ["4G", 60, 1000, "#2563eb"], ["5G", 500, 20000, "#7c3aed"]];
  const W = 900, H = 200, m = { l: 50, r: 20, t: 20, b: 30 }, x = d3.scaleLog([.05, 3e4], [m.l, W - m.r]), bh = (H - m.t - m.b) / G.length;
  let s = svgOpen(W, H);
  [.1, 1, 10, 100, 1000, 1e4].forEach(v => s += `<line x1="${x(v)}" x2="${x(v)}" y1="${m.t}" y2="${H - m.b}" stroke="#eef2f7"/><text x="${x(v)}" y="${H - 12}" text-anchor="middle" style="fill:#64748b">${v >= 1000 ? fr(v / 1000) + " Gb/s" : fr(v, v < 1 ? 1 : 0) + " Mb/s"}</text>`);
  s += `<rect x="${W - 330}" y="2" width="12" height="10" fill="#7c3aed"/><text x="${W - 314}" y="11">débit typique</text><rect x="${W - 220}" y="2" width="12" height="10" fill="#7c3aed" fill-opacity=".25"/><text x="${W - 204}" y="11">maximum de la norme</text>`;
  G.forEach(([l, t, p, c], i) => { const y = m.t + i * bh + 4; s += `<text x="${m.l - 8}" y="${y + bh / 2}" text-anchor="end" font-weight="800">${l}</text><rect x="${m.l}" y="${y}" width="${x(p) - m.l}" height="${bh - 10}" fill="${c}" fill-opacity=".22"/><rect x="${m.l}" y="${y + 4}" width="${x(t) - m.l}" height="${bh - 18}" fill="${c}"/>`; });
  el.innerHTML = s + "</svg>";
}

/* 11. fibre */
function fibre() {
  const el = $("#tc-fib-att"); if (!el) return;
  const att = l => 0.8 / l ** 4 + 6e11 * Math.exp(-48 / l) + 0.45 * Math.exp(-(((l - 1.383) / 0.012) ** 2)) + 0.12 * Math.exp(-(((l - 1.24) / 0.012) ** 2)) + 0.01;
  const W = 440, H = 260, m = { l: 40, r: 10, t: 10, b: 30 }, x = d3.scaleLinear([.75, 1.7], [m.l, W - m.r]), y = d3.scaleLog([.1, 5], [H - m.b, m.t]);
  let s = svgOpen(W, H, 10);
  [.1, .2, .5, 1, 2, 5].forEach(v => s += `<line x1="${m.l}" x2="${W - m.r}" y1="${y(v)}" y2="${y(v)}" stroke="#eef2f7"/><text x="${m.l - 4}" y="${y(v) + 3}" text-anchor="end" style="fill:#64748b">${fr(v, v < 1 ? 1 : 0)}</text>`);
  [[.85, "1ʳᵉ fenêtre 850 nm"], [1.31, "2ᵉ : 1 310 nm"], [1.55, "3ᵉ : 1 550 nm"]].forEach(([l, t]) => s += `<rect x="${x(l - .03)}" y="${m.t}" width="${x(l + .03) - x(l - .03)}" height="${H - m.b - m.t}" fill="#fde68a" opacity=".5"/><text x="${x(l)}" y="${m.t + 12}" text-anchor="middle" style="fill:#92400e" font-size="9">${t}</text>`);
  [.8, 1, 1.2, 1.4, 1.6].forEach(v => s += `<text x="${x(v)}" y="${H - 12}" text-anchor="middle" style="fill:#64748b">${fr(v, 1)} µm</text>`);
  s += `<path d="M${d3.range(.75, 1.7, .002).map(l => `${x(l).toFixed(1)},${y(Math.min(5, att(l))).toFixed(1)}`).join(" L")}" fill="none" stroke="#dc2626" stroke-width="2.2"/>`;
  s += `<path d="M${d3.range(.75, 1.7, .01).map(l => `${x(l).toFixed(1)},${y(Math.max(.1, Math.min(5, 0.8 / l ** 4))).toFixed(1)}`).join(" L")}" fill="none" stroke="#2563eb" stroke-dasharray="4 4"/><text x="${x(.9)}" y="${y(1.1)}" style="fill:#2563eb">diffusion de Rayleigh (1/λ⁴)</text>`;
  s += `<text x="${x(1.383)}" y="${y(.62) - 4}" text-anchor="middle" style="fill:#dc2626" font-size="9">pic de l'eau (OH)</text><text x="${x(1.66)}" y="${y(.6)}" text-anchor="end" style="fill:#dc2626" font-size="9">absorption infrarouge →</text>`;
  el.innerHTML = s + "</svg>";
  const e2 = $("#tc-fib-dist"), W2 = 440, x2 = d3.scaleLinear([0, 100], [m.l, W2 - m.r]), y2 = d3.scaleLog([1e-3, 100], [H - m.b, m.t]);
  let t = svgOpen(W2, H, 10);
  [1e-3, .01, .1, 1, 10, 100].forEach(v => t += `<line x1="${m.l}" x2="${W2 - m.r}" y1="${y2(v)}" y2="${y2(v)}" stroke="#eef2f7"/><text x="${m.l - 4}" y="${y2(v) + 3}" text-anchor="end" style="fill:#64748b">${String(v).replace(".", ",")} %</text>`);
  [0, 25, 50, 75, 100].forEach(v => t += `<text x="${x2(v)}" y="${H - 12}" text-anchor="middle" style="fill:#64748b">${v} km</text>`);
  [[.2, "fibre 1 550 nm (0,2 dB/km)", "#16a34a"], [2.5, "fibre 850 nm (2,5 dB/km)", "#ca8a04"], [15, "paire de cuivre à 1 MHz (≈ 15 dB/km)", "#dc2626"]].forEach(([a, l, c], i) => { const pts = d3.range(0, 100.1, .5).map(d => [d, 100 * 10 ** (-a * d / 10)]).filter(p => p[1] >= 1e-3); t += `<path d="M${pts.map(([d, v]) => `${x2(d).toFixed(1)},${y2(v).toFixed(1)}`).join(" L")}" fill="none" stroke="${c}" stroke-width="2.2"/><text x="${x2(i === 0 ? 55 : i === 1 ? 10 : 2)}" y="${i === 0 ? y2(10 ** (-a * 55 / 10) * 100) - 6 : i === 1 ? y2(10 ** (-a * 10 / 10) * 100) - 6 : y2(.002)}" style="fill:${c}">${l}</text>`; });
  e2.innerHTML = t + "</svg>";
}

/* 12. orbites */
function orbite() {
  const el = $("#tc-orbite"); if (!el) return;
  const h = 10 ** +$("#tc-alt").value, R = 6371, mu = 398600.4418, a = R + h;
  $("#tc-alt-v").textContent = fr(h) + " km" + (Math.abs(h - 35786) < 800 ? " (géostationnaire)" : h < 2000 ? " (orbite basse)" : h > 19000 && h < 24000 ? " (orbite des GPS)" : " (orbite moyenne)");
  const T = 2 * Math.PI * Math.sqrt(a ** 3 / mu), eps = 25 * Math.PI / 180, lamb = Math.acos(R * Math.cos(eps) / a) - eps, frac = (1 - Math.cos(lamb)) / 2, diam = 2 * R * lamb, nsat = Math.ceil(2.5 / frac), rtt = 4 * h / 299792.458 * 1000;
  const slant = Math.sqrt(a * a - (R * Math.cos(eps)) ** 2) - R * Math.sin(eps);
  const W = 440, H = 400, cx = 220, cy = 210, sc = 180 / (R + Math.max(h, 2000)), Re = R * sc, Ra = a * sc;
  let s = svgOpen(W, H, 10);
  s += `<circle cx="${cx}" cy="${cy}" r="${Ra}" fill="none" stroke="#cbd5e1" stroke-dasharray="4 4"/><circle cx="${cx}" cy="${cy}" r="${Re}" fill="#bfdbfe" stroke="#2563eb"/>`;
  const sx = cx, sy = cy - Ra, p1 = [cx - Re * Math.sin(lamb), cy - Re * Math.cos(lamb)], p2 = [cx + Re * Math.sin(lamb), cy - Re * Math.cos(lamb)];
  s += `<path d="M${sx},${sy} L${p1[0]},${p1[1]} A${Re},${Re} 0 0 1 ${p2[0]},${p2[1]} Z" fill="#f59e0b" fill-opacity=".3" stroke="#f59e0b"/>`;
  s += `<path d="M${p1[0]},${p1[1]} A${Re},${Re} 0 0 1 ${p2[0]},${p2[1]}" fill="none" stroke="#dc2626" stroke-width="4"/>`;
  s += `<rect x="${sx - 6}" y="${sy - 4}" width="12" height="8" fill="#111827"/><line x1="${sx - 16}" x2="${sx + 16}" y1="${sy}" y2="${sy}" stroke="#2563eb" stroke-width="3"/>`;
  s += `<text x="${cx}" y="${cy + 4}" text-anchor="middle" style="fill:#1e3a8a" font-weight="700">Terre (à l'échelle)</text><text x="10" y="${H - 10}" style="fill:#64748b">rouge : zone couverte (satellite à plus de 25° au-dessus de l'horizon)</text>`;
  el.innerHTML = s + "</svg>";
  const Th = T / 3600;
  window.TH.kpis("#tc-orb-kpi", [[Th < 2 ? fr(T / 60) + " min" : fr(Th, 1) + " h", ["période de l'orbite", Math.abs(Th - 23.93) < .3 ? "= un jour sidéral : immobile dans le ciel" : "le satellite défile dans le ciel"], "Un tour de Terre"], [fr(rtt) + " ms", ["aller-retour minimal", "utilisateur → satellite → station, et retour"], "Latence ajoutée"], [fr(diam) + " km", ["diamètre de la zone couverte"], "Couverture"], [nsat > 1000 ? "≈ " + fr(Math.round(nsat / 100) * 100) : "≈ " + fr(nsat), ["satellites pour couvrir toute la Terre", "en continu (ordre de grandeur)"], "Constellation"], ["+" + fr(20 * Math.log10(41000 / slant), 0) + " dB", ["de signal par rapport à un géostationnaire", "(Friis, distance oblique)"], "Bilan de liaison"]]);
}
function latence() {
  const el = $("#tc-latence"); if (!el) return;
  logBars(el, [["Lumière dans le vide, en ligne droite (5 840 km) : limite physique", 39, "#16a34a"], ["Orbite basse avec liens laser (théorique)", 55, "#7c3aed"], ["Câble transatlantique (≈ 6 500 km de fibre)", 70, "#2563eb"], ["Satellite géostationnaire", 600, "#dc2626"]], 1, 2.85, "ms");
}

/* 13. couches */
function couches() {
  const el = $("#tc-couches"); if (!el) return;
  const L = [["Application", "web (HTTP), courriel, vidéo, DNS", "#7c3aed", "données"], ["Transport", "TCP (fiable), UDP (rapide), QUIC", "#2563eb", "port"], ["Réseau", "IP : adresse, routage de proche en proche", "#0ea5e9", "IP"], ["Liaison", "Ethernet, wifi (accès au canal), 4G/5G", "#16a34a", "MAC"], ["Physique", "fibre, cuivre, radio : modulation, OFDM", "#ca8a04", "signal"]];
  const W = 900, H = 280; let s = svgOpen(W, H);
  L.forEach(([n, d, c, h], i) => { const y = 10 + i * 52; s += `<rect x="10" y="${y}" width="420" height="44" rx="8" fill="${c}" fill-opacity=".14" stroke="${c}"/><text x="24" y="${y + 19}" font-weight="800" style="fill:${c}">${5 - i}. ${n}</text><text x="24" y="${y + 36}" style="fill:#334155">${d}</text>`;
    // encapsulation
    const x0 = 470, w = 300 - 0, k = i; let x = x0;
    if (k === 4) { s += `<path d="M${x0},${y + 22} ${d3.range(0, 400, 4).map(t => `L${x0 + t},${y + 22 - 12 * Math.sin(t / 8)}`).join(" ")}" fill="none" stroke="${c}" stroke-width="2"/><text x="${x0 + 200}" y="${y + 42}" text-anchor="middle" style="fill:#64748b" font-size="10">bits transformés en onde</text>`; return; }
    for (let j = k; j >= 1; j--) { const cc = L[j][2]; s += `<rect x="${x}" y="${y + 8}" width="46" height="28" fill="${cc}" fill-opacity=".85"/><text x="${x + 23}" y="${y + 26}" text-anchor="middle" style="fill:#fff" font-size="9.5">${L[j][3].split(" ")[0]}</text>`; x += 48; }
    s += `<rect x="${x}" y="${y + 8}" width="${400 - (x - x0)}" height="28" fill="#7c3aed" fill-opacity=".25" stroke="#7c3aed"/><text x="${x + (400 - (x - x0)) / 2}" y="${y + 26}" text-anchor="middle" style="fill:#5b21b6">données</text>`;
  });
  s += `<text x="470" y="${H - 4}" style="fill:#64748b" font-size="10.5">chaque couche ajoute son en-tête : un paquet est une poupée russe</text>`;
  el.innerHTML = s + "</svg>";
}

/* 15. SDR */
function sdr() {
  const el = $("#tc-sdr-ch"); if (!el) return;
  const B = [["Antenne", "#64748b"], ["Amplificateur faible bruit", "#2563eb"], ["Mélangeur + oscillateur local", "#7c3aed"], ["Convertisseur analogique-numérique", "#0ea5e9"], ["Échantillons I/Q", "#16a34a"], ["Logiciel : FFT, filtres, démodulation, décodage", "#dc2626"]];
  const W = 900, H = 130, w = 132; let s = svgOpen(W, H, 10.5) + `<defs><marker id="tcA" viewBox="0 0 10 10" refX="8" refY="5" markerUnits="userSpaceOnUse" markerWidth="10" markerHeight="10" orient="auto"><path d="M0,0 L10,5 L0,10z" fill="#64748b"/></marker></defs>`;
  B.forEach(([l, c], i) => { const x = 6 + i * (w + 16); s += `<rect x="${x}" y="24" width="${w}" height="70" rx="8" fill="${c}" fill-opacity=".12" stroke="${c}"/>`; const words = l.split(" "); let line = "", lines = []; words.forEach(wd => { if ((line + " " + wd).length > 18) { lines.push(line); line = wd; } else line = (line ? line + " " : "") + wd; }); lines.push(line); lines.forEach((t, j) => s += `<text x="${x + w / 2}" y="${58 - (lines.length - 1) * 7 + j * 14}" text-anchor="middle" style="fill:${c}" font-weight="700">${t}</text>`); if (i < B.length - 1) s += `<line x1="${x + w}" y1="58" x2="${x + w + 14}" y2="58" stroke="#64748b" stroke-width="2" marker-end="url(#tcA)"/>`; });
  s += `<text x="6" y="18" style="fill:#64748b">matériel (la clé USB)</text><text x="${6 + 4 * (w + 16)}" y="18" style="fill:#64748b">tout le reste est du code</text><line x1="${4 * (w + 16)}" x2="${4 * (w + 16)}" y1="8" y2="${H - 8}" stroke="#cbd5e1" stroke-dasharray="4 4"/>`;
  s += `<text x="6" y="${H - 14}" style="fill:#475569">Le mélangeur ramène la fréquence choisie autour de zéro : l'ordinateur ne traite que quelques MHz de bande, même pour un signal à 2 GHz.</text>`;
  el.innerHTML = s + "</svg>";
}

function init() {
  if (!window.TH || !window.d3) { setTimeout(init, 100); return; }
  if (!$("#telecom")) return;
  const run = f => { try { f(); } catch (e) { console.error(f.name, e); } };
  window.TH.kpis("#tc-kpis", [["≈ 99 %", ["du trafic entre continents", "passe par des câbles sous-marins"], "Câbles"], ["0,2 dB/km", ["atténuation d'une fibre", "à 1,55 µm"], "Fibre"], ["C = B log₂(1 + S/N)", ["la limite de Shannon (1948)"], "Information"], ["−174 dBm/Hz", ["bruit thermique à 20 °C", "le plancher de toute radio"], "Bruit"]]);
  [spectre, reseau, bilan, atmo, mursCh, carre, alias, capa, constel, ofdm, carte, wifiGen, canaux, gen, fibre, orbite, latence, couches, sdr].forEach(run);
  const on = (ids, f) => ids.forEach(i => $("#" + i)?.addEventListener("input", () => run(f)));
  on(["tc-f"], spectre); on(["tc-n", "tc-th", "tc-d"], reseau); on(["tc-lien", "tc-dist", "tc-murs"], bilan); on(["tc-harm"], carre); on(["tc-fe"], alias); on(["tc-B", "tc-M"], capa); on(["tc-qam", "tc-snr"], constel); on(["tc-alt"], orbite);
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
