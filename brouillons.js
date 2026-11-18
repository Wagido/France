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


/* Laïcité : frise 1789-1924 et régimes religieux dans le monde (Pew) */
const LAI = [[1789,"Droits de l'homme, biens du clergé nationalisés",1,1,0,"start"],[1790,"Constitution civile du clergé",1,0,0,"start"],[1792,"État civil laïque, divorce",1,1,1,"start"],[1795,"1ʳᵉ séparation",1,0,1,"start"],[1801,"Concordat",0,1,2,"start"],[1816,"Divorce aboli",0,0,2,"middle"],[1850,"Loi Falloux",0,1,0,"middle"],[1864,"Syllabus",0,0,0,"middle"],[1882,"École laïque (Ferry)",1,1,0,"middle"],[1892,"Ralliement",0,0,0,"middle"],[1901,"Loi sur les associations",1,1,1,"end"],[1904,"Rupture avec le Vatican",1,0,1,"end"],[1905,"Loi de séparation",1,1,2,"end"],[1906,"Inventaires",1,0,2,"end"],[1921,"Retour du nonce",0,1,0,"end"],[1924,"Accord avec Pie XI",0,0,0,"end"]];
function laiciteFrise() {
  const el = $("#la-frise"); if (!el) return;
  const W = 900, H = 210, x0 = 30, x1 = W - 30, y = 100, sc = a => x0 + (a - 1785) / (1928 - 1785) * (x1 - x0);
  let svg = `<svg viewBox="0 0 ${W} ${H}" width="100%" style="font-size:10.5px"><line x1="${x0}" x2="${x1}" y1="${y}" y2="${y}" stroke="#94a3b8" stroke-width="2"/>`;
  for (let a = 1800; a <= 1920; a += 20) svg += `<line x1="${sc(a)}" x2="${sc(a)}" y1="${y - 4}" y2="${y + 4}" stroke="#94a3b8"/><text x="${sc(a)}" y="${y + 16}" text-anchor="middle" fill="#64748b">${a}</text>`;
  svg += `<rect x="${sc(1801)}" y="${y - 3}" width="${sc(1905) - sc(1801)}" height="6" fill="#3b6fd6" opacity=".25"/><text x="${(sc(1801) + sc(1905)) / 2}" y="${y + 30}" text-anchor="middle" fill="#3b6fd6" font-weight="700">Régime du Concordat (1801-1905)</text>`;
  LAI.forEach(([a, t, sep, up, lvl, anc]) => {
    const yy = up ? y - 18 - lvl * 22 : y + 46 + lvl * 22, c = sep ? "#dc2626" : "#3b6fd6";
    svg += `<line x1="${sc(a)}" x2="${sc(a)}" y1="${y}" y2="${up ? yy + 3 : yy - 10}" stroke="${c}" stroke-opacity=".4"/><circle cx="${sc(a)}" cy="${y}" r="4" fill="${c}"/>`;
    svg += `<text x="${sc(a)}" y="${yy}" text-anchor="${anc}" dx="${anc === "start" ? -4 : anc === "end" ? 4 : 0}" fill="${c}"><tspan font-weight="700">${a}</tspan> ${t}</text>`;
  });
  el.innerHTML = svg + `</svg><div class="legend-row"><span><i style="border-top-color:#dc2626;opacity:1;width:14px"></i>vers la séparation</span><span><i style="border-top-color:#3b6fd6;opacity:1;width:14px"></i>retour en arrière ou compromis</span></div>`;
}
function laicitePew() {
  const el = $("#la-pew"); if (!el) return;
  const R = [["Pas de religion officielle ni préférée (dont la France, les États-Unis)", 106, "#16a34a"], ["Religion officielle d'État (dont Royaume-Uni, Danemark, Grèce)", 43, "#dc2626"], ["Religion préférée, non officielle", 40, "#d97706"], ["État hostile ou contrôlant toutes les religions (Chine, Cuba, Corée du Nord, Vietnam…)", 10, "#64748b"]];
  window.TH.bars(el, R.map(([l, v, c]) => ({ l, v, t: `${v} pays (${Math.round(100 * v / 199)} %)`, c })));
}

/* Carte du monde : religion officielle (Pew 2015) */
async function laiciteCarte() {
  const el = $("#la-carte"); if (!el) return;
  let G; try { G = await fetch("data/monde_religion.geojson").then(r => r.json()); } catch (e) { el.innerHTML = `<p class="empty">Carte indisponible.</p>`; return; }
  const RN = { chr: "christianisme", isl: "islam", bou: "bouddhisme", jud: "judaïsme", plu: "plusieurs religions" };
  const K = [["1chr", "Officielle : christianisme", "#1d4ed8"], ["1isl", "Officielle : islam", "#15803d"], ["1bou", "Officielle : bouddhisme", "#c2410c"], ["1jud", "Officielle : judaïsme", "#7c3aed"],
    ["2chr", "Préférée : christianisme", "#93c5fd"], ["2isl", "Préférée : islam", "#86efac"], ["2bou", "Préférée : bouddhisme", "#fdba74"], ["2plu", "Préférée : plusieurs religions", "#d6d3d1"],
    ["3", "Ni religion officielle ni préférée", "#fef3c7"], ["4", "État hostile ou contrôlant toutes les religions", "#374151"], ["0", "Non classé (territoire)", "#ffffff"]];
  const col = Object.fromEntries(K.map(k => [k[0], k[2]])), lab = Object.fromEntries(K.map(k => [k[0], k[1]]));
  const key = p => p.c === 1 || p.c === 2 ? p.c + p.r : String(p.c);
  const det = p => "";
  const rw = r => d3.geoArea({ type: "Polygon", coordinates: [r] }) > 2 * Math.PI ? r.slice().reverse() : r;
  G.features.forEach(f => { const g = f.geometry; if (g.type === "Polygon") g.coordinates = g.coordinates.map(rw); else if (g.type === "MultiPolygon") g.coordinates = g.coordinates.map(p => p.map(rw)); });
  const W = 900, H = 460, proj = d3.geoNaturalEarth1().fitExtent([[0, 0], [W, H]], G), path = d3.geoPath(proj);
  let svg = `<svg viewBox="0 0 ${W} ${H}" width="100%"><path d="${path({ type: "Sphere" })}" fill="none" stroke="#cbd5e1"/>`;
  G.features.forEach(f => { const p = f.properties, k = key(p); svg += `<path d="${path(f)}" fill="${col[k]}" stroke="#94a3b8" stroke-width=".35"><title>${p.n} : ${p.c === 1 ? "religion officielle : " + RN[p.r] : p.c === 2 ? "religion préférée : " + RN[p.r] : lab[k].toLowerCase()}</title></path>`; });
  el.innerHTML = svg + `</svg><div class="legend-row">${K.map(k => `<span><i style="border-top-color:${k[2]};opacity:1;width:14px;border-top-width:10px;outline:1px solid #cbd5e1"></i>${k[1]}</span>`).join("")}</div>`;
}

/* Histoire de l'art d'après Gombrich : 28 chapitres */
const GB = [
 [1,"Débuts mystérieux","Préhistoire ; peuples sans écriture ; Amérique ancienne",-30000,1500,"pre","Monde","L'image n'est pas une décoration : elle a un pouvoir magique ou religieux (faire réussir la chasse, honorer les ancêtres). On ne peut la juger avec nos critères de « beau ».","Grotte de Lascaux, vers 17 000 av. J.-C. (fac-similé Lascaux IV, Dordogne) ; masques d'Afrique et d'Océanie (musée du Quai Branly) ; art maya et aztèque"],
 [2,"Un art pour l'éternité","Égypte, Mésopotamie, Crète",-3000,-1000,"ant","Proche-Orient","L'Égyptien représente ce qu'il sait, pas ce qu'il voit : chaque partie du corps sous son angle le plus clair. Les règles restent presque fixes pendant 3 000 ans, car l'image doit durer pour l'éternité.","Pyramides de Gizeh, vers 2550 av. J.-C. ; buste de Néfertiti, vers 1340 av. J.-C. (Neues Museum, Berlin) ; stèle de Naram-Sin (Louvre)"],
 [3,"Le grand réveil","Grèce, VIIᵉ-Vᵉ siècle av. J.-C.",-700,-400,"ant","Europe","Les Grecs osent regarder : le raccourci, le corps en mouvement, l'équilibre du poids sur une jambe. Pour la première fois, l'artiste corrige les règles d'après l'observation.","Parthénon, 447-432 av. J.-C. (Athènes) ; Aurige de Delphes, vers 475 av. J.-C. (musée de Delphes) ; vases à figures rouges"],
 [4,"Le royaume de la beauté","Monde grec, IVᵉ s. av. J.-C. - Iᵉʳ s.",-400,0,"ant","Europe","L'art grec atteint la grâce idéale (Praxitèle), puis l'expression des passions et du drame à l'époque hellénistique.","Vénus de Milo et Victoire de Samothrace (Louvre) ; groupe du Laocoon (musées du Vatican)"],
 [5,"Les conquérants du monde","Rome, Inde, premiers arts chrétiens, Iᵉʳ-IVᵉ siècle",0,400,"ant","Europe et Asie","Les Romains mettent l'art grec au service de l'Empire : architecture, portrait réaliste, récit de victoires. Les religions reprennent ces formes pour raconter leurs histoires sacrées.","Panthéon de Rome, vers 125 ; colonne Trajane, 113 ; portraits du Fayoum (Louvre) ; Bouddhas du Gandhara"],
 [6,"La séparation des chemins","Rome et Byzance, Vᵉ-XIIIᵉ siècle",400,1250,"moy","Europe","L'art chrétien veut enseigner, pas imiter : figures solennelles, fonds d'or. Après la querelle des images, Byzance fixe des modèles que les icônes répéteront pendant des siècles.","Sainte-Sophie, Istanbul, 537 ; mosaïques de San Vitale, Ravenne, 547 ; icônes"],
 [7,"Regards vers l'Orient","Art islamique, Chine, IIᵉ-XIIIᵉ siècle",100,1300,"moy","Asie","Là où la représentation humaine est limitée, l'art se concentre sur l'ornement, la géométrie et la calligraphie. En Chine, la peinture de paysage est un exercice de méditation, à l'encre, de mémoire.","Alhambra de Grenade, XIVᵉ siècle ; tapis persans ; peintures de paysage des Song"],
 [8,"L'art occidental dans le creuset","Europe, VIᵉ-XIᵉ siècle",500,1100,"moy","Europe","Les traditions des peuples du Nord (entrelacs, animaux stylisés) se mêlent à l'héritage romain dans les monastères. Le moine copiste enseigne la foi par l'image.","Évangiles de Lindisfarne, vers 700 (British Library) ; chapelle palatine d'Aix-la-Chapelle, vers 800 ; tapisserie de Bayeux, fin du XIᵉ siècle"],
 [9,"L'Église militante","XIIᵉ siècle",1100,1200,"moy","Europe","Les églises romanes, massives comme des forteresses de Dieu ; la sculpture des portails raconte le Jugement dernier à des fidèles qui ne lisent pas.","Tympan de Vézelay ; portail de Saint-Trophime d'Arles ; fonts baptismaux de Liège (Renier de Huy)"],
 [10,"L'Église triomphante","XIIIᵉ siècle",1200,1300,"moy","Europe","La cathédrale gothique : murs de verre, voûtes sur croisées d'ogives, statues de plus en plus vivantes. En Italie, Giotto redonne aux figures du volume et de l'émotion.","Cathédrales de Chartres et Notre-Dame de Paris ; Sainte-Chapelle, 1248 ; chapelle des Scrovegni de Giotto, Padoue, vers 1305"],
 [11,"Courtisans et bourgeois","XIVᵉ siècle",1300,1400,"moy","Europe","Le gothique international : élégance, détails précieux, scènes de la vie courtoise pour les princes et les riches marchands.","Annonciation de Simone Martini, 1333 (Offices, Florence) ; Diptyque Wilton (National Gallery, Londres) ; Très Riches Heures du duc de Berry (château de Chantilly)"],
 [12,"La conquête de la réalité","Début du XVᵉ siècle",1400,1450,"ren","Europe","À Florence, Brunelleschi invente la perspective mathématique, Masaccio et Donatello l'appliquent ; en Flandre, Van Eyck peint chaque reflet grâce à la peinture à l'huile. Deux routes vers le réel.","Coupole de Florence, 1420-1436 ; Trinité de Masaccio, vers 1427 (Santa Maria Novella) ; Époux Arnolfini de Van Eyck, 1434 (National Gallery)"],
 [13,"Tradition et innovation (1)","Italie, fin du XVᵉ siècle",1450,1500,"ren","Europe","Comment concilier perspective exacte et belle composition ? Les peintres italiens cherchent l'équilibre entre espace réel et harmonie.","Naissance de Vénus de Botticelli, vers 1485 (Offices) ; Piero della Francesca ; Mantegna"],
 [14,"Tradition et innovation (2)","Europe du Nord, XVᵉ siècle",1430,1500,"ren","Europe","Au nord, le gothique se prolonge, mais avec une observation minutieuse des visages et des tissus. La gravure diffuse les images dans toute l'Europe.","Descente de croix de Rogier van der Weyden, vers 1435 (Prado) ; gravures de Schongauer"],
 [15,"L'harmonie atteinte","Toscane et Rome, début du XVIᵉ siècle",1500,1525,"ren","Europe","L'apogée : Léonard (le modelé dans l'ombre, le sfumato), Michel-Ange (le corps héroïque), Raphaël (l'harmonie parfaite). L'artiste devient un génie respecté des princes.","Cène de Léonard, 1495-1498 (Milan) ; Joconde (Louvre) ; plafond de la chapelle Sixtine de Michel-Ange, 1508-1512 ; École d'Athènes de Raphaël (Vatican)"],
 [16,"Lumière et couleur","Venise et Italie du Nord, début du XVIᵉ siècle",1500,1550,"ren","Europe","À Venise, la couleur et la lumière comptent plus que le dessin : Giorgione et Titien composent par les tons. Le Corrège ouvre les plafonds sur le ciel.","La Tempête de Giorgione (Accademia, Venise) ; Assomption de Titien, 1518 (église des Frari, Venise)"],
 [17,"Le savoir nouveau se répand","Allemagne et Pays-Bas, début du XVIᵉ siècle",1500,1550,"ren","Europe","Dürer rapporte d'Italie la science de la perspective et des proportions ; Holbein devient le grand portraitiste ; la Réforme prive bientôt les peintres de commandes religieuses.","Le Lièvre de Dürer, 1502 (Albertina, Vienne) ; retable d'Issenheim de Grünewald (musée Unterlinden, Colmar) ; Les Ambassadeurs de Holbein, 1533 (National Gallery)"],
 [18,"Une crise de l'art","Europe, fin du XVIᵉ siècle",1525,1600,"ren","Europe","Après les maîtres, que faire ? Le maniérisme cherche l'étrange et l'allongé ; Le Greco l'exaltation ; Bruegel peint les paysans et la vie ordinaire.","Madone au long cou du Parmesan (Offices) ; Enterrement du comte d'Orgaz du Greco, 1586 (Tolède) ; Chasseurs dans la neige de Bruegel, 1565 (Vienne)"],
 [19,"Vision et visions","Europe catholique, 1ʳᵉ moitié du XVIIᵉ siècle",1600,1650,"cla","Europe","Le Caravage peint le sacré avec des gens du peuple et une lumière brutale ; Rubens, la vie et le mouvement ; Velázquez, la vision pure de ce que l'œil perçoit.","Vocation de saint Matthieu du Caravage, 1600 (Saint-Louis-des-Français, Rome) ; Les Ménines de Velázquez, 1656 (Prado)"],
 [20,"Le miroir de la nature","Hollande, XVIIᵉ siècle",1600,1700,"cla","Europe","Pays protestant et marchand : on ne commande plus d'images d'église, mais des portraits, paysages, scènes d'intérieur, natures mortes, vendus sur un marché. Rembrandt sonde l'âme, Vermeer la lumière.","La Ronde de nuit de Rembrandt, 1642, et La Laitière de Vermeer (Rijksmuseum, Amsterdam)"],
 [21,"Puissance et gloire (1)","Italie, XVIIᵉ-XVIIIᵉ siècle",1650,1750,"cla","Europe","Le baroque : architecture, sculpture et peinture fusionnent pour émouvoir et éblouir le fidèle, au service de l'Église de la Contre-Réforme.","Extase de sainte Thérèse du Bernin, 1652 (Rome) ; plafonds de Tiepolo"],
 [22,"Puissance et gloire (2)","France, Allemagne, Autriche, vers 1700",1660,1750,"cla","Europe","Versailles devient le modèle des palais d'Europe ; puis le rococo, plus léger. Watteau peint des fêtes rêveuses teintées de mélancolie.","Château de Versailles ; Pèlerinage à l'île de Cythère de Watteau, 1717 (Louvre)"],
 [23,"L'âge de raison","Angleterre et France, XVIIIᵉ siècle",1700,1800,"cla","Europe","Le public bourgeois et les Lumières : Hogarth moralise par l'image, Reynolds et Gainsborough peignent la société, Chardin la poésie des objets simples.","Le Bénédicité de Chardin, 1740 (Louvre) ; Voltaire assis de Houdon (Comédie-Française)"],
 [24,"La rupture de la tradition","Angleterre, Amérique, France, vers 1800",1780,1840,"xix","Europe et Amérique","La Révolution et la fin des commandes traditionnelles : l'artiste choisit ses sujets. Goya dénonce la guerre, Turner et Constable regardent la nature autrement, le romantisme naît.","Mort de Marat de David, 1793 (Bruxelles) ; Tres de Mayo de Goya, 1814 (Prado) ; La Charrette de foin de Constable, 1821 (National Gallery)"],
 [25,"La révolution permanente","XIXᵉ siècle",1840,1880,"xix","Europe","L'artiste contre le public et les Salons officiels : Courbet et le réalisme, Manet, puis les impressionnistes qui peignent dehors la lumière changeante. La photographie libère la peinture de la ressemblance.","Bonjour Monsieur Courbet, 1854 (musée Fabre, Montpellier) ; Impression, soleil levant de Monet, 1872 (Marmottan) ; Bal du moulin de la Galette de Renoir, 1876 (Orsay)"],
 [26,"À la recherche de nouvelles normes","Fin du XIXᵉ siècle",1880,1905,"xix","Europe","Les impressionnistes ont perdu la solidité, l'ordre et l'émotion : Cézanne cherche la structure, Seurat la méthode, Van Gogh l'expression, Gauguin la simplicité « primitive ». Trois voies vers l'art moderne.","Montagne Sainte-Victoire de Cézanne (plusieurs musées) ; Nuit étoilée de Van Gogh, 1889 (MoMA, New York) ; Un dimanche à la Grande Jatte de Seurat (Chicago)"],
 [27,"L'art expérimental","1ʳᵉ moitié du XXᵉ siècle",1905,1945,"xx","Europe et Amérique","Expressionnisme, cubisme, abstraction, surréalisme : chaque mouvement explore un des chemins ouverts par Cézanne, Van Gogh ou Gauguin. L'art cesse de vouloir représenter le monde visible.","Les Demoiselles d'Avignon de Picasso, 1907 (MoMA) ; compositions de Kandinsky et de Mondrian ; Le Cri de Munch, 1893 (Oslo)"],
 [28,"Une histoire sans fin","Depuis 1945",1945,1995,"xx","Monde","Le triomphe de l'art moderne, devenu officiel ; l'expressionnisme abstrait (Pollock), puis le retour de l'image (pop art). Gombrich termine sur l'idée que l'histoire de l'art se réécrit sans cesse, avec les découvertes et le goût de chaque époque.","Peintures de Jackson Pollock ; Centre Pompidou ; Tate Modern"]
];
const GBP = [["pre", "Préhistoire et peuples sans écriture", "#78716c"], ["ant", "Antiquité (avant 400)", "#b45309"], ["moy", "Moyen Âge (400-1400)", "#7c3aed"], ["ren", "Renaissance (XVᵉ-XVIᵉ s.)", "#2563eb"], ["cla", "XVIIᵉ-XVIIIᵉ siècles", "#0d9488"], ["xix", "XIXᵉ siècle", "#dc2626"], ["xx", "XXᵉ siècle", "#111827"]];
function gombrich() {
  if (!$("#ar-chap")) return;
  const { esc, bars } = window.TH, pc = Object.fromEntries(GBP.map(p => [p[0], p[2]]));
  const fd = a => a < 0 ? `${(-a).toLocaleString("fr-FR")} av. J.-C.` : a;
  $("#ar-chap").innerHTML = GB.map(c => `<tr><td><b style="color:${pc[c[5]]}">${c[0]}</b></td><td><b>${esc(c[1])}</b></td><td>${esc(c[2])}</td><td>${esc(c[7])}</td><td><small>${esc(c[8])}</small></td></tr>`).join("");
  bars($("#ar-periodes"), GBP.map(([k, l, col]) => ({ l, v: GB.filter(c => c[5] === k).length, t: GB.filter(c => c[5] === k).length + " chap.", c: col })));
  const L = {}; GB.forEach(c => L[c[6]] = (L[c[6]] || 0) + 1);
  bars($("#ar-lieux"), Object.entries(L).sort((a, b) => b[1] - a[1]).map(([l, v]) => ({ l, v, t: v + " chap.", c: l === "Europe" ? "#2563eb" : "#64748b" })));
  // frise : une barre par chapitre, échelle découpée (préhistoire comprimée)
  const W = 900, rh = 15, top = 24, H = top + GB.length * rh + 30, x0 = 250, x1 = W - 10;
  const seg = [[-30000, -3000, 0, .12], [-3000, 0, .12, .27], [0, 1400, .27, .5], [1400, 2000, .5, 1]];
  const sc = a => { for (const [a0, a1, f0, f1] of seg) if (a <= a1) return x0 + (f0 + (Math.max(a, a0) - a0) / (a1 - a0) * (f1 - f0)) * (x1 - x0); return x1; };
  let svg = `<svg viewBox="0 0 ${W} ${H}" width="100%" style="font-size:10.5px">`;
  [[-30000, "30 000 av."], [-3000, "3000 av."], [0, "0"], [500, "500"], [1000, "1000"], [1400, "1400"], [1600, "1600"], [1800, "1800"], [2000, "2000"]].forEach(([a, t]) => svg += `<line x1="${sc(a)}" x2="${sc(a)}" y1="${top - 4}" y2="${H - 26}" stroke="#e2e8f0"/><text x="${sc(a)}" y="${top - 8}" text-anchor="middle" fill="#64748b">${t}</text>`);
  [[-30000, -3000], [-3000, 0], [0, 1400]].forEach(([a, b]) => svg += `<text x="${(sc(a) + sc(b)) / 2}" y="${H - 10}" text-anchor="middle" fill="#94a3b8" font-style="italic">échelle comprimée</text>`);
  GB.forEach((c, i) => { const y = top + i * rh; svg += `<text x="${x0 - 6}" y="${y + 11}" text-anchor="end" fill="currentColor">${c[0]}. ${esc(c[1])}</text><rect x="${sc(c[3])}" y="${y + 2}" width="${Math.max(3, sc(c[4]) - sc(c[3]))}" height="${rh - 4}" rx="2" fill="${pc[c[5]]}"><title>${esc(c[1])} : ${fd(c[3])} à ${fd(c[4])}</title></rect>`; });
  $("#ar-frise").innerHTML = svg + `</svg><div class="legend-row">${GBP.map(p => `<span><i style="border-top-color:${p[2]};opacity:1;width:14px"></i>${p[1]}</span>`).join("")}</div>`;
}

/* typologie : figures de l'Ancien Testament → accomplissement dans le Nouveau */
function typologie() {
  const el = $("#cr-typo"); if (!el) return;
  const T = [["Adam, le premier homme (Genèse 2-3)", "Le Christ, « nouvel Adam » (Romains 5)"], ["Le sacrifice d'Isaac par Abraham (Genèse 22)", "Le sacrifice du Fils sur la croix"], ["L'agneau de la Pâque (Exode 12)", "« Voici l'agneau de Dieu » (Jean 1, 29)"], ["Le passage de la mer Rouge (Exode 14)", "Le baptême (1 Corinthiens 10)"], ["La manne dans le désert (Exode 16)", "L'eucharistie, « pain de vie » (Jean 6)"], ["Le serpent d'airain élevé par Moïse (Nombres 21)", "Le Christ élevé sur la croix (Jean 3, 14)"], ["Melchisédech offre le pain et le vin (Genèse 14)", "Le Christ prêtre éternel (Hébreux 7)"], ["Jonas, trois jours dans le poisson (Jonas 2)", "Trois jours au tombeau, puis la résurrection (Matthieu 12, 40)"], ["« La jeune femme est enceinte » (Isaïe 7, 14)", "La naissance virginale (Matthieu 1, 23)"], ["Le Serviteur souffrant (Isaïe 53)", "La Passion"]];
  const W = 900, rh = 30, H = T.length * rh + 30, LX = 380, RX = 520;
  let s = `<svg viewBox="0 0 ${W} ${H}" width="100%" style="font-size:11.5px"><text x="${LX}" y="14" text-anchor="end" font-weight="700" fill="#9333ea">Ancien Testament : la « figure »</text><text x="${RX}" y="14" font-weight="700" fill="#2563eb">Nouveau Testament : l'« accomplissement »</text>`;
  T.forEach(([a, b], i) => { const y = 34 + i * rh; s += `<text x="${LX}" y="${y}" text-anchor="end" fill="currentColor">${a}</text><path d="M${LX + 6},${y - 4} C${(LX + RX) / 2},${y - 4} ${(LX + RX) / 2},${y - 4} ${RX - 6},${y - 4}" stroke="#a78bfa" stroke-width="2" fill="none" marker-end="url(#tya)"/><text x="${RX}" y="${y}" fill="currentColor">${b}</text>`; });
  el.innerHTML = s + `<defs><marker id="tya" viewBox="0 0 10 10" refX="8" refY="5" markerUnits="userSpaceOnUse" markerWidth="9" markerHeight="9" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#a78bfa"/></marker></defs></svg>`;
}

/* voyages de Paul */
async function paulCarte() {
  const el = $("#cr-paul-carte"); if (!el) return;
  let G; try { G = await fetch("data/monde_religion.geojson").then(r => r.json()); } catch (e) { return; }
  const C = { "Jérusalem": [35.23, 31.78], "Damas": [36.29, 33.51], "Antioche": [36.16, 36.2], "Tarse": [34.9, 36.92], "Salamine": [33.9, 35.18], "Paphos": [32.42, 34.77], "Pergé": [30.85, 36.96], "Antioche de Pisidie": [31.19, 38.31], "Iconium": [32.48, 37.87], "Lystres": [32.33, 37.58], "Derbé": [33.36, 37.35], "Troas": [26.16, 39.75], "Philippes": [24.29, 41.01], "Thessalonique": [22.94, 40.64], "Bérée": [22.2, 40.52], "Athènes": [23.73, 37.98], "Corinthe": [22.88, 37.91], "Éphèse": [27.34, 37.94], "Milet": [27.28, 37.53], "Rhodes": [28.22, 36.43], "Tyr": [35.2, 33.27], "Césarée": [34.89, 32.5], "Myre": [29.98, 36.26], "Crète": [24.77, 34.93], "Malte": [14.4, 35.95], "Syracuse": [15.29, 37.07], "Pouzzoles": [14.12, 40.82], "Rome": [12.49, 41.9] };
  const V = [["Conversion (vers 33-36)", "#6b7280", ["Jérusalem", "Damas"]], ["1ᵉʳ voyage (vers 46-48)", "#2563eb", ["Antioche", "Salamine", "Paphos", "Pergé", "Antioche de Pisidie", "Iconium", "Lystres", "Derbé", "Lystres", "Pergé", "Antioche"]], ["2ᵉ voyage (vers 49-52)", "#16a34a", ["Antioche", "Tarse", "Derbé", "Lystres", "Iconium", "Troas", "Philippes", "Thessalonique", "Bérée", "Athènes", "Corinthe", "Éphèse", "Césarée", "Jérusalem", "Antioche"]], ["3ᵉ voyage (vers 53-58)", "#f59e0b", ["Antioche", "Iconium", "Éphèse", "Troas", "Philippes", "Thessalonique", "Corinthe", "Philippes", "Troas", "Milet", "Rhodes", "Tyr", "Césarée", "Jérusalem"]], ["Captif vers Rome (vers 59-60)", "#dc2626", ["Césarée", "Myre", "Crète", "Malte", "Syracuse", "Pouzzoles", "Rome"]]];
  const rw = r => d3.geoArea({ type: "Polygon", coordinates: [r] }) > 2 * Math.PI ? r.slice().reverse() : r;
  G.features.forEach(f => { const g = f.geometry; if (g.type === "Polygon") g.coordinates = g.coordinates.map(rw); else if (g.type === "MultiPolygon") g.coordinates = g.coordinates.map(q => q.map(rw)); });
  const W = 900, H = 470, proj = d3.geoMercator().fitExtent([[0, 0], [W, H]], { type: "MultiPoint", coordinates: [[11, 30.5], [38.5, 43]] }), path = d3.geoPath(proj);
  let s = `<svg viewBox="0 0 ${W} ${H}" width="100%" style="font-size:10.5px;background:#dbeafe;border-radius:8px;overflow:hidden"><defs><clipPath id="pclip"><rect width="${W}" height="${H}"/></clipPath></defs><g clip-path="url(#pclip)">`;
  G.features.forEach(f => s += `<path d="${path(f)}" fill="#f5f5f4" stroke="#d6d3d1" stroke-width=".6"/>`);
  V.forEach(([n, c, pts], k) => { const xy = pts.map(p => proj(C[p])); s += `<path d="${d3.line().curve(d3.curveCatmullRom.alpha(.5))(xy.map(([x, y]) => [x + (k - 2) * 2.5, y + (k - 2) * 2.5]))}" fill="none" stroke="${c}" stroke-width="2.4" stroke-opacity=".85" ${k === 0 ? 'stroke-dasharray="4 3"' : ""}/>`; });
  Object.entries(C).forEach(([n, ll]) => { const [x, y] = proj(ll); const big = ["Jérusalem", "Antioche", "Éphèse", "Corinthe", "Rome", "Athènes", "Thessalonique", "Tarse", "Damas", "Philippes"].includes(n); s += `<circle cx="${x}" cy="${y}" r="${big ? 4 : 2.6}" fill="#111827"/>${big || ["Malte", "Crète", "Iconium", "Troas", "Césarée"].includes(n) ? `<text x="${x + 6}" y="${y - 4}" style="fill:#111827" font-weight="${big ? 700 : 400}">${n}</text>` : ""}`; });
  el.innerHTML = s + `</g></svg><div class="legend-row">${V.map(([n, c]) => `<span><i style="border-top-color:${c};opacity:1;width:16px"></i>${n}</span>`).join("")}</div>`;
}

/* courants des cinq premiers siècles */
function sankeyPrim() {
  const el = $("#cr-sankey-prim"); if (!el || !window.d3?.sankey) return;
  const N = [["dis", "Disciples de Jésus (Jérusalem, vers 30)", 0, "#6b7280"],
    ["jud", "Judéo-chrétiens (Jacques, Pierre)", 1, "#a8a29e"], ["pau", "Communautés de Paul (non-juifs)", 1, "#2563eb"], ["joh", "Communautés johanniques", 1, "#0ea5e9"],
    ["ebi", "Ébionites, nazaréens", 2, "#a8a29e"], ["gno", "Gnostiques", 2, "#9333ea"], ["mar", "Marcionites", 2, "#c084fc"], ["mon", "Montanistes", 2, "#e879f9"], ["gra", "« Grande Église » (évêques, canon)", 2, "#1d4ed8"],
    ["ari", "Ariens (Goths, Vandales)", 3, "#f59e0b"], ["don", "Donatistes (Afrique)", 3, "#fbbf24"], ["nic", "Église impériale (Nicée, 325)", 3, "#1e3a8a"],
    ["dis2", "Courants disparus (Vᵉ-VIIᵉ siècle)", 4, "#d6d3d1"], ["ori", "Église de l'Orient (431)", 4, "#c084fc"], ["oor", "Orthodoxes orientaux (451)", 4, "#a855f7"], ["cha", "Chalcédoine (451) : futurs catholiques et orthodoxes", 4, "#1d4ed8"]];
  const L = [["dis", "jud", 10], ["dis", "pau", 65], ["dis", "joh", 15], ["jud", "ebi", 10], ["pau", "gno", 8], ["joh", "gno", 3], ["pau", "mar", 7], ["pau", "mon", 3], ["pau", "gra", 47], ["joh", "gra", 12],
    ["gra", "ari", 6], ["gra", "don", 3], ["gra", "nic", 50], ["ebi", "dis2", 10], ["gno", "dis2", 11], ["mar", "dis2", 7], ["mon", "dis2", 3], ["ari", "dis2", 6], ["don", "dis2", 3], ["nic", "ori", 2], ["nic", "oor", 6], ["nic", "cha", 42]];
  const W = 900, H = 520;
  const g = d3.sankey().nodeId(d => d.id).nodeAlign(n => n.c).nodeSort(null).nodeWidth(12).nodePadding(16).extent([[2, 26], [W - 230, H - 6]])({ nodes: N.map(([id, l, c, col]) => ({ id, l, c, col })), links: L.map(([s, t, v]) => ({ source: s, target: t, value: v })) });
  const svg = d3.select(el).html("").append("svg").attr("viewBox", `0 0 ${W} ${H}`).attr("width", "100%");
  ["Iᵉʳ siècle", "fin Iᵉʳ - IIᵉ s.", "IIᵉ - IIIᵉ s.", "IVᵉ s.", "Vᵉ s."].forEach((t, i) => svg.append("text").attr("x", 2 + i * (W - 232) / 4).attr("y", 12).attr("font-size", 11).attr("font-weight", 700).style("fill", "#64748b").text(t));
  svg.append("g").attr("fill", "none").selectAll("path").data(g.links).join("path").attr("d", d3.sankeyLinkHorizontal()).attr("stroke", d => d.target.col).attr("stroke-opacity", .35).attr("stroke-width", d => Math.max(1.5, d.width));
  svg.append("g").selectAll("rect").data(g.nodes).join("rect").attr("x", d => d.x0).attr("y", d => d.y0).attr("width", d => d.x1 - d.x0).attr("height", d => Math.max(2, d.y1 - d.y0)).attr("fill", d => d.col);
  svg.append("g").attr("font-size", 11).selectAll("text").data(g.nodes).join("text").attr("x", d => d.c === 4 ? d.x1 + 6 : d.x0).attr("y", d => d.c === 4 ? (d.y0 + d.y1) / 2 : d.y0 - 4).attr("dy", d => d.c === 4 ? "0.35em" : 0).style("fill", "currentColor").text(d => d.l);
}

/* croissance du christianisme dans l'Empire (modèle de Stark) */
function croissance() {
  const el = $("#cr-croissance-g"); if (!el) return;
  const S = [[40, 0.0017], [100, 0.0126], [150, 0.07], [200, 0.36], [250, 1.9], [300, 10.5], [350, 56.5]];
  const EV = [[64, "Néron"], [250, "persécution de Dèce"], [303, "Dioclétien"], [312, "Constantin"], [380, "Théodose : religion officielle"]];
  const draw = (log, W, H) => { const m = { l: 52, r: 12, t: 16, b: 30 }, x = d3.scaleLinear([30, 400], [m.l, W - m.r]), y = log ? d3.scaleLog([0.001, 100], [H - m.b, m.t]) : d3.scaleLinear([0, 100], [H - m.b, m.t]);
    let s = `<svg viewBox="0 0 ${W} ${H}" width="100%" style="font-size:10.5px">`;
    (log ? [0.001, 0.01, 0.1, 1, 10, 100] : [0, 20, 40, 60, 80, 100]).forEach(v => s += `<line x1="${m.l}" x2="${W - m.r}" y1="${y(v)}" y2="${y(v)}" stroke="#eef2f7"/><text x="${m.l - 5}" y="${y(v) + 3}" text-anchor="end" style="fill:#64748b">${String(v).replace(".", ",")} %</text>`);
    [50, 100, 150, 200, 250, 300, 350, 400].forEach(v => s += `<text x="${x(v)}" y="${H - 10}" text-anchor="middle" style="fill:#64748b">${v}</text>`);
    s += `<rect x="${x(295)}" y="${y(10)}" width="${x(305) - x(295)}" height="${y(5) - y(10)}" fill="#fca5a5" opacity=".6"/>`;
    EV.forEach(([a, t], i) => s += `<line x1="${x(a)}" x2="${x(a)}" y1="${m.t}" y2="${H - m.b}" stroke="#cbd5e1" stroke-dasharray="3 3"/><text x="${x(a) + 3}" y="${m.t + 10 + (i % 3) * 11}" style="fill:#64748b" font-size="9.5">${t}</text>`);
    s += `<polyline points="${S.map(([a, v]) => `${x(a)},${y(v)}`).join(" ")}" fill="none" stroke="#2563eb" stroke-width="2.4"/>`;
    S.forEach(([a, v]) => s += `<circle cx="${x(a)}" cy="${y(v)}" r="4" fill="#2563eb"><title>${a} : ${String(v).replace(".", ",")} %</title></circle>`);
    if (!log) s += `<text x="${x(350) - 6}" y="${y(56.5) - 8}" text-anchor="end" style="fill:#2563eb" font-weight="700">vers 350 : plus de la moitié ?</text><text x="${x(300) + 8}" y="${y(10.5) + 4}" style="fill:#2563eb" font-weight="700">vers 300 : ≈ 10 %</text>`;
    else s += `<text x="${x(160)}" y="${y(0.004)}" style="fill:#2563eb">croissance constante (≈ 40 % par décennie) :</text><text x="${x(160)}" y="${y(0.0022)}" style="fill:#2563eb">une droite en échelle logarithmique</text>`;
    return s + "</svg>"; };
  el.innerHTML = `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(400px,1fr));gap:18px"><div><p class="muted" style="margin:0 0 4px"><b>Part de chrétiens dans l'Empire romain</b> (%)</p>${draw(false, 440, 280)}</div><div><p class="muted" style="margin:0 0 4px"><b>La même chose en échelle logarithmique</b></p>${draw(true, 440, 280)}</div></div>`;
}

/* héritiers de Rome (frise) et portée comparée */
function heritiers() {
  const el = $("#cr-heritiers"); if (!el) return;
  const R = [["Empire romain (d'Auguste à la chute de l'Occident)", -27, 476, "#b91c1c"], ["Empire romain d'Orient (Byzance)", 395, 1453, "#9333ea"], ["Papauté (évêques de Rome)", 60, 2026, "#d97706"], ["Empire carolingien", 800, 888, "#2563eb"], ["Saint-Empire romain germanique", 962, 1806, "#1d4ed8"], ["Russie des tsars (« troisième Rome »)", 1547, 1917, "#16a34a"], ["Sultans ottomans, « César de Rome »", 1453, 1922, "#0d9488"], ["Empire napoléonien", 1804, 1815, "#64748b"], ["Empire allemand (Kaiser)", 1871, 1918, "#475569"]];
  const W = 900, rh = 26, H = R.length * rh + 40, m = { l: 300, r: 20 }, x = d3.scaleLinear([-100, 2030], [m.l, W - m.r]);
  let s = `<svg viewBox="0 0 ${W} ${H}" width="100%" style="font-size:11px">`;
  [0, 500, 1000, 1500, 2000].forEach(v => s += `<line x1="${x(v)}" x2="${x(v)}" y1="8" y2="${H - 24}" stroke="#eef2f7"/><text x="${x(v)}" y="${H - 8}" text-anchor="middle" style="fill:#64748b">${v === 0 ? "an 1" : v}</text>`);
  R.forEach(([l, a, b, c], i) => { const y = 10 + i * rh; s += `<text x="${m.l - 8}" y="${y + 15}" text-anchor="end" style="fill:currentColor">${l}</text><rect x="${x(a)}" y="${y + 4}" width="${Math.max(3, x(b) - x(a))}" height="${rh - 9}" rx="4" fill="${c}" opacity=".85"><title>${l} : ${a < 0 ? -a + " av. J.-C." : a} - ${b === 2026 ? "aujourd'hui" : b}</title></rect>`; });
  [[476, "chute de Rome"], [1453, "chute de Constantinople"]].forEach(([v, t]) => s += `<line x1="${x(v)}" x2="${x(v)}" y1="8" y2="${H - 24}" stroke="#111827" stroke-dasharray="4 3"/><text x="${x(v) + 3}" y="${H - 26}" style="fill:#111827" font-size="10">${t}</text>`);
  el.innerHTML = s + "</svg>";
  window.TH.bars($("#cr-portee"), [{ l: "Empire romain à son apogée (vers 117)", v: 60, t: "≈ 60 millions", c: "#b91c1c" }, { l: "Locuteurs des langues issues du latin", v: 1000, t: "≈ 1 milliard", c: "#0ea5e9" }, { l: "Catholiques (l'Église de Rome)", v: 1400, t: "≈ 1,4 milliard", c: "#d97706" }, { l: "Chrétiens", v: 2300, t: "≈ 2,3 milliards", c: "#9333ea" }]);
}

function init() {
  if (!window.TH || !window.d3) { setTimeout(init, 100); return; }
  try { fiscalite(); } catch (e) { console.error("fiscalite", e); }
  try { sankey(); } catch (e) { console.error("christianisme", e); }
  try { ancienTestament(); } catch (e) { console.error("ancien testament", e); }
  try { correspondance(); } catch (e) { console.error("correspondance", e); }
  try { typologie(); } catch (e) { console.error("typologie", e); }
  try { heritiers(); } catch (e) { console.error("heritiers", e); }
  try { paulCarte(); sankeyPrim(); croissance(); } catch (e) { console.error("christianisme primitif", e); }
  try { laiciteFrise(); laicitePew(); laiciteCarte(); } catch (e) { console.error("laicite", e); }
  try { gombrich(); } catch (e) { console.error("gombrich", e); }
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
