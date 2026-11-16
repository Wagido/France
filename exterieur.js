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
  const md = window.PEI?.length ? window.PEI.at(-1) : null;
  const CO = X.commercial, cmL = CO.at(-1), defC = CO.filter(r => r.annee >= 2000 && r.FR < 0).length, nC = CO.filter(r => r.annee >= 2000).length;
  const PU = X.public, puL = PU.at(-1), trop = PU.filter(r => -r.solde_FR > r.inv_FR);
  lineChart($("#ext-public"), PU.map(r => ({ annee: r.annee, inv: r.inv_FR, def: -r.solde_FR, invDE: r.inv_DE, defDE: -r.solde_DE })),
    [{ k: "def", l: "France : déficit public", c: "#dc2626" }, { k: "inv", l: "France : investissement public", c: "#16a34a" }, { k: "defDE", l: "Allemagne : déficit public", c: "#dc2626", dash: "4 4" }, { k: "invDE", l: "Allemagne : investissement public", c: "#16a34a", dash: "4 4" }],
    { yfmt: v => v + " %", vfmt: v => f1(v) + " % du PIB", h: 240, xticks: 8 });
  legend("#ext-public-legend", [["Déficit public, France", "#dc2626"], ["Investissement public, France", "#16a34a"], ["Allemagne (pointillés)", "#94a3b8", true]]);
  const ei = $("#ext-intro");
  if (ei) ei.innerHTML = `<li><b>La balance commerciale</b>, qui dépend des échanges du secteur privé : quand le pays achète plus à l'étranger qu'il ne lui vend (${defC} années sur ${nC} depuis 2000), il paie la différence en empruntant au reste du monde ou en lui vendant des actifs. Année après année, une partie du patrimoine français passe à l'étranger : la France lui doit aujourd'hui ${f1(Math.abs(last.FR))} % de son PIB de plus qu'elle n'y possède.</li>
      <li><b>La dette publique</b>, qui vient de l'État : chaque année de déficit public (${f1(-puL.solde_FR)} % du PIB en ${puL.annee}) s'ajoute à la dette et diminue le patrimoine net de l'État. Ce n'est pas grave si l'argent emprunté finance des routes, des écoles ou des réseaux qui resteront ; ça l'est s'il paie les dépenses courantes, ce qui est en partie le cas en France. Or seul l'État (et la Sécurité sociale, à travers la Cades) peut emprunter pour payer ses dépenses courantes : les communes, départements et régions n'ont le droit d'emprunter que pour investir, leur budget de fonctionnement devant être voté à l'équilibre (règle d'or, article L1612-4 du code général des collectivités territoriales).</li>`;
  $("#ext-txt").innerHTML = `<p style="margin-top:0"><b>Deux choses différentes, qu'on mélange souvent : l'une vient du privé, l'autre de l'État</b></p>
    <ul><li><b>La balance commerciale</b> dépend des échanges du <b>secteur privé</b> : ce sont les entreprises et les ménages qui achètent et vendent à l'étranger.</li><li><b>La dette publique</b> vient de <b>l'État</b> (et de la Sécurité sociale) : c'est lui qui emprunte pour couvrir son déficit.</li><li>Les deux se rejoignent quand l'étranger finance, avec les euros qu'il gagne, la dette de l'État (expliqué plus bas).</li></ul>
    <p style="margin-bottom:2px"><b>1. D'un côté, la balance commerciale, déficitaire, qui vient du secteur privé : les entreprises et les ménages achètent plus à l'étranger qu'ils ne lui vendent</b></p>
    <ul>
      <li><b>Les chiffres</b> : en biens et services, la France est en déficit ${defC} années sur ${nC} depuis 2000 (${sg(cmL.FR)} du PIB en ${cmL.annee}). Ses placements à l'étranger rapportent un peu, mais le solde total reste négatif presque chaque année (graphique de gauche).</li>
      <li><b>Comment on paie ce déficit</b> : en empruntant à l'étranger, ou en lui vendant des actifs (actions, entreprises, immeubles). Comme un ménage qui dépense plus qu'il ne gagne et pioche dans son épargne.</li>
      <li><b>Le résultat</b> : la France possédait à l'étranger un peu plus qu'elle ne lui devait en 2000 (${sg(p00.FR)} du PIB) ; en ${last.annee}, elle lui doit ${f1(Math.abs(last.FR))} % de son PIB de plus qu'elle n'y possède (graphique de droite). L'Allemagne, en excédent depuis vingt ans, a l'inverse : ${sg(last.DE)}. Oui, un pays en déficit permanent s'appauvrit peu à peu face au reste du monde.</li>
    </ul>
    <p style="margin-bottom:2px"><b>Mais qui paie le déficit de la balance commerciale ? Prenons l'exemple du pétrole : ce n'est pas l'argent public qui l'achète</b></p>
    <ul>
      <li><b>Ce sont surtout les entreprises et les ménages qui achètent à l'étranger</b>, avec leur propre argent. Le pétrole est acheté par TotalEnergies, des raffineurs ou des négociants, puis revendu aux automobilistes ; l'État n'en achète presque pas, il prélève seulement des taxes à la pompe. Un téléphone fabriqué en Chine est importé par Apple ou Samsung, vendu par la Fnac, payé par vous.</li>
      <li><b>Le fournisseur étranger se retrouve avec des euros</b>, et il n'a que deux choses à en faire : acheter des produits français (Airbus, vins, luxe : ce sont nos exportations), ou placer cet argent en France (obligations de l'État, actions du CAC 40, immeubles, entreprises, dépôts dans une banque).</li>
      <li><b>Si la France importe 100 et exporte 90, les 10 restants reviennent forcément en placements étrangers en France</b> : c'est une égalité comptable. Le pays ne « paie » pas son déficit avec un chèque ; il cède au reste du monde des titres de dette, des actions ou des biens. C'est ainsi que sa position extérieure se dégrade.</li>
      <li><b>Le lien avec l'argent public</b> : un pays doit emprunter à l'étranger quand il épargne moins qu'il n'investit. Les ménages français épargnent beaucoup, mais l'État dépense plus qu'il ne gagne (déficit de ${f1(-puL.solde_FR)} % du PIB), ce qui absorbe une bonne partie de cette épargne. Pour se financer, il émet des obligations, dont plus de la moitié sont achetées par des étrangers : une bonne partie des euros gagnés par l'étranger en nous vendant ses produits revient financer le déficit de l'État.</li>
      <li><b>En résumé</b> : ce ne sont pas les pouvoirs publics qui importent, mais ce sont eux qui ont le plus besoin de l'argent de l'étranger. Les économistes parlent de « déficits jumeaux » : un déficit public pousse le pays vers un déficit extérieur. La France en est une version modérée, car l'épargne élevée des ménages compense une grande partie du déficit de l'État.</li>
    </ul>
    <p style="margin-bottom:2px"><b>2. De l'autre, la dette publique, qui vient de l'État : utile si elle finance de l'investissement, nocive si elle paie les dépenses courantes</b></p>
    <ul>
      <li><b>Comme pour un ménage</b> : emprunter pour acheter un logement ou une machine, c'est s'enrichir plus tard ; emprunter pour payer ses courses, c'est s'appauvrir. C'est la « règle d'or » : on n'emprunte pas plus que ce qu'on investit.</li>
      <li><b>L'État français investit beaucoup</b> : ${f1(puL.inv_FR)} % du PIB en ${puL.annee} (écoles, routes, hôpitaux, équipement militaire), plus que l'Allemagne (${f1(puL.inv_DE)} %) et la moyenne européenne (${f1(puL.inv_EU27_2020)} %).</li>
      <li><b>Mais son déficit est encore plus gros</b> : ${f1(-puL.solde_FR)} % du PIB. ${trop.length === PU.length ? "Chaque année depuis " + PU[0].annee : trop.length + " années sur " + PU.length + " depuis " + PU[0].annee}, il a dépassé l'investissement (graphique ci-dessous) : une partie des retraites, salaires et intérêts est donc payée à crédit. L'Allemagne, elle, emprunte moins que ce qu'elle investit (déficit de ${f1(-puL.solde_DE)} %).</li>
      <li><b>Les deux se rejoignent</b> : plus de la moitié de la dette de l'État est détenue par des étrangers. Quand le pays dépense plus qu'il ne produit, c'est en partie le reste du monde qui le finance, et il faudra le rembourser.</li>
    </ul>
    <p class="muted" style="font-size:.8rem;margin-bottom:0">Nuances : la position extérieure bouge aussi avec le prix des actions détenues par les étrangers ; les États-Unis vivent en déficit depuis quarante ans sans crise, grâce au dollar, monnaie mondiale, un privilège que la France n'a pas.</p>`;
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
