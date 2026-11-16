#!/usr/bin/env python3
"""Construit data/desindustrialisation.json : part de l'industrie manufacturière dans la valeur ajoutée et dans l'emploi,
France et voisins, et emplois de l'industrie manufacturière en France.

Sources (data/sources/) : Eurostat nama_10_a10 (valeur ajoutée brute, prix courants, section C de la NACE et total)
et nama_10_a10_e (emploi intérieur, personnes, section C et total).
Usage (depuis la racine) : python3 scripts/build_desindustrialisation.py
"""
import json, os, sys
HERE = os.path.dirname(os.path.abspath(__file__)); R = os.path.join(HERE, ".."); S = os.path.join(R, "data", "sources")
sys.path.insert(0, HERE)
from build_environnement import lire  # noqa: E402

PAYS = [("FR", "France"), ("DE", "Allemagne"), ("IT", "Italie"), ("ES", "Espagne"), ("EU27_2020", "Moyenne de l'UE")]
out = {"pays": PAYS}
for f, k in (("indus_va.json", "va"), ("indus_emp.json", "emploi")):
    C, T = lire(f, {"nace_r2": "C"}, S), lire(f, {"nace_r2": "TOTAL"}, S)
    ys = sorted({y for g, _ in PAYS for y in C.get(g, {})})
    out[k] = [{"annee": y, **{g: (round(100 * C[g][y] / T[g][y], 1) if y in C.get(g, {}) and y in T.get(g, {}) else None) for g, _ in PAYS}} for y in ys]
    if k == "emploi":
        out["emplois_fr"] = [{"annee": y, "v": round(C["FR"][y] / 1000, 2)} for y in sorted(C["FR"])]
json.dump(out, open(os.path.join(R, "data", "desindustrialisation.json"), "w"), ensure_ascii=False, indent=1)
e = out["emplois_fr"]; print("emplois FR", e[0], e[-1], "| VA FR", out["va"][0]["FR"], out["va"][-1]["FR"])
