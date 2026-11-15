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
  ["Patrimoine", "eurostat", "nasa_10_f_bs", "Comptes financiers : actifs et passifs par secteur", null, "annuel"],
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
  ["Climat", "eurostat", "env_air_gge", "Émissions de gaz à effet de serre par secteur (inventaire national)", null, "annuel (juin)"],
  ["Déchets", "eurostat", "env_wasgen / env_wastrt / env_wasmun", "Production et traitement des déchets", null, "biennal (ménagers : annuel)"],
  ["Transports", "eurostat", "tran_hv_psmod / tran_hv_frmod / rail_pa_total / avia_paoc / road_go_ta_tott", "Parts modales et volumes de voyageurs et de marchandises", null, "annuel"],
  ["Démographie", "eurostat", "demo_gind / demo_pjan / proj_23np", "Population, naissances, décès, pyramide des âges, projections", null, "annuel"],
  ["Immigration", "eurostat", "migr_pop3ctb / migr_imm1ctz / migr_emi1ctz / migr_pop1ctz", "Population par pays de naissance et nationalité, flux migratoires", null, "annuel"],
  ["Temps de travail", "eurostat", "nama_10_a10_e / tus_00age", "Heures travaillées par branche, enquête emploi du temps (2010)", null, "annuel / ponctuel"],
  ["Emploi", "eurostat", "lfsa_pganws / lfsa_egais / lfsa_esgaed / une_rt_a / lfsi_emp_a", "Enquête Emploi : activité, chômage, métiers, statuts", null, "annuel"],
  ["Justice", "eurostat", "crim_off_cat / crim_just_ctz / crim_just_age / crim_pris_cap / crim_pris_ctz / crim_just_job / crim_hom_vrel", "Infractions, chaîne pénale, détenus, personnels, homicides", null, "annuel"],
  ["Santé", "eurostat", "demo_mlexpec / hlth_cd_aro / hlth_sha11_hchf / hlth_sha11_hf", "Espérance de vie, causes de décès, comptes de la santé", null, "annuel"],
  ["Éducation", "eurostat", "educ_uoe_enra01 / educ_uoe_fini04 / edat_lfse_03", "Effectifs, dépense par élève, diplômes", null, "annuel"],
  ["Logement", "eurostat", "ilc_lvho02 / 03 / 05a / 07a / 50a, prc_hpi_a, prc_hicp_aind", "Statut d'occupation, surpeuplement, coût, prix des logements", null, "annuel / trimestriel"],
  ["Inégalités", "eurostat", "ilc_di01 / ilc_di12 / ilc_li02 / ilc_li10 / ilc_mdsd11", "Distribution des revenus, pauvreté, privation (enquête SRCV)", null, "annuel"],
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
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", render); else render();
})();
