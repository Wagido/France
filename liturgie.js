/* L'année chrétienne : frise du calendrier liturgique */
(() => {
"use strict";
const $ = s => document.querySelector(s);
const MOIS = ["janv.", "févr.", "mars", "avril", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
const fmt = d => `${d.getUTCDate()} ${MOIS[d.getUTCMonth()]}`;
const D = (y, m, d) => new Date(Date.UTC(y, m - 1, d));
const add = (d, n) => new Date(d.getTime() + n * 86400000);
function paques(y) { // algorithme grégorien (Meeus)
  const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451), mo = Math.floor((h + l - 7 * m + 114) / 31), da = (h + l - 7 * m + 114) % 31 + 1;
  return D(y, mo, da);
}
function paquesOrth(y) { // julien + 13 jours (1900-2099)
  const a = y % 4, b = y % 7, c = y % 19, d = (19 * c + 15) % 30, e = (2 * a + 4 * b - d + 34) % 7, mo = Math.floor((d + e + 114) / 31), da = (d + e + 114) % 31 + 1;
  return add(D(y, mo, da), 13);
}
function avent1(y) { const n = D(y, 12, 25), w = n.getUTCDay(); return add(n, -(w === 0 ? 7 : w) - 21); }
function frise() {
  const el = $("#cr-an"); if (!el) return;
  const y = +$("#cr-an-y").value, P = paques(y), Av = avent1(y), start = D(y, 1, 1), end = D(y, 12, 31);
  const W = 900, H = 400, m = { l: 14, r: 14 }, x = d => m.l + (d - start) / (end - start + 86400000) * (W - m.l - m.r), by = 150, bh = 26;
  const V = "#7c3aed", B = "#eab308", R = "#dc2626", G = "#16a34a";
  // périodes colorées
  const per = [[start, D(y, 1, 6), B, "temps de Noël"], [add(D(y, 1, 6), 1), add(P, -47), G, "temps ordinaire"], [add(P, -46), add(P, -8), V, "Carême"], [add(P, -7), add(P, -1), R, "Semaine sainte"], [P, add(P, 49), B, "temps pascal"], [add(P, 50), add(Av, -1), G, "temps ordinaire"], [Av, D(y, 12, 24), V, "Avent"], [D(y, 12, 25), end, B, "Noël"]];
  let s = `<svg viewBox="0 0 ${W} ${H}" width="100%" style="font-size:10.5px">`;
  per.forEach(([a, b, c, l]) => { const x1 = x(a), x2 = x(add(b, 1)); s += `<rect x="${x1}" y="${by}" width="${Math.max(1, x2 - x1)}" height="${bh}" fill="${c}" opacity="${c === B ? .75 : .8}"/>`; if (x2 - x1 > 46) s += `<text x="${(x1 + x2) / 2}" y="${by + 17}" text-anchor="middle" style="fill:#fff" font-weight="700">${l}</text>`; });
  for (let mo = 0; mo < 12; mo++) { const d = D(y, mo + 1, 1); s += `<line x1="${x(d)}" x2="${x(d)}" y1="${by + bh}" y2="${by + bh + 6}" stroke="#94a3b8"/><text x="${x(add(d, 15))}" y="${by + bh + 18}" text-anchor="middle" style="fill:#64748b">${MOIS[mo]}</text>`; }
  // fêtes
  const F = [[D(y, 1, 6), "Épiphanie", B], [D(y, 2, 2), "Chandeleur", B], [add(P, -47), "Mardi gras", G], [add(P, -46), "Cendres", V], [add(P, -7), "Rameaux", R], [add(P, -2), "Jeudi et Vendredi saints", R], [P, "PÂQUES", B], [add(P, 39), "Ascension", B], [add(P, 49), "Pentecôte", R], [add(P, 56), "Trinité", G], [D(y, 8, 15), "Assomption", B], [D(y, 11, 1), "Toussaint", B], [add(Av, -7), "Christ-Roi", B], [Av, "1ᵉʳ dim. de l'Avent", V], [D(y, 12, 25), "NOËL", B]];
  F.sort((a, b) => a[0] - b[0]);
  F.forEach(([d, l, c], k) => {
    const X = x(d), up = k % 2 === 0, lv = Math.floor(k / 2) % 3, ty = up ? by - 16 - lv * 34 : by + bh + 40 + lv * 34, big = l === l.toUpperCase();
    s += `<line x1="${X}" x2="${X}" y1="${up ? ty + 10 : by + bh}" y2="${up ? by : ty - 22}" stroke="${c === B ? "#a16207" : c}" stroke-width="1"/><circle cx="${X}" cy="${up ? by : by + bh}" r="${big ? 5 : 3.5}" fill="${c === B ? "#a16207" : c}"/>`;
    s += `<text x="${X}" y="${ty - (up ? 0 : 10)}" text-anchor="${X < 60 ? "start" : X > W - 60 ? "end" : "middle"}" font-weight="${big ? 800 : 600}" style="fill:${c === B ? "#a16207" : c}">${l}</text><text x="${X}" y="${ty + (up ? 12 : 2)}" text-anchor="${X < 60 ? "start" : X > W - 60 ? "end" : "middle"}" style="fill:#64748b" font-size="9.5">${fmt(d)}</text>`;
  });
  // accolades 40 et 50 jours
  const brace = (a, b, yy, t, c) => `<path d="M${x(a)},${yy} v-6 H${x(b)} v6" fill="none" stroke="${c}" stroke-width="1.5"/><text x="${(x(a) + x(b)) / 2}" y="${yy - 9}" text-anchor="middle" style="fill:${c}" font-weight="700" font-size="10">${t}</text>`;
  s += brace(add(P, -46), add(P, -1), H - 46, "Carême : 40 jours (+ 6 dimanches)", V) + brace(P, add(P, 39), H - 46, "40 jours → Ascension", "#a16207") + brace(P, add(P, 49), H - 14, "50 jours → Pentecôte", "#a16207");
  el.innerHTML = s + "</svg>";
  const O = paquesOrth(y), diff = Math.round((O - P) / 86400000);
  $("#cr-an-txt").innerHTML = `En ${y}, Pâques tombe le <b>${fmt(P)}</b> ; le Carême commence le ${fmt(add(P, -46))} (mercredi des Cendres), l'Ascension est le jeudi ${fmt(add(P, 39))}, la Pentecôte le ${fmt(add(P, 49))}. Pâques orthodoxe : ${fmt(O)} (${diff === 0 ? "le même jour cette année" : diff + " jours plus tard"}). L'année liturgique ${y}-${y + 1} commence le ${fmt(Av)}`.replace(/\.\.$/, ".") + (fmt(Av).endsWith(".") ? "" : ".");
}
function init() {
  if (!$("#cr-an")) return;
  const S = $("#cr-an-y"), now = new Date().getFullYear();
  S.innerHTML = Array.from({ length: 11 }, (_, k) => now - 2 + k).map(v => `<option value="${v}"${v === now ? " selected" : ""}>${v}</option>`).join("");
  S.addEventListener("change", frise);
  try { frise(); } catch (e) { console.error("frise liturgique", e); }
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
