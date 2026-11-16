/* Industrie : la désindustrialisation, du « fabless » de Serge Tchuruk à la réindustrialisation */
(() => {
"use strict";
let X = null;
const $ = s => document.querySelector(s);
const COUL = { FR: "#dc2626", DE: "#334155", IT: "#16a34a", ES: "#eab308", EU27_2020: "#94a3b8" };
async function init() {
  if (!window.TH || !$("#di-va")) { setTimeout(init, 100); return; }
  try { X = await fetch("data/desindustrialisation.json", { cache: "no-cache" }).then(r => r.json()); } catch (e) { return; }
  try { draw(); } catch (e) { console.error("desindus", e); }
}
function draw() {
  const { lineChart, legend, kpis } = window.TH, f1 = v => v.toLocaleString("fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const nom = Object.fromEntries(X.pays), L = X.pays.map(([g]) => ({ k: g, l: nom[g], c: COUL[g], dash: g === "EU27_2020" ? "4 4" : null }));
  lineChart($("#di-va"), X.va, L, { yfmt: v => v + " %", vfmt: v => f1(v) + " %", h: 260 });
  legend("#di-va-legend", X.pays.map(([g]) => [nom[g], COUL[g], g === "EU27_2020"]));
  lineChart($("#di-emp"), X.emplois_fr, [{ k: "v", l: "Emplois dans l'industrie manufacturière", c: "#dc2626" }], { yfmt: v => f1(v) + " M", vfmt: v => f1(v) + " millions", h: 260 });
  const va = X.va, v0 = va.find(r => r.FR != null), vL = va.at(-1), v00 = va.find(r => r.annee === 2000), v20 = va.find(r => r.annee === 2020);
  const E = X.emplois_fr, e0 = E[0], eL = E.at(-1), e80 = E.find(r => r.annee === 1980), e07 = E.find(r => r.annee === 2007), emin = E.reduce((a, r) => r.v < a.v ? r : a);
  const em = X.emploi.at(-1);
  kpis("#di-kpis", [
    [f1(vL.FR) + " %", [`de la valeur ajoutée vient de l'industrie en ${vL.annee}`, `${f1(v0.FR)} % en ${v0.annee}`], "Poids de l'industrie"],
    [f1(eL.v) + " M", [`d'emplois industriels en ${eL.annee}`, `${f1(e0.v)} M en ${e0.annee} : ${Math.round(100 * (1 - eL.v / e0.v))} % de moins`], "Emplois"],
    [f1(vL.DE) + " %", [`en Allemagne`, `${f1(vL.IT)} % en Italie, ${f1(vL.EU27_2020)} % en moyenne dans l'UE`], "Les voisins"],
    [f1(em.FR) + " %", [`des emplois sont dans l'industrie en France`, `${f1(em.DE)} % en Allemagne`], "Part des emplois"],
  ]);
  $("#di-txt").innerHTML = `<p style="margin-top:0"><b>1. Les chiffres : la France s'est désindustrialisée plus que ses voisins</b></p><ul>
      <li>L'industrie manufacturière représentait ${f1(v0.FR)} % de la valeur ajoutée en ${v0.annee}, ${f1(v00.FR)} % en 2000, et <b>${f1(vL.FR)} % en ${vL.annee}</b>, contre ${f1(vL.DE)} % en Allemagne et ${f1(vL.IT)} % en Italie. Le rapport Gallois (2012) classait déjà la France 15<sup>e</sup> sur 17 pays de la zone euro.</li>
      <li>Les emplois industriels sont passés de ${f1(e0.v)} millions en ${e0.annee} à <b>${f1(eL.v)} millions</b> en ${eL.annee}, dont ${f1(e80.v - e07.v)} millions perdus entre 1980 et 2007.</li>
    </ul>
    <p style="margin-bottom:2px"><b>2. Le pari de « l'entreprise sans usines » : Serge Tchuruk et Alcatel</b></p><ul>
      <li><b>Juin 2001</b> : Serge Tchuruk, patron d'Alcatel, alors champion mondial des équipements de télécommunications, annonce au <i>Wall Street Journal</i> : « Nous allons très bientôt être une entreprise sans usines » (<i>fabless</i>). Le groupe veut passer d'environ 120 usines à une douzaine au plus.</li>
      <li><b>L'idée, à la mode à l'époque</b> : garder ce qui rapporte le plus (la conception, la recherche, la marque, la vente) et confier la fabrication, jugée sans valeur, à des sous-traitants, surtout en Asie. C'est le modèle de Nike ou d'Apple.</li>
      <li><b>Le résultat</b> : Alcatel fusionne avec l'américain Lucent en 2006, accumule les pertes, et finit racheté par le finlandais Nokia en 2016. Pendant ce temps, le chinois Huawei, qui fabriquait lui-même une grande partie de ses équipements, devient numéro un mondial du secteur.</li>
      <li><b>La leçon tirée depuis</b> : l'usine n'est pas qu'un lieu d'exécution. C'est là que l'on apprend à fabriquer, que l'on améliore les produits et que l'on innove ; sans production, la recherche s'étiole, et les savoir-faire partent avec les usines. Le modèle sans usines réussit surtout à des entreprises qui dominent leur marché par la marque ou la technologie, comme Apple ; pour la plupart des industriels, il fragilise.</li>
    </ul>
    <p style="margin-bottom:2px"><b>3. Pourquoi ? Une partie est normale, une partie non</b></p><ul>
      <li><b>Une partie est commune à tous les pays riches</b> : l'industrie gagne en productivité, il faut moins de bras pour produire autant, et les ménages dépensent une part croissante de leur revenu en services.</li>
      <li><b>Une partie est statistique</b> : les industriels ont confié à des sociétés de services le nettoyage, l'informatique, la comptabilité ou l'intérim. Ces emplois existent toujours, mais sont comptés dans les services : environ un quart des emplois industriels perdus entre 1980 et 2007 (Demmou, direction générale du Trésor, 2010).</li>
      <li><b>Une partie vient de la concurrence étrangère</b> : de 13 % à 45 % des pertes selon la méthode de calcul (même étude). Les grands groupes français, plus que les allemands, ont produit à l'étranger, comme les constructeurs automobiles.</li>
      <li><b>Et une partie est propre à la France</b> : des produits de milieu de gamme, plus sensibles aux prix que le haut de gamme allemand ; des impôts sur la production plus élevés que chez les voisins (voir l'onglet <a href="#argent-public">Argent public</a>) ; et une préférence longtemps affichée pour une économie de services.</li>
    </ul>
    <p style="margin-bottom:2px"><b>4. Les conséquences, et le retournement</b></p><ul>
      <li><b>Un déficit commercial</b> : la France achète à l'étranger des biens qu'elle ne fabrique plus (voir l'onglet <a href="#patrimoine">Patrimoine</a>, balance commerciale).</li>
      <li><b>Une dépendance</b>, révélée en 2020 par la pénurie de masques et de médicaments, et par la crise de l'énergie en 2022.</li>
      <li><b>Des territoires touchés</b> : la fermeture d'une usine vide souvent toute une ville moyenne de ses emplois et de ses commerces.</li>
      <li><b>Depuis le milieu des années 2010, la chute s'est arrêtée</b> : la part de l'industrie s'est stabilisée autour de ${f1(v20.FR)} % à ${f1(vL.FR)} %, avec des baisses d'impôts de production et des aides à la relocalisation. Mais le niveau reste bien en dessous de celui des voisins.</li>
    </ul>`;
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
