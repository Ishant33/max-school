<?php
// Authentication utilities

function config_path() {
    return __DIR__ . '/config.php';
}

function load_config() {
    return include config_path();
}

// Rewrites config.php preserving the documentation header.
function save_config(array $cfg) {
    $header = <<<'PHPDOC'
<?php
// Administrator credentials and site settings.
//
// The password is stored as a bcrypt hash in 'admin_password_hash'.
// Change your password from the CMS dashboard (Change Password)
// rather than editing this file by hand.

return [
PHPDOC;

    $lines = [$header];
    foreach ($cfg as $key => $value) {
        $lines[] = sprintf("    %s => %s,", var_export($key, true), var_export($value, true));
    }
    $lines[] = "];\n";

    $tmp = config_path() . '.tmp';
    if (file_put_contents($tmp, implode("\n", $lines), LOCK_EX) === false) {
        return false;
    }
    return rename($tmp, config_path());
}

// Verifies a password against config, transparently migrating a legacy
// plaintext credential to a bcrypt hash on first successful use.
function authenticate($email, $password) {
    $cfg = load_config();
    if (!hash_equals((string) $cfg['admin_email'], (string) $email)) {
        return false;
    }

    $hash = $cfg['admin_password_hash'] ?? '';
    if ($hash !== '') {
        return verify_password($password, $hash);
    }

    // One-time migration from the legacy plaintext credential.
    $legacy = $cfg['admin_password'] ?? '';
    if ($legacy === '' || !hash_equals((string) $legacy, (string) $password)) {
        return false;
    }

    $cfg['admin_password_hash'] = hash_password($password);
    unset($cfg['admin_password']);
    save_config($cfg);
    return true;
}

function hash_password($plain) {
    return password_hash($plain, PASSWORD_BCRYPT, ['cost' => 12]);
}

function verify_password($plain, $hash) {
    return password_verify($plain, $hash);
}

function get_client_ip() {
    if (!empty($_SERVER['HTTP_CF_CONNECTING_IP'])) {
        return $_SERVER['HTTP_CF_CONNECTING_IP'];
    }
    if (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
        $ips = explode(',', $_SERVER['HTTP_X_FORWARDED_FOR']);
        return trim($ips[0]);
    }
    return $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
}

function check_rate_limit() {
    $attemptsFile = __DIR__ . '/.login_attempts.json';
    $ip = get_client_ip();
    $now = time();
    $lockout = 900; // 15 minutes
    $maxAttempts = 5;

    $attempts = [];
    if (file_exists($attemptsFile)) {
        $attempts = json_decode(file_get_contents($attemptsFile), true) ?: [];
    }

    // Clean old attempts (> 1 hour)
    $attempts = array_filter($attempts, function($data) use ($now) {
        return ($now - $data['first']) < 3600;
    });

    if (isset($attempts[$ip])) {
        $data = $attempts[$ip];
        if ($data['count'] >= $maxAttempts && ($now - $data['last']) < $lockout) {
            $remaining = $lockout - ($now - $data['last']);
            return ['locked' => true, 'remaining' => ceil($remaining / 60)];
        }
    }

    return ['locked' => false];
}

function record_failed_attempt() {
    $attemptsFile = __DIR__ . '/.login_attempts.json';
    $ip = get_client_ip();
    $now = time();

    $attempts = [];
    if (file_exists($attemptsFile)) {
        $attempts = json_decode(file_get_contents($attemptsFile), true) ?: [];
    }

    if (!isset($attempts[$ip])) {
        $attempts[$ip] = ['count' => 0, 'first' => $now, 'last' => $now];
    }

    $attempts[$ip]['count']++;
    $attempts[$ip]['last'] = $now;

    file_put_contents($attemptsFile, json_encode($attempts));
}

function clear_failed_attempts() {
    $attemptsFile = __DIR__ . '/.login_attempts.json';
    $ip = get_client_ip();

    if (file_exists($attemptsFile)) {
        $attempts = json_decode(file_get_contents($attemptsFile), true) ?: [];
        unset($attempts[$ip]);
        file_put_contents($attemptsFile, json_encode($attempts));
    }
}
