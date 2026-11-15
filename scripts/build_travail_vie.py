#!/usr/bin/env python3
"""Construit data/travail_vie.json : heures travaillées par an et sur une vie, par pays.

- heures par an et par personne en emploi : data/themes/index.json (Eurostat, comptes nationaux) ;
- durée de vie active (nombre d'années qu'une personne de 15 ans passera en emploi ou au chômage) : Eurostat lfsi_dwl_a.
Heures sur une vie = durée de vie active × heures par an. C'est un ordre de grandeur : les années de chômage
sont comptées dans la vie active, et les heures moyennes de l'année sont appliquées à toute la carrière.
Usage (depuis la racine) : python3 scripts/build_travail_vie.py
"""
import json, os

HERE = os.path.dirname(os.path.abspath(__file__))
R = os.path.join(HERE, "..")
d = json.load(open(os.path.join(R, "data", "sources", "lfsi_dwl_a.json")))
geo = {i: g for g, i in d["dimension"]["geo"]["category"]["index"].items()}
tim = {i: t for t, i in d["dimension"]["time"]["category"]["index"].items()}
nt = len(tim)
dwl = {}
for k, v in d["value"].items():
    k = int(k)
    dwl.setdefault(geo[k // nt], {})[int(tim[k % nt])] = v
idx = json.load(open(os.path.join(R, "data", "themes", "index.json")))
pays = []
for p in idx["pays"]:
    t = p.get("travail") or {}
    h, D = t.get("heures_emploi"), dwl.get(p["code"], {})
    if not h or not D:
        continue
    an = max(D)
    pays.append({"code": p["code"], "nom": p["nom"], "heures_an": round(h), "annee_h": t.get("annee"),
                 "vie_active": round(D[an], 1), "annee_v": an, "heures_vie": round(h * D[an], -2)})
pays.sort(key=lambda r: -r["heures_vie"])
ue = dwl.get("EU27_2020", {})
json.dump({"pays": pays, "ue_vie_active": round(ue[max(ue)], 1) if ue else None},
          open(os.path.join(R, "data", "travail_vie.json"), "w"), ensure_ascii=False, indent=1)
for r in pays:
    print(r["code"], r["heures_an"], r["vie_active"], r["heures_vie"])
