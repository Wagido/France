/* Onglet Bulletin de salaire : simulateur, paramètres de novembre 2026 (modèle Urssaf « modele-social » 11.1.0) */
(() => {
"use strict";
const $ = s => document.querySelector(s);
const eur = (v, d = 2) => (v < 0 ? "−" : "") + Math.abs(v).toLocaleString("fr-FR", { minimumFractionDigits: d, maximumFractionDigits: d }) + " €";
const pct = (v, d = 2) => v == null ? "" : v.toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: d }) + " %";

const P = 4005;                                  // plafond mensuel de la Sécurité sociale 2026
const SMIC = Math.round(12.31 * 35 * 52 / 12 * 100) / 100; // SMIC mensuel depuis juin 2026
const NEUTRE = [[1635, 0], [1698, .5], [1807, 1.3], [1928, 2.1], [2060, 2.9], [2170, 3.5], [2315, 4.1], [2738, 5.3], [3135, 7.5], [3571, 9.9], [4019, 11.9], [4690, 13.8], [5624, 15.8], [7037, 17.9], [8789, 20], [12200, 24], [16523, 28], [25937, 33], [55558, 38], [Infinity, 43]];

// branches : couleur et lien vers « Argent public »
const BR = {
  net: ["Salaire net (après impôt)", "#16a34a"],
  ir: ["Impôt sur le revenu (État)", "#64748b"],
  retraite: ["Retraite", "#2563eb"],
  sante: ["Assurance maladie, autonomie", "#dc2626"],
  mutuelle: ["Mutuelle et prévoyance (organismes privés)", "#f97316"],
  famille: ["Famille", "#db2777"],
  chomage: ["Chômage", "#7c3aed"],
  atmp: ["Accidents du travail", "#a16207"],
  csg: ["CSG et CRDS", "#0891b2"],
  autres: ["Formation, transports, logement", "#94a3b8"]
};

/* impôt sur le revenu du foyer, barème 2026 (revenus 2025) */
const BAREME = [[11600, 0], [29579, 11], [84577, 30], [181917, 41], [Infinity, 45]];
function baremeParPart(q) { let imp = 0, prev = 0; for (const [lim, t] of BAREME) { if (q > prev) imp += (Math.min(q, lim) - prev) * t / 100; prev = lim; } return imp; }
function impotFoyer(revs, sit, enf) {
  const abattu = revs.map(r => r - Math.min(14555, Math.max(509, 0.1 * r)));
  const R = Math.max(0, abattu.reduce((a, b) => a + b, 0)), revTot = revs.reduce((a, b) => a + b, 0);
  const isole = sit === "isole" && enf > 0;
  const princ = sit === "couple" ? 2 : 1;
  const ratt = enf <= 2 ? 0.5 * enf : enf - 1;
  const maj = isole ? 0.5 : 0, parts = princ + ratt + maj;
  const brutParts = baremeParPart(R / parts) * parts;
  const brutPrinc = baremeParPart(R / princ) * princ;
  const plafond = 1807 * 2 * (ratt - maj) + (isole ? 4262 : 0);
  const impBrut = Math.max(brutParts, brutPrinc - plafond);
  const plafonne = impBrut > brutParts + 0.5;
  const D = sit === "couple" ? 1483 : 897;
  const decote = Math.max(0, Math.min(impBrut, D - 0.4525 * impBrut));
  const impot = Math.max(0, Math.round(impBrut - decote));
  return { impot, impotExact: Math.max(0, impBrut - decote), parts, R, revTot, impBrut, decote, plafonne, gainQF: Math.max(0, brutPrinc - impBrut) };
}

function calcul(brut, o) {
  const cadre = o.cadre, eff = o.eff, at = o.at / 100, vm = eff > 10 ? o.vm / 100 : 0;
  const mutP = o.mut * o.mutp, mutS = o.mut - mutP;
  const T1 = Math.min(brut, P), T2 = Math.max(0, Math.min(brut, 8 * P) - P), B4 = Math.min(brut, 4 * P), B8 = Math.min(brut, 8 * P);
  const prevCadre = cadre ? 0.015 * T1 : 0;
  const L = []; // [section, libellé, base, taux sal %, montant sal, taux pat %, montant pat, branche]
  const ln = (sec, lib, base, ts, tp, br, fixeS, fixeP) => {
    const ms = fixeS != null ? fixeS : base * (ts || 0) / 100, mp = fixeP != null ? fixeP : base * (tp || 0) / 100;
    L.push({ sec, lib, base, ts, ms, tp, mp, br });
  };
  // SANTÉ
  ln("Santé", "Sécurité sociale : maladie, maternité, invalidité, décès", brut, null, 13, "sante");
  ln("Santé", "Complémentaire santé (mutuelle d'entreprise)", null, null, null, "mutuelle", mutS, mutP);
  if (cadre) ln("Santé", "Prévoyance obligatoire des cadres (T1)", T1, null, 1.5, "mutuelle");
  // ACCIDENTS DU TRAVAIL
  ln("Accidents du travail et maladies professionnelles", "Accidents du travail, maladies professionnelles", brut, null, o.at, "atmp");
  // RETRAITE
  ln("Retraite", "Sécurité sociale plafonnée (T1)", T1, 6.90, 8.55, "retraite");
  ln("Retraite", "Sécurité sociale déplafonnée", brut, 0.40, 2.11, "retraite");
  ln("Retraite", "Complémentaire Agirc-Arrco tranche 1 (y compris CEG)", T1, 3.15 + 0.86, 4.72 + 1.29, "retraite");
  if (T2 > 0) ln("Retraite", "Complémentaire Agirc-Arrco tranche 2 (y compris CEG)", T2, 8.64 + 1.08, 12.95 + 1.62, "retraite");
  if (brut > P) ln("Retraite", "Contribution d'équilibre technique (CET)", B8, 0.14, 0.21, "retraite");
  // FAMILLE
  ln("Famille", "Allocations familiales", brut, null, 5.25, "famille");
  // CHÔMAGE
  ln("Assurance chômage", "Assurance chômage", B4, null, 4.00, "chomage");
  ln("Assurance chômage", "Garantie des salaires (AGS)", B4, null, 0.25, "chomage");
  if (cadre) ln("Assurance chômage", "APEC (emploi des cadres)", B4, 0.024, 0.036, "chomage");
  // AUTRES CONTRIBUTIONS DUES PAR L'EMPLOYEUR
  ln("Autres contributions dues par l'employeur", "Contribution solidarité autonomie (CSA)", brut, null, 0.30, "sante");
  ln("Autres contributions dues par l'employeur", "Fonds national d'aide au logement (FNAL)", eff < 50 ? T1 : brut, null, eff < 50 ? 0.10 : 0.50, "autres");
  ln("Autres contributions dues par l'employeur", "Formation professionnelle", brut, null, eff < 11 ? 0.55 : 1.00, "autres");
  ln("Autres contributions dues par l'employeur", "Taxe d'apprentissage (0,59 % + solde 0,09 %)", brut, null, 0.68, "autres");
  ln("Autres contributions dues par l'employeur", "Contribution au dialogue social", brut, null, 0.016, "autres");
  if (eff >= 50) ln("Autres contributions dues par l'employeur", "Participation à l'effort de construction (PEEC)", brut, null, 0.45, "autres");
  if (vm > 0) ln("Autres contributions dues par l'employeur", "Versement mobilité (transports en commun)", brut, null, o.vm, "autres");
  if (eff > 10 && (mutP + prevCadre) > 0) ln("Autres contributions dues par l'employeur", "Forfait social (8 % des contributions patronales de mutuelle et prévoyance)", mutP + prevCadre, null, 8, "sante");
  // CSG-CRDS
  const baseCSG = 0.9825 * Math.min(brut, 4 * P) + Math.max(0, brut - 4 * P) + mutP + prevCadre;
  ln("CSG et CRDS", "CSG déductible de l'impôt sur le revenu", baseCSG, 6.8, null, "csg");
  ln("CSG et CRDS", "CSG et CRDS non déductibles", baseCSG, 2.4 + 0.5, null, "csg");
  // RÉDUCTION GÉNÉRALE (RGDU 2026)
  let rgdu = 0, coef = 0;
  if (brut < 3 * SMIC) {
    const Td = eff < 50 ? 0.3781 : 0.3821;
    coef = Math.min(0.02 + Td, 0.02 + Td * Math.pow(0.5 * (3 * SMIC / brut - 1), 1.75));
    coef = Math.round(coef * 10000) / 10000;
    rgdu = brut * coef;
  }
  const sumS = L.reduce((s, l) => s + l.ms, 0), sumPavant = L.reduce((s, l) => s + l.mp, 0);
  const pat = sumPavant - rgdu;
  const net = brut - sumS;
  const csgND = baseCSG * 0.029;
  const imposable = net + csgND + mutP;
  let tx, foyer = null;
  const fam = o.fam || { sit: "neutre" };
  if (fam.sit === "neutre") tx = NEUTRE.find(([lim]) => imposable <= lim)[1];
  else {
    const revs = [imposable * 12];
    if (fam.sit === "couple" && fam.conj > 0) revs.push(calcul(Math.max(SMIC, fam.conj), { ...o, cadre: false, fam: { sit: "neutre" } }).imposable * 12);
    foyer = impotFoyer(revs, fam.sit, fam.enf);
    tx = foyer.revTot > 0 ? Math.round(foyer.impot / foyer.revTot * 1000) / 10 : 0;
  }
  const ir = Math.round(imposable * tx) / 100;
  const irExact = foyer ? (foyer.revTot > 0 ? imposable * 12 * foyer.impotExact / foyer.revTot / 12 : 0) : ir;
  const cout = brut + pat;
  // répartition par branche (la réduction générale est imputée au prorata des cotisations de Sécurité sociale qu'elle allège)
  const parBr = {}; Object.keys(BR).forEach(k => parBr[k] = 0);
  L.forEach(l => parBr[l.br] += l.ms + l.mp);

  // part patronale allégeable par branche
  const patBr = {}; ["sante", "retraite", "famille", "chomage", "atmp"].forEach(k => patBr[k] = L.filter(l => l.br === k && l.lib.indexOf("mutuelle") < 0).reduce((s, l) => s + l.mp, 0));
  const patTot = Object.values(patBr).reduce((a, b) => a + b, 0);
  Object.keys(patBr).forEach(k => parBr[k] -= patTot ? rgdu * patBr[k] / patTot : 0);
  parBr.ir = ir; parBr.net = net - ir;
  return { L, sumS, sumPavant, rgdu, coef, pat, net, imposable, tx, ir, irExact, cout, baseCSG, parBr, brut, foyer };
}

function opts() { const sit = $("#bu-sit").value; return { cadre: $("#bu-cadre").value === "1", eff: +$("#bu-eff").value, vm: +$("#bu-vm").value, mut: +$("#bu-mut").value || 0, mutp: +$("#bu-mutp").value, at: +$("#bu-at").value || 2.08, fam: { sit, enf: +$("#bu-enf").value, conj: sit === "couple" ? (+$("#bu-conj").value || 0) : 0 } }; }

function rendu() {
  let brut = +$("#bu-brut").value || SMIC; if (brut < SMIC) brut = SMIC;
  const o = opts(), r = calcul(brut, o);
  window.TH.kpis("#bu-kpis", [
    [eur(r.cout, 0), ["coût total pour l'employeur", "par mois"], "Coût employeur"],
    [eur(brut, 0), ["salaire brut du contrat"], "Brut"],
    [eur(r.net, 0), ["net versé avant impôt", `${pct(r.net / brut * 100, 1)} du brut`], "Net avant impôt"],
    [eur(r.net - r.ir, 0), [`après impôt à la source (taux ${o.fam.sit === "neutre" ? "neutre" : "du foyer"} ${pct(r.tx, 1)})`, `${pct((r.net - r.ir) / r.cout * 100, 1)} du coût employeur`], "Net après impôt"]
  ]);
  annuel(r); cascade(r); barre100(r); table(r, o); familles(brut, o); marginal(brut, o); courbe(o, brut);
  document.querySelectorAll(".bu-pre").forEach(b => b.classList.toggle("on", (b.dataset.b === "smic" ? Math.abs(brut - SMIC) < 1 : +b.dataset.b === brut)));
}

function annuel(r) {
  const el = $("#bu-an"); if (!el) return;
  const f = r.foyer;
  el.innerHTML = `Par an : coût employeur <b>${eur(r.cout * 12, 0)}</b>, brut <b>${eur(r.brut * 12, 0)}</b>, net avant impôt <b>${eur(r.net * 12, 0)}</b>, impôt prélevé <b>${eur(r.ir * 12, 0)}</b>, net après impôt <b>${eur((r.net - r.ir) * 12, 0)}</b> (sans prime ni treizième mois).` + (f ? ` Impôt du foyer : <b>${eur(f.impot, 0)}</b> pour ${String(f.parts).replace(".", ",")} part${f.parts > 1 ? "s" : ""}, revenu net imposable après abattement de 10 % : ${eur(f.R, 0)}${f.decote > 0 ? `, décote ${eur(f.decote, 0)}` : ""}${f.gainQF > 0 ? `, gain dû au quotient familial ${eur(f.gainQF, 0)}${f.plafonne ? " (plafonné)" : ""}` : ""}.` : "");
}
function cascade(r) {
  const el = $("#bu-cascade"); if (!el) return;
  const st = [["Coût employeur", r.cout, "#1e3a8a", "tot"], ["Cotisations patronales", -r.pat, "#2563eb"], ["Salaire brut", r.brut, "#334155", "tot"], ["Cotisations salariales", -(r.sumS - r.L.filter(l => l.br === "csg").reduce((a, l) => a + l.ms, 0)), "#0ea5e9"], ["CSG et CRDS", -r.L.filter(l => l.br === "csg").reduce((a, l) => a + l.ms, 0), "#0891b2"], ["Net avant impôt", r.net, "#15803d", "tot"], ["Impôt à la source", -r.ir, "#64748b"], ["Net après impôt", r.net - r.ir, "#16a34a", "tot"]];
  const W = 900, H = 280, m = { l: 10, r: 10, t: 24, b: 54 }, bw = (W - m.l - m.r) / st.length, y = d3.scaleLinear([0, r.cout * 1.05], [H - m.b, m.t]);
  let s = `<svg viewBox="0 0 ${W} ${H}" width="100%" style="font-size:11px">`, cur = 0;
  st.forEach(([l, v, c, tot], i) => {
    const x = m.l + i * bw + 8, w = bw - 16;
    let y0, y1; if (tot) { y0 = 0; y1 = v; cur = v; } else { y0 = cur + v; y1 = cur; cur = cur + v; }
    s += `<rect x="${x}" y="${y(Math.max(y0, y1))}" width="${w}" height="${Math.max(1, Math.abs(y(y0) - y(y1)))}" fill="${c}" rx="3"/>`;
    s += `<text x="${x + w / 2}" y="${y(Math.max(y0, y1)) - 6}" text-anchor="middle" font-weight="700" style="fill:${c}">${tot || Math.abs(v) < 0.5 ? "" : "−"}${Math.abs(v).toLocaleString("fr-FR", { maximumFractionDigits: 0 })} €</text>`;
    l.split(" ").reduce((acc, w2) => { const last = acc[acc.length - 1]; if ((last + " " + w2).trim().length > 14) acc.push(w2); else acc[acc.length - 1] = (last + " " + w2).trim(); return acc; }, [""]).forEach((t, j) => s += `<text x="${x + w / 2}" y="${H - m.b + 16 + j * 13}" text-anchor="middle" style="fill:#334155">${t}</text>`);
    if (i < st.length - 1) s += `<line x1="${x + w}" x2="${x + bw + 8}" y1="${y(cur)}" y2="${y(cur)}" stroke="#94a3b8" stroke-dasharray="3 3"/>`;
  });
  el.innerHTML = s + "</svg>";
}
const SITS = [["Célibataire, sans enfant", "seul", 0, 0], ["Parent isolé, 1 enfant", "isole", 1, 0], ["Parent isolé, 2 enfants", "isole", 2, 0], ["Couple, conjoint sans revenu", "couple", 0, 0], ["Couple, 2 enfants, conjoint sans revenu", "couple", 2, 0], ["Couple, 2 enfants, conjoint au SMIC", "couple", 2, -1], ["Couple, 3 enfants, conjoint au SMIC", "couple", 3, -1]];
function familles(brut, o) {
  const el = $("#bu-fam"); if (!el) return;
  const rows = SITS.map(([l, sit, enf, conj]) => { const r = calcul(brut, { ...o, fam: { sit, enf, conj: conj < 0 ? SMIC : conj } }); return [l, r.ir * 12, r.tx, r.foyer]; });
  window.TH.bars(el, rows.map(([l, v, tx], i) => ({ l, v: Math.max(v, 0.001), t: `${eur(v, 0)} par an (taux ${pct(tx, 1)})`, c: ["#64748b", "#a855f7", "#7c3aed", "#0ea5e9", "#2563eb", "#16a34a", "#15803d"][i] })));
  const base = rows[0][1];
  $("#bu-fam-txt").innerHTML = `Pour un même salaire brut de ${eur(brut, 0)} par mois, l'impôt sur le revenu prélevé sur ce salaire varie de ${eur(Math.min(...rows.map(r => r[1])), 0)} à ${eur(Math.max(...rows.map(r => r[1])), 0)} par an selon la situation du foyer. Les cotisations sociales, elles, ne changent pas : elles ne dépendent que du salaire. Pour un couple, le taux est celui du foyer, appliqué aux deux salaires.`;
}
function marginal(brut, o) {
  const el = $("#bu-marg"); if (!el) return;
  const keep = b => { const r1 = calcul(b, o), r2 = calcul(b + 100, o); return ((r2.net - r2.irExact) - (r1.net - r1.irExact)) / (r2.cout - r1.cout); };
  const k0 = keep(brut);
  const pts = []; for (let b = SMIC; b <= 10000; b += 20) pts.push([b, keep(b)]);
  const W = 900, H = 270, m = { l: 50, r: 20, t: 16, b: 44 }, x = d3.scaleLinear([SMIC, 10000], [m.l, W - m.r]), y = d3.scaleLinear([0, .8], [H - m.b, m.t]);
  let s = `<svg viewBox="0 0 ${W} ${H}" width="100%" style="font-size:11px">`;
  [0, .2, .4, .6, .8].forEach(v => s += `<line x1="${m.l}" x2="${W - m.r}" y1="${y(v)}" y2="${y(v)}" stroke="#e2e8f0"/><text x="${m.l - 6}" y="${y(v) + 4}" text-anchor="end" style="fill:#64748b">${Math.round(v * 100)} €</text>`);
  [[SMIC, "SMIC"], [2 * SMIC, "2 SMIC"], [3 * SMIC, "3 SMIC"], [P, "plafond SS", 1], [10000, "10 000 €"]].forEach(([v, l, up]) => s += `<line x1="${x(v)}" x2="${x(v)}" y1="${m.t}" y2="${H - m.b}" stroke="#cbd5e1" stroke-dasharray="3 3"/><text x="${x(v)}" y="${up ? H - m.b + 28 : H - m.b + 16}" text-anchor="${v === 10000 ? "end" : "middle"}" style="fill:#475569">${l}</text>`);
  s += `<path d="M${pts.map(([b, k]) => `${x(b).toFixed(1)},${y(Math.max(0, Math.min(.8, k))).toFixed(1)}`).join(" L")}" fill="none" stroke="#16a34a" stroke-width="2.5"/>`;
  s += `<circle cx="${x(Math.min(10000, brut))}" cy="${y(Math.max(0, Math.min(.8, k0)))}" r="6" fill="#111827"/><text x="${x(Math.min(10000, brut)) + 9}" y="${y(Math.max(0, Math.min(.8, k0))) - 8}" font-weight="700">${Math.round(k0 * 100)} € gardés</text>`;
  s += `<text x="${m.l + 4}" y="${m.t + 4}" style="fill:#64748b">↑ euros nets (après impôt) gardés par le salarié sur 100 € de coût employeur supplémentaire</text>`;
  el.innerHTML = s + "</svg>";
  $("#bu-marg-txt").innerHTML = `À ${eur(brut, 0)} brut, si l'employeur dépense 100 € de plus pour augmenter ce salarié, le salarié touche environ <b>${Math.round(k0 * 100)} €</b> de plus après impôt ; le reste part en cotisations, en CSG, en impôt et en réduction générale perdue. ` + (brut < 2 * SMIC ? "Près du SMIC, la réduction générale diminue à mesure que le salaire monte : chaque euro d'augmentation coûte donc à l'employeur nettement plus d'un euro de cotisations. Les économistes parlent de « trappe à bas salaires », l'un des effets pervers des allègements ciblés." : "Les sauts de la courbe viennent des seuils : fin de la réduction générale à 3 SMIC, plafond de la Sécurité sociale, tranches de l'impôt.");
}

function barre100(r) {
  const el = $("#bu-100"); const ord = ["net", "ir", "retraite", "sante", "csg", "famille", "chomage", "atmp", "mutuelle", "autres"];
  const W = 900, H = 120, x0 = 10, w = W - 20; let x = x0;
  let s = `<svg viewBox="0 0 ${W} ${H}" width="100%" style="font-size:11px">`;
  ord.forEach(k => { const v = r.parBr[k] / r.cout * 100; if (v <= 0.05) return; const ww = w * v / 100; s += `<rect x="${x}" y="20" width="${ww}" height="50" fill="${BR[k][1]}"><title>${BR[k][0]} : ${pct(v, 1)} (${eur(r.parBr[k], 0)})</title></rect>`; if (ww > 34) s += `<text x="${x + ww / 2}" y="50" text-anchor="middle" style="fill:#fff" font-weight="700">${Math.round(v)} €</text>`; x += ww; });
  s += `<text x="${x0}" y="14" style="fill:#64748b">sur 100 € de coût employeur</text><text x="${x0}" y="92" style="fill:#16a34a" font-weight="700">${Math.round(r.parBr.net / r.cout * 100)} € pour le salarié, après impôt</text><text x="${W - 10}" y="92" text-anchor="end" style="fill:#475569">${Math.round(100 - r.parBr.net / r.cout * 100)} € de prélèvements (dont ${Math.round(r.parBr.retraite / r.cout * 100)} € pour la retraite)</text>`;
  if (r.rgdu > 0) s += `<text x="${x0}" y="110" style="fill:#64748b">réduction générale déduite : ${eur(r.rgdu, 0)} par mois (${pct(r.coef * 100, 2)} du brut), compensée par l'État à la Sécurité sociale</text>`;
  el.innerHTML = s + "</svg>";
  $("#bu-100-leg").innerHTML = ord.filter(k => r.parBr[k] > 0.05).map(k => `<span><i style="border-top-color:${BR[k][1]};opacity:1;width:14px;border-top-width:10px"></i>${BR[k][0]}</span>`).join("");
  $("#bu-100-txt").innerHTML = `Ces montants financent les dépenses décrites dans l'onglet <a href="#argent-public">Argent public</a> : les cotisations retraite paient les pensions des retraités actuels (répartition), l'assurance maladie les soins et les indemnités journalières, la branche famille les allocations, l'impôt le budget de l'État. La part « Mutuelle et prévoyance » va à des organismes privés ou paritaires, hors administrations publiques.`;
}

function table(r, o) {
  const secs = [...new Set(r.L.map(l => l.sec))];
  let h = `<thead><tr><th style="text-align:left">Ligne</th><th>Base</th><th>Taux salarié</th><th>Part salarié</th><th>Taux employeur</th><th>Part employeur</th></tr></thead><tbody>`;
  h += `<tr style="font-weight:700"><td>Salaire de base (151,67 h)</td><td></td><td></td><td>${eur(r.brut)}</td><td></td><td></td></tr>`;
  secs.forEach(sec => {
    const ls = r.L.filter(l => l.sec === sec);
    h += `<tr><td colspan="6" style="background:var(--soft);font-weight:700;text-transform:uppercase;font-size:.78rem;letter-spacing:.04em">${sec}</td></tr>`;
    ls.forEach(l => { h += `<tr><td>${l.lib}</td><td style="text-align:right">${l.base != null ? eur(l.base) : "forfait"}</td><td style="text-align:right">${l.ts ? pct(l.ts, 3) : ""}</td><td style="text-align:right">${l.ms ? eur(-l.ms) : ""}</td><td style="text-align:right">${l.tp ? pct(l.tp, 3) : ""}</td><td style="text-align:right">${l.mp ? eur(l.mp) : ""}</td></tr>`; });
  });
  h += `<tr><td colspan="6" style="background:var(--soft);font-weight:700;text-transform:uppercase;font-size:.78rem;letter-spacing:.04em">Exonérations</td></tr>`;
  h += `<tr><td>Réduction générale des cotisations patronales (dégressive jusqu'à 3 SMIC)</td><td style="text-align:right">${eur(r.brut)}</td><td></td><td></td><td style="text-align:right">${r.rgdu ? "−" + pct(r.coef * 100, 2) : "0 %"}</td><td style="text-align:right">${r.rgdu ? eur(-r.rgdu) : "–"}</td></tr>`;
  h += `<tr style="font-weight:700;border-top:2px solid var(--line)"><td>Total des cotisations et contributions</td><td></td><td></td><td style="text-align:right">${eur(-r.sumS)}</td><td></td><td style="text-align:right">${eur(r.pat)}</td></tr>`;
  h += `<tr style="font-weight:800"><td>Net à payer avant impôt sur le revenu</td><td></td><td></td><td style="text-align:right">${eur(r.net)}</td><td></td><td></td></tr>`;
  h += `<tr><td>Net imposable (net + CSG non déductible + CRDS + part employeur de la mutuelle)</td><td></td><td></td><td style="text-align:right">${eur(r.imposable)}</td><td></td><td></td></tr>`;
  h += `<tr><td>Impôt prélevé à la source (taux ${o.fam.sit === "neutre" ? "neutre" : "du foyer"} ${pct(r.tx, 1)})</td><td style="text-align:right">${eur(r.imposable)}</td><td style="text-align:right">${pct(r.tx, 1)}</td><td style="text-align:right">${eur(-r.ir)}</td><td></td><td></td></tr>`;
  h += `<tr style="font-weight:800;color:#16a34a"><td>Net payé au salarié</td><td></td><td></td><td style="text-align:right">${eur(r.net - r.ir)}</td><td></td><td></td></tr>`;
  h += `<tr style="font-weight:800"><td>Coût total pour l'employeur (brut + part employeur)</td><td></td><td></td><td></td><td></td><td style="text-align:right">${eur(r.cout)}</td></tr></tbody>`;
  $("#bu-table").innerHTML = h;
}

function courbe(o, brutSel) {
  const el = $("#bu-courbe"); const pts = [];
  for (let b = SMIC; b <= 12000; b += 25) { const r = calcul(b, o); pts.push({ b, net: (r.net - r.ir) / r.cout, ir: r.ir / r.cout, sal: r.sumS / r.cout, pat: r.pat / r.cout }); }
  const W = 900, H = 330, m = { l: 50, r: 200, t: 14, b: 48 }, x = d3.scaleLinear([SMIC, 12000], [m.l, W - m.r]), y = d3.scaleLinear([0, 1], [H - m.b, m.t]);
  const keys = [["net", "#16a34a", "net après impôt"], ["ir", "#64748b", "impôt sur le revenu"], ["sal", "#0891b2", "cotisations et CSG salariales"], ["pat", "#2563eb", "cotisations patronales"]];
  let s = `<svg viewBox="0 0 ${W} ${H}" width="100%" style="font-size:11px">`;
  let low = pts.map(() => 0);
  keys.forEach(([k, c, lab]) => {
    const up = pts.map((p, i) => low[i] + p[k]);
    s += `<path d="M${pts.map((p, i) => `${x(p.b).toFixed(1)},${y(up[i]).toFixed(1)}`).join(" L")} L${pts.map((p, i) => `${x(p.b).toFixed(1)},${y(low[i]).toFixed(1)}`).reverse().join(" L")} Z" fill="${c}" opacity=".8"/>`;
    const last = pts.length - 1; s += `<text x="${W - m.r + 6}" y="${y((low[last] + up[last]) / 2) + 4}" style="fill:${c}" font-weight="700">${lab}</text>`;
    low = up;
  });
  [0, .25, .5, .75, 1].forEach(v => s += `<line x1="${m.l}" x2="${W - m.r}" y1="${y(v)}" y2="${y(v)}" stroke="#fff" stroke-opacity=".5"/><text x="${m.l - 6}" y="${y(v) + 4}" text-anchor="end" style="fill:#64748b">${v * 100} %</text>`);
  [[SMIC, "SMIC", 0], [2 * SMIC, "2 SMIC", 0], [3 * SMIC, "3 SMIC", 0], [P, "plafond SS", 1], [8000, "8 000 €", 0], [12000, "12 000 €", 0]].forEach(([v, l, up]) => s += `<line x1="${x(v)}" x2="${x(v)}" y1="${m.t}" y2="${H - m.b + 4}" stroke="#334155" stroke-dasharray="3 3" opacity=".6"/><text x="${x(v)}" y="${up ? m.t - 2 : H - m.b + 16}" text-anchor="${v === 12000 ? "end" : "middle"}" style="fill:#475569">${l}</text>`);
  if (brutSel >= SMIC && brutSel <= 12000) s += `<line x1="${x(brutSel)}" x2="${x(brutSel)}" y1="${m.t}" y2="${H - m.b}" stroke="#111827" stroke-width="2.5"/><text x="${x(brutSel)}" y="${H - 14}" text-anchor="middle" font-weight="700">${eur(brutSel, 0)}</text>`;
  s += `<text x="${W - m.r}" y="${H - 2}" text-anchor="end" style="fill:#64748b">salaire brut mensuel →</text>`;
  el.innerHTML = s + "</svg>";
  $("#bu-courbe-leg").innerHTML = `<span class="muted">Part du coût employeur selon le salaire brut. Au SMIC, l'employeur ne paie presque plus de cotisations de Sécurité sociale ; la part du salarié dans le coût est la plus élevée. Elle baisse ensuite jusqu'à 3 SMIC, à mesure que la réduction disparaît, puis l'impôt progressif réduit encore la part nette.</span>`;
}

function init() {
  if (!window.TH || !window.d3) { setTimeout(init, 100); return; }
  if (!$("#bulletin")) return;
  const B = $("#bu-brut"), Rg = $("#bu-brut-r"); Rg.max = 20000;
  B.min = Rg.min = Math.ceil(SMIC);
  B.addEventListener("input", () => { Rg.value = Math.min(20000, +B.value || SMIC); rendu(); });
  Rg.addEventListener("input", () => { B.value = Rg.value; rendu(); });
  ["bu-cadre", "bu-eff", "bu-vm", "bu-mut", "bu-mutp", "bu-at", "bu-enf", "bu-conj"].forEach(i => $("#" + i).addEventListener("input", rendu));
  $("#bu-sit").addEventListener("input", () => { $("#bu-conj-l").hidden = $("#bu-sit").value !== "couple"; $("#bu-enf").disabled = $("#bu-sit").value === "neutre"; rendu(); });
  document.querySelectorAll(".bu-pre").forEach(b => b.addEventListener("click", () => { const v = b.dataset.b === "smic" ? SMIC : +b.dataset.b; B.value = v; Rg.value = Math.min(20000, v); $("#bu-cadre").value = b.dataset.c ? "1" : "0"; rendu(); }));
  try { rendu(); } catch (e) { console.error("bulletin", e); }
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
window.__bulletinCalc = calcul;
})();
