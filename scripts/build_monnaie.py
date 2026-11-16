#!/usr/bin/env python3
"""Construit data/monnaie.json pour l'article « La monnaie et la dette obligent-elles à croître ? ».
Sources :
  INSEE, comptes nationaux base 2020 : PIB en valeur (011779992) et en volume (011779991) → croissance nominale et réelle ;
  Eurostat irt_lt_mcby_a : taux d'intérêt à long terme de l'État (critère de Maastricht), France, complété avant 1970 par la Macrohistory Database ;
  Jordà, Schularick et Taylor, Macrohistory Database : crédits bancaires au secteur privé, monnaie au sens large, PIB nominal.
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

out = {"serie": serie, "credit": credit, "periodes": periodes, "annee": serie[-1]["annee"], "annee_credit": credit[-1]["annee"]}
json.dump(out, open(os.path.join(HERE, "..", "data", "monnaie.json"), "w"), ensure_ascii=False, indent=1)
print(serie[0], serie[-1], credit[0], credit[-1], periodes, sep="\n")
