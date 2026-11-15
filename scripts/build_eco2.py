#!/usr/bin/env python3
"""Construit data/eco2/<PAYS>.json et data/eco2/index.json :
- qui fait quoi : la population répartie entre salariés du privé, agents publics, indépendants, chômeurs, inactifs, retraités, enfants ;
- industrie et innovation ;
- pour la France, la vie en euros : ce que l'on paie et reçoit selon l'âge (comptes nationaux distribués de l'INSEE).
Usage (depuis finances/) :  python3 scripts/build_eco2.py
"""
import json, os

HERE = os.path.dirname(os.path.abspath(__file__))
exec(open(os.path.join(HERE, "build.py")).read().split("# ---------------------------------------------------------------- sources")[0])
SRC = os.path.join(HERE, "..", "data", "sources", "eco2")
OUT = os.path.join(HERE, "..", "data", "eco2")
os.makedirs(OUT, exist_ok=True)
PAYS = json.load(open(os.path.join(HERE, "..", "data", "themes", "index.json")))["pays"]
FP = json.load(open(os.path.join(SRC, "insee_fonction_publique.json")))
r = lambda x, n=1: None if x is None else round(x, n)


def Y(name, geo):
    return sorted({dict(k)["time"] for k in jstat(name, SRC, geo) if k != "__single__"})


def G(name, geo):
    return getter(jstat(name, SRC, geo))


# ------------------------------------------------------------------ qui fait quoi
def population(geo):
    pb, pg, se, ig = G("demo_pjanbroad.json", geo), G("lfsa_pganws.json", geo), G("lfsa_esgaed.json", geo), G("lfsa_igar.json", geo)
    out = []
    for y in Y("lfsa_pganws.json", geo):
        tot = pb(age="TOTAL", time=y); enf = pb(age="Y_LT15", time=y); p65 = pb(age="Y_GE65", time=y)
        emp = pg(age="Y15-64", wstatus="EMP", time=y); une = pg(age="Y15-64", wstatus="UNE", time=y)
        ina = pg(age="Y15-64", wstatus="INAC", time=y); pop1564 = pg(age="Y15-64", wstatus="POP", time=y)
        emp15 = pg(age="Y_GE15", wstatus="EMP", time=y); une15 = pg(age="Y_GE15", wstatus="UNE", time=y)
        if None in (tot, enf, p65, emp, une, ina, pop1564):
            continue
        k = 1000.0
        emp65 = max(0.0, (emp15 or emp) - emp) * k
        self_ = (se(age="Y15-64", wstatus="SELF", time=y) or 0) * k
        sal = emp * k - self_
        fp = FP.get("TOT", {}).get(y) if geo == "FR" else None
        # inactifs de 15-64 ans répartis par âge : 15-24 ans (surtout étudiants), 25-54 ans (famille, santé…), 55-64 ans (surtout retraités)
        k = 1000.0
        i1524, i2554, i5564 = (pg(age=a, wstatus="INAC", time=y) for a in ["Y15-24", "Y25-54", "Y55-64"])
        ina_k = ina * k
        if None not in (i1524, i2554, i5564):
            parts = {"inactif_jeunes": i1524 * k, "inactif_25_54": i2554 * k, "inactif_55_64": i5564 * k}
        else:
            parts = {"inactif_25_54": ina_k}
        rec = {"annee": y, "total": tot, "enfants": enf, "plus65": p65,
               "salaries_prives": sal - fp * k if fp else None, "agents_publics": fp * k if fp else None, "salaries": sal,
               "independants": self_, "chomeurs": une * k, **parts,
               "seniors_actifs": emp65, "seniors_retraites": max(0.0, p65 - emp65 - max(0.0, ((une15 or une) - une) * k)),
               "fp_detail": {v: FP[v].get(y) for v in ["FPE", "FPT", "FPH"]} if fp else None}
        # écart avec la population totale (15-64 ans hors ménages ordinaires, arrondis)
        somme = enf + emp * k + une * k + ina_k + p65
        rec["hors_menages"] = tot - somme
        out.append(rec)
    return out or None


# ------------------------------------------------------------------ industrie et innovation
def industrie(geo):
    rd, rs, va, em, ip, ht, ai = (G(n, geo) for n in ["rd_e_gerdtot.json", "rd_p_persocc.json", "nama_10_a10.json", "nama_10_a10_e.json",
                                                     "sts_inpr_a.json", "htec_emp_nat2.json", "isoc_eb_ai.json"])
    serie = []
    years = sorted(set(Y("nama_10_a10.json", geo)) | set(Y("rd_e_gerdtot.json", geo)) | set(Y("sts_inpr_a.json", geo)))
    for y in years:
        t, c = va(nace_r2="TOTAL", time=y), va(nace_r2="C", time=y)
        et, ec = em(nace_r2="TOTAL", time=y), em(nace_r2="C", time=y)
        rec = {"annee": y, "part_industrie": r(100 * c / t, 2) if t and c else None, "part_emploi_industrie": r(100 * ec / et, 2) if et and ec else None,
               "emploi_industrie": ec, "rd_pib": rd(sectperf="TOTAL", unit="PC_GDP", time=y), "rd_entreprises_pib": rd(sectperf="BES", unit="PC_GDP", time=y),
               "rd_public_pib": (rd(sectperf="GOV", unit="PC_GDP", time=y) or 0) + (rd(sectperf="HES", unit="PC_GDP", time=y) or 0) or None,
               "rd_meur": rd(sectperf="TOTAL", unit="MIO_EUR", time=y), "chercheurs": rs(sectperf="TOTAL", time=y),
               "chercheurs_entreprises": rs(sectperf="BES", time=y), "production_industrielle": ip(nace_r2="C", time=y),
               "emploi_hightech": ht(nace_r2="HTC", time=y), "emploi_savoir": ht(nace_r2="KIS", time=y), "ia": ai(time=y)}
        if any(v is not None for k, v in rec.items() if k != "annee"):
            serie.append(rec)
    return serie or None


# ------------------------------------------------------------------ la vie en euros (France)
def cycle_de_vie():
    import openpyxl
    wb = openpyxl.load_workbook(os.path.join(HERE, "..", "data", "sources", "insee_IA118.xlsx"), data_only=True)
    ws = wb["Figure 1e"]
    rows = {str(r[0]).strip(): r[1:] for r in ws.iter_rows(min_row=1, values_only=True) if r[0]}
    head = next(v for k, v in rows.items() if k.startswith("Nature"))
    ages = [str(h).replace("\xa0", " ") for h in head if h and "Ensemble" not in str(h)]
    def line(prefix):
        k = next(k for k in rows if k.startswith(prefix)); return [float(x) for x in rows[k][:len(ages)]]
    data = {"tranches": ages, "revenu_primaire": line("Revenu primaire"), "prelevements": line("Prélèvements"),
            "prestations": line("Prestations sociales"), "non_monetaires": line("Transferts non monétaires"),
            "niveau_vie": line("Niveau de vie élargi (après"), "part_individus": line("Part d'individus")}
    # coût de l'école par élève (France, Eurostat) pour la période 0-17 ans
    fin = getter(jstat("educ_uoe_fini04.json", os.path.join(HERE, "..", "data", "sources", "societe"), "FR"))
    fy = max(y for y in range(2013, 2030) if fin(isced11="ED1", unit="EUR", time=y) is not None)
    data["ecole"] = {"annee": fy, "maternelle": fin(isced11="ED02", unit="EUR", time=fy), "primaire": fin(isced11="ED1", unit="EUR", time=fy),
                     "college": fin(isced11="ED2", unit="EUR", time=fy), "lycee": fin(isced11="ED3_4", unit="EUR", time=fy),
                     "superieur": fin(isced11="ED5-8", unit="EUR", time=fy)}
    esp = json.load(open(os.path.join(HERE, "..", "data", "societe", "FR.json")))["sante"]["esperance"][-1]
    data["esperance"] = {"annee": esp["annee"], "ensemble": esp["t"], "femmes": esp["f"], "hommes": esp["h"]}
    data["annee"] = 2023
    return data


index = []
for p in PAYS:
    geo = p["code"]
    d = {"pays": geo, "nom": p["nom"], "population": population(geo), "industrie": industrie(geo)}
    if geo == "FR":
        d["cycle_de_vie"] = cycle_de_vie()
    json.dump(d, open(os.path.join(OUT, geo + ".json"), "w"), ensure_ascii=False, separators=(",", ":"))
    s = {"code": geo, "nom": p["nom"]}
    if d["population"]:
        q = d["population"][-1]
        s["population"] = {"annee": q["annee"], "salaries": q["salaries"] / q["total"] * 100, "independants": q["independants"] / q["total"] * 100,
                           "chomeurs": q["chomeurs"] / q["total"] * 100, "enfants": q["enfants"] / q["total"] * 100, "plus65": q["plus65"] / q["total"] * 100,
                           "emploi": (q["salaries"] + q["independants"] + q["seniors_actifs"]) / q["total"] * 100}
    if d["industrie"]:
        last = lambda k: next((x[k] for x in reversed(d["industrie"]) if x[k] is not None), None)
        s["industrie"] = {k: last(k) for k in ["part_industrie", "part_emploi_industrie", "rd_pib", "rd_entreprises_pib", "emploi_hightech", "ia"]}
        s["industrie"]["chercheurs_1000"] = (last("chercheurs") or 0) / (q["total"] if d["population"] else 1) * 1000 if d["population"] and last("chercheurs") else None
    index.append(s)
    print(geo, "population" if d["population"] else "-", "industrie" if d["industrie"] else "-")
json.dump({"pays": index}, open(os.path.join(OUT, "index.json"), "w"), ensure_ascii=False, separators=(",", ":"))
