#!/usr/bin/env python3
"""Construit data/competences.json : dépense publique par grande fonction (COFOG) et par niveau d'administration
(État et organismes centraux S1311, administrations locales S1313, Sécurité sociale S1314), France, dernière année.

Source : Eurostat gov_10a_exp (data/sources/gov_exp_soussecteurs.json). Les montants par niveau ne sont pas consolidés :
ils comprennent les transferts entre administrations (par exemple les dotations de l'État aux collectivités).
Usage (depuis la racine) : python3 scripts/build_competences.py
"""
import json, os, sys
HERE = os.path.dirname(os.path.abspath(__file__)); R = os.path.join(HERE, ".."); S = os.path.join(R, "data", "sources")
sys.path.insert(0, HERE)
from build_environnement import lire  # noqa: E402

F = {"GF01": "Services généraux (administration, intérêts de la dette, transferts entre administrations)", "GF02": "Défense",
     "GF03": "Ordre et sécurité (police, justice, pompiers)", "GF04": "Affaires économiques (transports, aides aux entreprises, énergie)",
     "GF05": "Environnement (déchets, eaux usées)", "GF06": "Logement et équipements collectifs (eau, éclairage, urbanisme)",
     "GF07": "Santé", "GF08": "Loisirs, culture, sport", "GF09": "Enseignement", "GF10": "Protection sociale (retraites, famille, chômage, RSA, autonomie)"}
NIV = {"etat": "S1311", "local": "S1313", "secu": "S1314"}
an = None; rows = []
for code, lib in F.items():
    r = {"code": code, "l": lib}
    for k, sec in NIV.items():
        d = lire("gov_exp_soussecteurs.json", {"sector": sec, "cofog99": code}, S).get("FR", {})
        an = max(d) if d else an
        r[k] = round(d.get(an, 0) / 1000, 1)
    rows.append(r)
tot = {k: round(lire("gov_exp_soussecteurs.json", {"sector": s, "cofog99": "TOTAL"}, S)["FR"][an] / 1000, 1) for k, s in NIV.items()}
rows.sort(key=lambda r: -(r["etat"] + r["local"] + r["secu"]))
json.dump({"annee": an, "fonctions": rows, "totaux": tot}, open(os.path.join(R, "data", "competences.json"), "w"), ensure_ascii=False, indent=1)
print(an, tot)
