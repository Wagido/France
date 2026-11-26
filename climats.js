/* Monnaie, 7.1 les moteurs de la demande, 7.3 les quatre climats, 7.4 Kondratiev (data/climats.json, data/histoire.json) */
(() => {
"use strict";
let C = null, H = null, MO = null, mode = "mixte";
const $ = s => document.querySelector(s);
const f1 = v => v == null ? "–" : v.toLocaleString("fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const sg = v => v == null ? "–" : (v > 0 ? "+" : v < 0 ? "−" : "") + f1(Math.abs(v));
const Q = {
  CI: { l: "Croissance inflationniste", d: "activité au-dessus de sa tendance, inflation qui accélère", c: "#16a34a" },
  RI: { l: "Récession inflationniste", d: "activité au-dessous de sa tendance, inflation qui accélère", c: "#dc2626" },
  RD: { l: "Récession déflationniste", d: "activité au-dessous de sa tendance, inflation qui ralentit", c: "#ca8a04" },
  CD: { l: "Croissance déflationniste", d: "activité au-dessus de sa tendance, inflation qui ralentit", c: "#2563eb" }
};
const MOT = [{ k: "conso", l: "Consommation des ménages", c: "#0ea5e9" }, { k: "public", l: "Dépense publique (services publics)", c: "#7c3aed" },
  { k: "invest", l: "Investissement (entreprises, logement, État)", c: "#f59e0b" }, { k: "commerce", l: "Commerce extérieur (exportations − importations)", c: "#16a34a" },
  { k: "stocks", l: "Variation des stocks", c: "#9ca3af" }];
const PAYS = [{ k: "FR", l: "France", c: "#2563eb" }, { k: "DE", l: "Allemagne", c: "#111827" }, { k: "IT", l: "Italie", c: "#16a34a" }, { k: "ES", l: "Espagne", c: "#f59e0b" }, { k: "EU27_2020", l: "Union européenne", c: "#9ca3af", dash: "4 3" }];

async function init() {
  if (!window.TH || !window.d3) { setTimeout(init, 100); return; }
  try {
    [C, H, MO] = await Promise.all([fetch("data/climats.json", { cache: "no-cache" }).then(r => r.json()), fetch("data/histoire.json", { cache: "no-cache" }).then(r => r.json()), fetch("data/monnaie.json", { cache: "no-cache" }).then(r => r.json()).catch(() => null)]);
  } catch (e) { return; }
  const seg = $("#mo-q-mode");
  if (seg) {
    seg.innerHTML = [["mixte", "Chacune comparée à sa tendance des 10 années précédentes"], ["tendance", "Grille de Gave : comparées à l'année précédente"]].map(([k, l]) => `<button type="button" data-m="${k}" aria-pressed="${k === mode}">${l}</button>`).join("");
    seg.onclick = ev => { const b = ev.target.closest("button"); if (!b) return; mode = b.dataset.m; seg.querySelectorAll("button").forEach(x => x.setAttribute("aria-pressed", x === b)); quadrants(); };
  }
  let rt; addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(draw, 150); });
  draw();
}
function draw() { if (!C) return; ["mo", "pib"].forEach(p => { if ($(`#${p}-contrib`)) { contrib(p); moteurs(p); pays(p); } }); if ($("#mo-q-strip")) quadrants(); if ($("#mo-actu")) actualite(); if ($("#mo-k-saisons")) ksaisons(); if ($("#mo-k-taux") && C.kondratiev) { kondra("#mo-k-taux", "t", v => f1(v) + " %"); kondra("#mo-k-infl", "i", v => f1(v) + " %"); } }

/* ---------- 7.1 contributions empilées ---------- */
function contrib(p) {
  const el = $(`#${p}-contrib`), data = C.contributions.filter(d => d.annee >= 1996);
  const w = Math.max(320, el.clientWidth), h = 320, m = { t: 12, r: 10, b: 26, l: 40 };
  const x = d3.scaleBand(data.map(d => d.annee), [m.l, w - m.r]).padding(.18);
  const pos = d => MOT.reduce((s, k) => s + Math.max(0, d[k.k] || 0), 0), neg = d => MOT.reduce((s, k) => s + Math.min(0, d[k.k] || 0), 0);
  const y = d3.scaleLinear([Math.min(-2, d3.min(data, neg)), Math.max(4, d3.max(data, pos))], [h - m.b, m.t]).nice();
  const svg = d3.create("svg").attr("viewBox", `0 0 ${w} ${h}`);
  svg.append("g").attr("class", "grid").selectAll("line").data(y.ticks(6)).join("line").attr("x1", m.l).attr("x2", w - m.r).attr("y1", y).attr("y2", y);
  data.forEach(d => {
    let p = 0, n = 0;
    MOT.forEach(k => {
      const v = d[k.k] || 0; if (!v) return;
      const y0 = v > 0 ? p : n, y1 = y0 + v; if (v > 0) p = y1; else n = y1;
      svg.append("rect").attr("x", x(d.annee)).attr("width", x.bandwidth()).attr("y", y(Math.max(y0, y1))).attr("height", Math.abs(y(y0) - y(y1))).attr("fill", k.c);
    });
  });
  svg.append("line").attr("x1", m.l).attr("x2", w - m.r).attr("y1", y(0)).attr("y2", y(0)).attr("stroke", "var(--ink)").attr("stroke-width", .8);
  svg.append("g").selectAll("circle").data(data).join("circle").attr("cx", d => x(d.annee) + x.bandwidth() / 2).attr("cy", d => y(d.pib)).attr("r", 3.6).attr("fill", "var(--surface)").attr("stroke", "var(--ink)").attr("stroke-width", 1.6);
  const step = w < 600 ? 5 : 2;
  svg.append("g").attr("class", "axis").attr("transform", `translate(0,${h - m.b})`).call(d3.axisBottom(x).tickValues(data.map(d => d.annee).filter(a => a % step === 0)).tickSizeOuter(0));
  svg.append("g").attr("class", "axis").attr("transform", `translate(${m.l},0)`).call(d3.axisLeft(y).ticks(6).tickFormat(v => (v > 0 ? "+" : "") + v)).call(g => g.select(".domain").remove());
  svg.append("rect").attr("x", m.l).attr("y", m.t).attr("width", w - m.l - m.r).attr("height", h - m.t - m.b).attr("fill", "transparent")
    .on("pointermove", ev => { const i = Math.floor((d3.pointer(ev)[0] - m.l) / x.step()), d = data[Math.max(0, Math.min(data.length - 1, i))];
      window.TH.showTip?.(`<b>${d.annee}</b> : PIB ${sg(d.pib)} %` + MOT.map(k => `<br><span style="color:${k.c}">■</span> ${k.l} : ${sg(d[k.k])} pt`).join(""), ev); })
    .on("pointerleave", () => window.TH.hideTip?.());
  el.replaceChildren(svg.node());
  window.TH.legend(`#${p}-contrib-legend`, [...MOT.map(k => [k.l, k.c]), ["Croissance du PIB (point)", "var(--ink)", true]]);
}

function moy(rows, k, a, b) { const r = rows.filter(d => d.annee >= a && d.annee <= b && d[k] != null); return r.length ? r.reduce((s, d) => s + d[k], 0) / r.length : null; }
function moteurs(p) {
  const V = C.volumes, K = C.contributions, der = V.at(-1).annee;
  const L = [["pib", "PIB"], ["conso", "Consommation des ménages"], ["public", "Dépense publique (services)"], ["invest", "Investissement"], ["export", "Exportations"], ["import", "Importations"]];
  $(`#${p}-moteurs`).innerHTML = `<div class="table-scroll"><table class="cmp-t"><thead><tr><th>Volume, croissance moyenne par an</th><th>2015-2019</th><th>${der - 2}-${der}</th><th>${der}</th></tr></thead><tbody>
    ${L.map(([k, l]) => { const a = moy(V, k, 2015, 2019), b = moy(V, k, der - 2, der), c = V.at(-1)[k]; return `<tr><td>${l}</td><td class="num">${sg(a)} %</td><td class="num" style="${b < a - .5 ? "color:#dc2626;font-weight:600" : ""}">${sg(b)} %</td><td class="num">${sg(c)} %</td></tr>`; }).join("")}
    </tbody></table></div>`;
  const ca = moy(V, "conso", 2015, 2019), cb = moy(V, "conso", der - 2, der), pa = moy(V, "public", 2015, 2019), pb = moy(V, "public", der - 2, der), ia = moy(V, "invest", 2015, 2019), ib = moy(V, "invest", der - 2, der);
  const ep = C.epargne.FR, e19 = ep.find(d => d.annee === 2019)?.v, eN = ep.at(-1);
  const k3 = K.filter(d => d.annee >= der - 2), sc = k => k3.reduce((s, d) => s + (d[k] || 0), 0);
  $(`#${p}-moteurs-txt`).innerHTML = `<p style="margin-top:0"><b>En France aujourd'hui, ce n'est pas la consommation qui tient.</b> Sur ${der - 2}-${der}, la consommation des ménages ne progresse que de ${sg(cb)} % par an, contre ${sg(ca)} % avant le Covid. Les revenus ont pourtant suivi : les ménages épargnent davantage. Leur taux d'épargne est passé de ${f1(e19)} % du revenu en 2019 à ${f1(eN.v)} % en ${eN.annee}, un niveau jamais vu hors Covid (inquiétude sur l'avenir, déficits, retraites, prix de l'énergie, épargne des ménages aisés). C'est le moteur qui a le plus calé par rapport à son rythme habituel.</p>
    <ul>
      <li><b>La dépense publique tient</b> : ${sg(pb)} % par an (${sg(pa)} % avant 2020). C'est elle qui soutient le plus la croissance, mais elle est financée à crédit (déficit d'environ 5 % du PIB).</li>
      <li><b>L'investissement recule ou stagne</b> : ${sg(ib)} % par an, contre ${sg(ia)} % avant 2020. La hausse des taux de 2022-2023 a cassé la construction de logements, et les entreprises attendent avant d'investir (incertitude politique et fiscale).</li>
      <li><b>Le commerce extérieur</b> a ajouté ${sg(sc("commerce"))} points de croissance au total sur ces trois ans. Mais c'est surtout parce que les importations ont reculé avec la demande intérieure : les exportations progressent moins vite qu'avant 2020, aéronautique mise à part.</li>
    </ul>
    <p style="margin-bottom:0"><b>Le bilan est donc l'inverse de l'idée reçue</b> : la consommation est le moteur qui a le plus calé, la dépense publique tient, l'investissement stagne et le commerce extérieur a aidé, faute d'importations. La croissance de ${V.at(-1).annee} (${sg(V.at(-1).pib)} %) repose sur peu de chose.</p>`;
}

function pays(p) {
  const { lineChart, legend } = window.TH;
  const rows = k => { const m = {}; PAYS.forEach(p => (C[k][p.k] || []).forEach(d => { (m[d.annee] ||= { annee: d.annee })[p.k] = d.v; })); return Object.values(m).sort((a, b) => a.annee - b.annee); };
  lineChart($(`#${p}-fbcf`), rows("fbcf"), PAYS, { nozero: true, h: 220, vfmt: v => f1(v) + " %", yfmt: v => v + " %", xticks: 5 });
  lineChart($(`#${p}-epargne`), rows("epargne"), PAYS, { nozero: true, h: 220, vfmt: v => f1(v) + " %", yfmt: v => v + " %", xticks: 5 });
  lineChart($(`#${p}-rd`), rows("rd"), PAYS, { nozero: true, h: 220, vfmt: v => f1(v) + " %", yfmt: v => v + " %", xticks: 5 });
  legend(`#${p}-pays-legend`, PAYS.map(p => [p.l, p.c, !!p.dash]));
}

/* ---------- 7.3 les quatre climats ---------- */
function classer() {
  const L = H.longue.filter(d => d.annee >= 1940 && d.croissance != null && d.inflation != null), by = {};
  L.forEach(d => by[d.annee] = d);
  const out = [];
  L.filter(d => d.annee >= 1950).forEach(d => {
    const prev = by[d.annee - 1]; if (!prev) return;
    let c, i;
    if (mode === "tendance") {
      const g10 = []; for (let k = 1; k <= 10; k++) if (by[d.annee - k]) g10.push(by[d.annee - k].croissance);
      const tr = d3.median(g10); c = d.croissance >= tr ? "C" : "R"; i = d.inflation >= prev.inflation ? "I" : "D";
      out.push({ ...d, q: c + i, tr, pi0: prev.inflation });
    } else {
      const g10 = []; for (let k = 1; k <= 10; k++) if (by[d.annee - k]) g10.push(by[d.annee - k].croissance);
      const p10 = []; for (let k = 1; k <= 10; k++) if (by[d.annee - k]) p10.push(by[d.annee - k].inflation);
      const tr = d3.median(g10), tp = d3.median(p10); c = d.croissance >= tr ? "C" : "R"; i = d.inflation >= tp ? "I" : "D";
      out.push({ ...d, q: c + i, tr, tp });
    }
  });
  return out;
}
function quadrants() {
  const Y = classer(), el = $("#mo-q-strip");
  // années en abscisse ; croissance, tendance et inflation en ordonnée ; fond coloré selon le climat de chaque année
  const W = Math.max(320, el.clientWidth), H = 380, m = { t: 14, r: 14, b: 28, l: 44 };
  const a0 = Y[0].annee, a1 = Y.at(-1).annee;
  const x = d3.scaleLinear([a0 - .5, a1 + .5], [m.l, W - m.r]), y = d3.scaleLinear([-8, 15], [H - m.b, m.t]).clamp(true);
  const svg = d3.create("svg").attr("viewBox", `0 0 ${W} ${H}`);
  svg.append("g").selectAll("rect").data(Y).join("rect").attr("x", d => x(d.annee - .5)).attr("width", Math.max(1, x(1) - x(0))).attr("y", m.t).attr("height", H - m.t - m.b)
    .attr("fill", d => Q[d.q].c).attr("opacity", .16);
  svg.append("g").attr("class", "grid").selectAll("line").data(y.ticks(8)).join("line").attr("x1", m.l).attr("x2", W - m.r).attr("y1", y).attr("y2", y);
  svg.append("line").attr("x1", m.l).attr("x2", W - m.r).attr("y1", y(0)).attr("y2", y(0)).attr("stroke", "var(--ink)").attr("stroke-width", .8);
  const L = (k, c, wd, dash) => svg.append("path").attr("fill", "none").attr("stroke", c).attr("stroke-width", wd).attr("stroke-dasharray", dash || null)
    .attr("d", d3.line().defined(d => d[k] != null).x(d => x(d.annee)).y(d => y(d[k]))(Y));
  L("tr", "#6b7280", 1.4, "5 3");
  if (mode === "mixte") L("tp", "#f87171", 1.4, "5 3");
  L("croissance", "var(--ink)", 2.2);
  L("inflation", "#dc2626", 2.2);
  svg.append("g").attr("class", "axis").attr("transform", `translate(0,${H - m.b})`).call(d3.axisBottom(x).ticks(W < 600 ? 6 : 15).tickFormat(d3.format("d")));
  svg.append("g").attr("class", "axis").attr("transform", `translate(${m.l},0)`).call(d3.axisLeft(y).ticks(8).tickFormat(v => v + " %")).call(g => g.select(".domain").remove());
  const bis = d3.bisector(d => d.annee).center;
  svg.append("rect").attr("x", m.l).attr("y", m.t).attr("width", W - m.l - m.r).attr("height", H - m.t - m.b).attr("fill", "transparent")
    .on("pointermove", ev => { const d = Y[bis(Y, x.invert(d3.pointer(ev)[0]))]; if (!d) return;
      window.TH.showTip(`<b>${d.annee}</b> : <span style="color:${Q[d.q].c}">■</span> ${Q[d.q].l}<br><i>${Q[d.q].d}</i><br>Croissance ${sg(d.croissance)} % (tendance ${f1(d.tr)} %)<br>Inflation ${f1(d.inflation)} %${d.pi0 != null ? ` (l'année d'avant ${f1(d.pi0)} %)` : ` (tendance ${f1(d.tp)} %)`}`, ev); })
    .on("pointerleave", () => window.TH.hideTip());
  el.replaceChildren(svg.node());
  window.TH.legend("#mo-q-legend", [["Croissance réelle du PIB", "var(--ink)", true], ["Tendance de la croissance (médiane des 10 années précédentes)", "#6b7280", true], ["Inflation", "#dc2626", true],
    ...(mode === "mixte" ? [["Tendance de l'inflation (médiane des 10 années précédentes)", "#f87171", true]] : []), ...Object.values(Q).map(q => [q.l + " : " + q.d, q.c])]);
  // décompte par période
  const per = [[1950, 1973, "Trente Glorieuses"], [1974, 1985, "Chocs pétroliers"], [1986, 2007, "Grande modération"], [2008, 2019, "Crises et taux zéro"], [2020, 2100, "Depuis 2020"]];
  $("#mo-q-compte").innerHTML = `<div class="table-scroll"><table class="cmp-t"><thead><tr><th>Période</th>${Object.values(Q).map(q => `<th style="color:${q.c}">${q.l}</th>`).join("")}</tr></thead><tbody>${per.map(([a, b, l]) => {
    const r = Y.filter(d => d.annee >= a && d.annee <= b); if (!r.length) return "";
    return `<tr><td>${l} (${a}-${Math.min(b, Y.at(-1).annee)})</td>${Object.keys(Q).map(k => `<td class="num">${r.filter(d => d.q === k).length} an${r.filter(d => d.q === k).length > 1 ? "s" : ""}</td>`).join("")}</tr>`; }).join("")}</tbody></table></div>`;
}

/* ---------- 7.4 Kondratiev : taux longs et inflation depuis 1870, phases longues ---------- */
const KPH = [[1873, 1896, "B"], [1896, 1920, "A"], [1920, 1946, "B"], [1946, 1981, "A"], [1981, 2020, "B"], [2020, 2026, "?"]];
const KP = [{ k: "fr", l: "France", c: "#2563eb" }, { k: "uk", l: "Royaume-Uni", c: "#dc2626" }, { k: "us", l: "États-Unis", c: "#111827" }];
function kondra(sel, pre, fmt) {
  const el = $(sel), data = C.kondratiev, w = Math.max(320, el.clientWidth), h = 280, m = { t: 22, r: 12, b: 26, l: 44 };
  const x = d3.scaleLinear([1870, data.at(-1).annee], [m.l, w - m.r]);
  const vals = data.flatMap(d => KP.map(p => d[pre + "_" + p.k])).filter(v => v != null);
  const y = d3.scaleLinear([Math.min(-2, d3.min(vals)), Math.min(20, d3.max(vals))], [h - m.b, m.t]).nice().clamp(true);
  const svg = d3.create("svg").attr("viewBox", `0 0 ${w} ${h}`);
  KPH.forEach(([a, b, t]) => {
    svg.append("rect").attr("x", x(a)).attr("width", Math.max(0, x(Math.min(b, data.at(-1).annee)) - x(a))).attr("y", m.t).attr("height", h - m.t - m.b)
      .attr("fill", t === "A" ? "#16a34a" : t === "B" ? "#2563eb" : "#9ca3af").attr("opacity", .08);
    svg.append("text").attr("x", (x(a) + x(Math.min(b, data.at(-1).annee))) / 2).attr("y", 14).attr("text-anchor", "middle").attr("font-size", 10.5).attr("fill", "var(--muted)")
      .text(t === "A" ? "hausse" : t === "B" ? "baisse" : "?");
  });
  svg.append("g").attr("class", "grid").selectAll("line").data(y.ticks(6)).join("line").attr("x1", m.l).attr("x2", w - m.r).attr("y1", y).attr("y2", y);
  KP.forEach(p => svg.append("path").attr("fill", "none").attr("stroke", p.c).attr("stroke-width", p.k === "fr" ? 2.2 : 1.5).attr("opacity", p.k === "fr" ? 1 : .75)
    .attr("d", d3.line().defined(d => d[pre + "_" + p.k] != null).x(d => x(d.annee)).y(d => y(d[pre + "_" + p.k]))(data)));
  svg.append("g").attr("class", "axis").attr("transform", `translate(0,${h - m.b})`).call(d3.axisBottom(x).ticks(w < 600 ? 6 : 12).tickFormat(d3.format("d")));
  svg.append("g").attr("class", "axis").attr("transform", `translate(${m.l},0)`).call(d3.axisLeft(y).ticks(6).tickFormat(v => v + " %")).call(g => g.select(".domain").remove());
  const bis = d3.bisector(d => d.annee).center;
  svg.append("rect").attr("x", m.l).attr("y", m.t).attr("width", w - m.l - m.r).attr("height", h - m.t - m.b).attr("fill", "transparent")
    .on("pointermove", ev => { const d = data[bis(data, x.invert(d3.pointer(ev)[0]))]; if (!d) return;
      window.TH.showTip(`<b>${d.annee}</b>` + KP.filter(p => d[pre + "_" + p.k] != null).map(p => `<br><span style="color:${p.c}">■</span> ${p.l} : ${fmt(d[pre + "_" + p.k])}`).join(""), ev); })
    .on("pointerleave", () => window.TH.hideTip());
  el.replaceChildren(svg.node());
  window.TH.legend(sel + "-legend", [...KP.map(p => [p.l, p.c]), ["Phase de hausse des prix et des taux", "rgba(22,163,74,.35)"], ["Phase de baisse", "rgba(37,99,235,.35)"]]);
}

/* ---------- 7.4 Les saisons longues, calculées comme la grille de 7.3 sur des moyennes de 10 ans ---------- */
function ksaisons() {
  const L = {}; H.longue.forEach(r => L[r.annee] = r);
  const ma = (k, a, n = 10) => { const v = []; for (let y = a - n + 1; y <= a; y++) if (L[y] && L[y][k] != null) v.push(L[y][k]); return v.length >= n - 2 ? d3.mean(v) : null; };
  const Y = [];
  for (let a = 1915; a <= d3.max(H.longue, r => r.annee); a++) {
    const g = ma("croissance", a), p = ma("inflation", a), p5 = ma("inflation", a - 5);
    const gp = d3.range(a - 20, a).map(y => ma("croissance", y)).filter(v => v != null);
    if (g == null || p == null || p5 == null || !gp.length) continue;
    const gt = d3.median(gp);
    Y.push({ annee: a, g, p, gt, p5, q: (g >= gt ? "C" : "R") + (p >= p5 ? "I" : "D") });
  }
  const el = $("#mo-k-saisons"), W = Math.max(320, el.clientWidth), Hh = 320, m = { t: 22, r: 14, b: 28, l: 44 };
  const x = d3.scaleLinear([Y[0].annee - .5, Y.at(-1).annee + .5], [m.l, W - m.r]), y = d3.scaleLinear([-6, 20], [Hh - m.b, m.t]).clamp(true);
  const svg = d3.create("svg").attr("viewBox", `0 0 ${W} ${Hh}`);
  svg.append("g").selectAll("rect").data(Y).join("rect").attr("x", d => x(d.annee - .5)).attr("width", Math.max(1, x(1) - x(0))).attr("y", m.t).attr("height", Hh - m.t - m.b).attr("fill", d => Q[d.q].c).attr("opacity", .16);
  KPH.filter(([a]) => a >= Y[0].annee - 10).forEach(([a, b, t]) => {
    const xa = x(Math.max(a, Y[0].annee)), xb = x(Math.min(b, Y.at(-1).annee));
    svg.append("line").attr("x1", xa).attr("x2", xa).attr("y1", m.t - 6).attr("y2", Hh - m.b).attr("stroke", "var(--muted)").attr("stroke-dasharray", "2 4").attr("opacity", .6);
    svg.append("text").attr("x", (xa + xb) / 2).attr("y", 13).attr("text-anchor", "middle").attr("font-size", 10.5).attr("fill", "var(--muted)").text(t === "A" ? "phase de hausse" : t === "B" ? "phase de baisse" : "?");
  });
  svg.append("g").attr("class", "grid").selectAll("line").data(y.ticks(7)).join("line").attr("x1", m.l).attr("x2", W - m.r).attr("y1", y).attr("y2", y);
  svg.append("line").attr("x1", m.l).attr("x2", W - m.r).attr("y1", y(0)).attr("y2", y(0)).attr("stroke", "var(--ink)").attr("stroke-width", .8);
  const Ln = (k, c, wd, dash) => svg.append("path").attr("fill", "none").attr("stroke", c).attr("stroke-width", wd).attr("stroke-dasharray", dash || null).attr("d", d3.line().x(d => x(d.annee)).y(d => y(d[k]))(Y));
  Ln("gt", "#6b7280", 1.4, "5 3"); Ln("g", "var(--ink)", 2.2); Ln("p", "#dc2626", 2.2);
  svg.append("g").attr("class", "axis").attr("transform", `translate(0,${Hh - m.b})`).call(d3.axisBottom(x).ticks(W < 600 ? 6 : 12).tickFormat(d3.format("d")));
  svg.append("g").attr("class", "axis").attr("transform", `translate(${m.l},0)`).call(d3.axisLeft(y).ticks(7).tickFormat(v => v + " %")).call(g => g.select(".domain").remove());
  const bis = d3.bisector(d => d.annee).center;
  svg.append("rect").attr("x", m.l).attr("y", m.t).attr("width", W - m.l - m.r).attr("height", Hh - m.t - m.b).attr("fill", "transparent")
    .on("pointermove", ev => { const d = Y[bis(Y, x.invert(d3.pointer(ev)[0]))]; if (!d) return;
      window.TH.showTip(`<b>${d.annee}</b> : <span style="color:${Q[d.q].c}">■</span> ${Q[d.q].l}<br><i>${Q[d.q].d}</i><br>Croissance moyenne sur 10 ans : ${sg(d.g)} % (tendance ${f1(d.gt)} %)<br>Inflation moyenne sur 10 ans : ${f1(d.p)} % (${f1(d.p5)} % cinq ans plus tôt)`, ev); })
    .on("pointerleave", () => window.TH.hideTip());
  el.replaceChildren(svg.node());
  window.TH.legend("#mo-k-saisons-legend", [["Croissance réelle, moyenne sur 10 ans", "var(--ink)", true], ["Sa tendance (médiane des 20 années précédentes)", "#6b7280", true], ["Inflation, moyenne sur 10 ans", "#dc2626", true], ...Object.values(Q).map(q => [q.l + " : " + q.d, q.c])]);
}

/* ---------- 7 : où en est la France aujourd'hui ? ---------- */
function actualite() {
  const A = C.actualite; if (!A || !A.trimestres.length || !A.inflation.length) return;
  const T = A.trimestres.at(-1), I = A.inflation.at(-1), I12 = A.inflation.find(r => r.m === `${+I.m.slice(0, 4) - 1}${I.m.slice(4)}`);
  const an = +T.t.slice(0, 4), L = H.longue;
  const g10 = L.filter(r => r.annee >= an - 10 && r.annee < an && r.croissance != null).map(r => r.croissance);
  const p10 = L.filter(r => r.annee >= an - 10 && r.annee < an && r.inflation != null).map(r => r.inflation);
  const tg = d3.median(g10), tp = d3.median(p10);
  const q = (T.ga >= tg ? "C" : "R") + (I.v >= tp ? "I" : "D");
  const qg = I12 ? (T.ga >= tg ? "C" : "R") + (I.v >= I12.v ? "I" : "D") : null;
  const tri = t => `${t.slice(5).replace("Q", "")}<sup>e</sup> trimestre ${t.slice(0, 4)}`.replace(">1<sup>e</sup>", ">1<sup>er</sup>").replace("1<sup>e</sup>", "1<sup>er</sup>");
  const mois = m => new Date(m + "-15").toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
  const dep = MO?.taux_bce?.depot?.at(-1), m3 = MO?.agregats?.at(-1);
  window.TH.kpis("#mo-actu-kpis", [
    [sg(T.qq) + " %", `au ${tri(T.t)}, par rapport au trimestre précédent (sur un an : ${sg(T.ga)} %)`, "Croissance du PIB"],
    [f1(I.v) + " %", `sur un an, en ${mois(I.m)}${I12 ? ` (${f1(I12.v)} % un an plus tôt)` : ""}`, "Inflation"],
    dep ? [f1(dep[1]) + " %", `depuis le ${new Date(dep[0]).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}`, "Taux de dépôt de la BCE"] : null,
    m3 ? [sg(m3.m3_croiss) + " %", `zone euro, sur l'année ${m3.annee}`, "Masse monétaire M3"] : null
  ].filter(Boolean));
  $("#mo-actu-txt").innerHTML = `<p style="margin:0"><b>Au sens de la grille (7.3)</b> : sur un an, la croissance (${sg(T.ga)} %) est ${T.ga >= tg ? "au-dessus" : "au-dessous"} de sa tendance des dix dernières années (${f1(tg)} %), et l'inflation (${f1(I.v)} %) ${I.v >= tp ? "au-dessus" : "au-dessous"} de la sienne (${f1(tp)} %) : la France est en <b style="color:${Q[q].c}">${Q[q].l.toLowerCase()}</b> (${Q[q].d})${qg && qg !== q ? `. Selon la grille d'origine de Gave, qui compare à l'année précédente, ce serait une ${Q[qg].l.toLowerCase()}` : qg ? `, et la grille d'origine de Gave, qui compare à l'année précédente, dit la même chose` : ""}. ${q === "RI" ? "C'est la configuration la plus inconfortable pour une banque centrale : monter les taux aggraverait le ralentissement, les baisser risquerait d'entretenir l'inflation (voir la carte « récession inflationniste »)." : q === "RD" ? "C'est la configuration où les banques centrales baissent leurs taux et où les obligations protègent le mieux." : ""}</p><p class="muted" style="margin:6px 0 0;font-size:.8rem">Mis à jour chaque mois : Eurostat (comptes trimestriels, indice des prix harmonisé), BCE, INSEE. Une lecture d'un seul trimestre est fragile : les chiffres sont souvent révisés.</p>`;
}

init();
})();
