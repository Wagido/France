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
  lineChart(el, L.france, [{ k: "prix", l: "Prix des logements", c: "#dc2626" }, { k: "construction", l: "Prix de construction d'un logement neuf (hors terrain)", c: "#e07b39", dash: "6 4" },
    { k: "revenu", l: "Revenu médian", c: "#3b6fd6" }, { k: "inflation", l: "Prix à la consommation", c: "#94a3b8" }], { vfmt: v => n0(v), yfmt: v => v, h: 280, nozero: true });
  legend("#lg-fr-legend", [["Prix des logements", "#dc2626"], ["Prix de construction d'un logement neuf, hors terrain", "#e07b39", true], ["Revenu médian par personne", "#3b6fd6"], ["Prix à la consommation (inflation)", "#94a3b8"]]);
  // comparaison des pays
  const P = L.pays, mx = Math.max(...P.map(p => p.part)), me = Math.max(...P.map(p => Math.abs(p.effort)));
  $("#lg-pays").innerHTML = `<div class="tv-row tv-head lg-row"><span>Pays</span><span>Part du revenu consacrée au logement</span><span>Prix des logements depuis 2015, par rapport aux revenus</span></div>` +
    P.map(p => `<div class="tv-row lg-row${p.code === "FR" ? " me" : ""}${p.code === "EU27_2020" ? " ue" : ""}"><span class="lab">${esc(p.nom)}</span>
      <span class="tr"><span class="bar" style="width:${(100 * p.part / mx).toFixed(1)}%;background:${p.code === "FR" ? "#dc2626" : p.code === "EU27_2020" ? "var(--ink)" : "#e07b39"}"></span><b>${n1(p.part)} %</b></span>
      <span class="cp-track"><span class="cp-bar" style="${p.effort >= 0 ? `left:50%;width:${(50 * p.effort / me).toFixed(1)}%` : `right:50%;width:${(50 * -p.effort / me).toFixed(1)}%`};background:${p.effort >= 0 ? "#e15759" : "#16a34a"};opacity:.75"></span><i class="cp-zero"></i>
        <span class="cp-val" style="${p.effort >= 0 ? `left:calc(50% + ${(50 * p.effort / me).toFixed(1)}% + 4px)` : `right:calc(50% + ${(50 * -p.effort / me).toFixed(1)}% + 4px)`}">${p.effort > 0 ? "+" : ""}${p.effort} %</span></span></div>`).join("");
  const fr = P.find(p => p.code === "FR"), ue = P.find(p => p.code === "EU27_2020"), de = P.find(p => p.code === "DE"), nl = P.find(p => p.code === "NL");
  const rg = P.filter(p => p.code !== "EU27_2020").findIndex(p => p.code === "FR") + 1, n = P.filter(p => p.code !== "EU27_2020").length;
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
      <li><b>Pourquoi c'est si cher ?</b> Surtout à cause du terrain, pas de la construction : entre 2000 et 2018, selon les notaires, le coût de construction a pris 50 %, le prix des logements 115 %, et celui des terrains a été multiplié par trois ${lk("[Notaires]", "https://www.notaires.fr/fr/immobilier-fiscalit%C3%A9/etudes-et-analyses-immobili%C3%A8res/march%C3%A9-du-foncier-les-prix-ont-presque-tripl%C3%A9-entre-2000-et-2018")}. Le prix des logements, qui suivait le revenu des ménages de 1965 à 2000, a décroché au début des années 2000 ${lk("[Friggit, IGEDD]", "https://www.igedd.developpement-durable.gouv.fr/IMG/pdf/evolution-prix-immobilier-friggit_cle0c611b.pdf")}, porté par la baisse des taux d'intérêt et l'allongement des prêts. Depuis ${F0.annee}, le graphique montre que les prix (${FL.prix > 100 ? "+" : ""}${n0(FL.prix - 100)} %) ont suivi à peu près le coût de construction (+${n0(FC.construction - 100)} % jusqu'en ${FC.annee}) : l'essentiel du décrochage avait déjà eu lieu.</li>
      <li><b>Et ailleurs ?</b> Le logement prend <b>${n1(fr.part)} %</b> du revenu des ménages en France, contre ${n1(ue.part)} % en moyenne en Europe et ${n1(de.part)} % en Allemagne : la France est ${rg <= n / 3 ? "parmi les plus chères" : rg >= 2 * n / 3 ? "parmi les moins chères" : "dans la moyenne"} (${rg}<sup>e</sup> sur ${n}). Depuis 2015, les prix y ont augmenté presque comme les revenus (${fr.effort > 0 ? "+" : ""}${fr.effort} % de plus que les revenus), quand ils s'envolaient aux Pays-Bas (+${nl.effort} %) ou en moyenne en Europe (+${ue.effort} %).</li>
    </ul>
    <p class="muted" style="font-size:.78rem">Part du logement : loyers, intérêts d'emprunt, charges, eau et énergie, en % du revenu disponible (Eurostat, enquête SRCV, ilc_mded01, ${fr.annee_part}) ; le remboursement du capital emprunté n'y est pas compté. Prix des logements : Eurostat (prc_hpi_a) ; prix de construction des logements neufs hors terrain (sts_copi_a) ; revenu médian (ilc_di03, rupture de série en 2008) ; prix à la consommation (prc_hicp_aind). Base 100 en ${F0.annee}.</p>`;
}
const lk = (t, u) => `<a href="${u}" target="_blank" rel="noopener">${t}</a>`;
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
