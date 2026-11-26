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
  $("#ext-txt").innerHTML = `<p style="margin-top:0"><b>Deux soldes différents, mais liés : celui du pays avec l'étranger, et celui de l'État</b></p>
    <ul><li><b>Le solde extérieur</b> (balance commerciale et revenus) est celui de <b>tout le pays</b> : ménages, entreprises et administrations ensemble. Il dit si la France, dans son ensemble, dépense plus qu'elle ne produit.</li><li><b>Le solde public</b> est celui de <b>l'État</b>, des collectivités et de la Sécurité sociale : il dit si les administrations dépensent plus qu'elles ne prélèvent.</li>
    <li><b>Le lien</b> est une égalité comptable : <b>solde extérieur = solde du secteur privé + solde public</b>, où le solde du privé est ce que ménages et entreprises épargnent de plus qu'ils n'investissent. En ${puL.annee}, la France a un solde extérieur courant de ${sg(cL.FR)} du PIB et un solde public de ${sg(puL.solde_FR)} : le secteur privé dégage donc un excédent d'environ ${f1(cL.FR - puL.solde_FR)} % du PIB (les ménages épargnent beaucoup). Autrement dit, ce n'est pas le privé qui emprunte à l'étranger : il prête, en grande partie à l'État ; le pays dans son ensemble n'emprunte à l'étranger que la petite différence.</li></ul>
    <p style="margin-bottom:2px"><b>1. Le solde avec l'étranger : la France achète un peu plus qu'elle ne vend</b></p>
    <ul>
      <li><b>Les chiffres</b> : en biens et services, la France est en déficit ${defC} années sur ${nC} depuis 2000 (${sg(cmL.FR)} du PIB en ${cmL.annee}). Ses placements à l'étranger rapportent un peu, mais le solde total reste négatif presque chaque année (graphique de gauche).</li>
      <li><b>Le résultat cumulé</b> : la France possédait à l'étranger un peu plus qu'elle ne lui devait en 2000 (${sg(p00.FR)} du PIB) ; en ${last.annee}, elle lui doit ${f1(Math.abs(last.FR))} % de son PIB de plus qu'elle n'y possède (graphique de droite). L'Allemagne, en excédent depuis vingt ans, a l'inverse : ${sg(last.DE)}. Un pays en déficit répété s'appauvrit peu à peu face au reste du monde : chaque année, une partie des intérêts, dividendes et loyers produits en France part à l'étranger.</li>
    </ul>
    <p style="margin-bottom:2px"><b>2. Suivons 30 000 euros : un Français achète une Volkswagen fabriquée en Allemagne</b></p>
    <ol style="margin-top:4px">
      <li><b>Le paiement : ce qui bouge vraiment.</b> L'acheteur paie depuis son compte dans une banque française ; Volkswagen est payé sur son compte dans une banque allemande. Or un dépôt est une dette de <i>sa</i> banque : un euro sur un compte français et un euro sur un compte allemand ne sont pas tout à fait la même chose (voir l'onglet <a href="#monnaie" data-to="mo-2-6">Monnaie</a>, 2.6). Pour que le dépôt passe d'une banque à l'autre, les deux banques se règlent en <b>monnaie de banque centrale</b>, la seule qui soit vraiment unique dans toute la zone euro : la banque française voit ses réserves à la Banque de France baisser de 30 000 euros, la banque allemande voit les siennes à la Bundesbank monter d'autant. Entre les deux banques centrales, ce transfert laisse une trace : la Banque de France doit 30 000 euros de plus à l'Eurosystème, la Bundesbank y détient 30 000 euros de plus. Ce sont les <b>soldes TARGET</b>. Autrement dit, <b>au moment même du paiement, le déficit est financé automatiquement par les banques centrales</b>, sans que personne ne l'ait décidé. Pas un euro d'argent public dans l'opération ; l'État ne prélève que la TVA.</li>
      <li><b>Volkswagen dépense cet argent en Allemagne</b> : il paie ses ouvriers, ses fournisseurs (souvent allemands eux aussi), ses impôts en Allemagne, et verse des dividendes à ses actionnaires. Les ouvriers de Wolfsburg achètent leur pain chez le boulanger de Wolfsburg. L'argent change de main, mais reste sur des comptes en Allemagne.</li>
      <li><b>Premier effet, immédiat : le boulanger français perd des clients.</b> Si la voiture avait été fabriquée en France, ces 30 000 euros auraient payé des ouvriers français, qui auraient acheté leur pain chez lui, fait leurs courses à la supérette, payé le coiffeur, qui auraient eux-mêmes dépensé ailleurs en France. L'argent a fait vivre l'économie allemande au lieu de la française : <b>moins d'activité, moins d'emplois et moins de recettes fiscales en France</b>. C'est le lien direct avec la désindustrialisation (voir l'onglet <a href="#industrie">Industrie et innovation</a>).</li>
      <li><b>Ensuite, que deviennent ces euros ?</b> Ils restent quelque part, et leurs détenteurs allemands ont le choix :
        <ul>
          <li><b>Les garder sur un compte en Allemagne, ou les dépenser en Allemagne</b> : c'est le cas le plus fréquent, et rien ne l'interdit. L'argent passe de compte allemand en compte allemand, et la trace du paiement reste en place : la créance de l'Allemagne sur la France est détenue, au bout de la chaîne, par la Bundesbank, sous la forme du solde TARGET.</li>
          <li><b>Acheter des produits français</b> (un Airbus, du vin, des vacances en France) : la monnaie de banque centrale repart de la Bundesbank vers la Banque de France, le solde TARGET se referme, l'argent fait travailler des Français. Le déficit est comblé : c'est une exportation.</li>
          <li><b>Les placer en France</b> : acheter des obligations de l'État français (un peu plus de la moitié de la dette publique négociable est détenue par des non-résidents), des actions d'entreprises françaises (environ 40 % du capital du CAC 40 est détenu par l'étranger), un immeuble, une entreprise. La monnaie de banque centrale repart aussi vers la France et le solde TARGET se referme, mais à sa place, un Allemand détient désormais une <b>créance privée sur la France</b> (une obligation) ou un <b>morceau de France</b> (une action, un immeuble).</li>
        </ul></li>
      <li><b>Second effet, cumulatif : la France doit davantage au reste du monde.</b> Dans tous les cas sauf l'achat de produits français, le déficit se traduit par une dette envers l'étranger : soit une créance des banques centrales (le solde TARGET de la Banque de France${X.target ? `, ${Math.round(X.target.at(-1).fr)} milliards d'euros en ${X.target_mois ? new Date(X.target_mois + "-15").toLocaleDateString("fr-FR", { month: "long", year: "numeric" }) : X.target.at(-1).annee}, contre ${sg2(X.target.at(-1).de)} milliards pour la Bundesbank` : ""}), soit des obligations et des dépôts détenus par des étrangers, soit des actions, des immeubles et des entreprises passés à des propriétaires étrangers. C'est le sens de « le pays paie son déficit en empruntant ou en vendant des actifs ». Et chaque année, les intérêts, dividendes et loyers de ces placements partent à leur tour à l'étranger.</li>
      <li><b>Le boulanger, lui, ne vend pas sa boulangerie</b> : personne en particulier n'est forcé de vendre. Le second effet passe par la Banque de France et par des milliers d'opérations volontaires : un fonds allemand achète les obligations que l'État français vient d'émettre pour financer son déficit, un groupe étranger rachète une PME, un assureur néerlandais achète un immeuble de bureaux à Paris. Ce sont souvent des Français qui vendent, de leur plein gré, au meilleur prix. Le boulanger subit le premier effet : il a perdu des clients.</li>
    </ol>
    <div id="ext-trajet" class="ext-trajet"></div>
    <p style="margin:0 0 8px"><b>Pourquoi ces soldes TARGET comptent</b> : tant que la zone euro tient, ils restent une écriture entre banques centrales, sans date de remboursement, rémunérée au taux de la BCE et dont les intérêts sont mis en commun entre banques centrales. Mais ils montent fortement quand l'argent fuit un pays : de 2010 à 2012, les Grecs, les Espagnols et les Italiens ont transféré leurs dépôts vers des banques allemandes, par peur d'une sortie de l'euro ; les banques de ces pays ont perdu leurs dépôts, et ce sont les banques centrales, par TARGET, qui ont comblé le trou. C'est là qu'on voit qu'un euro grec n'était pas tout à fait un euro allemand. Si un pays quittait l'euro, la question de qui supporte ces créances se poserait.</p>
    <p style="margin:0 0 8px"><b>En résumé</b> : un déficit commercial a deux conséquences. <b>Tout de suite</b>, l'argent dépensé fait travailler l'étranger plutôt que la France (moins d'activité et d'emplois). <b>À la longue</b>, la France doit davantage au reste du monde : d'abord automatiquement, par les banques centrales (TARGET), puis, quand les détenteurs étrangers replacent leurs euros en France, sous forme d'obligations, d'actions, d'immeubles et d'entreprises.</p>
    <p style="margin-bottom:2px"><b>3. De l'autre, la dette publique, qui vient de l'État : utile si elle finance de l'investissement, nocive si elle paie les dépenses courantes</b></p>
    <ul>
      <li><b>Comme pour un ménage</b> : emprunter pour acheter un logement ou une machine, c'est s'enrichir plus tard ; emprunter pour payer ses courses, c'est s'appauvrir. C'est la « règle d'or » : on n'emprunte pas plus que ce qu'on investit.</li>
      <li><b>L'investissement public se compose de deux parts</b> : (1) <b>maintenir l'existant</b>, c'est-à-dire remplacer ce qui s'use (routes, écoles, hôpitaux, matériel), que les comptables appellent « consommation de capital fixe » ; (2) <b>investir en plus</b>, ce qui agrandit vraiment le patrimoine public (investissement net). En ${puL.annee}, la France investit ${f1(puL.inv_FR)} % du PIB, plus que l'Allemagne (${f1(puL.inv_DE)} %) et la moyenne européenne (${f1(puL.inv_EU27_2020)} %). Mais ${f1(puL.ccf_FR)} points servent seulement à compenser l'usure : <b>il ne reste que ${f1(puL.inv_FR - puL.ccf_FR)} % du PIB d'investissement nouveau</b> (Allemagne : ${f1(puL.inv_DE - puL.ccf_DE)} %), et à peine 0,1 % par an entre 2015 et 2017 (courbe vert foncé ci-dessous).</li><li><b>Conclusion : le patrimoine public ne se dégrade pas dans les comptes, mais il stagne.</b> L'investissement net est resté positif chaque année depuis 2010 : en moyenne, la France a remplacé ce qui s'usait, sans plus. Comme la population et l'économie grandissent, l'équipement public par habitant progresse à peine. Deux limites : l'usure est une estimation comptable (fondée sur des durées de vie standard), pas une mesure de l'état réel des routes ou des ponts, et une moyenne nationale peut cacher des équipements qui se dégradent pendant que d'autres sont neufs.</li>
      <li><b>Mais son déficit est encore plus gros</b> : ${f1(-puL.solde_FR)} % du PIB. ${trop.length === PU.length ? "Chaque année depuis " + PU[0].annee : trop.length + " années sur " + PU.length + " depuis " + PU[0].annee}, il a dépassé l'investissement (graphique ci-dessous) : une partie des retraites, salaires et intérêts est donc payée à crédit. L'Allemagne, elle, emprunte moins que ce qu'elle investit (déficit de ${f1(-puL.solde_DE)} %).</li>
      <li><b>Qui prête à l'État ?</b> L'État emprunte pour boucher le trou de son budget (dépenses plus grandes que les recettes), pas pour payer les importations. Pour cela, il vend des obligations à des investisseurs :<ul><li><b>l'épargne des Français, surtout via l'assurance vie</b> : l'argent placé sur un fonds en euros est confié à l'assureur, qui l'investit en grande partie en obligations. Fin 2025, les assureurs français détenaient 344 Md€ de dette publique française, dont 297 Md€ pour l'assurance vie (<a href="https://www.franceassureurs.fr/nos-chiffres-cles/financement-de-leconomie/les-placements-de-lassurance-en-2025/" target="_blank" rel="noopener">France Assureurs, Les placements de l'assurance en 2025</a>). Sans le savoir, beaucoup d'épargnants prêtent ainsi à leur propre État ;</li><li><b>des investisseurs étrangers</b>, qui en détiennent plus de la moitié ;</li><li>des banques, des fonds et la Banque de France (rachats de dette de la BCE depuis 2015).</li></ul></li><li><b>Deux sujets distincts</b> : le déficit commercial vient des achats des entreprises et des ménages, le déficit public vient du budget de l'État. Ils ne se croisent que sur un point : une partie de l'argent prêté à l'État vient de l'étranger.</li>
    </ul>
    <p class="muted" style="font-size:.8rem;margin-bottom:0">Nuances : la position extérieure bouge aussi avec le prix des actions détenues par les étrangers ; les États-Unis vivent en déficit depuis quarante ans sans crise, grâce au dollar, monnaie mondiale, un privilège que la France n'a pas.</p>`;
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
