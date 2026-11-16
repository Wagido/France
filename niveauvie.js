/* Vit-on mieux qu'avant ? Pouvoir d'achat depuis 1960, dépenses contraintes, comparaison en PPA, salaires et SMIC */
(() => {
"use strict";
let N = null;
const $ = s => document.querySelector(s);
const VOIS = { FR: ["France", "#dc2626"], DE: ["Allemagne", "#334155"], NL: ["Pays-Bas", "#e07b39"], BE: ["Belgique", "#a855f7"], IT: ["Italie", "#16a34a"], ES: ["Espagne", "#eab308"], EU27_2020: ["Moyenne de l'UE", "#94a3b8"] };
// métiers rapportés au SMIC : valeurs publiées, sans série continue (voir la note sous le tableau)
const METIERS = [
  { l: "Salarié au SMIC", v: [["toujours", "1"]], note: "1 802 € brut par mois à temps plein en 2025, environ 1 426 € net" },
  { l: "Professeur des écoles débutant", v: [["1990", "1,8"], ["2000", "1,6"], ["2010", "1,4"], ["2020", "1,5"]], note: "salaire statutaire brut de début de carrière ÷ SMIC brut à temps plein ; ministère de l'Éducation nationale, repris par le Sénat",
    src: [["Sénat, avis budgétaire 2020", "https://www.senat.fr/rap/a19-145-3/a19-145-32.html"], ["Sénat, rapport budgétaire 2023", "https://www.senat.fr/rap/l22-115-314/l22-115-3143.html"]] },
  { l: "Professeur certifié débutant (collège, lycée)", v: [["1980", "2,2"], ["2022", "1,1"]], note: "début de carrière, brut ; chiffres repris par la presse d'après le ministère",
    src: [["Le Point, juillet 2022", "https://media.ac-normandie.fr/-/communication/revue-presse/2022/07/15/Le%20Point_nat_actu_Les%20smicards%20de%20l'enseignement.pdf"]] },
  { l: "Ingénieur débutant", v: [["2019", "1,9"]], note: "salaire médian brut annuel de 35 000 € (enquête IESF 2019) ÷ SMIC brut annuel 2019 (18 255 €)",
    src: [["L'Étudiant, d'après l'enquête IESF", "https://www.letudiant.fr/etudes/ecole-ingenieur/le-salaire-des-ingenieurs.html"]] },
  { l: "Ingénieur (tous âges, médiane)", v: [["2019", "3,1"]], note: "salaire médian brut annuel de 57 500 € (IESF, enquête 2020) ÷ SMIC brut annuel 2019",
    src: [["IESF, synthèse de l'enquête 2020", "https://www.alumni.utc.fr/medias/editor/files/Synthese_Enquete_2020.pdf"]] },
];
async function init() {
  if (!window.TH || !$("#nv-pa")) { setTimeout(init, 100); return; }
  try { N = await fetch("data/niveau_vie.json").then(r => r.json()); } catch (e) { return; }
  draw();
}
function draw() {
  const { kpis, lineChart, legend, esc } = window.TH;
  const n0 = v => Math.round(v).toLocaleString("fr-FR"), f1 = v => v.toLocaleString("fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const PA = N.pouvoir_achat, last = PA[PA.length - 1], pre = N.preengagees, p0 = pre[0], pL = pre[pre.length - 1];
  const P = Object.fromEntries(N.pays.map(r => [r.code, r])), fr = P.FR, fr95 = fr.aic_serie.find(d => d.annee === 1995);
  const sm = N.smic, s0 = sm[0], sL = sm[sm.length - 1];
  const maxRatio = sm.reduce((a, r) => r.ratio > (a.ratio || 0) ? r : a, {});
  // croissance moyenne par décennie du pouvoir d'achat par UC
  const idx = Object.fromEntries(PA.map(r => [r.annee, r.idx_uc]));
  const dec = [[1960, 1970], [1970, 1980], [1980, 1990], [1990, 2000], [2000, 2010], [2010, last.annee]].map(([a, b]) => [a, b, 100 * (Math.pow(idx[b] / idx[a], 1 / (b - a)) - 1)]);
  const g10 = dec[dec.length - 1][2];
  const arb = last.idx_uc * (1 - pL.part / 100) / (1 - p0.part / 100);
  kpis("#nv-kpis", [
    ["× " + f1(last.idx_uc / 100), [`pouvoir d'achat par personne depuis 1960`, `revenu après impôts et prestations, corrigé des prix`], "Depuis 1960"],
    ["+" + f1(g10).replace(",0", "") + " % par an", [`depuis 2010, contre +${f1(dec[0][2])} % par an dans les années 1960`], "Croissance"],
    [f1(pL.part) + " %", [`du revenu part en dépenses contraintes (${pL.annee})`, `logement, assurances, abonnements ; ${f1(p0.part)} % en 1960`], "Dépenses contraintes"],
    [fr.aic + "", [`consommation par habitant en PPA (UE = 100, ${fr.annee})`, `${fr95.v} en 1995`], "Face à l'Europe"],
  ]);
  $("#nv-resume").innerHTML = `<p style="margin-top:0"><b>En résumé : on vit mieux qu'en 1960 ou en 1990, mais le progrès s'est presque arrêté, et la France recule par rapport à ses voisins</b></p><ul>
    <li><b>En moyenne, non, on ne vit pas moins bien qu'avant</b> : une fois les prix retirés, le revenu disponible par personne a été multiplié par ${f1(last.idx_uc / 100)} depuis 1960. Il n'a reculé que quelques années : ${PA.filter(r => r.evol_uc < 0).map(r => r.annee).join(", ")}.</li>
    <li><b>Mais il ne progresse presque plus</b> : +${f1(dec[0][2])} % par an dans les années 1960, +${f1(g10)} % par an depuis 2010. À ce rythme, il faut ${Math.round(Math.log(2) / Math.log(1 + g10 / 100))} ans pour doubler son niveau de vie, contre ${Math.round(Math.log(2) / Math.log(1 + dec[0][2] / 100))} ans dans les années 1960. C'est d'abord cela que l'on ressent.</li>
    <li><b>Une plus grande part du revenu est « déjà dépensée »</b> avant de faire ses courses : logement, assurances, abonnements. ${f1(p0.part)} % du revenu en 1960, ${f1(pL.part)} % en ${pL.annee}, dont ${f1(pL.logement)} % pour le logement. Ce qui reste à choisir librement a moins progressé que le revenu : environ × ${f1(arb / 100)} au lieu de × ${f1(last.idx_uc / 100)} (ordre de grandeur).</li>
    <li><b>Par rapport aux voisins, la France décroche</b> : en parité de pouvoir d'achat (PPA, c'est-à-dire en tenant compte des prix de chaque pays), un Français consommait ${fr95.v - 100} % de plus que la moyenne européenne en 1995, ${fr.aic - 100} % de plus en ${fr.annee}. En 1995, elle était au niveau de la Belgique (${(P.BE.aic_serie.find(d => d.annee === 1995) || {}).v}) et des Pays-Bas (${(P.NL.aic_serie.find(d => d.annee === 1995) || {}).v}) ; elle est aujourd'hui derrière eux (${P.BE.aic} et ${P.NL.aic}).</li>
    <li><b>Et les salaires se sont resserrés vers le SMIC</b> : le SMIC a été multiplié par ${f1(sL.mensuel / s0.mensuel)} depuis ${s0.annee}, plus vite que le salaire moyen. Un professeur débutant gagnait plus de 2 SMIC en 1980, à peine plus de 1 aujourd'hui. Beaucoup de métiers qualifiés se sentent déclassés, même si leur pouvoir d'achat n'a pas forcément baissé.</li>
    <li><b>Et le logement se rembourse beaucoup plus lentement</b> : environ ${Math.round(N.simu.filter(r => r.annee >= 1965 && r.annee <= 1975).reduce((x, r, _, A) => x + r.annees / A.length, 0))} ans pour un achat entre 1965 et 1975, quand l'inflation effaçait les dettes, contre ${Math.round(N.simu.slice(-3).reduce((x, r) => x + r.annees / 3, 0))} ans aujourd'hui (simulation plus bas).</li>
  </ul>`;
  // 1. pouvoir d'achat
  lineChart($("#nv-pa"), PA, [{ k: "idx_uc", l: "Par unité de consommation (par personne)", c: "#3b6fd6" }, { k: "idx", l: "Ensemble des ménages", c: "#94a3b8", dash: "4 4" }], { yfmt: v => v, vfmt: v => f1(v) });
  legend("#nv-pa-legend", [["Pouvoir d'achat par personne (par unité de consommation)", "#3b6fd6"], ["Pouvoir d'achat de l'ensemble des ménages (augmente aussi avec la population)", "#94a3b8", true]]);
  const mx = Math.max(...dec.map(d => d[2]));
  $("#nv-dec").innerHTML = `<div class="bars">${dec.map(([a, b, g]) => `<div class="bar-row"><span class="lab">${a}-${b}</span><span class="val">+${f1(g)} %</span>
    <span class="track"><span class="fill" style="width:${(100 * g / mx).toFixed(1)}%;background:${b === last.annee ? "#dc2626" : "#3b6fd6"}"></span></span></div>`).join("")}</div>`;
  // 2. dépenses pré-engagées
  lineChart($("#nv-pre"), pre, [{ k: "part", l: "Dépenses contraintes, total", c: "#7c3aed" }, { k: "logement", l: "dont logement", c: "#e07b39" }], { yfmt: v => v + " %", vfmt: v => f1(v) + " %", h: 240 });
  legend("#nv-pre-legend", [["Dépenses contraintes (pré-engagées), en % du revenu disponible", "#7c3aed"], ["dont logement : loyers, loyers « fictifs » des propriétaires, énergie, eau, charges", "#e07b39"]]);
  // 3. Europe en PPA
  const yrs = [...new Set(fr.aic_serie.map(d => d.annee))];
  const rows = yrs.map(y => Object.fromEntries([["annee", y], ...Object.keys(VOIS).map(g => [g, (P[g]?.aic_serie.find(d => d.annee === y) || {}).v ?? null])]));
  lineChart($("#nv-ppa"), rows, Object.entries(VOIS).map(([g, [l, c]]) => ({ k: g, l, c, dash: g === "EU27_2020" ? "4 4" : null })), { nozero: true, yfmt: v => v, vfmt: v => v });
  legend("#nv-ppa-legend", Object.entries(VOIS).map(([g, [l, c]]) => [l, c, g === "EU27_2020"]));
  const cmp = N.pays.filter(r => r.vol_2000 != null && ["FR", "DE", "NL", "BE", "AT", "DK", "SE", "FI", "IT", "ES", "PT", "CH", "EU27_2020"].includes(r.code)).sort((a, b) => b.aic - a.aic);
  const m2 = Math.max(...cmp.map(r => r.vol_2000));
  $("#nv-pays").innerHTML = `<div class="tv-row tv-head nv-row"><span>Pays</span><span>Consommation par habitant en PPA, UE = 100 (${fr.annee})</span><span>Hausse réelle depuis 2000</span><span>depuis 2019</span></div>` +
    cmp.map(r => `<div class="tv-row nv-row${r.code === "FR" ? " me" : ""}"><span class="lab">${esc(r.nom)}</span>
      <span class="tr"><span class="bar" style="width:${(100 * r.aic / 145).toFixed(1)}%;background:${r.code === "FR" ? "#dc2626" : "#3b6fd6"}"></span><b>${r.aic}</b></span>
      <span class="tr"><span class="bar" style="width:${(100 * Math.max(0, r.vol_2000) / m2).toFixed(1)}%;background:#94a3b8"></span><small>+${f1(r.vol_2000)} %</small></span>
      <span class="num">${r.vol_2019 >= 0 ? "+" : "−"}${f1(Math.abs(r.vol_2019))} %</span></div>`).join("");
  const de = P.DE, eu = P.EU27_2020;
  $("#nv-ppa-txt").innerHTML = `<ul>
    <li><b>La PPA retire l'effet des prix</b> : 1 000 € n'achètent pas la même chose à Paris, Berlin ou Lisbonne. Eurostat convertit tout en un « euro de pouvoir d'achat » commun.</li>
    <li><b>On mesure ici la consommation effective par habitant</b> : ce que chacun consomme, y compris ce que paie la collectivité (soins remboursés, école). C'est l'indicateur que préfère Eurostat pour comparer le bien-être matériel.</li>
    <li><b>La France est passée de ${fr95.v} à ${fr.aic}</b> (UE = 100) de 1995 à ${fr.annee}. Une partie de la baisse vient du rattrapage de l'Europe de l'Est, qui fait monter la moyenne. Mais la France recule aussi face à ses voisins riches : l'Allemagne est à ${de.aic}, les Pays-Bas à ${P.NL.aic}.</li>
    <li><b>En volume, la consommation par Français a progressé de ${f1(fr.vol_2000)} % depuis 2000</b> (moyenne de l'UE : +${f1(eu.vol_2000)} %, Allemagne : +${f1(de.vol_2000)} %), et de seulement ${f1(fr.vol_2019)} % depuis 2019.</li>
  </ul>`;
  // 4. SMIC et salaire moyen
  lineChart($("#nv-smic"), sm, [{ k: "salaire_moyen", l: "Salaire moyen brut, temps plein", c: "#3b6fd6" }, { k: "mensuel", l: "SMIC brut, temps plein", c: "#dc2626" }], { vfmt: v => n0(v) + " €" });
  legend("#nv-smic-legend", [["Salaire moyen brut par mois, à temps plein", "#3b6fd6"], ["SMIC brut par mois, à temps plein (SMIG avant 1970)", "#dc2626"]]);
  lineChart($("#nv-ratio"), sm.filter(r => r.ratio), [{ k: "ratio", l: "Salaire moyen ÷ SMIC", c: "#7c3aed" }], { nozero: true, h: 220, yfmt: v => f1(v), vfmt: v => f1(v) + " SMIC" });
  $("#nv-metiers").innerHTML = `<table class="dv-t nv-t"><thead><tr><th>Qui ?</th><th>Combien de SMIC ?</th><th>Ce que mesure le chiffre</th></tr></thead><tbody>` +
    METIERS.map(m => `<tr><td><b>${esc(m.l)}</b></td><td>${m.v.map(([a, v]) => `<span class="nv-pt"><small>${a}</small> <b>${v}</b></span>`).join(" → ")}</td>
      <td class="muted">${esc(m.note)}${m.src ? " — " + m.src.map(([l, u]) => `<a href="${u}" target="_blank" rel="noopener">${esc(l)}</a>`).join(", ") : ""}</td></tr>`).join("") + `</tbody></table>`;
  $("#nv-smic-txt").innerHTML = `<ul>
    <li><b>Le SMIC a été multiplié par ${f1(sL.mensuel / s0.mensuel)} en euros constants</b> depuis ${s0.annee} : ${n0(s0.mensuel)} € par mois (en euros de ${N.annee_euros}), ${n0(sL.mensuel)} € brut en ${sL.annee}. Le salaire moyen, lui, a été multiplié par ${f1(sL.salaire_moyen / s0.salaire_moyen)}.</li>
    <li><b>L'écart s'est donc resserré</b> : le salaire moyen valait ${f1(maxRatio.ratio)} SMIC en ${maxRatio.annee}, ${f1(sL.ratio)} SMIC en ${sL.annee}. Le grand saut date de 1968 : les accords de Grenelle relèvent le SMIG de 35 % d'un coup. L'écart ne bouge plus guère depuis les années 1990 : les baisses de cotisations patronales, concentrées près du SMIC, rendent coûteux pour l'employeur d'augmenter les salaires juste au-dessus, ce qui les tasse vers le bas.</li>
    <li><b>Pour les professeurs, la chute est nette</b> : un certifié débutant passe de 2,2 SMIC en 1980 à environ 1,1 en 2022, un professeur des écoles débutant de 1,8 SMIC en 1990 à 1,5 en 2020. Leur traitement a été longtemps gelé (point d'indice) pendant que le SMIC suivait les prix.</li>
    <li><b>Un ingénieur débutant gagne environ 2 SMIC</b>, un ingénieur au milieu de sa carrière environ 3. Il n'existe pas de série longue fiable pour les ingénieurs ; on ne peut pas dire de combien leur écart avec le SMIC a baissé.</li>
    <li><b>Se sentir moins riche que ses parents</b> peut donc venir de sa place par rapport au SMIC, et du prix du logement (voir l'onglet <a href="#patrimoine">Patrimoine</a>), plus que de son pouvoir d'achat réel.</li>
  </ul>`;
  // 5. « un seul salaire suffisait » : simulation sur la durée du prêt, et comparaison avant / aujourd'hui
  const SI = N.simu, H = N.simu_hyp, at = y => SI.find(r => r.annee === y);
  const moy = (a, b) => SI.filter(r => r.annee >= a && r.annee <= b).reduce((x, r, _, A) => x + r.annees / A.length, 0);
  const dSI = SI.map(r => ({ annee: r.annee, c: r.connu ? r.annees : null, p: r.connu ? null : r.annees }));
  const lastC = dSI.filter(d => d.c != null).at(-1); if (lastC) lastC.p = lastC.c;
  lineChart($("#nv-simu"), dSI, [{ k: "c", l: "Années pour rembourser", c: "#dc2626" }, { k: "p", l: "Années pour rembourser (revenus futurs supposés)", c: "#dc2626", dash: "4 4" }], { vfmt: v => v + " ans", yfmt: v => v + " ans", h: 250 });
  legend("#nv-simu-legend", [["Revenus observés jusqu'à la fin du prêt", "#dc2626"], [`Prêt pas encore fini : revenus supposés en hausse de ${H.croissance_future} % par an après ${H.derniere_annee}`, "#dc2626", true]]);
  const a7 = moy(1965, 1975), a80 = moy(1980, 1990), aN = moy(SI.at(-1).annee - 2, SI.at(-1).annee);
  const AV = [
    ["Femmes dans la population active", "33 % (1962)", "48 % (2008)", ["INSEE, Maruani et Meron", "https://www.insee.fr/fr/statistiques/fichier/2405570/maruani-meron_presentation.pdf"]],
    ["Durée des prêts immobiliers", "10 ans au plus (1965), 13 ans (1970)", "15 ans (1999), puis +0,7 an par an", ["Friggit, IGEDD", "https://www.igedd.developpement-durable.gouv.fr/IMG/pdf/evolution-prix-immobilier-friggit_cle0c611b.pdf"]],
    ["Inflation moyenne sur 10 ans", `+${at(1970).inflation_10} % de 1970 à 1980`, `+${at(2014)?.inflation_10 ?? "–"} % de 2014 à 2024`, ["INSEE", "https://www.insee.fr/fr/statistiques/serie/001759970"]],
    ["Logements sans confort sanitaire (WC intérieur, douche ou baignoire)", "27 % (1978)", "presque aucun (2013)", ["INSEE, Les conditions de logement", "https://www.insee.fr/fr/statistiques/fichier/2586024/LOGFRA17k_FL6_confort.pdf"]],
    ["Surface par personne", "31 m² (1984)", "40 m² (2013)", ["INSEE", "https://www.insee.fr/fr/statistiques/fichier/2586024/LOGFRA17k_FL6_confort.pdf"]],
    ["Partent en vacances au moins une fois par an", "43 % (1964)", "65 % (2004)", ["INSEE", "https://www.insee.fr/fr/statistiques/fichier/1374551/fratour08c.PDF"]],
  ];
  $("#nv-avant").innerHTML = `<table class="dv-t nv-t"><thead><tr><th></th><th>Avant</th><th>Après</th></tr></thead><tbody>` +
    AV.map(([l, a, b, [sl, su]]) => `<tr><td>${esc(l)} <small class="muted">(<a href="${su}" target="_blank" rel="noopener">${esc(sl)}</a>)</small></td><td><b>${a}</b></td><td><b>${b}</b></td></tr>`).join("") + `</tbody></table>`;
  $("#nv-simu-note").innerHTML = `Simulation, pour un ménage qui emprunte ${f1(H.emprunt)} années de son revenu en 2000, et proportionnellement plus ou moins les autres années selon le prix des logements rapporté au revenu par ménage (constant de 1965 à 1995, comme le montre Jacques Friggit ; ${f1(SI.at(-1).emprunt)} années de revenu en ${SI.at(-1).annee}). Prêt à taux fixe, au taux des emprunts d'État à 10 ans de l'année d'achat (les taux des prêts immobiliers en sont très proches), renégocié quand le taux du marché, plus 1 point, devient plus bas. Le ménage rembourse chaque année ${Math.round(100 * H.effort)} % de son revenu, qui suit le salaire moyen observé. Ce n'est pas un cas réel : c'est une façon de comparer les époques à règles égales. Sources : Eurostat (irt_lt_mcby_a), base Jordà-Schularick-Taylor avant 1970, INSEE.`;
  $("#nv-vie-txt").innerHTML = `<p style="margin-top:0"><b>Le souvenir est en partie vrai, mais pour des raisons qui ne reviendront pas, et on achetait beaucoup moins</b></p><ul>
    <li><b>Rembourser en quelques années : vrai, grâce à l'inflation</b>. Dans la simulation, un logement acheté entre 1965 et 1975 est remboursé en ${Math.round(a7)} ans environ, contre ${Math.round(aN)} ans aujourd'hui. Les prix montaient de 3 à 14 % par an (+${at(1970).inflation_10} % de 1970 à 1980), les salaires encore plus vite, et la mensualité restait fixe : pour un achat en 1970, au bout de 10 ans, elle ne pesait plus que ${Math.round(100 * at(1970).poids_10)} % de ce qu'elle pesait au départ, contre ${Math.round(100 * at(2014).poids_10)} % pour un achat en 2014. Les taux d'intérêt, une fois l'inflation retirée, ont été très bas, parfois négatifs, de 1974 à 1981. Ce mécanisme a disparu avec l'inflation à 2 %.</li>
    <li><b>Ce n'était pas vrai pour tout le monde</b> : ceux qui ont acheté entre 1980 et 1990 ont mis ${Math.round(a80)} ans environ, car l'inflation a baissé alors que les taux restaient très hauts, même en renégociant leur prêt.</li>
    <li><b>« Seul le mari travaillait » : à nuancer</b>. En 1962, un actif sur trois était déjà une femme (6,6 millions), souvent dans l'exploitation agricole ou le commerce familial. Depuis, le travail des femmes a fortement augmenté. Mais le prix des logements, rapporté au revenu des ménages, a augmenté après 2000 : il absorbe une bonne partie du second salaire.</li>
    <li><b>On n'achetait pas la même chose</b> : à la fin des années 1970, un logement sur quatre n'avait ni douche ni baignoire, un sur quatre pas de WC à l'intérieur. On dispose aujourd'hui d'un tiers de surface en plus par personne. Une bonne part de la hausse du budget logement de 1965 à 2000 a payé ce confort supplémentaire, pas une hausse du prix au mètre carré par rapport aux revenus (Friggit).</li>
    <li><b>Les vacances étaient plus rares</b> : 43 % des Français partaient en vacances en 1964, 65 % quarante ans plus tard. Pour les résidences secondaires, nous n'avons pas trouvé de série fiable remontant aux années 1960.</li>
    <li><b>Sur toute une vie, la génération qui a acheté dans les années 1960-1970 a eu un avantage rare</b> : un prêt effacé par l'inflation, puis des logements dont la valeur a fortement monté après 2000, et la retraite à 60 ans à partir de 1983. Un jeune ménage aujourd'hui rembourse plus longtemps, commence à travailler plus tard et partira plus tard à la retraite (voir l'onglet <a href="#travail">Temps de travail</a>). À revenu égal, il lui reste donc moins d'années « libres », avec un logement payé.</li>
  </ul>`;
  // cadrage en deux temps, et chiffres clés de la partie « sur toute une vie »
  const SIm = (a, b) => N.simu.filter(r => r.annee >= a && r.annee <= b).reduce((x, r, _, A) => x + r.annees / A.length, 0);
  const yN = N.simu.at(-1).annee, nA = SIm(1965, 1975), nN = SIm(yN - 2, yN), eff = N.simu_hyp.effort;
  $("#nv-deux").innerHTML = `<p style="margin-top:0"><b>Deux façons de répondre à la question</b></p><ul>
    <li><b>1. À un instant donné</b> : combien je gagne, où je me situe par rapport au SMIC, ce que mon revenu permet d'acheter cette année, en France et comparé aux autres pays en tenant compte des prix (PPA). Sur ce plan, on vit nettement mieux qu'en 1960, mais on ne progresse presque plus.</li>
    <li><b>2. Sur toute une vie</b> : ce que l'on peut vraiment s'offrir en une carrière, et d'abord un logement, la plus grosse dépense d'une vie. Là, la réponse est moins favorable : un logement coûte plus d'années de travail qu'avant, et l'inflation n'efface plus les dettes.</li>
  </ul>`;
  kpis("#nv-vie-kpis", [
    ["≈ " + Math.round(nA) + " ans", ["pour rembourser un logement acheté entre 1965 et 1975", "simulation, 30 % du revenu chaque année"], "Achat en 1965-1975"],
    ["≈ " + Math.round(nN) + " ans", [`pour un achat aujourd'hui (${yN - 2}-${yN})`, "même règle de calcul"], "Achat aujourd'hui"],
    ["≈ " + f1(eff * nA) + " ans", ["de revenu consacrés au logement sur une vie, pour un achat en 1965-1975"], "Coût sur une vie, avant"],
    ["≈ " + f1(eff * nN) + " ans", ["de revenu consacrés au logement sur une vie, pour un achat aujourd'hui", `soit ${Math.round(100 * (nN / nA - 1))} % de plus`], "Coût sur une vie, aujourd'hui"],
  ]);
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
