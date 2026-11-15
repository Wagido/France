/* Argent privé (salaires, budget des ménages) et PIB par habitant / énergie par habitant depuis 1900 */
(() => {
"use strict";
const $ = s => document.querySelector(s);
let A = null;
async function init() {
  if (!window.TH) { setTimeout(init, 100); return; }
  try { A = await fetch("data/argent_prive.json").then(r => r.json()); } catch (e) { return; }
  let rt; addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(draw, 150); });
  draw();
}
const eur = v => Math.round(v).toLocaleString("fr-FR") + " €";

function draw() {
  if (!A) return;
  drawEnergie(); drawCo2(); drawSalaire(); drawBudget();
}

/* PIB par habitant (depuis 1900) et énergie par habitant (depuis 1965), deux axes */
function drawEnergie() {
  const el = $("#en-pib"); if (!el) return;
  const { showTip, hideTip, esc } = window.TH;
  const S = A.serie, w = Math.max(320, el.clientWidth), h = 300, m = { t: 14, r: 64, b: 26, l: 64 };
  const x = d3.scaleLinear([1900, S.at(-1).annee], [m.l, w - m.r]);
  const yP = d3.scaleLinear([0, d3.max(S, d => d.pib_hab) * 1.08], [h - m.b, m.t]).nice();
  const yE = d3.scaleLinear([0, d3.max(S, d => d.energie_hab || 0) * 1.08], [h - m.b, m.t]).nice();
  const svg = d3.create("svg").attr("viewBox", `0 0 ${w} ${h}`);
  svg.append("g").attr("class", "grid").selectAll("line").data(yP.ticks(5)).join("line").attr("x1", m.l).attr("x2", w - m.r).attr("y1", yP).attr("y2", yP);
  svg.append("path").attr("fill", "none").attr("stroke", "#3b6fd6").attr("stroke-width", 2.4).attr("d", d3.line().defined(d => d.pib_hab).x(d => x(d.annee)).y(d => yP(d.pib_hab))(S));
  svg.append("path").attr("fill", "none").attr("stroke", "#e07b39").attr("stroke-width", 2.4).attr("d", d3.line().defined(d => d.energie_hab).x(d => x(d.annee)).y(d => yE(d.energie_hab))(S));
  svg.append("g").attr("class", "axis").attr("transform", `translate(0,${h - m.b})`).call(d3.axisBottom(x).ticks(w < 560 ? 6 : 13).tickFormat(d3.format("d")));
  svg.append("g").attr("class", "axis").attr("transform", `translate(${m.l},0)`).call(d3.axisLeft(yP).ticks(5).tickFormat(v => (v / 1000) + " k€")).call(g => g.select(".domain").remove()).call(g => g.selectAll("text").style("fill", "#3b6fd6"));
  svg.append("g").attr("class", "axis").attr("transform", `translate(${w - m.r},0)`).call(d3.axisRight(yE).ticks(5).tickFormat(v => (v / 1000) + " MWh")).call(g => g.select(".domain").remove()).call(g => g.selectAll("text").style("fill", "#e07b39"));
  svg.append("rect").attr("x", m.l).attr("y", m.t).attr("width", w - m.l - m.r).attr("height", h - m.t - m.b).attr("fill", "transparent")
    .on("pointermove", ev => { const yr = Math.round(x.invert(d3.pointer(ev)[0])), d = S.find(r => r.annee === yr); if (!d) return;
      showTip(`<b>${yr}</b><br>PIB par habitant : ${d.pib_hab ? eur(d.pib_hab) : "–"}${d.energie_hab ? `<br>Énergie par habitant : ${Math.round(d.energie_hab).toLocaleString("fr-FR")} kWh` : ""}`, ev); }).on("pointerleave", hideTip);
  el.replaceChildren(svg.node());
  const p0 = S.find(d => d.annee === 1900), pL = S.filter(d => d.pib_hab).at(-1);
  const eMax = S.filter(d => d.energie_hab).reduce((a, b) => b.energie_hab > a.energie_hab ? b : a), eL = S.filter(d => d.energie_hab).at(-1);
  const pAtMax = S.find(d => d.annee === eMax.annee);
  $("#en-pib-legend").innerHTML = `<span><i style="border-top-color:#3b6fd6;opacity:1"></i>PIB par habitant, en euros de ${A.annee_euros} (axe de gauche)</span><span><i style="border-top-color:#e07b39;opacity:1"></i>Énergie primaire par habitant (axe de droite)</span>`;
  $("#en-pib-txt").innerHTML = `<p>En euros constants, la production par habitant a été multipliée par <b>${(pL.pib_hab / p0.pib_hab).toLocaleString("fr-FR", { maximumFractionDigits: 1 })}</b> depuis 1900 (${eur(p0.pib_hab)} contre ${eur(pL.pib_hab)} en ${pL.annee}). La consommation d'énergie par habitant a culminé en ${eMax.annee} (${Math.round(eMax.energie_hab / 1000)} MWh) et a baissé de ${Math.round(100 * (1 - eL.energie_hab / eMax.energie_hab))}&nbsp;% depuis, alors que le PIB par habitant a encore augmenté de ${Math.round(100 * (pL.pib_hab / pAtMax.pib_hab - 1))}&nbsp;% : on produit plus de richesse avec moins d'énergie, en partie parce que l'industrie lourde est partie à l'étranger : l'énergie nécessaire à ce que nous importons n'est pas comptée ici (voir le graphique suivant).</p>
    <p class="muted" style="font-size:.78rem">PIB par habitant : INSEE (comptes nationaux base 2020) depuis 1949 ; avant, évolution du PIB réel par habitant de la base Jordà-Schularick-Taylor (estimations de Maddison). Pour un seul pays, les euros constants suffisent : les parités de pouvoir d'achat servent à comparer des pays entre eux. Énergie : Our World in Data, disponible depuis 1965 ; elle compte le nucléaire, l'éolien et le solaire comme l'énergie fossile qu'il faudrait brûler pour produire la même électricité, d'où un niveau un peu différent du bilan d'Eurostat de l'onglet Énergie. Aucune série fiable de consommation d'énergie par habitant n'est publiée avant 1965 pour la France.</p>`;
}


/* émissions par habitant : territoire et empreinte */
function drawCo2() {
  const el = $("#pib-co2"); if (!el || !A.co2?.length) return;
  const { lineChart, legend, n1 } = window.TH;
  lineChart(el, A.co2, [{ k: "empreinte", l: "Empreinte (avec les importations)", c: "#7c3aed" }, { k: "territoire", l: "Émis sur le territoire", c: "#64748b" }],
    { vfmt: v => n1(v) + " t", yfmt: v => v + " t", h: 260 });
  legend("#pib-co2-legend", [["Empreinte : tout ce qu'il a fallu émettre pour notre consommation, en France et ailleurs", "#7c3aed"], ["Émissions sur le territoire français (hors forêts et sols)", "#64748b"]]);
  const a = A.co2[0], b = A.co2.filter(d => d.territoire).at(-1);
  $("#pib-co2-txt").innerHTML = `Tonnes de gaz à effet de serre (équivalent CO₂) par habitant. L'écart entre les deux courbes, c'est ce qui est émis à l'étranger pour fabriquer ce que nous importons : ${n1(a.empreinte - a.territoire)} t par habitant en ${a.annee}, ${n1(b.empreinte - b.territoire)} t en ${b.annee}. Le même raisonnement vaut pour l'énergie, mais aucune statistique officielle de l'« énergie importée » dans nos achats n'est publiée pour la France : le carbone en donne la meilleure mesure. Sources : SDES et INSEE (empreinte), Eurostat (inventaire des émissions), Eurostat (population).`;
}

/* salaire moyen et PIB par habitant, par mois, depuis 1900 */
function drawSalaire() {
  const el = $("#ap-salaire"); if (!el) return;
  const { kpis, lineChart, legend, pct } = window.TH;
  const S = A.serie.filter(d => d.salaire || d.pib_hab).map(d => ({ annee: d.annee, salaire: d.annee >= 1949 ? d.salaire : null, ancien: d.annee <= 1949 ? d.salaire : null, pib_mois: d.pib_hab ? d.pib_hab / 12 : null }));
  const s50 = S.find(d => d.annee === 1950), sL = S.filter(d => d.salaire).at(-1), s80 = S.find(d => d.annee === 1980);
  const b0 = A.budget[0], bL = A.budget.at(-1);
  kpis("#ap-kpis", [
    [eur(sL.salaire), `salaire brut moyen par mois, à temps plein, en ${sL.annee} (avant cotisations salariales)`, "Salaire moyen"],
    ["× " + (sL.salaire / s50.salaire).toLocaleString("fr-FR", { maximumFractionDigits: 1 }), `pouvoir d'achat du salaire moyen depuis 1950 (+${Math.round(100 * (sL.salaire / s80.salaire - 1))} % seulement depuis 1980)`, "En euros constants"],
    [pct(bL.alimentation, 0), `du budget pour se nourrir en ${bL.annee}, contre ${pct(b0.alimentation, 0)} en ${b0.annee}`, "Alimentation"],
    [pct(bL.logement, 0), `pour le logement et l'énergie, contre ${pct(b0.logement, 0)} en ${b0.annee} (dont ${pct(bL.loyers_imputes, 0)} de loyers « imputés » des propriétaires)`, "Logement"],
  ]);
  lineChart(el, S, [{ k: "pib_mois", l: "PIB par habitant, par mois", c: "#94a3b8" }, { k: "ancien", l: "Salaire réel avant 1949 (ordre de grandeur)", c: "#3b6fd6", dash: "4 4" }, { k: "salaire", l: "Salaire brut moyen par mois (temps plein)", c: "#3b6fd6" }],
    { vfmt: v => eur(v), yfmt: v => (v / 1000).toLocaleString("fr-FR") + " k€", h: 300 });
  legend("#ap-salaire-legend", [["Salaire brut moyen par mois, à temps plein (INSEE, depuis 1949)", "#3b6fd6"], ["Avant 1949 : ordre de grandeur, autre source", "#3b6fd6", true], ["PIB par habitant, par mois (production par habitant, enfants et retraités compris)", "#94a3b8"]]);
}

/* répartition du budget des ménages depuis 1959 */
function drawBudget() {
  const el = $("#ap-budget"); if (!el) return;
  const { areaChart, legend } = window.TH;
  const P = A.postes, keys = P.map(p => p[0]);
  areaChart(el, A.budget, keys, Object.fromEntries(P.map(p => [p[0], p[2]])), Object.fromEntries(P.map(p => [p[0], p[1]])),
    { vfmt: v => v.toLocaleString("fr-FR", { maximumFractionDigits: 1 }) + " %", yfmt: v => v + " %", h: 320 });
  legend("#ap-budget-legend", P.map(p => [p[1], p[2]]));
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
