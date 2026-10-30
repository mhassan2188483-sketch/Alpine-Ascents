(function () {
  "use strict";

  const grid = document.getElementById("wxGrid");
  const mine = document.getElementById("wxMine");
  const btn = document.getElementById("wxMineBtn");
  const note = document.getElementById("wxNote");
  if (!grid) return;

  // Weather codes used by Open-Meteo -> icon and words
  const CODES = {
    0: ["☀", "Clear sky"], 1: ["🌤", "Mainly clear"], 2: ["⛅", "Partly cloudy"], 3: ["☁", "Overcast"],
    45: ["🌫", "Fog"], 48: ["🌫", "Freezing fog"],
    51: ["🌦", "Light drizzle"], 53: ["🌦", "Drizzle"], 55: ["🌦", "Heavy drizzle"],
    56: ["🌧", "Freezing drizzle"], 57: ["🌧", "Freezing drizzle"],
    61: ["🌧", "Light rain"], 63: ["🌧", "Rain"], 65: ["🌧", "Heavy rain"],
    66: ["🌧", "Freezing rain"], 67: ["🌧", "Freezing rain"],
    71: ["🌨", "Light snow"], 73: ["🌨", "Snow"], 75: ["❄", "Heavy snow"], 77: ["❄", "Snow grains"],
    80: ["🌦", "Light showers"], 81: ["🌧", "Showers"], 82: ["🌧", "Heavy showers"],
    85: ["🌨", "Snow showers"], 86: ["❄", "Heavy snow showers"],
    95: ["⛈", "Thunderstorm"], 96: ["⛈", "Thunderstorm with hail"], 99: ["⛈", "Thunderstorm with hail"]
  };

  function apiUrl(p) {
    let u = "https://api.open-meteo.com/v1/forecast?latitude=" + p.lat + "&longitude=" + p.lon +
      "&current=temperature_2m,relative_humidity_2m,apparent_temperature,wind_speed_10m,surface_pressure,weather_code" +
      "&daily=temperature_2m_max,temperature_2m_min&forecast_days=1&timezone=auto";
    if (p.elevation) u += "&elevation=" + p.elevation;     // adjusts the numbers to the height of the place
    return u;
  }

  function getWeather(p) {
    return fetch(apiUrl(p)).then((res) => {
      if (!res.ok) throw new Error("Weather request failed");
      return res.json();
    });
  }

  function el(tag, className, text) {
    const e = document.createElement(tag);
    if (className) e.className = className;
    if (text !== undefined) e.textContent = text;
    return e;
  }

  function stat(label, value) {
    const box = el("div", "wx-stat");
    box.append(el("span", "wx-label", label), el("strong", "wx-value", value));
    return box;
  }

  function buildCard(p, d) {
    const c = d.current;
    const code = CODES[c.weather_code] || ["·", "Conditions unknown"];
    const elevation = p.elevation || Math.round(d.elevation);

    const card = el("article", "wx-card");

    const top = el("div", "wx-top");
    const names = el("div");
    names.append(el("h3", "wx-place", p.name), el("p", "wx-elev", p.country + " · " + elevation.toLocaleString() + " m"));
    top.append(names, el("span", "wx-icon", code[0]));

    const main = el("div", "wx-main");
    main.append(el("span", "wx-temp", Math.round(c.temperature_2m) + "°C"), el("span", "wx-cond", code[1]));

    const stats = el("div", "wx-stats");
    stats.append(
      stat("Feels like", Math.round(c.apparent_temperature) + "°C"),
      stat("Humidity", Math.round(c.relative_humidity_2m) + "%"),
      stat("Wind", Math.round(c.wind_speed_10m) + " km/h"),
      stat("Pressure", Math.round(c.surface_pressure) + " hPa")
    );

    const range = "Today: high " + Math.round(d.daily.temperature_2m_max[0]) + "°C, low " +
                  Math.round(d.daily.temperature_2m_min[0]) + "°C · updated " + c.time.slice(11, 16) + " local time";

    card.append(top, main, stats, el("p", "wx-foot", range));
    return card;
  }

  function errorCard(p) {
    const card = el("article", "wx-card");
    card.append(el("h3", "wx-place", p.name), el("p", "wx-foot", "Weather is not available right now. Please try again later."));
    return card;
  }

  // ----- The six mountains -----
  fetch(SITE_ROOT + "data/weather-places.json")
    .then((res) => res.json())
    .then((places) => Promise.all(places.map((p) =>
      getWeather(p).then((d) => buildCard(p, d)).catch(() => errorCard(p))
    )))
    .then((cards) => {
      grid.textContent = "";
      cards.forEach((c) => grid.appendChild(c));
    })
    .catch(() => {
      grid.textContent = "Could not load the places. Please open the site through Live Server.";
    });

  // ----- Weather where I am -----
  if (btn) {
    btn.addEventListener("click", () => {
      if (!navigator.geolocation) {
        note.textContent = "Geolocation is not supported by this browser.";
        return;
      }
      note.textContent = "Finding your location...";
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const p = { name: "Your location", country: "Lat " + pos.coords.latitude.toFixed(2) + ", Lon " + pos.coords.longitude.toFixed(2),
                      lat: pos.coords.latitude.toFixed(4), lon: pos.coords.longitude.toFixed(4) };
          getWeather(p)
            .then((d) => {
              mine.textContent = "";
              mine.appendChild(buildCard(p, d));
              note.textContent = "";
            })
            .catch(() => { note.textContent = "Could not get the weather for your location."; });
        },
        () => { note.textContent = "Could not get your location. Click Allow when the browser asks, and use Live Server."; }
      );
    });
  }
})();