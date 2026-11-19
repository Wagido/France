# GPS niveau 1 : lire et comprendre son récepteur

Objectif : écrire soi-même le décodage des trames NMEA d'un module GPS, calculer distance, cap et vitesse, puis mesurer expérimentalement la précision du GPS.

## Matériel (environ 25 €)
- ESP32 DevKit (environ 8 €)
- Module GPS u-blox NEO-6M ou NEO-M8N avec antenne (8 à 15 €) ; le M8N capte aussi GLONASS, Galileo et BeiDou
- 4 câbles Dupont ; optionnel : une batterie USB pour sortir dehors

## Câblage
| GPS | ESP32 |
|---|---|
| VCC | 3V3 (ou 5V selon le module) |
| GND | GND |
| TX | GPIO16 (RX2) |
| RX | GPIO17 (TX2) |

## Étapes
1. **Voir les trames brutes** : mettre `AFFICHER_BRUT = true`, téléverser `gps_nmea/gps_nmea.ino`, ouvrir le moniteur série à 115200 bauds. Sortir l'antenne à l'extérieur.
2. **Comprendre le parseur** : somme de contrôle (XOR), découpage des champs, conversion ddmm.mmmm en degrés décimaux, trames GGA (position, satellites, HDOP), RMC (vitesse, route), GSV (satellites visibles).
3. **Se déplacer** : distance au point de départ (haversine), cap, vitesse en nœuds et km/h, distance parcourue.
4. **Mesurer la précision** : GPS immobile 30 à 60 min, enregistrer la sortie, puis `python analyse_precision.py journal.txt` : nuage de points, CEP50 / CEP95, lien avec le HDOP, vue du ciel des satellites.
5. **Expériences** : comparer un endroit dégagé et le pied d'un immeuble (trajets multiples), la position horizontale et l'altitude, un démarrage à froid et à chaud.

## Pour aller plus loin
- Configurer le module avec les messages UBX (passer à 5 ou 10 Hz, activer Galileo)
- Ajouter un écran OLED ou une carte microSD
- Niveau 2 : récupérer les mesures brutes (pseudo-distances) d'un u-blox M8T/F9P et calculer la position soi-même
