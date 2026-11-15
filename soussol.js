/* Sous-sol : carte géologique du BRGM (via la Géoplateforme de l'IGN) et grands sites des ressources du sous-sol */
(() => {
"use strict";
let map = null;
const WMTS = (layer, fmt, tms) => `https://data.geopf.fr/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=${layer}&STYLE=normal&TILEMATRIXSET=${tms}&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&FORMAT=${fmt}`;
const SITES = [
  [46.18, 2.95, "Beauvoir (Allier)", "Lithium : projet de mine Emili d'Imerys, 34 000 tonnes d'hydroxyde de lithium par an prévues, de quoi équiper environ 700 000 voitures électriques par an."],
  [49.07, 6.68, "Folschviller (Moselle)", "Hydrogène naturel découvert en 2023 dans l'ancien bassin houiller. Les estimations (environ 34 millions de tonnes) restent à confirmer."],
  [48.94, 7.88, "Soultz-sous-Forêts (Bas-Rhin)", "Géothermie profonde ; les eaux chaudes du fossé rhénan contiennent du lithium, que plusieurs projets veulent extraire."],
  [42.78, 1.18, "Salau (Ariège)", "Ancienne mine de tungstène, fermée en 1986, parmi les plus riches d'Europe ; sa réouverture est régulièrement étudiée."],
  [43.41, -0.62, "Lacq (Pyrénées-Atlantiques)", "Le grand gisement de gaz français, découvert en 1951 ; la production commerciale s'est arrêtée en 2013."],
  [46.13, 1.44, "Bessines-sur-Gartempe (Haute-Vienne)", "Ancien centre de l'uranium français : la dernière mine d'uranium de France a fermé en 2001."],
];
function init() {
  const el = document.getElementById("ss-map");
  if (!el || !window.L) { setTimeout(init, 150); return; }
  if (map) return;
  if (!el.offsetWidth) { setTimeout(init, 300); return; }   // l'onglet est caché : on attend qu'il s'affiche
  map = L.map(el, { scrollWheelZoom: false, minZoom: 5, maxZoom: 15 }).setView([46.6, 2.4], 6);
  L.tileLayer(WMTS("GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2", "image/png", "PM_0_19"), { attribution: "© IGN", maxZoom: 19 }).addTo(map);
  const att = '<a href="https://www.brgm.fr" target="_blank" rel="noopener">BRGM</a> via <a href="https://cartes.gouv.fr" target="_blank" rel="noopener">Géoplateforme IGN</a>';
  const geol = L.layerGroup([
    L.tileLayer(WMTS("BRGM_SCAN_F_GEOL1M", "image/jpeg", "PM_0_11"), { attribution: att, maxZoom: 9, maxNativeZoom: 11, opacity: .75 }),
    L.tileLayer(WMTS("BRGM_SCAN_F_GEOL250", "image/jpeg", "PM_0_14"), { attribution: att, minZoom: 10, maxZoom: 12, opacity: .75 }),
    L.tileLayer(WMTS("BRGM_SCAN_D_GEOL50", "image/jpeg", "PM_0_15"), { attribution: att, minZoom: 13, maxZoom: 15, opacity: .75 }),
  ]).addTo(map);
  const ic = L.divIcon({ className: "ss-pin", html: "<span></span>", iconSize: [16, 16], iconAnchor: [8, 8] });
  SITES.forEach(([la, lo, t, d]) => L.marker([la, lo], { icon: ic }).addTo(map).bindPopup(`<b>${t}</b><br>${d}`));
  const op = document.getElementById("ss-op");
  if (op) op.oninput = () => geol.eachLayer(l => l.setOpacity(op.value / 100));
}
function watch() {   // l'onglet peut être ouvert plus tard : on recalcule la taille de la carte
  init();
  addEventListener("hashchange", () => setTimeout(() => { init(); map?.invalidateSize(); }, 200));
  document.addEventListener("click", () => setTimeout(() => { init(); map?.invalidateSize(); }, 250));
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", watch); else watch();
})();
