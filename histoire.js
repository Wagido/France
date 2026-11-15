/* Petits graphiques historiques dans les encadrés sur les dévaluations (INSEE, comptes nationaux) */
(() => {
"use strict";
let H = null;
const SER = [["inflation", "Hausse des prix (prix du PIB)", "#dc2626"], ["croissance", "Croissance du PIB (volume)", "#3b6fd6"], ["exportations", "Exportations (volume)", "#16a34a"]];
async function init() {
  if (!window.TH) { setTimeout(init, 100); return; }
  try { H = (await fetch("data/histoire.json").then(r => r.json())).series; } catch (e) { return; }
  let rt; addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(draw, 150); });
  draw();
}
function draw() {
  if (!H) return;
  const { showTip, hideTip, n1, esc } = window.TH;
  document.querySelectorAll(".hist-chart").forEach(el => {
    const from = +el.dataset.from, to = +el.dataset.to;
    const marks = (el.dataset.marks || "").split("|").filter(Boolean).map(s => { const [y, l] = s.split(":"); return { y: +y, l }; });
    const D = H.filter(r => r.annee >= from && r.annee <= to);
    const w = Math.max(300, el.clientWidth), h = 250, m = { t: 26, r: 12, b: 26, l: 38 };
    const x = d3.scaleBand(D.map(d => d.annee), [m.l, w - m.r]).padding(.35);
    const vals = D.flatMap(d => [d.inflation, d.croissance, d.exportations, d.solde_commercial]).filter(v => v != null);
    const y = d3.scaleLinear([Math.min(0, d3.min(vals)), d3.max(vals)], [h - m.b, m.t]).nice();
    const svg = d3.create("svg").attr("viewBox", `0 0 ${w} ${h}`);
    svg.append("g").attr("class", "grid").selectAll("line").data(y.ticks(5)).join("line").attr("x1", m.l).attr("x2", w - m.r).attr("y1", y).attr("y2", y);
    // dévaluations
    marks.forEach(k => {
      const cx = x(k.y) + x.bandwidth() / 2;
      svg.append("line").attr("x1", cx).attr("x2", cx).attr("y1", m.t - 6).attr("y2", h - m.b).attr("stroke", "#7c3aed").attr("stroke-width", 1.5).attr("stroke-dasharray", "4 3");
      svg.append("text").attr("x", cx + 4).attr("y", m.t - 10).attr("font-size", 11).attr("font-weight", 600).style("fill", "#7c3aed").text(k.l);
    });
    // solde commercial en barres
    svg.append("g").selectAll("rect").data(D).join("rect").attr("x", d => x(d.annee)).attr("width", x.bandwidth())
      .attr("y", d => y(Math.max(0, d.solde_commercial))).attr("height", d => Math.abs(y(d.solde_commercial) - y(0))).attr("fill", "#94a3b8").attr("opacity", .55);
    // courbes
    SER.forEach(([k, , c]) => svg.append("path").attr("fill", "none").attr("stroke", c).attr("stroke-width", 2.2)
      .attr("d", d3.line().defined(d => d[k] != null).x(d => x(d.annee) + x.bandwidth() / 2).y(d => y(d[k]))(D)));
    svg.append("line").attr("x1", m.l).attr("x2", w - m.r).attr("y1", y(0)).attr("y2", y(0)).attr("stroke", "currentColor").attr("opacity", .35);
    svg.append("g").attr("class", "axis").attr("transform", `translate(0,${h - m.b})`).call(d3.axisBottom(x).tickValues(D.map(d => d.annee).filter((a, i) => w > 520 || i % 2 === 0)));
    svg.append("g").attr("class", "axis").attr("transform", `translate(${m.l},0)`).call(d3.axisLeft(y).ticks(5).tickFormat(v => v + " %")).call(g => g.select(".domain").remove());
    // infobulle par année
    svg.append("g").selectAll("rect").data(D).join("rect").attr("x", d => x(d.annee) - x.step() * x.paddingInner() / 2).attr("width", x.step()).attr("y", m.t).attr("height", h - m.t - m.b).attr("fill", "transparent")
      .on("pointermove", (ev, d) => showTip(`<b>${d.annee}</b><br>${SER.map(([k, l]) => `${esc(l)} : ${d[k] > 0 ? "+" : ""}${n1(d[k])} %`).join("<br>")}<br>Solde des échanges extérieurs : ${d.solde_commercial > 0 ? "+" : ""}${n1(d.solde_commercial)} % du PIB`, ev)).on("pointerleave", hideTip);
    el.replaceChildren(svg.node());
    el.insertAdjacentHTML("beforeend", `<div class="legend-row">${SER.map(([, l, c]) => `<span><i style="border-top-color:${c};opacity:1"></i>${l}</span>`).join("")}<span><i style="border-top-color:#94a3b8;border-top-width:10px;width:14px;opacity:.7"></i>Solde des échanges extérieurs (% du PIB)</span></div>
      <p class="muted" style="font-size:.76rem;margin:4px 0 0">INSEE, comptes nationaux annuels (base 2020). Hausse des prix mesurée par le prix du PIB, un peu différente de l'indice des prix à la consommation.</p>`);
  });
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
