"""
GPS niveau 1 : analyse de la précision d'un récepteur immobile.

1. Laissez le GPS immobile 30 à 60 minutes (balcon, jardin, puis à côté d'un mur pour comparer).
2. Enregistrez la sortie du moniteur série dans un fichier texte (ex. : journal.txt).
   Avec PlatformIO : pio device monitor > journal.txt ; avec l'IDE Arduino : copier-coller.
3. Lancez : python analyse_precision.py journal.txt
Dépendances : pip install numpy matplotlib
"""
import sys
import math
import numpy as np
import matplotlib.pyplot as plt

R = 6371000.0  # rayon terrestre moyen (m)

def lire(fichier):
    pts, sats = [], {}
    with open(fichier, encoding="utf-8", errors="ignore") as f:
        for ligne in f:
            ligne = ligne.strip()
            if ligne.startswith("CSV,"):
                c = ligne.split(",")
                try:
                    pts.append(dict(lat=float(c[2]), lon=float(c[3]), alt=float(c[4]),
                                    sats=int(c[5]), hdop=float(c[6])))
                except (ValueError, IndexError):
                    pass
            elif ligne.startswith("SAT,"):
                c = ligne.split(",")  # SAT,constellation,id,élévation,azimut,SNR
                if len(c) >= 6 and c[3] and c[4]:
                    sats[(c[1], c[2])] = (float(c[3]), float(c[4]), float(c[5]) if c[5] else 0.0)
    return pts, sats

def main(fichier):
    pts, sats = lire(fichier)
    if len(pts) < 10:
        sys.exit("Pas assez de points : vérifiez que le fichier contient des lignes 'CSV,...' avec un fix.")
    lat = np.array([p["lat"] for p in pts]); lon = np.array([p["lon"] for p in pts])
    alt = np.array([p["alt"] for p in pts]); hdop = np.array([p["hdop"] for p in pts])
    nsat = np.array([p["sats"] for p in pts])

    # Projection locale en mètres autour de la position moyenne (approximation plane, valable sur quelques km)
    lat_m, lon_m = lat.mean(), lon.mean()
    est = np.radians(lon - lon_m) * R * math.cos(math.radians(lat_m))
    nord = np.radians(lat - lat_m) * R
    r = np.hypot(est, nord)

    cep50, cep95 = np.percentile(r, 50), np.percentile(r, 95)
    print(f"{len(pts)} positions")
    print(f"Position moyenne : {lat_m:.7f}, {lon_m:.7f}")
    print(f"Écart-type est/nord : {est.std():.2f} m / {nord.std():.2f} m ; altitude : {alt.std():.2f} m")
    print(f"CEP50 (la moitié des points dans ce rayon) : {cep50:.2f} m")
    print(f"CEP95 : {cep95:.2f} m")
    print(f"Satellites utilisés : {nsat.min()} à {nsat.max()} ; HDOP moyen : {hdop.mean():.2f}")
    print("L'altitude est en général 1,5 à 2 fois moins précise que la position horizontale : les satellites sont tous au-dessus de vous, jamais en dessous.")

    fig, ax = plt.subplots(1, 3, figsize=(15, 5))
    ax[0].scatter(est, nord, s=4, c=np.arange(len(est)), cmap="viridis")
    for rayon, nom in [(cep50, "CEP50"), (cep95, "CEP95")]:
        ax[0].add_patch(plt.Circle((0, 0), rayon, fill=False, ls="--"))
        ax[0].annotate(nom, (rayon * 0.7, rayon * 0.7))
    ax[0].set_aspect("equal"); ax[0].set_xlabel("Est (m)"); ax[0].set_ylabel("Nord (m)")
    ax[0].set_title("Nuage de positions d'un GPS immobile")

    t = np.arange(len(r))
    ax[1].plot(t, r, lw=0.8, label="erreur (m)")
    ax[1].plot(t, hdop * cep50 / max(hdop.mean(), 0.1), lw=0.8, label="HDOP (mis à l'échelle)")
    ax[1].set_xlabel("échantillon"); ax[1].legend(); ax[1].set_title("L'erreur suit-elle le HDOP ?")

    # Vue du ciel (skyplot) : azimut = angle, élévation = 90° au centre, 0° au bord
    ax[2].remove(); sp = fig.add_subplot(1, 3, 3, projection="polar")
    sp.set_theta_zero_location("N"); sp.set_theta_direction(-1); sp.set_rlim(90, 0)
    for (cons, sid), (el, az, snr) in sats.items():
        sp.scatter(math.radians(az), el, s=20 + 4 * snr, c=[[min(snr, 50) / 50, 0.3, 1 - min(snr, 50) / 50]])
        sp.annotate(f"{cons}{sid}", (math.radians(az), el), fontsize=7)
    sp.set_title("Satellites visibles (taille et couleur = rapport signal/bruit)")
    plt.tight_layout(); plt.show()

if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "journal.txt")
