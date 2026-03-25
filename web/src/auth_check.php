// Auteur : Noa Gaillard
<?php
session_start();
require_once 'config.php';

// Si le token n'est pas en session, on renvoie vers la page de login
if (!isset($_SESSION['user_token'])) {
    header('Location: /login.php');
    exit();
}

/**
 * Fonction utilitaire pour appeler l'API avec le token
 */
function callApiAuthenticated($endpoint, $method = 'GET', $data = null) {
    $url = API_URL . $endpoint;
    $token = $_SESSION['user_token'];

    $options = [
        'http' => [
            'method'  => $method,
            'header'  => "Content-Type: application/json\r\n" .
                         "Authorization: Bearer " . $token . "\r\n",
            'ignore_errors' => true
        ]
    ];

    if ($data) {
        $options['http']['content'] = json_encode($data);
    }

    $context = stream_context_create($options);
    $response = file_get_contents($url, false, $context);
    
    return json_decode($response, true);
}
?>