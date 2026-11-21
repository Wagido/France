/* Retraites : « Les retraités vivent-ils mieux que les actifs ? » (data/generations.json, scripts/build_generations.py) */
(() => {
"use strict";
let D = null, L = null, mode = "uc";
const $ = s => document.querySelector(s);
const f1 = v => v == null ? "–" : v.toLocaleString("fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const f0 = v => v == null ? "–" : Math.round(v).toLocaleString("fr-FR");
const sg = v => (v > 0 ? "+" : v < 0 ? "−" : "") + f1(Math.abs(v));
const ROUGE = "#dc2626";
const AGES = [{ k: "moins30", l: "Moins de 30 ans", c: "#7dd3fc" }, { k: "a30_44", l: "30 à 44 ans", c: "#0ea5e9" }, { k: "a45_59", l: "45 à 59 ans", c: "#1d4ed8" }, { k: "plus60", l: "60 ans ou plus", c: ROUGE }];
const MODES = {
  menage: { l: "Par ménage", t: "Dépense de chaque ménage, quelle que soit sa taille. Un couple avec trois enfants compte autant qu'une personne seule : les ménages âgés, plus petits, paraissent pauvres." },
  personne: { l: "Par personne", t: "Dépense du ménage divisée par son nombre de personnes. Un bébé compte autant qu'un adulte et l'on ignore qu'à deux on partage le logement, la voiture, le frigo : les grands ménages (familles) paraissent pauvres, les petits (retraités) riches." },
  uc: { l: "Par équivalent adulte (méthode du FT)", t: "Méthode standard : le 1er adulte compte pour 1, chaque autre personne de 14 ans ou plus pour 0,5, chaque enfant pour 0,3 (échelle OCDE modifiée). C'est la mesure du graphique du Financial Times. Elle inclut les loyers fictifs des propriétaires (non relevés en 1988)." },
  uc_hors_loyer: { l: "Par équivalent adulte, sans loyers fictifs", t: "Même mesure, mais en retirant le loyer que les propriétaires sont censés « se payer » à eux-mêmes : une dépense comptable qui ne sort pas de leur poche." }
};

async function init() {
  if (!window.TH) { setTimeout(init, 100); return; }
  try {
    [D, L] = await Promise.all([fetch("data/generations.json", { cache: "no-cache" }).then(r => r.json()),
      fetch("data/logement_age.json", { cache: "no-cache" }).then(r => r.json()).catch(() => null)]);
  } catch (e) { return; }
  const seg = $("#gen-mode");
  if (seg) {
    seg.innerHTML = Object.entries(MODES).map(([k, m]) => `<button type="button" data-m="${k}" aria-pressed="${k === mode}">${m.l}</button>`).join("");
    seg.onclick = ev => { const b = ev.target.closest("button"); if (!b) return; mode = b.dataset.m; seg.querySelectorAll("button").forEach(x => x.setAttribute("aria-pressed", x === b)); conso(); };
  }
  let rt; addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(draw, 150); });
  draw();
}
function draw() { if (!D || !$("#gen-conso")) return; conso(); tableau(); revenu(); finances(); textes(); }

function conso() {
  const { lineChart, legend } = window.TH;
  lineChart($("#gen-conso"), D.consommation[mode], AGES, { nozero: true, h: 280, vfmt: v => f1(v), yfmt: v => v, xticks: 6 });
  legend("#gen-conso-legend", AGES.map(a => [a.l, a.c]));
  $("#gen-conso-mode").textContent = MODES[mode].t;
}

function tableau() {
  const C = D.consommation, n = C.uc.length - 1, an = C.uc[n].annee, det = D.consommation_detail[n];
  const ligne = (m, extra) => `<tr><td>${MODES[m].l}</td>${AGES.map(a => { const v = C[m][n][a.k]; return `<td class="num"${a.k === "plus60" ? ` style="color:${ROUGE};font-weight:600"` : ""}>${f1(v)}</td>`; }).join("")}<td class="muted">${extra}</td></tr>`;
  $("#gen-tab").innerHTML = `<div class="table-scroll"><table class="cmp-t"><thead><tr><th>Façon de compter (vague ${an})</th>${AGES.map(a => `<th>${a.l}</th>`).join("")}<th>Pourquoi ça change</th></tr></thead><tbody>
    ${ligne("menage", `Ménages de ${f1(det.personnes.plus60)} personne en moyenne chez les 60 ans ou plus, ${f1(det.personnes.a30_44)} chez les 30-44 ans`)}
    ${ligne("personne", "Chaque enfant compte pour un adulte, aucune économie d'échelle")}
    ${ligne("uc", "Mesure standard, celle du FT")}
    ${ligne("uc_hors_loyer", `Les loyers fictifs pèsent ${f1(det.loyer_fictif_pm.plus60 / 10)} % de la dépense des 60 ans ou plus, ${f1(det.loyer_fictif_pm.moins30 / 10)} % de celle des moins de 30 ans`)}
    </tbody></table></div><p class="muted" style="font-size:.8rem;margin:4px 0 0">Indice 100 = moyenne de l'ensemble des ménages, calculée de la même façon dans chaque ligne.</p>`;
}

function revenu() {
  const { lineChart, legend } = window.TH;
  const G = [{ k: "moins18", l: "Moins de 18 ans", c: "#a5b4fc" }, { k: "a18_24", l: "18 à 24 ans", c: "#7dd3fc" }, { k: "a25_49", l: "25 à 49 ans", c: "#0ea5e9" }, { k: "a50_64", l: "50 à 64 ans", c: "#1d4ed8" }, { k: "plus65", l: "65 ans ou plus", c: ROUGE }];
  lineChart($("#gen-revenu"), D.revenu, G, { nozero: true, h: 280, vfmt: v => f1(v), yfmt: v => v });
  legend("#gen-revenu-legend", G.map(a => [a.l, a.c]));
}

function finances() {
  const { lineChart, legend } = window.TH;
  const F = D.finances;
  const S1 = [{ k: "d_vieillesse", l: "Dépense « vieillesse » (pensions, dépendance)", c: ROUGE }, { k: "d_sante", l: "Santé (tous âges)", c: "#f97316" },
    { k: "d_prelevements", l: "Impôts et cotisations", c: "#9ca3af" }, { k: "d_investissement", l: "Investissement public", c: "#0ea5e9" }];
  lineChart($("#gen-fin"), F, S1, { h: 280, vfmt: v => sg(v) + " pt", yfmt: v => (v > 0 ? "+" : "") + v });
  legend("#gen-fin-legend", S1.map(a => [a.l, a.c]));
  const S2 = [{ k: "vieillesse", l: "Dépense vieillesse réelle", c: ROUGE }, { k: "vieillesse_demo", l: `Si chaque personne de 65 ans ou plus avait reçu la même part du PIB par habitant qu'en ${F[0].annee}`, c: ROUGE, dash: "5 4" }];
  lineChart($("#gen-demo"), F, S2, { nozero: true, h: 260, vfmt: v => f1(v) + " % du PIB", yfmt: v => v + " %" });
  legend("#gen-demo-legend", S2.map(a => [a.l, a.c, !!a.dash]));
}

function textes() {
  const C = D.consommation, n = C.uc.length - 1, c0 = C.uc.find(r => r.plus60 != null), cn = C.uc[n];
  const R = D.revenu.filter(r => r.plus65 != null && r.annee >= 2004), r0 = R[0], rmax = R.reduce((a, b) => b.plus65 > a.plus65 ? b : a), rn = R.at(-1);
  const F = D.finances, a = F[0], z = F.at(-1);
  const gen = 100 * (z.generosite / a.generosite - 1);
  const pm = L?.patrimoine_median, pj = pm?.[0], p6 = pm?.[1], pr = L?.proprietaires;
  $("#gen-conso-txt").innerHTML = `<p><b>Ce que l'on voit.</b> Avec la méthode du FT, les ménages de 60 ans ou plus passent de ${f1(c0.plus60)} en ${c0.annee} à ${f1(cn.plus60)} dans la dernière enquête : ils dépensent désormais un peu plus que la moyenne, et plus que les 30-44 ans (${f1(cn.a30_44)}). Le graphique du FT est donc juste pour la France.</p>
    <p><b>Mais l'écart dépend entièrement de la façon de compter.</b> Par ménage, les 60 ans ou plus sont loin derrière (${f1(C.menage[n].plus60)}) ; par personne, loin devant (${f1(C.personne[n].plus60)}). La mesure par équivalent adulte est la bonne, mais elle compte comme une dépense le loyer fictif des propriétaires, très nombreux parmi les plus âgés. <b>Sans ce loyer fictif, les 60 ans ou plus restent sous la moyenne (${f1(C.uc_hors_loyer[n].plus60)})</b>${AGES.every(x => C.uc_hors_loyer[n][x.k] >= C.uc_hors_loyer[n].plus60) ? ", et derrière toutes les autres tranches d'âge" : ""}. Le « dépassement » du FT vient pour l'essentiel du logement possédé, c'est-à-dire du patrimoine, pas de la pension.</p>`;
  $("#gen-revenu-txt").innerHTML = `<p><b>Le revenu raconte la même histoire, en plus nuancé.</b> Le revenu médian des 65 ans ou plus, par unité de consommation, est passé de ${f1(r0.plus65)} % de celui de l'ensemble en ${r0.annee} (début de l'enquête actuelle) à ${f1(rmax.plus65)} % en ${rmax.annee}, puis il est redescendu à ${f1(rn.plus65)} % en ${rn.annee}. Ce recul depuis le milieu des années 2010 tient à des décisions précises : gel des pensions de base en 2014-2015, hausse de la CSG des retraités en 2018, revalorisation limitée à 0,3 % en 2019 (et en 2020 pour les pensions au-dessus de 2 000 €), sous-indexation des retraites complémentaires. Surtout, les pensions suivent les prix, pas les salaires : quand les salaires progressent, les retraités décrochent mécaniquement. Les 25-49 ans sont à ${f1(rn.a25_49)} %, les 50-64 ans à ${f1(rn.a50_64)} %. Ce revenu ne compte pas les loyers fictifs.</p>`;
  $("#gen-pat-txt").innerHTML = pm ? `<p><b>Le vrai écart est dans le patrimoine.</b> Début 2021, le patrimoine brut médian des ménages de 60 à 69 ans atteint ${f0(p6.v)} €, contre ${f0(pj.v)} € pour les moins de 30 ans, soit ${f0(p6.v / pj.v)} fois plus (INSEE). ${f0(pr.at(-1)["2021"])} % des ménages de 65 ans ou plus sont propriétaires de leur logement, contre ${f1(pr[0]["2021"])} % des moins de 30 ans. Une partie de cet écart est normale : on épargne toute sa vie. Une autre ne l'est pas : la hausse des prix du logement depuis 2000 a enrichi ceux qui possédaient déjà et renchéri l'accès pour les autres (voir l'onglet <a href="#" data-to="niveau-vie">Vit-on mieux qu'avant ?</a>, partie logement).</p>` : "";
  $("#gen-fin-txt").innerHTML = `<p><b>Ce que l'on voit.</b> Depuis ${a.annee}, la dépense publique « vieillesse » a augmenté de ${sg(z.d_vieillesse)} points de PIB (${f1(a.vieillesse)} % → ${f1(z.vieillesse)} %), la santé de ${sg(z.d_sante)} points, les impôts et cotisations de ${sg(z.d_prelevements)} point, et l'investissement public a varié de ${sg(z.d_investissement)} point (${f1(a.investissement)} % → ${f1(z.investissement)} %). La hausse de la dépense liée à l'âge est donc nettement plus forte que celle des recettes : l'écart a été comblé par la dette et par des économies ailleurs (l'enseignement, par exemple, est passé de ${f1(a.enseignement)} % à ${f1(z.enseignement)} % du PIB).</p>
    <p><b>Les variations sont plus modestes que dans le graphique du FT</b>, pour trois raisons : le FT part d'une date plus ancienne (vers 1990), il ajoute à la « vieillesse » la part des dépenses de santé consacrée aux 65 ans ou plus (une estimation), et il utilise les comptes sociaux de l'OCDE, plus larges que la seule fonction « vieillesse ». L'investissement public français, lui, a peu baissé et reste parmi les plus élevés d'Europe.</p>
    <p><b>C'est d'abord la démographie.</b> La part des 65 ans ou plus est passée de ${f1(a.part65)} % à ${f1(z.part65)} % de la population. Si chacun d'eux avait reçu la même part du PIB par habitant qu'en ${a.annee}, la dépense vieillesse atteindrait ${f1(z.vieillesse_demo)} % du PIB, et non ${f1(z.vieillesse)} %. Autrement dit, la dépense par personne âgée, rapportée au PIB par habitant, a <b>baissé de ${f0(-gen)} %</b> (de ${f1(a.generosite)} % à ${f1(z.generosite)} % du PIB par habitant). Les réformes successives (indexation sur les prix en 1987-1993, allongement des durées, recul de l'âge) ont freiné la hausse ; elles ne l'ont pas empêchée, parce que le nombre de retraités augmente plus vite.</p>`;
}

init();
})();
