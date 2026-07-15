// Change this if your backend runs somewhere other than localhost:8000
const API_BASE_URL = "https://apex.pythonanywhere.com";

const form = document.getElementById("report-form");
const getLocationBtn = document.getElementById("get-location-btn");
const locationStatus = document.getElementById("location-status");
const submitBtn = document.getElementById("submit-btn");
const resultMessage = document.getElementById("result-message");

let currentLocation = null; // will hold { lat, lng } once set

getLocationBtn.addEventListener("click", () => {
  if (!navigator.geolocation) {
    locationStatus.textContent = "Your browser doesn't support location access.";
    return;
  }

  locationStatus.textContent = "Getting your location...";

  navigator.geolocation.getCurrentPosition(
    (position) => {
      currentLocation = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      };
      locationStatus.textContent =
        `Location set: ${currentLocation.lat.toFixed(5)}, ${currentLocation.lng.toFixed(5)}`;
    },
    (error) => {
      locationStatus.textContent = "Could not get location. Please allow location access and try again.";
      console.error(error);
    }
  );
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!currentLocation) {
    resultMessage.textContent = "Please set your location first.";
    resultMessage.style.color = "#b00020";
    return;
  }

  const hazardType = document.getElementById("hazard_type").value;
  const description = document.getElementById("description").value;

  const payload = {
    hazard_type: hazardType,
    description: description || null,
    latitude: currentLocation.lat,
    longitude: currentLocation.lng,
    source: "web",
  };

  submitBtn.disabled = true;
  submitBtn.textContent = "Submitting...";

  try {
    const response = await fetch(`${API_BASE_URL}/reports`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Server responded with ${response.status}`);
    }

    resultMessage.textContent = "✅ Report submitted successfully!";
    resultMessage.style.color = "#1f5c4e";
    form.reset();
    currentLocation = null;
    locationStatus.textContent = "Location not set yet.";
  } catch (error) {
    resultMessage.textContent = "❌ Something went wrong. Is the backend running?";
    resultMessage.style.color = "#b00020";
    console.error(error);
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Submit Report";
  }
});
