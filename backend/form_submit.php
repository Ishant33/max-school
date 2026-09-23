<?php
// Contact-form handler.
//
// Every enquiry is written to backend/enquiries.json, which is what the CMS
// "Enquiries" screen reads. The CSV append and the email notification are kept
// as they were, but both are now best-effort: the enquiry is considered saved
// once it is in the JSON store, so a mail server that is down or a CSV that is
// not writable can no longer lose it.
//
// backend/.htaccess denies HTTP access to .json and .csv, so neither store is
// reachable from a browser.

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    header('Allow: POST');
    echo 'Method not allowed';
    exit;
}

// strip_tags leaves newlines behind, and a newline in a value that ends up in a
// mail header is a header-injection hole — collapse all whitespace runs.
function safe($key, $maxLength = 500)
{
    $value = isset($_POST[$key]) ? (string) $_POST[$key] : '';
    $value = strip_tags($value);
    $value = str_replace(["\r", "\n", "\t"], ' ', $value);
    $value = trim(preg_replace('/ {2,}/', ' ', $value));
    return mb_substr($value, 0, $maxLength);
}

// The message is the one field where line breaks are worth keeping.
function safe_message($key, $maxLength = 4000)
{
    $value = isset($_POST[$key]) ? (string) $_POST[$key] : '';
    $value = strip_tags($value);
    $value = str_replace("\r\n", "\n", $value);
    $value = preg_replace('/\n{3,}/', "\n\n", $value);
    return mb_substr(trim($value), 0, $maxLength);
}

$allowedRedirects = ['contact-us.html', 'index.html', 'index-preview.html', 'admission.html'];
$reqRedirect = safe('redirect', 50);
$redirect = in_array($reqRedirect, $allowedRedirects, true) ? $reqRedirect : 'contact-us.html';

function finish($status)
{
    global $redirect;
    $isAjax = (!empty($_SERVER['HTTP_X_REQUESTED_WITH']) && strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) === 'xmlhttprequest')
        || (isset($_SERVER['HTTP_ACCEPT']) && strpos($_SERVER['HTTP_ACCEPT'], 'application/json') !== false)
        || isset($_POST['ajax']);

    if ($isAjax) {
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode([
            'status' => $status,
            'ok'     => ($status === 'sent'),
            'message'=> ($status === 'sent')
                ? 'Thank you! Your enquiry has been recorded. Our admissions counselor will contact you shortly.'
                : 'Please check your information and try again.'
        ]);
        exit;
    }

    $base = rtrim(str_replace('\\', '/', dirname(dirname($_SERVER['SCRIPT_NAME'] ?? '/backend/x.php'))), '/');
    $hash = (strpos($redirect, 'index') !== false) ? '#enquiry' : '#enquiry-form';
    header('Location: ' . $base . '/' . $redirect . '?enquiry=' . $status . $hash);
    exit;
}

/* ---- honeypot ---------------------------------------------------------- */

// A field hidden from people but not from most bots. Pretend it worked so the
// bot does not learn anything, and write nothing.
if (trim((string) ($_POST['website'] ?? '')) !== '') {
    finish('sent');
}

/* ---- read + validate --------------------------------------------------- */

$name          = safe('name', 120);
$phone         = safe('phone', 40);
$email         = safe('email', 160);
$interest      = safe('interest', 80);
$message       = safe_message('message');
$student_class = safe('student_class', 80);
$academic_year = safe('academic_year', 40);

if ($student_class !== '') {
    if ($interest === '' || $interest === 'General Enquiry') {
        $interest = 'Admission Enquiry (' . $student_class . ')';
    }
    if ($message === '') {
        $message = "Admission Enquiry Details:\n"
            . "• Parent Name: " . $name . "\n"
            . "• Mobile Number: " . $phone . "\n"
            . "• Class/Grade Applying For: " . $student_class . "\n"
            . "• Academic Year: " . ($academic_year !== '' ? $academic_year : '2026–2027');
    }
}

if ($name === '' || $phone === '') {
    finish('invalid');
}
if ($email !== '' && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    finish('invalid');
}

$row = [
    'name'      => $name,
    'phone'     => $phone,
    'email'     => $email,
    'interest'  => $interest !== '' ? $interest : 'General Enquiry',
    'message'   => $message,
    'created'   => date('Y-m-d H:i:s'),
    'ip'        => substr((string) ($_SERVER['REMOTE_ADDR'] ?? ''), 0, 45),
    'is_read'   => false,
];

/* ---- store ------------------------------------------------------------- */

/**
 * Append under an exclusive lock. Two visitors submitting at the same moment
 * would otherwise read the same file and one would overwrite the other.
 */
function append_enquiry($file, $row)
{
    $fh = @fopen($file, 'c+');
    if (!$fh) {
        return false;
    }
    if (!flock($fh, LOCK_EX)) {
        fclose($fh);
        return false;
    }

    $list = json_decode((string) stream_get_contents($fh), true);
    if (!is_array($list)) {
        $list = [];
    }

    $ids = array_map(function ($item) {
        return (int) ($item['id'] ?? 0);
    }, $list);
    $row = ['id' => ($ids ? max($ids) : 0) + 1] + $row;
    $list[] = $row;

    // A flat file should not grow without bound; keep the most recent 2000.
    if (count($list) > 2000) {
        $list = array_slice($list, -2000);
    }

    $json = json_encode($list, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    $ok = false;
    if ($json !== false) {
        rewind($fh);
        $ok = ftruncate($fh, 0) && fwrite($fh, $json) !== false;
        fflush($fh);
    }

    flock($fh, LOCK_UN);
    fclose($fh);
    return $ok;
}

$stored = append_enquiry(__DIR__ . '/enquiries.json', $row);

/* ---- CSV mirror (best effort) ------------------------------------------ */

$csvFile = __DIR__ . '/contacts.csv';
$csv = @fopen($csvFile, 'a');
if ($csv) {
    if (flock($csv, LOCK_EX)) {
        if (ftell($csv) === 0) {
            fputcsv($csv, ['timestamp', 'name', 'phone', 'email', 'interest', 'message']);
        }
        // fputcsv quotes and escapes properly, unlike the comma-stripping this
        // file used to do — commas in a message no longer shift the columns.
        fputcsv($csv, [
            $row['created'], $name, $phone, $email, $row['interest'],
            str_replace("\n", ' ', $message),
        ]);
        flock($csv, LOCK_UN);
    }
    fclose($csv);
}

/* ---- email notification (best effort) ---------------------------------- */

$notify = 'info@maxinternationalschool.com,principal@maxinternationalschool.com';
$configFile = __DIR__ . '/config.php';
if (is_readable($configFile)) {
    $config = require $configFile;
    if (!empty($config['notify_emails'])) {
        $notify = $config['notify_emails'];
    }
}

$recipients = array_filter(array_map('trim', explode(',', $notify)), function ($address) {
    return filter_var($address, FILTER_VALIDATE_EMAIL) !== false;
});

if ($recipients) {
    $subject = 'Website enquiry: ' . $row['interest'];
    $body = "Time: {$row['created']}\nName: $name\nPhone: $phone\nEmail: $email\n"
        . "Interest: {$row['interest']}\n\nMessage:\n$message\n";

    // Never put the visitor's address in From:; a spoofed sender fails SPF and
    // the whole message gets binned. Reply-To is the safe place for it.
    $from = 'no-reply@maxinternationalschool.com';
    $headers = "From: Max International School <$from>\r\n"
        . 'Reply-To: ' . ($email !== '' ? $email : $from) . "\r\n"
        . "Content-Type: text/plain; charset=UTF-8\r\n"
        . 'X-Mailer: PHP/' . phpversion();

    @mail(implode(', ', $recipients), $subject, $body, $headers);
}

finish($stored ? 'sent' : 'error');
