<?php
require_once __DIR__ . '/session_init.php';
require_once __DIR__ . '/auth.php';
session_start();
header('Content-Type: application/json');

if (empty($_SESSION['cms_logged'])) {
    http_response_code(401);
    echo json_encode(['ok' => false, 'message' => 'Not authenticated']);
    exit;
}

$current = $_POST['current_password'] ?? '';
$new = $_POST['new_password'] ?? '';
$confirm = $_POST['confirm_password'] ?? '';
$email = $_SESSION['admin_email'] ?? '';

if ($new !== $confirm) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'message' => 'New passwords do not match']);
    exit;
}

if (strlen($new) < 8) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'message' => 'New password must be at least 8 characters']);
    exit;
}

if (!authenticate($email, $current)) {
    http_response_code(401);
    echo json_encode(['ok' => false, 'message' => 'Current password is incorrect']);
    exit;
}

$cfg = load_config();
$cfg['admin_password_hash'] = hash_password($new);
unset($cfg['admin_password']);

if (!save_config($cfg)) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'message' => 'Could not write config.php — check file permissions']);
    exit;
}

echo json_encode(['ok' => true, 'message' => 'Password updated']);
