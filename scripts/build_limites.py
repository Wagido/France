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
# métaux : U.S. Geological Survey, Mineral Commodity Summaries 2026 (production minière 2025, réserves, ressources) — valeurs relevées dans
# data/sources/limites/usgs_mcs2026.txt ; même unité pour production et réserves (tonnes de métal contenu, sauf mention)
METAUX = [  # nom, production 2025, réserves, ressources identifiées (ou None), unité, usage, premier producteur et sa part
    ["Antimoine", 110e3, 2.0e6, None, "t", "Retardateurs de flamme, munitions, batteries au plomb", "Chine"],
    ["Zinc", 13e6, 240e6, 1.9e9, "t", "Acier galvanisé", "Chine"],
    ["Or", 3.3e3, 66e3, None, "t", "Bijoux, réserves des banques centrales, électronique", "Chine"],
    ["Plomb", 4.5e6, 95e6, 2e9, "t", "Batteries", "Chine"],
    ["Étain", 290e3, 6e6, None, "t", "Soudures de l'électronique", "Chine"],
    ["Argent", 26e3, 610e3, None, "t", "Panneaux solaires, électronique", "Mexique"],
    ["Nickel", 3.9e6, 140e6, 350e6, "t", "Acier inoxydable, batteries", "Indonésie (67 %)"],
    ["Cobalt", 310e3, 12e6, 25e6, "t", "Batteries", "Congo-Kinshasa (74 %)"],
    ["Cuivre", 23e6, 980e6, 1.5e9, "t", "Câbles, moteurs, réseaux électriques, éoliennes", "Chili (23 %)"],
    ["Fer (contenu en fer)", 1.6e9, 87e9, None, "t", "Acier", "Australie (38 %)"],
    ["Tungstène", 85e3, 4.7e6, None, "t", "Outils de coupe, armement", "Chine"],
    ["Molybdène", 260e3, 17e6, 25.4e6, "t", "Aciers spéciaux", "Chine"],
    ["Bauxite (aluminium)", 440e6, 29e9, 65e9, "t", "Aluminium", "Guinée et Australie"],
    ["Manganèse", 20e6, 1.8e9, None, "t", "Acier, batteries", "Afrique du Sud"],
    ["Potasse (K₂O)", 49e6, 5.9e9, None, "t", "Engrais", "Canada"],
    ["Lithium", 290e3, 37e6, 150e6, "t", "Batteries", "Australie (32 %)"],
    ["Graphite naturel", 1.8e6, 310e6, 800e6, "t", "Batteries (anode)", "Chine"],
    ["Terres rares (oxydes)", 390e3, 75e6, None, "t", "Aimants des éoliennes et des moteurs électriques", "Chine (69 %)"],
    ["Vanadium", 110e3, 21e6, 63e6, "t", "Aciers, batteries à flux", "Chine"],
    ["Phosphate (roche)", 250e6, 73e9, None, "t", "Engrais", "Chine (réserves : Maroc)"],
]
metaux = [{"l": m[0], "prod": m[1], "res": m[2], "ress": m[3], "usage": m[5], "prod1": m[6], "ans": round(m[2] / m[1]), "ans_ress": round(m[3] / m[1]) if m[3] else None} for m in METAUX]
metaux.sort(key=lambda x: x["ans"])
# recyclage : part du métal recyclé dans la consommation des États-Unis en 2025 (USGS, Mineral Commodity Summaries 2026, rubrique « Recycling »)
recyclage = [["Plomb", 70, "batteries au plomb, presque toutes recyclées"], ["Or", 60, "bijoux, électronique"], ["Nickel", 60, "surtout les déchets d'acier inoxydable"],
             ["Cuivre", 30, "dont l'essentiel vient des chutes de fabrication"], ["Molybdène", 30, "jusqu'à 30 %, dans les aciers et catalyseurs"],
             ["Aluminium", 28, "à partir des produits en fin de vie (canettes, voitures)"], ["Cobalt", 25, "alliages, batteries"], ["Étain", 22, "soudures, fer-blanc"],
             ["Argent", 11, "photographie, électronique"], ["Lithium", 0, "usines de recyclage de batteries en construction"],
             ["Terres rares", 0, "quantités limitées (aimants, lampes)"], ["Gallium", 0, "aucun recyclage des produits en fin de vie"]]
# scénario du Shift Project pour la France : demande d'énergie finale par secteur (Mtep), « L'évaluation énergie-climat du PTEF » (2022),
# tableaux des pages 20 (2020), 25 (2027) et 28 (2050) ; texte dans data/sources/limites/shift_ptef_evaluation_energie_climat_2022.txt
ptef = {"secteurs": [["transports", "Transports", "#1e293b"], ["residentiel", "Logement", "#f59e0b"], ["industrie", "Industrie", "#64748b"],
                     ["tertiaire", "Bureaux et services", "#a78bfa"], ["agri", "Agriculture et forêt", "#16a34a"], ["non_energ", "Usages non énergétiques (chimie, plastiques)", "#cbd5e1"]],
        "annees": [{"annee": 2020, "transports": 49, "residentiel": 37, "industrie": 31, "tertiaire": 22, "agri": 4.1, "non_energ": 13, "elec": 37},
                   {"annee": 2027, "transports": 37, "residentiel": 33, "industrie": 31, "tertiaire": 19, "agri": 4.1, "non_energ": 13, "elec": 38},
                   {"annee": 2050, "transports": 10, "residentiel": 21, "industrie": 22, "tertiaire": 12, "agri": 3.2, "non_energ": 9.0, "elec": 43}]}
out = {"ptef": ptef, "recyclage": [{"l": l, "v": v, "note": n} for l, v, n in recyclage], "metaux": metaux, "fossiles": fossiles, "pic_nrur": pic_nrur, "base": BASE, "scenarios": {k: v["l"] for k, v in W["scenarios"].items()}, "indicateurs": ind, "pics": pics}
json.dump(out, open(os.path.join(HERE, "..", "data", "limites.json"), "w"), ensure_ascii=False)
for i in ind:
    print(i["k"], i["ecart"], i["dernier"])
print(pics)
