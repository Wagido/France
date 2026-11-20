#!/usr/bin/env python3
"""Date de dernière mise à jour réussie, rubrique par rubrique → data/maj.json.

  python3 scripts/maj.py                 calcule data/maj.json
  python3 scripts/maj.py marquer F...    note F (chemins relatifs à la racine) comme téléchargés aujourd'hui

Principe :
- data/sources/_dates.json : date du dernier téléchargement réussi de chaque fichier source (écrit par fetch.sh) ;
- data/sources/_builds.json : pour chaque calcul, les sources lues et les fichiers produits (écrit par run_builds.py) ;
- seules les sources téléchargées automatiquement comptent (les fichiers déposés à la main sont ignorés) ;
- un fichier produit est daté de sa source la PLUS ANCIENNE : si une source a échoué ce mois-ci, la rubrique
  garde la date de la dernière fois où tout a été rafraîchi ;
- une rubrique (section de index.html) est datée par les fichiers de données que chargent les scripts qui l'affichent.
"""
import datetime, json, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "data", "sources")
DATES = os.path.join(SRC, "_dates.json")


def charger(p, defaut):
    try:
        return json.load(open(p, encoding="utf-8"))
    except (OSError, ValueError):
        return defaut


def marquer(fichiers):
    d = charger(DATES, {})
    auj = datetime.date.today().isoformat()
    for f in fichiers:
        d[f] = auj
    json.dump(dict(sorted(d.items())), open(DATES, "w"), ensure_ascii=False, indent=1)


def sections_et_ids():
    """id d'élément → id de la section (rubrique) qui le contient."""
    html = open(os.path.join(ROOT, "index.html"), encoding="utf-8").read()
    owner, courant = {}, None
    for m in re.finditer(r'<section\b[^>]*\bid="([^"]+)"[^>]*class="[^"]*\bpanel\b|<section\b[^>]*class="[^"]*\bpanel\b[^"]*"[^>]*\bid="([^"]+)"|\bid="([^"]+)"', html):
        if m.group(1) or m.group(2):
            courant = m.group(1) or m.group(2)
            owner[courant] = courant
        elif courant:
            owner.setdefault(m.group(3), courant)
    scripts = re.findall(r'<script[^>]+src="([^"?]+\.js)', html)
    return owner, [s for s in scripts if not s.startswith(("http", "lib/"))]


def main():
    dates = charger(DATES, {})
    builds = charger(os.path.join(SRC, "_builds.json"), {})

    def dsrc(rel):
        # seules les sources téléchargées automatiquement (présentes dans _dates.json) datent une rubrique ;
        # les fichiers déposés à la main (rapports, référentiels fixes) ne sont jamais « en retard »
        return dates.get(rel)

    # 1. date de chaque fichier produit = plus ancienne de ses sources
    produit = {}
    for b, info in builds.items():
        ds = [d for d in (dsrc(s) for s in info.get("lus", []) if s.startswith("data/sources/") and not os.path.basename(s).startswith("_")) if d]
        d = min(ds) if ds else info.get("date")
        for e in info.get("ecrits", []):
            if e.startswith("data/sources/"):
                continue
            produit[e] = min(d, produit.get(e, d)) if d else produit.get(e)

    def dfichier(rel):
        if rel in produit:
            return produit[rel]
        return None  # fichier écrit à la main (pas de mise à jour automatique) : pas de date

    # 2. rubriques : ids touchés par chaque script → section ; fichiers chargés par le script
    owner, scripts = sections_et_ids()
    rub = {}
    for s in scripts:
        try:
            js = open(os.path.join(ROOT, s), encoding="utf-8").read()
        except OSError:
            continue
        motifs = set(re.findall(r'["\'`](data/[\w/.-]+\.json)', js))
        motifs |= {m.replace("${g}", "FR") for m in re.findall(r'`(data/[\w/.${}-]+\.json)`', js)}
        motifs = {m for m in motifs if "${" not in m and "/sources/" not in m and not m.endswith("maj.json")}
        if not motifs:
            continue
        ids = set(re.findall(r'getElementById\(\s*["\']([\w-]+)', js)) | set(re.findall(r'["\'`]#([A-Za-z][\w-]*)', js))
        secs = {owner[i] for i in ids if i in owner}
        for sec in secs:
            rub.setdefault(sec, set()).update(motifs)
    out = {}
    for sec, fs in sorted(rub.items()):
        ds = [d for d in (dfichier(f) for f in fs) if d]
        if ds:
            out[sec] = min(ds)
    json.dump({"genere_le": datetime.date.today().isoformat(), "rubriques": out}, open(os.path.join(ROOT, "data", "maj.json"), "w"), ensure_ascii=False, indent=0)
    print(f"data/maj.json : {len(out)} rubriques datées")


if __name__ == "__main__":
    if len(sys.argv) > 2 and sys.argv[1] == "marquer":
        marquer(sys.argv[2:])
    else:
        main()
