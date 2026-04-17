const API_URL =
  "https://gamma-api.polymarket.com/markets?active=true&closed=false&limit=24";

/* ---------------- FALLBACK ---------------- */

const FALLBACK_MARKETS = [
  {
    id: "sample-1",
    question: "Will Bitcoin close above $100k this month?",
    volume: 12500000,
    category: "crypto",
    description: "Sample crypto market used when live data is unavailable.",
    outcomes: [
      { label: "Yes", pct: 62 },
      { label: "No", pct: 38 }
    ]
  }
];

/* ---------------- STATE ---------------- */

const state = {
  markets: [],
  filteredMarkets: [],
  activeFilter: "all",
  searchTerm: "",
  usingFallback: false
};

/* ---------------- DOM ---------------- */

const el = {
  grid: document.getElementById("markets-grid"),
  form: document.getElementById("search-form"),
  input: document.getElementById("search-input"),
  clear: document.getElementById("clear-search"),
  filters: document.getElementById("markets-filters"),
  summary: document.getElementById("results-summary"),
  banner: document.getElementById("status-banner"),
  refresh: document.getElementById("refresh-btn"),
  count: document.getElementById("market-count"),
  pill: document.getElementById("status-pill"),
  source: document.getElementById("source-name")
};

/* ---------------- HELPERS ---------------- */

const fmt = (v) =>
  v > 1e9 ? `$${(v / 1e9).toFixed(1)}B` :
  v > 1e6 ? `$${(v / 1e6).toFixed(1)}M` :
  `$${Number(v || 0).toFixed(0)}`;

function setStatus(msg, type = "loading") {
  el.banner.textContent = msg;
  el.banner.className = `status ${type}`;
  el.pill.textContent =
    type === "error" ? "Offline" :
    type === "success" ? "Live" : "Loading";
  el.source.textContent = state.usingFallback ? "Sample Data" : "Polymarket";
}

/* ---------------- RENDER ---------------- */

function card(m) {
  return `
    <div class="card">
      <div class="top">
        <span>${m.category}</span>
        <span>${fmt(m.volume)}</span>
      </div>

      <h3>${m.question}</h3>
      <p>${m.description}</p>

      <div class="actions">
        <button data-action="yes" data-id="${m.id}">Yes</button>
        <button data-action="no" data-id="${m.id}">No</button>
      </div>
    </div>
  `;
}

function render() {
  const list = state.filteredMarkets;

  el.count.textContent = list.length;
  el.summary.textContent =
    `Showing ${list.length} markets`;

  if (!list.length) {
    el.grid.innerHTML = `<p>No results</p>`;
    return;
  }

  el.grid.innerHTML = list.map(card).join("");
}

/* ---------------- FILTER ---------------- */

function apply() {
  const q = state.searchTerm.toLowerCase();

  state.filteredMarkets = state.markets.filter(m => {
    const matchFilter =
      state.activeFilter === "all" || m.category === state.activeFilter;

    const text = `${m.question} ${m.description}`.toLowerCase();
    const matchSearch = !q || text.includes(q);

    return matchFilter && matchSearch;
  });

  render();
}

/* ---------------- FETCH ---------------- */

async function load() {
  setStatus("Loading...");

  try {
    const res = await fetch(API_URL);

    if (!res.ok) throw new Error("API failed");

    const data = await res.json();

    const raw = Array.isArray(data) ? data : data.markets || [];

    state.markets = raw.slice(0, 15).map(m => ({
      id: m.id || m.slug,
      question: m.question || m.title || "Untitled",
      description: m.description || "Live market",
      volume: m.volumeNum || m.volume || 0,
      category: "crypto"
    }));

    state.usingFallback = false;

    if (!state.markets.length) throw new Error("empty");

    setStatus("Live data loaded", "success");
  } catch (e) {
    console.log("fallback used", e);

    state.markets = FALLBACK_MARKETS;
    state.usingFallback = true;

    setStatus("Using sample data", "error");
  }

  apply();
}

/* ---------------- EVENTS ---------------- */

el.form.addEventListener("submit", (e) => {
  e.preventDefault();
  state.searchTerm = el.input.value;
  apply();
});

el.clear.addEventListener("click", () => {
  el.input.value = "";
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

  alert(`${btn.dataset.action.toUpperCase()} clicked`);
});

/* ---------------- START ---------------- */

load();
