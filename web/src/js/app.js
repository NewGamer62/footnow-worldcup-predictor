// GROUPS
if (document.getElementById("groups")) {
  fetch("data/groups.json")
    .then(res => res.json())
    .then(data => {
      const container = document.getElementById("groups");

      for (let group in data) {
        container.innerHTML += `<div class="card"><h2>${group}</h2>${data[group].join("<br>")}</div>`;
      }
    });
}

// HISTORY
if (document.getElementById("history")) {
  fetch("data/history.json")
    .then(res => res.json())
    .then(data => {
      const container = document.getElementById("history");

      data.forEach(item => {
        container.innerHTML += `
          <div class="card">
            <h2>${item.year}</h2>
            Winner: ${item.winner}<br>
            Final: ${item.final}
          </div>
        `;
      });
    });
}

// PREDICTION
function predict() {
  const t1 = document.getElementById("team1").value;
  const t2 = document.getElementById("team2").value;

  fetch("data/predictions.json")
    .then(res => res.json())
    .then(data => {
      const key = `${t1}-${t2}`;
      const result = data[key];

      if (result) {
        document.getElementById("result").innerHTML =
          `${t1}: ${result.morocco * 100}% <br>
           ${t2}: ${result.brazil * 100}%`;
      } else {
        document.getElementById("result").innerHTML = "No data";
      }
    });
}