<?php require_once("auth_check.php"); ?>

<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>Probabilites Coupe du Monde 2026</title>

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

  <div class="user-icon" onclick="toggleMenu()">⚽</div>
</header>

<div id="user-menu" class="user-menu">
  <p>👋 Bonjour <?php echo $_SESSION['user_email']; ?></p>
  <a href="#">❤️ Favoris</a>
  <a href="#">👤 Mon profil</a>
  <a href="logout.php">🚪 Deconnexion</a>
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

<h1 class="ranking-title">PROBABILITES COUPE DU MONDE 2026</h1>

<section class="proba-container">
  <div id="probabilities-container">
    <p class="proba-intro">Chargement des probabilites...</p>
  </div>
</section>

<script src="/js/app.js"></script>

<footer class="footer">
  <p>© 2026 FOOTNOW - Tous droits reserves</p>

  <div class="footer-links">
    <a href="#">Politique de confidentialite</a>
    <a href="#">Cookies</a>
    <a href="#">Conditions d'utilisation</a>
  </div>
</footer>

</body>
</html>
