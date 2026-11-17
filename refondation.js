/* La refondation : croissance depuis 1950 et frise des champions */
(function () {
const $ = s => document.querySelector(s);
const f1 = v => v.toLocaleString("fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
// [nom, [[début, fin, statut, détail]...]] ; statut : pub (public), fr (privé français), eu (européen), etr (étranger), fin (disparu ou démantelé)
const CH = [
  ["EDF", [[1946, 2004, "pub", "Établissement public, monopole"], [2004, 2023, "pub", "Société anonyme cotée, État à 84 % environ"], [2023, 2026, "pub", "Renationalisée à 100 %"]]],
  ["Renault", [[1945, 1996, "pub", "Régie nationale"], [1996, 2026, "fr", "Privatisée, État à environ 15 % ; alliance avec Nissan"]]],
  ["Elf / Total", [[1966, 1994, "pub", "Elf (ERAP), compagnie publique"], [1994, 2000, "fr", "Elf privatisée"], [2000, 2026, "fr", "Fusion avec TotalFina : TotalEnergies"]]],
  ["Airbus", [[1970, 2000, "eu", "Groupement franco-allemand, avec l'Espagne et le Royaume-Uni"], [2000, 2026, "eu", "EADS puis Airbus, européen, coté"]]],
  ["Thomson / Thales", [[1982, 1997, "pub", "Nationalisé en 1982"], [1997, 2026, "fr", "Thales (défense), État à environ 26 % ; l'électronique grand public vendue (TCL, 2004)"]]],
  ["Rhône-Poulenc / Sanofi", [[1982, 1993, "pub", "Nationalisé en 1982"], [1993, 1999, "fr", "Privatisé"], [1999, 2004, "eu", "Aventis, avec l'allemand Hoechst"], [2004, 2026, "fr", "Absorbé par Sanofi"]]],
  ["Alstom énergie", [[1982, 1987, "pub", "Dans la CGE nationalisée"], [1987, 2014, "fr", "Alsthom, puis Alstom ; État actionnaire de 2004 à 2006"], [2014, 2024, "etr", "Vendu à General Electric"], [2024, 2026, "pub", "Turbines nucléaires Arabelle rachetées par EDF à GE (31 mai 2024, environ 1,2 milliard de dollars) : filiale Arabelle Solutions"]]],
  ["Alcatel", [[1982, 1987, "pub", "CGE nationalisée"], [1987, 2006, "fr", "Alcatel, géant des télécoms"], [2006, 2016, "etr", "Alcatel-Lucent, franco-américain"], [2016, 2026, "etr", "Racheté par Nokia (Finlande)"]]],
  ["Pechiney", [[1982, 1995, "pub", "Nationalisé en 1982"], [1995, 2003, "fr", "Privatisé"], [2003, 2026, "fin", "Racheté par Alcan, puis Rio Tinto : démantelé"]]],
  ["Usinor / Arcelor", [[1981, 1995, "pub", "Usinor-Sacilor, nationalisé"], [1995, 2002, "fr", "Privatisé"], [2002, 2006, "eu", "Arcelor, européen"], [2006, 2026, "etr", "ArcelorMittal, après une offre hostile"]]],
  ["Bull", [[1964, 1982, "etr", "Contrôlé par General Electric puis Honeywell"], [1982, 1997, "pub", "Nationalisé"], [1997, 2014, "fr", "Privatisé"], [2014, 2024, "fr", "Dans Atos"], [2024, 2026, "pub", "Activités stratégiques rachetées par l'État"]]],
  ["Areva", [[2001, 2017, "pub", "Fusion Cogema-Framatome"], [2017, 2026, "fin", "Démantelé : Framatome à EDF, Orano"]]],
  ["Chantiers de l'Atlantique", [[1955, 1976, "fr", "Chantiers de Penhoët"], [1976, 2006, "fr", "Alsthom Atlantique, puis Alstom"], [2006, 2017, "etr", "Aker (Norvège), puis STX (Corée)"], [2017, 2026, "pub", "Repris par l'État"]]],
  ["Lafarge", [[1950, 2015, "fr", "Lafarge, numéro un mondial du ciment"], [2015, 2026, "etr", "Fusion avec le suisse Holcim, siège en Suisse"]]],
];
const COL = { pub: ["Public (État)", "#2563eb"], fr: ["Privé, contrôle français", "#16a34a"], eu: ["Européen", "#7c3aed"], etr: ["Contrôle étranger", "#dc2626"], fin: ["Démantelé, disparu", "#9ca3af"] };
async function init() {
  if (!$("#rf-frise")) return;
  if (!window.TH || !window.d3) { setTimeout(init, 100); return; }
  let S = null; try { S = (await fetch("data/monnaie.json", { cache: "no-cache" }).then(r => r.json())).serie; } catch (e) {}
  window.TH.kpis("#rf-kpis", [
    ["1944", ["programme du CNR, « Les Jours heureux »", "adopté dans la clandestinité"], "Fondation"],
    ["≈ 1 450", ["entreprises d'électricité et de gaz", "fusionnées dans EDF et GDF en 1946"], "Nationalisations"],
    ["5 %/an", ["de croissance moyenne", "de 1950 à 1973"], "Trente Glorieuses"],
    ["58", ["réacteurs nucléaires construits", "en vingt-cinq ans"], "Grands programmes"],
  ]);
  const draw = () => { croiss(S); frise(); };
  let rt; addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(draw, 150); });
  draw();
}
function croiss(S) {
  const el = $("#rf-croiss"); if (!el || !S || !el.clientWidth) return;
  const { showTip, hideTip, css } = window.TH;
  const w = Math.max(320, el.clientWidth), h = 260, m = { t: 30, r: 12, b: 26, l: 40 };
  const x = d3.scaleBand(S.map(d => d.annee), [m.l, w - m.r]).padding(.15), y = d3.scaleLinear([-8, 10], [h - m.b, m.t]);
  const svg = d3.create("svg").attr("viewBox", `0 0 ${w} ${h}`);
  const P = [[1950, 1958, "IVe République, Plans", "#93c5fd"], [1958, 1974, "De Gaulle, Pompidou : grands programmes", "#2563eb"], [1974, 1986, "Chocs pétroliers, nationalisations de 1982", "#f59e0b"], [1986, 2008, "Privatisations, ouverture", "#16a34a"], [2008, 2026, "Crises, désindustrialisation, France 2030", "#7c3aed"]];
  P.forEach(([a, b, l, c], i) => { const xa = x(a) ?? m.l, xb = (x(Math.min(b, S.at(-1).annee)) ?? (w - m.r)) + x.bandwidth();
    svg.append("rect").attr("x", xa).attr("width", xb - xa).attr("y", m.t).attr("height", h - m.t - m.b).attr("fill", c).attr("opacity", .08);
    svg.append("text").attr("x", (xa + xb) / 2).attr("y", m.t - (i % 2 ? 4 : 16)).attr("text-anchor", "middle").attr("font-size", w < 560 ? 8.5 : 10).attr("fill", c).text(w < 560 ? ["Plans", "De Gaulle", "Chocs", "Ouverture", "Crises"][i] : l); });
  svg.append("g").attr("class", "grid").selectAll("line").data(y.ticks(6)).join("line").attr("x1", m.l).attr("x2", w - m.r).attr("y1", y).attr("y2", y);
  svg.append("g").selectAll("rect.b").data(S).join("rect").attr("x", d => x(d.annee)).attr("width", x.bandwidth()).attr("y", d => y(Math.max(0, d.reel))).attr("height", d => Math.abs(y(d.reel) - y(0))).attr("fill", d => d.reel < 0 ? "#dc2626" : "#2563eb")
    .on("pointermove", (ev, d) => showTip(`<b>${d.annee}</b><br>Croissance en volume : ${f1(d.reel)} %`, ev)).on("pointerleave", hideTip);
  svg.append("g").attr("class", "axis").attr("transform", `translate(0,${h - m.b})`).call(d3.axisBottom(x).tickValues(S.map(d => d.annee).filter(a => a % (w < 560 ? 10 : 5) === 0)));
  svg.append("g").attr("class", "axis").attr("transform", `translate(${m.l},0)`).call(d3.axisLeft(y).ticks(6).tickFormat(v => v + " %")).call(s => s.select(".domain").remove());
  el.replaceChildren(svg.node());
  const moy = (a, b) => { const v = S.filter(d => d.annee >= a && d.annee <= b); return v.reduce((s, d) => s + d.reel, 0) / v.length; };
  $("#rf-croiss-txt").innerHTML = `<ul>
    <li><b>De 1950 à 1973, ${f1(moy(1950, 1973))} % par an en moyenne</b> : l'économie double en moins de quinze ans. C'est le temps du Plan, du crédit dirigé et des grands programmes.</li>
    <li><b>Après le premier choc pétrolier, ${f1(moy(1974, 1990))} % par an de 1974 à 1990</b>, puis ${f1(moy(1991, 2007))} % de 1991 à 2007 et ${f1(moy(2008, S.at(-1).annee))} % depuis 2008.</li>
    <li><b>Attention à la causalité</b> : la croissance des années 1950-1960 vient aussi de la reconstruction, du rattrapage technique des États-Unis, de l'exode rural vers des emplois plus productifs, du pétrole bon marché et du baby-boom. Les pays voisins sans planification ont crû aussi vite. Le Plan a orienté cette croissance ; il ne l'a pas créée seul.</li>
  </ul>`;
}
function frise() {
  const el = $("#rf-frise"); if (!el || !el.clientWidth) return;
  const { showTip, hideTip, css, legend } = window.TH;
  const w = Math.max(320, el.clientWidth), lw = w < 560 ? 110 : 190, rh = 22, m = { t: 6, r: 10, b: 26, l: lw };
  const h = m.t + m.b + CH.length * rh;
  const x = d3.scaleLinear([1940, 2026], [m.l, w - m.r]);
  const svg = d3.create("svg").attr("viewBox", `0 0 ${w} ${h}`);
  svg.append("g").attr("class", "grid").selectAll("line").data(d3.range(1950, 2030, 10)).join("line").attr("x1", x).attr("x2", x).attr("y1", m.t).attr("y2", h - m.b);
  CH.forEach(([n, segs], i) => {
    const yy = m.t + i * rh;
    svg.append("text").attr("x", m.l - 6).attr("y", yy + rh / 2 + 4).attr("text-anchor", "end").attr("font-size", w < 560 ? 9.5 : 11).attr("fill", css("--ink")).text(n);
    segs.forEach(([a, b, st, d]) => svg.append("rect").attr("x", x(a)).attr("width", Math.max(1, x(b) - x(a) - 1)).attr("y", yy + 3).attr("height", rh - 6).attr("rx", 3).attr("fill", COL[st][1])
      .on("pointermove", ev => showTip(`<b>${n}</b>, ${a}-${b === 2026 ? "aujourd'hui" : b}<br>${COL[st][0]}<br>${d}`, ev)).on("pointerleave", hideTip));
  });
  svg.append("g").attr("class", "axis").attr("transform", `translate(0,${h - m.b})`).call(d3.axisBottom(x).tickValues(d3.range(1950, 2030, w < 560 ? 20 : 10)).tickFormat(d3.format("d")));
  el.replaceChildren(svg.node());
  legend("#rf-frise-legend", Object.values(COL));
}
init();
})();
