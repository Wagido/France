/* Prélèvements obligatoires et dépense publique : la France et les autres pays européens */
(() => {
"use strict";
let C = null;
const $ = s => document.querySelector(s);
async function init() {
  if (!window.TH) { setTimeout(init, 100); return; }
  try { C = await fetch("data/prelevements_pays.json").then(r => r.json()); } catch (e) { return; }
  draw();
}
function draw() {
  const el = $("#pp-cmp"); if (!C || !el) return;
  const { esc } = window.TH;
  const f1 = v => v == null ? "–" : v.toLocaleString("fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + " %";
  const max = Math.max(...C.pays.map(r => Math.max(r.prelevements, r.depense || 0)));
  el.innerHTML = `<div class="pp-leg"><span><i style="background:#e07b39"></i>Impôts et cotisations (prélèvements), en % du PIB</span><span><i style="background:#c4b5fd"></i>Dépense publique, en % du PIB</span></div>
    <div class="pp-rows">${C.pays.map(r => {
      const me = r.code === "FR", ue = r.code === "EU27_2020";
      return `<div class="pp-row${me ? " me" : ""}${ue ? " ue" : ""}"><span class="lab">${esc(r.nom)}</span>
        <span class="tr"><span class="b1" style="width:${(100 * r.prelevements / max).toFixed(1)}%;background:${me ? "#dc2626" : ue ? "var(--ink)" : "#e07b39"}"></span><b>${f1(r.prelevements)}</b></span>
        <span class="tr"><span class="b2" style="width:${(100 * (r.depense || 0) / max).toFixed(1)}%"></span><small>${f1(r.depense)}</small></span></div>`;
    }).join("")}</div>`;
  const fr = C.pays.find(r => r.code === "FR"), ue = C.pays.find(r => r.code === "EU27_2020"), de = C.pays.find(r => r.code === "DE");
  const rang = C.pays.filter(r => r.code !== "EU27_2020").findIndex(r => r.code === "FR") + 1, n = C.pays.filter(r => r.code !== "EU27_2020").length;
  const F = C.france, f0 = F[0], fL = F.at(-1);
  $("#pp-txt").innerHTML = `<ul>
      <li><b>La France prélève ${f1(fr.prelevements)} de son PIB</b> en impôts et cotisations en ${C.annee} : c'est le ${rang === 1 ? "taux le plus élevé" : rang + "e taux"} des ${n} pays européens comparés, devant la Belgique, le Danemark et l'Autriche.</li>
      <li><b>${(fr.prelevements - ue.prelevements).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} points de plus que la moyenne européenne</b> (${f1(ue.prelevements)}) et ${(fr.prelevements - de.prelevements).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} de plus que l'Allemagne (${f1(de.prelevements)}). Sur un PIB d'environ 3 000 Md€, un point vaut à peu près 30 Md€.</li>
      <li><b>La dépense publique est plus haute encore</b> (${f1(fr.depense)}) : l'écart avec les prélèvements est couvert par l'emprunt et par d'autres recettes. Comme on l'a vu dans l'onglet <a href="#repartition">Répartition du PIB</a>, une grande part de ces prélèvements revient aux ménages, surtout sous forme de retraites : les pays où les retraites passent par des fonds privés prélèvent mécaniquement moins.</li>
      <li><b>Depuis ${f0.annee}</b>, le taux français est passé de ${f1(f0.prelevements)} à ${f1(fL.prelevements)}, et la moyenne européenne de ${f1(f0.ue)} à ${f1(fL.ue)}.</li>
    </ul>
    <p class="muted" style="font-size:.8rem">Eurostat, impôts et cotisations sociales effectives et imputées reçus par les administrations publiques et les institutions européennes (gov_10a_taxag), et dépense publique (gov_10a_main), en % du PIB, ${C.annee}. Cette mesure donne ${f1(fr.prelevements)} pour la France ; le taux de prélèvements obligatoires de l'INSEE, qui retire les crédits d'impôt et les cotisations imputées, est un peu plus bas (42,8 % en 2024). Le taux de l'Irlande est bas surtout parce que son PIB est gonflé par les bénéfices des multinationales installées sur place.</p>`;
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
