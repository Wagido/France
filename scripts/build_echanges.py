#!/usr/bin/env python3
"""Échanges d'électricité de la France avec l'étranger : volumes (Eurostat nrg_cb_e) et valeurs (Comext, produit 2716).
Sortie : data/echanges_elec.json"""
import json, os
HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, "..", "data", "sources", "energie")
cx = json.load(open(os.path.join(SRC, "comext_2716.json")))
T = cx["dimension"]["time"]["category"]["index"]; F = cx["dimension"]["flow"]["category"]["index"]; I = cx["dimension"]["indicators"]["category"]["index"]
nt, ni = len(T), len(I)
val = lambda f, y: cx["value"].get(str((F[f] * ni + I["VALUE_IN_EUROS"]) * nt + T[y]))
eb = json.load(open(os.path.join(SRC, "nrg_cb_e_echanges.json")))
T2 = eb["dimension"]["time"]["category"]["index"]; B = eb["dimension"]["nrg_bal"]["category"]["index"]; nt2 = len(T2)
vol = lambda b, y: eb["value"].get(str(B[b] * nt2 + T2[y])) if y in T2 else None
out = []
for y in sorted(T2):
    vi, ve = val("1", y), val("2", y)
    qi, qe = vol("IMP", y), vol("EXP", y)
    if not (vi and ve and qi and qe): continue
    out.append({"annee": int(y), "imp_twh": round(qi / 1000, 1), "exp_twh": round(qe / 1000, 1), "imp_md": round(vi / 1e9, 2), "exp_md": round(ve / 1e9, 2),
                "solde_md": round((ve - vi) / 1e9, 2), "prix_exp": round(ve / (qe * 1000), 1), "prix_imp": round(vi / (qi * 1000), 1)})
# prix de l'électricité pour les ménages (Eurostat nrg_pc_204, consommation 2 500-5 000 kWh, €/kWh)
pc = json.load(open(os.path.join(SRC, "nrg_pc_204.json")))
ids, sz = pc["id"], pc["size"]
def ix(**k):
    i = 0
    for dim, n in zip(ids, sz):
        c = pc["dimension"][dim]["category"]["index"]; i = i * n + (c[k[dim]] if dim in k else 0)
    return i
prix = []
for t in sorted(pc["dimension"]["time"]["category"]["index"]):
    r = {"periode": t, "annee": int(t[:4]) + (0.5 if t.endswith("S2") else 0)}
    for g in pc["dimension"]["geo"]["category"]["index"]:
        r[g.split("_")[0].lower()] = pc["value"].get(str(ix(geo=g, time=t, tax="I_TAX")))
        r[g.split("_")[0].lower() + "_ht"] = pc["value"].get(str(ix(geo=g, time=t, tax="X_TAX")))
    prix.append(r)
json.dump({"prix_menages": prix, "serie": out}, open(os.path.join(HERE, "..", "data", "echanges_elec.json"), "w"), ensure_ascii=False, indent=1)
print(len(out), out[-1])
