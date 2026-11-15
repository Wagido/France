/* Empreinte carbone : SDES / INSEE pour la France (postes de consommation), Eurostat FIGARO pour tous les pays */
(() => {
"use strict";
const $ = s => document.querySelector(s);
const T = () => window.TH;
let IDX = null, geo = "FR";
const CACHE = {};
const POSTE_C = { "Déplacements": "#3b6fd6", "Alimentation": "#16a34a", "Habitat": "#e07b39", "Services principalement publics": "#64748b", "Biens d'équipements": "#a855f7", "Services principalement marchands": "#0ea5e9" };
const POSTE_L = { "Déplacements": "Transports (voiture, avion, livraisons…)", "Alimentation": "Alimentation", "Habitat": "Logement (chauffage, électricité, construction)",
  "Services principalement publics": "Services publics (santé, école, administration…)", "Biens d'équipements": "Biens de consommation (habits, meubles, électronique…)", "Services principalement marchands": "Services marchands (banque, loisirs, télécoms…)" };

async function init() {
  if (!window.TH) { setTimeout(init, 100); return; }
  try { IDX = await fetch("data/empreinte/index.json").then(r => r.json()); } catch (e) { return; }
  document.addEventListener("geochange", e => setGeo(e.detail));
  let rt; addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(draw, 150); });
  await setGeo(document.querySelector("#geo")?.value || "FR");
}
async function setGeo(g) {
  geo = g;
  if (!(g in CACHE)) { try { CACHE[g] = await fetch(`data/empreinte/${g}.json`).then(r => r.json()); } catch (e) { CACHE[g] = null; } }
  draw();
}

function draw() {
  const { kpis, bars, areaChart, legend, n0, n1, pct, esc, showTip, hideTip } = T();
  const D = CACHE[geo], sec = $("#empreinte"); if (!sec) return;
  if (!D) { kpis("#ec-kpis", []); $("#ec-kpis").innerHTML = `<p class="empty">Eurostat ne calcule pas l'empreinte carbone de ce pays.</p>`; $("#ec-fr").hidden = true; ["#ec-usage", "#ec-usage-legend", "#ec-usage-note"].forEach(s => $(s).innerHTML = ""); drawCmp(); return; }
  const S = D.serie, l = S.at(-1), F = geo === "FR" ? D.sdes : null;
  $("#ec-fr").hidden = !F; document.querySelector("#ec-alerte")?.remove();
  const imp = 100 * (1 - l.origine.domestique / l.total);
  if (F) {
    const s1 = F.serie.at(-1), s0 = F.serie[0], best = F.serie.reduce((a, b) => b.par_hab > a.par_hab ? b : a);
    kpis("#ec-kpis", [
      [n1(s1.par_hab) + " t", `de gaz à effet de serre par Français en ${s1.annee} (${n0(s1.total)} Mt au total, estimation provisoire)`],
      [n1(s0.par_hab) + " t", `en ${s0.annee} : les « 12 tonnes » souvent citées datent de cette époque (maximum ${n1(best.par_hab)} t en ${best.annee})`],
      [pct(100 * s1.importe / s1.total, 0), "de l'empreinte est émise à l'étranger, pour fabriquer ce que nous importons"],
      ["2 t", "par personne vers 2050 : l'ordre de grandeur compatible avec l'accord de Paris"],
    ]);
  } else {
    kpis("#ec-kpis", [
      [n1(l.par_hab) + " t", `de gaz à effet de serre par habitant en ${l.annee} (${n0(l.total)} Mt au total)`],
      [pct(imp, 0), "de l'empreinte est émise hors du pays"],
      [pct(100 * l.usages.direct / l.total, 0), "émis directement par les ménages (chaudière, voiture)"],
    ]);
  }
  if (F) {
    // postes de consommation, en tonnes par personne
    const pop = F.population / 1e6;
    const P = F.postes.map(([k, v]) => ({ k, v: v / pop, mt: v })).sort((a, b) => b.v - a.v);
    const totP = d3.sum(P, p => p.v);
    const el = $("#ec-postes");
    el.innerHTML = `<div class="cmp"><div class="cmp-row"><span class="cmp-name">${F.annee_postes}<small>${n1(totP)} t / pers.</small></span><span class="cmp-stack" style="width:100%;height:30px">${P.map(p =>
      `<span data-t="${esc(`<b>${POSTE_L[p.k] || p.k}</b><br>${n1(p.v)} t par personne · ${n0(p.mt)} Mt · ${pct(100 * p.v / totP, 0)}`)}" style="width:${100 * p.v / totP}%;background:${POSTE_C[p.k] || "#999"}"></span>`).join("")}</span><span class="cmp-val">${n0(d3.sum(P, p => p.mt))} Mt</span></div></div>`;
    el.querySelectorAll("[data-t]").forEach(sp => { sp.onpointermove = ev => showTip(sp.dataset.t, ev); sp.onpointerleave = hideTip; });
    el.insertAdjacentHTML("beforeend", `<div style="margin-top:14px"></div>`);
    const b = document.createElement("div"); el.appendChild(b);
    bars(b, P.map(p => ({ l: POSTE_L[p.k] || p.k, v: p.v, t: `${n1(p.v)} t par personne · ${pct(100 * p.v / totP, 0)}`, c: POSTE_C[p.k] })));
    $("#ec-postes-note").textContent = `SDES et INSEE, année ${F.annee_postes} (dernière année détaillée). Chaque poste compte tout ce qu'il a fallu émettre, en France et ailleurs : le carburant brûlé et la fabrication de la voiture pour les transports, l'élevage et les engrais pour l'alimentation, le chauffage et la construction pour le logement. Les services publics sont répartis à parts égales entre habitants.`;
    const part = keys => 100 * d3.sum(P.filter(p => keys.includes(p.k)), p => p.v) / totP;
    const ess = part(["Déplacements", "Alimentation", "Habitat", "Services principalement publics"]), biens = part(["Biens d'équipements"]);
    $("#ec-postes-note").insertAdjacentHTML("afterend", `<p class="surligne" id="ec-alerte"><b>La majorité de l'empreinte carbone (<span style="white-space:nowrap">${pct(ess, 0)}</span>) est donc consacrée à un confort considéré aujourd'hui comme essentiel</b> : se loger, manger, se déplacer et utiliser les services publics. La consommation de biens ne représente qu'une faible part (<span style="white-space:nowrap">${pct(biens, 0)}</span>). C'est donc un effort dans tous les domaines qui est demandé.</p>`);
    // série
    areaChart($("#ec-serie"), F.serie.map(x => ({ annee: x.annee, direct: x.direct, interieur: x.interieur, importe: x.importe })), ["direct", "interieur", "importe"],
      { direct: "#e07b39", interieur: "#3b6fd6", importe: "#94a3b8" }, { direct: "Émis directement par les ménages", interieur: "Produit en France", importe: "Émis à l'étranger (importations)" },
      { vfmt: v => n0(v) + " Mt", yfmt: v => n0(v) + " Mt", h: 260 });
    legend("#ec-serie-legend", [["Émis directement par les ménages (chaudière, voiture)", "#e07b39"], ["Production en France", "#3b6fd6"], ["Émis à l'étranger pour nos importations", "#94a3b8"]]);
    // origine
    const O = F.origine.map(([k, v]) => ({ l: k.replace("Union européenne à 27, hors France et Allemagne", "Reste de l'Union européenne").replace("Autres pays d'origine des émissions", "Autres pays"), v }));
    const tO = d3.sum(O, o => o.v);
    bars($("#ec-orig"), O.sort((a, b) => b.v - a.v).map(o => ({ ...o, t: `${n0(o.v)} Mt · ${pct(100 * o.v / tO, 0)}`, c: o.l === "France" ? "#3b6fd6" : "#94a3b8" })));
    const s1 = F.serie.at(-1), s0 = F.serie[0];
    $("#ec-txt").innerHTML = `<p><b>D'où viennent les « 12 tonnes » ?</b> C'était l'empreinte d'un Français dans les années 1990 et 2000 (${n1(s0.par_hab)} t en ${s0.annee}). Elle a baissé depuis à ${n1(s1.par_hab)} t (${pct(100 * (s1.par_hab / s0.par_hab - 1), 0)}), surtout grâce au recul du fioul, du charbon et de l'industrie lourde, et à des logements et des véhicules plus sobres. Certains calculs plus larges (avec la déforestation importée ou les traînées des avions) donnent davantage. Mais la baisse est plus lente que celle des émissions du territoire : ce que nous ne produisons plus, nous l'importons, et la part émise à l'étranger est passée de ${pct(100 * s0.importe / s0.total, 0)} à ${pct(100 * s1.importe / s1.total, 0)}.</p>
      <p>Pour tenir l'accord de Paris, il faudrait descendre vers 2 t par personne d'ici 2050, soit diviser l'empreinte actuelle par quatre.</p>`;
    // monde
    const W = F.monde.map(([p, v]) => ({ l: p, v, c: p === "France" ? "#3b6fd6" : /UE|Monde/.test(p) ? "#475569" : "#94a3b8" }));
    bars($("#ec-monde"), W.map(x => ({ ...x, t: n1(x.v) + " t" })));
    $("#ec-monde").insertAdjacentHTML("beforeend", `<p class="muted" style="font-size:.84rem">${F.monde_annee}, calcul du SDES à partir d'Eurostat (FIGARO) et de l'ONU.</p>`);
  }
  // par usage final (tous pays, Eurostat)
  const U = D.usages, tot = l.total;
  const det = D.direct.filter(([k]) => l.direct_detail[k]).map(([k, lab]) => `${lab} : ${n0(l.direct_detail[k])} Mt`).join(" · ");
  $("#ec-usage").innerHTML = `<div class="cmp">${[S.find(x => x.annee === "2010") || S[0], l].map(x => `<div class="cmp-row"><span class="cmp-name">${x.annee}<small>${n1(x.par_hab)} t / hab.</small></span><span class="cmp-stack" style="width:100%;height:24px">${U.map(([k, lab, c]) =>
    `<span data-t="${esc(`<b>${lab}</b><br>${n0(x.usages[k])} Mt · ${pct(100 * x.usages[k] / x.total, 0)}`)}" style="width:${Math.max(0, 100 * x.usages[k] / x.total)}%;background:${c}"></span>`).join("")}</span><span class="cmp-val">${n0(x.total)} Mt</span></div>`).join("")}</div>`;
  $("#ec-usage").querySelectorAll("[data-t]").forEach(sp => { sp.onpointermove = ev => showTip(sp.dataset.t, ev); sp.onpointerleave = hideTip; });
  legend("#ec-usage-legend", U.map(([k, lab, c]) => [`${lab} (${pct(100 * l.usages[k] / tot, 0)})`, c]));
  $("#ec-usage-note").textContent = `Eurostat (FIGARO), ${l.annee}. ${det ? "Émissions directes des ménages : " + det + "." : ""} Les investissements (logements neufs, routes, usines) servent les années suivantes : ni les ménages ni l'État ne les « consomment » tout de suite.`;
  drawCmp();
}

function drawCmp() {
  const { n1, pct, esc } = T();
  const rows = IDX.pays.filter(r => r.par_hab != null).sort((a, b) => b.par_hab - a.par_hab);
  const max = d3.max(rows, r => r.par_hab);
  const cell = (v, f, m, c) => v == null ? `<td class="muted">–</td>` : `<td>${f(v)}<span class="ibar" style="width:${Math.max(0, 70 * v / m)}px;background:${c}"></span></td>`;
  $("#ec-cmp").innerHTML = `<div class="table-scroll"><table class="cmp-t"><thead><tr><th>Pays</th><th>Tonnes par habitant ↓</th><th>dont ménages directs</th><th>dont achats des ménages</th><th>dont services publics</th><th>dont investissements</th><th>Émis à l'étranger</th></tr></thead><tbody>${rows.map(r => {
    const u = r.usages_hab || {};
    return `<tr class="${r.code === geo ? "me" : ""}"><td>${esc(r.nom)} <small class="muted">${r.annee}</small></td>${cell(r.par_hab, v => n1(v) + " t", max, "#475569")}${cell(u.direct, v => n1(v) + " t", 6, "#e07b39")}${cell(u.menages, v => n1(v) + " t", 10, "#3b6fd6")}${cell(u.publics, v => n1(v) + " t", 4, "#64748b")}${cell(u.investissement, v => n1(v) + " t", 6, "#a8a29e")}${cell(r.importe, v => pct(v, 0), 100, "#94a3b8")}</tr>`;
  }).join("")}</tbody></table></div>`;
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
