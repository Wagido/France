/* Onglet Eau : parcours, services, qualité, fuites, prix (SISPEA, données 2024) */
(() => {
"use strict";
const $ = s => document.querySelector(s);
const fr = (v, d = 0) => v.toLocaleString("fr-FR", { minimumFractionDigits: d, maximumFractionDigits: d });

function parcours() {
  const el = $("#eau-parcours"); if (!el) return;
  const W = 900, H = 300;
  const st = [[60, "Nappe ou rivière", "65 % de nappes", "#0ea5e9"], [190, "Captage", "protégé à 79 %", "#0284c7"], [320, "Usine de traitement", "désinfection, filtration", "#7c3aed"], [450, "Réservoir, château d'eau", "pression et stock", "#2563eb"], [580, "Réseau : 980 000 km", "rendement 81,5 %", "#1d4ed8"], [710, "Robinet", "148 L/hab./jour", "#16a34a"], [840, "Égout, station d'épuration", "puis retour à la rivière", "#78716c"]];
  let s = `<svg viewBox="0 0 ${W} ${H}" width="100%" style="font-size:11px"><defs><marker id="ep" viewBox="0 0 10 10" refX="8" refY="5" markerUnits="userSpaceOnUse" markerWidth="12" markerHeight="12" orient="auto"><path d="M0,0 L10,5 L0,10z" fill="#0ea5e9"/></marker></defs>`;
  s += `<rect x="0" y="200" width="${W}" height="100" fill="#fef3c7" opacity=".5"/><text x="8" y="292" style="fill:#92400e">sous-sol</text>`;
  st.forEach(([x, t, d, c], i) => {
    s += `<circle cx="${x}" cy="120" r="34" fill="${c}" opacity=".15" stroke="${c}" stroke-width="2"/><text x="${x}" y="118" text-anchor="middle" style="fill:${c}" font-weight="800" font-size="20">${i + 1}</text>`;
    s += `<text x="${x}" y="176" text-anchor="middle" font-weight="700">${t}</text><text x="${x}" y="192" text-anchor="middle" style="fill:#64748b">${d}</text>`;
    if (i < st.length - 1) s += `<line x1="${x + 38}" y1="120" x2="${st[i + 1][0] - 40}" y2="120" stroke="#0ea5e9" stroke-width="4" marker-end="url(#ep)"/>`;
  });
  s += `<path d="M580,154 q0,70 -10,90" stroke="#dc2626" stroke-width="2.5" stroke-dasharray="5 4" fill="none"/><text x="590" y="250" style="fill:#dc2626" font-weight="700">fuites : 18,5 %</text><text x="590" y="265" style="fill:#dc2626">retour au sol et aux nappes</text>`;
  s += `<path d="M60,154 q0,60 0,90" stroke="#0ea5e9" stroke-width="2" fill="none"/><ellipse cx="60" cy="262" rx="44" ry="14" fill="#7dd3fc" opacity=".7"/><text x="60" y="266" text-anchor="middle" style="fill:#075985" font-weight="700">nappe</text>`;
  s += `<path d="M840,86 C 840,30 60,30 60,86" stroke="#94a3b8" stroke-width="1.5" stroke-dasharray="3 5" fill="none"/><text x="450" y="40" text-anchor="middle" style="fill:#64748b">le cycle se referme : l'eau épurée rejoint les rivières, qui alimentent les nappes</text>`;
  el.innerHTML = s + "</svg>";
}
function services() {
  const el = $("#eau-services"); if (!el) return;
  window.TH.bars(el, [{ l: "Services d'assainissement collectif", v: 11085, t: "11 085", c: "#78716c" }, { l: "Services d'eau potable", v: 9623, t: "9 623", c: "#2563eb" }, { l: "Services d'assainissement non collectif", v: 2362, t: "2 362", c: "#a8a29e" }, { l: "Collectivités organisatrices (communes, syndicats, intercommunalités)", v: 12685, t: "12 685", c: "#0ea5e9" }]);
}
function qualite() {
  if (!$("#eau-qualite")) return;
  window.TH.kpis("#eau-qualite", [["98,3 %", ["des analyses conformes", "bactéries"], "Qualité microbiologique"], ["98,1 %", ["des analyses conformes", "nitrates, pesticides, métaux"], "Qualité physico-chimique"], ["79 %", ["avancement moyen", "des périmètres de protection"], "Protection des captages"], ["2,5", ["coupures non programmées", "pour 1 000 abonnés par an"], "Coupures"]]);
}
function fuites() {
  const el = $("#eau-fuites"); if (!el) return;
  const W = 900, H = 210;
  let s = `<svg viewBox="0 0 ${W} ${H}" width="100%" style="font-size:11.5px">`;
  const drop = (x, y, c, lost) => `<path d="M${x},${y - 34} C${x + 22},${y - 6} ${x + 22},${y + 18} ${x},${y + 18} C${x - 22},${y + 18} ${x - 22},${y - 6} ${x},${y - 34} Z" fill="${c}" ${lost ? 'stroke="#dc2626" stroke-dasharray="4 3" stroke-width="2" fill-opacity=".25"' : ""}/>`;
  for (let i = 0; i < 5; i++) s += drop(70 + i * 62, 80, i === 4 ? "#fca5a5" : "#3b82f6", i === 4);
  s += `<text x="194" y="130" text-anchor="middle" font-weight="700">sur 5 litres mis dans le réseau…</text><text x="132" y="150" text-anchor="middle" style="fill:#1d4ed8">4 arrivent au robinet (81,5 %)</text><text x="318" y="150" text-anchor="middle" style="fill:#dc2626">1 se perd (18,5 %)</text>`;
  // renouvellement
  const x0 = 470, w = 320, km = 980000, ren = 5980;
  s += `<text x="${x0}" y="40" font-weight="700">Réseau renouvelé chaque année</text><rect x="${x0}" y="52" width="${w}" height="26" fill="#dbeafe" stroke="#93c5fd"/><rect x="${x0}" y="52" width="${Math.max(3, w * ren / km)}" height="26" fill="#2563eb"/><text x="${x0}" y="96" style="fill:#1d4ed8">≈ 6 000 km sur 980 000 km : 0,61 % par an</text><text x="${x0}" y="114" style="fill:#64748b">à ce rythme, un remplacement complet prendrait environ 165 ans</text>`;
  s += `<text x="${x0}" y="150" font-weight="700">Connaissance des réseaux (sur 120 points)</text><rect x="${x0}" y="160" width="${w}" height="12" fill="#f1f5f9"/><rect x="${x0}" y="160" width="${w * 105 / 120}" height="12" fill="#2563eb"/><text x="${x0 + w + 6}" y="170" style="fill:#2563eb">105 eau potable</text><rect x="${x0}" y="180" width="${w}" height="12" fill="#f1f5f9"/><rect x="${x0}" y="180" width="${w * 73 / 120}" height="12" fill="#78716c"/><text x="${x0 + w * 73 / 120 + 6}" y="190" style="fill:#78716c">73 égouts</text>`;
  el.innerHTML = s + "</svg>";
}
function prix() {
  const el = $("#eau-prix"); if (!el) return;
  const P = [["2011", 1.93, 1.73], ["2022", 2.13, 2.21], ["2024", null, null, 4.69], ["2025", 2.50, 2.39]];
  const W = 440, H = 240, m = { l: 40, r: 10, t: 14, b: 28 }, x = d3.scaleBand(P.map(p => p[0]), [m.l, W - m.r]).padding(.35), y = d3.scaleLinear([0, 5.5], [H - m.b, m.t]);
  let s = `<svg viewBox="0 0 ${W} ${H}" width="100%" style="font-size:10.5px">`;
  [0, 1, 2, 3, 4, 5].forEach(v => s += `<line x1="${m.l}" x2="${W - m.r}" y1="${y(v)}" y2="${y(v)}" stroke="#eef2f7"/><text x="${m.l - 5}" y="${y(v) + 3}" text-anchor="end" style="fill:#64748b">${v} €</text>`);
  P.forEach(([a, e, as, tot]) => { const X = x(a), bw = x.bandwidth(); if (e != null) { s += `<rect x="${X}" y="${y(e)}" width="${bw}" height="${y(0) - y(e)}" fill="#2563eb"/><rect x="${X}" y="${y(e + as)}" width="${bw}" height="${y(0) - y(as)}" fill="#78716c"/>`; tot = e + as; } else s += `<rect x="${X}" y="${y(tot)}" width="${bw}" height="${y(0) - y(tot)}" fill="#94a3b8"/>`; s += `<text x="${X + bw / 2}" y="${y(tot) - 4}" text-anchor="middle" font-weight="700">${fr(tot, 2)} €</text><text x="${X + bw / 2}" y="${H - 10}" text-anchor="middle" style="fill:#64748b">1ᵉʳ janv. ${a}</text>`; });
  el.innerHTML = s + `</svg><div class="legend-row"><span><i style="border-top-color:#2563eb;opacity:1;width:14px;border-top-width:10px"></i>Eau potable</span><span><i style="border-top-color:#78716c;opacity:1;width:14px;border-top-width:10px"></i>Assainissement</span><span><i style="border-top-color:#94a3b8;opacity:1;width:14px;border-top-width:10px"></i>Total (détail non publié)</span></div>`;
  window.TH.bars($("#eau-facture"), [{ l: "Service de l'eau potable (hors taxes)", v: 224, t: "224 € (1,87 €/m³)", c: "#2563eb" }, { l: "Service de l'assainissement (hors taxes)", v: 248, t: "248 € (2,07 €/m³)", c: "#78716c" }, { l: "Taxes (dont TVA) et redevances des agences de l'eau", v: 114, t: "114 € (0,95 €/m³)", c: "#f59e0b" }]);
}

/* ---- chapitres ingénieur : potabilisation, eau du robinet, épuration ---- */
const svgO = (W, H, fs = 11) => `<svg viewBox="0 0 ${W} ${H}" width="100%" style="font-size:${fs}px">`;
const MK = `<defs><marker id="eauA" viewBox="0 0 10 10" refX="8" refY="5" markerUnits="userSpaceOnUse" markerWidth="10" markerHeight="10" orient="auto"><path d="M0,0 L10,5 L0,10z" fill="#64748b"/></marker></defs>`;
function chaine(el, txt, rows, info, sel) {
  const W = 900, bw = 112, bh = 62, gap = 14, H = 4 + rows.length * 96;
  let s = svgO(W, H, 10.5) + MK;
  rows.forEach((row, r) => {
    const y = 20 + r * 96; if (row.titre) s += `<text x="4" y="${y - 6}" style="fill:#64748b">${row.titre}</text>`;
    row.et.forEach(([k, l, c], i) => {
      const x = 4 + i * (bw + gap), on = k === sel;
      s += `<g data-k="${k}" style="cursor:pointer"><rect x="${x}" y="${y}" width="${bw}" height="${bh}" rx="8" fill="${c}" fill-opacity="${on ? .9 : .14}" stroke="${c}" stroke-width="${on ? 2.5 : 1.2}"/>`;
      const w = l.split(" "), lines = []; let cur = ""; w.forEach(m => { if ((cur + " " + m).trim().length > 15) { lines.push(cur); cur = m; } else cur = (cur + " " + m).trim(); }); lines.push(cur);
      lines.forEach((t, j) => s += `<text x="${x + bw / 2}" y="${y + bh / 2 + 4 - (lines.length - 1) * 6.5 + j * 13}" text-anchor="middle" font-weight="700" style="fill:${on ? "#fff" : c};pointer-events:none">${t}</text>`);
      s += `</g>`;
      if (i < row.et.length - 1) s += `<line x1="${x + bw}" y1="${y + bh / 2}" x2="${x + bw + gap - 1}" y2="${y + bh / 2}" stroke="#64748b" stroke-width="1.8" marker-end="url(#eauA)"/>`;
    });
  });
  el.innerHTML = s + "</svg>";
  txt.innerHTML = info[sel];
  el.querySelectorAll("g[data-k]").forEach(g => g.addEventListener("click", () => chaine(el, txt, rows, info, g.dataset.k)));
}
const FIL = [{ titre: "eau brute (rivière ou nappe) →", et: [["capt", "Captage", "#0ea5e9"], ["degr", "Dégrillage et tamisage", "#64748b"], ["preox", "Préoxydation", "#7c3aed"], ["coag", "Coagulation floculation", "#b45309"], ["dec", "Décantation", "#a16207"], ["sable", "Filtration sur sable", "#ca8a04"], ["ozone", "Ozonation", "#2563eb"]] }, { titre: "→ suite de la filière", et: [["cag", "Charbon actif", "#111827"], ["memb", "Membranes (si besoin)", "#0891b2"], ["desinf", "Désinfection chlore, UV", "#16a34a"], ["equil", "Mise à l'équilibre", "#db2777"], ["res", "Réservoir et réseau", "#1d4ed8"]] }];
const FILI = {
  capt: "<b>Captage</b> : pompage en nappe (forage, puits) ou en rivière. Une nappe profonde et protégée peut aller directement à la désinfection ; une eau de rivière a besoin de toute la filière. Les stations d'alerte surveillent en continu la rivière en amont (truites ou daphnies dont le comportement signale une pollution, analyseurs automatiques) pour fermer la prise d'eau en cas d'accident.",
  degr: "<b>Dégrillage et tamisage</b> : grilles puis tamis de quelques millimètres qui arrêtent les branches, feuilles, poissons, déchets. Purement mécanique.",
  preox: "<b>Préoxydation</b> (chlore, dioxyde de chlore, permanganate ou ozone) : oxyde le fer et le manganèse dissous pour les rendre insolubles, détruit les algues, améliore la coagulation.<br>4 Fe²⁺ + O₂ + 10 H₂O → 4 Fe(OH)₃↓ + 8 H⁺ ; 3 Mn²⁺ + 2 MnO₄⁻ + 2 H₂O → 5 MnO₂↓ + 4 H⁺.<br>On l'évite si l'eau contient beaucoup de matière organique, pour ne pas former de sous-produits chlorés.",
  coag: "<b>Coagulation-floculation</b> : les particules les plus fines (argiles, colloïdes, matière organique) sont chargées négativement et se repoussent : elles ne décantent jamais seules. On injecte un sel de fer ou d'aluminium dont les ions trivalents neutralisent ces charges, puis précipitent en hydroxyde gélatineux qui piège tout (floc) :<br>FeCl₃ + 3 HCO₃⁻ → Fe(OH)₃↓ + 3 CO₂ + 3 Cl⁻ ; Al₂(SO₄)₃ + 6 HCO₃⁻ → 2 Al(OH)₃↓ + 6 CO₂ + 3 SO₄²⁻.<br>La réaction consomme l'alcalinité de l'eau et l'acidifie : on corrige le pH. Un polymère floculant, ajouté ensuite sous agitation lente, rassemble les microflocs en flocons de quelques millimètres. La dose se règle en laboratoire par le « jar-test » (six béchers, six doses).",
  dec: "<b>Décantation</b> : dans de grands bassins, souvent équipés de lamelles inclinées qui multiplient la surface de dépôt, les flocs tombent au fond en 1 à 2 heures. Les boues de décantation (hydroxydes métalliques et argiles) sont épaissies et évacuées. On peut aussi les faire flotter par microbulles (flottation), pour les eaux chargées d'algues.",
  sable: "<b>Filtration sur sable</b> : un lit de sable de 1 m d'épaisseur retient les derniers flocs. Lavé régulièrement à contre-courant (eau et air). Sur certaines usines, une filtration lente sur sable, où se développe un film biologique, élimine aussi l'ammonium et une partie de la matière organique.",
  ozone: "<b>Ozonation</b> : l'ozone O₃, produit sur place par décharge électrique dans de l'oxygène, est l'un des oxydants les plus puissants (E° = 2,07 V). Il détruit virus et parasites, goûts et odeurs, une partie des pesticides, et casse la matière organique en morceaux plus biodégradables. En se décomposant, il forme des radicaux hydroxyles OH•, encore plus réactifs. Revers : il transforme le bromure en bromate (limité à 10 µg/L).",
  cag: "<b>Charbon actif en grains</b> : un charbon de bois ou de houille « activé » à la vapeur, criblé de pores, offre 1 000 m² de surface par gramme. Les molécules organiques (pesticides et leurs métabolites, résidus de médicaments, goûts) s'y fixent par adsorption. Le lit sature en 1 à 3 ans et doit être régénéré (four à 800 °C). Les bactéries qui colonisent le charbon dégradent aussi la matière organique : c'est un filtre biologique.",
  memb: "<b>Membranes</b> : l'ultrafiltration (pores de 0,01 µm) arrête bactéries, parasites et virus ; la nanofiltration et l'osmose inverse arrêtent aussi les ions et les petites molécules (pesticides, PFAS, nitrates). Elles demandent de l'énergie (pression de 5 à 60 bars) et produisent un concentrat à éliminer. L'usine de Méry-sur-Oise (nord de Paris) traite ainsi l'eau de l'Oise par nanofiltration depuis 1999.",
  desinf: "<b>Désinfection</b> : le chlore (ou le dioxyde de chlore) tue les micro-organismes restants et, surtout, laisse un <b>chlore résiduel</b> de 0,1 à 0,3 mg/L qui protège l'eau pendant les heures ou les jours qu'elle passe dans les tuyaux. Les UV (254 nm) cassent l'ADN des micro-organismes sans produit chimique, mais sans effet rémanent : on les combine au chlore. Voir le chapitre 8.1.",
  equil: "<b>Mise à l'équilibre calco-carbonique</b> : une eau agressive (riche en CO₂, peu minéralisée) attaquerait les canalisations et dissoudrait le plomb ou le cuivre ; une eau entartrante boucherait les chauffe-eau. On ajuste avec de la chaux ou de la soude, ou on reminéralise (CO₂ + chaux) une eau trop douce. Certaines régions calcaires décarbonatent au contraire pour adoucir l'eau. Voir le chapitre 9.1.",
  res: "<b>Réservoirs et réseau</b> : les châteaux d'eau assurent la pression (10 m de hauteur d'eau = 1 bar) et une réserve d'une journée environ. Dans le réseau, l'eau vieillit : le chlore se consomme, des biofilms se forment sur les parois, la température monte en été. Des stations de rechloration relancent le résiduel sur les longs réseaux."
};
const STEP = [{ titre: "eaux usées →", et: [["rel", "Relevage", "#64748b"], ["pret", "Dégrillage, dessablage, dégraissage", "#a16207"], ["prim", "Décanteur primaire", "#b45309"], ["bio", "Bassin biologique (boues activées)", "#16a34a"], ["clar", "Clarificateur", "#0891b2"], ["tert", "Traitement tertiaire", "#2563eb"], ["riv", "Rivière ou mer", "#0ea5e9"]] }, { titre: "filière des boues →", et: [["epai", "Épaississement", "#78716c"], ["dig", "Digesteur : biogaz", "#ea580c"], ["desh", "Déshydratation", "#57534e"], ["dev", "Épandage, compost, incinération", "#65a30d"]] }];
const STEPI = {
  rel: "<b>Relevage</b> : les égouts coulent par gravité ; à l'arrivée, des pompes (souvent des vis d'Archimède) remontent l'eau en tête de station. Débit très variable : faible la nuit, pointes le matin et le soir, et jusqu'à dix fois plus par temps de pluie dans un réseau unitaire.",
  pret: "<b>Prétraitements</b> : grilles (lingettes, plastiques : le premier problème d'exploitation), dessableur (le sable use les pompes), dégraisseur où les graisses remontent en surface grâce à une injection d'air. Rien de chimique.",
  prim: "<b>Décantation primaire</b> : 1 à 2 heures de repos ; un tiers de la pollution organique et deux tiers des matières en suspension se déposent : ce sont les boues primaires, riches en énergie, envoyées au digesteur. Certaines stations ajoutent un coagulant (chlorure ferrique) pour aller plus loin.",
  bio: "<b>Bassin biologique à boues activées</b> (procédé inventé à Manchester en 1914) : l'eau est mélangée à une culture concentrée de bactéries (3 à 4 g/L) qu'on aère par de fines bulles au fond du bassin. Les bactéries « respirent » la matière organique : matière organique + O₂ → CO₂ + H₂O + nouvelles bactéries. Une partie de la pollution devient donc de la biomasse, qu'il faudra évacuer sous forme de boues.<br>Azote : nitrification en zone aérée (NH₄⁺ + 2 O₂ → NO₃⁻ + 2 H⁺ + H₂O), puis dénitrification en zone non aérée (le nitrate est réduit en N₂ qui s'échappe dans l'air). Phosphore : précipitation au chlorure ferrique (Fe³⁺ + PO₄³⁻ → FePO₄↓) ou déphosphatation biologique.<br>Le temps de séjour des boues (10 à 20 jours) doit être assez long pour que les bactéries nitrifiantes, qui se multiplient lentement, ne soient pas lessivées.",
  clar: "<b>Clarificateur</b> : grand bassin circulaire où les flocs de bactéries décantent ; l'eau claire déborde en surface. La plus grande partie des boues est renvoyée dans le bassin biologique (recirculation) pour garder la concentration en bactéries ; le surplus (boues en excès) part vers la filière des boues. Sur les stations récentes, des membranes d'ultrafiltration remplacent le clarificateur (bioréacteur à membranes) : l'eau sort sans aucune bactérie.",
  tert: "<b>Traitement tertiaire</b> (selon le milieu récepteur) : filtration, désinfection par UV si l'eau rejoint une zone de baignade ou de conchyliculture, et bientôt traitement des micropolluants (ozonation ou charbon actif) imposé par la directive européenne de 2024 pour les grandes stations. Certaines eaux traitées sont réutilisées pour l'irrigation ou l'arrosage (moins de 1 % en France, contre 8 % en Italie et 14 % en Espagne).",
  riv: "<b>Rejet</b> : l'eau épurée rejoint la rivière, qui termine le travail (autoépuration) si la station est bien dimensionnée pour son débit. En été, quand le débit des rivières est faible, le rejet peut représenter une part importante de l'écoulement : les normes de rejet sont alors plus sévères.",
  epai: "<b>Épaississement</b> : les boues sortent à 99 % d'eau. On les concentre par décantation, flottation ou table d'égouttage jusqu'à 4 à 6 % de matière sèche.",
  dig: "<b>Digestion anaérobie</b> : dans une cuve chauffée à 37 °C, sans oxygène, pendant 20 à 30 jours, d'autres micro-organismes (dont des archées méthanogènes, les mêmes que dans les marais et le rumen des vaches) transforment la moitié de la matière organique en biogaz (60-65 % de méthane, le reste de CO₂). Le biogaz chauffe le digesteur, produit de l'électricité ou, épuré, est injecté dans le réseau de gaz naturel. La station Seine-Aval (Achères), la plus grande d'Europe, en produit pour plusieurs dizaines de milliers de logements.",
  desh: "<b>Déshydratation</b> : centrifugeuses ou filtres-presses, avec un polymère, amènent les boues à 20 à 30 % de matière sèche (une pâte) ; le séchage thermique peut aller jusqu'à 90 %.",
  dev: "<b>Devenir des boues</b> : 1,35 million de tonnes de matière sèche par an en France. La majorité est épandue sur les champs (riches en azote, phosphore et matière organique) ou compostée, sous réserve d'analyses (métaux, micropolluants) ; le reste est incinéré. Le phosphore des boues est une ressource : la Suisse et l'Allemagne imposent désormais sa récupération."
};
function filiere() { const el = $("#eau-filiere"); if (el) chaine(el, $("#eau-filiere-txt"), FIL, FILI, "coag"); }
function stepCh() { const el = $("#eau-step"); if (el) chaine(el, $("#eau-step-txt"), STEP, STEPI, "bio"); }
function hocl() {
  const el = $("#eau-hocl"); if (!el) return;
  const ph = +$("#eau-ph").value, f = p => 1 / (1 + 10 ** (p - 7.5)); $("#eau-ph-v").textContent = fr(ph, 2);
  const W = 440, H = 260, m = { l: 40, r: 12, t: 14, b: 30 }, x = d3.scaleLinear([5, 10], [m.l, W - m.r]), y = d3.scaleLinear([0, 1], [H - m.b, m.t]);
  let s = svgO(W, H, 10);
  [0, .25, .5, .75, 1].forEach(v => s += `<line x1="${m.l}" x2="${W - m.r}" y1="${y(v)}" y2="${y(v)}" stroke="#eef2f7"/><text x="${m.l - 4}" y="${y(v) + 3}" text-anchor="end" style="fill:#64748b">${v * 100} %</text>`);
  [5, 6, 7, 8, 9, 10].forEach(v => s += `<text x="${x(v)}" y="${H - 12}" text-anchor="middle" style="fill:#64748b">pH ${v}</text>`);
  const P = d3.range(5, 10.01, .05);
  s += `<path d="M${x(5)},${y(0)} L${P.map(p => `${x(p).toFixed(1)},${y(f(p)).toFixed(1)}`).join(" L")} L${x(10)},${y(0)} Z" fill="#16a34a" opacity=".25"/><path d="M${x(5)},${y(1)} L${P.map(p => `${x(p).toFixed(1)},${y(f(p)).toFixed(1)}`).join(" L")} L${x(10)},${y(1)} Z" fill="#94a3b8" opacity=".2"/>`;
  s += `<path d="M${P.map(p => `${x(p).toFixed(1)},${y(f(p)).toFixed(1)}`).join(" L")}" fill="none" stroke="#16a34a" stroke-width="2.4"/>`;
  s += `<text x="${x(5.6)}" y="${y(.45)}" style="fill:#15803d" font-weight="700">HOCl : très efficace</text><text x="${x(8.6)}" y="${y(.6)}" style="fill:#475569" font-weight="700">OCl⁻ : peu efficace</text>`;
  s += `<line x1="${x(ph)}" x2="${x(ph)}" y1="${m.t}" y2="${H - m.b}" stroke="#111827" stroke-dasharray="4 3"/><circle cx="${x(ph)}" cy="${y(f(ph))}" r="5" fill="#111827"/><text x="${x(ph) + 6}" y="${y(f(ph)) - 6}" font-weight="700">${fr(f(ph) * 100)} % de HOCl</text>`;
  el.innerHTML = s + "</svg>";
}
function breakpoint() {
  const el = $("#eau-breakpoint"); if (!el) return;
  const N = .5, r = d => d <= 5 * N ? d : d <= 7.6 * N ? 5 * N - (d - 5 * N) * (5 * N - .2) / (2.6 * N) : .2 + (d - 7.6 * N);
  const W = 440, H = 260, m = { l: 40, r: 12, t: 14, b: 30 }, x = d3.scaleLinear([0, 6], [m.l, W - m.r]), y = d3.scaleLinear([0, 3], [H - m.b, m.t]);
  let s = svgO(W, H, 10);
  [0, 1, 2, 3].forEach(v => s += `<line x1="${m.l}" x2="${W - m.r}" y1="${y(v)}" y2="${y(v)}" stroke="#eef2f7"/><text x="${m.l - 4}" y="${y(v) + 3}" text-anchor="end" style="fill:#64748b">${v}</text>`);
  [0, 1, 2, 3, 4, 5, 6].forEach(v => s += `<text x="${x(v)}" y="${H - 12}" text-anchor="middle" style="fill:#64748b">${v} mg/L</text>`);
  s += `<path d="M${d3.range(0, 3.81, .02).map(d => `${x(d).toFixed(1)},${y(r(d)).toFixed(1)}`).join(" L")}" fill="none" stroke="#f59e0b" stroke-width="2.6"/><path d="M${d3.range(3.8, 6.01, .02).map(d => `${x(d).toFixed(1)},${y(r(d)).toFixed(1)}`).join(" L")}" fill="none" stroke="#16a34a" stroke-width="2.6"/>`;
  s += `<text x="${x(.4)}" y="${y(2.2)}" style="fill:#b45309" font-weight="700">chloramines</text><text x="${x(.4)}" y="${y(2.2) + 14}" style="fill:#b45309">(odeur de piscine)</text><circle cx="${x(3.8)}" cy="${y(.2)}" r="5" fill="#dc2626"/><text x="${x(3.8)}" y="${y(.2) - 10}" text-anchor="middle" style="fill:#dc2626" font-weight="700">point critique</text><text x="${x(4.6)}" y="${y(1.8)}" style="fill:#15803d" font-weight="700">chlore libre</text>`;
  s += `<text x="${m.l + 4}" y="${m.t + 4}" style="fill:#64748b">↑ chlore résiduel (mg/L) ; → dose injectée</text>`;
  el.innerHTML = s + "</svg>";
}
const EAUX = [["Robinet, eau douce (granite, Bretagne)", "#60a5fa", { Ca: 15, Mg: 6, Na: 20, HCO3: 40, SO4: 25, NO3: 25, RS: 150 }], ["Robinet, eau calcaire (bassin parisien)", "#2563eb", { Ca: 90, Mg: 6, Na: 10, HCO3: 250, SO4: 30, NO3: 25, RS: 400 }], ["Mont Roucous", "#a5b4fc", { Ca: 1.2, Mg: .2, Na: 3, HCO3: 6, SO4: 3, NO3: 2, RS: 20 }], ["Volvic", "#16a34a", { Ca: 12, Mg: 8, Na: 12, HCO3: 74, SO4: 9, NO3: 7, RS: 130 }], ["Évian", "#0891b2", { Ca: 80, Mg: 26, Na: 6.5, HCO3: 360, SO4: 13, NO3: 3.8, RS: 345 }], ["Contrex", "#c026d3", { Ca: 468, Mg: 75, Na: 9.4, HCO3: 372, SO4: 1121, NO3: 2.9, RS: 2078 }], ["Hépar", "#7c3aed", { Ca: 549, Mg: 119, Na: 14, HCO3: 384, SO4: 1530, NO3: 4.3, RS: 2513 }], ["Saint-Yorre (eau gazeuse)", "#dc2626", { Ca: 90, Mg: 11, Na: 1708, HCO3: 4368, SO4: 174, NO3: 0, RS: 4774 }]];
let EAUk = "Ca";
function mineraux() {
  const el = $("#eau-mineraux"); if (!el) return;
  const lab = { Ca: "calcium", Mg: "magnésium", Na: "sodium", HCO3: "bicarbonates", SO4: "sulfates", NO3: "nitrates (limite 50 mg/L au robinet)", RS: "résidu sec à 180 °C (minéralisation totale)" }[EAUk];
  window.TH.bars(el, EAUX.map(([l, c, d]) => ({ l, v: d[EAUk], t: fr(d[EAUk], d[EAUk] < 10 ? 1 : 0) + " mg/L", c })));
  el.insertAdjacentHTML("afterbegin", `<p class="muted" style="margin:0 0 4px"><b>Teneur en ${lab}</b></p>`);
}
function lsi() {
  const el = $("#eau-lsi"); if (!el) return;
  const ca = +$("#eau-ca").value, tac = +$("#eau-tac").value, ph = +$("#eau-ph2").value;
  $("#eau-ca-v").textContent = `${ca} mg/L CaCO₃ (${fr(ca / 10, 1)} °f)`; $("#eau-tac-v").textContent = `${tac} mg/L CaCO₃ (${fr(tac / 10, 1)} °f)`; $("#eau-ph2-v").textContent = fr(ph, 2);
  const tds = 60 + 1.2 * ca + .4 * tac, L = T => { const A = (Math.log10(tds) - 1) / 10, B = -13.12 * Math.log10(T + 273) + 34.55, C = Math.log10(ca) - .4, D = Math.log10(tac); return ph - ((9.3 + A + B) - (C + D)); };
  const W = 900, H = 260, m = { l: 50, r: 20, t: 16, b: 32 }, x = d3.scaleLinear([5, 85], [m.l, W - m.r]), y = d3.scaleLinear([-3, 3], [H - m.b, m.t]);
  let s = svgO(W, H);
  s += `<rect x="${m.l}" y="${y(3)}" width="${W - m.l - m.r}" height="${y(.5) - y(3)}" fill="#fef3c7"/><rect x="${m.l}" y="${y(-.5)}" width="${W - m.l - m.r}" height="${y(-3) - y(-.5)}" fill="#dbeafe"/>`;
  s += `<text x="${W - m.r - 6}" y="${y(2.6)}" text-anchor="end" style="fill:#b45309" font-weight="700">entartrante : dépôt de calcaire</text><text x="${W - m.r - 6}" y="${y(-2.6)}" text-anchor="end" style="fill:#1d4ed8" font-weight="700">agressive : corrode, dissout plomb et cuivre</text><text x="${W - m.r - 6}" y="${y(0) + 4}" text-anchor="end" style="fill:#16a34a">à l'équilibre</text>`;
  [-3, -2, -1, 0, 1, 2, 3].forEach(v => s += `<line x1="${m.l}" x2="${W - m.r}" y1="${y(v)}" y2="${y(v)}" stroke="${v === 0 ? "#94a3b8" : "#eef2f7"}"/><text x="${m.l - 5}" y="${y(v) + 3}" text-anchor="end" style="fill:#64748b">${v > 0 ? "+" : ""}${v}</text>`);
  [10, 20, 40, 60, 80].forEach(v => s += `<text x="${x(v)}" y="${H - 14}" text-anchor="middle" style="fill:#64748b">${v} °C</text>`);
  s += `<path d="M${d3.range(5, 85.1, .5).map(T => `${x(T).toFixed(1)},${y(Math.max(-3, Math.min(3, L(T)))).toFixed(1)}`).join(" L")}" fill="none" stroke="#111827" stroke-width="2.6"/>`;
  [[12, "eau du réseau"], [60, "chauffe-eau"]].forEach(([T, l]) => s += `<circle cx="${x(T)}" cy="${y(Math.max(-3, Math.min(3, L(T))))}" r="5" fill="#dc2626"/><text x="${x(T)}" y="${y(Math.max(-3, Math.min(3, L(T)))) - 9}" text-anchor="middle" style="fill:#dc2626" font-weight="700">${l} : ${L(T) > 0 ? "+" : ""}${fr(L(T), 2)}</text>`);
  s += `<text x="${m.l + 4}" y="${m.t - 4}" style="fill:#64748b">↑ indice de Langelier selon la température de l'eau</text>`;
  el.innerHTML = s + "</svg>";
  const a = L(12), b = L(60);
  $("#eau-lsi-txt").innerHTML = `À 12 °C, l'eau est <b>${a > .5 ? "entartrante" : a < -.5 ? "agressive" : "proche de l'équilibre"}</b> (LSI ${fr(a, 2)}) ; chauffée à 60 °C, l'indice monte à ${fr(b, 2)} : ${b > .5 ? "le calcaire se dépose dans le chauffe-eau et sur les résistances. C'est pourquoi on conseille de régler le ballon vers 55 °C." : "elle reste peu entartrante même chauffée."}${a < -.5 ? " Une telle eau doit être reminéralisée ou neutralisée pour protéger les canalisations." : ""}`;
}
function stepBilan() {
  const el = $("#eau-step-bilan"); if (!el) return;
  const P = [["DBO₅", 60, 3.8], ["DCO", 135, 15], ["MES", 90, 3.5], ["Azote", 15, 2.2], ["Phosphore", 4, .3]];
  const W = 900, H = 230, m = { l: 90, r: 120, t: 14, b: 26 }, x = d3.scaleLinear([0, 175], [m.l, W - m.r]), bh = (H - m.t - m.b) / P.length;
  let s = svgO(W, H);
  [0, 20, 40, 60, 80, 100, 120, 140].forEach(v => s += `<line x1="${x(v)}" x2="${x(v)}" y1="${m.t}" y2="${H - m.b}" stroke="#eef2f7"/><text x="${x(v)}" y="${H - 8}" text-anchor="middle" style="fill:#64748b">${v} g</text>`);
  P.forEach(([l, a, b], i) => { const y = m.t + i * bh; s += `<text x="${m.l - 8}" y="${y + bh / 2 + 4}" text-anchor="end" font-weight="700">${l}</text><rect x="${m.l}" y="${y + 4}" width="${x(a) - m.l}" height="${bh / 2 - 4}" fill="#a16207" opacity=".8"/><rect x="${m.l}" y="${y + bh / 2}" width="${Math.max(2, x(b) - m.l)}" height="${bh / 2 - 4}" fill="#0ea5e9"/><text x="${x(a) + 6}" y="${y + bh / 2 - 2}" style="fill:#a16207">${fr(a)} g entrée</text><text x="${x(b) + 6}" y="${y + bh - 6}" style="fill:#0284c7">${fr(b, 1)} g sortie</text><text x="${W - m.r + 10}" y="${y + bh / 2 + 4}" style="fill:#16a34a" font-weight="700">−${fr((1 - b / a) * 100)} %</text>`; });
  el.innerHTML = s + "</svg>";
}

function init() {
  if (!window.TH || !window.d3) { setTimeout(init, 100); return; }
  if (!$("#eau-parcours")) return;
  [parcours, services, qualite, fuites, prix, filiere, stepCh, hocl, breakpoint, mineraux, lsi, stepBilan].forEach(f => { try { f(); } catch (e) { console.error(f.name, e); } });
  $("#eau-ph")?.addEventListener("input", hocl); ["eau-ca", "eau-tac", "eau-ph2"].forEach(i => $("#" + i)?.addEventListener("input", lsi));
  document.querySelectorAll(".eau-mi").forEach(b => b.addEventListener("click", () => { document.querySelectorAll(".eau-mi").forEach(x => x.classList.toggle("on", x === b)); EAUk = b.dataset.k; mineraux(); }));
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
