/* Navigation : un article à la fois, choisi par thème ; sélecteur de pays dans l'article ; thème clair / sombre */
(() => {
"use strict";
const $ = s => document.querySelector(s);
const sections = [...document.querySelectorAll("main section.panel[id]")];
const groupOf = {};
document.querySelectorAll("nav.tabs[data-group]").forEach(n => n.querySelectorAll("a").forEach(a => groupOf[a.getAttribute("href").slice(1)] = n.dataset.group));
const first = g => document.querySelector(`nav.tabs[data-group="${g}"] a`)?.getAttribute("href").slice(1);
const geoCtl = $("#geo-ctl");

function show(id) {
  if (!groupOf[id] || !document.getElementById(id)) id = first("economie");
  const g = groupOf[id];
  sections.forEach(s => s.hidden = s.id !== id);
  document.querySelectorAll("nav.groups button").forEach(b => b.setAttribute("aria-pressed", b.dataset.group === g));
  document.querySelectorAll("nav.tabs[data-group]").forEach(n => n.hidden = n.dataset.group !== g);
  document.querySelectorAll("nav.tabs a").forEach(a => a.classList.toggle("on", a.getAttribute("href") === "#" + id));
  document.querySelector("nav.tabs a.on")?.scrollIntoView({ block: "nearest", inline: "nearest" });
  // le choix du pays n'apparaît que dans les articles qui existent pour tous les pays
  const sec = document.getElementById(id), head = sec.querySelector(".panel-head");
  if (head && sec.querySelector(".geo-tag")) { head.appendChild(geoCtl); geoCtl.hidden = false; }
  else { geoCtl.hidden = true; document.body.appendChild(geoCtl); }
  document.title = `${sec.querySelector("h2")?.childNodes[0]?.textContent.trim() || "Comptes de la France"} · Comptes de la France`;
  window.scrollTo({ top: 0 });
  setTimeout(() => window.scrollTo({ top: 0 }), 0);   // après le saut automatique du navigateur vers l'ancre
}

document.querySelectorAll("nav.groups button").forEach(b => b.onclick = () => { const id = first(b.dataset.group); history.pushState(null, "", "#" + id); show(id); });
addEventListener("hashchange", () => show(location.hash.slice(1)));
// liens vers un article : on change d'article sans le saut du navigateur vers l'ancre
document.addEventListener("click", e => {
  const a = e.target.closest?.('a[href^="#"]'); if (!a || e.ctrlKey || e.metaKey || e.shiftKey) return;
  const id = a.getAttribute("href").slice(1); if (!groupOf[id]) return;
  e.preventDefault();
  if (location.hash.slice(1) !== id) history.pushState(null, "", "#" + id);
  show(id);
});
addEventListener("popstate", () => show(location.hash.slice(1)));
addEventListener("load", () => window.scrollTo({ top: 0 }));
// liens internes vers un article (« voir la section … »)
show(location.hash.slice(1));

// thème clair / sombre (le choix est retenu sur cet appareil)
const root = document.documentElement;
const dark = () => root.dataset.theme === "dark";
$("#theme-btn").onclick = () => {
  const t = dark() ? "light" : "dark";
  root.dataset.theme = t;
  try { localStorage.setItem("theme", t); } catch (e) { /* stockage indisponible */ }
  window.dispatchEvent(new Event("resize"));
};
})();
