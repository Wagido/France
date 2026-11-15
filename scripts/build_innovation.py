#!/usr/bin/env python3
"""Construit data/innovation.json : brevets européens par habitant, dépense de R&D par secteur (entreprises, État, universités).
Sources Eurostat : sdg_09_40 (demandes de brevets à l'Office européen des brevets), rd_e_gerdtot (dépense intérieure de R&D).
Usage (depuis la racine) : python3 scripts/build_innovation.py
"""
import json, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from build_environnement import lire, classement, NOMS
HERE = os.path.dirname(os.path.abspath(__file__))
D = os.path.join(HERE, "..", "data", "sources", "innov")
NOMS.update({"US": "États-Unis", "JP": "Japon", "CN_X_HK": "Chine", "KR": "Corée du Sud", "UK": "Royaume-Uni", "IL": "Israël"})
p = lire("sdg_09_40.json", {"coop_ptn": "APPL", "unit": "P_MHAB"}, base=D)
sect = {s: lire("rd_e_gerdtot.json", {"sectperf": s}, base=D) for s in ("TOTAL", "BES", "GOV", "HES", "PNP")}
rd = []
for g, nom in NOMS.items():
    t, b = sect["TOTAL"].get(g), sect["BES"].get(g)
    if not t or not b:
        continue
    y = max(set(t) & set(b))       # dernière année avec le détail par secteur
    v = lambda s: round(sect[s].get(g, {}).get(y) or 0, 2)
    rd.append({"code": g, "nom": nom, "annee": y, "total": v("TOTAL"), "entreprises": v("BES"), "public": round(v("GOV") + v("HES") + v("PNP"), 2)})
serie = lambda g: [{"annee": y, "v": round(x)} for y, x in sorted(p.get(g, {}).items())]
out = {"brevets": [dict(r, v=round(r["v"])) for r in classement(p, 0)], "brevets_fr": serie("FR"), "brevets_de": serie("DE"), "brevets_ue": serie("EU27_2020"), "rd": rd}
json.dump(out, open(os.path.join(HERE, "..", "data", "innovation.json"), "w"), ensure_ascii=False, indent=1)
print([r for r in out["rd"] if r["code"] in ("FR", "DE", "US", "KR", "EU27_2020")])
