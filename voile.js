/* Onglet Voile et aérodynamique */
(() => {
"use strict";
const $ = s => document.querySelector(s);
const fr = (v, d = 0) => v == null ? "–" : v.toLocaleString("fr-FR", { minimumFractionDigits: d, maximumFractionDigits: d });
const rad = d => d * Math.PI / 180, deg = r => r * 180 / Math.PI;
const svg = (W, H, fs = 11) => `<svg viewBox="0 0 ${W} ${H}" width="100%" style="font-size:${fs}px">`;
const arrow = (id, c) => `<marker id="${id}" viewBox="0 0 10 10" refX="8" refY="5" markerUnits="userSpaceOnUse" markerWidth="12" markerHeight="12" orient="auto"><path d="M0,0 L10,5 L0,10z" fill="${c}"/></marker>`;

/* modèle de voile : CL, CD selon l'incidence (degrés) */
const AS = 18;
function CL(a) { return a <= AS ? Math.max(-0.2, 0.3 + 0.068 * a) : 0.3 + 0.068 * AS - 0.035 * (a - AS); }
function CD(a) { const cl = CL(a); return 0.03 + cl * cl / (Math.PI * 3 * 0.85) + (a > AS ? 0.012 * (a - AS) ** 1.5 : 0); }

function ecoul() {
  const el = $("#vo-ecoul"); if (!el) return;
  const a = +$("#vo-alpha").value; $("#vo-alpha-v").textContent = fr(a, 1) + "°";
  const W = 440, H = 300, cx = 210, cy = 150, ch = 200, stall = a > AS;
  let s = svg(W, H, 10) + `<defs>${arrow("voL", "#16a34a")}${arrow("voD", "#dc2626")}${arrow("voW", "#64748b")}</defs>`;
  // lignes de courant
  for (let k = -4; k <= 4; k++) {
    const y0 = cy + k * 28, defl = 34 * (1 - Math.min(1, Math.abs(k) / 5)) * Math.max(0, Math.min(1.2, CL(a) / 1.2));
    let d = `M10,${y0}`;
    for (let x = 10; x <= W - 10; x += 10) { const t = (x - 60) / 300, g = t < 0 ? 0 : t > 1 ? 1 : (1 - Math.cos(Math.PI * t)) / 2; const bump = k < 0 ? -10 * Math.sin(Math.PI * Math.max(0, Math.min(1, t))) * (1 - Math.abs(k) / 5) : 0; d += ` L${x},${(y0 + g * defl + bump).toFixed(1)}`; }
    if (stall && k < 0 && k > -3) continue;
    s += `<path d="${d}" fill="none" stroke="#93c5fd" stroke-width="1.4"/>`;
  }
  // voile : arc de cercle de cambrure 10 %, tournée de -a
  const pts = d3.range(0, 1.001, .05).map(t => [(t - .5) * ch, -0.4 * ch * 0.1 * 4 * t * (1 - t) * 2.2]);
  const r = rad(a), P = pts.map(([x, y]) => [cx + x * Math.cos(r) - y * Math.sin(r), cy + x * Math.sin(r) + y * Math.cos(r)]);
  s += `<path d="M${P.map(p => p.map(v => v.toFixed(1)).join(",")).join(" L")}" fill="none" stroke="currentColor" stroke-width="4"/>`;
  if (stall) for (let i = 0; i < 6; i++) { const t = .35 + i * .12, x = cx + (t - .5) * ch * Math.cos(r) + 12 * Math.sin(r), y = cy - 26 - i * 3; s += `<path d="M${x - 10},${y} a10,8 0 1,1 4,8 a6,5 0 1,1 -3,-6" fill="none" stroke="#dc2626" stroke-width="1.3"/>`; }
  s += `<line x1="16" y1="24" x2="70" y2="24" stroke="#64748b" stroke-width="2" marker-end="url(#voW)"/><text x="16" y="16" style="fill:#64748b">vent</text>`;
  const cl = CL(a), cd = CD(a), k = 70;
  s += `<line x1="${cx}" y1="${cy}" x2="${cx}" y2="${cy - k * cl}" stroke="#16a34a" stroke-width="3.5" marker-end="url(#voL)"/><text x="${cx + 6}" y="${cy - k * cl + 4}" style="fill:#16a34a" font-weight="700">portance</text>`;
  s += `<line x1="${cx}" y1="${cy}" x2="${cx + k * cd}" y2="${cy}" stroke="#dc2626" stroke-width="3.5" marker-end="url(#voD)"/><text x="${cx + k * cd + 6}" y="${cy + 14}" style="fill:#dc2626" font-weight="700">traînée</text>`;
  s += `<text x="${W - 10}" y="${H - 10}" text-anchor="end" style="fill:${stall ? "#dc2626" : "#475569"}" font-weight="${stall ? 700 : 400}">${stall ? "décrochage : l'écoulement décolle de l'extrados" : a < 2 ? "incidence trop faible : la voile faseye" : "écoulement collé des deux côtés"}</text>`;
  el.innerHTML = s + "</svg>";
  clcd(a);
}
function clcd(a) {
  const el = $("#vo-clcd"); if (!el) return;
  const W = 440, H = 300, m = { l: 40, r: 50, t: 14, b: 30 }, x = d3.scaleLinear([-4, 30], [m.l, W - m.r]), y = d3.scaleLinear([0, 1.7], [H - m.b, m.t]), y2 = d3.scaleLinear([0, 12], [H - m.b, m.t]);
  let s = svg(W, H, 10);
  [0, .5, 1, 1.5].forEach(v => s += `<line x1="${m.l}" x2="${W - m.r}" y1="${y(v)}" y2="${y(v)}" stroke="#eef2f7"/><text x="${m.l - 4}" y="${y(v) + 3}" text-anchor="end" style="fill:#64748b">${fr(v, 1)}</text>`);
  [0, 4, 8, 12].forEach(v => s += `<text x="${W - m.r + 4}" y="${y2(v) + 3}" style="fill:#7c3aed">${v}</text>`);
  [0, 10, 20, 30].forEach(v => s += `<text x="${x(v)}" y="${H - 12}" text-anchor="middle" style="fill:#64748b">${v}°</text>`);
  s += `<rect x="${x(AS)}" y="${m.t}" width="${x(30) - x(AS)}" height="${H - m.t - m.b}" fill="#fee2e2" opacity=".5"/><text x="${x(24)}" y="${m.t + 12}" text-anchor="middle" style="fill:#dc2626">décroché</text>`;
  const ln = (f, sc, c, w) => `<path d="M${d3.range(-4, 30.01, .25).map(v => `${x(v).toFixed(1)},${sc(Math.max(0, f(v))).toFixed(1)}`).join(" L")}" fill="none" stroke="${c}" stroke-width="${w}"/>`;
  s += ln(CL, y, "#16a34a", 2.4) + ln(CD, y, "#dc2626", 2.4) + ln(v => CL(v) / CD(v), y2, "#7c3aed", 1.6);
  s += `<text x="${x(2)}" y="${y(CL(2)) - 6}" style="fill:#16a34a">C<tspan baseline-shift="sub" font-size="8">L</tspan> portance</text><text x="${x(22)}" y="${y(CD(22)) - 6}" style="fill:#dc2626">C<tspan baseline-shift="sub" font-size="8">D</tspan> traînée</text><text x="${x(9)}" y="${y2(CL(9) / CD(9)) - 6}" style="fill:#7c3aed">finesse L/D (échelle de droite)</text>`;
  s += `<line x1="${x(a)}" x2="${x(a)}" y1="${m.t}" y2="${H - m.b}" stroke="currentColor" stroke-dasharray="4 3"/>`;
  el.innerHTML = s + "</svg>";
  $("#vo-alpha-txt").innerHTML = `À ${fr(a, 1)}° : C<sub>L</sub> ≈ ${fr(CL(a), 2)}, C<sub>D</sub> ≈ ${fr(CD(a), 3)}, finesse ≈ ${fr(CL(a) / CD(a), 1)}. ` + (a > AS ? "Au-delà du décrochage, la portance baisse et la traînée grimpe : au portant, une voile travaille volontairement ainsi, comme un parachute." : a > 12 ? "Portance proche du maximum : réglage de puissance (vent faible, mer formée)." : a > 4 ? "Zone de meilleure finesse : le réglage du près." : "Incidence trop faible : la voile commence à se dégonfler côté au vent.");
}

function polaire() {
  const el = $("#vo-pol"); if (!el) return;
  const A = +$("#vo-ar").value; $("#vo-ar-v").textContent = fr(A, 1) + (A < 2.5 ? " (foc, spi)" : A < 4.5 ? " (grand-voile de croisière)" : A < 7 ? " (parapente, voile de course)" : A < 12 ? " (deltaplane, aile d'avion)" : " (planeur, albatros)");
  const cd0 = .012, e = .9, pol = Ar => d3.range(0, 1.41, .02).map(c => [cd0 + c * c / (Math.PI * Ar * e), c]);
  const W = 440, H = 300, m = { l: 40, r: 12, t: 14, b: 30 }, x = d3.scaleLinear([0, .25], [m.l, W - m.r]), y = d3.scaleLinear([0, 1.45], [H - m.b, m.t]);
  let s = svg(W, H, 10);
  [0, .5, 1].forEach(v => s += `<line x1="${m.l}" x2="${W - m.r}" y1="${y(v)}" y2="${y(v)}" stroke="#eef2f7"/><text x="${m.l - 4}" y="${y(v) + 3}" text-anchor="end" style="fill:#64748b">${fr(v, 1)}</text>`);
  [0, .05, .1, .15, .2, .25].forEach(v => s += `<text x="${x(v)}" y="${H - 12}" text-anchor="middle" style="fill:#64748b">${fr(v, 2)}</text>`);
  s += `<text x="${W - m.r}" y="${H - 1}" text-anchor="end" style="fill:#64748b">C<tspan baseline-shift="sub" font-size="8">D</tspan> traînée →</text><text x="${m.l + 4}" y="${m.t + 4}" style="fill:#64748b">↑ C<tspan baseline-shift="sub" font-size="8">L</tspan> portance</text>`;
  const line = (P, c, w) => `<path d="M${P.map(([a, b]) => `${x(Math.min(.25, a)).toFixed(1)},${y(b).toFixed(1)}`).join(" L")}" fill="none" stroke="${c}" stroke-width="${w}"/>`;
  [3, 30].forEach(Ar => { if (Ar !== A) s += line(pol(Ar), "#cbd5e1", 1.2); });
  s += line(pol(A), "#2563eb", 2.6);
  const cls = Math.sqrt(cd0 * Math.PI * A * e), cds = 2 * cd0, F = cls / cds;
  s += `<line x1="${x(0)}" y1="${y(0)}" x2="${x(Math.min(.25, cds * 1.45 / cls))}" y2="${y(Math.min(1.45, 1.45))}" stroke="#7c3aed" stroke-dasharray="5 4"/><circle cx="${x(cds)}" cy="${y(Math.min(1.4, cls))}" r="5" fill="#7c3aed"/><text x="${x(cds) + 8}" y="${y(Math.min(1.4, cls)) + 14}" style="fill:#7c3aed" font-weight="700">finesse max ≈ ${fr(F, 0)}</text>`;
  s += `<text x="${x(.2)}" y="${y(.55)}" style="fill:#94a3b8">allongement 3</text><text x="${x(.035)}" y="${y(1.3)}" style="fill:#94a3b8">30</text>`;
  el.innerHTML = s + "</svg>";
}
function finesse() {
  const el = $("#vo-finesse"); if (!el) return;
  window.TH.bars(el, [["Combinaison ailée (wingsuit)", 2.5, "#94a3b8"], ["Navette spatiale (retour)", 4.5, "#64748b"], ["Voilier au près (voiles seules)", 5, "#0ea5e9"], ["Parapente", 10, "#f59e0b"], ["Deltaplane", 15, "#ea580c"], ["Avion de ligne", 18, "#2563eb"], ["Albatros", 20, "#16a34a"], ["Planeur de compétition", 60, "#7c3aed"]].map(([l, v, c]) => ({ l, v, t: fr(v, v < 10 ? 1 : 0), c })));
}

/* vent apparent */
function triangle() {
  const el = $("#vo-triangle"); if (!el) return;
  const t = +$("#vo-tws").value, th = +$("#vo-twa").value, b = +$("#vo-bs").value;
  $("#vo-tws-v").textContent = t + " nœuds"; $("#vo-twa-v").textContent = th + "°"; $("#vo-bs-v").textContent = fr(b, 1) + " nœuds";
  // vecteurs « soufflant vers » (x à droite, y vers le haut), vent venant de tribord
  const TW = [-t * Math.sin(rad(th)), -t * Math.cos(rad(th))], BW = [0, -b], AW = [TW[0] + BW[0], TW[1] + BW[1]];
  const aws = Math.hypot(...AW), awa = deg(Math.atan2(-AW[0], -AW[1]));
  const W = 900, H = 290, cx = 450, cy = 220, k = Math.min(9, 190 / Math.max(t, b, aws, 1));
  let s = svg(W, H) + `<defs>${arrow("voT", "#2563eb")}${arrow("voB", "#64748b")}${arrow("voA", "#dc2626")}</defs>`;
  s += `<path d="M${cx},${cy - 60} C${cx + 18},${cy - 30} ${cx + 18},${cy + 30} ${cx + 10},${cy + 55} L${cx - 10},${cy + 55} C${cx - 18},${cy + 30} ${cx - 18},${cy - 30} ${cx},${cy - 60} Z" fill="#f8fafc" stroke="#334155" stroke-width="2"/>`;
  // vent réel : flèche qui arrive sur le bateau
  const s0 = [cx - TW[0] * k, cy + TW[1] * k];
  s += `<line x1="${s0[0]}" y1="${s0[1]}" x2="${cx}" y2="${cy}" stroke="#2563eb" stroke-width="3" marker-end="url(#voT)"/><text x="${s0[0]}" y="${s0[1] - 6}" text-anchor="middle" style="fill:#2563eb" font-weight="700">vent réel ${t} nd</text>`;
  const a0 = [cx - AW[0] * k, cy + AW[1] * k];
  s += `<line x1="${a0[0]}" y1="${a0[1]}" x2="${cx}" y2="${cy}" stroke="#dc2626" stroke-width="3.5" marker-end="url(#voA)"/><text x="${a0[0] + (a0[0] > cx ? 8 : -8)}" y="${a0[1] + 4}" text-anchor="${a0[0] > cx ? "start" : "end"}" style="fill:#dc2626" font-weight="700">vent apparent ${fr(aws, 1)} nd à ${fr(awa)}°</text>`;
  // triangle de construction
  s += `<line x1="${s0[0]}" y1="${s0[1]}" x2="${a0[0]}" y2="${a0[1]}" stroke="#64748b" stroke-dasharray="4 3"/><text x="${(s0[0] + a0[0]) / 2 + 6}" y="${(s0[1] + a0[1]) / 2}" style="fill:#64748b">vent de vitesse ${fr(b, 1)} nd</text>`;
  s += `<text x="${cx}" y="${cy - 70}" text-anchor="middle" style="fill:#334155">avant</text>`;
  el.innerHTML = s + "</svg>";
  $("#vo-triangle-txt").innerHTML = `Le vent apparent vient de <b>${fr(awa)}°</b> (contre ${th}° pour le vent réel) et souffle à <b>${fr(aws, 1)} nœuds</b> (${aws > t ? "plus" : "moins"} que le vent réel).` + (b > t && th > 100 ? " Le bateau va plus vite que le vent : même en descendant, le vent apparent vient de l'avant." : "") + (th > 150 ? " Au vent arrière, on retranche la vitesse du bateau : le vent apparent faiblit, c'est l'allure la plus trompeuse (on sous-estime le vent réel)." : "");
}

/* équilibre des forces (Lanchester) */
function forces() {
  const el = $("#vo-forces-ch"); if (!el) return;
  const fa = +$("#vo-fa").value, fh = +$("#vo-fh").value; $("#vo-fa-v").textContent = fr(fa, 1); $("#vo-fh-v").textContent = fr(fh, 1);
  const ea = deg(Math.atan(1 / fa)), eh = deg(Math.atan(1 / fh)), beta = ea + eh;
  // angle au vent réel pour V bateau / V vent = 0,6
  const r = .6, bb = r, tt = 1, a = bb * Math.cos(rad(beta)) + Math.sqrt(tt * tt - bb * bb * Math.sin(rad(beta)) ** 2), twa = deg(Math.atan2(a * Math.sin(rad(beta)), a * Math.cos(rad(beta)) - bb));
  const W = 900, H = 340, cx = 430, cy = 200;
  let s = svg(W, H) + `<defs>${arrow("voF", "#16a34a")}${arrow("voH", "#2563eb")}${arrow("voA2", "#dc2626")}${arrow("voP", "#7c3aed")}</defs>`;
  s += `<g transform="rotate(0 ${cx} ${cy})"><path d="M${cx},${cy - 80} C${cx + 22},${cy - 40} ${cx + 22},${cy + 40} ${cx + 12},${cy + 75} L${cx - 12},${cy + 75} C${cx - 22},${cy + 40} ${cx - 22},${cy - 40} ${cx},${cy - 80} Z" fill="#f8fafc" stroke="#334155" stroke-width="2"/></g>`;
  // vent apparent venant de beta (tribord avant)
  const L = 150, wa = [cx + L * Math.sin(rad(beta)), cy - L * Math.cos(rad(beta))];
  s += `<line x1="${wa[0]}" y1="${wa[1]}" x2="${cx + 20 * Math.sin(rad(beta))}" y2="${cy - 20 * Math.cos(rad(beta))}" stroke="#dc2626" stroke-width="2.5" marker-end="url(#voA2)"/><text x="${wa[0] + 6}" y="${wa[1]}" style="fill:#dc2626" font-weight="700">vent apparent (${fr(beta, 1)}° de l'axe)</text>`;
  // force aéro : perpendiculaire au vent apparent, inclinée de ea vers l'arrière ; direction = beta - 90 - ... vers bâbord avant
  const Fdir = beta - 90 - ea, F = 140, fp = [cx + F * Math.sin(rad(Fdir)), cy - F * Math.cos(rad(Fdir))];
  s += `<line x1="${cx}" y1="${cy}" x2="${fp[0]}" y2="${fp[1]}" stroke="#16a34a" stroke-width="4" marker-end="url(#voF)"/><text x="${fp[0] - 6}" y="${fp[1] - 6}" text-anchor="end" style="fill:#16a34a" font-weight="700">force des voiles</text>`;
  const prop = F * Math.cos(rad(Fdir)), lat = F * Math.sin(rad(Fdir));
  s += `<line x1="${cx}" y1="${cy}" x2="${cx}" y2="${cy - prop}" stroke="#7c3aed" stroke-width="2.5" stroke-dasharray="5 3" marker-end="url(#voP)"/><text x="${cx + 8}" y="${cy - prop + 4}" style="fill:#7c3aed" font-weight="700">propulsion</text>`;
  s += `<line x1="${cx}" y1="${cy}" x2="${cx + lat}" y2="${cy}" stroke="#7c3aed" stroke-width="2.5" stroke-dasharray="5 3" marker-end="url(#voP)"/><text x="${cx + lat - 4}" y="${cy + 18}" text-anchor="end" style="fill:#7c3aed" font-weight="700">dérive</text>`;
  const hp = [cx - (fp[0] - cx), cy - (fp[1] - cy)];
  s += `<line x1="${cx}" y1="${cy}" x2="${hp[0]}" y2="${hp[1]}" stroke="#2563eb" stroke-width="4" marker-end="url(#voH)"/><text x="${hp[0] + 6}" y="${hp[1] + 16}" style="fill:#2563eb" font-weight="700">force de la quille et de la coque</text>`;
  s += `<text x="20" y="30" font-weight="700">β = ε<tspan baseline-shift="sub" font-size="8">A</tspan> + ε<tspan baseline-shift="sub" font-size="8">H</tspan> = ${fr(ea, 1)}° + ${fr(eh, 1)}° = ${fr(beta, 1)}°</text><text x="20" y="50" style="fill:#475569">angle minimal entre la route et le vent apparent</text>`;
  el.innerHTML = s + "</svg>";
  $("#vo-forces-txt").innerHTML = `Avec ces finesses, le bateau ne peut pas faire route à moins de <b>${fr(beta, 1)}°</b> du vent apparent, soit environ <b>${fr(twa)}°</b> du vent réel s'il avance à 60 % de la vitesse du vent. ` + (beta > 35 ? "C'est le cas d'un vieux gréement ou d'un bateau à quille courte : il tire des bords à plus de 100° l'un de l'autre." : beta < 22 ? "C'est le niveau d'un voilier de course moderne (quille profonde, voiles plates)." : "C'est un voilier de croisière moderne : il vire de bord sur environ 90° de vent réel.") + " Améliorer la finesse de la quille compte autant que celle des voiles.";
}

function gz() {
  const el = $("#vo-gz"); if (!el) return;
  const mono = p => 0.9 * Math.sin(Math.PI * p / 125), cat = p => p < 10 ? 3 * p / 10 : 3 * Math.cos(rad(p)) / Math.cos(rad(10)), deriv = p => p < 60 ? 0.35 * Math.sin(Math.PI * p / 60) : -0.45 * Math.sin(Math.PI * (p - 60) / 120);
  const W = 900, H = 260, m = { l: 50, r: 20, t: 14, b: 30 }, x = d3.scaleLinear([0, 180], [m.l, W - m.r]), y = d3.scaleLinear([-1.2, 3.2], [H - m.b, m.t]);
  let s = svg(W, H);
  [-1, 0, 1, 2, 3].forEach(v => s += `<line x1="${m.l}" x2="${W - m.r}" y1="${y(v)}" y2="${y(v)}" stroke="${v === 0 ? "#94a3b8" : "#eef2f7"}"/><text x="${m.l - 5}" y="${y(v) + 3}" text-anchor="end" style="fill:#64748b">${v} m</text>`);
  [0, 30, 60, 90, 120, 150, 180].forEach(v => s += `<text x="${x(v)}" y="${H - 12}" text-anchor="middle" style="fill:#64748b">${v}°</text>`);
  const ln = (f, c, lab, lx) => `<path d="M${d3.range(0, 180.1, 1).map(p => `${x(p).toFixed(1)},${y(Math.max(-1.2, Math.min(3.2, f(p)))).toFixed(1)}`).join(" L")}" fill="none" stroke="${c}" stroke-width="2.4"/><text x="${x(lx)}" y="${y(f(lx)) - 8}" style="fill:${c}" font-weight="700">${lab}</text>`;
  s += ln(mono, "#2563eb", "monocoque lesté : revient jusqu'à 125°", 62) + ln(cat, "#dc2626", "catamaran : très raide, puis chavire", 32) + ln(deriv, "#16a34a", "dériveur sans lest (équipage au rappel)", 100);
  s += `<text x="${W - m.r}" y="${H - 1}" text-anchor="end" style="fill:#64748b">angle de gîte →</text><text x="${x(120)}" y="${m.t + 14}" style="fill:#64748b">↑ bras de levier de redressement GZ (ordres de grandeur)</text>`;
  el.innerHTML = s + "</svg>";
}

/* carène */
function resist() {
  const el = $("#vo-resist"); if (!el) return;
  const L = +$("#vo-lwl").value; $("#vo-lwl-v").textContent = fr(L, 1) + " m";
  const vh = 2.43 * Math.sqrt(L), g = 9.81;
  const Fn = vk => vk * 0.5144 / Math.sqrt(g * L);
  const R = vk => 0.002 * (Fn(vk) / 0.2) ** 2 + 0.03 * (Fn(vk) / 0.45) ** 10;
  const W = 900, H = 280, m = { l: 60, r: 20, t: 14, b: 32 }, vmax = vh * 1.35, x = d3.scaleLinear([0, vmax], [m.l, W - m.r]), y = d3.scaleLinear([0, .12], [H - m.b, m.t]);
  let s = svg(W, H);
  [0, .04, .08, .12].forEach(v => s += `<line x1="${m.l}" x2="${W - m.r}" y1="${y(v)}" y2="${y(v)}" stroke="#eef2f7"/><text x="${m.l - 5}" y="${y(v) + 3}" text-anchor="end" style="fill:#64748b">${fr(v * 100)} %</text>`);
  x.ticks(8).forEach(v => s += `<text x="${x(v)}" y="${H - 14}" text-anchor="middle" style="fill:#64748b">${v} nd</text>`);
  s += `<path d="M${d3.range(0, vmax, vmax / 200).map(v => `${x(v).toFixed(1)},${y(Math.min(.12, 0.002 * (Fn(v) / 0.2) ** 2)).toFixed(1)}`).join(" L")}" fill="none" stroke="#0ea5e9" stroke-width="1.6" stroke-dasharray="5 4"/>`;
  s += `<path d="M${d3.range(0, vmax, vmax / 300).map(v => `${x(v).toFixed(1)},${y(Math.min(.12, R(v))).toFixed(1)}`).join(" L")}" fill="none" stroke="#dc2626" stroke-width="2.6"/>`;
  s += `<line x1="${x(vh)}" x2="${x(vh)}" y1="${m.t}" y2="${H - m.b}" stroke="#7c3aed" stroke-dasharray="6 4"/><text x="${x(vh) + 6}" y="${m.t + 14}" style="fill:#7c3aed" font-weight="700">vitesse de coque ${fr(vh, 1)} nd</text>`;
  s += `<text x="${x(vmax * .1)}" y="${y(.006) - 6}" style="fill:#0ea5e9">frottement seul</text><text x="${x(vh * 1.12)}" y="${y(.1)}" style="fill:#dc2626" font-weight="700">« mur » de la vague d'étrave</text>`;
  s += `<text x="${m.l + 4}" y="${m.t + 4}" style="fill:#64748b">↑ résistance en % du poids du bateau (modèle simplifié, bateau lourd non planant)</text>`;
  el.innerHTML = s + "</svg>";
  $("#vo-resist-txt").innerHTML = `Flottaison de ${fr(L, 1)} m : vitesse de coque ≈ <b>${fr(vh, 1)} nœuds</b> (${fr(vh * 1.852, 1)} km/h). La vague d'étrave a alors une longueur égale à celle du bateau. Pour aller 20 % plus vite, il faudrait environ ${fr(R(vh * 1.2) / R(vh), 0)} fois plus de force : aucun voilier lourd n'en a les moyens.`;
}
function regimes() {
  const el = $("#vo-regimes"); if (!el) return;
  const W = 900, H = 260, m = { l: 50, r: 20, t: 20, b: 32 }, x = d3.scaleLinear([0, 40], [m.l, W - m.r]), y = d3.scaleLinear([0, 1], [H - m.b, m.t]);
  const dep = v => Math.min(1.2, 0.0025 * v * v + 0.6 * Math.max(0, (v - 6) / 4) ** 3);
  const pla = v => 0.0004 * v * v + 0.3 * Math.exp(-(((v - 9) / 3.5) ** 2)) + 0.0025 * v * v * Math.exp(-v / 6);
  const foil = v => v < 14 ? pla(v) * 1.08 : 0.12 + 0.00022 * v * v + 0.2 * Math.exp(-(v - 14) / 1.5);
  let s = svg(W, H);
  [0, 10, 20, 30, 40].forEach(v => s += `<text x="${x(v)}" y="${H - 14}" text-anchor="middle" style="fill:#64748b">${v} nd</text>`);
  const ln = (f, c, lab, lx) => `<path d="M${d3.range(0, 40.1, .2).map(v => `${x(v).toFixed(1)},${y(Math.min(1, f(v))).toFixed(1)}`).join(" L")}" fill="none" stroke="${c}" stroke-width="2.6"/><text x="${x(lx) + 6}" y="${y(Math.min(1, f(lx))) - 6}" style="fill:${c}" font-weight="700">${lab}</text>`;
  s += ln(dep, "#64748b", "coque lourde : bloquée par sa vague", 7.2) + ln(pla, "#2563eb", "coque planante : bosse puis glisse", 33) + ln(foil, "#7c3aed", "foils : décollage, puis la coque sort de l'eau", 17);
  s += `<text x="${m.l + 4}" y="${m.t - 4}" style="fill:#64748b">↑ résistance totale (schématique, unités arbitraires)</text>`;
  el.innerHTML = s + "</svg>";
}

/* polaire des vitesses */
const BAT = {
  croisiere: { vmax: { 6: 4.6, 12: 7.0, 20: 7.6 }, a0: 32, peak: 100, down: .82 },
  imoca: { vmax: { 6: 9, 12: 19, 20: 27 }, a0: 38, peak: 120, down: .55 }
};
function vb(b, tws, th) {
  const B = BAT[b], V = B.vmax[tws];
  if (th < B.a0) return 0;
  const u = Math.min(1, (th - B.a0) / (B.peak - B.a0));
  const up = Math.sqrt(Math.sin(u * Math.PI / 2)) * (0.62 + 0.38 * u);
  const dn = th > B.peak ? 1 - (1 - B.down) * ((th - B.peak) / (180 - B.peak)) ** 1.6 : 1;
  return V * up * dn;
}
function polVit() {
  const el = $("#vo-polvit"); if (!el) return;
  const b = $("#vo-bateau").value, tws = +$("#vo-pol-tws").value, tw = [6, 12, 20];
  const W = 440, H = 440, cx = 40, cy = 220, vmax = Math.max(...tw.map(t => BAT[b].vmax[t])) * 1.1, R = 190, r = v => v / vmax * R;
  let s = svg(W, H, 10);
  d3.range(5, vmax, vmax > 20 ? 10 : 2).forEach(v => s += `<path d="M${cx},${cy - r(v)} A${r(v)},${r(v)} 0 0 1 ${cx},${cy + r(v)}" fill="none" stroke="#eef2f7"/><text x="${cx + 3}" y="${cy - r(v) - 2}" style="fill:#94a3b8">${v} nd</text>`);
  [0, 45, 90, 135, 180].forEach(a => s += `<line x1="${cx}" y1="${cy}" x2="${cx + R * Math.sin(rad(a))}" y2="${cy - R * Math.cos(rad(a))}" stroke="#eef2f7"/><text x="${cx + (R + 14) * Math.sin(rad(a))}" y="${cy - (R + 14) * Math.cos(rad(a)) + 4}" text-anchor="middle" style="fill:#64748b">${a}°</text>`);
  const cols = { 6: "#93c5fd", 12: "#2563eb", 20: "#1e3a8a" };
  tw.forEach(t => { const P = d3.range(0, 180.1, 1).map(a => { const v = vb(b, t, a); return [cx + r(v) * Math.sin(rad(a)), cy - r(v) * Math.cos(rad(a))]; }); s += `<path d="M${P.map(p => p.map(q => q.toFixed(1)).join(",")).join(" L")}" fill="none" stroke="${cols[t]}" stroke-width="${t === tws ? 3 : 1.4}"/>`; });
  // VMG optimum
  let bu = 0, bd = 0, au = 0, ad = 0; d3.range(0, 180.1, .5).forEach(a => { const v = vb(b, tws, a) * Math.cos(rad(a)); if (v > bu) { bu = v; au = a; } if (v < bd) { bd = v; ad = a; } });
  [[au, "#16a34a"], [ad, "#dc2626"]].forEach(([a, c]) => { const v = vb(b, tws, a); s += `<line x1="${cx}" y1="${cy}" x2="${cx + r(v) * Math.sin(rad(a))}" y2="${cy - r(v) * Math.cos(rad(a))}" stroke="${c}" stroke-width="2"/><circle cx="${cx + r(v) * Math.sin(rad(a))}" cy="${cy - r(v) * Math.cos(rad(a))}" r="5" fill="${c}"/>`; });
  s += `<text x="${W - 6}" y="16" text-anchor="end" font-weight="700">Vitesse du bateau selon l'angle au vent réel</text>`;
  tw.forEach((t, i) => s += `<line x1="${W - 130}" x2="${W - 110}" y1="${36 + i * 16}" y2="${36 + i * 16}" stroke="${cols[t]}" stroke-width="3"/><text x="${W - 106}" y="${40 + i * 16}">vent ${t} nœuds</text>`);
  s += `<text x="${cx + 4}" y="${H - 10}" style="fill:#64748b">vent réel venant du haut ↓</text>`;
  el.innerHTML = s + "</svg>";
  // VMG
  const e2 = $("#vo-vmg"), W2 = 440, H2 = 300, m = { l: 40, r: 10, t: 14, b: 30 }, x = d3.scaleLinear([0, 180], [m.l, W2 - m.r]), lim = Math.max(bu, -bd) * 1.15, y = d3.scaleLinear([-lim, lim], [H2 - m.b, m.t]);
  let t = svg(W2, H2, 10);
  y.ticks(6).forEach(v => t += `<line x1="${m.l}" x2="${W2 - m.r}" y1="${y(v)}" y2="${y(v)}" stroke="${v === 0 ? "#94a3b8" : "#eef2f7"}"/><text x="${m.l - 4}" y="${y(v) + 3}" text-anchor="end" style="fill:#64748b">${v}</text>`);
  [0, 45, 90, 135, 180].forEach(v => t += `<text x="${x(v)}" y="${H2 - 12}" text-anchor="middle" style="fill:#64748b">${v}°</text>`);
  t += `<path d="M${d3.range(0, 180.1, 1).map(a => `${x(a).toFixed(1)},${y(vb(b, tws, a) * Math.cos(rad(a))).toFixed(1)}`).join(" L")}" fill="none" stroke="#2563eb" stroke-width="2.4"/>`;
  t += `<circle cx="${x(au)}" cy="${y(bu)}" r="5" fill="#16a34a"/><text x="${x(au) + 6}" y="${y(bu) - 6}" style="fill:#16a34a" font-weight="700">meilleur près : ${fr(au)}°</text><circle cx="${x(ad)}" cy="${y(bd)}" r="5" fill="#dc2626"/><text x="${x(ad) - 6}" y="${y(bd) + 16}" text-anchor="end" style="fill:#dc2626" font-weight="700">meilleur portant : ${fr(ad)}°</text>`;
  t += `<text x="${m.l + 4}" y="${m.t + 4}" style="fill:#64748b">↑ vers le vent (nœuds) ; ↓ sous le vent</text>`;
  e2.innerHTML = t + "</svg>";
  $("#vo-vmg-txt").innerHTML = `Au près, le meilleur compromis est de naviguer à <b>${fr(au)}°</b> du vent réel (VMG ${fr(bu, 1)} nœuds) : serrer plus fait perdre trop de vitesse, abattre fait perdre du cap. Au portant, ${ad < 170 ? `il vaut mieux <b>tirer des bords à ${fr(ad)}°</b> que de descendre plein vent arrière : ` : ""}VMG ${fr(-bd, 1)} nœuds.` + (b === "imoca" ? " Les bateaux rapides gagnent énormément à lofer au portant : le vent apparent remonte et la vitesse explose." : "");
}

function gradient() {
  const el = $("#vo-gradient"); if (!el) return;
  const V10 = 12, b = 6, twa = 45, z = d3.range(1, 25.1, .5);
  const W = 440, H = 280, m = { l: 40, r: 14, t: 14, b: 30 }, x = d3.scaleLinear([0, 40], [m.l, W - m.r]), y = d3.scaleLinear([0, 25], [H - m.b, m.t]);
  let s = svg(W, H, 10);
  [0, 5, 10, 15, 20, 25].forEach(v => s += `<line x1="${m.l}" x2="${W - m.r}" y1="${y(v)}" y2="${y(v)}" stroke="#eef2f7"/><text x="${m.l - 4}" y="${y(v) + 3}" text-anchor="end" style="fill:#64748b">${v} m</text>`);
  [0, 10, 20, 30, 40].forEach(v => s += `<text x="${x(v)}" y="${H - 12}" text-anchor="middle" style="fill:#64748b">${v}</text>`);
  const tws = h => V10 * (h / 10) ** 0.14;
  const awa = h => { const t = tws(h), A = [-t * Math.sin(rad(twa)), -t * Math.cos(rad(twa)) - b]; return deg(Math.atan2(-A[0], -A[1])); };
  s += `<path d="M${z.map(h => `${x(tws(h)).toFixed(1)},${y(h).toFixed(1)}`).join(" L")}" fill="none" stroke="#2563eb" stroke-width="2.4"/><text x="${x(tws(20)) + 4}" y="${y(20)}" style="fill:#2563eb" font-weight="700">vent réel (nœuds)</text>`;
  s += `<path d="M${z.map(h => `${x(awa(h)).toFixed(1)},${y(h).toFixed(1)}`).join(" L")}" fill="none" stroke="#dc2626" stroke-width="2.4"/><text x="${x(awa(22)) - 4}" y="${y(22)}" text-anchor="end" style="fill:#dc2626" font-weight="700">angle du vent apparent (°)</text>`;
  s += `<text x="${x(20)}" y="${H - 1}" text-anchor="middle" style="fill:#64748b">au près, bateau à 6 nœuds</text>`;
  el.innerHTML = s + "</svg>";
}
function vmax() {
  const el = $("#vo-vmax"); if (!el) return;
  window.TH.bars(el, [["Voilier de croisière (10 m)", 8, "#94a3b8"], ["Dériveur de sport", 14, "#0ea5e9"], ["Monocoque de course IMOCA à foils", 35, "#2563eb"], ["Planche à voile à foil", 40, "#16a34a"], ["Trimaran géant Ultim", 50, "#7c3aed"], ["Monocoque à foils de la Coupe de l'America", 55, "#c026d3"], ["Record absolu (Sailrocket 2)", 65.45, "#dc2626"]].map(([l, v, c]) => ({ l, v, t: fr(v, v % 1 ? 2 : 0) + " nd", c })));
}

function init() {
  if (!window.TH || !window.d3) { setTimeout(init, 100); return; }
  if (!$("#voile")) return;
  const run = f => { try { f(); } catch (e) { console.error(f.name, e); } };
  window.TH.kpis("#vo-kpis", [["F = ½ ρ V² S C", ["la loi commune des voiles,", "ailes, quilles et foils"], "Aérodynamique"], ["≈ 45°", ["du vent réel : le meilleur", "près d'un voilier moderne"], "Remonter au vent"], ["2,43 √L", ["vitesse de coque en nœuds", "(L flottaison en m)"], "Limite des carènes"], ["850 ×", ["l'eau est plus dense que l'air :", "un petit foil soulève un bateau"], "Foils"]]);
  [ecoul, polaire, finesse, triangle, forces, gz, resist, regimes, polVit, gradient, vmax].forEach(run);
  const on = (ids, f) => ids.forEach(i => $("#" + i)?.addEventListener("input", () => run(f)));
  on(["vo-alpha"], ecoul); on(["vo-ar"], polaire); on(["vo-tws", "vo-twa", "vo-bs"], triangle); on(["vo-fa", "vo-fh"], forces); on(["vo-lwl"], resist); on(["vo-bateau", "vo-pol-tws"], polVit);
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
