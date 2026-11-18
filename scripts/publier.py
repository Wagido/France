#!/usr/bin/env python3
"""Prépare la version publiée du site : retire les rubriques non publiées (aujourd'hui « Société »),
sauf les onglets qu'on a choisi d'en publier (PUBLIES).
Le code reste complet dans le dépôt ; seule la copie mise en ligne (dossier _site) est allégée.
Pour remettre toute une rubrique en ligne, la retirer de la liste NON_PUBLIE ;
pour publier un seul onglet d'une rubrique non publiée, l'ajouter à PUBLIES ;
pour retirer un onglet d'une rubrique publiée, l'ajouter à ONGLETS_NON_PUBLIES.
Usage : python3 scripts/publier.py _site/index.html
"""
import re, sys

NON_PUBLIE = ["societe", "histoire"]                 # valeurs data-group des rubriques à ne pas publier
PUBLIES = {"societe": ["electorat"]}     # onglets publiés malgré tout dans ces rubriques
ONGLETS_NON_PUBLIES = ["roches", "infrastructures", "fiscalite"]        # onglets retirés de la version publiée, dans des rubriques publiées

p = sys.argv[1]
t = open(p, encoding="utf-8").read()
retires = []
for g in NON_PUBLIE:
    # le menu des onglets de la rubrique, et la liste des sections qu'il contient
    m = re.search(r'\s*<nav class="tabs" data-group="%s"[^>]*>(.*?)</nav>' % g, t, re.S)
    if not m:
        continue
    garder = PUBLIES.get(g, [])
    ids = [i for i in re.findall(r'href="#([^"]+)"', m.group(1)) if i not in garder]
    if garder:
        # on garde la rubrique, avec seulement les onglets publiés
        nav = m.group(0)
        for i in ids:
            nav = re.sub(r'\s*<a href="#%s">[^<]*</a>' % re.escape(i), "", nav)
        t = t[:m.start()] + nav + t[m.end():]
    else:
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
        t = re.sub(r'<a href="#%s"[^>]*>(.*?)</a>' % re.escape(i), r"\1", t)
for i in ONGLETS_NON_PUBLIES:
    t = re.sub(r'\s*<a href="#%s">[^<]*</a>' % re.escape(i), "", t, count=1)       # l'onglet dans le menu
    t, n = re.subn(r'\s*<section id="%s" class="panel[^"]*">.*?</section>' % re.escape(i), "", t, flags=re.S)
    if n:
        retires.append(i)
    t = re.sub(r'<a href="#%s"[^>]*>(.*?)</a>' % re.escape(i), r"\1", t)          # les liens vers lui deviennent du texte
open(p, "w", encoding="utf-8").write(t)
print("Rubriques non publiées :", ", ".join(NON_PUBLIE), "| onglets publiés malgré tout :", PUBLIES, "| sections retirées :", ", ".join(retires))
