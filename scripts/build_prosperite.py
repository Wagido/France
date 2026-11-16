#!/usr/bin/env python3
"""Construit data/prosperite.json : qu'est-ce qu'un pays prospère ? La France comparée aux États-Unis,
à l'Allemagne, au Brésil, à l'Inde et au Nigeria, sur quatre questions (richesse, partage, durabilité, bien-être).

Sources, dans data/sources/prosperite/ :
- imf.json : FMI, World Economic Outlook (datamapper) : PIB par habitant en PPA, dette et solde publics, chômage ;
- pnud_2023.json : PNUD, Rapport sur le développement humain 2025 (annexe, tableaux 1 et 3, données 2023) :
  IDH, espérance de vie, années d'études, Gini, parts de revenu, IDH ajusté aux inégalités ;
- bm_pauvrete.json : Banque mondiale, SI.POV.DDAY (moins de 3 $ par jour en PPA 2021) ;
- owid_co2.csv : Global Carbon Project via Our World in Data : CO2 par habitant (territoire) ;
- institutions.json : Transparency International (indice de perception de la corruption 2025) et World Justice Project
  (indice de l'État de droit 2025), relevés à la main sur les publications officielles ;
- owid_energie.csv : Energy Institute via Our World in Data : production et consommation d'énergie primaire,
  pour le taux d'indépendance énergétique = (charbon + gaz + pétrole produits + nucléaire + renouvelables) ÷ consommation
  (le nucléaire est compté comme production nationale, comme le fait la statistique officielle, bien que l'uranium soit importé).
Usage (depuis la racine) : python3 scripts/build_prosperite.py
"""
import csv, json, os

R = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
S = os.path.join(R, "data", "sources", "prosperite")
PAYS = [("FRA", "France"), ("USA", "États-Unis"), ("DEU", "Allemagne"), ("BRA", "Brésil"), ("IND", "Inde"), ("NGA", "Nigeria")]
AN_FMI = "2025"
imf = json.load(open(os.path.join(S, "imf.json")))
pnud = json.load(open(os.path.join(S, "pnud_2023.json")))["pays"]
inst = json.load(open(os.path.join(S, "institutions.json")))["pays"]
pauv = json.load(open(os.path.join(S, "bm_pauvrete.json")))["valeurs"]
co2 = {}
for r in csv.DictReader(open(os.path.join(S, "owid_co2.csv"))):
    if r["co2_per_capita"] and int(r["year"]) <= 2024:
        co2.setdefault(r["iso_code"], {})[int(r["year"])] = float(r["co2_per_capita"])
ener = {}
for r in csv.DictReader(open(os.path.join(S, "owid_energie.csv"))):
    try:
        cons = float(r["primary_energy_consumption"])
    except ValueError:
        continue
    prod = sum(float(r[k] or 0) for k in ("coal_production", "gas_production", "oil_production", "nuclear_consumption", "renewables_consumption"))
    ener.setdefault(r["iso_code"], {})[int(r["year"])] = 100 * prod / cons
f = lambda ind, c: imf[ind].get(c, {}).get(AN_FMI)
out = []
for c, nom in PAYS:
    p = pnud[c]; y = max(co2[c])
    out.append({"code": c, "nom": nom,
                "pib_hab": round(f("PPPPC", c)), "chomage": f("LUR", c),
                "gini": p["gini"], "part_1": p["part_1_riches"], "part_10": p["part_10_riches"], "part_40": p["part_40_pauvres"],
                "pauvrete": pauv[c][0] if pauv.get(c) else None, "pauvrete_annee": pauv[c][1] if pauv.get(c) else None,
                "dette": f("GGXWDG_NGDP", c), "solde": f("GGXCNL_NGDP", c), "courant": f("BCA_NGDPD", c), "inflation": f("PCPIPCH", c),
                "energie": round(ener[c][max(ener[c])]), "energie_annee": max(ener[c]), "co2": round(co2[c][y], 1), "co2_annee": y,
                "esperance_vie": p["esperance_vie"], "annees_etudes": p["annees_etudes"], "idh": p["idh"], "rang_idh": p["rang_idh"],
                "idh_ajuste": p["idh_ajuste"], "perte_inegalites": p["perte_inegalites"], **inst[c]})
json.dump({"annee_fmi": int(AN_FMI), "annee_pnud": 2023, "pays": out}, open(os.path.join(R, "data", "prosperite.json"), "w"), ensure_ascii=False, indent=1)
for r in out:
    print(r["code"], r["pib_hab"], r["dette"], r["courant"], r["inflation"], r["energie"], r["energie_annee"])
