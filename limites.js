/* Les limites à la croissance : scénarios World3 recalculés et données mondiales observées */
(() => {
"use strict";
let L = null;
const $ = s => document.querySelector(s);
const f1 = v => v == null ? "–" : v.toLocaleString("fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const n0 = v => Math.round(v).toLocaleString("fr-FR");
const COL = { bau: "#dc2626", bau2: "#f59e0b", obs: "var(--ink)" };
const COURT = { bau: "Scénario de 1972", bau2: "Ressources doublées" };

async function init() {
  if (!window.TH || !window.d3) { setTimeout(init, 100); return; }
  try { L = await fetch("data/limites.json", { cache: "no-cache" }).then(r => r.json()); } catch (e) { return; }
  $("#li-g") && ($("#li-g").onchange = metaux);
  ["li-rg", "li-rl", "li-rr"].forEach(id => $("#" + id) && $("#" + id).addEventListener("input", recyclage));
  let rt; addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(draw, 150); });
  draw();
}

// fusionne modèle et observations par année, pour lineChart
function merge(ind, raw) {
  const by = {};
  Object.entries(ind.modele).forEach(([k, s]) => s.forEach(r => { (by[r.annee] = by[r.annee] || { annee: r.annee })[k] = raw ? raw(r.v, k) : r.v; }));
  ind.obs.forEach(r => { (by[r.annee] = by[r.annee] || { annee: r.annee }).obs = raw ? raw(r.v, "obs") : r.v; });
  return Object.values(by).sort((a, b) => a.annee - b.annee);
}

// trait vertical « aujourd'hui »
function today(el, y0 = 1960, y1 = 2100) {
  const svg = el.querySelector("svg"); if (!svg) return;
  const [, , w, h] = svg.getAttribute("viewBox").split(" ").map(Number), m = { l: 56, r: 14, t: 12, b: 26 };
  const x = m.l + (2025 - y0) / (y1 - y0) * (w - m.l - m.r);
  d3.select(svg).insert("line", ":first-child").attr("x1", x).attr("x2", x).attr("y1", m.t).attr("y2", h - m.b).attr("stroke", "var(--faint)").attr("stroke-dasharray", "2 3");
  d3.select(svg).append("text").attr("x", x + 4).attr("y", m.t + 10).attr("font-size", 10).attr("fill", "var(--muted)").text("aujourd'hui");
}

function draw() {
  if (!L || !$("#li-grid")) return;
  const { kpis, lineChart, legend, esc } = window.TH;
  const I = Object.fromEntries(L.indicateurs.map(i => [i.k, i])), P = L.pics;
  const lines = [{ k: "bau", l: COURT.bau, c: COL.bau }, { k: "bau2", l: COURT.bau2, c: COL.bau2 }, { k: "obs", l: "Données observées", c: COL.obs }];
  // ensemble : population en milliards (le modèle et la réalité en niveau), production industrielle (modèle seul)
  const pop = I.pop, popObs = Object.fromEntries(pop.obs.map(o => [o.annee, o.v]));
  const pop2000 = pop.dernier.brut / (popObs[pop.dernier.annee] / 100);   // population observée en 2000
  lineChart($("#li-pop"), merge(pop, v => v * pop2000 / 100 / 1e9), lines, { vfmt: v => f1(v) + " Md", yfmt: v => v, h: 240 });
  today($("#li-pop"));
  lineChart($("#li-io"), merge({ modele: I.iopc.modele, obs: [] }), lines.slice(0, 2), { vfmt: v => n0(v), yfmt: v => v, h: 240 });
  today($("#li-io"));
  legend("#li-legend", [[COURT.bau, COL.bau], [COURT.bau2, COL.bau2], ["Données observées (indice, base 100 en 2000)", COL.obs]]);
  // petits graphiques
  const ordre = ["pop", "cbr", "cdr", "le", "fpc", "iopc", "sopc", "nrur", "ppolx"];
  $("#li-grid").innerHTML = ordre.map(k => { const i = I[k], e = i.ecart, best = e.bau2 < e.bau ? "bau2" : "bau";
    return `<div class="in-card"><div class="in-card-h"><b>${esc(i.l.split(" (")[0])}</b></div>
      <div class="in-card-n muted" style="font-size:.78rem">${esc(i.l.includes("(") ? "(" + i.l.split(" (").slice(1).join(" (") : "")}</div>
      <div class="chart" id="li-c-${k}"></div>
      <div class="in-card-bio" style="color:var(--muted)">Écart moyen depuis 2000 : <b style="color:${COL.bau}">${f1(e.bau)} %</b> avec le scénario de 1972, <b style="color:#b45309">${f1(e.bau2)} %</b> avec « ressources doublées » → plus proche : <b>${COURT[best].toLowerCase()}</b></div></div>`; }).join("");
  drawRes(); metaux(); recyclage(); ptef();
  ordre.forEach(k => { lineChart($("#li-c-" + k), merge(I[k]), lines, { vfmt: v => n0(v), yfmt: v => v, h: 170, xticks: 4 }); today($("#li-c-" + k)); });
  legend("#li-legend2", [[COURT.bau, COL.bau], [COURT.bau2, COL.bau2], ["Données observées", COL.obs]]);
  const nb2 = ordre.filter(k => I[k].ecart.bau2 < I[k].ecart.bau).length;
  const moy = s => ordre.reduce((a, k) => a + I[k].ecart[s], 0) / ordre.length;
  kpis("#li-kpis", [
    [`${nb2} sur ${ordre.length}`, ["indicateurs plus proches du scénario", "« ressources doublées » que de celui de 1972"], "Comparaison"],
    [f1(pop.dernier.brut / 1e9) + " Md", [`habitants en ${pop.dernier.annee}`, `modèle : ${f1(P.bau.pop_2025)} (1972), ${f1(P.bau2.pop_2025)} (ressources doublées)`], "Population"],
    [String(P.bau2.iopc), ["pic de la production industrielle par habitant", `dans le scénario « ressources doublées » (${P.bau.iopc} dans celui de 1972)`], "Pic"],
    [f1(P.bau2.pop_max) + " Md", [`population maximale vers ${P.bau2.pop}`, `puis ${f1(P.bau2.pop_2100)} Md en 2100 (ressources doublées)`], "Si rien ne change"],
  ]);
  const io = I.iopc, fpc = I.fpc, cbr = I.cbr, cdr = I.cdr, le = I.le;
  $("#li-txt").innerHTML = `<ul>
    <li><b>Population</b> : la réalité (${f1(pop.dernier.brut / 1e9)} milliards en ${pop.dernier.annee}) suit de près les deux scénarios jusqu'ici (écart moyen ${f1(pop.ecart.bau)} % et ${f1(pop.ecart.bau2)} %). La natalité et la mortalité ont suivi des trajectoires proches des scénarios (écarts de ${f1(Math.min(cbr.ecart.bau, cbr.ecart.bau2))} % et ${f1(Math.min(cdr.ecart.bau, cdr.ecart.bau2))} % avec le plus proche).</li>
    <li><b>Production industrielle et services par habitant</b> : c'est là que le scénario de 1972 se trompe le plus. Il prévoyait un pic de la production industrielle par habitant vers ${P.bau.iopc} puis un recul ; elle a continué d'augmenter (écart moyen de ${f1(io.ecart.bau)} %). Le scénario « ressources doublées », avec un pic vers ${P.bau2.iopc}, colle mieux (${f1(io.ecart.bau2)} %).</li>
    <li><b>Nourriture par habitant</b> : la production alimentaire a augmenté plus vite que dans les deux scénarios (écart ${f1(fpc.ecart.bau2)} % au mieux), grâce aux engrais, à l'irrigation et aux variétés améliorées (voir <a href="#agriculture">Agriculture</a>).</li>
    <li><b>Ressources et pollution</b> : la consommation d'énergies fossiles et le CO₂ accumulé continuent d'augmenter, à peu près comme dans les deux scénarios jusqu'ici (écarts de ${f1(I.nrur.ecart.bau2)} et ${f1(I.ppolx.ecart.bau2)} %). C'est leur suite qui décide de tout : dans le modèle, la pollution et le coût croissant des ressources finissent par faire baisser la production.</li>
    <li><b>Espérance de vie</b> : en indice, la réalité suit les scénarios, mais en niveau le modèle de 1974 est loin du compte (il donne ${f1(P.bau.le_2025)} ans en 2025, contre ${f1(le.dernier.brut)} ans observés) : le modèle n'est pas fait pour prévoir des niveaux précis.</li>
  </ul>`;
  $("#li-concl").innerHTML = `<ul>
    <li><b>Le scénario de 1972 n'a pas eu lieu à la date prévue</b>, mais la trajectoire réelle ressemble à celle d'un scénario voisin, avec plus de ressources. Les études récentes (Herrington, Nebel) disent la même chose : les données ne contredisent pas l'idée d'un dépassement suivi d'un déclin au XXI<sup>e</sup> siècle, elles le décalent de dix à vingt ans.</li>
    <li><b>Dans le scénario « ressources doublées »</b>, la production industrielle par habitant culmine vers ${P.bau2.iopc}, la population vers ${P.bau2.pop} à ${f1(P.bau2.pop_max)} milliards, puis tout décline : l'espérance de vie retombe à ${f1(P.bau2.le_2050)} ans en 2050 dans le modèle. Ce n'est pas une prévision : c'est ce qui arrive dans le modèle si les tendances du passé continuent sans réaction.</li>
    <li><b>Le modèle ignore les prix, les inégalités et les décisions politiques.</b> Il ne voit ni le nucléaire, ni le solaire, ni le recyclage, sauf à les ajouter comme hypothèses. Les scénarios où le monde réagit tôt (technologies plus propres, sobriété, population stabilisée) évitent l'effondrement : c'est le message central des auteurs, souvent oublié.</li>
    <li><b>Le lien avec la monnaie</b> : une économie dont la stabilité dépend de la croissance (voir <a href="#monnaie">Monnaie et croissance</a>) est mal préparée à un ralentissement imposé par les ressources. C'est la question que posait déjà le livre en 1972 : choisir de ralentir, ou subir le ralentissement.</li>
  </ul>`;
}
/* métaux : années de réserves et de ressources, au rythme actuel ou avec une production en hausse */
function metaux() {
  const { esc } = window.TH, M = L.metaux; if (!M || !$("#li-metaux")) return;
  const g = +$("#li-g").value, ans = rp => g ? Math.log(1 + g * rp) / Math.log(1 + g) : rp;
  const big = v => v >= 1e9 ? f1(v / 1e9) + " Md t" : v >= 1e6 ? f1(v / 1e6) + " Mt" : n0(v / 1e3) + " kt";
  const coul = a => a < 25 ? "#dc2626" : a < 50 ? "#f59e0b" : "#16a34a";
  $("#li-metaux").innerHTML = `<div class="table-scroll"><table class="cmp-t rt-cmp"><thead><tr><th>Métal</th><th>Production 2025</th><th>Réserves</th><th>Années de réserves${g ? ` (+${n0(g * 100)} %/an)` : ""}</th><th>Avec les ressources identifiées</th><th>Premier producteur</th><th>Usage principal</th></tr></thead><tbody>` +
    M.map(m => { const a = ans(m.res / m.prod), b = m.ress ? ans(m.ress / m.prod) : null;
      return `<tr><td><b>${esc(m.l)}</b></td><td>${big(m.prod)}</td><td>${big(m.res)}</td><td><b style="color:${coul(a)}">${n0(a)} ans</b></td><td>${b ? n0(b) + " ans" : "–"}</td><td>${esc(m.prod1)}</td><td>${esc(m.usage)}</td></tr>`; }).join("") + `</tbody></table></div>
    <p class="muted" style="font-size:.78rem;margin:4px 0 0">Années = réserves ÷ production ; avec une production en hausse de g % par an, ln(1 + g × réserves ÷ production) ÷ ln(1 + g). Les « ressources identifiées » sont les quantités connues, y compris celles qui ne sont pas rentables aujourd'hui. U.S. Geological Survey, <i>Mineral Commodity Summaries 2026</i>.</p>`;
  const cu = M.find(m => m.l === "Cuivre"), cuA = ans(cu.res / cu.prod), cu0 = cu.res / cu.prod;
  const court = M.filter(m => ans(m.res / m.prod) < 30).map(m => m.l.split(" (")[0].toLowerCase());
  $("#li-met-txt").innerHTML = `<ul>
    <li><b>Oui, le calcul « réserves ÷ production » est optimiste</b>, car il suppose une consommation qui n'augmente plus. Or la production de la plupart des métaux augmente de 2 à 5 % par an depuis des décennies. Avec +${n0(g * 100)} % par an, les ${n0(cu0)} ans de réserves de cuivre deviennent <b>${n0(cuA)} ans</b>. ${court.length ? `Avec ce rythme, ${court.length} métaux ont moins de 30 ans de réserves : ${court.join(", ")}.` : ""}</li>
    <li><b>Mais il est aussi pessimiste</b>, parce que les réserves ne sont pas un stock fixe : ce sont les gisements connus et rentables aujourd'hui. Les « ressources identifiées » sont bien plus grandes (pour le cuivre, ${f1(cu.ress / 1e9)} milliard de tonnes, et l'USGS estime à 3,5 milliards de tonnes le cuivre encore à découvrir), et elles deviennent des réserves quand les prix montent ou que la technique progresse. Depuis 1900, l'humanité a extrait environ 600 millions de tonnes de cuivre ; il en reste beaucoup plus dans le sol.</li>
    <li><b>La vraie limite est ailleurs : l'énergie, la qualité des gisements et la vitesse.</b> Les meilleurs gisements ont été exploités en premier : la teneur moyenne du cuivre extrait a été divisée par plusieurs depuis un siècle (moins de 1 % aujourd'hui). Il faut donc remuer toujours plus de roche, consommer plus d'énergie et d'eau, produire plus de déchets pour chaque tonne. Une mine met en moyenne 15 à 20 ans à ouvrir. Et la production est très concentrée : 74 % du cobalt vient du Congo-Kinshasa, 67 % du nickel d'Indonésie, 69 % des terres rares de Chine, qui raffine aussi l'essentiel du lithium, du graphite et des terres rares du monde.</li>
    <li><b>La transition énergétique fait exploser la demande</b> : selon la Banque mondiale (2020), la production de graphite, de lithium et de cobalt devrait augmenter de près de 500 % d'ici 2050 pour les technologies bas carbone. Le géologue Simon Michaux (Service géologique de Finlande, 2021) va plus loin : remplacer tout le système fossile par l'électricité et les batteries demanderait plus de certains métaux que les réserves connues. Ses calculs sont contestés (ils supposent de tout stocker en batteries, sans recyclage ni changement de technologie), mais ils montrent l'ordre de grandeur du défi.</li>
    <li><b>La grande différence avec le pétrole</b> : un métal ne disparaît pas quand on l'utilise. Le cuivre, l'acier, l'aluminium sont déjà recyclés en grande partie ; plus la quantité de métal en circulation augmente, plus le recyclage peut couvrir une part des besoins. C'est la seule voie pour s'affranchir à terme des mines, mais elle demande du temps et beaucoup d'énergie.</li>
  </ul>`;
}

/* scénario du Shift Project (PTEF) : demande d'énergie finale par secteur */
function ptef() {
  const { esc, legend } = window.TH, P = L.ptef; if (!P || !$("#li-ptef")) return;
  const tot = r => P.secteurs.reduce((a, s) => a + r[s[0]], 0), mx = Math.max(...P.annees.map(tot));
  $("#li-ptef").innerHTML = `<div class="el-stack">` + P.annees.map(r => `<div class="el-row"><span class="lab"><b>${r.annee}</b> · ${n0(tot(r))} Mtep</span><span class="el-segs" style="width:${(100 * tot(r) / mx).toFixed(1)}%">${P.secteurs.map(s =>
    `<span style="flex:${r[s[0]]} 0 0;background:${s[2]};${s[2] === "#cbd5e1" || s[2] === "#f59e0b" ? "color:#1f2937" : ""}" title="${esc(s[1])} : ${f1(r[s[0]])} Mtep">${r[s[0]] >= 6 ? n0(r[s[0]]) : ""}</span>`).join("")}</span></div>`).join("") + `</div>`;
  legend("#li-ptef-legend", P.secteurs.map(s => [s[1], s[2]]));
  const a = P.annees[0], z = P.annees.at(-1), b = k => Math.round(100 * (1 - z[k] / a[k]));
  $("#li-ptef-txt").innerHTML = `<ul>
    <li><b>La consommation d'énergie est divisée par deux</b> entre 2020 et 2050 (de ${n0(tot(a))} à ${n0(tot(z))} Mtep pour les secteurs ci-dessus ; de 170 à environ 85 Mtep en comptant le secteur de l'énergie lui-même). Ce n'est pas une baisse de niveau de vie programmée : une partie vient de l'efficacité (un moteur électrique consomme environ trois fois moins d'énergie qu'un moteur thermique, une pompe à chaleur trois fois moins qu'une chaudière), une partie de la sobriété.</li>
    <li><b>Les transports baissent le plus (−${b("transports")} %)</b> : voitures électriques, mais aussi moins de kilomètres en voiture et en avion, plus de vélo, de train et de covoiturage. Le logement baisse de ${b("residentiel")} % (rénovation, pompes à chaleur), l'industrie de ${b("industrie")} %.</li>
    <li><b>L'électricité devient le cœur du système</b> : sa consommation augmente d'environ 20 %. Même avec de nouveaux réacteurs, le nucléaire et l'hydraulique n'en fourniraient qu'environ 65 % en 2050 ; le reste viendrait des renouvelables, soit par exemple, selon le Shift, environ 10 000 éoliennes terrestres de plus qu'en 2022.</li>
    <li><b>La biomasse est le goulot d'étranglement</b> : environ 20 Mtep disponibles de façon « raisonnable et certaine » (bois, biogaz), à comparer à environ 110 Mtep de pétrole et de gaz consommés aujourd'hui. Même avec tous ces efforts, le plan ne parvient pas à se passer complètement des énergies fossiles : il reste des besoins pour la chimie, l'industrie, l'aviation et l'agriculture.</li>
    <li><b>Le message central</b> : « plus on tarde à lancer les grands travaux d'infrastructures électriques, plus la sobriété sera forte en 2050 ». Si l'électricité bas carbone n'arrive pas à temps, il faudra consommer encore moins, et cette sobriété sera alors subie.</li>
  </ul>
  <p class="muted" style="font-size:.78rem">The Shift Project, <a href="https://theshiftproject.org/publications/note-energie-climat-plan-transformation-economie-francaise/" target="_blank" rel="noopener">L'évaluation énergie-climat du Plan de transformation de l'économie française</a> (2022), tableaux de la demande d'énergie finale en 2020, 2027 et 2050. Énergie finale : celle qu'achètent les consommateurs (carburants, électricité, gaz, chaleur), hors pertes de production.</p>`;
}

/* recyclage : part recyclée (USGS) et calcul de la part maximale couverte par le recyclage */
function recyclage() {
  const { esc } = window.TH, R = L.recyclage; if (!R || !$("#li-recy")) return;
  $("#li-recy").innerHTML = R.map(r => `<div class="in-sbar"><span class="lab">${esc(r.l)}</span><span class="tr"><span style="width:${Math.max(1, r.v)}%;background:${r.v >= 50 ? "#16a34a" : r.v >= 20 ? "#f59e0b" : "#dc2626"}"></span></span><b>${r.v ? n0(r.v) + " %" : "≈ 0"}</b><small class="muted">${esc(r.note)}</small></div>`).join("");
  const g = +$("#li-rg").value / 100, l = +$("#li-rl").value, r = +$("#li-rr").value / 100;
  $("#li-rg-v").textContent = "+" + f1(g * 100) + " %"; $("#li-rl-v").textContent = l + " ans"; $("#li-rr-v").textContent = n0(r * 100) + " %";
  const part = r / (1 + g) ** l;
  $("#li-recy-out").innerHTML = `Le recyclage peut couvrir au plus <b>${n0(100 * part)} %</b> des besoins ; il faut extraire les <b>${n0(100 * (1 - part))} %</b> restants des mines.` +
    (g > 0 ? ` <span class="muted" style="font-size:.85rem">Avec une consommation stable (0 %), ce serait ${n0(100 * r)} %.</span>` : "");
}

/* ressources : production d'énergies fossiles depuis 1900 */
function drawRes() {
  const { areaChart, legend } = window.TH, F = L.fossiles; if (!F || !$("#li-fos")) return;
  const last = F.at(-1), y14 = F.find(r => r.annee === last.annee - 10);
  const tc = k => 100 * ((last[k] / y14[k]) ** (1 / 10) - 1);
  areaChart($("#li-fos"), F.map(r => ({ annee: r.annee, charbon: r.charbon / 1000, petrole: r.petrole / 1000, gaz: r.gaz / 1000 })), ["charbon", "petrole", "gaz"],
    { charbon: "#57534e", petrole: "#1e293b", gaz: "#60a5fa" }, { charbon: "Charbon", petrole: "Pétrole", gaz: "Gaz" }, { vfmt: v => f1(v) + " milliers de TWh", yfmt: v => v, h: 280 });
  legend("#li-fos-legend", [["Charbon", "#57534e"], ["Pétrole", "#1e293b"], ["Gaz", "#60a5fa"]]);
  document.querySelectorAll(".li-y").forEach(e => e.textContent = last.annee);
  const tot = last.charbon + last.petrole + last.gaz, t73 = F.find(r => r.annee === 1973);
  $("#li-res-txt").innerHTML = `<ul>
    <li><b>Aucune énergie fossile n'a encore atteint son pic de production</b> : en ${last.annee}, le monde a produit plus de pétrole, de gaz et de charbon que jamais (${n0(tot / 1000)} milliers de TWh, ${f1(tot / (t73.charbon + t73.petrole + t73.gaz))} fois plus qu'en 1973). Mais la croissance ralentit : sur les dix dernières années, +${f1(tc("petrole"))} % par an pour le pétrole, +${f1(tc("gaz"))} % pour le gaz, +${f1(tc("charbon"))} % pour le charbon.</li>
    <li><b>Le pétrole « facile » a déjà passé son pic</b> : selon l'Agence internationale de l'énergie, la production de pétrole brut conventionnel plafonne depuis 2006. La hausse depuis vient du pétrole de schiste américain (les États-Unis sont devenus le premier producteur mondial), des sables bitumineux du Canada et des liquides de gaz : des pétroles plus chers à extraire, qui demandent plus d'énergie pour produire la même énergie. Et depuis le milieu des années 1980, on consomme chaque année plus de pétrole qu'on n'en découvre.</li>
    <li><b>« 50 ans de réserves » ne veut pas dire « plus rien dans 50 ans »</b> : les réserves prouvées sont ce qu'on sait extraire de façon rentable aujourd'hui. Elles augmentent quand les prix montent ou que la technique progresse. Depuis les années 1980, on a presque toujours « 40 à 50 ans » de pétrole devant soi, et environ 40 ans de cuivre. Le vrai signal n'est pas la date de la fin, mais le coût croissant de chaque nouveau baril ou de chaque tonne de métal : des gisements plus profonds, plus lointains, des minerais moins riches (la teneur du cuivre extrait baisse régulièrement, il faut remuer toujours plus de roche).</li>
    <li><b>Quand le pic ?</b> Pour le pétrole tous types confondus, la plupart des analyses le situent dans les années 2030, par épuisement des gisements ou par baisse de la demande avec les voitures électriques ; l'Agence internationale de l'énergie voit un plateau de la demande vers 2030 si les politiques annoncées sont appliquées. Mais les annonces de pic ont souvent été repoussées. Le gaz devrait culminer plus tard ; le charbon plafonne déjà, suspendu aux choix de la Chine et de l'Inde. Dans le scénario World3 « ressources doublées », la consommation de ressources non renouvelables culmine vers ${L.pic_nrur.bau2} ; vers ${L.pic_nrur.bau} dans celui de 1972.</li>
    <li><b>La limite viendra sans doute du climat avant la géologie</b> : brûler toutes les réserves prouvées d'énergies fossiles émettrait bien plus de CO₂ que ce qui reste à émettre pour limiter le réchauffement à 2 °C. Une étude de référence (McGlade et Ekins, <i>Nature</i>, 2015) estimait qu'il faudrait laisser sous terre environ un tiers du pétrole, la moitié du gaz et plus de 80 % du charbon (voir <a href="#climat">Climat</a>).</li>
    <li><b>Pour les métaux, la contrainte est la vitesse, pas la quantité</b> : la transition énergétique en demande beaucoup plus. Selon l'Agence internationale de l'énergie, une voiture électrique contient environ six fois plus de minerais qu'une voiture thermique, une éolienne terrestre neuf fois plus qu'une centrale à gaz de même puissance. Or ouvrir une mine prend en moyenne plus de quinze ans (voir <a href="#soussol">Sous-sol</a>), et le raffinage de nombreux métaux critiques (lithium, cobalt, terres rares, graphite) est concentré en Chine. Le risque n'est pas l'épuisement, mais des pénuries, des prix qui flambent et une dépendance géopolitique.</li>
  </ul>`;
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
