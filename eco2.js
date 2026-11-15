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
function drawAll() { [qui, cycle, industrie, redis, origine, heritage].forEach(f => { try { f(); } catch (e) { console.error(f.name, e); } }); }

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
    split && [M(q.agents_publics), `agents publics ; État : ${n1(q.fp_detail.FPE / 1000)} M ; territoriale : ${n1(q.fp_detail.FPT / 1000)} M ; hospitalière : ${n1(q.fp_detail.FPH / 1000)} M`],
    !split && [M(q.salaries), "salariés"],
    [M(q.independants), "indépendants"],
    [M(actifs), `personnes en emploi, soit ${pct(100 * actifs / q.total, 0)} de la population ; ${M(q.total - actifs)} ne travaillent pas`],
  ]);
  // deux blocs : ceux qui travaillent, ceux qui ne travaillent pas
  const TRAV = ["salaries_prives", "agents_publics", "salaries", "independants", "seniors_actifs"];
  const el = $("#qf-tree"), w = Math.max(320, el.clientWidth), narrow = w < 640, h = narrow ? 760 : 440, gap = 14, top = 34;
  const lum = c => { const x = d3.rgb(c); return (0.299 * x.r + 0.587 * x.g + 0.114 * x.b) / 255; };
  const blocs = [["Travaillent", cats.filter(([k]) => TRAV.includes(k))], ["Ne travaillent pas", cats.filter(([k]) => !TRAV.includes(k))]]
    .map(([t, cs]) => ({ t, cs, v: d3.sum(cs, ([k]) => q[k] || 0) }));
  const svg = d3.create("svg").attr("viewBox", `0 0 ${w} ${h}`);
  const tot = blocs[0].v + blocs[1].v;
  let off = 0;
  blocs.forEach((B, i) => {
    const share = B.v / tot;
    const bw = narrow ? w : (w - gap) * share, bh = narrow ? (h - 2 * top - gap) * share : h - top;
    const x0 = narrow ? 0 : off, y0 = narrow ? off + top : top;
    svg.append("text").attr("x", x0).attr("y", y0 - 12).attr("font-size", 14).attr("font-weight", 650).attr("fill", "var(--ink)")
      .text(`${B.t} : ${M(B.v)}`).append("tspan").attr("fill", "var(--muted)").attr("font-weight", 400).text(`  ${pct(100 * B.v / q.total, 0)} de la population`);
    const root = d3.hierarchy({ children: B.cs.map(([k, l, c]) => ({ k, l, c, v: q[k] })) }).sum(d => d.v || 0).sort((a, b) => b.value - a.value);
    d3.treemap().size([bw, bh]).paddingInner(2)(root);
    const g = svg.append("g").attr("transform", `translate(${x0},${y0})`).selectAll("g").data(root.leaves()).join("g").attr("transform", d => `translate(${d.x0},${d.y0})`);
    g.append("rect").attr("width", d => d.x1 - d.x0).attr("height", d => d.y1 - d.y0).attr("fill", d => d.data.c).attr("rx", 4)
      .on("pointermove", (ev, d) => showTip(`<b>${esc(d.data.l)}</b><br>${M(d.data.v)} · ${pct(100 * d.data.v / q.total)} de la population`, ev)).on("pointerleave", hideTip);
    const fg = d => lum(d.data.c) > 0.62 ? "#1d1f24" : "#fff";
    g.append("text").attr("x", 7).attr("y", 19).style("fill", fg).attr("font-size", 13).attr("font-weight", 650).attr("pointer-events", "none")
      .text(d => (d.x1 - d.x0) > 50 && (d.y1 - d.y0) > 24 ? M(d.data.v) : "");
    g.append("text").attr("x", 7).attr("y", 35).style("fill", fg).attr("font-size", 11).attr("pointer-events", "none")
      .text(d => { const wd = d.x1 - d.x0; if (wd < 80 || (d.y1 - d.y0) < 44) return ""; const t = d.data.l.split(" (")[0]; return t.length * 6 > wd ? t.slice(0, Math.floor(wd / 6.2)) + "…" : t; });
    off += narrow ? bh + top + gap : bw + gap;
  });
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
// trois couleurs seulement : le détail est dans l'infobulle
const PAY_C = new Proxy({}, { get: () => "#dc2626" });
const ARG_C = new Proxy({}, { get: () => "#3b6fd6" });
const SER_C = new Proxy({}, { get: () => "#16a34a" });
const LEG3 = css => [["Payé (impôts, cotisations, TVA…)", "#dc2626"], ["Reçu en argent (retraites, allocations…)", "#3b6fd6"], ["Reçu en services (soins, école, police, routes…)", "#16a34a"]];
function cycle() {
  const { kpis, n0, n1, pct, css, esc, showTip, hideTip, legend } = T();
  const C = (CACHE.FR || D())?.cycle_de_vie; const el = $("#cv-chart");
  if (!C || !C.paye) { empty("#cv-chart", "Disponible pour la France uniquement."); return; }
  const E = C.esperance.ensemble;
  const bounds = [[18, 30], [30, 40], [40, 50], [50, 65], [65, Math.round(E)]];
  const sum = (grp, i) => d3.sum(C[grp], x => x[2][i]);
  const tr = C.tranches.map((l, i) => ({ i, l, a: bounds[i][0], b: bounds[i][1], prim: C.revenu_primaire[i], paye: sum("paye", i), argent: sum("argent", i), services: sum("services", i) }));
  let cum = 0; tr.forEach(t => { t.net = t.argent + t.services - t.paye; cum += (t.b - t.a) * t.net; t.cum = cum; });
  const payeVie = d3.sum(tr, t => (t.b - t.a) * t.paye), recuVie = d3.sum(tr, t => (t.b - t.a) * (t.argent + t.services));
  const top = tr.reduce((a, b) => b.paye > a.paye ? b : a), vieux = tr.at(-1);
  kpis("#cv-kpis", [
    [n0(top.paye) + " €", `payés par personne et par an entre ${top.l}, le maximum (impôts, cotisations, TVA…)`],
    [n0(vieux.argent + vieux.services) + " €", `reçus par personne et par an à ${vieux.l} ; dont ${n0(C.argent.find(x => x[0] === "retraites")[2][vieux.i])} € de retraite ; dont ${n0(C.services.find(x => x[0] === "sante")[2][vieux.i])} € de soins`],
    [n0(payeVie / 1000) + " k€ / " + n0(recuVie / 1000) + " k€", `payés / reçus sur une vie adulte de 18 à ${n0(E)} ans, en euros de ${C.annee}`],
  ]);
  const w = Math.max(320, el.clientWidth), h = 420, m = { t: 16, r: 54, b: 34, l: 60 };
  const x = d3.scaleLinear([18, Math.ceil(E / 5) * 5], [m.l, w - m.r]);
  const ymax = d3.max(tr, t => Math.max(t.argent + t.services, t.prim)), ymin = -d3.max(tr, t => t.paye);
  const y = d3.scaleLinear([ymin * 1.08, ymax * 1.06], [h - m.b, m.t]).nice();
  const y2 = d3.scaleLinear(d3.extent([0, ...tr.map(t => t.cum)]), [h - m.b, m.t]).nice();
  const svg = d3.create("svg").attr("viewBox", `0 0 ${w} ${h}`);
  svg.append("g").attr("class", "grid").selectAll("line").data(y.ticks(8)).join("line").attr("x1", m.l).attr("x2", w - m.r).attr("y1", y).attr("y2", y);
  const tip = t => `<b>${esc(t.l)}</b> · par personne et par an<br>Revenu gagné (travail, patrimoine) : ${n0(t.prim)} €<br><br><b style="color:#dc2626">Payé : ${n0(t.paye)} €</b><br>` +
    C.paye.map(([k, l, v]) => `${esc(l)} : ${n0(v[t.i])} €`).join("<br>") +
    `<br><br><b style="color:#2563eb">Reçu en argent : ${n0(t.argent)} €</b><br>` + C.argent.filter(z => z[2][t.i] > 20).map(([k, l, v]) => `${esc(l)} : ${n0(v[t.i])} €`).join("<br>") +
    `<br><br><b style="color:#16a34a">Reçu en services : ${n0(t.services)} €</b><br>` + C.services.map(([k, l, v]) => `${esc(l)} : ${n0(v[t.i])} €`).join("<br>") +
    `<br><br><b>Solde : ${t.net >= 0 ? "+" : "−"}${n0(Math.abs(t.net))} € par an</b>`;
  tr.forEach(t => {
    const x0 = x(t.a) + 1, wd = Math.max(1, x(t.b) - x(t.a) - 2);
    const g = svg.append("g").on("pointermove", ev => showTip(tip(t), ev)).on("pointerleave", hideTip);
    g.append("rect").attr("x", x0).attr("width", wd).attr("y", y(t.argent)).attr("height", y(0) - y(t.argent)).attr("fill", "#3b6fd6");
    g.append("rect").attr("x", x0).attr("width", wd).attr("y", y(t.argent + t.services)).attr("height", y(t.argent) - y(t.argent + t.services)).attr("fill", "#16a34a");
    g.append("rect").attr("x", x0).attr("width", wd).attr("y", y(0)).attr("height", y(-t.paye) - y(0)).attr("fill", "#dc2626");
    g.append("line").attr("x1", x0).attr("x2", x0 + wd).attr("y1", y(t.prim)).attr("y2", y(t.prim)).attr("stroke", css("--ink")).attr("stroke-width", 3);
    g.append("text").attr("x", x0 + wd / 2).attr("y", y(t.prim) - 5).attr("text-anchor", "middle").attr("font-size", 10.5).attr("fill", css("--ink")).text(n0(t.prim / 1000) + " k€ gagnés");
    g.append("rect").attr("x", x0).attr("width", wd).attr("y", m.t).attr("height", h - m.t - m.b).attr("fill", "transparent");
  });
  svg.append("line").attr("x1", m.l).attr("x2", w - m.r).attr("y1", y(0)).attr("y2", y(0)).attr("stroke", css("--ink"));
  svg.append("path").attr("fill", "none").attr("stroke", "#f59e0b").attr("stroke-width", 2.4).attr("stroke-dasharray", "6 3")
    .attr("d", d3.line().x(d => x(d[0])).y(d => y2(d[1]))([[18, 0], ...tr.map(t => [t.b, t.cum])]));
  svg.append("g").attr("class", "axis").attr("transform", `translate(0,${h - m.b})`).call(d3.axisBottom(x).tickValues([18, 30, 40, 50, 65, Math.round(E)]).tickFormat(d => d + " ans"));
  svg.append("g").attr("class", "axis").attr("transform", `translate(${m.l},0)`).call(d3.axisLeft(y).ticks(8).tickFormat(d => n0(d / 1000) + " k€")).call(g => g.select(".domain").remove());
  svg.append("g").attr("class", "axis").attr("transform", `translate(${w - m.r},0)`).call(d3.axisRight(y2).ticks(6).tickFormat(d => n0(d / 1000) + " k€")).call(g => g.select(".domain").remove());
  svg.append("text").attr("x", w - m.r - 4).attr("y", m.t + 10).attr("text-anchor", "end").attr("font-size", 11).attr("fill", css("--muted")).text(`espérance de vie : ${n1(E)} ans`);
  el.replaceChildren(svg.node());
  legend("#cv-legend", [...LEG3(css), ["Revenu gagné par le travail et le patrimoine", css("--ink")], ["Solde cumulé depuis 18 ans (axe de droite)", "#f59e0b", true]]);
}

/* ---------------------------------------------------------------- redistribution par décile (France) */
function redis() {
  const { kpis, n0, n1, pct, css, esc, showTip, hideTip, legend, bars } = T();
  const R = (CACHE.FR || D())?.redistribution; const el = $("#rd-chart"); if (!el) return;
  if (!R) { empty("#rd-chart", "Disponible pour la France uniquement."); return; }
  const N = R.avant.length;
  const dec = R.avant.map((a, i) => ({ i, l: N === 20 ? (i + 1) * 5 + " %" : "D" + (i + 1), avant: a, apres: R.apres[i], paye: d3.sum(R.paye, x => x[2][i]), recu: d3.sum([...R.argent, ...R.services], x => x[2][i]), benef: R.beneficiaires_nets[i] }));
  dec.forEach(d => d.net = d.recu - d.paye);
  const top = dec[N - 1], bas = dec[0];
  const r0 = top.avant / bas.avant, r1 = top.apres / bas.apres;
  const nbBenef = dec.filter(d => d.net > 0).length;
  kpis("#rd-kpis", [
    [n0(r0) + " → " + n1(r1), `fois plus de revenu pour les 5 % les plus aisés que pour les 5 % les plus modestes, avant puis après redistribution (${R.annee})`],
    [`${nbBenef} tranches sur ${N}`, `reçoivent plus qu'elles ne paient (${nbBenef * 100 / N} % de la population, du bas de l'échelle)`],
    ["+" + n0(bas.net) + " €", "solde net des 5 % les plus modestes, par an et par unité de consommation"],
    ["−" + n0(-top.net) + " €", `solde net des 5 % les plus aisés ; ils paient ${n0(top.paye)} € ; ils reçoivent ${n0(top.recu)} €`],
  ]);
  const w = Math.max(320, el.clientWidth), h = 460, m = { t: 14, r: 12, b: 30, l: 62 };
  const x = d3.scaleBand(dec.map(d => d.l), [m.l, w - m.r]).padding(.18);
  const y = d3.scaleLinear([-d3.max(dec, d => d.paye) * 1.05, d3.max(dec, d => Math.max(d.recu, d.avant, d.apres)) * 1.05], [h - m.b, m.t]).nice();
  const svg = d3.create("svg").attr("viewBox", `0 0 ${w} ${h}`);
  svg.append("g").attr("class", "grid").selectAll("line").data(y.ticks(8)).join("line").attr("x1", m.l).attr("x2", w - m.r).attr("y1", y).attr("y2", y);
  const tip = d => `<b>${N === 20 ? `De ${d.i * 5} à ${(d.i + 1) * 5} %` : d.l}</b> ${d.i === 0 ? "(les plus modestes)" : d.i === N - 1 ? "(les plus aisés)" : ""} · par unité de consommation et par an<br>Revenu avant redistribution : ${n0(d.avant)} €<br>Niveau de vie après : <b>${n0(d.apres)} €</b><br><br><b style="color:#dc2626">Paie : ${n0(d.paye)} €</b><br>` +
    R.paye.map(([k, l, v]) => `${esc(l)} : ${n0(v[d.i])} €`).join("<br>") + `<br><br><b style="color:#2563eb">Reçoit en argent : ${n0(d3.sum(R.argent, z => z[2][d.i]))} €</b><br>` +
    R.argent.map(([k, l, v]) => `${esc(l)} : ${n0(v[d.i])} €`).join("<br>") + `<br><br><b style="color:#16a34a">Reçoit en services : ${n0(d3.sum(R.services, z => z[2][d.i]))} €</b><br>` +
    R.services.map(([k, l, v]) => `${esc(l)} : ${n0(v[d.i])} €`).join("<br>") + `<br><br><b>Solde : ${d.net >= 0 ? "+" : "−"}${n0(Math.abs(d.net))} €</b> · ${pct(d.benef, 0)} des personnes de la tranche sont bénéficiaires nettes`;
  dec.forEach(d => {
    const g = svg.append("g").on("pointermove", ev => showTip(tip(d), ev)).on("pointerleave", hideTip);
    const x0 = x(d.l), bw = x.bandwidth();
    const ag = d3.sum(R.argent, z => Math.max(0, z[2][d.i])), sv = d3.sum(R.services, z => Math.max(0, z[2][d.i]));
    g.append("rect").attr("x", x0).attr("width", bw).attr("y", y(ag)).attr("height", y(0) - y(ag)).attr("fill", "#3b6fd6");
    g.append("rect").attr("x", x0).attr("width", bw).attr("y", y(ag + sv)).attr("height", y(ag) - y(ag + sv)).attr("fill", "#16a34a");
    g.append("rect").attr("x", x0).attr("width", bw).attr("y", y(0)).attr("height", y(-d.paye) - y(0)).attr("fill", "#dc2626");
    g.append("path").attr("d", d3.symbol(d3.symbolDiamond, 90)()).attr("transform", `translate(${x0 + bw / 2},${y(d.avant)})`).attr("fill", "#9ca3af").attr("stroke", css("--surface"));
    g.append("line").attr("x1", x0 - 3).attr("x2", x0 + bw + 3).attr("y1", y(d.apres)).attr("y2", y(d.apres)).attr("stroke", css("--ink")).attr("stroke-width", 3);
    g.append("text").attr("x", x0 + bw / 2).attr("y", y(-d.paye) + 14).attr("text-anchor", "middle").attr("font-size", N === 20 ? 9 : 10.5).attr("font-weight", 700)
      .attr("fill", d.net >= 0 ? "#16a34a" : "#dc2626").text((d.net >= 0 ? "+" : "−") + n0(Math.abs(d.net) / 1000) + " k€");
    g.append("rect").attr("x", x0).attr("width", bw).attr("y", m.t).attr("height", h - m.t - m.b).attr("fill", "transparent");
  });
  svg.append("line").attr("x1", m.l).attr("x2", w - m.r).attr("y1", y(0)).attr("y2", y(0)).attr("stroke", css("--ink"));
  svg.append("g").attr("class", "axis").attr("transform", `translate(0,${h - m.b})`).call(d3.axisBottom(x).tickValues(x.domain().filter((_, i) => w > 700 || i % 2 === 1)));
  svg.append("text").attr("x", (m.l + w - m.r) / 2).attr("y", h - 2).attr("text-anchor", "middle").attr("font-size", 10.5).attr("fill", css("--muted")).text("Population classée par niveau de vie, des plus modestes (à gauche) aux plus aisés (à droite), par tranches de 5 %");
  svg.append("g").attr("class", "axis").attr("transform", `translate(${m.l},0)`).call(d3.axisLeft(y).ticks(8).tickFormat(v => n0(v / 1000) + " k€")).call(g => g.select(".domain").remove());
  el.replaceChildren(svg.node());
  legend("#rd-legend", [...LEG3(css), ["Revenu avant redistribution (losange)", "#9ca3af"], ["Niveau de vie après redistribution", css("--ink")], ["Solde net (en bas de chaque colonne)", "#16a34a"]]);
  // avant / après
  const mx = d3.max(dec, d => d.avant);
  $("#rd-avap").innerHTML = `<div class="bars">${dec.map(d => `<div class="bar-row"><span class="lab">${N === 20 ? `${d.i * 5}-${(d.i + 1) * 5} %` : d.l}</span><span class="val">${n0(d.avant)} € → <b>${n0(d.apres)} €</b></span>
    <span class="track" style="height:14px"><span class="fill" style="width:${100 * d.avant / mx}%;background:#d1d5db"></span><span class="fill" style="width:${100 * d.apres / mx}%;background:${css("--ink")};height:6px;top:4px"></span></span></div>`).join("")}</div>
    <p class="muted" style="font-size:.85rem;margin-top:6px">Gris : revenu avant redistribution ; noir : niveau de vie après. Les 5 % les plus aisés ont ${n0(r0)} fois plus de revenu que les 5 % les plus modestes avant redistribution, ${n1(r1)} fois plus après.</p>`;
  // Gini
  bars($("#rd-gini"), R.gini.filter(([l]) => !/Revenus|Profits/.test(l)).map(([l, v]) => ({ l, v, t: (v > 0 ? "+" : "") + n1(v) + " pt", c: v > 0 ? "#dc2626" : "#16a34a" })).sort((a, b) => a.v - b.v));
}

/* ---------------------------------------------------------------- origine du revenu : travail ou patrimoine */
function origine() {
  const { kpis, n0, n1, pct, css, esc, showTip, hideTip, legend, lineChart } = T();
  const R = (CACHE.FR || D())?.redistribution; const el = $("#or-chart"); if (!el || !R?.origine) return;
  const O = Object.fromEntries(R.origine.map(([k, l, v]) => [k, { l, v }]));
  const N = R.avant.length;
  const G3 = [["travail", "Travail salarié", "#3b6fd6", ["salaires"]], ["indep", "Travail indépendant (mêlé de capital)", "#94a3b8", ["independants"]],
              ["patri", "Patrimoine (intérêts, dividendes, loyers, bénéfices)", "#f59e0b", ["financier", "loyers", "profits"]]];
  const rows = d3.range(N).map(i => {
    const vals = Object.fromEntries(G3.map(([k, , , ks]) => [k, d3.sum(ks, kk => Math.max(0, O[kk].v[i]))]));
    const tot = d3.sum(Object.values(vals));
    return { i, vals, tot, sh: Object.fromEntries(Object.entries(vals).map(([k, v]) => [k, 100 * v / tot])) };
  });
  const top = rows[N - 1], mid = rows[Math.floor(N / 2)], bas = rows[0];
  const capTot = d3.sum(rows, r => r.vals.patri), capTop = top.vals.patri + rows[N - 2].vals.patri;
  kpis("#or-kpis", [
    [pct(top.sh.patri, 0), `du revenu des 5 % les plus aisés vient du patrimoine ; ${n0(top.vals.patri)} € par unité de consommation ; ${pct(mid.sh.patri, 0)} au milieu de l'échelle`],
    [pct(100 * capTop / capTot, 0), "des revenus du patrimoine vont aux 10 % les plus aisés"],
    [pct(bas.sh.patri, 0), "chez les 5 % les plus modestes : surtout le loyer « imputé » des quelques propriétaires et de petits revenus d'épargne"],
  ]);
  const w = Math.max(320, el.clientWidth), h = 300, m = { t: 10, r: 10, b: 30, l: 44 };
  const x = d3.scaleBand(rows.map(r => r.i), [m.l, w - m.r]).padding(.12), y = d3.scaleLinear([0, 100], [h - m.b, m.t]);
  const svg = d3.create("svg").attr("viewBox", `0 0 ${w} ${h}`);
  rows.forEach(r => {
    const g = svg.append("g").on("pointermove", ev => showTip(`<b>De ${r.i * 5} à ${(r.i + 1) * 5} %</b> · revenu avant redistribution : ${n0(r.tot)} € par unité de consommation<br>` +
      R.origine.map(([k, l, v]) => `${esc(l)} : ${n0(v[r.i])} € (${pct(100 * Math.max(0, v[r.i]) / r.tot, 0)})`).join("<br>"), ev)).on("pointerleave", hideTip);
    let acc = 0;
    G3.forEach(([k, l, c]) => { const v = r.sh[k]; g.append("rect").attr("x", x(r.i)).attr("width", x.bandwidth()).attr("y", y(acc + v)).attr("height", y(acc) - y(acc + v)).attr("fill", c); acc += v; });
    g.append("text").attr("x", x(r.i) + x.bandwidth() / 2).attr("y", y(100 - r.sh.patri / 2)).attr("dy", ".35em").attr("text-anchor", "middle").attr("font-size", 9.5).style("fill", "#fff").attr("font-weight", 700).text(r.sh.patri >= 8 ? Math.round(r.sh.patri) + "%" : "");
  });
  svg.append("g").attr("class", "axis").attr("transform", `translate(0,${h - m.b})`).call(d3.axisBottom(x).tickFormat(i => (i + 1) * 5 + " %").tickValues(rows.map(r => r.i).filter(i => w > 700 || i % 2 === 1)));
  svg.append("g").attr("class", "axis").attr("transform", `translate(${m.l},0)`).call(d3.axisLeft(y).ticks(5).tickFormat(v => v + " %")).call(g => g.select(".domain").remove());
  el.replaceChildren(svg.node());
  legend("#or-legend", G3.map(([, l, c]) => [l, c]));
  const S = R.succession || [], s1 = S.at(-1), s0 = S[0];
  $("#her-box").innerHTML = `<p>Les comptes nationaux ne comptent pas l'héritage comme un revenu : c'est un transfert de patrimoine, qui ne crée pas de richesse. Il pèse pourtant lourd. Selon le Conseil d'analyse économique (« Repenser l'héritage », note n° 69, 2021), la part du patrimoine hérité dans le patrimoine total des ménages est passée de 35 % au début des années 1970 à environ 60 % aujourd'hui, et la moitié des personnes d'une génération héritera de moins de 70 000 € au cours de sa vie. Ce chiffre de 60 % est une estimation macroéconomique (patrimoine accumulé à partir des flux de successions), pas une mesure ménage par ménage : l'enquête de l'INSEE ci-dessous montre, elle, qui hérite et combien. Les inégalités de patrimoine, bien plus fortes que celles de revenu, se transmettent ainsi largement d'une génération à l'autre.</p>` +
    (s1 ? `<p>Les droits de succession et de donation ont rapporté <b>${n1(s1.md)} Md€</b> en ${s1.annee}, soit ${pct(s1.pib, 1)} du PIB (${n1(s0.md)} Md€ en ${s0.annee}). C'est moins de 2 % des prélèvements obligatoires : la grande majorité des transmissions en ligne directe sont exonérées grâce aux abattements (100 000 € par parent et par enfant, renouvelables tous les 15 ans) et aux régimes de l'assurance-vie et des entreprises familiales.</p>` : "");
}

/* ---------------------------------------------------------------- patrimoine et héritage (enquête HVP) */
function heritage() {
  const { kpis, n0, n1, pct, esc, showTip, hideTip, legend, bars, css } = T();
  const H = (CACHE.FR || D())?.heritage; const el = $("#pat-chart"); if (!el || !H) return;
  const keur = v => v >= 1e6 ? n1(v / 1e6) + " M€" : n0(v / 1000) + " k€";
  const dec = H.tranches.filter(t => !t.sous), top = H.tranches.filter(t => t.sous);
  const m = k => H.masse.find(([l]) => l.includes(k))?.[1];
  const ens = H.part_age.find(r => r[0] === "Ensemble"), pq = H.part_patrimoine;
  const med = H.seuils.find(r => r[0].startsWith("Médiane"));
  kpis("#pat-kpis", [
    [pct(m("10 %"), 0), `du patrimoine des ménages est détenu par les 10 % les mieux dotés (${pct(m("1 %"), 0)} par les 1 %) ; la moitié la moins dotée en détient ${pct(100 - m("50 %"), 0)}`],
    [keur(med[1]), `patrimoine brut médian d'un ménage (${keur(med[2])} net des emprunts) ; moyenne : ${keur(H.moyen)}`],
    [pct(ens[1], 0), `des ménages ont déjà hérité ; ${pct(ens[2], 0)} ont reçu une donation`],
    [pct(pq.at(-2)[1], 0) + " / " + pct(pq[0][1], 0), "des ménages les plus riches (quart supérieur) ont hérité, contre les plus pauvres (quart inférieur)"],
  ]);
  const short = l => l.replace("Inférieur au 1er décile", "10 % les moins dotés").replace("Supérieur au 9e décile", "10 % les mieux dotés").replace(/^Du (\d+)e?r? au (\d+)e décile$/, (_, a, b) => `de ${a}0 à ${b}0 %`)
    .replace("Du 90e au 95e centile", "  dont 90 à 95 %").replace("Du 95e au 99e centile", "  dont 95 à 99 %").replace("Supérieur au 99e centile", "  dont 1 % le mieux doté");
  bars(el, [...dec, ...top].map(t => ({ l: short(t.l), v: t.moyen, c: t.sous ? "#fbbf24" : "#d97706",
    t: `${keur(t.moyen)} · ${pct(t.part, t.part < 1 ? 1 : 0)} du total` })));
  el.querySelectorAll(".bar-row").forEach((row, i) => { const t = [...dec, ...top][i];
    row.onpointermove = ev => showTip(`<b>${esc(t.l)}</b><br>Patrimoine brut moyen : ${n0(t.moyen)} €<br>Immobilier ${pct(t.immo, 0)} · financier ${pct(t.fin, 0)} · professionnel ${pct(t.pro, 0)} · autre ${pct(t.autre, 0)}<br>Emprunts en cours : ${pct(-t.dette, 0)} du patrimoine brut`, ev);
    row.onpointerleave = hideTip; });

  // part des ménages ayant hérité / reçu une donation
  const QL = ["Quart le moins doté", "2e quart", "3e quart", "Quart le mieux doté"];
  const grp = (sel, rows, labs) => {
    const e = $(sel); if (!e) return;
    const w = Math.max(300, e.clientWidth), h = 230, mg = { t: 16, r: 8, b: 40, l: 36 };
    const x = d3.scaleBand(labs, [mg.l, w - mg.r]).padding(.2), x2 = d3.scaleBand([0, 1], [0, x.bandwidth()]).padding(.08), y = d3.scaleLinear([0, 70], [h - mg.b, mg.t]);
    const svg = d3.create("svg").attr("viewBox", `0 0 ${w} ${h}`);
    rows.forEach((r, i) => [r[1], r[2]].forEach((v, j) => {
      svg.append("rect").attr("x", x(labs[i]) + x2(j)).attr("width", x2.bandwidth()).attr("y", y(v)).attr("height", y(0) - y(v)).attr("fill", j ? "#fbbf24" : "#b45309")
        .on("pointermove", ev => showTip(`<b>${esc(r[0])}</b><br>${j ? "Ont reçu une donation" : "Ont hérité"} : ${pct(v)}<br>Ont fait une donation : ${pct(r[3])}`, ev)).on("pointerleave", hideTip);
      svg.append("text").attr("x", x(labs[i]) + x2(j) + x2.bandwidth() / 2).attr("y", y(v) - 3).attr("text-anchor", "middle").attr("font-size", 10).attr("fill", css("--fg")).text(Math.round(v));
    }));
    svg.append("g").attr("class", "axis").attr("transform", `translate(0,${h - mg.b})`).call(d3.axisBottom(x)).selectAll("text").call(t => t.each(function (d) {
      const s = d3.select(this), wds = d.split(" "); if (wds.length < 3) return; s.text(null);
      const half = Math.ceil(wds.length / 2); [wds.slice(0, half).join(" "), wds.slice(half).join(" ")].forEach((l, k) => s.append("tspan").attr("x", 0).attr("dy", k ? "1.1em" : ".71em").text(l)); }));
    svg.append("g").attr("class", "axis").attr("transform", `translate(${mg.l},0)`).call(d3.axisLeft(y).ticks(4).tickFormat(v => v + " %")).call(g => g.select(".domain").remove());
    e.replaceChildren(svg.node());
  };
  grp("#her-pat", pq.slice(0, 4), QL);
  const ag = H.part_age.filter(r => r[0] !== "Ensemble");
  grp("#her-age", ag, ag.map(r => r[0].replace("De ", "").replace("Moins de ", "< ").replace(" et plus", " +").replace(" ans", "")));
  legend("#her-legend", [["A déjà hérité", "#b45309"], ["A déjà reçu une donation", "#fbbf24"]]);

  // montants des héritages selon le patrimoine de l'héritier
  const MB = ["Moins de 8 000 €", "8 000 à 30 000 €", "30 000 à 100 000 €", "100 000 € ou plus"], MC = ["#fde68a", "#fbbf24", "#d97706", "#92400e"];
  const e = $("#her-mont");
  if (e) {
    const rows = H.montant_patrimoine.slice(0, 4).map((r, i) => [QL[i], ...r.slice(1, 5)]).concat([["Ensemble", ...H.montant_patrimoine.at(-1).slice(1, 5)]]);
    e.innerHTML = `<div class="bars">${rows.map(r => `<div class="bar-row"><span class="lab">${esc(r[0])}</span><span class="val">${pct(r[4], 0)} ≥ 100 k€</span><span class="track" style="display:flex">${
      r.slice(1).map((v, j) => `<span title="${esc(MB[j])} : ${pct(v)}" style="width:${v}%;background:${MC[j]};height:100%"></span>`).join("")}</span></div>`).join("")}</div>`;
    legend("#her-mont-legend", MB.map((l, j) => [l, MC[j]]));
  }
  const ph = H.patrimoine_heritiers.slice(4), mh = ph.find(r => r[0] === "médian");
  const R = (CACHE.FR || D())?.redistribution, sh10 = R ? 100 * d3.sum(R.apres.slice(-2).map((v, i) => v * R.uc_millions.at(i - 2))) / d3.sum(R.apres.map((v, i) => v * R.uc_millions[i])) : null;
  const mp = H.montant_patrimoine;
  $("#pat-txt").innerHTML = `<p>Le patrimoine est beaucoup plus concentré que le revenu : les 10 % de ménages les mieux dotés possèdent ${pct(m("10 %"), 0)} du total, ${sh10 ? `alors que les 10 % les plus aisés en niveau de vie reçoivent ${pct(sh10, 0)} des revenus une fois comptés impôts, prestations et services publics (environ un quart du revenu disponible monétaire, graphique du haut).` : ""} Pour les ménages du milieu, le patrimoine, c'est surtout le logement ; tout en haut, ce sont les actions et les entreprises (${pct(top.at(-1).pro, 0)} de patrimoine professionnel pour le 1 % le mieux doté).</p>
    <p>L'héritage n'est donc pas impossible à mesurer : l'enquête Histoire de vie et Patrimoine interroge un large échantillon de ménages sur ce qu'ils ont reçu au cours de leur vie. Le patrimoine net médian des ménages qui ont hérité est de ${keur(mh[1])}, contre ${keur(mh[4])} pour l'ensemble des ménages. Plus un ménage est riche, plus il a de chances d'avoir hérité, et d'avoir hérité gros : ${pct(mp[3][4], 0)} des héritages reçus par le quart le mieux doté dépassent 100 000 €, contre ${pct(mp[0][4], 0)} pour le quart le moins doté, où ${pct(mp[0][1], 0)} des héritages font moins de 8 000 €.</p>
    <p class="muted">Limites : les montants sont déclarés par les ménages, à leur valeur au moment de la transmission, sans tenir compte de l'inflation ; l'enquête mesure le fait d'avoir hérité, pas la part du patrimoine actuel qui vient de l'héritage. Une corrélation n'est pas une causalité : les ménages âgés ont à la fois plus hérité et plus épargné.</p>`;
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
    em && [n1(em.emploi_industrie / 1000) + " M", `d'emplois dans l'industrie ; ${pct(em.part_emploi_industrie)} de l'emploi`],
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
