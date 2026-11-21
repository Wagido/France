#!/usr/bin/env python3
"""Onglet Retraites : « Les retraités vivent-ils mieux que les actifs ? » → data/generations.json

1. Consommation par âge de la personne de référence (Eurostat, enquêtes budget des ménages, hbs_exp_t135,
   hbs_car_t314, hbs_str_t225), indice 100 = ensemble des ménages, selon quatre façons de compter :
   par ménage, par personne, par équivalent adulte (échelle OCDE modifiée, méthode du Financial Times),
   par équivalent adulte hors loyers fictifs des propriétaires (poste COICOP 04.2).
2. Revenu disponible par unité de consommation, médiane par âge (Eurostat, EU-SILC, ilc_di03), indice 100 = ensemble.
3. Finances publiques, en points de PIB (Eurostat gov_10a_exp, gov_10a_main, gov_10a_taxag) et part des 65 ans
   ou plus (demo_pjanind) : écart depuis 1995 et dépense « vieillesse » à générosité constante.
"""
import json, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
G = os.path.join(ROOT, "data", "sources", "generations")


def table(nom):
    d = json.load(open(os.path.join(G, nom), encoding="utf-8"))
    dims, size = d["id"], d["size"]
    cats = [sorted(d["dimension"][k]["category"]["index"].items(), key=lambda x: x[1]) for k in dims]
    out = {}
    for idx, val in d["value"].items():
        i, key = int(idx), []
        for s, c in zip(reversed(size), reversed(cats)):
            key.append(c[i % s][0]); i //= s
        out[tuple(reversed(key))] = val
    return dims, out


def serie(nom, **filtre):
    """{(dims restantes): {annee: valeur}} pour les cases qui correspondent au filtre."""
    dims, out = table(nom)
    res = {}
    for k, v in out.items():
        c = dict(zip(dims, k))
        if all(c.get(a) == b for a, b in filtre.items()) and v is not None:
            res[c["time"]] = v
    return res


AGES = [("Y_LT30", "moins30"), ("Y30-44", "a30_44"), ("Y45-59", "a45_59"), ("Y_GE60", "plus60")]


def consommation():
    lignes = {m: [] for m in ("menage", "personne", "uc", "uc_hors_loyer")}
    tot_hh = serie("hbs_exp_t135.json", age="TOTAL", unit="PPS_HH")
    detail, doublons = [], []
    for an in sorted(tot_hh):
        hh = {a: serie("hbs_exp_t135.json", age=a, unit="PPS_HH").get(an) for a, _ in AGES + [("TOTAL", "")]}
        ae = {a: serie("hbs_exp_t135.json", age=a, unit="PPS_AE").get(an) for a, _ in AGES + [("TOTAL", "")]}
        per = {a: serie("hbs_car_t314.json", hhcaract="PER", age=a).get(an) for a, _ in AGES + [("TOTAL", "")]}
        poids = {a: serie("hbs_car_t314.json", hhcaract="PC_POP", age=a).get(an) for a, _ in AGES}
        loyer = {a: serie("hbs_str_t225.json", age=a, coicop="CP042").get(an) for a, _ in AGES}
        if None in hh.values() or None in ae.values() or None in per.values():
            continue
        sans_loyer = all(v == 0 for v in loyer.values())        # 1988 : loyers fictifs non relevés
        # part des loyers fictifs dans la consommation de l'ensemble des ménages (moyenne pondérée)
        r_tot = sum(poids[a] * hh[a] * loyer[a] / 1000 for a, _ in AGES) / sum(poids[a] * hh[a] for a, _ in AGES)
        r = {"menage": {}, "personne": {}, "uc": {}, "uc_hors_loyer": {}}
        for a, k in AGES:
            r["menage"][k] = round(100 * hh[a] / hh["TOTAL"], 1)
            r["personne"][k] = round(100 * (hh[a] / per[a]) / (hh["TOTAL"] / per["TOTAL"]), 1)
            r["uc"][k] = None if sans_loyer else round(100 * ae[a] / ae["TOTAL"], 1)
            r["uc_hors_loyer"][k] = round(100 * ae[a] * (1 - loyer[a] / 1000) / (ae["TOTAL"] * (1 - r_tot)), 1)
        prec = lignes["uc_hors_loyer"][-1] if lignes["uc_hors_loyer"] else None
        if prec and all(abs(prec[k] - r["uc_hors_loyer"][k]) < 0.2 and abs(lignes["menage"][-1][k] - r["menage"][k]) < 0.2 for _, k in AGES):
            doublons.append(int(an))    # vague identique à la précédente (même enquête nationale, prix convertis) : ignorée
            continue
        for m in lignes:
            lignes[m].append({"annee": int(an), **r[m]})
        detail.append({"annee": int(an), "personnes": {k: per[a] for a, k in AGES}, "personnes_tot": per["TOTAL"],
                       "loyer_fictif_pm": {k: loyer[a] for a, k in AGES}, "loyer_fictif_tot_pm": round(1000 * r_tot, 1),
                       "part_menages": {k: poids[a] for a, k in AGES}, "sans_loyer": sans_loyer,
                       "pps_menage": {k: hh[a] for a, k in AGES}, "pps_uc": {k: ae[a] for a, k in AGES}})
    return lignes, detail, doublons


def revenu():
    groupes = [("Y_LT18", "moins18"), ("Y18-24", "a18_24"), ("Y25-49", "a25_49"), ("Y50-64", "a50_64"), ("Y_GE65", "plus65")]
    tot = serie("ilc_di03.json", age="TOTAL", statinfo="MED_EI")
    s = {k: serie("ilc_di03.json", age=a, statinfo="MED_EI") for a, k in groupes}
    rows = []
    for an in sorted(tot, key=int):
        r = {"annee": int(an)}
        for _, k in groupes:
            v = s[k].get(an)
            r[k] = round(100 * v / tot[an], 1) if v else None
        rows.append(r)
    # années manquantes (passage de l'ancien panel européen à SILC) : trou explicite dans la courbe
    ans = [r["annee"] for r in rows]
    for a in range(min(ans), max(ans)):
        if a not in ans:
            rows.append({"annee": a, **{k: None for _, k in groupes}})
    rows.sort(key=lambda r: r["annee"])
    moy = {k: serie("ilc_di03.json", age=a, statinfo="MEAN_EI") for a, k in groupes}
    tot_m = serie("ilc_di03.json", age="TOTAL", statinfo="MEAN_EI")
    der = max(tot, key=int)
    return rows, {"annee": int(der), "median": {k: s[k].get(der) for _, k in groupes}, "median_tot": tot[der],
                  "moyen": {k: moy[k].get(der) for _, k in groupes}, "moyen_tot": tot_m[der]}


def finances():
    vieil = serie("cofog.json", cofog99="GF1002")
    sante = serie("cofog.json", cofog99="GF07")
    ens = serie("cofog.json", cofog99="GF09")
    inv = serie("invest.json")
    po = serie("prelevements.json")
    p65 = serie("demo.json", indic_de="PC_Y65_MAX")
    ans = sorted(set(vieil) & set(sante) & set(inv) & set(po) & set(p65), key=int)
    a0 = ans[0]
    gen0 = vieil[a0] / p65[a0]
    rows = []
    for a in ans:
        rows.append({"annee": int(a), "vieillesse": vieil[a], "sante": sante[a], "investissement": inv[a], "prelevements": po[a], "enseignement": ens.get(a),
                     "part65": p65[a],
                     "d_vieillesse": round(vieil[a] - vieil[a0], 2), "d_sante": round(sante[a] - sante[a0], 2),
                     "d_investissement": round(inv[a] - inv[a0], 2), "d_prelevements": round(po[a] - po[a0], 2),
                     "vieillesse_demo": round(gen0 * p65[a], 2),
                     "generosite": round(100 * vieil[a] / p65[a], 1)})
    return rows


def main():
    conso, detail, doublons = consommation()
    rev, rev_der = revenu()
    fin = finances()
    pns = serie("ilc_pns2.json", statinfo="R_MED_I", age="Y_GE60")
    out = {"consommation": conso, "consommation_detail": detail, "consommation_doublons": doublons, "revenu": rev, "revenu_dernier": rev_der,
           "ratio_60": [{"annee": int(a), "v": round(100 * v, 1)} for a, v in sorted(pns.items(), key=lambda x: int(x[0]))],
           "finances": fin}
    json.dump(out, open(os.path.join(ROOT, "data", "generations.json"), "w"), ensure_ascii=False, separators=(",", ":"))
    c = conso["uc"][-1]; f = fin[-1]
    print(f"generations.json : conso {conso['uc'][-1]['annee']} 60+ = {c['plus60']} (par UC), "
          f"vieillesse {fin[0]['annee']}→{f['annee']} {fin[0]['vieillesse']}→{f['vieillesse']} % PIB")


if __name__ == "__main__":
    main()
