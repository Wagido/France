#!/usr/bin/env python3
"""Construit data/niveau_vie.json : vit-on mieux qu'avant ?

- pouvoir d'achat du revenu disponible brut, total et par unité de consommation, 1960 = 100
  (INSEE, comptes nationaux base 2020, Tableaux de l'économie française / France portrait social, figure 3) ;
- part des dépenses pré-engagées (logement, assurances, abonnements) dans le revenu disponible brut (INSEE, figure 2) ;
- consommation individuelle effective par habitant en standards de pouvoir d'achat (PPA), indice UE = 100 (Eurostat prc_ppp_ind) ;
- consommation individuelle effective par habitant en volume, euros de 2020 (Eurostat nama_10_pc) ;
- revenu disponible brut ajusté des ménages par habitant en PPA (Eurostat tec00113) ;
- SMIC horaire brut (INSEE, série 000822484, depuis 1951), converti en mensuel à temps plein (durée légale :
  173,33 h jusqu'en 1981, 169 h de 1982 à 2001, 151,67 h depuis 2002) et en euros d'aujourd'hui, comparé au
  salaire moyen brut par équivalent temps plein (data/argent_prive.json).
Usage (depuis la racine) : python3 scripts/build_niveau_vie.py
"""
import html, json, os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
R = os.path.join(HERE, "..")
SRC = os.path.join(R, "data", "sources")
sys.path.insert(0, HERE)
from build_environnement import lire, NOMS  # noqa: E402


def texte(f):
    t = open(os.path.join(SRC, f), encoding="utf-8").read()
    return html.unescape(re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", t)))


def tableau(t, debut, ncol):
    i = t.find(debut); assert i >= 0, debut
    t = t[i:t.find("Lecture", i + len(debut))]
    num = r"(-?\d+(?:,\d+)?)"
    rows = re.findall(r"\b((?:19|20)\d\d) " + " ".join([num] * ncol) + r"(?= |$)", t)
    return [(int(r[0]), *[float(x.replace(",", ".")) for x in r[1:]]) for r in rows]


pa = tableau(texte("insee_pouvoir_achat.html"), "Année Évolution annuelle", 4)
pre = tableau(texte("insee_preengagees.html"), "Année Dépenses pré-engagées", 4)
aic = lire("prc_ppp_ind_aic.json", {"ppp_cat": "A01"}, SRC)
pib = lire("prc_ppp_ind_aic.json", {"ppp_cat": "GDP"}, SRC)
vol = lire("nama_10_pc_p41.json", {"unit": "CLV20_EUR_HAB"}, SRC)
gdi = lire("tec00113.json", None, SRC)

PAYS = [g for g in NOMS if g in aic]
out = {
    "pouvoir_achat": [{"annee": a, "evol": e, "evol_uc": eu, "idx": round(i, 1), "idx_uc": round(iu, 1)} for a, e, eu, i, iu in pa],
    "preengagees": [{"annee": a, "part": p, "logement": l} for a, p, l, _, _ in pre],
    "pays": [],
}
for g in PAYS:
    A, P, V, G = aic.get(g, {}), pib.get(g, {}), vol.get(g, {}), gdi.get(g, {})
    if not A:
        continue
    ya = max(A); yv = max(V) if V else None; yg = max(G) if G else None
    r = {"code": g, "nom": NOMS[g], "annee": ya, "aic": A[ya], "aic_serie": [{"annee": y, "v": A[y]} for y in sorted(A)],
         "pib": P.get(ya)}
    if V and V.get(2000) and V.get(2019):
        r.update(vol_annee=yv, vol=V[yv], vol_2000=round(100 * (V[yv] / V[2000] - 1), 1), vol_2019=round(100 * (V[yv] / V[2019] - 1), 1))
    if G:
        r.update(gdi_annee=yg, gdi=round(G[yg]))
    out["pays"].append(r)
# SMIC : moyenne annuelle des valeurs mensuelles, en euros de l'année « an » (prix de la consommation des ménages)
t = open(os.path.join(SRC, "insee_smic_horaire.xml"), encoding="utf-8").read()
mens = {}
for y, m, v in re.findall(r'TIME_PERIOD="(\d{4})-(\d\d)"[^/]*OBS_VALUE="([^"]+)"', t):
    mens.setdefault(int(y), []).append(float(v))
t = open(os.path.join(SRC, "histoire", "bdm_menages.xml"), encoding="utf-8").read()
m = re.search(r'<Series [^>]*IDBANK="011780514"[^>]*>(.*?)</Series>', t, re.S)
prix = {int(y): float(v) for y, v in re.findall(r'TIME_PERIOD="(\d{4})"[^/]*OBS_VALUE="([^"]+)"', m.group(1))}
AP = json.load(open(os.path.join(R, "data", "argent_prive.json")))
an = AP["annee_euros"]; sal = {r["annee"]: r["salaire"] for r in AP["serie"] if r["salaire"]}
heures = lambda y: 173.33 if y < 1982 else 169 if y < 2002 else 151.67
smic = []
for y in sorted(mens):
    if y not in prix or an not in prix or len(mens[y]) < 12:
        continue
    h = sum(mens[y]) / len(mens[y])
    mo = h * heures(y) * prix[an] / prix[y]
    r = {"annee": y, "horaire_courant": round(h, 2), "mensuel": round(mo), "horaire_reel": round(h * prix[an] / prix[y], 2)}
    if y in sal:
        r["salaire_moyen"] = sal[y]; r["ratio"] = round(sal[y] / mo, 2)
    smic.append(r)
out["smic"] = smic; out["annee_euros"] = an
json.dump(out, open(os.path.join(R, "data", "niveau_vie.json"), "w"), ensure_ascii=False, indent=1)
print(smic[0], smic[-1], [ (r["annee"], r.get("ratio")) for r in smic if r["annee"] % 10 == 0])
print(len(pa), pa[-1], len(pre), pre[-1])
for r in out["pays"]:
    print(r["code"], r["annee"], r["aic"], r.get("vol_2000"), r.get("vol_2019"), r.get("gdi"))
