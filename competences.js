/* Argent public : qui dépense quoi (État, collectivités, Sécurité sociale) et qui fait quoi (compétences) */
(() => {
"use strict";
const $ = s => document.querySelector(s);
const COUL = { etat: "#3b6fd6", local: "#e07b39", secu: "#7c3aed" };
const NOM = { etat: "État et opérateurs", local: "Collectivités locales", secu: "Sécurité sociale" };
// qui fait quoi : ● responsable principal, ○ rôle partagé ou partiel
const QUI = [
  ["Écoles maternelles et élémentaires", "Enseignants, programmes", "", "", "Bâtiments, cantine, périscolaire", ""],
  ["Collèges", "Enseignants, programmes", "", "Bâtiments, cantine, agents", "", ""],
  ["Lycées", "Enseignants, programmes", "Bâtiments, cantine, agents", "", "", ""],
  ["Universités et recherche", "Financement, enseignants-chercheurs", "Soutien à l'innovation", "", "", ""],
  ["Formation professionnelle", "Règles, financement de l'apprentissage", "Formation des demandeurs d'emploi, orientation", "", "", "Assurance chômage (Unédic)"],
  ["Retraites, maladie, famille", "Fixe les règles par la loi (PLFSS)", "", "", "", "Verse les pensions, rembourse les soins, verse les allocations"],
  ["Hôpitaux et santé", "Agences régionales de santé, autorisations", "", "", "", "Finance les soins (assurance maladie)"],
  ["Action sociale", "Hébergement d'urgence, aides au logement (via les CAF)", "", "RSA, enfance en danger, personnes âgées (APA), handicap", "Centres communaux d'action sociale", "Verse les aides au logement (CAF)"],
  ["Routes", "Autoroutes et routes nationales", "", "Routes départementales", "Rues et voirie communale", ""],
  ["Transports en commun", "Grandes lignes (État actionnaire de la SNCF)", "Trains régionaux (TER), cars entre villes", "", "Bus, tram, métro (intercommunalités)", ""],
  ["Eau, assainissement, déchets", "Normes", "", "", "Intercommunalités", ""],
  ["Urbanisme, permis de construire", "Règles nationales", "", "", "Plan local d'urbanisme, permis", ""],
  ["Logement", "Aides, règles, logement social", "", "Fonds de solidarité logement", "Programme local de l'habitat", "Aides au logement (CAF)"],
  ["Économie, emploi", "Fiscalité, grandes aides, France Travail", "Aides aux entreprises (chef de file)", "", "Zones d'activités (intercommunalités)", ""],
  ["Sécurité", "Police, gendarmerie, justice, défense", "", "Pompiers (services départementaux)", "Police municipale", ""],
  ["Culture, sport, tourisme", "Grands musées, patrimoine", "Compétence partagée", "Compétence partagée", "Équipements locaux", ""],
];
async function init() {
  if (!window.TH || !$("#cmp-fn")) { setTimeout(init, 100); return; }
  let C; try { C = await fetch("data/competences.json", { cache: "no-cache" }).then(r => r.json()); } catch (e) { return; }
  const { esc } = window.TH, nf = v => Math.round(v).toLocaleString("fr-FR");
  const F = C.fonctions, mx = Math.max(...F.map(r => r.etat + r.local + r.secu));
  $("#cmp-fn").innerHTML = `<div class="legend-row" style="margin-bottom:6px">${Object.keys(NOM).map(k => `<span><i style="border-top-color:${COUL[k]};border-top-width:10px;width:14px;opacity:1"></i>${NOM[k]} (${nf(C.totaux[k])} Md€)</span>`).join("")}</div>` +
    F.map(r => { const t = r.etat + r.local + r.secu;
      return `<div class="cmp-row qd-row"><span class="lab">${esc(r.l)}</span><span class="cmp-track">${Object.keys(NOM).map(k => r[k] > 0 ? `<span title="${NOM[k]} : ${nf(r[k])} Md€" style="width:${(100 * r[k] / mx).toFixed(2)}%;background:${COUL[k]}">${r[k] / mx > 0.06 ? nf(r[k]) : ""}</span>` : "").join("")}<b>${nf(t)} Md€</b></span></div>`; }).join("");
  $("#cmp-qui").innerHTML = `<table class="pr-t qui-t"><thead><tr><th>Domaine</th><th>État</th><th>Région</th><th>Département</th><th>Commune et intercommunalité</th><th>Sécurité sociale</th></tr></thead><tbody>` +
    QUI.map(r => `<tr><td class="lab"><b>${esc(r[0])}</b></td>${r.slice(1).map(c => `<td class="${c ? "on" : ""}">${esc(c)}</td>`).join("")}</tr>`).join("") + `</tbody></table>`;
  const ens = F.find(r => r.code === "GF09"), soc = F.find(r => r.code === "GF10"), env = F.find(r => r.code === "GF05"), lg = F.find(r => r.code === "GF06");
  $("#cmp-txt").innerHTML = `<ul>
    <li><b>La Sécurité sociale porte la protection sociale et la santé</b> : ${nf(soc.secu)} Md€ de protection sociale (surtout les retraites) et ${nf(F.find(r => r.code === "GF07").secu)} Md€ de santé.</li>
    <li><b>L'État porte les fonctions régaliennes et l'enseignement</b> : défense, justice, police, et ${nf(ens.etat)} Md€ d'enseignement (les salaires des enseignants), contre ${nf(ens.local)} Md€ pour les collectivités (les bâtiments et les cantines).</li>
    <li><b>Les collectivités portent la vie quotidienne</b> : environnement (${nf(env.local)} Md€ sur ${nf(env.etat + env.local + env.secu)}), eau, urbanisme et équipements (${nf(lg.local)} Md€), transports, routes, culture et sport, et l'action sociale des départements (RSA, personnes âgées, handicap).</li>
    <li><b>Un même domaine est souvent partagé</b> : pour un lycée, l'État paie les professeurs et la région le bâtiment ; pour le RSA, l'État fixe le montant, le département le finance, et la CAF le verse. C'est le « mille-feuille » : chacun a une part, ce qui rend difficile de savoir qui est responsable de quoi.</li>
  </ul>`;
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
