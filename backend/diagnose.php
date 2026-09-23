<?php
/* ==========================================================================
   CMS write diagnostic — TEMPORARY.
   Upload this to backend/, open it in the browser while logged into the CMS,
   read the results, then DELETE this file from the server.

   It answers one question: why isn't cms_storage.json being written?
   ========================================================================== */

require_once __DIR__ . '/session_init.php';
session_start();

header('Content-Type: text/html; charset=utf-8');

// Gated behind the same login as the panel so it cannot leak server details.
if (empty($_SESSION['cms_logged'])) {
    http_response_code(401);
    echo '<h2 style="font-family:sans-serif">Not logged in</h2>'
       . '<p style="font-family:sans-serif">Open <a href="../admin.html">admin.html</a>, '
       . 'sign in, then come back to this page.</p>';
    exit;
}

function row($label, $ok, $detail = '')
{
    $icon  = $ok === null ? '•' : ($ok ? '&#10004;' : '&#10008;');
    $color = $ok === null ? '#5B6B85' : ($ok ? '#166534' : '#B42318');
    echo '<tr>'
       . '<td style="padding:8px 12px;border-bottom:1px solid #E4E9F1;">' . htmlspecialchars($label) . '</td>'
       . '<td style="padding:8px 12px;border-bottom:1px solid #E4E9F1;color:' . $color . ';font-weight:600;">'
       . $icon . '</td>'
       . '<td style="padding:8px 12px;border-bottom:1px solid #E4E9F1;font-family:monospace;font-size:13px;">'
       . htmlspecialchars($detail) . '</td>'
       . '</tr>';
}

$dir      = __DIR__;
$dataFile = $dir . '/cms_storage.json';
$discFile = $dir . '/disclosure_data.json';

echo '<!DOCTYPE html><html><head><meta charset="utf-8"><title>CMS Diagnostic</title></head>'
   . '<body style="font-family:system-ui,sans-serif;max-width:900px;margin:40px auto;padding:0 20px;color:#152238;">'
   . '<h1 style="color:#0B2E59;">CMS Write Diagnostic</h1>'
   . '<table style="width:100%;border-collapse:collapse;background:#fff;border:1px solid #E4E9F1;">'
   . '<tr style="background:#F5F7FB;"><th style="text-align:left;padding:10px 12px;">Check</th>'
   . '<th style="padding:10px 12px;width:40px;">OK</th>'
   . '<th style="text-align:left;padding:10px 12px;">Detail</th></tr>';

/* ---- who is PHP running as ---- */
$user = function_exists('posix_geteuid') && function_exists('posix_getpwuid')
    ? (posix_getpwuid(posix_geteuid())['name'] ?? 'unknown')
    : (get_current_user() ?: 'unknown');
row('PHP is running as user', null, $user);

/* ---- folder ---- */
$dirWritable = is_writable($dir);
row('backend/ folder is writable', $dirWritable, substr(sprintf('%o', fileperms($dir)), -4));

/* ---- cms_storage.json ---- */
$exists = file_exists($dataFile);
row('cms_storage.json exists', $exists, $exists ? $dataFile : 'MISSING — will be created on first save');

if ($exists) {
    row('cms_storage.json is writable', is_writable($dataFile), substr(sprintf('%o', fileperms($dataFile)), -4));
    row('cms_storage.json owner', null, function_exists('posix_getpwuid')
        ? (posix_getpwuid(fileowner($dataFile))['name'] ?? (string) fileowner($dataFile))
        : (string) fileowner($dataFile));

    $raw   = (string) file_get_contents($dataFile);
    $items = json_decode($raw, true);
    row('cms_storage.json is valid JSON', is_array($items),
        is_array($items) ? count($items) . ' item(s) stored' : 'PARSE ERROR: ' . json_last_error_msg());
    row('File size', null, strlen($raw) . ' bytes');
}

/* ---- the real test: can we actually write? ---- */
$tmp     = $dataFile . '.tmp';
$canTmp  = @file_put_contents($tmp, '[]') !== false;
row('Can create temp file (.tmp)', $canTmp, $canTmp ? 'yes' : 'NO — this is what blocks saving');

if ($canTmp) {
    // Restore whatever was there rather than clobbering real data.
    $existing = $exists ? (string) file_get_contents($dataFile) : '[]';
    @file_put_contents($tmp, $existing);
    $canRename = @rename($tmp, $dataFile);
    row('Can rename temp over cms_storage.json', $canRename, $canRename ? 'yes' : 'NO — rename blocked');
    if (!$canRename) {
        @unlink($tmp);
    }
}

/* ---- disclosure ---- */
row('disclosure_data.json exists', file_exists($discFile),
    file_exists($discFile) ? (is_writable($discFile) ? 'writable' : 'NOT writable') : 'MISSING — upload it');

/* ---- is the fixed cms_admin.php deployed? ---- */
$adminSrc = @file_get_contents($dir . '/cms_admin.php');
$isFixed  = $adminSrc !== false && strpos($adminSrc, 'save_items') !== false;
row('cms_admin.php is the FIXED version', $isFixed,
    $isFixed ? 'contains save_items()' : 'OLD version — re-upload backend/cms_admin.php');

/* ---- uploads ---- */
foreach (['uploads', 'uploads/cms', 'uploads/newsletters', 'uploads/disclosure/b', 'uploads/disclosure/c'] as $sub) {
    $p = $dir . '/' . $sub;
    row($sub . '/', is_dir($p) && is_writable($p),
        !is_dir($p) ? 'MISSING — create it (755)' : (is_writable($p) ? 'writable' : 'NOT writable — chmod 755'));
}

echo '</table>';

/* ==========================================================================
   Live save test.
   The checks above prove PHP *can* write the file. They do not prove a POST
   from the browser reaches the insert branch — session cookies, mod_security
   and rewrite rules all sit between the two. This button fires the exact
   request the panel fires and prints the raw, unparsed reply, so a 403 HTML
   error page or a 401 is visible instead of being swallowed by a toast.
   ========================================================================== */
?>
<h2 style="color:#0B2E59;margin-top:34px;">Live save test</h2>
<p>This sends the same request the CMS panel sends when you click Save. It creates
a throwaway item in the <code>about</code> module, which you can delete afterwards
from the panel.</p>
<button id="run" style="background:#F1791E;color:#fff;border:0;padding:12px 22px;
  border-radius:8px;font-size:15px;font-weight:600;cursor:pointer;">Run save test</button>
<pre id="out" style="background:#0B2E59;color:#D8E6F7;padding:16px;border-radius:8px;
  margin-top:16px;white-space:pre-wrap;word-break:break-word;font-size:13px;
  line-height:1.55;display:none;"></pre>
<script>
document.getElementById('run').addEventListener('click', async function () {
    var out = document.getElementById('out');
    out.style.display = 'block';
    out.textContent = 'Sending…';
    var lines = [];

    async function probe(label, url, body) {
        try {
            var res = await fetch(url, body
                ? { method: 'POST', body: body, credentials: 'same-origin' }
                : { credentials: 'same-origin' });
            var raw = await res.text();
            lines.push(label);
            lines.push('  HTTP ' + res.status + ' ' + res.statusText);
            lines.push('  content-type: ' + (res.headers.get('content-type') || '(none)'));
            lines.push('  body: ' + raw.slice(0, 400));
            lines.push('');
            return raw;
        } catch (err) {
            lines.push(label);
            lines.push('  NETWORK ERROR: ' + err.message);
            lines.push('');
            return null;
        }
    }

    // 1. Is the session actually visible to a fetch() from this page?
    await probe('[1] session.php', 'session.php');

    // 2. The real insert, built exactly like admin.js handleSave().
    var fd = new FormData();
    fd.append('action', 'insert');
    fd.append('module', 'about');
    fd.append('title', 'Diagnostic test item');
    fd.append('body', 'Created by diagnose.php — safe to delete.');
    fd.append('sort_order', '0');
    fd.append('is_published', '1');
    await probe('[2] cms_admin.php action=insert', 'cms_admin.php', fd);

    // 3. Read it back through the admin list endpoint.
    await probe('[3] cms_admin.php action=list', 'cms_admin.php?action=list&module=about');

    // 4. And through the public endpoint the website itself uses.
    await probe('[4] cms_list.php (public)', 'cms_list.php?module=about&cb=' + Date.now());

    out.textContent = lines.join('\n');
});
</script>
<?php

echo '<p style="margin-top:24px;padding:14px 18px;background:#FFF3E8;border-left:4px solid #F1791E;">'
   . '<strong>When you are done:</strong> delete <code>backend/diagnose.php</code> from the server.</p>'
   . '</body></html>';
