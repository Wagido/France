/* Couper où ? Dépense publique par fonction : la France comparée à ses voisins, et un simulateur */
(() => {
"use strict";
let C = null, ref = "EU27_2020";
const $ = s => document.querySelector(s);
const CAT = {
  transfert: ["Transferts : argent versé aux ménages ou aux entreprises", "#e07b39"],
  sante: ["Santé", "#e15759"],
  fonctionnement: ["Fonctionnement des services publics", "#7c3aed"],
  avenir: ["Dépenses d'avenir : éducation, recherche, transports, environnement", "#16a34a"],
  dette: ["Intérêts de la dette", "#94a3b8"],
};
const GROUPES = [
  ["retraites", "Retraites et réversion"],
  ["sante", "Santé (soins de ville, médicaments, hôpital)"],
  ["social", "Autres prestations (chômage, famille, maladie, minima)"],
  ["eco", "Aides à l'économie et à l'emploi"],
  ["logement", "Logement : aides et aménagement"],
  ["admin", "Administration, culture, services annexes"],
];
const sim = Object.fromEntries(GROUPES.map(([k]) => [k, 0]));
async function init() {
  if (!window.TH) { setTimeout(init, 100); return; }
  try { C = await fetch("data/couper.json", { cache: "no-cache" }).then(r => r.json()); } catch (e) { return; }
  const sel = $("#cp-ref");
  sel.innerHTML = Object.entries(C.pays).filter(([g]) => g !== "FR").map(([g, n]) => `<option value="${g}">${n}</option>`).join("");
  sel.value = ref; sel.onchange = () => { ref = sel.value; chart(); };
  build(); chart(); calc();
  if ($("#cp-conj")) { $("#cp-conj").onchange = mesures; $("#cp-tri").onchange = mesures; mesures(); }
}
const md = v => Math.round(v).toLocaleString("fr-FR") + " Md€";
const p1 = v => v == null ? "–" : v.toLocaleString("fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + " %";
const ecart = (p, g = "EU27_2020") => p.v.FR != null && p.v[g] != null ? p.v.FR - p.v[g] : 0;

function chart() {
  const { kpis, esc } = window.TH;
  const P = C.postes, pib = C.pib, nom = C.pays[ref];
  const tot = C.total.FR - C.total.EU27_2020;
  const ret = P.filter(p => p.groupe === "retraites").reduce((a, p) => a + ecart(p), 0);
  const san = P.filter(p => p.groupe === "sante").reduce((a, p) => a + ecart(p), 0);
  kpis("#cp-kpis", [
    [p1(C.total.FR), [`dépense publique en ${C.annee}`, `moyenne européenne : ${p1(C.total.EU27_2020)}`], "France"],
    ["+" + md(tot * pib / 100), [`${p1(tot).replace(" %", " points")} de PIB de plus que la moyenne européenne`], "Écart total"],
    ["+" + md(ret * pib / 100), [`dont retraites : ${p1(ret).replace(" %", " points")} de PIB`, "le premier écart, de loin"], "Retraites"],
    [md(C.deficit), [`déficit public en ${C.annee}`, `à comparer avec l'écart`], "Déficit"],
  ]);
  const rows = [...P].map(p => ({ ...p, e: ecart(p, ref) })).sort((a, b) => b.e - a.e);
  const mx = Math.max(...rows.map(r => Math.abs(r.e)));
  $("#cp-chart").innerHTML = `<div class="cp-row cp-head"><span>Poste</span><span class="num">France</span><span class="num">${esc(nom)}</span><span class="cp-mid">Écart en points de PIB (France − ${esc(nom)}), et ce que cela fait pour la France, en milliards par an</span></div>` +
    rows.map(r => {
      const w = (50 * Math.abs(r.e) / mx).toFixed(1), c = CAT[r.cat][1], md_ = r.e * pib / 100;
      const bar = r.e >= 0 ? `<span class="cp-bar" style="left:50%;width:${w}%;background:${c}"></span>` : `<span class="cp-bar" style="right:50%;width:${w}%;background:${c};opacity:.55"></span>`;
      return `<div class="cp-row"><span class="lab">${esc(r.l)}</span><span class="num">${p1(r.v.FR)}</span><span class="num muted">${p1(r.v[ref])}</span>
        <span class="cp-track">${bar}<i class="cp-zero"></i><span class="cp-val" style="${r.e >= 0 ? `left:calc(50% + ${w}% + 4px)` : `right:calc(50% + ${w}% + 4px)`}">${r.e >= 0 ? "+" : "−"}${Math.abs(r.e).toLocaleString("fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} pt <span class="muted" style="font-weight:400">(${md(Math.abs(md_))})</span></span></span></div>`;
    }).join("");
  $("#cp-legend").innerHTML = Object.values(CAT).map(([l, c]) => `<span><i style="border-top-color:${c};border-top-width:10px;width:14px;opacity:1"></i>${l}</span>`).join("") + `<span class="muted">À droite : la France dépense une plus grande part de son PIB ; à gauche : une plus petite. Les milliards = l'écart en points appliqué au PIB français.</span>`;
  const avenirMoins = rows.filter(r => r.cat === "avenir" && r.e < -0.05).map(r => r.l.toLowerCase());
  $("#cp-intro").innerHTML = `<p><b>Où la France dépense-t-elle plus que les autres ?</b></p><ul>
      <li>La France dépense ${p1(C.total.FR)} de son PIB en dépenses publiques, contre ${p1(C.total.EU27_2020)} en moyenne en Europe : <b>${p1(tot).replace(" %", " points")}</b> de plus, soit environ <b>${md(tot * pib / 100)} par an</b>. C'est plus que tout le déficit (${md(C.deficit)}).</li>
      <li><b>Les retraites font à elles seules un tiers de l'écart</b> (${md(ret * pib / 100)}), puis la santé (${md(san * pib / 100)}), les aides à l'économie et à l'emploi, le logement.</li>
      <li>À l'inverse, la France dépense <b>moins</b> que la moyenne pour ${avenirMoins.length ? avenirMoins.join(", ") : "certaines dépenses d'avenir"} : ce sont pourtant les dépenses qui préparent la croissance de demain.</li>
    </ul>`;
}

function build() {
  const P = C.postes, pib = C.pib;
  $("#cp-sim").innerHTML = GROUPES.map(([k, l]) => {
    const e = P.filter(p => p.groupe === k).reduce((a, p) => a + ecart(p), 0);
    return `<div class="cp-sl"><span class="lab">${l}<small>écart : ${e >= 0 ? "+" : "−"}${md(Math.abs(e * pib / 100))}</small></span>
      <input type="range" min="0" max="100" step="10" value="0" data-k="${k}"><output id="cp-o-${k}">0 %</output></div>`;
  }).join("");
  document.querySelectorAll("#cp-sim input").forEach(i => i.oninput = () => { sim[i.dataset.k] = +i.value; calc(); });
}

function calc() {
  const { kpis } = window.TH;
  const P = C.postes, pib = C.pib;
  let tot = 0; const det = {};
  GROUPES.forEach(([k]) => {
    const e = Math.max(0, P.filter(p => p.groupe === k).reduce((a, p) => a + ecart(p), 0));
    det[k] = e * pib / 100 * sim[k] / 100; tot += det[k];
    const o = $("#cp-o-" + k); if (o) o.textContent = sim[k] + " %";
  });
  const retFR = P.filter(p => p.groupe === "retraites").reduce((a, p) => a + p.v.FR, 0) * pib / 100;
  const sanFR = P.filter(p => p.groupe === "sante").reduce((a, p) => a + p.v.FR, 0) * pib / 100;
  kpis("#cp-res", [
    [md(tot), [`d'économies par an`, `${(100 * tot / pib).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} point de PIB`], "Économies"],
    [Math.round(100 * tot / C.deficit) + " %", [`du déficit de ${C.annee} (${md(C.deficit)})`], "Part du déficit"],
    [det.retraites ? "−" + Math.round(100 * det.retraites / retFR) + " %" : "0 %", [`sur l'ensemble des retraites (${md(retFR)})`], "Retraites"],
    [det.sante ? "−" + Math.round(100 * det.sante / sanFR) + " %" : "0 %", [`sur la dépense publique de santé (${md(sanFR)})`], "Santé"],
  ]);
  if (!$("#cp-txt").dataset.ok) {
    $("#cp-txt").dataset.ok = 1;
    $("#cp-txt").innerHTML = `<p><b>Ce qu'il faut savoir avant de couper</b></p><ul>
      <li><b>« Moins productif » au sens de la croissance</b> : une retraite, une allocation ou une aide au logement est un transfert. Elle fait vivre ceux qui la reçoivent, mais ne prépare pas la production de demain, contrairement à l'éducation, à la recherche ou aux infrastructures. Ce n'est pas un jugement sur leur utilité sociale.</li>
      <li><b>Retraites</b> : l'écart vient surtout de la durée de la retraite (on sort plus tôt de l'emploi, voir l'onglet <a href="#travail">Temps de travail</a>) et du niveau des pensions. Les leviers sont l'âge de départ, la durée de cotisation et l'indexation des pensions sur les prix plutôt que sur les salaires. Un gel d'une année, avec une inflation de 2 %, économise environ 2 % de la masse des pensions.</li>
      <li><b>Santé</b> : la France rembourse davantage de soins de ville et de médicaments que ses voisins ; les leviers sont le prix des médicaments, les actes inutiles, l'organisation de l'hôpital.</li>
      <li><b>Comparer avec prudence</b> : dans certains pays, une partie des retraites et de la santé passe par des fonds ou des assurances privés obligatoires, qui ne sont pas comptés ici. Leurs habitants paient alors à ces fonds ce que les Français paient en cotisations.</li>
      <li><b>Les classements par poste ne sont pas parfaits</b> : en France, une partie de l'enseignement supérieur est classée en recherche ou en « enseignement non défini par niveau » ; son retard apparent est sans doute exagéré.</li>
      <li><b>Couper, c'est aussi moins de revenus pour quelqu'un</b> : 1 € de retraite en moins, c'est 1 € de moins pour un retraité et pour ses dépenses. Voir l'onglet <a href="#simulateur">Couper la dépense ?</a> sur l'effet d'une baisse de la dépense sur la croissance.</li>
    </ul>
    <p class="muted" style="font-size:.78rem">Eurostat, dépenses des administrations publiques par fonction (classification COFOG, gov_10a_exp), en % du PIB, ${C.annee}. Le simulateur applique la part choisie de l'écart positif avec la moyenne européenne ; il ne tient pas compte des effets en retour sur l'activité et les recettes.</p>`;
  }
}

/* mesures d'économie : économie brute, multiplicateur, perte de PIB, économie nette, rendement, effet sur le ratio de dette */
const MES = [
  ["Lutter davantage contre la fraude sociale et fiscale", 3, 0.1, "0", "Rendement très élevé sur le papier, mais montant incertain : la fraude se chiffre mal et se récupère lentement."],
  ["Recentrer les allègements de cotisations au-delà de 2 SMIC", 4, 0.2, "0", "Les évaluations (rapport Bozio-Wasmer, 2024) trouvent peu d'effet sur l'emploi pour les salaires élevés."],
  ["Supprimer des niches fiscales peu efficaces", 5, 0.3, "0", "Plus de 400 niches, environ 85 Md€ ; beaucoup n'ont jamais été évaluées (Cour des comptes)."],
  ["Réduire les aides aux entreprises les moins évaluées", 5, 0.4, "−", "Environ 200 Md€ d'aides selon le Sénat (2025), dont peu sont évaluées ; prudence sur la recherche et l'industrie."],
  ["Baisser le prix des médicaments, plus de génériques, moins d'actes redondants", 3, 0.3, "0", "Une partie de l'argent part aux laboratoires, souvent étrangers : peu d'effet sur l'activité en France."],
  ["Sous-indexer les retraites de 1 point pendant un an", 4, 0.5, "0", "Touche 17 millions de retraités ; peut épargner les petites pensions. Les retraités aisés épargnent une partie de leur pension."],
  ["Reculer l'âge de la retraite de 64 à 65 ans (à terme)", 9, -0.2, "+", "Économie qui monte en charge sur plusieurs années ; plus d'actifs, donc plus de PIB. Coût social élevé, surtout pour les métiers pénibles."],
  ["Mieux encadrer les arrêts maladie (jour de carence, contrôles)", 1, 0.6, "0", "Petits montants ; effet sur la santé à surveiller."],
  ["Durcir l'assurance chômage", 3, 0.8, "+", "Les chômeurs dépensent presque tout ; un peu plus de retour à l'emploi à terme, selon les études."],
  ["Geler le point d'indice des fonctionnaires un an", 2, 0.7, "−", "Pouvoir d'achat des agents ; difficultés de recrutement (enseignants, soignants)."],
  ["Réduire les achats et frais de fonctionnement des administrations", 5, 0.9, "0", "Revient à moins de commandes pour des entreprises, souvent françaises."],
  ["Réduire les effectifs publics de 1 %", 3, 1.0, "−", "Effet direct sur l'emploi et les services publics."],
  ["Baisser l'investissement public", 5, 1.3, "− −", "Le plus coûteux : moins d'activité tout de suite (BTP), et moins de croissance plus tard (infrastructures, transition)."],
];
const TAU = 0.46, DETTE = 1.15;
function mesures() {
  const t = $("#cp-mes-t"); if (!t) return;
  const k = +$("#cp-conj").value, tri = $("#cp-tri").value, pib = C.pib;
  const R = MES.map((x, i) => { const m = x[2] < 0 ? x[2] : x[2] * k, L = m * x[1], N = x[1] - TAU * L; return { i, l: x[0], e: x[1], m, L, N, r: L > 0 ? N / L : Infinity, lt: x[3], c: x[4] }; });
  R.sort((a, b) => tri === "rdt" ? b.r - a.r : tri === "eco" ? b.N - a.N : a.m - b.m);
  const on = new Set([...document.querySelectorAll("#cp-mes-t input:checked")].map(i => +i.dataset.i));
  const f1 = v => v.toLocaleString("fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const rd = r => r === Infinity ? `<b style="color:var(--pos)">gagnant</b>` : `<b style="color:${r >= 2 ? "var(--pos)" : r >= 0.6 ? "inherit" : "var(--neg)"}">${f1(r)} €</b>`;
  t.innerHTML = `<thead><tr><th></th><th>Mesure</th><th class="num">Économie</th><th class="num">Multiplicateur</th><th class="num">PIB perdu</th><th class="num">Déficit en moins</th><th class="num">Rendement</th><th class="num">À long terme</th></tr></thead><tbody>` +
    R.map(x => `<tr><td><input type="checkbox" data-i="${x.i}" ${on.has(x.i) ? "checked" : ""} aria-label="Retenir"></td><td><b>${x.l}</b><br><small class="muted">${x.c}</small></td><td class="num">${x.e} Md€</td><td class="num">${f1(x.m)}</td><td class="num">${x.L > 0 ? "−" + f1(x.L) : "+" + f1(-x.L)} Md€</td><td class="num">${f1(x.N)} Md€</td><td class="num">${rd(x.r)}</td><td class="num">${x.lt}</td></tr>`).join("") + `</tbody>`;
  t.querySelectorAll("input").forEach(i => i.onchange = paquet);
  paquet();
  $("#cp-mes-txt").innerHTML = `<ul>
    <li><b>Les mesures les plus « rentables »</b> touchent des dépenses qui soutiennent peu l'activité : aides et niches fiscales peu efficaces, allègements de cotisations sur les hauts salaires, prix des médicaments. Pour 1 € de PIB perdu, elles réduisent le déficit de 3 à 10 €.</li>
    <li><b>Les moins rentables</b> touchent l'investissement public, les effectifs et les achats publics : moins de 1 € de déficit en moins par € de PIB perdu. Au-delà d'un multiplicateur d'environ 0,62, la coupe fait même <i>monter</i> le ratio dette/PIB la première année (voir <a href="#simulateur">Couper la dépense ?</a>).</li>
    <li><b>Le recul de l'âge de la retraite</b> est à part : il augmente l'emploi, donc le PIB, en même temps qu'il économise. C'est pour cela que la plupart des économistes le jugent efficace pour les finances publiques, malgré son coût social.</li>
    <li><b>Ce qui est rentable n'est pas forcément juste</b> : le rendement mesure l'effet sur le déficit et l'activité, pas qui paie. Une sous-indexation des retraites, rentable, réduit le niveau de vie de millions de retraités ; une baisse des aides aux entreprises peut fragiliser certaines filières.</li>
  </ul>`;
}
function paquet() {
  const { kpis } = window.TH;
  const k = +$("#cp-conj").value, pib = C.pib, D = DETTE * pib;
  const sel = [...document.querySelectorAll("#cp-mes-t input:checked")].map(i => MES[+i.dataset.i]);
  let E = 0, L = 0, N = 0;
  sel.forEach(x => { const m = x[2] < 0 ? x[2] : x[2] * k; E += x[1]; L += m * x[1]; N += x[1] - TAU * m * x[1]; });
  const d = 100 * ((D - N) / (pib - L) - D / pib);
  kpis("#cp-mes-res", sel.length ? [
    [md(E), [`d'économies retenues (${sel.length} mesure${sel.length > 1 ? "s" : ""})`], "Économies"],
    [(L > 0 ? "−" : "+") + md(Math.abs(L)), [`de PIB la première année`, `${(100 * L / pib).toLocaleString("fr-FR", { maximumFractionDigits: 2 })} point de croissance en ${L > 0 ? "moins" : "plus"}`], "Activité"],
    [md(N), [`de déficit en moins`, `${Math.round(100 * N / C.deficit)} % du déficit de ${C.annee}`], "Déficit"],
    [(d > 0 ? "+" : "−") + Math.abs(d).toLocaleString("fr-FR", { maximumFractionDigits: 2 }) + " pt", [`sur le ratio dette/PIB après un an`, d > 0 ? "il monte : la perte de PIB l'emporte" : "il baisse"], "Dette/PIB"],
  ] : [["—", ["cochez des mesures dans le tableau", "pour composer votre plan"], "Votre plan"]]);
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
