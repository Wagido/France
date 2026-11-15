/* Patrimoine net de la France depuis 2015, sa composition, et sa sensibilité aux prix de l'immobilier */
(() => {
"use strict";
let P = null;
const $ = s => document.querySelector(s);
const PARTS = [
  ["terrains", "Terrains (sous les logements et les bâtiments)", "#8c5a2b", ["terrains"]],
  ["logements", "Logements (les murs)", "#e07b39", ["logements"]],
  ["equip", "Bâtiments, routes, machines, logiciels", "#f2b544", ["batiments", "machines", "pi"]],
  ["autres", "Stocks, or, objets d'art, autres", "#cdb89a", ["stocks", "valeur", "autres_nf"]],
];
const OWN = [
  ["menages", "Ménages (logements, épargne, actions…)", "#3b6fd6"],
  ["entreprises", "Entreprises et banques", "#1e40af"],
  ["apu", "Administrations publiques (État, collectivités, Sécurité sociale)", "#7c3aed"],
];
let vue = "bien";
async function init() {
  if (!window.TH) { setTimeout(init, 100); return; }
  try { P = (await fetch("data/finances.json").then(r => r.json())).patrimoine; } catch (e) { return; }
  let rt; addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(draw, 150); });
  $("#pn-immo")?.addEventListener("input", sensib);
  document.querySelectorAll("#pn-vue button").forEach(bt => bt.onclick = () => {
    vue = bt.dataset.v; document.querySelectorAll("#pn-vue button").forEach(o => o.setAttribute("aria-pressed", o === bt)); draw();
  });
  draw();
}
const sum = o => Object.values(o).reduce((a, b) => a + b, 0);
function annee(y) {
  const B = P[y], S = B.secteurs, r = { annee: +y, pib: B.pib, pop: B.population };
  PARTS.forEach(([k, , , ks]) => r[k] = S.reduce((a, s) => a + ks.reduce((b, kk) => b + (s.nf[kk] || 0), 0), 0));
  const sec = id => S.filter(s => id.includes(s.id));
  r.menages = sec(["menages"]).reduce((a, s) => a + s.net, 0);
  r.entreprises = sec(["snf", "sf"]).reduce((a, s) => a + s.net, 0);
  r.apu = sec(["apu"]).reduce((a, s) => a + s.net, 0);
  const A = sec(["apu"])[0];
  r.apuD = A ? { reel: sum(A.nf), fa: sum(A.fa), fl: sum(A.fl), terrains: A.nf.terrains } : null;
  r.ext = S.reduce((a, s) => a + sum(s.fa) - sum(s.fl), 0);
  r.net = S.reduce((a, s) => a + s.net, 0);
  const m = S.find(s => s.id === "menages");
  r.men = m ? { net: m.net, immo: m.nf.logements + m.nf.terrains, credits: m.fl.credits || 0, actions: m.fa.actions || 0 } : null;
  return r;
}
function draw() {
  const el = $("#pn-chart"); if (!P || !el) return;
  const { showTip, hideTip } = window.TH;
  const md = v => Math.round(v).toLocaleString("fr-FR") + " Md€";
  const D = Object.keys(P).sort().map(annee);
  const w = Math.max(320, el.clientWidth), h = 320, m = { t: 24, r: 10, b: 26, l: 80 };
  const x = d3.scaleBand(D.map(d => d.annee), [m.l, w - m.r]).padding(.25);
  const PP = vue === "bien" ? PARTS : OWN, neg = d => vue === "bien" ? d.ext : 0;
  const top = d3.max(D, d => PP.reduce((a, [k]) => a + d[k], 0)), bot = d3.min(D, d => Math.min(0, neg(d)));
  const y = d3.scaleLinear([bot * 1.4, top * 1.1], [h - m.b, m.t]).nice();
  const svg = d3.create("svg").attr("viewBox", `0 0 ${w} ${h}`);
  svg.append("g").attr("class", "grid").selectAll("line").data(y.ticks(6)).join("line").attr("x1", m.l).attr("x2", w - m.r).attr("y1", y).attr("y2", y);
  D.forEach(d => {
    let acc = 0;
    PP.forEach(([k, l, c]) => {
      svg.append("rect").attr("x", x(d.annee)).attr("width", x.bandwidth()).attr("y", y(acc + d[k])).attr("height", y(acc) - y(acc + d[k])).attr("fill", c)
        .on("pointermove", ev => showTip(`<b>${d.annee} · ${l}</b><br>${md(d[k])} (${Math.round(100 * d[k] / d.net)} % du patrimoine net)`, ev)).on("pointerleave", hideTip);
      acc += d[k];
    });
    if (vue === "bien") svg.append("rect").attr("x", x(d.annee)).attr("width", x.bandwidth()).attr("y", y(Math.max(0, d.ext))).attr("height", Math.abs(y(d.ext) - y(0))).attr("fill", "#94a3b8")
      .on("pointermove", ev => showTip(`<b>${d.annee} · Solde avec l'étranger</b><br>${md(d.ext)} : ce que la France doit au reste du monde, net de ce qu'elle y possède`, ev)).on("pointerleave", hideTip);
    svg.append("text").attr("x", x(d.annee) + x.bandwidth() / 2).attr("y", y(acc) - 6).attr("text-anchor", "middle").attr("font-size", w < 560 ? 9 : 11).attr("font-weight", 600).style("fill", "var(--ink)")
      .text(Math.round(d.net).toLocaleString("fr-FR"));
  });
  svg.append("line").attr("x1", m.l).attr("x2", w - m.r).attr("y1", y(0)).attr("y2", y(0)).attr("stroke", "currentColor").attr("opacity", .4);
  svg.append("g").attr("class", "axis").attr("transform", `translate(0,${h - m.b})`).call(d3.axisBottom(x).tickSizeOuter(0)).call(g => g.select(".domain").remove());
  svg.append("g").attr("class", "axis").attr("transform", `translate(${m.l},0)`).call(d3.axisLeft(y).ticks(6).tickFormat(v => v.toLocaleString("fr-FR") + " Md€")).call(g => g.select(".domain").remove());
  el.replaceChildren(svg.node());
  $("#pn-legend").innerHTML = PP.map(([, l, c]) => `<span><i style="border-top-color:${c};border-top-width:10px;width:14px;opacity:1"></i>${l}</span>`).join("") +
    (vue !== "bien" ? "" : `<span><i style="border-top-color:#94a3b8;border-top-width:10px;width:14px;opacity:1"></i>Solde avec l'étranger (négatif : la France doit plus qu'elle ne possède dehors)</span>`);
  draw.D = D;
  const a = D[0], b = D.at(-1), f1 = v => v.toLocaleString("fr-FR", { maximumFractionDigits: 1 });
  const chutes = D.slice(1).map((d, i) => [D[i], d]).filter(([u, v]) => v.net < u.net).sort((u, v) => (v[0].net - v[1].net) - (u[0].net - u[1].net));
  const [pic, apres] = chutes[0] || [];
  const immo = d => d.terrains + d.logements;
  const pc = v => Math.round(100 * v / b.net) + " %", Ap = b.apuD;
  if (vue !== "bien") {
    $("#pn-txt").innerHTML = `<ul>
      <li><b>Les ménages possèdent ${pc(b.menages)}</b> du patrimoine net (${md(b.menages)}) : leurs logements et terrains, leur épargne, leurs actions et assurances-vie, moins leurs crédits.</li>
      <li><b>Les entreprises et les banques : ${md(b.entreprises)}</b> (${pc(b.entreprises)}). C'est peu, parce qu'une entreprise appartient à ses actionnaires : ses actions sont comptées comme une dette envers eux, et la valeur se retrouve chez les ménages qui les détiennent.</li>
      ${Ap ? `<li><b>Le public : ${md(b.apu)}</b> (${pc(b.apu)}). Les administrations possèdent ${md(Ap.reel)} de biens réels (routes, écoles, hôpitaux, réseaux, dont ${md(Ap.terrains)} de terrains) et ${md(Ap.fa)} d'actifs financiers, mais doivent ${md(Ap.fl)}, surtout la dette publique. Leur patrimoine net est donc faible, même s'il reste positif (${md(a.apu)} en ${a.annee}).</li>` : ""}
      <li><b>Où sont les ponts, les routes, les centrales nucléaires ?</b> Tout y est, mais pas toujours là où on l'attend :
        <ul>
          <li>les routes, ponts, écoles, hôpitaux publics et le réseau ferré (SNCF Réseau est classée dans les administrations publiques) sont dans la part <b>publique</b> ;</li>
          <li>les centrales nucléaires, les barrages et les lignes électriques appartiennent à EDF, RTE ou Enedis : ce sont des entreprises, même détenues par l'État. Elles sont donc dans la part <b>entreprises</b>. L'État, lui, possède leurs actions : elles sont comptées dans ses actifs financiers${Ap ? ` (${md(Ap.fa)} au total)` : ""} ;</li>
          <li>de même, les autoroutes concédées figurent chez les sociétés d'autoroutes, pas chez l'État.</li>
        </ul></li>
      <li><b>Attention</b> : les biens publics sont comptés à leur coût de remplacement, pas à un prix de vente. Une route ou une école ne se vend pas, alors que la dette, elle, doit être remboursée.</li>
    </ul>`;
    sensib(); return;
  }
  $("#pn-txt").innerHTML = `<ul>
      <li><b>Le patrimoine net</b> est passé de ${md(a.net)} en ${a.annee} à <b>${md(b.net)}</b> en ${b.annee} (chiffre au-dessus de chaque barre, en milliards d'euros), soit ${f1(b.net / b.pib)} années de PIB.</li>
      <li><b>C'est surtout de l'immobilier</b> : terrains et logements font ${Math.round(100 * immo(b) / b.net)} % du patrimoine net. Les terrains à eux seuls en font ${Math.round(100 * b.terrains / b.net)} % : c'est la valeur de l'emplacement, surtout dans les grandes villes.</li>
      <li><b>La finance s'annule presque</b> : les actions, dépôts et crédits que les Français possèdent sont pour l'essentiel dus par d'autres Français. À l'échelle du pays, il ne reste que le solde avec l'étranger (${md(b.ext)}).</li>
      ${apres ? `<li><b>Ce patrimoine peut baisser sans que rien ne soit détruit</b> : en ${apres.annee}, il a perdu ${md(pic.net - apres.net)}, parce que la hausse des taux d'intérêt a fait baisser la valeur des terrains de ${md(pic.terrains - apres.terrains)}. Les maisons étaient toujours là ; c'est leur prix qui a baissé.</li>` : ""}
    </ul>`;
  sensib();
}
function sensib() {
  const D = draw.D; if (!D) return;
  const { kpis, pct } = window.TH;
  const md = v => (v < 0 ? "−" : "") + Math.round(Math.abs(v)).toLocaleString("fr-FR") + " Md€";
  const b = D.at(-1), s = +($("#pn-immo")?.value || -10) / 100;
  $("#pn-immo-v").textContent = (s > 0 ? "+" : s < 0 ? "−" : "") + Math.abs(Math.round(s * 100)) + " %";
  const dNat = (b.terrains + b.logements) * s, M = b.men, dMen = M ? M.immo * s : 0;
  kpis("#pn-kpis", [
    [md(dNat), [`${pct(100 * dNat / b.net, 1)} du patrimoine net`, `qui passerait à ${md(b.net + dNat)}`], "France entière"],
    [(dNat < 0 ? "−" : "") + Math.round(Math.abs(dNat) * 1e9 / b.pop).toLocaleString("fr-FR") + " €", [`sur ${Math.round(b.net * 1e9 / b.pop).toLocaleString("fr-FR")} € de patrimoine net par habitant`], "Par habitant"],
    M && [md(dMen), [`${pct(100 * dMen / M.net, 1)} de leur patrimoine net`, `leurs crédits (${md(M.credits)}) ne baissent pas`], "Ménages"],
    [((b.net + dNat) / b.pib).toLocaleString("fr-FR", { maximumFractionDigits: 1 }) + " ans", [`de PIB au lieu de ${(b.net / b.pib).toLocaleString("fr-FR", { maximumFractionDigits: 1 })}`], "En années de PIB"],
  ].filter(Boolean));
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
