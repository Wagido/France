#!/usr/bin/env python3
"""Construit data/histoire.json : séries longues (depuis 1950) pour illustrer les dévaluations de 1958, 1969 et 1981-1983.

Source : INSEE, comptes nationaux annuels base 2020 (BDM) :
  PIB en volume (évolution) 011779995, PIB en volume 011779991, PIB en valeur 011779992,
  exportations en volume 011791812 et en valeur 011791813, importations en valeur 011792506 et en volume 011792505.
Usage (depuis la racine) : python3 scripts/build_histoire.py
"""
import json, os, re

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, "..", "data", "sources", "histoire", "bdm_histoire.xml")
OUT = os.path.join(HERE, "..", "data", "histoire.json")

t = open(SRC, encoding="utf-8").read()
S = {}
for m in re.finditer(r"<Series ([^>]*)>(.*?)</Series>", t, re.S):
    idb = re.search(r'IDBANK="([^"]+)"', m.group(1)).group(1)
    S[idb] = {int(y): float(v) for y, v in re.findall(r'TIME_PERIOD="(\d{4})"[^/]*OBS_VALUE="([^"]+)"', m.group(2))}

rows = []
for y in sorted(S["011779992"]):
    if y - 1 not in S["011779992"]:
        continue
    defl = lambda a: S["011779992"][a] / S["011779991"][a]
    rows.append({
        "annee": y,
        "croissance": round(S["011779995"].get(y), 1) if y in S["011779995"] else None,                 # PIB en volume, %
        "inflation": round(100 * (defl(y) / defl(y - 1) - 1), 1),                                          # prix du PIB, %
        "exportations": round(100 * (S["011791812"][y] / S["011791812"][y - 1] - 1), 1),                  # volume, %
        "solde_commercial": round(100 * (S["011791813"][y] - S["011792506"][y]) / S["011779992"][y], 2),  # % du PIB
    })
# ---------------------------------------------------------------- série longue 1900-aujourd'hui
# Jordà-Schularick-Taylor Macrohistory Database (1870-2017, via le dépôt public forex-centuries), prolongée par Eurostat et les comptes publics.
import openpyxl
D = os.path.join(HERE, "..", "data", "sources")
wb = openpyxl.load_workbook(os.path.join(D, "histoire", "jst_macrohistory.xlsx"), read_only=True, data_only=True)
it = wb.worksheets[0].iter_rows(values_only=True); h = next(it); ix = {c: i for i, c in enumerate(h)}
J = {r[ix["year"]]: r for r in it if r[ix["iso"]] == "FRA"}
def es(f):
    d = json.load(open(os.path.join(D, "histoire", f))); t = d["dimension"]["time"]["category"]["index"]; inv = {v: k for k, v in t.items()}
    return {int(inv[int(k) % len(t)]): v for k, v in d["value"].items()}
usd = es("ert_bil_eur_a.json"); hicp = es("prc_hicp_aind_fr.json")
fin = {int(x["annee"]): x for x in json.load(open(os.path.join(HERE, "..", "data", "finances.json")))["historique"]}
ins = {r["annee"]: r for r in rows}
longue = []
for y in range(1900, max(usd) + 1):
    j, jp = J.get(y), J.get(y - 1)
    g = lambda r, c: None if r is None else r[ix[c]]
    infl = (100 * (g(j, "cpi") / g(jp, "cpi") - 1)) if g(j, "cpi") and g(jp, "cpi") else hicp.get(y)
    if y > 2017: infl = hicp.get(y)
    solde = 100 * (g(j, "revenue") - g(j, "expenditure")) / g(j, "gdp") if g(j, "revenue") is not None and g(j, "expenditure") is not None and g(j, "gdp") else None
    if y >= 1995 and y in fin: solde = 100 * (fin[y]["recettes"] - fin[y]["depenses"]) / fin[y]["pib"]
    expo = 100 * g(j, "exports") / g(j, "gdp") if g(j, "exports") and g(j, "gdp") else None
    if y >= 1949 and y in ins: expo = None  # remplacé ci-dessous par l'INSEE
    if y in S["011791813"] and y >= 1949: expo = 100 * S["011791813"][y] / S["011779992"][y]
    dollar = g(j, "xrusd") if y < 1999 else 6.55957 / usd[y] if y in usd else None   # francs (nouveaux) pour un dollar
    croiss = 100 * (g(j, "rgdpmad") / g(jp, "rgdpmad") - 1) if g(j, "rgdpmad") and g(jp, "rgdpmad") else None
    if y in ins and ins[y]["croissance"] is not None and y >= 1950: croiss = ins[y]["croissance"]
    r1 = lambda v, n=1: None if v is None else round(v, n)
    longue.append({"annee": y, "inflation": r1(infl), "solde_public": r1(solde), "exportations_pib": r1(expo), "croissance": r1(croiss), "dollar": r1(dollar, 4)})
json.dump({"source": "INSEE, comptes nationaux annuels base 2020", "series": rows,
           "longue_source": "Jordà, Schularick et Taylor, Macrohistory Database (1900-2017) ; INSEE (exportations et croissance depuis 1949-1950) ; Eurostat (cours euro-dollar et inflation depuis 1999-2018) ; comptes publics (solde depuis 1995)",
           "longue": longue}, open(OUT, "w"), ensure_ascii=False, separators=(",", ":"))
for r in rows:
    if r["annee"] in (1957, 1958, 1959, 1960, 1968, 1969, 1970, 1981, 1982, 1983, 1984):
        print(r)
