/* Heures travaillées par an et sur une vie : la France et les autres pays européens */
(() => {
"use strict";
let V = null;
const $ = s => document.querySelector(s);
async function init() {
  if (!window.TH) { setTimeout(init, 100); return; }
  try { V = await fetch("data/travail_vie.json").then(r => r.json()); } catch (e) { return; }
  draw();
}
function draw() {
  const el = $("#tt-vie"); if (!V || !el) return;
  const { esc } = window.TH;
  const n0 = v => Math.round(v).toLocaleString("fr-FR"), n1 = v => v.toLocaleString("fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const P = V.pays, mH = Math.max(...P.map(r => r.heures_an)), mV = Math.max(...P.map(r => r.heures_vie));
  el.innerHTML = `<div class="tv-row tv-head"><span>Pays</span><span>Heures par an, par personne en emploi</span><span>Années de vie active</span><span>Heures sur une vie</span></div>` +
    P.map(r => `<div class="tv-row${r.code === "FR" ? " me" : ""}"><span class="lab">${esc(r.nom)}</span>
      <span class="tr"><span class="bar" style="width:${(100 * r.heures_an / mH).toFixed(1)}%;background:#94a3b8"></span><small>${n0(r.heures_an)}</small></span>
      <span class="num">${n1(r.vie_active)}</span>
      <span class="tr"><span class="bar" style="width:${(100 * r.heures_vie / mV).toFixed(1)}%;background:${r.code === "FR" ? "#dc2626" : "#3b6fd6"}"></span><b>${n0(r.heures_vie)}</b></span></div>`).join("");
  const fr = P.find(r => r.code === "FR"); if (!fr) return;
  const rgA = [...P].sort((a, b) => b.heures_an - a.heures_an).findIndex(r => r.code === "FR") + 1;
  const rgV = P.findIndex(r => r.code === "FR") + 1, de = P.find(r => r.code === "DE"), top = P[0];
  const moy = P.reduce((a, r) => a + r.heures_vie, 0) / P.length;
  $("#tt-vie-txt").innerHTML = `<ul>
      <li><b>Sur un an</b>, une personne en emploi travaille ${n0(fr.heures_an)} heures en France (${fr.annee_h}) : ${rgA}<sup>e</sup> sur ${P.length} pays. Les Allemands, les Danois et les Néerlandais travaillent moins d'heures par an, surtout parce que le temps partiel y est très répandu.</li>
      <li><b>Sur une vie</b>, les Français passent ${n1(fr.vie_active)} ans dans la vie active, ${Math.abs(fr.vie_active - V.ue_vie_active) < 0.3 ? `autant que la moyenne de l'Union européenne (${n1(V.ue_vie_active)} ans)` : fr.vie_active < V.ue_vie_active ? `contre ${n1(V.ue_vie_active)} ans en moyenne dans l'Union européenne` : `un peu plus que la moyenne de l'Union européenne (${n1(V.ue_vie_active)} ans)`}, mais bien moins que les pays du Nord : ${P.filter(r => r.vie_active >= 42).map(r => esc(r.nom)).join(", ")} dépassent 42 ans.</li>
      <li><b>Au total</b>, environ <b>${n0(fr.heures_vie)} heures</b> sur une vie : ${rgV}<sup>e</sup> sur ${P.length}, ${Math.round(100 * (1 - fr.heures_vie / moy))} % de moins que la moyenne des pays comparés et ${Math.round(100 * (1 - fr.heures_vie / top.heures_vie))} % de moins qu'au ${esc(top.nom)}${de ? ` ; l'Allemagne, malgré des années plus courtes, arrive à ${n0(de.heures_vie)} heures grâce à une vie active plus longue` : ""}.</li>
      <li><b>C'est l'autre explication des prélèvements élevés</b> : moins d'heures travaillées sur une vie, c'est moins de cotisations et d'impôts pour financer des retraites plus longues (voir l'onglet <a href="#cycle-vie">La vie en euros</a>).</li>
    </ul>
    <p class="muted" style="font-size:.78rem">Heures sur une vie = années de vie active × heures par an. C'est un ordre de grandeur : la vie active d'Eurostat compte aussi les années de chômage, et les heures moyennes de l'année sont appliquées à toute la carrière. Sources : Eurostat, durée de la vie active (lfsi_dwl_a, ${fr.annee_v}) et heures travaillées des comptes nationaux.</p>`;
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
