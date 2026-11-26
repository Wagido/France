#!/usr/bin/env python3
"""Monnaie, 6.3 et 6.4 : les moteurs de la demande et les quatre climats économiques → data/climats.json

Sources Eurostat : nama_10_gdp (contributions à la croissance du PIB, en points ; volumes), nasa_10_ki (taux d'épargne
des ménages), rd_e_gerdtot (recherche et développement). La grille des climats (croissance × inflation) est calculée
dans la page à partir de data/histoire.json (INSEE).
"""
import json, os

try:
    import openpyxl
except ImportError:
    openpyxl = None

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
S = os.path.join(ROOT, "data", "sources", "climats")


def table(nom):
    d = json.load(open(os.path.join(S, nom), encoding="utf-8"))
    dims, size = d["id"], d["size"]
    cats = [sorted(d["dimension"][k]["category"]["index"].items(), key=lambda x: x[1]) for k in dims]
    out = []
    for idx, val in d["value"].items():
        i, key = int(idx), []
        for s, c in zip(reversed(size), reversed(cats)):
            key.append(c[i % s][0]); i //= s
        out.append((dict(zip(dims, reversed(key))), val))
    return out


def par(nom, cle):
    r = {}
    for c, v in table(nom):
        if v is not None:
            r.setdefault(c[cle], {})[int(c["time"])] = v
    return r


def kondratiev():
    """Taux d'intérêt à long terme et inflation depuis 1870 (Jordà-Schularick-Taylor), prolongés pour la France
    par Eurostat (taux à 10 ans) ; inflation lissée sur 10 ans."""
    if openpyxl is None:
        return None
    wb = openpyxl.load_workbook(os.path.join(ROOT, "data", "sources", "histoire", "jst_macrohistory.xlsx"), read_only=True, data_only=True)
    rows = wb[wb.sheetnames[0]].iter_rows(values_only=True); h = next(rows)
    I = {k: h.index(k) for k in ("year", "iso", "ltrate", "cpi")}
    taux, cpi = {}, {}
    for r in rows:
        iso = r[I["iso"]]
        if iso in ("FRA", "GBR", "USA"):
            y = r[I["year"]]
            if r[I["ltrate"]] is not None:
                taux.setdefault(iso, {})[y] = r[I["ltrate"]]
            if r[I["cpi"]]:
                cpi.setdefault(iso, {})[y] = r[I["cpi"]]
    # France après 2017-2020 : taux long Eurostat
    d = json.load(open(os.path.join(ROOT, "data", "sources", "irt_lt_mcby_a_fr.json"), encoding="utf-8"))
    inv = {i: y for y, i in d["dimension"]["time"]["category"]["index"].items()}
    for k, v in d["value"].items():
        y = int(inv[int(k)])
        if y not in taux["FRA"]:
            taux["FRA"][y] = v
    infl = {}
    for iso, c in cpi.items():
        for y in c:
            if y - 1 in c:
                infl.setdefault(iso, {})[y] = 100 * (c[y] / c[y - 1] - 1)
    out = []
    for y in range(1870, max(taux["FRA"]) + 1):
        r = {"annee": y}
        for iso, k in (("FRA", "fr"), ("GBR", "uk"), ("USA", "us")):
            v = taux.get(iso, {}).get(y)
            r["t_" + k] = round(v, 2) if v is not None else None
            w = [infl.get(iso, {}).get(a) for a in range(y - 9, y + 1)]
            w = [x for x in w if x is not None]
            r["i_" + k] = round(sum(w) / len(w), 2) if len(w) >= 8 else None
        out.append(r)
    return out


def main():
    C = par("contributions.json", "na_item")
    V = par("volumes.json", "na_item")
    ans = sorted(set(C["B1GQ"]) & set(C["P31_S14_S15"]) & set(C["P51G"]) & set(C["P6"]) & set(C["P7"]))
    contrib = [{"annee": a, "pib": C["B1GQ"][a], "conso": C["P31_S14_S15"][a], "public": C["P3_S13"].get(a),
                "invest": C["P51G"][a], "stocks": C["P52_P53"].get(a), "commerce": round(C["P6"][a] + C["P7"][a], 2)} for a in ans]
    vol = [{"annee": a, "pib": V["B1GQ"].get(a), "conso": V["P31_S14_S15"].get(a), "public": V["P3_S13"].get(a),
            "invest": V["P51G"].get(a), "export": V["P6"].get(a), "import": V["P7"].get(a)} for a in sorted(V["B1GQ"])]
    pays = lambda nom: {g: [{"annee": a, "v": v} for a, v in sorted(s.items())] for g, s in par(nom, "geo").items()}
    T = {}
    for c, v in table("pib_trimestriel.json"):
        if v is not None:
            T.setdefault(c["time"], {})["ga" if c["unit"] == "CLV_PCH_SM" else "qq"] = v
    M = {c["time"]: v for c, v in table("inflation_mensuelle.json") if v is not None}
    actu = {"trimestres": [{"t": t, **T[t]} for t in sorted(T)], "inflation": [{"m": m, "v": M[m]} for m in sorted(M)]}
    # les mêmes moteurs en valeur (milliards d'euros courants) : PIB = conso + dépense publique + investissement + stocks + exportations − importations
    import sys as _s; _s.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    from build_environnement import lire
    N = {it: lire("nama_10_gdp.json", {"unit": "CP_MEUR", "na_item": it}, os.path.join(ROOT, "data", "sources"))["FR"] for it in ("B1GQ", "P31_S14_S15", "P3_S13", "P51G", "P52_P53", "P6", "P7")}
    niveaux = [{"annee": a, "pib": round(N["B1GQ"][a] / 1000, 1), "conso": round(N["P31_S14_S15"][a] / 1000, 1), "public": round(N["P3_S13"][a] / 1000, 1),
                "invest": round(N["P51G"][a] / 1000, 1), "stocks": round(N["P52_P53"][a] / 1000, 1), "export": round(N["P6"][a] / 1000, 1), "import": round(-N["P7"][a] / 1000, 1)}
               for a in sorted(N["B1GQ"]) if all(a in N[k] for k in N)]
    out = {"niveaux": niveaux, "kondratiev": kondratiev(), "actualite": actu, "contributions": contrib, "volumes": vol, "fbcf": pays("fbcf_pays.json"), "epargne": pays("epargne_pays.json"), "rd": pays("rd_pays.json")}
    json.dump(out, open(os.path.join(ROOT, "data", "climats.json"), "w"), ensure_ascii=False, separators=(",", ":"))
    d = contrib[-1]
    print(f"climats.json : contributions {ans[0]}-{ans[-1]} (dernière : PIB {d['pib']}, conso {d['conso']}, public {d['public']}, invest {d['invest']}, commerce {d['commerce']})")


if __name__ == "__main__":
    main()
