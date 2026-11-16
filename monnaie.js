/* La monnaie et la dette obligent-elles à croître ? Crédit et monnaie depuis 1900, croissance contre taux, deux simulateurs */
(() => {
"use strict";
let M = null;
const $ = s => document.querySelector(s);
const f1 = v => v == null ? "–" : v.toLocaleString("fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const f2 = v => v.toLocaleString("fr-FR", { maximumFractionDigits: 2 });
const n0 = v => Math.round(v).toLocaleString("fr-FR");
const sg = v => (v > 0 ? "+" : v < 0 ? "−" : "") + f2(Math.abs(v));

async function init() {
  if (!window.TH || !window.d3) { setTimeout(init, 100); return; }
  if (!$("#mo-credit")) return;   // article non publié dans cette version du site
  try { M = await fetch("data/monnaie.json", { cache: "no-cache" }).then(r => r.json()); } catch (e) { return; }
  try { M.longue = (await fetch("data/histoire.json", { cache: "no-cache" }).then(r => r.json())).longue; } catch (e) { M.longue = null; }
  ["mo-i", "mo-b"].forEach(id => $("#" + id).addEventListener("input", mini));
  ["mo-d", "mo-r", "mo-g", "mo-p", "mo-s"].forEach(id => $("#" + id).addEventListener("input", snow));
  presets();
  let rt; addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(draw, 150); });
  draw();
}

/* économie miniature : stock de prêts constant (100), dépôts = monnaie en circulation ; les intérêts vont à la banque, qui en redépense une part */
function mini() {
  const { lineChart, legend } = window.TH;
  const i = +$("#mo-i").value / 100, b = +$("#mo-b").value / 100;
  $("#mo-i-v").textContent = f1(i * 100) + " %"; $("#mo-b-v").textContent = Math.round(b * 100) + " %";
  const D = 100, rows = []; let m = 100, h = 0, crise = null;
  for (let t = 0; t <= 40; t++) {
    rows.push({ annee: t, m: Math.max(0, m), h, paye: t ? Math.round(t * i * D) : 0 });
    const int = i * D;
    if (m < int && crise == null) crise = t;
    m -= int * (1 - b); h += int * (1 - b);
  }
  lineChart($("#mo-mini"), rows, [{ k: "m", l: "Monnaie entre les mains des emprunteurs et de l'économie", c: "#2563eb" }, { k: "h", l: "Monnaie gardée par la banque (non redépensée)", c: "#dc2626" },
    { k: "paye", l: "Intérêts payés depuis le début (cumul)", c: "#16a34a", dash: "4 3" }], { vfmt: v => n0(v), yfmt: v => v, h: 240, xticks: 8 });
  // l'axe des x affiche des années depuis le début
  $("#mo-mini").querySelectorAll("g.axis")[0]?.querySelectorAll("text").forEach(t => t.textContent = "an " + t.textContent);
  legend("#mo-mini-legend", [["Monnaie en circulation dans l'économie", "#2563eb"], ["Gardée par la banque, non redépensée", "#dc2626"], ["Intérêts payés depuis le début (cumul)", "#16a34a", 1]]);
  const tot = Math.round(40 * i * D);
  $("#mo-mini-out").innerHTML = i === 0 ? `Sans intérêts, la question ne se pose pas.` : b >= 1
    ? `<span style="color:var(--pos)">En 40 ans, les emprunteurs ont payé <b>${n0(tot)}</b> d'intérêts pour 100 de monnaie créée, sans un euro de croissance ni de nouveau crédit : la même monnaie tourne, parce que la banque la redépense.</span>`
    : `<span style="color:var(--neg)">${crise != null ? `Dès l'année <b>${crise}</b>, il n'y a plus assez de monnaie en circulation pour payer les intérêts` : `La monnaie en circulation baisse chaque année`}</span> : ce que la banque garde sans le dépenser manque aux emprunteurs. Il faut alors de nouveaux crédits, ou des défauts de paiement.`;
}

function presets() {
  const P = [["France 2025 (dette publique)", 115, 3.25, 0.75, 1.25, 0], ["Sans croissance, inflation 2 %", 115, 3, 0, 2, 0], ["Sans croissance ni inflation", 115, 3, 0, 0, 0],
    ["Déflation", 115, 3, 0, -1, 0], ["Trente Glorieuses", 30, 6, 5, 5, 0], ["1986-2007 : taux réels élevés", 60, 6.5, 2.25, 2, 0]];
  $("#mo-presets").innerHTML = P.map((p, k) => `<button type="button" class="in-chip" data-k="${k}">${p[0]}</button>`).join("");
  $("#mo-presets").querySelectorAll("button").forEach(btn => btn.onclick = () => {
    const p = P[+btn.dataset.k]; ["mo-d", "mo-r", "mo-g", "mo-p", "mo-s"].forEach((id, j) => $("#" + id).value = p[j + 1]); snow();
  });
}

/* boule de neige : d(t+1) = d(t) × (1 + r) / (1 + n) − s */
function snow() {
  const { lineChart } = window.TH;
  const d0 = +$("#mo-d").value, r = +$("#mo-r").value / 100, g = +$("#mo-g").value / 100, p = +$("#mo-p").value / 100, s = +$("#mo-s").value;
  $("#mo-d-v").textContent = d0 + " %"; $("#mo-r-v").textContent = f2(r * 100) + " %"; $("#mo-g-v").textContent = sg(g * 100) + " %";
  $("#mo-p-v").textContent = sg(p * 100) + " %"; $("#mo-s-v").textContent = sg(s) + " %";
  const n = (1 + g) * (1 + p) - 1, rows = []; let d = d0;
  for (let t = 0; t <= 40; t++) { rows.push({ annee: t, d: Math.max(0, d), d0 }); d = d * (1 + r) / (1 + n) - s; }
  lineChart($("#mo-snow"), rows, [{ k: "d", l: "Dette (% du PIB)", c: "#dc2626" }, { k: "d0", l: "Niveau de départ", c: "var(--faint)", dash: "4 3" }], { vfmt: v => n0(v) + " %", yfmt: v => v + " %", h: 240, xticks: 8 });
  $("#mo-snow").querySelectorAll("g.axis")[0]?.querySelectorAll("text").forEach(t => t.textContent = "an " + t.textContent);
  const star = d0 * (r - n) / (1 + n), dF = rows.at(-1).d;
  $("#mo-snow-out").innerHTML = `Croissance en valeur : <b>${sg(n * 100)} %</b> par an, taux : <b>${f2(r * 100)} %</b>. ` +
    (Math.abs(star) < 0.05 ? `La dette se stabilise d'elle-même : la croissance en valeur compense exactement les intérêts.`
      : star > 0 ? `Pour stabiliser la dette, il faut rembourser chaque année <b>${f2(star)} % du PIB</b> en net (prélevés sur les revenus).`
        : `La croissance en valeur dépasse le taux : la dette <b>fond d'elle-même</b>. On pourrait même emprunter ${f2(-star)} % du PIB de plus chaque année sans qu'elle grossisse.`) +
    ` Dans 40 ans, avec ces réglages : <b style="color:${dF > d0 * 1.02 ? "var(--neg)" : "var(--pos)"}">${n0(dF)} % du PIB</b>.`;
}

/* inflation depuis 1900, avec les grandes périodes du financement de l'État */
function drawInfl() {
  const el = $("#mo-infl"); if (!el || !M.longue || !el.clientWidth) return;
  const { showTip, hideTip, css } = window.TH;
  const D = M.longue.filter(r => r.inflation != null), y1 = D.at(-1).annee;
  const w = Math.max(320, el.clientWidth), h = 300, m = { t: 30, r: 14, b: 26, l: 44 };
  const x = d3.scaleLinear([1900, y1], [m.l, w - m.r]), y = d3.scaleLinear([-15, 60], [h - m.b, m.t]);
  const svg = d3.create("svg").attr("viewBox", `0 0 ${w} ${h}`);
  const P = [[1914, 1928, "Avances de la Banque de France", "#dc2626"], [1945, 1973, "Circuit du Trésor", "#f59e0b"], [1973, 1985, "Sortie du circuit", "#a3a3a3"],
    [1985, 1999, "Marchés financiers", "#2563eb"], [1999, y1, "Euro, BCE", "#7c3aed"]];
  P.forEach(([a, b, l, c], i) => {
    svg.append("rect").attr("x", x(a)).attr("width", x(b) - x(a)).attr("y", m.t).attr("height", h - m.t - m.b).attr("fill", c).attr("opacity", .1);
    svg.append("text").attr("x", (x(a) + x(b)) / 2).attr("y", m.t - (i % 2 ? 4 : 16)).attr("text-anchor", "middle").attr("font-size", w < 560 ? 8.5 : 10.5).attr("fill", c).text(l);
  });
  svg.append("g").attr("class", "grid").selectAll("line").data(y.ticks(6)).join("line").attr("x1", m.l).attr("x2", w - m.r).attr("y1", y).attr("y2", y);
  svg.append("line").attr("x1", m.l).attr("x2", w - m.r).attr("y1", y(0)).attr("y2", y(0)).attr("stroke", css("--muted"));
  svg.append("path").attr("fill", "none").attr("stroke", css("--ink")).attr("stroke-width", 1.8).attr("d", d3.line().x(d => x(d.annee)).y(d => y(d.inflation))(D));
  svg.append("g").attr("class", "axis").attr("transform", `translate(0,${h - m.b})`).call(d3.axisBottom(x).tickFormat(d3.format("d")).ticks(w < 560 ? 5 : 12));
  svg.append("g").attr("class", "axis").attr("transform", `translate(${m.l},0)`).call(d3.axisLeft(y).ticks(6).tickFormat(v => v + " %")).call(s => s.select(".domain").remove());
  const bis = d3.bisector(d => d.annee).center;
  svg.append("rect").attr("x", m.l).attr("y", m.t).attr("width", w - m.l - m.r).attr("height", h - m.t - m.b).attr("fill", "transparent")
    .on("pointermove", ev => { const d = D[bis(D, x.invert(d3.pointer(ev)[0]))]; if (d) showTip(`<b>${d.annee}</b><br>Hausse des prix : ${f1(d.inflation)} %`, ev); }).on("pointerleave", hideTip);
  el.replaceChildren(svg.node());
}

function draw() {
  if (!M || !$("#mo-credit")) return;
  const { kpis, lineChart, legend, esc } = window.TH;
  const C = M.credit, S = M.serie, cL = C.at(-1), c50 = C.find(c => c.annee === 1950), last = S.at(-1);
  const t0 = S.find(s => s.taux != null);
  const per = M.periodes;
  kpis("#mo-kpis", [
    ["≈ 90 %", ["de la monnaie est créée par les banques,", "quand elles accordent des crédits"], "Monnaie"],
    [f1(cL.credit).replace(",0", "") + " %", [`du PIB : crédits bancaires au privé (${cL.annee})`, `${f1(c50.credit)} % en 1950`], "Crédit"],
    [sg(last.nominal) + " %", [`croissance du PIB en valeur en ${last.annee}`, `taux long de l'État : ${f2(last.taux)} %`], "Croissance et taux"],
    ["non", ["la monnaie-dette n'impose pas à elle seule", "la croissance ; la dette à intérêt, si"], "En bref"],
  ]);
  lineChart($("#mo-credit"), C, [{ k: "credit", l: "Crédits des banques aux ménages et entreprises", c: "#2563eb" }, { k: "monnaie", l: "Monnaie au sens large (dépôts, billets…)", c: "#16a34a" },
    { k: "dette_publique", l: "Dette publique", c: "#dc2626", dash: "4 3" }], { vfmt: v => f1(v) + " %", yfmt: v => v + " %", h: 280 });
  legend("#mo-credit-legend", [["Crédits bancaires aux ménages et aux entreprises", "#2563eb"], ["Monnaie au sens large", "#16a34a"], ["Dette publique", "#dc2626", 1]]);
  const c70 = C.find(c => c.annee === 1970), c00 = C.find(c => c.annee === 2000), c19 = C.find(c => c.annee === 2019);
  $("#mo-credit-txt").innerHTML = `<ul>
    <li><b>Le crédit au secteur privé est passé de ${n0(c50.credit)} % du PIB en 1950 à ${n0(c19.credit)} % en 2019</b> (${n0(cL.credit)} % en ${cL.annee}, année où le PIB a chuté avec la crise sanitaire). Il augmente plus vite que l'économie : c'est surtout le crédit immobilier des ménages (${n0(cL.menages)} % du PIB en ${cL.annee}), qui suit la hausse des prix des logements (voir <a href="#logement">Logement</a>).</li>
    <li><b>La dette totale grossit, mais ce n'est pas une loi</b> : entre les deux guerres, et de 1945 au début des années 1970, la dette publique a fondu (de ${n0(C.find(c => c.annee === 1920).dette_publique)} % du PIB en 1920 à ${n0(c70.dette_publique)} % en 1970), grâce à la croissance et surtout à l'inflation. Le crédit privé, lui, a stagné ou reculé à plusieurs reprises (années 1930, 1990-2000 : ${n0(C.find(c => c.annee === 1990).credit)} % → ${n0(c00.credit)} %).</li>
  </ul>
  <p class="muted" style="font-size:.78rem">Jordà, Schularick et Taylor, Macrohistory Database : crédits des banques au secteur privé non financier, monnaie au sens large (M2 ou M3 selon les périodes), dette publique, rapportés au PIB. Série arrêtée en ${cL.annee}. Pas de données pour les années de guerre.</p>`;
  // M1, M2, M3 (BCE)
  const AG = M.agregats, aL = AG.at(-1), a99 = AG.find(a => a.annee === 1999), a07 = AG.find(a => a.annee === 2007), a21 = AG.find(a => a.annee === 2021), a23 = AG.find(a => a.annee === 2023);
  const { areaChart } = window.TH;
  areaChart($("#mo-m"), AG, ["billets", "depots_vue", "epargne_court", "titres"], { billets: "#16a34a", depots_vue: "#2563eb", epargne_court: "#93c5fd", titres: "#cbd5e1" },
    { billets: "Billets et pièces", depots_vue: "Dépôts à vue (comptes courants)", epargne_court: "Épargne à court terme (livrets, dépôts à terme ≤ 2 ans)", titres: "Titres monétaires (fonds monétaires, pensions, titres ≤ 2 ans)" }, { vfmt: v => n0(v) + " Md€", yfmt: v => n0(v / 1000) + " 000", h: 280 });
  legend("#mo-m-legend", [["M1 : billets", "#16a34a"], ["M1 : dépôts à vue", "#2563eb"], ["+ M2 : livrets, dépôts à terme", "#93c5fd"], ["+ M3 : titres monétaires", "#cbd5e1"]]);
  lineChart($("#mo-mpib"), AG.filter(a => a.m3_pib != null || a.annee >= 1990), [{ k: "m3_pib", l: "M3 en % du PIB", c: "#64748b" }, { k: "m1_pib", l: "M1 en % du PIB", c: "#2563eb" }, { k: "m3_croiss", l: "Croissance annuelle de M3", c: "#dc2626", dash: "4 3" }],
    { vfmt: v => f1(v) + " %", yfmt: v => v + " %", h: 280 });
  legend("#mo-mpib-legend", [["M3 en % du PIB", "#64748b"], ["M1 en % du PIB", "#2563eb"], ["Croissance annuelle de M3", "#dc2626", 1]]);
  const mx3 = AG.filter(a => a.m3_croiss != null && a.annee >= 2000).reduce((a, b) => b.m3_croiss > a.m3_croiss ? b : a);
  const mn3 = AG.filter(a => a.m3_croiss != null && a.annee >= 2000).reduce((a, b) => b.m3_croiss < a.m3_croiss ? b : a);
  $("#mo-m-txt").innerHTML = `<ul>
    <li><b>M1</b> = billets et pièces + dépôts à vue (l'argent des comptes courants) : ${n0(aL.m1)} milliards d'euros fin ${aL.annee}. <b>M2</b> ajoute l'épargne disponible à court terme (en France : Livret A, LDDS, livrets bancaires, comptes à terme de moins de 2 ans) : ${n0(aL.m2)} milliards. <b>M3</b> ajoute des placements très proches de la monnaie (fonds monétaires, titres à moins de 2 ans) : ${n0(aL.m3)} milliards, soit ${n0(aL.m3_pib)} % du PIB de la zone euro.</li>
    <li><b>Les billets ne sont qu'une petite partie</b> : ${n0(100 * aL.billets / aL.m3)} % de M3. Tout le reste est de la monnaie de banque, créée par le crédit.</li>
    <li><b>La masse monétaire grossit plus vite que l'économie</b> : M3 est passée de ${n0(a99.m3)} milliards en 1999 à ${n0(aL.m3)} en ${aL.annee}, soit ×${f1(aL.m3 / a99.m3)}, quand le PIB de la zone euro était multiplié par ${f1(aL.pib / a99.pib)}. C'est surtout M1 qui a gonflé : avec des taux à zéro de 2015 à 2021, garder son argent sur un compte courant ne coûtait rien (M1 : ${n0(a07.m1_pib)} % du PIB en 2007, ${n0(a21.m1_pib)} % en 2021).</li>
    <li><b>Quand les taux remontent, la monnaie change de forme</b> : en 2023, l'argent a quitté les comptes courants pour les comptes à terme et les livrets mieux rémunérés (M1 : ${n0(a23.m1)} milliards fin 2023 contre ${n0(a21.m1)} fin 2021). La croissance de M3 a varié de ${f1(mn3.m3_croiss)} % (${mn3.annee}) à ${f1(mx3.m3_croiss)} % (${mx3.annee}).</li>
    <li><b>La masse monétaire n'explique pas tout de l'inflation</b> : de 2009 à 2019, M3 a progressé sans faire monter les prix à la consommation (l'argent est allé vers l'immobilier et les actifs financiers) ; en 2021-2022, l'inflation est surtout venue de l'énergie, même si la forte création monétaire de 2020-2021 y a contribué.</li>
  </ul>
  <p class="muted" style="font-size:.78rem">BCE, statistiques des bilans des institutions financières monétaires (BSI), agrégats de la zone euro corrigés des variations saisonnières, encours de fin décembre ; données jusqu'en ${M.agregats_dernier_mois.replace("-", "/")}. Avant 1999, reconstitution par la BCE. PIB : Eurostat, zone euro à 20 pays (depuis 1995).</p>`;
  lineChart($("#mo-rg"), S, [{ k: "nominal", l: "Croissance du PIB en valeur", c: "#2563eb" }, { k: "taux", l: "Taux d'intérêt à 10 ans de l'État", c: "#dc2626" }, { k: "reel", l: "dont croissance réelle (volume)", c: "#2563eb", dash: "3 3" }],
    { vfmt: v => f1(v) + " %", yfmt: v => v + " %", h: 280 });
  legend("#mo-rg-legend", [["Croissance du PIB en valeur (réelle + prix)", "#2563eb"], ["dont croissance réelle", "#2563eb", 1], ["Taux d'intérêt à 10 ans de l'État", "#dc2626"]]);
  $("#mo-periodes").innerHTML = `<div class="in-dep-row in-dep-head mo-per"><span>Période</span><span>Croissance en valeur / taux à 10 ans (moyennes annuelles)</span><span class="num">Effet sur les dettes</span></div>` +
    per.filter(p => p.taux != null).map(p => { const ok = p.nominal >= p.taux, mx = 40;
      return `<div class="in-dep-row mo-per"><span class="lab">${p.l}</span><span class="tr in-two"><span style="width:${(100 * p.nominal / mx).toFixed(1)}%;background:#2563eb"></span><b>${f1(p.nominal)} %</b><span style="width:${(100 * p.taux / mx).toFixed(1)}%;background:#dc2626"></span><b>${f1(p.taux)} %</b></span>
        <span class="num" style="color:${ok ? "var(--pos)" : "var(--neg)"}"><b>${ok ? "elles fondent" : "boule de neige"}</b><br><small class="muted">écart ${sg(Math.round(10 * (p.nominal - p.taux)) / 10)} point${Math.abs(p.nominal - p.taux) >= 2 ? "s" : ""}</small></span></div>`; }).join("") +
    `<p class="muted" style="font-size:.78rem;margin:4px 0 0">INSEE, PIB en valeur et en volume (comptes nationaux base 2020) ; taux de rendement des emprunts d'État à long terme : Eurostat depuis 1970, Macrohistory Database avant. Le taux des nouveaux emprunts n'est pas le taux moyen payé sur toute la dette, qui suit avec retard.</p>`;
  drawInfl(); mini(); snow();
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
