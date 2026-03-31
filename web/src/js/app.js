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
    "iran": "ir",
    "denmark": "dk",
    "korea republic": "kr",
    "ecuador": "ec",
    "austria": "at",
    "turkey": "tr",
    "czech republic": "cz",
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
    "paraguay": "py",
    "scotland": "gb-sct",
    "cape verde": "cv",
    "ivory coast": "ci",
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

// Charger et afficher le classement des équipes (sans fallback)
async function loadRanking() {
    const container = document.querySelector(".ranking-container");
    if (!container) return;

    const data = await callAPI('/api/equipes');
    
    // ❌ PLUS DE FALLBACK - On affiche une erreur si API indisponible
    if (!data || !data.equipes || data.equipes.length === 0) {
        container.innerHTML = `
            <p style="color:red; text-align:center; padding:20px;">
                ❌ API indisponible ou base de données vide.<br>
                Vérifiez que Docker est lancé et que le seed a été exécuté.
            </p>
            <p style="color:white; text-align:center;">
                Commande: docker compose exec api npx prisma db seed
            </p>
        `;
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
    data.equipes.forEach(team => {
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

// Charger et afficher l'historique des matchs (sans fallback)
let historyPage = 1;
let historyLoading = false;
let historyTotalPages = 0;
let historyAllLoaded = false;

async function loadHistory(page = 1, append = false) {
    if (historyLoading) return;
    historyLoading = true;

    const container = document.getElementById("history");
    if (!container) return;

    const data = await callAPI(`/api/matchs-historique?page=${page}&limit=50`);
    
    if (!data || !data.matchs || data.matchs.length === 0) {
        historyAllLoaded = true;
        historyLoading = false;
        return;
    }

    historyTotalPages = data.pages || 0;

    let html = '';
    data.matchs.forEach(match => {
        const dateStr = new Date(match.date_match).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
        html += `
            <div class="history-item">
                <span class="date">${dateStr}</span>
                <span class="teams">
                    <span class="history-team">${getTeamFlagTag(match.equipe1, "history-flag") || match.equipe1 || 'NA'}${match.equipe1 || 'NA'}</span>
                    <strong>${match.score1 || 0} - ${match.score2 || 0}</strong>
                    <span class="history-team">${getTeamFlagTag(match.equipe2, "history-flag") || match.equipe2 || 'NA'}${match.equipe2 || 'NA'}</span>
                </span>
                <span class="tournoi">${match.tournoi || ''}</span>
            </div>
        `;
    });

    if (append) {
        container.querySelector('.history-list').innerHTML += html;
    } else {
        container.innerHTML = `<h2 class='ranking-title'>📊 Historique des Matchs (40k+ matchs)</h2><div class='history-list'>${html}</div>`;
    }

    historyPage = page;
    historyLoading = false;
}

function onHistoryScroll() {
    const container = document.getElementById("history");
    if (!container || historyAllLoaded || historyLoading) return;

    if (container.scrollTop + container.clientHeight >= container.scrollHeight - 100) {
        if (historyPage < historyTotalPages) {
            loadHistory(historyPage + 1, true);
        }
    }
}

// Initial load
document.addEventListener("DOMContentLoaded", function() {
    if (document.getElementById("history")) {
        loadHistory(1);
        document.getElementById("history").addEventListener('scroll', onHistoryScroll);
    }
});

// Charger et afficher les groupes (sans fallback)
async function loadGroups() {
    const container = document.querySelector(".groups-container");
    if (!container) return;

    const data = await callAPI('/api/groupes');
    
    if (!data || !data.groupes || data.groupes.length === 0) {
        container.innerHTML = `
            <p style="color:red; text-align:center; padding:20px;">
                ❌ Aucun groupe trouvé.<br>
                Vérifiez que le fichier fifa-world-cup-2026-UTC.csv a bien été importé.
            </p>
        `;
        return;
    }

    // Récupérer les matchs pour connaître les équipes de chaque groupe
    const matchsData = await callAPI('/api/matchs-cdm2026');
    const groupesMap = {};
    
    if (matchsData && matchsData.matchs) {
        matchsData.matchs.forEach(match => {
            if (match.id_groupe) {
                if (!groupesMap[match.id_groupe]) {
                    groupesMap[match.id_groupe] = {
                        nom: match.groupe?.nom || `Groupe ${match.id_groupe}`,
                        equipes: new Set()
                    };
                }
                if (match.equipe_dom && match.equipe_dom !== 'To be announced') {
                    groupesMap[match.id_groupe].equipes.add(match.equipe_dom);
                }
                if (match.equipe_ext && match.equipe_ext !== 'To be announced') {
                    groupesMap[match.id_groupe].equipes.add(match.equipe_ext);
                }
            }
        });
    }

    let html = "";
    data.groupes.forEach(g => {
        const equipes = groupesMap[g.id_groupe]?.equipes || [];
        html += `<div class="group"><h3>${g.nom}</h3><ul>`;
        if (equipes.size > 0) {
            equipes.forEach(team => {
                html += `<li>${getTeamFlagTag(team)}<span>${team}</span></li>`;
            });
        } else {
            html += `<li>Équipes à déterminer</li>`;
        }
        html += "</ul></div>";
    });
    container.innerHTML = html;
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
                    <h3>${getTeamFlagTag(team)} ${team}</h3>
                    <div class="scores">
                        <p>Score FIFA: ${fifaData ? (fifaData.score_fifa * 100).toFixed(1) + '%' : 'N/A'}</p>
                        <p>Forme récente: ${formeData ? (formeData.forme_recente * 100).toFixed(1) + '%' : 'N/A'}</p>
                    </div>
                </div>
            `;
        } catch (error) {
            html += `
                <div class="prediction-card">
                    <h3>${getTeamFlagTag(team)} ${team}</h3>
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

// Charger les probabilités de la CDM 2026 (sans fallback)
async function loadWorldCupProbabilities() {
    const container = document.getElementById("probabilities-container");
    if (!container) return;

    const data = await callAPI('/api/probabilites-2026');
    
    if (!data || !data.favoris || data.favoris.length === 0) {
        container.innerHTML = `
            <p class="proba-intro" style="color:red; text-align:center;">
                ❌ Impossible de charger les probabilités.<br>
                Vérifiez que l'API est accessible.
            </p>
        `;
        return;
    }

    const teams = data.favoris;

    let html = `<p class='proba-intro'>Projection des favoris de la Coupe du Monde 2026 selon les statistiques disponibles (forme, classement FIFA et historique).</p><div class='proba-grid'>`;
    teams.forEach((team, index) => {
        const ranking = index + 1;
        const probability = Number(team.probabilite_titulo) || 0;
        const barWidth = Math.max(0, Math.min(100, probability));

        html += `
            <div class='proba-card'>
                <div class='proba-rank'>${index + 1}</div>
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