#!/usr/bin/env python3
"""Construit data/empreinte/<PAYS>.json et data/empreinte/index.json : l'empreinte carbone.

L'empreinte compte les gaz à effet de serre émis partout dans le monde pour produire ce que consomment
les habitants d'un pays (y compris les importations, sans les exportations), plus les émissions directes
des ménages (chauffage, carburant de leur voiture).
Source : Eurostat, env_ac_ghgfp (modèle entrées-sorties mondial FIGARO) et env_ac_ainah_r2 (ménages).
Usage (depuis la racine) : python3 scripts/build_empreinte.py
"""
import json, os

HERE = os.path.dirname(os.path.abspath(__file__))
exec(open(os.path.join(HERE, "build.py")).read().split("# ---------------------------------------------------------------- sources")[0])
SRC = os.path.join(HERE, "..", "data", "sources", "empreinte")
OUT = os.path.join(HERE, "..", "data", "empreinte")
os.makedirs(OUT, exist_ok=True)
PAYS = json.load(open(os.path.join(HERE, "..", "data", "themes", "index.json")))["pays"]
POP = {p["code"]: (p.get("demo") or {}).get("population") for p in PAYS}
DEMO = os.path.join(HERE, "..", "data", "sources", "themes")

DIRECT = {"HH_HEAT": "Chauffage et eau chaude (fioul, gaz)", "HH_TRA": "Carburant des voitures", "HH_OTH": "Autres (solvants, climatisation…)"}
USAGES = [("menages", "Achats des ménages (produits et services)", "#3b6fd6"), ("direct", "Émissions directes des ménages (chaudière, voiture)", "#e07b39"),
          ("publics", "Services publics et associations", "#64748b"), ("investissement", "Investissements (bâtiments, routes, machines)", "#a8a29e")]
ORIG = [("domestique", "Dans le pays (production et ménages)"), ("ue", "Ailleurs dans l'Union européenne"), ("CN", "Chine"), ("US", "États-Unis"),
        ("IN", "Inde"), ("RU", "Russie"), ("reste", "Reste du monde")]


def build(geo):
    """Eurostat (FIGARO) : empreinte par usage final et par pays d'origine des émissions."""
    path = os.path.join(SRC, f"ghgfp_{geo}.json")
    if not os.path.exists(path):
        return None
    d = jstat(f"ghgfp_{geo}.json", SRC)
    if len([k for k in d if k != "__single__"]) < 50:
        return None
    f = getter(d)
    o = getter(jstat(f"ghgfp_orig_{geo}.json", SRC))
    hh = getter(jstat("env_ac_ainah_r2.json", SRC, geo))
    pop = getter(jstat("demo_gind.json", DEMO, geo))
    mt = lambda v: round((v or 0) / 1000, 2)        # milliers de tonnes -> Mt
    serie = []
    for y in sorted({dict(k)["time"] for k in d if k != "__single__"}):
        tot = f(na_item="TOTAL", nace_r2="TOTAL_HH", time=y)
        if tot is None:
            continue
        hh_tot = f(na_item="TOTAL", nace_r2="HH", time=y) or 0
        det = {c: hh(nace_r2=c, time=y) for c in DIRECT}
        s_ = sum(v or 0 for v in det.values())
        det = {c: (v or 0) * hh_tot / s_ for c, v in det.items()} if s_ else {}
        usages = {"menages": f(na_item="P31_S14", nace_r2="TOTAL", time=y) or 0, "direct": hh_tot,
                  "publics": (f(na_item="P3_S13", nace_r2="TOTAL", time=y) or 0) + (f(na_item="P31_S15", nace_r2="TOTAL", time=y) or 0),
                  "investissement": (f(na_item="P51G", nace_r2="TOTAL", time=y) or 0) + (f(na_item="P52_P53", nace_r2="TOTAL", time=y) or 0)}
        ue = o(c_orig="EU27_2020", time=y) or 0
        dom = o(c_orig=geo, time=y) or 0
        orig = {"domestique": dom + hh_tot, "ue": ue - dom if geo in EU else ue}
        for c in ["CN", "US", "IN", "RU"]:
            orig[c] = o(c_orig=c, time=y) or 0
        orig["reste"] = tot - sum(orig.values())
        p = pop(indic_de="AVG", time=y) or pop(indic_de="JAN", time=y) or POP.get(geo)
        serie.append({"annee": y, "total": mt(tot), "usages": {k: mt(v) for k, v in usages.items()}, "direct_detail": {k: mt(v) for k, v in det.items()},
                      "origine": {k: mt(v) for k, v in orig.items()}, "population": p, "par_hab": round(tot * 1000 / p, 2) if p else None})
    return {"pays": geo, "serie": serie, "usages": [list(x) for x in USAGES], "direct": [[k, l] for k, l in DIRECT.items()], "origines": [list(x) for x in ORIG]} if serie else None


def sdes():
    """SDES / INSEE : empreinte de la France par poste de consommation, série depuis 1990, comparaison internationale."""
    import openpyxl
    path = os.path.join(SRC, "sdes_empreinte.xlsx")
    if not os.path.exists(path):
        return None
    wb = openpyxl.load_workbook(path, data_only=True)
    rows = lambda ws: [[x for x in r if x is not None] for r in wb[ws].iter_rows(values_only=True)]
    num = lambda x: isinstance(x, (int, float))
    # série
    R2 = rows("data_2")
    ans = next(r for r in R2 if len(r) > 10 and all(isinstance(x, int) for x in r))
    lig = lambda debut: next(r for r in R2 if r and isinstance(r[0], str) and r[0].strip().startswith(debut))
    ph, tt = lig("Empreinte carbone par personne")[1:], lig("Empreinte carbone totale")[1:]
    dm, pi, im = lig("dont Émissions directes")[1:], lig("dont Émissions de la production")[1:], lig("dont Emissions associées aux importations")[1:]
    serie = [{"annee": a, "par_hab": round(ph[i], 2), "total": round(tt[i], 1), "direct": round(dm[i], 1), "interieur": round(pi[i], 1), "importe": round(im[i], 1)}
             for i, a in enumerate(ans) if i < len(ph) and num(ph[i])]
    # décompositions (dernière année détaillée)
    R3 = rows("data_3")
    titre = R3[0][0]
    annee = int(titre.strip()[-4:])
    def bloc(question):
        i = next(k for k, r in enumerate(R3) if r and isinstance(r[0], str) and r[0].startswith(question))
        out = []
        for r in R3[i + 1:]:
            if not r or not isinstance(r[0], str) or r[0].startswith("Total") or len(r) < 2 or not num(r[1]):
                break
            out.append([r[0].strip(), round(r[1], 1)])
        return out
    postes = bloc("Quels postes de consommation")
    origine = bloc("Où ont été émis")
    gaz = bloc("Quels sont les GES")
    R4 = rows("data_4")
    monde = [[r[0], round(r[1], 1)] for r in R4 if len(r) == 2 and isinstance(r[0], str) and r[0] != "pays" and num(r[1])]
    an4 = next((r[1] for r in R4 if r and r[0] == "pays"), None)
    R1 = rows("data_1")
    an1 = int(R1[0][0].strip()[-4:])
    pop = next(r for r in R1 if r and r[0] == "population")[1]
    return {"source": "SDES et INSEE, « L'empreinte carbone de la France » (édition la plus récente)", "serie": serie,
            "annee_postes": annee, "population": pop, "postes": postes, "origine": origine, "gaz": gaz,
            "monde_annee": an4, "monde": monde, "annee_provisoire": an1}


EU = {"BE", "BG", "CZ", "DK", "DE", "EE", "IE", "EL", "ES", "FR", "HR", "IT", "CY", "LV", "LT", "LU", "HU", "MT", "NL", "AT", "PL", "PT", "RO", "SI", "SK", "FI", "SE"}
index = []
for p in PAYS:
    g = p["code"]
    d = build(g)
    s = {"code": g, "nom": p["nom"]}
    if g == "FR" and d is not None:
        d["sdes"] = sdes()
    if d:
        d["nom"] = p["nom"]
        json.dump(d, open(os.path.join(OUT, g + ".json"), "w"), ensure_ascii=False, separators=(",", ":"))
        l = d["serie"][-1]
        s.update({"annee": l["annee"], "total": l["total"], "par_hab": l["par_hab"],
                  "importe": round(100 * (1 - l["origine"]["domestique"] / l["total"]), 1) if l["total"] else None,
                  "usages_hab": {k: round(v / l["population"] * 1e6, 2) for k, v in l["usages"].items()} if l["population"] else None})
        print(g, l["annee"], l["total"], "Mt", l["par_hab"], "t/hab")
    else:
        print(g, "-")
    index.append(s)
json.dump({"pays": index}, open(os.path.join(OUT, "index.json"), "w"), ensure_ascii=False, separators=(",", ":"))
