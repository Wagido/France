/* Justice (Société) : l'inflation normative et les moyens de la justice comparés en Europe */
(() => {
"use strict";
const $ = s => document.querySelector(s);
async function init() {
  if (!window.TH || !$("#jd-cepej")) { return; }
  let J; try { J = await fetch("data/justice_droit.json", { cache: "no-cache" }).then(r => r.json()); } catch (e) { return; }
  const { esc } = window.TH, nf = v => v.toLocaleString("fr-FR"), N = J.normes;
  $("#jd-cepej").innerHTML = `<table class="pr-t"><thead><tr><th>Indicateur</th><th class="fr">France</th><th>Médiane européenne</th><th>Allemagne</th></tr></thead><tbody>` +
    J.cepej.lignes.map(r => `<tr><td class="lab">${esc(r.l)}</td><td class="fr"><b>${esc(r.fr)}</b></td><td>${esc(r.med)}</td><td>${esc(r.de)}</td></tr>`).join("") + `</tbody></table>`;
  // organisation de la justice : niveau × ordre
  const O = [
    ["Premier jugement", "<b>Tribunal judiciaire</b> : la plupart des litiges civils (famille, logement, dettes, héritages) et les délits (tribunal correctionnel)<br><b>Conseil de prud'hommes</b> : litiges entre salariés et employeurs<br><b>Tribunal de commerce</b> : litiges entre entreprises, faillites<br><b>Cour d'assises</b> et cour criminelle départementale : les crimes<br><b>Juge et tribunal pour enfants</b> : les mineurs", "<b>Tribunal administratif</b> : litiges avec l'administration (permis de construire, impôts, fonctionnaires, expulsion d'étrangers, marchés publics)"],
    ["Appel (deuxième jugement)", "<b>Cour d'appel</b> : rejuge l'affaire en fait et en droit ; cour d'assises d'appel pour les crimes", "<b>Cour administrative d'appel</b>"],
    ["Cassation (dernier recours)", "<b>Cour de cassation</b> : ne rejuge pas les faits, vérifie que le droit a été correctement appliqué", "<b>Conseil d'État</b> : juge de cassation, et premier et dernier juge de certains actes (décrets) ; il conseille aussi le gouvernement sur ses projets de loi"],
  ];
  $("#jd-orga").innerHTML = `<table class="pr-t qui-t"><thead><tr><th>Étape</th><th>Ordre judiciaire : litiges entre personnes, et sanctions pénales</th><th>Ordre administratif : litiges avec l'administration</th></tr></thead><tbody>` +
    O.map(r => `<tr><td class="lab"><b>${r[0]}</b></td><td class="on">${r[1]}</td><td>${r[2]}</td></tr>`).join("") + `</tbody></table>`;
  $("#jd-orga-txt").innerHTML = `<ul>
    <li><b>Deux justices séparées</b> : depuis la Révolution, un juge ordinaire ne peut pas juger l'administration. Les litiges entre particuliers ou entreprises, et les infractions, vont devant l'ordre judiciaire ; les litiges contre l'État, une commune, un hôpital public… vont devant l'ordre administratif. En cas de doute sur le juge compétent, le <b>Tribunal des conflits</b> tranche.</li>
    <li><b>Au-dessus des lois : le Conseil constitutionnel</b> vérifie que les lois respectent la Constitution, avant leur promulgation, et depuis 2010 à la demande d'un justiciable au cours d'un procès (question prioritaire de constitutionnalité). Il juge aussi les élections nationales.</li>
    <li><b>Au-dessus encore, l'Europe</b> : la Cour de justice de l'Union européenne (Luxembourg) veille au respect du droit européen, et la Cour européenne des droits de l'homme (Strasbourg, Conseil de l'Europe) peut condamner la France une fois les recours nationaux épuisés.</li>
    <li><b>Juges et procureurs</b> : les magistrats « du siège » jugent et sont inamovibles ; les magistrats « du parquet » (procureurs) poursuivent les infractions au nom de la société et dépendent hiérarchiquement du ministre de la Justice, ce que la Cour européenne des droits de l'homme critique.</li>
    <li><b>Des juges qui ne sont pas des magistrats de carrière</b> : aux prud'hommes, des représentants des salariés et des employeurs ; aux tribunaux de commerce, des chefs d'entreprise élus ; aux assises, des jurés tirés au sort.</li>
  </ul>`;
  $("#jd-txt").innerHTML = `<p style="margin-top:0"><b>Le droit et la justice : trop de règles, pas assez de juges</b></p><ul>
    <li><b>Une inflation de normes</b> : environ ${nf(N.edition_2026.total)} articles de lois et de règlements sont en vigueur, soit près de ${nf(N.edition_2026.mots_millions)} millions de mots ; ils étaient ${nf(N.edition_2022.legislatifs + N.edition_2022.reglementaires)} en 2022 (${nf(N.edition_2022.mots_millions)} millions de mots). Le Conseil d'État alerte sur cette « inflation normative » depuis 1991.</li>
    <li><b>Pourquoi c'est un sujet économique</b> : chaque règle nouvelle a un coût de mise en conformité, surtout pour les petites entreprises sans juriste ; des règles qui changent souvent créent une insécurité juridique, et allongent les délais (permis de construire, autorisations).</li>
    <li><b>Une justice qui manque de moyens</b> : la France consacre 0,20 % de son PIB à sa justice, contre 0,31 % pour la médiane européenne, et compte environ deux fois moins de juges par habitant que la moyenne européenne.</li>
    <li><b>Moins de juges, c'est plus d'affaires par juge</b>, et donc des délais plus longs, notamment en matière civile et aux prud'hommes (les délais comparés de la CEPEJ restent à ajouter).</li>
    <li><b>Le lien avec la prospérité</b> : une justice lente rend les contrats moins sûrs, décourage l'investissement et l'embauche ; c'est une des institutions qui comptent le plus pour la croissance.</li>
  </ul>`;
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
