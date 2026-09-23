<?php
/* ==========================================================================
   Mandatory Public Disclosure — Public API
   Read-only public endpoint to fetch CBSE disclosure data for public pages.
   Mirrors backend/fee_list.php conventions.
   ========================================================================== */

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
header('Expires: 0');

$dataFile = __DIR__ . '/disclosure_data.json';

function disclosure_defaults()
{
    return [
        'updated'              => '2026-27',
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

$data = [];
clearstatcache(true, $dataFile);
if (file_exists($dataFile)) {
    $json = (string) file_get_contents($dataFile);
    $data = json_decode($json, true) ?: [];
}

// Fallback to legacy file if disclosure_data.json is missing or empty
if (empty($data)) {
    $legacy = dirname(__DIR__) . '/cms/mandatory-disclosure-data.php';
    if (file_exists($legacy)) {
        $old = require $legacy;
        $pairs = function ($rows) {
            return array_map(function ($r) {
                return ['label' => $r[0] ?? '', 'value' => $r[1] ?? ''];
            }, is_array($rows) ? $rows : []);
        };
        $data = [
            'updated'   => $old['updated'] ?? '2026-27',
            'general'   => $pairs($old['general'] ?? []),
            'staff'     => $pairs($old['staff'] ?? []),
            'academics' => $pairs($old['academics'] ?? []),
            'documents' => array_map(function ($r, $idx) {
                return [
                    'id'          => $idx + 1,
                    'title'       => $r[0] ?? '',
                    'description' => $r[1] ?? '',
                    'pdf_url'     => $r[2] ?? '',
                ];
            }, $old['documents'] ?? [], array_keys($old['documents'] ?? [])),
            'infrastructure' => $old['infrastructure'] ?? [],
        ];
    }
}

$output = array_merge(disclosure_defaults(), $data);

echo json_encode([
    'ok'   => true,
    'data' => $output,
], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
