/* Révolutions françaises : frise des régimes, électeurs, carte des idées */
(() => {
"use strict";
const $ = s => document.querySelector(s);
const fr = v => v.toLocaleString("fr-FR");
function tip() { let t = document.getElementById("rv-tip"); if (!t) { t = document.createElement("div"); t.id = "rv-tip"; t.style.cssText = "position:fixed;pointer-events:none;background:var(--tip-bg);color:var(--tip-ink);padding:6px 8px;border-radius:6px;font-size:12px;z-index:50;display:none;max-width:300px"; document.body.appendChild(t); } return t; }
const show = (e, h) => { const t = tip(); t.innerHTML = h; t.style.display = "block"; t.style.left = Math.min(e.clientX + 12, innerWidth - 310) + "px"; t.style.top = (e.clientY + 12) + "px"; };
const hide = () => { tip().style.display = "none"; };

const REG = [
  [1770, 1789, "Monarchie absolue", "#a8a29e", "Louis XV puis Louis XVI. Société d'ordres, pas d'assemblée élue."],
  [1789, 1792, "Monarchie constitutionnelle", "#93c5fd", "Assemblée constituante puis législative ; Constitution de 1791 ; suffrage censitaire."],
  [1792, 1804, "Iʳᵉ République", "#ef4444", "Convention (1792-1795, Terreur), Directoire (1795-1799), Consulat de Bonaparte (1799-1804)."],
  [1804, 1814, "Premier Empire", "#7c3aed", "Napoléon Iᵉʳ. Code civil, guerres européennes. Cent-Jours en 1815."],
  [1814, 1830, "Restauration", "#e5e7eb", "Louis XVIII, puis Charles X. Charte de 1814, environ 100 000 électeurs."],
  [1830, 1848, "Monarchie de Juillet", "#bfdbfe", "Louis-Philippe, « roi des Français ». Monarchie libérale et bourgeoise."],
  [1848, 1852, "IIᵉ République", "#f87171", "Suffrage universel masculin, abolition de l'esclavage, journées de Juin, élection de Louis-Napoléon Bonaparte."],
  [1852, 1870, "Second Empire", "#a78bfa", "Napoléon III. Autoritaire puis libéral ; croissance, Haussmann. Chute à Sedan."],
  [1870, 1940, "IIIᵉ République", "#dc2626", "La plus longue : lois constitutionnelles de 1875, école de Ferry, laïcité, deux guerres mondiales."],
  [1940, 1944, "Vichy", "#475569", "État français du maréchal Pétain : régime autoritaire et collaborateur."],
  [1944, 1958, "GPRF et IVᵉ République", "#fb7185", "Libération, vote des femmes, Sécurité sociale ; régime parlementaire instable, guerre d'Algérie."],
  [1958, 2026, "Vᵉ République", "#b91c1c", "Constitution du général de Gaulle ; président élu au suffrage universel direct depuis 1962."]
];
const EVT = [[1789, "14 juillet 1789 : prise de la Bastille"], [1792.6, "10 août 1792 : chute de la monarchie"], [1794.55, "9 thermidor an II : chute de Robespierre"], [1799.85, "18 brumaire : coup d'État de Bonaparte"], [1830.57, "27-29 juillet 1830 : les Trois Glorieuses"], [1848.15, "22-24 février 1848 : chute de Louis-Philippe"], [1848.48, "23-26 juin 1848 : insurrection ouvrière écrasée"], [1851.92, "2 décembre 1851 : coup d'État de Louis-Napoléon"], [1870.68, "4 septembre 1870 : proclamation de la République"], [1871.21, "18 mars - 28 mai 1871 : la Commune de Paris"], [1940.53, "10 juillet 1940 : pleins pouvoirs à Pétain"], [1944.65, "août 1944 : Libération de Paris"], [1958.37, "13 mai 1958 : crise d'Alger, retour de De Gaulle"], [1968.37, "mai 1968 : grève générale et crise"]];

function frise() {
  const el = $("#rv-frise"); if (!el) return;
  const W = 960, H = 200, x = d3.scaleLinear([1770, 2026], [16, W - 16]), y0 = 60;
  const svg = d3.create("svg").attr("viewBox", `0 0 ${W} ${H}`).attr("width", "100%").style("font-size", "10px");
  const small = [];
  REG.forEach(([a, b, l, c, info], k) => {
    svg.append("rect").attr("x", x(a)).attr("y", y0).attr("width", x(b) - x(a)).attr("height", 30).attr("fill", c).attr("stroke", "#fff")
      .on("mousemove", e => show(e, `<b>${l}</b> (${a === 1770 ? "…" : a}-${b === 2026 ? "aujourd'hui" : b})<br>${info}`)).on("mouseleave", hide);
    const w = x(b) - x(a);
    if (w > 120) svg.append("text").attr("x", (x(a) + x(b)) / 2).attr("y", y0 + 19).attr("text-anchor", "middle").style("fill", "#fff").style("font-weight", 600).style("pointer-events", "none").text(l);
    else { small.push([(x(a) + x(b)) / 2, l]); }
  });
  const LV = { "Monarchie absolue": 0, "Monarchie constitutionnelle": 1, "Iʳᵉ République": 2, "Premier Empire": 3, "Restauration": 0, "Monarchie de Juillet": 1, "IIᵉ République": 2, "Second Empire": 0, "Vichy": 1, "GPRF et IVᵉ République": 0 };
  small.forEach(([cx, l], i) => { const lv = LV[l] ?? i % 3, ly = y0 + 44 + lv * 14;
    svg.append("line").attr("x1", cx).attr("x2", cx).attr("y1", y0 + 30).attr("y2", ly - 9).attr("stroke", "var(--faint)").attr("stroke-width", .7);
    svg.append("text").attr("x", cx).attr("y", ly).attr("text-anchor", cx < 60 || l.startsWith("GPRF") ? "start" : "middle").attr("dx", l.startsWith("GPRF") ? -4 : 0).style("fill", "var(--ink)").style("pointer-events", "none").text(l); });
  EVT.forEach(([t, l]) => svg.append("path").attr("d", d3.symbol(d3.symbolTriangle, 70)()).attr("transform", `translate(${x(t)},${y0 - 9}) rotate(180)`).attr("fill", "#dc2626")
    .on("mousemove", e => show(e, l)).on("mouseleave", hide));
  [1789, 1800, 1815, 1830, 1848, 1870, 1900, 1940, 1958, 2000].forEach(v => svg.append("text").attr("x", x(v)).attr("y", H - 6).attr("text-anchor", "middle").style("fill", "var(--muted)").text(v));
  svg.append("text").attr("x", x(1771)).attr("y", 24).style("fill", "var(--muted)").text("▼ révolutions, insurrections, coups d'État");
  el.replaceChildren(svg.node());
}

const ELEC = [["1791", "Monarchie constitutionnelle : « citoyens actifs » (suffrage censitaire léger, à deux degrés)", 4300000, "#93c5fd"], ["1792", "Convention : suffrage universel masculin (peu appliqué)", 7000000, "#ef4444"], ["1817", "Restauration : suffrage censitaire (300 F d'impôt)", 110000, "#9ca3af"], ["1831", "Monarchie de Juillet : cens abaissé à 200 F", 166000, "#60a5fa"], ["1846", "Monarchie de Juillet, avant la révolution", 241000, "#60a5fa"], ["1848", "IIᵉ République : suffrage universel masculin", 9400000, "#f87171"], ["1870", "Plébiscite du Second Empire", 10900000, "#a78bfa"], ["1936", "IIIᵉ République (hommes seulement)", 11800000, "#dc2626"], ["1945", "Vote des femmes", 24600000, "#fb7185"], ["1974", "Majorité à 18 ans", 30600000, "#b91c1c"], ["2022", "Présidentielle", 48700000, "#b91c1c"]];
function elec() {
  const el = $("#rv-elec"); if (!el) return;
  const W = Math.max(520, el.clientWidth || 800), H = 300, m = { l: 60, r: 16, t: 16, b: 30 };
  const x = d3.scaleBand().domain(ELEC.map(d => d[0])).range([m.l, W - m.r]).padding(0.25);
  const y = d3.scaleLog().domain([50000, 60000000]).range([H - m.b, m.t]);
  const svg = d3.create("svg").attr("viewBox", `0 0 ${W} ${H}`).attr("width", "100%").style("font-size", "11px");
  svg.append("g").attr("transform", `translate(0,${H - m.b})`).call(d3.axisBottom(x).tickSizeOuter(0));
  svg.append("g").attr("transform", `translate(${m.l},0)`).call(d3.axisLeft(y).tickValues([1e5, 1e6, 1e7, 5e7]).tickFormat(v => v >= 1e6 ? fr(v / 1e6) + " M" : fr(v / 1e3) + " k"));
  svg.append("g").selectAll("rect").data(ELEC).join("rect").attr("x", d => x(d[0])).attr("width", x.bandwidth()).attr("y", d => y(d[2])).attr("height", d => y(50000) - y(d[2])).attr("fill", d => d[3])
    .on("mousemove", (e, d) => show(e, `<b>${d[0]}</b> : ${d[1]}<br>environ ${fr(d[2])} électeurs`)).on("mouseleave", hide);
  svg.append("g").selectAll("text").data(ELEC).join("text").attr("x", d => x(d[0]) + x.bandwidth() / 2).attr("y", d => y(d[2]) - 4).attr("text-anchor", "middle").style("fill", "var(--ink)").style("font-size", "10px").text(d => d[2] >= 1e6 ? fr(Math.round(d[2] / 1e5) / 10) + " M" : fr(Math.round(d[2] / 1e3)) + " k");
  el.replaceChildren(svg.node());
}

const IDEES = [["Communisme", -0.88, 0.62, "#b91c1c"], ["Anarchisme", -0.8, -0.85, "#111827"], ["Socialisme, social-démocratie", -0.5, -0.2, "#e11d48"], ["Écologie politique", -0.38, -0.42, "#16a34a"], ["Républicanisme", -0.12, 0.18, "#2563eb"], ["Démocratie chrétienne", 0.08, 0.32, "#0891b2"], ["Libéralisme", 0.72, -0.5, "#ca8a04"], ["Conservatisme", 0.45, 0.6, "#1e3a8a"], ["Bonapartisme, gaullisme", -0.18, 0.66, "#7c3aed"], ["Nationalisme", 0.05, 0.86, "#6b21a8"], ["Contre-révolution", 0.3, 0.95, "#57534e"], ["Fascismes", -0.38, 1.0, "#000000"]];
function carte() {
  const el = $("#rv-carte-g"); if (!el) return;
  const W = 760, H = 520, m = 60, x = d3.scaleLinear([-1.15, 1.15], [m, W - m]), y = d3.scaleLinear([-1.15, 1.15], [H - m, m]);
  const svg = d3.create("svg").attr("viewBox", `0 0 ${W} ${H}`).attr("width", "100%").style("font-size", "12px").style("max-width", "760px");
  [["#fee2e2", -1.15, 0, 0, 1.15], ["#e0e7ff", 0, 1.15, 0, 1.15], ["#dcfce7", -1.15, 0, -1.15, 0], ["#fef9c3", 0, 1.15, -1.15, 0]].forEach(([c, a, b, lo, hi]) => svg.append("rect").attr("x", x(a)).attr("width", x(b) - x(a)).attr("y", y(hi)).attr("height", y(lo) - y(hi)).attr("fill", c).attr("opacity", .55));
  svg.append("line").attr("x1", x(-1.15)).attr("x2", x(1.15)).attr("y1", y(0)).attr("y2", y(0)).attr("stroke", "#64748b");
  svg.append("line").attr("y1", y(-1.15)).attr("y2", y(1.15)).attr("x1", x(0)).attr("x2", x(0)).attr("stroke", "#64748b");
  const T = (tx, ty, t, a = "middle") => svg.append("text").attr("x", tx).attr("y", ty).attr("text-anchor", a).style("fill", "#334155").style("font-weight", 700).style("font-size", "11.5px").text(t);
  T(x(-1.12), y(0) - 8, "← L'État dirige l'économie", "start"); T(x(1.12), y(0) - 8, "Le marché décide →", "end");
  T(x(0), y(1.15) - 10, "↑ Autorité, ordre, tradition"); T(x(0), y(-1.15) + 22, "↓ Libertés individuelles, émancipation");
  IDEES.forEach(([l, a, b, c]) => {
    svg.append("circle").attr("cx", x(a)).attr("cy", y(b)).attr("r", 7).attr("fill", c).attr("stroke", "#fff").attr("stroke-width", 1.5);
    svg.append("text").attr("x", x(a) + (a > 0.6 ? -11 : 11)).attr("y", y(b) + 4).attr("text-anchor", a > 0.6 ? "end" : "start").style("fill", "#0f172a").style("font-weight", 600).text(l);
  });
  el.replaceChildren(svg.node());
}

function init() { if (!$("#rv-frise")) return; frise(); elec(); carte(); addEventListener("hashchange", () => { if (location.hash === "#revolutions") setTimeout(elec, 50); }); }
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
