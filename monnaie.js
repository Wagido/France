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
  try { M = await fetch("data/monnaie.json", { cache: "no-cache" }).then(r => r.json()); } catch (e) { return; }
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
  lineChart($("#mo-rg"), S, [{ k: "nominal", l: "Croissance du PIB en valeur", c: "#2563eb" }, { k: "taux", l: "Taux d'intérêt à 10 ans de l'État", c: "#dc2626" }, { k: "reel", l: "dont croissance réelle (volume)", c: "#2563eb", dash: "3 3" }],
    { vfmt: v => f1(v) + " %", yfmt: v => v + " %", h: 280 });
  legend("#mo-rg-legend", [["Croissance du PIB en valeur (réelle + prix)", "#2563eb"], ["dont croissance réelle", "#2563eb", 1], ["Taux d'intérêt à 10 ans de l'État", "#dc2626"]]);
  $("#mo-periodes").innerHTML = `<div class="in-dep-row in-dep-head mo-per"><span>Période</span><span>Croissance en valeur / taux à 10 ans (moyennes annuelles)</span><span class="num">Effet sur les dettes</span></div>` +
    per.filter(p => p.taux != null).map(p => { const ok = p.nominal >= p.taux, mx = 40;
      return `<div class="in-dep-row mo-per"><span class="lab">${p.l}</span><span class="tr in-two"><span style="width:${(100 * p.nominal / mx).toFixed(1)}%;background:#2563eb"></span><b>${f1(p.nominal)} %</b><span style="width:${(100 * p.taux / mx).toFixed(1)}%;background:#dc2626"></span><b>${f1(p.taux)} %</b></span>
        <span class="num" style="color:${ok ? "var(--pos)" : "var(--neg)"}"><b>${ok ? "elles fondent" : "boule de neige"}</b><br><small class="muted">écart ${sg(Math.round(10 * (p.nominal - p.taux)) / 10)} point${Math.abs(p.nominal - p.taux) >= 2 ? "s" : ""}</small></span></div>`; }).join("") +
    `<p class="muted" style="font-size:.78rem;margin:4px 0 0">INSEE, PIB en valeur et en volume (comptes nationaux base 2020) ; taux de rendement des emprunts d'État à long terme : Eurostat depuis 1970, Macrohistory Database avant. Le taux des nouveaux emprunts n'est pas le taux moyen payé sur toute la dette, qui suit avec retard.</p>`;
  mini(); snow();
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
