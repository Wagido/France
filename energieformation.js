/* Énergie : comment se forme le coût d'un MWh (CAPEX, OPEX, financement), assemblage des scénarios RTE, comparaison aux prix actuels */
(() => {
"use strict";
const $ = s => document.querySelector(s);
const f1 = v => v == null ? "–" : (Math.round(v * 10) / 10).toLocaleString("fr-FR");
const f0 = v => v == null ? "–" : Math.round(v).toLocaleString("fr-FR");
const FAM = { sol: "#f59e0b", eol: "#14b8a6", nuc: "#3b6fd6", flex: "#a855f7" };

/* barres empilées horizontales en HTML (valeurs négatives à gauche du zéro) */
function stack(el, rows, postes, cols, opts = {}) {
  const pos = rows.map(r => r.v.filter(x => x > 0).reduce((a, b) => a + b, 0));
  const neg = rows.map(r => -r.v.filter(x => x < 0).reduce((a, b) => a + b, 0));
  const P = opts.max ?? Math.max(...pos), N = Math.max(0, ...neg), W = P + N;
  const u = opts.unit || "";
  el.innerHTML = `<div class="fs-stack">${rows.map((r, i) => {
    let segs = "", left = N;
    r.v.forEach((x, k) => { if (x > 0) { segs += `<span title="${postes[k]} : ${f1(x)} ${u}" style="left:${(100 * left / W).toFixed(2)}%;width:${(100 * x / W).toFixed(2)}%;background:${cols[k]}">${x / W > 0.07 ? f1(x) : ""}</span>`; left += x; } });
    let l2 = N;
    r.v.forEach((x, k) => { if (x < 0) { l2 += x; segs += `<span title="${postes[k]} : ${f1(x)} ${u}" style="left:${(100 * l2 / W).toFixed(2)}%;width:${(100 * -x / W).toFixed(2)}%;background:${cols[k]}">${-x / W > 0.07 ? f1(x) : ""}</span>`; } });
    const tot = r.v.reduce((a, b) => a + b, 0);
    return `<div class="fs-row"><span class="fs-lab">${r.l}</span><span class="fs-track">${N ? `<i class="fs-zero" style="left:${(100 * N / W).toFixed(2)}%"></i>` : ""}${segs}</span><span class="fs-tot">${f1(tot)} ${u}</span></div>`;
  }).join("")}</div><div class="legend-row">${postes.map((p, k) => `<span><i style="border-top-color:${cols[k]};opacity:1;border-top-width:10px;width:14px"></i>${p}</span>`).join("")}</div>`;
}

async function init() {
  if (!window.TH || !$("#ff-capex")) { setTimeout(init, 100); return; }
  let D; try { D = await fetch("data/energie_formation.json", { cache: "no-cache" }).then(r => r.json()); }
  catch (e) { $("#ff-capex").innerHTML = `<p class="empty">Données indisponibles.</p>`; return; }
  const { esc } = window.TH, S = D.sources;
  const src = k => `<a href="${S[k].u}" target="_blank" rel="noopener">${esc(S[k].l)}</a>`;

  /* 1. CAPEX */
  const C = D.capex.rows, maxC = 5400;
  $("#ff-capex").innerHTML = `<table class="pr-t ff-t"><thead><tr><th>Filière</th><th>2020</th><th>2030</th><th>2050</th><th style="width:34%">Coût de 1 MW en 2050</th></tr></thead><tbody>${C.map(r => `<tr><td class="lab">${esc(r.f)}${r.txt ? `<br><small class="muted">${esc(r.txt)}</small>` : ""}</td>
    <td>${r.c2020 ? f0(r.c2020) : "–"}</td><td>${r.c2030 ? f0(r.c2030) : "–"}</td><td><b>${f0(r.c2050)}</b></td>
    <td><span class="ff-bar" style="width:${(100 * r.c2050 / maxC).toFixed(1)}%;background:${FAM[r.fam]}"></span> <small>${f1(r.c2050 / 1000)} M€</small></td></tr>`).join("")}</tbody></table>
    <p class="muted" style="font-size:.8rem;margin:4px 0 0">En euros par kW installé (1 000 €/kW = 1 million d'euros par MW). ${esc(D.capex.note)} Source : ${src("rte")}.</p>`;

  /* 2. formule + nucléaire neuf selon le coût du capital */
  const N = D.nucneuf;
  stack($("#ff-nuc"), N.rows, N.postes, ["#1e3a8a", "#3b6fd6", "#93c5fd", "#f97316"], { unit: "€/MWh" });

  /* 3. coût du MWh par filière en 2050 */
  const L = D.lcoe2050.rows;
  stack($("#ff-lcoe"), L.map(r => ({ l: r.f, v: [r.v, r.r] })), ["Production", "Raccordement en mer"], ["#64748b", "#cbd5e1"], { unit: "€/MWh" });
  $("#ff-lcoe").querySelectorAll(".fs-row").forEach((row, i) => { const s = row.querySelector(".fs-track span"); if (s) s.style.background = FAM[L[i].fam]; });

  /* 4. nucléaire existant (CRE) */
  const E = D.nucexistant, gc = { OPEX: ["#0e7490", "#14b8a6", "#5eead4", "#99f6e4"], Capital: ["#1e3a8a", "#f97316", "#fdba74"], Autre: ["#94a3b8"] };
  const cols = [], cnt = { OPEX: 0, Capital: 0, Autre: 0 };
  E.rows.forEach(r => cols.push(gc[r.g][cnt[r.g]++]));
  stack($("#ff-exist"), [{ l: "Parc nucléaire existant, 2026-2028", v: E.rows.map(r => r.v) }], E.rows.map(r => r.l), cols, { unit: "€/MWh" });
  const sum = g => E.rows.filter(r => r.g === g).reduce((a, r) => a + r.v, 0);
  $("#ff-exist-txt").innerHTML = `<ul>
    <li><b>Exploitation (OPEX) : ${f1(sum("OPEX"))} €/MWh</b>, environ la moitié : combustible ${f1(E.rows[0].v)}, achats ${f1(E.rows[1].v)}, personnel ${f1(E.rows[2].v)}, autres ${f1(E.rows[3].v)}. Ce sont surtout des coûts fixes : les centrales coûtent presque autant qu'elles tournent ou non, d'où l'importance du volume produit (362 TWh par an retenus).</li>
    <li><b>Capital : ${f1(sum("Capital"))} €/MWh</b>, l'autre moitié. Le remboursement de l'investissement (amortissements, ${f1(E.rows[4].v)} €) et sa rémunération (${f1(E.rows[5].v)} €) : c'est ce que gagne l'investisseur pour avoir immobilisé son argent, au taux de 9,1 % par an (nominal, avant impôt) retenu par la CRE, contre 11,3 % demandé par EDF. Cette rémunération porte à elle seule environ 4 €/MWh d'écart entre le chiffre de la CRE (60,3 €) et celui d'EDF.</li>
    <li><b>Une grande partie du parc est déjà amortie</b> : c'est pour cela que le nucléaire existant reste bon marché. La rémunération de Flamanville 3, seul réacteur récent, pèse 4,2 €/MWh sur l'ensemble.</li>
  </ul><p class="muted" style="font-size:.8rem;margin:4px 0 0">${esc(E.note)} Source : ${src("cre_nuc")}.</p>`;

  /* 5. assemblage des scénarios 2060 */
  const Y = D.systeme2060;
  stack($("#ff-sys"), Y.rows.map(r => ({ l: r.id, v: r.v })), Y.postes, ["#3b6fd6", "#16a34a", "#f97316", "#0ea5e9", "#2dd4bf", "#cbd5e1"], { unit: "Md€" });
  stack($("#ff-flex"), Y.flex.map(r => ({ l: r.id, v: r.v })), Y.flex_postes, ["#7dd3fc", "#9d174d", "#a3e635", "#1e3a8a"], { unit: "Md€" });
  const g = id => Y.rows.find(r => r.id === id).v, t = v => v.reduce((a, b) => a + b, 0);
  const m23 = g("M23"), n2 = g("N2");
  $("#ff-sys-txt").innerHTML = `<ul>
    <li><b>Comment RTE assemble un scénario</b> : (1) fixer la consommation (la même pour tous : environ 645 TWh en 2050 dans la trajectoire de référence) ; (2) choisir un parc de production (part du nucléaire, de l'éolien, du solaire) ; (3) simuler heure par heure, sur un grand nombre d'années météo, l'équilibre entre production et consommation ; (4) ajouter les flexibilités nécessaires pour ne jamais manquer d'électricité (stockage, effacements, centrales de secours, imports) ; (5) dimensionner les réseaux ; (6) additionner le coût annualisé de tout, avec le même coût du capital (4 %).</li>
    <li><b>Production</b> : M23 (100 % renouvelable, grands parcs) a la production la moins chère : ${f1(m23[0] + m23[1])} Md€/an contre ${f1(n2[0] + n2[1])} pour N2. C'est le « LCOE » plus bas des renouvelables.</li>
    <li><b>Mais la flexibilité renverse la comparaison</b> : ${f1(m23[2])} Md€/an pour M23 contre ${f1(n2[2])} pour N2. Sans nucléaire, il faut des centrales à hydrogène pour les semaines sans vent, plus de batteries et plus d'imports (graphique du bas).</li>
    <li><b>Et les réseaux</b> : ${f1(m23[3] + m23[4])} Md€/an pour M23 contre ${f1(n2[3] + n2[4])} pour N2 : des installations plus nombreuses et plus dispersées à raccorder.</li>
    <li><b>Total</b> : ${f1(t(m23))} Md€/an pour M23, ${f1(t(n2))} pour N2, soit environ ${f0(t(m23) - t(n2))} Md€ d'écart par an. Rapporté à l'électricité consommée, RTE estime le coût complet du système à environ 90 € par MWh aujourd'hui (2020-2021) et entre 92 et 119 € par MWh en 2060 selon les scénarios, soit une hausse médiane d'environ 15 % (figure 11.28), réseaux compris, hors taxes.</li>
  </ul><p class="muted" style="font-size:.8rem;margin:4px 0 0">${esc(Y.note)} Source : ${src("rte")}.</p>`;

  /* 6. coûts vs prix */
  const PR = D.prix.rows;
  const blk = (t, titre, c) => `<p style="margin:8px 0 2px"><b>${titre}</b></p><div class="ff-pr-${t}"></div>`;
  $("#ff-prix").innerHTML = blk("cout", "Ce que coûte la production d'un MWh") + blk("prix", "Le prix auquel un MWh se vend aux fournisseurs");
  ["cout", "prix"].forEach(t => window.TH.bars($("#ff-prix .ff-pr-" + t), PR.filter(r => r.t === t).map(r => ({ l: r.l, v: r.v, t: f1(r.v) + " €", c: t === "cout" ? "#3b6fd6" : "#f97316" })), { max: 105 }));
  $("#ff-prix").insertAdjacentHTML("beforeend", `<p class="muted" style="font-size:.8rem;margin:4px 0 0">En euros par MWh, hors taxes. ${esc(D.prix.note)}</p>`);
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
