<?php
require_once __DIR__ . '/session_init.php';
require_once __DIR__ . '/auth.php';
session_start();
header('Content-Type: application/json');

$limit = check_rate_limit();
if ($limit['locked']) {
    http_response_code(429);
    echo json_encode([
        'ok' => false,
        'message' => "Too many failed attempts. Try again in {$limit['remaining']} minute(s).",
    ]);
    exit;
}

$email = $_POST['email'] ?? '';
$password = $_POST['password'] ?? '';

if (authenticate($email, $password)) {
    clear_failed_attempts();
    session_regenerate_id(true);
    $_SESSION['cms_logged'] = true;
    $_SESSION['admin_email'] = $email;
    echo json_encode(['ok' => true, 'email' => $email]);
} else {
    record_failed_attempt();
    http_response_code(401);
    echo json_encode(['ok' => false, 'message' => 'Invalid email or password']);
}
