-- =====================================================================
-- 02 · MARTS — EU rankings for every country, indicator and year
-- =====================================================================

-- Rank 1 = best in the EU, using each indicator's "better" direction.
-- Ranks are computed only in years where at least 24 of 27 member states report,
-- so a rank of 20 always means roughly the same thing.
CREATE OR REPLACE VIEW mart_ranks AS
WITH m AS (
    SELECT f.*, d.better, count(*) OVER (PARTITION BY f.indicator, f.year) AS n
    FROM fact f JOIN dim_indicator d ON d.id = f.indicator
    WHERE f.geo <> 'EU27' AND d.better IS NOT NULL
)
SELECT indicator, geo, year, value, n,
       rank() OVER (PARTITION BY indicator, year ORDER BY CASE WHEN better = 'higher' THEN -value ELSE value END) AS rank,
       -- 1 = best, 0 = worst: comparable across indicators with different coverage
       1 - (rank() OVER (PARTITION BY indicator, year ORDER BY CASE WHEN better = 'higher' THEN -value ELSE value END) - 1) / (n - 1.0) AS score
FROM m
WHERE n >= 24;

-- Comparison window per indicator: first year from 2014 and latest year, both with full coverage
CREATE OR REPLACE VIEW dim_window AS
SELECT indicator, min(year) FILTER (WHERE year >= 2014) AS base_year, max(year) AS last_year
FROM (SELECT DISTINCT indicator, year FROM mart_ranks)
GROUP BY indicator;

-- One row per country × indicator: where it stood, where it stands, and against the EU average.
-- Base = first ranked year from 2014; latest = the country's own most recent ranked year
-- (so one late reporter, e.g. Romania's 2024 recycling figure, does not drop out).
CREATE OR REPLACE VIEW mart_country_indicator AS
WITH r AS (
    SELECT r.* FROM mart_ranks r JOIN dim_window w USING (indicator) WHERE r.year >= w.base_year
),
yrs AS (SELECT indicator, geo, min(year) AS base_year, max(year) AS last_year FROM r GROUP BY ALL),
eu AS (SELECT indicator, year, value FROM fact WHERE geo = 'EU27')
SELECT d.domain, d.label, d.unit, d.better, y.indicator, y.geo, y.base_year, y.last_year,
       b.value AS base_value, l.value AS last_value, b.rank AS base_rank, l.rank AS last_rank, l.n AS n_last,
       b.score AS base_score, l.score AS last_score,
       eb.value AS eu_base, el.value AS eu_last
FROM yrs y
JOIN dim_indicator d ON d.id = y.indicator
JOIN r b ON b.indicator = y.indicator AND b.geo = y.geo AND b.year = y.base_year
JOIN r l ON l.indicator = y.indicator AND l.geo = y.geo AND l.year = y.last_year
LEFT JOIN eu eb ON eb.indicator = y.indicator AND eb.year = y.base_year
LEFT JOIN eu el ON el.indicator = y.indicator AND el.year = y.last_year;

-- Classification: tier by latest rank (top / middle / bottom third), momentum by rank change
CREATE OR REPLACE VIEW mart_profile AS
SELECT *,
       base_rank - last_rank AS rank_change,              -- positive = climbed
       CASE WHEN last_rank <= 9 THEN 'Top third' WHEN last_rank >= 19 THEN 'Bottom third' ELSE 'Middle third' END AS tier,
       CASE WHEN base_rank - last_rank >= 3 THEN 'Climbing' WHEN base_rank - last_rank <= -3 THEN 'Falling' ELSE 'Holding' END AS momentum,
       -- gap to the EU average, signed so that positive = better than the EU
       CASE WHEN better = 'higher' THEN last_value - eu_last ELSE eu_last - last_value END AS gap_last,
       CASE WHEN better = 'higher' THEN base_value - eu_base ELSE eu_base - base_value END AS gap_base
FROM mart_country_indicator
WHERE last_rank IS NOT NULL;

-- Domain and overall standing per country (mean score, 1 = best in EU on everything)
CREATE OR REPLACE VIEW mart_domain AS
SELECT geo, domain,
       avg(base_score) AS base_score, avg(last_score) AS last_score, count(*) AS n_indicators
FROM mart_profile GROUP BY geo, domain;

CREATE OR REPLACE VIEW mart_overall AS
SELECT geo, avg(base_score) AS base_score, avg(last_score) AS last_score,
       avg(last_score) - avg(base_score) AS score_change,
       rank() OVER (ORDER BY avg(last_score) DESC) AS overall_rank,
       rank() OVER (ORDER BY avg(last_score) - avg(base_score) DESC) AS momentum_rank,
       count(*) FILTER (WHERE tier = 'Top third') AS n_top, count(*) FILTER (WHERE tier = 'Bottom third') AS n_bottom,
       count(*) FILTER (WHERE momentum = 'Climbing') AS n_climbing, count(*) FILTER (WHERE momentum = 'Falling') AS n_falling
FROM mart_profile GROUP BY geo;

-- Context: population change, migration, fertility
CREATE OR REPLACE VIEW mart_context AS
SELECT f.geo, f.indicator, f.year, f.value
FROM fact f JOIN dim_indicator d ON d.id = f.indicator
WHERE d.better IS NULL;

-- QA: coverage and comparison windows
CREATE OR REPLACE VIEW qa_windows AS
SELECT w.*, (SELECT max(n) FROM mart_ranks r WHERE r.indicator = w.indicator AND r.year = w.last_year) AS countries_last
FROM dim_window w ORDER BY indicator;
