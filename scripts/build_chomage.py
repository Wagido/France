#!/usr/bin/env python3
"""Construit data/chomage.json : les différentes façons de compter le chômage en France.

- INSEE, enquête Emploi (sens du BIT) : chômeurs, halo autour du chômage, sous-emploi, chômage de longue durée ;
- DARES / France Travail : demandeurs d'emploi inscrits par catégorie (A, B, C, D, E) ;
- Eurostat (lfsi_sla_a) : « chômage élargi » (labour market slack) pour comparer les pays.
Usage (depuis la racine) : python3 scripts/build_chomage.py
"""
import json, os, re

HERE = os.path.dirname(os.path.abspath(__file__))
exec(open(os.path.join(HERE, "build.py")).read().split("# ---------------------------------------------------------------- sources")[0])
SRC = os.path.join(HERE, "..", "data", "sources", "chomage")
OUT = os.path.join(HERE, "..", "data", "chomage.json")
PAYS = json.load(open(os.path.join(HERE, "..", "data", "themes", "index.json")))["pays"]

t = open(os.path.join(SRC, "bdm_chomage.xml"), encoding="utf-8").read()
B = {}
for m in re.finditer(r"<Series ([^>]*)>(.*?)</Series>", t, re.S):
    a = dict(re.findall(r'(\w+)="([^"]*)"', m.group(1)))
    obs = [dict(re.findall(r'(\w+)="([^"]*)"', o)) for o in re.findall(r"<Obs ([^>]*)/>", m.group(2))]
    B[a["IDBANK"]] = {o["TIME_PERIOD"]: float(o["OBS_VALUE"]) for o in obs if o.get("OBS_VALUE") not in (None, "", "NaN")}

g = lambda i, q: B.get(i, {}).get(q)
# INSEE, sens du BIT, France entière, en milliers (CVS)
bit = []
for q in sorted(B["011818543"]):
    bit.append({"t": q, "taux": g("011818543", q), "chomeurs": g("011818555", q), "halo": g("011818564", q), "sous_emploi": g("011818739", q),
                "longue_duree": g("011818577", q), "taux_ld": g("011818581", q)})
# France Travail (DARES), moyenne trimestrielle CVS-CJO : A et ABC France hors Mayotte (en personnes) ;
# D + E par différence (A à E) - (A, B, C), disponible pour la France métropolitaine seulement ; partage B / C selon les séries brutes
ft = []
for q in sorted(B["010597456"]):
    A, ABC = g("010597456", q), g("010597571", q)
    if A is None or ABC is None:
        continue
    A, ABC = A / 1000, ABC / 1000
    de = (g("010598489", q) - g("010598455", q)) if g("010598489", q) and g("010598455", q) else None
    b, c = g("010598404", q), g("010598417", q)
    sb = b / (b + c) if b and c else 0.35
    ft.append({"t": q, "A": round(A, 1), "B": round((ABC - A) * sb, 1), "C": round((ABC - A) * (1 - sb), 1), "DE": round(de, 1) if de else None})

# Eurostat : chômage élargi, en % de la population active élargie
e = getter(jstat("lfsi_sla_a.json", SRC))
d = jstat("lfsi_sla_a.json", SRC)
yrs = sorted({dict(k)["time"] for k in d if k != "__single__"})
COMP = ["UNE", "UEMP_PT", "NSEEK_AVL", "SEEK_NAVL"]
pays = []
for p in PAYS:
    y = next((y for y in reversed(yrs) if e(geo=p["code"], wstatus="SLACK", unit="PC_ELF", time=y) is not None), None)
    if not y:
        continue
    pays.append({"code": p["code"], "nom": p["nom"], "annee": y, "slack": e(geo=p["code"], wstatus="SLACK", unit="PC_ELF", time=y),
                 **{c: e(geo=p["code"], wstatus=c, unit="PC_ELF", time=y) for c in COMP}})
fr = [{"annee": y, **{c: e(geo="FR", wstatus=c, unit="PC_ELF", time=y) for c in COMP + ["SLACK"]},
       **{c + "_k": e(geo="FR", wstatus=c, unit="THS_PER", time=y) for c in COMP + ["SLACK"]}} for y in yrs if e(geo="FR", wstatus="SLACK", unit="PC_ELF", time=y) is not None]

json.dump({"bit": bit, "france_travail": ft, "elargi_pays": pays, "elargi_fr": fr}, open(OUT, "w"), ensure_ascii=False, separators=(",", ":"))
l, f = bit[-1], ft[-1]
print("BIT", l, "\nFT", f, "\nslack FR", fr[-1]["annee"], fr[-1]["SLACK"], len(pays), "pays")
