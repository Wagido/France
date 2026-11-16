/* Industrie et innovation : brevets, recherche par secteur, pourquoi un pays innove plus qu'un autre */
(() => {
"use strict";
let I = null;
const $ = s => document.querySelector(s);
async function init() {
  if (!window.TH) { setTimeout(init, 100); return; }
  try { I = await fetch("data/innovation.json", { cache: "no-cache" }).then(r => r.json()); } catch (e) { return; }
  let rt; addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(draw, 150); });
  draw();
}
const f2 = v => v.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }), n0 = v => Math.round(v).toLocaleString("fr-FR");
function draw() {
  if (!I || !$("#in-brevets")) return;
  const { lineChart, legend, esc, css } = window.TH;
  // brevets par pays
  const B = [...I.brevets].sort((a, b) => b.v - a.v), mx = B[0].v;
  $("#in-brevets").innerHTML = `<div class="pp-rows">` + B.map(r => {
    const me = r.code === "FR", ue = r.code === "EU27_2020";
    return `<div class="pp-row env-row${me ? " me" : ""}${ue ? " ue" : ""}"><span class="lab">${esc(r.nom)}</span><span class="tr"><span class="b1" style="width:${(100 * r.v / mx).toFixed(1)}%;background:${me ? "#dc2626" : ue ? "var(--ink)" : "#6366f1"}"></span><b>${n0(r.v)}</b></span></div>`;
  }).join("") + `</div>`;
  // évolution France / Allemagne / UE
  const S = I.brevets_fr.map(r => ({ annee: r.annee, fr: r.v, de: I.brevets_de.find(x => x.annee === r.annee)?.v, ue: I.brevets_ue.find(x => x.annee === r.annee)?.v }));
  lineChart($("#in-evol"), S, [{ k: "de", l: "Allemagne", c: "#94a3b8" }, { k: "fr", l: "France", c: "#dc2626" }, { k: "ue", l: "Union européenne", c: css("--ink"), dash: "5 4" }], { vfmt: n0, yfmt: v => v, h: 240 });
  legend("#in-evol-legend", [["France", "#dc2626"], ["Allemagne", "#94a3b8"], ["Union européenne", css("--ink"), true]]);
  // R&D par secteur, pays sélectionnés
  const keep = ["KR", "US", "JP", "SE", "DE", "FI", "CH", "DK", "CN_X_HK", "NL", "EU27_2020", "FR", "IT", "ES", "PL"];
  const R = I.rd.filter(r => keep.includes(r.code)).sort((a, b) => b.total - a.total), mr = R[0].total;
  $("#in-rd").innerHTML = `<div class="pp-rows">` + R.map(r => {
    const me = r.code === "FR", ue = r.code === "EU27_2020";
    return `<div class="pp-row env-row${me ? " me" : ""}${ue ? " ue" : ""}"><span class="lab">${esc(r.nom)}</span><span class="tr"><span class="b1" style="width:${(100 * r.entreprises / mr).toFixed(1)}%;background:${me ? "#dc2626" : "#3b6fd6"};border-radius:2px 0 0 2px"></span><span class="b1" style="width:${(100 * r.public / mr).toFixed(1)}%;background:#93c5fd;border-radius:0 2px 2px 0;margin-left:-6px"></span><b>${f2(r.total)} %</b></span></div>`;
  }).join("") + `</div>`;
  legend("#in-rd-legend", [["Recherche faite par les entreprises", "#3b6fd6"], ["par l'État, les universités et les associations", "#93c5fd"]]);
  const fr = I.rd.find(r => r.code === "FR"), de = I.rd.find(r => r.code === "DE"), us = I.rd.find(r => r.code === "US"), kr = I.rd.find(r => r.code === "KR"), ue = I.rd.find(r => r.code === "EU27_2020");
  const bf = B.find(r => r.code === "FR"), bd = B.find(r => r.code === "DE"), bu = B.find(r => r.code === "EU27_2020"), rgB = B.filter(r => r.code !== "EU27_2020").findIndex(r => r.code === "FR") + 1;
  $("#in-txt").innerHTML = `<p><b>Pourquoi un pays innove-t-il plus qu'un autre ?</b></p><ul>
      <li><b>La France dépose ${n0(bf.v)} brevets européens par million d'habitants</b> (${bf.annee}), à peine plus que la moyenne de l'Union (${n0(bu.v)}), deux fois moins que l'Allemagne (${n0(bd.v)}) et loin de la Suisse, de la Finlande ou de la Suède (${rgB}<sup>e</sup> sur ${B.filter(r => r.code !== "EU27_2020").length} pays européens).</li>
      <li><b>L'essentiel de la différence vient des entreprises.</b> La recherche publique (État, universités) pèse ${f2(fr.public)} % du PIB en France, autant qu'aux États-Unis (${f2(us.public)} %) et un peu moins qu'en Allemagne (${f2(de.public)} %). Mais les entreprises françaises ne consacrent que ${f2(fr.entreprises)} % du PIB à la recherche, contre ${f2(de.entreprises)} % en Allemagne, ${f2(us.entreprises)} % aux États-Unis et ${f2(kr.entreprises)} % en Corée du Sud. Et cela malgré le crédit d'impôt recherche, l'une des aides les plus généreuses du monde (environ 7 milliards d'euros par an).</li>
      <li><b>Parce que l'industrie pèse moins</b> : l'essentiel de la recherche privée se fait dans l'industrie (automobile, pharmacie, électronique, machines). Un pays qui s'est désindustrialisé, comme la France, fait mécaniquement moins de recherche privée et dépose moins de brevets (voir le poids de l'industrie plus haut).</li>
      <li><b>Parce que la spécialisation compte</b> : la France est forte dans l'aéronautique, le spatial, le nucléaire, le luxe ou les médicaments, mais peu présente dans l'électronique et le numérique, où se déposent aujourd'hui le plus de brevets et où les entreprises américaines et asiatiques dominent.</li>
      <li><b>Parce qu'il faut de l'argent pour grandir</b> : les jeunes entreprises innovantes ont besoin de capital-risque et de marchés financiers profonds. Les États-Unis en ont beaucoup plus ; en Europe, beaucoup de « jeunes pousses » sont rachetées ou partent avant de devenir grandes.</li>
      <li><b>Parce qu'il faut des compétences et des ponts</b> : niveau en mathématiques et en sciences, nombre d'ingénieurs et de docteurs embauchés par les entreprises, échanges entre laboratoires publics et industrie, souvent jugés moins développés en France qu'en Allemagne ou en Suisse.</li>
      <li><b>Un brevet n'est pas toute l'innovation</b> : en Europe, les logiciels et les services se brevètent peu, et une grande partie de l'innovation (organisation, design, marketing) ne passe pas par les brevets.</li>
    </ul>
    <p class="muted" style="font-size:.78rem">Eurostat : demandes de brevets à l'Office européen des brevets par pays du déposant (sdg_09_40), dépense intérieure de recherche et développement par secteur d'exécution (rd_e_gerdtot, ${fr.annee}).</p>`;
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
