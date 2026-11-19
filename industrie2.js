/* Industrie 2.1 : fiscalité et éducation comparées (Eurostat 2023) */
(() => {
"use strict";
const $ = s => document.querySelector(s);
const f1 = v => v.toLocaleString("fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
function tip() { let t = document.getElementById("ind2-tip"); if (!t) { t = document.createElement("div"); t.id = "ind2-tip"; t.style.cssText = "position:fixed;pointer-events:none;background:var(--tip-bg);color:var(--tip-ink);padding:6px 8px;border-radius:6px;font-size:12px;z-index:50;display:none;max-width:300px"; document.body.appendChild(t); } return t; }
const show = (e, h) => { const t = tip(); t.innerHTML = h; t.style.display = "block"; t.style.left = Math.min(e.clientX + 12, innerWidth - 310) + "px"; t.style.top = (e.clientY + 12) + "px"; };
const hide = () => { tip().style.display = "none"; };
const P = { FR: "France", DE: "Allemagne", IT: "Italie", ES: "Espagne", NL: "Pays-Bas", BE: "Belgique", AT: "Autriche", SE: "Suède", DK: "Danemark", PL: "Pologne", CZ: "Tchéquie", EU: "Union européenne" };
const FISC = { FR: [4.7, 7.3, 16.3], DE: [0.9, 6.8, 16.7], IT: [2.9, 6.5, 12.5], ES: [1.9, 6.4, 13.2], NL: [1.2, 7.2, 12.8], BE: [2.4, 6.2, 15.2], AT: [3.2, 7.9, 15.3], SE: [10.6, 9.0, 3.5], DK: [2.3, 9.3, 0.7], PL: [3.2, 7.3, 14.2], CZ: [1.0, 7.5, 15.3], EU: [2.5, 7.1, 13.7] };
const EDU = { FR: [1.4, 2.2, 0.5, 5.0], DE: [1.5, 1.5, 0.8, 4.5], IT: [1.4, 1.7, 0.4, 3.9], ES: [1.6, 1.6, 0.6, 4.2], NL: [1.6, 2.0, 1.2, 5.1], BE: [2.0, 2.4, 1.0, 6.3], AT: [1.6, 1.9, 0.8, 4.9], SE: [4.7, 1.1, 1.1, 7.3], DK: [2.6, 1.3, 1.4, 5.6], PL: [2.3, 0.9, 1.2, 4.9], CZ: [1.2, 2.2, 0.7, 4.5], EU: [1.6, 1.7, 0.8, 4.7] };

function groupes(sel, data, keys, cols, noms, ordre, opt = {}) {
  const el = $(sel); if (!el) return;
  const W = Math.max(560, el.clientWidth || 800), H = 300, m = { l: 36, r: 10, t: 14, b: 44 };
  const x0 = d3.scaleBand().domain(ordre).range([m.l, W - m.r]).padding(0.18);
  const x1 = d3.scaleBand().domain(keys.map((_, i) => i)).range([0, x0.bandwidth()]).padding(0.08);
  const ymax = opt.max || d3.max(ordre, g => d3.max(data[g].slice(0, keys.length)));
  const y = d3.scaleLinear().domain([0, ymax]).nice().range([H - m.b, m.t]);
  const svg = d3.create("svg").attr("viewBox", `0 0 ${W} ${H}`).attr("width", "100%").style("font-size", "11px");
  svg.append("g").attr("transform", `translate(${m.l},0)`).call(d3.axisLeft(y).ticks(6).tickFormat(v => v + " %"));
  ordre.forEach(g => {
    const gg = svg.append("g").attr("transform", `translate(${x0(g)},0)`);
    if (g === "FR" || g === "DE") gg.append("rect").attr("x", -3).attr("y", m.t - 6).attr("width", x0.bandwidth() + 6).attr("height", H - m.b - m.t + 6).attr("fill", g === "FR" ? "#2563eb" : "#64748b").attr("opacity", .07);
    keys.forEach((k, i) => gg.append("rect").attr("x", x1(i)).attr("width", x1.bandwidth()).attr("y", y(data[g][i])).attr("height", y(0) - y(data[g][i])).attr("fill", cols[i])
      .on("mousemove", e => show(e, `<b>${P[g]}</b><br>${k} : ${f1(data[g][i])} % du PIB${opt.total ? `<br>Total éducation : ${f1(data[g][3])} %` : ""}`)).on("mouseleave", hide));
    svg.append("text").attr("x", x0(g) + x0.bandwidth() / 2).attr("y", H - m.b + 14).attr("text-anchor", "middle").style("fill", "var(--ink)").style("font-weight", ["FR", "DE"].includes(g) ? 700 : 400).text(P[g].replace("Union européenne", "UE"));
    if (opt.total) svg.append("text").attr("x", x0(g) + x0.bandwidth() / 2).attr("y", H - m.b + 28).attr("text-anchor", "middle").style("fill", "var(--muted)").text("total " + f1(data[g][3]));
  });
  el.replaceChildren(svg.node());
  $(sel + "-leg").innerHTML = keys.map((k, i) => `<span style="display:inline-flex;align-items:center;gap:5px;margin-right:14px;font-size:12px"><span style="width:11px;height:11px;border-radius:2px;background:${cols[i]}"></span>${k}</span>`).join("");
}
function draw() {
  const ordre = ["FR", "DE", "IT", "ES", "NL", "BE", "AT", "PL", "CZ", "DK", "SE", "EU"];
  groupes("#ind-fisc", FISC, ["Impôts sur la production", "TVA", "Cotisations sociales"], ["#dc2626", "#2563eb", "#f59e0b"], P, ordre);
  groupes("#ind-edu", EDU, ["Préélémentaire et primaire", "Collège et lycée", "Supérieur"], ["#16a34a", "#0891b2", "#7c3aed"], P, ordre, { total: true });
}
function init() { if (!$("#ind-fisc")) return; draw(); addEventListener("hashchange", () => { if (location.hash === "#industrie") setTimeout(draw, 50); }); }
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
