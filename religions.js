/* Judaïsme, islam, hindouisme et bouddhisme : chiffres et graphiques */
(() => {
"use strict";
const $ = s => document.querySelector(s);
const fr = (v, d = 0) => v.toLocaleString("fr-FR", { minimumFractionDigits: d, maximumFractionDigits: d });
function tip() { let t = document.getElementById("re-tip"); if (!t) { t = document.createElement("div"); t.id = "re-tip"; t.style.cssText = "position:fixed;pointer-events:none;background:var(--tip-bg);color:var(--tip-ink);padding:6px 8px;border-radius:6px;font-size:12px;z-index:50;display:none;max-width:300px"; document.body.appendChild(t); } return t; }
const show = (e, h) => { const t = tip(); t.innerHTML = h; t.style.display = "block"; t.style.left = Math.min(e.clientX + 12, innerWidth - 310) + "px"; t.style.top = (e.clientY + 12) + "px"; };
const hide = () => { tip().style.display = "none"; };

function hbars(sel, rows, opt = {}) {
  const el = $(sel); if (!el) return;
  const W = Math.max(380, el.clientWidth || 520), rh = opt.rh || 26, m = { l: opt.ml || 150, r: 60, t: 6, b: 22 }, H = m.t + m.b + rows.length * rh;
  const x = d3.scaleLinear().domain([0, d3.max(rows, r => r[1])]).range([m.l, W - m.r]);
  const y = d3.scaleBand().domain(rows.map(r => r[0])).range([m.t, H - m.b]).padding(0.22);
  const svg = d3.create("svg").attr("viewBox", `0 0 ${W} ${H}`).attr("width", "100%").style("font-size", "11px");
  svg.append("g").attr("transform", `translate(0,${H - m.b})`).call(d3.axisBottom(x).ticks(5).tickFormat(v => fr(v)));
  rows.forEach(([l, v, c, info]) => {
    svg.append("rect").attr("x", m.l).attr("y", y(l)).attr("height", y.bandwidth()).attr("width", Math.max(1, x(v) - m.l)).attr("fill", c || "#2563eb").attr("rx", 2)
      .on("mousemove", e => show(e, `<b>${l}</b> : ${fr(v, opt.dec || 0)} ${opt.unit || ""}${info ? "<br>" + info : ""}`)).on("mouseleave", hide);
    svg.append("text").attr("x", x(v) + 4).attr("y", y(l) + y.bandwidth() / 2 + 4).style("fill", "var(--ink)").style("font-weight", 600).text(fr(v, opt.dec || 0));
    svg.append("text").attr("x", m.l - 8).attr("y", y(l) + y.bandwidth() / 2 + 4).attr("text-anchor", "end").style("fill", "var(--ink)").text(l);
  });
  el.replaceChildren(svg.node());
}

function jupop() {
  const el = $("#ju-pop"); if (!el) return;
  const D = [[1800, 2.5], [1900, 10.6], [1939, 16.6], [1945, 11.0], [1970, 12.6], [2000, 13.2], [2024, 15.7]];
  const W = Math.max(520, el.clientWidth || 700), H = 250, m = { l: 40, r: 16, t: 20, b: 28 };
  const x = d3.scaleBand().domain(D.map(d => d[0])).range([m.l, W - m.r]).padding(0.3);
  const y = d3.scaleLinear().domain([0, 18]).range([H - m.b, m.t]);
  const svg = d3.create("svg").attr("viewBox", `0 0 ${W} ${H}`).attr("width", "100%").style("font-size", "11px");
  svg.append("g").attr("transform", `translate(0,${H - m.b})`).call(d3.axisBottom(x).tickSizeOuter(0));
  svg.append("g").attr("transform", `translate(${m.l},0)`).call(d3.axisLeft(y).ticks(6));
  svg.append("g").selectAll("rect").data(D).join("rect").attr("x", d => x(d[0])).attr("width", x.bandwidth()).attr("y", d => y(d[1])).attr("height", d => y(0) - y(d[1])).attr("fill", d => d[0] === 1945 ? "#475569" : "#2563eb");
  svg.append("g").selectAll("text").data(D).join("text").attr("x", d => x(d[0]) + x.bandwidth() / 2).attr("y", d => y(d[1]) - 5).attr("text-anchor", "middle").style("fill", "var(--ink)").style("font-weight", 600).text(d => fr(d[1], 1));
  svg.append("text").attr("x", x(1945) + x.bandwidth() / 2).attr("y", y(11) + 18).attr("text-anchor", "middle").style("fill", "#fff").style("font-size", "10px").text("Shoah");
  el.replaceChildren(svg.node());
}

function init() {
  const K = (sel, items) => { const k = $(sel); if (k && window.kpiHTML) k.innerHTML = items.map(([v, l]) => window.kpiHTML(v, l)).join(""); };
  K("#ju-kpis", [["≈ 15,7 M", "Juifs dans le monde (2024)"], ["≈ 7,2 M", "en Israël"], ["≈ 6,3 M", "aux États-Unis"], ["≈ 440 000", "en France, 1ʳᵉ communauté d'Europe"]]);
  K("#is-kpis", [["≈ 2,0 Md", "musulmans dans le monde (2020)"], ["25,6 %", "de l'humanité"], ["85-90 %", "de sunnites"], ["≈ 10 %", "des 18-59 ans en France"]]);
  K("#bh-kpis", [["≈ 1,2 Md", "hindous (2020), 94 % en Inde"], ["≈ 324 M", "bouddhistes, surtout en Asie de l'Est et du Sud-Est"], ["vers 400 av. J.-C.", "mort du Bouddha (datation récente)"], ["≈ 1500 av. J.-C.", "premiers hymnes védiques"]]);
  jupop();
  hbars("#rel-monde", [["Chrétiens", 2300, "#2563eb"], ["Musulmans", 2000, "#16a34a"], ["Sans religion", 1900, "#94a3b8"], ["Hindous", 1200, "#f97316"], ["Bouddhistes", 324, "#eab308"], ["Autres religions", 170, "#a78bfa", "religions traditionnelles, sikhs, taoïstes, etc."], ["Juifs", 14.8, "#7c3aed"]], { unit: "millions", ml: 120 });
  hbars("#is-pays", [["Indonésie", 240, "#16a34a"], ["Pakistan", 235, "#16a34a"], ["Inde", 210, "#16a34a", "une minorité de 14 % dans un pays à majorité hindoue"], ["Bangladesh", 150, "#16a34a"], ["Nigeria", 110, "#16a34a"], ["Égypte", 100, "#15803d", "premier pays arabe"], ["Iran", 88, "#0f766e", "chiite à environ 90 %"], ["Turquie", 85, "#16a34a"]], { unit: "millions", ml: 100 });
  addEventListener("hashchange", () => { if (["#judaisme", "#islam"].includes(location.hash)) setTimeout(init2, 50); });
}
function init2() { jupop(); }
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
