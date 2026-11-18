/* Météo, chapitre 9 : la pratique du parapente */
(() => {
"use strict";
const $ = s => document.querySelector(s);
const fr = (v, d = 0) => v == null ? "–" : v.toLocaleString("fr-FR", { minimumFractionDigits: d, maximumFractionDigits: d });
const svg = (W, H, fs = 11) => `<svg viewBox="0 0 ${W} ${H}" width="100%" style="font-size:${fs}px">`;
const mk = (id, c) => `<marker id="${id}" viewBox="0 0 10 10" refX="8" refY="5" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="11" orient="auto"><path d="M0,0 L10,5 L0,10z" fill="${c}"/></marker>`;

function schema() {
  const el = $("#me-para-schema"); if (!el) return;
  const W = 900, H = 360, sol = 320;
  let s = svg(W, H) + `<defs>${mk("ppU", "#dc2626")}${mk("ppD", "#2563eb")}${mk("ppW", "#64748b")}<linearGradient id="ppSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#bfdbfe"/><stop offset="1" stop-color="#eff6ff"/></linearGradient></defs>`;
  s += `<rect width="${W}" height="${sol}" fill="url(#ppSky)"/>`;
  // inversion
  s += `<line x1="0" x2="${W}" y1="70" y2="70" stroke="#a855f7" stroke-dasharray="8 5"/><text x="${W - 8}" y="62" text-anchor="end" style="fill:#7c3aed" font-weight="700">inversion : le couvercle</text>`;
  s += `<line x1="0" x2="${W}" y1="110" y2="110" stroke="#94a3b8" stroke-dasharray="3 4"/><text x="8" y="104" style="fill:#475569">niveau de condensation ≈ 125 m × (T − T<tspan baseline-shift="sub" font-size="8">d</tspan>)</text>`;
  // sol : relief + sources
  s += `<path d="M0,${sol} L120,${sol} L200,${sol - 60} L260,${sol - 30} L330,${sol} L${W},${sol} L${W},${H} L0,${H} Z" fill="#a3a38a"/>`;
  s += `<rect x="420" y="${sol - 6}" width="90" height="6" fill="#eab308"/><text x="465" y="${sol + 18}" text-anchor="middle">champ sec</text>`;
  s += `<g fill="#166534">${[600, 625, 650, 675, 700, 725].map(x => `<circle cx="${x}" cy="${sol - 9}" r="11"/>`).join("")}</g><text x="662" y="${sol + 18}" text-anchor="middle">forêt (chauffe peu)</text>`;
  s += `<text x="210" y="${sol + 18}" text-anchor="middle">pente au soleil</text>`;
  // thermiques inclinés par le vent
  const th = (x0, y0, dx, c) => { let r = ""; for (let i = 0; i < 6; i++) { const y = y0 - i * 38, x = x0 + dx * i; r += `<ellipse cx="${x}" cy="${y}" rx="${18 + i * 3}" ry="12" fill="#fca5a5" opacity="${.55 - i * .05}"/>`; } r += `<line x1="${x0}" y1="${y0}" x2="${x0 + dx * 5.2}" y2="${y0 - 200}" stroke="${c}" stroke-width="2.5" marker-end="url(#ppU)"/>`; return r; };
  s += th(210, sol - 70, 6, "#dc2626") + th(465, sol - 18, 8, "#dc2626");
  // cumulus
  const cu = (x, w) => `<path d="M${x - w},110 Q${x - w},80 ${x - w * .5},78 Q${x - w * .4},48 ${x},52 Q${x + w * .4},44 ${x + w * .55},74 Q${x + w},78 ${x + w},110 Z" fill="#fff" stroke="#cbd5e1"/>`;
  s += cu(250, 55) + cu(510, 60);
  // descendances
  [[350, 120], [580, 130], [130, 140]].forEach(([x, y]) => s += `<line x1="${x}" y1="${y}" x2="${x}" y2="${y + 80}" stroke="#2563eb" stroke-width="2" stroke-dasharray="5 4" marker-end="url(#ppD)"/>`);
  s += `<text x="360" y="150" style="fill:#2563eb">air descendant autour</text>`;
  // parapente qui spirale
  s += `<ellipse cx="497" cy="180" rx="30" ry="9" fill="none" stroke="#f97316" stroke-dasharray="3 3"/><path d="M482,172 q15,-8 30,0" stroke="#f97316" stroke-width="4" fill="none"/><text x="535" y="184" style="fill:#c2410c" font-weight="700">on spirale dans le noyau</text>`;
  s += `<line x1="760" y1="40" x2="840" y2="40" stroke="#64748b" stroke-width="2" marker-end="url(#ppW)"/><text x="760" y="32" style="fill:#64748b">vent</text>`;
  s += `<text x="${W - 8}" y="200" text-anchor="end" style="fill:#475569">le cumulus est décalé sous le vent</text><text x="${W - 8}" y="216" text-anchor="end" style="fill:#475569">de la source au sol</text>`;
  el.innerHTML = s + "</svg>";
}

function journee() {
  const el = $("#me-para-jour-ch"); if (!el) return;
  const tx = +$("#me-pj-tx").value; let td = +$("#me-pj-td").value; const inv = +$("#me-pj-inv").value, inst = $("#me-pj-inst").checked;
  if (td > tx - 1) { td = tx - 1; $("#me-pj-td").value = td; }
  $("#me-pj-tx-v").textContent = tx + " °C"; $("#me-pj-td-v").textContent = td + " °C"; $("#me-pj-inv-v").textContent = fr(inv) + " m"; $("#me-pj-inv").disabled = inst;
  const tn = Math.max(td, tx - 13);
  const T = h => h <= 15 ? tn + (tx - tn) * Math.sin(Math.PI / 2 * Math.max(0, h - 6) / 9) : tn + (tx - tn) * Math.cos(Math.PI / 2 * (h - 15) / 9);
  const hrs = d3.range(7, 20.01, .25);
  const pts = hrs.map(h => { const dT = T(h) - tn, act = dT > 3; const base = 125 * (T(h) - td); const lid = inst ? 1e9 : inv; const brass = act ? Math.min(lid, inst ? base * 1.0 : Math.min(base, lid), 250 * (dT - 2) + 300) : 0; const plafond = act ? Math.min(base, lid, 250 * (dT - 2) + 300) : 0; const cu = act && base < Math.min(lid, 250 * (dT - 2) + 300); const w = act ? 1.25 * Math.sqrt(plafond / 1000) * Math.min(1, (dT - 3) / 5) : 0; return { h, plafond, base, cu, w }; });
  const W = 900, H = 300, m = { l: 60, r: 60, t: 16, b: 32 }, x = d3.scaleLinear([7, 20], [m.l, W - m.r]), ymax = Math.max(2000, inv + 400, ...pts.map(p => p.base * (inst ? 1.6 : 1))) , y = d3.scaleLinear([0, Math.min(6000, ymax)], [H - m.b, m.t]), y2 = d3.scaleLinear([0, 5], [H - m.b, m.t]);
  let s = svg(W, H);
  y.ticks(6).forEach(v => s += `<line x1="${m.l}" x2="${W - m.r}" y1="${y(v)}" y2="${y(v)}" stroke="#eef2f7"/><text x="${m.l - 5}" y="${y(v) + 3}" text-anchor="end" style="fill:#64748b">${fr(v)} m</text>`);
  [0, 1, 2, 3, 4, 5].forEach(v => s += `<text x="${W - m.r + 5}" y="${y2(v) + 3}" style="fill:#dc2626">${v} m/s</text>`);
  d3.range(8, 20.1, 2).forEach(v => s += `<text x="${x(v)}" y="${H - 14}" text-anchor="middle" style="fill:#64748b">${v} h</text>`);
  if (!inst) s += `<line x1="${m.l}" x2="${W - m.r}" y1="${y(inv)}" y2="${y(inv)}" stroke="#7c3aed" stroke-dasharray="8 5"/><text x="${m.l + 4}" y="${y(inv) - 5}" style="fill:#7c3aed">inversion</text>`;
  s += `<path d="M${pts.map(p => `${x(p.h).toFixed(1)},${y(p.plafond).toFixed(1)}`).join(" L")} L${x(20)},${y(0)} L${x(7)},${y(0)} Z" fill="#fde68a" opacity=".55"/>`;
  s += `<path d="M${pts.map(p => `${x(p.h).toFixed(1)},${y(p.plafond).toFixed(1)}`).join(" L")}" fill="none" stroke="#ca8a04" stroke-width="2.4"/>`;
  pts.forEach((p, i) => { if (p.cu && i % 4 === 0) { const X = x(p.h), Y = y(p.plafond); const big = inst && p.h > 12.5 && p.h < 18.5 && tx - td > 8; s += big ? `<path d="M${X - 16},${Y} Q${X - 16},${Y - 30} ${X},${Y - 70} Q${X + 16},${Y - 30} ${X + 16},${Y} Z" fill="#475569" opacity=".85"/>` : `<path d="M${X - 13},${Y} Q${X - 13},${Y - 12} ${X - 4},${Y - 13} Q${X},${Y - 22} ${X + 6},${Y - 14} Q${X + 13},${Y - 12} ${X + 13},${Y} Z" fill="#fff" stroke="#94a3b8"/>`; } });
  s += `<path d="M${pts.map(p => `${x(p.h).toFixed(1)},${y2(p.w).toFixed(1)}`).join(" L")}" fill="none" stroke="#dc2626" stroke-width="2"/>`;
  s += `<text x="${m.l + 4}" y="${m.t + 2}" style="fill:#ca8a04" font-weight="700">plafond au-dessus du sol (jaune) ; nuages : cumulus</text><text x="${W - m.r}" y="${m.t + 2}" text-anchor="end" style="fill:#dc2626" font-weight="700">vitesse de montée (rouge)</text>`;
  el.innerHTML = s + "</svg>";
  const best = pts.reduce((a, p) => p.w > a.w ? p : a, pts[0]), start = pts.find(p => p.w > .5), cuOn = pts.some(p => p.cu);
  let t = start ? `Thermiques exploitables à partir de <b>${fr(Math.floor(start.h))} h ${String(Math.round((start.h % 1) * 60)).padStart(2, "0")}</b>, meilleurs vers ${fr(Math.round(best.h))} h : plafond ≈ <b>${fr(Math.round(best.plafond / 50) * 50)} m</b> au-dessus du sol, montées ≈ ${fr(best.w, 1)} m/s. ` : "Journée trop stable ou trop peu ensoleillée : pas de thermiques exploitables. ";
  t += cuOn ? `La base des cumulus (${fr(Math.round(125 * (tx - td) / 50) * 50)} m) est sous ${inst ? "le sommet des ascendances" : "l'inversion"} : les thermiques sont marqués par des cumulus. ` : start ? "Les thermiques s'arrêtent sous l'inversion avant de condenser : <b>ciel bleu</b>, thermiques à chercher sans nuage. " : "";
  if (inst && cuOn && tx - td > 8) t += "<b>Air instable en altitude</b> : rien n'arrête les cumulus, qui peuvent grossir en congestus puis en cumulonimbus l'après-midi. Voler le matin et atterrir tôt.";
  else if (inst && cuOn) t += "Air instable mais humide : base basse, risque d'étalement et d'averses.";
  $("#me-para-jour-txt").innerHTML = t;
}

function brises() {
  const el = $("#me-para-brises-ch"); if (!el) return;
  const pente = h => { const d = (h - 13) / 5.5; return h > 7.5 && h < 18.5 ? 2.5 * Math.cos(Math.PI / 2 * Math.min(1, Math.abs((h - 12.5) / 6))) : -1.2 * Math.sin(Math.PI * ((h + 24 - 18.5) % 24) / 13); };
  const vallee = h => { const a = ((h - 9.5 + 24) % 24); return a < 11 ? 5 * Math.sin(Math.PI * a / 11) ** 1.2 : -2 * Math.sin(Math.PI * (a - 11) / 13); };
  const W = 900, H = 260, m = { l: 60, r: 20, t: 20, b: 32 }, x = d3.scaleLinear([0, 24], [m.l, W - m.r]), y = d3.scaleLinear([-3, 5.5], [H - m.b, m.t]);
  let s = svg(W, H);
  s += `<rect x="${x(0)}" y="${m.t}" width="${x(6.5) - x(0)}" height="${H - m.t - m.b}" fill="#1e293b" opacity=".07"/><rect x="${x(20.5)}" y="${m.t}" width="${x(24) - x(20.5)}" height="${H - m.t - m.b}" fill="#1e293b" opacity=".07"/>`;
  [-2, 0, 2, 4].forEach(v => s += `<line x1="${m.l}" x2="${W - m.r}" y1="${y(v)}" y2="${y(v)}" stroke="${v === 0 ? "#94a3b8" : "#eef2f7"}"/><text x="${m.l - 5}" y="${y(v) + 3}" text-anchor="end" style="fill:#64748b">${v} m/s</text>`);
  d3.range(0, 24.1, 3).forEach(v => s += `<text x="${x(v)}" y="${H - 14}" text-anchor="middle" style="fill:#64748b">${v} h</text>`);
  const ln = (f, c, lab, lx) => `<path d="M${d3.range(0, 24.01, .1).map(h => `${x(h).toFixed(1)},${y(f(h)).toFixed(1)}`).join(" L")}" fill="none" stroke="${c}" stroke-width="2.5"/><text x="${x(lx)}" y="${y(f(lx)) - 8}" style="fill:${c}" font-weight="700">${lab}</text>`;
  s += ln(pente, "#f59e0b", "brise de pente montante", 9.3) + ln(vallee, "#2563eb", "brise de vallée (remonte la vallée)", 13.5);
  s += `<text x="${x(19)}" y="${y(-1.2) + 18}" style="fill:#64748b">brises descendantes la nuit</text><text x="${x(18.6)}" y="${y(1.6)}" style="fill:#16a34a" font-weight="700">restitution du soir</text>`;
  s += `<text x="${m.l + 4}" y="${m.t - 6}" style="fill:#64748b">↑ montante ; ↓ descendante (vallée orientée vers le sud, journée d'été, ordres de grandeur)</text>`;
  el.innerHTML = s + "</svg>";
}

function relief() {
  const el = $("#me-para-relief-ch"); if (!el) return;
  const V = +$("#me-pr-v").value, p = +$("#me-pr-p").value; $("#me-pr-v-v").textContent = V + " km/h"; $("#me-pr-p-v").textContent = p + "°";
  const w = V / 3.6 * Math.sin(p * Math.PI / 180), sink = 1.1;
  const W = 900, H = 280, base = 250, hR = 160, wR = hR / Math.tan(p * Math.PI / 180), x0 = 330, top = [x0 + wR, base - hR];
  let s = svg(W, H) + `<defs>${mk("ppA", "#2563eb")}${mk("ppV", "#64748b")}</defs><rect width="${W}" height="${base}" fill="#eff6ff"/>`;
  s += `<path d="M0,${base} L${x0},${base} L${top[0]},${top[1]} L${top[0] + 60},${top[1] + 10} L${top[0] + 260},${base} L${W},${base} L${W},${H} L0,${H} Z" fill="#a8a29e"/>`;
  // lignes de courant
  for (let k = 0; k < 5; k++) { const y0 = base - 20 - k * 40; let d = `M0,${y0}`; for (let X = 0; X <= W; X += 10) { const bump = hR * Math.exp(-(((X - top[0] - 30) / (wR * .7 + 60 + k * 30)) ** 2)) * (1 - k * .16); d += ` L${X},${(y0 - bump).toFixed(1)}`; } s += `<path d="${d}" fill="none" stroke="#93c5fd" stroke-width="1.4"/>`; }
  s += `<line x1="10" y1="30" x2="90" y2="30" stroke="#64748b" stroke-width="2" marker-end="url(#ppV)"/><text x="10" y="22" style="fill:#64748b">vent ${V} km/h</text>`;
  const zx = x0 + wR * .55, zy = base - hR * .55 - 30;
  s += `<line x1="${zx}" y1="${zy + 30}" x2="${zx}" y2="${zy + 30 - Math.min(80, w * 18)}" stroke="#2563eb" stroke-width="3" marker-end="url(#ppA)"/><text x="${zx - 8}" y="${zy - 50}" text-anchor="end" style="fill:#2563eb" font-weight="700">ascendance ≈ ${fr(w, 1)} m/s</text>`;
  if (V > 12) { const rx = top[0] + 130, ry = base - 50; s += `<path d="M${rx - 30},${ry} a30,22 0 1,1 10,20 a18,14 0 1,1 -6,-12" fill="none" stroke="#dc2626" stroke-width="2"/><text x="${rx}" y="${ry - 34}" text-anchor="middle" style="fill:#dc2626" font-weight="700">rotor</text>`; }
  s += `<path d="M${zx - 18},${zy + 4} q18,-9 36,0" stroke="#f97316" stroke-width="4" fill="none"/>`;
  el.innerHTML = s + "</svg>";
  const marge = w - sink;
  $("#me-para-relief-txt").innerHTML = `Devant la pente, l'air monte à environ <b>${fr(w, 1)} m/s</b> ; l'aile chute de ${fr(sink, 1)} m/s : ` + (marge > 0.5 ? `on <b>monte</b> de ${fr(marge, 1)} m/s ; on peut tenir le long du relief.` : marge > 0 ? "on tient tout juste, au ras du relief : vol délicat." : "on <b>descend</b> : pas assez de vent ou pente trop douce pour tenir en dynamique.") + (V > 30 ? " <b>Vent trop fort</b> : un parapente (38 km/h bras hauts) risque de reculer derrière le relief, dans le rotor." : V > 22 ? " Vent soutenu : rester devant la crête, ne jamais passer derrière." : "");
}

function foehn() {
  const el = $("#me-para-foehn-ch"); if (!el) return;
  const W = 900, H = 300, x = d3.scaleLinear([0, 100], [20, W - 20]), y = d3.scaleLinear([0, 3500], [H - 20, 20]);
  let s = svg(W, H) + `<defs>${mk("ppF", "#64748b")}</defs>`;
  s += `<path d="M${x(0)},${y(500)} L${x(20)},${y(500)} L${x(50)},${y(3000)} L${x(80)},${y(500)} L${x(100)},${y(500)} L${x(100)},${H} L${x(0)},${H} Z" fill="#a8a29e"/>`;
  s += `<path d="M${x(5)},${y(700)} L${x(22)},${y(800)} L${x(30)},${y(1200)} L${x(50)},${y(3250)} L${x(70)},${y(1500)} L${x(82)},${y(800)} L${x(97)},${y(700)}" fill="none" stroke="#64748b" stroke-width="2.5" marker-end="url(#ppF)"/>`;
  s += `<path d="M${x(27)},${y(1000)} Q${x(36)},${y(1700)} ${x(50)},${y(3100)} L${x(52)},${y(3200)} Q${x(42)},${y(2300)} ${x(31)},${y(1300)} Z" fill="#fff" stroke="#cbd5e1"/>`;
  for (let i = 0; i < 9; i++) s += `<line x1="${x(29 + i * 2)}" y1="${y(950 + i * 150)}" x2="${x(28 + i * 2)}" y2="${y(600 + i * 120)}" stroke="#60a5fa"/>`;
  const lab = (px, alt, t, c, sub) => `<circle cx="${x(px)}" cy="${y(alt)}" r="4" fill="${c}"/><text x="${x(px)}" y="${y(alt) - 10}" text-anchor="middle" font-weight="800" style="fill:${c}">${t}</text><text x="${x(px)}" y="${y(alt) + 18}" text-anchor="middle" style="fill:#475569" font-size="10">${sub}</text>`;
  s += lab(10, 700, "15 °C", "#2563eb", "air humide, rosée 11 °C") + lab(27, 1200, "10 °C", "#2563eb", "condensation : −1 °C/100 m") + lab(50, 3250, "−2 °C", "#475569", "sommet : −0,5 °C/100 m en nuage") + lab(90, 700, "23 °C", "#dc2626", "foehn : +1 °C/100 m, air sec");
  s += `<text x="${x(35)}" y="${y(400)}" text-anchor="middle" style="fill:#1e3a8a" font-weight="700">versant au vent : pluie</text><text x="${x(70)}" y="${y(400)}" text-anchor="middle" style="fill:#991b1b" font-weight="700">versant sous le vent : chaud, sec, rafales</text>`;
  el.innerHTML = s + "</svg>";
}

const sinkP = v => 0.00248 * (v - 33) ** 2 + 1.0; // m/s, v en km/h
function polaire() {
  const el = $("#me-para-polaire-ch"); if (!el) return;
  const wv = +$("#me-pp-w").value, ma = +$("#me-pp-s").value;
  $("#me-pp-w-v").textContent = wv === 0 ? "nul" : wv < 0 ? `${-wv} km/h de face` : `${wv} km/h dans le dos`; $("#me-pp-s-v").textContent = ma === 0 ? "neutre" : ma > 0 ? `descend de ${fr(ma, 1)} m/s` : `monte de ${fr(-ma, 1)} m/s`;
  const V = d3.range(24, 56.01, .25);
  // vitesse optimale : maximise (v + vent) / (chute + descendance)
  let best = V[0], bf = -1e9; V.forEach(v => { const gs = v + wv, sk = sinkP(v) + ma; const f = sk > 0 ? gs / 3.6 / sk : 1e9 - sk; if (gs > 0 && f > bf) { bf = f; best = v; } });
  const W = 900, H = 300, m = { l: 60, r: 20, t: 20, b: 34 }, x = d3.scaleLinear([-30, 60], [m.l, W - m.r]), y = d3.scaleLinear([4, -2], [H - m.b, m.t]);
  let s = svg(W, H);
  [-2, -1, 0, 1, 2, 3, 4].forEach(v => s += `<line x1="${m.l}" x2="${W - m.r}" y1="${y(v)}" y2="${y(v)}" stroke="${v === 0 ? "#94a3b8" : "#eef2f7"}"/><text x="${m.l - 5}" y="${y(v) + 3}" text-anchor="end" style="fill:#64748b">${v > 0 ? "−" + v : v < 0 ? "+" + -v : 0} m/s</text>`);
  [-30, -15, 0, 15, 30, 45, 60].forEach(v => s += `<line x1="${x(v)}" x2="${x(v)}" y1="${m.t}" y2="${H - m.b}" stroke="${v === 0 ? "#94a3b8" : "#eef2f7"}"/><text x="${x(v)}" y="${H - 16}" text-anchor="middle" style="fill:#64748b">${v} km/h</text>`);
  s += `<path d="M${V.map(v => `${x(v).toFixed(1)},${y(sinkP(v)).toFixed(1)}`).join(" L")}" fill="none" stroke="#2563eb" stroke-width="2.6"/><text x="${x(50)}" y="${y(sinkP(50)) + 18}" style="fill:#2563eb" font-weight="700">polaire de l'aile</text>`;
  const ox = -wv, oy = -ma;
  s += `<circle cx="${x(ox)}" cy="${y(oy)}" r="5" fill="#dc2626"/><line x1="${x(ox)}" y1="${y(oy)}" x2="${x(best + (best - ox) * .25)}" y2="${y(sinkP(best) + (sinkP(best) - oy) * .25)}" stroke="#dc2626" stroke-dasharray="6 4" stroke-width="1.6"/><circle cx="${x(best)}" cy="${y(sinkP(best))}" r="6" fill="#dc2626"/>`;
  s += `<text x="${x(ox) + 8}" y="${y(oy) - 8}" style="fill:#dc2626">origine décalée (vent, masse d'air)</text><circle cx="${x(38)}" cy="${y(sinkP(38))}" r="4" fill="#64748b"/><text x="${x(38)}" y="${y(sinkP(38)) - 10}" text-anchor="middle" style="fill:#64748b">bras hauts</text>`;
  s += `<text x="${m.l + 4}" y="${m.t - 6}" style="fill:#64748b">↓ taux de chute ; → vitesse air</text>`;
  el.innerHTML = s + "</svg>";
  const gs = best + wv, sk = sinkP(best) + ma, f0 = 38 / 3.6 / sinkP(38);
  $("#me-para-polaire-txt").innerHTML = `Meilleure vitesse : <b>${fr(best)} km/h</b>${best > 39 ? " (accélérateur)" : ""}. Vitesse sol ${fr(gs)} km/h ; ` + (sk > 0 ? `finesse par rapport au sol <b>${fr(gs / 3.6 / sk, 1)}</b>, contre ${fr(f0, 1)} en air calme.` : "l'air monte plus vite que l'aile ne chute : on gagne de l'altitude, il faut au contraire ralentir pour rester dans l'ascendance.") + (wv < -20 ? " Face à un vent aussi fort, l'aile avance à peine : la marge de sécurité est mince." : "");
}

function init() {
  if (!window.d3) { setTimeout(init, 100); return; }
  if (!$("#me-para")) return;
  const run = f => { try { f(); } catch (e) { console.error(f.name, e); } };
  [schema, journee, brises, relief, foehn, polaire].forEach(run);
  const on = (ids, f) => ids.forEach(i => $("#" + i)?.addEventListener("input", () => run(f)));
  on(["me-pj-tx", "me-pj-td", "me-pj-inv", "me-pj-inst"], journee); on(["me-pr-v", "me-pr-p"], relief); on(["me-pp-w", "me-pp-s"], polaire);
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
