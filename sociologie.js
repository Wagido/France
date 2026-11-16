/* Sociologie électorale : participation, vote par catégorie (Ipsos), carte capital culturel / capital économique */
(() => {
"use strict";
let S = null;
const $ = s => document.querySelector(s);
const n0 = v => Math.round(v).toLocaleString("fr-FR");
const f1 = v => v.toLocaleString("fr-FR", { maximumFractionDigits: 1 });
const sg = v => { const r = Math.round(v); return r === 0 ? "0" : (r > 0 ? "+" : "−") + n0(Math.abs(r)); };

async function init() {
  if (!window.TH || !window.d3) { setTimeout(init, 100); return; }
  if (!$("#el-bars")) return;
  try { S = await fetch("data/sociologie.json", { cache: "no-cache" }).then(r => r.json()); } catch (e) { return; }
  $("#el-elec").onchange = () => { critOptions(); bars(); };
  $("#el-crit").onchange = bars;
  $("#el-carte-elec").onchange = carte;
  $("#el-map-sel").onchange = carteFrance;
  critOptions();
  let rt; addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(draw, 150); });
  draw();
}

function critOptions() {
  const E = S[$("#el-elec").value], cur = $("#el-crit").value || "age";
  $("#el-crit").innerHTML = Object.keys({ ...E.tables, ...(E.tables_plus || {}) }).map(k => `<option value="${k}"${k === cur ? " selected" : ""}>${S.criteres[k]}</option>`).join("");
}

// barres empilées à 100 %
function stack(rows, camps, opts = {}) {
  const { esc } = window.TH;
  return `<div class="el-stack">` + rows.map(r => `<div class="el-row${r.tot ? " el-tot" : ""}"><span class="lab">${esc(r.l)}</span><span class="el-segs">${r.v.map((v, i) =>
    `<span style="flex:${v} 0 0;background:${camps[i][2]};${["#e5e7eb", "#cbd5e1", "#93c5fd"].includes(camps[i][2]) ? "color:#1f2937" : ""}" title="${esc(camps[i][1])} : ${f1(v)} %${r.cand && opts.cand ? "" : ""}">${v >= 7 ? n0(v) : ""}</span>`).join("")}</span></div>`).join("") + `</div>`;
}

function bars() {
  const { legend } = window.TH;
  const k = $("#el-elec").value, E = S[k], c = $("#el-crit").value || "age", T = ({ ...E.tables, ...(E.tables_plus || {}) })[c];
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

/* écarts gauche : pays, avant 1980 et depuis 2000 */
function dumbbell(sel, key, fmt, opts) {
  const { esc } = window.TH, P = S.long.pays.filter(p => p.debut[key] != null || p.fin[key] != null).sort((a, b) => (b.fin[key] ?? -99) - (a.fin[key] ?? -99));
  const vals = P.flatMap(p => [p.debut[key], p.fin[key]]).filter(v => v != null), mx = Math.max(10, ...vals.map(Math.abs));
  const X = v => 50 + 50 * v / mx;
  $(sel).innerHTML = `<div class="el-db">` + P.map(p => { const a = p.debut[key], b = p.fin[key];
    return `<div class="el-db-row${p.nom === "France" ? " me" : ""}"><span class="lab">${esc(p.nom)}</span><span class="el-db-tr"><i class="z"></i>
      ${a != null && b != null ? `<i class="ln" style="left:${Math.min(X(a), X(b))}%;width:${Math.abs(X(b) - X(a))}%"></i>` : ""}
      ${a != null ? `<b class="d0" style="left:${X(a)}%" title="avant 1980 : ${fmt(a)}"></b>` : ""}${b != null ? `<b class="d1" style="left:${X(b)}%" title="depuis 2000 : ${fmt(b)}"></b>` : ""}</span>
      <span class="num">${a != null ? fmt(a) : "n.d."} → <b>${b != null ? fmt(b) : "n.d."}</b></span></div>`; }).join("") +
    `<div class="el-db-row el-db-axe"><span></span><span class="el-db-tr"><small style="left:0">−${n0(mx)}</small><small style="left:50%">0</small><small style="left:100%">+${n0(mx)}</small></span><span></span></div>
    <div class="el-db-row el-db-sens"><span></span><span class="el-db-lbl"><em>← ${opts.gauche}</em><em>${opts.droite} →</em></span><span></span></div></div>`;
}

function sexe() {
  const { legend, lineChart, css } = window.TH, L = S.legislatives2024, P = S.presidentielle2022;
  const rows = [{ l: "2024 · hommes", v: L.tables.sexe[0].v }, { l: "2024 · femmes", v: L.tables.sexe[1].v }];
  $("#el-sexe").innerHTML = stack(rows, L.camps) + `<p class="muted" style="font-size:.78rem;margin:6px 0 2px">Présidentielle 2022 :</p>` +
    stack([{ l: "2022 · hommes", v: P.tables.sexe[0].v }, { l: "2022 · femmes", v: P.tables.sexe[1].v }], P.camps);
  legend("#el-sexe-legend", [...L.camps.slice(0, 4).map(c => [c[1], c[2]]), ["Éric Zemmour (2022)", "#7c3aed"]]);
  const F = S.long.france.filter(r => r.femmes != null);
  lineChart($("#el-sexe-long"), F, [{ k: "femmes", l: "Vote de gauche : femmes moins hommes", c: "#db2777" }], { vfmt: v => sg(v) + " pts", yfmt: v => sg(v), h: 240 });
  dumbbell("#el-sexe-pays", "femmes", v => sg(v), { gauche: "les femmes votent plus à droite que les hommes", droite: "les femmes votent plus à gauche" });
  legend("#el-sexe-pays-legend", [["Avant 1980 (moyenne des élections)", "#a8a29e"], ["Depuis 2000", "#db2777"]]);
  const pos = S.long.pays.filter(p => p.fin.femmes > 2).length, neg = S.long.pays.filter(p => p.fin.femmes < -2).length, nb = S.long.pays.filter(p => p.fin.femmes != null).length;
  const dmin = S.long.pays.filter(p => p.debut.femmes != null && p.debut.femmes < 0).length, nd = S.long.pays.filter(p => p.debut.femmes != null).length;
  const f56 = F[0], fL = F.at(-1), g = n => S.long.pays.find(p => p.nom === n);
  $("#el-sexe-txt").innerHTML = `<ul>
    <li><b>Autrefois, les femmes votaient plus à droite</b> : avant 1980, dans ${dmin} pays sur ${nd}, la gauche faisait moins bien chez les femmes que chez les hommes. En France, l'écart atteignait ${sg(f56.femmes)} points en ${f56.annee} ; en Italie, ${sg(g("Italie").debut.femmes)} points en moyenne. Les explications avancées : une pratique religieuse plus forte chez les femmes, et le fait qu'elles travaillaient moins souvent hors de chez elles (le vote des femmes date de 1944 en France).</li>
    <li><b>Puis l'écart s'est inversé</b> : depuis 2000, les femmes votent plus à gauche que les hommes dans ${pos} pays sur ${nb} (de plus de 2 points), surtout dans les pays nordiques et anglo-saxons (${["Islande", "Norvège", "États-Unis", "Canada", "Nouvelle-Zélande", "Danemark"].map(n => `${n} ${sg(g(n).fin.femmes)}`).join(", ")}). Les politistes parlent du « gender gap moderne » : l'entrée des femmes dans le salariat, notamment dans les services publics, la baisse de la pratique religieuse, l'importance des politiques sociales et d'égalité.</li>
    <li><b>Mais ce n'est pas vrai partout</b> : l'écart est nul ou presque en France (${sg(fL.femmes)} point en ${fL.annee}), en Allemagne, en Espagne, et encore inverse dans ${neg} pays. En France, la différence la plus visible aujourd'hui est ailleurs : les femmes votent un peu moins que les hommes pour l'extrême droite (32 % contre 36 % pour le RN en 2024, 5 % contre 9 % pour Éric Zemmour en 2022). Cet écart s'est beaucoup réduit depuis l'époque de Jean-Marie Le Pen, dont l'électorat était nettement plus masculin.</li>
    <li><b>Chez les jeunes</b>, plusieurs enquêtes récentes dans différents pays décrivent un écart qui se creuse : les jeunes femmes plus à gauche, les jeunes hommes plus à droite. Les enquêtes françaises publiées par sexe et âge ne permettent pas encore de le mesurer de façon fiable.</li>
  </ul>`;
}

function renversement() {
  const { lineChart, legend } = window.TH, F = S.long.france;
  lineChart($("#el-long"), F, [{ k: "diplome", l: "Diplôme : 10 % les plus diplômés moins les 90 % autres", c: "#7c3aed" }, { k: "revenu", l: "Revenu : 10 % les plus riches moins les 90 % autres", c: "#16a34a" }],
    { vfmt: v => sg(v) + " pts", yfmt: v => sg(v), h: 260 });
  legend("#el-long-legend", [["Diplôme : 10 % les plus diplômés − 90 % autres", "#7c3aed"], ["Revenu : 10 % les plus riches − 90 % autres", "#16a34a"]]);
  dumbbell("#el-dip-pays", "diplome", v => sg(v), { gauche: "la gauche fait mieux chez les moins diplômés", droite: "chez les plus diplômés" });
  const a = F[0], b = F.at(-1), up = S.long.pays.filter(p => p.debut.diplome != null && p.fin.diplome != null && p.fin.diplome > p.debut.diplome).length, n = S.long.pays.filter(p => p.debut.diplome != null && p.fin.diplome != null).length;
  $("#el-long-txt").innerHTML = `<ul>
    <li><b>En 1956, la gauche était le vote des moins diplômés</b> : les 10 % les plus diplômés votaient ${sg(a.diplome)} points de moins pour la gauche que les autres. En ${b.annee}, ils votent <b>${sg(b.diplome)} points de plus</b>. La gauche, parti des ouvriers, est devenue celui des diplômés.</li>
    <li><b>Le revenu, lui, n'a pas changé de camp</b> : les plus riches votent toujours moins à gauche que les autres (${sg(b.revenu)} points en ${b.annee}), même si l'écart s'est réduit.</li>
    <li><b>C'est ce que Thomas Piketty appelle la « gauche brahmane » face à la « droite marchande »</b> : les partis de gauche attirent les diplômés (le capital culturel), les partis de droite les hauts revenus et les patrimoines (le capital économique). Les catégories populaires, ni très diplômées ni riches, ne se reconnaissent plus dans aucun des deux, et se tournent vers l'abstention ou les partis nationalistes. Le même renversement s'observe dans ${up} des ${n} démocraties étudiées (Gethin, Martínez-Toledano et Piketty, <i>Quarterly Journal of Economics</i>, 2022).</li>
  </ul>
  <p class="muted" style="font-size:.78rem">Calcul du site à partir de la base WPID : part du vote de gauche chez les 10 % les plus diplômés (ou aux plus hauts revenus), moins la moyenne des 90 % restants. Écarts bruts, sans contrôle des autres variables ; dernière élection disponible : ${b.annee}. <b>Attention</b> : selon les années, la base retient le premier ou le second tour (1988 et 2012 : second tour, la gauche face à la droite), et pour 2017 elle range le vote Emmanuel Macron avec la gauche ; la forte hausse de 2017 chez les diplômés vient donc en partie du vote Macron.</p>`;
}

/* carte des départements et sièges */
let GEO = null;
async function carteFrance() {
  const { showTip, hideTip, css, esc, legend } = window.TH, el = $("#el-map"); if (!el || !S.officiel2024) return;
  if (!GEO) { try { GEO = await fetch("data/departements.geojson").then(r => r.json()); } catch (e) { return; } }
  const O = S.officiel2024, D = Object.fromEntries(O.departements.map(d => [d.code, d])), B = Object.fromEntries(O.blocs.map(b => [b[0], b])), mode = $("#el-map-sel").value;
  const w = Math.max(300, el.clientWidth), h = w * .95;
  const proj = d3.geoConicConformal().parallels([44, 49]).rotate([-3, 0]).fitSize([w, h], GEO), path = d3.geoPath(proj);
  const tete = d => O.blocs.map(b => b[0]).filter(k => k !== "autres").reduce((a, k) => d[k] > d[a] ? k : a, "gauche");
  const vals = O.departements.map(d => d[mode]).filter(v => typeof v === "number");
  const col = mode === "tete" ? d => B[tete(d)][2] : d3.scaleSequential([d3.min(vals), d3.max(vals)], mode === "participation" ? d3.interpolateGreys : t => d3.interpolateRgb("#f1f5f9", (B[mode] || B.extd)[2])(t));
  const svg = d3.create("svg").attr("viewBox", `0 0 ${w} ${h}`);
  svg.append("g").selectAll("path").data(GEO.features).join("path").attr("d", path).attr("stroke", css("--surface")).attr("stroke-width", .6)
    .attr("fill", f => { const d = D[f.properties.code]; return d ? (mode === "tete" ? col(d) : col(d[mode])) : "#ddd"; })
    .on("pointermove", (ev, f) => { const d = D[f.properties.code]; if (!d) return;
      showTip(`<b>${esc(d.nom)}</b><br>${O.blocs.filter(b => b[0] !== "autres").map(b => `<span style="color:${b[2]}">■</span> ${esc(b[1].split(" (")[0])} : ${f1(d[b[0]])} %`).join("<br>")}<br>Participation : ${f1(d.participation)} %`, ev); })
    .on("pointerleave", hideTip);
  el.replaceChildren(svg.node());
  if (mode === "tete") legend("#el-map-legend", O.blocs.filter(b => b[0] !== "autres").map(b => [b[1].split(" (")[0], b[2]]));
  else $("#el-map-legend").innerHTML = `<span>${f1(d3.min(vals))} %</span><span style="display:inline-block;width:120px;height:10px;border-radius:3px;background:linear-gradient(90deg,${col(d3.min(vals))},${col(d3.max(vals))})"></span><span>${f1(d3.max(vals))} %</span>`;
  const nT = k => O.departements.filter(d => tete(d) === k).length;
  $("#el-map-txt").innerHTML = `<ul>
    <li><b>L'extrême droite est arrivée en tête dans ${nT("extd")} départements sur ${O.departements.length}</b> (en comptant l'outre-mer et les Français de l'étranger), surtout dans le nord et l'est, le pourtour méditerranéen, la vallée de la Garonne et les zones rurales et périurbaines. La gauche est en tête dans ${nT("gauche")} départements, ceux des grandes métropoles (Paris, la petite couronne, Haute-Garonne…) et une partie de l'outre-mer ; le centre dans ${nT("centre")}, la droite dans ${nT("droite")}.</li>
    <li><b>Cette géographie recoupe celle des diplômes et de l'emploi</b> : le vote d'extrême droite est le plus fort là où il y a moins de diplômés du supérieur, plus d'ouvriers et d'employés, et où les services et l'emploi sont plus éloignés (voir <a href="#territoire">Territoire</a>).</li>
  </ul>`;
  const mxs = Math.max(...O.sieges.map(x => x.sieges / 5.77), ...O.sieges.map(x => x.voix_t1));
  $("#el-sieges").innerHTML = O.sieges.map(x => `<div class="rt-urne"><span class="lab" style="color:${x.c}"><b>${esc(x.l.split(" (")[0])}</b></span><span class="rt-urne-b">
      <span class="rt-urne-r"><span style="width:${(85 * x.voix_t1 / mxs).toFixed(1)}%;background:${x.c};opacity:.45"></span><b>${f1(x.voix_t1)} % des voix</b></span>
      <span class="rt-urne-r"><span style="width:${(85 * x.sieges / 5.77 / mxs).toFixed(1)}%;background:${x.c}"></span><b>${x.sieges} sièges (${f1(100 * x.sieges / 577)} %)</b></span></span></div>`).join("");
  const ex = O.sieges.find(x => x.k === "extd"), ga = O.sieges.find(x => x.k === "gauche"), ce = O.sieges.find(x => x.k === "centre");
  $("#el-sieges-txt").innerHTML = `<ul>
    <li><b>Arrivée en tête au 1<sup>er</sup> tour avec ${f1(ex.voix_t1)} % des voix, l'extrême droite n'obtient que ${ex.sieges} sièges</b> (${f1(100 * ex.sieges / 577)} %), derrière la gauche (${ga.sieges}) et le centre (${ce.sieges}). C'est l'effet du scrutin majoritaire à deux tours et du « front républicain » : entre les deux tours, plus de 200 candidats de gauche et du centre arrivés troisièmes se sont retirés pour faire barrage au RN. Au second tour, il n'y a eu que ${O.config_t2["3"] || 0} triangulaires et ${O.config_t2["4"] || 0} quadrangulaires, contre ${O.config_t2["2"] || 0} duels.</li>
    <li><b>${f1(O.femmes_elues)} % des députés élus sont des femmes</b> : ${O.sieges.filter(x => x.k !== "autres").map(x => `${esc(x.l.split(" (")[0].toLowerCase())} ${x.femmes_elues} %`).join(", ")}. Tous les partis présentent à peu près autant de femmes que d'hommes (la loi les y oblige, sous peine de pénalités financières), mais les femmes sont plus souvent candidates dans les circonscriptions difficiles.</li>
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
  bars(); carte(); sexe(); renversement(); carteFrance();
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
