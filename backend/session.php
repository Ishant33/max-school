<?php
require_once __DIR__ . '/session_init.php';
session_start();
header('Content-Type: application/json');
echo json_encode([
    'logged' => !empty($_SESSION['cms_logged']),
    'email' => $_SESSION['admin_email'] ?? '',
]);
