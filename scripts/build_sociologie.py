#!/usr/bin/env python3
"""Construit data/sociologie.json : sociologie électorale des législatives 2024 et de la présidentielle 2022 (premier tour).
Les valeurs sont retranscrites des rapports Ipsos « Sociologie des électorats et profil des abstentionnistes »
(texte extrait par pdftotext -layout dans data/sources/sociologie/) ; la participation par âge de l'Insee vient de data/sources/retraites/ip1928.xlsx.
Usage (depuis la racine) : python3 scripts/build_sociologie.py
"""
import json, os
import openpyxl

HERE = os.path.dirname(os.path.abspath(__file__))
R = os.path.join(HERE, "..")

# ---------------------------------------------------------------- législatives 2024, 1er tour (Ipsos-Talan, 10 286 inscrits, 27-28 juin 2024)
# colonnes : Nouveau Front populaire, Ensemble, LR ou divers droite, RN et alliés, autres
L24 = {
    "age": [["18-24 ans", 48, 9, 4, 33, 6], ["25-34 ans", 38, 13, 8, 32, 9], ["35-49 ans", 31, 17, 9, 36, 7], ["50-59 ans", 25, 18, 10, 40, 7],
            ["60-69 ans", 24, 21, 11, 35, 9], ["70 ans et plus", 18, 32, 14, 29, 7]],
    "sexe": [["Hommes", 27, 19, 10, 36, 8], ["Femmes", 29, 21, 11, 32, 7]],
    "profession": [["Cadres", 34, 26, 11, 21, 8], ["Professions intermédiaires", 35, 18, 8, 31, 8], ["Employés", 30, 12, 8, 44, 6], ["Ouvriers", 21, 7, 6, 57, 9],
                   ["Retraités", 20, 29, 13, 31, 7], ["dont anciens cadres et professions intermédiaires", 21, 32, 15, 25, 7], ["dont anciens employés et ouvriers", 18, 26, 12, 36, 8]],
    "statut": [["Salariés du privé", 27, 17, 9, 40, 7], ["Salariés du public", 35, 16, 8, 33, 8], ["À son compte", 32, 21, 10, 28, 9], ["Au chômage", 37, 7, 5, 40, 11]],
    "diplome": [["Inférieur au bac", 17, 17, 10, 49, 7], ["Baccalauréat", 26, 19, 8, 38, 9], ["Bac +2", 28, 22, 11, 32, 7], ["Bac +3 et plus", 37, 22, 12, 22, 7]],
    "revenus": [["Moins de 1 250 € par mois", 35, 12, 8, 38, 7], ["1 250 à 2 000 €", 33, 15, 7, 36, 9], ["2 000 à 3 000 €", 26, 22, 9, 35, 8], ["Plus de 3 000 €", 26, 23, 12, 32, 7]],
    "milieu": [["Défavorisés", 29, 6, 5, 54, 6], ["Catégories populaires", 35, 12, 7, 38, 8], ["Classes moyennes inférieures", 26, 20, 10, 36, 8],
               ["Classes moyennes supérieures", 27, 28, 14, 25, 6], ["Milieux aisés ou privilégiés", 28, 27, 18, 21, 6]],
    "finances": [["Met beaucoup d'argent de côté", 27, 30, 18, 17, 8], ["Met un peu d'argent de côté", 28, 25, 12, 27, 8], ["Boucle juste son budget", 28, 15, 9, 41, 7],
                 ["Vit sur ses économies ou à crédit", 29, 10, 7, 46, 8]],
    "agglo": [["Moins de 2 000 habitants", 23, 19, 10, 40, 8], ["2 000 à 9 999 habitants", 25, 19, 10, 39, 7], ["10 000 à 49 999 habitants", 26, 23, 10, 36, 5],
              ["50 000 à 199 999 habitants", 25, 20, 13, 34, 8], ["200 000 habitants et plus", 33, 21, 10, 28, 8]],
    "religion": [["Catholiques pratiquants réguliers", 13, 21, 20, 37, 9], ["Catholiques pratiquants occasionnels", 14, 22, 16, 40, 8], ["Catholiques non pratiquants", 18, 23, 11, 41, 7],
                 ["Autre religion", 34, 11, 5, 39, 11], ["Sans religion", 39, 18, 7, 28, 8]],
    "satisfaction": [["Très satisfait de sa vie", 32, 30, 14, 15, 9], ["Plutôt satisfait", 28, 25, 11, 28, 8], ["Plutôt pas satisfait", 29, 10, 8, 47, 6], ["Pas du tout satisfait", 23, 4, 4, 61, 8]],
}
L24_ENS = [28.1, 20.3, 10.2, 34, 7.4]
L24_VOTANTS = {  # part de votants (le reste s'est abstenu)
    "age": [["18-24 ans", 57], ["25-34 ans", 51], ["35-49 ans", 61], ["50-59 ans", 66], ["60-69 ans", 74], ["70 ans et plus", 80]],
    "profession": [["Cadres", 65], ["Professions intermédiaires", 62], ["Employés", 58], ["Ouvriers", 54], ["Retraités", 79]],
    "revenus": [["Moins de 1 250 €", 57], ["1 250 à 2 000 €", 62], ["2 000 à 3 000 €", 67], ["Plus de 3 000 €", 69]],
    "diplome": [["Inférieur au bac", 67], ["Baccalauréat", 66], ["Bac +2", 63], ["Bac +3 et plus", 67]],
}

# ---------------------------------------------------------------- présidentielle 2022, 1er tour (Ipsos-Sopra Steria, 4 000 inscrits, 6-9 avril 2022)
# colonnes : Poutou + Arthaud, Mélenchon, Roussel, Jadot, Hidalgo, Macron, Pécresse, Lassalle, Dupont-Aignan, Le Pen, Zemmour
P22 = {
    "age": [["18-24 ans", 1, 34, 2, 6, 1, 20, 2, 1, 0, 25, 8], ["25-34 ans", 3, 36, 0, 4, 1, 22, 3, 2, 0, 24, 5], ["35-49 ans", 3, 24, 3, 5, 2, 24, 2, 4, 2, 27, 4],
            ["50-59 ans", 0, 24, 2, 4, 1, 23, 3, 4, 2, 30, 7], ["60-69 ans", 1, 18, 3, 5, 2, 30, 4, 4, 2, 22, 9], ["70 ans et plus", 1, 9, 2, 4, 3, 41, 12, 2, 3, 13, 10]],
    "sexe": [["Hommes", 1, 22, 2, 4, 1, 27, 5, 4, 2, 23, 9], ["Femmes", 2, 22, 3, 5, 2, 29, 4, 3, 2, 23, 5]],
    "profession": [["Cadres", 1, 27, 1, 6, 3, 34, 6, 4, 2, 11, 5], ["Professions intermédiaires", 0, 27, 4, 5, 2, 27, 3, 4, 1, 24, 3], ["Employés", 2, 27, 1, 4, 2, 17, 2, 2, 2, 35, 6],
                   ["Ouvriers", 2, 25, 2, 2, 0, 17, 2, 3, 3, 35, 9], ["Retraités", 1, 13, 3, 4, 2, 37, 9, 3, 3, 17, 8]],
    "statut": [["Salariés du privé", 1, 25, 2, 3, 1, 26, 4, 3, 2, 27, 6], ["Salariés du public", 1, 27, 3, 7, 2, 22, 2, 4, 1, 27, 4], ["À son compte", 2, 27, 0, 8, 0, 26, 2, 4, 3, 18, 10],
               ["Au chômage", 2, 37, 1, 2, 2, 12, 1, 3, 5, 28, 7]],
    "diplome": [["Inférieur au bac", 2, 16, 2, 4, 1, 23, 5, 3, 3, 34, 7], ["Baccalauréat", 0, 24, 3, 3, 1, 25, 4, 4, 2, 26, 8], ["Bac +2", 0, 18, 2, 5, 2, 31, 6, 4, 1, 23, 8],
                ["Bac +3 et plus", 2, 28, 2, 7, 2, 32, 5, 3, 2, 12, 5]],
    "revenus": [["Moins de 1 250 € par mois", 1, 30, 1, 5, 1, 13, 2, 2, 4, 31, 10], ["1 250 à 2 000 €", 2, 27, 3, 5, 1, 23, 3, 3, 1, 25, 7], ["2 000 à 3 000 €", 0, 20, 3, 5, 1, 26, 5, 3, 3, 27, 7],
                ["Plus de 3 000 €", 1, 19, 2, 4, 2, 34, 6, 4, 2, 19, 7]],
    "milieu": [["Défavorisés", 3, 29, 0, 1, 1, 12, 1, 4, 1, 37, 11], ["Catégories populaires", 3, 31, 4, 3, 1, 15, 3, 1, 4, 29, 6], ["Classes moyennes inférieures", 0, 21, 2, 5, 2, 27, 5, 4, 2, 25, 7],
               ["Classes moyennes supérieures", 1, 18, 2, 6, 2, 38, 6, 3, 2, 15, 7], ["Milieux aisés ou privilégiés", 0, 10, 0, 1, 4, 52, 10, 2, 0, 8, 13]],
    "agglo": [["Moins de 2 000 habitants", 3, 22, 2, 4, 2, 25, 3, 4, 3, 26, 6], ["2 000 à 9 999 habitants", 1, 20, 3, 5, 1, 22, 2, 6, 3, 28, 9], ["10 000 à 49 999 habitants", 1, 19, 2, 4, 2, 31, 7, 4, 1, 23, 6],
              ["50 000 à 199 999 habitants", 0, 18, 2, 5, 2, 35, 6, 1, 2, 24, 5], ["200 000 habitants et plus", 1, 25, 2, 5, 1, 29, 5, 3, 2, 19, 8]],
    "religion": [["Catholiques pratiquants réguliers", 1, 6, 2, 4, 2, 34, 14, 3, 6, 9, 19], ["Catholiques pratiquants occasionnels", 0, 15, 2, 6, 0, 30, 9, 3, 3, 19, 13],
                 ["Catholiques non pratiquants", 1, 11, 2, 4, 1, 31, 6, 4, 2, 30, 8], ["Autre religion", 1, 38, 1, 6, 2, 22, 7, 2, 5, 12, 4], ["Sans religion", 2, 32, 3, 5, 2, 24, 2, 3, 1, 21, 5]],
    "satisfaction": [["Très satisfait de sa vie", 3, 13, 1, 5, 3, 42, 1, 2, 1, 21, 8], ["Plutôt satisfait", 0, 20, 2, 6, 2, 37, 5, 3, 1, 18, 6], ["Plutôt pas satisfait", 1, 39, 2, 2, 2, 6, 0, 3, 2, 30, 13],
                     ["Pas du tout satisfait", 0, 13, 0, 1, 1, 4, 2, 8, 4, 45, 22]],
}
P22_ENS = [1.4, 22, 2.3, 4.6, 1.8, 27.8, 4.8, 3.1, 2.1, 23.2, 7.1]
P22_VOTANTS = {
    "age": [["18-24 ans", 58], ["25-34 ans", 54], ["35-49 ans", 77], ["50-59 ans", 80], ["60-69 ans", 88], ["70 ans et plus", 76]],
    "profession": [["Cadres", 74], ["Professions intermédiaires", 73], ["Employés", 73], ["Ouvriers", 66], ["Retraités", 81]],
    "revenus": [["Moins de 1 250 €", 66], ["1 250 à 2 000 €", 71], ["2 000 à 3 000 €", 75], ["Plus de 3 000 €", 77]],
    "diplome": [["Inférieur au bac", 76], ["Baccalauréat", 72], ["Bac +2", 74], ["Bac +3 et plus", 73]],
}
CAND = ["Poutou, Arthaud", "Mélenchon", "Roussel", "Jadot", "Hidalgo", "Macron", "Pécresse", "Lassalle", "Dupont-Aignan", "Le Pen", "Zemmour"]
BLOCS = [["gauche", "Gauche et écologistes", "#e11d48", [0, 1, 2, 3, 4]], ["macron", "Emmanuel Macron", "#f59e0b", [5]], ["droite", "Pécresse, Lassalle, Dupont-Aignan", "#2563eb", [6, 7, 8]],
         ["rn", "Marine Le Pen", "#1e3a8a", [9]], ["zem", "Éric Zemmour", "#7c3aed", [10]]]

# ---------------------------------------------------------------- participation par âge (Insee, enquête sur la participation électorale 2022)
wb = openpyxl.load_workbook(os.path.join(R, "data", "sources", "retraites", "ip1928.xlsx"), data_only=True)
insee = []
for r in wb["Figure 2"].iter_rows(values_only=True):
    if r and isinstance(r[0], str) and "ans" in r[0] and isinstance(r[1], (int, float)):
        insee.append({"l": r[0], "systematique": r[1], "intermittent": r[2], "abstention": r[3]})

LIB = {"age": "Âge", "sexe": "Sexe", "profession": "Profession", "statut": "Statut d'emploi", "diplome": "Diplôme", "revenus": "Revenus du foyer",
       "milieu": "Milieu social (déclaré)", "finances": "Situation financière", "agglo": "Taille de la commune", "religion": "Religion", "satisfaction": "Satisfaction à l'égard de sa vie"}
rows = lambda T: {k: [{"l": x[0], "v": x[1:]} for x in v] for k, v in T.items()}
blocs = lambda v: [round(sum(v[i] for i in b[3]), 1) for b in BLOCS]
out = {
    "criteres": LIB,
    "legislatives2024": {"titre": "Législatives 2024, 1er tour", "camps": [["nfp", "Nouveau Front populaire", "#e11d48"], ["ens", "Ensemble (camp présidentiel)", "#f59e0b"],
                         ["lr", "LR et divers droite", "#2563eb"], ["rn", "RN et alliés", "#1e3a8a"], ["aut", "Autres", "#cbd5e1"]],
                         "ensemble": L24_ENS, "tables": rows(L24), "votants": L24_VOTANTS, "participation": 65.8,
                         "source": "Ipsos-Talan pour France Télévisions, Radio France et Public Sénat, 10 286 inscrits interrogés par internet les 27 et 28 juin 2024"},
    "presidentielle2022": {"titre": "Présidentielle 2022, 1er tour", "camps": [b[:3] for b in BLOCS], "candidats": CAND, "ensemble": blocs(P22_ENS),
                           "tables": {k: [{"l": x[0], "v": blocs(x[1:]), "cand": x[1:]} for x in v] for k, v in P22.items()}, "votants": P22_VOTANTS, "participation": 73.7,
                           "source": "Ipsos-Sopra Steria, 4 000 inscrits interrogés par internet du 6 au 9 avril 2022"},
    "insee_age": insee,
}
# ---------------------------------------------------------------- reports de voix, moment du choix, satisfaction (Ipsos 2024)
out["legislatives2024"]["tables_plus"] = {
    "pres2022": [{"l": l, "v": v} for l, *v in [["Mélenchon", 77, 3, 3, 9, 8], ["Roussel", 66, 7, 9, 6, 12], ["Jadot", 61, 19, 7, 2, 11], ["Hidalgo", 75, 10, 4, 3, 8],
                 ["Macron", 14, 56, 15, 8, 7], ["Pécresse", 2, 24, 48, 21, 5], ["Le Pen", 2, 2, 4, 89, 3], ["Zemmour", 0, 4, 9, 79, 8], ["Dupont-Aignan", 4, 5, 15, 61, 15], ["Lassalle", 12, 21, 14, 37, 16]]],
    "moment": [{"l": l, "v": v} for l, *v in [["Décidé depuis plusieurs semaines", 30, 18, 6, 41, 5], ["Décidé ces derniers jours", 27, 26, 18, 18, 11], ["Au dernier moment", 18, 23, 20, 21, 18]]],
    "macron": [{"l": l, "v": v} for l, *v in [["Très satisfait d'Emmanuel Macron", 10, 50, 17, 11, 12], ["Plutôt satisfait", 13, 56, 15, 9, 7], ["Plutôt pas satisfait", 36, 18, 12, 27, 7], ["Pas du tout satisfait", 32, 2, 6, 53, 7]]],
}
LIB.update({"pres2022": "Vote à la présidentielle 2022 (reports de voix)", "moment": "Moment du choix", "macron": "Satisfaction à l'égard d'Emmanuel Macron"})

# ---------------------------------------------------------------- résultats officiels 2024 (ministère de l'Intérieur, data.gouv.fr)
import csv
BLOC = {**{k: "gauche" for k in ("EXG", "COM", "FI", "SOC", "RDG", "VEC", "DVG", "UG")}, **{k: "centre" for k in ("ENS", "HOR", "DVC", "UDI")},
        **{k: "droite" for k in ("LR", "DVD", "DSV")}, **{k: "extd" for k in ("RN", "UXD", "REC", "EXD")}, **{k: "autres" for k in ("ECO", "REG", "DIV")}}
BLOCS_OFF = [["gauche", "Gauche (Nouveau Front populaire et divers gauche)", "#e11d48"], ["centre", "Centre (Ensemble et divers centre)", "#f59e0b"],
             ["droite", "Droite (LR et divers droite)", "#2563eb"], ["extd", "Extrême droite (RN, alliés, Reconquête)", "#1e3a8a"], ["autres", "Autres", "#cbd5e1"]]
num = lambda x: float(x.replace(",", ".").replace("%", "") or 0)
def lire(f):
    r = list(csv.reader(open(os.path.join(R, "data", "sources", "sociologie", f), encoding="utf-8"), delimiter=";"))
    return r[0], r[1:]
def candidats(h, row):
    out = []
    for i, c in enumerate(h):
        if c.startswith("Nuance candidat") and row[i]:
            n = c.split()[-1]; g = lambda nom: row[h.index(f"{nom} {n}")] if f"{nom} {n}" in h else ""
            out.append({"nu": row[i], "bloc": BLOC.get(row[i], "autres"), "voix": num(g("Voix")), "sexe": g("Sexe candidat"), "elu": g("Elu").lower().startswith("élu") or g("Elu").lower() == "oui" or g("Elu").upper() == "ELU"})
    return out
# départements, 1er tour
h, rows_ = lire("legislatives2024_t1_departements.csv")
deps = []
for row in rows_:
    code = row[0].zfill(2) if row[0].isdigit() else row[0]
    voix = {b[0]: 0 for b in BLOCS_OFF}
    for i, c in enumerate(h):
        if c.startswith("Nuance candidat") and row[i]:
            voix[BLOC.get(row[i], "autres")] += num(row[i + 1])
    ex = sum(voix.values())
    deps.append({"code": code, "nom": row[1], "participation": num(row[4]), **{k: round(100 * v / ex, 1) for k, v in voix.items()}})
# sièges et sexe des élus : élus au 1er tour + élus au 2nd tour
h1, c1 = lire("legislatives2024_t1_circonscriptions.csv"); h2, c2 = lire("legislatives2024_t2_circonscriptions.csv")
elus, cand_t1, config = [], [], {}
for row in c1:
    cs = candidats(h1, row); cand_t1 += cs; elus += [c for c in cs if c["elu"]]
for row in c2:
    cs = candidats(h2, row); elus += [c for c in cs if c["elu"]]
    config[len(cs)] = config.get(len(cs), 0) + 1
voix_t1 = {b[0]: sum(c["voix"] for c in cand_t1 if c["bloc"] == b[0]) for b in BLOCS_OFF}
tv = sum(voix_t1.values())
sieges = [{"k": b[0], "l": b[1], "c": b[2], "voix_t1": round(100 * voix_t1[b[0]] / tv, 1), "sieges": sum(1 for e in elus if e["bloc"] == b[0]),
           "femmes_elues": round(100 * sum(1 for e in elus if e["bloc"] == b[0] and e["sexe"] == "FEMININ") / max(1, sum(1 for e in elus if e["bloc"] == b[0]))),
           "femmes_cand": round(100 * sum(1 for e in cand_t1 if e["bloc"] == b[0] and e["sexe"] == "FEMININ") / max(1, sum(1 for e in cand_t1 if e["bloc"] == b[0])))} for b in BLOCS_OFF]
out["officiel2024"] = {"blocs": BLOCS_OFF, "departements": deps, "sieges": sieges, "nb_elus": len(elus), "elus_t1": sum(1 for row in c1 for c in candidats(h1, row) if c["elu"]),
                       "config_t2": config, "femmes_elues": round(100 * sum(1 for e in elus if e["sexe"] == "FEMININ") / len(elus), 1)}

# ---------------------------------------------------------------- séries longues : vote de gauche selon le sexe, le diplôme, le revenu (World Political Cleavages and Inequality Database)
W = {}
for r in csv.DictReader(open(os.path.join(R, "data", "sources", "sociologie", "wpid_gauche_droite.csv"), encoding="utf-8")):
    if r["party"] == "left" and r["mean"]:
        W.setdefault((r["isoname"], int(r["year"])), {})[(r["var"], r["sub"])] = float(r["mean"])
def ecarts(d):
    g = lambda v, s: d.get((v, s))
    o = {}
    if g("sex", "Woman") is not None and g("sex", "Man") is not None: o["femmes"] = round(100 * (g("sex", "Woman") - g("sex", "Man")), 1)
    for v, k in (("geduc", "diplome"), ("ginc", "revenu")):
        if None not in (g(v, "Top 10%"), g(v, "Bottom 50%"), g(v, "Middle 40%")):
            o[k] = round(100 * (g(v, "Top 10%") - (5 * g(v, "Bottom 50%") + 4 * g(v, "Middle 40%")) / 9), 1)
    return o
NOMS_FR = {"Australia": "Australie", "Austria": "Autriche", "Belgium": "Belgique", "Canada": "Canada", "Denmark": "Danemark", "Finland": "Finlande", "France": "France",
           "Germany": "Allemagne", "Iceland": "Islande", "Ireland": "Irlande", "Italy": "Italie", "Luxembourg": "Luxembourg", "Netherlands": "Pays-Bas", "New Zealand": "Nouvelle-Zélande",
           "Norway": "Norvège", "Portugal": "Portugal", "Spain": "Espagne", "Sweden": "Suède", "Switzerland": "Suisse", "United Kingdom": "Royaume-Uni", "United States": "États-Unis"}
france_long = [{"annee": y, **ecarts(d)} for (c, y), d in sorted(W.items()) if c == "France"]
pays = []
for c, nom in NOMS_FR.items():
    ser = [(y, ecarts(d)) for (cc, y), d in sorted(W.items()) if cc == c]
    def moy(a, b, k):
        v = [e[k] for y, e in ser if a <= y <= b and k in e]
        return round(sum(v) / len(v), 1) if v else None
    pays.append({"nom": nom, "debut": {k: moy(1945, 1979, k) for k in ("femmes", "diplome", "revenu")}, "fin": {k: moy(2000, 2025, k) for k in ("femmes", "diplome", "revenu")},
                 "annees": [ser[0][0], ser[-1][0]] if ser else None})
out["long"] = {"france": france_long, "pays": pays}
out["criteres"] = LIB
json.dump(out, open(os.path.join(R, "data", "sociologie.json"), "w"), ensure_ascii=False, indent=1)
for k, v in L24.items():
    assert all(abs(sum(x[1:]) - 100) <= 2 for x in v), (k, v)
for k, v in P22.items():
    assert all(abs(sum(x[1:]) - 100) <= 3 for x in v), (k, v)
print("ok", len(insee), out["presidentielle2022"]["ensemble"])
