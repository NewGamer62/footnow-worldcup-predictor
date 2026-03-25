// Auteur : Noa Gaillard
<?php
// URL interne au réseau Docker pour que le container PHP parle au container API
define('API_URL', 'http://api:3070/api'); 

// URL publique (utile pour les redirections si besoin, ou JS)
define('PUBLIC_URL', 'http://localhost:8080'); 
?>