const DATA_BASE = "data/";

let allItems = [];
let recommenders = {};
let recColors = {};
let currentStatus = "all";
let sortCol = "title";
let sortAsc = true;

const ARTICLES = ["the", "a", "an"];

function libraryTitle(title) {
  const words = title.split(" ");
  if (words.length > 1 && ARTICLES.includes(words[0].toLowerCase())) {
    return words.slice(1).join(" ") + ", " + words[0];
  }
  return title;
}

function hashStr(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

const GOLDEN_ANGLE = 137.508;

function autoColor(name) {
  const idx = hashStr(name);
  const h = (idx * GOLDEN_ANGLE) % 360;
  const s = 50 + (idx % 20);
  const l = 35 + (idx % 20);
  return `hsl(${h.toFixed(1)}, ${s}%, ${l}%)`;
}

function recColor(initial) {
  if (recColors[initial]) return recColors[initial];
  return autoColor(initial);
}

function textColor(bgColor) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 1;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, 1, 1);
  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? "#222" : "#fff";
}

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
      if (r.color) recColors[r.initial] = r.color;
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
      return dir * libraryTitle(a.title).localeCompare(libraryTitle(b.title), undefined, { sensitivity: "base" });
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
    const recs = (item.recommended_by || []).map((r) => {
      const bg = recColor(r);
      const fg = textColor(bg);
      const fullName = esc(recommenders[r] || r);
      return `<span class="rec-bubble" style="background:${bg};color:${fg}" title="${fullName}">${esc(r)}</span>`;
    }).join(" ");
    const displayTitle = libraryTitle(item.title);
    const titleCell = item.url
      ? `<a href="${esc(item.url)}" target="_blank">${esc(displayTitle)}</a>`
      : esc(displayTitle);

    html += `<tr>
      <td class="col-title">${titleCell}</td>
      <td class="col-cat">${esc(cat)}</td>
      <td class="col-creator">${esc(creator)}</td>
      <td class="col-year">${item.year || ""}</td>
      <td class="col-recs">${recs}</td>
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
