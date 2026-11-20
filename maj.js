/* Date de la dernière mise à jour réussie des données, affichée en tête de chaque rubrique (data/maj.json, scripts/maj.py) */
(() => {
"use strict";
fetch("data/maj.json", { cache: "no-cache" }).then(r => r.json()).then(M => {
  const R = M.rubriques || {}, auj = new Date();
  for (const [id, d] of Object.entries(R)) {
    const sec = document.getElementById(id);
    if (!sec || sec.querySelector(".maj-date")) continue;
    const dt = new Date(d), jours = (auj - dt) / 864e5;
    const p = document.createElement("p");
    p.className = "maj-date" + (jours > 45 ? " vieux" : "");
    p.textContent = `Données mises à jour le ${dt.toLocaleDateString("fr-FR", { dateStyle: "long" })}` +
      (jours > 45 ? " (la dernière mise à jour automatique de certaines sources a échoué)" : "");
    const head = sec.querySelector(".panel-head");
    head ? head.after(p) : sec.prepend(p);
  }
}).catch(() => {});
})();
