<?php
session_start();
header('Content-Type: application/json');
$cfg = include __DIR__ . '/config.php';
$email = $_POST['email'] ?? '';
$password = $_POST['password'] ?? '';
if ($email === $cfg['admin_email'] && $password === $cfg['admin_password']) {
    $_SESSION['cms_logged'] = true;
    echo json_encode(['ok' => true]);
} else {
    http_response_code(401);
    echo json_encode(['ok' => false, 'message' => 'Invalid credentials']);
}
