/* Chômage : INSEE (BIT, halo, sous-emploi), France Travail (catégories A à E), Eurostat (chômage élargi) */
(() => {
"use strict";
const $ = s => document.querySelector(s);
const T = () => window.TH;
let D = null;
const C = { bit: "#dc2626", halo: "#f59e0b", sous: "#fbbf24", A: "#1e40af", B: "#3b6fd6", C: "#93c5fd", DE: "#cbd5e1" };
const qx = t => +t.slice(0, 4) + (+t.slice(-1) - 1) / 4;      // « 2026-Q3 » -> 2026,5
const ql = t => `${["1er", "2e", "3e", "4e"][+t.slice(-1) - 1]} trimestre ${t.slice(0, 4)}`;

async function init() {
  if (!window.TH) { setTimeout(init, 100); return; }
  try { D = await fetch("data/chomage.json").then(r => r.json()); } catch (e) { return; }
  let rt; addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(draw, 150); });
  draw();
}

function draw() {
  if (!D || !$("#chomage")) return;
  const { kpis, lineChart, areaChart, legend, n0, n1, pct, esc, showTip, hideTip } = T();
  const b = D.bit.at(-1), f = D.france_travail.at(-1);
  const M = k => n1(k / 1000) + " M";
  const tousFT = f.A + f.B + f.C + (f.DE || 0), large = b.chomeurs + b.halo + b.sous_emploi;
  kpis("#ch-kpis", [
    [M(b.chomeurs), `chômeurs au sens du BIT (INSEE), soit ${pct(b.taux)} des actifs, ${ql(b.t)}`],
    [M(f.A), "inscrits à France Travail en catégorie A, le chiffre le plus cité (sans aucune activité)"],
    [M(tousFT), "inscrits toutes catégories (A à E)"],
    [M(large), "sans emploi ou en manque de travail : chômeurs + halo + sous-emploi"],
  ]);
  // escalier : deux barres à la même échelle
  const rows = [
    ["INSEE, enquête Emploi", [["Chômeurs (BIT)", b.chomeurs, C.bit], ["Halo autour du chômage", b.halo, C.halo], ["Sous-emploi (temps partiel subi…)", b.sous_emploi, C.sous]]],
    ["France Travail, inscrits", [["Catégorie A", f.A, C.A], ["Catégorie B", f.B, C.B], ["Catégorie C", f.C, C.C], ["Catégories D et E", f.DE || 0, C.DE]]],
  ];
  const max = d3.max(rows, r => d3.sum(r[1], x => x[1]));
  $("#ch-escalier").innerHTML = `<div class="cmp">${rows.map(([nom, seg]) => `<div class="cmp-row"><span class="cmp-name">${nom}</span><span class="cmp-stack" style="width:100%;height:34px;background:transparent">${seg.map(([l, v, c]) =>
    `<span data-t="${esc(`<b>${l}</b><br>${M(v)}`)}" style="width:${100 * v / max}%;background:${c};display:flex;align-items:center;justify-content:center;font-size:.75rem;font-weight:600;color:${c === C.DE || c === C.sous || c === C.C ? "#1d1f24" : "#fff"}">${v / max > .08 ? M(v) : ""}</span>`).join("")}</span><span class="cmp-val">${M(d3.sum(seg, x => x[1]))}</span></div>`).join("")}</div>`;
  $("#ch-escalier").querySelectorAll("[data-t]").forEach(sp => { sp.onpointermove = ev => showTip(sp.dataset.t, ev); sp.onpointerleave = hideTip; });
  legend("#ch-escalier-legend", rows.flatMap(r => r[1].map(([l, , c]) => [l, c])));
  $("#ch-escalier-legend").insertAdjacentHTML("beforeend", `<span class="muted" style="flex-basis:100%;font-size:.8rem">${ql(b.t)}. Les deux barres ne s'additionnent pas : beaucoup de chômeurs au sens du BIT sont aussi inscrits en catégorie A, et inversement une partie des inscrits n'est pas au chômage au sens du BIT (ils ont travaillé quelques heures, ou n'ont pas cherché activement). Catégories D et E : France métropolitaine.</span>`);
  // séries
  const ser = D.france_travail.filter(x => +x.t.slice(0, 4) >= 1996).map(x => {
    const bb = D.bit.find(y => y.t === x.t);
    return { annee: qx(x.t), bit: bb?.chomeurs ?? null, A: x.A, ABC: x.A + x.B + x.C, tous: x.DE != null ? x.A + x.B + x.C + x.DE : null };
  });
  lineChart($("#ch-serie"), ser, [{ k: "tous", l: "Inscrits, toutes catégories (A à E)", c: "#94a3b8" }, { k: "ABC", l: "Inscrits, catégories A, B, C", c: C.B }, { k: "A", l: "Inscrits, catégorie A", c: C.A }, { k: "bit", l: "Chômeurs au sens du BIT (INSEE)", c: C.bit }],
    { vfmt: v => M(v), yfmt: v => n0(v / 1000) + " M", h: 280 });
  legend("#ch-serie-legend", [["Chômeurs au sens du BIT", C.bit], ["Catégorie A", C.A], ["Catégories A, B, C", C.B], ["Toutes catégories", "#94a3b8"]]);
  const h = D.bit.filter(x => x.halo != null).map(x => ({ annee: qx(x.t), chomeurs: x.chomeurs, halo: x.halo, sous: x.sous_emploi }));
  areaChart($("#ch-halo"), h, ["chomeurs", "halo", "sous"], { chomeurs: C.bit, halo: C.halo, sous: C.sous }, { chomeurs: "Chômeurs (BIT)", halo: "Halo autour du chômage", sous: "Sous-emploi" },
    { vfmt: v => M(v), yfmt: v => n0(v / 1000) + " M", h: 280 });
  legend("#ch-halo-legend", [["Chômeurs (BIT)", C.bit], ["Halo : voudraient travailler, mais pas disponibles ou sans recherche active", C.halo], ["Sous-emploi : travaillent moins qu'ils le voudraient", C.sous]]);
  // définitions
  const DEF = [
    ["Chômeur au sens du BIT", C.bit, "N'a pas travaillé du tout, même une heure, pendant la semaine de l'enquête ; est disponible pour travailler dans les deux semaines ; a cherché activement un emploi dans le mois (ou en a trouvé un qui commence bientôt). Mesuré chaque trimestre par l'INSEE, par une enquête auprès de dizaines de milliers de ménages."],
    ["Halo autour du chômage", C.halo, "Voudrait travailler mais ne remplit pas tous les critères : ne cherche pas activement (découragé, garde d'enfants, santé…) ou n'est pas disponible tout de suite. Compté comme inactif."],
    ["Sous-emploi", C.sous, "A un emploi, mais à temps partiel en voulant travailler plus, ou a travaillé moins que d'habitude à cause du chômage technique ou partiel. Compté comme en emploi."],
    ["Catégorie A", C.A, "Inscrit à France Travail, tenu de chercher un emploi, sans aucune activité dans le mois. C'est le chiffre repris chaque trimestre dans les médias."],
    ["Catégories B et C", C.B, "Inscrits tenus de chercher, mais qui ont un peu travaillé dans le mois : 78 heures ou moins (B), plus de 78 heures (C)."],
    ["Catégorie D", C.DE, "Inscrits non tenus de chercher : en formation, en arrêt maladie, en contrat de sécurisation professionnelle après un licenciement économique."],
    ["Catégorie E", C.DE, "Inscrits non tenus de chercher parce qu'ils ont déjà un emploi : contrat aidé, création d'entreprise…"],
  ];
  $("#ch-defs").innerHTML = `<div class="table-scroll"><table class="cmp-t src"><tbody>${DEF.map(([t, c, d]) => `<tr><td style="white-space:nowrap"><span class="ibar" style="width:12px;height:12px;margin:0 8px 0 0;background:${c}"></span><b>${t}</b></td><td>${d}</td></tr>`).join("")}</tbody></table></div>`;
  // biais
  const q = t => D.france_travail.find(x => x.t === t);
  const a24 = q("2024-Q4"), a25 = q("2025-Q1"), a25b = q("2025-Q2");
  $("#ch-biais").innerHTML = `<ul class="prose-list" style="margin:0">
    <li><b>Une heure suffit pour ne plus être chômeur.</b> Pour le BIT, avoir travaillé une seule heure dans la semaine, c'est avoir un emploi. C'est la convention internationale (elle permet de comparer les pays), mais elle range dans l'emploi des personnes qui vivent surtout du chômage partiel ou de petits boulots : c'est le sous-emploi (${M(b.sous_emploi)}).</li>
    <li><b>Ne plus chercher, c'est sortir du chômage.</b> Une personne découragée, qui ne cherche plus activement, n'est plus chômeuse mais inactive : elle passe dans le halo (${M(b.halo)}).</li>
    <li><b>Seule la catégorie A fait les titres.</b> Les inscrits qui ont travaillé quelques heures (B et C : ${M(f.B + f.C)}) ou qui sont en formation (D) n'y figurent pas. Envoyer massivement des chômeurs en formation fait donc baisser la catégorie A : ce fut le cas avec le plan « 500 000 formations » de 2016.</li>
    <li><b>Les radiations.</b> Ne pas mettre à jour sa situation chaque mois (« défaut d'actualisation ») est le premier motif de sortie des listes, devant la reprise d'un emploi ; les radiations pour absence à un rendez-vous ou refus d'offres retirent aussi des inscrits sans qu'ils aient retrouvé du travail.</li>
    <li><b>Les seniors dispensés.</b> Jusqu'en 2012, les chômeurs âgés pouvaient être « dispensés de recherche d'emploi » et n'étaient plus comptés en catégorie A. Les préretraites ont joué le même rôle auparavant.</li>
    <li><b>Les changements de règles.</b> ${a24 && a25 ? `Au 1er trimestre 2025, la catégorie A a bondi de ${n0((a25.A - a24.A))} 000 personnes, puis reculé de ${n0(a25.A - a25b.A)} 000 le trimestre suivant : cela coïncide avec la loi « pour le plein emploi » (inscription automatique des allocataires du RSA et des jeunes suivis) puis avec les nouvelles règles de suivi et de sanction, plus qu'avec un vrai mouvement du chômage, que l'INSEE voit évoluer bien plus doucement.` : "La loi « pour le plein emploi » de 2025 a changé les règles d'inscription, ce qui rend les comparaisons délicates."}</li>
  </ul>
  <p style="margin-top:8px">Aucun de ces chiffres n'est « faux » : ils ne mesurent pas la même chose. Le chiffre du BIT est fiable pour comparer dans le temps et entre pays ; les inscriptions dépendent des règles administratives. Pour voir l'ampleur réelle du manque de travail, il faut regarder l'ensemble : ${M(large)} personnes.</p>`;
  // pays
  const P = [...D.elargi_pays].sort((x, y) => y.slack - x.slack), mx = d3.max(P, r => r.slack);
  const comp = [["UNE", "Chômeurs", C.bit], ["UEMP_PT", "Temps partiel subi", C.sous], ["NSEEK_AVL", "Disponibles sans recherche", C.halo], ["SEEK_NAVL", "Cherchent, pas disponibles", "#fde68a"]];
  $("#ch-cmp").innerHTML = `<div class="cmp">${P.map(r => `<div class="cmp-row${r.code === "FR" ? " me" : ""}"><span class="cmp-name">${esc(r.nom)}<small>${r.annee}</small></span><span class="cmp-stack" style="width:100%;background:transparent">${comp.map(([k, l, c]) =>
    `<span data-t="${esc(`<b>${r.nom}</b> · ${l} : ${pct(r[k] || 0)}`)}" style="width:${100 * (r[k] || 0) / mx}%;background:${c}"></span>`).join("")}</span><span class="cmp-val">${pct(r.slack)}</span></div>`).join("")}</div>`;
  $("#ch-cmp").querySelectorAll("[data-t]").forEach(sp => { sp.onpointermove = ev => showTip(sp.dataset.t, ev); sp.onpointerleave = hideTip; });
  $("#ch-cmp").insertAdjacentHTML("beforeend", `<div class="legend-row">${comp.map(([, l, c]) => `<span><i style="border-top-color:${c};opacity:1"></i>${l}</span>`).join("")}</div>`);
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
