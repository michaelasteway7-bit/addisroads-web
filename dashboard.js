// Change this if your backend runs somewhere other than localhost:8000
const API_BASE_URL = "https://apex.pythonanywhere.com";

// Start with a reasonable default view of Addis Ababa —
// we'll zoom to the actual reports once they load.
const map = L.map("map").setView([9.03, 38.74], 13);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "&copy; OpenStreetMap contributors",
  maxZoom: 19,
}).addTo(map);

const COLORS = {
  pothole: "#d97706",
  accident: "#dc2626",
  flooding: "#2563eb",
  road_collapse: "#7c2d12",
  other: "#6b7280",
};

// Turns coordinates into a real address, e.g. "Bole Road, Addis Ababa"
async function reverseGeocode(lat, lng) {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18`
    );
    if (!response.ok) throw new Error("Geocoding failed");
    const data = await response.json();
    return data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  } catch (error) {
    console.error(error);
    return `${lat.toFixed(5)}, ${lng.toFixed(5)}`; // fallback if lookup fails
  }
}

function makeMarker(report) {
  const color = COLORS[report.hazard_type] || "#1f5c4e";

  const marker = L.circleMarker([report.latitude, report.longitude], {
    radius: 9,
    color: "#fff",
    weight: 2,
    fillColor: color,
    fillOpacity: 0.9,
  });

  const reportedDate = new Date(report.created_at).toLocaleString();

  // Show a "loading address..." placeholder immediately,
  // then fill in the real address once the lookup finishes.
  marker.bindPopup(`
    <strong>${report.hazard_type.replace("_", " ")}</strong><br/>
    ${report.description ? report.description + "<br/>" : ""}
    <em id="addr-${report.id}">Looking up address...</em><br/>
    <small>Status: ${report.status}</small><br/>
    <small>Reported: ${reportedDate}</small>
  `);

  marker.on("popupopen", async () => {
    const addressEl = document.getElementById(`addr-${report.id}`);
    if (addressEl && addressEl.textContent === "Looking up address...") {
      addressEl.textContent = await reverseGeocode(report.latitude, report.longitude);
    }
  });

  return marker;
}

async function loadReports() {
  const countLabel = document.getElementById("report-count");

  try {
    const response = await fetch(`${API_BASE_URL}/reports?limit=500`);
    if (!response.ok) throw new Error(`Server responded with ${response.status}`);

    const reports = await response.json();
    const markers = [];

    reports.forEach((report) => {
      const marker = makeMarker(report);
      marker.addTo(map);
      markers.push(marker);
    });

    countLabel.textContent = `${reports.length} report(s) on the map`;

    // Auto-zoom/pan so all reports are actually visible and close-up,
    // instead of always showing the whole city zoomed out.
    if (markers.length > 0) {
      const group = L.featureGroup(markers);
      map.fitBounds(group.getBounds().pad(0.3), { maxZoom: 16 });
    }
  } catch (error) {
    countLabel.textContent = "Could not load reports. Is the backend running?";
    console.error(error);
  }
}

loadReports();