#!/usr/bin/env python3
"""Construit data/environnement.json : biodiversité, forêt, air, pesticides, catastrophes climatiques, fiscalité verte.
Sources : INSEE (indicateurs de développement durable, oiseaux communs, d'après le MNHN) et Eurostat
(env_bio2, sdg_15_20, sdg_14_10, env_air_gge, for_area_efa, sdg_11_52, aei_hri, sdg_02_40, aei_pr_gnb, cli_iad_loss, env_ac_tax, gov_10a_exp).
Usage (depuis la racine) : python3 scripts/build_environnement.py
"""
import json, os

HERE = os.path.dirname(os.path.abspath(__file__))
D = os.path.join(HERE, "..", "data", "sources", "env")
NOMS = {"EU27_2020": "Moyenne de l'Union européenne", "BE": "Belgique", "BG": "Bulgarie", "CZ": "Tchéquie", "DK": "Danemark", "DE": "Allemagne", "EE": "Estonie",
        "IE": "Irlande", "EL": "Grèce", "ES": "Espagne", "FR": "France", "HR": "Croatie", "IT": "Italie", "CY": "Chypre", "LV": "Lettonie", "LT": "Lituanie",
        "LU": "Luxembourg", "HU": "Hongrie", "MT": "Malte", "NL": "Pays-Bas", "AT": "Autriche", "PL": "Pologne", "PT": "Portugal", "RO": "Roumanie",
        "SI": "Slovénie", "SK": "Slovaquie", "FI": "Finlande", "SE": "Suède", "NO": "Norvège", "CH": "Suisse", "IS": "Islande"}


def lire(f, keep=None, base=D):
    d = json.load(open(os.path.join(base, f))); dims, size = d["id"], d["size"]
    inv = {k: {i: c for c, i in d["dimension"][k]["category"]["index"].items()} for k in dims}
    out = {}
    for k, v in d["value"].items():
        i, co = int(k), {}
        for dim, s in reversed(list(zip(dims, size))):
            co[dim] = inv[dim][i % s]; i //= s
        if all(co.get(a) == b for a, b in (keep or {}).items()):
            out.setdefault(co["geo"], {})[int(co["time"][:4])] = v
    return out


def serie(S, g, nd=1):
    return [{"annee": y, "v": round(v, nd)} for y, v in sorted(S.get(g, {}).items())]


def classement(S, nd=1, an_min=None):
    rows = []
    for g, nom in NOMS.items():
        s = S.get(g)
        if not s:
            continue
        y = max(s)
        if an_min and y < an_min:
            continue
        rows.append({"code": g, "nom": nom, "annee": y, "v": round(s[y], nd)})
    return rows


def main():
    out = {}
    # 1. biodiversité : oiseaux communs (INSEE / MNHN), aires protégées
    o = json.load(open(os.path.join(D, "oiseaux_fr.json")))["observations"]
    B = {}
    for x in o:
        d, v = x["dimensions"], x["measures"]["OBS_VALUE_NIVEAU"].get("value")
        if v is not None:
            k = {"_T": "specialistes", "HABIT_TYP1": "agricoles", "HABIT_TYP2": "forestiers", "HABIT_TYP3": "batis", "_Z": "generalistes"}[d["COMPOSITE_BREAKDOWN"]]
            B.setdefault(int(d["TIME_PERIOD"]), {})[k] = v
    out["oiseaux"] = {"fr": [{"annee": 1989, "specialistes": 100, "agricoles": 100, "forestiers": 100, "batis": 100, "generalistes": 100}] + [{"annee": y, **B[y]} for y in sorted(B)]}
    ue = lire("oiseaux_ue.json")
    out["oiseaux"]["pays"] = sorted([{"code": g, "nom": NOMS.get(g, g), "debut": 2000, "annee": max(s), "v": round(100 * (s[max(s)] / s[2000] - 1))} for g, s in ue.items() if g in NOMS and 2000 in s and max(s) >= 2015], key=lambda r: r["v"])
    out["aires"] = {"terre": classement(lire("aires.json", {"unit": "PC"})), "mer": classement(lire("aires_mer.json", {"unit": "PC"}))}
    # 2. forêt : puits de carbone (émissions nettes des forêts, négatif = absorption) et surface
    fo, tot = lire("gge_forest.json", {"src_crf": "CRF4A"}), lire("gge_forest.json", {"src_crf": "CRF4"})
    ar = lire("for_area.json")
    rows = []
    for g, s in fo.items():
        if g not in NOMS or not ar.get(g):
            continue
        y = max(s); a = ar[g][max(ar[g])]
        rows.append({"code": g, "nom": NOMS[g], "annee": y, "v": round(-s[y] * 1e6 / (a * 1e3), 2), "mt": round(-s[y], 1)})
    out["foret"] = {"fr": [{"annee": y, "foret": round(-v, 1), "utcatf": round(-tot["FR"].get(y, 0), 1)} for y, v in sorted(fo["FR"].items())], "pays": rows,
                    "surface_fr": ar["FR"][max(ar["FR"])], "annee_surface": max(ar["FR"])}
    # 3. air : décès prématurés dus aux particules fines
    pm_r, pm_n = lire("pm_deaths.json", {"unit": "RT"}), lire("pm_deaths.json", {"unit": "NR"})
    out["air"] = {"fr": [{"annee": y, "deces": v, "taux": pm_r["FR"].get(y)} for y, v in sorted(pm_n["FR"].items())], "ue": serie(pm_r, "EU27_2020"), "pays": classement(pm_r)}
    # 4. pesticides, bio, azote
    h = lire("hri.json", {"subst_cat": "HRI1"})
    out["pesticides"] = {"fr": serie(h, "FR", 0), "ue": serie(h, "EU27_2020", 0), "pays": classement(h, 0),
                         "bio": classement(lire("bio.json")), "bio_fr": serie(lire("bio.json"), "FR"), "azote": classement(lire("azote.json"), 0)}
    # 5. catastrophes climatiques (pertes économiques, euros constants)
    la = lire("pertes.json", {"statinfo": "VAL_A", "stk_flow": "LOSS", "unit": "MEUR_KP"})
    lm = lire("pertes.json", {"statinfo": "AVG_30Y", "stk_flow": "LOSS", "unit": "EUR_HAB_KP"})
    out["catastrophes"] = {"fr": [{"annee": y, "pertes": round(v)} for y, v in sorted(la["FR"].items())], "pays": classement(lm, 0)}
    # 6. fiscalité verte et dépense publique d'environnement
    tx_pib, tx_tot = lire("taxes.json", {"unit": "PC_GDP"}), lire("taxes.json", {"unit": "PC_TSCO"})
    cg = lire("gov_10a_exp_pays_pib.json", {"cofog99": "GF05"}, base=os.path.join(HERE, "..", "data", "sources"))
    out["transition"] = {"fr": [{"annee": y, "pib": round(v, 2), "part": round(tx_tot["FR"].get(y, 0), 1)} for y, v in sorted(tx_pib["FR"].items())],
                         "ue": serie(tx_pib, "EU27_2020", 2), "pays": classement(tx_pib, 2), "pays_part": classement(tx_tot), "depense": classement(cg)}
    json.dump(out, open(os.path.join(HERE, "..", "data", "environnement.json"), "w"), ensure_ascii=False, indent=1)
    fr = lambda rows: next((r for r in rows if r["code"] == "FR"), None)
    print("oiseaux", out["oiseaux"]["fr"][-1], [p for p in out["oiseaux"]["pays"] if p["code"] in ("FR", "DE")])
    print("aires", fr(out["aires"]["terre"]), fr(out["aires"]["mer"]))
    print("foret", out["foret"]["fr"][0], out["foret"]["fr"][-1], fr(out["foret"]["pays"]))
    print("air", out["air"]["fr"][-1], fr(out["air"]["pays"]))
    print("pest", out["pesticides"]["fr"][-1], fr(out["pesticides"]["bio"]), fr(out["pesticides"]["azote"]))
    print("cata", out["catastrophes"]["fr"][-3:], fr(out["catastrophes"]["pays"]))
    print("trans", out["transition"]["fr"][-1], fr(out["transition"]["pays"]), fr(out["transition"]["depense"]))


if __name__ == "__main__":
    main()