<?php
header('Content-Type: application/json');
$module = isset($_GET['module']) ? $_GET['module'] : '';
$dataFile = __DIR__ . '/cms_storage.json';
$items = [];
if (file_exists($dataFile)) {
    $json = file_get_contents($dataFile);
    $items = json_decode($json, true) ?: [];
}
$filtered = array_values(array_filter($items, function($it) use ($module) {
    if ($module && (!isset($it['module']) || $it['module'] !== $module)) return false;
    return !empty($it['is_published']);
}));
usort($filtered, function($a,$b){ $sa = $a['sort_order'] ?? 0; $sb = $b['sort_order'] ?? 0; if ($sa === $sb) return ($b['id'] ?? 0) <=> ($a['id'] ?? 0); return $sa <=> $sb; });
echo json_encode(array_values($filtered));
