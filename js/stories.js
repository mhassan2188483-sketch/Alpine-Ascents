(function () {
  "use strict";

  const grid = document.getElementById("storyGrid");
  if (!grid) return;
  // Turns a JSON value into an image address:
  //  - "photo-123..."          -> Unsplash picture
  //  - "images/gallery/a.jpg"  -> your own file (or any full web link)
  function imgUrl(value, width) {
    if (value.startsWith("photo-")) {
      return "https://images.unsplash.com/" + value + "?auto=format&fit=crop&w=" + width + "&q=80";
    }
    if (/^(https?:)?\/\//.test(value)) return value;      // a full web link
    return SITE_ROOT + value;                                // a file in the images folder, e.g. images/Just-Everest.avif
  };
  fetch(SITE_ROOT + "data/stories.json")
    .then((res) => res.json())
    .then((stories) => {
        grid.textContent = "";   
      stories.forEach((s) => {
        const col = document.createElement("div");
        col.className = "col-md-6 col-lg-4";

        const card = document.createElement("article");
        card.className = "trip-card";            // same card style as the Expeditions page

        const imageBox = document.createElement("div");
        imageBox.className = "trip-image";
        const img = document.createElement("img");
        img.src = imgUrl(s.image, 1000);
        img.alt = s.title;
        img.loading = "lazy";
        const tag = document.createElement("span");
        tag.className = "trip-tag";
        tag.textContent = s.tag;
        imageBox.append(img, tag);

        const body = document.createElement("div");
        body.className = "trip-body";
        const meta = document.createElement("div");
        meta.className = "trip-meta";
        const place = document.createElement("span");
        place.textContent = s.place;
        const length = document.createElement("span");
        length.textContent = s.meta;
        meta.append(place, length);
        const h3 = document.createElement("h3");
        h3.textContent = s.title;
        const p = document.createElement("p");
        p.textContent = s.text;
        body.append(meta, h3, p);
        if (s.url) {
          const link = document.createElement("a");
          link.className = "card-link";
          link.href = s.url;
          link.target = "_blank";
          link.rel = "noopener";
          link.textContent = "Source: " + s.source + " ↗";
          body.appendChild(link);
        }

        card.append(imageBox, body);
        col.appendChild(card);
        grid.appendChild(col);
      });
    })
    .catch(() => {
      grid.textContent = "Could not load the stories. Please open the site through Live Server.";
    });
})();