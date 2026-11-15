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
  sdes: { nom: "SDES (ministère de la Transition écologique)", desc: "Service des données et études statistiques : énergie, climat, environnement, logement, transports.", licence: "Licence Ouverte Etalab 2.0", url: "https://www.statistiques.developpement-durable.gouv.fr" },
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
  ["Temps de travail", "eurostat", "lfsi_dwl_a", "Durée de la vie active, par pays", null, "annuel"],
  ["Temps de travail", "eurostat", "lfsa_eppga / lfsa_eppgai / lfsa_ewhan2", "Temps partiel (dont subi), heures hebdomadaires à temps plein et partiel", null, "annuel"],
  ["Climat", "eurostat", "env_air_gge", "Émissions de gaz à effet de serre par secteur (inventaire national)", null, "annuel (juin)"],
  ["Déchets", "eurostat", "env_wasgen / env_wastrt / env_wasmun", "Production et traitement des déchets", null, "biennal (ménagers : annuel)"],
  ["Transports", "eurostat", "tran_hv_psmod / tran_hv_frmod / rail_pa_total / avia_paoc / road_go_ta_tott", "Parts modales et volumes de voyageurs et de marchandises", null, "annuel"],
  ["Argent public", "insee", "Comptes nationaux annuels base 2020 depuis 1949 ; Jordà, Schularick et Taylor, Macrohistory Database (1900-2017)", "Graphique « Un siècle de franc » : inflation, solde budgétaire, exportations, cours du dollar", "https://www.macrohistory.net/database/", "annuel"],
  ["Argent privé", "insee", "Comptes nationaux annuels base 2020 : salaires et traitements bruts, emploi salarié EQTP, consommation des ménages par fonction, PIB par habitant", "Salaire moyen depuis 1949, budget des ménages depuis 1959", "https://www.insee.fr/fr/statistiques/serie/011785411", "annuel"],
  ["PIB", "harvard", "Energy_Data_FRANCE.xlsx", "Consommation d'énergie par habitant en France, 1800-2008", "https://histecon.fas.harvard.edu/energyhistory/data_sets/Energy_Data_FRANCE.xlsx", "ponctuel"],
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

function render() {
  const el = document.getElementById("src-table"); if (!el) return;
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const link = (code, url) => {
    if (url) return `<a href="${url}" target="_blank" rel="noopener">${esc(code)}</a>`;
    return code.split(/\s*\/\s*/).map(c => /^[a-z]{2,5}_[\w]+$/.test(c.trim()) ? `<a href="${ES(c.trim())}" target="_blank" rel="noopener"><code>${esc(c.trim())}</code></a>` : esc(c)).join(" · ");
  };
  el.innerHTML = `<div class="table-scroll"><table class="cmp-t src"><thead><tr><th>Thème</th><th>Source</th><th>Jeu de données</th><th>Contenu</th><th>Publication</th></tr></thead><tbody>` +
    S.map(([t, o, c, d, u, f]) => `<tr><td>${esc(t)}</td><td>${esc(ORG[o].nom)}</td><td>${link(c, u)}</td><td>${esc(d)}</td><td>${esc(f)}</td></tr>`).join("") + `</tbody></table></div>`;
  document.getElementById("src-orgs").innerHTML = Object.values(ORG).map(o =>
    `<div class="kpi"><div class="v" style="font-size:1rem"><a href="${o.url}" target="_blank" rel="noopener">${esc(o.nom)}</a></div><div class="l">${esc(o.desc)}<br><b>Licence :</b> ${esc(o.licence)}</div></div>`).join("");
}
// en bas de chaque article, ses sources en petit
const PAR_ARTICLE = { pib: ["PIB"], "argent-prive": ["Argent privé"], repartition: ["Argent public", "PIB"], population: ["Qui fait quoi"], "argent-public": ["Argent public"], "cycle-vie": ["La vie en euros"], simulateur: ["Argent public", "PIB", "Argentine"],
  duree: ["Argent public"], couper: ["Couper où"], patrimoine: ["Patrimoine"], commerce: ["Commerce extérieur"], industrie: ["Industrie et innovation"], comparer: ["PIB", "Argent public", "Patrimoine"],
  energie: ["Énergie"], matieres: ["Matières"], eau: ["Eau"], sols: ["Sols"], alimentation: ["Alimentation"], climat: ["Climat"], empreinte: ["Empreinte carbone"], dechets: ["Déchets"],
  territoire: ["Territoire"], transports: ["Transports"], demographie: ["Démographie"], immigration: ["Immigration"], travail: ["Temps de travail"], emploi: ["Emploi"], chomage: ["Chômage"],
  justice: ["Justice"], sante: ["Santé"], education: ["Éducation"], logement: ["Logement"], inegalites: ["Inégalités"], capital: ["Capital social et culturel"] };
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
