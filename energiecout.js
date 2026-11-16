/* Énergie : coût de l'électricité à périmètre constant (RTE, Futurs énergétiques 2050) */
(() => {
"use strict";
const $ = s => document.querySelector(s);
async function init() {
  if (!window.TH || !$("#cout-chart")) { setTimeout(init, 100); return; }
  let C; try { C = await fetch("data/energie_couts.json", { cache: "no-cache" }).then(r => r.json()); } catch (e) { return; }
  const { bars, esc } = window.TH, S = C.scenarios, min = Math.min(...S.map(s => s.v));
  bars($("#cout-chart"), S.map(s => ({ l: `${s.id} : ${s.nom} (nucléaire ${s.nuc})`, v: s.v, t: `~${s.v} Md€ par an`, c: s.id.startsWith("M") ? "#16a34a" : "#3b6fd6" })), { max: 90 });
  $("#cout-mwh").innerHTML = `<table class="pr-t"><thead><tr><th>Coût de production seul (sans stockage ni réseau)</th><th>€ par MWh</th></tr></thead><tbody>${C.mwh.map(r => `<tr><td class="lab">${esc(r.l)}</td><td><b>${esc(r.v)}</b></td></tr>`).join("")}</tbody></table>`;
  const m = S.find(s => s.id === "M23"), n = S.find(s => s.id === "N2"), m0 = S.find(s => s.id === "M0"), n3 = S.find(s => s.id === "N03");
  $("#cout-txt").innerHTML = `<ul>
    <li><b>Comparer le coût d'un MWh ne suffit pas</b> : produit seul, un MWh éolien ou solaire coûte moins cher qu'un MWh nucléaire en 2060, quand le parc sera surtout fait de nouveaux réacteurs (environ 46 contre 67 €, selon RTE). Mais le soleil et le vent ne produisent pas quand on veut : il faut ajouter des batteries, des barrages de pompage, de l'hydrogène, des centrales de secours, et beaucoup plus de lignes électriques.</li>
    <li><b>À périmètre constant, c'est-à-dire en comptant tout</b> (production, stockage, flexibilités, réseaux), RTE a chiffré six systèmes électriques complets pour 2060, qui fournissent tous la même électricité avec la même sécurité d'approvisionnement.</li>
    <li><b>Résultat : les systèmes avec du nouveau nucléaire coûtent moins cher</b> : de ${n3.v} à 66 milliards d'euros par an, contre ${m.v} à 80 milliards pour le 100 % renouvelable. Entre un scénario 100 % renouvelable bien conçu (${m.id}) et un mix avec 14 nouveaux réacteurs (${n.id}), l'écart est d'environ ${m.v - n.v} milliards par an.</li>
    <li><b>Pourquoi ?</b> Dans les scénarios 100 % renouvelables, le stockage et les réseaux deviennent très lourds : c'est le prix de la « pilotabilité ». Avec 50 % de nucléaire, ces coûts de flexibilité deviennent faibles à l'échelle du système.</li>
    <li><b>Le moins cher de tout : garder les réacteurs actuels</b> : les prolonger, grand carénage compris, revient à 30 à 40 € par MWh.</li>
    <li><b>Les incertitudes restent fortes</b> : coût réel des nouveaux réacteurs (les chantiers récents ont dérapé), de l'éolien en mer flottant et des batteries, taux d'intérêt. RTE a testé de nombreuses variantes : l'avantage du mix avec nucléaire se retrouve dans la grande majorité d'entre elles. Pour mémoire, le système électrique coûte aujourd'hui environ ${C.aujourdhui} milliards d'euros par an. RTE actualise cette étude en 2026.</li>
  </ul>`;
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
