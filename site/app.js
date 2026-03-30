const DATA_BASE = "data/";

let allItems = [];
let recommenders = {};
let currentStatus = "all";
let sortCol = "title";
let sortAsc = true;

async function loadData() {
  try {
    const [mediaResp, recResp] = await Promise.all([
      fetch(DATA_BASE + "media.json"),
      fetch(DATA_BASE + "recommenders.json"),
    ]);
    allItems = mediaResp.ok ? await mediaResp.json() : [];
    const recList = recResp.ok ? await recResp.json() : [];
    for (const r of recList) {
      recommenders[r.initial] = r.full_name;
    }
  } catch {
    allItems = [];
  }
  render();
}

function recCount(item) {
  return item.recommended_by ? item.recommended_by.length : 0;
}

function sortItems(items) {
  const dir = sortAsc ? 1 : -1;
  return items.slice().sort((a, b) => {
    if (sortCol === "title") {
      return dir * a.title.localeCompare(b.title, undefined, { sensitivity: "base" });
    }
    if (sortCol === "recs") {
      return dir * (recCount(a) - recCount(b));
    }
    return 0;
  });
}

function setSort(col) {
  if (sortCol === col) {
    sortAsc = !sortAsc;
  } else {
    sortCol = col;
    sortAsc = col === "title";
  }
  render();
}

function sortIndicator(col) {
  if (sortCol !== col) return "";
  return sortAsc ? " \u25B2" : " \u25BC";
}

function render() {
  const content = document.getElementById("content");
  const filtered =
    currentStatus === "all"
      ? allItems
      : allItems.filter((item) => item.status === currentStatus);

  const sorted = sortItems(filtered);

  if (sorted.length === 0) {
    content.innerHTML = "<p>No items found.</p>";
    return;
  }

  let html = `<table>
    <thead><tr>
      <th class="sortable" data-col="title">Title${sortIndicator("title")}</th>
      <th>Category</th>
      <th>Author / Director</th>
      <th>Year</th>
      <th class="sortable" data-col="recs">Recommended By${sortIndicator("recs")}</th>
      <th>Status</th>
      <th>Rating</th>
    </tr></thead><tbody>`;

  for (const item of sorted) {
    const creator = item.author || item.director || "";
    const cat = item.category || "";
    const rating = item.rating ? "\u2605".repeat(item.rating) : "";
    const recs = recCount(item);
    const recNames = (item.recommended_by || [])
      .map((r) => esc(recommenders[r] || r))
      .join(", ");
    const recInitials = (item.recommended_by || [])
      .map((r) => esc(r))
      .join(", ");
    const recCell = recs
      ? `<span title="${recNames}">${recInitials}</span>`
      : "";
    const titleCell = item.url
      ? `<a href="${esc(item.url)}" target="_blank">${esc(item.title)}</a>`
      : esc(item.title);

    html += `<tr>
      <td class="col-title">${titleCell}</td>
      <td class="col-cat">${esc(cat)}</td>
      <td class="col-creator">${esc(creator)}</td>
      <td class="col-year">${item.year || ""}</td>
      <td class="col-recs">${recCell}</td>
      <td><span class="status-badge ${item.status}">${esc(item.status)}</span></td>
      <td class="col-rating">${rating}</td>
    </tr>`;
  }

  html += "</tbody></table>";
  content.innerHTML = html;

  content.querySelectorAll(".sortable").forEach((th) => {
    th.addEventListener("click", () => setSort(th.dataset.col));
  });
}

function esc(str) {
  const d = document.createElement("div");
  d.textContent = String(str);
  return d.innerHTML;
}

document.querySelectorAll(".filter").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".filter").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    currentStatus = btn.dataset.status;
    render();
  });
});

loadData();
