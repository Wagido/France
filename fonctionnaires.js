/* Argent public : les 5,8 millions d'agents publics, par niveau et par employeur */
(() => {
"use strict";
const $ = s => document.querySelector(s);
const COUL = { fpe: "#3b6fd6", fpt: "#e07b39", fph: "#16a34a" };
async function init() {
  if (!window.TH || !$("#fp-chart")) { setTimeout(init, 100); return; }
  let F; try { F = await fetch("data/fonctionnaires.json", { cache: "no-cache" }).then(r => r.json()); } catch (e) { return; }
  const { kpis, esc } = window.TH, nf = (v, d = 0) => v.toLocaleString("fr-FR", { minimumFractionDigits: d, maximumFractionDigits: d });
  const V = Object.fromEntries(F.versants.map(v => [v.id, v])), mx = Math.max(...F.versants.flatMap(v => v.postes.map(p => p[1])));
  kpis("#fp-kpis", [
    [nf(F.total / 1000, 2) + " M", [`d'agents publics fin ${F.annee}`, `${F.pour_1000_hab} pour 1 000 habitants`], "Agents publics"],
    [nf(V.fpe.total / 1000, 2) + " M", ["État", `dont ${nf(V.fpe.postes[0][1] / 1000, 2)} M dans l'éducation et l'enseignement supérieur`], "État"],
    [nf(V.fpt.total / 1000, 2) + " M", ["collectivités locales", `dont ${nf(V.fpt.postes[0][1] / 1000, 2)} M dans les communes`], "Territoriale"],
    [nf(V.fph.total / 1000, 2) + " M", ["hôpitaux et maisons de retraite publics"], "Hospitalière"],
  ]);
  // barre empilée des trois versants
  const stack = `<div class="fp-stack">${F.versants.map(v => `<span style="flex:${v.total} 1 0;background:${COUL[v.id]}" title="${esc(v.nom)} : ${nf(v.total)} milliers"><b>${esc(v.nom.replace("Fonction publique ", ""))}</b> ${nf(v.total / 1000, 2)} M · ${Math.round(100 * v.total / F.total)} %</span>`).join("")}</div>`;
  $("#fp-chart").innerHTML = stack + F.versants.map(v => `<h4 style="margin:12px 0 4px;color:${COUL[v.id]}">${esc(v.nom)} : ${nf(v.total)} 000 agents</h4><div class="bars">` +
    v.postes.map(([l, n]) => `<div class="bar-row"><span class="lab">${esc(l)}</span><span class="val">${nf(n)} 000</span><span class="track"><span class="fill" style="width:${(100 * n / mx).toFixed(1)}%;background:${COUL[v.id]}"></span></span></div>`).join("") + `</div>`).join("");
  const S = F.statut;
  $("#fp-statut").innerHTML = `<table class="pr-t"><thead><tr><th>En % des agents</th><th>État</th><th>Territoriale</th><th>Hospitalière</th><th class="fr">Ensemble</th></tr></thead><tbody>` +
    S.lignes.map(r => `<tr><td class="lab">${esc(r[0])}</td>${r.slice(1).map((v, i) => `<td class="${i === 3 ? "fr" : ""}">${v == null ? "–" : nf(v, 1) + " %"}</td>`).join("")}</tr>`).join("") + `</tbody></table>`;
  const ens = V.fpe.postes[0][1], com = V.fpt.postes[0][1];
  $("#fp-txt").innerHTML = `<ul>
    <li><b>Près de 6 millions d'agents publics</b>, soit ${F.pour_1000_hab} pour 1 000 habitants, et environ un emploi sur cinq en France. On parle souvent de « fonctionnaires », mais près d'un agent sur quatre est en réalité contractuel, et cette part augmente.</li>
    <li><b>L'État, c'est d'abord l'école</b> : ${nf(ens)} 000 agents travaillent pour l'éducation et l'enseignement supérieur, près de la moitié des agents de l'État. Viennent ensuite la police et les préfectures, les armées, puis les finances publiques.</li>
    <li><b>Les collectivités, ce sont d'abord les communes</b> : ${nf(com)} 000 agents, plus les intercommunalités et les centres communaux d'action sociale. Sept agents territoriaux sur dix sont en catégorie C : agents d'entretien, de cantine, d'espaces verts, aides à domicile, secrétaires.</li>
    <li><b>L'hospitalière, ce sont les soignants</b> : infirmiers, aides-soignants, médecins hospitaliers, dans les hôpitaux et les maisons de retraite publics.</li>
    <li><b>Les catégories</b> : A pour la conception et l'encadrement (enseignants, cadres, ingénieurs, infirmiers), B pour l'application (techniciens, contrôleurs, policiers), C pour l'exécution. L'État compte surtout des A, à cause des enseignants ; les collectivités surtout des C.</li>
  </ul>`;
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
