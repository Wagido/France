#!/usr/bin/env python3
"""Construit data/patrimoine_hist.json : fréquentation touristique étrangère, visites de monuments et musées, dépense publique culturelle.
Sources Eurostat : tour_occ_ninat (nuitées des non-résidents), ilc_scp03 (pratiques culturelles, 2022), gov_10a_exp (fonction 08.2 services culturels).
Usage (depuis la racine) : python3 scripts/build_patrimoine_hist.py
"""
import json, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from build_environnement import lire, classement, NOMS   # mêmes lecteurs et noms de pays
HERE = os.path.dirname(os.path.abspath(__file__))
D = os.path.join(HERE, "..", "data", "sources", "patrimoine_hist")
pop = {}
try:
    p = json.load(open(os.path.join(HERE, "..", "data", "themes", "index.json")))
except OSError:
    p = None
nuit = lire("tour_occ_ninat.json", base=D)
# population : demo_pjan via les fichiers pays si disponibles, sinon nuitées absolues seulement
vis = lire("ilc_scp03.json", {"frequenc": "GE1", "acl00": "AC523H", "isced11": "TOTAL", "age": "Y_GE16", "sex": "T"}, base=D)
cult = lire("gov_10a_exp_pays_pib.json", {"cofog99": "GF0802"}, base=os.path.join(HERE, "..", "data", "sources"))
patr = lire("gov_10a_exp_pays_pib.json", {"cofog99": "GF08"}, base=os.path.join(HERE, "..", "data", "sources"))
out = {"nuitees": [dict(r, v=round(r["v"] / 1e6, 1)) for r in classement(nuit, 0)], "nuitees_fr": [{"annee": y, "v": round(v / 1e6, 1)} for y, v in sorted(nuit["FR"].items())],
       "visites": classement(vis), "culture_pib": classement(cult), "culture_large": classement(patr),
       "unesco": [["Italie", 61], ["Chine", 60], ["Allemagne", 55], ["France", 54], ["Espagne", 50]]}
json.dump(out, open(os.path.join(HERE, "..", "data", "patrimoine_hist.json"), "w"), ensure_ascii=False, indent=1)
fr = lambda rows: next((r for r in rows if r["code"] == "FR"), None)
print(fr(out["nuitees"]), out["nuitees_fr"][-3:], fr(out["visites"]), fr(out["culture_pib"]), fr(out["culture_large"]))
print(sorted(out["nuitees"], key=lambda r: -r["v"])[:5])
