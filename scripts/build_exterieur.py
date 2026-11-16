#!/usr/bin/env python3
"""Construit data/exterieur.json : le solde extérieur et ce qu'il fait au patrimoine du pays.

- solde de la balance courante en % du PIB, depuis 1980 : FMI, World Economic Outlook (data/sources/prosperite/imf.json) ;
- position extérieure nette en % du PIB (ce que le pays possède à l'étranger moins ce qu'il doit à l'étranger) :
  Eurostat tipsii10 (data/sources/tipsii10.json).
Usage (depuis la racine) : python3 scripts/build_exterieur.py
"""
import json, os, sys

HERE = os.path.dirname(os.path.abspath(__file__)); R = os.path.join(HERE, "..")
sys.path.insert(0, HERE)
from build_environnement import lire  # noqa: E402

PAYS = [("FR", "FRA", "France"), ("DE", "DEU", "Allemagne"), ("IT", "ITA", "Italie"), ("ES", "ESP", "Espagne"), ("US", "USA", "États-Unis")]
imf = json.load(open(os.path.join(R, "data", "sources", "prosperite", "imf.json")))["BCA_NGDPD"]
peen = lire("tipsii10.json", {"partner": "WRL_REST", "unit": "PC_GDP"}, os.path.join(R, "data", "sources"))
courant, position = [], []
an_fmi = 2025
for y in range(1980, an_fmi + 1):
    row = {"annee": y}
    for g2, g3, _ in PAYS:
        v = imf.get(g3, {}).get(str(y)); row[g2] = v
    courant.append(row)
ys = sorted({y for g2, _, _ in PAYS for y in peen.get(g2, {})})
for y in ys:
    position.append({"annee": y, **{g2: (round(peen[g2][y], 1) if y in peen.get(g2, {}) else None) for g2, _, _ in PAYS}})
# déficits cumulés de la France depuis 2005 (en points de PIB)
cumul = round(sum(r["FR"] for r in courant if r["annee"] >= 2005 and r["FR"] is not None), 1)
json.dump({"pays": [[g2, n] for g2, _, n in PAYS], "courant": courant, "position": position, "cumul_fr_2005": cumul},
          open(os.path.join(R, "data", "exterieur.json"), "w"), ensure_ascii=False, indent=1)
print("cumul FR depuis 2005 :", cumul, "| PEEN FR", [(r["annee"], r["FR"]) for r in position if r["annee"] % 5 == 0 or r["annee"] >= 2024])
