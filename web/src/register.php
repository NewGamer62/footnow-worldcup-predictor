// Auteur : Noa Gaillard
<?php
require_once 'includes/config.php';

$message = null;

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = [
        'email' => $_POST['email'],
        'password' => $_POST['password'],
        'name' => $_POST['name']
    ];

    $options = [
        'http' => [
            'method'  => 'POST',
            'header'  => "Content-Type: application/json\r\n",
            'content' => json_encode($data),
            'ignore_errors' => true
        ]
    ];

    $context  = stream_context_create($options);
    $result = file_get_contents(API_URL . '/auth/register', false, $context);
    $response = json_decode($result, true);

    if (isset($response['id'])) { // Si l'API renvoie l'objet créé
        header('Location: /login.php?registered=1');
        exit();
    } else {
        $message = $response['message'] ?? "Erreur lors de l'inscription.";
    }
}
?>

<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Inscription - CDM 2026</title>
</head>
<body>
    <h1>Créer un compte</h1>
    <?php if ($message): ?>
        <p style="color: red;"><?php echo htmlspecialchars($message); ?></p>
    <?php endif; ?>

    <form method="POST">
        <input type="text" name="name" placeholder="Nom complet" required><br>
        <input type="email" name="email" placeholder="Email" required><br>
        <input type="password" name="password" placeholder="Mot de passe" required><br>
        <button type="submit">S'inscrire</button>
    </form>
</body>
</html>