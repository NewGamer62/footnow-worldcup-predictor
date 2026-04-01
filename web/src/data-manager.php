<?php require_once("auth_check.php"); ?>
<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Gerer les donnees</title>
<link rel="stylesheet" href="/css/style.css">
<link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700&display=swap" rel="stylesheet">
<link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap" rel="stylesheet">
<link href="https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;600&display=swap" rel="stylesheet">
</head>
<body>

<video autoplay muted loop id="bg-video">
  <source src="/assets/videos/bg.mp4" type="video/mp4">
</video>

<header class="main-header">
  <div class="logo">
    <img src="/assets/images/logo.png" alt="logo">
  </div>

  <div class="main-title">FOOTNOW</div>

  <div class="user-icon" onclick="toggleMenu()" aria-label="Menu utilisateur"></div>
</header>

<div id="user-menu" class="user-menu">
  <p>Bonjour <?php echo $_SESSION['user_email']; ?></p>
  <a href="favorites.php">Favoris</a>
  <a href="profile.php">Mon profil</a>
  <a href="logout.php">Deconnexion</a>
</div>

<nav class="main-menu">
  <a href="index.php">Accueil</a>
  <a href="ranking.php">Classement equipes</a>
  <a href="history.php">Historique matchs</a>
  <a href="groups.php">Groupes CDM26</a>
  <a href="proba.php">Probabilites 2026</a>
  <a href="prediction.php">Predictions</a>
  <a href="news.php">Actualite</a>
</nav>

<section class="home-content">
  <h1 class="glow-title">GERER LES DONNEES</h1>
  <p>Importer des fichiers JSON/CSV et exporter les donnees en JSON.</p>
</section>

<section class="data-manager-container">
  <article class="data-card">
    <h2>Importer dans la base</h2>

    <div class="data-form-grid">
      <div>
        <label for="import-target">Table cible</label>
        <select id="import-target">
          <option value="equipes">Equipes</option>
          <option value="matchs-historique">Matchs historiques</option>
        </select>
      </div>

      <div>
        <label for="import-format">Format</label>
        <select id="import-format">
          <option value="json">JSON</option>
          <option value="csv">CSV</option>
        </select>
      </div>
    </div>

    <div style="margin-top:14px;">
      <label for="import-file">Fichier</label>
      <input id="import-file" type="file" accept=".json,.csv,text/csv,application/json">
    </div>

    <div class="data-actions">
      <button id="import-btn" class="data-btn" type="button">Importer</button>
    </div>

    <p id="import-status" class="data-status"></p>
  </article>

  <article class="data-card">
    <h2>Exporter depuis la base</h2>

    <div class="data-form-grid">
      <div>
        <label for="export-target">Table cible</label>
        <select id="export-target">
          <option value="equipes">Equipes</option>
          <option value="matchs-historique">Matchs historiques</option>
        </select>
      </div>

      <div>
        <label>Format</label>
        <input type="text" value="json" disabled>
      </div>
    </div>

    <div class="data-actions">
      <button id="export-btn" class="data-btn secondary" type="button">Exporter JSON</button>
    </div>

    <p id="export-status" class="data-status"></p>
  </article>
</section>

<script src="/js/app.js"></script>
<script>
(function () {
  const host = window.location.hostname;
  const apiBaseUrl = host === 'localhost' || host === '127.0.0.1'
    ? `${window.location.protocol}//${host}:3070`
    : '';

  async function readFileAsText(file) {
    return await file.text();
  }

  async function onImport() {
    const target = document.getElementById('import-target').value;
    const format = document.getElementById('import-format').value;
    const fileInput = document.getElementById('import-file');
    const statusEl = document.getElementById('import-status');

    if (!fileInput.files || fileInput.files.length === 0) {
      statusEl.textContent = 'Selectionne un fichier JSON ou CSV.';
      return;
    }

    try {
      statusEl.textContent = 'Import en cours...';
      const raw = await readFileAsText(fileInput.files[0]);
      const payloadData = format === 'json' ? JSON.parse(raw) : raw;

      const response = await fetch(`${apiBaseUrl}/api/import/${target}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          format,
          data: payloadData
        })
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.error || result?.details || 'Import echoue');
      }

      statusEl.textContent = `Import termine. Lignes: ${result.total_lignes}, inserees: ${result.inserted}, ignorees: ${result.skipped}.`;
    } catch (error) {
      statusEl.textContent = `Erreur import: ${error.message || 'inconnue'}`;
    }
  }

  async function onExport() {
    const target = document.getElementById('export-target').value;
    const statusEl = document.getElementById('export-status');

    try {
      statusEl.textContent = 'Export en cours...';

      const response = await fetch(`${apiBaseUrl}/api/export/${target}?format=json`);
      if (!response.ok) {
        throw new Error('Export echoue');
      }

      const payload = await response.json();
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${target}.json`;
      a.click();
      URL.revokeObjectURL(url);

      statusEl.textContent = `Export JSON termine pour ${target}.`;
    } catch (error) {
      statusEl.textContent = `Erreur export: ${error.message || 'inconnue'}`;
    }
  }

  document.getElementById('import-btn').addEventListener('click', onImport);
  document.getElementById('export-btn').addEventListener('click', onExport);
})();
</script>

<footer class="footer">
  <p>© 2026 FOOTNOW - Tous droits reserves</p>

  <div class="footer-links">
    <a href="privacy.php">Politique de confidentialite</a>
    <a href="cookies.php">Cookies</a>
    <a href="terms.php">Conditions d'utilisation</a>
    <a href="data-manager.php">Gerer les donnees</a>
  </div>
</footer>

</body>
</html>
