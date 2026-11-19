/* Monnaie 3.1 : simulateur « si l'emprunteur ne rembourse plus, qui perd quoi ? » */
(() => {
"use strict";
const $ = s => document.querySelector(s);
const eur = v => Math.round(v).toLocaleString("fr-FR") + " €";
function tip() { let t = document.getElementById("mo2-tip"); if (!t) { t = document.createElement("div"); t.id = "mo2-tip"; t.style.cssText = "position:fixed;pointer-events:none;background:var(--tip-bg);color:var(--tip-ink);padding:6px 8px;border-radius:6px;font-size:12px;z-index:50;display:none;max-width:300px"; document.body.appendChild(t); } return t; }
const show = (e, h) => { const t = tip(); t.innerHTML = h; t.style.display = "block"; t.style.left = Math.min(e.clientX + 12, innerWidth - 310) + "px"; t.style.top = (e.clientY + 12) + "px"; };
const hide = () => { tip().style.display = "none"; };

function calc() {
  const R = +$("#mo-df-r").value, P = +$("#mo-df-p").value, F = +$("#mo-df-f").value, E = +$("#mo-df-e").value, S = +$("#mo-df-s").value;
  const g = $("#mo-df-g").value, sur = $("#mo-df-sur").checked;
  ["r", "p", "f", "e", "s"].forEach(k => $(`#mo-df-${k}-v`).textContent = eur(+$(`#mo-df-${k}`).value));
  const dette = R + F;
  const maison = Math.min(P, dette), surplus = Math.max(0, P - dette);
  let reste = dette - maison;
  const epargne = Math.min(E, reste); reste -= epargne;
  const salaire = sur ? 0 : Math.min(S, reste); reste -= salaire;
  const perte = reste; // ce que le créancier ne récupère pas
  const qui = g === "caution" ? "la caution (fonds mutuel alimenté par tous les emprunteurs)" : "la banque, sur ses fonds propres";
  // graphique : barre de la dette décomposée + barre de l'emprunteur
  const el = $("#mo-df-g1"), W = Math.max(520, el.clientWidth || 700), H = 150, m = { l: 150, r: 20, t: 10, b: 24 };
  const max = Math.max(dette, P, 1);
  const x = d3.scaleLinear().domain([0, max]).range([m.l, W - m.r]);
  const svg = d3.create("svg").attr("viewBox", `0 0 ${W} ${H}`).attr("width", "100%").style("font-size", "11px");
  svg.append("g").attr("transform", `translate(0,${H - m.b})`).call(d3.axisBottom(x).ticks(5).tickFormat(v => Math.round(v / 1000) + " k€"));
  const seg = (y, parts, label) => {
    let a = 0;
    svg.append("text").attr("x", m.l - 8).attr("y", y + 18).attr("text-anchor", "end").style("fill", "var(--ink)").style("font-weight", 600).text(label);
    parts.forEach(([l, v, c]) => { if (v <= 0) return; svg.append("rect").attr("x", x(a)).attr("width", x(a + v) - x(a)).attr("y", y).attr("height", 28).attr("fill", c).attr("stroke", "#fff")
      .on("mousemove", e => show(e, `<b>${l}</b> : ${eur(v)}`)).on("mouseleave", hide);
      if (x(a + v) - x(a) > 60) svg.append("text").attr("x", (x(a) + x(a + v)) / 2).attr("y", y + 18).attr("text-anchor", "middle").style("fill", "#fff").style("font-weight", 600).style("pointer-events", "none").text(Math.round(v / 1000) + " k€");
      a += v; });
  };
  seg(14, [["Payé par la vente de la maison", maison, "#2563eb"], ["Payé par l'épargne saisie", epargne, "#0891b2"], ["Payé par les saisies sur salaire", salaire, "#7c3aed"], [sur ? "Effacé (perte pour le créancier)" : "Irrécouvrable (perte pour le créancier)", perte, "#dc2626"]], "La dette (capital + frais)");
  seg(64, [["Prix de vente qui rembourse la dette", maison, "#94a3b8"], ["Surplus rendu à l'emprunteur", surplus, "#16a34a"]], "Le prix de la maison");
  el.replaceChildren(svg.node());
  legendHTML();
  const autres = epargne + salaire;
  $("#mo-df-out").innerHTML = `<ul style="margin:8px 0 0">
    <li><b>L'emprunteur</b> perd sa maison : sur son prix, ${eur(maison)} servent à rembourser la dette de ${eur(dette)}${autres ? `, et il paie encore <b>${eur(autres)}</b> sur son épargne et son salaire` : ""}.${surplus ? ` Le prix de vente dépassant la dette, le <b>surplus de ${eur(surplus)}</b> lui revient de droit.` : ""}${!sur && perte > 0 ? ` Il reste <b>débiteur de ${eur(perte)}</b> : en France, la dette survit à la vente, même si une partie ne sera sans doute jamais récupérée.` : ""}${sur && perte > 0 ? ` La commission de surendettement efface les <b>${eur(perte)}</b> restants : il repart sans dette, mais sans maison ni épargne.` : ""}</li>
    <li><b>La banque</b> ${g === "caution" ? `est remboursée intégralement par la caution, qui se retourne ensuite contre l'emprunteur. ${perte > 0 ? `La perte finale de <b>${eur(perte)}</b> est supportée par ${qui}.` : "La caution récupère tout ce qu'elle a avancé."}` : perte > 0 ? `perd <b>${eur(perte)}</b> sur ses fonds propres.` : "récupère ce qui lui est dû, mais rien de plus : elle ne garde ni la maison ni le surplus."}</li>
    <li><b>La monnaie</b> : les ${eur(R)} restants avaient été créés au départ ; ils sont détruits à mesure qu'ils sont payés.${perte > 0 ? ` La part irrécouvrable (${eur(perte)}) reste en circulation chez ceux qui l'ont reçue (le vendeur d'origine et ceux qu'il a payés) : c'est le créancier qui en supporte le coût.` : ""}</li>
    <li><b>« Une maison gratuite » ?</b> Pour personne : le vendeur a été payé, l'emprunteur a perdu son bien${autres ? " et une partie de son épargne et de ses revenus" : ""}, et le créancier n'a récupéré au mieux que sa mise.</li></ul>`;
}
function legendHTML() {
  let l = document.getElementById("mo-df-leg");
  if (!l) { l = document.createElement("div"); l.id = "mo-df-leg"; l.className = "legend-row"; $("#mo-df-g1").after(l); }
  l.innerHTML = [["vente de la maison", "#2563eb"], ["épargne saisie", "#0891b2"], ["saisies sur salaire", "#7c3aed"], ["perte du créancier", "#dc2626"], ["surplus rendu à l'emprunteur", "#16a34a"]].map(([t, c]) => `<span style="display:inline-flex;align-items:center;gap:5px;margin-right:14px;font-size:12px"><span style="width:11px;height:11px;border-radius:2px;background:${c}"></span>${t}</span>`).join("");
}
function init() {
  if (!$("#mo-df-r")) return;
  ["#mo-df-r", "#mo-df-p", "#mo-df-f", "#mo-df-e", "#mo-df-s", "#mo-df-g", "#mo-df-sur"].forEach(s => $(s).addEventListener("input", calc));
  calc();
  addEventListener("hashchange", () => { if (location.hash === "#monnaie") setTimeout(calc, 50); });
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();

/* Désendettement général (2.5) et déflation de l'étalon-or (partie 1) */
(() => {
"use strict";
const $ = s => document.querySelector(s);
const f0 = v => Math.round(v).toLocaleString("fr-FR"), f1 = v => v.toLocaleString("fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
function dl() {
  const el = $("#mo-dl-g"); if (!el) return;
  const r = +$("#mo-dl-r").value, sh = +$("#mo-dl-s").value / 100;
  $("#mo-dl-r-v").textContent = r + " points de PIB"; $("#mo-dl-s-v").textContent = Math.round(sh * 100) + " %";
  const D0 = 150, M0 = 110, Y0 = 100, V = Y0 / M0, N = 12, rows = [];
  let D = D0, M = M0, G = 0;
  for (let t = 0; t <= N; t++) {
    const Y = M * V;
    rows.push({ t, M, Y, ratio: D / Y * 100, G, D });
    const rep = Math.min(r, D, Math.max(0, M - 5));
    D -= rep; M -= rep * (1 - sh); G += rep * sh;
  }
  const W = Math.max(520, el.clientWidth || 700), H = 260, m = { l: 44, r: 16, t: 12, b: 26 };
  const x = d3.scaleLinear().domain([0, N]).range([m.l, W - m.r]);
  const ymax = Math.min(600, d3.max(rows, d => Math.max(d.ratio, d.M, d.Y, d.G)) * 1.1);
  const y = d3.scaleLinear().domain([0, ymax]).range([H - m.b, m.t]).clamp(true);
  const svg = d3.create("svg").attr("viewBox", `0 0 ${W} ${H}`).attr("width", "100%").style("font-size", "11px");
  svg.append("g").attr("transform", `translate(0,${H - m.b})`).call(d3.axisBottom(x).ticks(N).tickFormat(v => "an " + v));
  svg.append("g").attr("transform", `translate(${m.l},0)`).call(d3.axisLeft(y).ticks(6));
  const S = [["M", "#16a34a", "Monnaie (% du PIB de départ)"], ["Y", "#2563eb", "Revenu national en euros (base 100)"], ["ratio", "#dc2626", "Dettes privées / revenu (%)"], ["G", "#7c3aed", "Dette publique supplémentaire (points de PIB)"]];
  S.forEach(([k, c]) => svg.append("path").datum(rows).attr("fill", "none").attr("stroke", c).attr("stroke-width", 2.2).attr("d", d3.line().x(d => x(d.t)).y(d => y(d[k]))));
  el.replaceChildren(svg.node());
  $("#mo-dl-leg").innerHTML = S.map(([, c, l]) => `<span style="display:inline-flex;align-items:center;gap:5px;margin-right:14px;font-size:12px"><span style="width:14px;height:3px;background:${c}"></span>${l}</span>`).join("");
  const last = rows[N], i2 = rows.findIndex(d => d.ratio > 300);
  $("#mo-dl-txt").innerHTML = `Après ${N} ans, la monnaie est à ${f0(last.M)} % du PIB de départ, le revenu national en euros à ${f0(last.Y)}, et les dettes privées restantes pèsent <b>${f0(last.ratio)} %</b> de ce revenu (contre 150 % au départ)${i2 > 0 ? `, au-delà de 300 % dès l'année ${i2} : bien avant, les faillites en chaîne auraient interrompu le processus` : ""}. ${sh >= 0.99 ? "L'État emprunte autant que le privé rembourse : la monnaie et le revenu ne bougent pas, la dette passe simplement du privé au public, comme au Japon." : sh > 0 ? "L'emprunt public freine la chute, sans l'empêcher." : "Sans personne pour emprunter à la place, le revenu en euros chute plus vite que la dette : c'est la déflation par la dette."} <i>Modèle volontairement simple : production réelle constante, monnaie qui circule au même rythme, aucun défaut.</i>`;
}
function or() {
  if (!$("#mo-or-g")) return;
  const g = +$("#mo-or-g").value, mm = +$("#mo-or-m").value;
  $("#mo-or-g-v").textContent = f1(g) + " % par an"; $("#mo-or-m-v").textContent = f1(mm) + " % par an";
  const p = (1 + mm / 100) / (1 + g / 100) - 1, p30 = Math.pow(1 + p, 30) - 1;
  const debt = 100 * Math.pow(1 + g / 100, 30) / Math.pow(1 + mm / 100, 30);
  $("#mo-or-out").innerHTML = `<p style="margin:0">Prix : <b style="color:${p < 0 ? "var(--neg)" : "var(--pos)"}">${p >= 0 ? "+" : ""}${f1(p * 100)} % par an</b>, soit <b>${p30 >= 0 ? "+" : ""}${f0(p30 * 100)} %</b> en 30 ans. ${p < -0.001 ? `Une dette de 100 000 € contractée au départ pèserait au bout de 30 ans comme <b>${f0(Math.round(debt) * 1000)} €</b> d'aujourd'hui, et un salaire inchangé en euros vaudrait de plus en plus : il faudrait baisser les salaires nominaux chaque année.` : p > 0.001 ? "Le stock d'or croît plus vite que la production : les prix montent, comme après les ruées vers l'or de 1848-1851 ou de 1896." : "Production et or croissent au même rythme : prix stables."}</p>`;
}
function init() {
  if ($("#mo-dl-r")) { ["#mo-dl-r", "#mo-dl-s"].forEach(s => $(s).addEventListener("input", dl)); dl(); }
  if ($("#mo-or-g")) { ["#mo-or-g", "#mo-or-m"].forEach(s => $(s).addEventListener("input", or)); or(); }
  addEventListener("hashchange", () => { if (location.hash === "#monnaie") setTimeout(dl, 50); });
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();

/* Calculateur inflation (2.2) */
(() => {
"use strict";
const $ = s => document.querySelector(s);
const f1 = v => v.toLocaleString("fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 1 }), f0 = v => Math.round(v).toLocaleString("fr-FR");
function calc() {
  const p = +$("#mo-inf-p").value / 100, i = +$("#mo-inf-i").value / 100, n = +$("#mo-inf-n").value;
  $("#mo-inf-p-v").textContent = f1(p * 100) + " %"; $("#mo-inf-i-v").textContent = f1(i * 100) + " %"; $("#mo-inf-n-v").textContent = n + " ans";
  const r = (1 + i) / (1 + p) - 1, billet = 100 / Math.pow(1 + p, n), place = 100 * Math.pow(1 + r, n), dette = 100 / Math.pow(1 + p, n);
  const dbl = p > 0 ? Math.log(2) / Math.log(1 + p) : null;
  $("#mo-inf-out").innerHTML = `<ul style="margin:0">
    <li><b>Taux réel</b> (taux moins inflation) : <b style="color:${r < 0 ? "var(--neg)" : "var(--pos)"}">${f1(r * 100)} %</b> par an. ${r < 0 ? "L'emprunteur gagne, l'épargnant perd : l'inflation rembourse une partie de la dette à sa place." : r > 0.04 ? "Un taux réel élevé : l'épargne est bien rémunérée, mais emprunter et investir coûte cher." : ""}</li>
    <li><b>100 € en billets</b> gardés ${n} ans valent <b>${f0(billet)} €</b> d'aujourd'hui${dbl ? ` ; les prix doublent en ${f0(dbl)} ans` : p < 0 ? " : en déflation, garder ses billets rapporte, d'où la tentation de ne plus dépenser" : ""}.</li>
    <li><b>100 € placés</b> à ce taux valent <b>${f0(place)} €</b> d'aujourd'hui au bout de ${n} ans.</li>
    <li><b>Une dette de 100 €</b> sans intérêt pèse au bout de ${n} ans comme <b>${f0(dette)} €</b> d'aujourd'hui${p < 0 ? " : la déflation alourdit les dettes" : ""}.</li></ul>`;
}
function init() { if (!$("#mo-inf-p")) return; ["#mo-inf-p", "#mo-inf-i", "#mo-inf-n"].forEach(s => $(s).addEventListener("input", calc)); calc(); }
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
