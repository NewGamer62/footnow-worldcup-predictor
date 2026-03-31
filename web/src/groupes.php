<?php require_once("auth_check.php"); ?>

<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>Groupes CDM 2026</title>
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
    <img src="/assets/images/logo.png">
  </div>

  <div class="main-title">FOOTNOW</div>

  <div class="user-icon" onclick="toggleMenu()">⚽</div>
</header>

<div id="user-menu" class="user-menu">
  <p>👋 Bonjour <?php echo $_SESSION['user_email']; ?></p>
  <a href="#">❤️ Favoris</a>
  <a href="#">👤 Mon profil</a>
  <a href="logout.php">🚪 Déconnexion</a>
</div>

<nav class="main-menu">
  <a href="index.php">Accueil</a>
  <a href="ranking.php">Classement équipes</a>
  <a href="history.php">Historique matchs</a>
  <a href="groups.php">Groupes CDM26</a>
  <a href="proba.php">Probabilités 2026</a>
  <a href="prediction.php">Prédictions</a>
  <a href="news.php">Actualité</a>
</nav>

<h1 class="ranking-title">GROUPES CDM 2026</h1>

<div class="groups-container">
<?php require_once "config.php"; 
$groupes = callAPI('/groupes');
if ($groupes && isset($groupes['groupes'])): ?>
    <?php foreach($groupes['groupes'] as $g): ?>
    <div class="group">
        <h3><?php echo htmlspecialchars($g['nom']); ?></h3>
        <p style="color: #aaa; font-size: 0.8em;">ID: <?php echo $g['id_groupe']; ?></p>
    </div>
    <?php endforeach; ?>
<?php else: ?>
    <p style="color:white; text-align:center;">Chargement des groupes ou aucune donnée disponible.</p>
<?php endif; ?>
</div>

<script src="/js/app.js"></script>

<footer class="footer">
  <p>© 2026 FOOTNOW - Tous droits réservés</p>
</footer>

</body>
</html>

