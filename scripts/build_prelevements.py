#!/usr/bin/env python3
"""Construit data/prelevements_pays.json : impôts et cotisations sociales (prélèvements) et dépense publique, en % du PIB,
pour les pays de l'Union européenne, l'Islande, la Norvège et la Suisse (Eurostat gov_10a_taxag et gov_10a_main).
Usage (depuis la racine) : python3 scripts/build_prelevements.py
"""
import json, os

HERE = os.path.dirname(os.path.abspath(__file__))
S = os.path.join(HERE, "..", "data", "sources")
NOMS = {"EU27_2020": "Moyenne de l'Union européenne", "BE": "Belgique", "BG": "Bulgarie", "CZ": "Tchéquie", "DK": "Danemark", "DE": "Allemagne", "EE": "Estonie",
        "IE": "Irlande", "EL": "Grèce", "ES": "Espagne", "FR": "France", "HR": "Croatie", "IT": "Italie", "CY": "Chypre", "LV": "Lettonie", "LT": "Lituanie",
        "LU": "Luxembourg", "HU": "Hongrie", "MT": "Malte", "NL": "Pays-Bas", "AT": "Autriche", "PL": "Pologne", "PT": "Portugal", "RO": "Roumanie",
        "SI": "Slovénie", "SK": "Slovaquie", "FI": "Finlande", "SE": "Suède", "IS": "Islande", "NO": "Norvège", "CH": "Suisse"}


def lire(f):
    d = json.load(open(os.path.join(S, f)))
    geo = d["dimension"]["geo"]["category"]["index"]; tim = d["dimension"]["time"]["category"]["index"]
    ig = {i: g for g, i in geo.items()}; it = {i: t for t, i in tim.items()}
    nt = len(tim); out = {}
    for k, v in d["value"].items():
        k = int(k); out.setdefault(ig[k // nt], {})[int(it[k % nt])] = v
    return out


po, te = lire("gov_10a_taxag_pays.json"), lire("gov_10a_main_pays_te.json")
an = max(y for g in ("FR", "DE", "IT") for y in po.get(g, {}))
pays = []
for g, nom in NOMS.items():
    p = po.get(g, {}).get(an)
    if p is None:
        continue
    pays.append({"code": g, "nom": nom, "prelevements": round(p, 1), "depense": round(te.get(g, {}).get(an), 1) if te.get(g, {}).get(an) is not None else None})
pays.sort(key=lambda r: -r["prelevements"])
serie_fr = [{"annee": y, "prelevements": round(po["FR"][y], 1), "ue": round(po["EU27_2020"][y], 1) if y in po.get("EU27_2020", {}) else None} for y in sorted(po["FR"])]
# position extérieure de la France (balance des paiements) : ce que la France possède à l'étranger et ce que l'étranger possède en France
pei = {}
try:
    d = json.load(open(os.path.join(S, "bop_iip_fr.json")))
    dims, size = d["id"], d["size"]
    inv = {k: {i: c for c, i in d["dimension"][k]["category"]["index"].items()} for k in dims}
    for k, v in d["value"].items():
        i, co = int(k), {}
        for dim, s in reversed(list(zip(dims, size))):
            co[dim] = inv[dim][i % s]; i //= s
        if len(co["time"]) == 4:   # annuel
            pei.setdefault(int(co["time"]), {})[co["stk_flow"]] = round(v / 1000, 1)
except (OSError, KeyError) as e:
    print("position extérieure : données absentes", e)
pei = [{"annee": y, "actifs": r.get("A_LE"), "passifs": r.get("L_LE"), "net": r.get("N_LE")} for y, r in sorted(pei.items())]
json.dump({"annee": an, "pays": pays, "france": serie_fr, "pei": pei}, open(os.path.join(HERE, "..", "data", "prelevements_pays.json"), "w"), ensure_ascii=False, indent=1)
print(an, [(r["code"], r["prelevements"], r["depense"]) for r in pays[:8]])
