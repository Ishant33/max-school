<?php
// Shared upload handling for cms_admin.php and disclosure_admin.php.
// Validates the REAL mime type with finfo rather than trusting $_FILES['type'],
// which is supplied by the browser and trivially spoofed.

// kind => [allowed mime => extension], subdirectory, max bytes
function upload_profiles()
{
    $images = [
        'image/jpeg' => 'jpg',
        'image/png'  => 'png',
        'image/webp' => 'webp',
    ];
    $pdf = ['application/pdf' => 'pdf'];

    return [
        'image' => [
            'types' => $images,
            'dir'   => 'uploads/cms/',
            'max'   => 5 * 1024 * 1024,
        ],
        // Replacements for photos that ship with the site (media_admin.php).
        // Kept in their own folder so the originals in assets/img are never
        // overwritten and a replacement can always be reverted.
        'site' => [
            'types' => $images,
            'dir'   => 'uploads/site/',
            'max'   => 8 * 1024 * 1024,
        ],
        'newsletter' => [
            'types' => $images + $pdf,
            'dir'   => 'uploads/newsletters/',
            'max'   => 10 * 1024 * 1024,
        ],
        'disclosure_b' => [
            'types' => $pdf,
            'dir'   => 'uploads/disclosure/b/',
            'max'   => 10 * 1024 * 1024,
        ],
        'disclosure_c' => [
            'types' => $pdf,
            'dir'   => 'uploads/disclosure/c/',
            'max'   => 10 * 1024 * 1024,
        ],
        'fees' => [
            'types' => $pdf,
            'dir'   => 'uploads/fees/',
            'max'   => 10 * 1024 * 1024,
        ],
    ];
}

// Drop a guard file so nothing uploaded can ever be executed as a script,
// even if a future mime check is bypassed.
function protect_upload_dir($dir)
{
    $guard = $dir . '.htaccess';
    if (file_exists($guard)) {
        return;
    }
    file_put_contents($guard, implode("\n", [
        'php_flag engine off',
        'AddType text/plain .php .phtml .php3 .php4 .php5 .php7 .phps .cgi .pl .py',
        '<FilesMatch "\.(php|phtml|php[0-9]|phps|cgi|pl|py|sh)$">',
        '  Require all denied',
        '</FilesMatch>',
        '',
    ]));
}

function human_size($bytes)
{
    return round($bytes / (1024 * 1024)) . ' MB';
}

/**
 * Absolute path of a stored upload, or null if it does not resolve to a file
 * inside backend/uploads/. Anything that deletes an upload must go through
 * this: realpath containment is what stops a crafted value walking out of the
 * folder, and returning null for a miss means callers can only ever unlink a
 * path this function has already vouched for.
 *
 * Stored values come in two shapes — the site-relative "backend/uploads/cms/x.jpg"
 * twin returned as `path`, and the SCRIPT_NAME-derived "/backend/uploads/cms/x.jpg"
 * returned as `url`, which also carries the sub-folder prefix when the site is
 * deployed below the domain root. Both name the same file, so the folder is
 * located inside the value rather than assumed to start it.
 *
 * @return string|null
 */
function upload_realpath($relative)
{
    $value = str_replace('\\', '/', trim((string) $relative));
    // Drop a cache-buster or fragment before anything else looks at the path.
    $value = preg_replace('/[?#].*$/', '', $value);
    if ($value === '' || strpos($value, '..') !== false) {
        return null;
    }

    $uploads = realpath(__DIR__ . '/uploads');
    if ($uploads === false) {
        return null;
    }

    $needle = '/' . basename(__DIR__) . '/uploads/';
    $at = strpos('/' . ltrim($value, '/'), $needle);
    if ($at === false) {
        return null;
    }
    $tail = substr('/' . ltrim($value, '/'), $at + strlen($needle));
    if ($tail === '' || $tail === false) {
        return null;
    }

    $candidate = realpath($uploads . '/' . $tail);
    if ($candidate === false || !is_file($candidate)) {
        return null;
    }
    $uploads = str_replace('\\', '/', $uploads);
    $candidate = str_replace('\\', '/', $candidate);
    return strpos($candidate, $uploads . '/') === 0 ? $candidate : null;
}

/**
 * @return array ['ok' => bool, 'url' => string, 'message' => string, 'status' => int]
 */
function handle_upload($file, $kind = 'image')
{
    $profiles = upload_profiles();
    if (!isset($profiles[$kind])) {
        return ['ok' => false, 'message' => 'Unknown upload type', 'status' => 400];
    }
    $profile = $profiles[$kind];

    if (!is_array($file) || !isset($file['tmp_name'])) {
        return ['ok' => false, 'message' => 'No file received', 'status' => 400];
    }

    if (!empty($file['error'])) {
        $errors = [
            UPLOAD_ERR_INI_SIZE   => 'File is larger than the server allows',
            UPLOAD_ERR_FORM_SIZE  => 'File is too large',
            UPLOAD_ERR_PARTIAL    => 'Upload was interrupted — please try again',
            UPLOAD_ERR_NO_FILE    => 'No file was selected',
            UPLOAD_ERR_NO_TMP_DIR => 'Server is missing a temp folder',
            UPLOAD_ERR_CANT_WRITE => 'Server could not write the file',
        ];
        $msg = $errors[$file['error']] ?? 'Upload failed';
        return ['ok' => false, 'message' => $msg, 'status' => 400];
    }

    if (!is_uploaded_file($file['tmp_name'])) {
        return ['ok' => false, 'message' => 'Invalid upload', 'status' => 400];
    }

    if ($file['size'] > $profile['max']) {
        return [
            'ok' => false,
            'message' => 'File is too large (max ' . human_size($profile['max']) . ')',
            'status' => 400,
        ];
    }

    // Real content sniffing — this is what stops shell.php.jpg
    $mime = '';
    if (function_exists('finfo_open')) {
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        if ($finfo) {
            $mime = (string) finfo_file($finfo, $file['tmp_name']);
            finfo_close($finfo);
        }
    }
    if ($mime === '' && function_exists('mime_content_type')) {
        $mime = (string) mime_content_type($file['tmp_name']);
    }
    if ($mime === '') {
        return ['ok' => false, 'message' => 'Could not verify file type on this server', 'status' => 500];
    }

    if (!isset($profile['types'][$mime])) {
        $allowed = implode(', ', array_values($profile['types']));
        return [
            'ok' => false,
            'message' => 'Unsupported file type. Allowed: ' . strtoupper($allowed),
            'status' => 400,
        ];
    }

    // Extension comes from the detected type, never from the uploaded filename.
    $ext = $profile['types'][$mime];
    $base = pathinfo((string) $file['name'], PATHINFO_FILENAME);
    $base = strtolower(preg_replace('/[^a-z0-9]+/i', '-', $base));
    $base = trim($base, '-');
    if ($base === '') {
        $base = 'file';
    }
    $base = substr($base, 0, 48);

    $dir = __DIR__ . '/' . $profile['dir'];
    if (!is_dir($dir) && !mkdir($dir, 0755, true) && !is_dir($dir)) {
        return ['ok' => false, 'message' => 'Could not create the upload folder', 'status' => 500];
    }
    protect_upload_dir(__DIR__ . '/uploads/');

    $name = $base . '-' . bin2hex(random_bytes(6)) . '.' . $ext;
    if (!move_uploaded_file($file['tmp_name'], $dir . $name)) {
        return ['ok' => false, 'message' => 'Could not save the file — check folder permissions', 'status' => 500];
    }
    @chmod($dir . $name, 0644);

    $base_url = rtrim(str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME'] ?? '/backend/x.php')), '/');

    return [
        'ok' => true,
        'url' => $base_url . '/' . $profile['dir'] . $name,
        // Site-relative twin of `url` ("backend/uploads/site/x.jpg"), derived
        // from the folder layout rather than from SCRIPT_NAME. Store this when
        // the value has to keep working from any page depth.
        'path' => basename(__DIR__) . '/' . $profile['dir'] . $name,
        'kind' => $kind,
        'mime' => $mime,
    ];
}
