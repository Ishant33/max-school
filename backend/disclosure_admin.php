<?php
/* ==========================================================================
   Mandatory Public Disclosure — admin API
   Auth-gated, mirrors cms_admin.php conventions: flat-JSON storage, JSON
   responses shaped {ok, data|message}. Backs the Disclosure screen in the
   CMS panel and feeds mandatory-disclosure.php on the public site.
   ========================================================================== */

require_once __DIR__ . '/session_init.php';
session_start();
header('Content-Type: application/json');

if (empty($_SESSION['cms_logged'])) {
    http_response_code(401);
    echo json_encode(['ok' => false, 'message' => 'Not authenticated']);
    exit;
}

$dataFile = __DIR__ . '/disclosure_data.json';

// Sections holding {label, value} pairs, edited as a whole block.
const PAIR_SECTIONS = ['general', 'staff'];
// Sections holding numbered rows with an optional PDF, edited row by row.
const ROW_SECTIONS  = ['documents', 'academics'];

function disclosure_defaults()
{
    return [
        'updated'              => '',
        'general'              => [],
        'documents'            => [],
        'academics'            => [],
        'results_x'            => [],
        'results_xii'          => [],
        'staff'                => [],
        'infrastructure_specs' => [],
        'infrastructure'       => [],
    ];
}

function load_disclosure($file)
{
    $data = [];
    if (file_exists($file)) {
        $data = json_decode((string) file_get_contents($file), true) ?: [];
    }
    return array_merge(disclosure_defaults(), $data);
}

function save_disclosure($file, $data)
{
    $json = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    if ($json === false) {
        return false;
    }
    // Attempt safe write via temp file first
    $tmp = $file . '.tmp';
    if (@file_put_contents($tmp, $json) !== false) {
        if (@rename($tmp, $file)) {
            @clearstatcache(true, $file);
            return true;
        }
        if (@copy($tmp, $file)) {
            @unlink($tmp);
            @clearstatcache(true, $file);
            return true;
        }
        @unlink($tmp);
    }
    // Direct write fallback with exclusive lock
    $ok = @file_put_contents($file, $json, LOCK_EX) !== false;
    @clearstatcache(true, $file);
    return $ok;
}

function fail($message, $status = 400)
{
    http_response_code($status);
    echo json_encode(['ok' => false, 'message' => $message]);
    exit;
}

function clean($value, $max = 500)
{
    return substr(trim((string) $value), 0, $max);
}

// Accepts a JSON array posted from the panel.
function posted_rows($key)
{
    $raw = $_POST[$key] ?? '';
    $rows = json_decode((string) $raw, true);
    return is_array($rows) ? $rows : null;
}

function next_row_id(array $rows)
{
    $ids = array_map(function ($r) { return intval($r['id'] ?? 0); }, $rows);
    return $ids ? (max($ids) + 1) : 1;
}

$data   = load_disclosure($dataFile);
$action = $_GET['action'] ?? $_POST['action'] ?? '';

if ($action === 'get') {
    echo json_encode(['ok' => true, 'data' => $data]);
    exit;
}

/* ---- General / Staff / Infrastructure / session label ------------------- */
if ($action === 'save_section') {
    $section = $_POST['section'] ?? '';

    if ($section === 'meta') {
        $data['updated'] = clean($_POST['updated'] ?? '', 60);
        if (!save_disclosure($dataFile, $data)) {
            fail('Could not save — check file permissions on backend/', 500);
        }
        echo json_encode(['ok' => true, 'data' => $data]);
        exit;
    }

    if (in_array($section, PAIR_SECTIONS, true)) {
        $rows = posted_rows('rows');
        if ($rows === null) {
            fail('Malformed rows payload');
        }
        $clean = [];
        foreach ($rows as $row) {
            $label = clean($row['label'] ?? '', 160);
            $value = clean($row['value'] ?? '', 1000);
            if ($label === '' && $value === '') {
                continue;
            }
            $clean[] = ['label' => $label, 'value' => $value];
        }
        $data[$section] = $clean;
    } elseif ($section === 'infrastructure_specs') {
        $rows = posted_rows('rows');
        if ($rows === null) {
            fail('Malformed rows payload');
        }
        $clean = [];
        foreach ($rows as $row) {
            $sno   = clean($row['sno'] ?? '', 20);
            $label = clean($row['label'] ?? '', 200);
            $value = clean($row['value'] ?? '', 1000);
            if ($label === '' && $value === '') {
                continue;
            }
            $clean[] = ['sno' => $sno, 'label' => $label, 'value' => $value];
        }
        $data['infrastructure_specs'] = $clean;
    } elseif ($section === 'results_x' || $section === 'results_xii') {
        $rows = posted_rows('rows');
        if ($rows === null) {
            fail('Malformed rows payload');
        }
        $clean = [];
        foreach ($rows as $row) {
            $sno   = clean($row['sno'] ?? '', 20);
            $year  = clean($row['year'] ?? '', 50);
            $reg   = clean($row['registered'] ?? '', 50);
            $pass  = clean($row['passed'] ?? '', 50);
            $pct   = clean($row['pct'] ?? '', 50);
            $pdf   = clean($row['pdf'] ?? '', 400);
            if ($year === '' && $reg === '' && $pass === '') {
                continue;
            }
            $clean[] = [
                'sno'        => $sno,
                'year'       => $year,
                'registered' => $reg,
                'passed'     => $pass,
                'pct'        => $pct,
                'pdf'        => $pdf,
            ];
        }
        $data[$section] = $clean;
    } elseif ($section === 'infrastructure') {
        $rows = posted_rows('rows');
        if ($rows === null) {
            fail('Malformed rows payload');
        }
        $clean = [];
        foreach ($rows as $item) {
            $item = clean(is_array($item) ? ($item['value'] ?? '') : $item, 120);
            if ($item !== '') {
                $clean[] = $item;
            }
        }
        $data['infrastructure'] = $clean;
    } else {
        fail('Unknown section');
    }

    if (!save_disclosure($dataFile, $data)) {
        fail('Could not save — check file permissions on backend/', 500);
    }
    echo json_encode(['ok' => true, 'data' => $data]);
    exit;
}
/* ---- Documents (B) and Results & Academics (C) -------------------------- */
if ($action === 'upsert_row') {
    $section = $_POST['section'] ?? '';
    if (!in_array($section, ROW_SECTIONS, true)) {
        fail('Unknown section');
    }

    $id   = intval($_POST['id'] ?? 0);
    $rows = $data[$section];

    // Section B stores title/description; section C stores label/value.
    if ($section === 'documents') {
        $fields = [
            'title'       => clean($_POST['title'] ?? '', 200),
            'description' => clean($_POST['description'] ?? '', 1000),
            'pdf_url'     => clean($_POST['pdf_url'] ?? '', 400),
        ];
        if (isset($_POST['sno']) && trim((string)$_POST['sno']) !== '') {
            $fields['sno'] = clean($_POST['sno'], 20);
        }
        if ($fields['title'] === '') {
            fail('A document name is required');
        }
    } else {
        $fields = [
            'label'   => clean($_POST['label'] ?? '', 200),
            'value'   => clean($_POST['value'] ?? '', 1000),
            'pdf_url' => clean($_POST['pdf_url'] ?? '', 400),
        ];
        if (isset($_POST['sno']) && trim((string)$_POST['sno']) !== '') {
            $fields['sno'] = clean($_POST['sno'], 20);
        }
        if ($fields['label'] === '') {
            fail('A row label is required');
        }
    }

    $saved = null;
    if ($id > 0) {
        foreach ($rows as &$row) {
            if (intval($row['id'] ?? 0) === $id) {
                $row  = array_merge($row, $fields);
                $saved = $row;
                break;
            }
        }
        unset($row);
        if ($saved === null) {
            fail('Row not found', 404);
        }
    } else {
        $saved  = array_merge(['id' => next_row_id($rows)], $fields);
        $rows[] = $saved;
    }

    $data[$section] = array_values($rows);
    if (!save_disclosure($dataFile, $data)) {
        fail('Could not save — check file permissions on backend/', 500);
    }
    echo json_encode(['ok' => true, 'data' => $saved]);
    exit;
}

if ($action === 'delete_row') {
    $section = $_POST['section'] ?? '';
    if (!in_array($section, ROW_SECTIONS, true)) {
        fail('Unknown section');
    }
    $id     = intval($_POST['id'] ?? 0);
    $before = count($data[$section]);

    $data[$section] = array_values(array_filter(
        $data[$section],
        function ($row) use ($id) { return intval($row['id'] ?? 0) !== $id; }
    ));

    if (count($data[$section]) === $before) {
        fail('Row not found', 404);
    }

    // Renumber sequential sno if present
    $idx = 0;
    foreach ($data[$section] as &$r) {
        $idx++;
        if (!isset($r['sno']) || is_numeric($r['sno']) || trim((string)$r['sno']) === '') {
            $r['sno'] = (string)$idx;
        }
    }
    unset($r);

    if (!save_disclosure($dataFile, $data)) {
        fail('Could not save — check file permissions on backend/', 500);
    }
    echo json_encode(['ok' => true, 'data' => $data[$section]]);
    exit;
}

// Reorder rows within a section by posting the id order.
if ($action === 'reorder_rows') {
    $section = $_POST['section'] ?? '';
    if (!in_array($section, ROW_SECTIONS, true)) {
        fail('Unknown section');
    }
    $order = posted_rows('order');
    if ($order === null) {
        fail('Malformed order payload');
    }

    $byId = [];
    foreach ($data[$section] as $row) {
        $byId[intval($row['id'] ?? 0)] = $row;
    }
    $sorted = [];
    foreach ($order as $id) {
        $id = intval($id);
        if (isset($byId[$id])) {
            $sorted[] = $byId[$id];
            unset($byId[$id]);
        }
    }
    // Anything the panel did not mention keeps its place at the end.
    foreach ($byId as $row) {
        $sorted[] = $row;
    }

    // Automatically renumber sequential sno so that S.NO displays 1..N in the new order
    $idx = 0;
    foreach ($sorted as &$r) {
        $idx++;
        if (!isset($r['sno']) || is_numeric($r['sno']) || trim((string)$r['sno']) === '') {
            $r['sno'] = (string)$idx;
        }
    }
    unset($r);

    $data[$section] = $sorted;
    if (!save_disclosure($dataFile, $data)) {
        fail('Could not save — check file permissions on backend/', 500);
    }
    echo json_encode(['ok' => true, 'data' => $sorted]);
    exit;
}

/* ---- Statutory PDF upload ----------------------------------------------- */
if ($action === 'upload_pdf') {
    require_once __DIR__ . '/upload_helper.php';
    $section = $_POST['section'] ?? $_GET['section'] ?? 'documents';
    if (!in_array($section, array_merge(ROW_SECTIONS, ['results_x', 'results_xii']), true)) {
        fail('Unknown section');
    }
    // documents -> uploads/disclosure/b/, academics -> uploads/disclosure/c/
    $kind   = $section === 'documents' ? 'disclosure_b' : 'disclosure_c';
    $result = handle_upload($_FILES['file'] ?? [], $kind);
    if (!empty($result['status'])) {
        http_response_code($result['status']);
    }
    echo json_encode($result);
    exit;
}

fail('Unknown action');

