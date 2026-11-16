# France Patrimoine

Tableau de bord de la France (et de 29 autres pays européens) à partir des données publiques : Eurostat, INSEE, RTE/ODRÉ, FAOSTAT, Our World in Data.
Page statique (HTML + d3, sans serveur), organisée en trois familles : **Économie**, **Ressources**, **Société**.

Site : https://wagido.github.io/france/ (une fois GitHub Pages activé : Settings → Pages → Source : « GitHub Actions »).

## Mise à jour automatique

- `.github/workflows/mise-a-jour.yml` retélécharge toutes les sources et recalcule `data/` le 3 de chaque mois, et à la demande depuis l'onglet Actions. Les données ne sont enregistrées que si elles ont changé.
- `.github/workflows/site.yml` republie le site après chaque modification.
- Les nouvelles années apparaissent d'elles-mêmes dès qu'Eurostat, l'INSEE ou les autres sources les publient. Deux points restent manuels : le fichier INSEE des comptes nationaux distribués (répartition par tranche de revenu), dont l'adresse change à chaque édition (dans `scripts/fetch.sh`), et les listes de catégories si une nomenclature change.

## Contenu (premières sections)


1. **Le PIB** : ses trois optiques (production, demande, revenus), la valeur ajoutée par activité, et une cascade qui sépare ce qui est vendu à des clients de ce qui est compté par convention (services publics au coût, loyers imputés, impôts sur les produits, amortissement).
2. **L'argent public** : diagramme de flux en cinq colonnes (qui paie → comment → quelle administration → pour quoi → qui reçoit), par tranche de niveau de vie.
3. **Couper la dépense ?** : simulateur du seuil de multiplicateur au-delà duquel une baisse de dépense fait monter le ratio dette/PIB la première année (m* = 1 / (dette/PIB + taux de prélèvements)).
4. **Sur 30 ans** : charge d'intérêts de la dette et dépenses par fonction depuis 1995.
5. **Comparer les pays** : 30 pays Eurostat (composition du PIB, dépenses par fonction, dette et intérêts, actifs et passifs).
6. **Énergie** : diagramme de flux du bilan énergétique (Eurostat), séries depuis 1965 (Our World in Data), électricité française en direct (RTE éCO2mix via ODRÉ), comparaison européenne.
7. **Matières, territoire, commerce, climat, eau, sols, alimentation, démographie, immigration, temps de travail, justice** : voir `scripts/build_matieres.py`, `build_territoire.py`, `build_themes.py` et les fichiers `matieres.js`, `territoire.js`, `themes.js`.
8. **Peut-on être autonome en agriculture sans intrants ?** : rendements depuis 1815 et par culture, engrais et pesticides, bio, simulateur des céréales (`scripts/build_rendements.py`, `rendements.js`).
9. **Patrimoine** : actifs et passifs de la France par secteur (ménages, entreprises, secteur financier, administrations).

## Fichiers

- `index.html`, `style.css`, `app.js` : la page.
- `lib/` : d3 7.9.0 et d3-sankey 0.12.3 (licences ISC / BSD incluses).
- `data/sources/` : fichiers bruts Eurostat (JSON-stat) et INSEE (xlsx).
- `data/finances.json` : données calculées, lues par la page.
- `scripts/fetch.sh` : retélécharge les sources.
- `scripts/build.py` : calcule `data/finances.json`, `data/comparaison.json` et `data/pays/*.json` (Python 3 + openpyxl).
- `scripts/build_energie.py` : calcule `data/energie/*.json`.
- `energie.js` : section Énergie (l'électricité en direct est chargée par le navigateur depuis odre.opendatasoft.com).

## Mettre à jour

```bash
bash scripts/fetch.sh
python3 scripts/build.py
python3 scripts/build_energie.py
python3 scripts/build_matieres.py
python3 scripts/fetch_regions.py   # électricité par région (ODRÉ), environ 2 minutes
python3 scripts/build_territoire.py
python3 scripts/build_themes.py
python3 scripts/build_rendements.py
```

Pour voir la page en local : `python3 -m http.server` dans ce dossier, puis ouvrir http://localhost:8000.

## Hypothèses principales

- Montants Eurostat de l'année choisie ; répartition par tranche selon les proportions des comptes nationaux distribués 2023 de l'INSEE (Insee Analyses n° 118).
- Flux entre administrations présentés en net ; transferts en capital entre administrations répartis au prorata faute de matrice détaillée.
- Dépenses par fonction de chaque administration ajustées (RAS) pour coïncider avec le total consolidé COFOG.
- Loyers imputés : série Eurostat CP042, prolongée au rythme moyen des 7 dernières années connues quand elle n'est pas encore publiée.
- Intérêts de la dette versés à un bloc « Prêteurs », non réparti par tranche.
