#!/usr/bin/env python3
"""Lance tous les calculs (scripts/build_*.py) l'un après l'autre, sans s'arrêter au premier échec.

- Un calcul qui échoue laisse en place ses anciens fichiers de sortie (déjà enregistrés dans le dépôt) ;
  l'échec est ajouté à la liste des échecs ($ECHECS_FICHIER), et l'on passe au suivant.
- Chaque calcul est exécuté sous surveillance : on note les fichiers de data/sources/ qu'il lit et les
  fichiers de data/ qu'il écrit. Cela sert à dater chaque rubrique (scripts/maj.py).
Résultat : data/sources/_builds.json (par script : date du dernier succès, fichiers lus, fichiers écrits).
"""
import datetime, json, os, subprocess, sys, tempfile, time

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
SRC = os.path.join(ROOT, "data", "sources")
BUILDS = ["build.py", "build_energie.py", "build_matieres.py", "build_territoire.py", "build_themes.py", "build_societe.py",
          "build_eco2.py", "build_empreinte.py", "build_chomage.py", "build_histoire.py", "build_argent_prive.py",
          "build_repartition.py", "build_prelevements.py", "build_travail_vie.py", "build_niveau_vie.py", "build_prosperite.py",
          "build_exterieur.py", "build_desindustrialisation.py", "build_retraites.py", "build_competences.py", "build_couper.py",
          "build_logement.py", "build_environnement.py", "build_agriculture.py", "build_rendements.py", "build_monnaie.py",
          "build_echanges.py", "build_limites.py", "build_sociologie.py", "build_patrimoine_hist.py", "build_innovation.py", "build_generations.py", "build_climats.py"]

# Enveloppe exécutée dans le sous-processus : intercepte open() pour noter les lectures et écritures.
TRACE = r'''
import builtins, io, json, os, runpy, sys
script, journal = sys.argv[1], sys.argv[2]
racine = os.path.abspath(os.path.join(os.path.dirname(script), ".."))
lus, ecrits, _open = set(), set(), builtins.open
def suivi(f, mode="r", *a, **k):
    try:
        p = os.path.abspath(os.fspath(f))
        if p.startswith(os.path.join(racine, "data") + os.sep):
            rel = os.path.relpath(p, racine)
            (ecrits if any(c in mode for c in "wax+") else lus).add(rel)
    except TypeError:
        pass
    return _open(f, mode, *a, **k)
builtins.open = io.open = suivi
sys.argv = [script]
try:
    runpy.run_path(script, run_name="__main__")
finally:
    _open(journal, "w").write(json.dumps({"lus": sorted(lus), "ecrits": sorted(ecrits)}))
'''


def main():
    echecs_f = os.environ.get("ECHECS_FICHIER", os.path.join(SRC, "_echecs.txt"))
    jpath = os.path.join(SRC, "_builds.json")
    etat = json.load(open(jpath)) if os.path.exists(jpath) else {}
    today = datetime.date.today().isoformat()
    tracer = tempfile.NamedTemporaryFile("w", suffix=".py", delete=False); tracer.write(TRACE); tracer.close()
    nb_echecs = 0
    for b in BUILDS:
        path = os.path.join(HERE, b)
        if not os.path.exists(path):
            continue
        journal = tempfile.mktemp(suffix=".json")
        t0 = time.time()
        print(f"=== {b}", flush=True)
        r = subprocess.run([sys.executable, tracer.name, path, journal], cwd=ROOT, capture_output=True, text=True, timeout=1800)
        sys.stdout.write(r.stdout[-3000:])
        trace = json.load(open(journal)) if os.path.exists(journal) else {"lus": [], "ecrits": []}
        if r.returncode == 0:
            etat[b] = {"date": today, **trace}
            print(f"    ✓ {b} ({time.time() - t0:.0f} s, {len(trace['ecrits'])} fichiers écrits)")
        else:
            nb_echecs += 1
            err = (r.stderr.strip().splitlines() or ["?"])[-1][:200]
            print(f"    ✗ ÉCHEC : {b} — {err} (anciens fichiers conservés)")
            sys.stdout.write(r.stderr[-2000:])
            with open(echecs_f, "a") as f:
                f.write(f"{b}\tcalcul en échec : {err}\n")
            # les fichiers à moitié écrits par un calcul en échec sont restaurés depuis le dépôt
            for e in trace["ecrits"]:
                subprocess.run(["git", "checkout", "--", e], cwd=ROOT, capture_output=True)
        try:
            os.remove(journal)
        except OSError:
            pass
    os.remove(tracer.name)
    json.dump(dict(sorted(etat.items())), open(jpath, "w"), ensure_ascii=False, indent=1)
    print(f"\n{len(BUILDS) - nb_echecs} calculs réussis, {nb_echecs} en échec.")


if __name__ == "__main__":
    main()
