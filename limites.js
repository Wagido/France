/* Les limites à la croissance : scénarios World3 recalculés et données mondiales observées */
(() => {
"use strict";
let L = null;
const $ = s => document.querySelector(s);
const f1 = v => v == null ? "–" : v.toLocaleString("fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const n0 = v => Math.round(v).toLocaleString("fr-FR");
const COL = { bau: "#dc2626", bau2: "#f59e0b", obs: "var(--ink)" };
const COURT = { bau: "Scénario de 1972", bau2: "Ressources doublées" };

async function init() {
  if (!window.TH || !window.d3) { setTimeout(init, 100); return; }
  try { L = await fetch("data/limites.json", { cache: "no-cache" }).then(r => r.json()); } catch (e) { return; }
  let rt; addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(draw, 150); });
  draw();
}

// fusionne modèle et observations par année, pour lineChart
function merge(ind, raw) {
  const by = {};
  Object.entries(ind.modele).forEach(([k, s]) => s.forEach(r => { (by[r.annee] = by[r.annee] || { annee: r.annee })[k] = raw ? raw(r.v, k) : r.v; }));
  ind.obs.forEach(r => { (by[r.annee] = by[r.annee] || { annee: r.annee }).obs = raw ? raw(r.v, "obs") : r.v; });
  return Object.values(by).sort((a, b) => a.annee - b.annee);
}

// trait vertical « aujourd'hui »
function today(el, y0 = 1960, y1 = 2100) {
  const svg = el.querySelector("svg"); if (!svg) return;
  const [, , w, h] = svg.getAttribute("viewBox").split(" ").map(Number), m = { l: 56, r: 14, t: 12, b: 26 };
  const x = m.l + (2025 - y0) / (y1 - y0) * (w - m.l - m.r);
  d3.select(svg).insert("line", ":first-child").attr("x1", x).attr("x2", x).attr("y1", m.t).attr("y2", h - m.b).attr("stroke", "var(--faint)").attr("stroke-dasharray", "2 3");
  d3.select(svg).append("text").attr("x", x + 4).attr("y", m.t + 10).attr("font-size", 10).attr("fill", "var(--muted)").text("aujourd'hui");
}

function draw() {
  if (!L || !$("#li-grid")) return;
  const { kpis, lineChart, legend, esc } = window.TH;
  const I = Object.fromEntries(L.indicateurs.map(i => [i.k, i])), P = L.pics;
  const lines = [{ k: "bau", l: COURT.bau, c: COL.bau }, { k: "bau2", l: COURT.bau2, c: COL.bau2 }, { k: "obs", l: "Données observées", c: COL.obs }];
  // ensemble : population en milliards (le modèle et la réalité en niveau), production industrielle (modèle seul)
  const pop = I.pop, popObs = Object.fromEntries(pop.obs.map(o => [o.annee, o.v]));
  const pop2000 = pop.dernier.brut / (popObs[pop.dernier.annee] / 100);   // population observée en 2000
  lineChart($("#li-pop"), merge(pop, v => v * pop2000 / 100 / 1e9), lines, { vfmt: v => f1(v) + " Md", yfmt: v => v, h: 240 });
  today($("#li-pop"));
  lineChart($("#li-io"), merge({ modele: I.iopc.modele, obs: [] }), lines.slice(0, 2), { vfmt: v => n0(v), yfmt: v => v, h: 240 });
  today($("#li-io"));
  legend("#li-legend", [[COURT.bau, COL.bau], [COURT.bau2, COL.bau2], ["Données observées (indice, base 100 en 2000)", COL.obs]]);
  // petits graphiques
  const ordre = ["pop", "cbr", "cdr", "le", "fpc", "iopc", "sopc", "nrur", "ppolx"];
  $("#li-grid").innerHTML = ordre.map(k => { const i = I[k], e = i.ecart, best = e.bau2 < e.bau ? "bau2" : "bau";
    return `<div class="in-card"><div class="in-card-h"><b>${esc(i.l.split(" (")[0])}</b></div>
      <div class="in-card-n muted" style="font-size:.78rem">${esc(i.l.includes("(") ? "(" + i.l.split(" (").slice(1).join(" (") : "")}</div>
      <div class="chart" id="li-c-${k}"></div>
      <div class="in-card-bio" style="color:var(--muted)">Écart moyen depuis 2000 : <b style="color:${COL.bau}">${f1(e.bau)} %</b> avec le scénario de 1972, <b style="color:#b45309">${f1(e.bau2)} %</b> avec « ressources doublées » → plus proche : <b>${COURT[best].toLowerCase()}</b></div></div>`; }).join("");
  ordre.forEach(k => { lineChart($("#li-c-" + k), merge(I[k]), lines, { vfmt: v => n0(v), yfmt: v => v, h: 170, xticks: 4 }); today($("#li-c-" + k)); });
  legend("#li-legend2", [[COURT.bau, COL.bau], [COURT.bau2, COL.bau2], ["Données observées", COL.obs]]);
  const nb2 = ordre.filter(k => I[k].ecart.bau2 < I[k].ecart.bau).length;
  const moy = s => ordre.reduce((a, k) => a + I[k].ecart[s], 0) / ordre.length;
  kpis("#li-kpis", [
    [`${nb2} sur ${ordre.length}`, ["indicateurs plus proches du scénario", "« ressources doublées » que de celui de 1972"], "Comparaison"],
    [f1(pop.dernier.brut / 1e9) + " Md", [`habitants en ${pop.dernier.annee}`, `modèle : ${f1(P.bau.pop_2025)} (1972), ${f1(P.bau2.pop_2025)} (ressources doublées)`], "Population"],
    [String(P.bau2.iopc), ["pic de la production industrielle par habitant", `dans le scénario « ressources doublées » (${P.bau.iopc} dans celui de 1972)`], "Pic"],
    [f1(P.bau2.pop_max) + " Md", [`population maximale vers ${P.bau2.pop}`, `puis ${f1(P.bau2.pop_2100)} Md en 2100 (ressources doublées)`], "Si rien ne change"],
  ]);
  const io = I.iopc, fpc = I.fpc, cbr = I.cbr, cdr = I.cdr, le = I.le;
  $("#li-txt").innerHTML = `<ul>
    <li><b>Population</b> : la réalité (${f1(pop.dernier.brut / 1e9)} milliards en ${pop.dernier.annee}) suit de près les deux scénarios jusqu'ici (écart moyen ${f1(pop.ecart.bau)} % et ${f1(pop.ecart.bau2)} %). La natalité et la mortalité ont suivi des trajectoires proches des scénarios (écarts de ${f1(Math.min(cbr.ecart.bau, cbr.ecart.bau2))} % et ${f1(Math.min(cdr.ecart.bau, cdr.ecart.bau2))} % avec le plus proche).</li>
    <li><b>Production industrielle et services par habitant</b> : c'est là que le scénario de 1972 se trompe le plus. Il prévoyait un pic de la production industrielle par habitant vers ${P.bau.iopc} puis un recul ; elle a continué d'augmenter (écart moyen de ${f1(io.ecart.bau)} %). Le scénario « ressources doublées », avec un pic vers ${P.bau2.iopc}, colle mieux (${f1(io.ecart.bau2)} %).</li>
    <li><b>Nourriture par habitant</b> : la production alimentaire a augmenté plus vite que dans les deux scénarios (écart ${f1(fpc.ecart.bau2)} % au mieux), grâce aux engrais, à l'irrigation et aux variétés améliorées (voir <a href="#agriculture">Agriculture</a>).</li>
    <li><b>Ressources et pollution</b> : la consommation d'énergies fossiles et le CO₂ accumulé continuent d'augmenter, à peu près comme dans les deux scénarios jusqu'ici (écarts de ${f1(I.nrur.ecart.bau2)} et ${f1(I.ppolx.ecart.bau2)} %). C'est leur suite qui décide de tout : dans le modèle, la pollution et le coût croissant des ressources finissent par faire baisser la production.</li>
    <li><b>Espérance de vie</b> : en indice, la réalité suit les scénarios, mais en niveau le modèle de 1974 est loin du compte (il donne ${f1(P.bau.le_2025)} ans en 2025, contre ${f1(le.dernier.brut)} ans observés) : le modèle n'est pas fait pour prévoir des niveaux précis.</li>
  </ul>`;
  $("#li-concl").innerHTML = `<ul>
    <li><b>Le scénario de 1972 n'a pas eu lieu à la date prévue</b>, mais la trajectoire réelle ressemble à celle d'un scénario voisin, avec plus de ressources. Les études récentes (Herrington, Nebel) disent la même chose : les données ne contredisent pas l'idée d'un dépassement suivi d'un déclin au XXI<sup>e</sup> siècle, elles le décalent de dix à vingt ans.</li>
    <li><b>Dans le scénario « ressources doublées »</b>, la production industrielle par habitant culmine vers ${P.bau2.iopc}, la population vers ${P.bau2.pop} à ${f1(P.bau2.pop_max)} milliards, puis tout décline : l'espérance de vie retombe à ${f1(P.bau2.le_2050)} ans en 2050 dans le modèle. Ce n'est pas une prévision : c'est ce qui arrive dans le modèle si les tendances du passé continuent sans réaction.</li>
    <li><b>Le modèle ignore les prix, les inégalités et les décisions politiques.</b> Il ne voit ni le nucléaire, ni le solaire, ni le recyclage, sauf à les ajouter comme hypothèses. Les scénarios où le monde réagit tôt (technologies plus propres, sobriété, population stabilisée) évitent l'effondrement : c'est le message central des auteurs, souvent oublié.</li>
    <li><b>Le lien avec la monnaie</b> : une économie dont la stabilité dépend de la croissance (voir <a href="#monnaie">Monnaie et croissance</a>) est mal préparée à un ralentissement imposé par les ressources. C'est la question que posait déjà le livre en 1972 : choisir de ralentir, ou subir le ralentissement.</li>
  </ul>`;
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
