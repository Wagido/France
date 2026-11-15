#!/usr/bin/env python3
"""Construit data/couper.json : dépense publique par fonction (COFOG), en % du PIB, France, moyenne européenne et quelques pays.
Source : Eurostat gov_10a_exp (unit=PC_GDP, administrations publiques S13). Usage : python3 scripts/build_couper.py
"""
import json, os

HERE = os.path.dirname(os.path.abspath(__file__))
R = os.path.join(HERE, "..")
d = json.load(open(os.path.join(R, "data", "sources", "gov_10a_exp_pays_pib.json")))
dims, size = d["id"], d["size"]
inv = {k: {i: c for c, i in d["dimension"][k]["category"]["index"].items()} for k in dims}
V = {}
for k, v in d["value"].items():
    i, co = int(k), {}
    for dim, s in reversed(list(zip(dims, size))):
        co[dim] = inv[dim][i % s]; i //= s
    V[(co["geo"], co["cofog99"], int(co["time"]))] = v
an = max(y for (g, c, y) in V if g == "FR" and c == "TOTAL" and ("EU27_2020", "TOTAL", y) in V)
PAYS = {"FR": "France", "EU27_2020": "Moyenne UE", "DE": "Allemagne", "IT": "Italie", "ES": "Espagne", "NL": "Pays-Bas", "SE": "Suède", "BE": "Belgique"}
# [clé, libellé, codes COFOG, catégorie, groupe du simulateur]
POSTES = [
    ["retraites", "Retraites", ["GF1002"], "transfert", "retraites"],
    ["reversion", "Pensions de réversion (veufs, veuves)", ["GF1003"], "transfert", "retraites"],
    ["ville", "Soins de ville et médicaments", ["GF0701", "GF0702"], "sante", "sante"],
    ["hopital", "Hôpitaux", ["GF0703"], "sante", "sante"],
    ["maladie", "Indemnités maladie et invalidité", ["GF1001"], "transfert", "social"],
    ["chomage", "Allocations chômage", ["GF1005"], "transfert", "social"],
    ["famille", "Famille et enfants", ["GF1004"], "transfert", "social"],
    ["alloc_log", "Aides au logement", ["GF1006"], "transfert", "logement"],
    ["exclusion", "Minima sociaux, exclusion", ["GF1007"], "transfert", "social"],
    ["eco", "Aides à l'économie et à l'emploi", ["GF0401", "GF0407"], "transfert", "eco"],
    ["amenag", "Logement et aménagement urbain", ["GF0601", "GF0602", "GF0603", "GF0604", "GF0606"], "fonctionnement", "logement"],
    ["admin", "Administration générale (ministères, collectivités)", ["GF0101", "GF0103"], "fonctionnement", "admin"],
    ["ordre", "Police, justice, pompiers, prisons", ["GF03"], "fonctionnement", None],
    ["defense", "Défense", ["GF02"], "fonctionnement", None],
    ["culture", "Culture, sport, loisirs", ["GF08"], "fonctionnement", "admin"],
    ["env", "Environnement (déchets, eau, nature)", ["GF05"], "avenir", None],
    ["primaire", "École maternelle et primaire", ["GF0901"], "avenir", None],
    ["secondaire", "Collège et lycée", ["GF0902"], "avenir", None],
    ["superieur", "Enseignement supérieur", ["GF0904"], "avenir", None],
    ["educ_autre", "Cantines, transport scolaire, autres", ["GF0905", "GF0906", "GF0908"], "fonctionnement", "admin"],
    ["recherche", "Recherche", ["GF0104", "GF0408"], "avenir", None],
    ["transports", "Transports (routes, rail)", ["GF0405"], "avenir", None],
    ["interets", "Intérêts de la dette", ["GF0107"], "dette", None],
]
val = lambda g, codes: round(sum(V.get((g, c, an)) or 0 for c in codes), 2) if any((g, c, an) in V for c in codes) else None
out = {"annee": an, "pays": PAYS, "total": {g: V.get((g, "TOTAL", an)) for g in PAYS},
       "postes": [{"k": k, "l": l, "cat": cat, "groupe": gr, "v": {g: val(g, codes) for g in PAYS}} for k, l, codes, cat, gr in POSTES]}
try:
    sk = json.load(open(os.path.join(R, "data", "finances.json")))["sankey"]
    s = sk.get(str(an)) or sk[max(sk)]
    out["pib"], out["deficit"] = s["pib"], s["deficit"]
except (OSError, KeyError):
    pass
json.dump(out, open(os.path.join(R, "data", "couper.json"), "w"), ensure_ascii=False, indent=1)
for p in out["postes"]:
    print(p["k"], p["v"]["FR"], p["v"]["EU27_2020"])
print(an, out["total"], out.get("pib"), out.get("deficit"))
