/* Le tableau périodique : tableau interactif, fiches, remplissage des électrons, tendances */
(function () {
const $ = s => document.querySelector(s);
let T = null, mode = "f", sel = 26, trend = "ie";
const f1 = v => v == null ? "–" : v.toLocaleString("fr-FR", { maximumFractionDigits: 1 });
const f2 = v => v == null ? "–" : v.toLocaleString("fr-FR", { maximumFractionDigits: 2 });
const n0 = v => v == null ? "–" : Math.round(v).toLocaleString("fr-FR");

const FAM = { alcalin: ["Métaux alcalins", "#f87171"], alcalino: ["Métaux alcalino-terreux", "#fb923c"], transition: ["Métaux de transition", "#facc15"],
  pauvre: ["Métaux pauvres", "#a3e635"], metalloide: ["Métalloïdes", "#2dd4bf"], nonmetal: ["Non-métaux", "#60a5fa"], gaznoble: ["Gaz nobles", "#a78bfa"],
  lanthanide: ["Lanthanides", "#f472b6"], actinide: ["Actinides", "#e879f9"], inconnu: ["Propriétés inconnues", "#d1d5db"] };
const BLOC = { s: ["Bloc s (2 colonnes)", "#f87171"], p: ["Bloc p (6 colonnes)", "#60a5fa"], d: ["Bloc d (10 colonnes)", "#facc15"], f: ["Bloc f (14 colonnes)", "#f472b6"] };
const ETAT = { solide: ["Solide", "#cbd5e1"], liquide: ["Liquide", "#60a5fa"], gaz: ["Gaz", "#fde68a"] };
const ORIG = { bigbang: ["Big Bang", "#a78bfa"], cosmique: ["Rayons cosmiques", "#94a3b8"], etoiles: ["Fusion dans les étoiles", "#facc15"], supernova: ["Explosions d'étoiles (supernovae)", "#fb923c"],
  geantes: ["Étoiles géantes en fin de vie", "#a3e635"], collision: ["Collisions d'étoiles à neutrons", "#f472b6"], desint: ["Désintégration de l'uranium et du thorium", "#2dd4bf"], homme: ["Fabriqués par l'homme", "#e5e7eb"] };
const MODES = [
  ["f", "Familles", "cat", FAM, d => d.f],
  ["b", "Bloc (s, p, d, f)", "cat", BLOC, d => d.b],
  ["e", "État à 20 °C", "cat", ETAT, d => d.e],
  ["en", "Électronégativité", "num", null, d => d.en, v => f2(v)],
  ["ie", "Énergie d'ionisation", "num", null, d => d.ie, v => n0(v) + " kJ/mol"],
  ["r", "Rayon de l'atome", "num", null, d => d.r, v => n0(v) + " pm"],
  ["d", "Densité", "num", null, d => d.d, v => f2(v), true],
  ["fus", "Température de fusion", "num", null, d => d.fus, v => n0(v) + " °C"],
  ["o", "Origine dans l'univers", "cat", ORIG, d => d.o],
  ["k", "Critiques pour l'Union européenne", "cat", { true: ["Critique pour l'UE (2023)", "#f97316"], false: ["Non critique", "#e5e7eb"] }, d => String(d.k)],
];

async function init() {
  if (!$("#tp-grid")) return;
  if (!window.TH || !window.d3) { setTimeout(init, 100); return; }
  try { T = (await fetch("data/tableau.json", { cache: "no-cache" }).then(r => r.json())).elements; } catch (e) { return; }
  const { kpis } = window.TH;
  kpis("#tp-kpis", [
    ["118", ["éléments connus", "le dernier, l'oganesson, nommé en 2016"], "Éléments"],
    ["94", ["existent dans la nature", "les autres sont fabriqués en laboratoire"], "Naturels"],
    ["7 × 18", ["7 lignes (périodes) = 7 couches d'électrons", "18 colonnes (groupes) = 18 familles"], "Forme"],
    ["1869", ["Mendeleïev publie son tableau", "avec des cases vides pour les éléments à découvrir"], "Origine"],
  ]);
  $("#tp-modes").innerHTML = MODES.map(m => `<button type="button" class="in-chip" data-m="${m[0]}">${m[1]}</button>`).join("");
  $("#tp-modes").querySelectorAll("button").forEach(b => b.onclick = () => { mode = b.dataset.m; grid(); });
  $("#tp-trend-modes").innerHTML = [["ie", "Énergie d'ionisation"], ["en", "Électronégativité"], ["r", "Rayon de l'atome"]].map(m => `<button type="button" class="in-chip" data-t="${m[0]}">${m[1]}</button>`).join("");
  $("#tp-trend-modes").querySelectorAll("button").forEach(b => b.onclick = () => { trend = b.dataset.t; drawTrend(); });
  $("#tp-z").addEventListener("input", () => { sel = +$("#tp-z").value; fill(); grid(); fiche(); });
  familles();
  // liens vers les modes depuis le texte
  document.querySelectorAll("#tableau [data-tp-mode]").forEach(a => a.onclick = ev => { ev.preventDefault(); mode = a.dataset.tpMode; grid(); $("#tp-p1").scrollIntoView({ behavior: "smooth" }); });
  let rt; addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(() => { drawTrend(); vallee(); liaison(); }, 150); });
  draw();
}

function draw() { grid(); fiche(); fill(); drawTrend(); vallee(); liaison(); }

function color(d) {
  const M = MODES.find(m => m[0] === mode), v = M[4](d);
  if (M[2] === "cat") return (M[3][v] || ["", "#e5e7eb"])[1];
  if (v == null) return "#e5e7eb";
  const vals = T.map(M[4]).filter(x => x != null), lo = d3.min(vals), hi = d3.max(vals);
  const t = M[6] ? Math.log(v / lo) / Math.log(hi / lo) : (v - lo) / (hi - lo);
  return d3.interpolateYlOrRd(0.08 + 0.85 * t);
}

function grid() {
  const M = MODES.find(m => m[0] === mode);
  $("#tp-modes").querySelectorAll("button").forEach(b => b.classList.toggle("on", b.dataset.m === mode));
  const cells = T.map(d => `<button type="button" class="tp-c${d.z === sel ? " sel" : ""}${d.pred ? " pred" : ""}" data-z="${d.z}" style="grid-column:${d.x};grid-row:${d.y};background:${color(d)}" title="${d.n}"><i>${d.z}</i><b>${d.s}</b><span>${d.n}</span></button>`).join("");
  $("#tp-grid").innerHTML = cells + `<div class="tp-mark" style="grid-column:3;grid-row:6">57-71</div><div class="tp-mark" style="grid-column:3;grid-row:7">89-103</div><div class="tp-gap" style="grid-column:1/-1;grid-row:8"></div>`;
  $("#tp-grid").querySelectorAll(".tp-c").forEach(b => b.onclick = () => { sel = +b.dataset.z; $("#tp-z").value = sel; grid(); fiche(); fill(); });
  // légende
  if (M[2] === "cat") {
    const used = new Set(T.map(M[4]));
    $("#tp-legend").innerHTML = Object.entries(M[3]).filter(([k]) => used.has(k)).map(([k, [l, c]]) => `<span class="lg"><i style="background:${c}"></i>${l}</span>`).join("");
  } else {
    const vals = T.map(M[4]).filter(x => x != null), lo = d3.min(vals), hi = d3.max(vals);
    $("#tp-legend").innerHTML = `<span class="lg">${M[5](lo)}</span><span class="tp-ramp"></span><span class="lg">${M[5](hi)}</span><span class="lg"><i style="background:#e5e7eb"></i>inconnu</span>`;
  }
}

/* modèle de Bohr simplifié : une couche par période, électrons en points */
function bohr(d) {
  const c = d.c || [], R = 18 + c.length * 15, w = 2 * R + 10;
  let s = `<svg viewBox="0 0 ${w} ${w}" class="tp-bohr" role="img" aria-label="Couches d'électrons"><circle cx="${w / 2}" cy="${w / 2}" r="10" fill="#dc2626"/><text x="${w / 2}" y="${w / 2 + 3.5}" text-anchor="middle" font-size="9" fill="#fff">${d.z}+</text>`;
  c.forEach((n, i) => {
    const r = 18 + (i + 1) * 15;
    s += `<circle cx="${w / 2}" cy="${w / 2}" r="${r}" fill="none" stroke="currentColor" stroke-opacity=".25"/>`;
    for (let k = 0; k < n; k++) { const a = 2 * Math.PI * k / n - Math.PI / 2; s += `<circle cx="${(w / 2 + r * Math.cos(a)).toFixed(1)}" cy="${(w / 2 + r * Math.sin(a)).toFixed(1)}" r="${n > 20 ? 1.6 : 2.4}" fill="#2563eb"/>`; }
  });
  return s + `</svg>`;
}

function fiche() {
  const d = T.find(x => x.z === sel); if (!d) return;
  const lab = (o, k) => (o[k] || ["–"])[0];
  const row = (l, v) => v == null || v === "–" ? "" : `<div><span>${l}</span><b>${v}</b></div>`;
  $("#tp-fiche").innerHTML = `<div class="tp-f-h" style="background:${FAM[d.f][1]}"><i>${d.z}</i><b>${d.s}</b><span>${d.n}</span><small>${FAM[d.f][0]}</small></div>
    <div class="tp-f-b">${bohr(d)}<p class="muted" style="font-size:.78rem;margin:2px 0 0">Électrons par couche : ${(d.c || []).join(", ")}</p></div>
    <div class="tp-f-t">
      ${row("Numéro atomique (protons)", d.z)}
      ${row("Masse atomique", d.m != null ? f2(d.m) : null)}
      ${row("Ligne (période) / colonne (groupe)", `${d.p} / ${d.g || "–"}`)}
      ${row("Bloc", d.b)}
      ${row("Configuration électronique", d.cs ? d.cs.replace(/(\d)([spdf])(\d+)/g, "$1$2<sup>$3</sup>") : null)}
      ${row("État à 20 °C", d.e ? d.e + (d.pred ? " (prédit)" : "") : null)}
      ${row("Électronégativité (Pauling)", d.en != null ? f2(d.en) : null)}
      ${row("Énergie de première ionisation", d.ie != null ? n0(d.ie) + " kJ/mol" : null)}
      ${row("Rayon de l'atome", d.r != null ? n0(d.r) + " picomètres" : null)}
      ${row("Densité", d.d != null ? f2(d.d) + (d.e === "gaz" ? " g/L" : " g/cm³") : null)}
      ${row("Fusion / ébullition", d.fus != null ? `${n0(d.fus)} °C / ${d.eb != null ? n0(d.eb) + " °C" : "–"}` : null)}
      ${row("Origine", lab(ORIG, d.o))}
      ${d.k ? row("Union européenne", "matière première critique") : ""}
    </div>
    ${d.u ? `<p class="tp-f-u"><b>À quoi ça sert</b> : ${d.u}</p>` : ""}`;
}

/* ordre de remplissage (Klechkowski) */
const ORDRE = ["1s", "2s", "2p", "3s", "3p", "4s", "3d", "4p", "5s", "4d", "5p", "6s", "4f", "5d", "6p", "7s", "5f", "6d", "7p"];
const CAP = { s: 2, p: 6, d: 10, f: 14 };
function fill() {
  const d = T.find(x => x.z === sel); if (!d) return;
  $("#tp-z-v").textContent = `${d.z} : ${d.n} (${d.s})`;
  const occ = {}; (d.conf || "").split(/\s+/).forEach(t => { const m = t.match(/^(\d[spdf])(\d+)$/); if (m) occ[m[1]] = +m[2]; });
  const last = ORDRE.filter(k => occ[k]).at(-1);
  $("#tp-fill").innerHTML = ORDRE.map(k => {
    const t = k[1], n = occ[k] || 0, cap = CAP[t];
    return `<div class="tp-fr${n ? "" : " vide"}${k === last ? " last" : ""}"><b class="tp-sub-${t}">${k}</b><span>${Array.from({ length: cap }, (_, i) => `<i class="${i < n ? "on" : ""}"></i>`).join("")}</span><small>${n}/${cap}</small></div>`;
  }).join("") + `<p class="tp-fill-txt">La dernière sous-couche remplie, <b>${last}</b>, place le ${d.n.toLowerCase()} dans le <b>bloc ${last ? last[1] : ""}</b>, à la <b>ligne ${d.p}</b>. ${(d.c || []).at(-1)} électron${(d.c || []).at(-1) > 1 ? "s" : ""} sur la couche externe.</p>`;
}

function familles() {
  const F = [
    ["alcalin", "Colonne 1 : 1 électron de valence, qu'ils perdent très facilement. Mous, très réactifs : le sodium explose au contact de l'eau. On ne les trouve jamais purs dans la nature."],
    ["alcalino", "Colonne 2 : 2 électrons de valence. Moins violents. Le calcium des os, le magnésium de la chlorophylle."],
    ["transition", "Le bloc d, au centre : les métaux « classiques », durs, conducteurs, souvent colorés dans leurs composés : fer, cuivre, nickel, or, platine. Leurs électrons d leur permettent plusieurs états de charge, d'où leur rôle de catalyseurs."],
    ["pauvre", "Métaux plus mous, à bas point de fusion : aluminium, étain, plomb, bismuth."],
    ["metalloide", "Entre métaux et non-métaux : bore, silicium, germanium, arsenic, antimoine, tellure. Semi-conducteurs, la base de l'électronique."],
    ["nonmetal", "En haut à droite : carbone, azote, oxygène, phosphore, soufre, et les halogènes de la colonne 17 (fluor, chlore, brome, iode), à qui il manque un électron et qui forment des sels avec les métaux (« halogène » veut dire « qui fait du sel »)."],
    ["gaznoble", "Colonne 18 : couche externe pleine, donc presque aucune réaction chimique. Hélium, néon, argon, krypton, xénon, radon."],
    ["lanthanide", "La ligne du bas (57 à 71) : la sous-couche 4f se remplit à l'intérieur de l'atome, sans changer la couche externe. D'où leur grande ressemblance chimique, et la difficulté à les séparer : ce sont les terres rares."],
    ["actinide", "Seconde ligne du bas (89 à 103) : sous-couche 5f. Tous radioactifs : thorium, uranium, plutonium."],
  ];
  $("#tp-fam").innerHTML = F.map(([k, t]) => `<div style="border-left:5px solid ${FAM[k][1]}"><b>${FAM[k][0]}</b><span>${t}</span></div>`).join("");
}

function drawTrend() {
  const el = $("#tp-trend"); if (!el || !T || !el.clientWidth) return;
  const { showTip, hideTip, css } = window.TH;
  $("#tp-trend-modes").querySelectorAll("button").forEach(b => b.classList.toggle("on", b.dataset.t === trend));
  const L = { ie: ["Énergie de première ionisation (kJ/mol)", v => n0(v) + " kJ/mol"], en: ["Électronégativité (Pauling)", v => f2(v)], r: ["Rayon de l'atome (picomètres)", v => n0(v) + " pm"] }[trend];
  const D = T.filter(d => d[trend] != null && d.z <= 100);
  const w = Math.max(320, el.clientWidth), h = 300, m = { t: 22, r: 12, b: 30, l: 46 };
  const x = d3.scaleLinear([1, 100], [m.l, w - m.r]), y = d3.scaleLinear([0, d3.max(D, d => d[trend]) * 1.08], [h - m.b, m.t]);
  const svg = d3.create("svg").attr("viewBox", `0 0 ${w} ${h}`);
  // bandes des périodes
  [[1, 2], [3, 10], [11, 18], [19, 36], [37, 54], [55, 86], [87, 100]].forEach(([a, b], i) => {
    svg.append("rect").attr("x", x(a - .5)).attr("width", x(b + .5) - x(a - .5)).attr("y", m.t).attr("height", h - m.t - m.b).attr("fill", i % 2 ? css("--soft") : "transparent");
    svg.append("text").attr("x", (x(a) + x(b)) / 2).attr("y", m.t - 6).attr("text-anchor", "middle").attr("font-size", 9.5).attr("fill", css("--muted")).text(`ligne ${i + 1}`);
  });
  svg.append("g").attr("class", "grid").selectAll("line").data(y.ticks(5)).join("line").attr("x1", m.l).attr("x2", w - m.r).attr("y1", y).attr("y2", y);
  svg.append("path").attr("fill", "none").attr("stroke", "#2563eb").attr("stroke-width", 1.6).attr("d", d3.line().x(d => x(d.z)).y(d => y(d[trend]))(D));
  svg.append("g").selectAll("circle").data(D).join("circle").attr("cx", d => x(d.z)).attr("cy", d => y(d[trend])).attr("r", d => d.f === "gaznoble" || d.f === "alcalin" ? 3.5 : 1.8)
    .attr("fill", d => d.f === "gaznoble" ? FAM.gaznoble[1] : d.f === "alcalin" ? FAM.alcalin[1] : "#2563eb");
  const lab = D.filter(d => (d.f === "gaznoble" || d.f === "alcalin" || d.s === "F") && (w > 560 || d.z < 40));
  svg.append("g").selectAll("text").data(lab).join("text").attr("x", d => x(d.z)).attr("y", d => y(d[trend]) - 6).attr("text-anchor", "middle").attr("font-size", 10).attr("font-weight", 600).attr("fill", css("--ink")).text(d => d.s);
  svg.append("g").attr("class", "axis").attr("transform", `translate(0,${h - m.b})`).call(d3.axisBottom(x).ticks(w < 560 ? 5 : 10).tickFormat(d3.format("d")));
  svg.append("text").attr("x", w - m.r).attr("y", h - 2).attr("text-anchor", "end").attr("font-size", 10).attr("fill", css("--muted")).text("numéro atomique");
  svg.append("g").attr("class", "axis").attr("transform", `translate(${m.l},0)`).call(d3.axisLeft(y).ticks(5)).call(s => s.select(".domain").remove());
  const bis = d3.bisector(d => d.z).center;
  svg.append("rect").attr("x", m.l).attr("y", m.t).attr("width", w - m.l - m.r).attr("height", h - m.t - m.b).attr("fill", "transparent")
    .on("pointermove", ev => { const d = D[bis(D, x.invert(d3.pointer(ev)[0]))]; if (d) showTip(`<b>${d.z}. ${d.n} (${d.s})</b><br>${L[0]} : ${L[1](d[trend])}`, ev); }).on("pointerleave", hideTip)
    .on("click", ev => { const d = D[bis(D, x.invert(d3.pointer(ev)[0]))]; if (d) { sel = d.z; $("#tp-z").value = sel; grid(); fiche(); fill(); } });
  el.replaceChildren(svg.node());
  const TX = {
    ie: `<ul><li><b>Les pics sont les gaz nobles</b> (He, Ne, Ar, Kr, Xe, Rn) : leur couche est pleine, très stable, il faut beaucoup d'énergie pour leur arracher un électron. L'hélium détient le record (2 372 kJ/mol).</li><li><b>Les creux sont les alcalins</b> (Li, Na, K, Rb, Cs) : leur électron solitaire, seul sur une nouvelle couche, part facilement. C'est pour cela qu'ils réagissent si violemment.</li><li><b>Le motif se répète à chaque ligne</b> : c'est la périodicité. Au milieu des lignes longues, les métaux de transition forment un plateau, car les électrons ajoutés vont dans une sous-couche intérieure.</li></ul>`,
    en: `<ul><li><b>Le pic est le fluor</b> (3,98), suivi de l'oxygène et du chlore : ils attirent fortement les électrons. C'est pourquoi l'oxygène « vole » les électrons des autres atomes (oxydation, combustion, rouille).</li><li><b>Les creux sont les alcalins</b>, qui cèdent leurs électrons. Les gaz nobles n'ont souvent pas de valeur, car ils ne forment presque pas de liaisons.</li><li><b>L'écart d'électronégativité entre deux atomes</b> dit quel type de liaison ils forment : grand écart (sodium et chlore), liaison ionique ; petit écart (carbone et hydrogène), liaison covalente.</li></ul>`,
    r: `<ul><li><b>Les pics sont les alcalins</b> : une nouvelle couche commence, avec un seul électron loin du noyau. Le césium est l'un des plus gros atomes.</li><li><b>Le long d'une ligne, l'atome rétrécit</b> : on ajoute des protons qui attirent plus fort des électrons placés sur la même couche.</li><li><b>Les lanthanides rétrécissent aussi</b> (« contraction des lanthanides ») : c'est pour cela que l'hafnium et le zirconium, l'or et l'argent, ont presque la même taille.</li></ul>`,
  };
  $("#tp-trend-txt").innerHTML = TX[trend];
}

/* vallée de la stabilité : neutrons de l'isotope le plus courant (ou le plus durable) selon le nombre de protons */
function vallee() {
  const el = $("#tp-vallee"); if (!el || !el.clientWidth) return;
  const { showTip, hideTip, css, legend } = window.TH;
  const D = T.filter(d => d.m).map(d => ({ ...d, N: Math.round(d.m) - d.z, st: d.z <= 83 && d.z !== 43 && d.z !== 61 }));
  const w = Math.max(320, el.clientWidth), h = Math.min(420, Math.max(300, w * .6)), m = { t: 14, r: 14, b: 34, l: 46 };
  const x = d3.scaleLinear([0, 120], [m.l, w - m.r]), y = d3.scaleLinear([0, 190], [h - m.b, m.t]);
  const svg = d3.create("svg").attr("viewBox", `0 0 ${w} ${h}`);
  svg.append("g").attr("class", "grid").selectAll("line").data(y.ticks(6)).join("line").attr("x1", m.l).attr("x2", w - m.r).attr("y1", y).attr("y2", y);
  svg.append("line").attr("x1", x(0)).attr("y1", y(0)).attr("x2", x(120)).attr("y2", y(120)).attr("stroke", css("--muted")).attr("stroke-dasharray", "4 3");
  svg.append("text").attr("x", x(105)).attr("y", y(108)).attr("font-size", 10).attr("fill", css("--muted")).attr("text-anchor", "end").text("autant de neutrons que de protons");
  // îlot de stabilité
  svg.append("ellipse").attr("cx", x(114)).attr("cy", y(184)).attr("rx", Math.abs(x(6) - x(0))).attr("ry", Math.abs(y(0) - y(8))).attr("fill", "#a78bfa").attr("opacity", .25).attr("stroke", "#7c3aed").attr("stroke-dasharray", "3 2");
  svg.append("text").attr("x", x(114) - 6).attr("y", y(184) + 3).attr("font-size", 10).attr("text-anchor", "end").attr("fill", "#7c3aed").text("îlot de stabilité ?");
  svg.append("text").attr("x", x(25)).attr("y", y(60)).attr("font-size", 10.5).attr("fill", "#2563eb").text("trop de neutrons → bêta moins");
  svg.append("text").attr("x", x(60)).attr("y", y(40)).attr("font-size", 10.5).attr("fill", "#dc2626").text("trop de protons → bêta plus");
  svg.append("g").selectAll("circle").data(D).join("circle").attr("cx", d => x(d.z)).attr("cy", d => y(d.N)).attr("r", 3.2)
    .attr("fill", d => d.st ? "#16a34a" : d.z <= 94 ? "#f59e0b" : "#94a3b8");
  D.filter(d => [6, 8, 26, 50, 82, 92, 118].includes(d.z)).forEach(d => svg.append("text").attr("x", x(d.z) - 5).attr("y", y(d.N) - 6).attr("font-size", 10).attr("font-weight", 600).attr("text-anchor", "end").attr("fill", css("--ink")).text(`${d.s} ${d.z + d.N}`));
  svg.append("g").attr("class", "axis").attr("transform", `translate(0,${h - m.b})`).call(d3.axisBottom(x).ticks(6));
  svg.append("text").attr("x", w - m.r).attr("y", h - 2).attr("text-anchor", "end").attr("font-size", 10).attr("fill", css("--muted")).text("protons (Z)");
  svg.append("g").attr("class", "axis").attr("transform", `translate(${m.l},0)`).call(d3.axisLeft(y).ticks(6)).call(s => s.select(".domain").remove());
  svg.append("text").attr("x", m.l + 4).attr("y", m.t + 4).attr("font-size", 10).attr("fill", css("--muted")).text("neutrons (N)");
  const bis = d3.bisector(d => d.z).center;
  svg.append("rect").attr("x", m.l).attr("y", m.t).attr("width", w - m.l - m.r).attr("height", h - m.t - m.b).attr("fill", "transparent")
    .on("pointermove", ev => { const d = D[bis(D, x.invert(d3.pointer(ev)[0]))]; if (d) showTip(`<b>${d.n} ${d.z + d.N}</b><br>${d.z} protons, ${d.N} neutrons<br>${d.st ? "stable" : "radioactif"}`, ev); }).on("pointerleave", hideTip);
  el.replaceChildren(svg.node());
  legend("#tp-vallee-legend", [["Éléments ayant des isotopes stables", "#16a34a"], ["Radioactifs, présents dans la nature ou en réacteur", "#f59e0b"], ["Radioactifs, fabriqués en laboratoire", "#94a3b8"]]);
}

/* énergie de liaison par nucléon : formule de Bethe-Weizsäcker le long de la vallée, et valeurs mesurées */
function liaison() {
  const el = $("#tp-liaison"); if (!el || !el.clientWidth) return;
  const { showTip, hideTip, css } = window.TH;
  const B = A => { const Z = A / (2 + 0.0155 * Math.pow(A, 2 / 3)); return (15.75 * A - 17.8 * Math.pow(A, 2 / 3) - 0.711 * Z * (Z - 1) / Math.pow(A, 1 / 3) - 23.7 * Math.pow(A - 2 * Z, 2) / A) / A; };
  const C = d3.range(12, 261, 2).map(A => ({ A, b: B(A) }));
  const P = [["H 2", 2, 1.112], ["He 4", 4, 7.074], ["Li 6", 6, 5.332], ["Be 9", 9, 6.463], ["C 12", 12, 7.680], ["O 16", 16, 7.976], ["Fe 56", 56, 8.790], ["Ni 62", 62, 8.795], ["Sn 120", 120, 8.505], ["Au 197", 197, 7.916], ["Pb 208", 208, 7.868], ["U 235", 235, 7.591], ["U 238", 238, 7.570]];
  const w = Math.max(320, el.clientWidth), h = 300, m = { t: 14, r: 14, b: 34, l: 46 };
  const x = d3.scaleLinear([0, 260], [m.l, w - m.r]), y = d3.scaleLinear([0, 9.5], [h - m.b, m.t]);
  const svg = d3.create("svg").attr("viewBox", `0 0 ${w} ${h}`);
  svg.append("rect").attr("x", x(0)).attr("width", x(58) - x(0)).attr("y", m.t).attr("height", h - m.t - m.b).attr("fill", "#16a34a").attr("opacity", .07);
  svg.append("rect").attr("x", x(58)).attr("width", x(260) - x(58)).attr("y", m.t).attr("height", h - m.t - m.b).attr("fill", "#f59e0b").attr("opacity", .07);
  svg.append("text").attr("x", x(29)).attr("y", y(1.2)).attr("text-anchor", "middle").attr("font-size", 10.5).attr("fill", "#16a34a").text("fusion → énergie");
  svg.append("text").attr("x", x(160)).attr("y", y(1.2)).attr("text-anchor", "middle").attr("font-size", 10.5).attr("fill", "#b45309").text("← fission → énergie");
  svg.append("g").attr("class", "grid").selectAll("line").data(y.ticks(5)).join("line").attr("x1", m.l).attr("x2", w - m.r).attr("y1", y).attr("y2", y);
  svg.append("path").attr("fill", "none").attr("stroke", "#2563eb").attr("stroke-width", 1.8).attr("d", d3.line().x(d => x(d.A)).y(d => y(d.b))(C));
  svg.append("g").selectAll("circle").data(P).join("circle").attr("cx", d => x(d[1])).attr("cy", d => y(d[2])).attr("r", 3.5).attr("fill", "#dc2626");
  svg.append("g").selectAll("text").data(P.filter(d => w > 560 || ["H 2", "He 4", "Fe 56", "U 238"].includes(d[0]))).join("text").attr("x", d => x(d[1]) + 5).attr("y", d => y(d[2]) + (d[0] === "Ni 62" || d[0] === "U 238" ? 12 : -5)).attr("font-size", 10).attr("fill", css("--ink")).text(d => d[0]);
  svg.append("g").attr("class", "axis").attr("transform", `translate(0,${h - m.b})`).call(d3.axisBottom(x).ticks(w < 560 ? 5 : 10));
  svg.append("text").attr("x", w - m.r).attr("y", h - 2).attr("text-anchor", "end").attr("font-size", 10).attr("fill", css("--muted")).text("nombre de protons + neutrons");
  svg.append("g").attr("class", "axis").attr("transform", `translate(${m.l},0)`).call(d3.axisLeft(y).ticks(5)).call(s => s.select(".domain").remove());
  svg.append("text").attr("x", m.l + 4).attr("y", m.t + 4).attr("font-size", 10).attr("fill", css("--muted")).text("énergie de liaison par particule (MeV)");
  svg.append("g").selectAll("rect").data(P).join("rect").attr("x", d => x(d[1]) - 6).attr("y", d => y(d[2]) - 6).attr("width", 12).attr("height", 12).attr("fill", "transparent")
    .on("pointermove", (ev, d) => showTip(`<b>${d[0]}</b><br>${d[2].toLocaleString("fr-FR")} MeV par particule (mesuré)`, ev)).on("pointerleave", hideTip);
  el.replaceChildren(svg.node());
}

init();
})();
