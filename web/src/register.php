<?php
session_start();

$success = false;

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $_SESSION['registered_email'] = $_POST['email'];
    $_SESSION['registered_password'] = $_POST['password'];

    $success = true;
}
?>

<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>Inscription</title>

<link rel="stylesheet" href="/css/style.css">
<link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700&display=swap" rel="stylesheet">
</head>

<body class="auth-body">

<div class="auth-container">

    <div class="auth-left">
        <h1>FOOTNOW</h1>
        <p>Rejoins la plateforme et commence à prédire les matchs.</p>
    </div>

    <div class="auth-form">

        <h2>Inscription</h2>

        <?php if ($success): ?>
            <p class="success">Compte créé avec succès</p>
            <a href="login.php"><button>Se connecter</button></a>
        <?php else: ?>

        <form method="POST">
            <input type="email" name="email" placeholder="Email" required>
            <input type="password" name="password" placeholder="Mot de passe" required>

            <button>S'inscrire</button>
        </form>

        <p>Déjà un compte ? <a href="login.php">Connexion</a></p>

        <?php endif; ?>

    </div>

</div>

</body>
</html>