<?php
// Simple form handler: appends submissions to a CSV and emails site admins.
if (
    $_SERVER['REQUEST_METHOD'] !== 'POST'
) {
    http_response_code(405);
    echo "Method not allowed";
    exit;
}

function safe($k) {
    return isset($_POST[$k]) ? trim(strip_tags($_POST[$k])) : '';
}

$name = safe('name');
$phone = safe('phone');
$email = safe('email');
$interest = safe('interest');
$message = safe('message');
$timestamp = date('Y-m-d H:i:s');

$csvDir = __DIR__;
$csvFile = $csvDir . '/contacts.csv';

// Ensure CSV exists with header
if (!file_exists($csvFile)) {
    file_put_contents($csvFile, "timestamp,name,phone,email,interest,message\n");
}

$line = sprintf("%s,%s,%s,%s,%s,%s\n",
    str_replace(',', ' ', $timestamp),
    str_replace(',', ' ', $name),
    str_replace(',', ' ', $phone),
    str_replace(',', ' ', $email),
    str_replace(',', ' ', $interest),
    str_replace(',', ' ', preg_replace('/\r?\n/',' ', $message))
);

file_put_contents($csvFile, $line, FILE_APPEND | LOCK_EX);

// Email notification (best-effort)
$to = "info@maxinternationalschool.com, principal@maxinternationalschool.com";
$subject = "Website enquiry: " . ($interest ?: 'General Enquiry');
$body = "Time: $timestamp\nName: $name\nPhone: $phone\nEmail: $email\nInterest: $interest\n\nMessage:\n$message\n";
$headers = "From: " . ($email ?: 'no-reply@maxinternationalschool.com') . "\r\n" .
           "Reply-To: " . ($email ?: 'no-reply@maxinternationalschool.com') . "\r\n" .
           "X-Mailer: PHP/" . phpversion();

@mail($to, $subject, $body, $headers);

// Redirect back with a simple anchor
if (!empty($_SERVER['HTTP_REFERER'])) {
    header('Location: ' . $_SERVER['HTTP_REFERER'] . '#contact');
    exit;
}

echo "Thank you — your enquiry has been received.";

?>
