(function () {
  "use strict";

  const holder = document.getElementById("topicContent");
  if (!holder) return;
  const topic = holder.dataset.topic;          // e.g. "history"

  fetch(SITE_ROOT + "data/topics.json")
    .then((res) => res.json())
    .then((data) => {
      const items = data[topic] || [];
      holder.textContent = "";

      const row = document.createElement("div");
      row.className = "row g-4";

      items.forEach((item, i) => {
        const col = document.createElement("div");
        col.className = "col-md-6 col-lg-4";
        const card = document.createElement("div");
        card.className = "principle-card";          // same card style as the About page

        const num = document.createElement("span");
        num.textContent = String(i + 1).padStart(2, "0");
        const h3 = document.createElement("h3");
        h3.textContent = item.title;
        const p = document.createElement("p");
        p.textContent = item.text;

        card.append(num, h3, p);
        col.appendChild(card);
        row.appendChild(col);
      });

      holder.appendChild(row);
    })
    .catch(() => {
      holder.textContent = "Could not load this content. Please open the site through Live Server.";
    });
})();