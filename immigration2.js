/* Immigration en France : stock, titres de séjour par motif, asile, diplômes, emploi, comparaison européenne */
(() => {
"use strict";
const $ = s => document.querySelector(s);
const n0 = v => Math.round(v).toLocaleString("fr-FR");
const COL = { fam: "#2563eb", educ: "#16a34a", emp: "#ea580c", oth: "#9333ea" };
const LBL = { fam: "Famille", educ: "Études", emp: "Travail", oth: "Humanitaire et autres (dont réfugiés)" };
let D = null;

function tip() {
  let t = document.getElementById("im2-tip");
  if (!t) { t = document.createElement("div"); t.id = "im2-tip"; t.style.cssText = "position:fixed;pointer-events:none;background:var(--tip-bg);color:var(--tip-ink);padding:6px 8px;border-radius:6px;font-size:12px;z-index:50;display:none;max-width:280px"; document.body.appendChild(t); }
  return t;
}
const show = (e, h) => { const t = tip(); t.innerHTML = h; t.style.display = "block"; t.style.left = Math.min(e.clientX + 12, innerWidth - 290) + "px"; t.style.top = (e.clientY + 12) + "px"; };
const hide = () => { tip().style.display = "none"; };

function legend(el, items) {
  el.innerHTML = items.map(([l, c]) => `<span style="display:inline-flex;align-items:center;gap:5px;margin-right:14px;font-size:12px"><span style="width:11px;height:11px;border-radius:2px;background:${c}"></span>${l}</span>`).join("");
}

/* 1. Stock d'immigrés 1921-2025 */
function stock() {
  const el = $("#im2-stock"); if (!el) return;
  const data = D.stock, W = Math.max(520, el.clientWidth || 700), H = 300, m = { l: 48, r: 48, t: 16, b: 28 };
  const x = d3.scaleBand().domain(data.map(d => d.an)).range([m.l, W - m.r]).padding(0.25);
  const y = d3.scaleLinear().domain([0, 9000]).range([H - m.b, m.t]);
  const y2 = d3.scaleLinear().domain([0, 14]).range([H - m.b, m.t]);
  const svg = d3.create("svg").attr("viewBox", `0 0 ${W} ${H}`).attr("width", "100%").style("font-size", "11px");
  svg.append("g").attr("transform", `translate(0,${H - m.b})`).call(d3.axisBottom(x).tickValues(data.map(d => d.an).filter((a, i) => i % 2 === 0 || a >= 2023)).tickSizeOuter(0));
  svg.append("g").attr("transform", `translate(${m.l},0)`).call(d3.axisLeft(y).ticks(5).tickFormat(v => v / 1000 + " M"));
  svg.append("g").attr("transform", `translate(${W - m.r},0)`).call(d3.axisRight(y2).ticks(5).tickFormat(v => v + " %"));
  svg.append("g").selectAll("rect").data(data).join("rect").attr("x", d => x(d.an)).attr("width", x.bandwidth()).attr("y", d => y(d.milliers)).attr("height", d => y(0) - y(d.milliers)).attr("fill", "#93c5fd")
    .on("mousemove", (e, d) => show(e, `<b>${d.an}</b><br>${n0(d.milliers * 1000)} immigrés<br>${String(d.part).replace(".", ",")} % de la population`)).on("mouseleave", hide);
  svg.append("path").datum(data).attr("fill", "none").attr("stroke", "#c2410c").attr("stroke-width", 2.2).attr("d", d3.line().x(d => x(d.an) + x.bandwidth() / 2).y(d => y2(d.part)));
  svg.append("g").selectAll("circle").data(data).join("circle").attr("cx", d => x(d.an) + x.bandwidth() / 2).attr("cy", d => y2(d.part)).attr("r", 3).attr("fill", "#c2410c");
  el.replaceChildren(svg.node());
  legend($("#im2-stock-leg"), [["Nombre d'immigrés (échelle de gauche)", "#93c5fd"], ["Part dans la population (échelle de droite)", "#c2410c"]]);
}

/* 2. Premiers titres de séjour par motif */
function motifs() {
  const el = $("#im2-motifs"); if (!el) return;
  const keys = ["fam", "educ", "emp", "oth"], data = D.permis;
  const W = Math.max(520, el.clientWidth || 700), H = 320, m = { l: 52, r: 16, t: 14, b: 28 };
  const st = d3.stack().keys(keys)(data);
  const x = d3.scaleBand().domain(data.map(d => d.an)).range([m.l, W - m.r]).padding(0.18);
  const y = d3.scaleLinear().domain([0, 400000]).range([H - m.b, m.t]);
  const svg = d3.create("svg").attr("viewBox", `0 0 ${W} ${H}`).attr("width", "100%").style("font-size", "11px");
  svg.append("g").attr("transform", `translate(0,${H - m.b})`).call(d3.axisBottom(x).tickValues(data.map(d => d.an).filter(a => a % 2 === 0 || a === 2025)).tickSizeOuter(0));
  svg.append("g").attr("transform", `translate(${m.l},0)`).call(d3.axisLeft(y).ticks(5).tickFormat(v => n0(v / 1000) + " k"));
  st.forEach(s => svg.append("g").selectAll("rect").data(s).join("rect").attr("x", d => x(d.data.an)).attr("width", x.bandwidth()).attr("y", d => y(d[1])).attr("height", d => y(d[0]) - y(d[1])).attr("fill", COL[s.key])
    .on("mousemove", (e, d) => { const t = keys.reduce((a, k) => a + d.data[k], 0); show(e, `<b>${d.data.an}</b> : ${n0(t)} premiers titres<br>` + keys.map(k => `${LBL[k]} : ${n0(d.data[k])} (${Math.round(d.data[k] / t * 100)} %)`).join("<br>")); }).on("mouseleave", hide));
  el.replaceChildren(svg.node());
  legend($("#im2-motifs-leg"), keys.map(k => [LBL[k], COL[k]]));
}

/* 3. Asile */
function asile() {
  const el = $("#im2-asile"); if (!el) return;
  const data = D.asile.filter(d => d.demandes);
  const W = Math.max(520, el.clientWidth || 700), H = 280, m = { l: 52, r: 16, t: 14, b: 28 };
  const x = d3.scaleBand().domain(data.map(d => d.an)).range([m.l, W - m.r]).padding(0.25);
  const y = d3.scaleLinear().domain([0, 160000]).range([H - m.b, m.t]);
  const svg = d3.create("svg").attr("viewBox", `0 0 ${W} ${H}`).attr("width", "100%").style("font-size", "11px");
  svg.append("g").attr("transform", `translate(0,${H - m.b})`).call(d3.axisBottom(x).tickValues(data.map(d => d.an).filter(a => a % 2 === 1 || a === 2025)).tickSizeOuter(0));
  svg.append("g").attr("transform", `translate(${m.l},0)`).call(d3.axisLeft(y).ticks(5).tickFormat(v => n0(v / 1000) + " k"));
  const bw = x.bandwidth() / 2;
  svg.append("g").selectAll("rect").data(data).join("rect").attr("x", d => x(d.an)).attr("width", bw).attr("y", d => y(d.demandes)).attr("height", d => y(0) - y(d.demandes)).attr("fill", "#94a3b8");
  svg.append("g").selectAll("rect").data(data.filter(d => d.pos)).join("rect").attr("x", d => x(d.an) + bw).attr("width", bw).attr("y", d => y(d.pos)).attr("height", d => y(0) - y(d.pos)).attr("fill", "#9333ea");
  svg.append("g").selectAll("rect").data(data).join("rect").attr("x", d => x(d.an)).attr("width", x.bandwidth()).attr("y", m.t).attr("height", H - m.b - m.t).attr("fill", "transparent")
    .on("mousemove", (e, d) => show(e, `<b>${d.an}</b><br>Premières demandes : ${n0(d.demandes)}<br>Décisions de l'OFPRA : ${d.decisions ? n0(d.decisions) : "–"}<br>dont protections accordées : ${d.pos ? n0(d.pos) + " (" + Math.round(d.pos / d.decisions * 100) + " %)" : "–"}`)).on("mouseleave", hide);
  el.replaceChildren(svg.node());
  legend($("#im2-asile-leg"), [["Premières demandes d'asile", "#94a3b8"], ["Protections accordées en première instance (statut de réfugié ou protection subsidiaire)", "#9333ea"]]);
}

/* Barres empilées à 100 % */
function stack100(sel, rows, keys, cols, labels, opt = {}) {
  const el = $(sel); if (!el) return;
  const W = Math.max(520, el.clientWidth || 700), rh = 26, m = { l: opt.ml || 200, r: 16, t: 8, b: 22 }, H = m.t + m.b + rows.length * rh;
  const x = d3.scaleLinear().domain([0, 100]).range([m.l, W - m.r]);
  const y = d3.scaleBand().domain(rows.map(r => r.nom)).range([m.t, H - m.b]).padding(0.22);
  const svg = d3.create("svg").attr("viewBox", `0 0 ${W} ${H}`).attr("width", "100%").style("font-size", "11px");
  svg.append("g").attr("transform", `translate(0,${H - m.b})`).call(d3.axisBottom(x).ticks(5).tickFormat(v => v + " %"));
  rows.forEach(r => {
    const tot = d3.sum(keys, k => r[k]); let acc = 0;
    keys.forEach((k, i) => {
      const v = r[k] / tot * 100, x0 = acc; acc += v;
      svg.append("rect").attr("x", x(x0)).attr("width", Math.max(0, x(acc) - x(x0))).attr("y", y(r.nom)).attr("height", y.bandwidth()).attr("fill", cols[i])
        .on("mousemove", e => show(e, `<b>${r.nom}</b><br>${labels[i]} : ${String(r[k]).replace(".", ",")} %`)).on("mouseleave", hide);
      if (v > 7) svg.append("text").attr("x", x(x0 + v / 2)).attr("y", y(r.nom) + y.bandwidth() / 2 + 4).attr("text-anchor", "middle").style("fill", "#fff").style("font-weight", 600).style("pointer-events", "none").text(Math.round(r[k]));
    });
    svg.append("text").attr("x", m.l - 8).attr("y", y(r.nom) + y.bandwidth() / 2 + 4).attr("text-anchor", "end").style("fill", "var(--ink)").style("font-weight", r.gras ? 700 : 400).text(r.nom);
  });
  el.replaceChildren(svg.node());
  if (opt.leg) legend($(opt.leg), labels.map((l, i) => [l, cols[i]]));
}

/* INSEE, enquête Emploi 2025 (chiffres-clés juin 2026) */
const RAISONS = [
  { nom: "Ensemble des immigrés", gras: 1, t: 24.7, f: 43.6, e: 16.8, p: 9.5, a: 5.3 },
  { nom: "Algérie", t: 18.0, f: 53.7, e: 20.8, p: 3.7, a: 3.8 },
  { nom: "Maroc, Tunisie", t: 27.1, f: 51.7, e: 18.0, p: 0.7, a: 2.4 },
  { nom: "Afrique sahélienne", t: 21.3, f: 37.4, e: 29.4, p: 8.1, a: 3.9 },
  { nom: "Afrique guinéenne ou centrale", t: 16.5, f: 36.1, e: 24.1, p: 16.7, a: 6.7 },
  { nom: "Turquie", t: 27.4, f: 59.9, e: 3.3, p: 8.3, a: 1.1 },
  { nom: "Asie du Sud-Est", t: 6.3, f: 33.9, e: 18.4, p: 39.8, a: 1.7 },
  { nom: "Portugal", t: 53.9, f: 37.4, e: 2.8, p: 2.7, a: 3.1 },
  { nom: "Espagne, Italie", t: 43.9, f: 38.1, e: 13.1, p: 0, a: 4.9 },
  { nom: "Autres pays de l'UE", t: 32.6, f: 44.1, e: 8.6, p: 3.6, a: 11.0 },
  { nom: "Amérique, Océanie", t: 27.7, f: 41.8, e: 16.1, p: 8.6, a: 5.7 }
];
const DIPL = [
  { nom: "Sans ascendance migratoire", gras: 1, a: 12.6, b: 21.5, c: 21.2, d: 15.5, e: 29.2 },
  { nom: "Immigrés (ensemble)", gras: 1, a: 34.4, b: 13.5, c: 15.0, d: 7.3, e: 29.8 },
  { nom: "Descendants d'immigrés", gras: 1, a: 15.9, b: 20.0, c: 23.4, d: 13.3, e: 27.4 },
  { nom: "Immigrés d'Algérie", a: 34.6, b: 14.5, c: 14.4, d: 6.6, e: 29.9 },
  { nom: "du Maroc, de Tunisie", a: 37.9, b: 13.5, c: 12.9, d: 8.5, e: 27.2 },
  { nom: "d'Afrique sahélienne", a: 44.1, b: 12.2, c: 15.2, d: 4.8, e: 23.7 },
  { nom: "d'Afrique guinéenne ou centrale", a: 27.0, b: 16.7, c: 18.8, d: 7.8, e: 29.7 },
  { nom: "de Turquie", a: 63.2, b: 13.4, c: 12.9, d: 4.2, e: 6.4 },
  { nom: "d'Asie (hors Turquie, Moyen-Orient)", a: 33.3, b: 7.2, c: 15.5, d: 7.4, e: 36.6 },
  { nom: "du Portugal", a: 51.0, b: 22.7, c: 13.0, d: 7.3, e: 5.9 },
  { nom: "d'Espagne, d'Italie", a: 14.3, b: 15.3, c: 12.2, d: 8.3, e: 49.8 },
  { nom: "d'autres pays de l'UE", a: 15.7, b: 13.8, c: 19.4, d: 9.1, e: 42.0 }
];
const EMPLOI = [
  { nom: "Sans ascendance migratoire", emploi: 71.9, chom: 6.5, inact: 23.1 },
  { nom: "Immigrés", emploi: 61.9, chom: 12.4, inact: 29.3 },
  { nom: "Descendants d'immigrés", emploi: 59.5, chom: 11.7, inact: 32.6 },
  { nom: "Immigrés d'Europe", emploi: 65.8, chom: 10.4, inact: 26.6 },
  { nom: "Immigrés d'Afrique", emploi: 60.7, chom: 13.8, inact: 29.7 },
  { nom: "Immigrés d'Asie", emploi: 59.1, chom: 11.1, inact: 33.5 }
];

function emploi() {
  const el = $("#im2-emploi"); if (!el) return;
  const W = Math.max(520, el.clientWidth || 700), rh = 34, m = { l: 190, r: 40, t: 8, b: 22 }, H = m.t + m.b + EMPLOI.length * rh;
  const x = d3.scaleLinear().domain([0, 80]).range([m.l, W - m.r]);
  const y = d3.scaleBand().domain(EMPLOI.map(r => r.nom)).range([m.t, H - m.b]).padding(0.2);
  const svg = d3.create("svg").attr("viewBox", `0 0 ${W} ${H}`).attr("width", "100%").style("font-size", "11px");
  svg.append("g").attr("transform", `translate(0,${H - m.b})`).call(d3.axisBottom(x).ticks(8).tickFormat(v => v + " %"));
  const h = y.bandwidth() / 2;
  EMPLOI.forEach(r => {
    svg.append("rect").attr("x", m.l).attr("y", y(r.nom)).attr("height", h - 1).attr("width", x(r.emploi) - m.l).attr("fill", "#2563eb");
    svg.append("rect").attr("x", m.l).attr("y", y(r.nom) + h).attr("height", h - 1).attr("width", x(r.chom) - m.l).attr("fill", "#dc2626");
    svg.append("text").attr("x", x(r.emploi) + 4).attr("y", y(r.nom) + h - 3).style("fill", "var(--ink)").text(String(r.emploi).replace(".", ",") + " %");
    svg.append("text").attr("x", x(r.chom) + 4).attr("y", y(r.nom) + 2 * h - 3).style("fill", "var(--ink)").text(String(r.chom).replace(".", ",") + " %");
    svg.append("text").attr("x", m.l - 8).attr("y", y(r.nom) + h + 4).attr("text-anchor", "end").style("fill", "var(--ink)").text(r.nom);
  });
  el.replaceChildren(svg.node());
  legend($("#im2-emploi-leg"), [["Taux d'emploi des 15-64 ans", "#2563eb"], ["Taux de chômage (part des actifs sans emploi)", "#dc2626"]]);
}

function europe() {
  const el = $("#im2-eu"); if (!el) return;
  const data = D.europe2024;
  const W = Math.max(520, el.clientWidth || 700), rh = 18, m = { l: 120, r: 70, t: 6, b: 22 }, H = m.t + m.b + data.length * rh;
  const x = d3.scaleLinear().domain([0, d3.max(data, d => d.pour1000)]).range([m.l, W - m.r]);
  const y = d3.scaleBand().domain(data.map(d => d.pays)).range([m.t, H - m.b]).padding(0.18);
  const svg = d3.create("svg").attr("viewBox", `0 0 ${W} ${H}`).attr("width", "100%").style("font-size", "11px");
  svg.append("g").attr("transform", `translate(0,${H - m.b})`).call(d3.axisBottom(x).ticks(6));
  svg.append("g").selectAll("rect").data(data).join("rect").attr("x", m.l).attr("y", d => y(d.pays)).attr("height", y.bandwidth()).attr("width", d => x(d.pour1000) - m.l)
    .attr("fill", d => d.code === "FR" ? "#c2410c" : d.code === "EU27_2020" ? "#334155" : "#93c5fd")
    .on("mousemove", (e, d) => show(e, `<b>${d.pays}</b><br>${n0(d.titres)} premiers titres en 2024<br>${String(d.pour1000).replace(".", ",")} pour 1 000 habitants`)).on("mouseleave", hide);
  svg.append("g").selectAll("text.v").data(data).join("text").attr("x", d => x(d.pour1000) + 4).attr("y", d => y(d.pays) + y.bandwidth() / 2 + 4).style("fill", "var(--ink)").text(d => String(d.pour1000).replace(".", ","));
  svg.append("g").selectAll("text.l").data(data).join("text").attr("x", m.l - 6).attr("y", d => y(d.pays) + y.bandwidth() / 2 + 4).attr("text-anchor", "end").style("fill", "var(--ink)").style("font-weight", d => ["FR", "EU27_2020"].includes(d.code) ? 700 : 400).text(d => d.pays);
  el.replaceChildren(svg.node());
}


/* Estimations du solde budgétaire selon la méthode (% du PIB) */
const COUTS = [
  { nom: "OCDE, sans biens publics (2006-2018)", v: 1.02, info: "Impôts et cotisations versés par les immigrés moins prestations et services individuels reçus. Armée, dette, administration non imputées." },
  { nom: "CEPII, comptabilité générationnelle (2012)", lo: 0, hi: 0.2, info: "Sur toute la vie des immigrés et de leurs descendants : effet de long terme légèrement positif, très faible (ordre de grandeur indicatif)." },
  { nom: "CEPII, 1979-2011, chaque année", lo: -0.5, hi: 0.5, info: "Contribution nette annuelle, biens publics et part du déficit inclus : entre −0,5 % et +0,5 % du PIB selon les années (±0,2 % hors 2011)." },
  { nom: "OCDE, avec biens publics (2006-2018)", v: -0.85, info: "Même calcul, en attribuant aux immigrés une part des dépenses collectives au prorata de leur nombre." },
  { nom: "OID, « 40 milliards » (2023)", v: -1.6, info: "Part du déficit public par habitant appliquée aux immigrés (et descendants), à partir d'un ratio de 2011 appliqué au PIB de 2019. Méthode contestée." }
];
function couts() {
  const el = $("#im2-couts"); if (!el) return;
  const W = Math.max(520, el.clientWidth || 700), rh = 40, m = { l: 260, r: 40, t: 20, b: 28 }, H = m.t + m.b + COUTS.length * rh;
  const x = d3.scaleLinear().domain([-2, 1.4]).range([m.l, W - m.r]);
  const y = d3.scaleBand().domain(COUTS.map(d => d.nom)).range([m.t, H - m.b]).padding(0.3);
  const svg = d3.create("svg").attr("viewBox", `0 0 ${W} ${H}`).attr("width", "100%").style("font-size", "11px");
  svg.append("rect").attr("x", x(-2)).attr("width", x(0) - x(-2)).attr("y", m.t - 14).attr("height", H - m.b - m.t + 14).attr("fill", "#dc2626").attr("opacity", .06);
  svg.append("rect").attr("x", x(0)).attr("width", x(1.4) - x(0)).attr("y", m.t - 14).attr("height", H - m.b - m.t + 14).attr("fill", "#16a34a").attr("opacity", .06);
  svg.append("text").attr("x", x(-1)).attr("y", m.t - 4).attr("text-anchor", "middle").style("fill", "#b91c1c").style("font-weight", 600).text("← l'immigration coûte");
  svg.append("text").attr("x", x(0.7)).attr("y", m.t - 4).attr("text-anchor", "middle").style("fill", "#15803d").style("font-weight", 600).text("l'immigration rapporte →");
  svg.append("g").attr("transform", `translate(0,${H - m.b})`).call(d3.axisBottom(x).ticks(7).tickFormat(v => (v > 0 ? "+" : "") + String(v).replace(".", ",") + " %"));
  svg.append("line").attr("x1", x(0)).attr("x2", x(0)).attr("y1", m.t - 14).attr("y2", H - m.b).attr("stroke", "var(--ink)").attr("stroke-width", 1.2);
  COUTS.forEach(d => {
    const a = d.v !== undefined ? Math.min(0, d.v) : d.lo, b = d.v !== undefined ? Math.max(0, d.v) : d.hi;
    const col = d.v !== undefined ? (d.v >= 0 ? "#16a34a" : "#dc2626") : "#64748b";
    const r = svg.append("rect").attr("x", x(a)).attr("width", Math.max(2, x(b) - x(a))).attr("y", y(d.nom)).attr("height", y.bandwidth()).attr("fill", col).attr("opacity", d.v !== undefined ? 1 : .55).attr("rx", 2);
    if (d.v === undefined) r.attr("stroke", "#334155").attr("stroke-dasharray", "3,2");
    const lab = d.v !== undefined ? (d.v > 0 ? "+" : "") + String(d.v).replace(".", ",") + " %" : "de " + String(d.lo).replace(".", ",") + " à +" + String(d.hi).replace(".", ",") + " %";
    const tx = d.v !== undefined ? (d.v >= 0 ? x(b) + 5 : x(a) - 5) : x(b) + 5;
    svg.append("text").attr("x", tx).attr("y", y(d.nom) + y.bandwidth() / 2 + 4).attr("text-anchor", d.v !== undefined && d.v < 0 ? "end" : "start").style("fill", "var(--ink)").style("font-weight", 600).text(lab);
    svg.append("text").attr("x", m.l - 8).attr("y", y(d.nom) + y.bandwidth() / 2 + 4).attr("text-anchor", "end").style("fill", "var(--ink)").text(d.nom);
    svg.append("rect").attr("x", 0).attr("width", W).attr("y", y(d.nom)).attr("height", y.bandwidth()).attr("fill", "transparent").on("mousemove", e => show(e, `<b>${d.nom}</b><br>${d.info}`)).on("mouseleave", hide);
  });
  el.replaceChildren(svg.node());
}

function drawAll() {
  if (!D) return;
  stock(); motifs(); asile(); emploi(); europe(); couts();
  stack100("#im2-raisons", RAISONS, ["t", "f", "e", "p", "a"], ["#ea580c", "#2563eb", "#16a34a", "#9333ea", "#94a3b8"], ["Travail", "Famille", "Études", "Protection (asile)", "Autres"], { leg: "#im2-raisons-leg", ml: 190 });
  stack100("#im2-dipl", DIPL, ["a", "b", "c", "d", "e"], ["#b91c1c", "#f97316", "#eab308", "#22c55e", "#15803d"], ["Aucun diplôme, brevet, CEP", "CAP, BEP", "Bac", "Bac + 2", "Au-delà de bac + 2"], { leg: "#im2-dipl-leg", ml: 220 });
}

async function init() {
  if (!$("#im2-stock")) return;
  try { D = await fetch("data/immigration_fr.json").then(r => r.json()); } catch (e) { return; }
  drawAll();
  let w = innerWidth; addEventListener("resize", () => { if (Math.abs(innerWidth - w) > 40) { w = innerWidth; drawAll(); } });
  addEventListener("hashchange", () => { if (location.hash === "#immigration") setTimeout(drawAll, 50); });
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
