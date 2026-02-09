// Personal Dashboard - Main JavaScript

// Tracks how many fetches are still in progress
var pendingCount = 0;

document.addEventListener("DOMContentLoaded", function () {
  // Start the live clock (runs independently, not tied to Refresh)
  startClock();

  // Load data on page open
  refreshAll();

  // Set up Refresh button
  var btn = document.getElementById("refresh-btn");
  btn.addEventListener("click", refreshAll);
});

// Resets cards to loading state, fetches both, re-enables button when done
function refreshAll() {
  var btn = document.getElementById("refresh-btn");

  // Disable button to prevent double-click spam
  btn.disabled = true;
  btn.textContent = "Loading...";

  // Reset cards to loading state
  document.getElementById("weather-temp").textContent = "Loading weather...";
  document.getElementById("weather-desc").textContent = "";
  document.getElementById("quote-text").textContent = "Loading quote...";
  document.getElementById("quote-author").textContent = "";

  // Track 2 pending fetches (weather + quote)
  pendingCount = 2;

  loadWeather();
  loadQuote();
}

// Called after each fetch completes — re-enables button when both are done
function fetchDone() {
  pendingCount--;
  if (pendingCount <= 0) {
    var btn = document.getElementById("refresh-btn");
    btn.disabled = false;
    btn.textContent = "Refresh";
  }
}

// Starts a live clock that updates every second
function startClock() {
  var timeEl = document.getElementById("clock-time");
  var dateEl = document.getElementById("clock-date");

  function updateClock() {
    var now = new Date();

    // Convert 24-hour to 12-hour format with AM/PM
    var rawHours = now.getHours();
    var period = rawHours >= 12 ? "PM" : "AM";
    var hours = rawHours % 12 || 12; // 0 becomes 12, 13 becomes 1, etc.
    var minutes = String(now.getMinutes()).padStart(2, "0");
    var seconds = String(now.getSeconds()).padStart(2, "0");
    timeEl.textContent = hours + ":" + minutes + ":" + seconds + " " + period;

    // Format date as "Saturday, 8 February 2026"
    var options = { weekday: "long", day: "numeric", month: "long", year: "numeric" };
    dateEl.textContent = now.toLocaleDateString("en-US", options);
  }

  // Run immediately, then every second
  updateClock();
  setInterval(updateClock, 1000);
}

// Maps Open-Meteo weather codes to human-readable descriptions
function getWeatherDescription(code) {
  var descriptions = {
    0: "Clear sky",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Foggy",
    48: "Depositing rime fog",
    51: "Light drizzle",
    53: "Moderate drizzle",
    55: "Dense drizzle",
    61: "Slight rain",
    63: "Moderate rain",
    65: "Heavy rain",
    71: "Slight snow",
    73: "Moderate snow",
    75: "Heavy snow",
    80: "Slight rain showers",
    81: "Moderate rain showers",
    82: "Violent rain showers",
    95: "Thunderstorm",
    96: "Thunderstorm with slight hail",
    99: "Thunderstorm with heavy hail"
  };
  return descriptions[code] || "Unknown";
}

// Fetches current weather from Open-Meteo using the browser's location
function loadWeather() {
  var tempEl = document.getElementById("weather-temp");
  var descEl = document.getElementById("weather-desc");

  // Check if the browser supports geolocation
  if (!navigator.geolocation) {
    tempEl.textContent = "Geolocation is not supported by your browser.";
    fetchDone();
    return;
  }

  // Ask the user for their location
  navigator.geolocation.getCurrentPosition(
    // Success: we got coordinates
    async function (position) {
      var lat = position.coords.latitude;
      var lon = position.coords.longitude;

      try {
        // Call Open-Meteo with the user's coordinates (no API key needed)
        var url =
          "https://api.open-meteo.com/v1/forecast" +
          "?latitude=" + lat +
          "&longitude=" + lon +
          "&current_weather=true";

        var response = await fetch(url);

        if (!response.ok) {
          throw new Error("Failed to fetch weather");
        }

        var data = await response.json();
        var weather = data.current_weather;

        // Display temperature and condition
        tempEl.textContent = weather.temperature + "°C";
        descEl.textContent = getWeatherDescription(weather.weathercode);
      } catch (error) {
        tempEl.textContent = "Could not load weather. Please try again later.";
        descEl.textContent = "";
      }

      fetchDone();
    },
    // Error: user denied permission or something went wrong
    function () {
      tempEl.textContent = "Location access denied. Enable it to see weather.";
      descEl.textContent = "";
      fetchDone();
    }
  );
}

// Fetches a random quote from DummyJSON and displays it
async function loadQuote() {
  var quoteEl = document.getElementById("quote-text");
  var authorEl = document.getElementById("quote-author");

  try {
    // Call the free quote API (no key needed)
    var response = await fetch("https://dummyjson.com/quotes/random");

    // Check if the request was successful
    if (!response.ok) {
      throw new Error("Failed to fetch quote");
    }

    // Parse the JSON response
    var data = await response.json();

    // Display the quote and author on the page
    quoteEl.textContent = '"' + data.quote + '"';
    authorEl.textContent = "— " + data.author;
  } catch (error) {
    // Show a friendly message if something goes wrong
    quoteEl.textContent = "Could not load quote. Please try again later.";
    authorEl.textContent = "";
  }

  fetchDone();
}
