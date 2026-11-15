#!/usr/bin/env python3
"""Construit data/repartition.json : du PIB à ce que dépense le public et à ce qui reste au privé.

Eurostat, comptes des administrations publiques (gov_10a_main, secteur S13) et PIB (nama_10_gdp).
- Prélèvements obligatoires : impôts sur la production et les importations (D2), impôts sur le revenu et le patrimoine (D5),
  cotisations sociales (D61), impôts en capital (D91).
- Autres recettes publiques : ventes de services, revenus de la propriété, transferts reçus (le reste des recettes, TR).
- Dépenses publiques (TE) : prestations sociales en espèces (D62), subventions (D3), intérêts (D41), autres transferts (D7, D9),
  services publics (rémunération des agents D1, consommations intermédiaires P2, prestations en nature achetées D632, divers),
  investissement (P5).
Usage (depuis la racine) : python3 scripts/build_repartition.py
"""
import json, os

HERE = os.path.dirname(os.path.abspath(__file__))
exec(open(os.path.join(HERE, "build.py")).read().split("# ---------------------------------------------------------------- sources")[0])
S = os.path.join(HERE, "..", "data", "sources")
g = getter(jstat("gov_10a_main.json", S))
p = getter(jstat("nama_10_gdp.json", S))
md = lambda v: round((v or 0) / 1000, 1)

# même année que l'onglet « L'argent public » (dernière année des dépenses par fonction), sinon la dernière disponible
try:
    an_max = max(int(y) for y in json.load(open(os.path.join(HERE, "..", "data", "finances.json")))["sankey"])
except (OSError, KeyError, ValueError):
    an_max = 2030
an = None
for y in range(an_max, 2000, -1):
    if all(g(sector="S13", na_item=i, time=y) is not None for i in ["TR", "TE", "D2REC", "D5REC", "D61REC", "D62PAY", "D1PAY", "P2", "P5", "D3PAY", "D41PAY", "D632PAY"]):
        an = y
        break
G = lambda i: g(sector="S13", na_item=i, time=an) or 0
# totaux repris de l'onglet « L'argent public » pour que les chiffres soient identiques d'un onglet à l'autre
try:
    sk = json.load(open(os.path.join(HERE, "..", "data", "finances.json")))["sankey"][str(an)]
    TOT = {"TE": sk["depenses"] * 1000, "TR": sk["recettes"] * 1000}
except (OSError, KeyError):
    TOT = {}
G0 = G
G = lambda i: TOT.get(i, G0(i))
pib = p(na_item="B1GQ", time=an)
po = G("D2REC") + G("D5REC") + G("D61REC") + G("D91REC")
autres_rec = G("TR") - po
emprunt = G("TE") - G("TR")
dep = {
    "prestations": G("D62PAY"),
    "aides": G("D3PAY"),
    "interets": G("D41PAY"),
    "transferts": G("D7PAY") + G("D9PAY"),
    "investissement": G("P5"),
}
dep["services"] = G("TE") - sum(dep.values())     # agents, achats, prestations en nature, divers
prelev = {"tva": G("D2REC"), "revenus": G("D5REC") + G("D91REC"), "cotisations": G("D61REC")}
out = {"annee": an, "pib": md(pib), "prelevements": {k: md(v) for k, v in prelev.items()}, "po": md(po), "autres_recettes": md(autres_rec),
       "emprunt": md(emprunt), "depenses": {k: md(v) for k, v in dep.items()}, "te": md(G("TE")), "tr": md(G("TR")),
       "detail_services": {"agents": md(G("D1PAY")), "achats": md(G("P2")), "nature": md(G("D632PAY"))}}
json.dump(out, open(os.path.join(HERE, "..", "data", "repartition.json"), "w"), ensure_ascii=False, indent=1)
print(json.dumps(out, ensure_ascii=False))
