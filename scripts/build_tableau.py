#!/usr/bin/env python3
"""Tableau périodique : 118 éléments (données Periodic-Table-JSON, issues de Wikipédia), noms et usages en français.
Sortie : data/tableau.json"""
import json, os, re
HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, "..", "data", "sources", "science", "periodic.json")
E = json.load(open(SRC, encoding="utf-8"))["elements"][:118]

NOMS = """Hydrogène Hélium Lithium Béryllium Bore Carbone Azote Oxygène Fluor Néon Sodium Magnésium Aluminium Silicium Phosphore Soufre Chlore Argon
Potassium Calcium Scandium Titane Vanadium Chrome Manganèse Fer Cobalt Nickel Cuivre Zinc Gallium Germanium Arsenic Sélénium Brome Krypton
Rubidium Strontium Yttrium Zirconium Niobium Molybdène Technétium Ruthénium Rhodium Palladium Argent Cadmium Indium Étain Antimoine Tellure Iode Xénon
Césium Baryum Lanthane Cérium Praséodyme Néodyme Prométhium Samarium Europium Gadolinium Terbium Dysprosium Holmium Erbium Thulium Ytterbium Lutécium
Hafnium Tantale Tungstène Rhénium Osmium Iridium Platine Or Mercure Thallium Plomb Bismuth Polonium Astate Radon
Francium Radium Actinium Thorium Protactinium Uranium Neptunium Plutonium Américium Curium Berkélium Californium Einsteinium Fermium Mendélévium Nobélium Lawrencium
Rutherfordium Dubnium Seaborgium Bohrium Hassium Meitnérium Darmstadtium Roentgenium Copernicium Nihonium Flérovium Moscovium Livermorium Tennesse Oganesson""".split()
assert len(NOMS) == 118

FAM = {"alkali metal": "alcalin", "alkaline earth metal": "alcalino", "transition metal": "transition", "post-transition metal": "pauvre",
       "metalloid": "metalloide", "diatomic nonmetal": "nonmetal", "polyatomic nonmetal": "nonmetal", "noble gas": "gaznoble",
       "lanthanide": "lanthanide", "actinide": "actinide"}
ETAT = {"Solid": "solide", "Liquid": "liquide", "Gas": "gaz"}

USAGES = {
 1: "Carburant des étoiles ; engrais (ammoniac), raffinage ; vecteur d'énergie envisagé (électrolyse).",
 2: "Refroidissement des aimants d'IRM et des détecteurs ; ballons. Extrait du gaz naturel, ressource limitée.",
 3: "Batteries des téléphones et des voitures électriques ; verres et céramiques ; médicament (troubles bipolaires).",
 4: "Alliages légers et rigides (aérospatiale), fenêtres de rayons X. Très toxique en poussière.",
 5: "Verres résistants à la chaleur (Pyrex), aimants néodyme-fer-bore, engrais (oligo-élément), barres de contrôle des réacteurs.",
 6: "Base de toute la chimie du vivant ; combustibles fossiles ; acier ; graphite des batteries ; diamant.",
 7: "78 % de l'air ; engrais azotés (ammoniac), explosifs ; constituant des protéines et de l'ADN.",
 8: "21 % de l'air, respiration ; élément le plus abondant de la croûte terrestre (dans les roches) ; sidérurgie, médecine.",
 9: "Dentifrices (fluorures), Téflon, gaz réfrigérants ; enrichissement de l'uranium (hexafluorure). Le plus réactif de tous les éléments.",
 10: "Enseignes lumineuses, lasers. Inerte.",
 11: "Sel de cuisine (chlorure de sodium) ; lampes d'éclairage public orange ; batteries sodium-ion.",
 12: "Alliages légers (automobile, aviation) ; cœur de la chlorophylle ; compléments alimentaires.",
 13: "Métal le plus utilisé après le fer : emballages, transports, câbles électriques ; produit à partir de la bauxite, avec beaucoup d'électricité.",
 14: "Puces électroniques, panneaux solaires ; verre et béton (sous forme de silice) ; silicones.",
 15: "Engrais (phosphates) ; os et dents ; ADN et ATP (l'énergie des cellules). Pas de substitut pour l'agriculture.",
 16: "Acide sulfurique (le produit chimique le plus fabriqué au monde) ; engrais ; vulcanisation du caoutchouc.",
 17: "Eau potable et piscines (désinfection) ; PVC ; sel de cuisine.",
 18: "Soudure, ampoules ; environ 1 % de l'air. Inerte.",
 19: "Engrais (potasse) ; indispensable aux nerfs et aux muscles.",
 20: "Os, dents, coquilles ; ciment et chaux ; craie et calcaire.",
 21: "Alliages aluminium-scandium (aviation, cadres de vélo) ; piles à combustible.",
 22: "Peintures et crèmes solaires (dioxyde de titane, blanc) ; alliages légers et résistants (aviation, prothèses).",
 23: "Aciers à haute résistance ; batteries à flux pour stocker l'électricité.",
 24: "Acier inoxydable ; chromage ; donne leur couleur au rubis et à l'émeraude.",
 25: "Indispensable à l'acier ; batteries ; piles alcalines.",
 26: "Acier et fonte, le métal de la civilisation industrielle ; hémoglobine du sang ; cœur de la Terre.",
 27: "Batteries lithium-ion (NMC) ; superalliages des turbines ; aimants. Surtout extrait au Congo.",
 28: "Acier inoxydable ; batteries des voitures électriques ; pièces de monnaie. Nouvelle-Calédonie, Indonésie.",
 29: "Fils et moteurs électriques, réseaux, électronique ; plomberie. Excellent conducteur, recyclable sans fin.",
 30: "Galvanisation (protection de l'acier contre la rouille) ; laiton ; oligo-élément vital.",
 31: "Diodes électroluminescentes (LED), électronique rapide, panneaux solaires spatiaux. Découvert par le Français Lecoq de Boisbaudran (1875), il avait été prédit par Mendeleïev.",
 32: "Fibres optiques, optique infrarouge (vision nocturne), électronique. Prédit par Mendeleïev (« éka-silicium »).",
 33: "Semi-conducteurs (arséniure de gallium) ; autrefois poisons et pesticides.",
 34: "Cellules photoélectriques, verre ; oligo-élément.",
 35: "Retardateurs de flamme ; traitement de l'eau. Un des deux seuls éléments liquides à température ambiante.",
 36: "Éclairage (lampes), fenêtres isolantes.",
 37: "Horloges atomiques, recherche.",
 38: "Feux d'artifice (rouge) ; aimants de ferrite.",
 39: "LED blanches et écrans ; lasers ; supraconducteurs. Classé parmi les terres rares.",
 40: "Gaines du combustible nucléaire ; céramiques ; prothèses dentaires.",
 41: "Aciers spéciaux (gazoducs, automobiles) ; aimants supraconducteurs (IRM). Surtout extrait au Brésil.",
 42: "Aciers résistants à la chaleur ; catalyseurs ; oligo-élément pour les plantes.",
 43: "Imagerie médicale (scintigraphie, technétium 99m). Premier élément fabriqué artificiellement (1937) ; aucun isotope stable.",
 44: "Disques durs, électronique ; catalyseurs.",
 45: "Pots catalytiques des voitures. Un des métaux les plus chers.",
 46: "Pots catalytiques, électronique, dentisterie.",
 47: "Meilleur conducteur d'électricité ; bijoux, monnaie ; panneaux solaires ; désinfectant.",
 48: "Batteries nickel-cadmium (en déclin), pigments. Toxique.",
 49: "Écrans tactiles et plats (oxyde d'indium-étain, ITO).",
 50: "Soudure électronique ; fer-blanc (boîtes de conserve) ; bronze (avec le cuivre).",
 51: "Retardateurs de flamme ; batteries au plomb ; semi-conducteurs.",
 52: "Panneaux solaires (tellurure de cadmium) ; alliages.",
 53: "Désinfection (teinture d'iode) ; indispensable à la thyroïde (sel iodé) ; pastilles d'iode en cas d'accident nucléaire.",
 54: "Phares de voitures, flashs ; anesthésie ; propulsion ionique des satellites.",
 55: "Horloges atomiques : la seconde est définie par le césium 133.",
 56: "Imagerie médicale (repas baryté) ; boues de forage ; feux d'artifice (vert).",
 57: "Lentilles d'appareils photo, batteries nickel-hydrure, catalyseurs de raffinage. Terre rare.",
 58: "Pots catalytiques, polissage du verre ; terre rare la plus abondante.",
 59: "Aimants permanents (avec le néodyme), verres de soudeur.",
 60: "Aimants permanents les plus puissants (moteurs de voitures électriques, éoliennes en mer, disques durs). Surtout produit en Chine.",
 61: "Piles atomiques pour satellites, peintures luminescentes. Radioactif, aucun isotope stable.",
 62: "Aimants samarium-cobalt (résistants à la chaleur), traitement de cancers. Découvert par Lecoq de Boisbaudran (1879).",
 63: "Couleur rouge des écrans et encres de sécurité des billets en euros.",
 64: "Produit de contraste pour l'IRM ; barres de contrôle de réacteurs.",
 65: "Phosphores verts des écrans, aimants.",
 66: "Ajouté aux aimants néodyme pour qu'ils supportent la chaleur des moteurs. Découvert par Lecoq de Boisbaudran (1886).",
 67: "Aimants les plus intenses de laboratoire, lasers médicaux.",
 68: "Amplificateurs des fibres optiques (internet), lasers médicaux.",
 69: "Lasers, appareils de radiographie portables.",
 70: "Horloges atomiques de nouvelle génération, lasers.",
 71: "Imagerie médicale (TEP), traitement de cancers.",
 72: "Barres de contrôle des réacteurs, puces électroniques.",
 73: "Condensateurs des téléphones et ordinateurs ; prothèses. Extrait en partie au Congo (minerai « coltan »).",
 74: "Outils de coupe (carbure de tungstène), filaments d'ampoules ; point de fusion le plus élevé des métaux.",
 75: "Superalliages des moteurs d'avion ; catalyseurs.",
 76: "Pointes de stylos, contacts électriques. Élément le plus dense.",
 77: "Bougies d'allumage, creusets ; le mètre étalon de Sèvres est en platine iridié.",
 78: "Pots catalytiques, bijoux, piles à combustible, médicaments anticancéreux.",
 79: "Réserve de valeur, bijoux ; électronique (contacts). Formé dans les collisions d'étoiles à neutrons.",
 80: "Autrefois thermomètres et amalgames dentaires ; extraction artisanale de l'or. Toxique ; liquide à température ambiante.",
 81: "Électronique, imagerie cardiaque. Très toxique.",
 82: "Batteries des voitures (démarrage) ; protection contre les rayons X ; autrefois essence et peintures. Toxique.",
 83: "Médicaments (estomac), alliages sans plomb, cosmétiques.",
 84: "Sources de neutrons, éliminateurs d'électricité statique. Découvert par Marie et Pierre Curie (1898), nommé d'après la Pologne.",
 85: "Recherche contre le cancer. L'élément naturel le plus rare de la croûte terrestre.",
 86: "Gaz radioactif issu de l'uranium des roches (granite) : deuxième cause de cancer du poumon après le tabac. Présent en Bretagne, dans le Massif central.",
 87: "Aucun usage. Découvert par la Française Marguerite Perey (1939), au laboratoire Curie.",
 88: "Autrefois peintures lumineuses et traitements du cancer. Découvert par Marie et Pierre Curie (1898).",
 89: "Recherche, traitement de cancers (actinium 225).",
 90: "Combustible nucléaire envisagé (réacteurs au thorium) ; plus abondant que l'uranium.",
 91: "Recherche. Rare et très radioactif.",
 92: "Combustible des centrales nucléaires (uranium 235) ; la France l'importe en totalité (Kazakhstan, Niger, Ouzbékistan, Australie, Canada).",
 93: "Sous-produit des réacteurs ; recherche.",
 94: "Combustible MOX (recyclé à La Hague) ; armes nucléaires ; piles des sondes spatiales.",
 95: "Détecteurs de fumée.",
 96: "Sources d'énergie pour sondes spatiales, recherche.",
 98: "Démarrage des réacteurs, détection de l'or et du pétrole (source de neutrons).",
}
# origine dans l'univers (simplifiée)
R = {52, 53, 54, 63, 64, 65, 66, 67, 68, 69, 75, 76, 77, 78, 79, 90, 92}
def origine(z):
    if z in (1, 2): return "bigbang"
    if z == 3: return "bigbang"
    if z in (4, 5): return "cosmique"
    if z <= 26: return "etoiles"
    if z in (43, 61) or z >= 93: return "homme"
    if z in (84, 85, 86, 87, 88, 89, 91): return "desint"
    if z in R: return "collision"
    if z <= 30: return "supernova"
    return "geantes"
# matières premières critiques de l'Union européenne (règlement de 2024, liste de 2023), au niveau des éléments
CRIT = {3, 4, 5, 6, 9, 12, 13, 14, 15, 21, 22, 23, 25, 27, 28, 29, 31, 32, 33, 38, 41, 44, 45, 46, 51, 56, 72, 73, 74, 76, 77, 78, 83, 2} | set(range(57, 72)) | {39}

out = []
for i, x in enumerate(E):
    z = x["number"]
    rad = x.get("atomic_radii") or {}
    r = (rad.get("calculated") or rad.get("empirical") or [None])[0]
    fam = FAM.get(x["category"], "inconnu")
    out.append({"z": z, "s": x["symbol"], "n": NOMS[i], "m": round(x["atomic_mass"], 3) if x["atomic_mass"] else None,
                "x": x["xpos"], "y": x["ypos"], "f": fam, "b": x["block"], "p": x["period"], "g": x["group"],
                "e": ETAT.get(x["phase"]), "en": x["electronegativity_pauling"],
                "ie": x["ionization_energies"][0] if x["ionization_energies"] else None,
                "d": x["density"], "fus": round(x["melt"] - 273.15) if x["melt"] else None, "eb": round(x["boil"] - 273.15) if x["boil"] else None,
                "r": r, "c": x["shells"], "conf": x["electron_configuration"], "cs": x["electron_configuration_semantic"],
                "o": origine(z), "k": z in CRIT, "u": USAGES.get(z), "pred": fam == "inconnu" or z >= 100})
json.dump({"elements": out}, open(os.path.join(HERE, "..", "data", "tableau.json"), "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
print(len(out), "éléments")
