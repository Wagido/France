/* Retraites : la France comparée à ses voisins, et ce qu'une génération donne et reçoit sur toute une vie */
(() => {
"use strict";
let R = null;
const $ = s => document.querySelector(s);
const COL = ["FR", "DE", "IT", "ES", "NL", "SE", "DK", "EU27_2020"];
const COUL = { FR: "#dc2626", DE: "#334155", IT: "#16a34a", SE: "#3b6fd6", EU27_2020: "#94a3b8" };
async function init() {
  if (!window.TH || !$("#rt-kpis")) { setTimeout(init, 100); return; }
  try { R = await fetch("data/retraites.json", { cache: "no-cache" }).then(r => r.json()); } catch (e) { return; }
  try { draw(); } catch (e) { console.error("retraites", e); }
}
/* la première dépense publique, et le poids des âgés dans les urnes */
function drawPoids() {
  const { lineChart, legend, esc } = window.TH, $ = s => document.querySelector(s);
  const nf = (v, d = 0) => v.toLocaleString("fr-FR", { minimumFractionDigits: d, maximumFractionDigits: d });
  const Dp = R.depenses, E = R.electeurs;
  if (Dp && $("#rt-depenses")) {
    const P = Dp.postes, mx = P[0].md;
    $("#rt-dep-lead").innerHTML = `Dépenses de toutes les administrations publiques (État, collectivités, Sécurité sociale) par grande fonction, en ${Dp.annee} : ${nf(Dp.total)} milliards d'euros au total. Les retraites en représentent <b>${nf(P[0].pc_dep)} %</b>, soit ${nf(P[0].md)} milliards, plus que la santé et l'enseignement réunis.`;
    $("#rt-depenses").innerHTML = `<div class="pp-rows">` + P.map(p => `<div class="in-sbar"><span class="lab">${esc(p.l)}</span><span class="tr"><span style="width:${(100 * p.md / mx).toFixed(1)}%;background:${p.k === "retraites" ? "#dc2626" : "#94a3b8"}"></span></span><b>${nf(p.md)} Md€</b><small class="muted">${nf(p.pc_dep, 1)} % des dépenses</small></div>`).join("") + `</div>
      <p class="muted" style="font-size:.78rem;margin:4px 0 0">Eurostat, dépenses des administrations publiques par fonction (COFOG), regroupées comme dans l'onglet <a href="#argent-public">Argent public</a>. « Retraites » : pensions de vieillesse et de réversion.</p>`;
  }
  if (E && $("#rt-urnes")) {
    const C = { pop: "#cbd5e1", presid: "#60a5fa", legis: "#1d4ed8" }, mx = Math.max(...E.groupes.flatMap(g => [g.pop, g.presid, g.legis]));
    $("#rt-urnes").innerHTML = E.groupes.map(g => `<div class="rt-urne"><span class="lab">${g.l}</span><span class="rt-urne-b">${["pop", "presid", "legis"].map(k =>
      `<span class="rt-urne-r"><span style="width:${(85 * g[k] / mx).toFixed(1)}%;background:${C[k]}"></span><b>${nf(g[k], 1)} %</b></span>`).join("")}</span></div>`).join("");
    legend("#rt-urnes-legend", [["Part des adultes", C.pop], ["Part des votants à la présidentielle", C.presid], ["Part des votants aux législatives", C.legis]]);
    const Pa = E.participation.map((p, i) => ({ annee: i, ...p }));
    lineChart($("#rt-part"), Pa, [{ k: "presid", l: "Présidentielle", c: C.presid }, { k: "legis", l: "Législatives", c: C.legis }], { vfmt: v => nf(v, 1) + " %", yfmt: v => v + " %", h: 240 });
    $("#rt-part").querySelectorAll("g.axis")[0]?.querySelectorAll(".tick").forEach(t => { const i = +t.querySelector("text").textContent; t.querySelector("text").textContent = Number.isInteger(i) && Pa[i] ? Pa[i].l.replace(" ans", "").replace(" ou plus", "+") : ""; });
    legend("#rt-part-legend", [["Présidentielle", C.presid], ["Législatives", C.legis]]);
    lineChart($("#rt-proj"), E.projection, [{ k: "plus65", l: "65 ans et plus, en % des 20 ans et plus", c: "#dc2626" }], { vfmt: v => nf(v, 1) + " %", yfmt: v => v + " %", h: 240, nozero: true });
    const p0 = E.projection[0], p50 = E.projection.find(p => p.annee === 2050), p70 = E.projection.find(p => p.annee === 2070);
    $("#rt-urnes-txt").innerHTML = `<ul>
      <li><b>Les 60 ans et plus sont ${nf(E.plus60.pop)} % des adultes, mais ${nf(E.plus60.legis)} % des votants aux législatives</b> (${nf(E.plus60.presid)} % à la présidentielle), parce qu'ils votent beaucoup plus que les jeunes : 71 à 75 % des 60-79 ans ont voté aux législatives de 2022, contre 35 % des 18-29 ans. Avec les 50-59 ans, proches de la retraite, les plus de 50 ans pèsent <b>${nf(E.plus50.legis)} %</b> des votants aux législatives : une majorité.</li>
      <li><b>Le poids grandit</b> : les 65 ans et plus étaient ${nf(p0.plus65, 1)} % des adultes en ${p0.annee} ; ils devraient être ${nf(p50.plus65, 1)} % en 2050 et ${nf(p70.plus65, 1)} % en 2070, selon le scénario central d'Eurostat.</li>
      <li><b>D'où la difficulté politique</b> : une réforme qui baisse les pensions ou retarde le départ touche directement l'électorat qui vote le plus. C'est pourquoi les réformes françaises ont presque toujours épargné les retraités actuels et fait porter l'effort sur les futurs retraités, par la durée de cotisation et l'âge, ou sur les actifs, par les cotisations. Les mesures qui touchent les pensions déjà versées (gel ou sous-indexation, hausse de la CSG des retraités en 2018) ont été parmi les plus contestées, et souvent corrigées ensuite.</li>
      <li><b>Mais les retraités ne votent pas d'un bloc</b>, et beaucoup se soucient de la situation de leurs enfants et petits-enfants. Plusieurs pays ont contourné l'obstacle en liant automatiquement l'âge de départ à l'espérance de vie (Danemark, Pays-Bas, Suède, Italie) : la règle est votée une fois, puis s'applique sans nouveau vote.</li>
    </ul>
    <p class="muted" style="font-size:.78rem">Calcul du site : population par âge au 1<sup>er</sup> janvier ${E.annee_pop} (Eurostat), pondérée par la participation par âge mesurée par l'Insee (<a href="https://www.insee.fr/fr/statistiques/6658145" target="_blank" rel="noopener">enquête sur la participation électorale 2022, Insee Première n° 1928</a>). Approximation : la population comprend des étrangers, qui ne votent pas, plus nombreux aux âges actifs ; le poids réel des plus âgés parmi les électeurs est donc un peu plus élevé. Projection : Eurostat, scénario central, 65 ans et plus rapportés aux 20 ans et plus.</p>`;
  }
}

function draw() {
  drawPoids();
  const { kpis, lineChart, legend, esc } = window.TH;
  const nf = (v, d = 0) => v == null ? "n.d." : v.toLocaleString("fr-FR", { minimumFractionDigits: d, maximumFractionDigits: d });
  const P = Object.fromEntries(R.pays.map(p => [p.code, p])), fr = P.FR, de = P.DE, ue = P.EU27_2020;
  kpis("#rt-kpis", [
    [nf(fr.depense, 1) + " %", [`du PIB consacré aux retraites (${fr.depense_annee})`, `Allemagne ${nf(de.depense, 1)} %, moyenne de l'UE ${nf(ue.depense, 1)} %`], "Dépense"],
    R.depenses && [nf(R.depenses.postes[0].pc_dep) + " %", [`des dépenses publiques vont aux retraites (${R.depenses.annee})`, `la première dépense de l'État et de la Sécurité sociale, loin devant la santé`], "1re dépense publique"],
    R.electeurs && [nf(R.electeurs.plus60.legis) + " %", [`des votants aux législatives de 2022 avaient 60 ans ou plus`, `${nf(R.electeurs.plus60.pop)} % des adultes`], "Poids électoral"],
    [nf(fr.niveau, 2), [`revenu des 65 ans et plus rapporté à celui des moins de 65 ans`, `presque le même niveau de vie ; Allemagne ${nf(de.niveau, 2)}`], "Niveau de vie des retraités"],
    [nf(fr.esperance65, 1) + " ans", [`d'espérance de vie à 65 ans, l'une des plus longues d'Europe`, `Allemagne ${nf(de.esperance65, 1)} ans`], "Durée de la retraite"],
    [nf(fr.emploi6064) + " %", [`des 60-64 ans ont un emploi`, `Allemagne ${nf(de.emploi6064)} %, Suède ${nf(P.SE.emploi6064)} %`], "On part tôt"],
  ]);
  const ROWS = [
    ["Dépenses de retraite (% du PIB)", "depense", 1, -1],
    ["Revenu des 65 ans et plus ÷ revenu des moins de 65 ans", "niveau", 2, 1],
    ["Pension ÷ dernier revenu d'activité (taux de remplacement)", "remplacement", 2, 1],
    ["Espérance de vie à 65 ans (années)", "esperance65", 1, 1],
    ["Taux d'emploi des 60-64 ans (%)", "emploi6064", 0, 1],
  ];
  $("#rt-table").innerHTML = `<table class="pr-t"><thead><tr><th>Indicateur</th>${COL.map(g => `<th class="${g === "FR" ? "fr" : ""}">${esc(P[g].nom.replace("Moyenne de l'Union européenne", "UE"))}</th>`).join("")}</tr></thead><tbody>` +
    ROWS.map(([l, k, d]) => { const mx = Math.max(...COL.map(g => P[g][k] || 0));
      return `<tr><td class="lab">${esc(l)} <small class="muted">Eurostat, ${fr[k + "_annee"]}</small></td>` + COL.map(g => `<td class="${g === "FR" ? "fr" : ""}"><b>${nf(P[g][k], d)}</b><span class="pr-bar"><i style="width:${(100 * (P[g][k] || 0) / mx).toFixed(1)}%"></i></span></td>`).join("") + `</tr>`; }).join("") + `</tbody></table>`;
  const DP = R.dependance.filter(r => r.FR != null || r.DE != null);
  lineChart($("#rt-dep"), DP, Object.keys(COUL).map(g => ({ k: g, l: P[g]?.nom || g, c: COUL[g], dash: g === "EU27_2020" ? "4 4" : null })), { nozero: true, vfmt: v => nf(v, 1), h: 240 });
  legend("#rt-dep-legend", Object.keys(COUL).map(g => [P[g]?.nom || g, COUL[g], g === "EU27_2020"]));
  const d0 = DP.find(r => r.FR != null), dL = DP.at(-1);
  // générations (COR)
  const G = (R.generations || []).map(r => ({ annee: r.gen, ...r }));
  // l'axe horizontal est l'année de naissance
  if (G.length) {
    const g1 = (el, k, c, fmt, nozero) => lineChart($(el), G, [{ k, l: "", c }], { h: 200, nozero, vfmt: fmt, yfmt: fmt, xticks: 6 });
    g1("#rt-g-cot", "cotisation", "#dc2626", v => nf(v, 0) + " %", true);
    g1("#rt-g-car", "carriere", "#dc2626", v => nf(v, 0) + " ans", true);
    g1("#rt-g-rem", "remplacement", "#16a34a", v => nf(v, 0) + " %", true);
    g1("#rt-g-ret", "retraite", "#16a34a", v => nf(v, 1) + " ans", true);
    lineChart($("#rt-g-tri"), G, [{ k: "rendement", l: "Rendement", c: "#7c3aed" }], { h: 220, vfmt: v => nf(v, 1) + " % par an", yfmt: v => nf(v, 1) + " %", xticks: 8 });
  }
  $("#rt-txt").innerHTML = `<p style="margin-top:0"><b>1. Pourquoi la France dépense plus que ses voisins</b></p><ul>
      <li><b>On part tôt</b> : seuls ${nf(fr.emploi6064)} % des 60-64 ans travaillent, contre ${nf(de.emploi6064)} % en Allemagne et ${nf(P.SE.emploi6064)} % en Suède. L'âge moyen de départ était de 62,9 ans en 2023 (Conseil d'orientation des retraites).</li>
      <li><b>On vit longtemps</b> : à 65 ans, il reste en moyenne ${nf(fr.esperance65, 1)} ans à vivre, contre ${nf(de.esperance65, 1)} en Allemagne. Une bonne nouvelle, mais une retraite plus longue à financer.</li>
      <li><b>Les pensions sont élevées</b> : les plus de 65 ans ont presque le même niveau de vie que le reste de la population (${nf(fr.niveau, 2)}), comme en Italie (${nf(P.IT.niveau, 2)}) et en Espagne (${nf(P.ES.niveau, 2)}), mais nettement plus qu’en Allemagne (${nf(de.niveau, 2)}), aux Pays-Bas (${nf(P.NL.niveau, 2)}) ou au Danemark (${nf(P.DK.niveau, 2)}).</li>
      <li><b>Et il y a de plus en plus de retraités</b> : la France compte ${nf(dL.FR, 1)} personnes de 65 ans et plus pour 100 personnes de 15 à 64 ans en ${dL.annee}, contre ${nf(d0.FR, 1)} en ${d0.annee} (graphique).</li>
    </ul>
    <p style="margin-bottom:2px"><b>2. Sur toute une vie : ce qu'une génération donne, et ce qu'elle reçoit</b></p><ul>
      <li><b>On cotise de plus en plus</b> : pour un salarié non-cadre du privé, le taux de cotisation retraite passe de 19 % du salaire pour la génération née en 1940 à 28 % pour celle née en 2000.</li>
      <li><b>La carrière dure à peu près autant</b> : environ 36 ans pour la génération 1942, plus de 39 ans pour celle du milieu des années 1950, puis environ 38 ans pour les générations nées à partir de 1980, qui commencent plus tard et ont des carrières plus hachées.</li>
      <li><b>La retraite dure environ 24 ans</b> pour les générations nées entre la fin des années 1950 et le début des années 1960, soit un peu moins de 28 % de leur vie. Elle baisse un peu pour les générations de la fin des années 1960, avec le recul de l'âge de départ, puis remonte avec l'allongement de la vie.</li>
      <li><b>Le « rendement » baisse au fil des générations</b> : ce que l'on reçoit en pensions, rapporté à ce que l'on a cotisé, était très favorable pour les générations des années 1940 (environ 2 % par an), qui ont cotisé peu pendant les Trente Glorieuses. Il diminue jusqu'aux générations du début des années 1970, puis se stabilise : environ 0,8 % par an pour la génération 2000. Dans le même temps, la pension passe d'environ 77 % du dernier salaire net pour la génération 1940 à 69 % pour la génération 2000.</li>
      <li><b>Et ce n'est que la retraite</b> : les mêmes générations ont aussi acheté leur logement bien moins cher, avec des prêts que l'inflation effaçait, puis profité de la hausse des prix de l'immobilier après 2000, et ce patrimoine se transmet par héritage, de plus en plus tard. L'avantage des générations nées dans les années 1940 et 1950 se cumule donc sur toute leur vie (voir l'onglet <a href="#niveau-vie">Vit-on mieux qu'avant ?</a>).</li>
      <li><b>En clair</b> : les jeunes générations cotisent plus, pour une pension plus faible par rapport à leur salaire, mais sur une retraite au moins aussi longue. Le système reste à peu près équilibré en part du PIB, mais au prix d'un effort qui pèse davantage sur les actifs (voir l'onglet <a href="#niveau-vie">Vit-on mieux qu'avant ?</a>).</li>
    </ul>
    <p style="margin-bottom:2px"><b>3. Répartition ou capitalisation ?</b></p><ul>
      <li><b>En France, presque tout est en répartition</b> : les cotisations des actifs d'aujourd'hui paient les pensions des retraités d'aujourd'hui. Le système dépend donc du nombre d'actifs par retraité, et de la croissance des salaires.</li>
      <li><b>Aux Pays-Bas, au Danemark ou en Suède</b>, une grande part passe par des fonds de pension obligatoires : chaque génération met de côté pour sa propre retraite, placée en actions et en obligations. Au Danemark, ces fonds pèsent plus de deux fois le PIB (OCDE).</li>
      <li><b>Chaque système a son risque</b> : la répartition craint le vieillissement, la capitalisation craint les krachs boursiers et l'inflation. Beaucoup de pays combinent les deux.</li>
      <li><b>Passer de l'un à l'autre coûte cher</b> : pendant toute une génération, il faudrait à la fois payer les pensions actuelles et épargner pour les futures, ce qu'on appelle le « double paiement ».</li>
    </ul>`;
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
