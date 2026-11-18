/* Histoire de la franc-maçonnerie : frise et obédiences */
(() => {
"use strict";
const $ = s => document.querySelector(s);
const fr = (v, d = 0) => v.toLocaleString("fr-FR", { minimumFractionDigits: d, maximumFractionDigits: d });
const EV = [[1390, "Poème Regius (Anciens Devoirs)", "#78716c"], [1598, "Statuts de Schaw (Écosse)", "#78716c"], [1646, "Ashmole reçu maçon", "#a16207"], [1649, "Exécution de Charles Iᵉʳ", "#dc2626"], [1717, "Grande Loge de Londres", "#2563eb"], [1723, "Constitutions d'Anderson", "#2563eb"], [1737, "Discours de Ramsay", "#7c3aed"], [1738, "Bulle In eminenti", "#dc2626"], [1773, "Grand Orient de France", "#2563eb"], [1797, "Barruel : le mythe du complot", "#dc2626"], [1877, "GODF : fin de l'obligation de croire", "#2563eb"], [1893, "Droit humain (mixte)", "#db2777"], [1904, "Affaire des Fiches", "#dc2626"], [1940, "Vichy dissout les loges", "currentColor"], [1952, "Grande Loge féminine", "#db2777"], [2010, "GODF admet les femmes", "#db2777"]];
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

function sources() {
  const el = $("#fm-sources"); if (!el) return;
  const G = "#16a34a", V = "#7c3aed", Rr = "#dc2626";
  const S = [["Loges de bâtisseurs, Anciens Devoirs (XIVᵉ-XVIᵉ s.)", G], ["Sociabilité des Lumières, Royal Society (XVIIᵉ s.)", G], ["Temple de Salomon, Hiram (Bible)", V], ["Géométrie : Euclide, Pythagore", V], ["Mystères antiques : Isis, Éleusis, Mithra", V], ["Hermétisme, alchimie (Renaissance)", V], ["Kabbale chrétienne (1486)", V], ["Manifestes Rose-Croix (1614-1616)", V], ["Égypte rêvée : Séthos (1731), Cagliostro", V], ["Chevalerie et Templiers (Ramsay, 1737)", Rr], ["Prêtres de l'Égypte antique", Rr]];
  const Rt = [["Rite français (Grand Orient)", "#2563eb"], ["Émulation (Angleterre)", "#0891b2"], ["Rite écossais ancien et accepté (33 degrés)", "#7c3aed"], ["Rite écossais rectifié (Willermoz, 1782)", "#16a34a"], ["Memphis-Misraïm (1881, 95 degrés)", "#ca8a04"], ["Martinisme, Golden Dawn (occultisme, fin XIXᵉ s.)", "#db2777"]];
  const W = 900, H = 460, cx = 450, cy = 230, y1 = k => 36 + k * (H - 54) / (S.length - 1), y2 = k => 40 + k * (H - 80) / (Rt.length - 1);
  let s = `<svg viewBox="0 0 ${W} ${H}" width="100%" style="font-size:10.5px">`;
  S.forEach(([l, c], k) => { const y = y1(k); s += `<path d="M300,${y} C380,${y} 380,${cy} ${cx - 62},${cy}" fill="none" stroke="${c}" stroke-width="${c === G ? 3.5 : 1.8}" ${c === Rr ? 'stroke-dasharray="5 4"' : ""} opacity=".75"/><text x="294" y="${y + 4}" text-anchor="end" style="fill:${c}" font-weight="${c === G ? 700 : 500}">${l}</text>`; });
  Rt.forEach(([l, c], k) => { const y = y2(k); s += `<path d="M${cx + 62},${cy} C520,${cy} 520,${y} 600,${y}" fill="none" stroke="${c}" stroke-width="2.4" opacity=".8"/><text x="606" y="${y + 4}" style="fill:${c}" font-weight="700">${l}</text>`; });
  s += `<rect x="${cx - 62}" y="${cy - 34}" width="124" height="68" rx="10" fill="#1e3a8a"/><text x="${cx}" y="${cy - 8}" text-anchor="middle" style="fill:#fff" font-weight="800" font-size="13">Franc-maçonnerie</text><text x="${cx}" y="${cy + 10}" text-anchor="middle" style="fill:#c7d2fe">spéculative</text><text x="${cx}" y="${cy + 25}" text-anchor="middle" style="fill:#c7d2fe">1717-1723</text>`;
  s += `<text x="294" y="12" text-anchor="end" style="fill:#64748b" font-weight="700">sources et traditions revendiquées</text><text x="606" y="22" style="fill:#64748b" font-weight="700">rites qui en découlent</text>`;
  el.innerHTML = s + "</svg>";
}
function init() {
  if (!window.TH || !window.d3) { setTimeout(init, 100); return; }
  if (!$("#franc-maconnerie")) return;
  window.TH.kpis("#fm-kpis", [["1717", ["première Grande Loge", "à Londres"], "Naissance"], ["1723", ["Constitutions d'Anderson :", "la tolérance religieuse"], "Esprit"], ["1877", ["le Grand Orient admet les athées :", "rupture avec Londres"], "Divorce"], ["≈ 175 000", ["francs-maçons en France", "aujourd'hui"], "Effectifs"]]);
  [frise, obed, sources].forEach(f => { try { f(); } catch (e) { console.error(f.name, e); } });
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
