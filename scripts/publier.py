#!/usr/bin/env python3
"""Prépare la version publiée du site : retire les rubriques non publiées (aujourd'hui « Société »).
Le code reste complet dans le dépôt ; seule la copie mise en ligne (dossier _site) est allégée.
Pour remettre une rubrique en ligne, la retirer de la liste NON_PUBLIE.
Usage : python3 scripts/publier.py _site/index.html
"""
import re, sys

NON_PUBLIE = ["societe"]          # valeurs data-group des rubriques à ne pas publier

p = sys.argv[1]
t = open(p, encoding="utf-8").read()
retires = []
for g in NON_PUBLIE:
    # le menu des onglets de la rubrique, et la liste des sections qu'il contient
    m = re.search(r'\s*<nav class="tabs" data-group="%s"[^>]*>(.*?)</nav>' % g, t, re.S)
    if not m:
        continue
    ids = re.findall(r'href="#([^"]+)"', m.group(1))
    t = t[:m.start()] + t[m.end():]
    # le bouton de la rubrique
    t = re.sub(r'\s*<button type="button" data-group="%s">[^<]*</button>' % g, "", t)
    # les sections elles-mêmes
    for i in ids:
        t, n = re.subn(r'\s*<section id="%s" class="panel[^"]*">.*?</section>' % re.escape(i), "", t, flags=re.S)
        if n:
            retires.append(i)
    # les liens vers ces sections ailleurs dans la page deviennent du texte simple
    for i in ids:
        t = re.sub(r'<a href="#%s">(.*?)</a>' % re.escape(i), r"\1", t)
open(p, "w", encoding="utf-8").write(t)
print("Rubriques non publiées :", ", ".join(NON_PUBLIE), "| sections retirées :", ", ".join(retires))
