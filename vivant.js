/* Le vivant comme machine : graphiques et simulateur */
(() => {
"use strict";
const $ = s => document.querySelector(s);
const fr = (v, d = 0) => v.toLocaleString("fr-FR", { minimumFractionDigits: d, maximumFractionDigits: d });
function tip() { let t = document.getElementById("vi-tip"); if (!t) { t = document.createElement("div"); t.id = "vi-tip"; t.style.cssText = "position:fixed;pointer-events:none;background:var(--tip-bg);color:var(--tip-ink);padding:6px 8px;border-radius:6px;font-size:12px;z-index:50;display:none;max-width:300px"; document.body.appendChild(t); } return t; }
const show = (e, h) => { const t = tip(); t.innerHTML = h; t.style.display = "block"; t.style.left = Math.min(e.clientX + 12, innerWidth - 310) + "px"; t.style.top = (e.clientY + 12) + "px"; };
const hide = () => { tip().style.display = "none"; };

function hbars(sel, rows, opt = {}) {
  const el = $(sel); if (!el) return;
  const W = Math.max(420, el.clientWidth || 560), rh = opt.rh || 26, m = { l: opt.ml || 190, r: 70, t: 6, b: 22 }, H = m.t + m.b + rows.length * rh;
  const x = d3.scaleLinear().domain([0, opt.max || d3.max(rows, r => r[1])]).range([m.l, W - m.r]);
  const y = d3.scaleBand().domain(rows.map(r => r[0])).range([m.t, H - m.b]).padding(0.22);
  const svg = d3.create("svg").attr("viewBox", `0 0 ${W} ${H}`).attr("width", "100%").style("font-size", "11px");
  svg.append("g").attr("transform", `translate(0,${H - m.b})`).call(d3.axisBottom(x).ticks(5).tickFormat(v => fr(v) + (opt.unit || "")));
  rows.forEach(([l, v, c, info]) => {
    svg.append("rect").attr("x", m.l).attr("y", y(l)).attr("height", y.bandwidth()).attr("width", Math.max(1, x(v) - m.l)).attr("fill", c || "#2563eb").attr("rx", 2)
      .on("mousemove", e => show(e, `<b>${l}</b> : ${fr(v, v < 10 && v % 1 ? 1 : 0)}${opt.unit || ""}${info ? "<br>" + info : ""}`)).on("mouseleave", hide);
    svg.append("text").attr("x", x(v) + 4).attr("y", y(l) + y.bandwidth() / 2 + 4).style("fill", "var(--ink)").style("font-weight", 600).text(fr(v, v < 10 && v % 1 ? 1 : 0) + (opt.unit || ""));
    svg.append("text").attr("x", m.l - 8).attr("y", y(l) + y.bandwidth() / 2 + 4).attr("text-anchor", "end").style("fill", "var(--ink)").text(l);
  });
  el.replaceChildren(svg.node());
}

function donut(sel, rows, centre) {
  const el = $(sel); if (!el) return;
  const W = 420, H = 260, r = 100, cx = 130, cy = 130;
  const svg = d3.create("svg").attr("viewBox", `0 0 ${W} ${H}`).attr("width", "100%").style("font-size", "11.5px").style("max-width", "460px");
  const arcs = d3.pie().sort(null).value(d => d[1])(rows), arc = d3.arc().innerRadius(55).outerRadius(r);
  svg.append("g").attr("transform", `translate(${cx},${cy})`).selectAll("path").data(arcs).join("path").attr("d", arc).attr("fill", d => d.data[2]).attr("stroke", "#fff")
    .on("mousemove", (e, d) => show(e, `<b>${d.data[0]}</b> : ${d.data[1]} %${d.data[3] ? "<br>" + d.data[3] : ""}`)).on("mouseleave", hide);
  svg.append("text").attr("x", cx).attr("y", cy + 4).attr("text-anchor", "middle").style("fill", "var(--ink)").style("font-weight", 700).text(centre);
  rows.forEach(([l, v, c], i) => { svg.append("rect").attr("x", 250).attr("y", 50 + i * 26).attr("width", 12).attr("height", 12).attr("fill", c); svg.append("text").attr("x", 268).attr("y", 60 + i * 26).style("fill", "var(--ink)").text(`${l} : ${v} %`); });
  el.replaceChildren(svg.node());
}

/* Cascade : que devient 100 unités d'énergie solaire (Zhu, Long, Ort 2008, plante C3) */
function pertes() {
  const el = $("#vi-pertes"); if (!el) return;
  const S = [["Énergie solaire reçue", 100, "toute la lumière du Soleil arrivant sur la feuille"], ["Dans les longueurs d'onde utiles (400-700 nm)", 51.3, "48,7 % sont dans l'infrarouge ou l'ultraviolet, inutilisables"], ["Absorbée par la feuille", 46.4, "une partie est réfléchie ou traverse la feuille"], ["Stockée en sucres", 12.6, "pertes de conversion : excès d'énergie des photons bleus perdu en chaleur, chimie du cycle de Calvin"], ["Après la photorespiration", 6.5, "la Rubisco fixe parfois de l'O₂ au lieu du CO₂ : énergie gaspillée"], ["Après la respiration de la plante", 4.6, "la plante brûle une partie de ses sucres pour vivre : c'est le maximum théorique (C3)"], ["Champ réel, moyenne annuelle", 1, "saisons sans feuilles, manque d'eau ou d'azote, lumière saturante à midi, maladies"]];
  const W = Math.max(520, el.clientWidth || 700), rh = 30, m = { l: 290, r: 60, t: 6, b: 22 }, H = m.t + m.b + S.length * rh;
  const x = d3.scaleLinear().domain([0, 100]).range([m.l, W - m.r]), y = d3.scaleBand().domain(S.map(s => s[0])).range([m.t, H - m.b]).padding(0.2);
  const svg = d3.create("svg").attr("viewBox", `0 0 ${W} ${H}`).attr("width", "100%").style("font-size", "11px");
  svg.append("g").attr("transform", `translate(0,${H - m.b})`).call(d3.axisBottom(x).ticks(5).tickFormat(v => v + " %"));
  S.forEach(([l, v, info], i) => {
    const c = i === 0 ? "#facc15" : i < 3 ? "#fbbf24" : i < 6 ? "#22c55e" : "#15803d";
    if (i > 0) svg.append("rect").attr("x", x(v)).attr("y", y(l)).attr("height", y.bandwidth()).attr("width", x(S[i - 1][1]) - x(v)).attr("fill", "#fecaca").attr("opacity", .7);
    svg.append("rect").attr("x", m.l).attr("y", y(l)).attr("height", y.bandwidth()).attr("width", x(v) - m.l).attr("fill", c).on("mousemove", e => show(e, `<b>${l}</b> : ${fr(v, v % 1 ? 1 : 0)} %<br>${info}`)).on("mouseleave", hide);
    svg.append("text").attr("x", x(i > 0 ? S[i - 1][1] : v) + 4).attr("y", y(l) + y.bandwidth() / 2 + 4).style("fill", "var(--ink)").style("font-weight", 600).text(fr(v, v % 1 ? 1 : 0) + " %");
    svg.append("text").attr("x", m.l - 8).attr("y", y(l) + y.bandwidth() / 2 + 4).attr("text-anchor", "end").style("fill", "var(--ink)").text(l);
  });
  el.replaceChildren(svg.node());
}

function carbone() {
  hbars("#vi-carbone", [["Végétation", 450, "#16a34a"], ["Atmosphère (2019)", 875, "#94a3b8", "environ 590 avant l'ère industrielle"], ["Pergélisol (sols gelés)", 1400, "#7dd3fc", "menacé par le réchauffement"], ["Sols (hors pergélisol)", 1700, "#92400e"], ["Océan de surface", 900, "#3b82f6"]], { ml: 190, unit: " Gt" });
}

function rendements() {
  hbars("#vi-rendements", [["Champ cultivé (moyenne annuelle)", 1, "#16a34a"], ["Photosynthèse, maximum théorique C3", 4.6, "#22c55e"], ["Photosynthèse, maximum théorique C4", 6, "#4ade80"], ["Panneau photovoltaïque", 21, "#f59e0b"], ["Muscle humain (aliment → mouvement)", 23, "#e11d48"], ["Moteur à essence", 30, "#64748b"], ["Glucose → ATP dans la cellule", 50, "#f43f5e"], ["Centrale au gaz à cycle combiné", 60, "#64748b"], ["Moteur électrique", 93, "#2563eb"]], { ml: 250, unit: " %", max: 100 });
}

function watts() {
  hbars("#vi-watts", [["Cerveau seul", 20, "#7c3aed"], ["Sommeil", 70, "#94a3b8"], ["Repos (métabolisme de base)", 80, "#64748b"], ["Moyenne sur 24 h", 115, "#475569", "2 400 kcal par jour"], ["Marche tranquille", 300, "#16a34a"], ["Vélo de loisir (100 W fournis)", 430, "#22c55e"], ["Course à 10 km/h", 800, "#f59e0b"], ["Cycliste du Tour (400 W fournis)", 1740, "#ea580c", "pendant des heures"]], { ml: 210, unit: " W" });
  donut("#vi-organes", [["Muscles", 22, "#e11d48"], ["Foie", 21, "#92400e"], ["Cerveau", 20, "#7c3aed"], ["Cœur", 9, "#dc2626"], ["Reins", 8, "#0891b2"], ["Le reste", 20, "#94a3b8"]], "≈ 80 W au repos");
  donut("#vi-solcomp", [["Minéraux (sable, limon, argile)", 45, "#a16207"], ["Eau", 25, "#3b82f6"], ["Air", 25, "#cbd5e1"], ["Matière organique", 5, "#166534", "humus, racines, organismes vivants"]], "sol idéal");
}

function sim() {
  const p = +$("#vi-p").value, t = +$("#vi-t").value, mk = +$("#vi-m").value;
  $("#vi-pv").textContent = p; $("#vi-tv").textContent = t < 60 ? t + " min" : (t % 60 ? Math.floor(t / 60) + " h " + (t % 60) : t / 60 + " h"); $("#vi-mv").textContent = mk;
  const s = t * 60, mec = p * s, eta = 0.23, conso = mec / eta, chaleur = conso - mec, kcal = conso / 4184;
  const sueur = chaleur * 0.6 / 2.4e6; // part évacuée par la sueur à l'effort (ordre de grandeur)
  const o2 = conso / 20.1e3; // litres d'O2
  const vo2 = o2 * 1000 / (t * mk); // ml/kg/min
  const glyc = 2000, partGlu = p / mk > 3 ? 0.8 : p / mk > 2 ? 0.6 : 0.45, kcalGlu = kcal * partGlu;
  const w = p / mk;
  $("#vi-sim-out").innerHTML = `<div class="kpis" style="margin:0">${[
    [fr(kcal) + " kcal", "brûlées (rendement musculaire 23 %)"],
    [fr(mec / 3.6e6, 2) + " kWh", "de travail mécanique fourni"],
    [fr(kcal / 90, 1), "bananes, ou " + fr(kcal / 9) + " g de graisse"],
    [fr(sueur, 1) + " L", "de sueur à évaporer, environ"],
    [fr(vo2, 0) + " ml/kg/min", "d'oxygène en moyenne"],
    [fr(w, 1) + " W/kg", "puissance relative"]].map(([v, l]) => window.kpiHTML ? window.kpiHTML(v, l) : `<div><b>${v}</b> ${l}</div>`).join("")}</div>
    <p class="muted" style="font-size:.84rem;margin:8px 0 0">${w > 5 ? "Plus de 5 W/kg pendant longtemps : niveau d'un coureur professionnel." : w > 3.5 ? "3,5 à 5 W/kg : un amateur très entraîné, sur une durée courte à moyenne." : w > 2 ? "2 à 3,5 W/kg : un pratiquant régulier." : "Moins de 2 W/kg : un effort modéré, tenable longtemps."} ${vo2 > 60 ? "Une telle consommation d'oxygène n'est tenable que par des athlètes d'endurance." : ""} ${kcalGlu > glyc ? "Les réserves de glycogène (environ 2 000 kcal) ne suffisent pas : sans ravitaillement en sucre, c'est la « fringale »." : "Les réserves de glycogène suffisent pour cet effort."} Pour comparer, une ampoule LED consomme 8 W et un vélo électrique fournit jusqu'à 250 W d'assistance.</p>`;
}

function init() {
  if (!$("#vivant")) return;
  const k = $("#vi-kpis"); if (k && window.kpiHTML) k.innerHTML = [["≈ 100 W", "puissance moyenne d'un humain"], ["20 W", "pour le cerveau"], ["1 %", "rendement d'un champ (contre 21 % pour un panneau solaire)"], ["130 TW", "photosynthèse mondiale, 7 fois l'énergie consommée par l'humanité"]].map(([v, l]) => window.kpiHTML(v, l)).join("");
  pertes(); watts(); carbone(); rendements();
  ["#vi-p", "#vi-t", "#vi-m"].forEach(s => $(s).addEventListener("input", sim)); sim();
  addEventListener("hashchange", () => { if (location.hash === "#vivant") setTimeout(() => { pertes(); watts(); carbone(); rendements(); }, 50); });
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
