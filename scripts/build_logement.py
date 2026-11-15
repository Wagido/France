#!/usr/bin/env python3
"""Construit data/logement.json : prix des logements, coût de construction, prix et revenus (France), et comparaison européenne.
Sources Eurostat : prc_hpi_a (prix des logements), sts_copi_a (prix de production des logements neufs, hors terrain),
prc_hicp_aind (prix à la consommation), ilc_di03 (revenu médian), ilc_mded01 (part du logement dans le revenu),
ilc_lvho07a (taux de surcharge : plus de 40 % du revenu consacré au logement).
Usage (depuis la racine) : python3 scripts/build_logement.py
"""
import json, os

HERE = os.path.dirname(os.path.abspath(__file__))
D = os.path.join(HERE, "..", "data", "sources", "logement")


def lire(f, keep):
    d = json.load(open(os.path.join(D, f))); dims, size = d["id"], d["size"]
    inv = {k: {i: c for c, i in d["dimension"][k]["category"]["index"].items()} for k in dims}
    out = {}
    for k, v in d["value"].items():
        i, co = int(k), {}
        for dim, s in reversed(list(zip(dims, size))):
            co[dim] = inv[dim][i % s]; i //= s
        if all(co.get(a) == b for a, b in keep.items()):
            out.setdefault(co["geo"], {})[int(co["time"])] = v
    return out


hp = lire("prc_hpi_a.json", {}); cc = lire("sts_copi_a.json", {"indic_bt": "PRC_PRR", "unit": "I15"})
hi = lire("prc_hicp_aind.json", {}); di = lire("ilc_di03.json", {})
md = lire("ilc_mded01.json", {"hhcomp": "TOTAL", "rskpovth": "TOTAL"}); ob = lire("ilc_lvho07a.json", {})
# France : indices base 100 la première année commune
F = {"prix": hp.get("FR", {}), "construction": cc.get("FR", {}), "inflation": hi.get("FR", {}), "revenu": di.get("FR", {})}
ans = sorted(set.intersection(*[set(v) for v in F.values()]))
y0 = ans[0]
france = [{"annee": y, **{k: (round(100 * v[y] / v[y0], 1) if y in v else None) for k, v in F.items()}} for y in sorted(set().union(*[set(v) for v in F.values()])) if y >= y0]
NOMS = {"EU27_2020": "Moyenne de l'Union européenne", "BE": "Belgique", "BG": "Bulgarie", "CZ": "Tchéquie", "DK": "Danemark", "DE": "Allemagne", "EE": "Estonie",
        "IE": "Irlande", "EL": "Grèce", "ES": "Espagne", "FR": "France", "HR": "Croatie", "IT": "Italie", "CY": "Chypre", "LV": "Lettonie", "LT": "Lituanie",
        "LU": "Luxembourg", "HU": "Hongrie", "MT": "Malte", "NL": "Pays-Bas", "AT": "Autriche", "PL": "Pologne", "PT": "Portugal", "RO": "Roumanie",
        "SI": "Slovénie", "SK": "Slovaquie", "FI": "Finlande", "SE": "Suède"}
pays = []
for g, nom in NOMS.items():
    h, r, m, o = hp.get(g, {}), di.get(g, {}), md.get(g, {}), ob.get(g, {})
    yl = max(set(h) & set(r)) if set(h) & set(r) else None
    if not yl or 2015 not in h or 2015 not in r or not m:
        continue
    pays.append({"code": g, "nom": nom, "annee": yl, "prix": round(100 * (h[yl] / h[2015] - 1)), "revenu": round(100 * (r[yl] / r[2015] - 1)),
                 "effort": round(100 * ((h[yl] / h[2015]) / (r[yl] / r[2015]) - 1)), "part": m[max(m)], "surcharge": o.get(max(o)) if o else None, "annee_part": max(m)})
pays.sort(key=lambda p: -p["part"])
json.dump({"france": france, "base": y0, "pays": pays}, open(os.path.join(HERE, "..", "data", "logement.json"), "w"), ensure_ascii=False, indent=1)
print(france[0], france[-1]); print([(p["code"], p["part"], p["effort"]) for p in pays][:10])
