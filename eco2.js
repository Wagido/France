/* Qui fait quoi (population par statut), la vie en euros (cycle de vie), industrie et innovation */
(() => {
"use strict";
const $ = s => document.querySelector(s);
const T = () => window.TH;
let IDX = null, geo = "FR";
const CACHE = {};
const D = () => CACHE[geo];
const empty = (sel, msg = "Données non publiées pour ce pays.") => { const e = $(sel); if (e) e.innerHTML = `<p class="empty">${msg}</p>`; };

const CAT = [
  ["salaries_prives", "Salariés du privé", "#3b6fd6"], ["agents_publics", "Agents publics (fonctionnaires et contractuels)", "#8b5cf6"],
  ["salaries", "Salariés", "#3b6fd6"], ["independants", "Indépendants (artisans, commerçants, agriculteurs, professions libérales)", "#0ea5e9"],
  ["seniors_actifs", "65 ans et plus en emploi", "#22c55e"], ["chomeurs", "Chômeurs", "#dc2626"],
  ["inactif_jeunes", "15-24 ans inactifs (surtout étudiants)", "#f59e0b"], ["inactif_25_54", "25-54 ans inactifs (famille, santé…)", "#d6a35b"],
  ["inactif_55_64", "55-64 ans inactifs (surtout retraités)", "#cbd5e1"], ["seniors_retraites", "65 ans et plus hors emploi (retraités)", "#9ca3af"],
  ["enfants", "Enfants de moins de 15 ans", "#84cc16"], ["hors_menages", "Personnes en collectivité, écarts de sources", "#d4d4d4"],
];

async function init() {
  if (!window.TH) { setTimeout(init, 100); return; }
  try { IDX = await fetch("data/eco2/index.json").then(r => r.json()); } catch (e) { return; }
  document.addEventListener("geochange", e => setGeo(e.detail));
  let rt; addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(drawAll, 200); });
  await setGeo($("#geo")?.value || "FR");
}
async function setGeo(g) {
  geo = g;
  if (!(g in CACHE)) { try { CACHE[g] = await fetch(`data/eco2/${g}.json`).then(r => r.json()); } catch (e) { CACHE[g] = null; } }
  drawAll();
}
function drawAll() { [qui, cycle, industrie].forEach(f => { try { f(); } catch (e) { console.error(f.name, e); } }); }

/* ---------------------------------------------------------------- qui fait quoi */
function qui() {
  const { kpis, n1, pct, esc, showTip, hideTip, legend } = T();
  const P = D()?.population; if (!P) { kpis("#qf-kpis", []); empty("#qf-tree"); return; }
  const q = [...P].reverse().find(x => x.agents_publics != null) || P.at(-1);
  const split = q.agents_publics != null;
  const cats = CAT.filter(([k]) => split ? k !== "salaries" : !["salaries_prives", "agents_publics"].includes(k)).filter(([k]) => (q[k] || 0) > 0);
  const M = v => n1(v / 1e6) + " M";
  const actifs = (q.salaries || 0) + (q.independants || 0) + (q.seniors_actifs || 0);
  kpis("#qf-kpis", [
    [M(q.total), `d'habitants en ${q.annee}`],
    split && [M(q.salaries_prives), "salariés du privé"],
    split && [M(q.agents_publics), `agents publics (État ${n1(q.fp_detail.FPE / 1000)} M, territoriale ${n1(q.fp_detail.FPT / 1000)} M, hospitalière ${n1(q.fp_detail.FPH / 1000)} M)`],
    !split && [M(q.salaries), "salariés"],
    [M(q.independants), "indépendants"],
    [M(actifs), `personnes en emploi, soit ${pct(100 * actifs / q.total, 0)} de la population, pour ${M(q.total - actifs)} qui ne travaillent pas`],
  ]);
  // treemap
  const el = $("#qf-tree"), w = Math.max(320, el.clientWidth), h = w < 600 ? 520 : 420;
  const root = d3.hierarchy({ children: cats.map(([k, l, c]) => ({ k, l, c, v: q[k] })) }).sum(d => d.v || 0).sort((a, b) => b.value - a.value);
  d3.treemap().size([w, h]).paddingInner(2)(root);
  const svg = d3.create("svg").attr("viewBox", `0 0 ${w} ${h}`);
  const g = svg.selectAll("g").data(root.leaves()).join("g").attr("transform", d => `translate(${d.x0},${d.y0})`);
  g.append("rect").attr("width", d => d.x1 - d.x0).attr("height", d => d.y1 - d.y0).attr("fill", d => d.data.c).attr("rx", 3)
    .on("pointermove", (ev, d) => showTip(`<b>${esc(d.data.l)}</b><br>${M(d.data.v)} · ${pct(100 * d.data.v / q.total)} de la population`, ev)).on("pointerleave", hideTip);
  g.append("text").attr("x", 6).attr("y", 18).attr("fill", "#fff").attr("font-size", 13).attr("font-weight", 700).attr("pointer-events", "none")
    .text(d => (d.x1 - d.x0) > 70 && (d.y1 - d.y0) > 24 ? M(d.data.v) : "");
  g.append("text").attr("x", 6).attr("y", 34).attr("fill", "#fff").attr("font-size", 11).attr("pointer-events", "none")
    .text(d => { const wd = d.x1 - d.x0; if (wd < 90 || (d.y1 - d.y0) < 44) return ""; const t = d.data.l.split(" (")[0]; return t.length * 6 > wd ? t.slice(0, Math.floor(wd / 6.2)) + "…" : t; });
  el.replaceChildren(svg.node());
  legend("#qf-legend", cats.map(([, l, c]) => [l, c]));
  // évolution
  const rows = P.filter(x => +x.annee % 5 === 0 || x === P.at(-1));
  $("#qf-evol").innerHTML = `<div class="cmp">${rows.map(x => `<div class="cmp-row"><span class="cmp-name">${x.annee}</span><span class="cmp-stack" style="width:100%">${CAT.filter(([k]) => k !== "salaries_prives" && k !== "agents_publics").map(([k, l, c]) => (x[k] || 0) > 0 ? `<span style="flex:${x[k]} 0 0;background:${c}" data-t="${esc(l)} : ${M(x[k])}"></span>` : "").join("")}</span><span class="cmp-val">${M(x.total)}</span></div>`).join("")}</div>`;
  $("#qf-evol").querySelectorAll("[data-t]").forEach(sp => { sp.onpointermove = ev => showTip(sp.dataset.t, ev); sp.onpointerleave = hideTip; });
  // comparaison
  const st = { k: "emploi" };
  const cols = [["emploi", "En emploi", "#3b6fd6", 60], ["independants", "Indépendants", "#0ea5e9", 20], ["chomeurs", "Chômeurs", "#dc2626", 10], ["enfants", "Moins de 15 ans", "#84cc16", 25], ["plus65", "65 ans et plus", "#a855f7", 30]];
  const rs = IDX.pays.filter(r => r.population).sort((a, b) => b.population.emploi - a.population.emploi);
  $("#qf-cmp").innerHTML = `<div class="table-scroll"><table class="cmp-t"><thead><tr><th>Pays (% de la population)</th>${cols.map(c => `<th>${c[1]}</th>`).join("")}</tr></thead><tbody>${rs.map(r => `<tr class="${r.code === geo ? "me" : ""}"><td>${esc(r.nom)} <small class="muted">${r.population.annee}</small></td>${cols.map(([k, l, c, mx]) => `<td>${pct(r.population[k], 0)}<span class="ibar" style="width:${Math.min(70, 70 * r.population[k] / mx)}px;background:${c}"></span></td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
}

/* ---------------------------------------------------------------- la vie en euros (France) */
function cycle() {
  const { kpis, n0, n1, pct, css, esc, showTip, hideTip, legend } = T();
  const C = (CACHE.FR || D())?.cycle_de_vie; const el = $("#cv-chart");
  if (!C) { empty("#cv-chart", "Disponible pour la France uniquement."); return; }
  const E = C.esperance.ensemble, ec = C.ecole;
  // tranches d'âge : 0-17 ans (dans le foyer des parents), puis les tranches de l'INSEE jusqu'à l'espérance de vie
  const tr = [
    { a: 0, b: 3, l: "0-2 ans", paye: 0, prest: 0, nm: 0, ecole: 0, note: "crèche et santé comptées dans le foyer des parents" },
    { a: 3, b: 6, l: "3-5 ans", paye: 0, prest: 0, nm: 0, ecole: ec.maternelle },
    { a: 6, b: 11, l: "6-10 ans", paye: 0, prest: 0, nm: 0, ecole: ec.primaire },
    { a: 11, b: 15, l: "11-14 ans", paye: 0, prest: 0, nm: 0, ecole: ec.college },
    { a: 15, b: 18, l: "15-17 ans", paye: 0, prest: 0, nm: 0, ecole: ec.lycee },
  ];
  const bounds = [[18, 30], [30, 40], [40, 50], [50, 65], [65, Math.round(E)]];
  C.tranches.forEach((t, i) => tr.push({ a: bounds[i][0], b: bounds[i][1], l: t.replace(" ou plus", "+"), primaire: C.revenu_primaire[i], paye: -C.prelevements[i], prest: C.prestations[i], nm: C.non_monetaires[i], ecole: 0 }));
  let cum = 0; tr.forEach(t => { const yrs = t.b - t.a; t.net = (t.prest + t.nm + t.ecole) - t.paye; cum += yrs * t.net; t.cum = cum; });
  const actif = tr.filter(t => t.a >= 18 && t.a < 65), retraite = tr.find(t => t.a === 65);
  const payeVie = d3.sum(tr, t => (t.b - t.a) * t.paye), recuVie = d3.sum(tr, t => (t.b - t.a) * (t.prest + t.nm + t.ecole));
  kpis("#cv-kpis", [
    [n0(payeVie / 1000) + " k€", `payés au total sur une vie de ${n0(E)} ans (impôts, cotisations, TVA…), en euros de ${C.annee} par unité de consommation`],
    [n0(recuVie / 1000) + " k€", "reçus au total (retraites, allocations, soins, école, services publics)"],
    [n0(d3.max(actif, t => t.paye)) + " €", `payés par an au maximum, entre ${tr.find(t => t.paye === d3.max(actif, x => x.paye)).l}`],
    retraite && [n0(retraite.prest + retraite.nm) + " €", `reçus par an après 65 ans (dont ${n0(retraite.prest)} € de retraites et prestations en argent)`],
  ]);
  const w = Math.max(320, el.clientWidth), h = 380, m = { t: 16, r: 50, b: 34, l: 60 };
  const x = d3.scaleLinear([0, Math.ceil(E / 5) * 5], [m.l, w - m.r]);
  const ymax = d3.max(tr, t => Math.max(t.prest + t.nm + t.ecole, t.primaire || 0)), ymin = -d3.max(tr, t => t.paye);
  const y = d3.scaleLinear([ymin * 1.1, ymax * 1.08], [h - m.b, m.t]).nice();
  const y2 = d3.scaleLinear(d3.extent([0, ...tr.map(t => t.cum)]), [h - m.b, m.t]).nice();
  const svg = d3.create("svg").attr("viewBox", `0 0 ${w} ${h}`);
  svg.append("g").attr("class", "grid").selectAll("line").data(y.ticks(6)).join("line").attr("x1", m.l).attr("x2", w - m.r).attr("y1", y).attr("y2", y);
  const tip = t => `<b>${esc(t.l)}</b> (par an, par unité de consommation)` + (t.primaire ? `<br>Revenu gagné (travail, patrimoine) : ${n0(t.primaire)} €` : "") +
    `<br><span style="color:#dc2626">■</span> Payé : ${n0(t.paye)} €<br><span style="color:#3b6fd6">■</span> Reçu en argent : ${n0(t.prest)} €<br><span style="color:#16a34a">■</span> Reçu en services (soins, école, collectifs) : ${n0(t.nm + t.ecole)} €<br><b>Solde : ${t.net >= 0 ? "+" : "−"}${n0(Math.abs(t.net))} € par an</b>` + (t.note ? `<br><i>${esc(t.note)}</i>` : "");
  tr.forEach(t => {
    const x0 = x(t.a) + 1, wd = Math.max(1, x(t.b) - x(t.a) - 2);
    const gg = svg.append("g").on("pointermove", ev => showTip(tip(t), ev)).on("pointerleave", hideTip);
    gg.append("rect").attr("x", x0).attr("width", wd).attr("y", y(t.prest)).attr("height", y(0) - y(t.prest)).attr("fill", "#3b6fd6");
    gg.append("rect").attr("x", x0).attr("width", wd).attr("y", y(t.prest + t.nm + t.ecole)).attr("height", y(t.prest) - y(t.prest + t.nm + t.ecole)).attr("fill", "#16a34a").attr("opacity", .8);
    gg.append("rect").attr("x", x0).attr("width", wd).attr("y", y(0)).attr("height", y(-t.paye) - y(0)).attr("fill", "#dc2626").attr("opacity", .85);
    if (t.primaire) gg.append("line").attr("x1", x0).attr("x2", x0 + wd).attr("y1", y(t.primaire)).attr("y2", y(t.primaire)).attr("stroke", css("--ink")).attr("stroke-width", 2.5);
    gg.append("rect").attr("x", x0).attr("width", wd).attr("y", m.t).attr("height", h - m.t - m.b).attr("fill", "transparent");
  });
  svg.append("line").attr("x1", m.l).attr("x2", w - m.r).attr("y1", y(0)).attr("y2", y(0)).attr("stroke", css("--ink"));
  svg.append("path").attr("fill", "none").attr("stroke", "#f59e0b").attr("stroke-width", 2.4).attr("stroke-dasharray", "6 3")
    .attr("d", d3.line().x(d => x(d[0])).y(d => y2(d[1]))([[0, 0], ...tr.map(t => [t.b, t.cum])]));
  svg.append("g").attr("class", "axis").attr("transform", `translate(0,${h - m.b})`).call(d3.axisBottom(x).ticks(w < 560 ? 6 : 17).tickFormat(d => d + " ans"));
  svg.append("g").attr("class", "axis").attr("transform", `translate(${m.l},0)`).call(d3.axisLeft(y).ticks(6).tickFormat(d => n0(d / 1000) + " k€")).call(g => g.select(".domain").remove());
  svg.append("g").attr("class", "axis").attr("transform", `translate(${w - m.r},0)`).call(d3.axisRight(y2).ticks(6).tickFormat(d => n0(d / 1000) + " k€")).call(g => g.select(".domain").remove());
  svg.append("line").attr("x1", x(E)).attr("x2", x(E)).attr("y1", m.t).attr("y2", h - m.b).attr("stroke", css("--muted")).attr("stroke-dasharray", "2 3");
  svg.append("text").attr("x", x(E) - 4).attr("y", m.t + 10).attr("text-anchor", "end").attr("font-size", 11).attr("fill", css("--muted")).text(`espérance de vie : ${n1(E)} ans`);
  el.replaceChildren(svg.node());
  legend("#cv-legend", [["Payé chaque année (impôts, cotisations, TVA…)", "#dc2626"], ["Reçu en argent (retraites, allocations…)", "#3b6fd6"], ["Reçu en services (soins, école, police, routes…)", "#16a34a"],
    ["Revenu gagné par le travail et le patrimoine", css("--ink")], ["Solde cumulé depuis la naissance (axe de droite)", "#f59e0b", true]]);
}

/* ---------------------------------------------------------------- industrie et innovation */
function industrie() {
  const { kpis, lineChart, legend, n0, n1, pct, css, esc } = T();
  const I = D()?.industrie; if (!I) { kpis("#ind-kpis", []); empty("#ind-part"); return; }
  const last = k => [...I].reverse().find(x => x[k] != null);
  const first = k => I.find(x => x[k] != null);
  const pi = last("part_industrie"), p0 = first("part_industrie"), rd = last("rd_pib"), ch = last("chercheurs"), ia = last("ia"), ht = last("emploi_hightech"), em = last("emploi_industrie");
  kpis("#ind-kpis", [
    pi && [pct(pi.part_industrie), `de la valeur ajoutée vient de l'industrie manufacturière en ${pi.annee} (${pct(p0.part_industrie)} en ${p0.annee})`],
    em && [n1(em.emploi_industrie / 1000) + " M", `d'emplois dans l'industrie (${pct(em.part_emploi_industrie)} de l'emploi)`],
    rd && [pct(rd.rd_pib, 2), `du PIB consacrés à la recherche et développement en ${rd.annee}${rd.rd_entreprises_pib ? ` (dont ${pct(rd.rd_entreprises_pib, 2)} par les entreprises)` : ""}`],
    ch && [n0(ch.chercheurs), `chercheurs en équivalent temps plein (${ch.annee})`],
    ia && [pct(ia.ia, 0), `des entreprises de 10 salariés ou plus utilisent l'intelligence artificielle (${ia.annee})`],
  ]);
  lineChart($("#ind-part"), I, [{ k: "part_industrie", l: "Part de l'industrie dans la valeur ajoutée", c: "#475569" }, { k: "part_emploi_industrie", l: "Part de l'industrie dans l'emploi", c: "#3b6fd6", dash: "5 3" }],
    { vfmt: v => pct(v), yfmt: v => v + " %", h: 240 });
  legend("#ind-part-legend", [["Part de l'industrie dans la valeur ajoutée", "#475569"], ["Part dans l'emploi", "#3b6fd6", true]]);
  lineChart($("#ind-rd"), I, [{ k: "rd_pib", l: "R&D totale", c: "#16a34a" }, { k: "rd_entreprises_pib", l: "R&D des entreprises", c: "#3b6fd6" }, { k: "rd_public_pib", l: "R&D publique (État, universités)", c: "#8b5cf6" }],
    { vfmt: v => pct(v, 2), yfmt: v => n1(v) + " %", h: 240 });
  legend("#ind-rd-legend", [["R&D totale (% du PIB)", "#16a34a"], ["Entreprises", "#3b6fd6"], ["État et universités", "#8b5cf6"]]);
  lineChart($("#ind-prod"), I.filter(x => x.production_industrielle != null), [{ k: "production_industrielle", l: "Production manufacturière (volume, base 100 en 2021)", c: "#dc2626" }], { vfmt: v => n1(v), h: 220, nozero: true });
  const cols = [["part_industrie", "Industrie (% VA)", "#475569", 35, 1], ["rd_pib", "R&D (% PIB)", "#16a34a", 4, 2], ["rd_entreprises_pib", "dont entreprises", "#3b6fd6", 3, 2],
    ["chercheurs_1000", "Chercheurs / 1000 hab.", "#8b5cf6", 12, 1], ["emploi_hightech", "Emploi haute technologie (%)", "#0ea5e9", 8, 1], ["ia", "Entreprises utilisant l'IA (%)", "#f59e0b", 40, 0]];
  const rs = IDX.pays.filter(r => r.industrie).sort((a, b) => (b.industrie.rd_pib || 0) - (a.industrie.rd_pib || 0));
  $("#ind-cmp").innerHTML = `<div class="table-scroll"><table class="cmp-t"><thead><tr><th>Pays</th>${cols.map(c => `<th>${c[1]}</th>`).join("")}</tr></thead><tbody>${rs.map(r => `<tr class="${r.code === geo ? "me" : ""}"><td>${esc(r.nom)}</td>${cols.map(([k, l, c, mx, d]) => { const v = r.industrie[k]; return v == null ? `<td class="muted">–</td>` : `<td>${new Intl.NumberFormat("fr-FR", { maximumFractionDigits: d, minimumFractionDigits: d }).format(v)}<span class="ibar" style="width:${Math.min(70, 70 * v / mx)}px;background:${c}"></span></td>`; }).join("")}</tr>`).join("")}</tbody></table></div>`;
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
