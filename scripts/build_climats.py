#!/usr/bin/env python3
"""Monnaie, 6.3 et 6.4 : les moteurs de la demande et les quatre climats économiques → data/climats.json

Sources Eurostat : nama_10_gdp (contributions à la croissance du PIB, en points ; volumes), nasa_10_ki (taux d'épargne
des ménages), rd_e_gerdtot (recherche et développement). La grille des climats (croissance × inflation) est calculée
dans la page à partir de data/histoire.json (INSEE).
"""
import json, os

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


def main():
    C = par("contributions.json", "na_item")
    V = par("volumes.json", "na_item")
    ans = sorted(set(C["B1GQ"]) & set(C["P31_S14_S15"]) & set(C["P51G"]) & set(C["P6"]) & set(C["P7"]))
    contrib = [{"annee": a, "pib": C["B1GQ"][a], "conso": C["P31_S14_S15"][a], "public": C["P3_S13"].get(a),
                "invest": C["P51G"][a], "stocks": C["P52_P53"].get(a), "commerce": round(C["P6"][a] + C["P7"][a], 2)} for a in ans]
    vol = [{"annee": a, "pib": V["B1GQ"].get(a), "conso": V["P31_S14_S15"].get(a), "public": V["P3_S13"].get(a),
            "invest": V["P51G"].get(a), "export": V["P6"].get(a), "import": V["P7"].get(a)} for a in sorted(V["B1GQ"])]
    pays = lambda nom: {g: [{"annee": a, "v": v} for a, v in sorted(s.items())] for g, s in par(nom, "geo").items()}
    out = {"contributions": contrib, "volumes": vol, "fbcf": pays("fbcf_pays.json"), "epargne": pays("epargne_pays.json"), "rd": pays("rd_pays.json")}
    json.dump(out, open(os.path.join(ROOT, "data", "climats.json"), "w"), ensure_ascii=False, separators=(",", ":"))
    d = contrib[-1]
    print(f"climats.json : contributions {ans[0]}-{ans[-1]} (dernière : PIB {d['pib']}, conso {d['conso']}, public {d['public']}, invest {d['invest']}, commerce {d['commerce']})")


if __name__ == "__main__":
    main()
