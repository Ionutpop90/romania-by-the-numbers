import { fmt, fmtSigned, lineChart, hBarChart, heatmap, dumbbell, legend, dataTable, divergingColor, scatter } from "./charts.js";

const $ = (s, r = document) => r.querySelector(s);
const bind = (key, text) => document.querySelectorAll(`[data-k="${key}"]`).forEach((n) => (n.textContent = text));
const el = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; };
const details = (id) => $(`#${id}`).closest(".card").querySelector("details.data");

const D = await fetch("data.json").then((r) => r.json());
const NAME = D.countries;
const MEMBERS = Object.keys(NAME).filter((g) => g !== "EU27");
const IND = Object.fromEntries(D.indicators.map((d) => [d.id, d]));
const PROF = {}; for (const r of D.profile) (PROF[r.geo] ||= {})[r.indicator] = r;
const OV = Object.fromEntries(D.overall.map((r) => [r.geo, r]));
const DOM = {}; for (const r of D.domain) (DOM[r.geo] ||= {})[r.domain] = r;
const DOMAINS = ["Economy", "Society", "Health", "Education", "Digital & innovation", "Environment & energy", "Governance"];
const pos = (rank) => 28 - rank; // rank 1 plotted on the right
const ord = (n) => `${n}${n % 100 >= 11 && n % 100 <= 13 ? "th" : ["th", "st", "nd", "rd"][n % 10] || "th"}`;
const SHORT = {
  gdp_pc_pps: "GDP/person", employment: "Employment", unemployment: "Unemployment", neet: "NEET youth", gender_emp_gap: "Gender gap",
  gov_debt: "Gov. debt", gov_balance: "Budget balance", arope: "Poverty risk", severe_deprivation: "Deprivation",
  income_inequality: "Inequality", housing_deprivation: "Housing deprivation", housing_cost_burden: "Housing cost", cold_home: "Cold home",
  crime: "Crime", life_exp: "Life expectancy", infant_mortality: "Infant mortality", preventable_mort: "Preventable deaths",
  treatable_mort: "Treatable deaths", road_deaths: "Road deaths", obesity: "Obesity", early_leavers: "Early leavers",
  tertiary: "Degrees", low_math: "Low maths", adult_learning: "Adult learning", digital_skills: "Digital skills",
  vhcn_coverage: "Gigabit coverage", internet_use: "Internet use", egov: "E-government", ict_specialists: "ICT specialists",
  rd_spending: "R&D", patents: "Patents", renewables: "Renewables", ghg_per_capita: "GHG/person",
  energy_productivity: "Energy productivity", import_dependency: "Energy imports", recycling: "Recycling",
  circularity: "Circularity", corruption_index: "Corruption index",
};
const MED = {
  gdp_pc_pps: "GDP per person (PPS, EU = 100)", employment: "Employment rate (20–64)", neet: "Youth not in work or education",
  gov_balance: "Budget balance", gov_debt: "Government debt", gender_emp_gap: "Gender employment gap",
  arope: "Poverty or social exclusion", severe_deprivation: "Severe deprivation", income_inequality: "Income inequality (S80/S20)",
  housing_deprivation: "Severe housing deprivation", housing_cost_burden: "Housing cost overburden", cold_home: "Can’t keep home warm",
  crime: "Crime or vandalism nearby", road_deaths: "Road deaths", low_math: "Low maths scores (PISA)", early_leavers: "Early school leavers",
  adult_learning: "Adult learning", tertiary: "University degree (25–34)", digital_skills: "Basic digital skills",
  vhcn_coverage: "Gigabit broadband coverage", internet_use: "Regular internet use", egov: "Online public services",
  ict_specialists: "ICT specialists (% of jobs)", rd_spending: "R&D spending (% GDP)", patents: "Patent applications",
  ghg_per_capita: "GHG emissions per person", import_dependency: "Energy import dependency", renewables: "Renewable energy share",
  recycling: "Municipal waste recycled", circularity: "Circular material use", corruption_index: "Corruption Perceptions Index",
};
const med = (id) => MED[id] || IND[id].label;
const fmtVal = (id, v) => {
  if (v == null) return "n/a";
  const u = IND[id].unit, d = Math.abs(v) >= 100 ? 0 : 1;
  if (u === "EU = 100") return fmt(v, 0);
  if (u.startsWith("%")) return `${fmt(v, 1)}%`;           // "%", "% of GDP", "% of people", ...
  if (u === "pp") return `${fmt(v, 1)} pp`;
  if (u === "years") return `${fmt(v, 1)} yrs`;
  if (u.startsWith("per ")) return fmt(v, d);              // rates: unit is in the indicator name
  return `${fmt(v, d)} ${u}`;
};

/* ---------------- Pills ---------------- */
const ICON = {
  up: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M6 11l6-6 6 6"/></svg>',
  down: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M6 13l6 6 6-6"/></svg>',
  top: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 12.5l2.7 2.7L16 10"/></svg>',
  bottom: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 7v6M12 16.5h.01"/></svg>',
};
function pill(kind, cls, text) {
  const p = el("span", `pill ${cls}`); p.innerHTML = ICON[kind]; // static, author-written SVG
  p.appendChild(document.createTextNode(text)); return p;
}
function tally(box, geo) {
  const o = OV[geo]; box.replaceChildren();
  box.append(pill("top", "good", `${o.n_top} in top third`), pill("bottom", "bad", `${o.n_bottom} in bottom third`),
    pill("up", "good", `${o.n_climbing} climbing`), pill("down", "bad", `${o.n_falling} falling`));
}

/* ---------------- Hero (Romania) ---------------- */
const RO = PROF.RO, ro = OV.RO;
const roRows = Object.values(RO);
const best = [...roRows].sort((a, b) => a.last_rank - b.last_rank || b.rank_change - a.rank_change)[0];
const fall = [...roRows].sort((a, b) => a.rank_change - b.rank_change)[0];
bind("roRank", ro.overall_rank); bind("roRankCI", `${Math.round(ro.rank_p05)}–${Math.round(ro.rank_p95)}`); bind("roMomentum", `${ro.momentum_rank}/27`);
tally($("#heroTally"), "RO");
bind("gdp", fmt(RO.gdp_pc_pps.last_value, 0)); bind("gdp0", fmt(RO.gdp_pc_pps.base_value, 0));
bind("gdpRank", `${RO.gdp_pc_pps.base_rank} → ${RO.gdp_pc_pps.last_rank}`);
bind("bestRank", `#${best.last_rank}`); bind("bestName", best.label);
bind("fallRank", `${best === fall ? "" : ""}#${fall.base_rank} → #${fall.last_rank}`); bind("fallName", fall.label);
const popRO = D.context.population.RO, pop14 = popRO.find((p) => p[0] === 2014)[1], popL = popRO[popRO.length - 1];
bind("popChange", `${fmtSigned(100 * (popL[1] / pop14 - 1), 1)}%`); bind("pop", fmt(popL[1] / 1e6, 2)); bind("popYear", popL[0]);
bind("ineqMove", `${ord(RO.income_inequality.base_rank)} to ${ord(RO.income_inequality.last_rank)}`);
bind("burdenMove", `${ord(RO.housing_cost_burden.base_rank)} to ${ord(RO.housing_cost_burden.last_rank)}`);
bind("gdpMove", `${fmt(RO.gdp_pc_pps.base_value, 0)}% to ${fmt(RO.gdp_pc_pps.last_value, 0)}%`);
bind("balRank", `${ord(RO.gov_balance.last_rank)} of 27`);

/* ---------------- Country selector ---------------- */
const sel = $("#countrySelect");
[...MEMBERS].sort((a, b) => NAME[a].localeCompare(NAME[b])).forEach((g) => { const o = el("option", null, NAME[g]); o.value = g; sel.appendChild(o); });
sel.value = "RO";
let geo = "RO";

const LATEST = { key: "latest", label: "Latest", color: "--s1" }, START = { key: "start", label: "Start of period", color: "--muted" };
legend($("#legendRank"), [LATEST, START].map((s) => ({ label: `${s.label} rank`, color: `var(${s.color})` })), "dot");
const RANK_DOMAIN = { lo: 0, hi: 28, ticks: [1, 7, 14, 21, 27] };

/* 01 · domain dumbbells */
const grid = $("#domainGrid");
const domainCards = DOMAINS.map((d) => {
  const card = el("div", "card");
  const h = el("h3", null, d); const desc = el("p", "desc"); const chart = el("div");
  card.append(h, desc, chart); grid.appendChild(card);
  return { d, desc, chart };
});
function renderDomains() {
  for (const { d, desc, chart } of domainCards) {
    const rows = Object.values(PROF[geo]).filter((r) => r.domain === d).sort((a, b) => a.last_rank - b.last_rank);
    const s = DOM[geo][d];
    desc.textContent = `Average domain score ${fmt(100 * s.base_score, 0)} → ${fmt(100 * s.last_score, 0)} (0 = always last, 100 = always first).`;
    dumbbell(chart, {
      rows: rows.map((r) => ({ label: med(r.indicator), latest: pos(r.last_rank), start: pos(r.base_rank),
        extra: [{ value: `${fmtVal(r.indicator, r.base_value)} → ${fmtVal(r.indicator, r.last_value)}`, label: `${r.base_year}–${r.last_year}` },
          { value: fmtVal(r.indicator, r.eu_last), label: "EU-27 latest" }, { value: "", label: r.label }] })),
      a: LATEST, b: START, rowH: 30, domain: RANK_DOMAIN, tickFormat: (v) => `#${28 - v}`, valueFormat: (v) => `#${28 - v}`,
      diffFormat: (v) => `${fmtSigned(v, 0)} places`, diffLabel: "rank change", ariaLabel: `${d}: ${NAME[geo]}'s EU ranks`,
    });
  }
}

/* 02 · quadrant */
function renderQuad() {
  const rows = Object.values(PROF[geo]);
  $("#quadTitle").textContent = `${NAME[geo]}: rank today vs rank change`;
  scatter($("#chartQuad"), {
    points: rows.map((r) => ({ x: pos(r.last_rank), y: r.rank_change, label: SHORT[r.indicator], name: r.label, color: "--s1",
      emphasis: r.last_rank <= 3 || r.last_rank >= 27 || Math.abs(r.rank_change) >= 8,
      extra: [{ value: `#${r.base_rank} → #${r.last_rank}`, label: `${r.base_year}–${r.last_year}` }, { value: r.domain, label: "" }] })),
    xLabel: "Rank today (right = better)", yLabel: "Places gained", xDomain: RANK_DOMAIN,
    xFmt: (v) => `#${28 - v}`, yFmt: (v) => fmtSigned(v, 0), refX: 14, refY: 0, height: 480,
    ariaLabel: `Quadrant chart of ${NAME[geo]}'s ranks and rank changes`,
  });
  dataTable(details("chartQuad"), ["Indicator", "Domain", "Start", "Latest", "Rank start", "Rank latest", "Change", "EU latest"],
    rows.sort((a, b) => a.last_rank - b.last_rank).map((r) => [r.label, r.domain, `${fmtVal(r.indicator, r.base_value)} (${r.base_year})`,
      `${fmtVal(r.indicator, r.last_value)} (${r.last_year})`, r.base_rank, r.last_rank, fmtSigned(r.rank_change, 0), fmtVal(r.indicator, r.eu_last)]));
}

/* 03 · overall + domain heat */
const byOverall = [...MEMBERS].sort((a, b) => OV[a].overall_rank - OV[b].overall_rank);
function renderOverall() {
  hBarChart($("#chartOverall"), {
    rows: byOverall.map((g) => ({ label: NAME[g], value: 100 * OV[g].last_score, highlight: g === geo, bold: g === geo, tipLabel: "overall score",
      extra: [{ value: `#${OV[g].overall_rank}`, label: `rank (90% range ${Math.round(OV[g].rank_p05)}–${Math.round(OV[g].rank_p95)})` },
        { value: `#${OV[g].momentum_rank}`, label: "momentum rank (score change)" }] })),
    valueFormat: (v) => fmt(v, 0), rowH: 20, ariaLabel: "Overall benchmark score by country",
  });
  heatmap($("#chartDomainHeat"), {
    rows: byOverall.map((g) => ({ key: g, label: NAME[g], short: g, emphasis: g === geo })),
    cols: DOMAINS, cap: 50, get: (g, d) => (DOM[g][d] ? 50 - 100 * DOM[g][d].last_score : null),
    cellFormat: (v) => fmt(50 - v, 0), colLabel: (d, n) => (n ? { Economy: "Econ", Society: "Soc", Health: "Hlth", Education: "Edu",
      "Digital & innovation": "Dig", "Environment & energy": "Env", Governance: "Gov" }[d] : d.replace(" & ", " & ").split(" ")[0]),
    colName: (d) => d, tipLabel: "domain score (0–100)", rotateLabels: true, minLabelWidth: 28,
    ariaLabel: "Domain scores by country",
  });
  const stops = [50, 25, 0, -25, -50].map((v, i) => `${divergingColor(v, 50).fill} ${i * 25}%`);
  $("#heatScale").style.background = `linear-gradient(90deg, ${stops.join(",")})`;
}
dataTable(details("chartOverall"), ["Rank", "Country", "Score", "90% rank range", "Momentum rank", "Top third", "Bottom third"],
  byOverall.map((g) => [OV[g].overall_rank, NAME[g], fmt(100 * OV[g].last_score, 1), `${Math.round(OV[g].rank_p05)}–${Math.round(OV[g].rank_p95)}`, OV[g].momentum_rank, OV[g].n_top, OV[g].n_bottom]));
dataTable(details("chartDomainHeat"), ["Country", ...DOMAINS], byOverall.map((g) => [NAME[g], ...DOMAINS.map((d) => (DOM[g][d] ? fmt(100 * DOM[g][d].last_score, 0) : "–"))]));

/* 04 · trends */
const TRENDS = ["gdp_pc_pps", "arope", "gov_balance", "tertiary", "treatable_mort", "internet_use"];
const tgrid = $("#trendGrid");
const trendCards = TRENDS.map((id) => {
  const card = el("div", "card mini"); const h = el("h3", null, IND[id].label); const big = el("div", "big"); const lg = el("ul", "legend"); const chart = el("div");
  card.append(h, big, lg, chart); tgrid.appendChild(card);
  return { id, big, lg, chart };
});
function renderTrends() {
  for (const { id, big, lg, chart } of trendCards) {
    const s = D.ranks[id][geo] || [], eu = Object.fromEntries((D.eu[id] || []).map(([y, v]) => [y, v]));
    const rows = s.map(([y, , v]) => ({ year: y, c: v, eu: eu[y] ?? null }));
    const r = PROF[geo][id];
    big.replaceChildren(document.createTextNode(fmtVal(id, r.last_value)), el("small", null, `${r.last_year} · EU ${fmtVal(id, r.eu_last)} · rank #${r.last_rank}`));
    const series = [{ key: "c", label: NAME[geo], short: geo, color: "--s1" }, { key: "eu", label: "EU-27", short: "EU", color: "--s2" }];
    legend(lg, series.map((x) => ({ label: x.label, color: `var(${x.color})` })));
    lineChart(chart, { data: rows, xKey: "year", series, height: 200, includeZero: id === "gov_balance" || id === "gdp_pc_pps" ? true : false,
      yFormat: (v) => fmt(v, Number.isInteger(v) ? 0 : 1), tipFormat: (v) => fmtVal(id, v), connectGaps: true, ariaLabel: `${IND[id].label}, ${NAME[geo]} vs EU` });
  }
}

/* 05 · people (Romania) */
const ctx = (k) => Object.fromEntries((D.context[k].RO || []).map(([y, v]) => [y, v]));
const nat = ctx("natural_change_rate"), mig = ctx("net_migration_rate"), popS = ctx("population"), fert = ctx("fertility");
const demoRows = Object.keys(nat).map(Number).sort().map((y) => ({ year: y, nat: nat[y], mig: mig[y] ?? null }));
const DEMO = [{ key: "nat", label: "Natural change (births − deaths)", short: "Natural", color: "--s1" }, { key: "mig", label: "Net migration", short: "Migration", color: "--s2" }];
legend($("#legendDemo"), DEMO.map((x) => ({ label: x.label, color: `var(${x.color})` })));
const popYears = Object.keys(popS).map(Number).sort(), fertYears = Object.keys(fert).map(Number).sort();
bind("popNow", `${fmt(popS[popYears.at(-1)] / 1e6, 2)}m`); bind("fertNow", `${fmt(fert[fertYears.at(-1)], 2)} children`);

/* ---------------- Render & re-render ---------------- */
function renderAll() {
  tally($("#countryTally"), geo);
  renderDomains(); renderQuad(); renderOverall(); renderTrends();
}
function renderPeople() {
  lineChart($("#chartDemo"), { data: demoRows, xKey: "year", series: DEMO, height: 300, yFormat: (v) => fmt(v, 0), tipFormat: (v) => fmtSigned(v, 1),
    refY: { value: 0, label: "" }, annotations: [{ x: 2022, label: "Migration turns positive", short: "2022" }], ariaLabel: "Romania natural change and net migration" });
  lineChart($("#chartPop"), { data: popYears.map((y) => ({ year: y, v: popS[y] / 1e6 })), xKey: "year", series: [{ key: "v", label: "Population", short: "Pop.", color: "--s1" }],
    height: 180, includeZero: false, yFormat: (v) => fmt(v, 1), tipFormat: (v) => `${fmt(v, 2)}m`, endLabels: false, ariaLabel: "Romania population" });
  lineChart($("#chartFert"), { data: fertYears.map((y) => ({ year: y, v: fert[y] })), xKey: "year", series: [{ key: "v", label: "Fertility", short: "TFR", color: "--s2" }],
    height: 180, includeZero: false, yFormat: (v) => fmt(v, 1), tipFormat: (v) => fmt(v, 2), endLabels: false, ariaLabel: "Romania fertility rate" });
}
dataTable(details("chartDemo"), ["Year", "Natural change per 1,000", "Net migration per 1,000", "Population", "Fertility"],
  demoRows.map((r) => [r.year, fmtSigned(r.nat, 1), r.mig == null ? "–" : fmtSigned(r.mig, 1), popS[r.year] ? Math.round(popS[r.year]).toLocaleString("en-GB") : "–", fert[r.year] ? fmt(fert[r.year], 2) : "–"]));

sel.addEventListener("change", () => { geo = sel.value; renderAll(); });
renderAll(); renderPeople();

let raf, lastW = window.innerWidth;
window.addEventListener("resize", () => {
  if (window.innerWidth === lastW) return; lastW = window.innerWidth;
  cancelAnimationFrame(raf); raf = requestAnimationFrame(() => { renderAll(); renderPeople(); });
});
$("#theme").addEventListener("click", () => {
  const root = document.documentElement;
  const dark = root.dataset.theme ? root.dataset.theme === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
  root.dataset.theme = dark ? "light" : "dark";
  try { localStorage.setItem("theme", root.dataset.theme); } catch (e) {}
  renderOverall();
});
matchMedia("(prefers-color-scheme: dark)").addEventListener("change", renderOverall);
