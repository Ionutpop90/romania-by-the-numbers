"""
The benchmark catalogue: 38 ranked indicators in 7 domains + demographic context.

Each entry: id, domain, label, unit, better ('higher' | 'lower'), Eurostat dataset and filters.
Directions follow the EU's own policy framing (SDG monitoring report) wherever an
indicator is part of it.
"""

INDICATORS = [
    # --- Economy & public finances ---
    dict(id="gdp_pc_pps", domain="Economy", label="GDP per person (purchasing power, EU = 100)", unit="EU = 100", better="higher",
         dataset="prc_ppp_ind", filters=dict(na_item="VI_PPS_EU27_2020_HAB", ppp_cat="GDP")),
    dict(id="employment", domain="Economy", label="Employment rate, age 20–64", unit="%", better="higher",
         dataset="sdg_08_30", filters=dict(sex="T", age="Y20-64", unit="PC_POP")),
    dict(id="unemployment", domain="Economy", label="Unemployment rate", unit="%", better="lower",
         dataset="une_rt_a", filters=dict(sex="T", age="Y15-74", unit="PC_ACT")),
    dict(id="neet", domain="Economy", label="Young people not in work or education (15–29)", unit="%", better="lower",
         dataset="sdg_08_20", filters=dict(sex="T", age="Y15-29", unit="PC_POP")),
    dict(id="gender_emp_gap", domain="Economy", label="Gender employment gap", unit="pp", better="lower",
         dataset="sdg_05_30", filters=dict(wstatus="EMP", age="Y20-64", unit="PC_PNT")),
    dict(id="gov_debt", domain="Economy", label="Government debt", unit="% of GDP", better="lower",
         dataset="sdg_17_40", filters=dict(unit="PC_GDP", sector="S13", na_item="GD")),
    dict(id="gov_balance", domain="Economy", label="Government budget balance", unit="% of GDP", better="higher",
         dataset="gov_10dd_edpt1", filters=dict(unit="PC_GDP", sector="S13", na_item="B9")),

    # --- Living standards & society ---
    dict(id="arope", domain="Society", label="At risk of poverty or social exclusion", unit="%", better="lower",
         dataset="sdg_01_10", filters=dict(age="TOTAL", unit="PC")),
    dict(id="severe_deprivation", domain="Society", label="Severe material & social deprivation", unit="%", better="lower",
         dataset="sdg_01_31", filters=dict(age="TOTAL", sex="T", unit="PC")),
    dict(id="income_inequality", domain="Society", label="Income inequality (top 20% vs bottom 20%)", unit="ratio", better="lower",
         dataset="sdg_10_41", filters=dict(age="TOTAL", sex="T", unit="RAT")),
    dict(id="housing_deprivation", domain="Society", label="Severe housing deprivation", unit="%", better="lower",
         dataset="sdg_11_11", filters=dict(age="TOTAL", rskpovth="TOTAL", sex="T", unit="PC")),
    dict(id="housing_cost_burden", domain="Society", label="Housing cost overburden", unit="%", better="lower",
         dataset="ilc_lvho07a", filters=dict(age="TOTAL", sex="T", rskpovth="TOTAL", unit="PC")),
    dict(id="cold_home", domain="Society", label="Cannot keep home adequately warm", unit="%", better="lower",
         dataset="sdg_07_60", filters=dict(hhcomp="TOTAL", rskpovth="TOTAL", unit="PC")),
    dict(id="crime", domain="Society", label="Report crime, violence or vandalism in their area", unit="%", better="lower",
         dataset="sdg_16_20", filters=dict(hhcomp="TOTAL", rskpovth="TOTAL", unit="PC")),

    # --- Health ---
    dict(id="life_exp", domain="Health", label="Life expectancy at birth", unit="years", better="higher",
         dataset="demo_mlexpec", filters=dict(sex="T", age="Y_LT1", unit="YR")),
    dict(id="infant_mortality", domain="Health", label="Infant mortality", unit="per 1,000 births", better="lower",
         dataset="tps00027", filters=dict(unit="RT", indic_de="INFMORRT")),
    dict(id="preventable_mort", domain="Health", label="Preventable deaths", unit="per 100k", better="lower",
         dataset="sdg_03_42", filters=dict(mortalit="PRVT", sex="T", icd10="TOTAL", unit="RT")),
    dict(id="treatable_mort", domain="Health", label="Treatable deaths", unit="per 100k", better="lower",
         dataset="sdg_03_42", filters=dict(mortalit="TRT", sex="T", icd10="TOTAL", unit="RT")),
    dict(id="road_deaths", domain="Health", label="Road traffic deaths", unit="per 100k", better="lower",
         dataset="sdg_11_40", filters=dict(tra_infr="TOTAL", unit="RT")),
    dict(id="obesity", domain="Health", label="Adult obesity", unit="%", better="lower",
         dataset="sdg_02_10", filters=dict(unit="PC", bmi="BMI_GE30")),

    # --- Education & skills ---
    dict(id="early_leavers", domain="Education", label="Early leavers from education (18–24)", unit="%", better="lower",
         dataset="sdg_04_10", filters=dict(unit="PC", wstatus="POP", age="Y18-24", sex="T")),
    dict(id="tertiary", domain="Education", label="University degree, age 25–34", unit="%", better="higher",
         dataset="sdg_04_20", filters=dict(sex="T", age="Y25-34", unit="PC", isced11="ED5-8")),
    dict(id="low_math", domain="Education", label="15-year-olds low-achieving in maths (PISA)", unit="%", better="lower",
         dataset="sdg_04_40", filters=dict(field="EF461", sex="T", unit="PC")),
    dict(id="adult_learning", domain="Education", label="Adults in learning (last 4 weeks)", unit="%", better="higher",
         dataset="sdg_04_60", filters=dict(unit="PC", age="Y25-64", sex="T")),
    dict(id="digital_skills", domain="Education", label="At least basic digital skills", unit="%", better="higher",
         dataset="sdg_04_70", filters=dict(ind_type="IND_TOTAL", indic_is="I_DSK2_BAB", unit="PC_IND")),

    # --- Digital & innovation ---
    dict(id="vhcn_coverage", domain="Digital & innovation", label="Very-high-capacity broadband coverage", unit="% of households", better="higher",
         dataset="sdg_17_60", filters=dict(unit="PC_HH", inet_tec="VHCN_FX", terrtypo="TOTAL")),
    dict(id="internet_use", domain="Digital & innovation", label="Use the internet regularly", unit="% of people", better="higher",
         dataset="tin00028", filters=dict(ind_type="IND_TOTAL", unit="PC_IND", indic_is="I_IU3")),  # NB: I_IUX means "never used"
    # definition changed in 2022 (I_IUGOV12 -> I_IUGOV1): spliced, and compared through ranks, which survive the break
    dict(id="egov", domain="Digital & innovation", label="Interact with public authorities online", unit="% of people", better="higher",
         dataset="isoc_ciegi_ac", filters=dict(unit="PC_IND", ind_type="IND_TOTAL"),
         splice=[dict(indic_is="I_IUGOV1"), dict(indic_is="I_IUGOV12")]),
    dict(id="ict_specialists", domain="Digital & innovation", label="ICT specialists in employment", unit="%", better="higher",
         dataset="isoc_sks_itspt", filters=dict(unit="PC_EMP")),
    dict(id="rd_spending", domain="Digital & innovation", label="R&D spending", unit="% of GDP", better="higher",
         dataset="sdg_09_10", filters=dict(sectperf="TOTAL", unit="PC_GDP")),
    dict(id="patents", domain="Digital & innovation", label="European patent applications", unit="per million people", better="higher",
         dataset="sdg_09_40", filters=dict(coop_ptn="APPL", unit="P_MHAB")),

    # --- Environment & energy ---
    dict(id="renewables", domain="Environment & energy", label="Renewable share of energy", unit="%", better="higher",
         dataset="sdg_07_40", filters=dict(nrg_bal="REN", unit="PC")),
    dict(id="ghg_per_capita", domain="Environment & energy", label="Greenhouse gas emissions per person", unit="t CO₂e", better="lower",
         dataset="sdg_13_10", filters=dict(src_crf="TOTXMEMO", unit="T_HAB")),
    dict(id="energy_productivity", domain="Environment & energy", label="Energy productivity", unit="PPS per kgoe", better="higher",
         dataset="sdg_07_30", filters=dict(unit="PPS_KGOE")),
    dict(id="import_dependency", domain="Environment & energy", label="Energy import dependency", unit="%", better="lower",
         dataset="nrg_ind_id", filters=dict(siec="TOTAL", unit="PC")),
    dict(id="recycling", domain="Environment & energy", label="Municipal waste recycled", unit="%", better="higher",
         dataset="sdg_11_60", filters=dict(unit="PC")),
    dict(id="circularity", domain="Environment & energy", label="Circular material use", unit="%", better="higher",
         dataset="sdg_12_41", filters=dict(unit="PC")),

    # --- Governance ---
    dict(id="corruption_index", domain="Governance", label="Corruption Perceptions Index (higher = cleaner)", unit="score 0–100", better="higher",
         dataset="sdg_16_50", filters=dict(unit="SC")),
]

# Demographic context — shown, not ranked (no normative "better" direction)
CONTEXT = [
    dict(id="population", domain="Context", label="Population on 1 January", unit="people", better=None,
         dataset="demo_pjan", filters=dict(unit="NR", age="TOTAL", sex="T")),
    dict(id="net_migration_rate", domain="Context", label="Net migration rate", unit="per 1,000", better=None,
         dataset="demo_gind", filters=dict(indic_de="CNMIGRATRT")),
    dict(id="natural_change_rate", domain="Context", label="Natural change rate", unit="per 1,000", better=None,
         dataset="demo_gind", filters=dict(indic_de="NATGROWRT")),
    dict(id="fertility", domain="Context", label="Total fertility rate", unit="children per woman", better=None,
         dataset="tps00199", filters=dict(indic_de="TOTFERRT")),
]
