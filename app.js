const DATA_FILES = {
  exhibitors: "data/exhibitors.json",
  martin: "data/martin.json",
  pete: "data/pete.json"
};

const state = {
  owner: "all",
  view: "cards",
  search: "",
  priority: "all",
  hall: "all",
  category: "all",
  status: "all",
  records: []
};

const els = {
  syncStatus: document.querySelector("#syncStatus"),
  searchInput: document.querySelector("#searchInput"),
  priorityFilter: document.querySelector("#priorityFilter"),
  hallFilter: document.querySelector("#hallFilter"),
  categoryFilter: document.querySelector("#categoryFilter"),
  statusFilter: document.querySelector("#statusFilter"),
  cardsView: document.querySelector("#cardsView"),
  routeView: document.querySelector("#routeView"),
  dataView: document.querySelector("#dataView"),
  cardTemplate: document.querySelector("#cardTemplate")
};

init();

async function init() {
  bindControls();
  try {
    const [exhibitors, martin, pete] = await Promise.all([
      fetchJson(DATA_FILES.exhibitors),
      fetchJson(DATA_FILES.martin),
      fetchJson(DATA_FILES.pete)
    ]);

    state.records = mergeData(exhibitors.exhibitors || [], {
      martin: martin.selections || [],
      pete: pete.selections || []
    });

    buildSelects();
    render();
    els.syncStatus.textContent = `${state.records.length} booths loaded`;
  } catch (error) {
    els.syncStatus.textContent = "Data error";
    els.cardsView.innerHTML = `<p class="empty">Could not load planner data. Check the JSON files.</p>`;
    console.error(error);
  }

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("service-worker.js");
  }
}

async function fetchJson(path) {
  const response = await fetch(path, { cache: "no-cache" });
  if (!response.ok) throw new Error(`Could not load ${path}`);
  return response.json();
}

function mergeData(exhibitors, selectionsByOwner) {
  const selectionMap = new Map();

  for (const [owner, selections] of Object.entries(selectionsByOwner)) {
    for (const selection of selections) {
      const current = selectionMap.get(selection.exhibitorId) || {};
      current[owner] = selection;
      selectionMap.set(selection.exhibitorId, current);
    }
  }

  return exhibitors.map((exhibitor) => {
    const selections = selectionMap.get(exhibitor.id) || {};
    const owners = Object.keys(selections);
    const combinedText = [exhibitor.company, exhibitor.hall, exhibitor.booth, exhibitor.category, ...(exhibitor.products || [])]
      .concat(owners.flatMap((owner) => [
        selections[owner].reason,
        selections[owner].notes,
        selections[owner].status,
        ...(selections[owner].questions || []),
        ...(selections[owner].interests || [])
      ]))
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return {
      ...exhibitor,
      selections,
      owners,
      combinedText,
      topPriority: getTopPriority(owners.map((owner) => selections[owner].priority)),
      statuses: owners.map((owner) => selections[owner].status || "not started")
    };
  });
}

function getTopPriority(priorities) {
  const order = { high: 3, medium: 2, low: 1 };
  return priorities.sort((a, b) => (order[b] || 0) - (order[a] || 0))[0] || "unselected";
}

function bindControls() {
  els.searchInput.addEventListener("input", (event) => {
    state.search = event.target.value.trim().toLowerCase();
    render();
  });

  document.querySelectorAll("[data-owner]").forEach((button) => {
    button.addEventListener("click", () => {
      state.owner = button.dataset.owner;
      setActive("[data-owner]", button);
      render();
    });
  });

  document.querySelectorAll("[data-view]").forEach((button) => {
    button.addEventListener("click", () => {
      state.view = button.dataset.view;
      setActive("[data-view]", button);
      render();
    });
  });

  for (const [key, element] of [
    ["priority", els.priorityFilter],
    ["hall", els.hallFilter],
    ["category", els.categoryFilter],
    ["status", els.statusFilter]
  ]) {
    element.addEventListener("change", () => {
      state[key] = element.value;
      render();
    });
  }
}

function setActive(selector, activeButton) {
  document.querySelectorAll(selector).forEach((button) => button.classList.toggle("is-active", button === activeButton));
}

function buildSelects() {
  fillSelect(els.priorityFilter, ["all", "high", "medium", "low", "unselected"], "All priorities");
  fillSelect(els.hallFilter, uniqueValues(state.records.map((record) => record.hall)), "All halls");
  fillSelect(els.categoryFilter, uniqueValues(state.records.map((record) => record.category)), "All categories");
  fillSelect(els.statusFilter, uniqueValues(state.records.flatMap((record) => record.statuses)), "All statuses");
}

function fillSelect(select, values, allLabel) {
  select.innerHTML = "";
  const normalised = values[0] === "all" ? values : ["all", ...values];
  normalised.forEach((value) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = value === "all" ? allLabel : titleCase(value);
    select.append(option);
  });
}

function uniqueValues(values) {
  return [...new Set(values.filter(Boolean))].sort((a, b) => String(a).localeCompare(String(b)));
}

function render() {
  const records = filteredRecords();
  els.cardsView.classList.toggle("hidden", state.view !== "cards");
  els.routeView.classList.toggle("hidden", state.view !== "route");
  els.dataView.classList.toggle("hidden", state.view !== "data");

  if (state.view === "cards") renderCards(records);
  if (state.view === "route") renderRoute(records);
}

function filteredRecords() {
  return state.records.filter((record) => {
    const ownerMatch =
      state.owner === "all" ||
      (state.owner === "both" && record.owners.includes("martin") && record.owners.includes("pete")) ||
      record.owners.includes(state.owner);
    const searchMatch = !state.search || record.combinedText.includes(state.search);
    const priorityMatch = state.priority === "all" || record.topPriority === state.priority;
    const hallMatch = state.hall === "all" || record.hall === state.hall;
    const categoryMatch = state.category === "all" || record.category === state.category;
    const statusMatch = state.status === "all" || record.statuses.includes(state.status);
    return ownerMatch && searchMatch && priorityMatch && hallMatch && categoryMatch && statusMatch;
  });
}

function renderCards(records) {
  els.cardsView.innerHTML = "";
  if (!records.length) {
    els.cardsView.innerHTML = `<p class="empty">No booths match these filters.</p>`;
    return;
  }

  records.forEach((record) => {
    const card = els.cardTemplate.content.firstElementChild.cloneNode(true);
    card.querySelector("h2").textContent = record.company;
    card.querySelector(".owner").textContent = ownerLabel(record.owners);
    card.querySelector(".priority").textContent = titleCase(record.topPriority);
    card.querySelector(".priority").dataset.priority = record.topPriority;
    card.querySelector(".facts").innerHTML = factHtml(record);
    card.querySelector(".tags").innerHTML = tagHtml([record.category, ...(record.products || [])]);
    card.querySelector(".reason").innerHTML = selectionBlock("Why visit", record, "reason");
    card.querySelector(".questions").innerHTML = questionsBlock(record);
    card.querySelector(".notes").innerHTML = selectionBlock("Notes / status", record, "notes", true);
    els.cardsView.append(card);
  });
}

function renderRoute(records) {
  const sorted = [...records].sort(routeSort);
  els.routeView.innerHTML = sorted.length
    ? sorted.map((record, index) => routeItem(record, index + 1)).join("")
    : `<p class="empty">No route stops match these filters.</p>`;
}

function routeSort(a, b) {
  return String(a.hall || "").localeCompare(String(b.hall || ""), undefined, { numeric: true }) ||
    String(a.zone || "").localeCompare(String(b.zone || ""), undefined, { numeric: true }) ||
    String(a.booth || "").localeCompare(String(b.booth || ""), undefined, { numeric: true });
}

function routeItem(record, number) {
  return `
    <article class="route-stop">
      <strong>${number}</strong>
      <div>
        <h2>${escapeHtml(record.company)}</h2>
        <p>${escapeHtml(record.hall || "Hall TBC")} · ${escapeHtml(record.booth || "Booth TBC")} · ${escapeHtml(record.zone || "Zone TBC")}</p>
        <span>${escapeHtml(record.category || "Uncategorised")}</span>
      </div>
    </article>
  `;
}

function factHtml(record) {
  const facts = [
    ["Hall", record.hall || "TBC"],
    ["Booth", record.booth || "TBC"],
    ["Zone", record.zone || "TBC"],
    ["Phase", record.phase || "TBC"]
  ];
  return facts.map(([label, value]) => `<div><dt>${label}</dt><dd>${escapeHtml(value)}</dd></div>`).join("");
}

function tagHtml(tags) {
  return tags.filter(Boolean).map((tag) => `<span>${escapeHtml(tag)}</span>`).join("");
}

function selectionBlock(title, record, field, includeStatus = false) {
  const rows = record.owners.map((owner) => {
    const selection = record.selections[owner];
    const status = includeStatus ? ` <em>${escapeHtml(selection.status || "not started")}</em>` : "";
    const value = selection[field] || "Add notes here in the person's JSON file.";
    return `<p><strong>${titleCase(owner)}:</strong>${status} ${escapeHtml(value)}</p>`;
  });
  return `<h3>${title}</h3>${rows.join("") || "<p>Add this booth to Martin or Pete's JSON file.</p>"}`;
}

function questionsBlock(record) {
  const rows = record.owners.flatMap((owner) => {
    const questions = record.selections[owner].questions || [];
    return questions.map((question) => `<li><strong>${titleCase(owner)}:</strong> ${escapeHtml(question)}</li>`);
  });
  return `<h3>Questions</h3>${rows.length ? `<ul>${rows.join("")}</ul>` : "<p>Add questions in Martin or Pete's JSON file.</p>"}`;
}

function ownerLabel(owners) {
  if (owners.includes("martin") && owners.includes("pete")) return "Martin + Pete";
  if (owners.length) return owners.map(titleCase).join(", ");
  return "Shared data only";
}

function titleCase(value) {
  return String(value).replace(/-/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[char]));
}
