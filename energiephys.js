/* L'énergie expliquée par la physique : convertisseur, ordres de grandeur, esclaves énergétiques, rendements, bilan France (SDES) */
(() => {
"use strict";
const $ = s => document.querySelector(s);
const fr = (v, d = 0) => v.toLocaleString("fr-FR", { minimumFractionDigits: d, maximumFractionDigits: d });
const sig = v => { const a = Math.abs(v); if (a === 0) return "0"; if (a >= 1e6 || a < 1e-3) return v.toExponential(2).replace(".", ",").replace("e+", " × 10^").replace("e-", " × 10^-"); return fr(v, a < 1 ? 4 : a < 100 ? 2 : 0); };
const U = [["J", "joule", 1], ["kJ", "kilojoule", 1e3], ["MJ", "mégajoule", 1e6], ["Wh", "wattheure", 3600], ["kWh", "kilowattheure", 3.6e6], ["MWh", "mégawattheure", 3.6e9], ["TWh", "térawattheure", 3.6e15], ["cal", "calorie", 4.184], ["kcal", "kilocalorie (« Calorie » alimentaire)", 4184], ["tep", "tonne équivalent pétrole", 4.1868e10], ["baril", "baril de pétrole (≈)", 6.1e9], ["L essence", "litre d'essence (≈)", 3.2e7], ["jour de travail", "jour de travail humain (0,5 kWh)", 1.8e6]];
function conv() {
  const v = +$("#ep-val").value || 0, u = U.find(x => x[0] === $("#ep-unit").value), J = v * u[2];
  $("#ep-conv").innerHTML = `<div class="table-scroll"><table class="cmp-t ro-t"><tbody>${U.map(([k, l, f]) => `<tr${k === u[0] ? ' style="background:#eff6ff"' : ""}><td><b>${sig(J / f)}</b></td><td>${l} (${k})</td></tr>`).join("")}</tbody></table></div>`;
}
const logBars = (el, rows, unit, lo, hi, ticks) => { const p = v => Math.max(1, (Math.log10(v) - lo) / (hi - lo) * 100); el.innerHTML = `<div class="bars">${rows.map(([l, v, c]) => `<div class="bar-row"><span class="lab">${l}</span><span class="val">${sig(v)} ${unit}</span><span class="track"><span class="fill" style="width:${p(v).toFixed(1)}%;background:${c}"></span></span></div>`).join("")}</div><div style="position:relative;height:16px;font-size:.72rem;color:#64748b">${ticks.map(([v, t]) => `<span style="position:absolute;left:${p(v)}%;transform:translateX(-50%)">${t}</span>`).join("")}</div>`; };
function ordres() {
  logBars($("#ep-energies"), [["Soulever une pomme d'un mètre", 1 / 3.6e6, "#94a3b8"], ["Charger un smartphone", 0.015, "#a855f7"], ["Une journée de travail physique humain", 0.5, "#be185d"], ["Ration alimentaire d'une journée (2 500 kcal)", 2.9, "#f59e0b"], ["Une douche chaude (50 L chauffés de 30 °C)", 1.75, "#0ea5e9"], ["Un litre d'essence", 8.9, "#dc2626"], ["Énergie primaire d'un Français par jour", 98, "#2563eb"], ["Un baril de pétrole", 1700, "#111827"], ["Énergie primaire d'un Français par an", 36000, "#1d4ed8"]], "kWh", -7, 5, [[1e-6, "10⁻⁶"], [1e-3, "0,001"], [1, "1"], [1e3, "1 000"], [1e5, "100 000"]]);
  logBars($("#ep-puissances"), [["Cerveau humain", 20, "#be185d"], ["Corps humain au repos", 80, "#f472b6"], ["Cycliste amateur (une heure)", 150, "#e11d48"], ["Cheval-vapeur", 735, "#a16207"], ["Bouilloire", 2000, "#64748b"], ["Voiture (moteur de 100 kW)", 1e5, "#dc2626"], ["Éolienne terrestre récente", 3e6, "#14b8a6"], ["TGV", 9e6, "#7c3aed"], ["Réacteur nucléaire (électrique)", 1.3e9, "#f59e0b"], ["Consommation électrique française moyenne", 5e10, "#2563eb"]], "W", 0.5, 11, [[10, "10 W"], [1e3, "1 kW"], [1e6, "1 MW"], [1e9, "1 GW"], [1e11, "100 GW"]]);
}
const HAB = [["Canada", 85], ["États-Unis", 74], ["France", 36], ["Japon", 35], ["Union européenne", 32], ["Monde", 22], ["Brésil", 17], ["Mexique", 17], ["Inde", 9], ["Afrique", 6]];
function esclaves() {
  const pw = +$("#ep-pw").value, h = +$("#ep-h").value, j = +$("#ep-j").value, pays = $("#ep-pays").value;
  $("#ep-pw-v").textContent = pw + " W"; $("#ep-h-v").textContent = h + " h"; $("#ep-j-v").textContent = j + " jours";
  const kwhHomme = pw * h * j / 1000, n = c => c * 1000 / kwhHomme;
  window.TH.bars($("#ep-esclaves"), HAB.map(([p, c]) => ({ l: p, v: n(c), t: fr(n(c)) + " « esclaves »", c: p === pays ? "#dc2626" : "#94a3b8" })));
  const c = HAB.find(x => x[0] === pays)[1];
  $("#ep-esclaves-txt").innerHTML = `<p>Un humain qui fournit ${pw} W pendant ${h} heures, ${j} jours par an, produit <b>${fr(kwhHomme)} kWh</b> de travail mécanique par an. Un habitant de ${pays === "Monde" ? "la Terre en moyenne" : pays === "Afrique" ? "l'Afrique" : pays} consomme ${fr(c)} MWh d'énergie primaire par an, soit l'équivalent de <b>${fr(n(c))} « esclaves énergétiques »</b> travaillant pour lui en permanence.</p><p class="muted" style="font-size:.78rem;margin:4px 0 0">Énergie primaire par habitant en 2023 : SDES, d'après l'AIE. Le calcul compare de l'énergie primaire (dont une grande partie est perdue avant usage) à du travail mécanique : c'est la convention de Jancovici, qui maximise le chiffre ; avec l'énergie finale, il faudrait diviser par environ 1,6.</p>`;
}
function densite() {
  logBars($("#ep-densite"), [["Gisement de pétrole ou de gaz", 2000, "#111827"], ["Mine de charbon", 1000, "#475569"], ["Centrale nucléaire (avec son site)", 1000, "#f59e0b"], ["Solaire photovoltaïque au sol (moyenne annuelle)", 8, "#facc15"], ["Éolien (emprise totale du parc)", 1.5, "#14b8a6"], ["Hydroélectricité (surface du lac)", 3, "#0ea5e9"], ["Biomasse (bois, cultures énergétiques)", 0.3, "#65a30d"]], "W/m²", -1, 4, [[0.1, "0,1"], [1, "1"], [10, "10"], [100, "100"], [1000, "1 000"], [10000, "10 000 W/m²"]]);
}
function rendements() {
  const R = [["Pompe à chaleur (chaleur fournie / électricité)", 300, "#16a34a"], ["Moteur électrique", 93, "#2563eb"], ["Batterie (charge puis décharge)", 90, "#3b82f6"], ["Transformateur, ligne électrique", 95, "#60a5fa"], ["Centrale à gaz à cycle combiné", 60, "#64748b"], ["Électrolyseur (électricité → hydrogène)", 65, "#0ea5e9"], ["Turbine d'éolienne (part de l'énergie du vent)", 45, "#14b8a6"], ["Centrale à charbon", 40, "#111827"], ["Moteur diesel", 38, "#b91c1c"], ["Centrale nucléaire", 33, "#f59e0b"], ["Moteur à essence", 28, "#dc2626"], ["Muscle humain", 25, "#be185d"], ["Panneau photovoltaïque", 22, "#facc15"], ["Chaîne hydrogène complète (électricité → électricité)", 30, "#7dd3fc"], ["Photosynthèse (lumière → biomasse, en pratique)", 1, "#65a30d"]];
  window.TH.bars($("#ep-rend"), R.map(([l, v, c]) => ({ l, v: Math.min(v, 100), t: v + " %", c })), { max: 100 });
}
function carnot() {
  const tc = +$("#ep-tc").value, tf = +$("#ep-tf").value; $("#ep-tc-v").textContent = tc + " °C"; $("#ep-tf-v").textContent = tf + " °C";
  const e = Math.max(0, 1 - (tf + 273.15) / (tc + 273.15));
  window.TH.kpis("#ep-carnot", [[fr(100 * e, 1) + " %", ["rendement maximal théorique"], "Limite de Carnot"], [fr(100 * e * 0.7, 0) + " %", ["ordre de grandeur réel (≈ 70 % de la limite)"], "En pratique"], [fr(100 * (1 - e), 0) + " %", ["rejetée en chaleur au minimum"], "Chaleur perdue"]]);
}
function bilan() {
  const el = $("#ep-sankey"); if (!el || !window.d3?.sankey) return;
  const N = [["res", "Ressources primaires", 0, "#111827"], ["fin", "Consommation finale", 1, "#2563eb"], ["per", "Pertes (surtout chaleur des centrales)", 1, "#dc2626"], ["exp", "Exportations nettes d'électricité", 1, "#f59e0b"], ["sou", "Soutes internationales (avions, navires)", 1, "#64748b"]];
  const L = [["res", "fin", 1609], ["res", "per", 946], ["res", "exp", 94], ["res", "sou", 85]];
  const W = 900, H = 300, g = d3.sankey().nodeId(d => d.id).nodeAlign(n => n.c).nodeWidth(14).nodePadding(16).extent([[2, 20], [W - 330, H - 6]])({ nodes: N.map(([id, l, c, col]) => ({ id, l, c, col })), links: L.map(([s, t, v]) => ({ source: s, target: t, value: v })) });
  const svg = d3.select(el).html("").append("svg").attr("viewBox", `0 0 ${W} ${H}`).attr("width", "100%");
  svg.append("g").attr("fill", "none").selectAll("path").data(g.links).join("path").attr("d", d3.sankeyLinkHorizontal()).attr("stroke", d => d.target.col).attr("stroke-opacity", .35).attr("stroke-width", d => Math.max(1.5, d.width));
  svg.append("g").selectAll("rect").data(g.nodes).join("rect").attr("x", d => d.x0).attr("y", d => d.y0).attr("width", d => d.x1 - d.x0).attr("height", d => Math.max(2, d.y1 - d.y0)).attr("fill", d => d.col);
  svg.append("g").attr("font-size", 11.5).selectAll("text").data(g.nodes).join("text").attr("x", d => d.c ? d.x1 + 6 : d.x0).attr("y", d => d.c ? (d.y0 + d.y1) / 2 : d.y0 - 5).attr("dy", d => d.c ? "0.35em" : 0).style("fill", "currentColor").text(d => `${d.l} : ${fr(d.value)} TWh`);
  window.TH.bars($("#ep-mix"), [["Chaleur nucléaire", 43, "#f59e0b"], ["Pétrole", 26, "#111827"], ["Renouvelables et déchets", 17, "#16a34a"], ["Gaz naturel", 12, "#0ea5e9"], ["Charbon", 2, "#475569"]].map(([l, v, c]) => ({ l, v, t: v + " % (" + fr(2558 * v / 100) + " TWh)", c })));
  window.TH.bars($("#ep-hab"), HAB.map(([l, v]) => ({ l, v, t: v + " MWh", c: l === "France" ? "#2563eb" : "#94a3b8" })));
  window.TH.kpis("#ep-kpis", [["2 558 TWh", ["énergie primaire consommée", "en France en 2025"], "France"], ["36 MWh", ["par habitant et par an", "≈ 100 kWh par jour"], "Un Français"], ["≈ 200", ["fois ce que ses muscles", "pourraient fournir"], "Esclaves énergétiques"], ["81 %", ["de l'énergie primaire mondiale", "vient des fossiles (2023)"], "Monde"]]);
}
function init() {
  if (!window.TH || !window.d3) { setTimeout(init, 100); return; }
  if (!$("#energie-physique")) return;
  $("#ep-unit").innerHTML = U.map(([k, l]) => `<option value="${k}"${k === "kWh" ? " selected" : ""}>${l} (${k})</option>`).join("");
  $("#ep-pays").innerHTML = HAB.map(([p]) => `<option${p === "France" ? " selected" : ""}>${p}</option>`).join("");
  [conv, ordres, esclaves, densite, rendements, carnot, bilan].forEach(f => { try { f(); } catch (e) { console.error(f.name, e); } });
  ["ep-val", "ep-unit"].forEach(i => $("#" + i).addEventListener("input", conv));
  ["ep-pw", "ep-h", "ep-j", "ep-pays"].forEach(i => $("#" + i).addEventListener("input", esclaves));
  ["ep-tc", "ep-tf"].forEach(i => $("#" + i).addEventListener("input", carnot));
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
