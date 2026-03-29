const DATA_BASE = "data/";

let allItems = [];
let recommenders = {};

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
  render("all");
}

function render(statusFilter) {
  const content = document.getElementById("content");
  const filtered =
    statusFilter === "all"
      ? allItems
      : allItems.filter((item) => item.status === statusFilter);

  const grouped = {};
  for (const item of filtered) {
    const cat = item.category || "other";
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(item);
  }

  if (Object.keys(grouped).length === 0) {
    content.innerHTML = "<p>No items found.</p>";
    return;
  }

  let html = "";
  for (const [category, items] of Object.entries(grouped).sort()) {
    html += `<h2>${esc(category)}</h2>`;
    for (const item of items) {
      const meta = [item.author, item.director, item.year]
        .filter(Boolean)
        .join(" · ");
      const rating = item.rating ? "★".repeat(item.rating) : "";
      const rec = item.recommended_by
        ? `<span class="rec">rec: ${esc(recommenders[item.recommended_by] || item.recommended_by)}</span>`
        : "";
      html += `
        <div class="media-item">
          <div>
            <span class="title">${esc(item.title)}</span>
            ${meta ? `<span class="meta"> — ${esc(meta)}</span>` : ""}
            ${rating ? `<span class="rating"> ${rating}</span>` : ""}
            ${rec}
          </div>
          <span class="status-badge ${item.status}">${esc(item.status)}</span>
        </div>`;
    }
  }
  content.innerHTML = html;
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
    render(btn.dataset.status);
  });
});

loadData();
