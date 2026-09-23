<?php
require_once __DIR__ . '/session_init.php';
session_start();
header('Content-Type: application/json');
// Simple file-backed CMS admin. Requires session login.
if (empty($_SESSION['cms_logged'])) {
    http_response_code(401);
    echo json_encode(['ok' => false, 'message' => 'Not authenticated']);
    exit;
}
$dataFile = __DIR__ . '/cms_storage.json';
$items = [];
if (file_exists($dataFile)) {
    $items = json_decode(file_get_contents($dataFile), true) ?: [];
}

// Writes must be verified. file_put_contents() returns false when the folder
// or file is not writable (a common cPanel permissions issue), and without
// this check the panel would report "saved" while nothing reached disk.
function save_items($dataFile, $items)
{
    $json = json_encode($items, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    if ($json === false) {
        http_response_code(500);
        echo json_encode(['ok' => false, 'message' => 'Could not encode content']);
        exit;
    }

    // Write to a temp file first so a failed write can never truncate live data.
    $tmp = $dataFile . '.tmp';
    if (@file_put_contents($tmp, $json) === false || !@rename($tmp, $dataFile)) {
        @unlink($tmp);
        http_response_code(500);
        echo json_encode([
            'ok' => false,
            'message' => 'Could not save to cms_storage.json — set the backend/ folder '
                . 'and cms_storage.json to permission 755 / 644 in cPanel File Manager.',
        ]);
        exit;
    }
    return true;
}

/**
 * True when nothing left on disk still points at $url.
 *
 * The same upload can legitimately be reused — an editor may pick one photo for
 * two slides, and a site-photo override can be aimed at a CMS upload — so a
 * file is only safe to delete once no row and no override mentions it. Callers
 * pass the rows as they will be saved, which is why no row has to be excluded:
 * a value that survived the edit is found here and kept.
 */
function upload_is_orphaned($items, $url)
{
    if (!is_string($url) || trim($url) === '') {
        return false;
    }
    foreach ($items as $row) {
        foreach (['image_url', 'cover_url', 'link_url'] as $field) {
            if (($row[$field] ?? null) === $url) {
                return false;
            }
        }
    }
    // Site Photos records its swaps as site-relative paths while uploads made
    // here are stored with a leading slash; compare them on equal terms.
    $needle = ltrim($url, '/');
    $mapFile = __DIR__ . '/media_map.json';
    if (is_file($mapFile)) {
        $map = json_decode((string) file_get_contents($mapFile), true);
        foreach (is_array($map) ? $map : [] as $override) {
            if (is_array($override) && isset($override['url'])
                && ltrim((string) $override['url'], '/') === $needle) {
                return false;
            }
        }
    }
    return true;
}

/**
 * Delete the given uploads if no row or override references them any more.
 *
 * Storage here is a folder, not a table, so a row removed without this leaves
 * its photo in backend/uploads/cms/ with nothing in the panel able to reach it
 * — the "library" listing is not wired into any screen. Best-effort on purpose:
 * a file that will not unlink must not fail the change the editor asked for,
 * because the JSON has already been written.
 */
function prune_uploads($items, array $candidates)
{
    require_once __DIR__ . '/upload_helper.php';
    foreach (array_unique(array_filter($candidates, 'is_string')) as $url) {
        if (!upload_is_orphaned($items, $url)) {
            continue;
        }
        $absolute = upload_realpath($url);
        if ($absolute !== null) {
            @unlink($absolute);
        }
    }
}

$action = $_GET['action'] ?? $_POST['action'] ?? '';
if ($action === 'list') {
    $module = $_GET['module'] ?? '';
    $out = array_values(array_filter($items, function($it) use ($module){ return $it['module'] === $module; }));
    usort($out, function($a,$b){ return ($b['id'] ?? 0) <=> ($a['id'] ?? 0); });
    echo json_encode(['ok'=>true,'data'=>$out]);
    exit;
}
if ($action === 'insert') {
    $next = (empty($items) ? 1 : (max(array_column($items,'id')) + 1));
    $row = [
        'id' => $next,
        'module' => $_POST['module'] ?? 'about',
        'title' => $_POST['title'] ?? '',
        'body' => $_POST['body'] ?? '',
        'image_url' => ($_POST['image_url'] ?? '') ?: null,
        'link_url' => ($_POST['link_url'] ?? '') ?: null,
        'cover_url' => ($_POST['cover_url'] ?? '') ?: null,
        'badge' => ($_POST['badge'] ?? '') ?: null,
        'is_featured' => !empty($_POST['is_featured']),
        'sort_order' => intval($_POST['sort_order'] ?? 0),
        'is_published' => !empty($_POST['is_published'])
    ];
    $items[] = $row;
    save_items($dataFile, $items);
    echo json_encode(['ok'=>true,'data'=>$row]);
    exit;
}
if ($action === 'update') {
    $id = intval($_POST['id'] ?? 0);
    foreach ($items as &$it) if (($it['id'] ?? 0) === $id) {
        // Only the fields the request actually carried are touched. The item
        // list can then post a single change — "replace just this photo" — and
        // trust that the title, the order and the publish flag it never
        // mentioned come through untouched.
        $before = $it;
        foreach (['title', 'body'] as $field) {
            if (array_key_exists($field, $_POST)) {
                $it[$field] = $_POST[$field];
            }
        }
        foreach (['image_url', 'link_url', 'cover_url', 'badge'] as $field) {
            if (array_key_exists($field, $_POST)) {
                $it[$field] = ($_POST[$field] === '') ? null : $_POST[$field];
            }
        }
        if (array_key_exists('sort_order', $_POST)) {
            $it['sort_order'] = intval($_POST['sort_order']);
        }
        // The editor form sends these on every save as "1" or "0", so an absent
        // key means "not this request's business" rather than "switch it off".
        foreach (['is_featured', 'is_published'] as $flag) {
            if (array_key_exists($flag, $_POST)) {
                $it[$flag] = !empty($_POST[$flag]);
            }
        }
        save_items($dataFile, $items);
        // After the write, never before: a photo that has been swapped out is
        // only deleted once the row that replaced it is safely on disk.
        prune_uploads($items, [$before['image_url'] ?? null, $before['cover_url'] ?? null, $before['link_url'] ?? null]);
        echo json_encode(['ok'=>true,'data'=>$it]);
        exit;
    }
    echo json_encode(['ok'=>false,'message'=>'Not found']);
    exit;
}
if ($action === 'delete') {
    $id = intval($_POST['id'] ?? 0);
    $gone = null;
    foreach ($items as $row) {
        if (($row['id'] ?? 0) === $id) {
            $gone = $row;
        }
    }
    $items = array_values(array_filter($items, function($it) use ($id){ return ($it['id'] ?? 0) !== $id; }));
    save_items($dataFile, $items);
    if ($gone) {
        prune_uploads($items, [$gone['image_url'] ?? null, $gone['cover_url'] ?? null, $gone['link_url'] ?? null]);
    }
    echo json_encode(['ok'=>true]);
    exit;
}
if ($action === 'upload') {
    require_once __DIR__ . '/upload_helper.php';
    $kind = $_POST['kind'] ?? $_GET['kind'] ?? 'image';
    $result = handle_upload($_FILES['file'] ?? [], $kind);
    if (!empty($result['status'])) {
        http_response_code($result['status']);
    }
    echo json_encode($result);
    exit;
}

http_response_code(400);
echo json_encode(['ok'=>false,'message'=>'Unknown action']);
