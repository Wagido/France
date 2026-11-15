/* Agriculture : ce qu'on cultive en France, part du bio par culture, évolution, comparaison européenne */
(() => {
"use strict";
let A = null;
const $ = s => document.querySelector(s);
async function init() {
  if (!window.TH) { setTimeout(init, 100); return; }
  try { A = await fetch("data/agriculture.json").then(r => r.json()); } catch (e) { return; }
  let rt; addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(draw, 150); });
  draw();
}
const f1 = v => v == null ? "–" : v.toLocaleString("fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const n0 = v => Math.round(v).toLocaleString("fr-FR");
const mha = v => (v / 1e6).toLocaleString("fr-FR", { maximumFractionDigits: v >= 1e6 ? 1 : 2 }) + " M ha";
const kha = v => v >= 1e6 ? mha(v) : n0(v / 1000) + " 000 ha";
function draw() {
  if (!A || !$("#ag-cult")) return;
  const { kpis, lineChart, legend, esc, css } = window.TH;
  const C = A.cultures, sau = A.sau, mx = Math.max(...C.map(c => c.ha)), B = A.bio.at(-1), B0 = A.bio[0];
  // 1. barres par culture, part bio en vert
  $("#ag-cult").innerHTML = `<div class="ag-row ag-head"><span>Culture</span><span>Surface ${A.annee} (en vert : part en bio, ${A.annee_bio})</span><span class="num">Part de la surface agricole</span></div>` +
    C.map(c => {
      const w = 100 * c.ha / mx, wb = c.bio_pc != null ? w * c.bio_pc / 100 : 0;
      return `<div class="ag-row"><span class="lab"><i style="background:${c.c}"></i>${esc(c.l)}</span>
        <span class="tr"><span class="ag-bar" style="width:${w.toFixed(1)}%;background:${c.c}"><span style="width:${(c.bio_pc ?? 0)}%"></span></span><b>${kha(c.ha)}</b>${c.bio_pc != null ? `<small class="ag-bio">${f1(c.bio_pc)} % bio</small>` : ""}</span>
        <span class="num">${f1(100 * c.ha / sau)} %</span></div>`;
    }).join("");
  // 2. évolution
  lineChart($("#ag-evol"), A.evol, [{ k: "prairies", l: "Prairies permanentes", c: "#65a30d" }, { k: "cereales", l: "Céréales", c: "#eab308" }, { k: "fourrages", l: "Fourrages", c: "#a3e635" },
    { k: "oleagineux", l: "Oléagineux", c: "#f59e0b" }, { k: "proteagineux", l: "Protéagineux", c: "#14b8a6" }], { vfmt: v => f1(v) + " M ha", yfmt: v => v + " M", h: 280 });
  legend("#ag-evol-legend", [["Prairies permanentes", "#65a30d"], ["Céréales", "#eab308"], ["Fourrages", "#a3e635"], ["Oléagineux", "#f59e0b"], ["Légumes secs et protéagineux", "#14b8a6"]]);
  // 3. bio
  lineChart($("#ag-bio"), A.bio, [{ k: "pc", l: "Part de la surface agricole en bio", c: "#16a34a" }], { vfmt: v => f1(v) + " %", yfmt: v => v + " %", h: 240 });
  legend("#ag-bio-legend", [["Part de la surface agricole en bio ou en conversion", "#16a34a"]]);
  // 4. pays : prairies et céréales
  const P = [...A.pays].sort((a, b) => b.prairies - a.prairies);
  $("#ag-pays").innerHTML = `<div class="tv-row tv-head lg-row"><span>Pays</span><span>Part de la surface agricole en prairies permanentes</span><span>en céréales</span></div>` +
    P.map(p => `<div class="tv-row lg-row${p.code === "FR" ? " me" : ""}${p.code === "EU27_2020" ? " ue" : ""}"><span class="lab">${esc(p.nom)}</span>
      <span class="tr"><span class="bar" style="width:${p.prairies}%;background:${p.code === "FR" ? "#dc2626" : p.code === "EU27_2020" ? "var(--ink)" : "#65a30d"}"></span><b>${f1(p.prairies)} %</b></span>
      <span class="tr"><span class="bar" style="width:${p.cereales}%;background:${p.code === "FR" ? "#dc2626" : p.code === "EU27_2020" ? "var(--ink)" : "#eab308"}"></span><b>${f1(p.cereales)} %</b></span></div>`).join("");
  const g = k => C.find(c => c.k === k), fr = A.pays.find(p => p.code === "FR"), ue = A.pays.find(p => p.code === "EU27_2020");
  const ue_s = A.pays.filter(p => p.code !== "EU27_2020"), rgS = [...ue_s].sort((a, b) => b.surface - a.surface).findIndex(p => p.code === "FR") + 1;
  const elev = g("prairies").ha + g("fourrages").ha;
  kpis("#agriculture-kpis", [
    [mha(sau), [`de surface agricole en ${A.annee}`, `environ la moitié du territoire`, rgS === 1 ? "la plus grande d'Europe" : `${rgS}e d'Europe`], "Surface agricole"],
    [Math.round(100 * elev / sau) + " %", [`pour nourrir les animaux : prairies et fourrages`, `(sans compter les céréales qu'ils mangent)`], "Élevage"],
    [Math.round(100 * g("cereales").ha / sau) + " %", [`en céréales`, `${Math.round(100 * g("oleagineux").ha / sau)} % en oléagineux`], "Grandes cultures"],
    [f1(B.pc) + " %", [`en bio (${B.annee})`, `${f1(B0.pc)} % en ${B0.annee}`], "Bio"],
  ]);
  const top = [...C].filter(c => c.bio_pc != null).sort((a, b) => b.bio_pc - a.bio_pc);
  $("#agriculture-txt").innerHTML = `<ul>
      <li><b>La France cultive ${mha(sau)}</b>, ${rgS === 1 ? "la plus grande surface agricole d'Europe" : `la ${rgS}<sup>e</sup> surface agricole d'Europe`}. Plus de la moitié sert à nourrir les animaux : prairies permanentes (${Math.round(100 * g("prairies").ha / sau)} %) et fourrages semés (${Math.round(100 * g("fourrages").ha / sau)} %), sans compter une partie des céréales et des tourteaux d'oléagineux. C'est le poids de l'élevage, en particulier bovin.</li>
      <li><b>Les céréales occupent ${Math.round(100 * g("cereales").ha / sau)} % des terres</b> (blé surtout, dont la France est le premier producteur européen et un grand exportateur). Fruits et légumes frais n'occupent que ${f1(100 * (g("legumes").ha + g("fruits").ha) / sau)} % des terres : une grande partie de ce que nous en mangeons est importée (voir l'onglet <a href="#alimentation">Alimentation</a>).</li>
      <li><b>Le bio couvre ${f1(B.pc)} % de la surface</b>, mais très inégalement : ${top.slice(0, 3).map(c => `${c.l.split(" (")[0].toLowerCase()} ${f1(c.bio_pc)} %`).join(", ")}, contre seulement ${f1(g("cereales").bio_pc)} % des céréales et ${f1(g("betteraves").bio_pc)} % des betteraves. Les grandes cultures, qui dominent la surface, restent très majoritairement conventionnelles : c'est là que se jouent l'usage des pesticides et des engrais (voir <a href="#pesticides">Pesticides et engrais</a>).</li>
      <li><b>Le bio stagne depuis 2021</b> (${f1(A.bio.find(b => b.annee === 2021)?.pc)} % en 2021, ${f1(B.pc)} % en ${B.annee}) : avec l'inflation, les achats de produits bio ont baissé et certaines fermes sont revenues au conventionnel. L'objectif de 18 % de la surface en bio en 2027, fixé par le plan Ambition bio, paraît hors d'atteinte.</li>
      <li><b>Les jachères</b> ont fortement reculé depuis 2000 (${mha(g("jacheres").ha_2000)} → ${mha(g("jacheres").ha)}), avec la fin de la jachère obligatoire de la politique agricole commune en 2008 : ce sont autant de refuges en moins pour les insectes et les oiseaux (voir <a href="#biodiversite">Biodiversité</a>).</li>
    </ul>
    <p class="muted" style="font-size:.78rem">Eurostat : surfaces des cultures (apro_cpsh1, surface récoltée quand elle existe, sinon surface principale), surfaces en agriculture biologique ou en conversion (org_cropar). Pour la France, la part du bio par culture n'est publiée que jusqu'en ${A.annee_bio} ; la part totale jusqu'en ${B.annee}.</p>`;
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
