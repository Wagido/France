/* Articles en préparation (non publiés) : fiscalité, christianisme */
(() => {
"use strict";
const $ = s => document.querySelector(s);
const f1 = v => v == null ? "–" : (Math.round(v * 10) / 10).toLocaleString("fr-FR");

/* ---------- Fiscalité : Eurostat gov_10a_taxag, % du PIB, 2025 ---------- */
const TAX = {
  annee: 2025,
  pays: [
    ["France", { tot: 46.0, tva: 7.0, prod: 8.8, ir: 9.6, is: 3.2, cot: 16.7, autres: 0.9 }],
    ["Belgique", { tot: 44.7 }], ["Danemark", { tot: 44.3, tva: 9.1, prod: 4.5, ir: 25.7, is: 3.8, cot: 0.7, autres: 1.0 }],
    ["Autriche", { tot: 43.9 }], ["Italie", { tot: 43.0, tva: 6.6, prod: 7.5, ir: 12.0, is: 2.7, cot: 13.5, autres: 0.6 }],
    ["Allemagne", { tot: 41.4, tva: 6.9, prod: 3.4, ir: 9.2, is: 2.8, cot: 18.2, autres: 0.7 }],
    ["Suède", { tot: 41.2, tva: 8.7, prod: 12.1, ir: 13.4, is: 3.4, cot: 3.3, autres: 0.3 }],
    ["Union européenne", { tot: 40.7, tva: 7.2, prod: 5.7, ir: 9.6, is: 3.2, cot: 14.3, autres: 0.7 }],
    ["Pays-Bas", { tot: 39.6 }], ["Espagne", { tot: 38.1 }], ["Irlande", { tot: 22.7 }]
  ],
  hist: [[1995, 44.1], [2000, 45.2], [2005, 44.7], [2010, 44.2], [2015, 47.7], [2020, 47.4], [2023, 45.5], [2024, 45.1], [2025, 46.0]]
};
function fiscalite() {
  if (!$("#fi-tot")) return;
  const { bars } = window.TH;
  bars($("#fi-tot"), TAX.pays.map(([n, v]) => ({ l: n, v: v.tot, t: f1(v.tot) + " %", c: n === "France" ? "#dc2626" : n === "Union européenne" ? "#334155" : "#94a3b8" })), { max: 50 });
  const P = ["tva", "prod", "ir", "is", "cot", "autres"], L = { tva: "TVA", prod: "Autres impôts sur la production et la consommation", ir: "Impôt sur le revenu des ménages (dont CSG)", is: "Impôt sur les sociétés", cot: "Cotisations sociales", autres: "Autres (impôts sur le capital, divers)" };
  const C = { tva: "#f59e0b", prod: "#fbbf24", ir: "#3b82f6", is: "#1e3a8a", cot: "#16a34a", autres: "#cbd5e1" };
  const rows = TAX.pays.filter(([, v]) => v.cot != null);
  $("#fi-struct").innerHTML = `<div class="fs-stack">${rows.map(([n, v]) => {
    let left = 0; const segs = P.map(k => { const w = 100 * v[k] / 50, s = `<span title="${L[k]} : ${f1(v[k])} % du PIB" style="left:${left}%;width:${w}%;background:${C[k]}">${v[k] >= 3 ? f1(v[k]) : ""}</span>`; left += w; return s; }).join("");
    return `<div class="fs-row"><span class="fs-lab">${n === "France" ? "<b>France</b>" : n}</span><span class="fs-track">${segs}</span><span class="fs-tot">${f1(v.tot)} %</span></div>`; }).join("")}</div>
    <div class="legend-row">${P.map(k => `<span><i style="border-top-color:${C[k]};opacity:1;border-top-width:10px;width:14px"></i>${L[k]}</span>`).join("")}</div>`;
  window.TH.lineChart($("#fi-hist"), TAX.hist.map(([a, v]) => ({ annee: a, fr: v })), [{ k: "fr", l: "France", c: "#dc2626" }], { yfmt: v => v + " %", vfmt: v => f1(v) + " % du PIB", h: 200, nozero: true });
}

/* ---------- Christianisme : arbre des grandes branches (Sankey) ---------- */
function sankey() {
  const el = $("#cr-sankey"); if (!el || !window.d3?.sankey) return;
  // largeurs finales : parts des chrétiens en 2010 (Pew Research, 2011) ; branches disparues : largeur symbolique
  const N = [
    ["prim", "Jésus, premiers chrétiens (Iᵉʳ s.)", 0],
    ["judeo", "Judéo-chrétiens (disparus)", 1], ["gnose", "Gnostiques, marcionites (disparus)", 1], ["grande", "« Grande Église » (Nicée, 325)", 1],
    ["arien", "Ariens (disparus)", 2], ["orient", "Église de l'Orient (431)", 2], ["orientaux", "Orthodoxes orientaux (451)", 2], ["chalc", "Chalcédoine (451)", 2],
    ["byz", "Orient byzantin (1054)", 3], ["rome", "Occident latin (1054)", 3],
    ["ortho", "Orthodoxes : 12 %", 4], ["cath", "Catholiques : 50 %", 4], ["prot", "Protestants (Réforme, 1517) : 37 %", 4], ["autres", "Autres : 1 %", 4]
  ];
  const L = [["prim", "judeo", 0.6], ["prim", "gnose", 0.6], ["prim", "grande", 99.4], ["grande", "arien", 0.6], ["grande", "orient", 0.4], ["grande", "orientaux", 2], ["grande", "chalc", 96.4],
    ["chalc", "byz", 10], ["chalc", "rome", 86.4], ["byz", "ortho", 10], ["orientaux", "ortho", 2], ["orient", "ortho", 0.4], ["rome", "cath", 50], ["rome", "prot", 35.4], ["rome", "autres", 1]];
  const W = Math.max(900, el.clientWidth || 1000), H = 560;
  const sk = d3.sankey().nodeId(d => d.id).nodeAlign(n => n.c).nodeSort(null).nodeWidth(12).nodePadding(26).extent([[2, 30], [W - 190, H - 8]]);
  const g = sk({ nodes: N.map(([id, l, c]) => ({ id, l, c })), links: L.map(([s, t, v]) => ({ source: s, target: t, value: v })) });
  const col = n => ({ cath: "#2563eb", prot: "#16a34a", ortho: "#9333ea", autres: "#94a3b8", judeo: "#a3a3a3", gnose: "#a3a3a3", arien: "#a3a3a3", orient: "#c084fc", orientaux: "#c084fc", byz: "#9333ea", rome: "#3b82f6" })[n.id] || "#64748b";
  const svg = d3.select(el).html("").append("svg").attr("viewBox", `0 0 ${W} ${H}`).attr("width", "100%");
  svg.append("g").attr("fill", "none").selectAll("path").data(g.links).join("path").attr("d", d3.sankeyLinkHorizontal())
    .attr("stroke", d => col(d.target)).attr("stroke-opacity", .35).attr("stroke-width", d => Math.max(1.5, d.width)).append("title").text(d => `${d.source.l} → ${d.target.l}`);
  svg.append("g").selectAll("rect").data(g.nodes).join("rect").attr("x", d => d.x0).attr("y", d => d.y0).attr("width", d => d.x1 - d.x0).attr("height", d => Math.max(2, d.y1 - d.y0)).attr("fill", col);
  svg.append("g").attr("font-size", 11.5).attr("fill", "currentColor").selectAll("text").data(g.nodes).join("text")
    .attr("x", d => d.c === 4 ? d.x1 + 6 : d.x0).attr("y", d => d.c === 4 ? (d.y0 + d.y1) / 2 : d.y0 - 5).attr("dy", d => d.c === 4 ? "0.35em" : 0)
    .attr("font-weight", d => d.c === 4 ? 600 : 400).text(d => d.l);
}
function init() {
  if (!window.TH || !window.d3) { setTimeout(init, 100); return; }
  try { fiscalite(); } catch (e) { console.error("fiscalite", e); }
  try { sankey(); } catch (e) { console.error("christianisme", e); }
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
