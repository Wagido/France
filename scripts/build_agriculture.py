#!/usr/bin/env python3
"""Construit data/agriculture.json : surfaces par type de culture, part du bio par culture, évolution, comparaison européenne.
Sources Eurostat : apro_cpsh1 (surfaces des cultures), org_cropar (surfaces en agriculture biologique).
Usage (depuis la racine) : python3 scripts/build_agriculture.py
"""
import json, os

HERE = os.path.dirname(os.path.abspath(__file__))
D = os.path.join(HERE, "..", "data", "sources", "agri")


def lire(f, keep=None):
    d = json.load(open(os.path.join(D, f))); dims, size = d["id"], d["size"]
    inv = {k: {i: c for c, i in d["dimension"][k]["category"]["index"].items()} for k in dims}
    out = {}
    for k, v in d["value"].items():
        i, co = int(k), {}
        for dim, s in reversed(list(zip(dims, size))):
            co[dim] = inv[dim][i % s]; i //= s
        if all(co.get(a) == b for a, b in (keep or {}).items()):
            out.setdefault((co["geo"], co["crops"]), {})[int(co["time"])] = v
    return out


A, B = lire("cultures.json"), lire("bio.json")
A.update(lire("cultures_ar.json"))   # surfaces récoltées (AR) quand elles existent : séries plus complètes depuis 2000
GROUPES = [  # clé, libellé, codes, couleur
    ["prairies", "Prairies permanentes (pâturages)", ["J0000"], "#65a30d"],
    ["cereales", "Céréales (blé, orge, maïs grain…)", ["C0000"], "#eab308"],
    ["fourrages", "Fourrages : prairies semées, maïs fourrage", ["G0000"], "#a3e635"],
    ["oleagineux", "Oléagineux (colza, tournesol, soja)", ["I1100"], "#f59e0b"],
    ["vignes", "Vignes", ["W1000"], "#7c3aed"],
    ["jacheres", "Jachères", ["Q0000"], "#d6d3d1"],
    ["betteraves", "Betteraves sucrières", ["R2000"], "#f472b6"],
    ["proteagineux", "Légumes secs et protéagineux (pois, féveroles, lentilles)", ["P0000"], "#14b8a6"],
    ["legumes", "Légumes frais", ["V0000_S0000"], "#22c55e"],
    ["pdt", "Pommes de terre", ["R1000"], "#a16207"],
    ["fruits", "Fruits, agrumes, olives", ["F0000", "T0000", "O1000"], "#ef4444"],
]
g = lambda S, codes, y, mult=1: sum((S.get(("FR", c), {}).get(y) or 0) for c in codes) * mult
an = max(A[("FR", "UAA")]); an_bio = 2020
uaa = A[("FR", "UAA")]
rows = []
for k, l, codes, c in GROUPES:
    surf = g(A, codes, an) * 1000           # hectares
    s_b = g(A, codes, an_bio) * 1000
    bio = g(B, codes, an_bio)
    rows.append({"k": k, "l": l, "c": c, "ha": round(surf), "ha_2000": round(g(A, codes, 2000) * 1000), "bio_pc": round(100 * bio / s_b, 1) if s_b else None})
autres = uaa[an] * 1000 - sum(r["ha"] for r in rows)
rows.append({"k": "autres", "l": "Autres (semences, fleurs, plantes industrielles…)", "c": "#94a3b8", "ha": round(autres), "ha_2000": round(uaa[2000] * 1000 - sum(r["ha_2000"] for r in rows)), "bio_pc": None})
evol = [{"annee": y, **{k: (round(g(A, codes, y) / 1000, 2) or None) for k, l, codes, c in GROUPES if k in ("prairies", "cereales", "fourrages", "oleagineux", "proteagineux")}} for y in sorted(uaa)]   # 0 = donnée manquante
bio_tot = B.get(("FR", "UAAXK0000"), {})
bio_serie = [{"annee": y, "ha": v, "pc": round(100 * v / (uaa[y] * 1000), 1)} for y, v in sorted(bio_tot.items()) if y in uaa]
# comparaison : part de la surface agricole en prairies permanentes et en céréales
P = lire("cult_pays.json")
NOMS = {"EU27_2020": "Moyenne de l'Union européenne", "BE": "Belgique", "BG": "Bulgarie", "CZ": "Tchéquie", "DK": "Danemark", "DE": "Allemagne", "EE": "Estonie",
        "IE": "Irlande", "EL": "Grèce", "ES": "Espagne", "FR": "France", "HR": "Croatie", "IT": "Italie", "CY": "Chypre", "LV": "Lettonie", "LT": "Lituanie",
        "LU": "Luxembourg", "HU": "Hongrie", "MT": "Malte", "NL": "Pays-Bas", "AT": "Autriche", "PL": "Pologne", "PT": "Portugal", "RO": "Roumanie",
        "SI": "Slovénie", "SK": "Slovaquie", "FI": "Finlande", "SE": "Suède"}
cmp_ = []
for geo, nom in NOMS.items():
    u = P.get((geo, "UAA"), {})
    if not u:
        continue
    y = max(u)
    pr, ce = P.get((geo, "J0000"), {}).get(y), P.get((geo, "C0000"), {}).get(y)
    if pr is None or ce is None:
        continue
    cmp_.append({"code": geo, "nom": nom, "annee": y, "prairies": round(100 * pr / u[y], 1), "cereales": round(100 * ce / u[y], 1), "surface": round(u[y] / 1000, 1)})
json.dump({"annee": an, "annee_bio": an_bio, "sau": round(uaa[an] * 1000), "sau_2000": round(uaa[2000] * 1000), "cultures": rows, "evol": evol, "bio": bio_serie, "pays": cmp_},
          open(os.path.join(HERE, "..", "data", "agriculture.json"), "w"), ensure_ascii=False, indent=1)
for r in rows:
    print(r["k"], r["ha"], r["ha_2000"], r["bio_pc"])
print(an, uaa[an], bio_serie[-1], [c for c in cmp_ if c["code"] in ("FR", "EU27_2020", "DE")])
