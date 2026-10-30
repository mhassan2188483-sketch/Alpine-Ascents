(function () {
  "use strict";

  const holder = document.getElementById("faqList");
  if (!holder) return;

  fetch(SITE_ROOT + "data/faq.json")
    .then((res) => res.json())
    .then((items) => {
      holder.textContent = "";

      items.forEach((item, i) => {
        const id = "faq-" + i;

        const box = document.createElement("div");
        box.className = "accordion-item";

        const h = document.createElement("h3");
        h.className = "accordion-header";
        const btn = document.createElement("button");
        btn.className = "accordion-button collapsed";
        btn.type = "button";
        btn.setAttribute("data-bs-toggle", "collapse");
        btn.setAttribute("data-bs-target", "#" + id);
        btn.setAttribute("aria-expanded", "false");
        btn.setAttribute("aria-controls", id);
        btn.textContent = item.q;
        h.appendChild(btn);

        const panel = document.createElement("div");
        panel.id = id;
        panel.className = "accordion-collapse collapse";
        panel.setAttribute("data-bs-parent", "#faqList");
        const body = document.createElement("div");
        body.className = "accordion-body";
        body.textContent = item.a;
        panel.appendChild(body);

        box.append(h, panel);
        holder.appendChild(box);
      });
    })
    .catch(() => {
      holder.textContent = "Could not load the questions. Please open the site through Live Server.";
    });
})();