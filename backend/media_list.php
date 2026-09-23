<?php
// Public feed of photo swaps, read by assets/js/site-images.js on every page.
//
// Only paths that have actually been changed appear here, so a site with no
// edits returns {} and the front end does nothing at all.
require_once __DIR__ . '/media_catalog.php';

header('Content-Type: application/json');
// Short cache: long enough to spare the server on a burst of page views, short
// enough that a change made in the CMS shows up while the editor is still
// looking at the site.
header('Cache-Control: public, max-age=60');

$map = media_load_map();
$out = [];

foreach ($map as $key => $override) {
    $state = media_override_state($override);
    if ($state['hidden']) {
        // Hiding wins over a replacement. The replacement stays recorded in the
        // map so "Show on site" can bring it back, but nothing about it reaches
        // the page — null is what the front end reads as "remove this image".
        $out[$key] = null;
    } elseif ($state['url'] !== null) {
        $out[$key] = $state['url'];
    }
    // Neither replaced nor hidden: nothing for the front end to do.
}

echo json_encode([
    'ok'  => true,
    // Changes whenever the map does, so the browser cache can be skipped.
    'rev' => is_file(media_map_file()) ? (string) filemtime(media_map_file()) : '0',
    'map' => $out,
], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_FORCE_OBJECT);
