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
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
