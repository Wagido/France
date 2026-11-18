/* Graphiques et schémas pédagogiques de l'article « Énergie et climat : la physique » */
(() => {
"use strict";
const $ = s => document.querySelector(s);
const fr = (v, d = 0) => v == null ? "–" : v.toLocaleString("fr-FR", { minimumFractionDigits: d, maximumFractionDigits: d });
const mm = (arr, n) => arr.map((r, i) => { const w = arr.slice(Math.max(0, i - n + 1), i + 1); return w.length < n ? null : w.reduce((a, b) => a + b, 0) / n; });
const arrow = (id, c, sz = 12) => `<marker id="${id}" viewBox="0 0 10 10" refX="8" refY="5" markerUnits="userSpaceOnUse" markerWidth="${sz}" markerHeight="${sz}" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="${c}"/></marker>`;

async function observations() {
  if (!$("#cp-bandes")) return;
  let D; try { D = await fetch("data/climat_obs.json", { cache: "no-cache" }).then(r => r.json()); } catch (e) { return; }
  const TH = window.TH;
  // bandes de réchauffement
  const band = (rows, label, lo, hi) => { const W = 900, h = 46, y0 = 1850, y1 = 2025, bw = W / (y1 - y0 + 1); const col = d3.scaleDiverging([lo, 0, hi], t => d3.interpolateRdBu(1 - t));
    return `<div style="font-size:.8rem;color:#475569;margin:6px 0 2px"><b>${label}</b></div><svg viewBox="0 0 ${W} ${h}" width="100%" preserveAspectRatio="none" style="display:block">${rows.map(([y, v]) => `<rect x="${(y - y0) * bw}" y="0" width="${bw + .5}" height="${h}" fill="${col(v)}"><title>${y} : ${v > 0 ? "+" : ""}${fr(v, 2)} °C</title></rect>`).join("")}</svg>`; };
  $("#cp-bandes").innerHTML = band(D.global, "Monde", -0.9, 1.6) + band(D.france, "France (terres)", -1.6, 2.4) + `<div style="display:flex;justify-content:space-between;font-size:.72rem;color:#64748b"><span>1850</span><span>1900</span><span>1950</span><span>2000</span><span>2024</span></div>`;
  const g = D.global.map(([annee, v], i, a) => ({ annee, v, m: mm(a.map(r => r[1]), 10)[i] }));
  TH.lineChart($("#cp-o-temp"), g, [{ k: "v", l: "Année", c: "#fca5a5" }, { k: "m", l: "Moyenne sur 10 ans", c: "#dc2626" }], { yfmt: v => (v > 0 ? "+" : "") + v + " °C", vfmt: v => fr(v, 2) + " °C", h: 220 });
  TH.lineChart($("#cp-o-co2"), D.co2.map(([annee, v]) => ({ annee, v })), [{ k: "v", l: "CO₂", c: "#111827" }], { yfmt: v => v + " ppm", vfmt: v => fr(v, 1) + " ppm", h: 220, nozero: true });
  TH.lineChart($("#cp-o-mer"), D.mer.map(([annee, a, b]) => ({ annee, a, b })), [{ k: "a", l: "Reconstruction (marégraphes, CSIRO)", c: "#0ea5e9" }, { k: "b", l: "Satellites (NOAA)", c: "#1d4ed8" }], { yfmt: v => v + " cm", vfmt: v => fr(v, 1) + " cm", h: 220 });
  TH.lineChart($("#cp-o-glac"), D.glaciers.map(([annee, v]) => ({ annee, v })), [{ k: "v", l: "Bilan de masse cumulé", c: "#0891b2" }], { yfmt: v => v + " m", vfmt: v => fr(v, 1) + " m d'eau", h: 220 });
  const last = a => a[a.length - 1], t10 = D.global.filter(r => r[0] >= 2015 && r[0] <= 2024).reduce((s, r) => s + r[1], 0) / 10;
  TH.kpis("#cp-o-kpis", [[`+${fr(t10, 1)} °C`, ["moyenne 2015-2024", "par rapport à 1850-1900"], "Température mondiale"], [`${fr(last(D.co2)[1])} ppm`, [`en ${last(D.co2)[0]}`, `+${fr((last(D.co2)[1] / 280 - 1) * 100)} % depuis 1850`], "CO₂"], [`+${fr(last(D.mer)[2], 0)} cm`, [`depuis 1880 (${last(D.mer)[0]})`, "environ 4 mm par an aujourd'hui"], "Niveau des mers"], [`${fr(last(D.glaciers)[1], 0)} m`, ["d'équivalent eau depuis 1956", "glaciers de référence"], "Glaciers"]]);
  $("#cp-o-src").textContent = "Sources : " + Object.values(D.sources).join(" ; ") + ".";
  // température contre CO2
  const gT = Object.fromEntries(D.global), pts = D.co2.filter(([y]) => gT[y] != null).map(([y, c]) => [y, Math.log(c / 280), gT[y], c]);
  const n = pts.length, mx = d3.mean(pts, p => p[1]), my = d3.mean(pts, p => p[2]), b = d3.sum(pts, p => (p[1] - mx) * (p[2] - my)) / d3.sum(pts, p => (p[1] - mx) ** 2), a = my - b * mx;
  { const W = 900, H = 300, m = { l: 50, r: 20, t: 12, b: 36 }, xs = d3.scaleLinear([310, 440], [m.l, W - m.r]), ys = d3.scaleLinear([-0.2, 1.8], [H - m.b, m.t]), cy = d3.scaleSequential([1959, 2025], d3.interpolateViridis);
    let s = `<svg viewBox="0 0 ${W} ${H}" width="100%" style="font-size:10.5px">`;
    ys.ticks(5).forEach(v => s += `<line x1="${m.l}" x2="${W - m.r}" y1="${ys(v)}" y2="${ys(v)}" stroke="#eef2f7"/><text x="${m.l - 5}" y="${ys(v) + 3}" text-anchor="end" fill="#64748b">${v > 0 ? "+" : ""}${fr(v, 1)} °C</text>`);
    xs.ticks(7).forEach(v => s += `<text x="${xs(v)}" y="${H - 18}" text-anchor="middle" fill="#64748b">${v} ppm</text>`);
    s += `<line x1="${xs(310)}" y1="${ys(a + b * Math.log(310 / 280))}" x2="${xs(440)}" y2="${ys(a + b * Math.log(440 / 280))}" stroke="#dc2626" stroke-width="2" stroke-dasharray="6 4"/>`;
    pts.forEach(([y, , t, c]) => s += `<circle cx="${xs(c)}" cy="${ys(t)}" r="4.5" fill="${cy(y)}" opacity=".85"><title>${y} : ${fr(c, 1)} ppm, ${fr(t, 2)} °C</title></circle>`);
    s += `<text x="${W - m.r}" y="${H - 4}" text-anchor="end" fill="#64748b">couleur : année (violet 1959 → jaune ${pts[n - 1][0]})</text>`;
    $("#cp-nuage").innerHTML = s + "</svg>";
    $("#cp-nuage-txt").innerHTML = `Les points s'alignent sur une droite en fonction du logarithme de la concentration (pointillés rouges) : pente de ${fr(b * Math.log(2), 1)} °C par doublement. C'est une « réponse apparente » qui mélange l'effet du CO₂, des autres gaz (qui ont augmenté en même temps), des aérosols (qui refroidissent) et le retard de l'océan : elle ne mesure pas directement la sensibilité, mais montre que l'ordre de grandeur de la théorie (partie 8) est cohérent avec les mesures.`;
  }
  // jour / nuit
  const tm = D.tmaxmin, mx10 = mm(tm.map(r => r[1]), 10), mn10 = mm(tm.map(r => r[2]), 10);
  TH.lineChart($("#cp-journuit"), tm.map((r, i) => ({ annee: r[0], x: mx10[i], n: mn10[i] })), [{ k: "x", l: "Maximales (jour)", c: "#f59e0b" }, { k: "n", l: "Minimales (nuit)", c: "#1e3a8a" }], { yfmt: v => (v > 0 ? "+" : "") + v + " °C", vfmt: v => fr(v, 2) + " °C", h: 230 });
  $("#cp-journuit").insertAdjacentHTML("beforeend", `<div class="legend-row"><span><i style="border-top-color:#f59e0b;opacity:1"></i>Maximales (jour)</span><span><i style="border-top-color:#1e3a8a;opacity:1"></i>Minimales (nuit)</span></div><p class="muted" style="font-size:.8rem;margin:2px 0 0">Source : Berkeley Earth. Tendance 1900-2023 : nuits +1,6 °C par siècle, jours +1,1 °C par siècle ; depuis 1980, les jours se réchauffent plus vite (baisse de la pollution par les aérosols).</p>`);
}

/* schéma simple de l'effet de serre */
function schema() {
  const el = $("#cp-schema"); if (!el) return;
  const W = 900, H = 380;
  const A = (x1, y1, x2, y2, c, w, t, tx, ty, anchor = "middle") => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${c}" stroke-width="${w}" marker-end="url(#ah-${c.slice(1)})" opacity=".85"/><text x="${tx}" y="${ty}" text-anchor="${anchor}" fill="${c}" font-weight="700" font-size="12">${t}</text>`;
  let s = `<svg viewBox="0 0 ${W} ${H}" width="100%" style="font-size:11.5px"><defs>${["f59e0b", "60a5fa", "dc2626", "7c3aed", "0ea5e9"].map(c => arrow("ah-" + c, "#" + c, 26)).join("")}</defs>`;
  s += `<rect x="0" y="0" width="${W}" height="70" fill="#0f172a"/><text x="12" y="20" fill="#e2e8f0" font-weight="700">ESPACE</text><circle cx="70" cy="44" r="22" fill="#fbbf24"/><text x="100" y="48" fill="#fde68a">Soleil</text>`;
  s += `<rect x="0" y="70" width="${W}" height="190" fill="#dbeafe"/><text x="12" y="92" fill="#1e40af" font-weight="700">ATMOSPHÈRE (gaz à effet de serre, nuages)</text>`;
  s += `<rect x="0" y="260" width="${W}" height="120" fill="#bbf7d0"/><rect x="0" y="320" width="${W}" height="60" fill="#86efac"/><text x="12" y="372" fill="#166534" font-weight="700">SURFACE (terres, océans) : 15 °C</text>`;
  s += A(150, 40, 150, 250, "#f59e0b", 14, "340 reçus", 150, 120);
  s += A(210, 240, 250, 30, "#60a5fa", 7, "100 réfléchis", 285, 120);
  s += A(140, 160, 70, 175, "#f59e0b", 5, "80 absorbés par l'air", 75, 200, "start");
  s += `<text x="150" y="290" text-anchor="middle" fill="#b45309" font-weight="700" font-size="12">160 absorbés par la surface</text>`;
  s += A(470, 300, 470, 90, "#dc2626", 16, "398 émis par la surface (infrarouge)", 470, 300 + 4 - 220, "middle");
  s += A(560, 90, 560, 255, "#7c3aed", 14, "342 renvoyés vers le sol", 560, 275, "middle");
  s += A(740, 110, 740, 20, "#dc2626", 10, "239 vers l'espace", 760, 125, "start");
  s += A(380, 300, 380, 140, "#0ea5e9", 6, "82 évaporation", 330, 160, "end");
  s += A(410, 300, 410, 190, "#0ea5e9", 3, "21 convection", 330, 210, "end");
  s += `<text x="640" y="300" fill="#166534" font-size="12">Bilan de la surface : reçoit 160 + 342 = 502 ;</text><text x="640" y="316" fill="#166534" font-size="12">perd 398 + 82 + 21 = 501 (+ 0,7 stocké)</text>`;
  el.innerHTML = s + `</svg><p class="muted" style="font-size:.8rem;margin:4px 0 0">Le point clé : la surface reçoit plus d'énergie de l'atmosphère (342) que du Soleil (160). C'est ce « rayonnement de retour » qui la maintient à 15 °C au lieu de −18 °C. Ajouter des gaz à effet de serre l'augmente.</p>`;
}

/* altitude d'émission : trois étapes */
const ETAPES = [
  { ts: 291, ze: 5.5, out: 240, t: "<b>① Équilibre</b> : la Terre rayonne vers l'espace depuis une altitude moyenne d'environ 5,5 km, où il fait 255 K (−18 °C). En dessous, la température augmente de 6,5 °C par km jusqu'au sol (291 K dans ce modèle simple, proche des 288 K réels). Le flux sortant (240 W/m²) égale le flux solaire absorbé." },
  { ts: 291, ze: 5.65, out: 236.3, t: "<b>② On double le CO₂</b> : l'air devient plus opaque à l'infrarouge, le rayonnement ne s'échappe plus que d'un peu plus haut (≈ +150 m). Là, il fait 1 °C plus froid : la Terre émet moins (≈ 3,7 W/m² de moins, c'est le <b>forçage</b>). Elle reçoit toujours 240 W/m² : elle accumule de l'énergie." },
  { ts: 292, ze: 5.65, out: 240, t: "<b>③ Nouvel équilibre</b> : toute la colonne d'air se réchauffe jusqu'à ce que la nouvelle altitude d'émission retrouve 255 K. La surface a gagné environ <b>1 °C</b>. C'est le réchauffement « sans rétroactions » ; la vapeur d'eau, la glace et les nuages l'amplifient jusqu'à environ 3 °C (partie 8)." }];
function altitude(k) {
  const el = $("#cp-altitude"); if (!el) return;
  const E = ETAPES[k], W = 900, H = 340, m = { l: 60, r: 250, t: 14, b: 36 }, x = d3.scaleLinear([215, 300], [m.l, W - m.r]), y = d3.scaleLinear([0, 12], [H - m.b, m.t]);
  const prof = ts => d3.range(0, 11.01, .5).map(z => [ts - 6.5 * z, z]);
  let s = `<svg viewBox="0 0 ${W} ${H}" width="100%" style="font-size:11px"><defs>${arrow("ahr", "#dc2626", 22)}</defs>`;
  y.ticks(6).forEach(v => s += `<line x1="${m.l}" x2="${W - m.r}" y1="${y(v)}" y2="${y(v)}" stroke="#eef2f7"/><text x="${m.l - 6}" y="${y(v) + 3}" text-anchor="end" fill="#64748b">${v} km</text>`);
  x.ticks(8).forEach(v => s += `<text x="${x(v)}" y="${H - 16}" text-anchor="middle" fill="#64748b">${v} K</text>`);
  s += `<text x="${(m.l + W - m.r) / 2}" y="${H - 2}" text-anchor="middle" fill="#64748b">température de l'air</text>`;
  if (k > 0) s += `<polyline points="${prof(291).map(([t, z]) => `${x(t)},${y(z)}`).join(" ")}" fill="none" stroke="#94a3b8" stroke-width="1.5" stroke-dasharray="4 4"/>`;
  s += `<polyline points="${prof(E.ts).map(([t, z]) => `${x(t)},${y(z)}`).join(" ")}" fill="none" stroke="#111827" stroke-width="2.4"/>`;
  const te = E.ts - 6.5 * E.ze;
  s += `<line x1="${m.l}" x2="${W - m.r}" y1="${y(E.ze)}" y2="${y(E.ze)}" stroke="#dc2626" stroke-dasharray="6 4"/><circle cx="${x(te)}" cy="${y(E.ze)}" r="6" fill="#dc2626"/><text x="${x(te) + 10}" y="${y(E.ze) - 8}" fill="#dc2626" font-weight="700">altitude d'émission ${fr(E.ze, 2)} km : ${fr(te, 1)} K</text>`;
  s += `<line x1="${x(te)}" y1="${y(E.ze) - 10}" x2="${x(te)}" y2="${y(11.6)}" stroke="#dc2626" stroke-width="${E.out / 18}" marker-end="url(#ahr)" opacity=".6"/>`;
  s += `<circle cx="${x(E.ts)}" cy="${y(0)}" r="6" fill="#16a34a"/><text x="${x(E.ts) + 10}" y="${y(0) - 8}" fill="#16a34a" font-weight="700">surface ${fr(E.ts)} K</text>`;
  const bx = W - m.r + 20;
  s += `<rect x="${bx}" y="40" width="210" height="140" rx="8" fill="#f8fafc" stroke="#e2e8f0"/><text x="${bx + 12}" y="64" font-weight="700">Bilan au sommet</text><text x="${bx + 12}" y="88">reçu du Soleil : 240 W/m²</text><text x="${bx + 12}" y="110" fill="#dc2626">émis vers l'espace : ${fr(E.out, 1)} W/m²</text><text x="${bx + 12}" y="140" font-weight="700" fill="${E.out < 240 ? "#dc2626" : "#16a34a"}">${E.out < 240 ? "déséquilibre : +" + fr(240 - E.out, 1) + " W/m²" : "équilibre"}</text><text x="${bx + 12}" y="162" fill="#64748b">${E.out < 240 ? "→ la Terre se réchauffe" : ""}</text>`;
  el.innerHTML = s + "</svg>"; $("#cp-altitude-txt").innerHTML = `<p>${E.t}</p>`;
}

/* boucle de rétroactions */
function boucle() {
  const el = $("#cp-boucle"); if (!el) return;
  const W = 900, H = 350;
  const box = (x, y, w, h, c, t1, t2) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" fill="${c}" opacity=".15" stroke="${c}"/><text x="${x + w / 2}" y="${y + h / 2 - 3}" text-anchor="middle" font-weight="700" fill="${c}">${t1}</text><text x="${x + w / 2}" y="${y + h / 2 + 14}" text-anchor="middle" fill="#334155" font-size="10.5">${t2}</text>`;
  const curve = (x1, y1, x2, y2, bend, c) => `<path d="M${x1},${y1} Q${(x1 + x2) / 2 + bend},${(y1 + y2) / 2 - Math.abs(bend)} ${x2},${y2}" fill="none" stroke="${c}" stroke-width="2.2" marker-end="url(#ab-${c.slice(1)})"/>`;
  let s = `<svg viewBox="0 0 ${W} ${H}" width="100%" style="font-size:11.5px"><defs>${["dc2626", "2563eb", "111827", "f59e0b"].map(c => arrow("ab-" + c, "#" + c)).join("")}</defs>`;
  s += box(20, 135, 170, 60, "#111827", "CO₂ × 2", "forçage +3,9 W/m²");
  s += box(360, 135, 180, 60, "#dc2626", "Réchauffement ΔT", "de la surface");
  s += box(330, 10, 240, 56, "#dc2626", "+ vapeur d'eau (+7 %/°C)", "+1,30 W/m² par °C");
  s += box(620, 70, 260, 56, "#dc2626", "− neige et glace : sol plus sombre", "+0,35 W/m² par °C");
  s += box(620, 200, 260, 56, "#f59e0b", "nuages (le plus incertain)", "+0,42 W/m² par °C");
  s += box(330, 262, 240, 56, "#2563eb", "Terre plus chaude rayonne plus", "−3,22 W/m² par °C (Planck)");
  s += `<line x1="190" y1="165" x2="355" y2="165" stroke="#111827" stroke-width="3" marker-end="url(#ab-111827)"/>`;
  s += curve(450, 133, 450, 70, -60, "#dc2626") + curve(500, 66, 500, 133, 60, "#dc2626");
  s += curve(542, 150, 618, 100, 0, "#dc2626") + curve(618, 112, 542, 168, 0, "#dc2626");
  s += curve(542, 175, 618, 225, 0, "#f59e0b") + curve(618, 238, 542, 188, 0, "#f59e0b");
  s += curve(430, 197, 430, 260, -50, "#2563eb") + curve(480, 260, 480, 197, 50, "#2563eb");
  s += `<text x="20" y="250" fill="#334155" font-size="11"><tspan x="20" dy="0">Rouge : amplifie</tspan><tspan x="20" dy="16">Bleu : freine</tspan><tspan x="20" dy="22" font-weight="700">Sans amplification : +1,2 °C</tspan><tspan x="20" dy="16" font-weight="700">Avec : ≈ +3 °C (× 2,5 à 3)</tspan></text>`;
  el.innerHTML = s + "</svg>";
}

/* confiance du GIEC : matrice preuves × accord */
function matrice() {
  const el = $("#cp-matrice"); if (!el) return;
  const W = 420, H = 300, m = { l: 70, b: 50, t: 10, r: 10 }, cw = (W - m.l - m.r) / 3, ch = (H - m.t - m.b) / 3;
  const lv = ["faible", "moyenne", "élevée", "très élevée"], c = ["#fee2e2", "#fde68a", "#bbf7d0", "#4ade80"];
  let s = `<svg viewBox="0 0 ${W} ${H}" width="100%" style="font-size:10.5px">`;
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) { const k = Math.min(3, Math.round((i + j) * 0.75)); s += `<rect x="${m.l + i * cw}" y="${m.t + (2 - j) * ch}" width="${cw - 3}" height="${ch - 3}" rx="6" fill="${c[k]}"/><text x="${m.l + i * cw + cw / 2}" y="${m.t + (2 - j) * ch + ch / 2 + 4}" text-anchor="middle" fill="#334155">confiance ${lv[k]}</text>`; }
  ["limitées", "moyennes", "solides"].forEach((t, i) => s += `<text x="${m.l + i * cw + cw / 2}" y="${H - m.b + 16}" text-anchor="middle" fill="#64748b">${t}</text>`);
  s += `<text x="${m.l + 1.5 * cw}" y="${H - 10}" text-anchor="middle" font-weight="700" fill="#475569">Preuves (quantité, qualité, cohérence) →</text>`;
  ["faible", "moyen", "fort"].forEach((t, j) => s += `<text x="${m.l - 6}" y="${m.t + (2 - j) * ch + ch / 2 + 4}" text-anchor="end" fill="#64748b">${t}</text>`);
  s += `<text transform="translate(14,${m.t + 1.5 * ch}) rotate(-90)" text-anchor="middle" font-weight="700" fill="#475569">Accord entre études →</text>`;
  el.innerHTML = s + "</svg>";
}

function scenarios() {
  const el = $("#cp-scenarios"); if (!el) return;
  const S = [["SSP1-1.9 : neutralité carbone vers 2050", 1.4, 1.0, 1.8, "#16a34a"], ["SSP1-2.6 : neutralité vers 2070", 1.8, 1.3, 2.4, "#65a30d"], ["SSP2-4.5 : poursuite des politiques actuelles (environ)", 2.7, 2.1, 3.5, "#f59e0b"], ["SSP3-7.0 : émissions doublées en 2100", 3.6, 2.8, 4.6, "#ea580c"], ["SSP5-8.5 : émissions très élevées", 4.4, 3.3, 5.7, "#b91c1c"]];
  const W = 900, H = 230, m = { l: 330, r: 20, t: 10, b: 30 }, x = d3.scaleLinear([0, 7], [m.l, W - m.r]), rh = (H - m.t - m.b) / S.length;
  let s = `<svg viewBox="0 0 ${W} ${H}" width="100%" style="font-size:11px">`;
  [0, 1, 2, 3, 4, 5, 6, 7].forEach(v => s += `<line x1="${x(v)}" x2="${x(v)}" y1="${m.t}" y2="${H - m.b}" stroke="#eef2f7"/><text x="${x(v)}" y="${H - 12}" text-anchor="middle" fill="#64748b">+${v} °C</text>`);
  [1.5, 2].forEach(v => s += `<line x1="${x(v)}" x2="${x(v)}" y1="${m.t}" y2="${H - m.b}" stroke="#475569" stroke-dasharray="4 3"/><text x="${x(v) + 3}" y="${m.t + 9}" fill="#475569" font-size="9.5">${String(v).replace(".", ",")} °C (Accord de Paris)</text>`);
  S.forEach(([l, b, lo, hi, c], i) => { const y = m.t + i * rh + rh / 2; s += `<text x="${m.l - 8}" y="${y + 4}" text-anchor="end" fill="currentColor">${l}</text><line x1="${x(lo)}" x2="${x(hi)}" y1="${y}" y2="${y}" stroke="${c}" stroke-width="10" stroke-linecap="round" opacity=".45"/><circle cx="${x(b)}" cy="${y}" r="6" fill="${c}"/><text x="${x(hi) + 10}" y="${y + 4}" fill="${c}" font-weight="700">${fr(b, 1)} °C (${fr(lo, 1)} à ${fr(hi, 1)})</text>`; });
  el.innerHTML = s + "</svg>";
}

function budget() {
  const el = $("#cp-budget"); if (!el) return;
  window.TH.bars(el, [{ l: "Déjà émis entre 1850 et 2019", v: 2390, t: "2 390 GtCO₂", c: "#111827" }, { l: "Reste pour 2 °C (67 % de chances)", v: 1150, t: "1 150 GtCO₂ ≈ 29 ans d'émissions actuelles", c: "#f59e0b" }, { l: "Reste pour 1,7 °C (50 %)", v: 850, t: "850 GtCO₂ ≈ 21 ans", c: "#fb923c" }, { l: "Reste pour 1,5 °C (50 %)", v: 500, t: "500 GtCO₂ ≈ 12 ans", c: "#dc2626" }, { l: "Émissions mondiales d'une année", v: 40, t: "≈ 40 GtCO₂", c: "#64748b" }]);
}

/* cycles de Milankovitch : trois schémas */
function milanko() {
  const el = $("#cp-milanko"); if (!el) return;
  const W = 900, H = 250;
  let s = `<svg viewBox="0 0 ${W} ${H}" width="100%" style="font-size:11px">`;
  // excentricité
  s += `<text x="150" y="18" text-anchor="middle" font-weight="700">① Excentricité</text><ellipse cx="150" cy="120" rx="110" ry="75" fill="none" stroke="#94a3b8" stroke-dasharray="4 3"/><ellipse cx="150" cy="120" rx="110" ry="100" fill="none" stroke="#2563eb"/><circle cx="182" cy="120" r="12" fill="#fbbf24"/><circle cx="40" cy="120" r="7" fill="#3b82f6"/><text x="150" y="235" text-anchor="middle" fill="#475569">orbite plus ou moins allongée</text><text x="150" y="250" text-anchor="middle" fill="#64748b">≈ 100 000 et 405 000 ans</text>`;
  // obliquité
  s += `<text x="450" y="18" text-anchor="middle" font-weight="700">② Obliquité</text><circle cx="450" cy="125" r="62" fill="#bfdbfe" stroke="#2563eb"/><line x1="380" y1="125" x2="520" y2="125" stroke="#64748b" stroke-dasharray="3 3"/>`;
  [[22.1, "#94a3b8"], [24.5, "#94a3b8"], [23.44, "#dc2626"]].forEach(([a, c]) => { const r = a * Math.PI / 180, dx = Math.sin(r) * 95, dy = Math.cos(r) * 95; s += `<line x1="${450 - dx}" y1="${125 + dy}" x2="${450 + dx}" y2="${125 - dy}" stroke="${c}" stroke-width="${c === "#dc2626" ? 2.5 : 1.2}"/>`; });
  s += `<line x1="450" y1="20" x2="450" y2="230" stroke="#cbd5e1"/><text x="510" y="40" fill="#dc2626">23,44° aujourd'hui</text><text x="510" y="56" fill="#64748b">entre 22,1° et 24,5°</text><text x="450" y="235" text-anchor="middle" fill="#475569">inclinaison de l'axe</text><text x="450" y="250" text-anchor="middle" fill="#64748b">≈ 41 000 ans</text>`;
  // précession
  s += `<text x="750" y="18" text-anchor="middle" font-weight="700">③ Précession</text><ellipse cx="750" cy="60" rx="45" ry="12" fill="none" stroke="#7c3aed" stroke-dasharray="4 3"/><line x1="750" y1="200" x2="790" y2="60" stroke="#7c3aed" stroke-width="2"/><line x1="750" y1="200" x2="710" y2="60" stroke="#c4b5fd" stroke-width="1.5" stroke-dasharray="3 3"/><circle cx="750" cy="160" r="40" fill="#bfdbfe" stroke="#2563eb"/><path d="M 795 52 q 10 4 6 14" fill="none" stroke="#7c3aed" stroke-width="2" marker-end="url(#ap)"/><defs>${arrow("ap", "#7c3aed")}</defs><text x="750" y="235" text-anchor="middle" fill="#475569">l'axe tourne comme une toupie</text><text x="750" y="250" text-anchor="middle" fill="#64748b">≈ 19 000 à 23 000 ans</text>`;
  el.innerHTML = s + `</svg><p class="muted" style="font-size:.8rem;margin:4px 0 0">Schémas, proportions exagérées (l'orbite réelle est presque circulaire : excentricité 0,0167).</p>`;
}

function init() {
  if (!window.TH || !window.d3) { setTimeout(init, 100); return; }
  if (!$("#climat-physique")) return;
  const run = f => { try { const r = f(); if (r?.catch) r.catch(e => console.error(f.name, e)); } catch (e) { console.error(f.name, e); } };
  [observations, schema, boucle, matrice, scenarios, budget, milanko].forEach(run);
  run(() => altitude(0));
  document.querySelectorAll(".cp-et").forEach(b => b.addEventListener("click", () => { document.querySelectorAll(".cp-et").forEach(x => x.classList.toggle("on", x === b)); altitude(+b.dataset.e); }));
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
