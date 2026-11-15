/* Société : patrimoine historique et culturel, la France et les autres pays */
(() => {
"use strict";
let P = null;
const $ = s => document.querySelector(s);
async function init() {
  if (!window.TH) { setTimeout(init, 100); return; }
  try { P = await fetch("data/patrimoine_hist.json").then(r => r.json()); } catch (e) { return; }
  draw();
}
const f1 = v => v.toLocaleString("fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
function rows(sel, data, { fmt = f1, unit = "", col = "#7c3aed" } = {}) {
  const { esc } = window.TH, R = [...data].sort((a, b) => b.v - a.v), mx = Math.max(...R.map(r => r.v));
  $(sel).innerHTML = `<div class="pp-rows">` + R.map(r => {
    const me = r.code === "FR", ue = r.code === "EU27_2020";
    return `<div class="pp-row env-row${me ? " me" : ""}${ue ? " ue" : ""}"><span class="lab">${esc(r.nom)}</span><span class="tr"><span class="b1" style="width:${(100 * r.v / mx).toFixed(1)}%;background:${me ? "#dc2626" : ue ? "var(--ink)" : col}"></span><b>${fmt(r.v)}${unit}</b></span></div>`;
  }).join("") + `</div>`;
}
function draw() {
  if (!P || !$("#ph-unesco")) return;
  const { kpis } = window.TH;
  const U = P.unesco, mxU = Math.max(...U.map(u => u[1]));
  $("#ph-unesco").innerHTML = `<div class="pp-rows">` + U.map(([n, v]) => `<div class="pp-row env-row${n === "France" ? " me" : ""}"><span class="lab">${n}</span><span class="tr"><span class="b1" style="width:${(100 * v / mxU).toFixed(1)}%;background:${n === "France" ? "#dc2626" : "#7c3aed"}"></span><b>${v} sites</b></span></div>`).join("") + `</div>`;
  const N = P.nuitees.filter(r => r.code !== "EU27_2020"), V = P.visites.filter(r => r.annee === Math.max(...P.visites.map(x => x.annee)));
  rows("#ph-nuits", N, { fmt: v => f1(v), unit: " M", col: "#0ea5e9" });
  rows("#ph-visites", V, { unit: " %", col: "#a855f7" });
  rows("#ph-depense", P.culture_large, { unit: " %", col: "#e07b39" });
  const fr = a => a.find(r => r.code === "FR"), rg = (a, c = "FR") => [...a].filter(r => r.code !== "EU27_2020").sort((x, y) => y.v - x.v).findIndex(r => r.code === c) + 1;
  const n = fr(N), v = fr(V), d = fr(P.culture_large), du = P.culture_large.find(r => r.code === "EU27_2020"), es = N.find(r => r.code === "ES"), it = N.find(r => r.code === "IT");
  kpis("#patrimoine-hist-kpis", [
    ["54", ["sites classés au patrimoine mondial de l'UNESCO", "4e pays du monde (après la session 2025)"], "UNESCO"],
    [f1(n.v) + " M", [`nuits passées par des touristes étrangers à l'hôtel ou au camping (${n.annee})`, `Espagne : ${f1(es.v)} M`], "Tourisme"],
    [f1(v.v) + " %", [`des Français ont visité un monument ou un musée dans l'année (${v.annee})`, `${rg(V)}e sur ${V.filter(r => r.code !== "EU27_2020").length} pays`], "Visites"],
    [f1(d.v) + " %", [`du PIB de dépense publique pour la culture, le sport et les loisirs (${d.annee})`, `Europe : ${f1(du.v)} %`], "Dépense"],
  ]);
  $("#patrimoine-hist-txt").innerHTML = `<ul>
      <li><b>Un patrimoine parmi les plus riches du monde</b> : avec 54 sites inscrits au patrimoine mondial de l'UNESCO, la France est 4<sup>e</sup>, derrière l'Italie (61), la Chine (60) et l'Allemagne (55). Les dernières inscriptions françaises (2025) sont les mégalithes de Carnac et des rives du Morbihan. S'y ajoutent plus de 45 000 monuments historiques protégés.</li>
      <li><b>Premier pays touristique du monde en nombre de visiteurs, mais pas en nuits</b> : les touristes étrangers passent ${f1(n.v)} millions de nuits à l'hôtel ou au camping en France (${n.annee}), deux fois moins qu'en Espagne (${f1(es.v)} M) ou en Italie (${f1(it.v)} M). Beaucoup ne font que traverser le pays, ou dorment chez l'habitant (locations entre particuliers, famille), qui ne sont pas comptés ici.</li>
      <li><b>Les Français visitent moins leur patrimoine que leurs voisins</b> : ${f1(v.v)} % ont visité un monument, un musée ou un site archéologique dans l'année (${rg(V)}<sup>e</sup> sur ${V.filter(r => r.code !== "EU27_2020").length} pays), contre près de la moitié des Allemands. L'enquête de ${v.annee} porte en partie sur une période encore marquée par le Covid, et l'écart suit fortement le niveau de diplôme (voir l'onglet <a href="#capital">Capital social et culturel</a>).</li>
      <li><b>L'argent public</b> : ${f1(d.v)} % du PIB pour la culture, les sports et les loisirs, plus que la moyenne européenne (${f1(du.v)} %). L'entretien des monuments repose aussi sur les propriétaires privés (environ la moitié des monuments historiques), les collectivités, le mécénat et le Loto du patrimoine.</li>
    </ul>
    <p class="muted" style="font-size:.78rem">UNESCO : décomptes publiés après la session 2025 du Comité du patrimoine mondial (${'<a href="https://www.geopop.it/la-classifica-dei-10-paesi-con-piu-siti-unesco-al-mondo-litalia-e-al-primo-posto-con-61-patrimoni/" target="_blank" rel="noopener">Geopop</a>'}, liste officielle sur whc.unesco.org) ; Eurostat : nuitées des non-résidents dans les hébergements touristiques (tour_occ_ninat), pratiques culturelles (ilc_scp03, enquête SRCV 2022, personnes de 16 ans ou plus), dépense des administrations publiques pour les loisirs, la culture et le culte (gov_10a_exp, fonction 08).</p>`;
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
