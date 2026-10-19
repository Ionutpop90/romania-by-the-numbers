-- =====================================================================
-- 01 · STAGING
-- =====================================================================

CREATE OR REPLACE MACRO geo_clean(g) AS CASE g WHEN 'EU27_2020' THEN 'EU27' ELSE g END;

CREATE OR REPLACE VIEW dim_indicator AS
SELECT id, domain, label, unit, NULLIF(better, '') AS better, dataset
FROM raw_catalogue;

CREATE OR REPLACE VIEW fact AS
SELECT indicator, geo_clean(geo) AS geo, year::INT AS year, value::DOUBLE AS value,
       coalesce(flag, '') LIKE '%b%' AS spliced
FROM raw_indicators
WHERE value IS NOT NULL;
