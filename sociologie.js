/* Sociologie électorale : participation, vote par catégorie (Ipsos), carte capital culturel / capital économique */
(() => {
"use strict";
let S = null;
const $ = s => document.querySelector(s);
const n0 = v => Math.round(v).toLocaleString("fr-FR");
const f1 = v => v.toLocaleString("fr-FR", { maximumFractionDigits: 1 });
const sg = v => (v > 0 ? "+" : v < 0 ? "−" : "") + n0(Math.abs(v));

async function init() {
  if (!window.TH || !window.d3) { setTimeout(init, 100); return; }
  if (!$("#el-bars")) return;
  try { S = await fetch("data/sociologie.json", { cache: "no-cache" }).then(r => r.json()); } catch (e) { return; }
  $("#el-elec").onchange = () => { critOptions(); bars(); };
  $("#el-crit").onchange = bars;
  $("#el-carte-elec").onchange = carte;
  critOptions();
  let rt; addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(draw, 150); });
  draw();
}

function critOptions() {
  const E = S[$("#el-elec").value], cur = $("#el-crit").value || "age";
  $("#el-crit").innerHTML = Object.keys(E.tables).map(k => `<option value="${k}"${k === cur ? " selected" : ""}>${S.criteres[k]}</option>`).join("");
}

// barres empilées à 100 %
function stack(rows, camps, opts = {}) {
  const { esc } = window.TH;
  return `<div class="el-stack">` + rows.map(r => `<div class="el-row${r.tot ? " el-tot" : ""}"><span class="lab">${esc(r.l)}</span><span class="el-segs">${r.v.map((v, i) =>
    `<span style="flex:${v} 0 0;background:${camps[i][2]};${["#e5e7eb", "#cbd5e1", "#93c5fd"].includes(camps[i][2]) ? "color:#1f2937" : ""}" title="${esc(camps[i][1])} : ${f1(v)} %${r.cand && opts.cand ? "" : ""}">${v >= 7 ? n0(v) : ""}</span>`).join("")}</span></div>`).join("") + `</div>`;
}

function bars() {
  const { legend } = window.TH;
  const k = $("#el-elec").value, E = S[k], c = $("#el-crit").value || "age", T = E.tables[c];
  $("#el-bars").innerHTML = stack([...T, { l: "Ensemble des votants", v: E.ensemble, tot: 1 }], E.camps);
  legend("#el-bars-legend", E.camps.map(x => [x[1], x[2]]));
  $("#el-bars-src").textContent = `${E.titre}, en % des suffrages exprimés de chaque groupe. ${E.source}.`;
  // commentaire automatique : pour chaque camp, le groupe où il fait son meilleur et son plus mauvais score
  const lines = E.camps.map((cp, i) => {
    if (cp[0] === "aut") return "";
    const best = T.reduce((a, b) => b.v[i] > a.v[i] ? b : a), worst = T.reduce((a, b) => b.v[i] < a.v[i] ? b : a);
    return `<li><b style="color:${cp[2]}">${cp[1]}</b> : ${n0(E.ensemble[i])} % au total ; meilleur score chez « ${best.l} » (${n0(best.v[i])} %), plus faible chez « ${worst.l} » (${n0(worst.v[i])} %).</li>`;
  }).join("");
  $("#el-bars-txt").innerHTML = `<ul>${lines}</ul>`;
}

// carte : capital culturel (diplôme) × capital économique (revenu), écarts rapportés au score national
function carte() {
  const { showTip, hideTip, css, esc } = window.TH;
  const el = $("#el-carte"); if (!el || !el.clientWidth) return;
  const k = $("#el-carte-elec").value, E = S[k], D = E.tables.diplome, R = E.tables.revenus;
  const pts = k === "presidentielle2022"
    ? E.candidats.map((n, j) => { const nat = [1.4, 22, 2.3, 4.6, 1.8, 27.8, 4.8, 3.1, 2.1, 23.2, 7.1][j], bloc = E.camps.find((b, i) => [[0, 1, 2, 3, 4], [5], [6, 7, 8], [9], [10]][i].includes(j));
        return { l: n, nat, x: 100 * (R.at(-1).cand[j] - R[0].cand[j]) / nat, y: 100 * (D.at(-1).cand[j] - D[0].cand[j]) / nat, c: bloc[2] }; }).filter(p => p.nat >= 2)
    : E.camps.filter(c => c[0] !== "aut").map(c => { const i = E.camps.indexOf(c), nat = E.ensemble[i];
        return { l: c[1], nat, x: 100 * (R.at(-1).v[i] - R[0].v[i]) / nat, y: 100 * (D.at(-1).v[i] - D[0].v[i]) / nat, c: c[2] }; });
  const w = Math.max(320, el.clientWidth), h = Math.min(520, Math.max(360, w * .55)), m = { t: 20, r: 20, b: 44, l: 56 };
  const ext = Math.max(110, ...pts.map(p => Math.abs(p.x)), ...pts.map(p => Math.abs(p.y))) * 1.1;
  const x = d3.scaleLinear([-ext, ext], [m.l, w - m.r]), y = d3.scaleLinear([-ext, ext], [h - m.b, m.t]);
  const r = d3.scaleSqrt([0, 30], [0, w < 560 ? 26 : 38]);
  const svg = d3.create("svg").attr("viewBox", `0 0 ${w} ${h}`);
  // quadrants
  [["Diplômés, modestes", -1, 1], ["Diplômés, aisés", 1, 1], ["Peu diplômés, modestes", -1, -1], ["Peu diplômés, aisés", 1, -1]].forEach(([l, sx, sy]) =>
    svg.append("text").attr("x", sx < 0 ? m.l + 6 : w - m.r - 6).attr("y", sy > 0 ? m.t + 14 : h - m.b - 8).attr("text-anchor", sx < 0 ? "start" : "end").attr("font-size", 11).attr("fill", css("--faint")).text(l));
  svg.append("g").attr("class", "grid").selectAll("line").data(x.ticks(6)).join("line").attr("x1", x).attr("x2", x).attr("y1", m.t).attr("y2", h - m.b);
  svg.append("g").attr("class", "grid").selectAll("line").data(y.ticks(6)).join("line").attr("x1", m.l).attr("x2", w - m.r).attr("y1", y).attr("y2", y);
  svg.append("line").attr("x1", x(0)).attr("x2", x(0)).attr("y1", m.t).attr("y2", h - m.b).attr("stroke", css("--muted"));
  svg.append("line").attr("x1", m.l).attr("x2", w - m.r).attr("y1", y(0)).attr("y2", y(0)).attr("stroke", css("--muted"));
  svg.append("g").attr("class", "axis").attr("transform", `translate(0,${h - m.b})`).call(d3.axisBottom(x).ticks(6).tickFormat(v => sg(v) + " %"));
  svg.append("g").attr("class", "axis").attr("transform", `translate(${m.l},0)`).call(d3.axisLeft(y).ticks(6).tickFormat(v => sg(v) + " %")).call(s => s.select(".domain").remove());
  svg.append("text").attr("x", (m.l + w - m.r) / 2).attr("y", h - 6).attr("text-anchor", "middle").attr("font-size", 11.5).attr("fill", css("--muted")).text("← vote plus chez les modestes · capital économique · vote plus chez les aisés →");
  svg.append("text").attr("transform", `translate(14,${(m.t + h - m.b) / 2}) rotate(-90)`).attr("text-anchor", "middle").attr("font-size", 11.5).attr("fill", css("--muted")).text("← non-bacheliers · capital culturel · bac +3 →");
  const g = svg.append("g");
  [...pts].sort((a, b) => b.nat - a.nat).forEach(p => {
    g.append("circle").attr("cx", x(p.x)).attr("cy", y(p.y)).attr("r", r(p.nat)).attr("fill", p.c).attr("opacity", .75).attr("stroke", "#fff")
      .on("pointermove", ev => showTip(`<b>${esc(p.l)}</b><br>${f1(p.nat)} % au niveau national<br>Bac +3 / non-bacheliers : ${sg(p.y)} %<br>Plus de 3 000 € / moins de 1 250 € : ${sg(p.x)} %`, ev)).on("pointerleave", hideTip);
    g.append("text").attr("x", x(p.x)).attr("y", y(p.y) - r(p.nat) - 4).attr("text-anchor", "middle").attr("font-size", 11.5).attr("font-weight", 600).attr("fill", css("--ink")).text(p.l);
  });
  el.replaceChildren(svg.node());
  const by = n => pts.find(p => p.l === n);
  $("#el-carte-txt").innerHTML = k === "presidentielle2022" ? `<ul>
    <li><b>Emmanuel Macron est le candidat des aisés</b> : il fait ${sg(by("Macron").x)} % de son score national de plus chez les foyers à plus de 3 000 € que chez ceux à moins de 1 250 €, et il est aussi au-dessus de sa moyenne chez les diplômés.</li>
    <li><b>Marine Le Pen est la candidate des moins diplômés et des modestes</b> : ${sg(by("Le Pen").y)} % sur l'axe du diplôme, ${sg(by("Le Pen").x)} % sur celui du revenu.</li>
    <li><b>Jean-Luc Mélenchon et Yannick Jadot occupent le coin des diplômés aux revenus moyens ou modestes</b> : beaucoup de jeunes, d'étudiants, de professions intellectuelles. C'est le « capital culturel sans capital économique » de Bourdieu.</li>
    <li><b>Le coin « peu diplômés mais aisés »</b> (artisans, commerçants, chefs d'entreprise) est presque vide : Valérie Pécresse et Jean Lassalle sont du côté aisé mais au milieu sur l'axe du diplôme ; Éric Zemmour et Nicolas Dupont-Aignan sont du côté modeste et peu diplômé.</li>
    <li><b>Prudence pour les petits candidats</b> : avec 2 à 5 % des voix, un écart d'un ou deux points dans l'enquête suffit à déplacer fortement la bulle. Seules les positions des grands candidats sont solides.</li>
  </ul>` : `<ul>
    <li><b>Les blocs de 2024 se placent comme les candidats de 2022</b> : Ensemble chez les aisés, le Nouveau Front populaire chez les diplômés aux revenus modestes, le RN chez les moins diplômés et les modestes, LR et divers droite près du centre, un peu du côté aisé.</li>
    <li><b>Le diplôme sépare plus que le revenu</b> : sur l'axe vertical, l'écart entre le NFP (${sg(by("Nouveau Front populaire").y)} %) et le RN (${sg(by("RN et alliés").y)} %) est bien plus grand que sur l'axe horizontal.</li>
  </ul>`;
}

function draw() {
  if (!S) return;
  const { kpis, legend, esc } = window.TH;
  const L = S.legislatives2024, P = S.presidentielle2022, LT = L.tables;
  const g = (T, l) => T.find(r => r.l === l);
  kpis("#el-kpis", [
    [n0(L.votants.age[5][1]) + " %", [`des 70 ans et plus ont voté aux législatives de 2024`, `contre ${n0(L.votants.age[1][1])} % des 25-34 ans`], "Participation"],
    [n0(g(LT.profession, "Ouvriers").v[3]) + " %", [`des ouvriers ont voté RN en 2024`, `${n0(g(LT.profession, "Cadres").v[3])} % des cadres`], "Classe"],
    [n0(g(LT.diplome, "Inférieur au bac").v[3]) + " %", [`des non-bacheliers ont voté RN`, `${n0(g(LT.diplome, "Bac +3 et plus").v[3])} % des bac +3`], "Diplôme"],
    [n0(g(LT.age, "18-24 ans").v[0]) + " %", [`des 18-24 ans ont voté pour le Nouveau Front populaire`, `${n0(g(LT.age, "70 ans et plus").v[1])} % des 70 ans et plus pour Ensemble`], "Âge"],
  ]);
  // Insee : vote systématique / intermittent / abstention
  const C3 = [["sys", "A voté à tous les tours", "#1d4ed8"], ["int", "A voté à certains tours", "#93c5fd"], ["abs", "N'a voté à aucun tour", "#e5e7eb"]];
  $("#el-insee").innerHTML = stack(S.insee_age.map(r => ({ l: r.l, v: [r.systematique, r.intermittent, r.abstention] })), C3);
  legend("#el-insee-legend", C3.map(c => [c[1], c[2]]));
  // Ipsos : part de votants
  const blocks = ["age", "profession", "revenus"].map(k => `<div><h4>${esc(S.criteres[k])}</h4>${L.votants[k].map(([l, v], i) => { const p = P.votants[k][i][1];
    return `<div class="in-sbar el-v"><span class="lab">${esc(l)}</span><span class="tr"><span style="width:${v}%;background:#1d4ed8"></span></span><b>${n0(v)} %</b><small class="muted">${n0(p)} % en 2022</small></div>`; }).join("")}</div>`).join("");
  $("#el-part").innerHTML = `<div class="el-part">${blocks}</div><p class="muted" style="font-size:.78rem">Barres : législatives 2024, 1<sup>er</sup> tour (participation réelle : ${f1(L.participation)} %) ; en gris : présidentielle 2022, 1<sup>er</sup> tour (${f1(P.participation)} %). Enquêtes Ipsos.</p>`;
  $("#el-part-txt").innerHTML = `<ul>
    <li><b>L'âge est le premier facteur de participation</b> : les jeunes votent à la présidentielle, mais beaucoup moins aux législatives ou aux européennes. Seuls 16 % des 18-24 ans ont voté aux quatre tours de 2022, contre plus de 50 % des 70-79 ans.</li>
    <li><b>Les retraités votent le plus</b> (79 % aux législatives de 2024), les ouvriers le moins (54 %). Les foyers modestes s'abstiennent davantage que les foyers aisés. Le corps électoral qui décide est donc plus âgé et plus aisé que la population.</li>
  </ul>`;
  bars(); carte();
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
