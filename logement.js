/* Argent privé : le logement, richesse ou rente ? Prix, construction, revenus, et comparaison européenne */
(() => {
"use strict";
let L = null, B = null;
const $ = s => document.querySelector(s);
async function init() {
  if (!window.TH) { setTimeout(init, 100); return; }
  try {
    [L, B] = await Promise.all([fetch("data/logement.json").then(r => r.json()), fetch("data/finances.json").then(r => r.json()).catch(() => null)]);
  } catch (e) { return; }
  let rt; addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(draw, 150); });
  draw();
}
function draw() {
  const el = $("#lg-fr"); if (!L || !el) return;
  const { lineChart, legend, esc } = window.TH;
  const md = v => Math.round(v).toLocaleString("fr-FR") + " Md€", n0 = v => Math.round(v).toLocaleString("fr-FR");
  const n1 = v => v.toLocaleString("fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const LG = L.long.filter(r => r.annee >= 1996);
  lineChart(el, LG, [{ k: "prix", l: "Prix des logements anciens", c: "#dc2626" }, { k: "construction", l: "Coût de la construction (bâtiment, hors terrain)", c: "#e07b39", dash: "6 4" }],
    { vfmt: v => n0(v), yfmt: v => v, h: 280, nozero: true });
  legend("#lg-fr-legend", [["Prix des logements anciens", "#dc2626"], ["Coût de la construction d'un logement, hors terrain", "#e07b39", true]]);
  friggit();
  // comparaison des pays
  const P = L.pays, mx = Math.max(...P.map(p => p.part)), me = Math.max(...P.map(p => Math.abs(p.effort)));
  $("#lg-pays").innerHTML = `<div class="tv-row tv-head lg-row"><span>Pays</span><span>Part du revenu consacrée au logement</span><span>Prix des logements depuis 2015, par rapport aux revenus</span></div>` +
    P.map(p => `<div class="tv-row lg-row${p.code === "FR" ? " me" : ""}${p.code === "EU27_2020" ? " ue" : ""}"><span class="lab">${esc(p.nom)}</span>
      <span class="tr"><span class="bar" style="width:${(100 * p.part / mx).toFixed(1)}%;background:${p.code === "FR" ? "#dc2626" : p.code === "EU27_2020" ? "var(--ink)" : "#e07b39"}"></span><b>${n1(p.part)} %</b></span>
      <span class="cp-track"><span class="cp-bar" style="${p.effort >= 0 ? `left:50%;width:${(50 * p.effort / me).toFixed(1)}%` : `right:50%;width:${(50 * -p.effort / me).toFixed(1)}%`};background:${p.effort >= 0 ? "#e15759" : "#16a34a"};opacity:.75"></span><i class="cp-zero"></i>
        <span class="cp-val" style="${p.effort >= 0 ? `left:calc(50% + ${(50 * p.effort / me).toFixed(1)}% + 4px)` : `right:calc(50% + ${(50 * -p.effort / me).toFixed(1)}% + 4px)`}">${p.effort > 0 ? "+" : ""}${p.effort} %</span></span></div>`).join("");
  const fr = P.find(p => p.code === "FR"), ue = P.find(p => p.code === "EU27_2020"), de = P.find(p => p.code === "DE"), nl = P.find(p => p.code === "NL");
  const rg = P.filter(p => p.code !== "EU27_2020").findIndex(p => p.code === "FR") + 1, n = P.filter(p => p.code !== "EU27_2020").length;
  const LGL = L.long.filter(r => r.prix != null).at(-1), LGC = L.long.filter(r => r.construction != null).at(-1);
  const F0 = L.france[0], FL = L.france.filter(r => r.prix != null && r.revenu != null).at(-1), FC = L.france.filter(r => r.construction != null).at(-1);
  // patrimoine et loyers imputés
  let pat = "";
  if (B?.patrimoine) {
    const y = Object.keys(B.patrimoine).sort().at(-1), m = B.patrimoine[y].secteurs.find(s => s.id === "menages");
    if (m) pat = `Chez les ménages, <b>le terrain vaut autant que les murs</b> : ${md(m.nf.terrains)} de terrains pour ${md(m.nf.logements)} de logements (fin ${y}). Ils ont ${md(m.nf.terrains + m.nf.logements)} placés dans la pierre, contre ${md(m.fa.actions)} en actions et parts de fonds.`;
  }
  $("#lg-txt").innerHTML = `<ul>
      <li><b>Plus de la moitié de la part du logement dans le budget n'est pas payée</b> : ce sont les loyers « imputés » que les propriétaires « se versent » à eux-mêmes. La comptabilité nationale les compte comme une production, environ 200 Md€ par an dans le PIB, pour que le PIB ne baisse pas quand un locataire devient propriétaire.</li>
      <li><b>Richesse, oui</b> : un logement rend un service bien réel. <b>Rente, aussi</b> : quand les prix montent, ces loyers comptés montent et le PIB avec, sans que personne ne soit mieux logé. ${pat} Or un terrain ne produit rien : sa valeur vient de son emplacement et de sa rareté.</li>
      <li><b>Argent immobilisé pour rien ?</b> Pas tout à fait : le logement sert. Mais quand on achète un logement existant, on ne crée rien de nouveau ; l'argent va au vendeur, et le crédit (${B?.patrimoine ? md(B.patrimoine[Object.keys(B.patrimoine).sort().at(-1)].secteurs.find(s => s.id === "menages").fl.credits) : "plus de 1 700 Md€"} de dettes des ménages, surtout immobilières) finance surtout le prix du sol plutôt que des entreprises ou des logements neufs. Et la hausse des prix transfère de la richesse des acheteurs, souvent jeunes, vers les propriétaires.</li>
      <li><b>Pourquoi c'est si cher ?</b> Surtout à cause du terrain, pas de la construction : entre 2000 et 2018, selon les notaires, le coût de construction a pris 50 %, le prix des logements 115 %, et celui des terrains a été multiplié par trois ${lk("[Notaires]", "https://www.notaires.fr/fr/immobilier-fiscalit%C3%A9/etudes-et-analyses-immobili%C3%A8res/march%C3%A9-du-foncier-les-prix-ont-presque-tripl%C3%A9-entre-2000-et-2018")}. Le prix des logements, qui suivait le revenu des ménages de 1965 à 2000, a décroché au début des années 2000 ${lk("[Friggit, IGEDD]", "https://www.igedd.developpement-durable.gouv.fr/IMG/pdf/evolution-prix-immobilier-friggit_cle0c611b.pdf")}, porté par la baisse des taux d'intérêt et l'allongement des prêts. Les deux graphiques le montrent : depuis 2000, le prix des logements a été multiplié par ${(LGL.prix / 100).toLocaleString("fr-FR", { maximumFractionDigits: 1 })}, le coût de construction par ${(LGC.construction / 100).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} ; rapporté au revenu des ménages, le prix d'un logement est ${Math.round(friggit.last.prix_revenu - 100)} % plus élevé qu'en 2000 (jusqu'à +${Math.round(friggit.pk.prix_revenu - 100)} % en ${friggit.pk.annee}). L'essentiel du décrochage s'est fait entre 2000 et 2007.</li>
      <li><b>Et ailleurs ?</b> Le logement prend <b>${n1(fr.part)} %</b> du revenu des ménages en France, contre ${n1(ue.part)} % en moyenne en Europe et ${n1(de.part)} % en Allemagne : la France est ${rg <= n / 3 ? "parmi les plus chères" : rg >= 2 * n / 3 ? "parmi les moins chères" : "dans la moyenne"} (${rg}<sup>e</sup> sur ${n}). Depuis 2015, les prix y ont augmenté presque comme les revenus (${fr.effort > 0 ? "+" : ""}${fr.effort} % de plus que les revenus), quand ils s'envolaient aux Pays-Bas (+${nl.effort} %) ou en moyenne en Europe (+${ue.effort} %).</li>
    </ul>
    <p class="muted" style="font-size:.78rem">Part du logement : loyers, intérêts d'emprunt, charges, eau et énergie, en % du revenu disponible (Eurostat, enquête SRCV, ilc_mded01, ${fr.annee_part}) ; le remboursement du capital emprunté n'y est pas compté. Prix des logements : Eurostat (prc_hpi_a) ; prix de construction des logements neufs hors terrain (sts_copi_a) ; revenu médian (ilc_di03, rupture de série en 2008) ; prix à la consommation (prc_hicp_aind). Graphiques : INSEE, indice Notaires-INSEE des prix des logements anciens (France métropolitaine) et indice du coût de la construction ; revenu disponible des ménages (Eurostat) divisé par le nombre de ménages (Eurostat, depuis 2006 ; avant, estimé à partir de la tendance). Même méthode que Jacques Friggit, qui remonte jusqu'en 1965 avec d'autres sources.</p>`;
}
function friggit() {
  const el = $("#lg-friggit"); if (!el) return;
  const { showTip, hideTip, css } = window.TH;
  const D = L.long.filter(r => r.prix_revenu != null), w = Math.max(300, el.clientWidth), h = 280, m = { t: 14, r: 12, b: 26, l: 40 };
  const x = d3.scaleLinear(d3.extent(D, d => d.annee), [m.l, w - m.r]), y = d3.scaleLinear([80, d3.max(D, d => d.prix_revenu) * 1.08], [h - m.b, m.t]).nice();
  const svg = d3.create("svg").attr("viewBox", `0 0 ${w} ${h}`);
  svg.append("g").attr("class", "grid").selectAll("line").data(y.ticks(6)).join("line").attr("x1", m.l).attr("x2", w - m.r).attr("y1", y).attr("y2", y);
  svg.append("rect").attr("x", m.l).attr("width", w - m.l - m.r).attr("y", y(110)).attr("height", y(90) - y(110)).attr("fill", "#16a34a").attr("opacity", .12);
  svg.append("text").attr("x", m.l + 6).attr("y", y(110) - 5).attr("font-size", 10.5).attr("font-weight", 600).attr("fill", "#15803d").text("le « tunnel » de 1965 à 2000 : ±10 %");
  const ln = d3.line().x(d => x(d.annee)).y(d => y(d.prix_revenu));
  svg.append("path").attr("fill", "none").attr("stroke", "#dc2626").attr("stroke-width", 2.4).attr("stroke-dasharray", "4 3").attr("d", ln(D.filter(d => d.annee <= (D.find(r => !r.estime)?.annee ?? 0))));
  svg.append("path").attr("fill", "none").attr("stroke", "#dc2626").attr("stroke-width", 2.6).attr("d", ln(D.filter(d => !d.estime)));
  const last = D.at(-1), pk = D.reduce((a, b) => b.prix_revenu > a.prix_revenu ? b : a);
  svg.append("text").attr("x", x(last.annee) - 4).attr("y", y(last.prix_revenu) - 8).attr("text-anchor", "end").attr("font-size", 11.5).attr("font-weight", 700).attr("fill", "#dc2626").text(Math.round(last.prix_revenu) + " en " + last.annee);
  svg.append("g").attr("class", "axis").attr("transform", `translate(0,${h - m.b})`).call(d3.axisBottom(x).ticks(w < 500 ? 5 : 8).tickFormat(d3.format("d")));
  svg.append("g").attr("class", "axis").attr("transform", `translate(${m.l},0)`).call(d3.axisLeft(y).ticks(6)).call(g => g.select(".domain").remove());
  svg.append("rect").attr("x", m.l).attr("y", m.t).attr("width", w - m.l - m.r).attr("height", h - m.t - m.b).attr("fill", "transparent")
    .on("pointermove", ev => { const yr = Math.round(x.invert(d3.pointer(ev)[0])), d = D.find(r => r.annee === yr); if (!d) return;
      showTip(`<b>${yr}</b>${d.estime ? " (nombre de ménages estimé)" : ""}<br>Prix ÷ revenu par ménage : ${Math.round(d.prix_revenu)} (100 en 2000)`, ev); }).on("pointerleave", hideTip);
  el.replaceChildren(svg.node());
  $("#lg-friggit-legend").innerHTML = `<span><i style="border-top-color:#dc2626;opacity:1"></i>Prix des logements ÷ revenu disponible par ménage</span><span><i style="border-top-color:#dc2626;border-top-style:dashed;opacity:1"></i>avant ${D.find(r => !r.estime)?.annee} : nombre de ménages estimé</span>`;
  friggit.pk = pk; friggit.last = last;
}
const lk = (t, u) => `<a href="${u}" target="_blank" rel="noopener">${t}</a>`;
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
