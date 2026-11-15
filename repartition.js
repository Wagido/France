/* Répartition du PIB : ce qui est prélevé, ce qui reste au privé, ce qui fait fonctionner le public et ce qui est redistribué */
(() => {
"use strict";
let R = null;
async function init() {
  if (!window.TH) { setTimeout(init, 100); return; }
  try { R = await fetch("data/repartition.json").then(r => r.json()); } catch (e) { return; }
  let rt; addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(draw, 150); });
  draw();
}
const PRIVE = "#3b6fd6", PUBLIC = "#7c3aed", PRELEV = "#e07b39", EMPR = "#d7a32a", GRIS = "#94a3b8", REDIS = "#0ea5e9";

function draw() {
  const el = document.getElementById("rp-sankey"); if (!R || !el) return;
  const { kpis, showTip, hideTip, esc, pct } = window.TH;
  const md = v => Math.round(v).toLocaleString("fr-FR") + " Md€";
  const pp = v => pct(100 * v / R.pib, 0) + " du PIB";
  const D = R.depenses, laisse = R.pib - R.po;
  const redis = D.prestations + D.aides + D.interets + D.transferts, fonct = D.services + D.investissement;
  const prive = laisse + redis;
  kpis("#rp-kpis", [
    [md(R.pib), `produits en France en ${R.annee}`, "PIB"],
    [md(R.po), `prélevés en impôts et cotisations (${pp(R.po)}) ; ${md(laisse)} restent au privé`, "Prélèvements"],
    [md(R.te), `de dépenses publiques (${pp(R.te)}) : ${md(fonct)} font fonctionner le public, ${md(redis)} sont redistribués`, "Argent public"],
    [md(prive), `pour les ménages et les entreprises : ${md(laisse)} laissés après prélèvements + ${md(redis)} redistribués`, "Argent privé"],
  ]);
  const det = (...a) => a.map(([l, v]) => `${l} : ${md(v)}`).join("<br>");
  const nodes = [
    { id: "pib", label: `PIB ${R.annee}`, col: 0, c: GRIS },
    { id: "laisse", label: "Laissé au privé", col: 1, c: PRIVE, tip: "Revenus des ménages et des entreprises après impôts et cotisations" },
    { id: "po", label: "Prélèvements obligatoires", col: 1, c: PRELEV, tip: det(["TVA et taxes sur la production", R.prelevements.tva], ["Impôts sur les revenus, les bénéfices, le patrimoine", R.prelevements.revenus], ["Cotisations sociales", R.prelevements.cotisations]) },
    { id: "autres", label: "Autres recettes", col: 1, c: GRIS, tip: "Ventes de services publics, loyers, dividendes reçus…" },
    { id: "emp", label: "Emprunt", col: 1, c: EMPR, tip: "Déficit public, financé par la dette" },
    { id: "apu", label: "Argent public", col: 2, c: PUBLIC, tip: "Dépenses de l'État, des collectivités et de la Sécurité sociale" },
    { id: "redis", label: "Redistribué au privé", col: 3, c: REDIS, sub: "pensions, allocations, aides…",
      tip: det(["Pensions et allocations", D.prestations], ["Subventions aux entreprises", D.aides], ["Intérêts de la dette", D.interets], ["Autres transferts (associations, Union européenne…)", D.transferts]) },
    { id: "fonct", label: "Fait fonctionner le public", col: 3, c: PUBLIC, sub: "écoles, hôpitaux, police, investissement",
      tip: det(["Salaires des agents publics", R.detail_services.agents], ["Soins et services achetés pour les ménages", R.detail_services.nature], ["Achats courants", R.detail_services.achats], ["Investissement", D.investissement]) },
    { id: "prive", label: "Argent privé", col: 4, c: PRIVE, sub: "ménages et entreprises", tip: "Revenus laissés après prélèvements + argent redistribué" },
  ];
  const links = [
    ["pib", "laisse", laisse], ["pib", "po", R.po],
    ["po", "apu", R.po], ["autres", "apu", R.autres_recettes], ["emp", "apu", R.emprunt],
    ["apu", "redis", redis], ["apu", "fonct", fonct],
    ["laisse", "prive", laisse], ["redis", "prive", redis],
  ].map(([source, target, value]) => ({ source, target, value }));

  const W = 1160, H = 620, top = 24;
  const G = d3.sankey().nodeId(d => d.id).nodeAlign(n => n.col).nodeSort(null).nodeWidth(14).nodePadding(26)
    .extent([[1, top], [W - 200, H - 4]])({ nodes: nodes.map(n => ({ ...n })), links: links.map(l => ({ ...l })) });
  const svg = d3.create("svg").attr("viewBox", `0 0 ${W} ${H}`).attr("role", "img").attr("aria-label", `Répartition du PIB ${R.annee} entre argent public et argent privé`);
  const defs = svg.append("defs");
  const heads = ["Ce qu'on produit", "Prélevé ou laissé", "Dépense publique", "Ce qu'elle devient", "Au final"];
  const colX = d3.rollup(G.nodes, v => v[0].x0, d => d.col);
  svg.append("g").selectAll("text").data([...colX]).join("text").attr("class", "colhead").attr("x", ([, x]) => x).attr("y", 12).text(([c]) => heads[c]);
  G.links.forEach((l, i) => {
    const id = "rpg" + i, g = defs.append("linearGradient").attr("id", id).attr("gradientUnits", "userSpaceOnUse").attr("x1", l.source.x1).attr("x2", l.target.x0);
    g.append("stop").attr("offset", "0%").attr("stop-color", l.source.c); g.append("stop").attr("offset", "100%").attr("stop-color", l.target.c);
    l._g = id;
  });
  const tip = (ev, t, v, extra) => showTip(`<b>${t}</b><br>${md(v)} (${pct(100 * v / R.pib, 1)} du PIB)${extra ? `<br>${extra}` : ""}`, ev);
  svg.append("g").selectAll("path").data(G.links).join("path").attr("class", "link").attr("d", d3.sankeyLinkHorizontal())
    .attr("stroke", d => `url(#${d._g})`).attr("stroke-width", d => Math.max(1, d.width))
    .on("pointermove", (ev, d) => tip(ev, `${esc(d.source.label)} → ${esc(d.target.label)}`, d.value)).on("pointerleave", hideTip);
  const node = svg.append("g").selectAll("g").data(G.nodes).join("g").attr("class", "node");
  node.append("rect").attr("x", d => d.x0).attr("y", d => d.y0).attr("width", d => d.x1 - d.x0).attr("height", d => Math.max(1, d.y1 - d.y0)).attr("fill", d => d.c)
    .on("pointermove", (ev, d) => tip(ev, esc(d.label), d.value, d.tip)).on("pointerleave", hideTip);
  const lab = node.append("text").attr("x", d => d.x1 + 6).attr("y", d => (d.y0 + d.y1) / 2).attr("dy", d => d.sub ? "-0.7em" : "-0.15em");
  lab.append("tspan").attr("font-weight", 600).text(d => d.label);
  lab.append("tspan").attr("class", "amt").attr("x", d => d.x1 + 6).attr("dy", "1.2em").text(d => `${md(d.value)} · ${pct(100 * d.value / R.pib, 0)} du PIB`);
  lab.filter(d => d.sub).append("tspan").attr("class", "amt").attr("x", d => d.x1 + 6).attr("dy", "1.2em").attr("font-size", "0.85em").text(d => d.sub);
  el.replaceChildren(svg.node());

  document.getElementById("rp-txt").innerHTML = `
    <p><b>1. Ce qu'on produit.</b> En ${R.annee}, la France a produit <b>${md(R.pib)}</b> de richesses (le PIB).</p>
    <p><b>2. Prélevé ou laissé.</b> Les administrations publiques (État, collectivités, Sécurité sociale) en prélèvent <b>${md(R.po)}</b> en impôts et cotisations (${pp(R.po)}). Les <b>${md(laisse)}</b> restants sont laissés aux ménages et aux entreprises.</p>
    <p><b>3. L'argent public.</b> Avec leurs autres recettes (${md(R.autres_recettes)}) et l'emprunt (${md(R.emprunt)}), les administrations dépensent <b>${md(R.te)}</b>. C'est le sujet de l'onglet <a href="#argent-public">L'argent public</a>.</p>
    <p><b>4. Ce qu'il devient.</b> Une part fait fonctionner le public : <b>${md(fonct)}</b> pour payer enseignants, soignants, policiers, acheter du matériel, rembourser les soins et investir. L'autre part, <b>${md(redis)}</b>, revient directement au privé sous forme de redistribution : pensions de retraite, allocations, subventions, intérêts versés aux prêteurs.</p>
    <p><b>5. Au final, l'argent privé.</b> Les ménages et les entreprises disposent de <b>${md(prive)}</b> : ce qui leur a été laissé plus ce qui leur a été redistribué. C'est le sujet de l'onglet <a href="#argent-prive">Argent privé</a>.</p>
    <p class="muted" style="font-size:.8rem">Le total final dépasse le PIB parce que la dépense publique est aussi financée par l'emprunt et par des recettes qui ne sont pas des impôts. « Public » ne veut pas dire « perdu » : les salaires des agents publics (${md(R.detail_services.agents)}) sont dépensés par des ménages, et les soins remboursés (${md(R.detail_services.nature)}) paient des médecins et des pharmacies privés. Une partie des intérêts va à des prêteurs étrangers, et les autres transferts comprennent la contribution au budget de l'Union européenne. Source : Eurostat, comptes des administrations publiques (gov_10a_main) et PIB (nama_10_gdp), ${R.annee}.</p>`;
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
