<?php
header('Content-Type: application/json');
header('Cache-Control: no-cache, must-revalidate');

$module = isset($_GET['module']) ? $_GET['module'] : '';
$limit = isset($_GET['limit']) ? max(0, intval($_GET['limit'])) : 0;
$featured = isset($_GET['featured']) && $_GET['featured'] !== '0' && $_GET['featured'] !== '';

$dataFile = __DIR__ . '/cms_storage.json';
$items = [];
if (file_exists($dataFile)) {
    $json = file_get_contents($dataFile);
    $items = json_decode($json, true) ?: [];
}

$filtered = array_values(array_filter($items, function ($it) use ($module, $featured) {
    if ($module && (!isset($it['module']) || $it['module'] !== $module)) return false;
    if ($featured && empty($it['is_featured'])) return false;
    return !empty($it['is_published']);
}));

usort($filtered, function ($a, $b) {
    $sa = $a['sort_order'] ?? 0;
    $sb = $b['sort_order'] ?? 0;
    if ($sa === $sb) return ($b['id'] ?? 0) <=> ($a['id'] ?? 0);
    return $sa <=> $sb;
});

if ($limit > 0) {
    $filtered = array_slice($filtered, 0, $limit);
}

// Normalise the shape so the front end never has to test for missing keys.
$out = array_map(function ($it) {
    return [
        'id'           => $it['id'] ?? 0,
        'module'       => $it['module'] ?? '',
        'title'        => $it['title'] ?? '',
        'body'         => $it['body'] ?? '',
        'image_url'    => $it['image_url'] ?? null,
        'link_url'     => $it['link_url'] ?? null,
        'cover_url'    => $it['cover_url'] ?? null,
        'badge'        => $it['badge'] ?? null,
        'is_featured'  => !empty($it['is_featured']),
        'sort_order'   => $it['sort_order'] ?? 0,
    ];
}, $filtered);

echo json_encode(array_values($out));
