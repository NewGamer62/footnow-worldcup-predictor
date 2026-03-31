<?php
session_start();

if (!isset($_SESSION['user_token'])) {
    header("Location: /login.php");
    exit();
}
