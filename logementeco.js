/* Logement (Économie) : le poids du logement, le transfert entre générations, les leviers pour le faire baisser */
(() => {
"use strict";
const $ = s => document.querySelector(s);
async function init() {
  if (!window.TH || !$("#lge-kpis")) { setTimeout(init, 100); return; }
  let A, N;
  try { A = await fetch("data/logement_age.json", { cache: "no-cache" }).then(r => r.json()); } catch (e) { return; }
  try { N = await fetch("data/niveau_vie.json", { cache: "no-cache" }).then(r => r.json()); } catch (e) { N = null; }
  const { kpis, bars, esc } = window.TH, nf = (v, d = 0) => v.toLocaleString("fr-FR", { minimumFractionDigits: d, maximumFractionDigits: d });
  const pre = N?.preengagees?.at(-1), pre0 = N?.preengagees?.[0];
  const P = A.proprietaires, jeunes = P[0], vieux = P.at(-1), m5064 = P.find(r => r.age.startsWith("50"));
  const PM = A.patrimoine_median, pj = PM[0], p60 = PM[1];
  kpis("#lge-kpis", [
    pre ? [nf(pre.logement, 1) + " %", [`du revenu des ménages part dans le logement (${pre.annee})`, `${nf(pre0.logement, 1)} % en ${pre0.annee}`], "Poids du logement"] : null,
    [nf(jeunes["2021"], 1) + " %", ["des ménages de moins de 30 ans sont propriétaires", `${nf(vieux["2021"], 1)} % des 65 ans et plus`], "Jeunes propriétaires"],
    [nf(pj.v) + " €", ["patrimoine médian d'un ménage de moins de 30 ans", `${nf(p60.v)} € à 60-69 ans, ${Math.round(p60.v / pj.v)} fois plus`], "Patrimoine"],
    ["~" + nf(Math.round(A.mises_en_chantier_2025 / 1000)) + " 000", ["logements mis en chantier en 2025", "au plus bas depuis 2000"], "Construction"],
  ]);
  $("#lge-resume").innerHTML = `<p style="margin-top:0"><b>En résumé : le logement est devenu la première dépense et le premier patrimoine des Français, et il creuse l'écart entre générations</b></p><ul>
    <li><b>Il pèse de plus en plus</b> : ${pre ? `${nf(pre.logement, 1)} % du revenu des ménages en ${pre.annee}, contre ${nf(pre0.logement, 1)} % en ${pre0.annee}` : "près d'un quart du revenu des ménages"}. Depuis 2000, le prix des logements a augmenté bien plus vite que les revenus, surtout à cause du prix des terrains.</li>
    <li><b>Il transfère de la richesse des jeunes vers les plus âgés</b> : ceux qui possédaient déjà un logement se sont enrichis sans rien faire, ceux qui doivent l'acheter ou le louer paient plus cher.</li>
    <li><b>Le faire baisser serait le levier de pouvoir d'achat le plus puissant</b> : quelques points de moins sur le logement valent plus que n'importe quelle hausse de salaire négociée. Mais cela suppose de construire beaucoup plus là où l'on manque de logements, et d'accepter que les propriétaires actuels voient leur patrimoine baisser.</li>
  </ul>`;
  const mx = 80;
  $("#lge-age").innerHTML = `<table class="pr-t"><thead><tr><th>Âge</th><th>1998</th><th>2010</th><th class="fr">2021</th></tr></thead><tbody>` +
    P.map(r => `<tr><td class="lab">${esc(r.age)}</td>${["1998", "2010", "2021"].map(y => `<td class="${y === "2021" ? "fr" : ""}"><b>${nf(r[y], 1)} %</b><span class="pr-bar"><i style="width:${(100 * r[y] / mx).toFixed(1)}%"></i></span></td>`).join("")}</tr>`).join("") + `</tbody></table>`;
  bars($("#lge-pat"), PM.map(r => ({ l: r.age, v: r.v, t: nf(r.v) + " €", c: r === pj ? "#dc2626" : "#3b6fd6" })));
  $("#lge-transfert").innerHTML = `<ul>
    <li><b>Les plus âgés sont propriétaires, les jeunes beaucoup moins</b> : ${nf(vieux["2021"], 1)} % des 65 ans et plus possèdent leur logement, contre ${nf(jeunes["2021"], 1)} % des moins de 30 ans et ${nf(P[1]["2021"], 1)} % des 30-39 ans. Chez les 50-64 ans, la part a reculé de ${nf(m5064["1998"], 1)} % en 1998 à ${nf(m5064["2021"], 1)} % en 2021 : devenir propriétaire est de plus en plus tardif et difficile.</li>
    <li><b>Quand les prix montent, l'argent passe des acheteurs aux vendeurs</b> : un jeune ménage qui achète aujourd'hui paie, avec ses revenus de travail et sur 20 à 25 ans de crédit, la plus-value encaissée par un vendeur, souvent plus âgé, qui avait acheté bien moins cher.</li>
    <li><b>Et des locataires aux propriétaires</b> : les jeunes, majoritairement locataires, versent des loyers qui ont suivi la hausse des prix, et une partie des aides au logement qu'ils reçoivent est absorbée par ces loyers (voir plus bas).</li>
    <li><b>Le patrimoine se concentre avec l'âge</b> : la moitié des ménages de moins de 30 ans ont moins de ${nf(pj.v)} € de patrimoine, contre ${nf(p60.v)} € pour les sexagénaires. Il se transmet par héritage, mais de plus en plus tard avec l'allongement de la vie : les jeunes en profitent rarement au moment où ils en ont besoin.</li>
    <li><b>Ce transfert s'ajoute à celui des retraites</b> : les actifs d'aujourd'hui financent par leurs cotisations des retraites plus généreuses que celles qu'ils toucheront (voir l'onglet <a href="#retraites">Retraites</a>).</li>
  </ul>`;
  $("#lge-leviers").innerHTML = `<ul>
    <li><b>Construire beaucoup plus là où l'on manque de logements</b> : c'est le levier principal, car les prix montent quand l'offre ne suit pas la demande dans les grandes villes. Or la France n'a commencé qu'environ ${nf(Math.round(A.mises_en_chantier_2025 / 1000))} 000 logements en 2025, au plus bas depuis 2000. Cela passe par des règles d'urbanisme plus souples, plus de hauteur et de densité près des transports, des délais de permis plus courts, et moins de recours contre les projets.</li>
    <li><b>Agir sur le prix des terrains</b>, première cause de la hausse : entre 2000 et 2018, le prix des terrains a triplé, celui de la construction n'a pris que 50 %. Taxer davantage la valeur des terrains et moins les ventes inciterait à construire sur les terrains bien placés et à moins les garder en réserve, et faciliterait les déménagements (les frais de vente, autour de 7 à 8 % du prix, freinent aujourd'hui la mobilité).</li>
    <li><b>Ne pas compter sur les aides</b> : verser plus d'aides au logement sans construire plus fait surtout monter les loyers. Une étude de l'INSEE estimait qu'entre 50 % et 80 % des aides perçues par les ménages modestes ont été absorbées par la hausse de leurs loyers (Fack, 2005).</li>
    <li><b>Ne pas compter non plus sur le crédit facile</b> : allonger la durée des prêts ou baisser les taux permet d'emprunter plus, mais quand l'offre ne suit pas, cela se retrouve surtout dans les prix (voir le graphique de Friggit plus haut, et le temps de remboursement d'un 50 m² à Paris dans la partie 2).</li>
    <li><b>Mieux utiliser ce qui existe</b> : remettre sur le marché des logements vacants, transformer des bureaux vides en logements, encourager le travail à distance et l'installation dans les villes moyennes, où les prix sont bien plus bas.</li>
    <li><b>Ce que font d'autres pays</b> : le Japon a fixé des règles d'urbanisme nationales et souples, et Tokyo construit beaucoup, si bien que les prix y sont restés stables pendant des décennies malgré la hausse de la population ; Vienne loge une grande partie de ses habitants dans des logements municipaux ou aidés, ce qui modère les loyers de toute la ville ; en Allemagne et en Suisse, la location de longue durée est la norme, et l'achat n'est pas vu comme le seul moyen de se constituer un patrimoine.</li>
    <li><b>Pourquoi c'est si difficile</b> : faire baisser les prix, c'est faire baisser le patrimoine de près de six ménages sur dix, qui sont aussi souvent les riverains qui s'opposent aux nouvelles constructions près de chez eux. Le logement cher est confortable pour ceux qui sont déjà propriétaires.</li>
  </ul>`;
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
