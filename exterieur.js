/* Patrimoine : le solde avec l'étranger, et comment des déficits répétés font perdre du patrimoine au pays */
(() => {
"use strict";
let X = null;
const $ = s => document.querySelector(s);
const COUL = { FR: "#dc2626", DE: "#334155", IT: "#16a34a", ES: "#eab308", US: "#3b6fd6" };
async function init() {
  if (!window.TH || !$("#ext-courant")) { setTimeout(init, 100); return; }
  try { X = await fetch("data/exterieur.json", { cache: "no-cache" }).then(r => r.json()); } catch (e) { return; }
  try { draw(); } catch (e) { console.error("exterieur", e); }
}
function draw() {
  const { lineChart, legend } = window.TH, f1 = v => v.toLocaleString("fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const nom = Object.fromEntries(X.pays), sg = v => (v > 0 ? "+" : "") + f1(v) + " %";
  const C = X.courant.filter(r => r.annee >= 1980), Pz = X.position.filter(r => r.FR != null);
  lineChart($("#ext-courant"), C, X.pays.map(([g]) => ({ k: g, l: nom[g], c: COUL[g] })), { nozero: true, yfmt: v => v + " %", vfmt: sg, h: 260 });
  legend("#ext-courant-legend", X.pays.map(([g]) => [nom[g], COUL[g]]));
  const PG = X.pays.filter(([g]) => Pz.some(r => r[g] != null));
  lineChart($("#ext-position"), Pz, PG.map(([g]) => ({ k: g, l: nom[g], c: COUL[g] })), { nozero: true, yfmt: v => v + " %", vfmt: sg, h: 260 });
  legend("#ext-position-legend", PG.map(([g]) => [nom[g], COUL[g]]));
  const last = Pz.at(-1), p00 = Pz.find(r => r.annee === 2000), cL = C.filter(r => r.FR != null).at(-1);
  const deficits = C.filter(r => r.annee >= 2005 && r.FR < 0).length, n05 = C.filter(r => r.annee >= 2005 && r.FR != null).length;
  const md = window.PEI?.length ? window.PEI.at(-1) : null;
  $("#ext-txt").innerHTML = `<ul>
    <li><b>Oui : un pays qui dépense plus qu'il ne gagne avec l'étranger s'appauvrit peu à peu.</b> Le solde courant mesure ce que le pays vend et gagne à l'étranger (exportations, revenus de ses placements) moins ce qu'il achète et verse. Un déficit se paie en empruntant à l'étranger ou en lui vendant des actifs (actions, immeubles, entreprises). Chaque année de déficit augmente donc ce que le pays doit au reste du monde.</li>
    <li><b>La France est en déficit ${deficits} années sur ${n05} depuis 2005</b>, après un excédent à la fin des années 1990 : en tout, environ ${f1(Math.abs(X.cumul_fr_2005))} points de PIB. Les déficits sont modestes chaque année (${sg(cL.FR)} en ${cL.annee}), mais ils s'accumulent.</li>
    <li><b>Résultat : la France est passée de créancière à débitrice</b>. Sa position extérieure nette, ce qu'elle possède à l'étranger moins ce qu'elle lui doit, est passée de ${sg(p00.FR)} du PIB en 2000 à <b>${sg(last.FR)}</b> en ${last.annee}. L'Allemagne, en excédent depuis vingt ans, a fait le chemin inverse (${sg(last.DE)}). L'Italie, après dix ans d'excédents, est redevenue créancière (${sg(last.IT)}).</li>
    <li><b>La position bouge aussi avec les prix</b> : quand les actions françaises détenues par des étrangers montent, la France « doit » davantage, sans avoir rien emprunté. C'est pourquoi elle a plus reculé que les seuls déficits cumulés.</li>
    <li><b>Concrètement</b> : une partie des intérêts, dividendes et loyers produits en France part chaque année à l'étranger, et le pays dépend de la confiance des investisseurs étrangers, qui détiennent aussi plus de la moitié de la dette de l'État. Les États-Unis vivent en déficit depuis quarante ans sans crise, mais grâce au dollar, monnaie mondiale ; la France n'a pas ce privilège.</li>
    <li><b>Un déficit n'est pas toujours mauvais</b> : emprunter pour investir (usines, réseaux, recherche) peut enrichir plus tard. Le problème vient quand on emprunte pour consommer : la dette reste, sans revenus futurs pour la rembourser.</li>
  </ul>`;
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
