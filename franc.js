/* Histoire de la franc-maçonnerie : frise et obédiences */
(() => {
"use strict";
const $ = s => document.querySelector(s);
const fr = (v, d = 0) => v.toLocaleString("fr-FR", { minimumFractionDigits: d, maximumFractionDigits: d });
const EV = [[1390, "Poème Regius (Anciens Devoirs)", "#78716c"], [1598, "Statuts de Schaw (Écosse)", "#78716c"], [1646, "Ashmole reçu maçon", "#a16207"], [1649, "Exécution de Charles Iᵉʳ", "#dc2626"], [1717, "Grande Loge de Londres", "#2563eb"], [1723, "Constitutions d'Anderson", "#2563eb"], [1737, "Discours de Ramsay", "#7c3aed"], [1738, "Bulle In eminenti", "#dc2626"], [1773, "Grand Orient de France", "#2563eb"], [1797, "Barruel : le mythe du complot", "#dc2626"], [1877, "GODF : fin de l'obligation de croire", "#2563eb"], [1893, "Droit humain (mixte)", "#db2777"], [1904, "Affaire des Fiches", "#dc2626"], [1940, "Vichy dissout les loges", "#111827"], [1952, "Grande Loge féminine", "#db2777"], [2010, "GODF admet les femmes", "#db2777"]];
function frise() {
  const el = $("#fm-frise"); if (!el) return;
  const W = 900, H = 230, x = d3.scaleLinear([1370, 2030], [20, W - 20]), y0 = 120;
  let s = `<svg viewBox="0 0 ${W} ${H}" width="100%" style="font-size:10.5px">`;
  [[1370, 1600, "bâtisseurs"], [1600, 1717, "maçons « acceptés »"], [1717, 1789, "Lumières"], [1789, 1940, "politisation, République"], [1940, 2030, "Vichy, aujourd'hui"]].forEach(([a, b, l], k) => s += `<rect x="${x(a)}" y="${y0 - 6}" width="${x(b) - x(a)}" height="12" fill="${["#e7e5e4", "#fde68a", "#bfdbfe", "#c7d2fe", "#e2e8f0"][k]}"/><text x="${(x(a) + x(b)) / 2}" y="${y0 + 4}" text-anchor="middle" font-size="9.5" style="fill:#334155">${l}</text>`);
  [1400, 1500, 1600, 1700, 1800, 1900, 2000].forEach(v => s += `<text x="${x(v)}" y="${H - 4}" text-anchor="middle" style="fill:#64748b">${v}</text>`);
  EV.forEach(([a, l, c], k) => { const up = k % 2 === 0, lv = Math.floor(k / 2) % 3, yy = up ? y0 - 20 - lv * 30 : y0 + 26 + lv * 30; s += `<line x1="${x(a)}" x2="${x(a)}" y1="${up ? yy + 4 : y0 + 6}" y2="${up ? y0 - 6 : yy - 10}" stroke="${c}" stroke-width="1"/><circle cx="${x(a)}" cy="${y0}" r="3.5" fill="${c}"/><text x="${x(a)}" y="${yy}" text-anchor="${x(a) < 90 ? "start" : x(a) > W - 90 ? "end" : "middle"}" style="fill:${c}"><tspan font-weight="700">${a}</tspan> ${l}</text>`; });
  el.innerHTML = s + "</svg>";
}
function obed() {
  const el = $("#fm-obed"); if (!el || !window.TH) return;
  window.TH.bars(el, [["Grand Orient de France (libéral, mixte depuis 2010)", 54000, "#2563eb"], ["Grande Loge de France (rite écossais, hommes)", 33000, "#7c3aed"], ["Grande Loge nationale française (régulière, hommes)", 25000, "#0891b2"], ["Droit humain (mixte)", 17000, "#db2777"], ["Grande Loge féminine de France", 14000, "#f472b6"], ["Autres obédiences", 30000, "#94a3b8"]].map(([l, v, c]) => ({ l, v, t: "≈ " + fr(v), c })));
}
function init() {
  if (!window.TH || !window.d3) { setTimeout(init, 100); return; }
  if (!$("#franc-maconnerie")) return;
  window.TH.kpis("#fm-kpis", [["1717", ["première Grande Loge", "à Londres"], "Naissance"], ["1723", ["Constitutions d'Anderson :", "la tolérance religieuse"], "Esprit"], ["1877", ["le Grand Orient admet les athées :", "rupture avec Londres"], "Divorce"], ["≈ 175 000", ["francs-maçons en France", "aujourd'hui"], "Effectifs"]]);
  [frise, obed].forEach(f => { try { f(); } catch (e) { console.error(f.name, e); } });
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
