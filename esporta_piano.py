# Esporta il piano dieta di Max e Vale in piano.json per l'app CheManca?.
# Legge i dati da genera_piano.py (la stessa fonte del PDF), quindi il piano
# dell'app e quello stampato non possono divergere.
#
# Uso:  python esporta_piano.py                       -> prende l'ultimo "N° MESE"
#       python esporta_piano.py "..\DIETA MAX E VALE\3° MESE\genera_piano.py" 2026-11-09
import importlib.util
import json
import re
import sys
from datetime import date
from pathlib import Path

QUI = Path(__file__).parent
DIETA = QUI.parent / "DIETA MAX E VALE"
NOMI_PASTI = {"COLAZIONE": "Colazione", "METÀ<br>MATTINA": "Metà mattina", "PRANZO": "Pranzo",
              "MERENDA": "Merenda", "CENA": "Cena"}


def ultimo_mese():
    mesi = [p for p in DIETA.iterdir() if p.is_dir() and re.match(r"\d+° MESE", p.name)]
    mesi.sort(key=lambda p: int(p.name.split("°")[0]))
    return mesi[-1] / "genera_piano.py"


def carica(percorso):
    spec = importlib.util.spec_from_file_location("genera_piano", percorso)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def data_inizio(mod, percorso):
    """La data del piano sta nel commento in testa: 'piani del 12/10/2026'."""
    testo = Path(percorso).read_text(encoding="utf-8")
    m = re.search(r"piani? del (\d{2})/(\d{2})/(\d{4})", testo)
    if not m:
        sys.exit("Data di inizio non trovata: passala come secondo argomento (AAAA-MM-GG)")
    g, me, a = map(int, m.groups())
    return date(a, me, g).isoformat()


def pasto(voci_py, nome):
    out = {"pasto": nome, "libero": False, "piatti": [], "voci": []}
    for v in voci_py:
        if v[0] == "!":
            out["libero"] = True
            continue
        if v[0] == "#":
            out["piatti"].append(v[1].capitalize())
            continue
        nome_al, m, w, u = v
        if u == "qb":
            continue
        out["voci"].append({"nome": nome_al.removeprefix("- "), "max": m, "vale": w, "u": u})
    return out


def main():
    percorso = Path(sys.argv[1]) if len(sys.argv) > 1 else ultimo_mese()
    mod = carica(percorso)
    inizio = sys.argv[2] if len(sys.argv) > 2 else data_inizio(mod, percorso)

    settimane = []
    for sett, _ in mod.SETTIMANE:
        giorni = []
        for g in range(7):
            giorni.append([pasto(sett[p][g], NOMI_PASTI[p]) for p in mod.PASTI])
        settimane.append(giorni)

    categorie = {cat: nomi for cat, nomi in mod.CATEGORIE.items()}
    piano = {
        "inizio": inizio,
        "fonte": f"{percorso.parent.name}/{percorso.name}",
        "settimane": settimane,
        # fissi di ogni giorno, fuori dalla tabella dei pasti
        "extra": [
            {"nome": "Cioccolato fondente", "max": 10, "vale": None, "u": "g"},
            {"nome": "Olio extra vergine di oliva", "max": 4, "vale": 4, "u": "cucchiaini"},
        ],
        "categorie": categorie,
    }
    dest = QUI / "piano.json"
    dest.write_text(json.dumps(piano, ensure_ascii=False, indent=1), encoding="utf-8")
    voci = {v["nome"] for s in settimane for g in s for p in g for v in p["voci"]}
    print(f"scritto {dest.name}: piano dal {inizio}, {len(settimane)} settimane, {len(voci)} alimenti")


if __name__ == "__main__":
    main()
