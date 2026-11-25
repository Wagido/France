/* Article « La France en 2050 » (data/france2050.json, data/departements.geo.json, data/climat_obs.json) */
(() => {
"use strict";
let F = null, G = null, K = null;
const $ = s => document.querySelector(s);
const f1 = v => v == null ? "–" : v.toLocaleString("fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const f0 = v => v == null ? "–" : Math.round(v).toLocaleString("fr-FR");
const sg = v => (v > 0 ? "+" : v < 0 ? "−" : "") + f1(Math.abs(v));

async function init() {
  if (!window.TH || !window.d3) { setTimeout(init, 100); return; }
  if (!$("#f50-pop")) return;
  try {
    [F, G, K] = await Promise.all(["data/france2050.json", "data/departements.geo.json", "data/climat_obs.json"].map(u => fetch(u, { cache: "no-cache" }).then(r => r.json())));
  } catch (e) { return; }
  let rt; addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(draw, 150); });
  draw();
}
function draw() { if (!F || !$("#f50-pop")) return; kpis(); pop(); naissances(); ages(); carte(); climat(); energie(); }

const P = a => F.projections.find(p => p.annee === a);
function kpis() {
  const p25 = P(2025), p50 = P(2050), d = F.demographie.at(-1), e = F.energie.at(-1);
  const obs = K.france.filter(r => r[0] >= 2015).map(r => r[1]), t = d3.mean(obs);
  window.TH.kpis("#f50-kpis", [
    [f1(p50.BSL) + " M", `habitants en 2050 (scénario central), ${f1(p25.BSL)} M en 2025`],
    [f1(p50.p65) + " %", `de 65 ans ou plus en 2050, ${f1(p25.p65)} % en 2025`],
    ["+2,7 °C", `en France en 2050 selon la trajectoire de l'État ; déjà +${f1(t)} °C en moyenne sur les dix dernières années`],
    [f1(e.fossile_pc) + " %", `de l'énergie consommée en ${e.annee} est fossile ; objectif proche de 0 en 2050`]
  ]);
}

function pop() {
  const { lineChart, legend } = window.TH;
  const m = {};
  F.demographie.forEach(d => { if (d.pop != null && d.annee >= 1960) (m[d.annee] ||= { annee: d.annee }).obs = d.pop; });
  F.projections.forEach(p => { const r = (m[p.annee] ||= { annee: p.annee }); ["BSL", "HMIGR", "LMIGR", "NMIGR", "LFRT"].forEach(k => r[k] = p[k]); });
  const rows = Object.values(m).sort((a, b) => a.annee - b.annee);
  const S = [{ k: "obs", l: "Observé", c: "var(--ink)" }, { k: "BSL", l: "Scénario central", c: "#2563eb" }, { k: "HMIGR", l: "Immigration plus forte (+1/3)", c: "#16a34a", dash: "4 3" },
    { k: "LMIGR", l: "Immigration plus faible (−1/3)", c: "#f59e0b", dash: "4 3" }, { k: "NMIGR", l: "Sans immigration", c: "#dc2626", dash: "2 3" }, { k: "LFRT", l: "Fécondité plus faible", c: "#7c3aed", dash: "6 3" }];
  lineChart($("#f50-pop"), rows, S, { nozero: true, h: 300, vfmt: v => f1(v) + " M", yfmt: v => v + " M", xticks: 8 });
  legend("#f50-pop-legend", S.map(s => [s.l, s.c, !!s.dash]));
}
function naissances() {
  const { lineChart, legend } = window.TH;
  const rows = F.demographie.filter(d => d.annee >= 1999 && d.naissances && d.deces > 0).map(d => ({ annee: d.annee, n: d.naissances / 1000, d: d.deces / 1000, m: d.migration ? d.migration / 1000 : null }));
  const S = [{ k: "n", l: "Naissances", c: "#16a34a" }, { k: "d", l: "Décès", c: "#111827" }, { k: "m", l: "Solde migratoire (entrées − sorties)", c: "#f59e0b" }];
  lineChart($("#f50-nd"), rows, S, { h: 260, vfmt: v => f0(v) + " 000", yfmt: v => v + " k" });
  legend("#f50-nd-legend", S.map(s => [s.l, s.c]));
  const last = F.demographie.at(-1), n10 = F.demographie.find(d => d.annee === 2010);
  $("#f50-nd-txt").innerHTML = `En ${last.annee}, la France a enregistré <b>${f0(last.naissances / 1000)} 000 naissances pour ${f0(last.deces / 1000)} 000 décès</b> : ${last.naissances < last.deces ? "pour la première fois depuis la Seconde Guerre mondiale, il y a eu plus de décès que de naissances. La population ne croît plus que par l'immigration" : "l'écart entre naissances et décès n'a jamais été aussi faible depuis la guerre"}. Les naissances ont baissé de ${f0(100 * (1 - last.naissances / n10.naissances))} % depuis 2010 (${f0(n10.naissances / 1000)} 000).`;
}
function ages() {
  const { lineChart, legend } = window.TH;
  const m = {};
  F.age.forEach(d => (m[d.annee] ||= { annee: d.annee }).h65 = d.p65);
  F.projections.forEach(p => { const r = (m[p.annee] ||= { annee: p.annee }); r.p65 = p.p65; r.p80 = p.p80; r.dep = p.dep65; });
  const rows = Object.values(m).sort((a, b) => a.annee - b.annee);
  const S = [{ k: "h65", l: "65 ans ou plus, observé (% de la population)", c: "var(--ink)" }, { k: "p65", l: "65 ans ou plus, projeté", c: "#dc2626" }, { k: "p80", l: "80 ans ou plus, projeté", c: "#f97316" },
    { k: "dep", l: "65 ans ou plus pour 100 personnes de 20 à 64 ans", c: "#2563eb", dash: "5 3" }];
  lineChart($("#f50-age"), rows, S, { h: 280, vfmt: v => f1(v), yfmt: v => v, xticks: 8 });
  legend("#f50-age-legend", S.map(s => [s.l, s.c, !!s.dash]));
}

function carte() {
  const el = $("#f50-map"), D = F.departements, w = Math.min(640, Math.max(300, el.clientWidth)), h = w * 0.95;
  const proj = d3.geoConicConformal().parallels([44, 49]).rotate([-3, 0]).fitSize([w, h], G);
  const path = d3.geoPath(proj);
  const col = d3.scaleDiverging([-6, 0, 10], t => d3.interpolateRdBu(1 - t)).clamp(true);
  const svg = d3.create("svg").attr("viewBox", `0 0 ${w} ${h}`).style("max-width", w + "px");
  svg.append("g").selectAll("path").data(G.features).join("path").attr("d", path).attr("stroke", "var(--surface)").attr("stroke-width", .6)
    .attr("fill", f => D[f.properties.code] ? col(D[f.properties.code].taux) : "#ddd")
    .on("pointermove", (ev, f) => { const d = D[f.properties.code]; if (!d) return;
      window.TH.showTip(`<b>${d.nom}</b><br>Solde migratoire : ${sg(d.taux)} pour 1 000 habitants par an (2016-2022)<br>soit environ ${sg(d.solde / 1000)} 000 habitants sur 7 ans`, ev); })
    .on("pointerleave", () => window.TH.hideTip());
  el.replaceChildren(svg.node());
  const lg = $("#f50-map-legend");
  lg.innerHTML = `<span style="display:inline-flex;align-items:center;gap:6px;font-size:.8rem">perd des habitants <span style="display:inline-block;width:180px;height:10px;border-radius:3px;background:linear-gradient(90deg,${[-6, -3, 0, 3, 6, 10].map(col).join(",")})"></span> en gagne <span class="muted">(−6 à +10 pour 1 000 habitants et par an)</span></span>`;
  const tri = Object.entries(D).sort((a, b) => b[1].taux - a[1].taux);
  $("#f50-map-txt").innerHTML = `<b>Ceux qui gagnent le plus</b> : ${tri.slice(0, 6).map(([, d]) => `${d.nom} (${sg(d.taux)} ‰)`).join(", ")}. <b>Ceux qui perdent le plus</b> : ${tri.slice(-6).reverse().map(([, d]) => `${d.nom} (${sg(d.taux)} ‰)`).join(", ")}.`;
}

function climat() {
  const { lineChart, legend } = window.TH;
  const obs = K.france.filter(r => r[0] >= 1900);
  const rows = obs.map(([a, v], i) => { const s = obs.slice(Math.max(0, i - 4), i + 6).map(r => r[1]); return { annee: a, v, m: i >= 4 && i <= obs.length - 6 ? d3.mean(s) : null }; });
  const last = rows.filter(r => r.m != null).at(-1);
  const pts = [[last.annee, last.m], [2030, 2.0], [2050, 2.7], [2100, 4.0]];
  for (let a = obs.at(-1)[0] + 1; a <= 2100; a++) rows.push({ annee: a });
  rows.forEach(r => { for (let i = 0; i < pts.length - 1; i++) { const [a0, v0] = pts[i], [a1, v1] = pts[i + 1]; if (r.annee >= a0 && r.annee <= a1) r.t = v0 + (v1 - v0) * (r.annee - a0) / (a1 - a0); } });
  const S = [{ k: "v", l: "France, chaque année (écart à 1850-1900)", c: "#fca5a5" }, { k: "m", l: "Moyenne sur 10 ans", c: "#dc2626" }, { k: "t", l: "Trajectoire de référence de l'État (TRACC) : +2 °C en 2030, +2,7 °C en 2050, +4 °C en 2100", c: "#7f1d1d", dash: "5 4" }];
  lineChart($("#f50-temp"), rows, S, { h: 300, vfmt: v => sg(v) + " °C", yfmt: v => (v > 0 ? "+" : "") + v + " °C", xticks: 10 });
  legend("#f50-temp-legend", S.map(s => [s.l, s.c, !!s.dash]));
}

function energie() {
  const { lineChart, legend } = window.TH;
  const E = F.energie, c = F.energie_cible_2050;
  const rows = E.map(r => ({ annee: r.annee, tot: r.total_mtep, fos: +(r.petrole + r.gaz + r.charbon).toFixed(1), el: r.electricite, ren: r.renouvelables }));
  for (let a = E.at(-1).annee + 1; a <= 2050; a++) rows.push({ annee: a });
  const a0 = E.at(-1).annee, v0 = E.at(-1).total_mtep;
  rows.forEach(r => { if (r.annee >= a0) r.cible = v0 + (c - v0) * (r.annee - a0) / (2050 - a0); if (r.annee >= a0) r.cfos = E.at(-1).petrole + E.at(-1).gaz + E.at(-1).charbon - (E.at(-1).petrole + E.at(-1).gaz + E.at(-1).charbon) * (r.annee - a0) / (2050 - a0); });
  const S = [{ k: "tot", l: "Consommation finale d'énergie (Mtep)", c: "var(--ink)" }, { k: "fos", l: "dont pétrole, gaz et charbon", c: "#78350f" }, { k: "el", l: "dont électricité", c: "#2563eb" }, { k: "ren", l: "dont renouvelables utilisés directement (bois, biocarburants, chaleur solaire…)", c: "#16a34a" },
    { k: "cible", l: `Objectif de la loi : −50 % par rapport à 2012, soit ${f1(c)} Mtep en 2050`, c: "var(--ink)", dash: "5 4" }, { k: "cfos", l: "Sortie des énergies fossiles (neutralité carbone)", c: "#78350f", dash: "5 4" }];
  lineChart($("#f50-ener"), rows, S, { h: 300, vfmt: v => f1(v) + " Mtep", yfmt: v => v, xticks: 8 });
  legend("#f50-ener-legend", S.map(s => [s.l, s.c, !!s.dash]));
}

init();
})();
