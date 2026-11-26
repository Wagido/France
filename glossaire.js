/* Glossaire de l'article Monnaie : la première occurrence de chaque terme reçoit une définition au survol (abbr) */
(() => {
"use strict";
function run() {
  const sec = document.getElementById("monnaie"), dl = document.getElementById("mo-glossaire");
  if (!sec || !dl) return;
  const T = [...dl.querySelectorAll("dt")].map(dt => ({ re: new RegExp(`(^|[^\\p{L}])(${dt.dataset.k})(?![\\p{L}])`, "iu"), def: dt.nextElementSibling?.textContent || "", done: false }));
  const SKIP = new Set(["A", "ABBR", "H2", "H3", "H4", "BUTTON", "SCRIPT", "STYLE", "SVG", "TEXT", "SUMMARY", "DT", "DD", "LABEL", "SELECT", "OPTION", "TH"]);
  const walker = document.createTreeWalker(sec, NodeFilter.SHOW_TEXT, { acceptNode(n) {
    for (let p = n.parentElement; p && p !== sec; p = p.parentElement) { if (SKIP.has(p.tagName) || p.id === "mo-glossaire" || p.id === "mo-sources" || p.classList.contains("kpis") || p.classList.contains("chart")) return NodeFilter.FILTER_REJECT; }
    return n.nodeValue.trim().length > 3 ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT; } });
  const nodes = []; while (walker.nextNode()) nodes.push(walker.currentNode);
  for (const n of nodes) {
    let node = n;
    for (const t of T) {
      if (t.done || !node) continue;
      const m = t.re.exec(node.nodeValue); if (!m) continue;
      const start = m.index + m[1].length, word = m[2];
      const after = node.splitText(start); const rest = after.splitText(word.length);
      const ab = document.createElement("abbr"); ab.className = "glo"; ab.title = t.def; ab.textContent = word;
      after.replaceWith(ab); t.done = true; node = rest;
    }
  }
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", run); else run();
})();
