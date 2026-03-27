// ===== USER MENU =====

// toggle menu
function toggleMenu() {
  const menu = document.getElementById("user-menu");
    if (!menu) return;
  menu.style.display = menu.style.display === "block" ? "none" : "block";
}

// fermer si click ailleurs
document.addEventListener("click", function(event) {
  const menu = document.getElementById("user-menu");
  const icon = document.querySelector(".user-icon");

    if (!menu || !icon) return;

  if (!menu.contains(event.target) && !icon.contains(event.target)) {
    menu.style.display = "none";
  }
});


// ===== COUNTDOWN =====
const targetDate = new Date("June 11, 2026 00:00:00").getTime();

setInterval(() => {
    const daysEl = document.getElementById("days");
    const hoursEl = document.getElementById("hours");
    const minutesEl = document.getElementById("minutes");
    const secondsEl = document.getElementById("seconds");

    if (!daysEl || !hoursEl || !minutesEl || !secondsEl) {
        return;
    }

  const now = new Date().getTime();
  const diff = targetDate - now;

    daysEl.innerText = Math.floor(diff / (1000 * 60 * 60 * 24));
    hoursEl.innerText = Math.floor((diff / (1000 * 60 * 60)) % 24);
    minutesEl.innerText = Math.floor((diff / (1000 * 60)) % 60);
    secondsEl.innerText = Math.floor((diff / 1000) % 60);

}, 1000);

function toggleFavorite(team) {
    let favorites = JSON.parse(localStorage.getItem("favorites")) || [];

    if (favorites.includes(team)) {
        favorites = favorites.filter(t => t !== team);
    } else {
        favorites.push(team);
    }

    localStorage.setItem("favorites", JSON.stringify(favorites));

    updateFavoritesUI();
}

function updateFavoritesUI() {
    let favorites = JSON.parse(localStorage.getItem("favorites")) || [];

    document.querySelectorAll(".fav-btn").forEach(btn => {
        let team = btn.getAttribute("data-team");

        if (favorites.includes(team)) {
            btn.classList.add("active");
            btn.innerHTML = "❤️";
        } else {
            btn.classList.remove("active");
            btn.innerHTML = "🤍";
        }
    });
    document.querySelectorAll(".fav-badge").forEach(badge => {
    let team = badge.getAttribute("data-team");

    if (favorites.includes(team)) {
        badge.innerHTML = "⭐";
    } else {
        badge.innerHTML = "";
    }
    });
}

document.addEventListener("DOMContentLoaded", updateFavoritesUI);

const COUNTRY_CODE_MAP = {
    "argentina": "ar",
    "france": "fr",
    "brazil": "br",
    "england": "gb-eng",
    "belgium": "be",
    "spain": "es",
    "portugal": "pt",
    "netherlands": "nl",
    "morocco": "ma",
    "germany": "de",
    "croatia": "hr",
    "italy": "it",
    "colombia": "co",
    "senegal": "sn",
    "usa": "us",
    "mexico": "mx",
    "uruguay": "uy",
    "switzerland": "ch",
    "japan": "jp",
    "ir iran": "ir",
    "denmark": "dk",
    "korea republic": "kr",
    "ecuador": "ec",
    "austria": "at",
    "turkey": "tr",
    "czech republic": "cz",
    "czechia": "cz",
    "nigeria": "ng",
    "australia": "au",
    "algeria": "dz",
    "canada": "ca",
    "egypt": "eg",
    "norway": "no",
    "panama": "pa",
    "qatar": "qa",
    "slovakia": "sk",
    "cameroon": "cm",
    "tunisia": "tn",
    "romania": "ro",
    "costa rica": "cr",
    "uzbekistan": "uz",
    "peru": "pe",
    "chile": "cl",
    "slovenia": "si",
    "south africa": "za",
    "saudi arabia": "sa",
    "jordan": "jo",
    "ghana": "gh",
    "georgia": "ge",
    "bolivia": "bo",
    "haiti": "ht",
    "new zealand": "nz",
    "iran": "ir",
    "paraguay": "py",
    "scotland": "gb-sct",
    "cabo verde": "cv",
    "cape verde": "cv",
    "ivory coast": "ci",
    "cote d'ivoire": "ci",
    "curacao": "cw",
    "south korea": "kr",
    "to be announced": "un",
    "tbd": "un",
    "na": "un"
};

function normalizeTeamName(teamName) {
    if (!teamName) return "";
    return String(teamName)
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
}

function getTeamFlagUrl(teamName) {
    const normalized = normalizeTeamName(teamName);
    const code = COUNTRY_CODE_MAP[normalized];
    if (!code) return null;
    return `https://flagcdn.com/w40/${code}.png`;
}

function getTeamFlagTag(teamName, cssClass = "team-flag") {
    const flagUrl = getTeamFlagUrl(teamName);
    if (!flagUrl) return "";
    return `<img class='${cssClass}' src='${flagUrl}' alt='Drapeau ${teamName}'>`;
}

// ===== API FUNCTIONS =====

// Fonction générique pour appeler l'API
async function callAPI(endpoint) {
    try {
        const host = window.location.hostname;
        const apiBaseUrl = host === 'localhost' || host === '127.0.0.1'
            ? `${window.location.protocol}//${host}:3070`
            : '';

        const response = await fetch(`${apiBaseUrl}${endpoint}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Erreur API:', error);
        return null;
    }
}

// Charger et afficher le classement des équipes
async function loadRanking() {
    const container = document.querySelector(".ranking-container");
    if (!container) return;

    const data = await callAPI('/api/equipes');
    const fallbackRanking = [
        { nom: 'Argentina', classement: 1, points_fifa: 1858.0 },
        { nom: 'France', classement: 2, points_fifa: 1840.6 },
        { nom: 'Brazil', classement: 3, points_fifa: 1837.9 },
        { nom: 'England', classement: 4, points_fifa: 1794.9 },
        { nom: 'Belgium', classement: 5, points_fifa: 1789.0 }
    ];

    const equipes = data && data.equipes ? data.equipes : fallbackRanking;

    if (!data || !data.equipes) {
        container.innerHTML = "<p>API indisponible: affichage d'un classement local.</p>";
    }

    if (equipes.length === 0) {
        container.innerHTML = "<p>Aucune équipe trouvée. Veuillez exécuter le seed de la base de données avec : docker compose exec api npx prisma db seed</p>";
        return;
    }

    let html = `
        <div class='ranking-header'>
            <span>Rang</span>
            <span>Equipe</span>
            <span style='text-align:right'>Points FIFA</span>
            <span style='text-align:center'>Fav</span>
        </div>
    `;
    let rank = 1;
    equipes.forEach(team => {
        const rankAPI = team.classement || rank;
        const pointsValue = Number(team.points_fifa);
        const points = Number.isFinite(pointsValue) ? pointsValue.toFixed(1) : 'N/A';
        html += `
            <div class='ranking-card'>
                <span class='rank'>${rankAPI}</span>
                <span class='team-name'>
                    ${getTeamFlagTag(team.nom)}
                    ${team.nom}
                    <span class='fav-badge' data-team='${team.nom}'></span>
                </span>
                <span class='points'>${points} pts</span>
                <span class='fav-btn' data-team='${team.nom}' onclick='toggleFavorite("${team.nom}")'>🤍</span>
            </div>
        `;
        rank++;
    });
    container.innerHTML = html;
    updateFavoritesUI();
}

// Charger et afficher l'historique des matchs
async function loadHistory() {
    const container = document.getElementById("history");
    if (!container) return;

    const data = await callAPI('/api/matchs-historique');
    if (!data || !data.matchs) {
        // Fallback vers données statiques si l'API n'est pas disponible
        const historyData = [
            { date_match: "2022-12-18", equipe1: "Argentina", equipe2: "France", score1: 3, score2: 3 },
            { date_match: "2022-12-17", equipe1: "Morocco", equipe2: "Croatia", score1: 1, score2: 2 }
        ];

        let html = "<h2 class='ranking-title'>📊 Historique des Matchs</h2><div class='history-list'>";
        historyData.forEach(match => {
            html += `
                <div class="history-item">
                    <span class="date">${match.date_match}</span>
                    <span class="teams">
                        <span class="history-team">${getTeamFlagTag(match.equipe1, "history-flag")}${match.equipe1}</span>
                        <strong>${match.score1} - ${match.score2}</strong>
                        <span class="history-team">${getTeamFlagTag(match.equipe2, "history-flag")}${match.equipe2}</span>
                    </span>
                </div>
            `;
        });
        html += "</div>";
        container.innerHTML = html;
        return;
    }

    const cleanMatches = data.matchs.filter(match => {
        const team1 = normalizeTeamName(match.equipe1);
        const team2 = normalizeTeamName(match.equipe2);
        return team1 && team2 && team1 !== "na" && team2 !== "na";
    });

    let html = "<h2 class='ranking-title'>📊 Historique des Matchs</h2><div class='history-list'>";
    cleanMatches.forEach(match => {
        html += `
            <div class="history-item">
                <span class="date">${match.date_match || 'N/A'}</span>
                <span class="teams">
                    <span class="history-team">${getTeamFlagTag(match.equipe1 || 'Team1', "history-flag")}${match.equipe1 || 'Team1'}</span>
                    <strong>${match.score1 || 0} - ${match.score2 || 0}</strong>
                    <span class="history-team">${getTeamFlagTag(match.equipe2 || 'Team2', "history-flag")}${match.equipe2 || 'Team2'}</span>
                </span>
            </div>
        `;
    });
    html += "</div>";
    container.innerHTML = html;
}

// Charger et afficher les groupes
async function loadGroups() {
    const container = document.querySelector(".groups-container");
    if (!container) return;

    const data = await callAPI('/api/groupes');
    if (!data || !data.groupes) {
        // Fallback vers données statiques si l'API n'est pas disponible
        const groupsData = {
            "Group A": ["Mexico", "South Africa", "South Korea", "TBD"],
            "Group B": ["Canada", "TBD", "Qatar", "Switzerland"],
            "Group C": ["Brazil", "Morocco", "Haiti", "Scotland"],
            "Group D": ["USA", "Paraguay", "Australia", "TBD"],
            "Group E": ["Germany", "Curaçao", "Ivory Coast", "Ecuador"],
            "Group F": ["Netherlands", "Japan", "TBD", "Tunisia"],
            "Group G": ["Belgium", "Egypt", "Iran", "New Zealand"],
            "Group H": ["Spain", "Cape Verde", "Saudi Arabia", "Uruguay"],
            "Group I": ["France", "Senegal", "TBD", "Norway"],
            "Group J": ["Argentina", "Algeria", "Austria", "Jordan"],
            "Group K": ["Portugal", "TBD", "Uzbekistan", "Colombia"],
            "Group L": ["England", "Croatia", "Ghana", "Panama"]
        };

        let html = "";
        Object.entries(groupsData).forEach(([groupName, teams]) => {
            html += `<div class="group"><h3>${groupName}</h3><ul>`;
            teams.forEach(team => {
                html += `<li>${getTeamFlagTag(team)}<span>${team}</span></li>`;
            });
            html += "</ul></div>";
        });
        container.innerHTML = html;
        return;
    }

    // TODO: Implémenter l'affichage des groupes depuis l'API
    // Pour l'instant, afficher un message
    container.innerHTML = "<p>Données des groupes en cours d'implémentation dans l'API</p>";
}

// Charger et afficher les prédictions
async function loadPredictions() {
    const container = document.getElementById("predictions-container");
    if (!container) return;

    let favorites = JSON.parse(localStorage.getItem("favorites")) || [];
    if (favorites.length === 0) {
        container.innerHTML = "<p style='color:white;text-align:center'>Ajoute des équipes en favoris ❤️</p>";
        return;
    }

    let html = "";
    for (const team of favorites) {
        try {
            const fifaData = await callAPI(`/api/scores/fifa/${encodeURIComponent(team)}`);
            const formeData = await callAPI(`/api/scores/forme/${encodeURIComponent(team)}`);

            html += `
                <div class="prediction-card">
                    <h3>${team}</h3>
                    <div class="scores">
                        <p>Score FIFA: ${fifaData ? (fifaData.score_fifa * 100).toFixed(1) + '%' : 'N/A'}</p>
                        <p>Forme récente: ${formeData ? (formeData.forme_recente * 100).toFixed(1) + '%' : 'N/A'}</p>
                    </div>
                </div>
            `;
        } catch (error) {
            html += `
                <div class="prediction-card">
                    <h3>${team}</h3>
                    <p>Erreur lors du chargement des données</p>
                </div>
            `;
        }
    }
    container.innerHTML = html;
}

// Charger et afficher les détails d'une équipe
async function loadTeamDetails(teamName) {
    const container = document.getElementById("teamMatches");
    if (!container) return;

    // TODO: Ajouter la route /api/equipes/:nom/matchs à l'API
    container.innerHTML = `<h3>Matchs de ${teamName}</h3><p>Fonctionnalité à implémenter</p>`;
}

async function loadWorldCupProbabilities() {
    const container = document.getElementById("probabilities-container");
    if (!container) return;

    const data = await callAPI('/api/probabilites-2026');
    const fallback = [
        { classement: 1, equipe: 'Argentina', probabilite_titulo: 31.2 },
        { classement: 2, equipe: 'France', probabilite_titulo: 29.5 },
        { classement: 3, equipe: 'Brazil', probabilite_titulo: 24.8 },
        { classement: 4, equipe: 'Spain', probabilite_titulo: 21.6 },
        { classement: 5, equipe: 'England', probabilite_titulo: 20.1 },
        { classement: 6, equipe: 'Morocco', probabilite_titulo: 14.0 }
    ];

    const teams = data && data.favoris ? data.favoris : fallback;

    let html = `<p class='proba-intro'>Projection des favoris de la Coupe du Monde 2026 selon les statistiques disponibles (forme, classement FIFA et historique).</p><div class='proba-grid'>`;
    teams.forEach((team, index) => {
        const ranking = team.classement || index + 1;
        const probability = Number(team.probabilite_titulo) || 0;
        const barWidth = Math.max(0, Math.min(100, probability));

        html += `
            <div class='proba-card'>
                <div class='proba-rank'>${ranking}</div>
                <div class='proba-team'>${getTeamFlagTag(team.equipe, "team-flag")}${team.equipe}</div>
                <div class='proba-bar'><div class='proba-fill' style='width:${barWidth}%'></div></div>
                <div class='proba-value'>${probability.toFixed(1)}%</div>
            </div>
        `;
    });
    html += "</div>";
    container.innerHTML = html;
}

// ===== PAGE INITIALIZATION =====

// Initialiser les pages selon leur contenu
document.addEventListener("DOMContentLoaded", function() {
    updateFavoritesUI();

    // Initialiser selon la page courante
    if (document.querySelector(".ranking-container")) {
        loadRanking();
    }
    if (document.getElementById("history")) {
        loadHistory();
    }
    if (document.querySelector(".groups-container")) {
        loadGroups();
    }
    if (document.getElementById("predictions-container")) {
        loadPredictions();
    }
    if (document.getElementById("teamMatches")) {
        const urlParams = new URLSearchParams(window.location.search);
        const team = urlParams.get('team') || 'Morocco';
        loadTeamDetails(team);
    }
    if (document.getElementById("probabilities-container")) {
        loadWorldCupProbabilities();
    }
});