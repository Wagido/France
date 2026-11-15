/* Environnement : biodiversité, forêt, air, pesticides, catastrophes climatiques, fiscalité verte */
(() => {
"use strict";
let E = null;
const $ = s => document.querySelector(s);
async function init() {
  if (!window.TH) { setTimeout(init, 100); return; }
  try { E = await fetch("data/environnement.json").then(r => r.json()); } catch (e) { return; }
  let rt; addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(draw, 150); });
  draw();
}
const f1 = v => v == null ? "–" : v.toLocaleString("fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const n0 = v => v == null ? "–" : Math.round(v).toLocaleString("fr-FR");
const lk = (t, u) => `<a href="${u}" target="_blank" rel="noopener">${t}</a>`;
const FR = rows => rows.find(r => r.code === "FR"), UE = rows => rows.find(r => r.code === "EU27_2020");
const rang = (rows, desc = true) => { const R = rows.filter(r => r.code !== "EU27_2020").sort((a, b) => desc ? b.v - a.v : a.v - b.v); return [R.findIndex(r => r.code === "FR") + 1, R.length]; };

/* barres par pays, France en rouge, moyenne européenne en noir ; valeurs signées : barres de part et d'autre de zéro */
function rows(sel, data, { fmt = f1, unit = "", desc = true, col = "#3b6fd6", bonBas = false } = {}) {
  const el = $(sel); if (!el) return;
  const { esc } = window.TH;
  const R = [...data].sort((a, b) => desc ? b.v - a.v : a.v - b.v);
  const signed = R.some(r => r.v < 0) && R.some(r => r.v > 0), mx = Math.max(...R.map(r => Math.abs(r.v)));
  el.innerHTML = `<div class="pp-rows">` + R.map(r => {
    const me = r.code === "FR", ue = r.code === "EU27_2020", c = me ? "#dc2626" : ue ? "var(--ink)" : col;
    const w = (signed ? 50 : 100) * Math.abs(r.v) / mx;
    const bar = signed
      ? `<span class="cp-track"><span class="cp-bar" style="${r.v >= 0 ? `left:50%` : `right:50%`};width:${w.toFixed(1)}%;background:${c}"></span><i class="cp-zero"></i><span class="cp-val" style="${r.v >= 0 ? `left:calc(50% + ${w.toFixed(1)}% + 4px)` : `right:calc(50% + ${w.toFixed(1)}% + 4px)`}">${r.v > 0 ? "+" : ""}${fmt(r.v)}${unit}</span></span>`
      : `<span class="tr"><span class="b1" style="width:${w.toFixed(1)}%;background:${c}"></span><b>${fmt(r.v)}${unit}</b></span>`;
    return `<div class="pp-row env-row${me ? " me" : ""}${ue ? " ue" : ""}"><span class="lab">${esc(r.nom)}</span>${bar}</div>`;
  }).join("") + `</div>`;
}

function draw() {
  if (!E) return;
  const { kpis, lineChart, legend, css } = window.TH;

  /* 1. biodiversité */
  if ($("#bd-fr")) {
    const O = E.oiseaux, L = O.fr.at(-1), y0 = O.fr[1].annee;
    lineChart($("#bd-fr"), O.fr.slice(1), [{ k: "agricoles", l: "Milieux agricoles", c: "#b45309" }, { k: "batis", l: "Villes et villages", c: "#7c3aed" }, { k: "forestiers", l: "Forêts", c: "#16a34a" },
      { k: "specialistes", l: "Tous les spécialistes", c: css("--ink") }, { k: "generalistes", l: "Espèces généralistes", c: "#94a3b8", dash: "5 4" }], { vfmt: v => n0(v), yfmt: v => v, h: 300, nozero: true });
    legend("#bd-fr-legend", [["Oiseaux des milieux agricoles (alouette, perdrix…)", "#b45309"], ["des villes et villages (moineau, martinet…)", "#7c3aed"], ["des forêts", "#16a34a"], ["Ensemble des spécialistes", css("--ink")], ["Espèces généralistes, qui vivent partout (pigeon ramier, corneille…)", "#94a3b8", true]]);
    rows("#bd-pays", O.pays, { fmt: n0, unit: " %", desc: false, col: "#b45309" });
    rows("#bd-aires", E.aires.terre, { col: "#16a34a", unit: " %" });
    const fp = FR(O.pays), at = FR(E.aires.terre), am = FR(E.aires.mer), [rg, n] = rang(O.pays, false);
    kpis("#biodiversite-kpis", [
      [(L.agricoles - 100) + " %", [`d'oiseaux des champs entre 1989 et ${L.annee}`], "Milieux agricoles"],
      [(L.batis - 100) + " %", [`dans les villes et villages`], "Milieux bâtis"],
      [(L.forestiers - 100) + " %", [`dans les forêts`], "Forêts"],
      [f1(at.v) + " %", [`du territoire terrestre protégé (Natura 2000 et autres)`, `${f1(am.v)} % des eaux marines`], "Aires protégées"],
    ]);
    $("#biodiversite-txt").innerHTML = `<ul>
      <li><b>Les oiseaux des champs ont perdu ${100 - L.agricoles} % de leurs effectifs depuis 1989</b> : alouettes, perdrix, bruants, vanneaux. Ce sont les « sentinelles » de la biodiversité : ils dépendent des insectes, des haies et des prairies. Les espèces généralistes, qui s'adaptent partout, se maintiennent (${L.generalistes - 100 > 0 ? "+" : ""}${L.generalistes - 100} %) : la nature ne disparaît pas, elle s'uniformise.</li>
      <li><b>Les causes sont connues</b> : intensification agricole (pesticides qui tuent les insectes, disparition des haies et des prairies), artificialisation des sols, et changement climatique.</li>
      <li><b>Ailleurs en Europe, même tendance</b> : depuis 2000, les oiseaux des champs ont reculé de ${-fp.v} % en France (${rg}<sup>e</sup> plus forte baisse sur ${n} pays suivis), c'est un phénomène européen lié au modèle agricole.</li>
      <li><b>Les aires protégées</b> couvrent ${f1(at.v)} % du territoire, mais l'essentiel est en Natura 2000, où l'agriculture et la chasse restent largement permises : la protection forte ne concerne qu'une petite part du territoire.</li>
    </ul>
    <p class="muted" style="font-size:.78rem">Oiseaux : suivi temporel des oiseaux communs (STOC) du Muséum national d'histoire naturelle, publié par l'INSEE dans les indicateurs de développement durable (15.i6), France métropolitaine ${y0}-${L.annee}, indice 100 en 1989. Comparaison européenne : indice des oiseaux des milieux agricoles (Eurostat env_bio2, base 2000). Aires protégées : Eurostat (sdg_15_20, sdg_14_10).</p>`;
  }

  /* 2. forêt */
  if ($("#fo-fr")) {
    const F = E.foret, L = F.fr.at(-1), pk = F.fr.reduce((a, b) => b.foret > a.foret ? b : a), y0 = F.fr[0];
    lineChart($("#fo-fr"), F.fr, [{ k: "foret", l: "Forêts", c: "#16a34a" }, { k: "utcatf", l: "Ensemble des terres (forêts, prairies, cultures, sols artificialisés)", c: "#94a3b8", dash: "5 4" }], { vfmt: v => f1(v) + " Mt", yfmt: v => v, h: 280 });
    legend("#fo-fr-legend", [["CO₂ absorbé par les forêts", "#16a34a"], ["Bilan de toutes les terres (forêts moins défrichements, sols, prairies…)", "#94a3b8", true]]);
    rows("#fo-pays", F.pays, { fmt: v => f1(v), unit: " t", col: "#16a34a" });
    const fp = FR(F.pays), [rg, n] = rang(F.pays);
    kpis("#foret-kpis", [
      [f1(L.foret) + " Mt", [`de CO₂ absorbés par la forêt en ${L.annee}`], "Puits de carbone"],
      ["−" + Math.round(100 * (1 - L.foret / pk.foret)) + " %", [`depuis le maximum de ${pk.annee} (${f1(pk.foret)} Mt)`], "Essoufflement"],
      [n0(F.surface_fr / 1000) + " M ha", [`de forêt (${F.annee_surface})`, `environ un tiers du territoire`], "Surface"],
      [f1(fp.v) + " t", [`de CO₂ par hectare et par an`, `${rg}<sup>e</sup> sur ${n} pays`], "Par hectare"],
    ]);
    $("#foret-txt").innerHTML = `<ul>
      <li><b>La forêt française absorbe ${f1(L.foret)} millions de tonnes de CO₂ par an</b>, soit environ un sixième des émissions du pays (voir l'onglet <a href="#climat">Climat</a>). C'est le principal « puits de carbone » sur lequel compte la stratégie climat.</li>
      <li><b>Ce puits s'essouffle</b> : il a baissé de ${Math.round(100 * (1 - L.foret / pk.foret))} % depuis ${pk.annee}. Sécheresses à répétition, épidémies de scolytes sur les épicéas, incendies (2022) : les arbres meurent plus et poussent moins vite. Les inventaires les plus récents de l'IGN et du Citepa révisent régulièrement ce puits à la baisse.</li>
      <li><b>La surface de forêt augmente</b> (déprise agricole en montagne), mais une forêt plus vaste n'absorbe pas plus si elle est en mauvaise santé.</li>
      <li>Rapporté à l'hectare, la forêt française absorbe ${f1(fp.v)} t de CO₂ par an (${rg}<sup>e</sup> sur ${n} pays).</li>
    </ul>
    <p class="muted" style="font-size:.78rem">Inventaire des émissions de gaz à effet de serre transmis à l'ONU (Eurostat env_air_gge, catégorie 4A « terres forestières », valeurs inversées : un chiffre positif est une absorption) ; surface forestière : Eurostat (for_area_efa).</p>`;
  }

  /* 3. air */
  if ($("#air-fr")) {
    const A = E.air, L = A.fr.at(-1), y0 = A.fr[0];
    lineChart($("#air-fr"), A.fr, [{ k: "deces", l: "Décès prématurés", c: "#64748b" }], { vfmt: v => n0(v), yfmt: v => n0(v / 1000) + " k", h: 260 });
    legend("#air-fr-legend", [["Décès prématurés attribués aux particules fines (PM2,5), par an", "#64748b"]]);
    rows("#air-pays", A.pays, { fmt: n0, col: "#64748b", desc: true });
    const fp = FR(A.pays), ue = UE(A.pays), [rg, n] = rang(A.pays, false);
    kpis("#air-kpis", [
      [n0(L.deces), [`décès prématurés dus aux particules fines en ${L.annee}`], "Décès"],
      ["−" + Math.round(100 * (1 - L.deces / y0.deces)) + " %", [`depuis ${y0.annee} (${n0(y0.deces)})`], "Évolution"],
      [n0(fp.v), [`pour 100 000 habitants`, `moyenne européenne : ${n0(ue.v)}`], "Taux"],
      [`${rg}<sup>e</sup>`, [`sur ${n} pays, du moins au plus touché`], "Rang"],
    ]);
    $("#air-txt").innerHTML = `<ul>
      <li><b>La pollution aux particules fines cause environ ${n0(L.deces)} décès prématurés par an en France</b> (${L.annee}), selon l'Agence européenne pour l'environnement : maladies cardiaques, AVC, cancers du poumon. C'est plus que les accidents de la route (environ 3 000 morts par an).</li>
      <li><b>C'est en net recul</b> : ${Math.round(100 * (1 - L.deces / y0.deces))} % de moins qu'en ${y0.annee}, grâce aux filtres à particules, à la baisse du chauffage au fioul et au charbon et aux normes industrielles.</li>
      <li><b>La France fait mieux que la moyenne européenne</b> (${n0(fp.v)} décès pour 100 000 habitants, contre ${n0(ue.v)}) : son électricité vient peu du charbon. Les pays d'Europe centrale et de l'Est, qui se chauffent encore beaucoup au charbon et au bois, sont les plus touchés.</li>
      <li><b>Les sources restantes</b> : chauffage au bois (la première source de particules fines en hiver), trafic routier, agriculture (ammoniac des engrais et des élevages).</li>
    </ul>
    <p class="muted" style="font-size:.78rem">Estimations de l'Agence européenne pour l'environnement publiées par Eurostat (sdg_11_52) : décès prématurés attribuables à l'exposition aux PM2,5. Il s'agit d'estimations par modélisation, pas de décès constatés un par un.</p>`;
  }

  /* 4. pesticides */
  if ($("#pe-fr")) {
    const P = E.pesticides, L = P.fr.at(-1), U = P.ue.at(-1);
    const D = P.fr.map(r => ({ annee: r.annee, fr: r.v, ue: P.ue.find(u => u.annee === r.annee)?.v }));
    lineChart($("#pe-fr"), D, [{ k: "fr", l: "France", c: "#dc2626" }, { k: "ue", l: "Union européenne", c: css("--ink"), dash: "5 4" }], { vfmt: v => n0(v), yfmt: v => v, h: 260 });
    legend("#pe-fr-legend", [["France", "#dc2626"], ["Union européenne", css("--ink"), true]]);
    rows("#pe-bio", P.bio, { col: "#16a34a", unit: " %" });
    rows("#pe-azote", P.azote, { fmt: n0, unit: " kg", col: "#b45309" });
    const bf = FR(P.bio), bu = UE(P.bio), az = FR(P.azote), azu = UE(P.azote), B = P.bio_fr, b0 = B[0];
    kpis("#pesticides-kpis", [
      [n0(L.v), [`indice du risque lié aux pesticides en ${L.annee}`, `100 en 2011-2013 ; Europe : ${n0(U.v)}`], "Pesticides"],
      [f1(bf.v) + " %", [`des terres agricoles en bio (${bf.annee})`, `${f1(b0.v)} % en ${b0.annee}`], "Bio"],
      [n0(az.v) + " kg", [`d'azote en excès par hectare (${az.annee})`, azu ? `Europe : ${n0(azu.v)} kg` : ""], "Engrais"],
    ]);
    $("#pesticides-txt").innerHTML = `<ul>
      <li><b>Le risque lié aux pesticides a baissé de ${100 - L.v} % en France</b> depuis 2011-2013 (${100 - U.v} % en Europe). L'indicateur européen pondère les ventes par la dangerosité des produits : la baisse vient surtout de l'interdiction des substances les plus toxiques, pas d'une baisse aussi forte des tonnages.</li>
      <li><b>Le bio couvre ${f1(bf.v)} % des terres agricoles</b>, contre ${f1(bu?.v)} % en moyenne en Europe. Sa progression a nettement ralenti depuis 2021, avec l'inflation et la baisse des achats.</li>
      <li><b>L'excédent d'azote</b> (engrais et effluents d'élevage non absorbés par les cultures) est de ${n0(az.v)} kg par hectare en moyenne en France, l'un des plus faibles d'Europe (${n0(azu?.v)} kg en moyenne) : les grandes surfaces de céréales et de prairies diluent la moyenne. Mais il est concentré dans les régions d'élevage intensif comme la Bretagne, où les nitrates polluent les nappes et provoquent les algues vertes. Les Pays-Bas, la Belgique et le Danemark font bien pire.</li>
      <li><b>Lien avec la biodiversité</b> : la baisse des insectes, sous l'effet des pesticides et de la disparition des haies, explique une grande partie du déclin des oiseaux des champs (voir <a href="#biodiversite">Biodiversité</a>).</li>
    </ul>
    <p class="muted" style="font-size:.78rem">Eurostat : indicateur de risque harmonisé n° 1 (aei_hri, base 2011-2013), part des surfaces en agriculture biologique (sdg_02_40), bilan brut de l'azote (aei_pr_gnb).</p>`;
  }

  /* 5. catastrophes */
  if ($("#ca-fr")) {
    const C = E.catastrophes, F = C.fr, tot = F.reduce((a, r) => a + r.pertes, 0), y0 = F[0].annee, L = F.at(-1);
    const dec = (a, b) => { const R = F.filter(r => r.annee >= a && r.annee <= b); return R.reduce((s, r) => s + r.pertes, 0) / R.length; };
    const d1 = dec(y0, y0 + 9), d2 = dec(L.annee - 9, L.annee), mx = F.reduce((a, b) => b.pertes > a.pertes ? b : a);
    const el = $("#ca-fr"), { showTip, hideTip } = window.TH;
    const w = Math.max(320, el.clientWidth), h = 280, m = { t: 14, r: 10, b: 26, l: 54 };
    const x = d3.scaleBand(F.map(r => r.annee), [m.l, w - m.r]).padding(.2), yy = d3.scaleLinear([0, mx.pertes * 1.08], [h - m.b, m.t]).nice();
    const svg = d3.create("svg").attr("viewBox", `0 0 ${w} ${h}`);
    svg.append("g").attr("class", "grid").selectAll("line").data(yy.ticks(5)).join("line").attr("x1", m.l).attr("x2", w - m.r).attr("y1", yy).attr("y2", yy);
    svg.append("g").selectAll("rect").data(F).join("rect").attr("x", r => x(r.annee)).attr("width", x.bandwidth()).attr("y", r => yy(r.pertes)).attr("height", r => yy(0) - yy(r.pertes)).attr("fill", "#e07b39").attr("rx", 1.5)
      .on("pointermove", (ev, r) => showTip(`<b>${r.annee}</b><br>${n0(r.pertes)} millions d'euros`, ev)).on("pointerleave", hideTip);
    svg.append("g").attr("class", "axis").attr("transform", `translate(0,${h - m.b})`).call(d3.axisBottom(x).tickValues(x.domain().filter(y => y % 5 === 0)));
    svg.append("g").attr("class", "axis").attr("transform", `translate(${m.l},0)`).call(d3.axisLeft(yy).ticks(5).tickFormat(v => n0(v / 1000) + " Md€")).call(g => g.select(".domain").remove());
    el.replaceChildren(svg.node());
    $("#ca-fr-legend").innerHTML = `<span class="muted">Chaque barre : une année. Le pic de ${mx.annee} correspond aux tempêtes de décembre (${n0(mx.pertes / 1000)} Md€).</span>`;
    rows("#ca-pays", C.pays, { fmt: n0, unit: " €", col: "#e07b39" });
    const fp = FR(C.pays), [rg, n] = rang(C.pays);
    kpis("#catastrophes-kpis", [
      [n0(tot / 1000) + " Md€", [`de pertes depuis ${y0}`, `en euros de 2024`], "Total"],
      [n0(d2 / 1000) + " Md€", [`par an en moyenne, ${L.annee - 9}-${L.annee}`, `contre ${n0(d1 / 1000)} Md€ en ${y0}-${y0 + 9}`], "Aujourd'hui"],
      [n0(fp.v) + " €", [`par habitant et par an (moyenne sur 30 ans)`], "Par habitant"],
      [`${rg}<sup>e</sup>`, [`sur ${n} pays`], "Rang"],
    ]);
    $("#catastrophes-txt").innerHTML = `<ul>
      <li><b>Les catastrophes liées au climat ont coûté ${n0(tot / 1000)} milliards d'euros à la France depuis ${y0}</b> (en euros de 2024) : tempêtes, inondations, sécheresses, canicules, grêle.</li>
      <li><b>Les montants varient beaucoup d'une année à l'autre</b>, mais la moyenne monte : ${n0(d2 / 1000)} Md€ par an sur les dix dernières années, contre ${n0(d1 / 1000)} Md€ dans les années ${y0}. L'année 2022 (sécheresse, grêle, incendies) a été l'une des plus coûteuses.</li>
      <li><b>Un coût encore sous-estimé</b> : les sécheresses fissurent les maisons construites sur des sols argileux, ce qui est devenu le premier poste de dépense du régime des catastrophes naturelles ; les pertes agricoles et les décès dus aux canicules (plusieurs milliers certaines années) ne sont pas tous chiffrés.</li>
      <li><b>Qui paie ?</b> Pour une bonne part les assureurs, donc les assurés par leurs primes (une surprime « catastrophes naturelles » sur chaque contrat habitation et automobile, relevée en 2025), et l'État en dernier ressort.</li>
    </ul>
    <p class="muted" style="font-size:.78rem">Agence européenne pour l'environnement, base CATDAT, publiée par Eurostat (cli_iad_loss) : pertes économiques directes, assurées ou non, en euros constants de 2024.</p>`;
  }

  /* 6. transition */
  if ($("#tr-fr")) {
    const T = E.transition, D = T.fr.map(r => ({ annee: r.annee, fr: r.pib, ue: T.ue.find(u => u.annee === r.annee)?.v }));
    lineChart($("#tr-fr"), D, [{ k: "fr", l: "France", c: "#16a34a" }, { k: "ue", l: "Union européenne", c: css("--ink"), dash: "5 4" }], { vfmt: v => f1(v) + " %", yfmt: v => v + " %", h: 260, nozero: true });
    legend("#tr-fr-legend", [["France", "#16a34a"], ["Union européenne", css("--ink"), true]]);
    rows("#tr-pays", T.pays, { fmt: v => v.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }), unit: " %", col: "#16a34a" });
    rows("#tr-dep", T.depense, { unit: " %", col: "#0ea5e9" });
    const L = T.fr.at(-1), fp = FR(T.pays), ue = UE(T.pays), [rg, n] = rang(T.pays), dp = FR(T.depense), du = UE(T.depense);
    kpis("#transition-kpis", [
      [f1(L.pib) + " %", [`du PIB en taxes environnementales (${L.annee})`, `Europe : ${f1(ue.v)} %`], "Taxes vertes"],
      [f1(L.part) + " %", [`de tous les impôts et cotisations`], "Part"],
      [`${rg}<sup>e</sup>`, [`sur ${n} pays, du plus au moins taxé`], "Rang"],
      [f1(dp.v) + " %", [`du PIB de dépense publique pour l'environnement`, `Europe : ${f1(du.v)} %`], "Dépense"],
    ]);
    $("#transition-txt").innerHTML = `<ul>
      <li><b>Les taxes environnementales rapportent ${f1(L.pib)} % du PIB</b> en France, contre ${f1(ue.v)} % en moyenne en Europe : la France, pays le plus taxé d'Europe dans l'ensemble (voir <a href="#argent-public">Argent public</a>), taxe relativement <b>peu</b> l'environnement. Ces taxes ne font que ${f1(L.part)} % de ses prélèvements.</li>
      <li><b>L'essentiel, ce sont les taxes sur l'énergie</b> (carburants, électricité, gaz). La hausse de la taxe carbone a été gelée en 2018 après le mouvement des Gilets jaunes : son taux est resté bloqué à 44,60 € la tonne de CO₂.</li>
      <li><b>Les aides aux énergies fossiles n'ont pas disparu</b> : taux réduits de taxe sur le gazole non routier, le kérosène des avions, le transport routier… Elles réduisent l'effet des taxes.</li>
      <li><b>Côté dépense</b>, l'État et les collectivités consacrent ${f1(dp.v)} % du PIB à la protection de l'environnement (déchets, eaux usées, nature), contre ${f1(du.v)} % en moyenne en Europe ; s'y ajoutent les aides à la rénovation des logements et aux véhicules électriques, classées ailleurs.</li>
      <li><b>Le vrai débat</b> : qui paie ? Une taxe carbone pèse plus sur les ménages modestes et ruraux, qui dépendent de la voiture et du fioul. C'est pourquoi les économistes proposent d'en reverser le produit aux ménages (« chèque climat »).</li>
    </ul>
    <p class="muted" style="font-size:.78rem">Eurostat : taxes environnementales (env_ac_tax, énergie, transports, pollution et ressources), dépense des administrations publiques pour la protection de l'environnement (gov_10a_exp, fonction 05).</p>`;
  }
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
