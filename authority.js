// Change this if your backend runs somewhere other than the live URL
const API_BASE_URL = "https://apex.pythonanywhere.com";

const STATUS_OPTIONS = ["reported", "acknowledged", "in_progress", "resolved"];

const reportsList = document.getElementById("reports-list");
const countLabel = document.getElementById("report-count");

function formatDate(isoString) {
  return new Date(isoString).toLocaleString();
}

function renderReportCard(report) {
  const card = document.createElement("div");
  card.className = `report-card ${report.hazard_type}`;

  const statusOptionsHtml = STATUS_OPTIONS.map(
    (status) =>
      `<option value="${status}" ${status === report.status ? "selected" : ""}>${status.replace("_", " ")}</option>`
  ).join("");

  card.innerHTML = `
    <div class="report-top">
      <span class="hazard-type">${report.hazard_type.replace("_", " ")}</span>
      <span class="reported-date">${formatDate(report.created_at)}</span>
    </div>
    ${report.description ? `<div class="description">${report.description}</div>` : ""}
    <div class="status-row">
      <label>Status:</label>
      <select class="status-select">${statusOptionsHtml}</select>
      <button class="save-status-btn">Save</button>
      <span class="save-confirmation" style="display: none;">✅ Saved</span>
    </div>
  `;

  const select = card.querySelector(".status-select");
  const saveBtn = card.querySelector(".save-status-btn");
  const confirmation = card.querySelector(".save-confirmation");

  saveBtn.addEventListener("click", async () => {
    saveBtn.disabled = true;
    saveBtn.textContent = "Saving...";
    confirmation.style.display = "none";

    try {
      const response = await fetch(`${API_BASE_URL}/reports/${report.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: select.value }),
      });

      if (!response.ok) throw new Error(`Server responded with ${response.status}`);

      confirmation.style.display = "inline";
    } catch (error) {
      alert("Failed to save status. Is the backend running?");
      console.error(error);
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = "Save";
    }
  });

  return card;
}

async function loadReports() {
  try {
    const response = await fetch(`${API_BASE_URL}/reports?limit=200`);
    if (!response.ok) throw new Error(`Server responded with ${response.status}`);

    const reports = await response.json();
    countLabel.textContent = `${reports.length} report(s)`;

    reportsList.innerHTML = "";
    reports.forEach((report) => {
      reportsList.appendChild(renderReportCard(report));
    });
  } catch (error) {
    countLabel.textContent = "Could not load reports. Is the backend running?";
    console.error(error);
  }
}

loadReports();