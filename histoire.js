/* Un siècle de franc : inflation, solde budgétaire, exportations et cours du dollar, 1900-aujourd'hui, avec les dévaluations */
(() => {
"use strict";
let L = null;
const SRC = {
  univ: ["Encyclopædia Universalis, « Franc français »", "https://www.universalis.fr/encyclopedie/franc-francais/"],
  herodote28: ["Hérodote, « 25 juin 1928 »", "https://www.herodote.net/25_juin_1928-evenement-19280625.php"],
  larousse: ["Larousse, « franc »", "https://www.larousse.fr/encyclopedie/divers/franc/53409"],
  bdf: ["Banque de France, Webstat", "https://webstat.banque-france.fr/api/datasets/1.0/tableaux_rapports_preetablis/images/8d39b3ec2cdd5733dd198516131b7df9"],
  time49: ["Time", "https://content.time.com/time/magazine/article/0,9171,809720,00.html"],
  rueff: ["voir l'encadré sur le plan Rueff", "#rueff"],
  d28: ["voir l'encadré sur 1914-1928", "#deval1928"],
  d36: ["voir l'encadré sur 1936-1938", "#deval1936"],
  d48: ["voir l'encadré sur 1945-1949", "#deval1948"],
  d69: ["voir l'encadré sur 1969", "#deval1969"],
  d82: ["voir l'encadré sur 1981-1983", "#deval1982"],
};
// [année, étiquette courte, description, source]
const EV = [
  [1914, "1914", "Première Guerre mondiale : fin de la convertibilité du franc en or, la guerre est financée par l'emprunt et la Banque de France.", "univ"],
  [1928, "1928", "Franc Poincaré : retour à l'or après l'inflation des années 1920, à un cinquième de la valeur d'avant-guerre (dévaluation des 4/5).", "d28"],
  [1936, "1936", "Front populaire : dévaluation (loi du 1er octobre 1936), suivie de nouvelles baisses en 1937 et 1938.", "d36"],
  [1945, "1945", "Libération : nouvelle parité du franc, puis dévaluations de 1948 et 1949 (350 francs pour un dollar).", "d48"],
  [1949, "1949", "Le franc est fixé à 350 francs pour un dollar.", "time49"],
  [1958, "1958", "Plan Rueff : dévaluation, rigueur et nouveau franc.", "rueff"],
  [1969, "1969", "Dévaluation de 11,1 % décidée par Georges Pompidou.", "d69"],
  [1981, "81-83", "Trois dévaluations (1981, 1982, 1983), puis le tournant de la rigueur.", "d82"],
  [1999, "1999", "L'euro remplace le franc (6,55957 francs pour un euro) : plus de dévaluation possible.", "univ"],
];
async function init() {
  if (!window.TH) { setTimeout(init, 100); return; }
  try { L = (await fetch("data/histoire.json").then(r => r.json())).longue; } catch (e) { return; }
  let rt; addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(draw, 150); });
  draw();
}
function draw() {
  const el = document.getElementById("hist-long"); if (!L || !el) return;
  const { showTip, hideTip, n1, esc } = window.TH;
  const w = Math.max(320, el.clientWidth), narrow = w < 640;
  const m = { t: 34, r: 14, l: 46, gap: 44 }, h1 = narrow ? 230 : 280, h2 = narrow ? 150 : 170, H = m.t + h1 + m.gap + h2 + 28;
  const x = d3.scaleLinear([1900, L.at(-1).annee], [m.l, w - m.r]);
  const clip = (v, a, b) => v == null ? null : Math.max(a, Math.min(b, v));
  const y1 = d3.scaleLinear([-30, 60], [m.t + h1, m.t]);
  const y2 = d3.scaleLog([0.04, 10], [m.t + h1 + m.gap + h2, m.t + h1 + m.gap]);
  const svg = d3.create("svg").attr("viewBox", `0 0 ${w} ${H}`);
  // grilles
  svg.append("g").attr("class", "grid").selectAll("line").data(y1.ticks(6)).join("line").attr("x1", m.l).attr("x2", w - m.r).attr("y1", y1).attr("y2", y1);
  svg.append("g").attr("class", "grid").selectAll("line").data([0.05, 0.1, 0.5, 1, 5, 10]).join("line").attr("x1", m.l).attr("x2", w - m.r).attr("y1", y2).attr("y2", y2);
  // événements
  const evg = svg.append("g");
  EV.forEach(([yr, lab], i) => {
    const cx = x(yr);
    evg.append("line").attr("x1", cx).attr("x2", cx).attr("y1", m.t - 8).attr("y2", m.t + h1 + m.gap + h2).attr("stroke", "#7c3aed").attr("stroke-width", 1.2).attr("stroke-dasharray", "3 3").attr("opacity", .8);
    evg.append("text").attr("x", cx).attr("y", m.t - 12 - (narrow && i % 2 ? 11 : 0)).attr("text-anchor", "middle").attr("font-size", 10.5).attr("font-weight", 600).style("fill", "#7c3aed").text(lab);
  });
  // solde budgétaire (barres)
  const bw = Math.max(1, (x(1901) - x(1900)) * .75);
  svg.append("g").selectAll("rect").data(L.filter(d => d.solde_public != null)).join("rect")
    .attr("x", d => x(d.annee) - bw / 2).attr("width", bw).attr("y", d => y1(Math.max(0, clip(d.solde_public, -30, 60)))).attr("height", d => Math.abs(y1(clip(d.solde_public, -30, 60)) - y1(0))).attr("fill", "#94a3b8").attr("opacity", .7);
  // courbes du panneau haut
  const line = (k, c, wd) => svg.append("path").attr("fill", "none").attr("stroke", c).attr("stroke-width", wd)
    .attr("d", d3.line().defined(d => d[k] != null).x(d => x(d.annee)).y(d => y1(clip(d[k], -30, 60)))(L));
  line("exportations_pib", "#16a34a", 2);
  line("inflation", "#dc2626", 2);
  svg.append("line").attr("x1", m.l).attr("x2", w - m.r).attr("y1", y1(0)).attr("y2", y1(0)).attr("stroke", "currentColor").attr("opacity", .35);
  // dépassements d'échelle
  L.filter(d => d.inflation > 60).forEach(d => svg.append("text").attr("x", x(d.annee)).attr("y", m.t - 1).attr("text-anchor", "middle").attr("font-size", 9).style("fill", "#dc2626").text(Math.round(d.inflation) + " %"));
  // panneau bas : prix du dollar (échelle logarithmique)
  svg.append("path").attr("fill", "none").attr("stroke", "#0f172a").attr("stroke-width", 2).style("stroke", "var(--ink)")
    .attr("d", d3.line().defined(d => d.dollar).x(d => x(d.annee)).y(d => y2(d.dollar)).curve(d3.curveStepAfter)(L));
  // axes
  svg.append("g").attr("class", "axis").attr("transform", `translate(${m.l},0)`).call(d3.axisLeft(y1).ticks(6).tickFormat(v => v + " %")).call(g => g.select(".domain").remove());
  svg.append("g").attr("class", "axis").attr("transform", `translate(${m.l},0)`).call(d3.axisLeft(y2).tickValues([0.05, 0.1, 0.5, 1, 5, 10]).tickFormat(v => String(v).replace(".", ","))).call(g => g.select(".domain").remove());
  svg.append("g").attr("class", "axis").attr("transform", `translate(0,${m.t + h1 + m.gap + h2})`).call(d3.axisBottom(x).ticks(narrow ? 6 : 13).tickFormat(d3.format("d")));
  svg.append("text").attr("x", m.l + 4).attr("y", m.t + h1 + m.gap - 12).attr("font-size", 11).attr("font-weight", 600).style("fill", "var(--muted)").text("Prix d'un dollar en francs (échelle logarithmique, nouveaux francs)");
  // infobulle
  svg.append("rect").attr("x", m.l).attr("y", m.t).attr("width", w - m.l - m.r).attr("height", h1 + m.gap + h2).attr("fill", "transparent")
    .on("pointermove", ev => {
      const yr = Math.round(x.invert(d3.pointer(ev)[0])), d = L.find(r => r.annee === yr); if (!d) return;
      const e = EV.find(k => k[0] === yr), f = (v, s = " %") => v == null ? "–" : (v > 0 && s === " %" ? "+" : "") + n1(v) + s;
      showTip(`<b>${yr}</b>${e ? `<br><span style="color:#a78bfa">${esc(e[2])}</span>` : ""}<br>Inflation : ${f(d.inflation)}<br>Solde budgétaire : ${f(d.solde_public)} du PIB<br>Exportations : ${d.exportations_pib == null ? "–" : n1(d.exportations_pib) + " %"} du PIB<br>Un dollar : ${d.dollar == null ? "–" : String(d.dollar.toFixed(d.dollar < 1 ? 3 : 2)).replace(".", ",")} franc${d.dollar >= 2 ? "s" : ""}`, ev);
    }).on("pointerleave", hideTip);
  el.replaceChildren(svg.node());
  el.insertAdjacentHTML("beforeend", `<div class="legend-row"><span><i style="border-top-color:#dc2626;opacity:1"></i>Inflation (prix à la consommation)</span><span><i style="border-top-color:#16a34a;opacity:1"></i>Exportations (% du PIB)</span><span><i style="border-top-color:#94a3b8;border-top-width:10px;width:14px;opacity:.8"></i>Solde budgétaire (% du PIB)</span><span><i style="border-top-color:var(--ink);opacity:1"></i>Prix d'un dollar en francs</span><span><i style="border-top-color:#7c3aed;border-top-style:dashed;opacity:1"></i>Dévaluations et changements de régime</span></div>
    <ul class="prose-list hist-ev">${EV.map(([yr, lab, txt, s]) => `<li><b>${lab === "81-83" ? "1981-1983" : yr}</b> : ${esc(txt)} <a href="${SRC[s][1]}"${SRC[s][1].startsWith("#") ? "" : ' target="_blank" rel="noopener"'}>${esc(SRC[s][0])}</a></li>`).join("")}</ul>
    <p class="muted" style="font-size:.76rem;margin:4px 0 0">Données : Jordà, Schularick et Taylor, <a href="https://www.macrohistory.net/database/" target="_blank" rel="noopener">Macrohistory Database</a> (1900-2017, licence CC BY-NC-SA, via le dépôt public <a href="https://github.com/unbalancedparentheses/forex-centuries" target="_blank" rel="noopener">forex-centuries</a>) ; INSEE pour les exportations depuis 1949 ; Eurostat pour l'inflation depuis 2018 et le cours euro-dollar depuis 1999 ; comptes publics depuis 1995. Avant 1995, le solde est celui du budget de l'État. De 1945 à 1949, le cours du dollar de la base est un cours de marché, plus élevé que les parités officielles (119, puis 214 et 350 anciens francs). Échelle coupée à −30 % et +60 % : les inflations supérieures sont indiquées en haut.</p>`);
  zoomExport(el);
  dollarReel(el);
}
/* le dollar en francs, corrigé de l'écart d'inflation entre la France et les États-Unis */
function dollarReel(host) {
  const { lineChart, legend, n1 } = window.TH;
  const R = L.filter(r => r.dollar_reel != null);
  const nom0 = L.find(r => r.annee === 1950).dollar;
  const rows = R.map(r => ({ annee: r.annee, reel: r.dollar_reel, nominal: r.dollar ? Math.round(1000 * r.dollar / nom0) / 10 : null }));
  const a = R[0], b = R.at(-1), hors = R.filter(r => r.annee < 1944 || r.annee > 1949), mx = hors.reduce((p, r) => r.dollar_reel > p.dollar_reel ? r : p), mn = hors.reduce((p, r) => r.dollar_reel < p.dollar_reel ? r : p);
  const box = document.createElement("div");
  box.innerHTML = `<h4 style="margin:22px 0 4px">Le dollar en francs, corrigé de l'inflation (indice 100 en 1950)</h4>
    <p class="muted" style="font-size:.84rem;margin:0 0 6px">Cours du dollar multiplié par les prix américains et divisé par les prix français. Au-dessus de 100, le franc est « bon marché » : les produits français sont moins chers pour les Américains qu'en 1950.</p>
    <div id="hist-reel" class="chart"></div><div class="legend-row" id="hist-reel-legend"></div>
    <div class="callout small"><ul>
      <li><b>En apparence, le franc s'est effondré</b> : il fallait ${String(a.dollar).replace(".", ",")} franc (nouveau) pour un dollar en ${a.annee}, et environ ${n1(b.dollar)} en ${b.annee}, soit plus de cent fois plus.</li>
      <li><b>Corrigé de l'inflation, il n'a presque pas bougé sur un siècle</b> : l'indice va de ${Math.round(mn.dollar_reel)} (${mn.annee}) à ${Math.round(mx.dollar_reel)} (${mx.annee}), sans tendance (en laissant de côté 1944-1949, où le cours du dollar de la base est un cours de marché d'après-guerre). La France a eu plus d'inflation que les États-Unis, et les dévaluations n'ont fait, pour l'essentiel, que rattraper cet écart.</li>
      <li><b>C'est pour cela que l'effet d'une dévaluation est temporaire</b> : elle fait monter l'indice d'un coup (produits français moins chers), puis l'inflation plus forte en France le fait redescendre en quelques années. Seule une inflation tenue durablement, par la rigueur, permet d'en garder le bénéfice.</li>
      <li><b>Depuis l'euro</b>, le cours varie surtout avec l'euro face au dollar : un dollar fort (2000-2001, 2022-2024) rend les produits français moins chers à l'export ; un dollar faible (2008) les renchérit.</li>
    </ul></div>`;
  host.appendChild(box);
  lineChart(document.getElementById("hist-reel"), rows, [{ k: "reel", l: "Dollar corrigé de l'inflation", c: "#7c3aed" }], { vfmt: x => n1(x), yfmt: x => x, h: 260, nozero: true });
  legend("#hist-reel-legend", [["Dollar en francs, corrigé de l'écart d'inflation (indice 100 en 1950)", "#7c3aed"]]);
}

/* zoom : les exportations avant et après chaque dévaluation (écart en points de PIB par rapport à l'année de la dévaluation) */
function zoomExport(host) {
  const { lineChart, legend, n1 } = window.TH;
  const D = [[1936, "#94a3b8"], [1958, "#7c3aed"], [1969, "#16a34a"], [1982, "#e07b39"]];
  const v = (y) => L.find(r => r.annee === y)?.exportations_pib;
  const rows = [-2, -1, 0, 1, 2, 3, 4].map(t => Object.assign({ t }, ...D.map(([d]) => ({ ["d" + d]: v(d + t) != null && v(d) != null ? Math.round((v(d + t) - v(d)) * 10) / 10 : null }))));
  const box = document.createElement("div");
  box.innerHTML = `<h4 style="margin:18px 0 4px">Zoom : les exportations avant et après chaque dévaluation</h4>
    <p class="muted" style="font-size:.84rem;margin:0 0 6px">Écart des exportations (en points de PIB) par rapport à l'année de la dévaluation, notée 0.</p>
    <div id="hist-zoom" class="chart"></div><div class="legend-row" id="hist-zoom-legend"></div>
    <div class="callout small"><ul>
      <li><b>L'effet existe, mais il est modeste et lent</b> : après 1958, 1969 et 1982, les exportations gagnent 2 à 3 points de PIB en deux ans. Sur le grand graphique, dont l'échelle va jusqu'à 60 %, cela ne se voit presque pas.</li>
      <li><b>Il faut un ou deux ans</b> : les contrats en cours sont signés aux anciens prix, et les acheteurs étrangers mettent du temps à changer de fournisseur. Au début, une dévaluation renchérit même les importations avant d'aider les exportations.</li>
      <li><b>L'inflation peut tout effacer</b> : en 1936, les prix ont augmenté de 26 % l'année suivante ; l'avantage de prix gagné par la dévaluation a disparu, et les exportations n'ont presque pas bougé. Les dévaluations réussies (1958, 1969) ont été accompagnées d'un plan de rigueur qui a contenu les prix et les salaires.</li>
      <li><b>Le contexte domine parfois</b> : en 1928-1932, la crise mondiale a fait chuter le commerce partout ; en 1945-1949, la remontée vient de la reconstruction. Ces deux épisodes ne sont pas tracés ici.</li>
    </ul></div>`;
  host.appendChild(box);
  lineChart(document.getElementById("hist-zoom"), rows.map(r => ({ ...r, annee: r.t })), D.map(([d, c]) => ({ k: "d" + d, l: String(d), c })),
    { vfmt: x => (x > 0 ? "+" : "") + n1(x) + " pt", yfmt: x => (x > 0 ? "+" : "") + x, h: 240, nozero: true, xticks: 6 });
  legend("#hist-zoom-legend", D.map(([d, c]) => [`Dévaluation de ${d}`, c]));
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
