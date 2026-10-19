"""
Step 1 — Extract.
Downloads every indicator in the benchmark catalogue (src/catalogue.py) for all
27 member states + the EU-27 aggregate from the Eurostat API, plus demographic
context series, and stores them in data/raw/ in one long table.

Run:  python src/fetch_data.py
"""
from __future__ import annotations

import itertools
from pathlib import Path

import pandas as pd
import requests

from catalogue import CONTEXT, INDICATORS

RAW = Path(__file__).resolve().parents[1] / "data" / "raw"
API = "https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/{dataset}"
EU27 = ["AT", "BE", "BG", "CY", "CZ", "DE", "DK", "EE", "EL", "ES", "FI", "FR", "HR", "HU",
        "IE", "IT", "LT", "LU", "LV", "MT", "NL", "PL", "PT", "RO", "SE", "SI", "SK"]
GEO = EU27 + ["EU27_2020"]
SINCE = "2012"


def fetch(dataset: str, filters: dict) -> pd.DataFrame:
    """Query one Eurostat dataset and flatten the JSON-stat cube into a long DataFrame."""
    query = [("format", "JSON"), ("lang", "EN"), ("sinceTimePeriod", SINCE)] + [("geo", g) for g in GEO]
    for key, value in filters.items():
        for v in value if isinstance(value, (list, tuple)) else [value]:
            query.append((key, v))
    resp = requests.get(API.format(dataset=dataset), params=query, timeout=240)
    resp.raise_for_status()
    js = resp.json()
    dims, sizes = js["id"], js["size"]
    codes = [sorted(js["dimension"][d]["category"]["index"].items(), key=lambda kv: kv[1]) for d in dims]
    values, status = js.get("value", {}), js.get("status", {})
    rows = []
    for flat, combo in enumerate(itertools.product(*[range(s) for s in sizes])):
        if str(flat) in values:
            row = {d: codes[i][combo[i]][0] for i, d in enumerate(dims)}
            rows.append({"geo": row["geo"], "year": int(str(row["time"])[:4]), "value": values[str(flat)],
                         "flag": status.get(str(flat), "")})
    return pd.DataFrame(rows)


def main() -> None:
    RAW.mkdir(parents=True, exist_ok=True)
    frames = []
    for ind in INDICATORS + CONTEXT:
        if "splice" in ind:  # newer definition first; older years filled from the previous definition
            parts = [fetch(ind["dataset"], ind["filters"] | extra).assign(flag=lambda d, k=k: d.flag + ("b" if k else ""))
                     for k, extra in enumerate(ind["splice"])]
            df = pd.concat(parts).drop_duplicates(subset=["geo", "year"], keep="first")
        else:
            df = fetch(ind["dataset"], ind["filters"])
        df.insert(0, "indicator", ind["id"])
        frames.append(df)
        n_geo = df.geo.nunique()
        print(f"  {ind['id']:<22} {ind['dataset']:<16} {len(df):>5} rows  {n_geo:>2} geos  {df.year.min()}-{df.year.max()}")
    pd.concat(frames, ignore_index=True).to_csv(RAW / "indicators.csv", index=False)
    pd.DataFrame([{k: v for k, v in i.items() if k not in ("filters", "splice")} | {"filters": str(i["filters"])} for i in INDICATORS + CONTEXT]) \
        .to_csv(RAW / "catalogue.csv", index=False)
    print(f"Done -> {RAW}")


if __name__ == "__main__":
    main()
