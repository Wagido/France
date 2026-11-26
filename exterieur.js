/* Patrimoine : le solde avec l'étranger, et comment des déficits répétés font perdre du patrimoine au pays */
(() => {
"use strict";
let X = null;
const $ = s => document.querySelector(s);
const COUL = { FR: "#dc2626", DE: "#334155", IT: "#16a34a", ES: "#eab308", US: "#3b6fd6" };
async function init() {
  if (!window.TH || !$("#ext-courant")) { setTimeout(init, 100); return; }
  try { X = await fetch("data/exterieur.json", { cache: "no-cache" }).then(r => r.json()); } catch (e) { return; }
  try { const M = await fetch("data/monnaie.json", { cache: "no-cache" }).then(r => r.json()); X.target = M.target; X.target_mois = M.target_mois; } catch (e) {}
  try { draw(); } catch (e) { console.error("exterieur", e); }
  try { drawJumeaux(); } catch (e) { console.error("exterieur jumeaux", e); }
  try { trajet(); } catch (e) { console.error("exterieur trajet", e); }
  try { secteurs("pc"); const sm = $("#ext-sec-mode"); if (sm) sm.onclick = ev => { const b = ev.target.closest("button"); if (!b) return; sm.querySelectorAll("button").forEach(x => x.setAttribute("aria-pressed", x === b)); secteurs(b.dataset.m); }; } catch (e) { console.error("exterieur secteurs", e); }
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
  const sg2 = v => (v > 0 ? "+" : "") + Math.round(v).toLocaleString("fr-FR");
  const md = window.PEI?.length ? window.PEI.at(-1) : null;
  const CO = X.commercial, cmL = CO.at(-1), defC = CO.filter(r => r.annee >= 2000 && r.FR < 0).length, nC = CO.filter(r => r.annee >= 2000).length;
  const PU = X.public, puL = PU.at(-1), trop = PU.filter(r => -r.solde_FR > r.inv_FR);
  lineChart($("#ext-public"), PU.map(r => ({ annee: r.annee, inv: r.inv_FR, net: r.ccf_FR == null ? null : Math.round((r.inv_FR - r.ccf_FR) * 10) / 10, def: -r.solde_FR, invDE: r.inv_DE, defDE: -r.solde_DE })),
    [{ k: "def", l: "France : déficit public", c: "#dc2626" }, { k: "inv", l: "France : investissement public brut", c: "#16a34a" }, { k: "net", l: "France : investissement public net de l'usure", c: "#065f46" }, { k: "defDE", l: "Allemagne : déficit public", c: "#dc2626", dash: "4 4" }, { k: "invDE", l: "Allemagne : investissement public", c: "#16a34a", dash: "4 4" }],
    { yfmt: v => v + " %", vfmt: v => f1(v) + " % du PIB", h: 240, xticks: 8 });
  legend("#ext-public-legend", [["Déficit public, France", "#dc2626"], ["Investissement public brut, France", "#16a34a"], ["Investissement net (après usure), France", "#065f46"], ["Allemagne (pointillés)", "#94a3b8", true]]);
  const ei = $("#ext-intro");
  if (ei) ei.innerHTML = `<li><b>Le solde avec l'étranger</b>, celui de tout le pays (ménages, entreprises et administrations) : quand le pays achète plus à l'étranger qu'il ne lui vend (${defC} années sur ${nC} depuis 2000), il paie la différence en empruntant au reste du monde ou en lui vendant des actifs. Année après année, une partie du patrimoine français passe à l'étranger : la France lui doit aujourd'hui ${f1(Math.abs(last.FR))} % de son PIB de plus qu'elle n'y possède.</li>
      <li><b>La dette publique</b>, qui vient de l'État : chaque année de déficit public (${f1(-puL.solde_FR)} % du PIB en ${puL.annee}) s'ajoute à la dette et diminue le patrimoine net de l'État. Ce n'est pas grave si l'argent emprunté finance des routes, des écoles ou des réseaux qui resteront ; ça l'est s'il paie les dépenses courantes, ce qui est en partie le cas en France. Or seul l'État (et la Sécurité sociale, à travers la Cades) peut emprunter pour payer ses dépenses courantes : les communes, départements et régions n'ont le droit d'emprunter que pour investir, leur budget de fonctionnement devant être voté à l'équilibre (règle d'or, article L1612-4 du code général des collectivités territoriales).</li>`;
  $("#ext-txt").innerHTML = `<h4 class="enc-t">Le solde avec l'étranger et la dette publique : comment ça marche</h4>
    <p class="enc-som"><a href="#patrimoine" data-to="enc-a">1. Deux soldes, une égalité</a> · <a href="#patrimoine" data-to="enc-b">2. La France face à l'étranger</a> · <a href="#patrimoine" data-to="enc-c">3. Suivre 30 000 euros dans la zone euro</a> · <a href="#patrimoine" data-to="enc-d">4. Et avec des dollars ?</a> · <a href="#patrimoine" data-to="enc-e">5. La dette publique</a> · <a href="#patrimoine" data-to="enc-f">En résumé</a></p>

    <h4 class="enc-h" id="enc-a">1. Deux soldes différents, reliés par une égalité</h4>
    <p>On confond souvent deux choses. Le <b>solde extérieur</b> (balance commerciale et revenus) est celui de <b>tout le pays</b>, ménages, entreprises et administrations ensemble : il dit si la France, dans son ensemble, dépense plus qu'elle ne produit. Le <b>solde public</b> est celui de <b>l'État</b>, des collectivités et de la Sécurité sociale : il dit si les administrations dépensent plus qu'elles ne prélèvent.</p>
    <p>Les deux sont reliés par une égalité comptable, vraie chaque année : <b>solde extérieur = solde du secteur privé + solde public</b>, le solde du privé étant ce que ménages et entreprises épargnent de plus qu'ils n'investissent. En ${puL.annee}, la France a un solde extérieur courant de ${sg(cL.FR)} du PIB et un solde public de ${sg(puL.solde_FR)} : le secteur privé dégage donc un excédent d'environ ${f1(cL.FR - puL.solde_FR)} % du PIB, porté surtout par l'épargne des ménages. Ce n'est pas le privé qui emprunte à l'étranger : il prête, en grande partie à l'État. Le pays dans son ensemble n'emprunte à l'étranger que la petite différence.</p>
    <p style="margin:6px 0 4px"><b>Les trois soldes de la France depuis 1980</b> : le solde extérieur (noir) est, chaque année, la somme des deux autres.</p>
    <div class="seg" id="ext-sec-mode" role="radiogroup" aria-label="Unité" style="margin-bottom:6px"><button type="button" data-m="pc" aria-pressed="true">En % du PIB (courbes)</button><button type="button" data-m="md" aria-pressed="false">En milliards d'euros (barres empilées)</button></div>
    <div id="ext-secteurs" class="chart"></div><div class="legend-row" id="ext-secteurs-legend"></div>
    <p class="muted" style="font-size:.8rem;margin:2px 0 8px">Au-dessus de zéro, le secteur prête (il épargne plus qu'il n'investit, ou l'administration encaisse plus qu'elle ne dépense) ; en dessous, il emprunte. Depuis 2008, le déficit public (rouge) est presque entièrement compensé par l'épargne du privé (vert) : le pays emprunte peu à l'étranger (noir), mais l'État emprunte beaucoup aux Français. Source : FMI, <i>World Economic Outlook</i> ; solde privé calculé par différence.</p>

    <h4 class="enc-h" id="enc-b">2. La France face à l'étranger : un petit déficit, répété</h4>
    <p>En biens et services, la France est en déficit ${defC} années sur ${nC} depuis 2000 (${sg(cmL.FR)} du PIB en ${cmL.annee}). Ses placements à l'étranger lui rapportent un peu, mais le solde total reste négatif presque chaque année (graphique de gauche, au-dessus de l'encadré).</p>
    <p>Ces petits déficits s'additionnent. La France possédait à l'étranger un peu plus qu'elle ne lui devait en 2000 (${sg(p00.FR)} du PIB) ; en ${last.annee}, elle lui doit ${f1(Math.abs(last.FR))} % de son PIB de plus qu'elle n'y possède (graphique de droite). L'Allemagne, en excédent depuis vingt ans, est dans la situation inverse : ${sg(last.DE)}. Un pays en déficit répété s'appauvrit peu à peu face au reste du monde : chaque année, une partie des intérêts, dividendes et loyers produits sur son sol part à l'étranger. Pour comprendre comment, suivons l'argent d'un achat.</p>

    <h4 class="enc-h" id="enc-c">3. Suivre 30 000 euros dans la zone euro : un Français achète une Volkswagen</h4>
    <p><b>Le paiement.</b> L'acheteur paie depuis son compte dans une banque française ; Volkswagen est payé sur son compte dans une banque allemande. Or un dépôt est une dette de <i>sa</i> banque : un euro sur un compte français et un euro sur un compte allemand ne sont pas tout à fait la même chose (voir l'onglet <a href="#monnaie" data-to="mo-2-6">Monnaie</a>, 2.6). Pour que l'argent passe d'une banque à l'autre, elles se règlent en <b>monnaie de banque centrale</b>, la seule vraiment unique dans la zone : les réserves de la banque française à la Banque de France baissent de 30 000 euros, celles de la banque allemande à la Bundesbank montent d'autant. Ce transfert laisse une trace : la Banque de France doit 30 000 euros de plus à l'Eurosystème, la Bundesbank y détient 30 000 euros de plus. Ce sont les <b>soldes TARGET</b>. Au moment même du paiement, l'achat est donc financé automatiquement par les banques centrales, sans que personne ne l'ait décidé, et sans un euro d'argent public (l'État ne prélève que la TVA).</p>
    <p><b>Volkswagen dépense cet argent en Allemagne.</b> Il paie ses ouvriers, ses fournisseurs (souvent allemands eux aussi), ses impôts en Allemagne, et verse des dividendes à ses actionnaires. Les ouvriers de Wolfsburg achètent leur pain chez le boulanger de Wolfsburg.</p>
    <p><b>Premier effet, immédiat : moins d'activité en France.</b> Si la voiture avait été fabriquée en France, ces 30 000 euros auraient payé des ouvriers français, qui auraient acheté leur pain chez le boulanger français, fait leurs courses à la supérette, payé le coiffeur, qui auraient eux-mêmes dépensé ailleurs en France. L'argent a fait vivre l'économie allemande au lieu de la française : moins d'activité, moins d'emplois et moins de recettes fiscales en France. C'est le lien direct entre déficit commercial et désindustrialisation (voir l'onglet <a href="#industrie">Industrie et innovation</a>).</p>
    <p><b>Que deviennent ensuite ces euros ?</b> Ils restent quelque part, et leurs détenteurs allemands ont le choix :</p>
    <ul>
      <li><b>les garder sur un compte en Allemagne, ou les dépenser en Allemagne</b>, le cas le plus fréquent : l'argent passe de compte allemand en compte allemand, et la créance de l'Allemagne sur la France reste détenue, au bout de la chaîne, par la Bundesbank (le solde TARGET) ;</li>
      <li><b>acheter des produits français</b> (un Airbus, du vin, des vacances en France) : la monnaie de banque centrale revient vers la Banque de France, le solde TARGET se referme, l'argent fait travailler des Français ; c'est une exportation, et le déficit est comblé ;</li>
      <li><b>les placer en France</b> : obligations de l'État français (un peu plus de la moitié de la dette publique négociable est détenue par des non-résidents), actions d'entreprises françaises (environ 40 % du capital du CAC 40 appartient à l'étranger), un immeuble, une entreprise. Le solde TARGET se referme aussi, mais un Allemand détient désormais une créance sur la France ou un morceau de France.</li>
    </ul>
    <p><b>Second effet, cumulatif : la France doit davantage au reste du monde.</b> Dans tous les cas sauf l'achat de produits français, le déficit devient une dette envers l'étranger : une créance des banques centrales (le solde TARGET de la Banque de France${X.target ? `, ${Math.round(X.target.at(-1).fr)} milliards d'euros en ${X.target_mois ? new Date(X.target_mois + "-15").toLocaleDateString("fr-FR", { month: "long", year: "numeric" }) : X.target.at(-1).annee}, contre ${sg2(X.target.at(-1).de)} milliards pour la Bundesbank` : ""}), des obligations et des dépôts détenus par des étrangers, ou des actions, immeubles et entreprises passés à des propriétaires étrangers. C'est le sens de « le pays paie son déficit en empruntant ou en vendant des actifs ». Personne n'est forcé de vendre : cela passe par des milliers d'opérations volontaires, souvent au meilleur prix pour le vendeur français.</p>
    <div id="ext-trajet" class="ext-trajet"></div>
    <p><b>Pourquoi ces soldes TARGET comptent.</b> Tant que la zone euro tient, ce sont des écritures entre banques centrales, sans date de remboursement, rémunérées au taux de la BCE avec des intérêts mis en commun entre les banques centrales. Mais ils montent fortement quand l'argent fuit un pays : de 2010 à 2012, Grecs, Espagnols et Italiens ont transféré leurs dépôts vers des banques allemandes, par peur d'une sortie de l'euro, et ce sont les banques centrales qui ont comblé le trou. C'est là qu'on voit qu'un euro grec n'était pas tout à fait un euro allemand (détails et graphique dans l'onglet <a href="#monnaie" data-to="mo-2-6">Monnaie</a>, 2.6).</p>

    <h4 class="enc-h" id="enc-d">4. Et avec des dollars ? Un Français achète une voiture fabriquée aux États-Unis</h4>
    <p><b>Il faut changer des euros en dollars.</b> Le constructeur américain veut être payé en dollars. La banque de l'acheteur vend ses 30 000 euros sur le marché des changes et reçoit environ 32 000 à 35 000 dollars selon le cours du jour, qu'elle verse au constructeur sur son compte aux États-Unis. Il n'y a pas de solde TARGET : l'Eurosystème s'arrête aux frontières de la zone euro.</p>
    <p><b>Quelqu'un a dû accepter ces euros.</b> Sur le marché des changes, chaque vente d'euros a un acheteur en face, qui cède ses dollars contre des euros. Qui veut des euros ? Un Américain qui achète un Airbus, du champagne ou un voyage à Paris (une exportation de la zone euro), ou un investisseur qui veut placer en euros : obligations de l'État français, actions, immeubles. On retrouve les mêmes voies qu'avec l'Allemagne, mais cette fois <b>il faut trouver un acheteur volontaire</b>.</p>
    <p><b>S'il n'y en a pas assez, le prix s'ajuste.</b> Si l'Europe vend plus d'euros qu'on ne veut en acheter, <b>l'euro baisse</b> face au dollar : les voitures américaines deviennent plus chères pour les Français, les produits européens moins chers pour les Américains. Les importations reculent, les exportations augmentent, et le déséquilibre se corrige en partie. Les deux effets restent les mêmes : tout de suite, les salaires de cette voiture sont payés aux États-Unis ; à la longue, des étrangers détiennent davantage de créances ou d'actifs européens, ou l'euro a baissé.</p>
    <div class="table-scroll" style="margin:4px 0 8px"><table class="cmp-t ro-t">
      <thead><tr><th></th><th>Volkswagen (même monnaie)</th><th>Voiture américaine (dollars)</th></tr></thead>
      <tbody>
        <tr><td><b>Change</b></td><td>Aucun : un euro est un euro</td><td>Il faut vendre des euros contre des dollars</td></tr>
        <tr><td><b>Financement du déficit</b></td><td>Automatique, par les banques centrales (TARGET)</td><td>Il faut un acheteur volontaire d'euros : exportations ou placements en euros</td></tr>
        <tr><td><b>Si personne ne veut des euros</b></td><td>Rien ne bouge tout de suite : le solde TARGET grossit</td><td>L'euro baisse, ce qui renchérit les importations et aide les exportations</td></tr>
        <tr><td><b>Comment se corrige un déficit durable</b></td><td>Pas de dévaluation possible entre la France et l'Allemagne : il faut que les prix et les salaires français progressent moins vite, ou que les produits français gagnent en qualité</td><td>Le taux de change fait une partie du travail, pour toute la zone euro à la fois</td></tr>
      </tbody></table></div>
    <p>C'est la grande différence entre les échanges à l'intérieur de la zone euro et avec le reste du monde : entre la France et l'Allemagne, la monnaie commune supprime le risque de change, mais aussi l'ajustement par le change. Le déficit se finance tout seul, mais ne se corrige pas tout seul. Avant l'euro, la France dévaluait le franc (1958, 1969, 1982-1983 ; voir l'onglet <a href="#simulateur">Couper la dépense ?</a>). Et les États-Unis sont un cas à part : comme le monde entier veut des dollars, ils vivent en déficit depuis quarante ans sans que leur monnaie s'effondre (le « privilège exorbitant », voir l'onglet <a href="#monnaie" data-to="mo-1-6">Monnaie</a>, 1.6).</p>

    <h4 class="enc-h" id="enc-e">5. La dette publique : utile si elle investit, nocive si elle paie le quotidien</h4>
    <p><b>La règle d'or.</b> Comme pour un ménage, emprunter pour acheter un logement ou une machine, c'est s'enrichir plus tard ; emprunter pour payer ses courses, c'est s'appauvrir. D'où la « règle d'or » : on n'emprunte pas plus que ce qu'on investit. Les communes, départements et régions y sont tenus ; l'État et la Sécurité sociale, non.</p>
    <p><b>Ce que la France investit.</b> L'investissement public a deux parts : maintenir l'existant, c'est-à-dire remplacer ce qui s'use (routes, écoles, hôpitaux, matériel), et investir en plus, ce qui agrandit vraiment le patrimoine public. En ${puL.annee}, la France investit ${f1(puL.inv_FR)} % du PIB, plus que l'Allemagne (${f1(puL.inv_DE)} %) et la moyenne européenne (${f1(puL.inv_EU27_2020)} %). Mais ${f1(puL.ccf_FR)} points servent seulement à compenser l'usure : <b>il ne reste que ${f1(puL.inv_FR - puL.ccf_FR)} % du PIB d'investissement nouveau</b> (Allemagne : ${f1(puL.inv_DE - puL.ccf_DE)} %). Le patrimoine public ne se dégrade pas dans les comptes, mais il stagne ; l'usure reste une estimation comptable, pas une mesure de l'état réel des ponts ou des écoles.</p>
    <p><b>Mais le déficit est bien plus gros.</b> Il atteint ${f1(-puL.solde_FR)} % du PIB. ${trop.length === PU.length ? "Chaque année depuis " + PU[0].annee : trop.length + " années sur " + PU.length + " depuis " + PU[0].annee}, il a dépassé l'investissement (graphique ci-dessous) : une partie des retraites, des salaires et des intérêts est donc payée à crédit. L'Allemagne, elle, emprunte moins qu'elle n'investit (déficit de ${f1(-puL.solde_DE)} %).</p>
    <p><b>Qui prête à l'État ?</b> D'abord l'épargne des Français, surtout par l'assurance vie : fin 2025, les assureurs français détenaient 344 Md€ de dette publique française, dont 297 Md€ pour l'assurance vie (<a href="https://www.franceassureurs.fr/nos-chiffres-cles/financement-de-leconomie/les-placements-de-lassurance-en-2025/" target="_blank" rel="noopener">France Assureurs</a>) ; sans le savoir, beaucoup d'épargnants prêtent à leur propre État. Ensuite des investisseurs étrangers, qui détiennent plus de la moitié de la dette négociable, et enfin des banques, des fonds et la Banque de France (rachats de dette de la BCE depuis 2015). C'est là que les deux soldes se rejoignent : l'égalité de la partie 1 montre que le déficit public est financé surtout par l'épargne des ménages français, et pour le reste par l'étranger.</p>

    <h4 class="enc-h" id="enc-f">En résumé</h4>
    <p>Le solde extérieur est celui de tout le pays, le solde public celui des administrations ; ils sont liés par l'épargne du privé. Un déficit extérieur a deux effets : tout de suite, l'argent dépensé fait travailler l'étranger ; à la longue, l'étranger accumule des créances et des actifs sur la France. Dans la zone euro, ce déficit est financé automatiquement par les banques centrales (TARGET) mais ne se corrige pas par le change ; avec le reste du monde, il faut trouver des acheteurs d'euros, et c'est le taux de change qui s'ajuste. Le déficit public, lui, n'est pas grave s'il finance de l'investissement ; en France, il dépasse l'investissement depuis des années.</p>
    <p class="muted" style="font-size:.8rem;margin-bottom:0">Nuance : la position extérieure bouge aussi avec le prix des actions et des immeubles détenus de part et d'autre de la frontière.</p>`;
}

/* Simulateur : le trajet des 30 000 euros d'une Volkswagen, compte par compte */
function trajet() {
  const el = $("#ext-trajet"); if (!el) return;
  const E = {
    0: { t: "Avant l'achat", d: "Rien n'a encore bougé.", v: {} },
    1: { t: "1. Le paiement", d: "Le compte de l'acheteur baisse, celui de Volkswagen monte. Les deux banques se règlent en monnaie de banque centrale : les réserves passent de la Banque de France à la Bundesbank, et le solde TARGET enregistre la dette de la Banque de France envers l'Eurosystème.",
      v: { ach: -30000, vw: 30000, resF: -30000, resA: 30000, tF: -30000, tA: 30000, actA: 30000 } },
    garde: { t: "2. Les euros restent en Allemagne", d: "Volkswagen paie ses ouvriers et ses fournisseurs, qui gardent ou dépensent l'argent en Allemagne. Les dépôts passent de compte allemand en compte allemand : les réserves restent à la Bundesbank, le solde TARGET reste ouvert. La France doit 30 000 euros au reste de la zone, par l'intermédiaire de sa banque centrale.",
      v: { ach: -30000, vw: 0, autresA: 30000, resF: -30000, resA: 30000, tF: -30000, tA: 30000, actA: 30000 } },
    achat: { t: "2. Un Allemand achète du vin français", d: "L'argent revient : le compte du vigneron français monte, les réserves repartent vers la Banque de France, le solde TARGET se referme. La France a acheté une voiture et vendu du vin : les échanges sont équilibrés, personne ne doit rien à personne, et l'activité est partagée entre les deux pays.",
      v: { ach: -30000, vw: 0, autresF: 30000, resF: 0, resA: 0, tF: 0, tA: 0, actA: 30000, actF: 30000 } },
    place: { t: "2. Un fonds allemand achète une obligation de l'État français", d: "Les euros reviennent en France, mais en échange d'une obligation : les réserves repartent vers la Banque de France et le solde TARGET se referme, mais un Allemand détient désormais une créance de 30 000 euros sur l'État français, qui lui versera des intérêts chaque année. La dette a seulement changé de forme : d'une dette entre banques centrales, elle est devenue une dette envers un investisseur privé.",
      v: { ach: -30000, vw: 0, autresF: 30000, resF: 0, resA: 0, tF: 0, tA: 0, oat: 30000, actA: 30000 } }
  };
  const L = [
    ["Côté France", null],
    ["ach", "Compte de l'acheteur (banque française)"], ["autresF", "Comptes d'autres Français (vigneron, Trésor public)"], ["resF", "Réserves des banques françaises à la Banque de France"], ["tF", "Solde TARGET de la Banque de France"],
    ["Côté Allemagne", null],
    ["vw", "Compte de Volkswagen (banque allemande)"], ["autresA", "Comptes des salariés et fournisseurs allemands"], ["resA", "Réserves des banques allemandes à la Bundesbank"], ["tA", "Solde TARGET de la Bundesbank"],
    ["Bilan", null],
    ["oat", "Dette de l'État français détenue en Allemagne (obligations)"], ["actF", "Production et salaires payés en France"], ["actA", "Production et salaires payés en Allemagne"]
  ];
  let cur = 0;
  const fmt = (v, k) => v ? `<b style="color:${v < 0 || k === "oat" ? "#dc2626" : "#16a34a"}">${v > 0 ? "+" : "−"}${Math.abs(v).toLocaleString("fr-FR")} €</b>` : `<span class="muted">0</span>`;
  const render = () => {
    const e = E[cur], v = e.v;
    const dette = -(v.tF || 0) + (v.oat || 0);
    el.innerHTML = `<p style="margin:0 0 6px"><b>À vous de jouer : le trajet des 30 000 euros, compte par compte</b></p>
      <div class="ext-btns">
        <button type="button" data-k="0" aria-pressed="${cur === 0}">Avant</button>
        <button type="button" data-k="1" aria-pressed="${cur === 1}">1. Le paiement</button>
        <span class="muted" style="font-size:.82rem;align-self:center">puis, que font les Allemands de ces euros ?</span>
        <button type="button" data-k="garde" aria-pressed="${cur === "garde"}">Ils les gardent en Allemagne</button>
        <button type="button" data-k="achat" aria-pressed="${cur === "achat"}">Ils achètent du vin français</button>
        <button type="button" data-k="place" aria-pressed="${cur === "place"}">Ils achètent une obligation française</button>
      </div>
      <p style="margin:6px 0 8px"><b>${e.t}</b> : ${e.d}</p>
      <div class="table-scroll"><table class="cmp-t ext-tr">${L.map(([k, l]) => l == null ? `<tr><th colspan="2" style="text-align:left">${k}</th></tr>` : `<tr><td>${l}</td><td class="num">${fmt(v[k], k)}</td></tr>`).join("")}</table></div>
      <p style="margin:8px 0 0"><b>Ce que la France doit au reste du monde à cause de cet achat</b> : ${dette ? `<b style="color:#dc2626">${dette.toLocaleString("fr-FR")} €</b>, ${v.oat ? "sous forme d'une obligation détenue par un investisseur allemand" : "sous forme du solde TARGET de la Banque de France"}` : "<b>rien</b>"}. ${cur === 0 ? "" : v.actF ? "L'activité est partagée entre les deux pays." : "La production et les salaires de cette voiture sont allés à l'Allemagne."}</p>`;
    el.querySelectorAll("button[data-k]").forEach(b => b.onclick = () => { const k = b.dataset.k; cur = (k === "0" || k === "1") ? +k : k; render(); });
  };
  render();
}


/* Les trois soldes : en % du PIB (courbes) ou en milliards d'euros (barres empilées : public + privé = extérieur) */
function secteurs(mode) {
  const el = $("#ext-secteurs"); if (!el || !X.secteurs) return;
  const f1 = v => v.toLocaleString("fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const S = [{ k: "ext", l: "Solde extérieur courant (tout le pays)", c: "var(--ink)" }, { k: "pub", l: "Solde public (État, collectivités, Sécurité sociale)", c: "#dc2626" }, { k: "prive", l: "Solde du secteur privé (ménages et entreprises)", c: "#16a34a" }];
  if (mode === "pc") {
    window.TH.lineChart(el, X.secteurs, S, { h: 260, vfmt: v => (v > 0 ? "+" : "") + f1(v) + " % du PIB", yfmt: v => (v > 0 ? "+" : "") + v + " %", xticks: 9 });
    window.TH.legend("#ext-secteurs-legend", S.map(x => [x.l, x.c])); return;
  }
  const D = X.secteurs.filter(d => d.pib_md != null), w = Math.max(320, el.clientWidth), h = 300, m = { t: 12, r: 10, b: 26, l: 50 };
  const x = d3.scaleBand(D.map(d => d.annee), [m.l, w - m.r]).padding(.15);
  const lo = d3.min(D, d => Math.min(0, d.pub_md) + Math.min(0, d.prive_md)), hi = d3.max(D, d => Math.max(0, d.pub_md) + Math.max(0, d.prive_md));
  const y = d3.scaleLinear([lo, hi], [h - m.b, m.t]).nice();
  const svg = d3.create("svg").attr("viewBox", `0 0 ${w} ${h}`);
  svg.append("g").attr("class", "grid").selectAll("line").data(y.ticks(6)).join("line").attr("x1", m.l).attr("x2", w - m.r).attr("y1", y).attr("y2", y);
  D.forEach(d => { let p = 0, n = 0;
    [["pub_md", "#dc2626"], ["prive_md", "#16a34a"]].forEach(([k, c]) => { const v = d[k]; const y0 = v >= 0 ? p : n, y1 = y0 + v; if (v >= 0) p = y1; else n = y1;
      svg.append("rect").attr("x", x(d.annee)).attr("width", x.bandwidth()).attr("y", y(Math.max(y0, y1))).attr("height", Math.abs(y(y0) - y(y1))).attr("fill", c).attr("opacity", .85); }); });
  svg.append("line").attr("x1", m.l).attr("x2", w - m.r).attr("y1", y(0)).attr("y2", y(0)).attr("stroke", "var(--ink)").attr("stroke-width", .8);
  svg.append("path").attr("fill", "none").attr("stroke", "var(--ink)").attr("stroke-width", 1.6).attr("d", d3.line().x(d => x(d.annee) + x.bandwidth() / 2).y(d => y(d.ext_md))(D));
  svg.append("g").selectAll("circle").data(D).join("circle").attr("cx", d => x(d.annee) + x.bandwidth() / 2).attr("cy", d => y(d.ext_md)).attr("r", 2.8).attr("fill", "var(--surface)").attr("stroke", "var(--ink)").attr("stroke-width", 1.4);
  svg.append("g").attr("class", "axis").attr("transform", `translate(0,${h - m.b})`).call(d3.axisBottom(x).tickValues(D.map(d => d.annee).filter(a => a % 5 === 0)).tickSizeOuter(0));
  svg.append("g").attr("class", "axis").attr("transform", `translate(${m.l},0)`).call(d3.axisLeft(y).ticks(6).tickFormat(v => (v > 0 ? "+" : "") + v)).call(g => g.select(".domain").remove());
  svg.append("rect").attr("x", m.l).attr("y", m.t).attr("width", w - m.l - m.r).attr("height", h - m.t - m.b).attr("fill", "transparent")
    .on("pointermove", ev => { const i = Math.floor((d3.pointer(ev)[0] - m.l) / x.step()), d = D[Math.max(0, Math.min(D.length - 1, i))];
      const md = v => (v > 0 ? "+" : "") + Math.round(v).toLocaleString("fr-FR") + " Md€";
      window.TH.showTip(`<b>${d.annee}</b> (PIB : ${Math.round(d.pib_md).toLocaleString("fr-FR")} Md€)<br><span style="color:#dc2626">■</span> Solde public : ${md(d.pub_md)}<br><span style="color:#16a34a">■</span> Solde du privé : ${md(d.prive_md)}<br><b>= Solde extérieur : ${md(d.ext_md)}</b>`, ev); })
    .on("pointerleave", () => window.TH.hideTip());
  el.replaceChildren(svg.node());
  window.TH.legend("#ext-secteurs-legend", [["Solde public (barre rouge)", "#dc2626"], ["Solde du secteur privé (barre verte)", "#16a34a"], ["Solde extérieur = somme des deux (points noirs), en milliards d'euros courants", "var(--ink)", true]]);
}

function drawJumeaux() {
  const el = $("#ext-jum"); if (!el || !X.jumeaux) return;
  const J = X.jumeaux, f1 = v => (v > 0 ? "+" : "") + String(v).replace(".", ",");
  const quad = (e, p) => J.pays.filter(r => (r.ext > 0) === e && (r.pub >= 0) === p).sort((a, b) => b.ext - a.ext);
  const cell = (rows, titre, coul) => `<td style="vertical-align:top;padding:8px 10px;border:1px solid #e5e7eb;background:${coul}"><b>${titre}</b><br>${rows.length ? rows.map(r => `${r.code === "FRA" ? "<b>" : ""}${r.nom}${r.code === "FRA" ? "</b>" : ""} <span class="muted">(${f1(r.ext)} / ${f1(r.pub)})</span>`).join("<br>") : "<span class='muted'>aucun dans la liste</span>"}</td>`;
  const d = Object.fromEntries(J.pays.map(r => [r.code, r]));
  el.innerHTML = `<p style="margin:0 0 4px"><b>Balance commerciale et budget de l'État : deux comptes séparés</b></p>
  <ul>
    <li><b>Un pays peut vendre plus qu'il n'achète à l'étranger et avoir quand même un État en déficit.</b> C'est même fréquent : l'Allemagne, l'Italie, l'Espagne, le Japon ou la Chine sont dans ce cas en ${J.annee}.</li>
    <li><b>Pourquoi ?</b> Tout dépend de l'épargne des ménages et des entreprises. Quand ils épargnent beaucoup, ils peuvent à la fois prêter à leur État et prêter à l'étranger. Le Japon a vendu plus qu'il n'a acheté à l'étranger chaque année depuis dix ans, alors que son État était en déficit chaque année.</li>
    <li><b>La France est dans la case des deux déficits</b>, avec les États-Unis, le Royaume-Uni, le Brésil et l'Inde : ${f1(d.FRA.ext)} % du PIB avec l'étranger, ${f1(d.FRA.pub)} % pour les administrations publiques en ${J.annee}.</li>
  </ul>
  <div class="table-scroll"><table style="border-collapse:collapse;width:100%;font-size:.85rem;margin-top:6px">
    <tr><td></td><th style="padding:4px 10px">Comptes publics en excédent</th><th style="padding:4px 10px">Comptes publics en déficit</th></tr>
    <tr><th style="padding:4px 10px;text-align:left">Excédent avec l'étranger</th>${cell(quad(true, true), "Les deux excédents", "#ecfdf5")}${cell(quad(true, false), "Excédent extérieur, État en déficit", "#fefce8")}</tr>
    <tr><th style="padding:4px 10px;text-align:left">Déficit avec l'étranger</th>${cell(quad(false, true), "Déficit extérieur, État en excédent", "#fefce8")}${cell(quad(false, false), "Les deux déficits", "#fef2f2")}</tr>
  </table></div>
  <p class="muted" style="font-size:.8rem;margin:6px 0 0">Entre parenthèses : solde avec l'étranger (balance courante) / solde des administrations publiques, en % du PIB, ${J.annee} (estimations). Source : <a href="https://www.imf.org/external/datamapper/GGXCNL_NGDP@WEO" target="_blank" rel="noopener">FMI, World Economic Outlook</a> (BCA_NGDPD et GGXCNL_NGDP).</p>`;
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
