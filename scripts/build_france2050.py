#!/usr/bin/env python3
"""Article « La France en 2050 » → data/france2050.json et data/departements.geo.json (fond de carte allégé)

Sources Eurostat : proj_23np (projections de population EUROPOP2023, plusieurs hypothèses), demo_gind (naissances,
décès, solde migratoire), demo_pjanind (structure par âge), demo_r_gind3 (taux de solde migratoire par département,
NUTS 3), nrg_bal_c (consommation finale d'énergie par source). Fond de carte : contours des départements (data/sources/sociologie).
"""
import json, os, statistics, unicodedata

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
S = os.path.join(ROOT, "data", "sources", "france2050")


def lire(nom):
    d = json.load(open(os.path.join(S, nom), encoding="utf-8"))
    dims, size = d["id"], d["size"]
    cats = [sorted(d["dimension"][k]["category"]["index"].items(), key=lambda x: x[1]) for k in dims]
    out = []
    for idx, val in d["value"].items():
        i, key = int(idx), []
        for s, c in zip(reversed(size), reversed(cats)):
            key.append(c[i % s][0]); i //= s
        out.append((dict(zip(dims, reversed(key))), val))
    return d, out


def serie(nom, **f):
    _, rows = lire(nom)
    return {int(c["time"]): v for c, v in rows if v is not None and all(c.get(a) == b for a, b in f.items())}


def norm(t):
    t = unicodedata.normalize("NFD", t).encode("ascii", "ignore").decode().lower()
    return "".join(ch for ch in t if ch.isalnum())


def main():
    # 1. démographie observée
    pop, nai, dec, mig = (serie("demographie.json", indic_de=k) for k in ("JAN", "LBIRTH", "DEATH", "CNMIGRAT"))
    hist = [{"annee": a, "pop": round(pop[a] / 1e6, 3) if a in pop else None, "naissances": nai.get(a), "deces": dec.get(a), "migration": mig.get(a)}
            for a in sorted(set(nai) | set(dec))]
    p65 = serie("population_age.json", indic_de="PC_Y65_MAX"); p80 = serie("population_age.json", indic_de="PC_Y80_MAX")
    # 2. projections
    _, rows = lire("projections.json")
    P = {}
    for c, v in rows:
        if v is not None:
            P.setdefault((c["projection"], c["age"]), {})[int(c["time"])] = v
    ans = sorted(P[("BSL", "TOTAL")])
    proj = []
    for a in ans:
        r = {"annee": a}
        for sc in ("BSL", "HMIGR", "LMIGR", "NMIGR", "LFRT"):
            v = P.get((sc, "TOTAL"), {}).get(a)
            r[sc] = round(v / 1e6, 3) if v else None
        t = P[("BSL", "TOTAL")][a]
        r["p65"] = round(100 * P[("BSL", "Y_GE65")][a] / t, 1)
        r["p80"] = round(100 * P[("BSL", "Y_GE80")][a] / t, 1)
        r["p15"] = round(100 * P[("BSL", "Y_LT15")][a] / t, 1)
        r["dep65"] = round(100 * P[("BSL", "Y_GE65")][a] / P[("BSL", "Y20-64")][a], 1)
        r["actifs"] = round(P[("BSL", "Y20-64")][a] / 1e6, 2)
        proj.append(r)
    age_hist = [{"annee": a, "p65": p65[a], "p80": p80.get(a)} for a in sorted(p65)]
    # 3. solde migratoire par département
    geo = json.load(open(os.path.join(ROOT, "data", "sources", "sociologie", "departements.geojson"), encoding="utf-8"))
    par_nom = {norm(f["properties"]["nom"]): f["properties"]["code"] for f in geo["features"]}
    d, rows = lire("migration_departements.json")
    lab = d["dimension"]["geo"]["category"]["label"]
    taux, popd = {}, {}
    for c, v in rows:
        g = c["geo"]
        if not g.startswith("FR") or len(g) != 5 or v is None:
            continue
        if c["indic_de"] == "CNMIGRATRT":
            taux.setdefault(g, {})[int(c["time"])] = v
        elif c["indic_de"] == "JAN":
            popd.setdefault(g, {})[int(c["time"])] = v
    deps, manque = {}, []
    for g, s in taux.items():
        code = par_nom.get(norm(lab[g]))
        if not code:
            manque.append(lab[g]); continue
        per = [s[a] for a in range(2016, 2023) if a in s]
        if len(per) < 5:
            continue
        p0 = popd.get(g, {}).get(2016)
        deps[code] = {"nom": lab[g], "taux": round(statistics.mean(per), 2), "pop": p0,
                      "solde": round(statistics.mean(per) * p0 / 1000 * len(per)) if p0 else None}
    # 4. énergie finale
    E = {k: serie("energie_finale.json", siec=k) for k in ("TOTAL", "O4000XBIO", "G3000", "C0000X0350-0370", "E7000", "H8000", "RA000", "W6100_6220")}
    ener = []
    for a in sorted(E["TOTAL"]):
        tot = E["TOTAL"][a]
        r = {"annee": a, "total_mtep": round(tot / 1000, 1)}
        for k, n in (("O4000XBIO", "petrole"), ("G3000", "gaz"), ("C0000X0350-0370", "charbon"), ("E7000", "electricite"), ("H8000", "chaleur"), ("RA000", "renouvelables"), ("W6100_6220", "dechets")):
            r[n] = round(E[k].get(a, 0) / 1000, 2)
        r["fossile_pc"] = round(100 * (E["O4000XBIO"].get(a, 0) + E["G3000"].get(a, 0) + E["C0000X0350-0370"].get(a, 0)) / tot, 1)
        ener.append(r)
    ref2012 = next(r["total_mtep"] for r in ener if r["annee"] == 2012)
    out = {"demographie": hist, "age": age_hist, "projections": proj, "departements": deps, "departements_absents": manque,
           "energie": ener, "energie_2012": ref2012, "energie_cible_2050": round(ref2012 / 2, 1)}
    json.dump(out, open(os.path.join(ROOT, "data", "france2050.json"), "w"), ensure_ascii=False, separators=(",", ":"))
    # fond de carte allégé (coordonnées arrondies, un point sur deux pour les longs contours)
    def simp(ring):
        r = [[round(x, 3), round(y, 3)] for x, y in ring]
        if len(r) > 60:
            r = r[::2] + [r[-1]]
        return r
    def geom(g):
        if g["type"] == "Polygon":
            return {"type": "Polygon", "coordinates": [simp(r) for r in g["coordinates"]]}
        return {"type": "MultiPolygon", "coordinates": [[simp(r) for r in p] for p in g["coordinates"]]}
    light = {"type": "FeatureCollection", "features": [{"type": "Feature", "properties": f["properties"], "geometry": geom(f["geometry"])} for f in geo["features"]]}
    json.dump(light, open(os.path.join(ROOT, "data", "departements.geo.json"), "w"), separators=(",", ":"))
    b = proj[[p["annee"] for p in proj].index(2050)]
    print(f"france2050.json : population 2050 {b['BSL']} M (65+ {b['p65']} %), {len(deps)} départements cartographiés, absents : {manque}")


if __name__ == "__main__":
    main()
