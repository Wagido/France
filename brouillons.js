/* Articles en préparation (non publiés) : fiscalité, christianisme */
(() => {
"use strict";
const $ = s => document.querySelector(s);
const f1 = v => v == null ? "–" : (Math.round(v * 10) / 10).toLocaleString("fr-FR");

/* ---------- Fiscalité : Eurostat gov_10a_taxag, % du PIB, 2025 ---------- */
const TAX = {
  annee: 2025,
  pays: [
    ["France", { tot: 46.0, tva: 7.0, prod: 8.8, ir: 9.6, is: 3.2, cot: 16.7, autres: 0.9 }],
    ["Belgique", { tot: 44.7 }], ["Danemark", { tot: 44.3, tva: 9.1, prod: 4.5, ir: 25.7, is: 3.8, cot: 0.7, autres: 1.0 }],
    ["Autriche", { tot: 43.9 }], ["Italie", { tot: 43.0, tva: 6.6, prod: 7.5, ir: 12.0, is: 2.7, cot: 13.5, autres: 0.6 }],
    ["Allemagne", { tot: 41.4, tva: 6.9, prod: 3.4, ir: 9.2, is: 2.8, cot: 18.2, autres: 0.7 }],
    ["Suède", { tot: 41.2, tva: 8.7, prod: 12.1, ir: 13.4, is: 3.4, cot: 3.3, autres: 0.3 }],
    ["Union européenne", { tot: 40.7, tva: 7.2, prod: 5.7, ir: 9.6, is: 3.2, cot: 14.3, autres: 0.7 }],
    ["Pays-Bas", { tot: 39.6 }], ["Espagne", { tot: 38.1 }], ["Irlande", { tot: 22.7 }]
  ],
  hist: [[1995, 44.1], [2000, 45.2], [2005, 44.7], [2010, 44.2], [2015, 47.7], [2020, 47.4], [2023, 45.5], [2024, 45.1], [2025, 46.0]]
};
function fiscalite() {
  if (!$("#fi-tot")) return;
  const { bars } = window.TH;
  bars($("#fi-tot"), TAX.pays.map(([n, v]) => ({ l: n, v: v.tot, t: f1(v.tot) + " %", c: n === "France" ? "#dc2626" : n === "Union européenne" ? "#334155" : "#94a3b8" })), { max: 50 });
  const P = ["tva", "prod", "ir", "is", "cot", "autres"], L = { tva: "TVA", prod: "Autres impôts sur la production et la consommation", ir: "Impôt sur le revenu des ménages (dont CSG)", is: "Impôt sur les sociétés", cot: "Cotisations sociales", autres: "Autres (impôts sur le capital, divers)" };
  const C = { tva: "#f59e0b", prod: "#fbbf24", ir: "#3b82f6", is: "#1e3a8a", cot: "#16a34a", autres: "#cbd5e1" };
  const rows = TAX.pays.filter(([, v]) => v.cot != null);
  $("#fi-struct").innerHTML = `<div class="fs-stack">${rows.map(([n, v]) => {
    let left = 0; const segs = P.map(k => { const w = 100 * v[k] / 50, s = `<span title="${L[k]} : ${f1(v[k])} % du PIB" style="left:${left}%;width:${w}%;background:${C[k]}">${v[k] >= 3 ? f1(v[k]) : ""}</span>`; left += w; return s; }).join("");
    return `<div class="fs-row"><span class="fs-lab">${n === "France" ? "<b>France</b>" : n}</span><span class="fs-track">${segs}</span><span class="fs-tot">${f1(v.tot)} %</span></div>`; }).join("")}</div>
    <div class="legend-row">${P.map(k => `<span><i style="border-top-color:${C[k]};opacity:1;border-top-width:10px;width:14px"></i>${L[k]}</span>`).join("")}</div>`;
  window.TH.lineChart($("#fi-hist"), TAX.hist.map(([a, v]) => ({ annee: a, fr: v })), [{ k: "fr", l: "France", c: "#dc2626" }], { yfmt: v => v + " %", vfmt: v => f1(v) + " % du PIB", h: 200, nozero: true });
}

/* ---------- Christianisme : arbre des grandes branches (Sankey) ---------- */
function sankey() {
  const el = $("#cr-sankey"); if (!el || !window.d3?.sankey) return;
  // largeurs finales : parts des chrétiens en 2010 (Pew Research, 2011) ; branches disparues : largeur symbolique
  const N = [
    ["prim", "Jésus, premiers chrétiens (Iᵉʳ s.)", 0],
    ["judeo", "Judéo-chrétiens (disparus)", 1], ["gnose", "Gnostiques, marcionites (disparus)", 1], ["grande", "« Grande Église » (Nicée, 325)", 1],
    ["arien", "Ariens (disparus)", 2], ["orient", "Église de l'Orient (431)", 2], ["orientaux", "Orthodoxes orientaux (451)", 2], ["chalc", "Chalcédoine (451)", 2],
    ["byz", "Orient byzantin (1054)", 3], ["rome", "Occident latin (1054)", 3],
    ["ortho", "Orthodoxes : 12 %", 4], ["cath", "Catholiques : 50 %", 4], ["prot", "Protestants (Réforme, 1517) : 37 %", 4], ["autres", "Autres : 1 %", 4]
  ];
  const L = [["prim", "judeo", 0.6], ["prim", "gnose", 0.6], ["prim", "grande", 99.4], ["grande", "arien", 0.6], ["grande", "orient", 0.4], ["grande", "orientaux", 2], ["grande", "chalc", 96.4],
    ["chalc", "byz", 10], ["chalc", "rome", 86.4], ["byz", "ortho", 10], ["orientaux", "ortho", 2], ["orient", "ortho", 0.4], ["rome", "cath", 50], ["rome", "prot", 35.4], ["rome", "autres", 1]];
  const W = Math.max(900, el.clientWidth || 1000), H = 560;
  const sk = d3.sankey().nodeId(d => d.id).nodeAlign(n => n.c).nodeSort(null).nodeWidth(12).nodePadding(26).extent([[2, 30], [W - 190, H - 8]]);
  const g = sk({ nodes: N.map(([id, l, c]) => ({ id, l, c })), links: L.map(([s, t, v]) => ({ source: s, target: t, value: v })) });
  const col = n => ({ cath: "#2563eb", prot: "#16a34a", ortho: "#9333ea", autres: "#94a3b8", judeo: "#a3a3a3", gnose: "#a3a3a3", arien: "#a3a3a3", orient: "#c084fc", orientaux: "#c084fc", byz: "#9333ea", rome: "#3b82f6" })[n.id] || "#64748b";
  const svg = d3.select(el).html("").append("svg").attr("viewBox", `0 0 ${W} ${H}`).attr("width", "100%");
  svg.append("g").attr("fill", "none").selectAll("path").data(g.links).join("path").attr("d", d3.sankeyLinkHorizontal())
    .attr("stroke", d => col(d.target)).attr("stroke-opacity", .35).attr("stroke-width", d => Math.max(1.5, d.width)).append("title").text(d => `${d.source.l} → ${d.target.l}`);
  svg.append("g").selectAll("rect").data(g.nodes).join("rect").attr("x", d => d.x0).attr("y", d => d.y0).attr("width", d => d.x1 - d.x0).attr("height", d => Math.max(2, d.y1 - d.y0)).attr("fill", col);
  svg.append("g").attr("font-size", 11.5).attr("fill", "currentColor").selectAll("text").data(g.nodes).join("text")
    .attr("x", d => d.c === 4 ? d.x1 + 6 : d.x0).attr("y", d => d.c === 4 ? (d.y0 + d.y1) / 2 : d.y0 - 5).attr("dy", d => d.c === 4 ? "0.35em" : 0)
    .attr("font-weight", d => d.c === 4 ? 600 : 400).text(d => d.l);
}

/* ---------- Ancien Testament : livre par livre ----------
   r : période racontée [début, fin] (années, négatif = av. J.-C. ; null = temps des origines ou sans cadre historique)
   e : période de rédaction [début, fin] selon le consensus des historiens (approximatif) */
const AT = [
 { g: "Pentateuque (Torah)", b: [
  ["Genèse", "La Création, Adam et Ève, Caïn et Abel, le Déluge, la tour de Babel ; puis les patriarches Abraham, Isaac, Jacob et Joseph, jusqu'à l'installation en Égypte.", "Moïse", "Plusieurs traditions assemblées par des scribes et des prêtres", null, [-750, -450]],
  ["Exode", "L'esclavage en Égypte, Moïse, les dix plaies, la sortie d'Égypte, le passage de la mer, les dix commandements au Sinaï.", "Moïse", "Idem", [-1250, -1200], [-700, -450]],
  ["Lévitique", "Les lois du culte : sacrifices, prêtres, pur et impur, fêtes, « aime ton prochain comme toi-même ».", "Moïse", "Milieu des prêtres du Temple", [-1250, -1210], [-600, -450]],
  ["Nombres", "Le recensement et les 40 ans d'errance dans le désert.", "Moïse", "Idem", [-1250, -1210], [-600, -450]],
  ["Deutéronome", "Les derniers discours de Moïse, qui redit la Loi avant de mourir face à la Terre promise.", "Moïse", "Noyau lié à la réforme du roi Josias (vers 622), complété pendant l'exil", [-1210, -1200], [-640, -500]]]},
 { g: "Livres historiques", b: [
  ["Josué", "La conquête de Canaan : la prise de Jéricho, le partage du pays entre les douze tribus.", "Josué", "« Histoire deutéronomiste », rédigée à la cour de Juda puis pendant l'exil", [-1200, -1150], [-640, -550]],
  ["Juges", "Les héros des tribus avant la royauté : Débora, Gédéon, Samson.", "Samuel", "Idem", [-1150, -1030], [-640, -550]],
  ["Ruth", "Une étrangère moabite, fidèle à sa belle-mère, devient l'arrière-grand-mère du roi David.", "Samuel", "Récit de l'époque perse", [-1100, -1050], [-500, -350]],
  ["1 et 2 Samuel", "Samuel, Saül premier roi, David et Goliath, le règne de David.", "Samuel, Nathan, Gad", "Histoire deutéronomiste, sur des sources plus anciennes", [-1050, -970], [-640, -550]],
  ["1 et 2 Rois", "Salomon et le Temple, la division en deux royaumes (Israël et Juda), les prophètes Élie et Élisée, la chute de Samarie (722) et de Jérusalem (586).", "Jérémie", "Idem", [-970, -560], [-620, -550]],
  ["1 et 2 Chroniques", "Une réécriture de l'histoire d'Adam à l'exil, centrée sur David et le Temple.", "Esdras", "Lévites de Jérusalem, époque perse", [-1000, -538], [-400, -300]],
  ["Esdras et Néhémie", "Le retour d'exil, la reconstruction du Temple et des murailles de Jérusalem.", "Esdras, Néhémie", "Époque perse", [-538, -430], [-400, -300]],
  ["Esther", "Une reine juive à la cour de Perse sauve son peuple d'un massacre (origine de la fête de Pourim).", "Mardochée", "Roman de l'époque perse ou grecque", [-480, -470], [-400, -200]]]},
 { g: "Livres poétiques et de sagesse", b: [
  ["Job", "Un juste frappé de tous les malheurs se demande pourquoi Dieu permet la souffrance.", "Moïse ou Job", "Poète anonyme", null, [-550, -350]],
  ["Psaumes", "150 prières et chants : louange, supplication, colère, confiance (« Le Seigneur est mon berger »).", "David", "Recueil formé sur plusieurs siècles", null, [-900, -200]],
  ["Proverbes", "Maximes de sagesse pratique, dont certaines reprennent un texte égyptien.", "Salomon", "Recueils d'écoles de sagesse", null, [-800, -300]],
  ["Ecclésiaste (Qohélet)", "« Vanité des vanités, tout est vanité » : une méditation désabusée sur le sens de la vie.", "Salomon", "Sage de l'époque grecque", null, [-300, -200]],
  ["Cantique des cantiques", "Un poème d'amour entre deux amants, lu plus tard comme une image de l'amour de Dieu.", "Salomon", "Poèmes d'amour, époque perse ou grecque", null, [-450, -250]]]},
 { g: "Prophètes", b: [
  ["Isaïe", "Trois prophètes en un livre : les menaces contre Juda (VIIIᵉ s.), la consolation de l'exil, le retour. L'annonce d'un serviteur souffrant et de l'Emmanuel, relue par les chrétiens comme annonce du Christ.", "Isaïe", "Isaïe de Jérusalem (ch. 1-39), un prophète de l'exil (40-55), ses disciples (56-66)", [-740, -500], [-740, -450]],
  ["Jérémie et Lamentations", "Le prophète annonce la chute de Jérusalem et la vit ; les Lamentations pleurent la ville détruite.", "Jérémie", "Jérémie et son secrétaire Baruch, puis éditeurs", [-627, -580], [-620, -500]],
  ["Ézéchiel", "Prophète déporté à Babylone : visions du char divin, des ossements desséchés qui revivent, du Temple futur.", "Ézéchiel", "Ézéchiel et son école", [-593, -571], [-590, -500]],
  ["Daniel", "Daniel dans la fosse aux lions, les trois jeunes gens dans la fournaise, et des visions de la fin des temps.", "Daniel (VIᵉ s.)", "Auteur anonyme pendant la révolte contre le roi grec Antiochos IV : c'est le livre le plus récent", [-605, -530], [-167, -164]],
  ["Les douze « petits prophètes »", "Osée, Joël, Amos, Abdias, Jonas (avalé par le grand poisson), Michée, Nahum, Habacuc, Sophonie, Aggée, Zacharie, Malachie. Amos et Osée sont les plus anciens livres prophétiques de la Bible.", "Chacun des douze", "Du VIIIᵉ au IVᵉ siècle", [-760, -450], [-760, -350]]]},
 { g: "Livres en plus chez les catholiques et les orthodoxes (deutérocanoniques)", b: [
  ["Tobie", "Le jeune Tobie, guidé par l'ange Raphaël, guérit son père aveugle.", "Tobit", "Roman, peut-être écrit en araméen", [-720, -700], [-250, -150]],
  ["Judith", "Une veuve sauve sa ville en décapitant le général ennemi Holopherne.", "–", "Roman de l'époque grecque", null, [-150, -100]],
  ["1 et 2 Maccabées", "La révolte des Maccabées contre les rois grecs (167-160) et la purification du Temple (origine de Hanoukka).", "–", "Historiens juifs de l'époque hasmonéenne", [-175, -134], [-125, -100]],
  ["Sagesse", "Une méditation en grec sur la sagesse et l'immortalité de l'âme.", "Salomon", "Juif d'Alexandrie de langue grecque", null, [-50, 0]],
  ["Siracide (Ecclésiastique)", "Un recueil de sagesse d'un maître de Jérusalem.", "Jésus Ben Sira", "Ben Sira, vers 180 ; traduit en grec par son petit-fils vers 132", null, [-190, -175]],
  ["Baruch", "Prière et exhortation attribuées au secrétaire de Jérémie.", "Baruch", "Auteurs de l'époque grecque", null, [-200, -100]]]}
];
function ancienTestament() {
  const tb = $("#cr-at"); if (!tb) return;
  const yr = v => v == null ? "" : v < 0 ? `${-v} av. J.-C.` : `${v}`;
  const per = a => a ? `${yr(a[0])} – ${yr(a[1])}` : "temps des origines, sans date";
  tb.innerHTML = AT.map(gr => `<tr><td colspan="4" style="background:var(--soft,#f1f5f9)"><b>${gr.g}</b></td></tr>` + gr.b.map(([n, c, ta, h, r, e]) =>
    `<tr><td><b>${n}</b></td><td>${c}</td><td>${ta}</td><td>${h}<br><small class="muted">Raconte : ${per(r)} · Écrit vers : ${per(e)}</small></td></tr>`).join("")).join("");
  /* frise : époque racontée (gris) et époque d'écriture (couleur) */
  const el = $("#cr-frise"); if (!el) return;
  const rows = AT.flatMap(gr => gr.b.map(b => ({ n: b[0], r: b[4], e: b[5], g: gr.g })));
  const X0 = -1300, X1 = 50, W = 1000, LW = 190, RH = 18, H = rows.length * RH + 52;
  const x = v => LW + (v - X0) / (X1 - X0) * (W - LW - 10);
  const gc = { "Pentateuque (Torah)": "#2563eb", "Livres historiques": "#16a34a", "Livres poétiques et de sagesse": "#d97706", "Prophètes": "#9333ea" };
  let svg = `<svg viewBox="0 0 ${W} ${H}" width="100%" style="font-size:11px">`;
  for (let t = -1200; t <= 0; t += 100) svg += `<line x1="${x(t)}" x2="${x(t)}" y1="0" y2="${H - 22}" stroke="#e5e7eb"/><text x="${x(t)}" y="${H - 8}" text-anchor="middle" fill="#64748b">${t === 0 ? "0" : -t}</text>`;
  [[-1000, "David"], [-722, "chute de Samarie"], [-586, "exil à Babylone"], [-538, "retour"], [-332, "Alexandre"], [-167, "Maccabées"]].forEach(([t, l], i) =>
    svg += `<line x1="${x(t)}" x2="${x(t)}" y1="0" y2="${H - 22}" stroke="#ef4444" stroke-dasharray="3 3"/><text x="${x(t) + 3}" y="${10 + (i % 3) * 11}" fill="#ef4444">${l}</text>`);
  rows.forEach((r, i) => {
    const y = 36 + i * RH, c = gc[r.g] || "#64748b";
    svg += `<text x="${LW - 6}" y="${y + 12}" text-anchor="end" fill="currentColor">${r.n}</text>`;
    if (r.r) svg += `<rect x="${x(r.r[0])}" y="${y + 2}" width="${Math.max(3, x(r.r[1]) - x(r.r[0]))}" height="6" fill="#94a3b8"><title>Raconte : ${r.r.join(" à ")}</title></rect>`;
    svg += `<rect x="${x(r.e[0])}" y="${y + 9}" width="${Math.max(3, x(r.e[1]) - x(r.e[0]))}" height="7" fill="${c}"><title>Écrit vers : ${r.e.join(" à ")}</title></rect>`;
  });
  el.innerHTML = svg + `</svg><div class="legend-row"><span><i style="border-top-color:#94a3b8;opacity:1;border-top-width:6px;width:14px"></i>Époque racontée</span><span><i style="border-top-color:#2563eb;opacity:1;border-top-width:7px;width:14px"></i>Époque de rédaction (couleur selon la partie)</span><span><i style="border-top-color:#ef4444;opacity:1;width:14px;border-top-style:dashed"></i>Repères historiques</span></div>`;
}

/* ---------- Correspondance Bible hébraïque (24 livres) / Ancien Testament chrétien (ordre catholique, 46 livres) ---------- */
const TANAKH = [
 ["Torah (la Loi)", "#2563eb", [["Genèse", ["Genèse"]], ["Exode", ["Exode"]], ["Lévitique", ["Lévitique"]], ["Nombres", ["Nombres"]], ["Deutéronome", ["Deutéronome"]]]],
 ["Nevi'im (les Prophètes)", "#9333ea", [["Josué", ["Josué"]], ["Juges", ["Juges"]], ["Samuel", ["1 Samuel", "2 Samuel"]], ["Rois", ["1 Rois", "2 Rois"]], ["Isaïe", ["Isaïe"]], ["Jérémie", ["Jérémie"]], ["Ézéchiel", ["Ézéchiel"]],
   ["Les Douze", ["Osée", "Joël", "Amos", "Abdias", "Jonas", "Michée", "Nahum", "Habacuc", "Sophonie", "Aggée", "Zacharie", "Malachie"]]]],
 ["Ketouvim (les Écrits)", "#d97706", [["Psaumes", ["Psaumes"]], ["Proverbes", ["Proverbes"]], ["Job", ["Job"]], ["Cantique des cantiques", ["Cantique des cantiques"]], ["Ruth", ["Ruth"]], ["Lamentations", ["Lamentations"]],
   ["Ecclésiaste", ["Ecclésiaste"]], ["Esther", ["Esther"]], ["Daniel", ["Daniel"]], ["Esdras-Néhémie", ["Esdras", "Néhémie"]], ["Chroniques", ["1 Chroniques", "2 Chroniques"]]]]
];
const ATC = [
 ["Pentateuque", ["Genèse", "Exode", "Lévitique", "Nombres", "Deutéronome"]],
 ["Livres historiques", ["Josué", "Juges", "Ruth", "1 Samuel", "2 Samuel", "1 Rois", "2 Rois", "1 Chroniques", "2 Chroniques", "Esdras", "Néhémie", "Tobie*", "Judith*", "Esther", "1 Maccabées*", "2 Maccabées*"]],
 ["Livres poétiques et de sagesse", ["Job", "Psaumes", "Proverbes", "Ecclésiaste", "Cantique des cantiques", "Sagesse*", "Siracide*"]],
 ["Prophètes", ["Isaïe", "Jérémie", "Lamentations", "Baruch*", "Ézéchiel", "Daniel", "Osée", "Joël", "Amos", "Abdias", "Jonas", "Michée", "Nahum", "Habacuc", "Sophonie", "Aggée", "Zacharie", "Malachie"]]
];
function correspondance() {
  const el = $("#cr-corresp"); if (!el) return;
  const W = 900, RH = 15, top = 30, gap = 14, LX = 150, RX = 600;
  // colonne de droite
  const right = {}; let y = top; const rg = [];
  ATC.forEach(([g, bs]) => { rg.push([g, y]); bs.forEach(b => { right[b.replace("*", "")] = { y, extra: b.endsWith("*"), n: b }; y += RH; }); y += gap; });
  const H = y + 10;
  // colonne de gauche, répartie sur la même hauteur
  const HD = 18, nL = TANAKH.reduce((a, g) => a + g[2].length, 0), LH = (H - top - 10 - gap * 2 - HD * 3) / nL;
  let svg = `<svg viewBox="0 0 ${W} ${H}" width="100%" style="font-size:11.5px">`;
  svg += `<text x="${LX}" y="14" text-anchor="end" font-weight="700" fill="currentColor">Bible hébraïque (24 livres)</text><text x="${RX}" y="14" font-weight="700" fill="currentColor">Ancien Testament chrétien (46 livres)</text>`;
  let ly = top;
  TANAKH.forEach(([g, c, bs]) => {
    svg += `<text x="${LX}" y="${ly + 11}" text-anchor="end" font-weight="700" fill="${c}" font-size="11">${g}</text>`; ly += HD;
    bs.forEach(([n, targets]) => {
      const yl = ly + LH / 2;
      targets.forEach(t => { const r = right[t]; const yr = r.y + RH / 2 - 3;
        svg += `<path d="M${LX + 4},${yl} C${(LX + RX) / 2},${yl} ${(LX + RX) / 2},${yr} ${RX - 6},${yr}" fill="none" stroke="${c}" stroke-opacity=".45" stroke-width="1.4"/>`; });
      svg += `<text x="${LX}" y="${yl + 4}" text-anchor="end" fill="currentColor">${n}</text>`;
      ly += LH;
    });
    ly += gap;
  });
  rg.forEach(([g, yy]) => svg += `<text x="${W - 4}" y="${yy + 10}" text-anchor="end" font-weight="700" fill="#64748b" font-size="11">${g}</text>`);
  Object.values(right).forEach(r => svg += `<text x="${RX}" y="${r.y + RH / 2 + 1}" fill="${r.extra ? "#dc2626" : "currentColor"}" font-weight="${r.extra ? 700 : 400}">${r.n.replace("*", "")}${r.extra ? " ✚" : ""}</text>`);
  el.innerHTML = svg + `</svg><div class="legend-row"><span><i style="border-top-color:#2563eb;opacity:1;width:14px"></i>Torah</span><span><i style="border-top-color:#9333ea;opacity:1;width:14px"></i>Prophètes</span><span><i style="border-top-color:#d97706;opacity:1;width:14px"></i>Écrits</span><span style="color:#dc2626">✚ livres présents seulement dans les Bibles catholiques et orthodoxes (absents chez les protestants)</span></div>`;
}

function init() {
  if (!window.TH || !window.d3) { setTimeout(init, 100); return; }
  try { fiscalite(); } catch (e) { console.error("fiscalite", e); }
  try { sankey(); } catch (e) { console.error("christianisme", e); }
  try { ancienTestament(); } catch (e) { console.error("ancien testament", e); }
  try { correspondance(); } catch (e) { console.error("correspondance", e); }
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
