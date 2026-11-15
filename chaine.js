/* Du champ au caddie : partage de la valeur alimentaire, marges des supermarchés, éleveurs laitiers, circuits courts.
   Chiffres tirés du rapport 2026 de l'Observatoire de la formation des prix et des marges (OFPM) au Parlement. */
(() => {
"use strict";
const $ = s => document.querySelector(s);
const OFPM = "https://www.franceagrimer.fr/sites/default/files/2026-10/2026_rapport_OFPM_v2.pdf";
// euro alimentaire 2021 (OFPM d'après Insee, Eurostat), valeurs ajoutées induites par branche
const EURO = [
  ["Agriculteurs français", 6.4, "#65a30d"],
  ["Industries agroalimentaires", 9.4, "#e07b39"],
  ["Commerce (grande distribution, grossistes, petits commerces)", 18.8, "#3b6fd6"],
  ["Restauration, transports et autres services", 28.0, "#7c3aed"],
  ["Importations d'aliments finis", 11.7, "#94a3b8"],
  ["Importations d'intrants (engrais, énergie, emballages, aliments du bétail…)", 17.1, "#cbd5e1"],
  ["Taxes (moins les subventions)", 8.6, "#64748b"],
];
// marges nettes des rayons de grandes surfaces, 2024, pour 100 € de chiffre d'affaires, après impôt sur les sociétés
const RAYONS = [["Volailles", 6.8], ["Charcuterie", 5.1], ["Fruits et légumes", 1.7], ["Produits laitiers", 1.3], ["Ensemble des 7 rayons", 1.1], ["Boulangerie-pâtisserie", -1.7], ["Boucherie", -2.9], ["Poissonnerie (marée)", -4.6]];
function draw() {
  const el = $("#ch-euro"); if (!el || !window.TH) { setTimeout(draw, 100); return; }
  const { kpis, esc } = window.TH;
  const f1 = v => v.toLocaleString("fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  kpis("#champ-kpis", [
    ["6,4 €", ["sur 100 € de courses et de repas reviennent aux agriculteurs français", "valeur ajoutée, 2021"], "Agriculteurs"],
    ["18,8 €", ["au commerce (grandes surfaces, grossistes, petits commerces)"], "Commerce"],
    ["1,1 €", ["de bénéfice net pour 100 € vendus dans les rayons alimentaires des grandes surfaces (2024)"], "Supermarchés"],
    ["1 sur 4", ["des exploitations vendent une partie de leur production en circuit court (2020)", "52 % en bio, 19 % en conventionnel"], "Circuits courts"],
  ]);
  // barre des 100 €
  el.innerHTML = `<div class="ch-bar">${EURO.map(([l, v, c]) => `<span style="flex:${v} 1 0;background:${c}" title="${esc(l)} : ${f1(v)} €"><b>${f1(v)} €</b></span>`).join("")}</div>
    <div class="legend-row">${EURO.map(([l, v, c]) => `<span><i style="border-top-color:${c};border-top-width:10px;width:14px;opacity:1"></i>${esc(l)} : <b>${f1(v)} €</b></span>`).join("")}</div>`;
  // marges nettes par rayon
  const mx = Math.max(...RAYONS.map(r => Math.abs(r[1])));
  $("#ch-rayons").innerHTML = `<div class="pp-rows">` + RAYONS.map(([l, v]) => {
    const w = 50 * Math.abs(v) / mx, tot = /Ensemble/.test(l);
    return `<div class="pp-row env-row${tot ? " ue" : ""}"><span class="lab">${esc(l)}</span><span class="cp-track"><span class="cp-bar" style="${v >= 0 ? "left:50%" : "right:50%"};width:${w.toFixed(1)}%;background:${tot ? "var(--ink)" : v >= 0 ? "#3b6fd6" : "#e15759"}"></span><i class="cp-zero"></i>
      <span class="cp-val" style="${v >= 0 ? `left:calc(50% + ${w.toFixed(1)}% + 4px)` : `right:calc(50% + ${w.toFixed(1)}% + 4px)`}">${v > 0 ? "+" : ""}${f1(v)} €</span></span></div>`;
  }).join("") + `</div>`;
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", draw); else draw();
})();
