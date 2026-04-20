const API_URL = "http://localhost:3001/markets";

/* ── STATE ── */
const state = {
  markets: [],
  filteredMarkets: [],
  activeFilter: "all",
  searchTerm: "",
  usingFallback: false
};

/* ── FALLBACK ── */
const FALLBACK_MARKETS = [
  {
    id: "fallback-1",
    question: "Will Bitcoin close above $100k this month?",
    category: "crypto",
    volume: 12500000,
    description: "Bitcoin bull run",
    outcomes: [{ label: "Yes", pct: 62 }, { label: "No", pct: 38 }]
  },
  {
    id: "fallback-2",
    question: "Will Kasongo be impeached before the end of 2026?",
    category: "politics",
    volume: 5200000,
    description: "Kenyan politics",
    outcomes: [{ label: "Yes", pct: 71 }, { label: "No", pct: 29 }]
  },
  {
    id: "fallback-3",
    question: "Will Man United finish top 4 this season?",
    category: "sports",
    volume: 3100000,
    description: "English premier league prediction of the 25/26 season",
    outcomes: [{ label: "Yes", pct: 34 }, { label: "No", pct: 66 }]
  }
];

/* ── DOM REFS ── */
const el = {
  grid:    document.getElementById("markets-grid"),
  form:    document.getElementById("search-form"),
  input:   document.getElementById("search-input"),
  clear:   document.getElementById("clear-search"),
  filters: document.getElementById("markets-filters"),
  summary: document.getElementById("results-summary"),
  banner:  document.getElementById("status-banner"),
  refresh: document.getElementById("refresh-btn"),
  count:   document.getElementById("market-count"),
  pill:    document.getElementById("status-pill"),
  source:  document.getElementById("source-name"),
  dot:     document.getElementById("status-dot")
};

/* ── HELPERS ── */
const fmt = (v) =>
  v >= 1e9 ? `$${(v / 1e9).toFixed(1)}B Vol.` :
  v >= 1e6 ? `$${(v / 1e6).toFixed(1)}M Vol.` :
  v >= 1e3 ? `$${(v / 1e3).toFixed(1)}K Vol.` :
  `$${Number(v || 0).toFixed(0)} Vol.`;

function setStatus(msg, type = "loading") {
  el.banner.textContent = msg;
  el.banner.className   = `status-banner ${type}`;
  el.source.textContent = state.usingFallback ? "Fallback Data" : "db.json";

  const pillLabel     = type === "error" ? "Offline" : type === "success" ? "Live" : "Loading";
  el.pill.textContent = pillLabel;
  el.pill.className   = `status-pill ${type === "success" ? "live" : type === "error" ? "error" : ""}`;

  el.dot.className    = type === "success" ? "status-dot live"
                      : type === "error"   ? "status-dot error"
                      : "status-dot";
}

/* ── CARD TEMPLATE ── */
function card(m, delay) {
  const outcomes = Array.isArray(m.outcomes) && m.outcomes.length
    ? `<div class="outcomes">
        ${m.outcomes.map(o => `
          <div class="outcome">
            <div class="outcome-label-row">
              <span>${o.label}</span>
              <span>${o.pct}%</span>
            </div>
            <div class="outcome-track">
              <div class="outcome-bar" style="width:${o.pct}%"></div>
            </div>
          </div>
        `).join("")}
       </div>`
    : "";

  return `
    <article class="card" style="animation-delay:${delay * 35}ms">
      <div class="card-topline">
        <span class="card-category">${m.category}</span>
        <span class="card-volume">${fmt(m.volume)}</span>
      </div>
      <h3>${m.question}</h3>
      <p class="card-meta">${m.description}</p>
      ${outcomes}
      <div class="trade-buttons">
        <button class="trade-btn yes" data-action="yes" data-id="${m.id}">Yes</button>
        <button class="trade-btn no"  data-action="no"  data-id="${m.id}">No</button>
      </div>
    </article>
  `;
}

/* ── RENDER ── */
function render() {
  const list = state.filteredMarkets;
  el.count.textContent   = list.length;
  el.summary.textContent = `Showing ${list.length} market${list.length !== 1 ? "s" : ""}`;

  if (!list.length) {
    el.grid.innerHTML = `<p class="empty-state">No markets found.</p>`;
    return;
  }

  el.grid.innerHTML = list.map((m, i) => card(m, i)).join("");
}

/* ── FILTER ── */
function apply() {
  const q = state.searchTerm.toLowerCase();
  state.filteredMarkets = state.markets.filter(m => {
    const matchFilter = state.activeFilter === "all" || m.category === state.activeFilter;
    const text        = `${m.question} ${m.description}`.toLowerCase();
    const matchSearch = !q || text.includes(q);
    return matchFilter && matchSearch;
  });
  render();
}

/* ── FETCH ── */
async function load() {
  setStatus("Loading markets…");

  try {
    const controller = new AbortController();
    const timeout    = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(API_URL, {
      signal: controller.signal,
      headers: { "Accept": "application/json" }
    });
    clearTimeout(timeout);

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();

    const raw = Array.isArray(data)         ? data
              : Array.isArray(data.markets) ? data.markets
              : [];

    if (!raw.length) throw new Error("db.json has no markets");

    state.markets       = raw;
    state.usingFallback = false;
    setStatus(`${raw.length} markets loaded`, "success");

  } catch (err) {
    const reason = err.name === "AbortError"
      ? "Request timed out — is JSON Server running?  →  npx json-server db.json --port 3001"
      : `${err.message}  →  run: npx json-server db.json --port 3001`;

    console.warn("load() failed:", reason);
    state.markets       = FALLBACK_MARKETS;
    state.usingFallback = true;
    setStatus(reason, "error");
  }

  apply();
}

/* ── EVENTS ── */
el.form.addEventListener("submit", (e) => {
  e.preventDefault();
  state.searchTerm = el.input.value.trim();
  apply();
});

let searchTimer;
el.input.addEventListener("input", () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    state.searchTerm = el.input.value.trim();
    apply();
  }, 220);
});

el.clear.addEventListener("click", () => {
  el.input.value   = "";
  state.searchTerm = "";
  apply();
});

el.filters.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-filter]");
  if (!btn) return;
  state.activeFilter = btn.dataset.filter;
  el.filters.querySelectorAll("button").forEach(b =>
    b.classList.toggle("active", b === btn)
  );
  apply();
});

el.refresh.addEventListener("click", load);

el.grid.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-action]");
  if (!btn) return;
  alert(`You clicked ${btn.dataset.action.toUpperCase()} on market #${btn.dataset.id}`);
});

load();