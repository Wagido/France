/* Inégalités et redistribution : Sankey « ce que chaque décile paie et reçoit » (comptes nationaux distribués INSEE) */
(() => {
"use strict";
const $ = s => document.querySelector(s);
const n0 = v => Math.round(v).toLocaleString("fr-FR");
let R = null, SEL = null;

function deciles() {
  const uc = R.uc_millions, agg = arr => { const out = []; for (let k = 0; k < 10; k++) { const a = 2 * k, b = a + 1, u = uc[a] + uc[b]; out.push({ parUC: (arr[a] * uc[a] + arr[b] * uc[b]) / u, md: (arr[a] * uc[a] + arr[b] * uc[b]) / 1000, uc: u }); } return out; };
  return {
    paye: R.paye.map(([k, l, v]) => ({ k, l, d: agg(v) })),
    recu: [...R.argent.map(([k, l, v]) => ({ k, l, t: "argent", d: agg(v) })), ...R.services.map(([k, l, v]) => ({ k, l, t: "services", d: agg(v) }))],
    avant: agg(R.avant), apres: agg(R.apres)
  };
}
const COLD = d3.scaleSequential(d3.interpolateRgbBasis(["#dc2626", "#ea580c", "#ca8a04", "#16a34a", "#0891b2", "#1d4ed8", "#6d28d9"])).domain([0, 9]);
const PCOL = { tva: "#ef4444", production: "#f97316", is: "#b45309", csg: "#e11d48", ir: "#be123c", patrimoine: "#9f1239", cot_retraite: "#dc2626", cot_autres: "#f87171", emprunt: "#94a3b8" };
const RCOL = { retraites: "#2563eb", chomage: "#3b82f6", ij: "#60a5fa", famille: "#1d4ed8", minima: "#0ea5e9", complementaires: "#93c5fd", sante: "#16a34a", ecole: "#22c55e", action_sociale: "#4ade80", logement: "#15803d", culture: "#86efac", collectif: "#65a30d" };
const LBL = { tva: "TVA et taxes sur les produits", production: "Taxes sur la production", is: "Impôt sur les sociétés", csg: "CSG", ir: "Impôt sur le revenu", patrimoine: "Taxes sur le patrimoine, CRDS", cot_retraite: "Cotisations retraite", cot_autres: "Cotisations maladie, chômage, famille", retraites: "Retraites", chomage: "Chômage", ij: "Indemnités maladie, invalidité", famille: "Prestations familiales", minima: "Minima sociaux", complementaires: "Complémentaires collectives", sante: "Santé", ecole: "École et université", action_sociale: "Action sociale", logement: "Logement, énergie", culture: "Culture et loisirs", collectif: "Services collectifs" };

function draw() {
  const el = $("#ds-sankey"); if (!el || !R || !d3.sankey) return;
  const D = deciles();
  const nodes = [], links = [];
  const add = (id, name, col, color) => nodes.push({ id, name, col, color });
  for (let k = 0; k < 10; k++) add("P" + k, `D${k + 1}`, 0, COLD(k));
  D.paye.forEach(p => add("t_" + p.k, LBL[p.k] || p.l, 1, PCOL[p.k]));
  const totP = d3.sum(D.paye, p => d3.sum(p.d, x => x.md)), totR = d3.sum(D.recu, r => d3.sum(r.d, x => x.md));
  const emprunt = Math.max(0, totR - totP);
  if (emprunt > 0) add("t_emprunt", "Emprunt (déficit public)", 1, PCOL.emprunt);
  add("pot", "Argent public", 2, "#334155");
  D.recu.forEach(r => add("r_" + r.k, LBL[r.k] || r.l, 3, RCOL[r.k]));
  for (let k = 0; k < 10; k++) add("B" + k, `D${k + 1}`, 4, COLD(k));
  D.paye.forEach(p => { p.d.forEach((x, k) => x.md > 0.05 && links.push({ source: "P" + k, target: "t_" + p.k, value: x.md, dec: k })); links.push({ source: "t_" + p.k, target: "pot", value: d3.sum(p.d, x => x.md) }); });
  if (emprunt > 0) links.push({ source: "t_emprunt", target: "pot", value: emprunt });
  D.recu.forEach(r => { links.push({ source: "pot", target: "r_" + r.k, value: d3.sum(r.d, x => Math.max(0, x.md)) }); r.d.forEach((x, k) => x.md > 0.05 && links.push({ source: "r_" + r.k, target: "B" + k, value: x.md, dec: k })); });
  const W = Math.max(860, el.clientWidth || 900), H = 760, m = { l: 70, r: 70, t: 24, b: 10 };
  const sk = d3.sankey().nodeId(d => d.id).nodeAlign(n => n.col).nodeSort(null).nodeWidth(14).nodePadding(6).extent([[m.l, m.t], [W - m.r, H - m.b]]);
  const g = sk({ nodes: nodes.map(d => ({ ...d })), links: links.map(d => ({ ...d })) });
  const svg = d3.create("svg").attr("viewBox", `0 0 ${W} ${H}`).attr("width", "100%").style("font-size", "10.5px");
  ["Qui paie", "Comment", "", "Pour quoi", "Qui reçoit"].forEach((t, c) => { const xs = g.nodes.filter(n => n.col === c); if (!xs.length || !t) return; svg.append("text").attr("x", c === 0 ? xs[0].x0 : c === 4 ? xs[0].x1 : (xs[0].x0 + xs[0].x1) / 2).attr("y", 12).attr("text-anchor", c === 0 ? "start" : c === 4 ? "end" : "middle").attr("font-weight", 700).attr("fill", "#64748b").text(t); });
  const lk = svg.append("g").attr("fill", "none").selectAll("path").data(g.links).join("path")
    .attr("d", d3.sankeyLinkHorizontal()).attr("stroke", d => d.dec != null ? COLD(d.dec) : d.source.color).attr("stroke-width", d => Math.max(0.6, d.width))
    .attr("stroke-opacity", d => SEL == null ? .38 : d.dec === SEL ? .85 : d.dec == null ? .12 : .04);
  lk.append("title").text(d => `${d.source.name} → ${d.target.name} : ${n0(d.value)} Md€`);
  const nd = svg.append("g").selectAll("g").data(g.nodes).join("g");
  nd.append("rect").attr("x", d => d.x0).attr("y", d => d.y0).attr("width", d => d.x1 - d.x0).attr("height", d => Math.max(1, d.y1 - d.y0)).attr("fill", d => d.color)
    .attr("opacity", d => SEL == null || !/^[PB]/.test(d.id) || +d.id.slice(1) === SEL ? 1 : .3).style("cursor", d => /^[PB]\d/.test(d.id) ? "pointer" : "default")
    .on("click", (ev, d) => { if (/^[PB]\d/.test(d.id)) select(+d.id.slice(1)); })
    .append("title").text(d => `${d.name} : ${n0(d.value)} Md€`);
  nd.append("text").attr("x", d => d.col === 0 ? d.x0 - 5 : d.col === 4 ? d.x1 + 5 : d.col === 1 ? d.x1 + 4 : d.col === 3 ? d.x0 - 4 : (d.x0 + d.x1) / 2)
    .attr("y", d => d.col === 2 ? d.y0 - 6 : (d.y0 + d.y1) / 2 + 3.5).attr("text-anchor", d => d.col === 0 || d.col === 3 ? "end" : d.col === 2 ? "middle" : "start")
    .attr("font-weight", d => d.col === 0 || d.col === 4 || d.col === 2 ? 700 : 500).style("fill", d => d.col === 0 || d.col === 4 ? COLD(+d.id.slice(1)) : "currentColor")
    .text(d => d.col === 0 || d.col === 4 ? `${d.name} ${n0(d.value)}` : d.col === 2 ? `Argent public : ${n0(d.value)} Md€` : d.y1 - d.y0 > 9 ? `${d.name} (${n0(d.value)})` : "");
  el.replaceChildren(svg.node());
  texte(D, totP, totR, emprunt);
}
function texte(D, totP, totR, emprunt) {
  const k = SEL;
  const row = i => { const pay = d3.sum(D.paye, p => p.d[i].parUC), arg = d3.sum(D.recu.filter(r => r.t === "argent"), r => r.d[i].parUC), ser = d3.sum(D.recu.filter(r => r.t === "services"), r => r.d[i].parUC); return { pay, arg, ser, net: arg + ser - pay, payMd: d3.sum(D.paye, p => p.d[i].md), recMd: d3.sum(D.recu, r => r.d[i].md) }; };
  let h = `<thead><tr><th>Décile</th><th>Revenu avant redistribution</th><th>Paie</th><th>Reçoit en argent</th><th>Reçoit en services</th><th>Solde</th><th>Niveau de vie après</th><th>Total payé / reçu</th></tr></thead><tbody>`;
  for (let i = 0; i < 10; i++) { const r = row(i); h += `<tr${i === k ? ' style="font-weight:700;background:var(--soft)"' : ""}><td style="color:${COLD(i)};font-weight:700">D${i + 1}</td><td style="text-align:right">${n0(D.avant[i].parUC)} €</td><td style="text-align:right;color:#dc2626">−${n0(r.pay)} €</td><td style="text-align:right;color:#2563eb">+${n0(r.arg)} €</td><td style="text-align:right;color:#16a34a">+${n0(r.ser)} €</td><td style="text-align:right;font-weight:700;color:${r.net >= 0 ? "#15803d" : "#dc2626"}">${r.net >= 0 ? "+" : "−"}${n0(Math.abs(r.net))} €</td><td style="text-align:right">${n0(D.apres[i].parUC)} €</td><td style="text-align:right">${n0(r.payMd)} / ${n0(r.recMd)} Md€</td></tr>`; }
  $("#ds-table").innerHTML = h + `</tbody><caption style="caption-side:top;text-align:left;font-size:.85rem;color:var(--muted);padding:4px 0">Par unité de consommation et par an, sauf la dernière colonne (total du décile, en milliards d'euros)</caption>`;
  const nb = [...Array(10).keys()].filter(i => row(i).net > 0).length;
  let t = `<b>Au total</b>, les ménages paient environ ${n0(totP)} Md€ par an de prélèvements et reçoivent ${n0(totR)} Md€ en prestations et en services ; l'écart (${n0(emprunt)} Md€) est financé par l'emprunt. <b>${nb} déciles sur 10</b> reçoivent plus qu'ils ne paient, services publics compris.`;
  if (k != null) { const r = row(k); t += ` <b>D${k + 1}</b>${k === 0 ? " (les 10 % les plus modestes)" : k === 9 ? " (les 10 % les plus aisés)" : ""} : par unité de consommation, revenu avant redistribution ${n0(D.avant[k].parUC)} €, paie ${n0(r.pay)} €, reçoit ${n0(r.arg)} € en argent et ${n0(r.ser)} € en services, soit un solde de <b>${r.net >= 0 ? "+" : "−"}${n0(Math.abs(r.net))} €</b> par an ; niveau de vie élargi après redistribution : ${n0(D.apres[k].parUC)} €.`; }
  t += ` Les services publics (santé, école, sécurité, routes…) sont répartis selon l'usage estimé par l'INSEE ; les services collectifs, que tout le monde utilise, le sont à parts égales par personne.`;
  $("#ds-txt").innerHTML = t;
}
function select(k) { SEL = SEL === k ? null : k; document.querySelectorAll(".ds-b").forEach(b => b.classList.toggle("on", +b.dataset.k === SEL)); draw(); }
async function init() {
  if (!window.d3 || !d3.sankey) { setTimeout(init, 150); return; }
  if (!$("#ds-sankey")) return;
  try { R = (await fetch("data/eco2/FR.json").then(r => r.json())).redistribution; } catch (e) { return; }
  $("#ds-btns").innerHTML = `<span class="muted" style="align-self:center">Suivre :</span>` + [...Array(10).keys()].map(k => `<button type="button" class="ds-b" data-k="${k}" style="border-left:4px solid ${COLD(k)}">D${k + 1}</button>`).join("") + `<span class="muted" style="align-self:center;font-size:.8rem">D1 : les 10 % les plus modestes ; D10 : les 10 % les plus aisés</span>`;
  document.querySelectorAll(".ds-b").forEach(b => b.addEventListener("click", () => select(+b.dataset.k)));
  try { draw(); } catch (e) { console.error("sankey déciles", e); }
  let t; window.addEventListener("resize", () => { clearTimeout(t); t = setTimeout(draw, 200); });
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
