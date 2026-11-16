/* Agriculture, parties 2 à 6 : peut-on être autonome sans intrants ? Rendements, engrais, pesticides, bio, simulateur des céréales (France) */
(() => {
"use strict";
let R = null, SAU = null;
const $ = s => document.querySelector(s);
const f1 = v => v == null ? "–" : v.toLocaleString("fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const n0 = v => Math.round(v).toLocaleString("fr-FR");
const mt = kt => (kt / 1000).toLocaleString("fr-FR", { maximumFractionDigits: 1 }) + " Mt";
const BIO = { ble: [-55, "blé tendre, moyenne 2018-2022"], orge: [-47, "orge d'hiver, 2022"], tournesol: [-28, "2022"] };
const COL = { ble: "#eab308", mais: "#f59e0b", orge: "#ca8a04", colza: "#84cc16", tournesol: "#f97316", pdt: "#a16207", betterave: "#ec4899" };

async function init() {
  if (!window.TH || !window.d3) { setTimeout(init, 100); return; }
  try { R = await fetch("data/rendements.json", { cache: "no-cache" }).then(r => r.json()); } catch (e) { return; }
  try { SAU = (await fetch("data/agriculture.json", { cache: "no-cache" }).then(r => r.json())).sau; } catch (e) { SAU = null; }
  ["in-s", "in-g", "in-r", "in-m"].forEach(id => $("#" + id).addEventListener("input", sim));
  presets();
  let rt; addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(draw, 150); });
  draw();
}

/* blé depuis 1815 : repères historiques + série FAO, avec les trois grandes périodes */
function drawBle() {
  const el = $("#in-ble"); if (!el || !el.clientWidth) return;
  const { showTip, hideTip, css } = window.TH;
  const w = Math.max(320, el.clientWidth), h = 300, m = { t: 26, r: 14, b: 26, l: 44 };
  const x = d3.scaleLinear([1815, R.annee], [m.l, w - m.r]), y = d3.scaleLinear([0, 85], [h - m.b, m.t]);
  const svg = d3.create("svg").attr("viewBox", `0 0 ${w} ${h}`);
  const P = [[1815, 1950, "Sans engrais de synthèse : fumier, jachère, légumineuses", "#a3a3a3"], [1950, 1996, "Engrais, variétés, tracteurs, pesticides", "#65a30d"], [1996, R.annee, "Plafond", "#f59e0b"]];
  P.forEach(([a, b, l, c]) => {
    svg.append("rect").attr("x", x(a)).attr("width", x(b) - x(a)).attr("y", m.t).attr("height", h - m.t - m.b).attr("fill", c).attr("opacity", .09);
    svg.append("text").attr("x", (x(a) + x(b)) / 2).attr("y", m.t - 8).attr("text-anchor", "middle").attr("font-size", w < 560 ? 9 : 11).attr("fill", css("--muted"))
      .text(w < 560 && b - a < 50 ? l.split(",")[0] : l);
  });
  svg.append("g").attr("class", "grid").selectAll("line").data(y.ticks(5)).join("line").attr("x1", m.l).attr("x2", w - m.r).attr("y1", y).attr("y2", y);
  const H = R.hist, last = R.ble[0];
  svg.append("path").attr("fill", "none").attr("stroke", "#a16207").attr("stroke-width", 1.6).attr("stroke-dasharray", "4 3")
    .attr("d", d3.line().x(d => x(d.annee)).y(d => y(d.fr))([...H, last]));
  svg.append("path").attr("fill", "none").attr("stroke", "#eab308").attr("stroke-width", 2.2).attr("d", d3.line().x(d => x(d.annee)).y(d => y(d.fr))(R.ble));
  const g = svg.append("g");
  H.forEach(d => {
    if (d.lo != null) g.append("line").attr("x1", x(d.annee)).attr("x2", x(d.annee)).attr("y1", y(d.lo)).attr("y2", y(d.hi)).attr("stroke", "#a16207").attr("stroke-width", 6).attr("opacity", .35).attr("stroke-linecap", "round");
    g.append("circle").attr("cx", x(d.annee)).attr("cy", y(d.fr)).attr("r", 4.5).attr("fill", "#a16207").style("cursor", "help")
      .on("pointermove", ev => showTip(`<b>vers ${d.annee}</b><br>${f1(d.fr)} q/ha<br><span style="opacity:.8">${d.src}</span>`, ev)).on("pointerleave", hideTip);
  });
  svg.append("g").attr("class", "axis").attr("transform", `translate(0,${h - m.b})`).call(d3.axisBottom(x).tickFormat(d3.format("d")).ticks(w < 560 ? 5 : 10));
  svg.append("g").attr("class", "axis").attr("transform", `translate(${m.l},0)`).call(d3.axisLeft(y).ticks(5).tickFormat(v => v + " q")).call(s => s.select(".domain").remove());
  const bis = d3.bisector(d => d.annee).center;
  svg.append("rect").attr("x", x(1961)).attr("y", m.t).attr("width", w - m.r - x(1961)).attr("height", h - m.t - m.b).attr("fill", "transparent")
    .on("pointermove", ev => { const d = R.ble[bis(R.ble, x.invert(d3.pointer(ev)[0]))]; if (d) showTip(`<b>${d.annee}</b><br>Blé : ${f1(d.fr)} q/ha`, ev); }).on("pointerleave", hideTip);
  el.replaceChildren(svg.node());
}

function presets() {
  const P = [["Aujourd'hui", 0, 50, 25, 0], ["Tout en bio", 100, 50, 25, 0], ["Tout en bio, moitié moins de céréales pour les animaux", 100, 50, 25, 50], ["Comme vers 1850 (≈ 9 q/ha)", 100, 87, 33, 0]];
  $("#in-presets").innerHTML = P.map((p, i) => `<button type="button" class="in-chip" data-i="${i}">${p[0]}</button>`).join("");
  $("#in-presets").querySelectorAll("button").forEach(b => b.onclick = () => {
    const p = P[+b.dataset.i]; ["in-s", "in-g", "in-r", "in-m"].forEach((id, k) => $("#" + id).value = p[k + 1]); sim();
  });
}

function sim() {
  if (!R) return;
  const s = +$("#in-s").value / 100, g = +$("#in-g").value / 100, r = +$("#in-r").value / 100, m = +$("#in-m").value / 100;
  $("#in-s-v").textContent = Math.round(s * 100) + " %"; $("#in-g-v").textContent = (g ? "−" : "") + Math.round(g * 100) + " %";
  $("#in-r-v").textContent = Math.round(r * 100) + " %"; $("#in-m-v").textContent = (m ? "−" : "") + Math.round(m * 100) + " %";
  const C = R.cereales, P0 = C.moy_prod, D0 = C.moy_int, F0 = C.moy_animaux;
  const P = P0 * ((1 - s) + s * (1 - r) * (1 - g)), D = D0 - F0 * m, tx = 100 * P / D, mx = Math.max(P0, D0, P, D);
  const bar = (l, v, c, note) => `<div class="in-sbar"><span class="lab">${l}</span><span class="tr"><span style="width:${(100 * v / mx).toFixed(1)}%;background:${c}"></span></span><b>${mt(v)}</b><small class="muted">${note || ""}</small></div>`;
  $("#in-sim-out").innerHTML = bar("Production de céréales aujourd'hui", P0, "#d6d3d1", `moyenne ${R.cereales_an - 4}-${R.cereales_an}`) +
    bar("Production dans ce scénario", P, tx >= 100 ? "#16a34a" : "#dc2626", `${P < P0 ? "−" : ""}${Math.round(100 * Math.abs(1 - P / P0))} %`) +
    bar("Besoins de la France (alimentation, animaux, semences, industrie)", D, "var(--ink)", m ? `dont animaux : ${mt(F0 * (1 - m))}` : `dont animaux : ${mt(F0)}`) +
    `<p class="in-verdict" style="color:${tx >= 100 ? "var(--pos)" : "var(--neg)"}">${tx >= 100 ? "La France resterait autosuffisante en céréales" : "La France ne couvrirait plus ses besoins en céréales"} : <b>${Math.round(tx)} %</b> de ses besoins ${tx >= 100 ? `(aujourd'hui ${Math.round(100 * P0 / D0)} %). ${tx >= 100 && P - D > 1000 ? `Il resterait ${mt(P - D)} à exporter, contre ${mt(P0 - D0)} aujourd'hui.` : ""}` : `(aujourd'hui ${Math.round(100 * P0 / D0)} %). Il manquerait ${mt(D - P)}, à importer ou à compenser par plus de surface.`}</p>`;
  // azote à remplacer par des légumineuses si l'on se passe des engrais azotés
  const N = R.autonomie_engrais["3102"].usage / 1000, lo = N * s / 200, hi = N * s / 100; // millions d'hectares, à 100-200 kg d'azote fixé par hectare
  $("#in-sim-txt").innerHTML = `<ul>
    <li><b>Le calcul</b> : production = production actuelle × [part conventionnelle + part sans intrants × (1 − part en légumineuses) × (1 − perte de rendement)]. Les légumineuses (luzerne, trèfle, féverole) remplacent l'engrais azoté mais occupent la terre une année sur trois ou quatre ; sous le régime de l'assolement triennal, c'était la jachère qui occupait un tiers des terres.</li>
    <li><b>L'azote est le vrai verrou</b> : l'agriculture française utilise environ ${f1(N / 1000)} million${N >= 2000 ? "s" : ""} de tonnes d'azote minéral par an (${R.engrais_an}). Une légumineuse fixe de l'ordre de 100 à 200 kg d'azote de l'air par hectare et par an : remplacer ${s < 1 ? `la part correspondante (${Math.round(s * 100)} %)` : "tout cet azote"} demanderait environ <b>${f1(lo)} à ${f1(hi)} millions d'hectares</b> de légumineuses${SAU ? `, sur ${f1(SAU / 1e6)} millions d'hectares de surface agricole` : ""}. C'est pourquoi la perte de rendement et la part en légumineuses vont ensemble.</li>
    <li><b>L'élevage est la grande variable</b> : la moitié des céréales consommées en France nourrit des animaux (${mt(F0)} sur ${mt(D0)}). Manger moins de produits animaux libère des céréales, mais l'élevage fournit aussi le fumier, principal engrais du bio.</li>
  </ul>`;
}

function draw() {
  if (!R || !$("#in-ble")) return;
  const { kpis, lineChart, legend, esc } = window.TH;
  const C = R.cultures, ble = C.find(c => c.k === "ble"), E = R.engrais, e0 = E[0], eL = E.at(-1), pk = R.pic_n;
  const pe = R.pesticides, pe0 = pe[0], peL = pe.at(-1), AE = R.autonomie_engrais, Ce = R.cereales;
  const h1850 = R.hist[0].fr, plat = ble.pic5;
  kpis("#in-kpis", [
    ["×" + f1(ble.fin / h1850).replace(",0", ""), [`rendement du blé : ${f1(h1850)} q/ha avant 1850`, `${f1(ble.fin)} q/ha aujourd'hui (${R.annee - 4}-${R.annee})`], "Blé"],
    [Math.round(100 * AE["3102"].production / AE["3102"].usage) + " %", [`de l'azote utilisé est produit en France`, `potasse : aucune production depuis la fin des mines d'Alsace`], "Engrais"],
    ["≈ −55 %", [`rendement du blé en bio`, `−28 % pour le tournesol`], "Bio"],
    [Math.round(100 * Ce.moy_prod / Ce.moy_int) + " %", [`autosuffisance en céréales`, `la moitié des besoins nourrit les animaux`], "Céréales"],
  ]);
  drawBle();
  legend("#in-ble-legend", [["Repères historiques (fourchette en clair)", "#a16207"], ["Série FAO, 1961-" + R.annee, "#eab308"]]);
  const b61 = R.ble[0], b16 = R.ble.find(d => d.annee === 2016), bx = R.ble.reduce((a, d) => d.fr > a.fr ? d : a);
  $("#in-ble-txt").innerHTML = `<ul>
    <li><b>Pendant un siècle et demi, le rendement progresse lentement</b> : de 8 à 10 quintaux par hectare avant 1850 à 12 à 14 avant 1945. Les progrès viennent de l'abandon de la jachère au profit des prairies artificielles (trèfle, luzerne, sainfoin), qui nourrissent plus d'animaux, donc plus de fumier, et enrichissent le sol en azote ; puis des premiers engrais importés (guano, nitrate du Chili, scories et superphosphates).</li>
    <li><b>Puis tout s'accélère après 1950</b> : ${f1(b61.fr)} q/ha en ${b61.annee}, plus de 70 dans les années 1990, environ +1,2 quintal par an pendant quarante ans. Les causes se combinent : engrais azotés de synthèse (procédé Haber-Bosch, 1913, généralisé après guerre), variétés à paille courte qui supportent l'azote sans verser, désherbants et fongicides, tracteurs, drainage, remembrement.</li>
    <li><b>Depuis le milieu des années 1990, le rendement plafonne</b> autour de 70 q/ha (record ${f1(bx.fr)} q/ha en ${bx.annee}), avec des chutes dues au climat : ${f1(b16.fr)} q/ha en 2016 (pluies et manque de lumière au printemps), ${f1(R.ble.at(-1).fr)} en ${R.annee}. Les chercheurs y voient surtout l'effet des sécheresses et des coups de chaleur en fin de cycle, et la baisse des apports d'engrais.</li>
  </ul>`;
  // petits graphiques par culture
  const box = $("#in-cult");
  box.innerHTML = C.map(c => `<div class="in-card"><div class="in-card-h"><b><i style="background:${COL[c.k]}"></i>${esc(c.l)}</b>
      <span><b>×${f1(c.x)}</b> depuis 1961</span></div>
      <div class="in-card-n">${f1(c.debut)} → <b>${f1(c.fin)} ${c.unite}</b> <small class="muted">(meilleure moyenne sur 5 ans : ${f1(c.pic5)}, ${c.pic5_an - 4}-${c.pic5_an})</small></div>
      <div class="chart" id="in-c-${c.k}"></div>
      ${BIO[c.k] ? `<div class="in-card-bio">En bio : <b>${BIO[c.k][0]} %</b> <small class="muted">(${BIO[c.k][1]})</small></div>` : ""}</div>`).join("");
  C.forEach(c => lineChart($("#in-c-" + c.k), c.serie, [{ k: "v", l: c.l, c: COL[c.k] }], { vfmt: v => f1(v) + " " + c.unite, yfmt: v => v, h: 150, xticks: 4 }));
  const g = k => C.find(c => c.k === k);
  $("#in-cult-txt").innerHTML = `<ul>
    <li><b>Toutes les cultures ont vu leur rendement doubler ou presque tripler</b> depuis 1961 : le maïs ×${f1(g("mais").x)}, les pommes de terre ×${f1(g("pdt").x)}, le blé ×${f1(g("ble").x)}, la betterave ×${f1(g("betterave").x)}. Les oléagineux (colza, tournesol) progressent moins : ils ont été moins sélectionnés et sont plus sensibles aux insectes et aux maladies.</li>
    <li><b>Presque toutes plafonnent depuis 10 à 15 ans</b> : la meilleure moyenne sur cinq ans date de 2007-2015 selon les cultures, et le niveau récent est en dessous. Le maïs souffre des sécheresses d'été (2022) ; la betterave a perdu plus d'un quart de rendement en 2020 avec la jaunisse transmise par les pucerons, après l'interdiction des néonicotinoïdes.</li>
  </ul>`;
  // engrais et pesticides
  lineChart($("#in-engrais"), E, [{ k: "n", l: "Azote (N)", c: "#2563eb" }, { k: "p", l: "Phosphore (P₂O₅)", c: "#dc2626" }, { k: "k", l: "Potasse (K₂O)", c: "#7c3aed" }], { vfmt: v => n0(v) + " kg/ha", yfmt: v => v, h: 260 });
  legend("#in-engrais-legend", [["Azote (N)", "#2563eb"], ["Phosphore (P₂O₅)", "#dc2626"], ["Potasse (K₂O)", "#7c3aed"]]);
  lineChart($("#in-pest"), pe, [{ k: "total", l: "Total", c: "var(--ink)" }, { k: "fong", l: "Fongicides", c: "#0ea5e9" }, { k: "herb", l: "Herbicides", c: "#65a30d" }, { k: "inorg", l: "dont cuivre, soufre (minéraux)", c: "#0ea5e9", dash: "4 3" }, { k: "insect", l: "Insecticides", c: "#dc2626" }],
    { vfmt: v => n0(v) + " t", yfmt: v => n0(v / 1000) + " k", h: 260 });
  legend("#in-pest-legend", [["Total", "var(--ink)"], ["Fongicides", "#0ea5e9"], ["dont fongicides minéraux (cuivre, soufre)", "#0ea5e9", 1], ["Herbicides", "#65a30d"], ["Insecticides", "#dc2626"]]);
  const mx = 1.2 * Math.max(...Object.values(AE).map(a => Math.max(a.usage, a.production)));
  $("#in-dep").innerHTML = `<div class="in-dep-row in-dep-head"><span></span><span>Utilisé par l'agriculture</span><span>Produit en France</span></div>` + Object.values(AE).map(a => `<div class="in-dep-row"><span class="lab">${a.nom}</span>
      <span class="tr"><span style="width:${(100 * a.usage / mx).toFixed(1)}%;background:#64748b"></span><b>${n0(a.usage / 1000)}</b></span>
      <span class="tr"><span style="width:${(100 * a.production / mx).toFixed(1)}%;background:#16a34a"></span><b>${a.production ? n0(a.production / 1000) : "0"}</b></span></div>`).join("") +
    `<p class="muted" style="font-size:.78rem;margin:4px 0 0">${R.engrais_an}, milliers de tonnes. La production d'azote utilise du gaz naturel, lui-même importé ; le phosphore produit en France est fabriqué avec des phosphates naturels importés (Maroc surtout).</p>`;
  $("#in-intrants-txt").innerHTML = `<ul>
    <li><b>Les engrais minéraux ont décollé avec les rendements</b> : ${n0(e0.n)} kg d'azote par hectare cultivé en ${e0.annee}, ${n0(pk.n)} au maximum en ${pk.annee}, ${n0(eL.n)} en ${eL.annee}. Le phosphore et la potasse ont été divisés par plus de trois depuis la fin des années 1980 (${n0(pk.p)} → ${n0(eL.p)} kg de P₂O₅, ${n0(pk.k)} → ${n0(eL.k)} kg de K₂O) : les sols avaient été largement enrichis, et les prix ont flambé (2008, 2022).</li>
    <li><b>L'autonomie en engrais n'existe pas</b> : la France produit ${n0(AE["3102"].production / 1000)} 000 tonnes d'azote pour ${n0(AE["3102"].usage / 1000)} 000 tonnes utilisées (${Math.round(100 * AE["3102"].production / AE["3102"].usage)} %), et importe le reste ; ne produit plus de potasse depuis la fermeture des mines d'Alsace (2002) et n'a pas de phosphate. Fabriquer l'azote demande du gaz naturel : les engrais sont une forme d'énergie fossile, et leur prix a flambé en 2021-2022, avec la hausse du gaz puis la guerre en Ukraine.</li>
    <li><b>Les pesticides ont baissé d'environ un tiers depuis 1990</b> en tonnage (${n0(pe0.total / 1000)} 000 t → ${n0(peL.total / 1000)} 000 t), en partie parce que les produits récents agissent à plus petites doses : le tonnage ne mesure pas la toxicité (voir l'indicateur de risque ci-dessous).</li>
    <li><b>Les autres intrants</b> comptent aussi : semences sélectionnées (la France en est le premier exportateur mondial), gazole des tracteurs, aliments importés pour le bétail (tourteaux de soja d'Amérique du Sud), eau d'irrigation.</li>
  </ul>`;
  // bio : rendements comparés pour les cultures où l'écart est publié
  $("#in-bio").innerHTML = `<div class="in-dep-row in-dep-head"><span>Culture</span><span>Rendement conventionnel (${R.annee - 4}-${R.annee}) et rendement bio estimé</span><span class="num">Écart</span></div>` +
    Object.entries(BIO).map(([k, [gap, note]]) => { const c = g(k), b = c.fin * (1 + gap / 100), M = 1.25 * g("ble").fin;
      return `<div class="in-dep-row"><span class="lab">${esc(c.l)}</span><span class="tr in-two"><span style="width:${(100 * c.fin / M).toFixed(1)}%;background:#94a3b8"></span><b>${f1(c.fin)}</b><span style="width:${(100 * b / M).toFixed(1)}%;background:#16a34a"></span><b>≈ ${f1(b)} q/ha en bio</b></span><span class="num"><b>${gap} %</b><br><small class="muted">${note}</small></span></div>`; }).join("") +
    `<p class="muted" style="font-size:.78rem;margin:4px 0 0">Rendement bio estimé = rendement conventionnel moyen récent (FAO) × (1 + écart mesuré par Agreste). Indicatif : l'écart est mesuré certaines années seulement et le conventionnel de la FAO inclut quelques % de bio.</p>`;
  sim();
  const sp = n => `${n} %`, Pb = Ce.moy_prod * 0.375, mEq = Math.max(0, (Ce.moy_int - Pb) / Ce.moy_animaux);
  $("#in-concl").innerHTML = `<p><b>Alors, peut-on être autonome sans intrants ?</b></p><ul>
    <li><b>Sans aucun intrant, comme avant 1850, non</b> : avec 8 à 10 quintaux de blé par hectare, la France ne produirait qu'environ un septième de ses céréales actuelles, loin de ses besoins. Au XIX<sup>e</sup> siècle, il fallait la moitié de la population active aux champs, des millions de chevaux qu'il fallait aussi nourrir, et les disettes restaient possibles.</li>
    <li><b>Tout en bio, pas tout à fait, sauf à manger beaucoup moins de produits animaux</b> : la France part d'une production presque double de ses besoins. Avec un rendement divisé par deux et un quart des terres en légumineuses, elle ne couvrirait plus qu'environ ${sp(Math.round(100 * Pb / Ce.moy_int))} de ses besoins actuels en céréales, ${sp(Math.round(100 * Pb / (Ce.moy_int - Ce.moy_animaux / 2)))} si les animaux en recevaient moitié moins. L'équilibre serait atteint en réduisant d'environ ${sp(Math.round(100 * mEq / 5) * 5)} les céréales données aux animaux (essayez le simulateur). Elle cesserait d'exporter.</li>
    <li><b>Mais le bio n'est pas sans intrants</b> : il dépend du fumier des élevages, de légumineuses qui occupent des terres, de cuivre et de soufre, et de phosphore et potassium qui viennent de roches ou des déchets recyclés. Et tout le monde n'est pas égal : les oléagineux, les fruits et les légumes ne sont déjà couverts qu'à ${R.autres.filter(a => a.taux < 100).map(a => `${a.taux} % (${a.l.toLowerCase()})`).join(", ")}.</li>
    <li><b>La vraie dépendance d'aujourd'hui est ailleurs</b> : la France exporte des céréales, mais importe son azote (sous forme de gaz ou d'engrais), toute sa potasse, tout son phosphate et une grande partie des protéines de ses animaux. Être autonome, ce serait d'abord recycler les éléments nutritifs (fumiers, boues, urine), cultiver plus de légumineuses et réduire le gaspillage.</li>
  </ul>`;
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
