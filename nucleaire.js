/* Nucléaire : le choix technologique français face aux autres filières et aux développements en cours */
(() => {
"use strict";
const $ = s => document.querySelector(s);
const f0 = v => v == null || v === "" ? "–" : (typeof v === "number" ? Math.round(v).toLocaleString("fr-FR") : v);

async function init() {
  if (!window.TH || !$("#nu-types")) { setTimeout(init, 100); return; }
  let D; try { D = await fetch("data/nucleaire.json", { cache: "no-cache" }).then(r => r.json()); }
  catch (e) { $("#nu-types").innerHTML = `<p class="empty">Données indisponibles.</p>`; return; }
  const { esc, bars, kpis } = window.TH, S = D.sources;
  const src = k => `<a href="${S[k].u}" target="_blank" rel="noopener">${esc(S[k].l)}</a>`;
  const M = D.monde;

  kpis("#nu-kpis", [
    [M.operables, [`${M.gwe} GW dans ${M.pays} pays`, `${M.part} % de l'électricité mondiale en 2025`], "Réacteurs dans le monde"],
    ["~" + M.construction, [`dans ${M.pays_construction} pays`, "dont près de la moitié en Chine"], "En construction"],
    [D.chine.operables, [`${D.chine.construction} en construction`, "près de la moitié des chantiers du monde"], "Réacteurs en Chine"],
    ["57", ["56 réacteurs historiques + Flamanville 3", "tous à eau sous pression (REP)"], "Réacteurs en France"]
  ]);

  /* 1. familles */
  const T = D.types, totN = T.reduce((a, r) => a + r.n, 0);
  $("#nu-types").innerHTML = `<table class="pr-t ff-t"><thead><tr><th>Filière</th><th>Combustible</th><th>Caloporteur</th><th>Modérateur</th><th>Réacteurs</th><th>GW</th><th style="width:22%">Part du parc mondial</th></tr></thead><tbody>${T.map(r => `<tr><td class="lab"><b>${esc(r.t)}</b><br><small class="muted">${esc(r.pays)}</small></td><td>${esc(r.comb)}</td><td>${esc(r.calo)}</td><td>${esc(r.mod)}</td><td>${r.n}</td><td>${f0(r.gw)}</td>
    <td><span class="ff-bar" style="width:${(100 * r.n / totN).toFixed(1)}%;background:#3b6fd6"></span> <small>${(100 * r.n / totN).toFixed(0)} %</small></td></tr>`).join("")}</tbody></table>
    <p class="muted" style="font-size:.8rem;margin:4px 0 0">Réacteurs exploitables. Source : ${src("wna_types")}.</p>`;

  /* 3. génération III+ */
  const G = D.gen3;
  const lignes = [["Développeur", "dev"], ["Puissance thermique (MWt)", "mwt"], ["Puissance électrique (MWe)", "mwe"], ["Boucles primaires", "boucles"], ["Assemblages combustible", "ac"], ["Taux de combustion (GWj/t)", "bu"], ["Rendement", "eff"], ["Approche de sûreté", "surete"], ["Tenue au séisme", "seisme"], ["Durée de vie de conception", "vie"], ["Où en est-on ?", "statut"]];
  $("#nu-gen3").innerHTML = `<table class="pr-t nu-wide"><thead><tr><th></th>${G.map(r => `<th>${esc(r.r)}</th>`).join("")}</tr></thead><tbody>${lignes.map(([l, k]) => `<tr><td class="lab"><b>${l}</b></td>${G.map(r => `<td>${esc(String(f0(r[k])))}</td>`).join("")}</tr>`).join("")}</tbody></table>
    <p class="muted" style="font-size:.8rem;margin:4px 0 0">« – » : non publié dans la source. Gal : unité d'accélération sismique (1 Gal = 1 cm/s²). Source : ${src("wna_adv")}.</p>`;

  /* 4. chantiers */
  const C = D.chantiers.rows;
  $("#nu-chantiers").innerHTML = `<div class="fs-stack">${C.map(r => `<div class="fs-row"><span class="fs-lab">${esc(r.l)}<br><small class="muted">${esc(r.txt)}</small></span><span class="fs-track" style="height:26px">
      <span style="left:0;width:${(100 * r.reel / 210).toFixed(1)}%;background:${r.l.includes("EPR") ? "#f97316" : "#3b6fd6"}">${r.reel} mois</span>
      ${r.prevu ? `<i class="nu-prevu" style="left:${(100 * r.prevu / 210).toFixed(1)}%" title="prévu : ${r.prevu} mois"></i>` : ""}</span><span class="fs-tot">${r.prevu ? `prévu ${r.prevu}` : ""}</span></div>`).join("")}</div>
    <p class="muted" style="font-size:.8rem;margin:4px 0 0">Trait noir : durée prévue au lancement. Hinkley Point C : milieu de la fourchette de 120 à 144 mois annoncée en 2024. ${esc(D.chantiers.note)} Sources : ${src("wna_adv")} ; ${src("wna_cn")} ; ${src("wna_fr")} ; ${src("ccomptes")}.</p>`;
  $("#nu-epr").innerHTML = `<table class="pr-t ff-t"><thead><tr><th>Projet</th><th>Calendrier</th><th>Coût</th><th>Retour d'expérience</th></tr></thead><tbody>${D.epr.map(r => `<tr><td class="lab"><b>${esc(r.p)}</b></td><td>${esc(r.debut)} ; ${esc(r.mes)}</td><td>${esc(r.cout)}</td><td>${esc(r.rex)}</td></tr>`).join("")}</tbody></table>
    <p class="muted" style="font-size:.8rem;margin:4px 0 0">Source : ${src("ccomptes")}, complété par ${src("wna_fr")} et ${src("wna_adv")} pour les dates.</p>`;

  /* 5. monde */
  bars($("#nu-modeles"), D.construction_modeles.map(r => ({ l: r.l, v: r.n, t: r.n + "", c: /Chine/.test(r.l) ? "#dc2626" : /Russie/.test(r.l) ? "#7c3aed" : /France/.test(r.l) ? "#3b6fd6" : "#64748b" })));
  bars($("#nu-pays"), D.construction_pays.map(r => ({ l: r.p, v: r.n, t: r.n + "", c: r.p === "Chine" ? "#dc2626" : "#64748b" })));

  /* 7. SMR */
  const SM = D.smr;
  bars($("#nu-smr-types"), SM.types.map(r => ({ l: r.t, v: r.n, t: r.n + " projets", c: "#14b8a6" })));
  bars($("#nu-smr-pays"), SM.pays.map(r => ({ l: r.p, v: r.n, t: r.n + " projets", c: r.p === "France" ? "#3b6fd6" : "#64748b" })));
  $("#nu-smr").innerHTML = `<table class="pr-t ff-t"><thead><tr><th>Réacteur</th><th>Pays</th><th>Technologie</th><th>MWe</th><th>MWt</th><th>Sortie cœur</th><th>Enrichissement</th><th>Statut</th></tr></thead><tbody>${SM.fiches.map(r => `<tr><td class="lab"><b>${esc(r.n)}</b><br><small class="muted">${esc(r.dev)}${r.note ? " · " + esc(r.note) : ""}</small></td><td>${esc(r.pays)}</td><td>${esc(r.type)}, neutrons ${r.spectre}s</td><td>${f0(r.mwe)}</td><td>${f0(r.mwt)}</td><td>${r.t ? r.t + " °C" : "–"}</td><td>${esc(r.enr || "–")}</td><td>${esc(r.statut)}</td></tr>`).join("")}</tbody></table>
    <p class="muted" style="font-size:.8rem;margin:4px 0 0">${SM.n} conceptions recensées. Source : ${src("wna_smr")}.</p>`;

  $("#nu-sources").innerHTML = `Sources : ${Object.keys(S).map(src).join(" ; ")}.`;
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
