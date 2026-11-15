/* Carrés de chiffres clés : un titre court, puis le chiffre, puis le détail en petit.
   Le titre est tiré automatiquement du début de la légende (jusqu'à la première virgule, parenthèse, « : », « soit », « pour »…). */
(function () {
  "use strict";
const TITRES = [
    [/^PIB \d/i, "PIB"],
    [/^par habitant$/i, "PIB par habitant"],
    [/^évolution sur un an/i, "Croissance"],
    [/^dette publique en % du PIB/i, "Dette publique"],
    [/^d'habitants en/i, "Population"],
    [/^salariés du privé/i, "Salariés du privé"],
    [/^agents publics/i, "Agents publics"],
    [/^salariés$/i, "Salariés"],
    [/^indépendants$/i, "Indépendants"],
    [/^personnes en emploi, soit/i, "En emploi"],
    [/^dépenses publiques/i, "Dépenses publiques"],
    [/^des richesses produites/i, "Part du PIB"],
    [/^recettes \(/i, "Recettes"],
    [/^financés par l'emprunt/i, "Déficit"],
    [/^payés par personne et par an/i, "Ce qu'on paie au maximum"],
    [/^reçus par personne et par an/i, "Ce qu'on reçoit au maximum"],
    [/^payés \/ reçus sur une vie/i, "Sur toute une vie"],
    [/^intérêts payés/i, "Charge d'intérêts"],
    [/^des recettes publiques/i, "Part des recettes"],
    [/^taux apparent/i, "Taux moyen de la dette"],
    [/^dette publique fin/i, "Dette publique"],
    [/^total des actifs/i, "Actifs"],
    [/^total des dettes et passifs/i, "Dettes"],
    [/^patrimoine net de la France/i, "Patrimoine net"],
    [/^dont position financière nette/i, "Solde avec l'étranger"],
    [/^de marchandises exportées/i, "Exportations"],
    [/^importées$/i, "Importations"],
    [/^solde commercial/i, "Solde commercial"],
    [/^tonnes importées/i, "Poids des échanges"],
    [/^des importations viennent de l'Union/i, "Part de l'Europe"],
    [/^de la valeur ajoutée vient de l'industrie/i, "Industrie"],
    [/^d'emplois dans l'industrie/i, "Emplois industriels"],
    [/^du PIB consacrés à la recherche/i, "Recherche"],
    [/^chercheurs/i, "Chercheurs"],
    [/^des entreprises de 10 salariés ou plus utilisent/i, "Intelligence artificielle"],
    [/^énergie disponible/i, "Énergie disponible"],
    [/^taux d'indépendance/i, "Indépendance"],
    [/^part du pétrole/i, "Énergies fossiles"],
    [/^consommation finale/i, "Consommation finale"],
    [/^pertes de conversion/i, "Pertes"],
    [/^de matières consommées/i, "Consommation"],
    [/^empreinte par habitant/i, "Empreinte matières"],
    [/^extraites sur le territoire/i, "Extraction"],
    [/^importées \(/i, "Importations"],
    [/^ajoutées au stock/i, "Accumulation"],
    [/^taux de recyclage/i, "Recyclage"],
    [/^d'eau douce prélevée/i, "Prélèvements"],
    [/^par habitant ; /i, "Par habitant"],
    [/^pour : /i, "Premier usage"],
    [/^de territoire/i, "Superficie"],
    [/^artificialisé/i, "Artificialisation"],
    [/^couvert de forêts/i, "Forêts"],
    [/^de cultures et de prairies/i, "Agriculture"],
    [/^disponibles par personne et par jour/i, "Calories"],
    [/^des calories viennent de produits animaux/i, "Part animale"],
    [/^taux d'autosuffisance/i, "Autosuffisance"],
    [/^importées, /i, "Importations"],
    [/^de gaz à effet de serre émis/i, "Émissions"],
    [/^depuis 1990/i, "Depuis 1990"],
    [/^par habitant et par an$/i, "Par habitant"],
    [/^absorbées/i, "Forêts et sols"],
    [/^aviation et transport maritime/i, "Transport international"],
    [/^de gaz à effet de serre par (Français|habitant)/i, "Empreinte carbone"],
    [/^en \d{4} : les « 12 tonnes »/i, "En 1990"],
    [/^de l'empreinte est émise/i, "Émis à l'étranger"],
    [/^par personne vers 2050/i, "Objectif 2050"],
    [/^émis directement par les ménages/i, "Chaudières et voitures"],
    [/^de déchets produits/i, "Déchets"],
    [/^viennent du BTP/i, "Bâtiment et travaux publics"],
    [/^de déchets ménagers/i, "Déchets ménagers"],
    [/^des déchets traités sont recyclés/i, "Recyclage"],
    [/^finissent en décharge/i, "Décharge"],
    [/^électricité produite/i, "Production"],
    [/^consommée$/i, "Consommation"],
    [/^exportées en net/i, "Exportations nettes"],
    [/^des déplacements terrestres/i, "Voiture"],
    [/^des marchandises transportées par la route/i, "Route"],
    [/^de voyageurs-km en train/i, "Train"],
    [/^de passagers aériens/i, "Avion"],
    [/^de tonnes-km par camion/i, "Camions"],
    [/^d'habitants au 1er janvier/i, "Population"],
    [/^naissances/i, "Naissances"],
    [/^décès/i, "Décès"],
    [/^solde migratoire/i, "Solde migratoire"],
    [/^de personnes nées à l'étranger/i, "Nés à l'étranger"],
    [/^nées hors de l'Union/i, "Nés hors de l'Union"],
    [/^arrivées en/i, "Arrivées"],
    [/^départs/i, "Départs"],
    [/^travaillées dans le pays/i, "Heures travaillées"],
    [/^du temps total de la population/i, "Part du temps"],
    [/^par habitant et par an, tous âges/i, "Par habitant"],
    [/^par personne en emploi/i, "Par personne en emploi"],
    [/^de personnes en emploi parmi/i, "En emploi"],
    [/^taux de chômage/i, "Chômage"],
    [/^des 20-64 ans ont un emploi/i, "Taux d'emploi"],
    [/^des emplois sont des indépendants/i, "Indépendants"],
    [/^chômeurs au sens du BIT/i, "Chômeurs (BIT)"],
    [/^inscrits à France Travail en catégorie A/i, "Catégorie A"],
    [/^inscrits toutes catégories/i, "Tous les inscrits"],
    [/^sans emploi ou en manque de travail/i, "Au sens large"],
    [/^personnes détenues/i, "Détenus"],
    [/^détenus pour 100 000/i, "Taux de détention"],
    [/^policiers et gendarmes/i, "Police et gendarmerie"],
    [/^juges professionnels/i, "Juges"],
    [/^d'espérance de vie à la naissance/i, "Espérance de vie"],
    [/^restant à vivre/i, "À 65 ans"],
    [/^du PIB consacrés aux soins/i, "Santé, en part du PIB"],
    [/^de dépense courante de santé/i, "Dépense de santé"],
    [/^payés directement par les ménages/i, "Reste à charge"],
    [/^d'élèves et d'étudiants/i, "Élèves et étudiants"],
    [/^des 25-64 ans diplômés du supérieur/i, "Diplômés du supérieur"],
    [/^des 25-64 ans sans diplôme/i, "Sans diplôme"],
    [/^de dépense par lycéen/i, "Coût d'un lycéen"],
    [/^de la population vit dans un logement dont elle est propriétaire/i, "Propriétaires"],
    [/^pièces par personne/i, "Espace"],
    [/^vivent dans un logement surpeuplé/i, "Surpeuplement"],
    [/^vivent dans un logement sous-occupé/i, "Sous-occupation"],
    [/^consacrent plus de 40 %/i, "Logement trop cher"],
    [/^prix des logements depuis/i, "Prix des logements"],
    [/^de la population sous le seuil de pauvreté/i, "Pauvreté"],
    [/^le serait sans les prestations/i, "Sans les prestations"],
    [/^des enfants vivent sous le seuil/i, "Pauvreté des enfants"],
    [/^indice de Gini/i, "Indice de Gini"],
    [/^fois plus de revenu pour les 10 %/i, "Écart riches / pauvres"],
    [/^fois plus de revenu pour les 5 %/i, "Avant / après redistribution"],
    [/^reçoivent plus qu'elles ne paient/i, "Bénéficiaires nets"],
    [/^solde net des 5 % les plus modestes/i, "Les 5 % les plus modestes"],
    [/^solde net des 5 % les plus aisés/i, "Les 5 % les plus aisés"],
    [/^du revenu des 5 % les plus aisés vient du patrimoine/i, "Revenus du patrimoine"],
    [/^des revenus du patrimoine vont aux/i, "Concentration des revenus du patrimoine"],
    [/^chez les 5 % les plus modestes/i, "En bas de l'échelle"],
    [/^du patrimoine des ménages est détenu/i, "Concentration du patrimoine"],
    [/^patrimoine brut médian/i, "Patrimoine médian"],
    [/^des ménages ont déjà hérité/i, "Héritage"],
    [/^des ménages les plus riches \(quart/i, "Qui hérite"],
    [/^sortie culturelle/i, "Sorties culturelles"],
    [/^engagement citoyen/i, "Engagement citoyen"],
    [/^confiance moyenne/i, "Confiance"],
    [/^voient leur famille/i, "Liens familiaux"]
  ];
  const COUPES = [" : ", ", ", " ; ", " (", " soit ", " pour ", " contre ", " dont ", " sur "];
  function decoupe(l) {
    const s = String(l ?? "").trim();
    if (!s || /<[a-z]/i.test(s)) return ["", s];
    let i = -1, sep = "";
    COUPES.forEach(c => { const k = s.indexOf(c); if (k > 2 && (i < 0 || k < i)) { i = k; sep = c; } });
    let t = i < 0 ? s : s.slice(0, i), r = i < 0 ? "" : s.slice(i);
    // « total des actifs (brut) : … » : la petite parenthèse reste dans le titre
    const m = r.match(/^ \(([^)]{1,20})\)\s*:\s*/);
    if (m) { t += ` (${m[1]})`; r = r.slice(m[0].length); }
    if (i < 0 && t.split(/\s+/).length > 9) {          // légende longue sans coupure : titre = premiers mots
      const w = t.split(/\s+/); t = w.slice(0, 6).join(" "); r = w.slice(6).join(" ");
    }
    t = t.replace(/^(dont |de la |de l'|des |du |de |d'|d’)/i, "");
    r = r.replace(/^\s*[:,;]\s*/, "").trim();
    return [t.charAt(0).toUpperCase() + t.slice(1), r];
  }
  window.kpiHTML = function (v, l, titre) {
    let t, r;
    if (titre != null) [t, r] = [titre, l];
    else {
      const brut = String(l ?? "").replace(/<[^>]+>/g, "").trim();
      const m = TITRES.find(([re]) => re.test(brut));
      if (m) { t = m[1]; r = (brut.length < 16 && !/\d/.test(brut)) || brut.toLowerCase() === t.toLowerCase() ? "" : l; }
      else [t, r] = decoupe(l);
    }
    // plusieurs informations sous le chiffre : une liste à puces (tableau, ou texte séparé par « ; »)
    let items = Array.isArray(r) ? r : (typeof r === "string" && / ; /.test(r) ? r.split(/ ; /) : null);
    if (items) items = items.map(s => String(s).trim()).filter(Boolean);
    const det = items ? `<ul class="l">${items.map(s => `<li>${s}</li>`).join("")}</ul>` : (r ? `<div class="l">${r}</div>` : "");
    return `<div class="kpi">${t ? `<div class="t">${t}</div>` : ""}<div class="v">${v}</div>${det}</div>`;
  };
})();
