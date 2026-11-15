#!/usr/bin/env python3
"""Construit data/argent_prive.json : niveau de vie depuis 1900.

- PIB par habitant en euros constants : INSEE (comptes nationaux base 2020) depuis 1949, prolongé avant par la croissance
  du PIB réel par habitant de la base Jordà-Schularick-Taylor (estimations Maddison) ;
- salaire moyen brut par emploi salarié en équivalent temps plein, en euros constants : INSEE depuis 1949
  (salaires et traitements bruts ÷ emploi salarié EQTP, déflaté par les prix de la consommation des ménages),
  prolongé avant 1949 par l'indice des salaires réels de la base JST ;
- énergie primaire par habitant : Our World in Data (depuis 1965) ;
- répartition des dépenses de consommation des ménages par grand poste : INSEE depuis 1959.
Tous les montants sont exprimés en euros de la dernière année disponible.
Usage (depuis la racine) : python3 scripts/build_argent_prive.py
"""
import csv, json, os, re
import openpyxl

HERE = os.path.dirname(os.path.abspath(__file__))
D = os.path.join(HERE, "..", "data", "sources", "histoire")
OUT = os.path.join(HERE, "..", "data", "argent_prive.json")


def bdm(f):
    t = open(os.path.join(D, f), encoding="utf-8").read()
    S = {}
    for m in re.finditer(r"<Series ([^>]*)>(.*?)</Series>", t, re.S):
        idb = re.search(r'IDBANK="([^"]+)"', m.group(1)).group(1)
        S[idb] = {int(y): float(v) for y, v in re.findall(r'TIME_PERIOD="(\d{4})"[^/]*OBS_VALUE="([^"]+)"', m.group(2))}
    return S


M = bdm("bdm_menages.xml")
H = bdm("bdm_histoire.xml")
wb = openpyxl.load_workbook(os.path.join(D, "jst_macrohistory.xlsx"), read_only=True, data_only=True)
it = wb.worksheets[0].iter_rows(values_only=True); h = next(it); ix = {c: i for i, c in enumerate(h)}
J = {r[ix["year"]]: r for r in it if r[ix["iso"]] == "FRA"}
jv = lambda y, c: J[y][ix[c]] if y in J and J[y][ix[c]] is not None else None

an = max(M["011780514"])                      # dernière année
prix = M["011780514"]                         # prix de la consommation des ménages (indice)
defl_pib = {y: H["011779992"][y] / H["011779991"][y] for y in H["011779991"]}

# PIB par habitant, euros de l'année « an »
pib = {y: v * defl_pib[an] / defl_pib[2020] for y, v in M["011779993"].items()}   # 011779993 : euros chaînés de 2020
y0 = min(pib)
for y in range(y0 - 1, 1899, -1):            # avant 1949 : croissance JST (Maddison)
    a, b = jv(y, "rgdpmad"), jv(y + 1, "rgdpmad")
    if a and b:
        pib[y] = pib[y + 1] * a / b

# salaire brut moyen mensuel par EQTP, euros de l'année « an »
sal = {}
for y in M["011785411"]:
    if y in M["011793487"]:
        courant = M["011785411"][y] * 1e6 / (M["011793487"][y] * 1e3) / 12
        p = prix.get(y)
        if p is None:   # avant 1959 : prix du PIB
            p = prix[1959] * defl_pib[y] / defl_pib[1959]
        sal[y] = courant * prix[an] / p
y0 = min(sal)
for y in range(y0 - 1, 1899, -1):            # avant 1949 : salaires réels JST (salaires nominaux ÷ prix)
    a, b = jv(y, "wage"), jv(y + 1, "wage")
    pa, pb = jv(y, "cpi"), jv(y + 1, "cpi")
    if a and b and pa and pb:
        sal[y] = sal[y + 1] * (a / pa) / (b / pb)

# énergie primaire par habitant (OWID, kWh)
ener = {}
with open(os.path.join(HERE, "..", "data", "sources", "energie", "owid_europe.csv"), newline="") as f:
    for r in csv.DictReader(f):
        if r.get("iso_code") == "FRA" and r.get("energy_per_capita"):
            ener[int(r["year"])] = float(r["energy_per_capita"])

# budget des ménages par grand poste (parts de la dépense de consommation)
POSTES = [("alimentation", "Alimentation et boissons", ["011780520", "011780561"], "#16a34a"),
          ("logement", "Logement, eau, énergie", ["011780606"], "#e07b39"),
          ("transports", "Transports", ["011780704"], "#3b6fd6"),
          ("habillement", "Habillement", ["011780579"], "#a855f7"),
          ("equipement", "Meubles, équipement du logement", ["011780650"], "#94a3b8"),
          ("loisirs", "Loisirs, culture, restaurants, hôtels", ["011780764", "011780844"], "#f59e0b"),
          ("sante", "Santé, éducation (reste à charge)", ["011780695", "011780841"], "#0ea5e9"),
          ("autres", "Autres biens et services", None, "#cbd5e1")]
budget = []
for y in sorted(M["011780516"]):
    tot = M["011780516"][y]
    parts = {}
    for k, _, ids, _ in POSTES:
        if ids:
            parts[k] = round(100 * sum(M[i].get(y, 0) for i in ids) / tot, 1)
    parts["autres"] = round(100 - sum(parts.values()), 1)
    budget.append({"annee": y, **parts, "loyers_imputes": round(100 * M["011780612"][y] / tot, 1)})

annees = sorted(set(pib) | set(sal) | set(ener))
serie = [{"annee": y, "pib_hab": round(pib[y]) if y in pib else None, "salaire": round(sal[y]) if y in sal else None,
          "energie_hab": round(ener[y]) if y in ener else None} for y in annees if y >= 1900]
# émissions par habitant : sur le territoire (inventaire) et empreinte (avec les importations), SDES et Eurostat
co2 = []
try:
    ec = json.load(open(os.path.join(HERE, "..", "data", "empreinte", "FR.json")))["sdes"]["serie"]
    th = json.load(open(os.path.join(HERE, "..", "data", "themes", "FR.json")))
    terr = {int(x["annee"]): x["total"] for x in th["climat"]["serie"]}
    popu = {int(x["annee"]): x["population"] for x in th["demographie"]["serie"] if x.get("population")}
    for x in ec:
        y = x["annee"]
        t = terr.get(y) * 1e6 / popu[y] if y in terr and y in popu else None
        co2.append({"annee": y, "empreinte": x["par_hab"], "territoire": round(t, 2) if t else None})
except (OSError, KeyError) as e:
    print("émissions : données absentes", e)
json.dump({"annee_euros": an, "serie": serie, "co2": co2, "budget": budget, "postes": [[k, l, c] for k, l, _, c in POSTES]},
          open(OUT, "w"), ensure_ascii=False, separators=(",", ":"))
for r in serie:
    if r["annee"] in (1900, 1913, 1929, 1938, 1949, 1960, 1975, 2000, an - 1, an):
        print(r)
print(budget[0], budget[-1], sep="\n")
