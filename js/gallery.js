(function () {
  "use strict";

  const photoGrid = document.getElementById("photoGrid");
  const videoGrid = document.getElementById("videoGrid");
  if (!photoGrid || !videoGrid) return;

  const modalEl = document.getElementById("photoModal");
  const bigImg = document.getElementById("photoBig");
  const bigTitle = document.getElementById("photoTitle");
  // Turns a JSON value into an image address:
  //  - "photo-123..."         -> Unsplash picture
  //  - "images/gallery/a.jpg" -> a file in your images folder (or any full web link)
  function imgUrl(value, width) {
    if (value.startsWith("photo-")) {
      return "https://images.unsplash.com/" + value + "?auto=format&fit=crop&w=" + width + "&q=80";
    }
    if (/^(https?:)?\/\//.test(value)) return value;
    return SITE_ROOT + value;
  }

  // Pull the video ID out of a normal YouTube link
  function youtubeId(url) {
    const match = url.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([A-Za-z0-9_-]{11})/);
    return match ? match[1] : null;
  }

  fetch(SITE_ROOT + "data/gallery.json")
    .then((res) => res.json())
    .then((data) => {

      // ----- Photos -----
      data.images.forEach((img) => {
        const col = document.createElement("div");
        col.className = "col-6 col-md-4 col-lg-3";

        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "gallery-item";

        const thumb = document.createElement("img");
        thumb.src = imgUrl(img.src || img.id, 600);
        thumb.alt = img.title;
        thumb.loading = "lazy";

        const caption = document.createElement("span");
        caption.textContent = img.title;

        btn.append(thumb, caption);
        col.appendChild(btn);
        photoGrid.appendChild(col);

        btn.addEventListener("click", () => {
          bigImg.src = imgUrl(img.src || img.id, 1600);
          bigImg.alt = img.title;
          bigTitle.textContent = img.title;
          bootstrap.Modal.getOrCreateInstance(modalEl).show();
        });
      });

      // ----- Videos (paste normal YouTube links in gallery.json) -----
      if (!data.videos.length) {
        videoGrid.textContent = "Videos will be added soon.";
      }
      data.videos.forEach((v) => {
        const id = youtubeId(v.url || "");
        if (!id) return;                       // skip anything that isn't a YouTube link

        const col = document.createElement("div");
        col.className = "col-md-6";

        const ratio = document.createElement("div");
        ratio.className = "ratio ratio-16x9";
        const frame = document.createElement("iframe");
        frame.src = "https://www.youtube-nocookie.com/embed/" + id;
        frame.title = v.title;
        frame.loading = "lazy";
        frame.allowFullscreen = true;
        ratio.appendChild(frame);

        const title = document.createElement("h3");
        title.className = "video-title";
        title.textContent = v.title;

        col.append(ratio, title);
        videoGrid.appendChild(col);
      });
    })
    .catch(() => {
      photoGrid.textContent = "Could not load the gallery. Please open the site through Live Server.";
    });

  modalEl.addEventListener("hidden.bs.modal", () => { bigImg.src = ""; });
})();