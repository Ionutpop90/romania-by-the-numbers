"""
Step 2 — Load, rank, test, export.

  1. Loads data/raw/*.csv into DuckDB and runs the SQL models in sql/.
  2. Robustness of the overall ranking: 2,000 bootstrap resamples of the indicator set
     (indicators drawn with replacement) give each country a 90% range for its overall rank.
  3. Exports tidy CSVs to data/processed/ and the payload to report/data.json.

Run:  python src/build_dataset.py
"""
from __future__ import annotations

import json
from datetime import date
from pathlib import Path

import duckdb
import numpy as np
import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
RAW, PROCESSED, SQL, REPORT = ROOT / "data" / "raw", ROOT / "data" / "processed", ROOT / "sql", ROOT / "report"
RNG = np.random.default_rng(11)
N_BOOT = 2000

COUNTRY = {
    "AT": "Austria", "BE": "Belgium", "BG": "Bulgaria", "CY": "Cyprus", "CZ": "Czechia", "DE": "Germany",
    "DK": "Denmark", "EE": "Estonia", "EL": "Greece", "ES": "Spain", "FI": "Finland", "FR": "France",
    "HR": "Croatia", "HU": "Hungary", "IE": "Ireland", "IT": "Italy", "LT": "Lithuania", "LU": "Luxembourg",
    "LV": "Latvia", "MT": "Malta", "NL": "Netherlands", "PL": "Poland", "PT": "Portugal", "RO": "Romania",
    "SE": "Sweden", "SI": "Slovenia", "SK": "Slovakia", "EU27": "EU-27",
}


def bootstrap_overall(profile: pd.DataFrame) -> pd.DataFrame:
    """90% interval of each country's overall rank when the indicator set is resampled."""
    score = profile.pivot(index="geo", columns="indicator", values="last_score")
    cols = score.columns.to_numpy()
    ranks = np.empty((N_BOOT, len(score)))
    for b in range(N_BOOT):
        pick = RNG.choice(cols, size=len(cols), replace=True)
        mean = score[pick].mean(axis=1, skipna=True)
        ranks[b] = mean.rank(ascending=False, method="min").to_numpy()
    return pd.DataFrame({"geo": score.index, "rank_p05": np.percentile(ranks, 5, axis=0),
                         "rank_p50": np.median(ranks, axis=0), "rank_p95": np.percentile(ranks, 95, axis=0)})


def main() -> None:
    PROCESSED.mkdir(parents=True, exist_ok=True)
    con = duckdb.connect(str(ROOT / "data" / "benchmark.duckdb"))
    for csv in sorted(RAW.glob("*.csv")):
        con.execute(f"CREATE OR REPLACE TABLE raw_{csv.stem} AS SELECT * FROM read_csv_auto('{csv.as_posix()}', all_varchar=true)")
    for sql_file in sorted(SQL.glob("*.sql")):
        con.execute(sql_file.read_text(encoding="utf-8"))

    profile = con.sql("SELECT * FROM mart_profile ORDER BY geo, domain, indicator").df()
    overall = con.sql("SELECT * FROM mart_overall").df().merge(bootstrap_overall(profile), on="geo")
    domain = con.sql("SELECT * FROM mart_domain").df()
    ranks = con.sql("SELECT indicator, geo, year, rank, value FROM mart_ranks ORDER BY indicator, geo, year").df()
    eu = con.sql("SELECT indicator, year, value FROM fact WHERE geo = 'EU27' ORDER BY indicator, year").df()
    context = con.sql("SELECT * FROM mart_context ORDER BY indicator, geo, year").df()
    dim = con.sql("SELECT * FROM dim_indicator").df()

    for name, df in {"profile": profile, "overall": overall, "domain": domain, "ranks": ranks, "context": context}.items():
        df.to_csv(PROCESSED / f"{name}.csv", index=False)

    rec = lambda df: df.astype(object).where(df.notna(), None).to_dict(orient="records")
    series = {}
    for (ind, geo), g in ranks.groupby(["indicator", "geo"]):
        series.setdefault(ind, {})[geo] = g[["year", "rank", "value"]].values.tolist()
    eu_series = {ind: g[["year", "value"]].values.tolist() for ind, g in eu.groupby("indicator")}
    ctx = {}
    for (ind, geo), g in context.groupby(["indicator", "geo"]):
        ctx.setdefault(ind, {})[geo] = g[["year", "value"]].values.tolist()

    payload = {
        "meta": {"generated": date.today().isoformat(), "n_boot": N_BOOT,
                 "windows": rec(con.sql("SELECT * FROM qa_windows").df())},
        "countries": COUNTRY,
        "indicators": rec(dim),
        "profile": rec(profile.round(4)),
        "overall": rec(overall.round(4)),
        "domain": rec(domain.round(4)),
        "ranks": series,
        "eu": eu_series,
        "context": ctx,
    }
    (REPORT / "data.json").write_text(json.dumps(payload, ensure_ascii=False, default=float), encoding="utf-8")

    ro = overall.set_index("geo").loc["RO"]
    print(f"Romania overall rank {int(ro.overall_rank)} (bootstrap 90%: {ro.rank_p05:.0f}–{ro.rank_p95:.0f}), "
          f"momentum rank {int(ro.momentum_rank)}; top {int(ro.n_top)} / bottom {int(ro.n_bottom)} / "
          f"climbing {int(ro.n_climbing)} / falling {int(ro.n_falling)}")
    print(f"payload: {(REPORT / 'data.json').stat().st_size / 1e3:.0f} kB")


if __name__ == "__main__":
    main()
