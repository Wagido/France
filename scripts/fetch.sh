#!/usr/bin/env bash
# Télécharge les données brutes (Eurostat + INSEE) dans data/sources/.
# Usage : bash scripts/fetch.sh   (depuis le dossier finances/)
#
# Tolérance aux pannes : chaque source est téléchargée dans un fichier temporaire, vérifiée, puis seulement
# alors mise à la place de l'ancienne. Si une source échoue (adresse déplacée, serveur en maintenance,
# série renommée), l'ancien fichier, déjà enregistré dans le dépôt, est conservé et on passe à la suivante.
# Les échecs sont listés à la fin, et le script se termine alors en erreur (code 2) : c'est l'étape finale
# du workflow qui fait échouer le job, après les calculs et l'enregistrement des données qui ont réussi.
# La date du dernier téléchargement réussi de chaque fichier est tenue dans data/sources/_dates.json.
set -uo pipefail
SCRIPTS="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPTS/../data/sources"
E="https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data"
ECHECS_FICHIER="${ECHECS_FICHIER:-$(pwd)/_echecs.txt}"
: > "$ECHECS_FICHIER"
REUSSIS="$(mktemp)"
AUJOURDHUI="$(date -u +%Y-%m-%d)"
echec() { echo "  ✗ ÉCHEC : $1 — $2"; printf '%s\t%s\n' "$1" "$2" >> "$ECHECS_FICHIER"; }
ok() { printf '%s\n' "$1" >> "$REUSSIS"; }
# filtre DEST commande... : produit DEST à partir d'un téléchargement ; en cas d'échec, l'ancien DEST est restauré
filtre() {
  local dest="$1"; shift
  if "$@"; then ok "$dest"
  else echec "$dest" "filtre en échec (ancien fichier conservé)"; git checkout -- "$dest" 2>/dev/null || true
  fi
}
# vérifie qu'un téléchargement ressemble bien à des données (et pas à une page d'erreur)
valide() {
  local dest="$1" f="$2"
  [ -s "$f" ] || { echo "fichier vide"; return 1; }
  case "$dest" in
    *.json) python3 -c 'import json,sys; d=json.load(open(sys.argv[1])); sys.exit(1 if isinstance(d,dict) and "error" in d and not ("value" in d or "data" in d) else 0)' "$f" 2>/dev/null || { echo "JSON invalide ou message d'erreur"; return 1; } ;;
    *.csv) head -c 200 "$f" | grep -qi '<html\|<!doctype' && { echo "page HTML au lieu d'un CSV"; return 1; } ;;
  esac
  return 0
}
get() {
  local dest="$1" url="$2" tmp msg nom
  case "$dest" in /*) nom="$url" ;; *) nom="$dest" ;; esac   # fichier temporaire : on nomme la source par son adresse
  echo "→ $nom"
  tmp="$(mktemp)"
  if ! curl -fsSL --retry 3 --retry-delay 10 --max-time 600 -A "Mozilla/5.0" "$url" -o "$tmp"; then
    rm -f "$tmp"; echec "$nom" "téléchargement impossible (ancien fichier conservé)"; return 1
  fi
  if ! msg="$(valide "$dest" "$tmp")"; then rm -f "$tmp"; echec "$nom" "$msg (ancien fichier conservé)"; return 1; fi
  mkdir -p "$(dirname "$dest")"; mv -f "$tmp" "$dest"
  case "$dest" in /*) ;; *) printf '%s\n' "$dest" >> "$REUSSIS" ;; esac   # les fichiers temporaires ne sont pas datés
  return 0
}
# tout autre traitement qui échoue (filtrage, conversion) est aussi listé, sans arrêter le script
trap 'case "$BASH_COMMAND" in get\ *|return\ *) ;; *) echec "ligne $LINENO" "commande en échec : ${BASH_COMMAND:0:120}" ;; esac' ERR
set -o errtrace

# PIB : demande, revenus, valeur ajoutée par branche et par secteur, population
get nama_10_gdp.json    "$E/nama_10_gdp?geo=FR&unit=CP_MEUR&sinceTimePeriod=1995"
get nama_10_a10.json    "$E/nama_10_a10?geo=FR&unit=CP_MEUR&na_item=B1G&sinceTimePeriod=2015"
get nasa_10_nf_tr.json  "$E/nasa_10_nf_tr?geo=FR&unit=CP_MEUR&sinceTimePeriod=2015&na_item=B1G&na_item=P51C&na_item=P1&na_item=P2&na_item=B2A3G&na_item=D1&na_item=P3&na_item=P51G"
get nasa_revenus.json  "$E/nasa_10_nf_tr?geo=FR&unit=CP_MEUR&sinceTimePeriod=2015&na_item=B6G&na_item=D1&na_item=D61&na_item=D62&na_item=D5&na_item=D4&na_item=B2A3G&na_item=D7&sector=S11&sector=S12&sector=S13&sector=S14_S15&sector=S1"
get gov_10a_taxag_pays.json "$E/gov_10a_taxag?unit=PC_GDP&sector=S13_S212&na_item=D2_D5_D91_D61_M_D995&sinceTimePeriod=2015"
get gov_10a_main_pays_te.json "$E/gov_10a_main?unit=PC_GDP&sector=S13&na_item=TE&sinceTimePeriod=2015"
get bop_iip_fr.json "$E/bop_iip6_q?geo=FR&currency=MIO_EUR&partner=WRL_REST&sector10=S1&sectpart=S1&bop_item=FA&stk_flow=A_LE&stk_flow=L_LE&stk_flow=N_LE&sinceTimePeriod=2015"
get lfsi_dwl_a.json "$E/lfsi_dwl_a?unit=YR&sex=T&sinceTimePeriod=2015"
get gov_10a_exp_pays_pib.json "$E/gov_10a_exp?unit=PC_GDP&na_item=TE&sector=S13&sinceTimePeriod=2022"
mkdir -p innov
get innov/sdg_09_40.json "$E/sdg_09_40?sinceTimePeriod=2000"
get innov/rd_e_gerdtot.json "$E/rd_e_gerdtot?unit=PC_GDP&sinceTimePeriod=2015"
mkdir -p patrimoine_hist
get patrimoine_hist/tour_occ_ninat.json "$E/tour_occ_ninat?unit=NR&c_resid=FOR&nace_r2=I551-I553&sinceTimePeriod=2019"
get patrimoine_hist/ilc_scp03.json "$E/ilc_scp03?sinceTimePeriod=2015"
mkdir -p agri
CR="&crops=UAA&crops=ARA&crops=C0000&crops=P0000&crops=R1000&crops=R2000&crops=I1100&crops=G0000&crops=J0000&crops=V0000_S0000&crops=F0000&crops=T0000&crops=W1000&crops=O1000&crops=Q0000"
get agri/cultures.json "$E/apro_cpsh1?geo=FR&strucpro=MAR_THS_HA&sinceTimePeriod=2000$CR"
get agri/cultures_ar.json "$E/apro_cpsh1?geo=FR&strucpro=AR_THS_HA&sinceTimePeriod=2000$CR"
get agri/bio.json "$E/org_cropar?geo=FR&unit=HA&agprdmet=TOTAL&sinceTimePeriod=2012"
get agri/cult_pays.json "$E/apro_cpsh1?strucpro=MAR_THS_HA&sinceTimePeriod=2022&crops=UAA&crops=C0000&crops=J0000"
# Monnaie et croissance : agrégats monétaires M1, M2, M3 et billets de la zone euro (BCE), PIB de la zone euro
mkdir -p monnaie
get monnaie/ecb_agregats.csv "https://data-api.ecb.europa.eu/service/data/BSI/M.U2.Y.V.M10+M20+M30+L10.X.1.U2.2300.Z01.E?format=csvdata&detail=dataonly"
get monnaie/ecb_target2.csv "https://data-api.ecb.europa.eu/service/data/TGB/M.DE+FR+IT+ES+NL+GR.N.A094T.U2.EUR.E?format=csvdata&detail=dataonly"
get monnaie/ecb_taux.csv "https://data-api.ecb.europa.eu/service/data/FM/B.U2.EUR.4F.KR.DFR+MRR_FR.LEV?format=csvdata&detail=dataonly"
get monnaie/pib_zone_euro.json "$E/nama_10_gdp?geo=EA20&unit=CP_MEUR&na_item=B1GQ"
# Limites à la croissance : séries mondiales (Banque mondiale, Our World in Data, lignes « World » seulement)
mkdir -p limites
for i in SP.POP.TOTL SP.DYN.CBRT.IN SP.DYN.CDRT.IN SP.DYN.LE00.IN NV.IND.TOTL.KD NV.SRV.TOTL.KD AG.PRD.FOOD.XD; do
  get "limites/wb_$i.json" "https://api.worldbank.org/v2/country/WLD/indicator/$i?format=json&per_page=200"
done
for f in co2 energy; do
  get "limites/owid_$f.csv" "https://raw.githubusercontent.com/owid/$f-data/master/owid-$f-data.csv" && \
  filtre "limites/owid_${f}_monde.csv" python3 -c "import csv,sys; r=csv.DictReader(open(sys.argv[1])); w=csv.DictWriter(open(sys.argv[2],'w',newline=''),fieldnames=r.fieldnames); w.writeheader(); [w.writerow(x) for x in r if x['country']=='World']" "limites/owid_$f.csv" "limites/owid_${f}_monde.csv"
  rm -f "limites/owid_$f.csv"
done
# Sociologie électorale : rapports Ipsos (PDF converti en texte ; les valeurs sont retranscrites dans scripts/build_sociologie.py)
mkdir -p sociologie
get sociologie/ipsos_legislatives_2024.pdf "https://www.ipsos.com/sites/default/files/ct/news/documents/2024-06/ipsos-talan-sociologie-electorats-legislatives-30-juin-rapport-complet.pdf" && pdftotext -layout sociologie/ipsos_legislatives_2024.pdf sociologie/ipsos_legislatives_2024.txt && rm -f sociologie/ipsos_legislatives_2024.pdf || true
DG="https://static.data.gouv.fr/resources/elections-legislatives-des-30-juin-et-7-juillet-2024-resultats-definitifs"
get sociologie/legislatives2024_t1_departements.csv "$DG-du-1er-tour/20240710-171330/resultats-definitifs-par-departements.csv"
get sociologie/legislatives2024_t1_circonscriptions.csv "$DG-du-1er-tour/20240710-171413/resultats-definitifs-par-circonscriptions-legislatives.csv"
get sociologie/legislatives2024_t2_circonscriptions.csv "$DG-du-2nd-tour/20240710-170728/resultats-definitifs-par-circonscription.csv"
# Sans intrants ? rendements, engrais et pesticides de la France (FAOSTAT, fichiers complets filtrés)
FB="https://bulks-faostat.fao.org/production"
for z in "Production_Crops_Livestock_E_Europe:fao_rendements:rendements" "Inputs_FertilizersNutrient_E_Europe:fao_engrais_fr:france" "Inputs_Pesticides_Use_E_All_Data:fao_pesticides_fr:france"; do
  IFS=: read -r f out mode <<< "$z"; TMPZ=$(mktemp)
  get "$TMPZ" "$FB/$f.zip" && \
  filtre "agri/$out.csv" python3 "$SCRIPTS/filter_fao_agri.py" "$TMPZ" "agri/$out.csv" "$mode"
  rm -f "$TMPZ"
done
mkdir -p env
get env/oiseaux_fr.json "https://api.insee.fr/melodi/data/DS_NAT_SDG?INDICATOR_SDG=15.i6a&INDICATOR_SDG=15.i6b&maxResult=1000"
get env/oiseaux_ue.json "$E/env_bio2"
get env/aires.json "$E/sdg_15_20?unit=PC"
get env/aires_mer.json "$E/sdg_14_10?unit=PC"
get env/gge_forest.json "$E/env_air_gge?airpol=GHG&unit=MIO_T&src_crf=CRF4A&src_crf=CRF4&sinceTimePeriod=1990"
get env/for_area.json "$E/for_area_efa?indic_fo=FOR&stk_flow=STK_CL&unit=THS_HA"
get env/pm_deaths.json "$E/sdg_11_52?sinceTimePeriod=2005"
get env/hri.json "$E/aei_hri?sinceTimePeriod=2011"
get env/bio.json "$E/sdg_02_40?sinceTimePeriod=2012"
get env/azote.json "$E/aei_pr_gnb?nutrient=N&indic_ag=BAL_UAA&sinceTimePeriod=2005"
get env/pertes.json "$E/cli_iad_loss?sinceTimePeriod=1980"
get env/taxes.json "$E/env_ac_tax?tax=ENV&unit=PC_GDP&unit=PC_TSCO&sinceTimePeriod=1995"
mkdir -p logement
get logement/prc_hpi_a.json "$E/prc_hpi_a?purchase=TOTAL&unit=I15_A_AVG&sinceTimePeriod=2005"
get logement/sts_copi_a.json "$E/sts_copi_a?geo=FR&sinceTimePeriod=2005"
get logement/prc_hicp_aind.json "$E/prc_hicp_aind?coicop=CP00&unit=INX_A_AVG&sinceTimePeriod=2005"
get logement/ilc_di03.json "$E/ilc_di03?statinfo=MED_EI&unit=EUR&age=TOTAL&sex=T&sinceTimePeriod=2005"
get logement/ilc_mded01.json "$E/ilc_mded01?sinceTimePeriod=2023"
get logement/ilc_lvho07a.json "$E/ilc_lvho07a?rskpovth=TOTAL&age=TOTAL&sex=T&sinceTimePeriod=2023"
get nama_10_co3_p3.json "$E/nama_10_co3_p3?geo=FR&unit=CP_MEUR&sinceTimePeriod=2015&coicop=CP041&coicop=CP042&coicop=TOTAL"
get nama_10_pe.json     "$E/nama_10_pe?geo=FR&unit=THS_PER&na_item=POP_NC&sinceTimePeriod=2015"

# Administrations publiques : comptes, impôts détaillés, dépenses par fonction (COFOG)
get gov_10a_main.json   "$E/gov_10a_main?geo=FR&unit=MIO_EUR&sinceTimePeriod=1995"
get gov_10a_taxag.json  "$E/gov_10a_taxag?geo=FR&unit=MIO_EUR&sinceTimePeriod=2015"
get gov_10a_exp.json    "$E/gov_10a_exp?geo=FR&unit=MIO_EUR&na_item=TE&sector=S13&sector=S1311&sector=S1313&sector=S1314&sinceTimePeriod=1995"
# rémunérations (D1) par fonction : sert à répartir les cotisations imputées (retraites des fonctionnaires) dans le Sankey
get gov_10a_exp_d1.json "$E/gov_10a_exp?geo=FR&unit=MIO_EUR&na_item=D1&sector=S13&sector=S1311&sector=S1313&sector=S1314&sinceTimePeriod=1990"
get gov_exp_soussecteurs.json "$E/gov_10a_exp?geo=FR&unit=MIO_EUR&na_item=TE&sector=S13&sector=S1311&sector=S1313&sector=S1314&cofog99=TOTAL&cofog99=GF01&cofog99=GF02&cofog99=GF03&cofog99=GF04&cofog99=GF05&cofog99=GF06&cofog99=GF07&cofog99=GF08&cofog99=GF09&cofog99=GF10&sinceTimePeriod=2022"

# Patrimoine : actifs non financiers et comptes financiers par secteur
get nama_10_nfa_bs.json "$E/nama_10_nfa_bs?geo=FR&unit=CP_MEUR&sinceTimePeriod=2015"
get nasa_10_f_bs.json   "$E/nasa_10_f_bs?geo=FR&unit=MIO_EUR&co_nco=NCO&sinceTimePeriod=2015"

# Dette publique au sens de Maastricht (en % du PIB)
get gov_10dd_edpt1.json "$E/gov_10dd_edpt1?geo=FR&unit=PC_GDP&unit=MIO_EUR&na_item=GD&sector=S13&sinceTimePeriod=1995"

# INSEE : comptes nationaux distribués 2023 (Insee Analyses n° 118)
get insee_T_CND_103.xlsx "https://www.insee.fr/fr/statistiques/fichier/8574663/T_CND_103.xlsx"
get insee_IA118.xlsx    "https://www.insee.fr/fr/statistiques/fichier/8974371/IA118.xlsx"
# Patrimoine et transmissions (enquête Histoire de vie et Patrimoine)
for f in 2502915:reve-patrim-masse-men-decile 2388851:reve-patrim-decile 5213910:reve-patrim-brut-compo 8894780:reve-patrim-brut-montants; do
  get "insee_${f#*:}.xlsx" "https://www.insee.fr/fr/statistiques/fichier/${f%%:*}/${f#*:}.xlsx"; done
for f in hvp_cadrage_herit_donat_FR hvp_cadrage_menages_FR hvp_herit_FR hvp_donat_rec_FR; do
  get "$f.xlsx" "https://www.insee.fr/fr/statistiques/fichier/8960185/$f.xlsx"; done
# Autres pays (sections PIB, simulateur et séries longues) : mêmes séries Eurostat,
# une requête par série pour tous les pays.
PAYS="BE BG CZ DK DE EE IE EL ES FR HR IT CY LV LT LU HU MT NL AT PL PT RO SI SK FI SE IS NO CH"
GEO=$(for g in $PAYS; do printf "&geo=%s" "$g"; done)
mkdir -p pays
get pays/nama_10_gdp.json    "$E/nama_10_gdp?unit=CP_MEUR&sinceTimePeriod=1995$GEO&na_item=B1GQ&na_item=B2A3G&na_item=D1&na_item=D2X3&na_item=P31_S14&na_item=P31_S15&na_item=P31_S13&na_item=P32_S13&na_item=P52_P53&na_item=P6X7&na_item=P6&na_item=P7"
get pays/nama_10_a10.json    "$E/nama_10_a10?unit=CP_MEUR&na_item=B1G&sinceTimePeriod=2015$GEO"
get pays/nasa_10_nf_tr.json  "$E/nasa_10_nf_tr?unit=CP_MEUR&sinceTimePeriod=2015$GEO&na_item=B1G&na_item=P51C&na_item=P51G&sector=S11&sector=S12&sector=S13&sector=S14&sector=S15&sector=S14_S15"
get pays/nama_10_co3_p3.json "$E/nama_10_co3_p3?unit=CP_MEUR&sinceTimePeriod=2010$GEO&coicop=CP042"
get pays/nama_10_pe.json     "$E/nama_10_pe?unit=THS_PER&na_item=POP_NC&sinceTimePeriod=2015$GEO"
get pays/gov_10a_main.json   "$E/gov_10a_main?unit=MIO_EUR&sector=S13&sinceTimePeriod=1995$GEO&na_item=TE&na_item=TR&na_item=D41PAY&na_item=P2&na_item=D632PAY&na_item=P51G&na_item=D3PAY"
get pays/gov_10a_taxag.json  "$E/gov_10a_taxag?unit=MIO_EUR&sector=S13&sinceTimePeriod=2015$GEO&na_item=D2_D5_D91_D61_M_D995"
get pays/gov_10a_exp.json    "$E/gov_10a_exp?unit=MIO_EUR&na_item=TE&sector=S13&sinceTimePeriod=1995$GEO"
get pays/nama_10_nfa_bs.json "$E/nama_10_nfa_bs?unit=CP_MEUR&sinceTimePeriod=2015$GEO&sector=S1&sector=S11&sector=S12&sector=S13&sector=S14_S15&asset10=N111N&asset10=N211N&asset10=N112N&asset10=N11MN&asset10=N117N&asset10=N12N&asset10=N13N&asset10=N1N&asset10=N2N"
get pays/nasa_10_f_bs.json   "$E/nasa_10_f_bs?unit=MIO_EUR&co_nco=NCO&sinceTimePeriod=2015$GEO&sector=S11&sector=S12&sector=S13&sector=S14_S15&sector=S2&na_item=F&na_item=F2&na_item=F3&na_item=F4&na_item=F5&na_item=F6"
get pays/gov_10dd_edpt1.json "$E/gov_10dd_edpt1?unit=PC_GDP&unit=MIO_EUR&na_item=GD&sector=S13&sinceTimePeriod=1995$GEO"
# Énergie : bilans Eurostat (GWh) et séries longues Our World in Data
mkdir -p energie
NB=$(for n in PPRD RCV_RCY IMP EXP STK_CHG GAE GIC INTMARB INTAVI TI_E TI_EHG_E TI_RPI_E TO TO_EHG TO_RPI NRG_E DL FC_NE FC_IND_E FC_TRA_E FC_OTH_HH_E FC_OTH_CP_E FC_OTH_AF_E FC_OTH_FISH_E FC_OTH_NSP_E STATDIFF FC_E FEC_EED PEC_EED GEP; do printf "&nrg_bal=%s" "$n"; done)
SI=$(for s in TOTAL C0000X0350-0370 C0350-0370 P1000 S2000 G3000 O4000XBIO O4100_TOT O4200 O4300 O4400X4410 O4500 N900H RA100 RA200 RA300 RA410 RA420 RA500 RA600 BIOE R5210P R5210B R5220P R5220B R5230P R5230B R5290 R5300 W6100_6220 E7000 H8000; do printf "&siec=%s" "$s"; done)
get energie/nrg_bal_c.json "$E/nrg_bal_c?unit=GWH&sinceTimePeriod=2015$GEO$NB$SI"
# série longue de l'énergie primaire (énergie disponible brute) depuis 1990, même convention que le bilan
SIL=$(for s in C0000X0350-0370 P1000 S2000 O4000XBIO G3000 N900H RA100 RA200 RA300 RA410 RA420 RA600 BIOE W6100_6220; do printf "&siec=%s" "$s"; done)
get energie/nrg_bal_c_long.json "$E/nrg_bal_c?unit=GWH&nrg_bal=GAE&sinceTimePeriod=1990$GEO$SIL"
TMP=$(mktemp)
get "$TMP" "https://raw.githubusercontent.com/owid/energy-data/master/owid-energy-data.csv" && \
filtre energie/owid_europe.csv python3 "$SCRIPTS/filter_owid.py" "$TMP" energie/owid_europe.csv
rm -f "$TMP"
# Matières : comptes de flux de matières (Eurostat), en milliers de tonnes
mkdir -p matieres
MAT=$(for m in TOTAL MF1 MF11 MF12 MF13 MF14 MF15 MF16 MF2 MF21 MF22 MF221 MF227 MF228 MF23 MF3 MF31 MF32 MF34 MF35 MF36 MF37 MF38 MF3B MF4 MF41 MF42 MF43 MF44 MF45 MF5 MF6; do printf "&material=%s" "$m"; done)
get matieres/env_ac_mfa.json "$E/env_ac_mfa?sinceTimePeriod=2000&unit=THS_T&unit=T_HAB$GEO$MAT&indic_env=DE&indic_env=IMP&indic_env=EXP&indic_env=DMC"
get matieres/env_ac_sd.json  "$E/env_ac_sd?sinceTimePeriod=2010&unit=THS_T$GEO"
get matieres/env_ac_rme.json "$E/env_ac_rme?sinceTimePeriod=2010&unit=THS_T&unit=T_HAB$GEO&material=TOTAL&material=MF1&material=MF2&material=MF3&material=MF4"
get matieres/cei_srm030.json "$E/cei_srm030?sinceTimePeriod=2000$GEO"
# Thèmes : climat, eau, sols, démographie, immigration, temps de travail, justice (Eurostat)
mkdir -p themes
CRF=$(for c in TOTX4_MEMO TOTXMEMO CRF1A1 CRF1A2 CRF1A3 CRF1A4A CRF1A4B CRF1A4C CRF1A5 CRF1B CRF2 CRF3 CRF4 CRF5 CRF6 CRF1D1A CRF1D1B; do printf "&src_crf=%s" "$c"; done)
get themes/env_air_gge.json "$E/env_air_gge?unit=MIO_T&sinceTimePeriod=1990$GEO$CRF&airpol=GHG&airpol=CO2&airpol=CH4_CO2E&airpol=N2O_CO2E&airpol=HFC_PFC_NF3_SF6_CO2E"
get themes/env_wat_abs.json "$E/env_wat_abs?wat_src=FRW&sinceTimePeriod=2000$GEO"
get themes/lan_lcv_ovw.json "$E/lan_lcv_ovw?unit=KM2&unit=PC$GEO$(for c in TOTAL A00 A10 A20 A30 B00 C00 C10 C20 C30 D00 E00 F00 G00 H00; do printf "&landcover=%s" "$c"; done)"
get themes/lan_use_ovw.json "$E/lan_use_ovw?unit=KM2&unit=PC$GEO"
get themes/demo_gind.json   "$E/demo_gind?sinceTimePeriod=1960$GEO&indic_de=JAN&indic_de=LBIRTH&indic_de=DEATH&indic_de=CNMIGRAT&indic_de=GROW"
get themes/demo_pjan.json   "$E/demo_pjan?unit=NR&sex=M&sex=F&time=2000&time=2025$GEO"
get themes/proj_23np.json   "$E/proj_23np?projection=BSL&sex=T&unit=PER$GEO&age=TOTAL&age=Y_LT20&age=Y20-64&age=Y_GE65&age=Y_GE80"
get themes/migr_pop3ctb.json "$E/migr_pop3ctb?age=TOTAL&sex=T&sinceTimePeriod=2010$GEO&c_birth=TOTAL&c_birth=NAT&c_birth=FOR&c_birth=EU27_2020_FOR&c_birth=NEU27_2020_FOR"
get themes/migr_imm1ctz.json "$E/migr_imm1ctz?age=TOTAL&sex=T&agedef=COMPLET&sinceTimePeriod=2010$GEO&citizen=TOTAL&citizen=NAT&citizen=EU27_2020_FOR&citizen=NEU27_2020_FOR"
get themes/migr_emi1ctz.json "$E/migr_emi1ctz?age=TOTAL&sex=T&agedef=COMPLET&sinceTimePeriod=2010$GEO&citizen=TOTAL&citizen=NAT"
get themes/nama_10_a10_e.json "$E/nama_10_a10_e?na_item=EMP_DC&unit=THS_HW&unit=THS_PER&sinceTimePeriod=1995$GEO"
get themes/lfsa_eppga.json  "$E/lfsa_eppga?age=Y15-64&unit=PC&sinceTimePeriod=2000$GEO"
get themes/lfsa_eppgai.json "$E/lfsa_eppgai?age=Y15-64&sex=T&unit=PC&sinceTimePeriod=2000$GEO"
get themes/lfsa_ewhan2.json "$E/lfsa_ewhan2?age=Y15-64&sex=T&wstatus=EMP&nace_r2=TOTAL&sinceTimePeriod=2008$GEO"
get themes/tus_00age.json   "$E/tus_00age?unit=TIME_SP&sex=T&age=TOTAL$GEO"
get themes/crim_off_cat.json "$E/crim_off_cat?sinceTimePeriod=2008$GEO"
get themes/crim_just_job.json "$E/crim_just_job?sex=T&sinceTimePeriod=2008$GEO"
get themes/crim_pris_cap.json "$E/crim_pris_cap?sinceTimePeriod=2008$GEO"

# Santé, éducation, logement, transports, emploi, inégalités, déchets (Eurostat)
mkdir -p societe
ICD=$(for c in TOTAL A_B C00-D48 E F G_H H60-H95 I J K M N P Q R V01-Y89 U071 X60-X84_Y870 V01-V99_Y85 C33_C34 C18-C21 C50 F01_F03 G30 I20-I25 I60-I69 J09-J18 J40-J47; do printf "&icd10=%s" "$c"; done)
get societe/demo_mlexpec.json "$E/demo_mlexpec?unit=YR&age=Y_LT1&age=Y65&sinceTimePeriod=1960$GEO"
get societe/hlth_cd_aro.json  "$E/hlth_cd_aro?unit=NR&sex=T&age=TOTAL&resid=TOT_IN&sinceTimePeriod=2011$GEO$ICD"
get societe/hlth_sha11_hchf.json "$E/hlth_sha11_hchf?unit=MIO_EUR&sinceTimePeriod=2014$GEO"
get societe/hlth_sha11_hf.json "$E/hlth_sha11_hf?unit=MIO_EUR&unit=PC_GDP&unit=EUR_HAB&sinceTimePeriod=2010$GEO"
get societe/educ_uoe_enra01.json "$E/educ_uoe_enra01?unit=NR&worktime=TOTAL&sex=T&sinceTimePeriod=2013$GEO"
get societe/educ_uoe_fini04.json "$E/educ_uoe_fini04?unit=EUR&unit=PPS&sector=TOT_SEC&sinceTimePeriod=2013$GEO"
get societe/educ_outc_pisa.json "$E/educ_outc_pisa?sex=T&unit=PC$GEO"
get societe/sdg_04_10.json "$E/sdg_04_10?sex=T&unit=PC&sinceTimePeriod=2000$GEO"
get societe/edat_lfse_20.json "$E/edat_lfse_20?sex=T&age=Y15-29&training=NO_FE_NO_NFE&wstatus=NEMP&unit=PC&sinceTimePeriod=2000$GEO"
get societe/educ_uoe_perp04.json "$E/educ_uoe_perp04?unit=RT&sinceTimePeriod=2013$GEO"
get societe/educ_uoe_fine06.json "$E/educ_uoe_fine06?unit=PC_GDP&isced11=ED02-8&sinceTimePeriod=2012$GEO"
get societe/trng_lfse_01.json "$E/trng_lfse_01?sex=T&age=Y25-64&unit=PC&sinceTimePeriod=2005$GEO"
get societe/edat_lfse_03.json "$E/edat_lfse_03?sex=T&age=Y25-64&age=Y25-34&unit=PC&sinceTimePeriod=2000$GEO"
get societe/ilc_lvho02.json   "$E/ilc_lvho02?rskpovth=TOTAL&hhcomp=TOTAL&unit=PC&sinceTimePeriod=2005$GEO"
get societe/ilc_lvho03.json   "$E/ilc_lvho03?unit=AVG&building=TOTAL&sinceTimePeriod=2005$GEO"
get societe/ilc_lvho05a.json  "$E/ilc_lvho05a?unit=PC&rskpovth=TOTAL&age=TOTAL&sex=T&sinceTimePeriod=2005$GEO"
get societe/ilc_lvho50a.json  "$E/ilc_lvho50a?unit=PC&rskpovth=TOTAL&age=TOTAL&sex=T&sinceTimePeriod=2005$GEO"
get societe/ilc_lvho07a.json  "$E/ilc_lvho07a?unit=PC&rskpovth=TOTAL&age=TOTAL&sex=T&sinceTimePeriod=2005$GEO"
get societe/prc_hpi_a.json    "$E/prc_hpi_a?purchase=TOTAL&unit=I15_A_AVG&sinceTimePeriod=2005$GEO"
get societe/prc_hicp_aind.json "$E/prc_hicp_aind?coicop=CP00&unit=INX_A_AVG&sinceTimePeriod=2005$GEO"
get societe/tran_hv_psmod.json "$E/tran_hv_psmod?unit=PC&sinceTimePeriod=1990$GEO"
get societe/tran_hv_frmod.json "$E/tran_hv_frmod?unit=PC&sinceTimePeriod=1990$GEO"
get societe/road_pa_mov.json  "$E/road_pa_mov?unit=MIO_PKM&sinceTimePeriod=1990$GEO"
get societe/rail_pa_total.json "$E/rail_pa_total?unit=MIO_PKM&sinceTimePeriod=1990$GEO"
get societe/avia_paoc.json    "$E/avia_paoc?freq=A&unit=PAS&tra_meas=PAS_CRD&schedule=TOTAL&tra_cov=TOTAL&tra_cov=NAT&tra_cov=INTL&sinceTimePeriod=2005$GEO"
get societe/road_go_ta_tott.json "$E/road_go_ta_tott?tra_type=TOTAL&tra_oper=TOTAL&unit=MIO_TKM&sinceTimePeriod=1990$GEO"
get societe/lfsa_pganws.json  "$E/lfsa_pganws?unit=THS_PER&sex=T&citizen=TOTAL&age=Y15-64&age=Y_GE15&sinceTimePeriod=2005$GEO"
get societe/lfsa_egais.json   "$E/lfsa_egais?unit=THS_PER&sex=T&age=Y_GE15&wstatus=EMP&sinceTimePeriod=2011$GEO"
get societe/lfsa_esgaed.json  "$E/lfsa_esgaed?unit=THS_PER&sex=T&age=Y15-64&isced11=TOTAL&sinceTimePeriod=2005$GEO"
get societe/une_rt_a.json     "$E/une_rt_a?unit=PC_ACT&sex=T&age=Y15-74&age=Y15-24&sinceTimePeriod=1995$GEO"
get societe/lfsi_emp_a.json   "$E/lfsi_emp_a?unit=PC_POP&sex=T&age=Y20-64&indic_em=EMP_LFS&sinceTimePeriod=1995$GEO"
get societe/ilc_di01.json     "$E/ilc_di01?unit=EUR&sinceTimePeriod=2005$GEO"
get societe/ilc_di11.json     "$E/ilc_di11?sex=T&age=TOTAL&sinceTimePeriod=2005$GEO"
get societe/ilc_di11b.json    "$E/ilc_di11b?sex=T&age=TOTAL&sinceTimePeriod=2005$GEO"
get societe/ilc_di12b.json    "$E/ilc_di12b?sinceTimePeriod=2005$GEO"
get societe/ilc_di12.json     "$E/ilc_di12?age=TOTAL&sinceTimePeriod=2005$GEO"
get societe/ilc_li02.json     "$E/ilc_li02?unit=PC&rskpovth=B_60&sex=T&sinceTimePeriod=2005$GEO$(for a in TOTAL Y_LT18 Y18-64 Y_GE65; do printf "&age=%s" "$a"; done)"
get societe/ilc_li10.json     "$E/ilc_li10?unit=PC&rskpovth=B_60&sex=T&age=TOTAL&sinceTimePeriod=2005$GEO"
get societe/ilc_mdsd11.json   "$E/ilc_mdsd11?unit=PC&sex=T&age=TOTAL&sinceTimePeriod=2015$GEO"
get societe/env_wasgen.json   "$E/env_wasgen?unit=T&unit=KG_HAB&hazard=HAZ_NHAZ&waste=TOTAL&sinceTimePeriod=2004$GEO"
get societe/env_wastrt.json   "$E/env_wastrt?unit=T&hazard=HAZ_NHAZ&waste=TOTAL&sinceTimePeriod=2004$GEO"
get societe/env_wasmun.json   "$E/env_wasmun?unit=KG_HAB&unit=THS_T&sinceTimePeriod=1995$GEO"

# Capital social et culturel (enquête SRCV, modules 2015 et 2022, et bien-être)
mkdir -p capital
A="age=Y_GE16&sex=T"
get capital/ilc_scp03.json "$E/ilc_scp03?$A&unit=PC&isced11=TOTAL&isced11=ED0-2&isced11=ED3_4&isced11=ED5-8&frequenc=GE1$GEO"
get capital/ilc_scp04.json "$E/ilc_scp04?unit=PC&deg_urb=TOTAL&hhcomp=TOTAL&frequenc=GE1$GEO"
get capital/ilc_scp07.json "$E/ilc_scp07?$A&unit=PC&frequenc=GE1Y$GEO"
get capital/ilc_scp08.json "$E/ilc_scp08?unit=PC&deg_urb=TOTAL&hhcomp=TOTAL&frequenc=GE1Y$GEO"
get capital/ilc_scp09.json "$E/ilc_scp09?$A&unit=PC&frequenc=DAY&frequenc=WEEK$GEO"
get capital/ilc_scp10.json "$E/ilc_scp10?unit=PC&deg_urb=TOTAL&hhcomp=TOTAL&frequenc=DAY&frequenc=WEEK$GEO"
get capital/ilc_scp19.json "$E/ilc_scp19?$A&unit=PC$GEO"
get capital/ilc_scp20.json "$E/ilc_scp20?unit=PC&deg_urb=TOTAL&hhcomp=TOTAL$GEO"
get capital/ilc_scp27.json "$E/ilc_scp27?$A&unit=PC&n_book=0$GEO"
get capital/ilc_scp28.json "$E/ilc_scp28?unit=PC&deg_urb=TOTAL&hhcomp=TOTAL&n_book=0$GEO"
get capital/ilc_pw01.json  "$E/ilc_pw01?$A&sinceTimePeriod=2013$GEO"
get capital/ilc_pw02.json  "$E/ilc_pw02?deg_urb=TOTAL&hhcomp=TOTAL&sinceTimePeriod=2013$GEO"
get capital/ilc_pw03.json  "$E/ilc_pw03?$A&sinceTimePeriod=2013$GEO"
get capital/ilc_pw04.json  "$E/ilc_pw04?deg_urb=TOTAL&hhcomp=TOTAL&sinceTimePeriod=2013$GEO"
get capital/ilc_pw06.json  "$E/ilc_pw06?$A&sinceTimePeriod=2013$GEO"
get capital/ilc_pw07.json  "$E/ilc_pw07?deg_urb=TOTAL&hhcomp=TOTAL&sinceTimePeriod=2013$GEO"
get capital/ilc_pw10.json  "$E/ilc_pw10?$A$GEO"

# Justice : chaîne pénale, détenus, homicides ; population par nationalité
get themes/crim_just_ctz.json "$E/crim_just_ctz?sinceTimePeriod=2008$GEO"
get themes/crim_just_age.json "$E/crim_just_age?sinceTimePeriod=2008$GEO"
get themes/crim_just_sex.json "$E/crim_just_sex?sinceTimePeriod=2008$GEO"
get themes/crim_pris_ctz.json "$E/crim_pris_ctz?sinceTimePeriod=2008$GEO"
get themes/crim_pris_age.json "$E/crim_pris_age?sex=T&sinceTimePeriod=2008$GEO"
get themes/crim_hom_vrel.json "$E/crim_hom_vrel?sinceTimePeriod=2008$GEO"
get themes/migr_pop1ctz.json  "$E/migr_pop1ctz?age=TOTAL&sex=T&citizen=TOTAL&citizen=NAT&citizen=FOR&sinceTimePeriod=2008$GEO"

# Population par statut, industrie et innovation (Eurostat) ; fonction publique (INSEE)
mkdir -p eco2
get eco2/demo_pjanbroad.json "$E/demo_pjanbroad?sex=T&unit=NR&sinceTimePeriod=2005$GEO"
get eco2/lfsa_pganws.json  "$E/lfsa_pganws?unit=THS_PER&sex=T&citizen=TOTAL&sinceTimePeriod=2005$GEO&age=Y15-64&age=Y_GE15&age=Y_GE65&age=Y15-24&age=Y25-54&age=Y55-64"
get eco2/lfsa_esgaed.json  "$E/lfsa_esgaed?unit=THS_PER&sex=T&isced11=TOTAL&sinceTimePeriod=2005$GEO&age=Y15-64&age=Y_GE15"
get eco2/lfsa_igar.json    "$E/lfsa_igar?unit=PC_POP&sex=T&age=Y15-64&sinceTimePeriod=2005$GEO"
get eco2/rd_e_gerdtot.json "$E/rd_e_gerdtot?unit=PC_GDP&unit=MIO_EUR&sinceTimePeriod=1995$GEO"
get eco2/rd_p_persocc.json "$E/rd_p_persocc?unit=FTE&sex=T&prof_pos=RSE&sinceTimePeriod=1995$GEO"
get eco2/nama_10_a10.json  "$E/nama_10_a10?unit=CP_MEUR&na_item=B1G&sinceTimePeriod=1995$GEO&nace_r2=TOTAL&nace_r2=C&nace_r2=B-E&nace_r2=F"
get eco2/nama_10_a10_e.json "$E/nama_10_a10_e?unit=THS_PER&na_item=EMP_DC&sinceTimePeriod=1995$GEO&nace_r2=TOTAL&nace_r2=C"
get eco2/sts_inpr_a.json   "$E/sts_inpr_a?indic_bt=PRD&s_adj=CA&unit=I21&sinceTimePeriod=2000$GEO&nace_r2=C&nace_r2=B-D"
get eco2/htec_emp_nat2.json "$E/htec_emp_nat2?sex=T&unit=PC_EMP&sinceTimePeriod=2008$GEO&nace_r2=HTC&nace_r2=C_HTC&nace_r2=C_HTC_M&nace_r2=KIS"
get eco2/isoc_eb_ai.json   "$E/isoc_eb_ai?unit=PC_ENT&size_emp=GE10&indic_is=E_AI_TANY$GEO"
TMPX=$(mktemp)
get "$TMPX" "https://bdm.insee.fr/series/sdmx/data/TCRED-TRAVAIL-EMPLOI-EFF-FP-RATIO?detail=dataonly" && \
filtre eco2/insee_fonction_publique.json python3 - "$TMPX" eco2/insee_fonction_publique.json <<'PY'
import json, re, sys
s = open(sys.argv[1], encoding="utf-8").read()
out = {}
for a, b in re.findall(r"<Series ([^>]*)>(.*?)</Series>", s, re.S):
    d = dict(re.findall(r'(\w+)="([^"]*)"', a))
    if d.get("REF_AREA") == "FE" and d.get("NATURE") == "VALEUR_ABSOLUE" and d.get("SEXE") == "0":
        out[d["VERSANTS_FP"]] = {t: float(v) for t, v in re.findall(r'TIME_PERIOD="([^"]+)" OBS_VALUE="([^"]+)"', b)}
json.dump(out, open(sys.argv[2], "w"), indent=0)
PY
rm -f "$TMPX"

# Empreinte carbone (Eurostat, modèle FIGARO) : par pays consommateur, usage final et produit ; origine des émissions
mkdir -p empreinte
for g in $PAYS; do
  get empreinte/ghgfp_$g.json "$E/env_ac_ghgfp?c_dest=$g&c_orig=WORLD"
  get empreinte/ghgfp_orig_$g.json "$E/env_ac_ghgfp?c_dest=$g&na_item=TOTAL&nace_r2=TOTAL"
done
# Empreinte carbone de la France par poste de consommation (SDES, ministère de la Transition écologique).
# L'adresse change à chaque édition annuelle : on cherche le fichier « données et graphiques » sur la page de l'édition la plus récente.
SDES="https://www.statistiques.developpement-durable.gouv.fr"
for an in $(seq $(( $(date +%Y) - 1 )) -1 2023); do
  P=$(curl -fsSL -A "Mozilla/5.0" "$SDES/lempreinte-carbone-de-la-france-de-1990-$an" 2>/dev/null) || continue
  M=$(echo "$P" | grep -oE 'href="/media/[0-9]+/download[^"]*"[^>]*title="donn[^"]*' | head -1 | grep -oE '/media/[0-9]+/download' || true)
  [ -n "$M" ] && get empreinte/sdes_empreinte.xlsx "$SDES$M" && break
done
get empreinte/env_ac_ainah_r2.json "$E/env_ac_ainah_r2?airpol=GHG&unit=THS_T&nace_r2=HH_TRA&nace_r2=HH_HEAT&nace_r2=HH_OTH&sinceTimePeriod=2010$GEO"

# Séries longues depuis 1949 pour l'histoire des dévaluations (INSEE, comptes nationaux annuels)
mkdir -p histoire
get histoire/jst_macrohistory.xlsx "https://raw.githubusercontent.com/unbalancedparentheses/forex-centuries/main/data/sources/jst/jst_macrohistory.xlsx"
get histoire/harvard/energy_france.xlsx "https://histecon.fas.harvard.edu/energyhistory/data_sets/Energy_Data_FRANCE.xlsx"
get histoire/ert_bil_eur_a.json "$E/ert_bil_eur_a?currency=USD&statinfo=AVG&sinceTimePeriod=1999"
get histoire/prc_hicp_aind_fr.json "$E/prc_hicp_aind?geo=FR&coicop=CP00&unit=RCH_A_AVG&sinceTimePeriod=2015"
get histoire/prc_hicp_aind_us.json "$E/prc_hicp_aind?coicop=CP00&unit=INX_A_AVG&geo=US&sinceTimePeriod=2010"
get histoire/bdm_menages.xml "https://bdm.insee.fr/series/sdmx/data/SERIES_BDM/011785411+011793487+011780514+011780516+011780520+011780561+011780579+011780606+011780612+011780650+011780695+011780704+011780764+011780841+011780844+011780853+011779993"
get histoire/bdm_histoire.xml "https://bdm.insee.fr/series/sdmx/data/SERIES_BDM/011779995+011779991+011779992+011791812+011791813+011792506+011792505"

# Chômage : INSEE (BIT, halo, sous-emploi) et DARES / France Travail (catégories A à E), via la base BDM de l'INSEE ; Eurostat (chômage élargi)
mkdir -p chomage
get chomage/bdm_chomage.xml "https://bdm.insee.fr/series/sdmx/data/SERIES_BDM/011818543+011818555+011818564+011818739+011818577+011818581+010597456+010597571+010598455+010598489+010598404+010598417"
get chomage/lfsi_sla_a.json "$E/lfsi_sla_a?sex=T&age=Y15-74&sinceTimePeriod=2009$GEO"

# Commerce extérieur de la France (Comext) : par partenaire et par chapitre de produits
C="https://ec.europa.eu/eurostat/api/comext/dissemination/statistics/1.0/data/DS-059341"
YR=$(date +%Y); LAST=$((YR-1))
get themes/comext_partenaires.json "$C?reporter=FR&freq=A&time=$LAST&flow=1&flow=2&product=TOTAL&indicators=VALUE_EUR&indicators=QUANTITY_KG"
get themes/comext_produits.json "$C?reporter=FR&freq=A&time=$LAST&flow=1&flow=2&partner=WORLD&partner=INT_EU27_2020&partner=EXT_EU27_2020&indicators=VALUE_EUR&indicators=QUANTITY_KG$(for i in $(seq -w 1 99); do printf "&product=%s" "$i"; done)"
get themes/comext_historique.json "$C?reporter=FR&freq=A&sinceTimePeriod=2002&flow=1&flow=2&partner=WORLD&product=TOTAL&indicators=VALUE_EUR&indicators=QUANTITY_KG"

# Alimentation : bilans alimentaires FAOSTAT (Europe), filtrés
TMPZ=$(mktemp)
get "$TMPZ" "https://bulks-faostat.fao.org/production/FoodBalanceSheets_E_Europe.zip" && \
filtre themes/fao_fbs.csv python3 "$SCRIPTS/filter_fao.py" "$TMPZ" themes/fao_fbs.csv
rm -f "$TMPZ"
# Vit-on mieux qu'avant ? (pouvoir d'achat, dépenses pré-engagées, SMIC, comparaisons en PPA)
get prc_ppp_ind_aic.json "$E/prc_ppp_ind?na_item=VI_PPS_EU27_2020_HAB&ppp_cat=A01&ppp_cat=GDP"
get nama_10_pc_p41.json "$E/nama_10_pc?na_item=P41&unit=CLV10_EUR_HAB&unit=CLV20_EUR_HAB"
get tec00113.json "$E/tec00113"
get insee_pouvoir_achat.html "https://www.insee.fr/fr/statistiques/8612564"
get insee_preengagees.html "https://www.insee.fr/fr/statistiques/8612566"
get insee_smic_horaire.xml "https://bdm.insee.fr/series/sdmx/data/SERIES_BDM/000822484?startPeriod=1951-01"
get irt_lt_mcby_a_fr.json "$E/irt_lt_mcby_a?geo=FR&int_rt=MCBY"
get tipsii10.json "$E/tipsii10?unit=PC_GDP"
get indus_va.json "$E/nama_10_a10?unit=CP_MEUR&na_item=B1G&nace_r2=C&nace_r2=TOTAL&geo=FR&geo=DE&geo=IT&geo=ES&geo=EU27_2020"
get indus_emp.json "$E/nama_10_a10_e?unit=THS_PER&na_item=EMP_DC&nace_r2=C&nace_r2=TOTAL&geo=FR&geo=DE&geo=IT&geo=ES&geo=EU27_2020"
get ret_dep.json "$E/spr_exp_pens?unit=PC_GDP&spdepb=TOTAL&spdepm=TOTAL&geo=FR&geo=DE&geo=IT&geo=ES&geo=NL&geo=SE&geo=DK&geo=BE&geo=AT&geo=EU27_2020"
get ret_niv.json "$E/ilc_pnp2?sex=T&geo=FR&geo=DE&geo=IT&geo=ES&geo=NL&geo=SE&geo=DK&geo=BE&geo=AT&geo=EU27_2020"
get ret_rempl.json "$E/ilc_pnp3?sex=T&geo=FR&geo=DE&geo=IT&geo=ES&geo=NL&geo=SE&geo=DK&geo=BE&geo=AT&geo=EU27_2020"
get ret_esp.json "$E/demo_mlexpec?sex=T&age=Y65&geo=FR&geo=DE&geo=IT&geo=ES&geo=NL&geo=SE&geo=DK&geo=BE&geo=AT&geo=EU27_2020"
get ret_emp.json "$E/lfsa_ergan?sex=T&age=Y60-64&citizen=TOTAL&geo=FR&geo=DE&geo=IT&geo=ES&geo=NL&geo=SE&geo=DK&geo=BE&geo=AT&geo=EU27_2020"
get ret_dependance.json "$E/demo_pjanind?indic_de=OLDDEP1&geo=FR&geo=DE&geo=IT&geo=SE&geo=NL&geo=EU27_2020"
get gov_p51g_b9.json "$E/gov_10a_main?unit=PC_GDP&sector=S13&na_item=P51G&na_item=B9&na_item=P51C&geo=FR&geo=DE&geo=EU27_2020&sinceTimePeriod=2010"
get insee_prix_paris.xml "https://bdm.insee.fr/series/sdmx/data/SERIES_BDM/010567012?startPeriod=1990-Q1"
get friggit_paris_1200_2012.xls "https://www.igedd.developpement-durable.gouv.fr/IMG/xls/prix-immo-paris-1200-2012_cle2f2d1a.xls"
mkdir -p energie
# échanges d'électricité de la France : valeurs (Comext, produit 2716) et volumes (bilan électrique)
get energie/comext_2716.json "https://ec.europa.eu/eurostat/api/comext/dissemination/statistics/1.0/data/DS-045409?reporter=FR&partner=WORLD&product=2716&flow=1&flow=2&indicators=VALUE_IN_EUROS&indicators=QUANTITY_IN_100KG&freq=A"
get energie/nrg_cb_e_echanges.json "https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/nrg_cb_e?geo=FR&siec=E7000&nrg_bal=IMP&nrg_bal=EXP&unit=GWH"
get energie/nrg_pc_204.json "https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/nrg_pc_204?geo=FR&geo=DE&geo=EU27_2020&geo=ES&geo=IT&nrg_cons=KWH2500-4999&tax=I_TAX&tax=X_TAX&currency=EUR&unit=KWH&sinceTimePeriod=2015-S1"
# Générations (onglet Retraites, « Les retraités vivent-ils mieux que les actifs ? »)
mkdir -p generations
get generations/hbs_exp_t135.json "$E/hbs_exp_t135?geo=FR"
get generations/hbs_car_t314.json "$E/hbs_car_t314?geo=FR"
get generations/hbs_str_t225.json "$E/hbs_str_t225?geo=FR&coicop=CP042"
get generations/ilc_di03.json "$E/ilc_di03?geo=FR&sex=T&unit=EUR&statinfo=MED_EI&statinfo=MEAN_EI&age=TOTAL&age=Y_LT18&age=Y18-24&age=Y25-49&age=Y50-64&age=Y_GE65"
get generations/ilc_pns2.json "$E/ilc_pns2?geo=FR&sex=T"
get generations/cofog.json "$E/gov_10a_exp?geo=FR&unit=PC_GDP&sector=S13&na_item=TE&cofog99=GF1002&cofog99=GF07&cofog99=GF09&cofog99=TOTAL"
get generations/invest.json "$E/gov_10a_main?geo=FR&unit=PC_GDP&sector=S13&na_item=P51G"
get generations/prelevements.json "$E/gov_10a_taxag?geo=FR&unit=PC_GDP&sector=S13_S212&na_item=D2_D5_D91_D61_M_D995"
get generations/demo.json "$E/demo_pjanind?geo=FR&indic_de=PC_Y65_MAX&indic_de=PC_Y60_MAX"
# Monnaie, 6.3-6.4 : moteurs de la demande et climats économiques
mkdir -p climats
get climats/contributions.json "$E/nama_10_gdp?geo=FR&unit=CON_PPCH_PRE&na_item=B1GQ&na_item=P31_S14_S15&na_item=P3_S13&na_item=P51G&na_item=P52_P53&na_item=P6&na_item=P7"
get climats/volumes.json "$E/nama_10_gdp?geo=FR&unit=CLV_PCH_PRE&na_item=B1GQ&na_item=P31_S14_S15&na_item=P3_S13&na_item=P51G&na_item=P6&na_item=P7&sinceTimePeriod=1995"
get climats/fbcf_pays.json "$E/nama_10_gdp?geo=FR&geo=DE&geo=IT&geo=ES&geo=EU27_2020&unit=PC_GDP&na_item=P51G&sinceTimePeriod=1995"
get climats/epargne_pays.json "$E/nasa_10_ki?geo=FR&geo=DE&geo=IT&geo=ES&geo=EU27_2020&na_item=SRG_S14_S15&sinceTimePeriod=1999"
get climats/rd_pays.json "$E/rd_e_gerdtot?geo=FR&geo=DE&geo=IT&geo=ES&geo=EU27_2020&sectperf=TOTAL&unit=PC_GDP&sinceTimePeriod=1995"
get climats/pib_trimestriel.json "$E/namq_10_gdp?geo=FR&unit=CLV_PCH_SM&unit=CLV_PCH_PRE&s_adj=SCA&na_item=B1GQ&sinceTimePeriod=2023-Q1"
get climats/inflation_mensuelle.json "$E/prc_hicp_minr?geo=FR&coicop18=TOTAL&unit=RCH_A&sinceTimePeriod=2024-01"
# France 2050 (article de prospective)
mkdir -p france2050
get france2050/projections.json "$E/proj_23np?geo=FR&sex=T&unit=PER&age=TOTAL&age=Y_GE65&age=Y_GE80&age=Y_LT15&age=Y15-64&age=Y20-64"
get france2050/demographie.json "$E/demo_gind?geo=FR&indic_de=LBIRTH&indic_de=DEATH&indic_de=CNMIGRAT&indic_de=JAN&sinceTimePeriod=1960"
get france2050/population_age.json "$E/demo_pjanind?geo=FR&indic_de=PC_Y65_MAX&indic_de=PC_Y80_MAX&indic_de=PC_Y0_14&sinceTimePeriod=1960"
get france2050/migration_departements.json "$E/demo_r_gind3?indic_de=CNMIGRATRT&indic_de=JAN&sinceTimePeriod=2016&geoLevel=nuts3&lang=fr"
get france2050/energie_finale.json "$E/nrg_bal_c?geo=FR&nrg_bal=FC_E&unit=KTOE&siec=TOTAL&siec=O4000XBIO&siec=G3000&siec=C0000X0350-0370&siec=E7000&siec=H8000&siec=RA000&siec=W6100_6220&sinceTimePeriod=1990"
trap - ERR
# dates des derniers téléchargements réussis (les fichiers en échec gardent leur ancienne date)
python3 - "$REUSSIS" "$AUJOURDHUI" <<'PY'
import json, os, sys
dates = json.load(open("_dates.json")) if os.path.exists("_dates.json") else {}
for l in open(sys.argv[1]):
    if l.strip():
        dates["data/sources/" + l.strip()] = sys.argv[2]
json.dump(dict(sorted(dates.items())), open("_dates.json", "w"), ensure_ascii=False, indent=1)
PY
rm -f "$REUSSIS"
N=$(grep -c . "$ECHECS_FICHIER" || true)
if [ "$N" -gt 0 ]; then
  echo; echo "=== $N échec(s) de téléchargement ; les anciens fichiers ont été conservés ==="
  cat "$ECHECS_FICHIER"
  exit 2
fi
echo "OK : toutes les sources ont été mises à jour."
