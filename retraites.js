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
function draw() {
  const { kpis, lineChart, legend, esc } = window.TH;
  const nf = (v, d = 0) => v == null ? "n.d." : v.toLocaleString("fr-FR", { minimumFractionDigits: d, maximumFractionDigits: d });
  const P = Object.fromEntries(R.pays.map(p => [p.code, p])), fr = P.FR, de = P.DE, ue = P.EU27_2020;
  kpis("#rt-kpis", [
    [nf(fr.depense, 1) + " %", [`du PIB consacré aux retraites (${fr.depense_annee})`, `Allemagne ${nf(de.depense, 1)} %, moyenne de l'UE ${nf(ue.depense, 1)} %`], "Dépense"],
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
