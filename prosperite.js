/* Qu'est-ce qu'un pays prospère ? La France face aux États-Unis, à l'Allemagne, au Brésil, à l'Inde et au Nigeria */
(() => {
"use strict";
let D = null;
const $ = s => document.querySelector(s);
async function init() {
  if (!window.TH || !$("#pr-kpis")) { setTimeout(init, 100); return; }
  try { D = await fetch("data/prosperite.json", { cache: "no-cache" }).then(r => r.json()); } catch (e) { return; }
  try { draw(); } catch (e) { console.error("prosperite", e); }
}
const nf = (v, d = 0) => v == null ? "n.d." : v.toLocaleString("fr-FR", { minimumFractionDigits: d, maximumFractionDigits: d });
// une ligne = un indicateur ; sens : +1 plus haut = mieux, -1 plus bas = mieux
const BLOCS = {
  richesse: [
    ["PIB par habitant, en dollars PPA", "pib_hab", 0, 1, "FMI"],
    ["Chômage (% des actifs)", "chomage", 1, -1, "FMI"],
  ],
  partage: [
    ["Indice de Gini (0 = égalité parfaite)", "gini", 1, -1, "PNUD"],
    ["Part du revenu des 1 % les plus riches (%)", "part_1", 1, -1, "PNUD"],
    ["Part du revenu des 40 % les plus pauvres (%)", "part_40", 1, 1, "PNUD"],
    ["Vivent avec moins de 3 $ par jour (%)", "pauvrete", 1, -1, "Banque mondiale"],
  ],
  durable: [
    ["Dette publique (% du PIB)", "dette", 0, -1, "FMI"],
    ["Solde public (% du PIB)", "solde", 1, 1, "FMI"],
    ["Solde des échanges avec l'étranger (% du PIB)", "courant", 1, 1, "FMI, balance courante"],
    ["Indépendance énergétique (% de la consommation produite sur place)", "energie", 0, 1, "Energy Institute, via OWID"],
    ["Inflation (%)", "inflation", 1, -1, "FMI"],
    ["CO₂ émis par habitant (tonnes)", "co2", 1, -1, "Global Carbon Project"],
  ],
  institutions: [
    ["Corruption perçue (0 = très corrompu, 100 = intègre)", "cpi", 0, 1, "Transparency International, 2025"],
    ["État de droit (0 à 1) : justice, contrôle du pouvoir, droits", "wjp", 2, 1, "World Justice Project, 2025"],
  ],
  regime: [
    ["Libertés politiques et civiles (0 à 100)", "fh", 0, 1, "Freedom House, 2026"],
    ["Liberté économique, dont liberté d'entreprendre (0 à 100)", "heritage", 1, 1, "Heritage Foundation, 2026"],
  ],
  vie: [
    ["Espérance de vie à la naissance (ans)", "esperance_vie", 1, 1, "PNUD"],
    ["Années d'études des adultes (moyenne)", "annees_etudes", 1, 1, "PNUD"],
    ["Indice de développement humain (IDH, 0 à 1)", "idh", 3, 1, "PNUD"],
    ["IDH corrigé des inégalités", "idh_ajuste", 3, 1, "PNUD"],
  ],
};
function table(sel, rows) {
  const { esc } = window.TH, P = D.pays;
  $(sel).innerHTML = `<table class="pr-t"><thead><tr><th>Indicateur</th>${P.map(p => `<th class="${p.code === "FRA" ? "fr" : ""}">${esc(p.nom)}</th>`).join("")}</tr></thead><tbody>` +
    rows.map(([l, k, d, sens, src]) => {
      const vals = P.map(p => p[k]).filter(v => v != null), best = sens > 0 ? Math.max(...vals) : Math.min(...vals), mx = Math.max(...vals.map(Math.abs));
      return `<tr><td class="lab">${esc(l)} <small class="muted">${esc(src)}</small></td>` + P.map(p => {
        const v = p[k], w = v == null ? 0 : 100 * Math.abs(v) / mx;
        return `<td class="${p.code === "FRA" ? "fr" : ""}${v === best ? " best" : ""}"><b>${k === "rang_idh" ? v + "<sup>e</sup>" : nf(v, d)}</b>${k === "idh" ? ` <small class="muted">(${p.rang_idh}<sup>e</sup>)</small>` : k === "cpi" ? ` <small class="muted">(${p.cpi_rang}<sup>e</sup>)</small>` : k === "wjp" ? ` <small class="muted">(${p.wjp_rang}<sup>e</sup>)</small>` : k === "heritage" ? ` <small class="muted">(${p.heritage_rang}<sup>e</sup>)</small>` : k === "fh" ? ` <small class="muted">${p.fh_statut}</small>` : ""}<span class="pr-bar"><i style="width:${w.toFixed(1)}%"></i></span></td>`;
      }).join("") + `</tr>`;
    }).join("") + `</tbody></table>`;
}
function draw() {
  const { kpis } = window.TH, P = Object.fromEntries(D.pays.map(p => [p.code, p])), fr = P.FRA, us = P.USA, de = P.DEU;
  const pc = (a, b) => Math.round(100 * (1 - a / b));
  kpis("#pr-kpis", [
    [nf(fr.pib_hab) + " $", [`PIB par habitant en PPA (${D.annee_fmi})`, `${pc(fr.pib_hab, de.pib_hab)} % de moins que l'Allemagne, ${pc(fr.pib_hab, us.pib_hab)} % de moins que les États-Unis`], "Richesse"],
    [nf(fr.gini, 1), ["indice de Gini, le plus bas des six pays", `États-Unis ${nf(us.gini, 1)}, Brésil ${nf(P.BRA.gini, 1)}`], "Partage"],
    [nf(fr.dette) + " %", ["dette publique en % du PIB", `56 % de la dette de l'État détenue à l'étranger`, `énergie : ${nf(fr.energie)} % produite sur place`], "Résilience"],
    [nf(fr.esperance_vie, 1) + " ans", ["espérance de vie, la plus longue des six", `mais IDH ${fr.rang_idh}e au monde`], "Bien-être"],
  ]);
  table("#pr-richesse", BLOCS.richesse); table("#pr-partage", BLOCS.partage); table("#pr-durable", BLOCS.durable); table("#pr-vie", BLOCS.vie); table("#pr-inst", BLOCS.institutions); table("#pr-regime", BLOCS.regime);
  $("#pr-richesse-txt").innerHTML = `<ul>
    <li><b>La France est un pays riche</b> : ${nf(fr.pib_hab)} dollars par habitant en parité de pouvoir d'achat, ${Math.round(fr.pib_hab / P.IND.pib_hab)} fois plus qu'en Inde et ${Math.round(fr.pib_hab / P.NGA.pib_hab)} fois plus qu'au Nigeria.</li>
    <li><b>Mais elle est en retrait des pays riches comparables</b> : ${pc(fr.pib_hab, de.pib_hab)} % de moins que l'Allemagne, ${pc(fr.pib_hab, us.pib_hab)} % de moins que les États-Unis. L'écart vient surtout du nombre d'heures travaillées sur une vie et du chômage (${nf(fr.chomage, 1)} %, contre ${nf(de.chomage, 1)} % en Allemagne), pas de la productivité par heure, qui est élevée (voir l'onglet <a href="#travail">Temps de travail</a>).</li>
    <li><b>Dans les pays pauvres, le chômage mesure mal la situation</b> : la plupart des gens travaillent dans l'économie informelle, sans être comptés comme chômeurs.</li>
  </ul>`;
  $("#pr-partage-txt").innerHTML = `<ul>
    <li><b>La France est l'un des pays les plus égalitaires</b>, au niveau de l'Allemagne : le 1 % le plus riche reçoit ${nf(fr.part_1, 1)} % des revenus, contre ${nf(us.part_1, 1)} % aux États-Unis et ${nf(P.BRA.part_1, 1)} % au Brésil.</li>
    <li><b>La redistribution y joue un grand rôle</b> : impôts et prestations réduisent fortement les écarts de revenus (voir l'onglet <a href="#repartition">Répartition du PIB</a>).</li>
    <li><b>Un Gini bas ne veut pas dire un pays sans pauvres</b> : l'Inde a un Gini proche de celui de la France, mais il mesure la consommation et non le revenu, ce qui réduit les écarts. Au Nigeria, ${nf(P.NGA.pauvrete)} % de la population vit avec moins de 3 dollars par jour.</li>
  </ul>`;
  $("#pr-durable-txt").innerHTML = `<p style="margin-top:0"><b>Être riche ne suffit pas : encore faut-il encaisser les chocs (crise financière, guerre, coupure d'énergie, pandémie) sans dépendre du bon vouloir des autres</b></p><ul>
    <li><b>Finances publiques : le point faible</b>. La dette atteint ${nf(fr.dette)} % du PIB, presque le double de l'Allemagne (${nf(de.dette)} %), avec un déficit de ${nf(Math.abs(fr.solde), 1)} % du PIB. Environ 56 % de la dette négociable de l'État est détenue par des investisseurs étrangers (<a href="https://www.aft.gouv.fr/files/medias-aft/7_Publications/7.2_BM/435_Bulletin%20mensuel%20aout%202026.pdf" target="_blank" rel="noopener">Agence France Trésor</a>, fin 2025) : la France dépend de leur confiance pour emprunter (voir l'encadré « Si demain l'État ne peut plus emprunter » dans l'onglet <a href="#patrimoine">Patrimoine</a>). Les États-Unis sont plus endettés, mais le dollar, monnaie mondiale, leur donne une marge que la France n'a pas.</li>
    <li><b>Échanges avec l'étranger : à l'équilibre</b> (${nf(fr.courant, 1)} % du PIB), quand l'Allemagne dégage un excédent de ${nf(de.courant, 1)} % et que les États-Unis vivent à crédit (${nf(us.courant, 1)} %). Un pays en excédent prête au reste du monde ; un pays en déficit en dépend.</li>
    <li><b>Énergie : la France produit ${nf(fr.energie)} % de ce qu'elle consomme</b>, grâce au nucléaire (l'uranium est importé, mais facile à stocker) ; l'Allemagne seulement ${nf(de.energie)} %, ce qui l'a durement exposée à la coupure du gaz russe en 2022. Les États-Unis, le Brésil et le Nigeria produisent plus qu'ils ne consomment. Le pétrole et le gaz, eux, sont presque entièrement importés en France.</li>
    <li><b>Stabilité des prix</b> : ${nf(fr.inflation, 1)} % d'inflation en ${D.annee_fmi}, la plus basse des six ; ${nf(P.NGA.inflation)} % au Nigeria, où l'épargne fond chaque année.</li>
    <li><b>Climat</b> : avec ${nf(fr.co2, 1)} tonnes de CO₂ par habitant émises sur le territoire, contre ${nf(de.co2, 1)} en Allemagne et ${nf(us.co2, 1)} aux États-Unis, la France est peu exposée au coût futur des émissions ; ses importations en contiennent cependant beaucoup (voir l'onglet <a href="#empreinte">Empreinte carbone</a>).</li>
    <li><b>Ce que ces chiffres ne montrent pas</b> : la dépendance industrielle (médicaments, composants électroniques, terres rares, voir les onglets <a href="#industrie">Industrie et innovation</a> et <a href="#soussol">Sous-sol</a>), la capacité de défense et l'autonomie alimentaire, où la France est exportatrice (voir l'onglet <a href="#agriculture">Agriculture</a>).</li>
  </ul>`;
  $("#pr-inst-txt").innerHTML = `<ul>
    <li><b>Ce sont les institutions qui expliquent le mieux pourquoi un pays devient riche et le reste</b> : quand les contrats sont respectés, la justice prévisible et le pouvoir contrôlé, on ose investir, innover et entreprendre. Le classement des six pays est presque le même que pour la richesse.</li>
    <li><b>La France est solide, sans être en tête</b> : ${fr.cpi_rang}<sup>e</sup> sur 182 pour la corruption (${fr.cpi}/100, contre ${de.cpi} pour l'Allemagne, ${de.cpi_rang}<sup>e</sup>) et ${fr.wjp_rang}<sup>e</sup> sur 143 pour l'État de droit. Elle a toutefois perdu 4 points en un an à l'indice de corruption.</li>
    <li><b>Les États-Unis reculent</b> : leur score de corruption est le plus bas depuis la création de l'indice, et leur État de droit a connu l'une des plus fortes baisses du monde en 2025.</li>
    <li><b>Au Brésil, en Inde et au Nigeria</b>, corruption et justice faible freinent l'investissement : c'est l'une des raisons pour lesquelles ces pays, riches en ressources et en population, peinent à rattraper les pays riches.</li>
    <li><b>Ces indices sont des perceptions</b>, construites à partir d'enquêtes auprès d'experts et d'entreprises (corruption) ou d'habitants et de juristes (État de droit) : des ordres de grandeur, pas des mesures exactes.</li>
  </ul>`;
  const CN = D.chine, FH = D.france_heritage;
  $("#pr-regime-txt").innerHTML = `<p style="margin-top:0"><b>Régime politique, richesse, liberté d'entreprendre et partage : quels liens ?</b></p><ul>
    <li><b>Démocratie et richesse vont ensemble, et la démocratie y contribue</b> : les pays riches sont presque tous des démocraties, à part Singapour et les monarchies pétrolières, et une étude sur 175 pays de 1960 à 2010 montre qu'un pays qui devient démocratique a, 25 ans plus tard, un PIB par habitant environ 20 % plus élevé (Acemoglu, Naidu, Restrepo et Robinson, 2019). Le lien passe par les institutions : un pouvoir contrôlé protège la propriété, les contrats et l'investissement.</li>
    <li><b>Le contre-exemple chinois</b> : la Chine (libertés : ${CN.fh}/100) a connu quarante ans de croissance très rapide sans démocratie, en rattrapant son retard. Elle reste à ${nf(CN.pib_hab)} dollars par habitant, moins de la moitié de la France. Rattraper son retard est possible sans libertés ; rejoindre les pays les plus riches, aucun grand pays ne l'a fait, hors cas particuliers comme Singapour ou les pays du pétrole.</li>
    <li><b>La liberté d'entreprendre en France : bonne sur les règles, faible sur le poids de l'État</b>. Avec ${nf(fr.heritage, 1)}/100, la France est ${fr.heritage_rang}<sup>e</sup> sur 176, loin de l'Allemagne (${nf(de.heritage, 1)}) et des États-Unis (${nf(us.heritage, 1)}). Dans le détail : droit de propriété ${nf(FH.droit_propriete)}/100, justice ${nf(FH.justice)}/100, facilité à créer une entreprise ${nf(FH.entreprendre)}/100, mais dépenses publiques ${nf(FH.depenses_publiques, 1)}/100, santé des finances publiques ${nf(FH.sante_budgetaire)}/100, impôts ${nf(FH.impots)}/100 et droit du travail ${nf(FH.travail)}/100. Ce n'est pas l'entrepreneur qui est empêché, c'est le poids des prélèvements et des dépenses qui pèse.</li>
    <li><b>Et le partage ?</b> Il n'y a pas de lien automatique. Les démocraties redistribuent davantage, car les électeurs le demandent, mais le résultat dépend des choix : les États-Unis sont libres et très inégalitaires, le Brésil démocratique est le plus inégalitaire des six, la France et l'Allemagne combinent libertés et faibles inégalités grâce à une forte redistribution.</li>
    <li><b>Il y a donc un arbitrage</b> : plus de redistribution veut dire plus d'impôts et de dépenses publiques, donc un score de liberté économique plus bas. La France a choisi le partage ; la question est de savoir si elle en a encore les moyens, avec la dette qu'il entraîne (voir l'onglet <a href="#couper">Couper où ?</a>).</li>
    <li><b>À lire avec prudence</b> : l'indice de liberté économique est publié par un centre de réflexion conservateur américain, qui note mieux les pays où l'État est petit et les impôts bas ; l'indice de Freedom House repose sur l'avis d'experts.</li>
  </ul>`;
  $("#pr-sens-txt").innerHTML = `<p style="margin-top:0"><b>Les pays démocratiques sont-ils tous riches ? Ou est-ce parce qu'ils sont riches qu'ils sont devenus démocratiques ?</b> Ni l'un ni l'autre tout à fait : c'est l'un des grands débats de l'économie politique.</p>
    <p style="margin-bottom:2px"><b>1. Toutes les démocraties ne sont pas riches</b></p>
    <ul>
      <li>L'Inde est la plus grande démocratie du monde, et reste pauvre ; le Ghana, le Sénégal, la Mongolie ou le Botswana sont des démocraties à revenus modestes.</li>
      <li>À l'inverse, Singapour, les monarchies du Golfe, et en partie la Chine, sont riches ou en passe de l'être sans être démocratiques.</li>
      <li>Le lien est donc une tendance, pas une règle.</li>
    </ul>
    <p style="margin-bottom:2px"><b>2. « Riches, donc démocratiques » : la thèse de la modernisation</b></p>
    <ul>
      <li><b>Le point de départ, Lipset (1959)</b> : en s'enrichissant, un pays s'urbanise, s'éduque et voit naître une large classe moyenne.</li>
      <li><b>Les classes moyennes, une fois à l'abri du besoin, réclament des droits</b> : liberté d'expression, élections libres, justice indépendante. Elles ont aussi quelque chose à protéger (un logement, une entreprise, une épargne) contre l'arbitraire du pouvoir.</li>
      <li><b>« Pas de bourgeoisie, pas de démocratie »</b> (Barrington Moore, 1966) : en Angleterre, ce sont les marchands et les propriétaires qui ont imposé des limites au roi.</li>
      <li><b>Qui paie des impôts veut contrôler leur usage</b> : « pas d'impôt sans représentation », criaient les colons américains en 1776. À l'inverse, les pays qui vivent de la rente pétrolière taxent peu leurs habitants, qui réclament moins de comptes : ils restent souvent autoritaires (Ross, 2001).</li>
      <li><b>Des exemples</b> : la Corée du Sud (1987), Taïwan (fin des années 1980), l'Espagne après Franco, le Chili (1990) sont devenus démocratiques après une forte croissance.</li>
      <li><b>Mais la thèse a ses limites</b> : la classe moyenne chinoise, aujourd'hui très nombreuse, n'a pas démocratisé le pays. Et Przeworski et Limongi (1997) ont montré que la richesse ne déclenche pas vraiment le passage à la démocratie : elle la rend durable. Au-delà d'un certain revenu, aucune démocratie ne s'est effondrée ; les démocraties pauvres, elles, basculent souvent.</li>
    </ul>
    <p style="margin-bottom:2px"><b>3. « Démocratiques, donc riches » : l'effet inverse</b></p>
    <ul>
      <li>Acemoglu, Naidu, Restrepo et Robinson (2019) : un pays qui se démocratise a, 25 ans après, un PIB par habitant environ 20 % plus élevé.</li>
      <li>Les raisons avancées : plus d'investissement, plus d'éducation et de santé, moins d'instabilité, et des dirigeants qui doivent rendre des comptes.</li>
    </ul>
    <p style="margin-bottom:2px"><b>4. Et la religion ? La thèse de Max Weber</b></p>
    <ul>
      <li><b>La thèse (1905)</b> : dans <i>L'Éthique protestante et l'esprit du capitalisme</i>, Weber soutient que le protestantisme, surtout calviniste, a favorisé le capitalisme : le travail vu comme une vocation, l'épargne, le refus des dépenses de luxe, la réussite comme signe d'élection. D'où, selon lui, l'avance de l'Europe du Nord.</li>
      <li><b>Ce que disent les études récentes</b> : les régions protestantes de Prusse étaient bien plus riches au XIX<sup>e</sup> siècle, mais l'écart s'explique presque entièrement par l'alphabétisation (Becker et Woessmann, 2009). Luther voulait que chacun lise la Bible : les protestants ont appris à lire plus tôt, et c'est cette instruction qui les a enrichis, plus qu'une morale du travail.</li>
      <li><b>Pas d'effet direct sur la croissance</b> : dans les villes allemandes de 1300 à 1900, être passé au protestantisme n'a pas accéléré la croissance (Cantoni, 2015).</li>
      <li><b>Un effet sur la démocratie</b> : dans les anciennes colonies, là où des missionnaires protestants ont ouvert des écoles, imprimé des livres et créé des associations, la démocratie est aujourd'hui plus solide (Woodberry, 2012).</li>
      <li><b>En clair</b> : ce n'est pas tant la foi qui a compté que l'école qu'elle a apportée. C'est encore l'éducation, comme dans la thèse de la modernisation.</li>
    </ul>
    <p style="margin-bottom:2px"><b>5. La réponse la plus solide : une cause commune</b></p>
    <ul>
      <li>Acemoglu, Johnson, Robinson et Yared (2008) ont comparé chaque pays à lui-même dans le temps : ils ne trouvent presque plus d'effet de la richesse sur la démocratie.</li>
      <li>Les deux viennent surtout d'une même racine : des institutions qui limitent le pouvoir et protègent la propriété, souvent héritées de l'histoire. L'Angleterre après la Glorieuse Révolution de 1688 en est l'exemple classique.</li>
    </ul>
    <p style="margin-bottom:2px"><b>En résumé</b></p>
    <ul>
      <li>La démocratie aide à s'enrichir, modestement mais réellement.</li>
      <li>La richesse aide surtout la démocratie à tenir, en faisant naître des classes moyennes qui réclament des droits et ont des biens à protéger.</li>
      <li>L'éducation est le fil rouge : elle enrichit, elle nourrit la demande de libertés, et c'est par elle que le protestantisme a compté.</li>
      <li>Les deux reposent sur des institutions solides : c'est pourquoi elles sont présentées ici comme le socle de tout le reste.</li>
    </ul>`;
  $("#pr-vie-txt").innerHTML = `<ul>
    <li><b>Les Français vivent le plus longtemps</b> des six pays : ${nf(fr.esperance_vie, 1)} ans, contre ${nf(us.esperance_vie, 1)} aux États-Unis, malgré un revenu plus bas. Un système de santé accessible compte autant que la richesse.</li>
    <li><b>L'IDH résume santé, éducation et revenu</b> : la France est ${fr.rang_idh}<sup>e</sup> au monde, derrière l'Allemagne (${de.rang_idh}<sup>e</sup>) et les États-Unis (${us.rang_idh}<sup>e</sup>), surtout à cause d'une durée d'études plus courte chez les adultes (${nf(fr.annees_etudes, 1)} ans, contre ${nf(de.annees_etudes, 1)} en Allemagne) et d'un revenu plus bas.</li>
    <li><b>Corrigé des inégalités, la France dépasse les États-Unis</b> : ${nf(fr.idh_ajuste, 3)} contre ${nf(us.idh_ajuste, 3)}. Au Brésil, en Inde et au Nigeria, les inégalités font perdre 24 à 32 % de l'IDH.</li>
  </ul>`;
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
