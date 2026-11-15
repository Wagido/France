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
  if (vue === "public") { drawPublic(el, md); draw.D = D; sensib(); return; }
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
          <li>les centrales nucléaires, les barrages et les lignes électriques appartiennent à EDF, RTE ou Enedis : ce sont des entreprises, même détenues par l'État. Elles sont donc dans la part <b>entreprises</b>. L'État, lui, possède leurs actions : elles sont comptées dans ses actifs financiers${Ap ? ` (${md(Ap.fa)} au total)` : ""}.</li>
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
/* le patrimoine public en détail : ce que possèdent les administrations (au-dessus de zéro) et ce qu'elles doivent (en dessous) */
const PUB_A = [
  ["Bâtiments et ouvrages (routes, ponts, écoles, hôpitaux, réseaux)", "#f2b544", s => s.nf.batiments],
  ["Terrains", "#8c5a2b", s => s.nf.terrains],
  ["Équipements, logiciels, logements, stocks", "#cdb89a", s => s.nf.machines + s.nf.pi + s.nf.logements + s.nf.stocks + s.nf.valeur + s.nf.autres_nf],
  ["Actions et participations (EDF, Orange, Airbus…)", "#3949ab", s => s.fa.actions],
  ["Dépôts, prêts et autres créances", "#8fc3e8", s => s.fa.depots + s.fa.titres + s.fa.credits + s.fa.assurance + s.fa.derives + s.fa.autres_f],
];
const PUB_L = [
  ["Obligations (l'essentiel de la dette publique)", "#a3245e", s => s.fl.titres],
  ["Emprunts bancaires et dépôts reçus", "#e15759", s => s.fl.credits + s.fl.depots],
  ["Autres dettes (factures à payer, etc.)", "#f4a6a6", s => s.fl.autres_f + s.fl.actions + s.fl.assurance + s.fl.derives],
];
function drawPublic(el, md) {
  const { showTip, hideTip } = window.TH;
  const Y = Object.keys(P).sort().map(y => ({ annee: +y, s: P[y].secteurs.find(s => s.id === "apu"), pib: P[y].pib })).filter(d => d.s);
  Y.forEach(d => { d.a = PUB_A.map(([, , f]) => f(d.s) || 0); d.l = PUB_L.map(([, , f]) => f(d.s) || 0); d.A = d3.sum(d.a); d.L = d3.sum(d.l); d.net = d.s.net; });
  const w = Math.max(320, el.clientWidth), h = 380, m = { t: 20, r: 10, b: 26, l: 80 };
  const x = d3.scaleBand(Y.map(d => d.annee), [m.l, w - m.r]).padding(.25);
  const y = d3.scaleLinear([-d3.max(Y, d => d.L) * 1.05, d3.max(Y, d => d.A) * 1.12], [h - m.b, m.t]).nice();
  const svg = d3.create("svg").attr("viewBox", `0 0 ${w} ${h}`);
  svg.append("g").attr("class", "grid").selectAll("line").data(y.ticks(8)).join("line").attr("x1", m.l).attr("x2", w - m.r).attr("y1", y).attr("y2", y);
  Y.forEach(d => {
    let acc = 0;
    PUB_A.forEach(([l, c], i) => { const v = d.a[i];
      svg.append("rect").attr("x", x(d.annee)).attr("width", x.bandwidth()).attr("y", y(acc + v)).attr("height", y(acc) - y(acc + v)).attr("fill", c)
        .on("pointermove", ev => showTip(`<b>${d.annee} · ce que le public possède</b><br>${l} : ${md(v)}`, ev)).on("pointerleave", hideTip);
      acc += v; });
    svg.append("text").attr("x", x(d.annee) + x.bandwidth() / 2).attr("y", y(acc) - 5).attr("text-anchor", "middle").attr("font-size", w < 560 ? 8.5 : 10.5).style("fill", "var(--muted)").text(Math.round(acc).toLocaleString("fr-FR"));
    let accL = 0;
    PUB_L.forEach(([l, c], i) => { const v = d.l[i];
      svg.append("rect").attr("x", x(d.annee)).attr("width", x.bandwidth()).attr("y", y(-accL)).attr("height", y(-accL - v) - y(-accL)).attr("fill", c)
        .on("pointermove", ev => showTip(`<b>${d.annee} · ce que le public doit</b><br>${l} : ${md(v)}`, ev)).on("pointerleave", hideTip);
      accL += v; });
    svg.append("text").attr("x", x(d.annee) + x.bandwidth() / 2).attr("y", y(-accL) + 13).attr("text-anchor", "middle").attr("font-size", w < 560 ? 8.5 : 10.5).style("fill", "var(--muted)").text("−" + Math.round(accL).toLocaleString("fr-FR"));
    // patrimoine net : un trait noir
    svg.append("line").attr("x1", x(d.annee) - 3).attr("x2", x(d.annee) + x.bandwidth() + 3).attr("y1", y(d.net)).attr("y2", y(d.net)).attr("stroke", "var(--ink)").style("stroke", "var(--ink)").attr("stroke-width", 3)
      .on("pointermove", ev => showTip(`<b>${d.annee} · patrimoine net du public</b><br>${md(d.net)} = ${md(d.A)} possédés − ${md(d.L)} dus`, ev)).on("pointerleave", hideTip);
  });
  svg.append("line").attr("x1", m.l).attr("x2", w - m.r).attr("y1", y(0)).attr("y2", y(0)).attr("stroke", "currentColor").attr("opacity", .6);
  svg.append("g").attr("class", "axis").attr("transform", `translate(0,${h - m.b})`).call(d3.axisBottom(x).tickSizeOuter(0)).call(g => g.select(".domain").remove());
  svg.append("g").attr("class", "axis").attr("transform", `translate(${m.l},0)`).call(d3.axisLeft(y).ticks(8).tickFormat(v => v.toLocaleString("fr-FR") + " Md€")).call(g => g.select(".domain").remove());
  el.replaceChildren(svg.node());
  const sw = c => `<i style="border-top-color:${c};border-top-width:10px;width:14px;opacity:1"></i>`;
  $("#pn-legend").innerHTML = `<b style="color:var(--ink)">Possédé :</b>` + PUB_A.map(([l, c]) => `<span>${sw(c)}${l}</span>`).join("") +
    `<span style="flex-basis:100%;height:0"></span><b style="color:var(--ink)">Dû :</b>` + PUB_L.map(([l, c]) => `<span>${sw(c)}${l}</span>`).join("") + `<span>${sw("var(--ink)")}Patrimoine net (trait noir)</span>`;
  const a = Y[0], b = Y.at(-1), pc = v => Math.round(100 * v / b.pib) + " % du PIB";
  $("#pn-txt").innerHTML = `<ul>
      <li><b>Ce que le public possède : ${md(b.A)}</b> en ${b.annee}. Surtout des bâtiments et ouvrages (${md(b.a[0])} : routes, ponts, écoles, hôpitaux, réseaux) et les terrains qui vont avec (${md(b.a[1])}). Il détient aussi ${md(b.a[3])} d'actions et de participations dans des entreprises (EDF, Orange, Airbus…).</li>
      <li><b>Ce qu'il doit : ${md(b.L)}</b>, dont ${md(b.l[0])} d'obligations : c'est l'essentiel de la dette publique, comptée ici à sa valeur de marché.</li>
      <li><b>Le patrimoine net</b> (trait noir) est de <b>${md(b.net)}</b>, soit ${pc(b.net)}, contre ${md(a.net)} en ${a.annee}. Il a augmenté parce que la valeur des terrains, des bâtiments et des participations a monté plus vite que la dette ; la dette, elle, est passée de ${md(a.L)} à ${md(b.L)}.</li>
      <li><b>À lire avec prudence</b> : une école ou une route ne se vendent pas, et elles sont comptées à leur coût de reconstruction. Les centrales et barrages d'EDF n'y figurent pas directement : seules les actions d'EDF détenues par l'État sont comptées.</li>
    </ul>`;
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
