// Fetch weather data from OpenWeatherMap API
function updateWeather() {
  var lat = 43.72135; // Example: New York latitude
  var lon = -79.83916; // Example: New York longitude
  var apiKey = "XX"; // Replace with your OpenWeatherMap API key
  var url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;

  $.ajax({
    url: url,
    method: "GET",
    timeout: 0,
  })
    .done(function (response) {
      if (response && response.main && response.weather) {
        // City Name
        $("#weather-city").text(response.name);

        // Temperature
        var temp = response.main.temp.toFixed(1);
        $("#weather-temp").text(temp);

        // Weather Description
        var description = response.weather[0].description;
        $("#weather-description").text(
          description.charAt(0).toUpperCase() + description.slice(1)
        );

        // Weather Icon
        var iconCode = response.weather[0].icon;
        var iconUrl = `https://openweathermap.org/img/wn/${iconCode}.png`;
        $("#weather-icon").attr("src", iconUrl);
      } else {
        $("#weather-city").text("Error");
        $("#weather-temp").text("N/A");
        $("#weather-description").text("Unable to fetch weather data");
        $("#weather-icon").attr("src", "");
        console.error("Invalid weather data from OpenWeatherMap API");
      }
    })
    .fail(function (jqXHR, textStatus, errorThrown) {
      $("#weather-city").text("Error");
      $("#weather-temp").text("N/A");
      $("#weather-description").text("Weather API request failed");
      $("#weather-icon").attr("src", "");
      console.error(
        "Weather request failed: " + textStatus + ", " + errorThrown
      );
    });
}

// Update your existing $(document).ready function
$(document).ready(function () {
  updateProxmoxStats();
  updateWeather(); // Add weather update on page load
  // Refresh stats and weather every 10 seconds
  setInterval(function () {
    updateProxmoxStats();
    updateWeather(); // Refresh weather too
  }, 10000);
});
