<?php
session_start();

$error = null;

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $email = $_POST['email'];
    $password = $_POST['password'];

    if (
        isset($_SESSION['registered_email']) &&
        $email === $_SESSION['registered_email'] &&
        $password === $_SESSION['registered_password']
    ) {
        $_SESSION['user_token'] = "fake_token";
        $_SESSION['user_email'] = $email;

        header("Location: index.php");
        exit();
    } else {
        $error = "Identifiants incorrects";
    }
}
?>

<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>Connexion</title>

<link rel="stylesheet" href="/css/style.css">

<!-- FONT SPORT -->
<link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700&display=swap" rel="stylesheet">
</head>

<body class="auth-body">

<div class="auth-container">

    <div class="auth-left">
        <h1>FOOTNOW</h1>
        <p>Le meilleur site pour analyser les matchs et prédire les résultats de la Coupe du Monde.</p>
    </div>

    <div class="auth-form">

        <h2>Connexion</h2>

        <?php if ($error): ?>
        <p class="error"><?php echo $error; ?></p>
        <?php endif; ?>

        <form method="POST">
            <input type="email" name="email" placeholder="Email" required>
            <input type="password" name="password" placeholder="Mot de passe" required>

            <button>Se connecter</button>
        </form>

        <p>Pas encore de compte ? <a href="register.php">Créer un compte</a></p>

    </div>

</div>

</body>
</html>