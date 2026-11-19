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
