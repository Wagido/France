#!/usr/bin/env python3
"""Construit data/retraites.json : les retraites en France comparées aux voisins.

Sources Eurostat (data/sources/) : spr_exp_pens (dépenses de pensions, % du PIB), ilc_pnp2 (revenu médian des 65 ans
et plus rapporté à celui des moins de 65 ans), ilc_pnp3 (taux de remplacement agrégé), demo_mlexpec (espérance de vie
à 65 ans), lfsa_ergan (taux d'emploi des 60-64 ans), demo_pjanind (65 ans et plus pour 100 personnes de 15 à 64 ans).
Usage (depuis la racine) : python3 scripts/build_retraites.py
"""
import json, re, os, sys
HERE = os.path.dirname(os.path.abspath(__file__)); R = os.path.join(HERE, ".."); S = os.path.join(R, "data", "sources")
sys.path.insert(0, HERE)
from build_environnement import lire, NOMS  # noqa: E402

PAYS = ["FR", "DE", "IT", "ES", "NL", "SE", "DK", "BE", "AT", "EU27_2020"]
IND = {"depense": "ret_dep.json", "niveau": "ret_niv.json", "remplacement": "ret_rempl.json", "esperance65": "ret_esp.json", "emploi6064": "ret_emp.json"}
D = {k: lire(f, None, S) for k, f in IND.items()}
pays = []
for g in PAYS:
    r = {"code": g, "nom": NOMS.get(g, g)}
    for k, s in D.items():
        if s.get(g):
            y = max(s[g]); r[k] = round(s[g][y], 2 if k in ("niveau", "remplacement") else 1); r[k + "_annee"] = y
    pays.append(r)
dep = lire("ret_dependance.json", None, S)
ys = sorted({y for g in ("FR", "DE", "IT", "NL", "SE", "EU27_2020") for y in dep.get(g, {}) if y >= 1990})
dependance = [{"annee": y, **{g: dep.get(g, {}).get(y) for g in ("FR", "DE", "IT", "SE", "EU27_2020")}} for y in ys]
# générations : Conseil d'orientation des retraites, rapport annuel 2026, données des figures 3.1, 3.2, 3.3, 3.6, 3.7
import openpyxl
import openpyxl.reader.workbook as _W
_W.WorkbookParser.assign_names = lambda self: None          # le fichier contient des zones d'impression invalides
wb = openpyxl.load_workbook(os.path.join(S, "cor_RA2026_P3.xlsx"), read_only=True, data_only=True)
def serie(feuille, n=0):
    rows = [list(r) for r in wb[feuille].iter_rows(values_only=True)]
    found = 0
    for i, r in enumerate(rows):
        vals = [c for c in r if c is not None]
        ans = [c for c in vals if isinstance(c, (int, float)) and 1930 <= c <= 2010 and float(c).is_integer()]
        if len(ans) >= 20 and i + 1 < len(rows):
            if found == n:
                cols = [j for j, c in enumerate(r) if isinstance(c, (int, float)) and 1930 <= c <= 2010]
                nxt = rows[i + 1]
                return {int(r[j]): nxt[j] for j in cols if j < len(nxt) and isinstance(nxt[j], (int, float))}
            found += 1
    return {}
GEN = {"cotisation": serie("Fig 3.1"), "carriere": serie("Fig 3.2"), "remplacement": serie("Fig 3.3"),
       "retraite": serie("Fig 3.6"), "retraite_part": serie("Fig 3.6", 1), "rendement": serie("Fig 3.7")}
gens = sorted(set().union(*[set(v) for v in GEN.values() if v]))
generations = [{"gen": g, **{k: round(100 * v[g], 2) if k in ("cotisation", "remplacement", "retraite_part", "rendement") else round(v[g], 1) for k, v in GEN.items() if g in v}} for g in gens]
# ---------------------------------------------------------------- la plus grosse dépense publique (fonctions COFOG, d'après data/finances.json)
FH = json.load(open(os.path.join(R, "data", "finances.json")))["fonctions_hist"]
labels = dict(FH["fonctions"])
dl = FH["annees"][-1]
tot = sum(dl["md"].values())
depenses = {"annee": int(dl["annee"]), "total": round(tot, 1),
            "postes": sorted([{"k": k, "l": labels.get(k, k), "md": round(v, 1), "pc_dep": round(100 * v / tot, 1), "pc_pib": round(dl["pct"][k], 1)} for k, v in dl["md"].items()], key=lambda x: -x["md"])}

# ---------------------------------------------------------------- le poids des âgés parmi les électeurs
# population par âge (Eurostat, via data/themes/FR.json) × participation par âge (Insee, enquête sur la participation électorale 2022, Insee Première n° 1928)
import openpyxl
TH = json.load(open(os.path.join(R, "data", "themes", "FR.json")))["demographie"]
an_pyr = max(TH["pyramide"])
pop = {a: h + f for a, h, f in TH["pyramide"][an_pyr]}
wb = openpyxl.load_workbook(os.path.join(R, "data", "sources", "retraites", "ip1928.xlsx"), data_only=True)
part = []
for r in wb["Figure 3"].iter_rows(values_only=True):
    if r and isinstance(r[0], str) and "ans" in r[0] and isinstance(r[1], (int, float)):
        nums = [int(x) for x in re.findall(r"\d+", r[0])]
        lo, hi = (nums[0], nums[1]) if len(nums) > 1 else (nums[0], 200)
        part.append((lo, hi, r[1] / 100, r[2] / 100))
taux = lambda a, k: next(p_[2 + k] for p_ in part if p_[0] <= a <= p_[1])
adultes = [a for a in pop if a >= 18]
GROUPES = [("18-29 ans", 18, 29), ("30-44 ans", 30, 44), ("45-59 ans", 45, 59), ("60-74 ans", 60, 74), ("75 ans et plus", 75, 200)]
def parts(k=None):
    w = (lambda a: pop[a]) if k is None else (lambda a: pop[a] * taux(a, k))
    t = sum(w(a) for a in adultes)
    return [round(100 * sum(w(a) for a in adultes if lo <= a <= hi) / t, 1) for _, lo, hi in GROUPES], (lambda seuil: round(100 * sum(w(a) for a in adultes if a >= seuil) / t, 1))
pp, sp = parts(); pv, sv = parts(0); pl, sl = parts(1)
electeurs = {"annee_pop": int(an_pyr), "groupes": [{"l": g[0], "pop": pp[i], "presid": pv[i], "legis": pl[i]} for i, g in enumerate(GROUPES)],
             "plus60": {"pop": sp(60), "presid": sv(60), "legis": sl(60)}, "plus50": {"pop": sp(50), "presid": sv(50), "legis": sl(50)},
             "plus65": {"pop": sp(65), "presid": sv(65), "legis": sl(65)},
             "participation": [{"l": f"{lo}-{hi} ans" if hi < 200 else f"{lo} ans ou plus", "presid": round(100 * a_, 1), "legis": round(100 * b_, 1)} for lo, hi, a_, b_ in part],
             "projection": [{"annee": p_["annee"], "plus65": round(100 * p_["plus65"] / (p_["total"] - p_["moins20"]), 1)} for p_ in TH["projection"]]}
json.dump({"pays": pays, "dependance": dependance, "generations": generations, "depenses": depenses, "electeurs": electeurs}, open(os.path.join(R, "data", "retraites.json"), "w"), ensure_ascii=False, indent=1)
print(depenses["postes"][:3], electeurs["plus60"], electeurs["plus50"], electeurs["groupes"], electeurs["projection"][::3])
for r in pays: print(r)
