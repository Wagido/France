/* Articles non publiés : réseaux électriques, depuis 1974, climat (physique), énergie de la Terre, météo */
(() => {
"use strict";
const $ = s => document.querySelector(s);
const fr = (v, d = 0) => v == null ? "–" : v.toLocaleString("fr-FR", { minimumFractionDigits: d, maximumFractionDigits: d });
const J = u => fetch(u, { cache: "no-cache" }).then(r => r.json());

/* ================= 1. Réseaux électriques ================= */
let RX = null;
function rxSemaine(k) {
  const el = $("#rx-semaine"); if (!el || !RX) return;
  const rows = RX.semaines[k], W = 900, H = 320, m = { t: 10, r: 10, b: 26, l: 52 };
  const SRC = [[2, "Nucléaire", "#f59e0b"], [3, "Hydraulique", "#2563eb"], [6, "Gaz", "#64748b"], [4, "Éolien", "#14b8a6"], [5, "Solaire", "#facc15"]];
  const stack = rows.map(r => { let y = 0; return SRC.map(([i]) => { const y0 = y; y += Math.max(0, r[i] || 0); return [y0, y]; }); });
  const ymax = Math.max(...rows.map((r, i) => Math.max(stack[i][SRC.length - 1][1], r[1]))) * 1.05;
  const x = i => m.l + i / (rows.length - 1) * (W - m.l - m.r), y = v => H - m.b - v / ymax * (H - m.t - m.b);
  let s = `<svg viewBox="0 0 ${W} ${H}" width="100%" style="font-size:10.5px">`;
  for (let v = 0; v <= ymax; v += 20000) s += `<line x1="${m.l}" x2="${W - m.r}" y1="${y(v)}" y2="${y(v)}" stroke="#e2e8f0"/><text x="${m.l - 6}" y="${y(v) + 3}" text-anchor="end" fill="#64748b">${fr(v / 1000)} GW</text>`;
  SRC.forEach(([, , c], j) => {
    const top = rows.map((r, i) => `${x(i)},${y(stack[i][j][1])}`).join(" "), bot = rows.map((r, i) => `${x(i)},${y(stack[i][j][0])}`).reverse().join(" ");
    s += `<polygon points="${top} ${bot}" fill="${c}" opacity=".85"/>`;
  });
  s += `<polyline points="${rows.map((r, i) => `${x(i)},${y(r[1])}`).join(" ")}" fill="none" stroke="#111827" stroke-width="2"/>`;
  rows.forEach((r, i) => { if (r[0].endsWith("T00") || r[0].endsWith("T12")) { const d = new Date(r[0] + ":00Z"); if (r[0].endsWith("T00")) s += `<line x1="${x(i)}" x2="${x(i)}" y1="${m.t}" y2="${H - m.b}" stroke="#cbd5e1" stroke-dasharray="3 3"/><text x="${x(i) + 3}" y="${H - 10}" fill="#64748b">${d.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", timeZone: "UTC" })}</text>`; } });
  const mn = Math.min(...rows.map(r => r[1])), mx = Math.max(...rows.map(r => r[1])), ex = rows.reduce((a, r) => a + r[7], 0) / rows.length;
  el.innerHTML = s + `</svg><div class="legend-row">${SRC.map(([, l, c]) => `<span><i style="border-top-color:${c};opacity:1;width:14px;border-top-width:10px"></i>${l}</span>`).join("")}<span><i style="border-top-color:#111827;opacity:1;width:14px"></i>Consommation</span></div>
    <p class="muted" style="font-size:.85rem;margin:6px 0 0">Consommation de ${fr(mn / 1000)} à ${fr(mx / 1000)} GW sur la semaine. Solde des échanges en moyenne : ${ex < 0 ? "export" : "import"} de ${fr(Math.abs(ex) / 1000, 1)} GW (l'écart entre production totale et consommation, plus le pompage des stations de transfert).</p>`;
}

const RXP = { eu: [3000, 5, 300, 3000], ib: [3000, 4, 35, 700], ir: [400, 3.5, 4, 300], enr: [3000, 2, 120, 3000] };
function rxSim() {
  const el = $("#rx-sim"); if (!el) return;
  const loss = +$("#rx-loss").value, H = +$("#rx-h").value, S = +$("#rx-s").value * 1000, F = +$("#rx-fcr").value;
  $("#rx-loss-v").textContent = fr(loss) + " MW"; $("#rx-h-v").textContent = fr(H, 1) + " s"; $("#rx-s-v").textContent = fr(S / 1000) + " GW"; $("#rx-fcr-v").textContent = fr(F) + " MW";
  const f0 = 50, dt = 0.02, T = 60, kself = 0.015 * S, tau = 4;  // autorégulation 1,5 %/Hz de la charge (≈ puissance en service)
  let df = 0, pf = 0, nad = 0, tn = 0, rocof = 0, shed = false; const pts = [];
  for (let t = 0; t <= T; t += dt) {
    const pl = t >= 2 ? loss : 0;
    const target = F * Math.min(1, Math.max(0, -df - 0.01) / 0.19);
    pf += Math.max(-F / 30 * 4, Math.min(F / 30 * 2, (target - pf) / tau)) * dt;   // retard du réglage, montée bornée
    const dP = pf - kself * df - pl;
    const d = f0 / (2 * H * S) * dP;
    if (t >= 2 && t < 2 + dt) rocof = d;
    df += d * dt;
    if (df < nad) { nad = df; tn = t; }
    if (50 + df < 49) shed = true;
    if (Math.round(t / dt) % 10 === 0) pts.push([t, 50 + df]);
  }
  const W = 900, Hh = 300, m = { t: 12, r: 14, b: 28, l: 52 }, lo = Math.min(48.5, 50 + nad - 0.1);
  const x = t => m.l + t / T * (W - m.l - m.r), y = v => m.t + (50.1 - v) / (50.1 - lo) * (Hh - m.t - m.b);
  let s = `<svg viewBox="0 0 ${W} ${Hh}" width="100%" style="font-size:10.5px">`;
  for (let v = Math.ceil(lo * 5) / 5; v <= 50.1; v += 0.2) s += `<line x1="${m.l}" x2="${W - m.r}" y1="${y(v)}" y2="${y(v)}" stroke="#eef2f7"/><text x="${m.l - 6}" y="${y(v) + 3}" text-anchor="end" fill="#64748b">${v.toFixed(1).replace(".", ",")} Hz</text>`;
  for (let t = 0; t <= T; t += 10) s += `<text x="${x(t)}" y="${Hh - 8}" text-anchor="middle" fill="#64748b">${t} s</text>`;
  [[49.8, "#f59e0b", "49,8 Hz : réserve primaire entièrement mobilisée"], [49.0, "#dc2626", "49,0 Hz : début du délestage automatique"]].forEach(([v, c, l]) => { if (v > lo) s += `<line x1="${m.l}" x2="${W - m.r}" y1="${y(v)}" y2="${y(v)}" stroke="${c}" stroke-dasharray="5 4"/><text x="${W - m.r}" y="${y(v) - 4}" text-anchor="end" fill="${c}">${l}</text>`; });
  s += `<polyline points="${pts.map(([t, v]) => `${x(t)},${y(Math.max(v, lo))}`).join(" ")}" fill="none" stroke="#2563eb" stroke-width="2.4"/>`;
  s += `<circle cx="${x(tn)}" cy="${y(Math.max(50 + nad, lo))}" r="4" fill="#dc2626"/><text x="${x(tn) + 8}" y="${y(Math.max(50 + nad, lo)) + 14}" fill="#dc2626" font-weight="700">nadir ${(50 + nad).toFixed(2).replace(".", ",")} Hz</text>`;
  el.innerHTML = s + "</svg>";
  const fin = pts[pts.length - 1][1];
  $("#rx-sim-res").innerHTML = `<ul>
    <li><b>Pente initiale (RoCoF)</b> : ${fr(rocof, 3)} Hz/s${Math.abs(rocof) > 1 ? " : au-delà de 1 Hz/s, de nombreuses protections de générateurs risquent de déclencher" : ""}.</li>
    <li><b>Point bas (nadir)</b> : ${(50 + nad).toFixed(2).replace(".", ",")} Hz, atteint ${fr(tn - 2, 1)} s après l'incident.${shed ? " <b style='color:#dc2626'>Sous 49 Hz : le délestage automatique couperait une partie des consommateurs</b> (non simulé ici)." : nad < -0.8 ? " Écart supérieur à 800 mHz : hors des limites de conception." : " Le réseau tient."}</li>
    <li><b>Fréquence stabilisée</b> à ${fin.toFixed(2).replace(".", ",")} Hz : sans réglage secondaire, la fréquence ne revient pas à 50 Hz ; c'est le rôle de l'aFRR dans les minutes suivantes.</li></ul>`;
}

async function reseaux() {
  if (!$("#reseaux")) return;
  try { RX = await J("data/reseaux.json"); } catch (e) { }
  rxSemaine("hiver");
  document.querySelectorAll(".rx-sem").forEach(b => b.addEventListener("click", () => { document.querySelectorAll(".rx-sem").forEach(x => x.classList.toggle("on", x === b)); rxSemaine(b.dataset.s); }));
  ["rx-loss", "rx-h", "rx-s", "rx-fcr"].forEach(i => $("#" + i).addEventListener("input", rxSim));
  document.querySelectorAll(".rx-pre").forEach(b => b.addEventListener("click", () => { const p = RXP[b.dataset.p]; ["rx-loss", "rx-h", "rx-s", "rx-fcr"].forEach((i, k) => $("#" + i).value = p[k]); rxSim(); }));
  rxSim();
}

/* ================= 2. Depuis 1974 ================= */
async function depuis1974() {
  if (!$("#depuis1974")) return;
  const TH = window.TH; let Hh, C, F, D;
  try { [Hh, C, F, D] = await Promise.all([J("data/histoire.json"), J("data/chomage.json"), J("data/finances.json"), J("data/desindustrialisation.json")]); } catch (e) { return; }
  const L = Hh.longue.filter(d => d.annee >= 1960);
  // croissance (barres) + inflation (ligne)
  const el = $("#h74-croiss"), W = 900, H = 280, m = { t: 12, r: 10, b: 26, l: 40 };
  const x0 = 1960, x1 = L[L.length - 1].annee, bw = (W - m.l - m.r) / (x1 - x0 + 1);
  const x = a => m.l + (a - x0) * bw, lo = -8, hi = 15, y = v => m.t + (hi - v) / (hi - lo) * (H - m.t - m.b);
  let s = `<svg viewBox="0 0 ${W} ${H}" width="100%" style="font-size:10.5px">`;
  for (let v = lo; v <= hi; v += 4) s += `<line x1="${m.l}" x2="${W - m.r}" y1="${y(v)}" y2="${y(v)}" stroke="${v === 0 ? "#94a3b8" : "#eef2f7"}"/><text x="${m.l - 5}" y="${y(v) + 3}" text-anchor="end" fill="#64748b">${v} %</text>`;
  L.forEach(d => s += `<rect x="${x(d.annee) + 1}" y="${y(Math.max(0, d.croissance))}" width="${bw - 2}" height="${Math.abs(y(d.croissance) - y(0))}" fill="${d.croissance < 0 ? "#dc2626" : "#3b6fd6"}" opacity=".8"><title>${d.annee} : croissance ${fr(d.croissance, 1)} %, inflation ${fr(d.inflation, 1)} %</title></rect>`);
  s += `<polyline points="${L.map(d => `${x(d.annee) + bw / 2},${y(Math.min(hi, d.inflation))}`).join(" ")}" fill="none" stroke="#f59e0b" stroke-width="2"/>`;
  for (let a = 1960; a <= x1; a += 10) s += `<text x="${x(a) + bw / 2}" y="${H - 8}" text-anchor="middle" fill="#64748b">${a}</text>`;
  s += `<line x1="${x(1974)}" x2="${x(1974)}" y1="${m.t}" y2="${H - m.b}" stroke="#111827" stroke-dasharray="4 3"/>`;
  [[1975, "1ᵉʳ choc pétrolier"], [1983, "Tournant de la rigueur"], [1993, "Crise du SME"], [2009, "Crise financière"], [2020, "Covid"]].forEach(([a, t], i) => s += `<text x="${x(a) + bw / 2}" y="${m.t + 10 + (i % 2) * 12}" text-anchor="middle" fill="#111827" font-size="10">${t}</text>`);
  el.innerHTML = s + `</svg><div class="legend-row"><span><i style="border-top-color:#3b6fd6;opacity:1;width:14px;border-top-width:10px"></i>Croissance du PIB en volume</span><span><i style="border-top-color:#dc2626;opacity:1;width:14px;border-top-width:10px"></i>Récession</span><span><i style="border-top-color:#f59e0b;opacity:1;width:14px"></i>Inflation (prix à la consommation)</span></div>`;
  // chômage annuel
  const ch = {}; C.bit.forEach(r => { const a = +r.t.slice(0, 4); (ch[a] = ch[a] || []).push(r.taux); });
  const CH = Object.entries(ch).map(([a, v]) => ({ annee: +a, taux: Math.round(v.reduce((p, q) => p + q, 0) / v.length * 10) / 10 }));
  TH.lineChart($("#h74-chom"), CH, [{ k: "taux", l: "Taux de chômage", c: "#dc2626" }], { yfmt: v => v + " %", vfmt: v => fr(v, 1) + " %", h: 220 });
  // solde et dette
  const dette = Object.fromEntries(F.historique.map(r => [+r.annee, r.dette_pct]));
  const SD = Hh.longue.filter(d => d.annee >= 1970).map(d => ({ annee: d.annee, solde: d.solde_public, dette: dette[d.annee] ?? null }));
  TH.lineChart($("#h74-dette"), SD, [{ k: "solde", l: "Solde public", c: "#64748b" }, { k: "dette", l: "Dette publique", c: "#7c3aed" }], { yfmt: v => v + " %", vfmt: v => fr(v, 1) + " % du PIB", h: 220 });
  TH.lineChart($("#h74-indus"), D.va.map(r => ({ annee: r.annee, FR: r.FR, DE: r.DE })), [{ k: "FR", l: "France", c: "#2563eb" }, { k: "DE", l: "Allemagne", c: "#64748b" }], { yfmt: v => v + " %", vfmt: v => fr(v, 1) + " %", h: 220, nozero: true });
  TH.lineChart($("#h74-emploi"), D.emplois_fr.map(r => ({ annee: r.annee, v: r.v })), [{ k: "v", l: "Emploi industriel", c: "#2563eb" }], { yfmt: v => v + " M", vfmt: v => fr(v, 2) + " million", h: 220, nozero: true });
  $("#h74-src").innerHTML = `Sources : ${TH.esc(Hh.longue_source)} ; chômage : INSEE, enquête Emploi (moyenne annuelle des taux trimestriels) ; dette : INSEE, comptes nationaux (dette au sens de Maastricht) ; industrie : Eurostat et INSEE (valeur ajoutée de l'industrie hors construction, emploi industriel). Fichiers de données du site.`;
  const moy = (a, b, k) => { const v = Hh.longue.filter(d => d.annee >= a && d.annee <= b).map(d => d[k]); return v.reduce((p, q) => p + q, 0) / v.length; };
  const chm = (a, b) => { const v = CH.filter(d => d.annee >= a && d.annee <= b).map(d => d.taux); return v.length ? v.reduce((p, q) => p + q, 0) / v.length : null; };
  const last = Hh.longue[Hh.longue.length - 1].annee, va = D.va, em = D.emplois_fr;
  TH.kpis("#h74-kpis", [
    [fr(moy(1950, 1973, "croissance"), 1) + " % → " + fr(moy(2008, last, "croissance"), 1) + " %", ["1950-1973 contre 2008-" + last], "Croissance moyenne par an"],
    [fr(CH[0].taux, 1) + " % → " + fr(CH[CH.length - 1].taux, 1) + " %", [`${CH[0].annee} contre ${CH[CH.length - 1].annee}`, "pic à plus de 10 % en 1997 et 2015"], "Chômage"],
    [fr(em[0].v, 1) + " M → " + fr(em[em.length - 1].v, 1) + " M", [`${em[0].annee} contre ${em[em.length - 1].annee}`], "Emplois dans l'industrie"],
    [fr(dette[1995]) + " % → " + fr(dette[+F.historique[F.historique.length - 1].annee]) + " %", ["du PIB, 1995 contre " + F.historique[F.historique.length - 1].annee], "Dette publique"]
  ]);
  $("#h74-bilan").innerHTML = [
    ["Croissance moyenne du PIB", fr(moy(1950, 1973, "croissance"), 1) + " % par an (1950-1973)", fr(moy(2008, last, "croissance"), 1) + " % par an (2008-" + last + ")"],
    ["Inflation moyenne", fr(moy(1950, 1973, "inflation"), 1) + " % par an", fr(moy(2008, last, "inflation"), 1) + " % par an"],
    ["Chômage", "2 à 3 % (plein emploi)", fr(chm(2008, last), 1) + " % en moyenne"],
    ["Solde public moyen", fr(moy(1950, 1973, "solde_public"), 1) + " % du PIB", fr(moy(2008, last, "solde_public"), 1) + " % du PIB"],
    ["Part de l'industrie dans la valeur ajoutée", fr(va[0].FR, 1) + " % (" + va[0].annee + ")", fr(va[va.length - 1].FR, 1) + " % (" + va[va.length - 1].annee + ")"]
  ].map(r => `<tr><td><b>${r[0]}</b></td><td>${r[1]}</td><td>${r[2]}</td></tr>`).join("");
}

/* ================= 3. Climat : la physique ================= */
function climat() {
  if (!$("#climat-physique")) return;
  const TH = window.TH;
  // température d'équilibre
  $("#cp-stefan").innerHTML = `<div class="bars">${[["Terre sans atmosphère absorbante (même albédo)", -18, "#60a5fa"], ["Terre réelle, moyenne en surface", 15, "#f97316"]].map(([l, v, c]) => `<div class="bar-row"><span class="lab">${l}</span><span class="val">${v > 0 ? "+" : ""}${v} °C</span><span class="track"><span class="fill" style="width:${(v + 30) / 50 * 100}%;background:${c}"></span></span></div>`).join("")}</div><p class="muted" style="font-size:.8rem;margin:4px 0 0">Barres partant de −30 °C. Écart : 33 °C d'effet de serre naturel.</p>`;
  // rétroactions AR6 (W/m²/K)
  const R = [["Rayonnement de Planck (une Terre plus chaude rayonne plus)", -3.22, "#2563eb"], ["Vapeur d'eau et gradient vertical", 1.30, "#dc2626"], ["Nuages", 0.42, "#f87171"], ["Albédo de surface (neige, glace)", 0.35, "#fca5a5"], ["Total (somme des rétroactions)", -1.16, "#111827"]];
  $("#cp-retro").innerHTML = `<div class="bars">${R.map(([l, v, c]) => `<div class="bar-row"><span class="lab">${l}</span><span class="val">${v > 0 ? "+" : ""}${fr(v, 2)} W/m²/K</span><span class="track" style="position:relative"><span class="fill" style="position:absolute;${v < 0 ? `right:50%` : `left:50%`};width:${Math.abs(v) / 3.4 * 50}%;background:${c}"></span><i style="position:absolute;left:50%;top:-3px;bottom:-3px;border-left:1px solid #94a3b8"></i></span></div>`).join("")}</div><p class="muted" style="font-size:.8rem;margin:4px 0 0">Sensibilité qui en découle : 3,93 W/m² (doublement du CO₂) ÷ 1,16 ≈ 3,4 °C, cohérent avec la meilleure estimation de 3 °C retenue par le GIEC après combinaison avec les observations et les paléoclimats.</p>`;
  const calc = () => {
    const c = +$("#cp-c").value, S = +$("#cp-s").value, dF = 5.35 * Math.log(c / 280), dT = S * dF / (5.35 * Math.log(2));
    $("#cp-c-v").textContent = c + " ppm"; $("#cp-s-v").textContent = fr(S, 1) + " °C";
    TH.kpis("#cp-calc", [[fr(dF, 2) + " W/m²", ["forçage du CO₂ par rapport à 280 ppm"], "Forçage"], [(dT >= 0 ? "+" : "") + fr(dT, 1) + " °C", ["réchauffement à l'équilibre (CO₂ seul)"], "Réchauffement"], [fr(c / 280, 2) + " ×", [c >= 560 ? "au-delà d'un doublement" : "la concentration préindustrielle"], "CO₂"]]);
  };
  ["cp-c", "cp-s"].forEach(i => $("#" + i).addEventListener("input", calc)); calc();

  // vitesses de réchauffement et forçages comparés
  const bl = (sel, rows, unit, d, max) => { const el = $(sel); if (!el) return; const mx = max || Math.max(...rows.map(r => Math.abs(r[1]))); el.innerHTML = `<div class="bars">${rows.map(([l, v, c]) => `<div class="bar-row"><span class="lab">${l}</span><span class="val">${v > 0 && unit === "W/m²" ? "+" : ""}${fr(v, d)} ${unit}</span><span class="track"><span class="fill" style="width:${Math.max(0.6, Math.abs(v) / mx * 100).toFixed(1)}%;background:${c}"></span></span></div>`).join("")}</div>`; };
  bl("#cp-vitesse", [["Maximum thermique Paléocène-Éocène (56 Ma), phase de montée", 0.1, "#a8a29e"], ["Dernière déglaciation (−19 000 à −9 000 ans)", 0.06, "#60a5fa"], ["Petit âge glaciaire (refroidissement, 1450-1850)", 0.08, "#93c5fd"], ["Réchauffement actuel (1970-2020)", 2, "#dc2626"]], "°C/siècle", 2);
  bl("#cp-forcages", [["Gaz à effet de serre bien mélangés (1750-2019)", 3.32, "#dc2626"], ["dont CO₂", 2.16, "#f87171"], ["Aérosols d'origine humaine (1750-2019)", -1.1, "#60a5fa"], ["Total d'origine humaine (1750-2019)", 2.72, "#111827"], ["Soleil, tendance 1750-2019", 0.01, "#f59e0b"], ["Soleil, amplitude d'un cycle de 11 ans", 0.2, "#fbbf24"], ["Orbite, variation sur 150 ans (moyenne mondiale)", 0.01, "#a855f7"], ["Grosse éruption volcanique (Pinatubo, 1991), au plus fort, pendant 1 à 2 ans", -3, "#64748b"]], "W/m²", 2);
  planck(); ["cp-lam", "cp-gam", "cp-scen"].forEach(i => $("#" + i).addEventListener("input", deuxBoites)); deuxBoites();
  const E = [["Quasi certain", 99, 100], ["Extrêmement probable", 95, 100], ["Très probable", 90, 100], ["Probable", 66, 100], ["Aussi probable qu'improbable", 33, 66], ["Improbable", 0, 33], ["Très improbable", 0, 10], ["Exceptionnellement improbable", 0, 1]];
  $("#cp-echelle").innerHTML = `<div class="bars">${E.map(([l, a, b]) => `<div class="bar-row"><span class="lab">${l}</span><span class="val">${a}-${b} %</span><span class="track" style="position:relative"><span class="fill" style="position:absolute;left:${a}%;width:${Math.max(1, b - a)}%;background:${a >= 66 ? "#16a34a" : a >= 33 ? "#f59e0b" : "#dc2626"}"></span></span></div>`).join("")}</div><p class="muted" style="font-size:.8rem;margin:4px 0 0">Échelle de probabilité du GIEC : probabilité que le résultat se produise ou soit vrai.</p>`;
}

/* spectres de Planck normalisés */
function planck() {
  const el = $("#cp-planck"); if (!el) return;
  const W = 900, H = 260, m = { l: 40, r: 10, t: 14, b: 32 }, l0 = Math.log10(0.1), l1 = Math.log10(100);
  const x = um => m.l + (Math.log10(um) - l0) / (l1 - l0) * (W - m.l - m.r), y = v => H - m.b - v * (H - m.t - m.b);
  const B = (um, T) => { const l = um * 1e-6; return 1 / (l ** 5 * (Math.exp(0.014388 / (l * T)) - 1)); };
  const curve = T => { const pts = []; for (let k = 0; k <= 400; k++) { const um = 10 ** (l0 + (l1 - l0) * k / 400); pts.push([um, B(um, T)]); } const mx = Math.max(...pts.map(p => p[1])); return pts.map(([u, v]) => `${x(u)},${y(v / mx)}`).join(" "); };
  let s = `<svg viewBox="0 0 ${W} ${H}" width="100%" style="font-size:10.5px">`;
  [[0.4, 0.7, "#fde68a", "visible", 0], [8, 13, "#d1fae5", "fenêtre 8-13 µm", 3], [14, 16.5, "#fecaca", "CO₂ 15 µm", 1], [4.2, 4.45, "#fecaca", "CO₂ 4,3", 2], [9.4, 9.9, "#e9d5ff", "O₃", 4], [5.5, 7.5, "#bfdbfe", "H₂O 6,3 µm", 0], [18, 100, "#dbeafe", "H₂O rotation", 0]].forEach(([a, b, c, t, k]) => s += `<rect x="${x(a)}" y="${m.t}" width="${x(b) - x(a)}" height="${H - m.t - m.b}" fill="${c}" opacity=".7"/>${t ? `<text x="${(x(a) + x(b)) / 2}" y="${H - m.b - 8 - k * 13}" text-anchor="middle" fill="#475569" font-size="9.5">${t}</text>` : ""}`);
  [0.1, 0.3, 1, 3, 10, 30, 100].forEach(u => s += `<text x="${x(u)}" y="${H - 12}" text-anchor="middle" fill="#64748b">${String(u).replace(".", ",")} µm</text>`);
  s += `<polyline points="${curve(5772)}" fill="none" stroke="#f59e0b" stroke-width="2.4"/><polyline points="${curve(288)}" fill="none" stroke="#dc2626" stroke-width="2.4"/><polyline points="${curve(220)}" fill="none" stroke="#7c3aed" stroke-width="1.6" stroke-dasharray="5 4"/>`;
  s += `<text x="${x(0.5)}" y="${y(1) - 4}" text-anchor="middle" fill="#b45309" font-weight="700">Soleil, 5 772 K (pic 0,50 µm)</text><text x="${x(10)}" y="${y(1) - 4}" text-anchor="middle" fill="#dc2626" font-weight="700">Surface, 288 K (pic 10 µm)</text><text x="${x(30)}" y="${y(.55)}" fill="#7c3aed">220 K (tropopause)</text>`;
  el.innerHTML = s + "</svg>";
}
/* modèle à deux réservoirs */
function deuxBoites() {
  const el = $("#cp-2box"); if (!el) return;
  const lam = +$("#cp-lam").value, gam = +$("#cp-gam").value, sc = $("#cp-scen").value, C = 8, Co = 100, F2 = 3.93;
  $("#cp-lam-v").textContent = fr(lam, 2) + " W/m²/K (ECS " + fr(-F2 / lam, 1) + " K)"; $("#cp-gam-v").textContent = fr(gam, 2) + " W/m²/K";
  const N = 300, dt = 0.1, out = []; let T = 0, To = 0, co2 = 280;
  for (let k = 0; k <= N / dt; k++) {
    const t = k * dt;
    if (sc === "abrupt") co2 = 560;
    else if (sc === "pct") co2 = Math.min(560, 280 * 1.01 ** t);
    else co2 = t <= 50 ? 280 * 1.01 ** t : 280 + (280 * 1.01 ** 50 - 280) * (0.55 + 0.45 * Math.exp(-(t - 50) / 60)) - 0;   // après zéro émission : baisse rapide puis plateau
    const F = 5.35 * Math.log(co2 / 280) * F2 / (5.35 * Math.log(2));
    const dT = (F + lam * T - gam * (T - To)) / C, dTo = gam * (T - To) / Co;
    T += dT * dt; To += dTo * dt;
    if (k % 10 === 0) out.push([t, T, To, co2]);
  }
  const W = 900, H = 260, m = { l: 44, r: 50, t: 12, b: 28 }, ymax = Math.max(1, ...out.map(o => o[1])) * 1.1, ecs = -F2 / lam;
  const x = t => m.l + t / N * (W - m.l - m.r), y = v => H - m.b - v / Math.max(ymax, ecs * 1.05) * (H - m.t - m.b);
  let s = `<svg viewBox="0 0 ${W} ${H}" width="100%" style="font-size:10.5px">`;
  for (let v = 0; v <= Math.max(ymax, ecs); v += 0.5) s += `<line x1="${m.l}" x2="${W - m.r}" y1="${y(v)}" y2="${y(v)}" stroke="#eef2f7"/><text x="${m.l - 5}" y="${y(v) + 3}" text-anchor="end" fill="#64748b">${fr(v, 1)} K</text>`;
  for (let t = 0; t <= N; t += 50) s += `<text x="${x(t)}" y="${H - 8}" text-anchor="middle" fill="#64748b">${t} ans</text>`;
  s += `<line x1="${m.l}" x2="${W - m.r}" y1="${y(ecs)}" y2="${y(ecs)}" stroke="#dc2626" stroke-dasharray="5 4"/><text x="${W - m.r + 3}" y="${y(ecs) + 3}" fill="#dc2626">ECS</text>`;
  s += `<polyline points="${out.map(o => `${x(o[0])},${y(o[1])}`).join(" ")}" fill="none" stroke="#dc2626" stroke-width="2.4"/><polyline points="${out.map(o => `${x(o[0])},${y(o[2])}`).join(" ")}" fill="none" stroke="#2563eb" stroke-width="2" stroke-dasharray="6 3"/>`;
  el.innerHTML = s + `</svg><div class="legend-row"><span><i style="border-top-color:#dc2626;opacity:1"></i>Surface et océan de mélange (T)</span><span><i style="border-top-color:#2563eb;opacity:1;border-top-style:dashed"></i>Océan profond (T<sub>o</sub>)</span><span><i style="border-top-color:#dc2626;opacity:1;border-top-style:dashed"></i>Réchauffement d'équilibre pour un doublement</span></div>`;
  const at = yr => out.find(o => o[0] >= yr)[1];
  const tau1 = C / (-lam + gam);
  $("#cp-2box-res").innerHTML = `Constante de temps rapide τ₁ = C / (|λ| + γ) ≈ ${fr(tau1, 1)} ans. Réchauffement après 10 ans : ${fr(at(10), 2)} K ; 70 ans : ${fr(at(70), 2)} K${sc === "pct" ? " (≈ TCR)" : ""} ; 300 ans : ${fr(at(300), 2)} K (ECS = ${fr(ecs, 2)} K). Paramètres C = 8 et C<sub>o</sub> = 100 W·an/m²/K. Pour le dernier scénario, la décroissance du CO₂ après l'arrêt des émissions est schématique (environ la moitié de l'excès absorbée par l'océan et la biosphère en quelques décennies).`;
}

/* ================= 4. Énergie de la Terre ================= */
function sk(el, N, Lk, opts) {
  if (!el || !window.d3?.sankey) return;
  const W = 900, H = opts.h || 460;
  const g = d3.sankey().nodeId(d => d.id).nodeAlign(n => n.c).nodeSort(null).nodeWidth(12).nodePadding(opts.pad || 18).extent([[2, 24], [W - (opts.right || 200), H - 6]])({ nodes: N.map(([id, l, c, col]) => ({ id, l, c, col })), links: Lk.map(([s, t, v]) => ({ source: s, target: t, value: v })) });
  const svg = d3.select(el).html("").append("svg").attr("viewBox", `0 0 ${W} ${H}`).attr("width", "100%");
  svg.append("g").attr("fill", "none").selectAll("path").data(g.links).join("path").attr("d", d3.sankeyLinkHorizontal())
    .attr("stroke", d => d.target.col).attr("stroke-opacity", .4).attr("stroke-width", d => Math.max(1.5, d.width)).append("title").text(d => `${d.source.l} → ${d.target.l} : ${fr(d.value, d.value < 10 ? 1 : 0)} ${opts.u}`);
  svg.append("g").selectAll("rect").data(g.nodes).join("rect").attr("x", d => d.x0).attr("y", d => d.y0).attr("width", d => d.x1 - d.x0).attr("height", d => Math.max(2, d.y1 - d.y0)).attr("fill", d => d.col);
  const last = Math.max(...g.nodes.map(n => n.c));
  svg.append("g").attr("font-size", 11).attr("fill", "currentColor").selectAll("text").data(g.nodes).join("text")
    .attr("x", d => d.c === last ? d.x1 + 6 : d.x0).attr("y", d => d.c === last ? (d.y0 + d.y1) / 2 : d.y0 - 4).attr("dy", d => d.c === last ? "0.35em" : 0)
    .text(d => `${d.l} : ${fr(d.value, d.value < 10 ? 1 : 0)} ${opts.u}`);
}
function energieTerre() {
  if (!$("#et-sankey1")) return;
  window.TH.kpis("#et-kpis", [["173 000 TW", ["1 361 W/m² sur le disque terrestre"], "Reçu du Soleil"], ["122 000 TW", ["après réflexion de 30 %"], "Absorbé"], ["≈ 130 TW", ["production nette de la photosynthèse"], "Capté par la vie"], ["≈ 20 TW", ["620 EJ par an (2023)"], "Consommé par l'humanité"]]);
  const sw = "#f59e0b", rf = "#93c5fd", lw = "#dc2626", lt = "#0ea5e9";
  sk($("#et-sankey1"), [
    ["sun", "Soleil", 0, sw],
    ["ra", "Réfléchi par nuages, air, aérosols", 1, rf], ["rs", "Réfléchi par la surface", 1, rf], ["aa", "Absorbé par l'atmosphère", 1, "#fb923c"], ["as", "Absorbé par la surface", 1, "#ea580c"],
    ["ev", "Évaporation (chaleur latente)", 2, lt], ["cv", "Conduction et convection", 2, "#a78bfa"], ["ir", "Infrarouge net de la surface", 2, lw],
    ["atm", "Atmosphère et nuages", 3, "#b91c1c"],
    ["esw", "Lumière renvoyée vers l'espace", 4, rf], ["elw", "Infrarouge émis vers l'espace", 4, lw], ["st", "Stocké (océans surtout)", 4, "#111827"]
  ], [["sun", "ra", 76], ["sun", "rs", 24], ["sun", "aa", 80], ["sun", "as", 160], ["ra", "esw", 76], ["rs", "esw", 24],
    ["as", "ev", 82], ["as", "cv", 21], ["as", "ir", 56.3], ["as", "st", 0.7], ["ev", "atm", 82], ["cv", "atm", 21], ["ir", "atm", 56.3], ["aa", "atm", 80], ["atm", "elw", 239.3]], { u: "W/m²", h: 480, right: 230 });
  // échelle logarithmique
  const LG = [["Rayonnement solaire intercepté", 173000, sw], ["Absorbé par la Terre", 122000, "#ea580c"], ["Évaporation de l'eau", 42000, lt], ["Vents (énergie dissipée, ordre de grandeur)", 1000, "#14b8a6"], ["Déséquilibre (réchauffement en cours)", 360, "#111827"], ["Photosynthèse brute", 260, "#16a34a"], ["Photosynthèse nette", 130, "#22c55e"], ["Chaleur interne de la Terre", 47, "#78716c"], ["Énergie primaire de l'humanité", 20, "#7c3aed"], ["Marées", 3.7, "#64748b"], ["Électricité mondiale produite", 3.4, "#a855f7"], ["Nourriture des 8 milliards d'humains", 1, "#be185d"]];
  const lmin = -0.3, lmax = 5.4, p = v => (Math.log10(v) - lmin) / (lmax - lmin) * 100;
  $("#et-log").innerHTML = `<div class="bars">${LG.map(([l, v, c]) => `<div class="bar-row"><span class="lab">${l}</span><span class="val">${fr(v, v < 10 ? 1 : 0)} TW</span><span class="track"><span class="fill" style="width:${p(v).toFixed(1)}%;background:${c}"></span></span></div>`).join("")}</div>
    <div style="position:relative;height:16px;font-size:.72rem;color:#64748b;margin:2px 0 0">${[1, 10, 100, 1000, 10000, 100000].map(v => `<span style="position:absolute;left:${p(v).toFixed(1)}%;transform:translateX(-50%)">${fr(v)} TW</span>`).join("")}</div>`;
  $("#et-log-src").textContent = "Échelle logarithmique. Ordres de grandeur, sources en bas de page ; électricité mondiale : environ 30 000 TWh en 2023 (Energy Institute).";
  const gr = "#16a34a";
  sk($("#et-sankey2"), [
    ["gpp", "Photosynthèse brute", 0, gr], ["fos", "Charbon, pétrole, gaz (photosynthèse ancienne)", 0, "#78716c"], ["nfo", "Nucléaire, hydraulique, éolien, solaire, biomasse moderne", 0, "#a855f7"],
    ["resp", "Respiration des plantes", 1, "#86efac"], ["npt", "Production nette des terres", 1, gr], ["npo", "Production nette des océans", 1, "#0ea5e9"],
    ["hum", "Détourné par l'humanité", 2, "#be185d"], ["nat", "Herbivores, champignons, bactéries (terres)", 3, "#a3a3a3"], ["mar", "Plancton animal, poissons, bactéries", 3, "#38bdf8"],
    ["food", "Nourriture humaine", 3, "#be185d"], ["aut", "Élevage, bois, résidus, pertes", 3, "#f9a8d4"], ["mach", "Machines de l'humanité", 3, "#7c3aed"]
  ], [["gpp", "resp", 130], ["gpp", "npt", 70], ["gpp", "npo", 60], ["npt", "hum", 17], ["npt", "nat", 53], ["npo", "mar", 60], ["hum", "food", 1], ["hum", "aut", 16], ["fos", "mach", 16], ["nfo", "mach", 4]], { u: "TW", h: 520, right: 250, pad: 30 });
}

/* ================= 5. Météo ================= */
const NUAGES = [
  ["Cirrus", "Ci", "haut", 7, 12, "Filaments blancs, « queues de chat », faits de cristaux de glace", "Isolés : beau temps. S'ils envahissent le ciel depuis l'ouest et que la pression baisse : front chaud dans 12 à 24 h"],
  ["Cirrocumulus", "Cc", "haut", 7, 11, "Petits flocons blancs en rangées, « ciel pommelé »", "Souvent avant une perturbation"],
  ["Cirrostratus", "Cs", "haut", 6, 11, "Voile blanc laiteux, halo autour du Soleil ou de la Lune", "Front chaud qui approche : pluie probable dans les 12 à 24 h"],
  ["Altocumulus", "Ac", "moyen", 2.5, 6, "Bancs de galets gris et blancs ; en tourelles : castellanus", "Variable ; castellanus le matin : orages l'après-midi"],
  ["Altostratus", "As", "moyen", 2.5, 6, "Couche grise uniforme, Soleil vu « comme à travers un verre dépoli »", "Front chaud proche : pluie dans quelques heures"],
  ["Nimbostratus", "Ns", "moyen", 0.6, 5, "Couche grise sombre et épaisse, sans forme", "Pluie ou neige continue, pendant des heures"],
  ["Stratocumulus", "Sc", "bas", 0.5, 2, "Rouleaux ou dalles grises, ciel souvent couvert", "Temps gris, peu ou pas de pluie ; fréquent sous les anticyclones en hiver"],
  ["Stratus", "St", "bas", 0, 0.6, "Couche grise basse, comme un brouillard décollé du sol", "Bruine, grisaille ; se dissipe souvent dans la journée"],
  ["Cumulus", "Cu", "bas", 0.6, 3, "Tas blancs à base plate, contours nets (« choux-fleurs »)", "Petits : beau temps (cumulus de beau temps). Très développés (congestus) : averses possibles"],
  ["Cumulonimbus", "Cb", "tous", 0.6, 12, "Tour énorme, sommet en forme d'enclume", "Orage, grêle, rafales, fortes averses, parfois tornades : à fuir en bateau ou en avion"]
];
function nuages() {
  const el = $("#me-nuages"); if (!el) return;
  const W = 900, H = 330, m = { l: 46, r: 8, t: 10, b: 40 }, kmax = 13, y = k => m.t + (kmax - k) / kmax * (H - m.t - m.b), cw = (W - m.l - m.r) / NUAGES.length;
  const col = { haut: "#e0f2fe", moyen: "#cbd5e1", bas: "#94a3b8", tous: "#64748b" };
  let s = `<svg viewBox="0 0 ${W} ${H}" width="100%" style="font-size:10.5px"><rect x="${m.l}" y="${m.t}" width="${W - m.l - m.r}" height="${H - m.t - m.b}" fill="#eff6ff"/>`;
  [[0, 2, "Étage bas"], [2, 6, "Étage moyen"], [6, 13, "Étage élevé"]].forEach(([a, b, t], i) => s += `<rect x="${m.l}" y="${y(b)}" width="${W - m.l - m.r}" height="${y(a) - y(b)}" fill="${["#dbeafe", "#e0e7ff", "#f0f9ff"][i]}" opacity=".6"/><text x="${m.l + 4}" y="${y(b) + 12}" fill="#64748b" font-style="italic">${t}</text>`);
  for (let k = 0; k <= 12; k += 2) s += `<text x="${m.l - 6}" y="${y(k) + 3}" text-anchor="end" fill="#64748b">${k} km</text>`;
  const rnd = (i, j) => ((Math.sin(i * 12.9898 + j * 78.233) * 43758.5453) % 1 + 1) % 1;
  NUAGES.forEach(([n, ab, et, a, b], i) => {
    const cx = m.l + cw * (i + .5), y0 = y(b), y1 = y(a), c = col[et];
    if (ab === "Cb") { s += `<path d="M${cx - 18},${y1} C${cx - 26},${y1 - 40} ${cx - 20},${y0 + 40} ${cx - 10},${y0 + 14} L${cx - 38},${y0 + 4} L${cx + 40},${y0 + 4} L${cx + 12},${y0 + 14} C${cx + 22},${y0 + 40} ${cx + 28},${y1 - 40} ${cx + 18},${y1} Z" fill="${c}"/>`; }
    else if (ab === "Ci") for (let j = 0; j < 5; j++) s += `<path d="M${cx - 28 + rnd(i, j) * 10},${y0 + 12 + j * 14} q20,-10 45,-4" stroke="#94a3b8" stroke-width="2" fill="none"/>`;
    else if (["Cs", "As", "St", "Ns", "Sc"].includes(ab)) { s += `<rect x="${cx - cw / 2 + 6}" y="${y0 + (ab === "Ns" ? 0 : (y1 - y0) * .3)}" width="${cw - 12}" height="${ab === "Ns" ? y1 - y0 : (y1 - y0) * .4}" rx="8" fill="${ab === "Cs" ? "#f8fafc" : c}" stroke="#cbd5e1"/>`; if (ab === "Ns") for (let j = 0; j < 7; j++) s += `<line x1="${cx - 30 + j * 10}" y1="${y1 + 2}" x2="${cx - 34 + j * 10}" y2="${y1 + 16}" stroke="#3b82f6"/>`; }
    else for (let j = 0; j < (ab === "Cu" ? 3 : 6); j++) s += `<circle cx="${cx - 26 + (j % 3) * 24 + rnd(i, j) * 6}" cy="${(y0 + y1) / 2 - (ab === "Cu" ? 0 : (Math.floor(j / 3) - .5) * 16) + rnd(j, i) * 6}" r="${ab === "Cu" ? 15 : 9}" fill="${ab === "Cc" ? "#f8fafc" : "#fff"}" stroke="#cbd5e1"/>`;
    s += `<text x="${cx}" y="${H - 22}" text-anchor="middle" font-weight="700" fill="currentColor">${n}</text><text x="${cx}" y="${H - 9}" text-anchor="middle" fill="#64748b">${ab}</text>`;
  });
  el.innerHTML = s + "</svg>";
  const FORM = {"Ci": "Air qui monte très haut, lentement, sur la pente d'un front chaud ou au sommet d'un orage ; cristaux de glace étirés par le vent fort d'altitude", "Cc": "Petite instabilité dans une couche humide en altitude : la couche se découpe en cellules", "Cs": "Ascendance lente et étendue au-dessus d'un front chaud : un voile de glace continu", "Ac": "Couche humide en altitude, brassée par de petites cellules (instabilité ou ondes) ; castellanus : instabilité forte en altitude", "As": "Ascendance de grande échelle sur la pente du front chaud, plus bas que le cirrostratus", "Ns": "Ascendance lente mais continue sur une grande épaisseur (base d'un front chaud ou d'une occlusion)", "Sc": "Couche humide sous une inversion de température (air stable au-dessus), brassée par la turbulence", "St": "Air humide refroidi près du sol (nuit claire, air doux sur mer froide) ou soulevé faiblement ; air très stable", "Cu": "Bulles d'air chauffées par le sol (convection) qui montent jusqu'à leur point de rosée ; base plate = altitude de condensation", "Cb": "Convection profonde dans un air instable sur toute la troposphère, déclenchée par le sol chaud, un relief ou un front froid"};
  $("#me-nuages-t").innerHTML = NUAGES.map(([n, ab, et, a, b, as, si]) => `<tr><td><b>${n}</b> (${ab})</td><td>${et === "tous" ? `de ${fr(a, 1)} à plus de ${b} km` : `${fr(a, 1)} à ${b} km`}</td><td>${as}</td><td>${FORM[ab]}</td><td>${si}</td></tr>`).join("");
}

/* simulateur de Buys-Ballot (hémisphère Nord) */
let BOAT = [640, 250];
function buysBallot() {
  const el = $("#me-bb"); if (!el) return;
  const W = 900, H = 520, t = +$("#me-t").value / 100;
  const L = [120 + t * 620, 300 - t * 120], R = 170, P0 = 1012, dP = 36;
  const ang = (dx, dy) => Math.atan2(-dy, dx) * 180 / Math.PI;      // angle math (y vers le haut)
  const pr = r => P0 - dP * Math.exp(-((r / R) ** 2));
  const pol = (a, r) => [L[0] + r * Math.cos(a * Math.PI / 180), L[1] - r * Math.sin(a * Math.PI / 180)];
  const wfA = -25, cfA = -112;
  let s = `<svg viewBox="0 0 ${W} ${H}" width="100%" style="font-size:11px;cursor:crosshair;background:#f0f9ff;border-radius:8px">`;
  // secteur chaud
  const ws = [L, ...Array.from({ length: 9 }, (_, i) => pol(cfA + (wfA - cfA) * i / 8, 300))];
  s += `<polygon points="${ws.map(p => p.join(",")).join(" ")}" fill="#fecaca" opacity=".45"/>`;
  // isobares
  for (let p = 980; p <= 1008; p += 4) { const r = R * Math.sqrt(-Math.log((P0 - p) / dP)); if (!isFinite(r)) continue; s += `<circle cx="${L[0]}" cy="${L[1]}" r="${r}" fill="none" stroke="#64748b" stroke-width=".8"/><text x="${L[0] - r * .71 + 4}" y="${L[1] - r * .71}" fill="#64748b" font-size="9.5">${p}</text>`; }
  // fronts
  const fpath = (a, len, curve) => Array.from({ length: 13 }, (_, i) => pol(a + curve * (i / 12) ** 2, len * i / 12));
  const warm = fpath(wfA, 280, -12), cold = fpath(cfA, 300, -18);
  s += `<polyline points="${warm.map(p => p.join(",")).join(" ")}" fill="none" stroke="#dc2626" stroke-width="3"/>`;
  warm.slice(1, -1).forEach((p, i) => { if (i % 2 === 0) s += `<circle cx="${p[0]}" cy="${p[1]}" r="6" fill="#dc2626"/>`; });
  s += `<polyline points="${cold.map(p => p.join(",")).join(" ")}" fill="none" stroke="#2563eb" stroke-width="3"/>`;
  cold.slice(1, -1).forEach((p, i) => { if (i % 2 === 0) s += `<polygon points="${p[0] - 6},${p[1]} ${p[0] + 6},${p[1]} ${p[0] - 6},${p[1] - 9}" fill="#2563eb"/>`; });
  s += `<text x="${L[0]}" y="${L[1] + 7}" text-anchor="middle" font-size="22" font-weight="800" fill="#b91c1c">D</text>`;
  s += `<text x="${warm[9][0] + 8}" y="${warm[9][1] - 10}" fill="#dc2626" font-weight="700">front chaud</text><text x="${cold[8][0] - 80}" y="${cold[8][1] + 4}" fill="#2563eb" font-weight="700">front froid</text><text x="${pol(-70, 150)[0]}" y="${pol(-70, 150)[1]}" text-anchor="middle" fill="#b91c1c">secteur chaud</text>`;
  // trajectoire
  s += `<line x1="120" y1="300" x2="740" y2="180" stroke="#b91c1c" stroke-dasharray="6 5" opacity=".5"/><text x="742" y="176" fill="#b91c1c" font-size="10">trajectoire de la dépression →</text>`;
  // champ de vent (petites flèches)
  const wind = (x, y) => { const dx = x - L[0], dy = -(y - L[1]), r = Math.hypot(dx, dy) || 1; let a = Math.atan2(dy, dx) + Math.PI / 2 + 20 * Math.PI / 180; const g = dP * 2 * r / R / R * Math.exp(-((r / R) ** 2)); return { vx: Math.cos(a), vy: -Math.sin(a), kt: Math.min(55, 6 + g * 1100), r }; };
  for (let gx = 40; gx < W; gx += 60) for (let gy = 30; gy < H; gy += 60) { const w = wind(gx, gy), l = 8 + w.kt * .35; s += `<line x1="${gx - w.vx * l / 2}" y1="${gy - w.vy * l / 2}" x2="${gx + w.vx * l / 2}" y2="${gy + w.vy * l / 2}" stroke="#0f766e" stroke-width="1.3" opacity=".55" marker-end="url(#ar)"/>`; }
  // bateau
  const [bx, by] = BOAT, w = wind(bx, by), from = (Math.atan2(-w.vx, w.vy) * 180 / Math.PI + 360) % 360;   // direction d'où vient le vent (0 = nord)
  const dirs = ["nord", "nord-nord-est", "nord-est", "est-nord-est", "est", "est-sud-est", "sud-est", "sud-sud-est", "sud", "sud-sud-ouest", "sud-ouest", "ouest-sud-ouest", "ouest", "ouest-nord-ouest", "nord-ouest", "nord-nord-ouest"];
  const dname = dirs[Math.round(from / 22.5) % 16];
  const bf = [1, 3, 6, 10, 16, 21, 27, 33, 40, 47, 55, 63].findIndex(v => w.kt < v);
  s += `<defs><marker id="ar" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#0f766e"/></marker><marker id="ar2" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="4" markerHeight="4" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#111827"/></marker></defs>`;
  s += `<line x1="${bx - w.vx * 46}" y1="${by - w.vy * 46}" x2="${bx + w.vx * 30}" y2="${by + w.vy * 30}" stroke="#111827" stroke-width="4" marker-end="url(#ar2)"/>`;
  s += `<line x1="${bx}" y1="${by}" x2="${L[0]}" y2="${L[1]}" stroke="#b91c1c" stroke-width="1" stroke-dasharray="2 4"/>`;
  s += `<path d="M${bx - 12},${by + 4} L${bx + 12},${by + 4} L${bx + 7},${by + 10} L${bx - 7},${by + 10} Z M${bx},${by + 4} L${bx},${by - 16} L${bx + 9},${by + 2} Z" fill="#111827"/>`;
  s += `<text x="${W - 10}" y="22" text-anchor="end" font-size="12" font-weight="700">N ↑</text>`;
  el.innerHTML = s + "</svg>";
  // zone
  const a = ang(bx - L[0], by - L[1]), r = w.r; let zone, ciel, avenir;
  const inA = (a, lo, hi) => a >= lo && a <= hi;
  if (r > 360) zone = "Loin de la dépression : vent faible, temps influencé par les hautes pressions.";
  else if (inA(a, cfA, wfA)) zone = "<b>Dans le secteur chaud</b> : air doux et humide, ciel gris (stratus, stratocumulus), bruine, vent de sud-ouest assez régulier.";
  else if (inA(a, wfA, 70)) zone = "<b>En avant du front chaud</b> : nuages de plus en plus bas et épais (cirrus, cirrostratus, altostratus, puis nimbostratus), pluie continue à l'approche du front, pression en baisse régulière.";
  else if (a > 70 || a < -175) zone = "<b>Au nord de la dépression</b> (zone de l'occlusion) : vent d'est à nord, ciel gris, pluie durable, temps frais.";
  else zone = "<b>Derrière le front froid</b> : ciel de traîne, cumulus et cumulonimbus, averses et grains, rafales, excellente visibilité, pression en hausse.";
  const yTrack = 300 - (bx - 120) / 620 * 120;
  avenir = by > yTrack ? "La dépression passera <b>au nord</b> de vous : le vent va <b>virer</b> (tourner dans le sens des aiguilles d'une montre), du sud-est vers le sud-ouest au front chaud, puis brutalement vers l'ouest et le nord-ouest au front froid." : "La dépression passera <b>au sud</b> de vous : le vent va <b>reculer</b> (tourner dans le sens inverse des aiguilles d'une montre), de l'est vers le nord-est puis le nord, sans passage net de fronts.";
  $("#me-bb-res").innerHTML = `<ul><li><b>Vent du ${dname}</b>, environ ${fr(Math.round(w.kt / 5) * 5)} nœuds (force ${bf < 0 ? "11+" : bf} Beaufort), pression d'environ ${fr(pr(r))} hPa. Dos au vent, la dépression est à votre gauche, un peu en avant (pointillés rouges).</li><li>${zone}</li><li>${avenir}</li></ul><p class="muted" style="font-size:.78rem;margin:4px 0 0">Modèle schématique : vent tournant autour de la dépression et coupant les isobares de 20° vers le centre (valeur typique sur mer), force estimée d'après le resserrement des isobares.</p>`;
}
/* ascension d'une particule (adiabatiques sèche et saturée) */
function parcel() {
  const el = $("#me-parcel"); if (!el) return;
  const Ts = +$("#me-ts").value, dd = +$("#me-dd").value, G = +$("#me-g").value;
  $("#me-ts-v").textContent = Ts + " °C"; $("#me-dd-v").textContent = fr(dd, 1) + " K (point de rosée " + fr(Ts - dd, 1) + " °C)"; $("#me-g-v").textContent = fr(G, 1) + " K/km";
  const g = 9.81, cp = 1005, Rd = 287, Lv = 2.5e6, eps = 0.622, dz = 25, zmax = 14000, ztrop = 11000;
  const env = z => Ts - G * Math.min(z, ztrop) / 1000;
  const pz = z => 1013.25 * Math.exp(-z / 8000), es = Tc => 6.112 * Math.exp(17.67 * Tc / (Tc + 243.5));
  const zl = 125 * dd; const P = []; let Tp = Ts, cape = 0, cin = 0, lfc = null, el_ = null;
  for (let z = 0; z <= zmax; z += dz) {
    P.push([z, Tp]);
    const Te = env(z);
    if (z > zl) { if (Tp > Te) { cape += g * (Tp - Te) / (Te + 273.15) * dz; if (lfc == null) lfc = z; el_ = z; } else if (lfc == null) cin += g * (Tp - Te) / (Te + 273.15) * dz; }
    else cin += Math.min(0, g * (Tp - Te) / (Te + 273.15) * dz);
    let gam;
    if (z < zl) gam = g / cp;
    else { const T = Tp + 273.15, p = pz(z), rs = eps * es(Tp) / (p - es(Tp)); gam = g * (1 + Lv * rs / (Rd * T)) / (cp + Lv * Lv * rs * eps / (Rd * T * T)); }
    Tp -= gam * dz;
  }
  const W = 900, H = 360, m = { l: 48, r: 12, t: 10, b: 30 }, t0 = -70, t1 = 40;
  const x = t => m.l + (t - t0) / (t1 - t0) * (W - m.l - m.r), y = z => H - m.b - z / zmax * (H - m.t - m.b);
  let sv = `<svg viewBox="0 0 ${W} ${H}" width="100%" style="font-size:10.5px">`;
  for (let z = 0; z <= zmax; z += 2000) sv += `<line x1="${m.l}" x2="${W - m.r}" y1="${y(z)}" y2="${y(z)}" stroke="#eef2f7"/><text x="${m.l - 5}" y="${y(z) + 3}" text-anchor="end" fill="#64748b">${z / 1000} km</text>`;
  for (let t = -60; t <= 40; t += 20) sv += `<text x="${x(t)}" y="${H - 10}" text-anchor="middle" fill="#64748b">${t} °C</text><line x1="${x(t)}" x2="${x(t)}" y1="${m.t}" y2="${H - m.b}" stroke="#f1f5f9"/>`;
  // aires
  const pos = P.filter(([z, t]) => z > zl && t > env(z));
  if (pos.length) sv += `<polygon points="${pos.map(([z, t]) => `${x(t)},${y(z)}`).join(" ")} ${pos.slice().reverse().map(([z]) => `${x(env(z))},${y(z)}`).join(" ")}" fill="#fca5a5" opacity=".6"/>`;
  sv += `<rect x="${m.l}" y="${y(zl)}" width="${W - m.l - m.r}" height="2" fill="#94a3b8"/><text x="${W - m.r - 4}" y="${y(zl) - 4}" text-anchor="end" fill="#475569">base du nuage (condensation) : ${fr(zl)} m</text>`;
  sv += `<polyline points="${P.map(([z]) => `${x(env(z))},${y(z)}`).join(" ")}" fill="none" stroke="#111827" stroke-width="2"/>`;
  sv += `<polyline points="${P.map(([z, t]) => `${x(Math.max(t0, t))},${y(z)}`).join(" ")}" fill="none" stroke="#dc2626" stroke-width="2.2" stroke-dasharray="${""}"/>`;
  el.innerHTML = sv + `</svg><div class="legend-row"><span><i style="border-top-color:#111827;opacity:1"></i>Air ambiant (gradient choisi, isotherme au-dessus de 11 km)</span><span><i style="border-top-color:#dc2626;opacity:1"></i>Particule (sèche puis saturée)</span><span><i style="border-top-color:#fca5a5;opacity:1;border-top-width:10px;width:14px"></i>Zone où la particule est plus chaude : énergie disponible (CAPE)</span></div>`;
  const v = cape < 50 ? "Pas de convection profonde : l'air ne monte pas de lui-même. Ciel clair, ou stratus et stratocumulus si l'air est humide." : cape < 1000 ? "Convection modérée : cumulus bourgeonnants, averses possibles." : cape < 2500 ? "Atmosphère instable : orages probables si un déclencheur (relief, front, chaleur du sol) franchit la barrière d'inhibition." : "Très forte instabilité : orages violents, grêle, rafales possibles.";
  $("#me-parcel-res").innerHTML = `<ul><li><b>Base du nuage</b> : ${fr(zl)} m. ${lfc != null ? `<b>Niveau de convection libre</b> : ${fr(lfc)} m ; <b>sommet du nuage</b> (équilibre) : environ ${fr(el_ / 1000, 1)} km.` : "La particule reste plus froide que l'air ambiant : pas de convection libre."}</li>
    <li><b>CAPE</b> ≈ ${fr(cape)} J/kg (vitesse ascendante maximale théorique √(2 CAPE) ≈ ${fr(Math.sqrt(2 * cape))} m/s) ; <b>inhibition (CIN)</b> ≈ ${fr(cin)} J/kg.</li><li>${v}</li></ul><p class="muted" style="font-size:.78rem;margin:4px 0 0">Modèle simplifié : pas de mélange avec l'air ambiant, effet de la vapeur sur la densité (température virtuelle) négligé, pression standard.</p>`;
}

/* courbe de saturation et masse d'air */
let SAT = [20, 10];
function saturation() {
  const el = $("#me-satur"); if (!el) return;
  const W = 900, H = 300, m = { l: 50, r: 20, t: 12, b: 34 }, x = d3.scaleLinear([-10, 40], [m.l, W - m.r]), y = d3.scaleLinear([0, 50], [H - m.b, m.t]);
  const es = t => 6.112 * Math.exp(17.67 * t / (t + 243.5)), ws = t => 622 * es(t) / (1013.25 - es(t));
  const td = w => { let lo = -40, hi = 40; for (let i = 0; i < 40; i++) { const mid = (lo + hi) / 2; ws(mid) < w ? lo = mid : hi = mid; } return lo; };
  const [T, w] = SAT, d = td(w), hr = 100 * w / ws(T);
  let s = `<svg viewBox="0 0 ${W} ${H}" width="100%" style="font-size:10.5px;cursor:crosshair">`;
  y.ticks(5).forEach(v => s += `<line x1="${m.l}" x2="${W - m.r}" y1="${y(v)}" y2="${y(v)}" stroke="#eef2f7"/><text x="${m.l - 5}" y="${y(v) + 3}" text-anchor="end" fill="#64748b">${v} g/kg</text>`);
  x.ticks(10).forEach(v => s += `<text x="${x(v)}" y="${H - 14}" text-anchor="middle" fill="#64748b">${v} °C</text>`);
  const cur = d3.range(-10, 40.1, .5);
  s += `<path d="M${x(-10)},${y(0)} ${cur.map(t => `L${x(t)},${y(Math.min(50, ws(t)))}`).join(" ")} L${x(40)},${y(0)} Z" fill="#dbeafe" opacity=".6"/><polyline points="${cur.map(t => `${x(t)},${y(Math.min(50, ws(t)))}`).join(" ")}" fill="none" stroke="#1d4ed8" stroke-width="2.4"/>`;
  s += `<text x="${x(31)}" y="${y(ws(31)) - 8}" fill="#1d4ed8" font-weight="700">saturation (100 % d'humidité)</text><text x="${x(28)}" y="${y(8)}" fill="#1e40af">air non saturé : vapeur invisible</text><text x="${x(-2)}" y="${y(30)}" fill="#64748b">au-dessus de la courbe : impossible, l'excès se condense en nuage</text>`;
  s += `<line x1="${x(T)}" y1="${y(w)}" x2="${x(d)}" y2="${y(w)}" stroke="#dc2626" stroke-width="2" stroke-dasharray="5 4"/><circle cx="${x(T)}" cy="${y(w)}" r="7" fill="#dc2626"/><circle cx="${x(d)}" cy="${y(w)}" r="6" fill="#fff" stroke="#dc2626" stroke-width="2"/><text x="${x(d) - 8}" y="${y(w) - 10}" text-anchor="end" fill="#dc2626" font-weight="700">point de rosée ${fr(d, 1)} °C</text>`;
  el.innerHTML = s + "</svg>";
  $("#me-satur-res").innerHTML = `<ul><li>Masse d'air à <b>${fr(T, 1)} °C</b> contenant <b>${fr(w, 1)} g</b> de vapeur par kg d'air : humidité relative ${fr(Math.min(100, hr))} %.</li><li>Il faut la refroidir de <b>${fr(Math.max(0, T - d), 1)} °C</b> (jusqu'à ${fr(d, 1)} °C) pour qu'elle sature. ${T - d > 0.5 ? `En montant (≈ 1 °C par 100 m), cela arrive vers <b>${fr(125 * (T - d))} m</b> d'altitude : c'est la base du nuage. La nuit, si le sol se refroidit de ${fr(T - d, 1)} °C, du brouillard ou de la rosée apparaissent.` : "<b>Elle est déjà saturée</b> : brouillard ou nuage au sol."}</li></ul>`;
}
/* cinq mécanismes */
function mecanismes() {
  const el = $("#me-meca"); if (!el) return;
  const P = [["① Convection", "le sol chauffé par le Soleil crée des bulles d'air chaud qui montent", "Cumulus, cumulonimbus", "c"], ["② Relief", "le vent pousse l'air contre une montagne, il est forcé de monter", "Nuages accrochés aux crêtes, lenticulaires, pluie au vent du relief", "o"], ["③ Front", "l'air chaud glisse sur l'air froid (ou l'air froid soulève l'air chaud)", "Cirrus → altostratus → nimbostratus ; cumulonimbus au front froid", "f"], ["④ Convergence", "dans une dépression, l'air converge près du sol et monte lentement sur une grande surface", "Grandes couches nuageuses, pluie durable", "d"], ["⑤ Refroidissement par le bas", "nuit claire (le sol rayonne vers l'espace) ou air doux passant sur une surface froide (mer)", "Brouillard, stratus", "r"]];
  const W = 900, cw = W / 5, H = 290;
  let s = `<svg viewBox="0 0 ${W} ${H}" width="100%" style="font-size:10.5px"><defs><marker id="mk" viewBox="0 0 10 10" refX="8" refY="5" markerUnits="userSpaceOnUse" markerWidth="10" markerHeight="10" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#dc2626"/></marker></defs>`;
  const cloud = (cx, cy, r) => [0, 1, 2].map(i => `<circle cx="${cx - r + i * r}" cy="${cy - (i === 1 ? r * .4 : 0)}" r="${r * (i === 1 ? 1 : .8)}" fill="#fff" stroke="#94a3b8"/>`).join("");
  P.forEach(([t, d, n, k], i) => {
    const x0 = i * cw + 6, w = cw - 12, gy = 150;
    s += `<rect x="${x0}" y="4" width="${w}" height="${H - 8}" rx="8" fill="#f8fafc" stroke="#e2e8f0"/><rect x="${x0}" y="${gy}" width="${w}" height="10" fill="#86efac"/>`;
    const cx = x0 + w / 2;
    if (k === "c") { s += `<circle cx="${cx}" cy="${gy - 8}" r="6" fill="#fdba74"/><line x1="${cx}" y1="${gy - 16}" x2="${cx}" y2="${gy - 70}" stroke="#dc2626" stroke-width="2" marker-end="url(#mk)"/>${cloud(cx, gy - 92, 16)}<text x="${x0 + 10}" y="24" fill="#f59e0b">☀</text>`; }
    if (k === "o") { s += `<polygon points="${x0 + 30},${gy} ${cx + 10},${gy - 70} ${x0 + w - 10},${gy}" fill="#a8a29e"/><path d="M${x0 + 8},${gy - 20} L${cx - 10},${gy - 70} L${cx + 20},${gy - 90}" fill="none" stroke="#dc2626" stroke-width="2" marker-end="url(#mk)"/>${cloud(cx + 10, gy - 92, 13)}`; }
    if (k === "f") { s += `<polygon points="${x0 + 10},${gy} ${x0 + w - 10},${gy} ${x0 + w - 10},${gy - 60}" fill="#bfdbfe"/><text x="${x0 + w - 40}" y="${gy - 8}" fill="#1d4ed8">froid</text><text x="${x0 + 14}" y="${gy - 40}" fill="#b91c1c">chaud</text><path d="M${x0 + 20},${gy - 20} L${x0 + w - 20},${gy - 70}" fill="none" stroke="#dc2626" stroke-width="2" marker-end="url(#mk)"/><rect x="${x0 + w / 2}" y="${gy - 92}" width="${w / 2 - 12}" height="12" rx="6" fill="#e5e7eb" stroke="#94a3b8"/>`; }
    if (k === "d") { s += `<path d="M${x0 + 10},${gy - 10} L${cx - 6},${gy - 10}" stroke="#dc2626" stroke-width="2" marker-end="url(#mk)"/><path d="M${x0 + w - 10},${gy - 10} L${cx + 6},${gy - 10}" stroke="#dc2626" stroke-width="2" marker-end="url(#mk)"/><line x1="${cx}" y1="${gy - 14}" x2="${cx}" y2="${gy - 64}" stroke="#dc2626" stroke-width="2" marker-end="url(#mk)"/><rect x="${x0 + 12}" y="${gy - 92}" width="${w - 24}" height="18" rx="9" fill="#d1d5db" stroke="#94a3b8"/><text x="${cx + 18}" y="${gy - 18}" text-anchor="middle" fill="#b91c1c" font-weight="700">D</text>`; }
    if (k === "r") { s += `<text x="${x0 + 10}" y="28" fill="#64748b">☾ nuit claire</text><line x1="${cx}" y1="${gy - 4}" x2="${cx}" y2="${gy - 60}" stroke="#7c3aed" stroke-width="2" stroke-dasharray="4 3"/><rect x="${x0 + 4}" y="${gy - 26}" width="${w - 8}" height="24" fill="#e5e7eb" opacity=".9"/><text x="${cx}" y="${gy - 10}" text-anchor="middle" fill="#475569">brouillard</text>`; }
    s += `<text x="${cx}" y="184" text-anchor="middle" font-weight="700">${t}</text>`;
    let yy = 200; const wrap = (txt, col) => { const words = txt.split(" "); let line = "", out = ""; words.forEach(wd => { if ((line + wd).length > 27) { out += `<text x="${cx}" y="${yy}" text-anchor="middle" fill="${col}">${line}</text>`; line = ""; yy += 13; } line += wd + " "; }); out += `<text x="${cx}" y="${yy}" text-anchor="middle" fill="${col}">${line}</text>`; yy += 20; return out; };
    s += wrap(d, "#475569") + wrap("→ " + n, "#0f766e");
  });
  el.innerHTML = s + "</svg>";
}

/* carte en plan et coupe verticale d'une perturbation */
function perturbation2D() {
  const P = $("#me-plan"), C = $("#me-coupe"), Q = $("#me-sequence"); if (!P || !C) return;
  { const W = 900, H = 360, L = [360, 150];
    let s = `<svg viewBox="0 0 ${W} ${H}" width="100%" style="font-size:11.5px;background:#f8fafc;border-radius:8px">`;
    for (let r = 50; r <= 330; r += 50) s += `<ellipse cx="${L[0] + r * .25}" cy="${L[1] + r * .1}" rx="${r * 1.25}" ry="${r * .8}" fill="none" stroke="#94a3b8" stroke-width=".9"/>`;
    const warm = "M360,150 C430,190 520,215 640,235", cold = "M360,150 C340,210 300,270 230,340";
    s += `<path d="M360,150 C430,190 520,215 640,235 L560,360 L230,360 C300,270 340,210 360,150 Z" fill="#fecaca" opacity=".55"/>`;
    s += `<path d="${warm}" fill="none" stroke="#dc2626" stroke-width="4"/><path d="${cold}" fill="none" stroke="#2563eb" stroke-width="4"/>`;
    [[420, 181], [480, 205], [540, 220], [600, 230]].forEach(([x, y]) => s += `<circle cx="${x}" cy="${y}" r="8" fill="#dc2626"/>`);
    [[350, 190], [330, 235], [300, 280], [262, 318]].forEach(([x, y]) => s += `<polygon points="${x - 9},${y - 6} ${x + 7},${y + 6} ${x - 14},${y + 12}" fill="#2563eb"/>`);
    s += `<text x="${L[0]}" y="${L[1] + 8}" text-anchor="middle" font-size="26" font-weight="800" style="fill:#b91c1c">D</text>`;
    s += `<text x="650" y="250" style="fill:#dc2626" font-weight="700">front chaud</text><text x="160" y="330" style="fill:#2563eb" font-weight="700">front froid</text><text x="420" y="300" style="fill:#b91c1c" font-weight="700">SECTEUR CHAUD</text><text x="420" y="316" style="fill:#b91c1c">air chaud et humide venu du sud-ouest</text>`;
    s += `<text x="120" y="120" style="fill:#1d4ed8" font-weight="700">AIR FROID</text><text x="120" y="136" style="fill:#1d4ed8">(derrière le front froid)</text><text x="700" y="120" style="fill:#1d4ed8" font-weight="700">AIR FROID</text><text x="700" y="136" style="fill:#1d4ed8">(devant le front chaud)</text>`;
    // ligne de coupe
    s += `<line x1="150" y1="222" x2="820" y2="222" stroke="#111827" stroke-width="2" stroke-dasharray="8 5"/><circle cx="150" cy="222" r="5" fill="#111827"/><circle cx="820" cy="222" r="5" fill="#111827"/><text x="140" y="226" text-anchor="end" font-weight="800">A</text><text x="830" y="226" font-weight="800">B</text><text x="760" y="214" text-anchor="middle" style="fill:#475569">ligne de coupe (schéma ②)</text>`;
    // vents
    [[360, 60, 180], [520, 110, 200], [600, 300, 30], [220, 230, 110], [480, 250, 55], [700, 200, 10]].forEach(([x, y, a]) => { const r = a * Math.PI / 180; s += `<line x1="${x}" y1="${y}" x2="${x + 30 * Math.cos(r)}" y2="${y - 30 * Math.sin(r)}" stroke="#0f766e" stroke-width="2" marker-end="url(#mev)"/>`; });
    s += `<defs><marker id="mev" viewBox="0 0 10 10" refX="8" refY="5" markerUnits="userSpaceOnUse" markerWidth="10" markerHeight="10" orient="auto"><path d="M0,0 L10,5 L0,10z" fill="#0f766e"/></marker><marker id="mem" viewBox="0 0 10 10" refX="8" refY="5" markerUnits="userSpaceOnUse" markerWidth="14" markerHeight="14" orient="auto"><path d="M0,0 L10,5 L0,10z" fill="#b91c1c"/></marker></defs>`;
    s += `<line x1="380" y1="110" x2="460" y2="80" stroke="#b91c1c" stroke-width="3" marker-end="url(#mem)"/><text x="465" y="78" style="fill:#b91c1c">déplacement</text><text x="${W - 10}" y="22" text-anchor="end" font-weight="700">N ↑</text><text x="10" y="22" style="fill:#0f766e">→ vent</text>`;
    P.innerHTML = s + "</svg>"; }
  { const W = 900, H = 340, g = 290, x = km => 40 + (km + 400) / 1600 * 820, y = z => g - z * 22;   // km le long de A-B ; z en km d'altitude
    let s = `<svg viewBox="0 0 ${W} ${H}" width="100%" style="font-size:11px">`;
    s += `<rect x="0" y="0" width="${W}" height="${g}" fill="#eff6ff"/>`;
    // air froid arrière (coin sous front froid) et avant (sous front chaud)
    s += `<polygon points="${x(-400)},${g} ${x(0)},${g} ${x(-100)},${y(10)} ${x(-400)},${y(10)}" fill="#bfdbfe"/>`;
    s += `<polygon points="${x(250)},${g} ${x(1200)},${g} ${x(1200)},${y(9)}" fill="#bfdbfe"/>`;
    s += `<polygon points="${x(0)},${g} ${x(250)},${g} ${x(1200)},${y(9)} ${x(1200)},${y(11)} ${x(-100)},${y(11)} ${x(-100)},${y(10)}" fill="#fecaca" opacity=".8"/>`;
    s += `<line x1="${x(0)}" y1="${g}" x2="${x(-100)}" y2="${y(10)}" stroke="#2563eb" stroke-width="4"/><line x1="${x(250)}" y1="${g}" x2="${x(1200)}" y2="${y(9)}" stroke="#dc2626" stroke-width="4"/>`;
    s += `<text x="${x(-330)}" y="${y(4)}" style="fill:#1d4ed8" font-weight="800">AIR FROID</text><text x="${x(80)}" y="${y(5.5)}" style="fill:#b91c1c" font-weight="800">AIR CHAUD</text><text x="${x(80)}" y="${y(4.8)}" style="fill:#b91c1c">monte sur l'air froid</text><text x="${x(900)}" y="${y(1.5)}" style="fill:#1d4ed8" font-weight="800">AIR FROID</text>`;
    const cl = (cx, cy, w, h, col, t, tx, ty) => `<rect x="${x(cx) - w / 2}" y="${y(cy) - h / 2}" width="${w}" height="${h}" rx="${Math.min(w, h) / 2}" fill="${col}" stroke="#94a3b8"/>` + (t ? `<text x="${tx ?? x(cx)}" y="${ty ?? y(cy) + 4}" text-anchor="middle" style="fill:#111827" font-weight="700">${t}</text>` : "");
    s += `<path d="M${x(-40)},${g} L${x(-60)},${y(9)} L${x(-130)},${y(10.2)} L${x(40)},${y(10.2)} L${x(-10)},${y(9)} L${x(30)},${g} Z" fill="#94a3b8" opacity=".9"/><text x="${x(-35)}" y="${y(6)}" text-anchor="middle" style="fill:#fff" font-weight="800" transform="rotate(-90 ${x(-35)} ${y(6)})">Cumulonimbus</text>`;
    s += cl(-250, 1.5, 34, 26, "#fff", "Cu", null, null) + cl(-170, 1.8, 30, 24, "#fff", "Cu");
    s += cl(130, 1, 150, 16, "#cbd5e1", "St, Sc : bruine");
    s += `<polygon points="${x(250)},${y(0.6)} ${x(560)},${y(3)} ${x(560)},${y(5)} ${x(330)},${y(4.6)} ${x(250)},${y(3.5)}" fill="#6b7280" opacity=".85"/><text x="${x(410)}" y="${y(3)}" text-anchor="middle" style="fill:#fff" font-weight="800">Nimbostratus</text>`;
    s += `<polygon points="${x(560)},${y(3.6)} ${x(820)},${y(5.4)} ${x(820)},${y(6.6)} ${x(560)},${y(5.2)}" fill="#cbd5e1"/><text x="${x(690)}" y="${y(5.1)}" text-anchor="middle" font-weight="700">Altostratus</text>`;
    s += `<polygon points="${x(820)},${y(6)} ${x(1000)},${y(7.4)} ${x(1000)},${y(8.1)} ${x(820)},${y(6.8)}" fill="#e2e8f0"/><text x="${x(910)}" y="${y(7.1)}" text-anchor="middle" font-weight="700">Cirrostratus</text>`;
    s += `<path d="M${x(1030)},${y(8.4)} q30,-8 60,-2 M${x(1080)},${y(8.9)} q30,-8 60,-2 M${x(1130)},${y(8.6)} q30,-8 60,-2" stroke="#64748b" stroke-width="2" fill="none"/><text x="${x(1110)}" y="${y(9.6)}" text-anchor="middle" font-weight="700">Cirrus</text>`;
    for (let k = 260; k < 560; k += 14) s += `<line x1="${x(k)}" y1="${y(0.5)}" x2="${x(k) - 3}" y2="${g}" stroke="#2563eb" stroke-width="1.2"/>`;
    for (let k = -30; k < 25; k += 7) s += `<line x1="${x(k)}" y1="${y(0.8)}" x2="${x(k) - 4}" y2="${g}" stroke="#1d4ed8" stroke-width="2.4"/>`;
    s += `<text x="${x(400)}" y="${g + 16}" text-anchor="middle" style="fill:#2563eb">pluie continue (plusieurs heures)</text><text x="${x(0)}" y="${g + 16}" text-anchor="middle" style="fill:#1d4ed8" font-weight="700">averses, grains</text>`;
    s += `<rect x="0" y="${g}" width="${W}" height="6" fill="#86efac"/>`;
    [-400, 0, 400, 800, 1200].forEach(k => s += `<text x="${x(k)}" y="${H - 6}" text-anchor="middle" style="fill:#64748b">${k} km</text>`);
    s += `<text x="${x(-400) + 4}" y="14" font-weight="800">A (ouest)</text><text x="${x(1200) - 4}" y="14" text-anchor="end" font-weight="800">B (est)</text><text x="${x(-60)}" y="${y(11.5)}" style="fill:#2563eb" font-weight="700">front froid : pente ≈ 1/100</text><text x="${x(700)}" y="${y(9.6)}" style="fill:#dc2626" font-weight="700">front chaud : pente ≈ 1/150</text>`;
    s += `<line x1="${x(600)}" y1="${y(10.6)}" x2="${x(760)}" y2="${y(10.6)}" stroke="#b91c1c" stroke-width="3" marker-end="url(#mem)"/><text x="${x(600)}" y="${y(10.9)}" style="fill:#b91c1c">la perturbation avance vers l'est</text>`;
    C.innerHTML = s + `<defs><marker id="mem" viewBox="0 0 10 10" refX="8" refY="5" markerUnits="userSpaceOnUse" markerWidth="14" markerHeight="14" orient="auto"><path d="M0,0 L10,5 L0,10z" fill="#b91c1c"/></marker></defs></svg><p class="muted" style="font-size:.8rem;margin:2px 0 0">Altitudes de 0 à 12 km, distances le long de la coupe ; échelle verticale exagérée environ 50 fois.</p>`; }
  if (Q) { const S = [["≈ 24 h avant", "Cirrus en filaments qui envahissent le ciel depuis l'ouest", "pression qui commence à baisser", "#e2e8f0"], ["≈ 12 h avant", "Voile de cirrostratus, halo autour du Soleil", "baisse plus nette ; vent de sud qui forcit", "#cbd5e1"], ["≈ 6 h avant", "Altostratus : Soleil comme derrière un verre dépoli", "baisse continue", "#94a3b8"], ["Front chaud", "Nimbostratus, pluie continue pendant des heures", "le vent tourne au sud-ouest ; la température monte", "#6b7280"], ["Secteur chaud", "Ciel gris et bas, bruine, air doux et humide", "pression stable", "#fca5a5"], ["Front froid", "Cumulonimbus, averses violentes, grains, parfois orage", "le vent tourne brutalement au nord-ouest ; la température chute ; la pression remonte", "#3b82f6"], ["Après", "Ciel de traîne : éclaircies, cumulus, averses ; excellente visibilité", "pression en hausse, vent de nord-ouest frais", "#bfdbfe"]];
    Q.innerHTML = `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:6px">${S.map(([t, c, p, col], i) => `<div style="border-top:6px solid ${col};background:#f8fafc;border-radius:6px;padding:6px 8px;font-size:.8rem"><b>${i + 1}. ${t}</b><div style="margin-top:4px">${c}</div><div class="muted" style="margin-top:4px">${p}</div></div>`).join("")}</div>`; }
}

function meteo() {
  if (!$("#meteo")) return;
  nuages(); saturation(); mecanismes(); try { perturbation2D(); } catch (e) { console.error('perturbation2D', e); }
  $("#me-satur").addEventListener("click", ev => { const sv = $("#me-satur svg"); if (!sv) return; const b = sv.getBoundingClientRect(); const px = (ev.clientX - b.left) / b.width * 900, py = (ev.clientY - b.top) / b.height * 300; SAT = [Math.max(-10, Math.min(40, -10 + (px - 50) / 830 * 50)), Math.max(0.5, Math.min(50, (300 - 34 - py) / 254 * 50))]; saturation(); });
  ["me-ts", "me-dd", "me-g"].forEach(i => $("#" + i).addEventListener("input", parcel)); parcel();
  $("#me-t").addEventListener("input", buysBallot);
  $("#me-bb").addEventListener("click", ev => { const svg = $("#me-bb svg"); if (!svg) return; const b = svg.getBoundingClientRect(); BOAT = [(ev.clientX - b.left) / b.width * 900, (ev.clientY - b.top) / b.height * 520]; buysBallot(); });
  buysBallot();
  // maquette 3D : chargée seulement quand elle devient visible
  const box = $("#me-3d"); let started = false;
  const io = new IntersectionObserver(es => { if (started || !es.some(e => e.isIntersecting)) return; started = true;
    const sc = document.createElement("script"); sc.src = "lib/three.min.js"; sc.onload = () => { try { meteo3d(box); } catch (e) { console.error("meteo3d", e); box.innerHTML = `<p class="empty">Maquette 3D indisponible sur ce navigateur.</p>`; } }; document.head.appendChild(sc); });
  io.observe(box);
}

function meteo3d(box) {
  const T = window.THREE; box.innerHTML = "";
  const W = () => box.clientWidth, H = () => box.clientHeight;
  const renderer = new T.WebGLRenderer({ antialias: true, alpha: true }); renderer.setPixelRatio(Math.min(2, devicePixelRatio)); renderer.setSize(W(), H()); box.appendChild(renderer.domElement);
  const scene = new T.Scene(), cam = new T.PerspectiveCamera(40, W() / H(), 0.1, 500);
  scene.add(new T.HemisphereLight(0xffffff, 0x88aa88, 1.1)); const sun = new T.DirectionalLight(0xffffff, 0.9); sun.position.set(-20, 40, 20); scene.add(sun);
  // sol : x vers l'est, z vers le sud
  const ground = new T.Mesh(new T.PlaneGeometry(56, 56), new T.MeshLambertMaterial({ color: 0xb7d7b0 })); ground.rotation.x = -Math.PI / 2; scene.add(ground);
  const V = (x, y, z) => new T.Vector3(x, y, z);
  // fronts au sol
  const wf = [V(0, 0, 0), V(14, 0, 6)], cf = [V(0, 0, 0), V(-5, 0, 14)];
  const tube = (a, b, c) => { const m = new T.Mesh(new T.CylinderGeometry(0.18, 0.18, a.distanceTo(b), 8), new T.MeshLambertMaterial({ color: c })); m.position.copy(a.clone().add(b).multiplyScalar(.5)); m.quaternion.setFromUnitVectors(V(0, 1, 0), b.clone().sub(a).normalize()); scene.add(m); };
  tube(wf[0], wf[1], 0xdc2626); tube(cf[0], cf[1], 0x2563eb);
  // surfaces frontales
  const quad = (pts, color, op) => { const g = new T.BufferGeometry(); const p = [pts[0], pts[1], pts[2], pts[0], pts[2], pts[3]].flatMap(v => [v.x, v.y, v.z]); g.setAttribute("position", new T.Float32BufferAttribute(p, 3)); g.computeVertexNormals(); const m = new T.Mesh(g, new T.MeshLambertMaterial({ color, transparent: true, opacity: op, side: T.DoubleSide, depthWrite: false })); scene.add(m); return m; };
  const nW = V(6, 0, -14).normalize(), nC = V(-14, 0, -5).normalize();
  const wUp = (p, d, h) => p.clone().add(nW.clone().multiplyScalar(d)).add(V(0, h, 0)), cUp = (p, d, h) => p.clone().add(nC.clone().multiplyScalar(d)).add(V(0, h, 0));
  quad([wf[0], wf[1], wUp(wf[1], 14, 7), wUp(wf[0], 14, 7)], 0xef4444, .28);       // front chaud : pente douce
  quad([cf[0], cf[1], cUp(cf[1], 4, 8), cUp(cf[0], 4, 8)], 0x3b82f6, .32);         // front froid : pente raide
  // masse d'air chaud (secteur chaud)
  const warmS = new T.Mesh(new T.CylinderGeometry(12, 12, 3, 32, 1, false, Math.PI * 0.03, Math.PI * 0.47), new T.MeshLambertMaterial({ color: 0xf87171, transparent: true, opacity: .2, depthWrite: false }));
  warmS.position.set(0, 1.5, 0); warmS.rotation.y = Math.PI * 0.62; scene.add(warmS);
  // nuages
  const cloudMat = c => new T.MeshLambertMaterial({ color: c, transparent: true, opacity: .92 });
  const puff = (x, y, z, r, c = 0xffffff, n = 6) => { const g = new T.Group(); for (let i = 0; i < n; i++) { const s = new T.Mesh(new T.SphereGeometry(r * (0.6 + Math.random() * .5), 12, 10), cloudMat(c)); s.position.set((Math.random() - .5) * r * 1.6, (Math.random() - .3) * r * .6, (Math.random() - .5) * r * 1.6); g.add(s); } g.position.set(x, y, z); scene.add(g); return g; };
  const slab = (x, y, z, sx, sy, sz, c, op = .85, rot = 0) => { const m = new T.Mesh(new T.BoxGeometry(sx, sy, sz), new T.MeshLambertMaterial({ color: c, transparent: true, opacity: op })); m.position.set(x, y, z); m.rotation.y = rot; scene.add(m); return m; };
  const rotW = -Math.atan2(6, 14);
  // le long du front chaud, de plus en plus haut vers l'avant (nord-est)
  [[2, 1.2, 0x6b7280, 3.4, 1.4], [6, 3.4, 0x9ca3af, 3.4, .6], [10, 5.4, 0xe5e7eb, 3.4, .35], [13, 6.8, 0xf8fafc, 3.4, .15]].forEach(([d, h, c, w, th]) => { const p = wf[0].clone().lerp(wf[1], .5); const q = p.clone().add(nW.clone().multiplyScalar(d)); slab(q.x, h, q.z, 15, th, w, c, d > 9 ? .55 : .85, rotW); });
  // cumulonimbus le long du front froid
  for (let i = 1; i <= 3; i++) { const p = cf[0].clone().lerp(cf[1], .3 + i / 5); const tower = new T.Mesh(new T.CylinderGeometry(0.7, 1.0, 6.5, 14), cloudMat(0xd1d5db)); tower.position.set(p.x - .6, 3.6, p.z); scene.add(tower); const anvil = new T.Mesh(new T.CylinderGeometry(1.7, 0.8, .6, 16), cloudMat(0xf3f4f6)); anvil.position.set(p.x - .2, 7, p.z); scene.add(anvil); }
  // ciel de traîne : cumulus derrière le front froid
  [[-8, 4], [-10, 9], [-6, 11], [-12, 2], [-9, -2]].forEach(([x, z]) => puff(x, 1.8, z, .9));
  // pluie
  const rainG = new T.BufferGeometry(), rp = [];
  for (let i = 0; i < 700; i++) { let x, z; if (i < 450) { const p = wf[0].clone().lerp(wf[1], Math.random()); const q = p.add(nW.clone().multiplyScalar(Math.random() * 4)); x = q.x; z = q.z; } else { const p = cf[0].clone().lerp(cf[1], .15 + Math.random() * .75); x = p.x - .6 + (Math.random() - .5) * 2; z = p.z + (Math.random() - .5) * 2; } const y = Math.random() * 1.2; rp.push(x, y, z, x, y + .35, z); }
  rainG.setAttribute("position", new T.Float32BufferAttribute(rp, 3)); const rain = new T.LineSegments(rainG, new T.LineBasicMaterial({ color: 0x2563eb, transparent: true, opacity: .55 })); scene.add(rain);
  // flèches de vent : rotation autour du centre, avec convergence de 20°
  const winds = new T.Group(); scene.add(winds);
  [6, 11, 17].forEach((r, k) => { for (let i = 0; i < 10 + k * 4; i++) { const a = i / (10 + k * 4) * Math.PI * 2; const pos = V(r * Math.cos(a), .35, r * Math.sin(a)); const tang = V(Math.sin(a), 0, -Math.cos(a)); const inward = pos.clone().multiplyScalar(-1).normalize(); const dir = tang.multiplyScalar(Math.cos(.35)).add(inward.multiplyScalar(Math.sin(.35))).normalize(); winds.add(new T.ArrowHelper(dir, pos, 2.2, 0x0f766e, .7, .45)); } });
  // repères (étiquettes HTML)
  const labels = [["Dépression (D)", V(0, .5, 0), "#b91c1c"], ["Front chaud", V(9, 0, 4), "#dc2626"], ["Front froid", V(-3.5, 0, 10), "#2563eb"], ["Secteur chaud : air chaud et humide", V(8, 2.5, 12), "#b91c1c"], ["Air froid", V(-12, 1.2, -6), "#1d4ed8"], ["Air froid", V(20, .8, -14), "#1d4ed8"], ["Nimbostratus : pluie continue", V(9, 1.6, -0.5), "#374151"], ["Altostratus", V(11, 3.6, -3.5), "#374151"], ["Cirrostratus, cirrus", V(15, 7.2, -8.5), "#374151"], ["Cumulonimbus : orages, grains", V(-3.5, 7.8, 7), "#374151"], ["Ciel de traîne : cumulus, averses", V(-11, 3, 6), "#374151"], ["Nord ↑", V(0, 0, -22), "#111827"]].map(([t, p, c]) => { const d = document.createElement("div"); d.textContent = t; d.style.cssText = `position:absolute;transform:translate(-50%,-100%);font:600 11.5px system-ui,sans-serif;color:${c};background:rgba(255,255,255,.78);padding:1px 5px;border-radius:4px;pointer-events:none;white-space:nowrap`; box.appendChild(d); return [d, p]; });
  const north = V(0, 0, -22); tube(V(0, 0.05, -15), V(0, 0.05, -20), 0x111827);
  // caméra en orbite
  const VIEWS = { sw: [-0.75, 0.55, 36], top: [0, 1.5, 50], cut: [0, 0.18, 36] }; let th = VIEWS.sw[0], ph = VIEWS.sw[1], rad = VIEWS.sw[2], target = V(3, 2, 3);
  const place = () => { cam.position.set(target.x + rad * Math.cos(ph) * Math.sin(th), target.y + rad * Math.sin(ph), target.z + rad * Math.cos(ph) * Math.cos(th)); cam.lookAt(target); };
  let drag = null, pinch = null; const pts = new Map();
  renderer.domElement.addEventListener("pointerdown", e => { pts.set(e.pointerId, [e.clientX, e.clientY]); renderer.domElement.setPointerCapture(e.pointerId); drag = [e.clientX, e.clientY, th, ph]; if (pts.size === 2) { const [a, b] = [...pts.values()]; pinch = [Math.hypot(a[0] - b[0], a[1] - b[1]), rad]; } });
  renderer.domElement.addEventListener("pointermove", e => { if (!pts.has(e.pointerId)) return; pts.set(e.pointerId, [e.clientX, e.clientY]); if (pts.size === 2 && pinch) { const [a, b] = [...pts.values()]; rad = Math.max(20, Math.min(110, pinch[1] * pinch[0] / Math.hypot(a[0] - b[0], a[1] - b[1]))); } else if (drag) { th = drag[2] - (e.clientX - drag[0]) * .008; ph = Math.max(0.05, Math.min(1.55, drag[3] + (e.clientY - drag[1]) * .006)); } });
  const up = e => { pts.delete(e.pointerId); if (pts.size < 2) pinch = null; if (!pts.size) drag = null; };
  renderer.domElement.addEventListener("pointerup", up); renderer.domElement.addEventListener("pointercancel", up);
  renderer.domElement.addEventListener("wheel", e => { e.preventDefault(); rad = Math.max(20, Math.min(110, rad * (1 + Math.sign(e.deltaY) * .08))); }, { passive: false });
  document.querySelectorAll(".me-v").forEach(b => b.addEventListener("click", () => { [th, ph, rad] = VIEWS[b.dataset.v]; }));
  let spin = true; const btn = $("#me-anim"); btn.addEventListener("click", () => { spin = !spin; btn.textContent = spin ? "Pause de la rotation du vent" : "Reprendre la rotation du vent"; });
  let visible = true; new IntersectionObserver(es => visible = es.some(e => e.isIntersecting)).observe(box);
  new ResizeObserver(() => { if (!W()) return; renderer.setSize(W(), H()); cam.aspect = W() / H(); cam.updateProjectionMatrix(); }).observe(box);
  const pos = rain.geometry.attributes.position;
  const loop = () => {
    requestAnimationFrame(loop); if (!visible || !W()) return;
    if (spin) winds.rotation.y += 0.004;
    for (let i = 0; i < pos.count; i += 2) { let y = pos.getY(i) - 0.06; if (y < 0) y += 1.4; pos.setY(i, y); pos.setY(i + 1, y + .35); } pos.needsUpdate = true;
    place(); renderer.render(scene, cam);
    labels.forEach(([d, p]) => { const v = p.clone().project(cam); d.style.display = v.z > 1 ? "none" : ""; d.style.left = ((v.x + 1) / 2 * W()) + "px"; d.style.top = ((1 - v.y) / 2 * H()) + "px"; });
  };
  loop();
}

function init() {
  if (!window.TH || !window.d3) { setTimeout(init, 100); return; }
  [reseaux, depuis1974, climat, energieTerre, meteo].forEach(f => { try { const r = f(); if (r?.catch) r.catch(e => console.error(f.name, e)); } catch (e) { console.error(f.name, e); } });
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
