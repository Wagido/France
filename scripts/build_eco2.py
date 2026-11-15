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
    """Comptes nationaux distribués par âge (INSEE, tableau CND.103), en euros par personne et par an."""
    import openpyxl
    wb = openpyxl.load_workbook(os.path.join(HERE, "..", "data", "sources", "insee_T_CND_103.xlsx"), data_only=True)
    sheet = sorted(n for n in wb.sheetnames if n.startswith("CND_"))[-1]
    rows = {}
    head = None
    for r in wb[sheet].iter_rows(values_only=True):
        if not r[0]:
            continue
        k = str(r[0]).strip()
        if k.startswith("Nature"):
            head = [str(x) for x in r[1:6]]
            continue
        try:
            rows[k] = [float(str(x).replace(",", ".")) for x in r[1:6]]
        except (TypeError, ValueError):
            pass
    def L(prefix):
        k = next(k for k in rows if k.startswith(prefix)); return rows[k]
    n = L("Nombre d'individus")                    # millions
    per = lambda v: [round(x * 1e9 / (m * 1e6)) for x, m in zip(v, n)]
    add = lambda *ls: [sum(x) for x in zip(*ls)]
    paye = [
        ("tva", "TVA, carburants et autres taxes sur les produits (nettes des subventions)", add(L("Taxes sur les produits"), L("Subventions sur les produits"))),
        ("production", "Taxes sur la production (nettes des aides)", add(L("Taxes sur la production"), L("Subventions sur la production"))),
        ("is", "Impôt sur les sociétés", L("Impôt sur les sociétés")),
        ("csg", "CSG", L("Contribution sociale généralisée")),
        ("ir", "Impôt sur le revenu", L("Impôt sur le revenu")),
        ("patrimoine", "Taxe foncière, IFI, autres", L("Autres impôts sur les revenus")),
        ("cot_retraite", "Cotisations retraite", L("Cotisations sociales retraite")),
        ("cot_autres", "Cotisations maladie, chômage, famille", add(L("Cotisations sociales chômage"), L("Cotisations sociales famille"), L("Autres cotisations sociales"))),
    ]
    argent = [
        ("retraites", "Retraites", L("Pensions de retraite")),
        ("chomage", "Allocations chômage", L("Allocations chômage")),
        ("ij", "Indemnités maladie, accidents du travail, invalidité", add(L("Autres revenus de remplacement"), L("Invalidité"))),
        ("famille", "Prestations familiales", L("Famille")),
        ("minima", "Minima sociaux, aides contre l'exclusion", L("Exclusion sociale")),
        ("complementaires", "Remboursements des complémentaires collectives", L("Remboursements des contrats collectifs")),
    ]
    services = [
        ("sante", "Santé", L("Santé")),
        ("ecole", "École et université (enfants comptés avec leurs parents)", L("Enseignement")),
        ("action_sociale", "Action sociale (dépendance, handicap, petite enfance)", L("Action sociale")),
        ("logement", "Aides au logement, chèque énergie", L("Aides au logement")),
        ("culture", "Culture et loisirs", L("Culture et loisirs")),
        ("collectif", "Services collectifs (défense, police, justice, routes, administration…)", add(L("Dépenses collectives"), L("Frais de fonctionnement"))),
    ]
    data = {"annee": int(sheet.split("_")[1]), "tranches": [h.split(". ", 1)[-1].replace("> 65 ans", "65 ans et plus") for h in head],
            "individus_millions": n, "revenu_primaire": per(L("Revenu primaire élargi")),
            "paye": [[k, l, per([-x for x in v])] for k, l, v in paye],
            "argent": [[k, l, per(v)] for k, l, v in argent],
            "services": [[k, l, per(v)] for k, l, v in services]}
    esp = json.load(open(os.path.join(HERE, "..", "data", "societe", "FR.json")))["sante"]["esperance"][-1]
    data["esperance"] = {"annee": esp["annee"], "ensemble": esp["t"], "femmes": esp["f"], "hommes": esp["h"]}
    return data


def succession():
    """Droits de succession et de donation perçus (Eurostat, impôts sur les transferts en capital, D91A)."""
    t = getter(jstat("gov_10a_taxag.json", os.path.join(HERE, "..", "data", "sources")))
    g = getter(jstat("nama_10_gdp.json", os.path.join(HERE, "..", "data", "sources")))
    out = []
    for y in range(2015, 2030):
        v = t(sector="S13", na_item="D91A", time=y)
        if v is not None:
            out.append({"annee": str(y), "md": round(v / 1000, 2), "pib": round(100 * v / g(na_item="B1GQ", time=y), 2) if g(na_item="B1GQ", time=y) else None})
    return out


def redistribution():
    """Ce que chaque décile paie et reçoit (INSEE, comptes nationaux distribués 2023, tableau complémentaire par vingtième)."""
    import openpyxl
    wb = openpyxl.load_workbook(os.path.join(HERE, "..", "data", "sources", "insee_IA118.xlsx"), data_only=True)
    ws = wb["Tableau complémentaire"]
    rows = {}
    for r in ws.iter_rows(min_row=4, values_only=True):
        if r[0] and isinstance(r[1], (int, float)):
            rows[str(r[0]).strip()] = [float(x or 0) for x in r[2:22]]   # 20 vingtièmes (tranches de 5 %)
    def L(prefix):
        return next(v for k, v in rows.items() if k.startswith(prefix))
    add = lambda *ls: [sum(x) for x in zip(*ls)]
    uc = L("Nombre d'unités de consommation")
    ind = L("Nombre d'individus")
    per = lambda v: [round(x * 1e9 / (u * 1e6)) for x, u in zip(v, uc)]
    neg = lambda v: [-x for x in v]
    paye = [
        ("tva", "TVA, carburants et autres taxes sur les produits", neg(add(L("Taxes sur les produits"), L("Subventions sur les produits")))),
        ("production", "Taxes sur la production (nettes des aides)", neg(add(L("Taxes sur la production"), L("Subventions sur la production")))),
        ("is", "Impôt sur les sociétés", neg(L("Impôt sur les sociétés"))),
        ("csg", "CSG", neg(L("Contribution sociale généralisée"))),
        ("ir", "Impôt sur le revenu", neg(L("Impôt sur le revenu"))),
        ("patrimoine", "Taxe d'habitation, IFI, CRDS, autres", neg(L("Autres impôts sur les revenus"))),
        ("cot_retraite", "Cotisations retraite", neg(L("Cotisations sociales retraite"))),
        ("cot_autres", "Cotisations maladie, chômage, famille", neg(add(L("Cotisations sociales chômage"), L("Cotisations sociales famille"), L("Autres cotisations sociales")))),
    ]
    argent = [
        ("retraites", "Retraites", L("Pensions de retraite")), ("chomage", "Allocations chômage", L("Allocations chômage")),
        ("ij", "Indemnités maladie, accidents du travail, invalidité", add(L("Autres revenus de remplacement"), L("Invalidité"))),
        ("famille", "Prestations familiales", L("Famille")), ("minima", "Minima sociaux, aides contre l'exclusion", L("Exclusion sociale")),
        ("complementaires", "Remboursements des complémentaires collectives", L("Remboursements des contrats collectifs")),
    ]
    services = [
        ("sante", "Santé", L("Santé")), ("ecole", "École et université", L("Enseignement")), ("action_sociale", "Action sociale (dépendance, handicap, petite enfance)", L("Action sociale")),
        ("logement", "Aides au logement, chèque énergie, gestion de la Sécurité sociale", add(L("Aides au logement"), L("Frais de fonctionnement"))),
        ("culture", "Culture et loisirs", L("Culture et loisirs")),
        ("collectif", "Services collectifs (défense, police, justice, routes, administration…)", add(L("Dépenses collectives"), L("Autres transferts et soldes"))),
    ]
    wb2 = wb["Figure 3b"]
    gini = []
    for r in wb2.iter_rows(min_row=3, values_only=True):
        if r[0] and r[1] is not None:
            try:
                gini.append([str(r[0]).strip(), float(str(r[1]).replace(",", "."))])
            except ValueError:
                pass
    return {"annee": 2023, "unite": "euros par unité de consommation et par an", "uc_millions": uc, "individus_millions": ind,
            "avant": per(L("Revenu primaire élargi")), "apres": per(L("Revenu élargi après transferts publics")),
            "paye": [[k, l, per(v)] for k, l, v in paye], "argent": [[k, l, per(v)] for k, l, v in argent],
            "services": [[k, l, per(v)] for k, l, v in services], "beneficiaires_nets": [round(x, 1) for x in L("Part d'individus bénéficiaires")],
            "gini": gini,
            "origine": [[k, l, per(v)] for k, l, v in [
                ("salaires", "Salaires (y compris cotisations)", add(L("Revenus salariaux nets"), L("Cotisations sociales (salariés"))),
                ("independants", "Revenus des indépendants (travail et capital mêlés)", L("Revenus mixtes des indépendants")),
                ("financier", "Intérêts, dividendes, assurance-vie", L("Revenus financiers nets")),
                ("loyers", "Loyers reçus et loyers « imputés » des propriétaires", L("Loyers réels et imputés")),
                ("profits", "Bénéfices gardés dans les entreprises détenues", L("Profits des entreprises non distribués"))]],
            "succession": succession()}


index = []
for p in PAYS:
    geo = p["code"]
    d = {"pays": geo, "nom": p["nom"], "population": population(geo), "industrie": industrie(geo)}
    if geo == "FR":
        d["cycle_de_vie"] = cycle_de_vie()
        d["redistribution"] = redistribution()
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
