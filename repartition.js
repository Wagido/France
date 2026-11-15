/* Répartition du PIB : ce que prélèvent les administrations, ce qu'elles dépensent, et ce qui revient au privé */
(() => {
"use strict";
let R = null;
async function init() {
  if (!window.TH) { setTimeout(init, 100); return; }
  try { R = await fetch("data/repartition.json").then(r => r.json()); } catch (e) { return; }
  let rt; addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(draw, 150); });
  draw();
}
const PRIVE = "#3b6fd6", PUBLIC = "#7c3aed", PRELEV = "#e07b39", EMPR = "#d7a32a", GRIS = "#94a3b8";

function draw() {
  const el = document.getElementById("rp-sankey"); if (!R || !el) return;
  const { kpis, showTip, hideTip, esc, pct } = window.TH;
  const md = v => Math.round(v).toLocaleString("fr-FR") + " Md€";
  const pp = v => pct(100 * v / R.pib, 0) + " du PIB";
  const P = R.prelevements, D = R.depenses, reste = R.pib - R.po;
  const enArgent = D.prestations + D.aides + D.interets + D.transferts, enServices = D.services + D.investissement;
  kpis("#rp-kpis", [
    [md(R.po), `de prélèvements obligatoires en ${R.annee}, soit ${pp(R.po)}`, "Prélevé"],
    [md(R.te), `de dépenses publiques, soit ${pp(R.te)} (financées aussi par l'emprunt : ${md(R.emprunt)})`, "Dépensé"],
    [md(enArgent), `reversés au privé en argent : pensions, allocations, aides, intérêts (${pp(enArgent)})`, "Rendu en argent"],
    [md(enServices), `pour faire fonctionner les services publics et investir (${pp(enServices)})`, "Services publics"],
  ]);
  const nodes = [
    { id: "pib", label: `PIB ${R.annee}`, col: 0, c: GRIS },
    { id: "reste", label: "Reste au privé (revenus après impôts)", col: 1, c: PRIVE },
    { id: "tva", label: "TVA, taxes sur la production", col: 1, c: PRELEV },
    { id: "rev", label: "Impôts sur les revenus", col: 1, c: PRELEV },
    { id: "cot", label: "Cotisations sociales", col: 1, c: PRELEV },
    { id: "autres", label: "Autres recettes", col: 1, c: GRIS },
    { id: "emp", label: "Emprunt (déficit)", col: 1, c: EMPR },
    { id: "apu", label: "Dépenses publiques", col: 2, c: PUBLIC },
    { id: "prest", label: "Pensions et allocations", col: 3, c: PRIVE },
    { id: "aides", label: "Subventions", col: 3, c: PRIVE },
    { id: "int", label: "Intérêts de la dette", col: 3, c: PRIVE },
    { id: "transf", label: "Autres transferts", col: 3, c: PRIVE },
    { id: "serv", label: "Services publics", col: 3, c: PUBLIC },
    { id: "inv", label: "Investissement public", col: 3, c: PUBLIC },
    { id: "fprive", label: "Utilisé par le privé", col: 4, c: PRIVE },
    { id: "fpublic", label: "Utilisé par le public", col: 4, c: PUBLIC },
  ];
  const links = [
    ["pib", "reste", reste], ["pib", "tva", P.tva], ["pib", "rev", P.revenus], ["pib", "cot", P.cotisations],
    ["tva", "apu", P.tva], ["rev", "apu", P.revenus], ["cot", "apu", P.cotisations], ["autres", "apu", R.autres_recettes], ["emp", "apu", R.emprunt],
    ["apu", "prest", D.prestations], ["apu", "aides", D.aides], ["apu", "int", D.interets], ["apu", "transf", D.transferts], ["apu", "serv", D.services], ["apu", "inv", D.investissement],
    ["reste", "fprive", reste], ["prest", "fprive", D.prestations], ["aides", "fprive", D.aides], ["int", "fprive", D.interets], ["transf", "fprive", D.transferts],
    ["serv", "fpublic", D.services], ["inv", "fpublic", D.investissement],
  ].map(([source, target, value]) => ({ source, target, value }));

  const narrow = el.clientWidth < 700, W = narrow ? 900 : 1160, H = 700, top = 24;
  const G = d3.sankey().nodeId(d => d.id).nodeAlign(n => n.col).nodeSort(null).nodeWidth(12).nodePadding(24)
    .extent([[1, top], [W - 190, H - 4]])({ nodes: nodes.map(n => ({ ...n })), links: links.map(l => ({ ...l })) });
  const svg = d3.create("svg").attr("viewBox", `0 0 ${W} ${H}`).attr("role", "img").attr("aria-label", `Répartition du PIB ${R.annee} entre public et privé`);
  const defs = svg.append("defs");
  const heads = ["Ce qu'on produit", "Ce qui est prélevé", "Dépense publique", "Pour quoi", "Au final"];
  const colX = d3.rollup(G.nodes, v => v[0].x0, d => d.col);
  svg.append("g").selectAll("text").data([...colX]).join("text").attr("class", "colhead").attr("x", ([, x]) => x).attr("y", 12).text(([c]) => heads[c]);
  G.links.forEach((l, i) => {
    const id = "rpg" + i, g = defs.append("linearGradient").attr("id", id).attr("gradientUnits", "userSpaceOnUse").attr("x1", l.source.x1).attr("x2", l.target.x0);
    g.append("stop").attr("offset", "0%").attr("stop-color", l.source.c); g.append("stop").attr("offset", "100%").attr("stop-color", l.target.c);
    l._g = id;
  });
  svg.append("g").selectAll("path").data(G.links).join("path").attr("class", "link").attr("d", d3.sankeyLinkHorizontal())
    .attr("stroke", d => `url(#${d._g})`).attr("stroke-width", d => Math.max(1, d.width))
    .on("pointermove", (ev, d) => showTip(`<b>${esc(d.source.label)} → ${esc(d.target.label)}</b><br>${md(d.value)} (${pct(100 * d.value / R.pib, 1)} du PIB)`, ev)).on("pointerleave", hideTip);
  const node = svg.append("g").selectAll("g").data(G.nodes).join("g").attr("class", "node");
  node.append("rect").attr("x", d => d.x0).attr("y", d => d.y0).attr("width", d => d.x1 - d.x0).attr("height", d => Math.max(1, d.y1 - d.y0)).attr("fill", d => d.c)
    .on("pointermove", (ev, d) => showTip(`<b>${esc(d.label)}</b><br>${md(d.value)} (${pct(100 * d.value / R.pib, 1)} du PIB)`, ev)).on("pointerleave", hideTip);
  const big = d => d.y1 - d.y0 > 26;
  const lab = node.append("text").attr("x", d => d.x1 + 6).attr("y", d => (d.y0 + d.y1) / 2).attr("dy", d => big(d) ? "-0.15em" : "0.35em");
  lab.append("tspan").text(d => d.label + (big(d) ? "" : "  "));
  lab.append("tspan").attr("class", "amt").attr("x", d => big(d) ? d.x1 + 6 : null).attr("dy", d => big(d) ? "1.15em" : null).text(d => md(d.value));
  el.replaceChildren(svg.node());

  const fpr = reste + enArgent;
  document.getElementById("rp-txt").innerHTML = `
    <p>Sur les <b>${md(R.pib)}</b> produits en France en ${R.annee}, les administrations publiques (État, collectivités, Sécurité sociale) prélèvent <b>${md(R.po)}</b> en impôts et cotisations, soit ${pp(R.po)}. Avec leurs autres recettes et l'emprunt, elles dépensent <b>${md(R.te)}</b>.</p>
    <p>Mais la plus grande partie de cette dépense ne reste pas dans le public : <b>${md(enArgent)}</b> repartent aussitôt vers les ménages et les entreprises sous forme d'argent (pensions de retraite, allocations, subventions, intérêts versés aux prêteurs). Les administrations n'utilisent elles-mêmes que <b>${md(enServices)}</b>, soit ${pp(enServices)}, pour payer les enseignants, soignants, policiers, acheter du matériel, rembourser les soins et investir.</p>
    <p>Au final, <b>${md(fpr)}</b> sont utilisés par le privé et <b>${md(enServices)}</b> par le public. Les deux totaux font plus que le PIB, parce que la dépense publique est aussi financée par l'emprunt (${md(R.emprunt)}) et par des recettes qui ne sont pas des impôts (${md(R.autres_recettes)}).</p>
    <p class="muted" style="font-size:.8rem">Il ne faut pas lire « public » comme « perdu » : les salaires des agents publics (${md(R.detail_services.agents)}) sont dépensés par des ménages, et les soins remboursés (${md(R.detail_services.nature)}) paient des médecins et des pharmacies privés. Une partie des intérêts va à des prêteurs étrangers, et les autres transferts comprennent la contribution au budget de l'Union européenne. Source : Eurostat, comptes des administrations publiques (gov_10a_main) et PIB (nama_10_gdp), ${R.annee}.</p>`;
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
