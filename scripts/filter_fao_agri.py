#!/usr/bin/env python3
"""Extrait des fichiers FAOSTAT (zip) les lignes utiles à l'onglet « Rendements et intrants ».
Usage : python3 scripts/filter_fao_agri.py <zip> <sortie.csv> <mode>
  mode = rendements : rendements, production et surfaces de quelques cultures, France
  mode = france     : toutes les lignes de la France
"""
import csv, io, sys, zipfile
src, dst, mode = sys.argv[1], sys.argv[2], sys.argv[3]
CULT = {"Wheat", "Maize (corn)", "Barley", "Rape or colza seed", "Sugar beet", "Potatoes", "Sunflower seed"}
z = zipfile.ZipFile(src)
name = [n for n in z.namelist() if n.endswith("_NOFLAG.csv")][0]
with z.open(name) as f, open(dst, "w", newline="") as o:
    r = csv.DictReader(io.TextIOWrapper(f, encoding="utf-8", errors="replace"))
    w = csv.DictWriter(o, fieldnames=r.fieldnames); w.writeheader()
    for row in r:
        if mode == "france" and row["Area"] == "France":
            w.writerow(row)
        elif mode == "rendements" and row["Area"] == "France" and row["Item"] in CULT and row["Element"] in ("Yield", "Production", "Area harvested"):
            w.writerow(row)
