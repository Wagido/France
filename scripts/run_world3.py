#!/usr/bin/env python3
"""Calcule les scénarios du modèle World3 (Meadows et al.) avec pyworld3 et les enregistre dans data/sources/limites/world3.json.
À lancer une fois (les résultats du modèle ne changent pas) : pip install pyworld3 ; python3 scripts/run_world3.py
pyworld3 reproduit la version de 1974 du modèle (« Dynamics of Growth in a Finite World »), pas la version World3-03 de 2004.
"""
import json, os
import numpy as np
from pyworld3 import World3

HERE = os.path.dirname(os.path.abspath(__file__))
VARS = {"pop": "Population", "cbr": "Natalité", "cdr": "Mortalité", "le": "Espérance de vie", "iopc": "Production industrielle par habitant",
        "sopc": "Services par habitant", "fpc": "Nourriture par habitant", "ppolx": "Pollution persistante", "nrfr": "Ressources non renouvelables restantes",
        "nrur": "Consommation de ressources non renouvelables"}


def run(pyear=1975, **k):
    w = World3(year_min=1900, year_max=2100, dt=0.5, pyear=pyear)
    w.init_world3_constants(**k); w.init_world3_variables(); w.set_world3_table_functions(); w.set_world3_delay_functions()
    w.run_world3(fast=False)
    out = []
    for y in range(1900, 2101):
        i = int(round((y - 1900) / 0.5))
        r = {"annee": y}
        for v in VARS:
            x = float(getattr(w, v)[i])
            r[v] = None if np.isnan(x) else round(x, 6 if v == "nrfr" else 3)
        out.append(r)
    return out


SCEN = {
    "bau": ("Scénario de référence (1972)", {}, 1975),
    "bau2": ("Ressources doublées", {"nri": 2e12}, 1975),
}
res = {"variables": VARS, "scenarios": {k: {"l": l, "serie": run(py, **p)} for k, (l, p, py) in SCEN.items()}}
os.makedirs(os.path.join(HERE, "..", "data", "sources", "limites"), exist_ok=True)
json.dump(res, open(os.path.join(HERE, "..", "data", "sources", "limites", "world3.json"), "w"), ensure_ascii=False)
for k, s in res["scenarios"].items():
    S = s["serie"]
    pk = lambda v: max(S, key=lambda r: r[v] or 0)
    print(k, {v: (pk(v)["annee"], pk(v)[v]) for v in ("pop", "iopc", "fpc", "sopc", "ppolx")}, "pop2100", S[-1]["pop"])
