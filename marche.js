/* Marché de l'électricité : ordre de mérite et prix marginal (illustration simplifiée, France reliée à ses voisins) */
(function () {
const $ = s => document.querySelector(s);
const n0 = v => Math.round(v).toLocaleString("fr-FR");
function init() {
  if (!$("#mk-chart")) return;
  if (!window.TH || !window.d3) { setTimeout(init, 100); return; }
  ["mk-d", "mk-r", "mk-g"].forEach(id => $("#" + id).addEventListener("input", draw));
  let rt; addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(draw, 150); });
  draw();
}
function draw() {
  const el = $("#mk-chart"); if (!el.clientWidth) return;
  const { showTip, hideTip, css } = window.TH;
  const dem = +$("#mk-d").value, ren = +$("#mk-r").value, gaz = +$("#mk-g").value;
  $("#mk-d-v").textContent = dem + " GW"; $("#mk-r-v").textContent = ren + " GW"; $("#mk-g-v").textContent = gaz + " €/MWh de gaz";
  // coût marginal d'une centrale à gaz : gaz / rendement + CO2 (0,37 t/MWh à 70 €/t) ; turbine de pointe : rendement 35 %
  const ccg = gaz / 0.55 + 0.37 * 70 + 3, tac = gaz / 0.35 + 0.57 * 70 + 5;
  const P = [["Éolien et solaire", ren, 0, "#16a34a"], ["Hydraulique au fil de l'eau", 6, 2, "#0ea5e9"], ["Nucléaire", 50, 10, "#facc15"], ["Hydraulique de lac (l'eau est gardée pour les heures chères)", 8, 0.9 * ccg, "#38bdf8"],
    ["Importations bon marché", 6, 45, "#a3a3a3"], ["Gaz (cycle combiné)", 12, ccg, "#f97316"], ["Gaz et fioul de pointe", 8, tac, "#dc2626"], ["Effacements, importations chères", 10, Math.max(tac + 60, 300), "#7c3aed"]];
  P.sort((a, b) => a[2] - b[2]);
  let x0 = 0; const B = P.map(([l, cap, c, col]) => { const b = { l, x0, x1: x0 + cap, c, col, cap }; x0 += cap; return b; });
  const marg = B.find(b => b.x1 >= dem) || B.at(-1), prix = marg.c;
  const w = Math.max(320, el.clientWidth), h = 300, m = { t: 14, r: 12, b: 30, l: 46 };
  const x = d3.scaleLinear([0, Math.max(100, x0)], [m.l, w - m.r]), y = d3.scaleLinear([0, Math.min(700, Math.max(250, prix * 1.25))], [h - m.b, m.t]);
  const svg = d3.create("svg").attr("viewBox", `0 0 ${w} ${h}`);
  svg.append("g").attr("class", "grid").selectAll("line").data(y.ticks(5)).join("line").attr("x1", m.l).attr("x2", w - m.r).attr("y1", y).attr("y2", y);
  B.forEach(b => {
    if (b.cap <= 0) return;
    const on = b.x0 < dem;
    svg.append("rect").attr("x", x(b.x0)).attr("width", Math.max(0, x(b.x1) - x(b.x0) - 1)).attr("y", y(Math.min(b.c, y.domain()[1]))).attr("height", Math.max(2, y(0) - y(Math.min(b.c, y.domain()[1])))).attr("fill", b.col).attr("opacity", on ? 1 : .3)
      .on("pointermove", ev => showTip(`<b>${b.l}</b><br>${n0(b.cap)} GW, coût marginal ${n0(b.c)} €/MWh${on ? "<br>appelée" : "<br>non appelée"}`, ev)).on("pointerleave", hideTip);
    if (x(b.x1) - x(b.x0) > 46) svg.append("text").attr("x", (x(b.x0) + x(b.x1)) / 2).attr("y", y(Math.min(b.c, y.domain()[1])) - 4).attr("text-anchor", "middle").attr("font-size", 9.5).attr("fill", css("--ink")).text(b.l.split(" ")[0]);
  });
  // rente inframarginale du nucléaire
  const nuc = B.find(b => b.l === "Nucléaire");
  if (prix > nuc.c) svg.append("rect").attr("x", x(nuc.x0)).attr("width", x(Math.min(nuc.x1, dem)) - x(nuc.x0)).attr("y", y(prix)).attr("height", y(nuc.c) - y(prix)).attr("fill", "#facc15").attr("opacity", .25).attr("stroke", "#ca8a04").attr("stroke-dasharray", "3 2");
  svg.append("line").attr("x1", x(dem)).attr("x2", x(dem)).attr("y1", m.t).attr("y2", h - m.b).attr("stroke", css("--ink")).attr("stroke-width", 1.5);
  svg.append("text").attr("x", x(dem) + 4).attr("y", m.t + 10).attr("font-size", 10.5).attr("font-weight", 600).attr("fill", css("--ink")).text(`demande ${dem} GW`);
  svg.append("line").attr("x1", m.l).attr("x2", w - m.r).attr("y1", y(prix)).attr("y2", y(prix)).attr("stroke", "#dc2626").attr("stroke-dasharray", "5 3");
  svg.append("text").attr("x", m.l + 4).attr("y", y(prix) - 5).attr("font-size", 10.5).attr("font-weight", 600).attr("fill", "#dc2626").text(`prix pour tous : ${n0(prix)} €/MWh`);
  svg.append("g").attr("class", "axis").attr("transform", `translate(0,${h - m.b})`).call(d3.axisBottom(x).ticks(w < 560 ? 5 : 10).tickFormat(v => v + " GW"));
  svg.append("g").attr("class", "axis").attr("transform", `translate(${m.l},0)`).call(d3.axisLeft(y).ticks(5).tickFormat(v => v + " €")).call(s => s.select(".domain").remove());
  el.replaceChildren(svg.node());
  const coutNuc = 60, rente = Math.max(0, prix - coutNuc);
  $("#mk-out").innerHTML = `<p class="in-verdict">La dernière centrale appelée est <b>${marg.l.toLowerCase()}</b> : le prix est de <b>${n0(prix)} €/MWh</b> pour toute l'électricité vendue à cette heure. Le nucléaire, qui coûte environ ${coutNuc} €/MWh tout compris (construction, entretien, combustible), reçoit ce prix : ${rente > 0 ? `soit <b>${n0(rente)} € de plus que son coût par MWh</b> (zone jaune hachurée).` : "c'est moins que son coût complet : les années de prix bas, les producteurs perdent de l'argent."}</p>
    <p class="muted" style="font-size:.8rem">Illustration simplifiée : capacités et coûts sont des ordres de grandeur pour la France, prix du CO₂ fixé à 70 €/t ; en réalité, le prix dépend aussi des voisins, des stocks d'eau des barrages et des offres des producteurs.</p>`;
}
init();
})();
