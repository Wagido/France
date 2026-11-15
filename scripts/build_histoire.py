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
json.dump({"source": "INSEE, comptes nationaux annuels base 2020", "series": rows}, open(OUT, "w"), ensure_ascii=False, separators=(",", ":"))
for r in rows:
    if r["annee"] in (1957, 1958, 1959, 1960, 1968, 1969, 1970, 1981, 1982, 1983, 1984):
        print(r)
