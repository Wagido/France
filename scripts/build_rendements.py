#!/usr/bin/env python3
"""Construit data/rendements.json pour l'onglet « Peut-on être autonome en agriculture sans intrants ? ».
Sources : FAOSTAT (rendements des cultures, engrais minéraux, pesticides, bilans alimentaires),
repères historiques publiés (Académie d'agriculture, statistique agricole du XIXe siècle).
Usage (depuis la racine) : python3 scripts/build_rendements.py
"""
import csv, json, os

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, "..", "data", "sources")
AG = os.path.join(SRC, "agri")


def rows(f):
    with open(f, encoding="utf-8") as fh:
        yield from csv.DictReader(fh)


def serie(r):
    return {int(k[1:]): float(v) for k, v in r.items() if k.startswith("Y") and v not in ("", None)}


# 1. Rendements (FAOSTAT, kg/ha → quintaux/ha ; betterave et pomme de terre en tonnes/ha)
CULT = {"Wheat": ("ble", "Blé", 100), "Maize (corn)": ("mais", "Maïs grain", 100), "Barley": ("orge", "Orge", 100),
        "Rape or colza seed": ("colza", "Colza", 100), "Sunflower seed": ("tournesol", "Tournesol", 100),
        "Potatoes": ("pdt", "Pommes de terre", 1000), "Sugar beet": ("betterave", "Betterave sucrière", 1000)}
Y = {}
for r in rows(os.path.join(AG, "fao_rendements.csv")):
    if r["Element"] == "Yield" and r["Item"] in CULT:
        Y[(r["Area"], r["Item"])] = serie(r)
fr = {k: Y[("France", it)] for it, (k, l, d) in CULT.items()}
an = max(fr["ble"])
moy = lambda s, a, b: sum(s[y] for y in range(a, b + 1) if y in s) / max(1, sum(1 for y in range(a, b + 1) if y in s))
ble = [{"annee": y, "fr": round(v / 100, 1)} for y, v in sorted(fr["ble"].items())]
cultures = []
for it, (k, l, d) in CULT.items():
    s = fr[k]
    a, b = moy(s, 1961, 1965) / d, moy(s, an - 4, an) / d
    pic = max(s, key=lambda y: moy(s, y - 4, y) if y - 4 >= 1961 else 0)
    cultures.append({"serie": [{"annee": y, "v": round(v / d, 1)} for y, v in sorted(s.items())], "k": k, "l": l, "unite": "q/ha" if d == 100 else "t/ha", "debut": round(a, 1), "fin": round(b, 1), "x": round(b / a, 1),
                     "pic5": round(moy(s, pic - 4, pic) / d, 1), "pic5_an": pic})

# 2. Engrais minéraux (FAOSTAT) : kg par hectare de terres cultivées, production / importations d'azote
E = {}
for r in rows(os.path.join(AG, "fao_engrais_fr.csv")):
    E[(r["Item Code"], r["Element Code"])] = serie(r)
engr_an = sorted(E[("3102", "5159")])
engrais = [{"annee": y, "n": round(E[("3102", "5159")].get(y, 0), 1), "p": round(E[("3103", "5159")].get(y, 0), 1), "k": round(E[("3104", "5159")].get(y, 0), 1)} for y in engr_an]
ea = engr_an[-1]
autonomie_engrais = {code: {"nom": nom, "usage": round(E[(code, "5157")].get(ea, 0)), "production": round(E[(code, "5510")].get(ea, 0)),
                            "import": round(E[(code, "5610")].get(ea, 0)), "export": round(E[(code, "5910")].get(ea, 0))}
                     for code, nom in (("3102", "Azote (N)"), ("3103", "Phosphore (P₂O₅)"), ("3104", "Potasse (K₂O)"))}
pic_n = max(engrais, key=lambda d: d["n"])

# 3. Pesticides (FAOSTAT, tonnes de substances actives)
P = {}
for r in rows(os.path.join(AG, "fao_pesticides_fr.csv")):
    if r["Element Code"] in ("5157", "5159"):
        P[(r["Item Code"], r["Element Code"])] = serie(r)
pest = []
for y in sorted(P[("1357", "5157")]):
    g = lambda c: round(P.get((c, "5157"), {}).get(y) or 0)
    pest.append({"annee": y, "total": g("1357"), "herb": g("1320"), "fong": g("1331"), "insect": g("1309"), "inorg": g("1332") or None,
                 "kgha": round(P[("1357", "5159")].get(y, 0), 2)})

# 4. Autonomie : bilan des céréales (FAOSTAT, bilans alimentaires)
B = {}
for r in rows(os.path.join(SRC, "themes", "fao_fbs.csv")):
    if r["Area"] == "France" and r["Item"] in ("Cereals - Excluding Beer", "Pulses", "Vegetables", "Fruits - Excluding Wine", "Oilcrops", "Grand Total", "Animal Products", "Vegetal Products"):
        B[(r["Item"], r["Element"])] = serie(r)
ba = max(B[("Cereals - Excluding Beer", "Production")])
cer = {k: round(B[("Cereals - Excluding Beer", e)][ba]) for k, e in (("production", "Production"), ("import", "Import quantity"), ("export", "Export quantity"),
       ("interieur", "Domestic supply quantity"), ("animaux", "Feed"), ("alimentation", "Food"), ("semences", "Seed"), ("pertes", "Losses"),
       ("transformation", "Processing"), ("autres", "Other uses (non-food)"))}
cer["moy_prod"] = round(moy(B[("Cereals - Excluding Beer", "Production")], ba - 4, ba))
cer["moy_int"] = round(moy(B[("Cereals - Excluding Beer", "Domestic supply quantity")], ba - 4, ba))
cer["moy_animaux"] = round(moy(B[("Cereals - Excluding Beer", "Feed")], ba - 4, ba))
autres = []
for it, l in (("Pulses", "Légumes secs"), ("Oilcrops", "Oléagineux"), ("Vegetables", "Légumes"), ("Fruits - Excluding Wine", "Fruits")):
    p, d = moy(B[(it, "Production")], ba - 4, ba), moy(B[(it, "Domestic supply quantity")], ba - 4, ba)
    autres.append({"l": l, "taux": round(100 * p / d)})
kcal = {"total": round(B[("Grand Total", "Food supply (kcal/capita/day)")][ba]), "animal": round(B[("Animal Products", "Food supply (kcal/capita/day)")][ba])}

# 5. Repères historiques du rendement du blé (ordres de grandeur publiés, avant les séries FAO)
hist = [
    {"annee": 1830, "fr": 9, "lo": 8, "hi": 10, "src": "Académie d'agriculture : 8 à 10 q/ha avant 1850"},
    {"annee": 1860, "fr": 10, "src": "environ 10 q/ha vers 1860"},
    {"annee": 1886, "fr": 12.1, "src": "statistique 1881-1890 : 83,9 millions de quintaux sur 6,97 millions d'hectares"},
    {"annee": 1914, "fr": 14, "src": "environ 14 q/ha en 1914"},
    {"annee": 1935, "fr": 13, "lo": 12, "hi": 14, "src": "Académie d'agriculture : 12 à 14 q/ha avant 1945"},
    {"annee": 1953, "fr": 21.3, "src": "première année au-dessus de 20 q/ha : 21,3"},
]

out = {"annee": an, "ble": ble, "hist": hist, "cultures": cultures, "engrais": engrais, "engrais_an": ea, "pic_n": pic_n,
       "autonomie_engrais": autonomie_engrais, "pesticides": pest, "cereales": cer, "cereales_an": ba, "autres": autres, "kcal": kcal}
json.dump(out, open(os.path.join(HERE, "..", "data", "rendements.json"), "w"), ensure_ascii=False, indent=1)
print(an, [{k: v for k, v in c.items() if k != 'serie'} for c in cultures], engrais[-1], pic_n, autonomie_engrais, pest[-1], cer, autres, kcal, sep="\n")
