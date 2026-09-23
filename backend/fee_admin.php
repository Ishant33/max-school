<?php
/* ==========================================================================
   Fee Structure — Admin API
   Auth-gated, mirrors cms_admin.php conventions: flat-JSON storage, JSON
   responses shaped {ok, data|message}. Backs the Fee Structure screen in
   the CMS panel.
   ========================================================================== */

require_once __DIR__ . '/session_init.php';
session_start();
header('Content-Type: application/json');

if (empty($_SESSION['cms_logged'])) {
    http_response_code(401);
    echo json_encode(['ok' => false, 'message' => 'Not authenticated']);
    exit;
}

$dataFile = __DIR__ . '/fee_data.json';

function fee_defaults()
{
    return [
        'eyebrow'              => 'Transparent Pricing',
        'title'                => '3. Fee Structure',
        'description'          => 'Contact the school office for the current, grade-wise fee schedule — scholarships up to 100% available via the Max Ultimate Scholarship Test.',
        'academic_session'     => '2026–27',
        'pdf_url'              => null,
        'pdf_name'             => null,
        'rows'                 => [
            ['id' => 1, 'stage' => 'Max Junior', 'grades' => 'Pre-Nursery – KG', 'details' => 'Contact office for current fees'],
            ['id' => 2, 'stage' => 'Primary', 'grades' => 'I – V', 'details' => 'Contact office for current fees'],
            ['id' => 3, 'stage' => 'Middle & Secondary', 'grades' => 'VI – X', 'details' => 'Contact office for current fees'],
            ['id' => 4, 'stage' => 'Senior Secondary', 'grades' => 'XI – XII', 'details' => 'Contact office for current fees'],
        ],
        'scholarship_title'    => 'Max Ultimate Scholarship Test (MUST)',
        'scholarship_desc'     => 'Merit scholarships up to 100% in association with Physics Wallah Vidyapeeth for qualifying students. Contact the admissions counter for registration details.',
        'scholarship_btn_text' => 'Enquire for Fee Schedule',
        'scholarship_btn_link' => 'contact-us.html#enquiry-form',
    ];
}

function load_fee_data($file)
{
    $data = [];
    if (file_exists($file)) {
        $json = file_get_contents($file);
        $data = json_decode($json, true) ?: [];
    }
    return array_merge(fee_defaults(), $data);
}

function save_fee_data($file, $data)
{
    $json = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    if ($json === false) {
        return false;
    }
    $tmp = $file . '.tmp';
    if (@file_put_contents($tmp, $json) === false) {
        return false;
    }
    return @rename($tmp, $file);
}

function clean_text($val, $max = 1000)
{
    return substr(trim((string)$val), 0, $max);
}

$data   = load_fee_data($dataFile);
$action = $_GET['action'] ?? $_POST['action'] ?? '';

if ($action === 'get') {
    echo json_encode(['ok' => true, 'data' => $data]);
    exit;
}

if ($action === 'save_general') {
    if (array_key_exists('eyebrow', $_POST)) {
        $data['eyebrow'] = clean_text($_POST['eyebrow'], 100);
    }
    if (array_key_exists('title', $_POST)) {
        $data['title'] = clean_text($_POST['title'], 150);
    }
    if (array_key_exists('description', $_POST)) {
        $data['description'] = clean_text($_POST['description'], 1000);
    }
    if (array_key_exists('academic_session', $_POST)) {
        $data['academic_session'] = clean_text($_POST['academic_session'], 60);
    }
    if (array_key_exists('scholarship_title', $_POST)) {
        $data['scholarship_title'] = clean_text($_POST['scholarship_title'], 200);
    }
    if (array_key_exists('scholarship_desc', $_POST)) {
        $data['scholarship_desc'] = clean_text($_POST['scholarship_desc'], 1000);
    }
    if (array_key_exists('scholarship_btn_text', $_POST)) {
        $data['scholarship_btn_text'] = clean_text($_POST['scholarship_btn_text'], 100);
    }
    if (array_key_exists('scholarship_btn_link', $_POST)) {
        $data['scholarship_btn_link'] = clean_text($_POST['scholarship_btn_link'], 300);
    }

    if (!save_fee_data($dataFile, $data)) {
        http_response_code(500);
        echo json_encode(['ok' => false, 'message' => 'Could not save fee structure configuration']);
        exit;
    }
    echo json_encode(['ok' => true, 'data' => $data]);
    exit;
}

if ($action === 'save_rows') {
    $rowsJson = $_POST['rows'] ?? '';
    $rows = json_decode($rowsJson, true);
    if (!is_array($rows)) {
        http_response_code(400);
        echo json_encode(['ok' => false, 'message' => 'Invalid rows data']);
        exit;
    }

    $sanitized = [];
    $nextId = 1;
    foreach ($rows as $row) {
        $stage   = clean_text($row['stage'] ?? '', 100);
        $grades  = clean_text($row['grades'] ?? '', 100);
        $details = clean_text($row['details'] ?? '', 300);
        if ($stage === '' && $grades === '') {
            continue;
        }
        $rowId = intval($row['id'] ?? 0);
        if ($rowId <= 0) {
            $rowId = $nextId;
        }
        $nextId = max($nextId, $rowId + 1);

        $sanitized[] = [
            'id'      => $rowId,
            'stage'   => $stage,
            'grades'  => $grades,
            'details' => $details,
        ];
    }

    $data['rows'] = $sanitized;
    if (!save_fee_data($dataFile, $data)) {
        http_response_code(500);
        echo json_encode(['ok' => false, 'message' => 'Could not save fee rows']);
        exit;
    }
    echo json_encode(['ok' => true, 'data' => $data]);
    exit;
}

if ($action === 'save_row') {
    $id      = intval($_POST['id'] ?? 0);
    $stage   = clean_text($_POST['stage'] ?? '', 100);
    $grades  = clean_text($_POST['grades'] ?? '', 100);
    $details = clean_text($_POST['details'] ?? '', 300);

    if ($stage === '' && $grades === '') {
        http_response_code(400);
        echo json_encode(['ok' => false, 'message' => 'Stage or Grade is required']);
        exit;
    }

    $found = false;
    foreach ($data['rows'] as &$row) {
        if (($row['id'] ?? 0) === $id && $id > 0) {
            $row['stage']   = $stage;
            $row['grades']  = $grades;
            $row['details'] = $details;
            $found = true;
            break;
        }
    }

    if (!$found) {
        $existingIds = array_map(function ($r) { return intval($r['id'] ?? 0); }, $data['rows']);
        $newId = $existingIds ? (max($existingIds) + 1) : 1;
        $data['rows'][] = [
            'id'      => $newId,
            'stage'   => $stage,
            'grades'  => $grades,
            'details' => $details,
        ];
    }

    if (!save_fee_data($dataFile, $data)) {
        http_response_code(500);
        echo json_encode(['ok' => false, 'message' => 'Could not save row']);
        exit;
    }
    echo json_encode(['ok' => true, 'data' => $data]);
    exit;
}

if ($action === 'delete_row') {
    $id = intval($_POST['id'] ?? 0);
    $data['rows'] = array_values(array_filter($data['rows'], function ($r) use ($id) {
        return ($r['id'] ?? 0) !== $id;
    }));

    if (!save_fee_data($dataFile, $data)) {
        http_response_code(500);
        echo json_encode(['ok' => false, 'message' => 'Could not delete row']);
        exit;
    }
    echo json_encode(['ok' => true, 'data' => $data]);
    exit;
}

if ($action === 'upload_pdf') {
    require_once __DIR__ . '/upload_helper.php';
    $res = handle_upload($_FILES['file'] ?? [], 'fees');
    if (!empty($res['error'])) {
        http_response_code($res['status'] ?? 400);
        echo json_encode(['ok' => false, 'message' => $res['error']]);
        exit;
    }

    // Unlink old pdf if exists
    if (!empty($data['pdf_url'])) {
        $oldPath = upload_realpath($data['pdf_url']);
        if ($oldPath && file_exists($oldPath)) {
            @unlink($oldPath);
        }
    }

    $data['pdf_url']  = $res['url'] ?? $res['path'];
    $data['pdf_name'] = $_FILES['file']['name'] ?? 'Fee-Structure.pdf';

    if (!save_fee_data($dataFile, $data)) {
        http_response_code(500);
        echo json_encode(['ok' => false, 'message' => 'Could not save uploaded fee PDF']);
        exit;
    }
    echo json_encode(['ok' => true, 'data' => $data]);
    exit;
}

if ($action === 'remove_pdf') {
    require_once __DIR__ . '/upload_helper.php';
    if (!empty($data['pdf_url'])) {
        $oldPath = upload_realpath($data['pdf_url']);
        if ($oldPath && file_exists($oldPath)) {
            @unlink($oldPath);
        }
    }
    $data['pdf_url']  = null;
    $data['pdf_name'] = null;

    if (!save_fee_data($dataFile, $data)) {
        http_response_code(500);
        echo json_encode(['ok' => false, 'message' => 'Could not remove fee PDF']);
        exit;
    }
    echo json_encode(['ok' => true, 'data' => $data]);
    exit;
}

http_response_code(400);
echo json_encode(['ok' => false, 'message' => 'Unknown action']);
