<?php

if (!defined('API_URL')) {
    define('API_URL', 'http://api:3070');
}

function callAPI($endpoint) {
    $url = API_URL . $endpoint;

    $response = @file_get_contents($url);

    if ($response === FALSE) {
        return null;
    }

    return json_decode($response, true);
}