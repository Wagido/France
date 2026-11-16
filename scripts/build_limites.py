#!/usr/bin/env python3
"""Construit data/limites.json : scénarios du modèle World3 (« Les limites à la croissance ») comparés aux données mondiales observées.
Les deux sont exprimés en indice, base 100 en 2000 (comme dans les comparaisons de Turner et Herrington, qui comparent les formes des courbes).
Sources : data/sources/limites/world3.json (scripts/run_world3.py), Banque mondiale (WDI), Our World in Data (CO₂, énergie).
Usage (depuis la racine) : python3 scripts/build_limites.py
"""
import csv, json, os

HERE = os.path.dirname(os.path.abspath(__file__))
D = os.path.join(HERE, "..", "data", "sources", "limites")
BASE = 2000

W = json.load(open(os.path.join(D, "world3.json")))


def wb(code):
    d = json.load(open(os.path.join(D, f"wb_{code}.json")))
    return {int(x["date"]): x["value"] for x in d[1] if x["value"] is not None}


def owid(f, col):
    out = {}
    for r in csv.DictReader(open(os.path.join(D, f))):
        if r.get(col):
            out[int(r["year"])] = float(r[col])
    return out


pop = wb("SP.POP.TOTL")
per_hab = lambda s: {y: v / pop[y] for y, v in s.items() if y in pop}
OBS = {
    "pop": (pop, "Population mondiale", "Banque mondiale"),
    "cbr": (wb("SP.DYN.CBRT.IN"), "Natalité (naissances pour 1 000 habitants)", "Banque mondiale"),
    "cdr": (wb("SP.DYN.CDRT.IN"), "Mortalité (décès pour 1 000 habitants)", "Banque mondiale"),
    "le": (wb("SP.DYN.LE00.IN"), "Espérance de vie", "Banque mondiale"),
    "fpc": (per_hab(wb("AG.PRD.FOOD.XD")), "Nourriture par habitant (indice de production alimentaire de la FAO / population)", "Banque mondiale, d'après la FAO"),
    "iopc": (per_hab(wb("NV.IND.TOTL.KD")), "Production industrielle par habitant (valeur ajoutée de l'industrie, en volume)", "Banque mondiale"),
    "sopc": (per_hab(wb("NV.SRV.TOTL.KD")), "Services par habitant (valeur ajoutée des services, en volume)", "Banque mondiale"),
    "ppolx": (owid("owid_co2_monde.csv", "cumulative_co2"), "Pollution persistante (approchée par le CO₂ émis cumulé)", "Our World in Data, d'après le Global Carbon Project"),
    "nrur": (owid("owid_energy_monde.csv", "fossil_fuel_consumption"), "Consommation de ressources non renouvelables (approchée par les énergies fossiles)", "Our World in Data, d'après l'Energy Institute"),
}
ind = []
for k, (s, l, src) in OBS.items():
    b = s.get(BASE)
    obs = [{"annee": y, "v": round(100 * v / b, 1), "brut": v} for y, v in sorted(s.items()) if y >= 1960] if b else []
    mods = {}
    for sk, sc in W["scenarios"].items():
        S = {r["annee"]: r[k] for r in sc["serie"]}
        mb = S[BASE]
        mods[sk] = [{"annee": y, "v": round(100 * S[y] / mb, 1)} for y in range(1960, 2101) if S.get(y) is not None]
    # écart entre observations récentes et chaque scénario (moyenne des écarts relatifs depuis 2000)
    ecarts = {}
    for sk, m in mods.items():
        mm = {r["annee"]: r["v"] for r in m}
        e = [abs(o["v"] - mm[o["annee"]]) / mm[o["annee"]] for o in obs if o["annee"] > BASE and o["annee"] in mm and mm[o["annee"]]]
        ecarts[sk] = round(100 * sum(e) / len(e), 1) if e else None
    ind.append({"k": k, "l": l, "src": src, "obs": [{"annee": o["annee"], "v": o["v"]} for o in obs], "modele": mods, "ecart": ecarts,
                "dernier": {"annee": obs[-1]["annee"], "brut": obs[-1]["brut"]} if obs else None})
pics = {}
for sk, sc in W["scenarios"].items():
    S = sc["serie"]
    pics[sk] = {v: max(S, key=lambda r: r[v] or 0)["annee"] for v in ("pop", "iopc", "fpc", "sopc", "ppolx")}
    pics[sk]["pop_max"] = round(max(r["pop"] for r in S) / 1e9, 1)
    pics[sk]["pop_2100"] = round(S[-1]["pop"] / 1e9, 1)
    pics[sk]["pop_2025"] = round(next(r["pop"] for r in S if r["annee"] == 2025) / 1e9, 2)
    pics[sk]["le_2025"] = round(next(r["le"] for r in S if r["annee"] == 2025), 1)
    pics[sk]["le_2050"] = round(next(r["le"] for r in S if r["annee"] == 2050), 1)
# production mondiale d'énergies fossiles (Our World in Data, d'après l'Energy Institute et Shift Data Portal), TWh
F = {k: owid("owid_energy_monde.csv", k + "_production") for k in ("oil", "gas", "coal")}
fossiles = [{"annee": y, "petrole": round(F["oil"].get(y, 0)), "gaz": round(F["gas"].get(y, 0)), "charbon": round(F["coal"].get(y, 0))} for y in sorted(F["oil"]) if y >= 1900]
pic_nrur = {sk: max(sc["serie"], key=lambda r: r["nrur"] or 0)["annee"] for sk, sc in W["scenarios"].items()}
out = {"fossiles": fossiles, "pic_nrur": pic_nrur, "base": BASE, "scenarios": {k: v["l"] for k, v in W["scenarios"].items()}, "indicateurs": ind, "pics": pics}
json.dump(out, open(os.path.join(HERE, "..", "data", "limites.json"), "w"), ensure_ascii=False)
for i in ind:
    print(i["k"], i["ecart"], i["dernier"])
print(pics)
