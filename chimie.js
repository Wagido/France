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

/* tables standard (25 °C, 1 bar) : ΔfH° (kJ/mol), S° (J/mol/K) */
const TD = { "CH₄(g)": [-74.8, 186.3], "O₂(g)": [0, 205.2], "CO₂(g)": [-393.5, 213.8], "H₂O(l)": [-285.8, 69.9], "H₂O(g)": [-241.8, 188.8], "C₃H₈(g)": [-103.8, 270.3], "C₈H₁₈(l)": [-250.1, 361.0], "C₂H₅OH(l)": [-277.7, 160.7], "C₆H₁₂O₆(s)": [-1273.3, 212.1], "Fe(s)": [0, 27.3], "Fe₂O₃(s)": [-824.2, 87.4], "Al(s)": [0, 28.3], "Al₂O₃(s)": [-1675.7, 50.9], "CaO(s)": [-635.1, 38.1], "Ca(OH)₂(s)": [-986.1, 83.4], "CaCO₃(s)": [-1206.9, 91.7], "N₂(g)": [0, 191.6], "H₂(g)": [0, 130.7], "NH₃(g)": [-45.9, 192.8], "H₂O(s)": [-291.8, 41.0], "C(diamant)": [1.9, 2.4], "C(graphite)": [0, 5.7] };
const RX = [
  ["Gaz de la cuisinière : combustion du méthane (eau en vapeur)", [["CH₄(g)", 1], ["O₂(g)", 2]], [["CO₂(g)", 1], ["H₂O(g)", 2]], "La flamme bleue de la gazinière ; le chauffage au gaz."],
  ["Chaudière à condensation : méthane, eau condensée", [["CH₄(g)", 1], ["O₂(g)", 2]], [["CO₂(g)", 1], ["H₂O(l)", 2]], "Même réaction, mais la vapeur d'eau des fumées est condensée : on récupère 88 kJ/mol de plus."],
  ["Bouteille de camping : combustion du propane", [["C₃H₈(g)", 1], ["O₂(g)", 5]], [["CO₂(g)", 3], ["H₂O(g)", 4]], "Le réchaud, le barbecue au gaz."],
  ["Moteur à essence : combustion de l'octane", [["C₈H₁₈(l)", 1], ["O₂(g)", 12.5]], [["CO₂(g)", 8], ["H₂O(g)", 9]], "Environ 44 kJ par gramme d'essence."],
  ["Bioéthanol : combustion de l'éthanol", [["C₂H₅OH(l)", 1], ["O₂(g)", 3]], [["CO₂(g)", 2], ["H₂O(g)", 3]], "Le carburant E85, une lampe à alcool."],
  ["Notre corps : « combustion » du glucose (respiration)", [["C₆H₁₂O₆(s)", 1], ["O₂(g)", 6]], [["CO₂(g)", 6], ["H₂O(l)", 6]], "La même énergie que si le sucre brûlait, libérée lentement par les enzymes : 15,6 kJ (3,7 kcal) par gramme."],
  ["Chauffe-mains jetable : la rouille du fer", [["Fe(s)", 4], ["O₂(g)", 3]], [["Fe₂O₃(s)", 2]], "De la poudre de fer qui s'oxyde en quelques minutes au lieu de quelques années."],
  ["Soudure des rails : la thermite", [["Al(s)", 2], ["Fe₂O₃(s)", 1]], [["Al₂O₃(s)", 1], ["Fe(s)", 2]], "L'aluminium arrache l'oxygène à l'oxyde de fer ; le fer sort fondu, à plus de 2 500 °C."],
  ["Chaux vive dans l'eau (extinction de la chaux)", [["CaO(s)", 1], ["H₂O(l)", 1]], [["Ca(OH)₂(s)", 1]], "Le mélange peut bouillir ; utilisé pour les plats auto-chauffants."],
  ["Four à chaux et à ciment : cuisson du calcaire", [["CaCO₃(s)", 1]], [["CaO(s)", 1], ["CO₂(g)", 1]], "Endothermique : il faut chauffer au-delà de 840 °C, et le CO₂ sort du calcaire lui-même."],
  ["Engrais : synthèse de l'ammoniac (Haber-Bosch)", [["N₂(g)", 1], ["H₂(g)", 3]], [["NH₃(g)", 2]], "Exothermique mais favorisée par le froid : d'où le compromis industriel (partie 8)."],
  ["Électrolyse de l'eau (hydrogène)", [["H₂O(l)", 1]], [["H₂(g)", 1], ["O₂(g)", 0.5]], "Jamais spontanée : il faut fournir au moins 237 kJ/mol d'électricité (1,23 V)."],
  ["Fonte de la glace", [["H₂O(s)", 1]], [["H₂O(l)", 1]], "Endothermique, mais le désordre l'emporte au-dessus de 0 °C."],
  ["Le diamant devient graphite", [["C(diamant)", 1]], [["C(graphite)", 1]], "Possible, mais infiniment lent à température ordinaire."]];
const fmtEq = l => l.map(([sp, n]) => `${n === 1 ? "" : String(n).replace(".", ",") + " "}${sp.replace(/\(.*\)/, "")}`).join(" + ");
function reaction() {
  const r = RX[+$("#ch-rx").value], Tc = +$("#ch-rxT").value, T = Tc + 273.15; $("#ch-rxT-v").textContent = Tc + " °C";
  const sum = (l, k) => l.reduce((a, [sp, n]) => a + n * TD[sp][k], 0);
  const Hr = sum(r[1], 0), Hp = sum(r[2], 0), dH = Hp - Hr, dS = sum(r[2], 1) - sum(r[1], 1), dG = dH - T * dS / 1000, Tinv = dS !== 0 ? dH * 1000 / dS - 273.15 : null;
  const W = 900, H = 230, lo = Math.min(Hr, Hp, 0) - 60, hi = Math.max(Hr, Hp, 0) + 60, y = v => 30 + (hi - v) / (hi - lo) * (H - 60);
  let s = `<svg viewBox="0 0 ${W} ${H}" width="100%" style="font-size:11.5px">`;
  s += `<line x1="40" x2="${W - 20}" y1="${y(0)}" y2="${y(0)}" stroke="#cbd5e1" stroke-dasharray="4 4"/><text x="${W - 22}" y="${y(0) - 4}" text-anchor="end" style="fill:#94a3b8">éléments simples (référence 0)</text>`;
  s += `<line x1="80" x2="330" y1="${y(Hr)}" y2="${y(Hr)}" stroke="#111827" stroke-width="4"/><text x="205" y="${y(Hr) - 8}" text-anchor="middle" font-weight="700" style="fill:#111827">${fmtEq(r[1])}</text><text x="205" y="${y(Hr) + 16}" text-anchor="middle" style="fill:#64748b">Σ ΔfH° réactifs = ${fr(Hr, 1)} kJ</text>`;
  s += `<line x1="570" x2="820" y1="${y(Hp)}" y2="${y(Hp)}" stroke="${dH < 0 ? "#16a34a" : "#dc2626"}" stroke-width="4"/><text x="695" y="${y(Hp) - 8}" text-anchor="middle" font-weight="700" style="fill:${dH < 0 ? "#16a34a" : "#dc2626"}">${fmtEq(r[2])}</text><text x="695" y="${y(Hp) + 16}" text-anchor="middle" style="fill:#64748b">Σ ΔfH° produits = ${fr(Hp, 1)} kJ</text>`;
  s += `<line x1="340" y1="${y(Hr)}" x2="560" y2="${y(Hp)}" stroke="${dH < 0 ? "#16a34a" : "#dc2626"}" stroke-width="2.5" marker-end="url(#rxa)"/><text x="450" y="${(y(Hr) + y(Hp)) / 2 - 8}" text-anchor="middle" font-weight="800" style="fill:${dH < 0 ? "#16a34a" : "#dc2626"}">ΔH° = ${dH > 0 ? "+" : ""}${fr(dH, 1)} kJ</text>`;
  s += `<defs><marker id="rxa" viewBox="0 0 10 10" refX="8" refY="5" markerUnits="userSpaceOnUse" markerWidth="12" markerHeight="12" orient="auto"><path d="M0,0 L10,5 L0,10z" fill="${dH < 0 ? "#16a34a" : "#dc2626"}"/></marker></defs>`;
  $("#ch-rx-out").innerHTML = s + "</svg>";
  const verdict = dG < 0 ? `<b style="color:#16a34a">spontanée</b> à ${Tc} °C` : `<b style="color:#dc2626">non spontanée</b> à ${Tc} °C (il faut fournir au moins ${fr(dG, 0)} kJ d'énergie utile)`;
  const inv = Tinv != null && Tinv > 3000 && dH < 0 ? " Le désordre joue très peu ici : la réaction est spontanée à toutes les températures usuelles." : Tinv != null && Tinv > -273 && Math.sign(dH) === Math.sign(dS) ? ` Elle change de sens vers <b>${fr(Tinv, 0)} °C</b> (T = ΔH / ΔS) : ${dH > 0 ? "spontanée au-dessus" : "spontanée en dessous"}.` : (dH < 0 && dS > 0 ? " Elle est spontanée à toute température." : dH > 0 && dS < 0 ? " Elle n'est spontanée à aucune température." : "");
  const K = Math.exp(-dG * 1000 / (R * T));
  $("#ch-rx-txt").innerHTML = `<ul><li><b>${fmtEq(r[1])} → ${fmtEq(r[2])}</b> : ${r[3]}</li><li><b>ΔH°</b> = ${fr(dH, 1)} kJ/mol (${dH < 0 ? "exothermique : la réaction chauffe" : "endothermique : il faut chauffer"}) ; <b>ΔS°</b> = ${fr(dS, 1)} J/mol/K (${dS > 0 ? "plus de désordre, souvent parce qu'il se forme du gaz" : "moins de désordre"}).</li><li><b>ΔG = ΔH − TΔS</b> = ${fr(dH, 1)} − ${fr(T, 0)} × ${fr(dS / 1000, 4)} = <b>${fr(dG, 1)} kJ/mol</b> : réaction ${verdict}.${inv}</li><li>Constante d'équilibre K = exp(−ΔG/RT) ≈ ${K > 1e6 || K < 1e-6 ? K.toExponential(1).replace(".", ",") : fr(K, 3)} ${K > 1e6 ? "(réaction pratiquement totale)" : K < 1e-6 ? "(presque rien ne réagit)" : "(équilibre partagé)"}.</li></ul><p class="muted" style="font-size:.78rem;margin:4px 0 0">Approximation d'Ellingham : ΔH et ΔS supposés constants avec la température ; tables standard à 25 °C (valeurs de référence usuelles, reprises de mémoire).</p>`;
}
function quadrants() {
  const el = $("#ch-quadrants"); if (!el) return;
  const W = 900, H = 330, cx = 450, cy = 165;
  let s = `<svg viewBox="0 0 ${W} ${H}" width="100%" style="font-size:11.5px">`;
  const Q = [[cx, 10, "#dcfce7", "ΔH < 0, ΔS > 0", "Toujours spontanée", "combustion du gaz, du bois ; poudre noire ; chauffe-mains", 0, 1], [10, 10, "#fef3c7", "ΔH > 0, ΔS > 0", "Spontanée à haute température", "fonte de la glace (> 0 °C) ; four à chaux (> 840 °C) ; poche de froid", 0, 0], [cx, cy, "#e0f2fe", "ΔH < 0, ΔS < 0", "Spontanée à basse température", "congélation (< 0 °C) ; rosée ; synthèse de l'ammoniac", 1, 1], [10, cy, "#fee2e2", "ΔH > 0, ΔS < 0", "Jamais spontanée", "photosynthèse (il faut la lumière) ; électrolyse ; recharge d'une batterie", 1, 0]];
  Q.forEach(([x, y, c, t1, t2, t3]) => s += `<rect x="${x}" y="${y}" width="${cx - 20}" height="${cy - 20}" rx="10" fill="${c}"/><text x="${x + (cx - 20) / 2}" y="${y + 40}" text-anchor="middle" font-weight="800" style="fill:#111827">${t1}</text><text x="${x + (cx - 20) / 2}" y="${y + 64}" text-anchor="middle" font-weight="700" style="fill:#334155">${t2}</text><text x="${x + (cx - 20) / 2}" y="${y + 92}" text-anchor="middle" style="fill:#475569">${t3}</text>`);
  s += `<line x1="${cx - 5}" y1="5" x2="${cx - 5}" y2="${H - 5}" stroke="#94a3b8"/><line x1="5" y1="${cy - 5}" x2="${W - 5}" y2="${cy - 5}" stroke="#94a3b8"/>`;
  el.innerHTML = s + `</svg><p class="muted" style="font-size:.8rem;margin:2px 0 0">ΔG = ΔH − TΔS : le signe de ΔH dit si la réaction dégage de la chaleur, celui de ΔS si elle crée du désordre ; la température arbitre quand les deux s'opposent.</p>`;
}
function evScale() {
  const el = $("#ch-ev"); if (!el) return;
  const E = [["Agitation thermique à 25 °C (kT)", 0.026, "#94a3b8"], ["Liaison hydrogène", 0.2, "#7dd3fc"], ["Photon infrarouge (chaleur)", 0.5, "#fca5a5"], ["Photon de lumière visible (rouge à violet)", 2.5, "#f59e0b"], ["Liaison covalente C–H", 4.3, "#2563eb"], ["Liaison triple de l'azote N≡N", 9.8, "#7c3aed"], ["Photon ultraviolet (coups de soleil)", 4.5, "#a855f7"], ["Rayons X (radiographie)", 5e4, "#64748b"], ["Fission d'un noyau d'uranium", 2e8, "#dc2626"]];
  const lo = -2, hi = 9, p = v => (Math.log10(v) - lo) / (hi - lo) * 100;
  el.innerHTML = `<div class="bars">${E.sort((a, b) => a[1] - b[1]).map(([l, v, c]) => `<div class="bar-row"><span class="lab">${l}</span><span class="val">${v >= 1e4 ? v.toExponential(0).replace("e+", " × 10^") : fr(v, v < 1 ? 3 : 1)} eV</span><span class="track"><span class="fill" style="width:${p(v).toFixed(1)}%;background:${c}"></span></span></div>`).join("")}</div><p class="muted" style="font-size:.8rem;margin:2px 0 0">La chimie se joue entre 0,1 et 10 eV : l'échelle des électrons externes et de la lumière visible. 1 eV par molécule ≈ 96 kJ/mol.</p>`;
}

/* chapitre 1 : masse → moles → molécules */
const MOL = [["eau (H₂O)", 18.02], ["sel (NaCl)", 58.44], ["sucre (saccharose)", 342.3], ["glucose", 180.16], ["CO₂", 44.01], ["méthane", 16.04], ["éthanol", 46.07], ["paracétamol", 151.16], ["fer", 55.85], ["or", 196.97], ["carbone (graphite, diamant)", 12.01]];
function mole() {
  const m = +$("#ch-m").value || 0, M = MOL[+$("#ch-mol").value][1], n = m / M, N = n * 6.022e23;
  window.TH.kpis("#ch-mole", [[fr(M, 2) + " g/mol", ["masse d'une mole"], "Masse molaire"], [n < 0.01 ? n.toExponential(2).replace(".", ",") : fr(n, 3) + " mol", ["n = m / M"], "Quantité de matière"], [N.toExponential(2).replace(".", ",").replace("e+", " × 10^"), ["n × 6,022·10²³"], "Nombre de molécules (ou d'atomes)"]]);
}
/* chapitre 2 : formes VSEPR */
function vsepr() {
  const el = $("#ch-vsepr"); if (!el) return;
  const F = [["Linéaire", "CO₂", "180°", 2, 0, "deux doubles liaisons, aucune paire libre sur le carbone"], ["Triangle plat", "BF₃, formaldéhyde", "120°", 3, 0, "trois paires autour de l'atome central"], ["Tétraèdre", "CH₄ (méthane)", "109,5°", 4, 0, "quatre liaisons : la forme de base du carbone"], ["Pyramide", "NH₃ (ammoniac)", "107°", 3, 1, "une paire libre referme un peu les angles"], ["Coudée", "H₂O (eau)", "104,5°", 2, 2, "deux paires libres : molécule polaire"]];
  const W = 900, H = 220, cw = W / F.length;
  let s = `<svg viewBox="0 0 ${W} ${H}" width="100%" style="font-size:11px">`;
  F.forEach(([n, ex, ang, b, lp], i) => {
    const cx = cw * i + cw / 2, cy = 85; let dirs = [];
    if (b + lp === 2) dirs = [180, 0]; else if (b + lp === 3) dirs = [90, 210, 330]; else dirs = [90, 200, 340, 270];
    if (n === "Pyramide") dirs = [90, 210, 330, 270]; if (n === "Coudée") dirs = [215, 325, 60, 120];
    dirs.forEach((a, k) => { const r = a * Math.PI / 180, x = cx + 48 * Math.cos(r), y = cy - 48 * Math.sin(r), lone = k >= b; s += lone ? `<ellipse cx="${cx + 30 * Math.cos(r)}" cy="${cy - 30 * Math.sin(r)}" rx="13" ry="8" transform="rotate(${-a} ${cx + 30 * Math.cos(r)} ${cy - 30 * Math.sin(r)})" fill="#fde68a" stroke="#f59e0b"/>` : `<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="#475569" stroke-width="4"${n === "Tétraèdre" && k === 3 ? ' stroke-dasharray="4 3"' : ""}/><circle cx="${x}" cy="${y}" r="11" fill="#e2e8f0" stroke="#64748b"/>`; });
    s += `<circle cx="${cx}" cy="${cy}" r="15" fill="#2563eb"/><text x="${cx}" y="${H - 56}" text-anchor="middle" font-weight="800" style="fill:#111827">${n}</text><text x="${cx}" y="${H - 40}" text-anchor="middle" style="fill:#2563eb">${ex}</text><text x="${cx}" y="${H - 24}" text-anchor="middle" style="fill:#475569">angle ${ang}</text>`;
  });
  el.innerHTML = s + `</svg><p class="muted" style="font-size:.8rem;margin:2px 0 0">Bleu : atome central ; gris : atomes liés ; jaune : paires d'électrons libres. Le tétraèdre est en trois dimensions (une liaison pointe vers l'arrière).</p>`;
}
/* chapitre 4 : masse volumique d'un métal */
const MET = [["Cuivre", "cubique à faces centrées", 4, 63.55, 361.5, 8.96], ["Aluminium", "cubique à faces centrées", 4, 26.98, 404.9, 2.70], ["Or", "cubique à faces centrées", 4, 196.97, 407.8, 19.3], ["Fer (α)", "cubique centré", 2, 55.85, 286.7, 7.87], ["Tungstène", "cubique centré", 2, 183.84, 316.5, 19.3]];
function maille() {
  const el = $("#ch-maille"); if (!el) return;
  const [n, st, Z, M, a, rho] = MET[+$("#ch-metal").value], calc = Z * M / 6.022e23 / Math.pow(a * 1e-10, 3);
  const comp = Z === 4 ? 74 : 68;
  const W = 900, H = 230, s0 = 120, ox = 120, oy = 50, d = 45;
  let s = `<svg viewBox="0 0 ${W} ${H}" width="100%" style="font-size:12px">`;
  const P = (x, y, z) => [ox + x * s0 + z * d, oy + (1 - y) * s0 + 20 - z * d * .6];
  const cube = [[0, 0, 0], [1, 0, 0], [1, 1, 0], [0, 1, 0], [0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]], E = [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]];
  E.forEach(([a1, b1]) => { const p = P(...cube[a1]), q = P(...cube[b1]); s += `<line x1="${p[0]}" y1="${p[1]}" x2="${q[0]}" y2="${q[1]}" stroke="#94a3b8"/>`; });
  let at = cube.map(c => [c, 9, "#64748b"]);
  if (Z === 4) at = at.concat([[.5, .5, 0], [.5, .5, 1], [.5, 0, .5], [.5, 1, .5], [0, .5, .5], [1, .5, .5]].map(c => [c, 11, "#d97706"])); else at.push([[.5, .5, .5], 12, "#d97706"]);
  at.sort((u, v) => u[0][2] - v[0][2]).reverse().forEach(([c, r, col]) => { const p = P(...c); s += `<circle cx="${p[0]}" cy="${p[1]}" r="${r}" fill="${col}" stroke="#fff"/>`; });
  s += `<text x="420" y="50" font-weight="800">${n} : ${st}</text><text x="420" y="78">Atomes par maille : ${Z === 4 ? "8 sommets × 1/8 + 6 faces × 1/2 = 4" : "8 sommets × 1/8 + 1 au centre = 2"}</text><text x="420" y="104">Côté de la maille : a = ${fr(a, 1)} pm (mesuré par diffraction des rayons X)</text><text x="420" y="130">Masse molaire : ${fr(M, 2)} g/mol</text><text x="420" y="160" font-weight="800" style="fill:#2563eb">ρ = ${Z} × ${fr(M, 2)} / (6,022·10²³ × a³) = ${fr(calc, 2)} g/cm³</text><text x="420" y="184" style="fill:#16a34a">valeur mesurée : ${fr(rho, 2)} g/cm³</text><text x="420" y="208" style="fill:#64748b">compacité : ${comp} % de l'espace occupé</text>`;
  el.innerHTML = s + "</svg>";
}
/* chapitre 5 : tableau d'avancement */
function avancement() {
  const el = $("#ch-avancement"); if (!el) return;
  const n1 = +$("#ch-n1").value, n2 = +$("#ch-n2").value, xm = Math.min(n1, n2 / 2), x = xm * +$("#ch-x").value / 100;
  $("#ch-n1-v").textContent = fr(n1, 1) + " mol"; $("#ch-n2-v").textContent = fr(n2, 1) + " mol"; $("#ch-x-v").textContent = "x = " + fr(x, 2) + " mol";
  const lim = n1 === n2 / 2 ? "les deux réactifs sont épuisés en même temps (mélange stœchiométrique)" : n1 < n2 / 2 ? "le méthane est le réactif limitant : il reste de l'oxygène" : "l'oxygène est le réactif limitant : il reste du méthane (dans une chaudière, combustion incomplète et risque de monoxyde de carbone)";
  const row = (t, a, b, c, d) => `<tr><td><b>${t}</b></td><td>${a}</td><td>${b}</td><td>${c}</td><td>${d}</td></tr>`;
  const v = e => fr(Math.max(0, e), 2);
  const sp = [["CH₄", n1 - x, "#64748b"], ["O₂", n2 - 2 * x, "#0ea5e9"], ["CO₂", x, "#111827"], ["H₂O", 2 * x, "#2563eb"]], mx = Math.max(n1, n2, 2 * xm, 1);
  el.innerHTML = `<div class="table-scroll"><table class="cmp-t ro-t"><thead><tr><th>État</th><th>CH₄</th><th>2 O₂</th><th>CO₂</th><th>2 H₂O</th></tr></thead><tbody>${row("Au départ", v(n1), v(n2), 0, 0)}${row("En cours (avancement x)", "n₁ − x = " + v(n1 - x), "n₂ − 2x = " + v(n2 - 2 * x), "x = " + v(x), "2x = " + v(2 * x))}${row("À la fin (x max = " + v(xm) + ")", v(n1 - xm), v(n2 - 2 * xm), v(xm), v(2 * xm))}</tbody></table></div><div class="bars" style="margin-top:8px">${sp.map(([l, q, c]) => `<div class="bar-row"><span class="lab">${l}</span><span class="val">${v(q)} mol</span><span class="track"><span class="fill" style="width:${(100 * Math.max(0, q) / mx).toFixed(1)}%;background:${c}"></span></span></div>`).join("")}</div><p class="muted" style="font-size:.85rem;margin:6px 0 0">Avancement maximal x max = min(n₁ ; n₂ / 2) = ${v(xm)} mol : ${lim}.</p>`;
}
/* chapitre 9 : pharmacocinétique d'ordre 1 */
function pharma() {
  const el = $("#ch-pharma"); if (!el) return;
  const t12 = +$("#ch-t12").value, tau = +$("#ch-tau").value; $("#ch-t12-v").textContent = fr(t12, 1) + " h"; $("#ch-tau-v").textContent = tau + " h";
  const k = Math.log(2) / t12, T = 48, pts = []; let c = 0;
  for (let t = 0; t <= T; t += 0.1) { if (Math.abs(t % tau) < 0.05 || t < 0.05) c += 1; pts.push([t, c]); c *= Math.exp(-k * 0.1); }
  const W = 900, H = 260, m = { l: 44, r: 14, t: 12, b: 28 }, x = d3.scaleLinear([0, T], [m.l, W - m.r]), ymax = Math.max(...pts.map(p => p[1])) * 1.1, y = d3.scaleLinear([0, ymax], [H - m.b, m.t]);
  let s = `<svg viewBox="0 0 ${W} ${H}" width="100%" style="font-size:10.5px">`;
  y.ticks(5).forEach(v => s += `<line x1="${m.l}" x2="${W - m.r}" y1="${y(v)}" y2="${y(v)}" stroke="#eef2f7"/><text x="${m.l - 5}" y="${y(v) + 3}" text-anchor="end" style="fill:#64748b">${fr(v, 1)}</text>`);
  for (let t = 0; t <= T; t += 6) s += `<text x="${x(t)}" y="${H - 8}" text-anchor="middle" style="fill:#64748b">${t} h</text>`;
  s += `<polyline points="${pts.map(([t, v]) => `${x(t)},${y(v)}`).join(" ")}" fill="none" stroke="#7c3aed" stroke-width="2.2"/>`;
  const css = 1 / (1 - Math.exp(-k * tau)); s += `<line x1="${m.l}" x2="${W - m.r}" y1="${y(css)}" y2="${y(css)}" stroke="#dc2626" stroke-dasharray="5 4"/><text x="${W - m.r}" y="${y(css) - 4}" text-anchor="end" style="fill:#dc2626">pic à l'équilibre : ${fr(css, 2)} × la dose</text>`;
  el.innerHTML = s + `</svg><p class="muted" style="font-size:.8rem;margin:2px 0 0">Concentration en unités de « dose » ; absorption supposée instantanée. Si l'intervalle est court par rapport à la demi-vie, le médicament s'accumule (plateau élevé) ; s'il est long, la concentration retombe presque à zéro entre deux prises.</p>`;
}
/* chapitre 12 : diagramme potentiel-pH du fer (simplifié) */
function pourbaix() {
  const el = $("#ch-pourbaix"); if (!el) return;
  const W = 900, H = 360, m = { l: 50, r: 20, t: 12, b: 32 }, x = d3.scaleLinear([0, 14], [m.l, W - m.r]), y = d3.scaleLinear([-1.2, 1.6], [H - m.b, m.t]);
  const L = (pts, c, w = 2.2, d = "") => `<polyline points="${pts.map(([p, e]) => `${x(p)},${y(e)}`).join(" ")}" fill="none" stroke="${c}" stroke-width="${w}" stroke-dasharray="${d}"/>`;
  let s = `<svg viewBox="0 0 ${W} ${H}" width="100%" style="font-size:11px">`;
  // zones (polygones approchés, concentration 10⁻⁶ mol/L)
  const poly = (pts, c) => `<polygon points="${pts.map(([p, e]) => `${x(p)},${y(e)}`).join(" ")}" fill="${c}"/>`;
  s += poly([[0, -1.2], [14, -1.2], [14, -0.88], [9.4, -0.6], [0, -0.62]], "#cbd5e1");          // immunité
  s += poly([[0, -0.62], [9.4, -0.6], [6.4, 0.06], [1.6, 0.77], [0, 0.77]], "#fecaca");                     // corrosion Fe2+
  s += poly([[0, 0.77], [0, 1.6], [1.6, 1.6], [1.6, 0.77]], "#fca5a5");                         // Fe3+
  s += poly([[1.6, 0.77], [1.6, 1.6], [14, 1.6], [14, -0.88], [9.4, -0.6], [6.4, 0.06]], "#bbf7d0"); // passivation oxydes
  s += L([[0, 1.23], [14, 1.23 - 0.059 * 14]], "#2563eb", 1.6, "6 4") + L([[0, 0], [14, -0.059 * 14]], "#2563eb", 1.6, "6 4");
  s += `<text x="${x(13.5)}" y="${y(1.23 - 0.059 * 13.5) - 6}" text-anchor="end" style="fill:#2563eb">O₂ / H₂O</text><text x="${x(13.5)}" y="${y(-0.059 * 13.5) - 6}" text-anchor="end" style="fill:#2563eb">H₂O / H₂</text><text x="${x(7.4)}" y="${y(0.05)}" style="fill:#1d4ed8" font-style="italic">eau stable entre les deux pointillés</text>`;
  [[3, -0.9, "IMMUNITÉ : le fer reste métal", "#334155"], [2.5, 0.05, "CORROSION : le fer se dissout (Fe²⁺)", "#b91c1c"], [0.3, 1.2, "Fe³⁺", "#991b1b"], [6.2, 1.35, "PASSIVATION : couche d'oxyde (rouille, Fe₂O₃)", "#166534"]].forEach(([p, e, t, c]) => s += `<text x="${x(p)}" y="${y(e)}" font-weight="800" style="fill:${c}">${t}</text>`);
  [0, 2, 4, 6, 7, 8, 10, 12, 14].forEach(v => s += `<text x="${x(v)}" y="${H - 10}" text-anchor="middle" style="fill:#64748b">pH ${v}</text>`);
  [-1, -0.5, 0, 0.5, 1, 1.5].forEach(v => s += `<text x="${m.l - 5}" y="${y(v) + 3}" text-anchor="end" style="fill:#64748b">${fr(v, 1)} V</text>`);
  s += `<line x1="${x(12.5)}" x2="${x(12.5)}" y1="${m.t}" y2="${H - m.b}" stroke="#111827" stroke-dasharray="3 3"/><text x="${x(12.4)}" y="${m.t + 12}" text-anchor="end" style="fill:#111827">béton sain</text><line x1="${x(7)}" x2="${x(7)}" y1="${m.t}" y2="${H - m.b}" stroke="#94a3b8" stroke-dasharray="3 3"/><text x="${x(7) - 3}" y="${m.t + 12}" text-anchor="end" style="fill:#475569">eau neutre</text>`;
  el.innerHTML = s + `</svg><p class="muted" style="font-size:.8rem;margin:2px 0 0">Diagramme simplifié du fer dans l'eau à 25 °C (frontières approchées, ions dissous à 10⁻⁶ mol/L), d'après la méthode de M. Pourbaix. Le domaine d'immunité du fer est entièrement sous la ligne de l'eau : dans l'eau, le fer est toujours attaqué, sauf s'il est protégé par une couche d'oxyde (milieu basique) ou par un métal plus réducteur (zinc).</p>`;
}
/* chapitre 13 : ébullition des alcanes */
function alcanes() {
  const el = $("#ch-alcanes"); if (!el) return;
  const A = [["méthane", -162], ["éthane", -89], ["propane", -42], ["butane", -0.5], ["pentane", 36], ["hexane", 69], ["heptane", 98], ["octane", 126], ["nonane", 151], ["décane", 174]];
  const W = 900, H = 260, m = { l: 50, r: 14, t: 14, b: 40 }, x = d3.scaleLinear([1, 10], [m.l + 20, W - m.r - 20]), y = d3.scaleLinear([-180, 200], [H - m.b, m.t]);
  let s = `<svg viewBox="0 0 ${W} ${H}" width="100%" style="font-size:10.5px">`;
  [-150, -100, -50, 0, 50, 100, 150, 200].forEach(v => s += `<line x1="${m.l}" x2="${W - m.r}" y1="${y(v)}" y2="${y(v)}" stroke="${v === 20 ? "#f59e0b" : "#eef2f7"}"/><text x="${m.l - 5}" y="${y(v) + 3}" text-anchor="end" style="fill:#64748b">${v} °C</text>`);
  s += `<line x1="${m.l}" x2="${W - m.r}" y1="${y(20)}" y2="${y(20)}" stroke="#f59e0b" stroke-dasharray="5 4"/><text x="${W - m.r}" y="${y(20) - 4}" text-anchor="end" style="fill:#b45309">20 °C : au-dessous, gaz ; au-dessus, liquide</text>`;
  s += `<polyline points="${A.map(([, t], i) => `${x(i + 1)},${y(t)}`).join(" ")}" fill="none" stroke="#2563eb" stroke-width="2.2"/>`;
  A.forEach(([n, t], i) => s += `<circle cx="${x(i + 1)}" cy="${y(t)}" r="5" fill="${t < 20 ? "#0ea5e9" : "#2563eb"}"/><text x="${x(i + 1)}" y="${H - 24}" text-anchor="middle" style="fill:#111827">${n}</text><text x="${x(i + 1)}" y="${H - 10}" text-anchor="middle" style="fill:#64748b">C${i + 1}</text><text x="${x(i + 1) + 6}" y="${y(t) - 6}" style="fill:#475569">${fr(t, t % 1 ? 1 : 0)}</text>`);
  el.innerHTML = s + `</svg><p class="muted" style="font-size:.8rem;margin:2px 0 0">Gaz de ville et de briquet (C1 à C4), essence (C5 à C10 environ), kérosène et gazole au-delà. Plus la chaîne est longue, plus les forces de van der Waals entre molécules sont fortes.</p>`;
}

/* chapitre 15 : simulateur « qui réagit avec quoi ? » */
let PT = null, PTsel = [], PTmode = "paire";
const OX = { H: [1, -1], Li: [1], Be: [2], B: [3], C: [4, -4], N: [5, -3], O: [-2], F: [-1], Na: [1], Mg: [2], Al: [3], Si: [4, -4], P: [5, -3], S: [6, -2], Cl: [7, -1], K: [1], Ca: [2], Sc: [3], Ti: [4], V: [5], Cr: [3], Mn: [2], Fe: [3], Co: [2], Ni: [2], Cu: [2], Zn: [2], Ga: [3], Ge: [4], As: [3, -3], Se: [4, -2], Br: [5, -1], Rb: [1], Sr: [2], Y: [3], Zr: [4], Nb: [5], Mo: [6], Tc: [7], Ru: [4], Rh: [3], Pd: [2], Ag: [1], Cd: [2], In: [3], Sn: [4], Sb: [3, -3], Te: [4, -2], I: [5, -1], Cs: [1], Ba: [2], Hf: [4], Ta: [5], W: [6], Re: [7], Os: [4], Ir: [3], Pt: [2], Au: [3], Hg: [2], Tl: [1], Pb: [2], Bi: [3], Po: [2, -2], At: [-1], Fr: [1], Ra: [2], Th: [4], U: [6], Pu: [4], Ce: [3] };
const KNOWN = { "NaCl": ["chlorure de sodium, le sel de cuisine", -411], "KCl": ["chlorure de potassium (sylvite, engrais)", -437], "LiCl": ["chlorure de lithium (saumures des salars)", -409], "CsCl": ["chlorure de césium", -443], "HCl": ["chlorure d'hydrogène : dissous dans l'eau, l'acide chlorhydrique (suc gastrique)", -92], "HF": ["fluorure d'hydrogène, qui grave le verre", -273], "H₂O": ["l'eau", -286], "CO₂": ["dioxyde de carbone", -394], "CH₄": ["méthane, le gaz naturel", -75], "NH₃": ["ammoniac, base des engrais", -46], "H₂S": ["sulfure d'hydrogène (odeur d'œuf pourri)", -21], "SiO₂": ["silice : le sable, le quartz, le verre", -911], "Al₂O₃": ["alumine : corindon, rubis, saphir ; couche qui protège l'aluminium", -1676], "Fe₂O₃": ["oxyde de fer : la rouille, l'hématite", -824], "MgO": ["oxyde de magnésium (éclair des anciens flashs photo)", -601], "CaO": ["chaux vive", -635], "Na₂O": ["oxyde de sodium", -414], "K₂O": ["oxyde de potassium", -363], "CuO": ["oxyde de cuivre (noir)", -157], "ZnO": ["oxyde de zinc, crème solaire", -350], "TiO₂": ["dioxyde de titane, pigment blanc des peintures", -944], "SO₃": ["trioxyde de soufre : dans l'eau, l'acide sulfurique", -396], "P₂O₅": ["oxyde de phosphore, très avide d'eau", -1505], "N₂O₅": ["pentoxyde d'azote (l'azote et l'oxygène ne réagissent qu'à très haute température : oxydes d'azote des moteurs)", 11], "CaF₂": ["fluorure de calcium, la fluorine", -1220], "NaF": ["fluorure de sodium (dentifrices)", -576], "AgCl": ["chlorure d'argent, sensible à la lumière (photographie)", -127], "AgBr": ["bromure d'argent, base de la photo argentique", -100], "NaH": ["hydrure de sodium", -56], "LiH": ["hydrure de lithium", -91], "CaH₂": ["hydrure de calcium", -181], "SiH₄": ["silane (fabrication des puces)", 34], "ZnS": ["sulfure de zinc, la blende", -206], "PbS": ["sulfure de plomb, la galène", -100], "FeCl₃": ["chlorure de fer (traitement de l'eau, gravure des circuits)", -399], "AlCl₃": ["chlorure d'aluminium", -704], "CuCl₂": ["chlorure de cuivre", -220], "MgCl₂": ["chlorure de magnésium (eau de mer)", -641], "CaCl₂": ["chlorure de calcium (sel de déneigement)", -796], "CCl₄": ["tétrachlorure de carbone", -128], "PCl₅": ["pentachlorure de phosphore", -444], "SiC": ["carbure de silicium, abrasif et électronique de puissance", -73], "WC": ["carbure de tungstène, outils de coupe", -40], "Fe₃C": ["cémentite (dans l'acier)", 25], "UO₃": ["oxyde d'uranium", -1224], "BN": ["nitrure de bore", -254], "Li₂O": ["oxyde de lithium", -598], "SnO₂": ["oxyde d'étain, la cassitérite", -578], "PbO": ["oxyde de plomb", -219] };
const sub = n => n === 1 ? "" : String(n).split("").map(c => "₀₁₂₃₄₅₆₇₈₉"[c]).join("");
const gcd = (a, b) => b ? gcd(b, a % b) : a;
const isMetal = e => ["alcalin", "alcalino", "transition", "pauvre", "lanthanide", "actinide"].includes(e.f);
function compose(A, B) {
  if (A.z === B.z) { const di = ["H", "N", "O", "F", "Cl", "Br", "I"].includes(A.s); return { t: "meme", f: di ? A.s + "₂" : A.s, txt: di ? `molécule diatomique ${A.s}₂ (les atomes se lient entre eux)` : isMetal(A) ? "le métal pur (liaison métallique)" : A.f === "gaznoble" ? "gaz monoatomique : ne se lie pas" : "solide covalent ou molécules de l'élément pur" }; }
  if (A.f === "gaznoble" || B.f === "gaznoble") { const g = A.f === "gaznoble" ? A : B, o = A.f === "gaznoble" ? B : A; if (["Xe", "Kr"].includes(g.s) && ["F", "O"].includes(o.s)) return { t: "covalent", f: g.s === "Xe" ? (o.s === "F" ? "XeF₂, XeF₄, XeF₆" : "XeO₃ (explosif)") : "KrF₂", txt: "les gaz nobles lourds réagissent seulement avec le fluor (et l'oxygène pour le xénon), découverte de 1962" }; return { t: "rien", txt: `pas de réaction : ${g.n.toLowerCase()} est un gaz noble, sa couche électronique est complète` }; }
  if (A.en == null || B.en == null) return { t: "inconnu", txt: "élément superlourd : chimie quasiment inconnue (quelques atomes produits)" };
  if (isMetal(A) && isMetal(B)) return { t: "alliage", txt: `deux métaux : pas de composé ionique, mais un <b>alliage</b> ou un composé intermétallique (comme le laiton cuivre-zinc, le bronze cuivre-étain, l'acier fer-carbone)` };
  const [c, a] = A.en <= B.en ? [A, B] : [B, A];
  const pos = (OX[c.s] || [3]).find(o => o > 0), neg = (OX[a.s] || []).find(o => o < 0);
  const d = Math.abs(A.en - B.en);
  if (!pos || !neg) return { t: d < 0.4 ? "covalent" : "polaire", f: "?", txt: "composé possible, mais la règle simple ne prévoit pas sa formule" };
  const g = gcd(pos, -neg), nc = -neg / g, na = pos / g;
  let f = c.s + sub(nc) + a.s + sub(na);
  if (c.s === "H" && a.s === "C") f = "CH₄"; if (c.s === "H" && ["N", "P", "As"].includes(a.s)) f = a.s + "H₃"; if (c.s === "H" && a.s === "Si") f = "SiH₄";
  const t = d > 1.7 ? "ionique" : d > 0.4 ? "polaire" : "covalent";
  return { t, f, d, c, a, pos, neg, known: KNOWN[f] };
}
const COLT = { ionique: "#f59e0b", polaire: "#a78bfa", covalent: "#38bdf8", alliage: "#94a3b8", rien: "#f1f5f9", meme: "#e2e8f0", inconnu: "#fafafa" };
const LABT = { ionique: "liaison ionique (sel)", polaire: "covalente polaire", covalent: "covalente", alliage: "alliage (deux métaux)", rien: "pas de réaction (gaz noble)", inconnu: "inconnu" };
const POT = { Li: -3.04, K: -2.93, Rb: -2.98, Cs: -3.03, Ba: -2.91, Sr: -2.89, Ca: -2.87, Na: -2.71, Mg: -2.37, Be: -1.85, Al: -1.66, Ti: -1.63, Mn: -1.18, Zn: -0.76, Cr: -0.74, Fe: -0.44, Cd: -0.40, Co: -0.28, Ni: -0.25, Sn: -0.14, Pb: -0.13, Cu: 0.34, Ag: 0.80, Hg: 0.85, Pd: 0.95, Pt: 1.18, Au: 1.50, Ga: -0.53, In: -0.34, Tl: -0.34, Bi: 0.31, V: -1.18, Zr: -1.45, Y: -2.37, Sc: -2.03, La: -2.38, U: -1.80 };
const NOBLEM = ["Au", "Pt", "Ir", "Pd", "Rh", "Ru", "Os", "Ag"];
function reactif(e, m) {   // retourne [niveau 0-3, texte]
  if (e.f === "gaznoble") return [0, "gaz noble : ne réagit pas"];
  if (e.en == null) return [-1, "chimie inconnue"];
  const p = POT[e.s], s = e.s, fam = e.f;
  if (m === "O") {
    if (NOBLEM.includes(s)) return [0, "métal noble : ne s'oxyde pas à l'air (d'où les bijoux)"];
    if (fam === "alcalin") return [3, `s'oxyde instantanément à l'air (conservé sous huile) → ${compose(e, PT.O).f}, oxyde basique`];
    if (fam === "alcalino") return [s === "Be" ? 1 : 2, `${s === "Mg" ? "brûle avec une flamme blanche aveuglante" : "se ternit à l'air"} → ${compose(e, PT.O).f}, oxyde basique`];
    if (["Al", "Zn", "Cr", "Ti", "Sn", "Ni"].includes(s)) return [1, `s'oxyde en surface, mais la couche d'oxyde ${compose(e, PT.O).f} protège le reste (passivation)`];
    if (s === "Fe") return [1, "rouille lentement en présence d'humidité → Fe₂O₃ (rouille), qui ne protège pas"];
    if (s === "Cu") return [1, "se couvre lentement d'une patine (vert-de-gris sur les toits)"];
    if (["C", "S", "H"].includes(s)) return [2, `brûle une fois allumé → ${s === "C" ? "CO₂ (et CO si l'oxygène manque)" : s === "S" ? "SO₂, gaz irritant, puis SO₃" : "H₂O, avec une flamme presque invisible"}`];
    if (s === "P") return [3, "le phosphore blanc s'enflamme spontanément à l'air → P₂O₅"];
    if (s === "N") return [1, "ne réagit qu'à très haute température (moteurs, éclairs) → oxydes d'azote NOx"];
    if (["F", "Cl", "Br", "I"].includes(s)) return [0, "pas de réaction directe (les oxydes d'halogène existent mais sont instables)"];
    if (s === "O") return [0, "c'est l'oxygène lui-même"];
    if (fam === "lanthanide" || fam === "actinide") return [2, `s'oxyde facilement à l'air → oxyde ${compose(e, PT.O).f}`];
    return [1, `forme l'oxyde ${compose(e, PT.O).f}, en général lentement ou à chaud`];
  }
  if (m === "eau") {
    if (fam === "alcalin") return [3, `réagit violemment avec l'eau${["K", "Rb", "Cs"].includes(s) ? " (explosion, l'hydrogène s'enflamme)" : s === "Li" ? " (calmement pour le lithium)" : ""} : 2 ${s} + 2 H₂O → 2 ${s}OH + H₂`];
    if (["Ca", "Sr", "Ba"].includes(s)) return [2, `réagit avec l'eau froide, en dégageant de l'hydrogène → ${s}(OH)₂`];
    if (s === "Mg") return [1, "réagit avec l'eau chaude ou la vapeur (feux de magnésium : ne pas les éteindre à l'eau)"];
    if (s === "F") return [3, "décompose l'eau violemment, en libérant de l'oxygène"];
    if (s === "Cl") return [1, "se dissout et réagit en partie : acide hypochloreux, le désinfectant de l'eau des piscines"];
    if (["Al", "Zn", "Fe"].includes(s)) return [s === "Fe" ? 1 : 0, s === "Fe" ? "rouille en présence d'eau et d'oxygène" : "protégé par sa couche d'oxyde : pas de réaction visible"];
    if (fam === "lanthanide") return [1, "réagit lentement avec l'eau, plus vite à chaud"];
    return [0, "pas de réaction notable avec l'eau"];
  }
  if (m === "acide") {
    if (p != null) return p < -1.5 ? [3, `réaction très vive : dégage de l'hydrogène (potentiel ${fr(p, 2)} V)`] : p < -0.2 ? [2, `est attaqué en dégageant de l'hydrogène : ${s} + acide → sel + H₂ (potentiel ${fr(p, 2)} V)`] : p < 0 ? [1, `attaque lente (potentiel ${fr(p, 2)} V, proche de celui de l'hydrogène)`] : [0, `n'est pas attaqué par un acide dilué non oxydant (potentiel ${fr(p, 2)} V, au-dessus de l'hydrogène)${s === "Cu" || s === "Ag" ? " ; l'acide nitrique, oxydant, l'attaque" : s === "Au" || s === "Pt" ? " ; seule l'« eau régale » (acides nitrique + chlorhydrique) le dissout" : ""}`];
    if (isMetal(e)) return [1, "métal attaqué par les acides (valeur indicative)"];
    return [0, "non-métal : pas de réaction acide-métal"];
  }
  if (m === "Cl") {
    if (s === "Cl") return [0, "c'est le chlore lui-même"];
    if (["O", "N", "C"].includes(s)) return [0, "pas de réaction directe notable"];
    if (s === "H") return [3, "explose à la lumière : H₂ + Cl₂ → 2 HCl"];
    if (fam === "alcalin") return [3, `réaction très violente, flamme : → ${compose(e, PT.Cl).f}`];
    if (NOBLEM.includes(s) && s !== "Ag") return [1, `réagit seulement à chaud → ${compose(e, PT.Cl).f}`];
    if (isMetal(e)) return [2, `brûle dans le chlore → ${compose(e, PT.Cl).f}`];
    if (s === "F") return [2, "forme des fluorures de chlore (ClF, ClF₃), très réactifs"];
    return [2, `réagit → ${compose(e, PT.Cl).f}`];
  }
  if (m === "H") {
    if (s === "F") return [3, "explose même dans le noir et au froid : H₂ + F₂ → 2 HF"];
    if (s === "Cl") return [3, "explose à la lumière → HCl"];
    if (s === "O") return [3, "mélange explosif, déclenché par une étincelle → H₂O (moteurs de fusée)"];
    if (s === "N") return [1, "seulement avec un catalyseur, sous pression → NH₃ (procédé Haber-Bosch, partie 8)"];
    if (["Br", "I", "S"].includes(s)) return [1, `à chaud → ${compose(e, PT.H).f}`];
    if (s === "C") return [0, "presque aucune réaction directe ; le méthane se fabrique autrement"];
    if (fam === "alcalin" || ["Ca", "Sr", "Ba"].includes(s)) return [1, `à chaud → hydrure ${compose(e, PT.H).f}, où l'hydrogène est un ion H⁻`];
    if (s === "Pd") return [1, "absorbe l'hydrogène comme une éponge (jusqu'à 900 fois son volume)"];
    return [0, "pas de réaction notable"];
  }
  return [0, ""];
}
const LV = [["#f1f5f9", "ne réagit pas"], ["#fde68a", "lentement ou dans certaines conditions"], ["#fb923c", "vivement"], ["#dc2626", "violemment"]];
function drawPT() {
  const el = $("#ch-pt"); if (!el || !PT) return;
  const cw = 46, ch = 44, W = 18 * cw + 10, H = 10 * ch + 10;
  const A = PTsel[0] ? PT[PTsel[0]] : null;
  let s = `<svg viewBox="0 0 ${W} ${H}" width="100%" style="font-size:11px;cursor:pointer;user-select:none">`;
  Object.values(PT).forEach(e => {
    let col = "#fff", stroke = "#cbd5e1", txt = "";
    if (PTmode === "paire" && A) { const c = compose(A, e); col = COLT[c.t] || "#fff"; txt = c.f && c.f !== "?" && e.z !== A.z ? c.f : ""; }
    if (PTmode !== "paire") { const [lv] = reactif(e, PTmode); col = lv < 0 ? "#fafafa" : LV[lv][0]; }
    const sel = PTsel.includes(e.s), x = 5 + (e.x - 1) * cw, y = 5 + (e.y - 1) * ch - (e.y >= 9 ? -6 : 0);
    s += `<g data-s="${e.s}"><rect x="${x}" y="${y}" width="${cw - 3}" height="${ch - 3}" rx="4" fill="${col}" stroke="${sel ? "#111827" : stroke}" stroke-width="${sel ? 2.5 : 1}"/><text x="${x + 3}" y="${y + 10}" font-size="8" style="fill:#64748b">${e.z}</text><text x="${x + (cw - 3) / 2}" y="${y + 24}" text-anchor="middle" font-weight="800" font-size="14" style="fill:#111827">${e.s}</text>${txt ? `<text x="${x + (cw - 3) / 2}" y="${y + 37}" text-anchor="middle" font-size="8.5" style="fill:#111827">${txt.length > 9 ? "" : txt}</text>` : ""}</g>`;
  });
  el.innerHTML = s + "</svg>";
  el.querySelectorAll("g[data-s]").forEach(g => g.addEventListener("click", () => clickPT(g.dataset.s)));
  $("#ch-pt-legend").innerHTML = PTmode === "paire" ? (A ? Object.entries(LABT).map(([k, l]) => `<span><i style="border-top-color:${COLT[k]};opacity:1;width:14px;border-top-width:12px;outline:1px solid #cbd5e1"></i>${l}</span>`).join("") : "") : LV.map(([c, l]) => `<span><i style="border-top-color:${c};opacity:1;width:14px;border-top-width:12px;outline:1px solid #cbd5e1"></i>${l}</span>`).join("");
}
function clickPT(sym) {
  const e = PT[sym];
  if (PTmode !== "paire") { const [lv, t] = reactif(e, PTmode); const R = { O: "l'oxygène de l'air", eau: "l'eau", acide: "un acide dilué (acide chlorhydrique)", Cl: "le chlore", H: "l'hydrogène" }[PTmode]; PTsel = [sym]; drawPT(); $("#ch-pt-res").innerHTML = `<p><b>${e.n} (${e.s}) avec ${R}</b> : ${lv < 0 ? "" : "<b>" + LV[lv][1] + "</b>. "}${t}.</p><p class="muted" style="font-size:.8rem;margin:2px 0 0">Famille : ${e.f} ; électronégativité ${e.en ?? "–"}${POT[e.s] != null ? ` ; potentiel standard ${fr(POT[e.s], 2)} V` : ""}.</p>`; return; }
  if (PTsel.length !== 1) PTsel = [sym]; else PTsel = [PTsel[0], sym];
  drawPT();
  const A = PT[PTsel[0]];
  if (PTsel.length === 1) { $("#ch-pt-res").innerHTML = `<p><b>${A.n} (${A.s})</b> : électronégativité ${A.en ?? "–"}, ${OX[A.s] ? "degrés d'oxydation usuels " + OX[A.s].map(o => (o > 0 ? "+" : "") + o).join(", ") : "degrés d'oxydation non renseignés"}. Les couleurs montrent le type de composé formé avec chaque autre élément ; cliquez un second élément.</p>`; return; }
  const B = PT[PTsel[1]], c = compose(A, B);
  let out = `<p><b>${A.n} + ${B.n}</b> → `;
  if (c.t === "rien" || c.t === "alliage" || c.t === "meme" || c.t === "inconnu") out += c.f ? `<b>${c.f}</b> : ${c.txt}` : c.txt;
  else { out += `<b>${c.f}</b>, ${LABT[c.t]} (écart d'électronégativité ${fr(c.d, 2)}).</p><ul><li><b>Pourquoi cette formule</b> : ${c.a.n.toLowerCase()} est le plus électronégatif, il prend ${-c.neg} électron${-c.neg > 1 ? "s" : ""} (degré ${c.neg}) ; ${c.c.n.toLowerCase()} en cède ${c.pos} (degré +${c.pos}) ; la formule équilibre les charges.</li>`;
    out += c.t === "ionique" ? `<li><b>Propriétés attendues</b> : un solide cristallin (sel) dur et cassant, à température de fusion élevée, souvent soluble dans l'eau, conducteur une fois fondu ou dissous.</li>` : c.t === "polaire" ? `<li><b>Propriétés attendues</b> : une molécule ou un solide covalent à liaisons polaires ; les petites molécules sont souvent des gaz ou des liquides (H₂O, NH₃, HCl).</li>` : `<li><b>Propriétés attendues</b> : liaisons covalentes peu polaires : molécules (CH₄) ou réseaux solides très durs (SiC).</li>`;
    if (c.known) out += `<li><b>Composé réel</b> : ${c.known[0]} ; enthalpie de formation ΔfH° ≈ ${fr(c.known[1])} kJ/mol (${c.known[1] < 0 ? "formation exothermique : le composé est plus stable que les éléments séparés" : "formation endothermique : composé instable par rapport aux éléments"}).</li>`;
    else out += `<li>Composé non répertorié dans la table du site : la formule est une prévision de la règle simple.</li>`;
    out += "</ul>"; }
  $("#ch-pt-res").innerHTML = out;
}
async function tableauReactions() {
  if (!$("#ch-pt")) return;
  try { const D = await fetch("data/tableau.json").then(r => r.json()); PT = {}; D.elements.forEach(e => PT[e.s] = e); } catch (e) { return; }
  drawPT();
  document.querySelectorAll(".ch-mode").forEach(b => b.addEventListener("click", () => { PTmode = b.dataset.m; PTsel = []; document.querySelectorAll(".ch-mode").forEach(x => x.classList.toggle("on", x === b)); drawPT(); $("#ch-pt-res").innerHTML = `<p>${PTmode === "paire" ? "Cliquez un élément." : "Cliquez un élément pour le détail."}</p>`; }));
  clickPT("Na");
}

/* produit cinétique contre produit thermodynamique */
function kcontrol() {
  const el = $("#ch-kcontrol"); if (!el) return;
  const Tc = +$("#ch-kt2").value, T = Tc + 273.15, dur = +$("#ch-kdur").value; $("#ch-kt2-v").textContent = Tc + " °C";
  const A = 1e12, Ea1 = 55e3, Ea2 = 75e3, dG1 = -8e3, dG2 = -25e3;
  const k1 = A * Math.exp(-Ea1 / (R * T)), k2 = A * Math.exp(-Ea2 / (R * T)), km1 = A * Math.exp(-(Ea1 - dG1) / (R * T)), km2 = A * Math.exp(-(Ea2 - dG2) / (R * T));
  let r = 1, p1 = 0, p2 = 0; const N = 2000, pts = [];
  const lt0 = -3, lt1 = Math.log10(dur);
  let tPrev = 0;
  for (let i = 0; i <= N; i++) { const t = Math.pow(10, lt0 + (lt1 - lt0) * i / N); let dt = t - tPrev; tPrev = t; const sub = Math.max(1, Math.ceil(dt * (k1 + k2 + km1 + km2) * 5)); const h = dt / sub;
    for (let j = 0; j < sub; j++) { const d1 = (k1 * r - km1 * p1) * h, d2 = (k2 * r - km2 * p2) * h; r -= d1 + d2; p1 += d1; p2 += d2; }
    pts.push([t, r, p1, p2]); }
  const W = 900, H = 260, m = { l: 50, r: 14, t: 12, b: 30 }, x = d3.scaleLog([1e-3, dur], [m.l, W - m.r]), y = d3.scaleLinear([0, 1], [H - m.b, m.t]);
  let s = `<svg viewBox="0 0 ${W} ${H}" width="100%" style="font-size:10.5px">`;
  [0, .25, .5, .75, 1].forEach(v => s += `<line x1="${m.l}" x2="${W - m.r}" y1="${y(v)}" y2="${y(v)}" stroke="#eef2f7"/><text x="${m.l - 5}" y="${y(v) + 3}" text-anchor="end" style="fill:#64748b">${v * 100} %</text>`);
  [[1e-3, "1 ms"], [1, "1 s"], [60, "1 min"], [3600, "1 h"], [86400, "1 jour"]].filter(([v]) => v <= dur).forEach(([v, t]) => s += `<text x="${x(v)}" y="${H - 10}" text-anchor="middle" style="fill:#64748b">${t}</text>`);
  [[1, "#94a3b8", "réactif R"], [2, "#f59e0b", "P1 (rapide, peu stable)"], [3, "#2563eb", "P2 (lent, stable)"]].forEach(([k, c]) => s += `<polyline points="${pts.map(p => `${x(Math.max(1e-3, p[0]))},${y(p[k])}`).join(" ")}" fill="none" stroke="${c}" stroke-width="2.4"/>`);
  el.innerHTML = s + `</svg><div class="legend-row"><span><i style="border-top-color:#94a3b8;opacity:1"></i>Réactif R</span><span><i style="border-top-color:#f59e0b;opacity:1"></i>P1 : produit cinétique (barrière 55 kJ/mol, ΔG −8)</span><span><i style="border-top-color:#2563eb;opacity:1"></i>P2 : produit thermodynamique (barrière 75 kJ/mol, ΔG −25)</span></div>`;
  const f = pts[pts.length - 1];
  $("#ch-kcontrol-txt").innerHTML = `Au bout de ${{ 60: "1 minute", 3600: "1 heure", 86400: "1 jour" }[dur]} à ${Tc} °C : ${fr(100 * f[2], 0)} % de P1, ${fr(100 * f[3], 0)} % de P2, ${fr(100 * f[1], 0)} % de réactif restant. ${f[2] > f[3] ? "Le produit le plus rapide domine : <b>contrôle cinétique</b>." : "Le produit le plus stable domine : <b>contrôle thermodynamique</b>."} Échelle de temps logarithmique ; constantes de vitesse d'Arrhenius (facteur préexponentiel 10¹² s⁻¹).`;
}

function init() {
  if (!window.TH || !window.d3) { setTimeout(init, 100); return; }
  if (!$("#chimie")) return;
  const run = f => { try { f(); } catch (e) { console.error(f.name || "chimie", e); } };
  [ionique, liaisons, ebullition, bilanCH4, densite, gibbs, haber, cinetique, phEchelle, dosage, redox, batteries, distillation, production].forEach(run);
  run(() => phases("eau"));
  $("#ch-rx").innerHTML = RX.map((r, i) => `<option value="${i}">${r[0]}</option>`).join("");
  run(reaction); run(quadrants); run(evScale);
  $("#ch-mol").innerHTML = MOL.map((m, i) => `<option value="${i}">${m[0]}</option>`).join(""); $("#ch-metal").innerHTML = MET.map((m, i) => `<option value="${i}">${m[0]}</option>`).join("");
  [mole, vsepr, maille, avancement, pharma, pourbaix, alcanes].forEach(run);
  run(kcontrol); ["ch-kt2", "ch-kdur"].forEach(i => $("#" + i).addEventListener("input", kcontrol));
  tableauReactions().catch(e => console.error("tableauReactions", e));
  ["ch-m", "ch-mol"].forEach(i => $("#" + i).addEventListener("input", mole)); $("#ch-metal").addEventListener("input", maille);
  ["ch-n1", "ch-n2", "ch-x"].forEach(i => $("#" + i).addEventListener("input", avancement)); ["ch-t12", "ch-tau"].forEach(i => $("#" + i).addEventListener("input", pharma));
  ["ch-rx", "ch-rxT"].forEach(i => $("#" + i).addEventListener("input", reaction));
  document.querySelectorAll(".ch-ph").forEach(b => b.addEventListener("click", () => { document.querySelectorAll(".ch-ph").forEach(x => x.classList.toggle("on", x === b)); phases(b.dataset.p); }));
  ["ch-hT", "ch-hP"].forEach(i => $("#" + i).addEventListener("input", haber));
  ["ch-ea", "ch-kT", "ch-cat"].forEach(i => $("#" + i).addEventListener("input", cinetique));
  $("#ch-acide").addEventListener("change", dosage);
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
