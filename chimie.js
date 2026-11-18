/* Article Chimie : graphiques et simulateurs */
(() => {
"use strict";
const $ = s => document.querySelector(s);
const fr = (v, d = 0) => v == null ? "–" : v.toLocaleString("fr-FR", { minimumFractionDigits: d, maximumFractionDigits: d });
const R = 8.314;
const erf = x => { const t = 1 / (1 + 0.3275911 * x); return 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x); };
const svgAxes = (W, H, m, x, y, xt, yt, xf, yf) => { let s = ""; yt.forEach(v => s += `<line x1="${m.l}" x2="${W - m.r}" y1="${y(v)}" y2="${y(v)}" stroke="#eef2f7"/><text x="${m.l - 5}" y="${y(v) + 3}" text-anchor="end" style="fill:#64748b">${yf(v)}</text>`); xt.forEach(v => s += `<text x="${x(v)}" y="${H - m.b + 16}" text-anchor="middle" style="fill:#64748b">${xf(v)}</text>`); return s; };

function ionique() {
  const el = $("#ch-ionique"); if (!el) return;
  const W = 440, H = 260, m = { l: 44, r: 10, t: 10, b: 34 }, x = d3.scaleLinear([0, 3.4], [m.l, W - m.r]), y = d3.scaleLinear([0, 100], [H - m.b, m.t]);
  const f = d => 100 * (1 - Math.exp(-d * d / 4));
  let s = `<svg viewBox="0 0 ${W} ${H}" width="100%" style="font-size:10.5px">` + svgAxes(W, H, m, x, y, [0, 1, 2, 3], [0, 25, 50, 75, 100], v => "Δχ = " + v, v => v + " %");
  s += `<rect x="${x(0)}" y="${m.t}" width="${x(0.4) - x(0)}" height="${H - m.t - m.b}" fill="#dbeafe" opacity=".6"/><rect x="${x(0.4)}" y="${m.t}" width="${x(1.7) - x(0.4)}" height="${H - m.t - m.b}" fill="#ede9fe" opacity=".6"/><rect x="${x(1.7)}" y="${m.t}" width="${x(3.4) - x(1.7)}" height="${H - m.t - m.b}" fill="#fee2e2" opacity=".6"/>`;
  s += `<text x="${x(0.2)}" y="${m.t + 12}" text-anchor="middle" style="fill:#1d4ed8">covalente</text><text x="${x(1.05)}" y="${m.t + 12}" text-anchor="middle" style="fill:#6d28d9">covalente polaire</text><text x="${x(2.55)}" y="${m.t + 12}" text-anchor="middle" style="fill:#b91c1c">ionique</text>`;
  s += `<polyline points="${d3.range(0, 3.41, .05).map(d => `${x(d)},${y(f(d))}`).join(" ")}" fill="none" stroke="#111827" stroke-width="2"/>`;
  [["H–H", 0], ["C–H", 0.35], ["H–Cl", 0.96], ["O–H", 1.24], ["Na–Cl", 2.23], ["K–F", 3.16]].forEach(([n, d], i) => s += `<circle cx="${x(d)}" cy="${y(f(d))}" r="4.5" fill="#dc2626"/><text x="${x(d) + 6}" y="${y(f(d)) + (i % 2 ? 14 : -6)}" style="fill:#dc2626" font-weight="700">${n}</text>`);
  el.innerHTML = s + "</svg>";
}
function liaisons() {
  const el = $("#ch-liaisons"); if (!el) return;
  window.TH.bars(el, [["N≡N (azote de l'air)", 945, "#7c3aed"], ["C≡C", 839, "#2563eb"], ["C=O (dans le CO₂)", 805, "#dc2626"], ["C=C", 614, "#2563eb"], ["O=O (oxygène)", 498, "#dc2626"], ["O–H", 463, "#0ea5e9"], ["H–H", 436, "#64748b"], ["C–H", 413, "#f59e0b"], ["C–C", 348, "#f59e0b"], ["Liaison hydrogène (entre molécules d'eau)", 20, "#94a3b8"]].map(([l, v, c]) => ({ l, v, t: fr(v) + " kJ/mol", c })));
}
function ebullition() {
  const el = $("#ch-ebullition"); if (!el) return;
  const S = [["Colonne 14 : CH₄, SiH₄, GeH₄, SnH₄", [-161, -112, -88, -52], "#64748b"], ["Colonne 15 : NH₃, PH₃, AsH₃, SbH₃", [-33, -88, -62, -17], "#2563eb"], ["Colonne 16 : H₂O, H₂S, H₂Se, H₂Te", [100, -60, -41, -2], "#dc2626"], ["Colonne 17 : HF, HCl, HBr, HI", [20, -85, -67, -35], "#16a34a"]];
  const W = 900, H = 300, m = { l: 50, r: 250, t: 12, b: 34 }, x = d3.scaleLinear([2, 5], [m.l, W - m.r]), y = d3.scaleLinear([-180, 110], [H - m.b, m.t]);
  let s = `<svg viewBox="0 0 ${W} ${H}" width="100%" style="font-size:10.5px">` + svgAxes(W, H, m, x, y, [2, 3, 4, 5], [-150, -100, -50, 0, 50, 100], v => "ligne " + v, v => v + " °C");
  S.forEach(([l, v, c], k) => { s += `<polyline points="${v.map((t, i) => `${x(i + 2)},${y(t)}`).join(" ")}" fill="none" stroke="${c}" stroke-width="2.2"/>` + v.map((t, i) => `<circle cx="${x(i + 2)}" cy="${y(t)}" r="4" fill="${c}"/>`).join("") + `<text x="${W - m.r + 10}" y="${m.t + 20 + k * 18}" style="fill:${c}" font-weight="700">${l}</text>`; });
  s += `<line x1="${x(2)}" y1="${y(-80)}" x2="${x(3)}" y2="${y(-60)}" stroke="#dc2626" stroke-dasharray="4 3"/><circle cx="${x(2)}" cy="${y(-80)}" r="4" fill="none" stroke="#dc2626"/><text x="${x(2) + 8}" y="${y(-80) + 14}" style="fill:#dc2626">eau « attendue » sans liaison hydrogène : ≈ −80 °C</text>`;
  s += `<text x="${W - m.r + 10}" y="${m.t + 110}" style="fill:#475569" font-size="10.5"><tspan x="${W - m.r + 10}">Les premiers de chaque colonne</tspan><tspan x="${W - m.r + 10}" dy="14">(NH₃, H₂O, HF) bouillent bien plus haut</tspan><tspan x="${W - m.r + 10}" dy="14">que prévu : liaisons hydrogène.</tspan><tspan x="${W - m.r + 10}" dy="14">CH₄ n'en forme pas : il suit la règle.</tspan></text>`;
  el.innerHTML = s + "</svg>";
}
const PH = {
  eau: { tp: [0.01, 0.00611], cp: [374, 220.6], txt: "Eau : point triple à 0,01 °C et 6,1 mbar, point critique à 374 °C et 221 bar. La ligne solide-liquide penche vers la gauche (anomalie de l'eau) : comprimer la glace la fait fondre. Au-dessus du point critique, l'eau est « supercritique » (centrales thermiques modernes, à plus de 221 bar)." },
  co2: { tp: [-56.6, 5.18], cp: [31, 73.8], txt: "CO₂ : point triple à −56,6 °C et 5,2 bar. À la pression atmosphérique, il passe directement du solide au gaz (la « glace carbonique » se sublime à −78,5 °C). Point critique à 31 °C et 74 bar : le CO₂ supercritique sert de solvant (décaféination) et c'est l'état visé pour le stocker sous terre." } };
function phases(k) {
  const el = $("#ch-phases"); if (!el) return;
  const P = PH[k], W = 900, H = 300, m = { l: 60, r: 20, t: 12, b: 34 }, x = d3.scaleLinear(k === "eau" ? [-40, 420] : [-120, 80], [m.l, W - m.r]), y = d3.scaleLog([0.001, 1000], [H - m.b, m.t]);
  const [Tt, Pt] = P.tp, [Tc, Pc] = P.cp;
  // courbe de vaporisation (Clausius-Clapeyron entre point triple et critique), sublimation, fusion
  const vap = d3.range(0, 1.0001, .02).map(u => { const T = Tt + u * (Tc - Tt); const a = Math.log(Pc / Pt) / (1 / (Tt + 273.15) - 1 / (Tc + 273.15)); return [T, Pt * Math.exp(a * (1 / (Tt + 273.15) - 1 / (T + 273.15)))]; });
  const Ts = k === "eau" ? -40 : -120, sub = d3.range(0, 1.0001, .05).map(u => { const T = Ts + u * (Tt - Ts); const a = 1.35 * Math.log(Pc / Pt) / (1 / (Tt + 273.15) - 1 / (Tc + 273.15)); return [T, Pt * Math.exp(a * (1 / (Tt + 273.15) - 1 / (T + 273.15)))]; });
  const fus = k === "eau" ? [[Tt, Pt], [-1, 1000]] : [[Tt, Pt], [-40, 1000]];
  const L = pts => pts.filter(p => p[1] >= 0.001 && p[1] <= 1000).map(([T, p]) => `${x(T)},${y(p)}`).join(" ");
  let s = `<svg viewBox="0 0 ${W} ${H}" width="100%" style="font-size:10.5px">` + svgAxes(W, H, m, x, y, x.ticks(8), [0.001, 0.01, 0.1, 1, 10, 100, 1000], v => v + " °C", v => fr(v, v < 1 ? 3 : 0) + " bar");
  s += `<line x1="${m.l}" x2="${W - m.r}" y1="${y(1.013)}" y2="${y(1.013)}" stroke="#94a3b8" stroke-dasharray="4 4"/><text x="${W - m.r - 4}" y="${y(1.013) - 4}" text-anchor="end" style="fill:#64748b">pression atmosphérique</text>`;
  s += `<polyline points="${L(vap)}" fill="none" stroke="#2563eb" stroke-width="2.4"/><polyline points="${L(sub)}" fill="none" stroke="#7c3aed" stroke-width="2.4"/><polyline points="${L(fus)}" fill="none" stroke="#0ea5e9" stroke-width="2.4"/>`;
  s += `<circle cx="${x(Tt)}" cy="${y(Pt)}" r="5" fill="#111827"/><text x="${x(Tt) + 8}" y="${y(Pt) + 14}" font-weight="700">point triple</text><circle cx="${x(Tc)}" cy="${y(Pc)}" r="5" fill="#dc2626"/><text x="${x(Tc) - 8}" y="${y(Pc) - 8}" text-anchor="end" style="fill:#dc2626" font-weight="700">point critique</text>`;
  const lab = k === "eau" ? [[-25, 100, "SOLIDE"], [150, 100, "LIQUIDE"], [250, 0.05, "GAZ"]] : [[-100, 100, "SOLIDE"], [10, 300, "LIQUIDE"], [0, 0.05, "GAZ"]];
  lab.forEach(([T, p, t]) => s += `<text x="${x(T)}" y="${y(p)}" font-size="14" font-weight="800" style="fill:#94a3b8">${t}</text>`);
  el.innerHTML = s + "</svg>"; $("#ch-phases-txt").textContent = P.txt + " Courbes tracées par un modèle simplifié (Clausius-Clapeyron).";
}
function bilanCH4() {
  const el = $("#ch-bilan-ch4"); if (!el) return;
  const W = 900, H = 250, y = d3.scaleLinear([0, 3600], [220, 20]);
  let s = `<svg viewBox="0 0 ${W} ${H}" width="100%" style="font-size:11px">`;
  const lvl = (x1, x2, v, t, c) => `<line x1="${x1}" x2="${x2}" y1="${y(v)}" y2="${y(v)}" stroke="${c}" stroke-width="3"/><text x="${(x1 + x2) / 2}" y="${y(v) - 6}" text-anchor="middle" style="fill:${c}" font-weight="700">${t}</text>`;
  s += lvl(40, 240, 814, "CH₄ + 2 O₂ (départ)", "#111827") + lvl(340, 560, 3462, "atomes séparés : C + 4 H + 4 O", "#64748b") + lvl(660, 860, 0, "CO₂ + 2 H₂O (arrivée)", "#16a34a");
  s += `<line x1="250" y1="${y(814)}" x2="330" y2="${y(3462)}" stroke="#dc2626" stroke-width="2" marker-end="url(#ca)"/><text x="230" y="${y(2300)}" style="fill:#dc2626" font-weight="700">on rompt : +2 648 kJ</text><line x1="570" y1="${y(3462)}" x2="650" y2="${y(0)}" stroke="#16a34a" stroke-width="2" marker-end="url(#cb)"/><text x="620" y="${y(2000)}" style="fill:#16a34a" font-weight="700">on forme : −3 462 kJ</text>`;
  s += `<line x1="140" y1="${y(814)}" x2="140" y2="${y(0)}" stroke="#f59e0b" stroke-width="3" marker-end="url(#cc)"/><text x="150" y="${y(400)}" style="fill:#b45309" font-weight="700">bilan : −814 kJ/mol libérés</text>`;
  s += `<defs><marker id="ca" viewBox="0 0 10 10" refX="8" refY="5" markerUnits="userSpaceOnUse" markerWidth="10" markerHeight="10" orient="auto"><path d="M0,0 L10,5 L0,10z" fill="#dc2626"/></marker><marker id="cb" viewBox="0 0 10 10" refX="8" refY="5" markerUnits="userSpaceOnUse" markerWidth="10" markerHeight="10" orient="auto"><path d="M0,0 L10,5 L0,10z" fill="#16a34a"/></marker><marker id="cc" viewBox="0 0 10 10" refX="8" refY="5" markerUnits="userSpaceOnUse" markerWidth="10" markerHeight="10" orient="auto"><path d="M0,0 L10,5 L0,10z" fill="#f59e0b"/></marker></defs>`;
  el.innerHTML = s + "</svg>";
}
function densite() {
  const el = $("#ch-densite"); if (!el) return;
  const D = [["Hydrogène", 120, "#0ea5e9"], ["Méthane (gaz naturel)", 50, "#2563eb"], ["Essence", 43, "#dc2626"], ["Gazole", 43, "#b91c1c"], ["Charbon", 25, "#111827"], ["Éthanol", 27, "#f59e0b"], ["Bois sec", 16, "#a16207"], ["Sucre (glucose)", 15.6, "#65a30d"], ["TNT (explosif)", 4.6, "#7c3aed"], ["Batterie lithium-ion", 0.8, "#16a34a"], ["Batterie au plomb", 0.13, "#64748b"]];
  const lo = -1, hi = 2.3, p = v => (Math.log10(v) - lo) / (hi - lo) * 100;
  el.innerHTML = `<div class="bars">${D.map(([l, v, c]) => `<div class="bar-row"><span class="lab">${l}</span><span class="val">${fr(v, v < 1 ? 2 : v < 10 ? 1 : 0)} MJ/kg</span><span class="track"><span class="fill" style="width:${p(v).toFixed(1)}%;background:${c}"></span></span></div>`).join("")}</div><div style="position:relative;height:16px;font-size:.72rem;color:#64748b">${[0.1, 1, 10, 100].map(v => `<span style="position:absolute;left:${p(v)}%;transform:translateX(-50%)">${fr(v, v < 1 ? 1 : 0)} MJ/kg</span>`).join("")}</div>`;
}
function gibbs() {
  const el = $("#ch-gibbs"); if (!el) return;
  const dH = 178, dS = 0.160, W = 900, H = 260, m = { l: 60, r: 20, t: 12, b: 34 }, x = d3.scaleLinear([0, 1400], [m.l, W - m.r]), y = d3.scaleLinear([-60, 180], [H - m.b, m.t]);
  const Ti = dH / dS - 273.15;
  let s = `<svg viewBox="0 0 ${W} ${H}" width="100%" style="font-size:10.5px">` + svgAxes(W, H, m, x, y, [0, 200, 400, 600, 800, 1000, 1200, 1400], [-50, 0, 50, 100, 150], v => v + " °C", v => v + " kJ/mol");
  s += `<rect x="${x(Ti)}" y="${m.t}" width="${x(1400) - x(Ti)}" height="${H - m.t - m.b}" fill="#dcfce7" opacity=".6"/><text x="${x(1150)}" y="${m.t + 16}" text-anchor="middle" style="fill:#166534" font-weight="700">ΔG &lt; 0 : la réaction se fait</text><text x="${x(350)}" y="${m.t + 16}" text-anchor="middle" style="fill:#991b1b" font-weight="700">ΔG &gt; 0 : le calcaire est stable</text>`;
  s += `<line x1="${m.l}" x2="${W - m.r}" y1="${y(0)}" y2="${y(0)}" stroke="#94a3b8"/><polyline points="${[0, 1400].map(T => `${x(T)},${y(dH - (T + 273.15) * dS)}`).join(" ")}" fill="none" stroke="#dc2626" stroke-width="2.5"/>`;
  s += `<line x1="${m.l}" x2="${W - m.r}" y1="${y(dH)}" y2="${y(dH)}" stroke="#f59e0b" stroke-dasharray="5 4"/><text x="${W - m.r - 4}" y="${y(dH) - 5}" text-anchor="end" style="fill:#b45309">ΔH = +178 kJ/mol (chaleur à fournir)</text>`;
  s += `<circle cx="${x(Ti)}" cy="${y(0)}" r="5" fill="#111827"/><text x="${x(Ti) + 8}" y="${y(0) + 16}" font-weight="700">≈ ${fr(Ti)} °C</text><text x="${x(250)}" y="${y(130)}" style="fill:#dc2626" font-weight="700">ΔG = ΔH − TΔS</text>`;
  el.innerHTML = s + "</svg>";
}
function haberY(Tc, P) { const T = Tc + 273.15, K = Math.exp(-(-92200 - T * -198.7) / (R * T)); let lo = 0, hi = 0.99999; for (let i = 0; i < 70; i++) { const x = (lo + hi) / 2, n = 4 - 2 * x, q = (2 * x / n) ** 2 / (((1 - x) / n) * ((3 - 3 * x) / n) ** 3) / (P * P); q < K ? lo = x : hi = x; } return 2 * lo / (4 - 2 * lo); }
function haber() {
  const el = $("#ch-haber"); if (!el) return;
  const T0 = +$("#ch-hT").value, P0 = +$("#ch-hP").value; $("#ch-hT-v").textContent = T0 + " °C"; $("#ch-hP-v").textContent = P0 + " bar";
  const W = 900, H = 300, m = { l: 50, r: 120, t: 12, b: 34 }, x = d3.scaleLinear([200, 700], [m.l, W - m.r]), y = d3.scaleLinear([0, 100], [H - m.b, m.t]);
  let s = `<svg viewBox="0 0 ${W} ${H}" width="100%" style="font-size:10.5px">` + svgAxes(W, H, m, x, y, [200, 300, 400, 500, 600, 700], [0, 20, 40, 60, 80, 100], v => v + " °C", v => v + " %");
  s += `<rect x="${x(400)}" y="${m.t}" width="${x(500) - x(400)}" height="${H - m.t - m.b}" fill="#fef3c7" opacity=".7"/><text x="${x(450)}" y="${m.t + 12}" text-anchor="middle" style="fill:#92400e">zone industrielle</text>`;
  [[1, "#94a3b8"], [50, "#93c5fd"], [100, "#60a5fa"], [200, "#2563eb"], [300, "#1e3a8a"]].forEach(([P, c]) => { const pts = d3.range(200, 701, 10).map(T => [T, 100 * haberY(T, P)]); s += `<polyline points="${pts.map(([T, v]) => `${x(T)},${y(v)}`).join(" ")}" fill="none" stroke="${c}" stroke-width="2"/><text x="${W - m.r + 6}" y="${y(pts[pts.length - 1][1]) + (P === 1 ? 0 : 4)}" style="fill:${c}" font-weight="700">${P} bar</text>`; });
  const v0 = 100 * haberY(T0, P0); s += `<circle cx="${x(T0)}" cy="${y(v0)}" r="7" fill="#dc2626"/><text x="${x(T0) + 10}" y="${y(v0) - 8}" style="fill:#dc2626" font-weight="700">${fr(v0, 1)} % d'ammoniac</text>`;
  el.innerHTML = s + "</svg>";
  const k = Math.exp(-120000 / (R * (T0 + 273.15))) / Math.exp(-120000 / (R * 723.15));
  $("#ch-haber-txt").innerHTML = `Part d'ammoniac dans le gaz à l'équilibre (mélange N₂ + 3 H₂, gaz parfaits, ΔH et ΔS constants : modèle simplifié). À ${T0} °C et ${P0} bar : ${fr(v0, 1)} %. Vitesse de réaction relative à 450 °C (énergie d'activation catalysée ≈ 120 kJ/mol, ordre de grandeur) : ${k < 0.01 ? fr(k, 5) : fr(k, 2)} ×. ${T0 < 380 ? "Plus froid : meilleur rendement à l'équilibre, mais réaction beaucoup trop lente." : T0 > 520 ? "Plus chaud : réaction rapide, mais l'équilibre recule." : "C'est le compromis industriel."}`;
}
function cinetique() {
  const ea0 = +$("#ch-ea").value, Tc = +$("#ch-kT").value, cat = $("#ch-cat").checked, ea = cat ? ea0 * 0.6 : ea0, T = Tc + 273.15;
  $("#ch-ea-v").textContent = ea0 + " kJ/mol"; $("#ch-kT-v").textContent = Tc + " °C";
  // profil
  { const W = 440, H = 260, m = { l: 40, r: 10, t: 14, b: 26 }, x = d3.scaleLinear([0, 1], [m.l, W - m.r]), y = d3.scaleLinear([-60, 160], [H - m.b, m.t]);
    const prof = e => d3.range(0, 1.001, .01).map(u => [u, -50 * (3 * u * u - 2 * u ** 3) + (e + 25) * Math.sin(Math.PI * u) ** 2]);
    let s = `<svg viewBox="0 0 ${W} ${H}" width="100%" style="font-size:10.5px">`;
    const line = (e, c, d) => `<polyline points="${prof(e).map(([u, v]) => `${x(u)},${y(Math.max(-55, v))}`).join(" ")}" fill="none" stroke="${c}" stroke-width="2.4" stroke-dasharray="${d}"/>`;
    s += line(ea0, "#dc2626", "") + (cat ? line(ea, "#16a34a", "6 4") : "");
    s += `<line x1="${x(.02)}" x2="${x(.5)}" y1="${y(0)}" y2="${y(0)}" stroke="#94a3b8" stroke-dasharray="3 3"/><line x1="${x(.5)}" y1="${y(0)}" x2="${x(.5)}" y2="${y(ea)}" stroke="#111827" stroke-width="1.5"/><text x="${x(.5) + 6}" y="${y(ea / 2)}" font-weight="700">Eₐ = ${fr(ea)} kJ/mol</text>`;
    s += `<text x="${x(.04)}" y="${y(0) + 16}">réactifs</text><text x="${x(.96)}" y="${y(-50) + 16}" text-anchor="end">produits</text><text x="${x(.5)}" y="${H - 6}" text-anchor="middle" style="fill:#64748b">avancement de la réaction →</text>${cat ? `<text x="${x(.72)}" y="${y(ea0 * .7)}" style="fill:#16a34a" font-weight="700">avec catalyseur</text>` : ""}`;
    $("#ch-profil").innerHTML = s + "</svg>"; }
  // Maxwell-Boltzmann : f(E) ∝ √E exp(−E/RT), échelle logarithmique pour voir la queue
  { const W = 440, H = 260, m = { l: 46, r: 10, t: 14, b: 26 }, Emax = Math.max(40, ea0 * 1.25), x = d3.scaleLinear([0, Emax], [m.l, W - m.r]);
    const f = (E, TT) => 2 * Math.sqrt(E / Math.PI) * (1000 / (R * TT)) ** 1.5 * Math.exp(-E * 1000 / (R * TT));
    const y = d3.scaleLog([1e-16, 2], [H - m.b, m.t]).clamp(true);
    const frac = (E, TT) => { const a = E * 1000 / (R * TT); return 2 * Math.sqrt(a / Math.PI) * Math.exp(-a) + (1 - erf(Math.sqrt(a))); };
    let s = `<svg viewBox="0 0 ${W} ${H}" width="100%" style="font-size:10.5px">`;
    [1, 1e-4, 1e-8, 1e-12, 1e-16].forEach(v => s += `<line x1="${m.l}" x2="${W - m.r}" y1="${y(v)}" y2="${y(v)}" stroke="#eef2f7"/><text x="${m.l - 4}" y="${y(v) + 3}" text-anchor="end" style="fill:#64748b">${v === 1 ? "1" : "10⁻" + String(-Math.log10(v)).split("").map(c => "⁰¹²³⁴⁵⁶⁷⁸⁹"[c]).join("")}</text>`);
    const pts = TT => d3.range(0.05, Emax, Emax / 300).map(E => [E, f(E, TT)]);
    s += `<path d="M${x(ea)},${y(1e-16)} ${pts(T).filter(p => p[0] >= ea).map(([E, v]) => `L${x(E)},${y(v)}`).join(" ")} L${x(Emax)},${y(1e-16)} Z" style="fill:#fca5a5" opacity=".7"/>`;
    s += `<polyline points="${pts(298.15).map(([E, v]) => `${x(E)},${y(v)}`).join(" ")}" fill="none" stroke="#94a3b8" stroke-width="1.8" stroke-dasharray="5 4"/><polyline points="${pts(T).map(([E, v]) => `${x(E)},${y(v)}`).join(" ")}" fill="none" stroke="#dc2626" stroke-width="2.4"/>`;
    s += `<line x1="${x(ea)}" x2="${x(ea)}" y1="${m.t}" y2="${H - m.b}" stroke="#111827" stroke-dasharray="4 3"/><text x="${x(ea) - 4}" y="${m.t + 10}" text-anchor="end" font-weight="700">seuil Eₐ</text>`;
    s += `<text x="${x(Emax / 2)}" y="${H - 6}" text-anchor="middle" style="fill:#64748b">énergie (kJ/mol) →</text><text x="${W - m.r}" y="${m.t + 28}" text-anchor="end" style="fill:#dc2626">${Tc} °C : ${frac(ea, T).toExponential(1).replace(".", ",")} des molécules au-dessus du seuil</text><text x="${W - m.r}" y="${m.t + 42}" text-anchor="end" style="fill:#94a3b8">25 °C (pointillés)</text>`;
    $("#ch-maxwell").innerHTML = s + "</svg>"; }
  const k = (e, t) => Math.exp(-e * 1000 / (R * t)), r10 = k(ea, T + 10) / k(ea, T), rcat = k(ea, T) / k(ea0, T), r25 = k(ea, T) / k(ea0, 298.15);
  $("#ch-arrh").innerHTML = `<ul><li>Une hausse de 10 °C autour de ${Tc} °C multiplie la vitesse par <b>${fr(r10, 2)}</b>.</li><li>Par rapport à la réaction sans catalyseur à 25 °C, la vitesse est multipliée par <b>${r25 >= 1e6 ? r25.toExponential(1).replace(".", ",") : fr(r25, r25 < 10 ? 2 : 0)}</b>.</li>${cat ? `<li>Le catalyseur seul (à ${Tc} °C) accélère la réaction d'un facteur <b>${rcat >= 1e6 ? rcat.toExponential(1).replace(".", ",") : fr(rcat)}</b>, sans rien changer à l'équilibre.</li>` : ""}</ul><p class="muted" style="font-size:.78rem;margin:4px 0 0">Loi d'Arrhenius avec le même facteur préexponentiel A. Distribution des énergies : échelle verticale logarithmique (chaque graduation divise par 10 000) ; la zone rouge est la fraction de molécules qui peuvent réagir.</p>`;
}
function phEchelle() {
  const el = $("#ch-ph"); if (!el) return;
  const S = [[1.5, "suc gastrique"], [2.2, "citron"], [2.5, "soda au cola"], [2.9, "vinaigre"], [4.5, "tomate"], [5, "café"], [5.6, "pluie naturelle (CO₂)"], [7, "eau pure"], [7.4, "sang"], [8.1, "eau de mer"], [8.3, "bicarbonate"], [10, "savon"], [11.6, "ammoniaque"], [12.5, "eau de Javel"], [14, "soude 1 mol/L"]];
  const W = 900, H = 150, x = d3.scaleLinear([0, 14], [20, W - 20]), col = d3.scaleSequential([0, 14], t => d3.interpolateRdYlBu(t));
  let s = `<svg viewBox="0 0 ${W} ${H}" width="100%" style="font-size:10.5px">`;
  for (let v = 0; v < 14; v += .1) s += `<rect x="${x(v)}" y="60" width="${x(.1) - x(0) + .5}" height="26" fill="${col(v)}"/>`;
  for (let v = 0; v <= 14; v++) s += `<text x="${x(v)}" y="100" text-anchor="middle" style="fill:#475569" font-weight="700">${v}</text>`;
  S.forEach(([v, t], i) => { const up = i % 2 === 0; s += `<line x1="${x(v)}" x2="${x(v)}" y1="${up ? 56 : 104}" y2="${up ? 40 - (i % 4 === 0 ? 0 : 16) : 118 + (i % 4 === 1 ? 0 : 14)}" stroke="#94a3b8"/><text x="${x(v)}" y="${up ? 36 - (i % 4 === 0 ? 0 : 16) : 128 + (i % 4 === 1 ? 0 : 14)}" text-anchor="middle" style="fill:currentColor">${t}</text>`; });
  s += `<text x="20" y="12" style="fill:#b91c1c" font-weight="700">← acide</text><text x="${W - 20}" y="12" text-anchor="end" style="fill:#1d4ed8" font-weight="700">basique →</text>`;
  el.innerHTML = s + "</svg>";
}
function dosage() {
  const el = $("#ch-dosage"); if (!el) return;
  const pKa = +$("#ch-acide").value, Ka = 10 ** -pKa, Kw = 1e-14, Ca = 0.1, Va = 20, Cb = 0.1;
  const pH = Vb => { const V = Va + Vb, Ct = Ca * Va / V, Na = Cb * Vb / V; let lo = 0, hi = 14; for (let i = 0; i < 60; i++) { const p = (lo + hi) / 2, h = 10 ** -p, A = Ct * Ka / (Ka + h), q = h + Na - Kw / h - A; q > 0 ? lo = p : hi = p; } return (lo + hi) / 2; };
  const W = 900, H = 300, m = { l: 44, r: 20, t: 12, b: 34 }, x = d3.scaleLinear([0, 40], [m.l, W - m.r]), y = d3.scaleLinear([0, 14], [H - m.b, m.t]);
  let s = `<svg viewBox="0 0 ${W} ${H}" width="100%" style="font-size:10.5px">` + svgAxes(W, H, m, x, y, [0, 5, 10, 15, 20, 25, 30, 35, 40], [0, 2, 4, 6, 7, 8, 10, 12, 14], v => v + " mL", v => "pH " + v);
  s += `<line x1="${x(20)}" x2="${x(20)}" y1="${m.t}" y2="${H - m.b}" stroke="#94a3b8" stroke-dasharray="4 3"/><text x="${x(20) + 4}" y="${m.t + 12}" style="fill:#64748b">équivalence</text>`;
  if (pKa > 0) s += `<rect x="${x(6)}" y="${y(pKa + 1)}" width="${x(14) - x(6)}" height="${y(pKa - 1) - y(pKa + 1)}" fill="#dbeafe" opacity=".7"/><text x="${x(10)}" y="${y(pKa + 1) - 4}" text-anchor="middle" style="fill:#1d4ed8" font-weight="700">zone tampon (pH ≈ pKa = ${fr(pKa, 2)})</text>`;
  s += `<polyline points="${d3.range(0, 40.01, .1).map(v => `${x(v)},${y(pH(v))}`).join(" ")}" fill="none" stroke="#dc2626" stroke-width="2.5"/>`;
  s += `<circle cx="${x(20)}" cy="${y(pH(20))}" r="5" fill="#111827"/><text x="${x(20) + 8}" y="${y(pH(20)) + 4}" font-weight="700">pH à l'équivalence : ${fr(pH(20), 1)}</text>`;
  el.innerHTML = s + "</svg>";
}
const REDOX = [["Li⁺/Li", -3.04], ["K⁺/K", -2.93], ["Na⁺/Na", -2.71], ["Mg²⁺/Mg", -2.37], ["Al³⁺/Al", -1.66], ["Zn²⁺/Zn", -0.76], ["Fe²⁺/Fe", -0.44], ["Ni²⁺/Ni", -0.25], ["Pb²⁺/Pb", -0.13], ["H⁺/H₂", 0], ["Cu²⁺/Cu", 0.34], ["Ag⁺/Ag", 0.80], ["O₂/H₂O", 1.23], ["Cl₂/Cl⁻", 1.36], ["Au³⁺/Au", 1.50], ["F₂/F⁻", 2.87]];
let SEL = [5, 10];
function redox() {
  const el = $("#ch-redox"); if (!el) return;
  const W = 440, H = 420, m = { t: 14, b: 14 }, y = d3.scaleLinear([-3.2, 3.0], [H - m.b, m.t]);
  let s = `<svg viewBox="0 0 ${W} ${H}" width="100%" style="font-size:11px;cursor:pointer"><defs><linearGradient id="rg" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#2563eb"/><stop offset="1" stop-color="#dc2626"/></linearGradient></defs><rect x="200" y="${m.t}" width="14" height="${H - m.t - m.b}" fill="url(#rg)" rx="7"/>`;
  s += `<text x="207" y="${H - 2}" text-anchor="middle" style="fill:#1d4ed8" font-size="10">réducteurs forts</text><text x="207" y="10" text-anchor="middle" style="fill:#b91c1c" font-size="10">oxydants forts</text>`;
  REDOX.forEach(([n, E], i) => { const sel = SEL.includes(i), yy = y(E), left = i % 2 === 0; s += `<g data-i="${i}" class="rx-pt"><line x1="${left ? 190 : 224}" x2="${left ? 175 : 239}" y1="${yy}" y2="${yy}" stroke="${sel ? "#111827" : "#94a3b8"}"/><circle cx="207" cy="${yy}" r="${sel ? 7 : 4.5}" fill="${sel ? "#111827" : "#fff"}" stroke="#111827"/><text x="${left ? 170 : 244}" y="${yy + 4}" text-anchor="${left ? "end" : "start"}" font-weight="${sel ? 800 : 400}">${n} ${E > 0 ? "+" : ""}${fr(E, 2)} V</text><rect x="${left ? 40 : 207}" y="${yy - 9}" width="160" height="18" fill="transparent"/></g>`; });
  el.innerHTML = s + "</svg>";
  el.querySelectorAll(".rx-pt").forEach(g => g.addEventListener("click", () => { const i = +g.dataset.i; if (SEL.includes(i)) return; SEL = [SEL[1], i]; redox(); }));
  const [a, b] = SEL.map(i => REDOX[i]).sort((p, q) => p[1] - q[1]);
  $("#ch-pile").innerHTML = `<p>Pile <b>${a[0].split("/")[1]} | ${b[0]}</b> : le ${a[0]} (potentiel le plus bas) cède ses électrons à l'anode, le ${b[0]} les capte à la cathode. Tension à vide : ${fr(b[1], 2)} − (${fr(a[1], 2)}) = <b>${fr(b[1] - a[1], 2)} V</b>.${b[1] - a[1] > 2.5 ? " Au-delà d'environ 1,5 V, l'eau se décompose : il faut un électrolyte non aqueux (cas des batteries au lithium)." : ""}</p>`;
}
function batteries() {
  const el = $("#ch-batt"); if (!el) return;
  const B = [["Plomb-acide (voiture thermique)", 30, 40, "#64748b"], ["Nickel-métal hydrure", 60, 120, "#a855f7"], ["Sodium-ion", 100, 160, "#f59e0b"], ["Lithium fer phosphate (LFP)", 120, 180, "#16a34a"], ["Lithium NMC (nickel, manganèse, cobalt)", 200, 280, "#2563eb"]];
  const W = 440, H = 230, m = { l: 175, r: 20, t: 10, b: 28 }, x = d3.scaleLinear([0, 300], [m.l, W - m.r]), rh = (H - m.t - m.b) / B.length;
  let s = `<svg viewBox="0 0 ${W} ${H}" width="100%" style="font-size:10.5px">`;
  [0, 100, 200, 300].forEach(v => s += `<line x1="${x(v)}" x2="${x(v)}" y1="${m.t}" y2="${H - m.b}" stroke="#eef2f7"/><text x="${x(v)}" y="${H - 10}" text-anchor="middle" style="fill:#64748b">${v}</text>`);
  B.forEach(([l, a, b, c], i) => { const yy = m.t + i * rh + rh / 2; s += `<text x="${m.l - 6}" y="${yy + 4}" text-anchor="end">${l}</text><rect x="${x(a)}" y="${yy - 8}" width="${x(b) - x(a)}" height="16" rx="4" fill="${c}"/><text x="${x(b) + 4}" y="${yy + 4}" style="fill:${c}" font-weight="700">${a}-${b}</text>`; });
  el.innerHTML = s + `</svg><p class="muted" style="font-size:.8rem;margin:2px 0 0">Ordres de grandeur des cellules commercialisées. À comparer : l'essence contient environ 12 000 Wh/kg d'énergie chimique (un moteur en restitue 25 à 35 %).</p>`;
}
function distillation() {
  const el = $("#ch-distill"); if (!el) return;
  const F = [["Gaz (méthane à butane)", "C1-C4", -160, 20, "#94a3b8"], ["Essence", "C5-C10", 20, 200, "#f59e0b"], ["Kérosène (carburant d'avion)", "C10-C16", 150, 275, "#0ea5e9"], ["Gazole, fioul domestique", "C14-C20", 250, 350, "#2563eb"], ["Fioul lourd, huiles", "C20-C40", 350, 550, "#7c3aed"], ["Bitume, résidus", "C40 et plus", 550, 700, "#111827"]];
  const W = 900, H = 260, m = { l: 230, r: 20, t: 12, b: 30 }, x = d3.scaleLinear([-180, 700], [m.l, W - m.r]), rh = (H - m.t - m.b) / F.length;
  let s = `<svg viewBox="0 0 ${W} ${H}" width="100%" style="font-size:11px">`;
  [-100, 0, 100, 200, 300, 400, 500, 600, 700].forEach(v => s += `<line x1="${x(v)}" x2="${x(v)}" y1="${m.t}" y2="${H - m.b}" stroke="#eef2f7"/><text x="${x(v)}" y="${H - 10}" text-anchor="middle" style="fill:#64748b">${v} °C</text>`);
  F.forEach(([l, c, a, b, col], i) => { const yy = m.t + i * rh + rh / 2; s += `<text x="${m.l - 8}" y="${yy}" text-anchor="end" font-weight="700">${l}</text><text x="${m.l - 8}" y="${yy + 13}" text-anchor="end" style="fill:#64748b">${c}</text><rect x="${x(a)}" y="${yy - 9}" width="${x(b) - x(a)}" height="18" rx="5" fill="${col}" opacity=".85"/>`; });
  el.innerHTML = s + `</svg><p class="muted" style="font-size:.8rem;margin:2px 0 0">Plages d'ébullition indicatives ; elles se chevauchent selon les raffineries et les spécifications.</p>`;
}
function production() {
  const el = $("#ch-prod"); if (!el) return;
  const P = [["Ciment", 4000, "#78716c"], ["Acier brut", 1900, "#475569"], ["Chaux", 420, "#a8a29e"], ["Plastiques (ordre de grandeur)", 400, "#7c3aed"], ["Sel", 280, "#0ea5e9"], ["Ammoniac (≈ 150 Mt d'azote)", 182, "#16a34a"], ["Soufre", 85, "#eab308"], ["Carbonate de sodium (verre)", 73, "#06b6d4"], ["Aluminium", 72, "#94a3b8"]];
  const lo = 1, hi = 3.7, p = v => (Math.log10(v) - lo) / (hi - lo) * 100;
  el.innerHTML = `<div class="bars">${P.map(([l, v, c]) => `<div class="bar-row"><span class="lab">${l}</span><span class="val">${fr(v)} Mt</span><span class="track"><span class="fill" style="width:${p(v).toFixed(1)}%;background:${c}"></span></span></div>`).join("")}</div><div style="position:relative;height:16px;font-size:.72rem;color:#64748b">${[10, 100, 1000].map(v => `<span style="position:absolute;left:${p(v)}%;transform:translateX(-50%)">${fr(v)} Mt</span>`).join("")}</div>`;
  window.TH.kpis("#ch-kpis", [["4 000 Mt", ["de ciment par an", "le produit le plus fabriqué au monde"], "Ciment"], ["1 900 Mt", ["d'acier brut par an"], "Acier"], ["≈ 150 Mt", ["d'azote fixé en ammoniac", "la base des engrais"], "Ammoniac"], ["945 kJ/mol", ["la triple liaison N≡N", "l'une des plus fortes"], "Azote de l'air"]]);
}

function init() {
  if (!window.TH || !window.d3) { setTimeout(init, 100); return; }
  if (!$("#chimie")) return;
  const run = f => { try { f(); } catch (e) { console.error(f.name || "chimie", e); } };
  [ionique, liaisons, ebullition, bilanCH4, densite, gibbs, haber, cinetique, phEchelle, dosage, redox, batteries, distillation, production].forEach(run);
  run(() => phases("eau"));
  document.querySelectorAll(".ch-ph").forEach(b => b.addEventListener("click", () => { document.querySelectorAll(".ch-ph").forEach(x => x.classList.toggle("on", x === b)); phases(b.dataset.p); }));
  ["ch-hT", "ch-hP"].forEach(i => $("#" + i).addEventListener("input", haber));
  ["ch-ea", "ch-kT", "ch-cat"].forEach(i => $("#" + i).addEventListener("input", cinetique));
  $("#ch-acide").addEventListener("change", dosage);
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
