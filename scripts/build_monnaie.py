#!/usr/bin/env python3
"""Construit data/monnaie.json pour l'article « La monnaie et la dette obligent-elles à croître ? ».
Sources :
  INSEE, comptes nationaux base 2020 : PIB en valeur (011779992) et en volume (011779991) → croissance nominale et réelle ;
  Eurostat irt_lt_mcby_a : taux d'intérêt à long terme de l'État (critère de Maastricht), France, complété avant 1970 par la Macrohistory Database ;
  Jordà, Schularick et Taylor, Macrohistory Database : crédits bancaires au secteur privé, monnaie au sens large, PIB nominal ;
  BCE, statistiques monétaires (BSI) : M1, M2, M3 et billets de la zone euro ; Eurostat nama_10_gdp : PIB de la zone euro.
Usage (depuis la racine) : python3 scripts/build_monnaie.py
"""
import json, os, re
import openpyxl

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, "..", "data", "sources")

# PIB INSEE
t = open(os.path.join(SRC, "histoire", "bdm_histoire.xml"), encoding="utf-8").read()
S = {}
for m in re.finditer(r"<Series ([^>]*)>(.*?)</Series>", t, re.S):
    idb = re.search(r'IDBANK="([^"]+)"', m.group(1)).group(1)
    S[idb] = {int(y): float(v) for y, v in re.findall(r'TIME_PERIOD="(\d{4})"[^/]*OBS_VALUE="([^"]+)"', m.group(2))}
val, vol = S["011779992"], S["011779991"]

# taux long Eurostat
d = json.load(open(os.path.join(SRC, "irt_lt_mcby_a_fr.json")))
inv = {i: y for y, i in d["dimension"]["time"]["category"]["index"].items()}
taux = {int(inv[int(k)]): v for k, v in d["value"].items()}

# taux long JST avant les données Eurostat
wb0 = openpyxl.load_workbook(os.path.join(SRC, "histoire", "jst_macrohistory.xlsx"), read_only=True, data_only=True)
r0 = wb0[wb0.sheetnames[0]].iter_rows(values_only=True); h0 = next(r0)
for r in r0:
    if r[h0.index("iso")] == "FRA" and r[h0.index("year")] not in taux and r[h0.index("ltrate")] is not None:
        taux[r[h0.index("year")]] = r[h0.index("ltrate")]
serie = []
for y in sorted(val):
    if y - 1 not in val:
        continue
    nom = 100 * (val[y] / val[y - 1] - 1)
    reel = 100 * (vol[y] / vol[y - 1] - 1)
    serie.append({"annee": y, "nominal": round(nom, 1), "reel": round(reel, 1), "prix": round(nom - reel, 1), "taux": round(taux[y], 2) if y in taux else None})

# crédit et monnaie en % du PIB (JST)
wb = openpyxl.load_workbook(os.path.join(SRC, "histoire", "jst_macrohistory.xlsx"), read_only=True, data_only=True)
rows = wb[wb.sheetnames[0]].iter_rows(values_only=True)
h = next(rows)
I = {k: h.index(k) for k in ("year", "iso", "gdp", "money", "tloans", "thh", "tbus", "debtgdp")}
credit = []
for r in rows:
    if r[I["iso"]] != "FRA" or r[I["year"]] < 1900 or not r[I["gdp"]]:
        continue
    g = r[I["gdp"]]
    pc = lambda k: round(100 * r[I[k]] / g, 1) if r[I[k]] is not None else None
    credit.append({"annee": r[I["year"]], "credit": pc("tloans"), "menages": pc("thh"), "entreprises": pc("tbus"), "monnaie": pc("money"),
                   "dette_publique": round(100 * r[I["debtgdp"]], 1) if r[I["debtgdp"]] is not None else None})
credit = [c for c in credit if c["credit"] is not None or c["monnaie"] is not None]

# moyennes par période : croissance nominale et taux long
def moy(a, b, k):
    v = [s[k] for s in serie if a <= s["annee"] <= b and s[k] is not None]
    return round(sum(v) / len(v), 1) if v else None
periodes = [{"l": f"{a}-{b}", "a": a, "b": b, "nominal": moy(a, b, "nominal"), "reel": moy(a, b, "reel"), "taux": moy(a, b, "taux")}
            for a, b in ((1950, 1973), (1974, 1985), (1986, 2007), (2008, 2019), (2020, serie[-1]["annee"]))]

# agrégats monétaires de la zone euro (BCE, fin d'année, milliards d'euros) et PIB de la zone euro (Eurostat)
import csv
A = {}
with open(os.path.join(SRC, "monnaie", "ecb_agregats.csv"), encoding="utf-8") as fh:
    for r in csv.DictReader(fh):
        y, mo = r["TIME_PERIOD"].split("-")
        if mo == "12" and r["OBS_VALUE"]:
            A.setdefault(int(y), {})[r["BS_ITEM"]] = float(r["OBS_VALUE"]) / 1000
dp = json.load(open(os.path.join(SRC, "monnaie", "pib_zone_euro.json")))
invp = {i: y for y, i in dp["dimension"]["time"]["category"]["index"].items()}
pib_ea = {int(invp[int(k)]): v / 1000 for k, v in dp["value"].items()}
agregats = []
for y in sorted(A):
    a_ = A[y]
    if not all(k in a_ for k in ("L10", "M10", "M20", "M30")):
        continue
    row = {"annee": y, "billets": round(a_["L10"]), "depots_vue": round(a_["M10"] - a_["L10"]), "epargne_court": round(a_["M20"] - a_["M10"]), "titres": round(a_["M30"] - a_["M20"]),
           "m1": round(a_["M10"]), "m2": round(a_["M20"]), "m3": round(a_["M30"])}
    if y - 1 in A and "M30" in A[y - 1]:
        row["m3_croiss"] = round(100 * (a_["M30"] / A[y - 1]["M30"] - 1), 1)
    if y in pib_ea:
        row.update({"m1_pib": round(100 * a_["M10"] / pib_ea[y], 1), "m3_pib": round(100 * a_["M30"] / pib_ea[y], 1), "pib": round(pib_ea[y])})
    agregats.append(row)
dern = sorted(r["TIME_PERIOD"] for r in csv.DictReader(open(os.path.join(SRC, "monnaie", "ecb_agregats.csv"), encoding="utf-8")))[-1]

# rendements du capital en France (Jordà, Schularick, Taylor, Knoll, Kuvshinov, « The Rate of Return on Everything », Macrohistory Database) :
# rendements nominaux annuels (dividendes ou loyers compris) déflatés par les prix à la consommation
wb2 = openpyxl.load_workbook(os.path.join(SRC, "histoire", "jst_macrohistory.xlsx"), read_only=True, data_only=True)
rr = wb2[wb2.sheetnames[0]].iter_rows(values_only=True); hh = next(rr)
J = {k: hh.index(k) for k in ("year", "iso", "eq_tr", "housing_tr", "bond_tr", "bill_rate", "cpi", "gdp")}
fra = {r[J["year"]]: r for r in rr if r[J["iso"]] == "FRA"}
rend = []
for y in sorted(fra):
    r, p_ = fra[y], fra.get(y - 1)
    if not p_ or not r[J["cpi"]] or not p_[J["cpi"]]:
        continue
    infl = r[J["cpi"]] / p_[J["cpi"]] - 1
    reel = lambda k: None if r[J[k]] is None else round(100 * ((1 + r[J[k]]) / (1 + infl) - 1), 2)
    ng = round(100 * (r[J["gdp"]] / p_[J["gdp"]] - 1), 2) if r[J["gdp"]] and p_[J["gdp"]] else None
    rend.append({"annee": y, "actions": reel("eq_tr"), "logement": reel("housing_tr"), "obligations": reel("bond_tr"), "monetaire": reel("bill_rate"),
                 "inflation": round(100 * infl, 2), "pib_nominal": ng})
def moy_r(a, b, k):
    v = [x[k] for x in rend if a <= x["annee"] <= b and x[k] is not None]
    return round(sum(v) / len(v), 1) if v else None
periodes_r = [{"l": f"{a}-{b}", **{k: moy_r(a, b, k) for k in ("actions", "logement", "obligations", "monetaire", "inflation")}}
              for a, b in ((1900, 1949), (1950, 1979), (1980, 2007), (2008, 2020), (1950, 2020))]


# longue histoire (JST, France, depuis 1870) : monnaie au sens large en % du PIB, niveau des prix (1913 = 1)
wb3 = openpyxl.load_workbook(os.path.join(SRC, "histoire", "jst_macrohistory.xlsx"), read_only=True, data_only=True)
rows3 = wb3[wb3.sheetnames[0]].iter_rows(values_only=True)
h3 = next(rows3)
J = {k: h3.index(k) for k in ("year", "iso", "gdp", "money", "cpi")}
H = [r for r in rows3 if r[J["iso"]] == "FRA" and r[J["year"]] >= 1870]
c13 = next(r[J["cpi"]] for r in H if r[J["year"]] == 1913)
histoire = [{"annee": r[J["year"]], "monnaie": round(100 * r[J["money"]] / r[J["gdp"]], 1) if r[J["money"]] and r[J["gdp"]] else None,
             "prix": round(r[J["cpi"]] / c13, 4) if r[J["cpi"]] else None} for r in H]
histoire = [x for x in histoire if x["monnaie"] is not None or x["prix"] is not None]

# soldes TARGET entre banques centrales nationales (BCE, milliards d'euros, décembre de chaque année + dernier mois)
T = {}
with open(os.path.join(SRC, "monnaie", "ecb_target2.csv"), encoding="utf-8") as fh:
    for r in csv.DictReader(fh):
        if r["OBS_VALUE"]:
            T.setdefault(r["TIME_PERIOD"], {})[r["REF_AREA"]] = round(float(r["OBS_VALUE"]) / 1000)
mois = sorted(T)
target = [{"annee": int(m[:4]), **{k.lower(): v for k, v in T[m].items()}} for m in mois if m.endswith("-12") or m == mois[-1]]
# taux directeurs de la BCE (changements)
taux_bce = {}
with open(os.path.join(SRC, "monnaie", "ecb_taux.csv"), encoding="utf-8") as fh:
    for r in csv.DictReader(fh):
        if r["OBS_VALUE"]:
            taux_bce.setdefault("depot" if "DFR" in r["KEY"] else "refi", []).append([r["TIME_PERIOD"], float(r["OBS_VALUE"])])
out = {"target": target, "target_mois": mois[-1], "taux_bce": taux_bce, "histoire": histoire, "rendements": rend, "rendements_periodes": periodes_r, "agregats": agregats, "agregats_dernier_mois": dern, "serie": serie, "credit": credit, "periodes": periodes, "annee": serie[-1]["annee"], "annee_credit": credit[-1]["annee"]}
json.dump(out, open(os.path.join(HERE, "..", "data", "monnaie.json"), "w"), ensure_ascii=False, indent=1)
print(agregats[0], agregats[-1], dern, serie[0], serie[-1], credit[0], credit[-1], periodes, sep="\n")
