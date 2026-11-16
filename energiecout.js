/* Énergie : coût de l'électricité à périmètre constant (RTE, Futurs énergétiques 2050) */
(() => {
"use strict";
const $ = s => document.querySelector(s);
async function init() {
  if (!window.TH || !$("#cout-chart")) { setTimeout(init, 100); return; }
  let C; try { C = await fetch("data/energie_couts.json", { cache: "no-cache" }).then(r => r.json()); } catch (e) { return; }
  const S = C.scenarios, m = S.find(s => s.id === "M23"), n = S.find(s => s.id === "N2"), n3 = S.find(s => s.id === "N03");
  const el = $("#cout-txt"); if (!el) return;
  el.innerHTML = `<p style="margin:0 0 4px"><b>Ce qu'il faut retenir</b></p><ul>
    <li><b>Les systèmes avec du nouveau nucléaire coûtent moins cher</b> : de ${n3.v} à 66 milliards d'euros par an, contre ${m.v} à 80 milliards pour le 100 % renouvelable. Entre le meilleur scénario 100 % renouvelable (${m.id}) et un mix avec 14 nouveaux réacteurs (${n.id}), l'écart est d'environ ${m.v - n.v} milliards par an.</li>
    <li><b>Ce n'est pas la production qui fait la différence</b>, mais la flexibilité et les réseaux, beaucoup plus lourds quand tout repose sur le vent et le soleil.</li>
    <li><b>Le moins cher de tout : garder les réacteurs actuels.</b> Les prolonger coûte 30 à 40 € par MWh selon RTE. C'est moins que les 60 € de la CRE (partie 2.5), car RTE ne compte que les nouvelles dépenses de prolongation, pas la rémunération des investissements passés.</li>
    <li><b>Les incertitudes restent fortes</b> : coût réel des nouveaux réacteurs (les chantiers récents ont dérapé), de l'éolien en mer flottant et des batteries, et surtout taux d'intérêt. RTE a testé de nombreuses variantes : l'avantage du mix avec nucléaire se retrouve dans la grande majorité d'entre elles. Pour mémoire, le système électrique coûte aujourd'hui environ ${C.aujourdhui} milliards d'euros par an. RTE actualise cette étude en 2026.</li>
  </ul>`;
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
