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
  const M = R.menages, E = R.entreprises;
  const entG = E ? E.garde : 0, entL = entG - D.aides;            // ce que gardent les entreprises, dont aides publiques
  const menL = laisse - entL, autres = D.interets + D.transferts;   // ménages : le reste de ce qui est laissé
  const men = menL + D.prestations, prive = laisse + redis;
  kpis("#rp-kpis", [
    [md(R.pib), [`richesse produite en France en ${R.annee}`], "PIB"],
    [md(R.po), [`impôts et cotisations : ${pp(R.po)}`, `laissé au privé : ${md(laisse)}`], "Prélèvements"],
    [md(R.te), [`recettes : ${md(R.tr)} (prélèvements ${md(R.po)} + autres ${md(R.autres_recettes)})`, `emprunt : ${md(R.emprunt)}`, `dépensé : <b style="color:#dc2626">${pp(R.te)}</b>`], "Argent public"],
    [md(prive), [`ménages : ${md(men)}`, `entreprises : ${md(entG)}`, `prêteurs, associations, Europe : ${md(autres)}`], "Argent privé"],
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
    { id: "ent", label: "Entreprises", col: 4, c: "#1e40af", sub: "profits gardés pour investir",
      tip: E ? `Ce que les entreprises gardent après salaires, impôts, intérêts et dividendes (revenu disponible des sociétés)<br>Profits avant tout cela (excédent d'exploitation) : ${md(E.profits)}` : "" },
    { id: "men", label: "Ménages", col: 4, c: PRIVE, sub: "salaires, retraites, allocations…",
      tip: M ? `Revenu disponible des ménages (comptes nationaux) : ${md(M.rdb)}<br>${det(["Salaires bruts", M.salaires], ["− cotisations sociales", M.cotisations], ["Revenus des indépendants et loyers", M.independants], ["Revenus du patrimoine (nets)", M.patrimoine], ["Pensions et allocations", M.prestations], ["− impôts sur le revenu et le patrimoine", M.impots])}` : "" },
    { id: "aut", label: "Prêteurs, associations, Europe", col: 4, c: GRIS, tip: det(["Intérêts de la dette publique (prêteurs français et étrangers)", D.interets], ["Autres transferts (associations, Union européenne…)", D.transferts]) },
  ];
  const links = [
    ["pib", "laisse", laisse], ["pib", "po", R.po],
    ["po", "apu", R.po], ["autres", "apu", R.autres_recettes], ["emp", "apu", R.emprunt],
    ["apu", "redis", redis], ["apu", "fonct", fonct],
    ["laisse", "ent", entL], ["laisse", "men", menL], ["redis", "ent", D.aides], ["redis", "men", D.prestations], ["redis", "aut", autres],
  ].map(([source, target, value]) => ({ source, target, value }));

  const W = 1160, H = 660, top = 24;
  const G = d3.sankey().nodeId(d => d.id).nodeAlign(n => n.col).nodeSort(null).linkSort(null).nodeWidth(14).nodePadding(26)
    .extent([[1, top], [W - 215, H - 4]])({ nodes: nodes.map(n => ({ ...n })), links: links.map(l => ({ ...l })) });
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
  lab.append("tspan").attr("class", "amt").attr("x", d => d.x1 + 6).attr("dy", "1.2em").text(d => `${md(d.value)} · `)
    .append("tspan").style("fill", d => d.id === "apu" ? "#dc2626" : null).attr("font-weight", d => d.id === "apu" ? 700 : null).text(d => `${pct(100 * d.value / R.pib, 0)} du PIB`);
  lab.filter(d => d.sub).append("tspan").attr("class", "amt").attr("x", d => d.x1 + 6).attr("dy", "1.2em").attr("font-size", "0.85em").text(d => d.sub);
  el.replaceChildren(svg.node());
  const p = v => pct(100 * v / R.pib, 0);
  document.getElementById("rp-56").innerHTML = `<p><b>Les « <span style="color:#dc2626">${p(R.te)}</span> du PIB » : ce que dépense le public, pas ce qu'il prélève</b></p>
    <p>On entend souvent que l'État « prélève ${p(R.te)} de la richesse ». En réalité, <b style="color:#dc2626">${p(R.te)}</b> est le montant des <b>dépenses publiques</b> rapporté au PIB (${R.annee}). Les prélèvements, eux, sont plus faibles, et l'argent dépensé ne reste pas entièrement dans le public :</p>
    <ul>
      <li><b>Ce qui est prélevé : ${p(R.po)}</b> du PIB en impôts et cotisations (42,8 % selon le taux officiel de l'INSEE, qui retire les crédits d'impôt et les cotisations « imputées » <a href="https://www.insee.fr/fr/statistiques/8540375" target="_blank" rel="noopener">[INSEE]</a>). Le reste de la dépense est payé par l'emprunt (${p(R.emprunt)}) et d'autres recettes (${p(R.autres_recettes)}).</li>
      <li><b>Ce qui est aussitôt redistribué : ${p(redis)}</b> du PIB, rendus aux ménages et aux entreprises en pensions, allocations, subventions et intérêts.</li>
      <li><b>Ce que le public utilise lui-même : ${p(fonct)}</b> du PIB, pour les écoles, les hôpitaux, la police, l'investissement.</li>
      <li><b>Au final, ${p(prive)}</b> du PIB est dépensé par le privé.</li>
    </ul>
    <p class="muted" style="font-size:.8rem">Ce ratio n'est pas une « part » du PIB : il additionne des transferts (une pension versée puis dépensée par un retraité) à de la production. Un pays qui paie ses retraites par des caisses publiques, comme la France, affiche donc une dépense publique bien plus forte qu'un pays qui passe par des fonds de pension privés. Calcul à partir d'Eurostat (gov_10a_main, nama_10_gdp).</p>`;

  document.getElementById("rp-txt").innerHTML = `<p><b>Comment lire le diagramme, de gauche à droite</b></p>
    <ol>
      <li><b>Ce qu'on produit</b> : ${md(R.pib)} de richesses en ${R.annee}.</li>
      <li><b>Prélevé ou laissé</b> : ${md(R.po)} d'impôts et cotisations ; ${md(laisse)} restent aux ménages et aux entreprises.</li>
      <li><b>L'argent public</b> : ces prélèvements, plus ${md(R.autres_recettes)} d'autres recettes et ${md(R.emprunt)} d'emprunt, soit ${md(R.te)} dépensés par l'État, les collectivités et la Sécurité sociale (voir <a href="#argent-public">L'argent public</a>).</li>
      <li><b>Ce qu'il devient</b> : ${md(fonct)} font fonctionner le public (salaires des agents, soins remboursés, achats, investissement) ; ${md(redis)} reviennent au privé par la redistribution.</li>
      <li><b>L'argent privé</b> : ${md(prive)}, ce qui a été laissé plus ce qui a été redistribué (voir <a href="#argent-prive">Argent privé</a>) :
        <ul>
          <li><b>ménages : ${md(men)}</b> ;</li>
          <li><b>entreprises : ${md(entG)}</b>, les profits qu'elles gardent pour investir, après salaires, impôts, intérêts et dividendes ;</li>
          <li><b>prêteurs, associations, Europe : ${md(autres)}</b>, intérêts de la dette et autres transferts.</li>
        </ul></li>
    </ol>
    ${M ? `<p><b>D'où vient l'argent des ménages</b> (revenu disponible, comptes nationaux ${R.annee}) :</p>
    <ul>
      <li>salaires : ${md(M.salaires)}, dont ${md(M.cotisations)} repartent en cotisations sociales ;</li>
      <li>revenus des indépendants et loyers : ${md(M.independants)} (dont les loyers que les propriétaires « se versent » à eux-mêmes) ;</li>
      <li>revenus du patrimoine (intérêts, dividendes) : ${md(M.patrimoine)} ;</li>
      <li>pensions de retraite et allocations : ${md(M.prestations)} ;</li>
      <li>moins les impôts sur le revenu et le patrimoine : −${md(M.impots)} ;</li>
      <li>soit <b>${md(M.rdb)}</b> à dépenser ou épargner (${pp(M.rdb)}). C'est un peu plus que les ${md(men)} du diagramme, car ce compte inclut aussi les retraites versées par des caisses privées et les dons reçus.</li>
    </ul>` : ""}
    <p class="muted" style="font-size:.8rem">Le total final dépasse le PIB à cause de l'emprunt et des recettes qui ne sont pas des impôts. « Public » ne veut pas dire « perdu » : les salaires des agents (${md(R.detail_services.agents)}) sont dépensés par des ménages, les soins remboursés (${md(R.detail_services.nature)}) paient des médecins et pharmacies privés. Une partie des intérêts va à l'étranger ; les autres transferts comprennent la contribution au budget européen. Source : Eurostat, gov_10a_main et nama_10_gdp, ${R.annee}.</p>`;
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
