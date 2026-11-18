/* Onglet Eau : parcours, services, qualité, fuites, prix (SISPEA, données 2024) */
(() => {
"use strict";
const $ = s => document.querySelector(s);
const fr = (v, d = 0) => v.toLocaleString("fr-FR", { minimumFractionDigits: d, maximumFractionDigits: d });

function parcours() {
  const el = $("#eau-parcours"); if (!el) return;
  const W = 900, H = 300;
  const st = [[60, "Nappe ou rivière", "65 % de nappes", "#0ea5e9"], [190, "Captage", "protégé à 79 %", "#0284c7"], [320, "Usine de traitement", "désinfection, filtration", "#7c3aed"], [450, "Réservoir, château d'eau", "pression et stock", "#2563eb"], [580, "Réseau : 980 000 km", "rendement 81,5 %", "#1d4ed8"], [710, "Robinet", "148 L/hab./jour", "#16a34a"], [840, "Égout, station d'épuration", "puis retour à la rivière", "#78716c"]];
  let s = `<svg viewBox="0 0 ${W} ${H}" width="100%" style="font-size:11px"><defs><marker id="ep" viewBox="0 0 10 10" refX="8" refY="5" markerUnits="userSpaceOnUse" markerWidth="12" markerHeight="12" orient="auto"><path d="M0,0 L10,5 L0,10z" fill="#0ea5e9"/></marker></defs>`;
  s += `<rect x="0" y="200" width="${W}" height="100" fill="#fef3c7" opacity=".5"/><text x="8" y="292" style="fill:#92400e">sous-sol</text>`;
  st.forEach(([x, t, d, c], i) => {
    s += `<circle cx="${x}" cy="120" r="34" fill="${c}" opacity=".15" stroke="${c}" stroke-width="2"/><text x="${x}" y="118" text-anchor="middle" style="fill:${c}" font-weight="800" font-size="20">${i + 1}</text>`;
    s += `<text x="${x}" y="176" text-anchor="middle" font-weight="700">${t}</text><text x="${x}" y="192" text-anchor="middle" style="fill:#64748b">${d}</text>`;
    if (i < st.length - 1) s += `<line x1="${x + 38}" y1="120" x2="${st[i + 1][0] - 40}" y2="120" stroke="#0ea5e9" stroke-width="4" marker-end="url(#ep)"/>`;
  });
  s += `<path d="M580,154 q0,70 -10,90" stroke="#dc2626" stroke-width="2.5" stroke-dasharray="5 4" fill="none"/><text x="590" y="250" style="fill:#dc2626" font-weight="700">fuites : 18,5 %</text><text x="590" y="265" style="fill:#dc2626">retour au sol et aux nappes</text>`;
  s += `<path d="M60,154 q0,60 0,90" stroke="#0ea5e9" stroke-width="2" fill="none"/><ellipse cx="60" cy="262" rx="44" ry="14" fill="#7dd3fc" opacity=".7"/><text x="60" y="266" text-anchor="middle" style="fill:#075985" font-weight="700">nappe</text>`;
  s += `<path d="M840,86 C 840,30 60,30 60,86" stroke="#94a3b8" stroke-width="1.5" stroke-dasharray="3 5" fill="none"/><text x="450" y="40" text-anchor="middle" style="fill:#64748b">le cycle se referme : l'eau épurée rejoint les rivières, qui alimentent les nappes</text>`;
  el.innerHTML = s + "</svg>";
}
function services() {
  const el = $("#eau-services"); if (!el) return;
  window.TH.bars(el, [{ l: "Services d'assainissement collectif", v: 11085, t: "11 085", c: "#78716c" }, { l: "Services d'eau potable", v: 9623, t: "9 623", c: "#2563eb" }, { l: "Services d'assainissement non collectif", v: 2362, t: "2 362", c: "#a8a29e" }, { l: "Collectivités organisatrices (communes, syndicats, intercommunalités)", v: 12685, t: "12 685", c: "#0ea5e9" }]);
}
function qualite() {
  if (!$("#eau-qualite")) return;
  window.TH.kpis("#eau-qualite", [["98,3 %", ["des analyses conformes", "bactéries"], "Qualité microbiologique"], ["98,1 %", ["des analyses conformes", "nitrates, pesticides, métaux"], "Qualité physico-chimique"], ["79 %", ["avancement moyen", "des périmètres de protection"], "Protection des captages"], ["2,5", ["coupures non programmées", "pour 1 000 abonnés par an"], "Coupures"]]);
}
function fuites() {
  const el = $("#eau-fuites"); if (!el) return;
  const W = 900, H = 210;
  let s = `<svg viewBox="0 0 ${W} ${H}" width="100%" style="font-size:11.5px">`;
  const drop = (x, y, c, lost) => `<path d="M${x},${y - 34} C${x + 22},${y - 6} ${x + 22},${y + 18} ${x},${y + 18} C${x - 22},${y + 18} ${x - 22},${y - 6} ${x},${y - 34} Z" fill="${c}" ${lost ? 'stroke="#dc2626" stroke-dasharray="4 3" stroke-width="2" fill-opacity=".25"' : ""}/>`;
  for (let i = 0; i < 5; i++) s += drop(70 + i * 62, 80, i === 4 ? "#fca5a5" : "#3b82f6", i === 4);
  s += `<text x="194" y="130" text-anchor="middle" font-weight="700">sur 5 litres mis dans le réseau…</text><text x="132" y="150" text-anchor="middle" style="fill:#1d4ed8">4 arrivent au robinet (81,5 %)</text><text x="318" y="150" text-anchor="middle" style="fill:#dc2626">1 se perd (18,5 %)</text>`;
  // renouvellement
  const x0 = 470, w = 320, km = 980000, ren = 5980;
  s += `<text x="${x0}" y="40" font-weight="700">Réseau renouvelé chaque année</text><rect x="${x0}" y="52" width="${w}" height="26" fill="#dbeafe" stroke="#93c5fd"/><rect x="${x0}" y="52" width="${Math.max(3, w * ren / km)}" height="26" fill="#2563eb"/><text x="${x0}" y="96" style="fill:#1d4ed8">≈ 6 000 km sur 980 000 km : 0,61 % par an</text><text x="${x0}" y="114" style="fill:#64748b">à ce rythme, un remplacement complet prendrait environ 165 ans</text>`;
  s += `<text x="${x0}" y="150" font-weight="700">Connaissance des réseaux (sur 120 points)</text><rect x="${x0}" y="160" width="${w}" height="12" fill="#f1f5f9"/><rect x="${x0}" y="160" width="${w * 105 / 120}" height="12" fill="#2563eb"/><text x="${x0 + w + 6}" y="170" style="fill:#2563eb">105 eau potable</text><rect x="${x0}" y="180" width="${w}" height="12" fill="#f1f5f9"/><rect x="${x0}" y="180" width="${w * 73 / 120}" height="12" fill="#78716c"/><text x="${x0 + w * 73 / 120 + 6}" y="190" style="fill:#78716c">73 égouts</text>`;
  el.innerHTML = s + "</svg>";
}
function prix() {
  const el = $("#eau-prix"); if (!el) return;
  const P = [["2011", 1.93, 1.73], ["2022", 2.13, 2.21], ["2024", null, null, 4.69], ["2025", 2.50, 2.39]];
  const W = 440, H = 240, m = { l: 40, r: 10, t: 14, b: 28 }, x = d3.scaleBand(P.map(p => p[0]), [m.l, W - m.r]).padding(.35), y = d3.scaleLinear([0, 5.5], [H - m.b, m.t]);
  let s = `<svg viewBox="0 0 ${W} ${H}" width="100%" style="font-size:10.5px">`;
  [0, 1, 2, 3, 4, 5].forEach(v => s += `<line x1="${m.l}" x2="${W - m.r}" y1="${y(v)}" y2="${y(v)}" stroke="#eef2f7"/><text x="${m.l - 5}" y="${y(v) + 3}" text-anchor="end" style="fill:#64748b">${v} €</text>`);
  P.forEach(([a, e, as, tot]) => { const X = x(a), bw = x.bandwidth(); if (e != null) { s += `<rect x="${X}" y="${y(e)}" width="${bw}" height="${y(0) - y(e)}" fill="#2563eb"/><rect x="${X}" y="${y(e + as)}" width="${bw}" height="${y(0) - y(as)}" fill="#78716c"/>`; tot = e + as; } else s += `<rect x="${X}" y="${y(tot)}" width="${bw}" height="${y(0) - y(tot)}" fill="#94a3b8"/>`; s += `<text x="${X + bw / 2}" y="${y(tot) - 4}" text-anchor="middle" font-weight="700">${fr(tot, 2)} €</text><text x="${X + bw / 2}" y="${H - 10}" text-anchor="middle" style="fill:#64748b">1ᵉʳ janv. ${a}</text>`; });
  el.innerHTML = s + `</svg><div class="legend-row"><span><i style="border-top-color:#2563eb;opacity:1;width:14px;border-top-width:10px"></i>Eau potable</span><span><i style="border-top-color:#78716c;opacity:1;width:14px;border-top-width:10px"></i>Assainissement</span><span><i style="border-top-color:#94a3b8;opacity:1;width:14px;border-top-width:10px"></i>Total (détail non publié)</span></div>`;
  window.TH.bars($("#eau-facture"), [{ l: "Service de l'eau potable (hors taxes)", v: 224, t: "224 € (1,87 €/m³)", c: "#2563eb" }, { l: "Service de l'assainissement (hors taxes)", v: 248, t: "248 € (2,07 €/m³)", c: "#78716c" }, { l: "Taxes (dont TVA) et redevances des agences de l'eau", v: 114, t: "114 € (0,95 €/m³)", c: "#f59e0b" }]);
}
function init() {
  if (!window.TH || !window.d3) { setTimeout(init, 100); return; }
  if (!$("#eau-parcours")) return;
  [parcours, services, qualite, fuites, prix].forEach(f => { try { f(); } catch (e) { console.error(f.name, e); } });
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
