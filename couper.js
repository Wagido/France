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
  try { C = await fetch("data/couper.json").then(r => r.json()); } catch (e) { return; }
  const sel = $("#cp-ref");
  sel.innerHTML = Object.entries(C.pays).filter(([g]) => g !== "FR").map(([g, n]) => `<option value="${g}">${n}</option>`).join("");
  sel.value = ref; sel.onchange = () => { ref = sel.value; chart(); };
  build(); chart(); calc();
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
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
