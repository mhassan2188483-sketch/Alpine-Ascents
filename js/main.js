// Folder that holds css/, js/, images/, data/ and index.html (works from any page)
const SITE_ROOT = new URL("../", document.currentScript.src).href;

// Update the copyright year automatically.
document.querySelectorAll("[data-year]").forEach((node) => {
  node.textContent = new Date().getFullYear();
});

// Filter the expedition cards by trip category.
const filterButtons = document.querySelectorAll("[data-filter]");
const expeditionItems = document.querySelectorAll(".expedition-item");

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const filter = button.dataset.filter;

    filterButtons.forEach((item) => item.classList.remove("active"));
    button.classList.add("active");

    expeditionItems.forEach((card) => {
      const categories = (card.dataset.category || "").split(" ");
      const shouldShow = filter === "all" || categories.includes(filter);
      card.classList.toggle("is-hidden", !shouldShow);
    });
  });
});

// Preselect the trip or course when a visitor follows an enquiry link.
const query = new URLSearchParams(window.location.search);
const interestSelect = document.querySelector("#interest");
const messageField = document.querySelector("#message");
const requestedTrip = query.get("trip");
const requestedCourse = query.get("course");

if (requestedTrip && messageField) {
  messageField.value = `I'm interested in: ${requestedTrip}. Please share more information.`;
}
if (requestedCourse && messageField) {
  messageField.value = `I'm interested in the course: ${requestedCourse}. Please share more information.`;
}
if ((requestedTrip || requestedCourse) && interestSelect) {
  const text = requestedCourse ? "Training course" : "Not sure yet";
  const option = [...interestSelect.options].find((item) => item.text === text);
  if (option) interestSelect.value = option.value || option.text;
}

// Contact form: checks the fields, then opens the visitor's email app with the message ready to send.
// Put your group's real email address between the quotes below.
const CONTACT_EMAIL = "";
const contactForm = document.querySelector("#contactForm");
const formMessage = document.querySelector("#formMessage");

if (contactForm && formMessage) {
  contactForm.addEventListener("submit", (event) => {
    event.preventDefault();

    if (!contactForm.checkValidity()) {
      contactForm.reportValidity();
      return;
    }

    const value = (id) => document.querySelector(id).value.trim();
    const name = value("#fullName");
    const body = [
      "Name: " + name,
      "Email: " + value("#email"),
      "Interested in: " + (value("#interest") || "not chosen"),
      "Experience: " + (value("#experience") || "not chosen"),
      "",
      value("#message")
    ].join("\n");

    window.location.href = "mailto:" + CONTACT_EMAIL +
      "?subject=" + encodeURIComponent("Enquiry from " + name) +
      "&body=" + encodeURIComponent(body);

    formMessage.textContent = `Thanks, ${name}. Your email app should open with your message ready to send. If it does not, call +1 (206) 378-1927.`;
    formMessage.classList.add("show");
  });
}
// ===== Fade in / out on scroll (CSS-based, works on all pages) =====
const fadeSelectors = [
  ".hero-content",
  ".trip-card",
  ".page-hero .container > *",
  ".section-heading",
  ".principle-card",
  ".course-card",
  ".section-contrast .col-lg-6",
  ".filter-bar",
  ".contact-form",
  "main .col-lg-5 > *"
].join(", ");

const fadeObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    entry.target.classList.toggle("visible", entry.isIntersecting);
  });
}, { threshold: 0.15 });

document.querySelectorAll(fadeSelectors).forEach((el, i) => {
  el.classList.add("fade-target");
  el.style.transitionDelay = (i % 3) * 100 + "ms"; // small stagger
  fadeObserver.observe(el);
});
// ===== Visitor count (navbar) + date/time/location ticker (bottom) =====
(function () {
  "use strict";

  /* ---------- Visitor count ---------- */
  // Add the badge to the navbar, just before the Login / avatar item
  const authSlot = document.getElementById("authNavItem");
  if (authSlot) {
    const li = document.createElement("li");
    li.className = "nav-item";
    li.innerHTML = '<span class="visitor-badge">Visitors: <strong id="visitorCount">0</strong></span>';
    authSlot.parentNode.insertBefore(li, authSlot);
  }

  let count = parseInt(localStorage.getItem("sb_visitors"), 10) || 0;
  if (!sessionStorage.getItem("sb_counted")) {     // count once per visit, not on every page
    count++;
    localStorage.setItem("sb_visitors", count);
    sessionStorage.setItem("sb_counted", "yes");
  }
  const countEl = document.getElementById("visitorCount");
  if (countEl) countEl.textContent = count;

  /* ---------- Ticker bar ---------- */
  const bar = document.createElement("div");
  bar.className = "ticker-bar";
  bar.innerHTML = '<div id="ticker">Loading...</div>';
  document.body.appendChild(bar);

  let locationText = sessionStorage.getItem("sb_location") || "waiting for location permission...";

  function updateTicker() {
    const now = new Date();
    const date = now.toLocaleDateString("en-GB", {
      weekday: "long", day: "numeric", month: "long", year: "numeric"
    });
    const time = now.toLocaleTimeString("en-GB");
    document.getElementById("ticker").textContent =
      "Date: " + date + "   |   Time: " + time + "   |   Location: " + locationText;
  }

  // Ask for the location only once per visit, then remember the answer
  if (!sessionStorage.getItem("sb_location")) {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        function (pos) {
          locationText = "Lat " + pos.coords.latitude.toFixed(4) +
                         ", Lon " + pos.coords.longitude.toFixed(4);
          sessionStorage.setItem("sb_location", locationText);
          updateTicker();
        },
        function () {
          locationText = "unavailable";
          sessionStorage.setItem("sb_location", locationText);
          updateTicker();
        }
      );
    } else {
      locationText = "not supported by this browser";
    }
  }

  updateTicker();
  setInterval(updateTicker, 1000);
})();
(function () {
  "use strict";

  const mapEl = document.getElementById("clubMap");
  if (!mapEl) return;

  // ----- Create the map (OpenStreetMap tiles) -----
  const map = L.map("clubMap").setView([30, 40], 2);
  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 18,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);

  const markerLayer = L.layerGroup().addTo(map);
  const listEl = document.getElementById("clubList");
  const regionEl = document.getElementById("regionFilter");
  const nearBtn = document.getElementById("nearMeBtn");
  const statusEl = document.getElementById("nearStatus");

  let clubs = [];
  let userPos = null;
  let userMarker = null;

  // ----- Distance between two coordinates, in km (Haversine formula) -----
  function distanceKm(lat1, lng1, lat2, lng2) {
    const toRad = (d) => d * Math.PI / 180;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a = Math.sin(dLat / 2) ** 2 +
              Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  // ----- Build the popup that opens when a marker is clicked -----
  function popupContent(c) {
    const box = document.createElement("div");
    const title = document.createElement("strong");
    title.textContent = c.name;
    const place = document.createElement("div");
    place.textContent = c.city + ", " + c.country;
    const desc = document.createElement("div");
    desc.textContent = c.description;
    desc.style.marginTop = "6px";
    box.append(title, place, desc);
    return box;
  }

  // ----- Draw markers and the list -----
  function render(fitMap) {
    markerLayer.clearLayers();
    listEl.textContent = "";

    const region = regionEl.value;
    let list = clubs
      .filter((c) => region === "all" || c.region === region)
      .map((c) => ({
        ...c,
        km: userPos ? distanceKm(userPos.lat, userPos.lng, c.lat, c.lng) : null
      }));

    if (userPos) list.sort((a, b) => a.km - b.km);   // nearest first

    list.forEach((c) => {
      const marker = L.marker([c.lat, c.lng]).bindPopup(popupContent(c)).addTo(markerLayer);

      const card = document.createElement("div");
      card.className = "club-card";

      const h3 = document.createElement("h3");
      h3.textContent = c.name;
      const place = document.createElement("div");
      place.className = "club-place";
      place.textContent = (c.city + ", " + c.country).toUpperCase();
      const p = document.createElement("p");
      p.textContent = c.description;
      card.append(h3, place, p);

      if (c.km !== null) {
        const km = document.createElement("div");
        km.className = "club-km";
        km.textContent = Math.round(c.km).toLocaleString() + " km from you";
        card.appendChild(km);
      }

      // Clicking a card zooms to its marker
      card.addEventListener("click", () => {
        map.flyTo([c.lat, c.lng], 6);
        marker.openPopup();
      });
      listEl.appendChild(card);
    });

    if (fitMap && list.length) {
      map.fitBounds(L.latLngBounds(list.map((c) => [c.lat, c.lng])).pad(0.3), { maxZoom: 6 });
    }
    return list;
  }

  // ----- Load the clubs from the JSON file -----
  fetch(SITE_ROOT + "data/clubs.json")
    .then((res) => res.json())
    .then((data) => { clubs = data; render(true); })
    .catch(() => {
      listEl.textContent = "Could not load the clubs. Please open the site through Live Server.";
    });

  // ----- Region filter -----
  regionEl.addEventListener("change", () => render(true));

  // ----- "Find clubs near me" (HTML5 Geolocation) -----
  nearBtn.addEventListener("click", () => {
    if (!navigator.geolocation) {
      statusEl.textContent = "Geolocation is not supported by this browser.";
      return;
    }
    statusEl.textContent = "Finding your location...";

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        userPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };

        if (userMarker) userMarker.remove();
        userMarker = L.circleMarker([userPos.lat, userPos.lng], {
          radius: 9, color: "#ffffff", weight: 2, fillColor: "#2f80ed", fillOpacity: 1
        }).addTo(map).bindPopup("You are here");

        regionEl.value = "all";
        const list = render(false);
        const nearest = list[0];
        statusEl.textContent = "Nearest club: " + nearest.name + " (" +
                               Math.round(nearest.km).toLocaleString() + " km away)";
        map.fitBounds([[userPos.lat, userPos.lng], [nearest.lat, nearest.lng]], { padding: [50, 50] });
      },
      () => {
        statusEl.textContent = "Could not get your location. Click Allow when the browser asks, and open the site through Live Server.";
      }
    );
  });
})();
// Favicon: the small icon shown on the browser tab
(function () {
  if (document.querySelector('link[rel="icon"]')) return;   // already has one

  const icon = document.createElement("link");
  icon.rel = "icon";
  icon.type = "image/png";
  icon.href = SITE_ROOT + "images/Logo.png";
  document.head.appendChild(icon);
})();

// ===== Dark / light mode toggle =====
(function () {
  const root = document.documentElement;
  const btn = document.getElementById("themeToggle");
  if (!btn) return;

  function apply(theme) {
    root.setAttribute("data-theme", theme);
    const light = theme === "light";
    btn.querySelector("span").textContent = light ? "☾" : "☀";   // icon shows what you will switch to
    const label = light ? "Switch to dark mode" : "Switch to light mode";
    btn.setAttribute("aria-label", label);
    btn.title = label;
  }

  apply(root.getAttribute("data-theme") === "light" ? "light" : "dark");

  btn.addEventListener("click", () => {
    const next = root.getAttribute("data-theme") === "light" ? "dark" : "light";
    apply(next);
    try { localStorage.setItem("aa_theme", next); } catch (e) {}
  });
})();

// Add FAQ and Weather to the menu and the footer on every page
(function () {
  const PAGES = SITE_ROOT + "pages/";
  const find = (selector) => document.querySelector(selector);

  function addToMenu(afterFile, file, label) {
    if (find('.navbar-nav a.nav-link[href$="' + file + '"]')) return;          // already there
    const anchor = find('.navbar-nav a.nav-link[href$="' + afterFile + '"]');
    if (!anchor) return;
    const li = document.createElement("li");
    li.className = "nav-item";
    const a = document.createElement("a");
    a.className = "nav-link";
    a.href = PAGES + file;
    a.textContent = label;
    li.appendChild(a);
    anchor.closest("li").insertAdjacentElement("afterend", li);
  }

  function addToFooter(afterFile, file, label) {
    if (find('.footer-col a[href$="' + file + '"]')) return;
    const anchor = find('.footer-col a[href$="' + afterFile + '"]');
    if (!anchor) return;
    const a = document.createElement("a");
    a.href = PAGES + file;
    a.textContent = label;
    anchor.insertAdjacentElement("afterend", a);
  }

  addToMenu("guidelines.html", "weather.html", "Weather");
  addToMenu("weather.html", "faq.html", "FAQ");
  addToFooter("guidelines.html", "faq.html", "FAQ");
  addToFooter("clubs.html", "weather.html", "Weather");
})();
