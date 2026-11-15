/* Simulateur « Couper la dépense ? » : le seuil du multiplicateur, pays par pays */
(() => {
"use strict";
let P = null;
const $ = s => document.querySelector(s);
async function init() {
  if (!window.TH) { setTimeout(init, 100); return; }
  try {
    const [cmp, pre] = await Promise.all([fetch("data/comparaison.json").then(r => r.json()), fetch("data/prelevements_pays.json").then(r => r.json())]);
    const tx = Object.fromEntries(pre.pays.map(r => [r.code, r.prelevements]));
    P = cmp.comparaison.filter(r => r.apu?.dette_pct != null && tx[r.code] != null)
      .map(r => ({ code: r.code, nom: r.nom, dette: r.apu.dette_pct, tx: tx[r.code], an: r.apu.annee }));
    P.forEach(r => r.seuil = 1 / (r.dette / 100 + r.tx / 100));
  } catch (e) { return; }
  $("#s-m")?.addEventListener("input", draw);
  let rt; addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(draw, 150); });
  draw();
}
function draw() {
  const el = $("#simu-pays"); if (!P || !el) return;
  const { showTip, hideTip, css, esc } = window.TH;
  const m = +($("#s-m")?.value || 0.8), f2 = v => v.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const w = Math.max(320, el.clientWidth), h = 380, mg = { t: 16, r: 16, b: 40, l: 48 };
  const x = d3.scaleLinear([0, Math.max(160, d3.max(P, d => d.dette) * 1.08)], [mg.l, w - mg.r]);
  const y = d3.scaleLinear([0.4, Math.max(1.6, d3.max(P, d => d.seuil) * 1.05)], [h - mg.b, mg.t]);
  const svg = d3.create("svg").attr("viewBox", `0 0 ${w} ${h}`);
  svg.append("rect").attr("x", mg.l).attr("width", w - mg.l - mg.r).attr("y", y(Math.min(m, y.domain()[1]))).attr("height", Math.max(0, h - mg.b - y(Math.min(m, y.domain()[1])))).attr("fill", css("--neg")).attr("opacity", .1);
  svg.append("g").attr("class", "grid").selectAll("line").data(y.ticks(6)).join("line").attr("x1", mg.l).attr("x2", w - mg.r).attr("y1", y).attr("y2", y);
  svg.append("line").attr("x1", mg.l).attr("x2", w - mg.r).attr("y1", y(m)).attr("y2", y(m)).attr("stroke", css("--neg")).attr("stroke-width", 2).attr("stroke-dasharray", "6 4");
  svg.append("text").attr("x", w - mg.r - 4).attr("y", y(m) - 6).attr("text-anchor", "end").attr("font-size", 11.5).attr("font-weight", 650).attr("fill", css("--neg")).text(`multiplicateur choisi : ${f2(m)}`);
  svg.append("text").attr("x", w - mg.r - 4).attr("y", h - mg.b - 8).attr("text-anchor", "end").attr("font-size", 11).attr("fill", css("--neg")).text("zone rouge : la coupe fait monter le ratio dette/PIB");
  P.forEach(d => {
    const fr = d.code === "FR", danger = d.seuil < m;
    const g = svg.append("g").on("pointermove", ev => showTip(`<b>${esc(d.nom)}</b> (${d.an})<br>Dette : ${Math.round(d.dette)} % du PIB<br>Impôts et cotisations : ${d.tx.toLocaleString("fr-FR")} % du PIB<br>Seuil : <b>${f2(d.seuil)}</b><br>${danger ? "Avec ce multiplicateur, une coupe y ferait monter le ratio" : "Avec ce multiplicateur, une coupe y ferait baisser le ratio"}`, ev)).on("pointerleave", hideTip);
    g.append("circle").attr("cx", x(d.dette)).attr("cy", y(d.seuil)).attr("r", fr ? 8 : 5.5).attr("fill", fr ? "#dc2626" : danger ? css("--neg") : css("--pos")).attr("opacity", fr ? 1 : .8).attr("stroke", css("--surface")).attr("stroke-width", 1.5);
    g.append("text").attr("x", x(d.dette) + (fr ? 11 : 8)).attr("y", y(d.seuil) + 4).attr("font-size", fr ? 12.5 : 10).attr("font-weight", fr ? 700 : 500).attr("fill", fr ? "#dc2626" : css("--muted")).text(fr ? "France" : d.dette > 75 ? d.nom : d.code);
  });
  svg.append("g").attr("class", "axis").attr("transform", `translate(0,${h - mg.b})`).call(d3.axisBottom(x).ticks(w < 500 ? 5 : 10).tickFormat(d => d + " %"));
  svg.append("g").attr("class", "axis").attr("transform", `translate(${mg.l},0)`).call(d3.axisLeft(y).ticks(6).tickFormat(v => v.toLocaleString("fr-FR")));
  svg.append("text").attr("x", (mg.l + w - mg.r) / 2).attr("y", h - 6).attr("text-anchor", "middle").attr("fill", css("--muted")).attr("font-size", 11).text("Dette publique (% du PIB)");
  svg.append("text").attr("transform", `translate(12,${(h - mg.b + mg.t) / 2}) rotate(-90)`).attr("text-anchor", "middle").attr("fill", css("--muted")).attr("font-size", 11).text("Seuil du multiplicateur");
  el.replaceChildren(svg.node());
  const fr = P.find(d => d.code === "FR"), tri = [...P].sort((a, b) => a.seuil - b.seuil), rg = tri.findIndex(d => d.code === "FR") + 1;
  const pire = tri.slice(0, 4).map(d => esc(d.nom)).join(", "), danger = P.filter(d => d.seuil < m).length;
  $("#simu-pays-txt").innerHTML = `<ul>
    <li><b>Chaque point est un pays</b>, placé selon sa dette (horizontalement) et son seuil (verticalement). Plus un pays est endetté et taxé, plus son seuil est bas, et plus il est facile qu'une coupe y fasse <i>monter</i> le ratio dette/PIB.</li>
    <li><b>La France a le ${rg === 1 ? "seuil le plus bas" : rg + "<sup>e</sup> seuil le plus bas"}</b> des ${P.length} pays (${f2(fr.seuil)}), parce qu'elle cumule une dette élevée (${Math.round(fr.dette)} %) et les prélèvements les plus lourds (${fr.tx.toLocaleString("fr-FR")} %). Les plus exposés : ${pire}.</li>
    <li><b>Avec le multiplicateur choisi (${f2(m)})</b>, ${danger} pays sur ${P.length} sont dans la zone rouge. Faites varier le curseur « Multiplicateur » plus haut pour voir les pays changer de zone.</li>
  </ul>`;
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
