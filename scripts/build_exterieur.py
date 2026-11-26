#!/usr/bin/env python3
"""Construit data/exterieur.json : le solde extérieur et ce qu'il fait au patrimoine du pays.

- solde de la balance courante en % du PIB, depuis 1980 : FMI, World Economic Outlook (data/sources/prosperite/imf.json) ;
- position extérieure nette en % du PIB (ce que le pays possède à l'étranger moins ce qu'il doit à l'étranger) :
  Eurostat tipsii10 (data/sources/tipsii10.json) ;
- solde commercial (biens et services) en % du PIB : INSEE, comptes nationaux (data/histoire.json) ;
- investissement public brut (P51G), usure du capital public (consommation de capital fixe, P51C) et solde public (B9) en % du PIB : Eurostat gov_10a_main (data/sources/gov_p51g_b9.json) ;
- solde extérieur et solde public de 15 pays (encart « deux comptes séparés ») : FMI, World Economic Outlook,
  BCA_NGDPD et GGXCNL_NGDP (data/sources/prosperite/imf_jumeaux.json, API datamapper).
Usage (depuis la racine) : python3 scripts/build_exterieur.py
"""
import json, os, sys

HERE = os.path.dirname(os.path.abspath(__file__)); R = os.path.join(HERE, "..")
sys.path.insert(0, HERE)
from build_environnement import lire  # noqa: E402

PAYS = [("FR", "FRA", "France"), ("DE", "DEU", "Allemagne"), ("IT", "ITA", "Italie"), ("ES", "ESP", "Espagne"), ("US", "USA", "États-Unis")]
imf = json.load(open(os.path.join(R, "data", "sources", "prosperite", "imf.json")))["BCA_NGDPD"]
peen = lire("tipsii10.json", {"partner": "WRL_REST", "unit": "PC_GDP"}, os.path.join(R, "data", "sources"))
courant, position = [], []
an_fmi = 2025
for y in range(1980, an_fmi + 1):
    row = {"annee": y}
    for g2, g3, _ in PAYS:
        v = imf.get(g3, {}).get(str(y)); row[g2] = v
    courant.append(row)
ys = sorted({y for g2, _, _ in PAYS for y in peen.get(g2, {})})
for y in ys:
    position.append({"annee": y, **{g2: (round(peen[g2][y], 1) if y in peen.get(g2, {}) else None) for g2, _, _ in PAYS}})
# déficits cumulés de la France depuis 2005 (en points de PIB)
cumul = round(sum(r["FR"] for r in courant if r["annee"] >= 2005 and r["FR"] is not None), 1)
H = json.load(open(os.path.join(R, "data", "histoire.json")))["series"]
commercial = [{"annee": r["annee"], "FR": r["solde_commercial"]} for r in H if r["annee"] >= 1980]
G = {it: lire("gov_p51g_b9.json", {"na_item": it}, os.path.join(R, "data", "sources")) for it in ("P51G", "B9", "P51C")}
public = [{"annee": y, **{f"{k}_{g}": G[it][g].get(y) for k, it in (("inv", "P51G"), ("solde", "B9"), ("ccf", "P51C")) for g in ("FR", "DE", "EU27_2020")}}
          for y in sorted(G["P51G"]["FR"])]
JN = {"FRA": "France", "DEU": "Allemagne", "ITA": "Italie", "ESP": "Espagne", "NLD": "Pays-Bas", "SWE": "Suède", "CHE": "Suisse",
      "NOR": "Norvège", "GBR": "Royaume-Uni", "USA": "États-Unis", "JPN": "Japon", "KOR": "Corée du Sud", "CHN": "Chine",
      "BRA": "Brésil", "IND": "Inde"}
J = json.load(open(os.path.join(R, "data", "sources", "prosperite", "imf_jumeaux.json")))
jumeaux = {"annee": an_fmi, "pays": [{"code": c, "nom": n, "ext": J["BCA_NGDPD"][c].get(str(an_fmi)), "pub": J["GGXCNL_NGDP"][c].get(str(an_fmi)),
           "ext_pos_10": sum(1 for y in range(an_fmi - 10, an_fmi) if (J["BCA_NGDPD"][c].get(str(y)) or 0) > 0),
           "pub_neg_10": sum(1 for y in range(an_fmi - 10, an_fmi) if (J["GGXCNL_NGDP"][c].get(str(y)) or 0) < 0)} for c, n in JN.items()]}
# solde extérieur = solde du secteur privé + solde public (France, depuis 1980, FMI)
_pib = json.load(open(os.path.join(R, "data", "sources", "pib_courant_fr.json")))
_inv = {i: t for t, i in _pib["dimension"]["time"]["category"]["index"].items()}
PIB = {int(_inv[int(k)]): v for k, v in _pib["value"].items()}
secteurs = []
for y in range(1980, an_fmi + 1):
    e = imf.get("FRA", {}).get(str(y)); g = J["GGXCNL_NGDP"].get("FRA", {}).get(str(y))
    if e is not None and g is not None:
        r = {"annee": y, "ext": round(e, 1), "pub": round(g, 1), "prive": round(e - g, 1)}
        if y in PIB:
            r.update({"pib_md": round(PIB[y] / 1000, 1), "ext_md": round(e * PIB[y] / 1e5, 1), "pub_md": round(g * PIB[y] / 1e5, 1), "prive_md": round((e - g) * PIB[y] / 1e5, 1)})
        secteurs.append(r)
json.dump({"secteurs": secteurs, "jumeaux": jumeaux, "commercial": commercial, "public": public, "pays": [[g2, n] for g2, _, n in PAYS], "courant": courant, "position": position, "cumul_fr_2005": cumul},
          open(os.path.join(R, "data", "exterieur.json"), "w"), ensure_ascii=False, indent=1)
print("cumul FR depuis 2005 :", cumul, "| PEEN FR", [(r["annee"], r["FR"]) for r in position if r["annee"] % 5 == 0 or r["annee"] >= 2024])
