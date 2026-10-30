(function () {
  "use strict";

  const peaksBody = document.getElementById("peaksBody");
  const firstsBody = document.getElementById("firstsBody");
  if (!peaksBody || !firstsBody) return;

  // Add one table row from a list of cell texts
  function addRow(tbody, cells) {
    const tr = document.createElement("tr");
    cells.forEach((text) => {
      const td = document.createElement("td");
      td.textContent = text;
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  }

  fetch(SITE_ROOT + "data/records.json")
    .then((res) => res.json())
    .then((data) => {
      data.peaks.forEach((p) =>
        addRow(peaksBody, [p.rank, p.name, p.height.toLocaleString() + " m", p.country, p.year, p.climbers])
      );
      data.firsts.forEach((f) =>
        addRow(firstsBody, [f.year, f.title, f.who])
      );
    })
    .catch(() => {
      document.getElementById("recordsError").textContent =
        "Could not load the records. Please open the site through Live Server.";
    });
})();