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
  salaire moyen brut par équivalent temps plein (data/argent_prive.json) ;
- simulation « combien d'années pour rembourser son logement » selon l'année d'achat : prêt à taux fixe au taux
  des emprunts d'État à 10 ans de l'année (Eurostat irt_lt_mcby_a depuis 1970, Jordà-Schularick-Taylor avant),
  revenus qui suivent le salaire moyen nominal observé (puis +3 % par an après la dernière année connue),
  montant emprunté proportionnel au prix des logements rapporté au revenu par ménage (data/logement.json depuis 1996 ;
  constant de 1965 à 1995, d'après le « tunnel » de Friggit), remboursement de 30 % du revenu chaque année ; le prêt est renégocié dès que le taux du marché + 1 point
  devient plus bas que son taux (comme beaucoup d'emprunteurs l'ont fait à la fin des années 1980 et dans les années 2010).
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
# simulation : années pour rembourser selon l'année d'achat
import openpyxl
wb = openpyxl.load_workbook(os.path.join(SRC, "histoire", "jst_macrohistory.xlsx"), read_only=True, data_only=True)
it = wb.worksheets[0].iter_rows(values_only=True); hd = next(it); ix = {c: i for i, c in enumerate(hd)}
taux = {r[ix["year"]]: r[ix["ltrate"]] for r in it if r[ix["iso"]] == "FRA" and r[ix["ltrate"]] is not None}
taux.update(lire("irt_lt_mcby_a_fr.json", None, SRC).get("FR", {}))
nom = {y: sal[y] * prix[y] / prix[an] for y in sal if y in prix}          # salaire nominal
yl = max(nom)
LG = {r["annee"]: r["prix_revenu"] for r in json.load(open(os.path.join(R, "data", "logement.json")))["long"] if r.get("prix_revenu")}
y_lg = min(LG)
EMPRUNT, EFFORT = 3.0, 0.30                                               # en 2000 : 3 années de revenu empruntées
def revenu(y):
    return nom[y] if y in nom else nom[yl] * 1.03 ** (y - yl)
simu = []
for y0 in range(1965, max(taux) + 1):
    if y0 not in taux or y0 not in nom:
        continue
    k = (LG.get(y0, LG[y_lg]) if y0 >= y_lg else LG[y_lg]) / 100
    dette = EMPRUNT * k * revenu(y0); r = max(taux[y0], 0.5) / 100; n = 0
    rest10 = None
    while dette > 0 and n < 60:
        ra = min(r, (taux.get(y0 + n, taux[max(taux)]) + 1) / 100) if n else r   # renégociation si le taux du marché + 1 point est plus bas
        dette = dette * (1 + ra) - EFFORT * revenu(y0 + n); n += 1
        if n == 10:
            rest10 = max(dette, 0) / revenu(y0 + 10)
    simu.append({"annee": y0, "annees": n, "taux": round(taux[y0], 2), "inflation_10": round(100 * (prix.get(min(y0 + 10, an), 0) / prix[y0] - 1)) if y0 in prix else None,
                 "emprunt": round(EMPRUNT * k, 2), "poids_10": round(revenu(y0) / revenu(y0 + 10), 2), "connu": y0 + n <= yl})
out["simu"] = simu; out["simu_hyp"] = {"emprunt": EMPRUNT, "effort": EFFORT, "croissance_future": 3, "derniere_annee": yl}
# Paris : prix de 50 m² en années de salaire, et années pour rembourser, depuis 1960
import xlrd
sh = xlrd.open_workbook(os.path.join(SRC, "friggit_paris_1200_2012.xls")).sheet_by_name("Données - data")
fr_reel, fr_ipc = {}, {}
for i in range(4, sh.nrows):
    row = sh.row_values(i)
    try:
        y = int(row[0])
    except (ValueError, TypeError):
        continue
    if row[5] not in ("", None) and row[1] not in ("", None):
        fr_reel[y] = float(row[5]); fr_ipc[y] = float(row[1])
t = open(os.path.join(SRC, "insee_prix_paris.xml"), encoding="utf-8").read()
q = {}
for y, v in re.findall(r'TIME_PERIOD="(\d{4})-Q\d"[^/]*OBS_VALUE="([^"]+)"', t):
    q.setdefault(int(y), []).append(float(v))
ipa = {y: sum(v) / len(v) for y, v in q.items() if len(v) == 4}
M2_2024 = 9450                                   # €/m², appartements anciens à Paris, 2024 (Notaires du Grand Paris)
m2 = {y: M2_2024 * v / ipa[2024] for y, v in ipa.items()}
y1 = min(ipa)
for y in sorted(fr_reel, reverse=True):          # avant 1992 : indice de Friggit en monnaie courante, raccordé
    if y < y1:
        m2[y] = m2[y1] * (fr_reel[y] * fr_ipc[y]) / (fr_reel[y1] * fr_ipc[y1])
SURF, APPORT = 50, 0.10
paris = []
for y in range(1960, max(ipa) + 1):
    if y not in m2 or y not in nom:
        continue
    prixL = SURF * m2[y]
    r = {"annee": y, "m2": round(m2[y]), "prix": round(prixL), "prix_reel": round(prixL * prix[an] / prix[y]) if y in prix else None,
         "annees_salaire": round(prixL / (12 * nom[y]), 1)}
    for k, nb in (("un", 1), ("deux", 2)):
        dette = (1 - APPORT) * prixL; rt = max(taux.get(y, 3), 0.5) / 100; n = 0
        while dette > 0 and n < 60:
            ra = min(rt, (taux.get(y + n, taux[max(taux)]) + 1) / 100) if n else rt
            dette = dette * (1 + ra) - EFFORT * nb * 12 * revenu(y + n); n += 1
        r["remb_" + k] = n if dette <= 0 else None
    paris.append(r)
out["paris"] = paris; out["paris_hyp"] = {"surface": SURF, "apport": APPORT, "m2_2024": M2_2024, "raccord": y1}
out["smic"] = smic; out["annee_euros"] = an
json.dump(out, open(os.path.join(R, "data", "niveau_vie.json"), "w"), ensure_ascii=False, indent=1)
print([(r["annee"], r["annees"], r["taux"], r["emprunt"]) for r in simu if r["annee"] % 5 == 0 or r["annee"] > 2020])
print([(r["annee"], r["m2"], r["annees_salaire"], r["remb_un"], r["remb_deux"]) for r in paris if r["annee"] % 5 == 0 or r["annee"] >= 2023])
print(smic[0], smic[-1], [ (r["annee"], r.get("ratio")) for r in smic if r["annee"] % 10 == 0])
print(len(pa), pa[-1], len(pre), pre[-1])
for r in out["pays"]:
    print(r["code"], r["annee"], r["aic"], r.get("vol_2000"), r.get("vol_2019"), r.get("gdi"))
