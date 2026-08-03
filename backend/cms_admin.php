<?php
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
        'image_url' => $_POST['image_url'] ?: null,
        'sort_order' => intval($_POST['sort_order'] ?? 0),
        'is_published' => !empty($_POST['is_published'])
    ];
    $items[] = $row;
    file_put_contents($dataFile, json_encode($items, JSON_PRETTY_PRINT));
    echo json_encode(['ok'=>true,'data'=>$row]);
    exit;
}
if ($action === 'update') {
    $id = intval($_POST['id'] ?? 0);
    foreach ($items as &$it) if (($it['id'] ?? 0) === $id) {
        $it['title'] = $_POST['title'] ?? $it['title'];
        $it['body'] = $_POST['body'] ?? $it['body'];
        $it['image_url'] = $_POST['image_url'] ?: $it['image_url'];
        $it['sort_order'] = intval($_POST['sort_order'] ?? $it['sort_order']);
        $it['is_published'] = !empty($_POST['is_published']);
        file_put_contents($dataFile, json_encode($items, JSON_PRETTY_PRINT));
        echo json_encode(['ok'=>true,'data'=>$it]);
        exit;
    }
    echo json_encode(['ok'=>false,'message'=>'Not found']);
    exit;
}
if ($action === 'delete') {
    $id = intval($_POST['id'] ?? 0);
    $items = array_values(array_filter($items, function($it) use ($id){ return ($it['id'] ?? 0) !== $id; }));
    file_put_contents($dataFile, json_encode($items, JSON_PRETTY_PRINT));
    echo json_encode(['ok'=>true]);
    exit;
}
if ($action === 'upload') {
    if (empty($_FILES['file'])) { echo json_encode(['ok'=>false,'message'=>'No file']); exit; }
    $file = $_FILES['file'];
    if ($file['error']) { echo json_encode(['ok'=>false,'message'=>'Upload error']); exit; }
    $allowed = ['image/jpeg','image/png','image/webp'];
    if (!in_array($file['type'], $allowed) || $file['size'] > 5*1024*1024) { echo json_encode(['ok'=>false,'message'=>'Invalid file']); exit; }
    $dir = __DIR__ . '/uploads/cms/';
    if (!is_dir($dir)) mkdir($dir, 0755, true);
    $name = bin2hex(random_bytes(8)) . '-' . preg_replace('/[^a-z0-9._-]/i','-', basename($file['name']));
    $dest = $dir . $name;
    if (!move_uploaded_file($file['tmp_name'], $dest)) { echo json_encode(['ok'=>false,'message'=>'Could not move file']); exit; }
    $url = dirname($_SERVER['SCRIPT_NAME']) . '/uploads/cms/' . $name;
    echo json_encode(['ok'=>true,'url'=>$url]);
    exit;
}

http_response_code(400);
echo json_encode(['ok'=>false,'message'=>'Unknown action']);
