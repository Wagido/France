/* Onglet « Sources » : la liste de toutes les données utilisées */
(() => {
"use strict";
const ES = c => `https://ec.europa.eu/eurostat/databrowser/view/${c}/default/table`;
const ORG = {
  eurostat: { nom: "Eurostat", desc: "Office statistique de l'Union européenne. Pour la France, les chiffres sont transmis par l'INSEE, la DREES, le SDES, le ministère de l'Intérieur, etc.", licence: "Réutilisation libre (décision 2011/833/UE)", url: "https://ec.europa.eu/eurostat" },
  comext: { nom: "Eurostat Comext", desc: "Base du commerce extérieur de marchandises, alimentée par les douanes nationales.", licence: "Réutilisation libre", url: "https://ec.europa.eu/eurostat/comext/newxtweb/" },
  insee: { nom: "INSEE", desc: "Institut national de la statistique et des études économiques.", licence: "Licence Ouverte Etalab 2.0", url: "https://www.insee.fr" },
  odre: { nom: "RTE / ODRÉ", desc: "Open Data Réseaux Énergies : données de RTE (éCO2mix) et des gestionnaires de réseaux.", licence: "Licence Ouverte Etalab 2.0", url: "https://odre.opendatasoft.com" },
  fao: { nom: "FAO (FAOSTAT)", desc: "Organisation des Nations unies pour l'alimentation et l'agriculture.", licence: "CC BY 4.0", url: "https://www.fao.org/faostat" },
  owid: { nom: "Our World in Data", desc: "Séries longues compilées par l'université d'Oxford (Energy Institute, Ember…).", licence: "CC BY 4.0", url: "https://github.com/owid/energy-data" },
  fmi: { nom: "FMI", desc: "Fonds monétaire international, base World Economic Outlook.", licence: "Réutilisation libre avec mention de la source", url: "https://www.imf.org/external/datamapper" },
  pnud: { nom: "PNUD", desc: "Programme des Nations unies pour le développement, Rapport sur le développement humain.", licence: "CC BY 3.0 IGO", url: "https://hdr.undp.org" },
  ti: { nom: "Transparency International", desc: "ONG de lutte contre la corruption, indice de perception de la corruption.", licence: "CC BY-ND 4.0", url: "https://www.transparency.org" },
  wjp: { nom: "World Justice Project", desc: "Organisation indépendante, indice de l'État de droit.", licence: "Réutilisation avec mention de la source", url: "https://worldjusticeproject.org" },
  fh: { nom: "Freedom House", desc: "ONG américaine, rapport annuel sur les libertés dans le monde.", licence: "Réutilisation avec mention de la source", url: "https://freedomhouse.org" },
  heritage: { nom: "Heritage Foundation", desc: "Centre de réflexion conservateur américain, indice de liberté économique.", licence: "Réutilisation avec mention de la source", url: "https://www.heritage.org/index/" },
  wna: { nom: "World Nuclear Association", desc: "Association internationale de l'industrie nucléaire ; ses fiches reprennent la base PRIS de l'AIEA et les annonces des exploitants.", licence: "Réutilisation avec mention de la source", url: "https://world-nuclear.org/information-library" },
  ccomptes: { nom: "Cour des comptes", desc: "Juridiction financière chargée du contrôle des comptes publics.", licence: "Réutilisation libre avec mention de la source", url: "https://www.ccomptes.fr" },
  rte: { nom: "RTE", desc: "Réseau de transport d'électricité, gestionnaire du réseau électrique français.", licence: "Réutilisation avec mention de la source", url: "https://www.rte-france.com" },
  bm: { nom: "Banque mondiale", desc: "World Development Indicators.", licence: "CC BY 4.0", url: "https://data.worldbank.org" },
  sdes: { nom: "SDES (ministère de la Transition écologique)", desc: "Service des données et études statistiques : énergie, climat, environnement, logement, transports.", licence: "Licence Ouverte Etalab 2.0", url: "https://www.statistiques.developpement-durable.gouv.fr" },
  agreste: { nom: "Agreste (ministère de l'Agriculture)", desc: "Service de la statistique et de la prospective du ministère de l'Agriculture.", licence: "Licence Ouverte Etalab 2.0", url: "https://agreste.agriculture.gouv.fr" },
  ofpm: { nom: "Observatoire de la formation des prix et des marges (FranceAgriMer)", desc: "Rapport annuel au Parlement sur la formation des prix et des marges des produits alimentaires.", licence: "Citation", url: "https://observatoire-prixmarges.franceagrimer.fr" },
  brgm: { nom: "BRGM (Bureau de recherches géologiques et minières)", desc: "Service géologique national : cartes géologiques, ressources minérales, inventaire minier.", licence: "Licence Ouverte Etalab", url: "https://www.brgm.fr" },
  world3: { nom: "World3 (pyworld3)", desc: "Reproduction libre en Python du modèle World3 de Meadows et al. (1974), par C. Vanwynsberghe.", licence: "CeCILL (logiciel libre)", url: "https://github.com/cvanwynsberghe/pyworld3" },
  interieur: { nom: "Ministère de l'Intérieur", desc: "Résultats officiels des élections, publiés sur data.gouv.fr.", licence: "Licence Ouverte Etalab 2.0", url: "https://www.data.gouv.fr" },
  wpid: { nom: "World Political Cleavages and Inequality Database", desc: "Base de données des clivages politiques (Paris School of Economics, World Inequality Lab), construite à partir des enquêtes électorales nationales.", licence: "Libre, avec citation", url: "https://wpid.world" },
  ipsos: { nom: "Ipsos", desc: "Institut de sondage ; enquêtes réalisées pour France Télévisions, Radio France et Public Sénat les jours d'élection.", licence: "Citation", url: "https://www.ipsos.com/fr-fr" },
  ptj: { nom: "Periodic-Table-JSON", desc: "Données des 118 éléments chimiques compilées depuis Wikipédia par le projet Periodic-Table-JSON.", licence: "CC BY-SA (données Wikipédia)", url: "https://github.com/Bowserinator/Periodic-Table-JSON" },
  jst: { nom: "Macrohistory Database (Jordà, Schularick, Taylor)", desc: "Séries macroéconomiques et financières longues de 18 pays depuis 1870 (crédit, monnaie, taux, dette).", licence: "Libre, avec citation", url: "https://www.macrohistory.net/database/" },
  harvard: { nom: "Harvard Energy History", desc: "Séries longues de consommation d'énergie en Europe (Gales, Kander, Malanima, Warde, Power to the People, 2013).", licence: "Citation", url: "https://histecon.fas.harvard.edu/energyhistory/energydata.html" },
  argentine: { nom: "INDEC, FMI, presse économique", desc: "Chiffres de l'Argentine : institut statistique argentin (INDEC), ministère de l'Économie, FMI et Trésor américain, tels que rapportés par la presse.", licence: "Citations", url: "https://www.indec.gob.ar" },
  marches: { nom: "Trading Economics", desc: "Taux des emprunts d'État relevés sur les marchés financiers.", licence: "Citation", url: "https://tradingeconomics.com" },
  ign: { nom: "IGN / france-geojson", desc: "Contours simplifiés des régions, d'après les données de l'IGN.", licence: "Licence Ouverte Etalab", url: "https://github.com/gregoiredavid/france-geojson" },
};
// [thème, organisme, code ou nom, description, lien (optionnel), rythme de publication]
const S = [
  ["PIB", "eurostat", "nama_10_gdp", "PIB et ses composantes (demande, revenus)", null, "trimestriel / annuel"],
  ["PIB", "eurostat", "nasa_10_nf_tr", "Valeur ajoutée, amortissement, investissement par secteur institutionnel", null, "annuel"],
  ["PIB", "eurostat", "nama_10_a10", "Valeur ajoutée par branche", null, "annuel"],
  ["PIB", "eurostat", "nama_10_co3_p3", "Consommation des ménages par fonction (loyers imputés)", null, "annuel"],
  ["PIB", "eurostat", "nama_10_pe", "Population (comptabilité nationale)", null, "annuel"],
  ["Argent public", "eurostat", "gov_10a_main", "Comptes des administrations publiques par sous-secteur", null, "annuel (avril, octobre)"],
  ["Argent public", "eurostat", "gov_10a_taxag", "Impôts et cotisations détaillés", null, "annuel"],
  ["Argent public", "eurostat", "gov_10a_exp", "Dépenses par fonction (COFOG)", null, "annuel (février)"],
  ["Argent public", "eurostat", "gov_10dd_edpt1", "Dette et déficit au sens de Maastricht", null, "semestriel"],
  ["Argent public", "insee", "Comptes nationaux distribués 2023 (Insee Analyses n° 118)", "Prélèvements et transferts par vingtième de niveau de vie", "https://www.insee.fr/fr/statistiques/8974371", "annuel (édition ponctuelle)"],
  ["Patrimoine", "eurostat", "nama_10_nfa_bs", "Actifs non financiers (logements, terrains, équipements) par secteur", null, "annuel"],
  ["Patrimoine", "eurostat", "bop_iip6_q", "Position extérieure de la France : avoirs à l'étranger et engagements envers l'étranger", null, "trimestriel"],
  ["Patrimoine", "eurostat", "nasa_10_f_bs", "Comptes financiers : actifs et passifs par secteur", null, "annuel"],
  ["Qui fait quoi", "insee", "TCRED-TRAVAIL-EMPLOI-EFF-FP-RATIO", "Effectifs de la fonction publique (État, territoriale, hospitalière)", "https://www.insee.fr/fr/statistiques/series/102341737", "annuel"],
  ["Qui fait quoi", "eurostat", "lfsa_pganws / lfsa_esgaed / demo_pjanbroad", "Population par statut d'activité et par âge", null, "annuel"],
  ["La vie en euros", "insee", "Comptes nationaux distribués, tableau CND.103", "Revenus, prélèvements et transferts détaillés par âge", "https://www.insee.fr/fr/statistiques/8574663", "annuel"],
  ["Inégalités", "insee", "Comptes nationaux distribués 2023 (tableau complémentaire par vingtième)", "Ce que chaque tranche de 5 % paie, reçoit et gagne (travail, patrimoine)", "https://www.insee.fr/fr/statistiques/8974371", "édition ponctuelle"],
  ["Inégalités", "insee", "Enquête Histoire de vie et Patrimoine 2023-2024 : distribution et composition du patrimoine", "Patrimoine par décile, concentration, montants par âge", "https://www.insee.fr/fr/statistiques/5213910", "tous les 3 ans"],
  ["Inégalités", "insee", "Transmissions intergénérationnelles en 2024 (Insee Résultats)", "Part des ménages ayant hérité ou reçu une donation, montants des héritages", "https://www.insee.fr/fr/statistiques/8960185", "tous les 3 ans"],
  ["Inégalités", "eurostat", "gov_10a_taxag (D91A)", "Droits de succession et de donation", null, "annuel"],
  ["Industrie et innovation", "eurostat", "rd_e_gerdtot / rd_p_persocc / sts_inpr_a / htec_emp_nat2 / isoc_eb_ai", "Recherche et développement, chercheurs, production industrielle, emploi de haute technologie, intelligence artificielle", null, "annuel"],
  ["Commerce extérieur", "comext", "DS-059341", "Échanges de biens par partenaire et par produit (SH)", "https://ec.europa.eu/eurostat/databrowser/view/DS-059341/default/table", "mensuel"],
  ["Énergie", "eurostat", "nrg_bal_c", "Bilans énergétiques complets", null, "annuel"],
  ["Énergie", "owid", "owid-energy-data", "Consommation primaire et électricité par source depuis 1965", "https://github.com/owid/energy-data", "annuel"],
  ["Énergie", "odre", "eco2mix-national-tr", "Électricité française en temps réel (15 min)", "https://odre.opendatasoft.com/explore/dataset/eco2mix-national-tr/", "temps réel (chargé par le navigateur)"],
  ["Territoire", "odre", "eco2mix-regional-cons-def", "Production, consommation et échanges d'électricité par région", "https://odre.opendatasoft.com/explore/dataset/eco2mix-regional-cons-def/", "annuel (données consolidées)"],
  ["Territoire", "eurostat", "nama_10r_2gdp / nama_10r_2hhinc / demo_r_pjanaggr3", "PIB, revenu des ménages et population par région", null, "annuel"],
  ["Territoire", "ign", "regions-version-simplifiee.geojson", "Contours des régions", "https://github.com/gregoiredavid/france-geojson", "ponctuel"],
  ["Matières", "eurostat", "env_ac_sd / env_ac_mfa / env_ac_rme / cei_srm030", "Flux de matières, empreinte matières, taux de recyclage", null, "annuel"],
  ["Eau", "eurostat", "env_wat_abs", "Prélèvements d'eau douce par usage", null, "annuel ou biennal"],
  ["Sols", "eurostat", "lan_lcv_ovw / lan_use_ovw", "Occupation et usage des sols (enquête LUCAS)", null, "tous les 3 à 4 ans"],
  ["Alimentation", "fao", "Bilans alimentaires (FBS)", "Production, échanges, usages et calories par produit", "https://www.fao.org/faostat/fr/#data/FBS", "annuel"],
  ["Empreinte carbone", "sdes", "L'empreinte carbone de la France (SDES et INSEE)", "Empreinte par poste de consommation, série depuis 1990, origine des émissions, comparaison internationale", "https://www.statistiques.developpement-durable.gouv.fr/lempreinte-carbone-de-la-france-de-1990-2024", "annuel (octobre)"],
  ["Empreinte carbone", "eurostat", "env_ac_ghgfp / env_ac_ainah_r2", "Empreinte carbone de tous les pays par usage final et pays d'origine (modèle FIGARO), émissions directes des ménages", null, "annuel"],
  ["Solde extérieur", "fmi", "BCA_NGDPD", "Solde de la balance courante en % du PIB, depuis 1980", "https://www.imf.org/external/datamapper/BCA_NGDPD@WEO", "semestriel"],
  ["Solde extérieur", "eurostat", "tipsii10", "Position extérieure nette en % du PIB", null, "annuel"],
  ["Industrie et innovation", "eurostat", "nama_10_a10 / nama_10_a10_e", "Valeur ajoutée et emploi de l'industrie manufacturière, France et voisins", null, "annuel"],
  ["Énergie", "rte", "Futurs énergétiques 2050", "Coûts complets du système électrique selon six scénarios (2060)", "https://assets.rte-france.com/prod/public/2021-10/Futurs-Energetiques-2050-principaux-resultats_0.pdf", "ponctuel"],
  ["Nucléaire", "wna", "Nuclear Power Reactors", "Parc mondial de réacteurs par filière", "https://world-nuclear.org/information-library/nuclear-power-reactors/overview/nuclear-power-reactors", "ponctuel"],
  ["Nucléaire", "wna", "Advanced Nuclear Power Reactors", "Caractéristiques des réacteurs de génération III+", "https://world-nuclear.org/information-library/nuclear-power-reactors/other/advanced-nuclear-power-reactors", "ponctuel"],
  ["Nucléaire", "wna", "Plans for New Reactors Worldwide", "Réacteurs en construction par pays et par modèle", "https://world-nuclear.org/information-library/current-and-future-generation/plans-for-new-reactors-worldwide", "ponctuel"],
  ["Nucléaire", "wna", "SMR Design Database", "Base des petits réacteurs modulaires", "https://world-nuclear.org/information-library/nuclear-power-reactors/small-modular-reactors/small-modular-reactor-smr-design-database", "ponctuel"],
  ["Nucléaire", "wna", "Nuclear Power in France / China", "Histoire et programmes nationaux", "https://world-nuclear.org/information-library/country-profiles/countries-a-f/france", "ponctuel"],
  ["Nucléaire", "ccomptes", "La filière EPR (2025)", "Coûts et retards des EPR, programme EPR2", "https://www.vie-publique.fr/files/rapport/pdf/296839.pdf", "ponctuel"],
  ["Logement (économie)", "insee", "Revenus et patrimoine des ménages 2024", "Propriétaires et patrimoine selon l'âge (début 2021)", "https://www.insee.fr/fr/statistiques/7941429", "ponctuel"],
  ["Retraites", "eurostat", "spr_exp_pens / ilc_pnp2 / ilc_pnp3", "Dépenses de pensions, niveau de vie relatif des 65 ans et plus, taux de remplacement", null, "annuel"],
  ["Retraites", "eurostat", "demo_mlexpec / lfsa_ergan / demo_pjanind", "Espérance de vie à 65 ans, emploi des 60-64 ans, rapport de dépendance des personnes âgées", null, "annuel"],
  ["Pays prospère", "fmi", "World Economic Outlook (datamapper)", "PIB par habitant en PPA, chômage, dette et solde publics", "https://www.imf.org/external/datamapper/datasets/WEO", "semestriel"],
  ["Pays prospère", "pnud", "Rapport sur le développement humain 2025, annexe statistique", "IDH, espérance de vie, années d'études, Gini, parts de revenu, IDH corrigé des inégalités", "https://hdr.undp.org/sites/default/files/2025_HDR/HDR25_Statistical_Annex_Tables_1-7.pdf", "annuel"],
  ["Pays prospère", "bm", "SI.POV.DDAY", "Part de la population vivant avec moins de 3 dollars par jour (PPA 2021)", "https://data.worldbank.org/indicator/SI.POV.DDAY", "annuel"],
  ["Pays prospère", "ti", "Indice de perception de la corruption 2025", "Score de corruption perçue, 182 pays", "https://www.transparency.org/en/cpi/2025", "annuel"],
  ["Pays prospère", "wjp", "Rule of Law Index 2025", "Indice de l’État de droit, 143 pays", "https://worldjusticeproject.org/rule-of-law-index/downloads/WJPIndex2025.pdf", "annuel"],
  ["Pays prospère", "fh", "Freedom in the World 2026", "Libertés politiques et civiles, score sur 100", "https://freedomhouse.org/report/freedom-world", "annuel"],
  ["Pays prospère", "heritage", "Index of Economic Freedom 2026", "Liberté économique, score sur 100, 176 pays", "https://www.heritage.org/index/", "annuel"],
  ["Pays prospère", "owid", "Global Carbon Project (co2-data)", "Émissions de CO2 par habitant sur le territoire", "https://github.com/owid/co2-data", "annuel"],
  ["Vit-on mieux", "insee", "Pouvoir d'achat du revenu disponible brut", "Pouvoir d'achat total et par unité de consommation, depuis 1960", "https://www.insee.fr/fr/statistiques/8612564", "annuel"],
  ["Vit-on mieux", "insee", "Dépenses pré-engagées", "Part des dépenses pré-engagées dans le revenu disponible, depuis 1960", "https://www.insee.fr/fr/statistiques/8612566", "annuel"],
  ["Vit-on mieux", "insee", "Série 000822484", "SMIC horaire brut depuis 1951", "https://www.insee.fr/fr/statistiques/serie/000822484", "à chaque revalorisation"],
  ["Vit-on mieux", "insee", "Série 010567012", "Indice Notaires-INSEE des prix des appartements anciens à Paris, depuis 1992", "https://www.insee.fr/fr/statistiques/serie/010567012", "trimestriel"],
  ["Vit-on mieux", "insee", "Friggit (IGEDD), prix des logements à Paris 1200-2012", "Indice long du prix des logements à Paris, raccordé avant 1992", "https://www.igedd.developpement-durable.gouv.fr/IMG/xls/prix-immo-paris-1200-2012_cle2f2d1a.xls", "ponctuel"],
  ["Vit-on mieux", "eurostat", "prc_ppp_ind", "Consommation individuelle effective par habitant en standards de pouvoir d'achat (UE = 100)", null, "annuel"],
  ["Vit-on mieux", "eurostat", "nama_10_pc", "Consommation individuelle effective par habitant en volume", null, "annuel"],
  ["Vit-on mieux", "eurostat", "tec00113", "Revenu disponible brut ajusté des ménages par habitant en PPA", null, "annuel"],
  ["Temps de travail", "eurostat", "lfsi_dwl_a", "Durée de la vie active, par pays", null, "annuel"],
  ["Temps de travail", "eurostat", "lfsa_eppga / lfsa_eppgai / lfsa_ewhan2", "Temps partiel (dont subi), heures hebdomadaires à temps plein et partiel", null, "annuel"],
  ["Climat", "eurostat", "env_air_gge", "Émissions de gaz à effet de serre par secteur (inventaire national)", null, "annuel (juin)"],
  ["Déchets", "eurostat", "env_wasgen / env_wastrt / env_wasmun", "Production et traitement des déchets", null, "biennal (ménagers : annuel)"],
  ["Transports", "eurostat", "tran_hv_psmod / tran_hv_frmod / rail_pa_total / avia_paoc / road_go_ta_tott", "Parts modales et volumes de voyageurs et de marchandises", null, "annuel"],
  ["Argent public", "insee", "Comptes nationaux annuels base 2020 depuis 1949 ; Jordà, Schularick et Taylor, Macrohistory Database (1900-2017)", "Graphique « Un siècle de franc » : inflation, solde budgétaire, exportations, cours du dollar", "https://www.macrohistory.net/database/", "annuel"],
  ["Argent privé", "insee", "Comptes nationaux annuels base 2020 : salaires et traitements bruts, emploi salarié EQTP, consommation des ménages par fonction, PIB par habitant", "Salaire moyen depuis 1949, budget des ménages depuis 1959", "https://www.insee.fr/fr/statistiques/serie/011785411", "annuel"],
  ["PIB", "harvard", "Energy_Data_FRANCE.xlsx", "Consommation d'énergie par habitant en France, 1800-2008", "https://histecon.fas.harvard.edu/energyhistory/data_sets/Energy_Data_FRANCE.xlsx", "ponctuel"],
  ["Industrie et innovation", "eurostat", "sdg_09_40 / rd_e_gerdtot", "Demandes de brevets européens par habitant, dépense de R&D par secteur", null, "annuel"],
  ["Patrimoine historique", "eurostat", "tour_occ_ninat / ilc_scp03 / gov_10a_exp", "Nuitées des touristes étrangers, visites de sites culturels, dépense publique culturelle", null, "annuel"],
  ["Biodiversité", "insee", "Indicateurs de développement durable 15.i6 (d'après le MNHN, programme STOC)", "Oiseaux communs par milieu, France métropolitaine", "https://www.insee.fr/fr/statistiques/2658605", "annuel"],
  ["Biodiversité", "eurostat", "env_bio2 / sdg_15_20 / sdg_14_10", "Oiseaux des milieux agricoles par pays, aires protégées", null, "annuel"],
  ["Forêt", "eurostat", "env_air_gge / for_area_efa", "Absorption de CO₂ par les forêts, surface forestière", null, "annuel"],
  ["Air", "eurostat", "sdg_11_52", "Décès prématurés dus aux particules fines (estimations de l'Agence européenne pour l'environnement)", null, "annuel"],
  ["Du champ au caddie", "ofpm", "Rapport au Parlement 2026", "Euro alimentaire, marges des grandes surfaces par rayon, comptes des exploitations laitières", "https://www.franceagrimer.fr/sites/default/files/2026-10/2026_rapport_OFPM_v2.pdf", "annuel"],
  ["Sous-sol", "brgm", "Cartes géologiques au 1/1 000 000, 1/250 000 et 1/50 000", "Carte géologique de la France, diffusée par la Géoplateforme de l'IGN", "https://cartes.gouv.fr/rechercher-une-donnee/dataset/BRGM_CARTES-GEOLOGIQUES", "ponctuel"],
  ["Agriculture", "eurostat", "apro_cpsh1 / org_cropar", "Surfaces par culture, surfaces en agriculture biologique", null, "annuel"],
  ["Monnaie et croissance", "insee", "Comptes nationaux annuels base 2020 : PIB en valeur et en volume ; Eurostat irt_lt_mcby_a", "Croissance du PIB en valeur, taux d'intérêt à long terme de l'État", "https://www.insee.fr/fr/statistiques/serie/011779992", "annuel"],
  ["Monnaie et croissance", "jst", "Jordà, Schularick et Taylor, Macrohistory Database", "Crédits bancaires au secteur privé, monnaie au sens large, dette publique depuis 1900", "https://www.macrohistory.net/database/", "ponctuel"],
  ["Limites physiques à la croissance", "bm", "WDI : SP.POP.TOTL, SP.DYN.CBRT.IN, SP.DYN.CDRT.IN, SP.DYN.LE00.IN, NV.IND.TOTL.KD, NV.SRV.TOTL.KD, AG.PRD.FOOD.XD", "Population, natalité, mortalité, espérance de vie, industrie, services, production alimentaire (monde)", "https://data.worldbank.org", "annuel"],
  ["Limites physiques à la croissance", "owid", "CO₂ et énergie (Global Carbon Project, Energy Institute)", "CO₂ émis cumulé, consommation d'énergies fossiles (monde)", "https://github.com/owid/co2-data", "annuel"],
  ["Limites physiques à la croissance", "world3", "pyworld3 (reproduction de World3, Meadows et al., 1974)", "Scénarios du modèle World3 recalculés", "https://github.com/cvanwynsberghe/pyworld3", "ponctuel"],
  ["Tableau périodique", "ptj", "Periodic-Table-JSON (données issues de Wikipédia)", "Masses, configurations électroniques, électronégativité, énergies d'ionisation, rayons, densités, températures de fusion des 118 éléments", "https://github.com/Bowserinator/Periodic-Table-JSON", "ponctuel"],
  ["Sociologie électorale", "ipsos", "Sociologie des électorats et profil des abstentionnistes : législatives 2024 (Ipsos-Talan), présidentielle 2022 (Ipsos-Sopra Steria)", "Vote et participation selon l'âge, la profession, le diplôme, le revenu, la commune, la religion", "https://www.ipsos.com/fr-fr/legislatives-2024/sociologie-des-electorats-legislatives-2024", "à chaque élection"],
  ["Sociologie électorale", "interieur", "Élections législatives 2024 : résultats définitifs des 1er et 2nd tours (data.gouv.fr)", "Résultats par département et par circonscription, élus", "https://www.data.gouv.fr/fr/datasets/elections-legislatives-des-30-juin-et-7-juillet-2024-resultats-definitifs-du-1er-tour/", "à chaque élection"],
  ["Sociologie électorale", "wpid", "World Political Cleavages and Inequality Database (Gethin, Martínez-Toledano, Piketty)", "Vote de gauche et de droite selon le sexe, le diplôme et le revenu, 21 démocraties, 1948-2020", "https://wpid.world", "ponctuel"],
  ["Sociologie électorale", "insee", "Enquête sur la participation électorale 2022 (Insee Première n° 1928)", "Vote systématique, intermittent ou abstention selon l'âge", "https://www.insee.fr/fr/statistiques/6658145", "après chaque cycle électoral"],
  ["Sans intrants", "fao", "FAOSTAT : Production (QCL), Engrais par élément nutritif (RFN), Pesticides (RP), Bilans alimentaires (FBS)", "Rendements des cultures depuis 1961, engrais minéraux et pesticides, bilan des céréales", "https://www.fao.org/faostat/fr/", "annuel"],
  ["Sans intrants", "agreste", "Primeur n° 8, juin 2023 : enquête Terres labourables", "Rendements en agriculture biologique et conventionnelle, 2018-2022", "https://agreste.agriculture.gouv.fr/agreste-web/disaron/Pri2308/detail/", "ponctuel"],
  ["Pesticides", "eurostat", "aei_hri / sdg_02_40 / aei_pr_gnb", "Risque pesticides, agriculture biologique, excédent d'azote", null, "annuel"],
  ["Catastrophes", "eurostat", "cli_iad_loss", "Pertes économiques dues aux événements climatiques (base CATDAT de l'AEE)", null, "annuel"],
  ["Transition", "eurostat", "env_ac_tax / gov_10a_exp", "Taxes environnementales, dépense publique de protection de l'environnement", null, "annuel"],
  ["Couper où", "eurostat", "gov_10a_exp", "Dépense publique par fonction (COFOG), en % du PIB, pays européens", null, "annuel (février)"],
  ["Argent public", "eurostat", "gov_10a_taxag / gov_10a_main", "Impôts, cotisations et dépense publique en % du PIB, pays européens", null, "annuel"],
  ["Argent public", "eurostat", "nasa_10_nf_tr", "Revenu disponible des ménages et des entreprises (comptes de secteur)", null, "annuel"],
  ["Argent privé", "eurostat", "prc_hpi_a / sts_copi_a / ilc_di03 / ilc_mded01", "Prix des logements, coût de construction, revenu médian, part du logement dans le revenu", null, "annuel"],
  ["Argent privé", "insee", "Jordà, Schularick et Taylor, Macrohistory Database", "Salaires réels et PIB par habitant avant 1949", "https://www.macrohistory.net/database/", "ponctuel"],
  ["Énergie", "owid", "owid-energy-data (energy_per_capita)", "Énergie primaire par habitant depuis 1965", "https://github.com/owid/energy-data", "annuel"],
  ["Argentine", "argentine", "PIB, inflation, pauvreté (INDEC), budget, change, aides du FMI et des États-Unis", "Encadré « Et l'Argentine ? » : liens vers chaque article de presse dans l'encadré", null, "ponctuel (chiffres arrêtés à mars 2026)"],
  ["Argent public", "marches", "France : taux d'emprunt à 10 ans (OAT)", "Valeur par défaut du simulateur : environ 4,7 % en novembre 2026 (Trading Economics, d'après les marchés)", "https://tradingeconomics.com/france/government-bond-yield", "quotidien"],
  ["Chômage", "insee", "Enquête Emploi : chômage au sens du BIT, halo autour du chômage, sous-emploi (BDM, CHOMAGE-TRIM-NATIONAL, EMPLOI-BIT-TRIM)", "Chômeurs, halo, sous-emploi, chômage de longue durée, France entière", "https://www.insee.fr/fr/statistiques/serie/011818543", "trimestriel"],
  ["Chômage", "insee", "Demandeurs d'emploi inscrits à France Travail (DARES, via la BDM de l'INSEE)", "Catégories A, B, C, D, E", "https://www.insee.fr/fr/statistiques/serie/010597456", "trimestriel"],
  ["Chômage", "eurostat", "lfsi_sla_a", "Chômage élargi (labour market slack)", null, "annuel"],
  ["Démographie", "eurostat", "demo_gind / demo_pjan / proj_23np", "Population, naissances, décès, pyramide des âges, projections", null, "annuel"],
  ["Immigration", "eurostat", "migr_pop3ctb / migr_imm1ctz / migr_emi1ctz / migr_pop1ctz", "Population par pays de naissance et nationalité, flux migratoires", null, "annuel"],
  ["Temps de travail", "eurostat", "nama_10_a10_e / tus_00age", "Heures travaillées par branche, enquête emploi du temps (2010)", null, "annuel / ponctuel"],
  ["Emploi", "eurostat", "lfsa_pganws / lfsa_egais / lfsa_esgaed / une_rt_a / lfsi_emp_a", "Enquête Emploi : activité, chômage, métiers, statuts", null, "annuel"],
  ["Justice", "eurostat", "crim_off_cat / crim_just_ctz / crim_just_age / crim_pris_cap / crim_pris_ctz / crim_just_job / crim_hom_vrel", "Infractions, chaîne pénale, détenus, personnels, homicides", null, "annuel"],
  ["Santé", "eurostat", "demo_mlexpec / hlth_cd_aro / hlth_sha11_hchf / hlth_sha11_hf", "Espérance de vie, causes de décès, comptes de la santé", null, "annuel"],
  ["Éducation", "eurostat", "educ_uoe_enra01 / educ_uoe_fini04 / edat_lfse_03 / educ_outc_pisa / sdg_04_10 / edat_lfse_20 / educ_uoe_perp04 / educ_uoe_fine06 / trng_lfse_01", "Effectifs, dépense par élève, diplômes, résultats PISA (OCDE), décrochage, jeunes sans activité, taux d'encadrement, formation des adultes", null, "annuel"],
  ["Logement", "eurostat", "ilc_lvho02 / 03 / 05a / 07a / 50a, prc_hpi_a, prc_hicp_aind", "Statut d'occupation, surpeuplement, coût, prix des logements", null, "annuel / trimestriel"],
  ["Inégalités", "eurostat", "ilc_di01 / ilc_di11 / ilc_di11b / ilc_di12 / ilc_di12b / ilc_li02 / ilc_li10 / ilc_mdsd11", "Distribution des revenus, pauvreté, privation (enquête SRCV)", null, "annuel"],
  ["Capital social et culturel", "eurostat", "ilc_scp03 à 28 / ilc_pw01 à 10", "Pratiques culturelles, liens, engagement, confiance, bien-être", null, "module tous les 6 ans ; bien-être annuel"],
];

// un thème n'est listé que si au moins un onglet publié l'utilise (les rubriques non publiées sont retirées de la page en ligne)
function themeVisible(th) {
  const arts = Object.entries(PAR_ARTICLE).filter(([, ths]) => ths.includes(th)).map(([id]) => id);
  return !arts.length || arts.some(id => document.getElementById(id));
}
function render() {
  const el = document.getElementById("src-table"); if (!el) return;
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const link = (code, url) => {
    if (url) return `<a href="${url}" target="_blank" rel="noopener">${esc(code)}</a>`;
    return code.split(/\s*\/\s*/).map(c => /^[a-z]{2,5}_[\w]+$/.test(c.trim()) ? `<a href="${ES(c.trim())}" target="_blank" rel="noopener"><code>${esc(c.trim())}</code></a>` : esc(c)).join(" · ");
  };
  el.innerHTML = `<div class="table-scroll"><table class="cmp-t src"><thead><tr><th>Thème</th><th>Source</th><th>Jeu de données</th><th>Contenu</th><th>Publication</th></tr></thead><tbody>` +
    S.filter(([t]) => themeVisible(t)).map(([t, o, c, d, u, f]) => `<tr><td>${esc(t)}</td><td>${esc(ORG[o].nom)}</td><td>${link(c, u)}</td><td>${esc(d)}</td><td>${esc(f)}</td></tr>`).join("") + `</tbody></table></div>`;
  document.getElementById("src-orgs").innerHTML = Object.values(ORG).map(o =>
    `<div class="kpi"><div class="v" style="font-size:1rem"><a href="${o.url}" target="_blank" rel="noopener">${esc(o.nom)}</a></div><div class="l">${esc(o.desc)}<br><b>Licence :</b> ${esc(o.licence)}</div></div>`).join("");
}
// en bas de chaque article, ses sources en petit
const PAR_ARTICLE = { pib: ["PIB"], "argent-prive": ["Argent privé"], "niveau-vie": ["Vit-on mieux", "Argent privé", "Logement (économie)"], repartition: ["Argent public", "PIB"], population: ["Qui fait quoi"], "argent-public": ["Argent public"], "cycle-vie": ["La vie en euros"], retraites: ["Retraites"], simulateur: ["Argent public", "PIB", "Argentine"],
  duree: ["Argent public"], monnaie: ["Monnaie et croissance"], limites: ["Limites physiques à la croissance"], electorat: ["Sociologie électorale"], tableau: ["Tableau périodique"], couper: ["Couper où"], patrimoine: ["Patrimoine", "Solde extérieur"], commerce: ["Commerce extérieur"], industrie: ["Industrie et innovation"], comparer: ["PIB", "Argent public", "Patrimoine"], prosperite: ["Pays prospère"],
  biodiversite: ["Biodiversité"], foret: ["Forêt"], air: ["Air"], soussol: ["Sous-sol"], agriculture: ["Agriculture", "Sans intrants", "Pesticides"], catastrophes: ["Catastrophes"], transition: ["Transition"],
  energie: ["Énergie"], nucleaire: ["Nucléaire"], matieres: ["Matières"], eau: ["Eau"], sols: ["Sols"], alimentation: ["Alimentation", "Du champ au caddie"], climat: ["Climat", "Empreinte carbone"], dechets: ["Déchets"],
  territoire: ["Territoire"], transports: ["Transports"], demographie: ["Démographie"], immigration: ["Immigration"], travail: ["Temps de travail"], emploi: ["Emploi"], chomage: ["Chômage"],
  justice: ["Justice"], sante: ["Santé"], education: ["Éducation"], logement: ["Logement"], inegalites: ["Inégalités"], capital: ["Capital social et culturel"], "patrimoine-hist": ["Patrimoine historique"] };
function footers() {
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  Object.entries(PAR_ARTICLE).forEach(([id, themes]) => {
    const sec = document.getElementById(id); if (!sec || sec.querySelector(".src-foot")) return;
    const rows = S.filter(r => themes.includes(r[0]));
    if (!rows.length) return;
    const parOrg = {};
    rows.forEach(([, o, c, , u]) => (parOrg[o] = parOrg[o] || []).push(u ? `<a href="${u}" target="_blank" rel="noopener">${esc(c)}</a>` :
      c.split(/\s*\/\s*/).map(x => /^[a-z]{2,5}_[\w]+$/.test(x.trim()) ? `<a href="${ES(x.trim())}" target="_blank" rel="noopener">${esc(x.trim())}</a>` : esc(x)).join(", ")));
    sec.insertAdjacentHTML("beforeend", `<p class="src-foot"><span>Sources</span> ${Object.entries(parOrg).map(([o, l]) => `<b>${esc(ORG[o].nom)}</b> : ${l.join(" ; ")}`).join(" · ")}. <a href="#sources">Toutes les sources</a></p>`);
  });
}
function start() { render(); footers(); }
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();
