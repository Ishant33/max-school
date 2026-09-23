<?php
// Builds the catalogue of every photograph the website ships with.
//
// Nothing here is hand-maintained: the page list comes from scanning the HTML
// for <img> tags and the file list comes from scanning assets/img on disk, so a
// photo added to a page shows up in the CMS without touching this file.
//
// Everything is keyed by the *decoded* src path ("assets/img/School Images/
// Library.jpg"). The pages are inconsistent about spaces — index.html writes
// %20 while about-us.html writes a literal space — and decoding both to the
// same key means one override updates every page that uses the photo.

const MEDIA_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'gif'];

function media_site_root()
{
    return dirname(__DIR__);
}

// Normalise an src into a catalogue key: decoded, forward slashes, no leading
// "./" or "/". External URLs are rejected — they are not ours to manage.
function media_key($src)
{
    $src = trim((string) $src);
    if ($src === '' || preg_match('#^(https?:)?//#i', $src) || strpos($src, 'data:') === 0) {
        return null;
    }
    $src = rawurldecode($src);
    $src = str_replace('\\', '/', $src);
    $src = preg_replace('#^\./#', '', $src);
    $src = ltrim($src, '/');
    // A leading ../ or an embedded /../ would let a caller point outside the site.
    if (strpos($src, '..') !== false) {
        return null;
    }
    return $src;
}

// Pages an admin would recognise, in the order they appear in the site menu.
function media_page_files()
{
    return [
        'index.html'                => 'Homepage',
        'about-us.html'             => 'About Us',
        'academics.html'            => 'Academics',
        'beyond-activities.html'    => 'Beyond Activities',
        'admission.html'            => 'Admission',
        'career.html'               => 'Career',
        'gallery.html'              => 'Gallery',
        'contact-us.html'           => 'Contact Us',
        'mandatory-disclosure.php'  => 'Mandatory Disclosure',
    ];
}

/**
 * Scan the public pages for <img> tags.
 *
 * @return array key => ['pages' => [labels], 'alt' => string, 'count' => int]
 */
function media_scan_pages()
{
    $root = media_site_root();
    $found = [];

    foreach (media_page_files() as $file => $label) {
        $path = $root . '/' . $file;
        if (!is_readable($path)) {
            continue;
        }
        $html = (string) file_get_contents($path);
        if (!preg_match_all('/<img\b[^>]*>/i', $html, $tags)) {
            continue;
        }

        foreach ($tags[0] as $tag) {
            if (!preg_match('/\bsrc\s*=\s*"([^"]*)"/i', $tag, $m)) {
                continue;
            }
            $key = media_key($m[1]);
            if ($key === null) {
                continue;
            }
            // Hero slides are managed by their own CMS module, where slides can
            // be added and reordered — keep them out of the file-swap screen so
            // there is only ever one place to change them.
            if (preg_match('/\bclass\s*=\s*"[^"]*\bslide\b[^"]*"/i', $tag)) {
                continue;
            }

            if (!isset($found[$key])) {
                $found[$key] = ['pages' => [], 'alt' => '', 'count' => 0];
            }
            $found[$key]['count']++;
            if (!in_array($label, $found[$key]['pages'], true)) {
                $found[$key]['pages'][] = $label;
            }
            if ($found[$key]['alt'] === '' && preg_match('/\balt\s*=\s*"([^"]*)"/i', $tag, $a)) {
                $found[$key]['alt'] = html_entity_decode($a[1], ENT_QUOTES, 'UTF-8');
            }
        }
    }

    return $found;
}

/**
 * Scan assets/img for image files on disk, including ones no page uses yet.
 *
 * @return array key => ['bytes' => int, 'width' => int, 'height' => int]
 */
function media_scan_files($relDir = 'assets/img')
{
    $root = media_site_root();
    $dir = $root . '/' . $relDir;
    if (!is_dir($dir)) {
        return [];
    }

    $out = [];
    $walker = new RecursiveIteratorIterator(
        new RecursiveDirectoryIterator($dir, FilesystemIterator::SKIP_DOTS),
        RecursiveIteratorIterator::SELF_FIRST
    );

    foreach ($walker as $file) {
        if (!$file->isFile()) {
            continue;
        }
        $ext = strtolower($file->getExtension());
        if (!in_array($ext, MEDIA_EXTENSIONS, true)) {
            continue;
        }
        $abs = str_replace('\\', '/', $file->getPathname());
        $key = ltrim(str_replace(str_replace('\\', '/', $root), '', $abs), '/');
        $out[$key] = media_file_facts($file->getPathname());
    }

    ksort($out, SORT_NATURAL | SORT_FLAG_CASE);
    return $out;
}

function media_file_facts($absolute)
{
    $facts = ['bytes' => 0, 'width' => 0, 'height' => 0];
    if (!is_file($absolute)) {
        return $facts;
    }
    $facts['bytes'] = (int) filesize($absolute);
    $size = @getimagesize($absolute);
    if (is_array($size)) {
        $facts['width'] = (int) $size[0];
        $facts['height'] = (int) $size[1];
    }
    return $facts;
}

// Group photos the way the person editing them thinks about them, derived from
// where the file sits rather than from a list that has to be kept in step.
function media_group_for($key)
{
    $lower = strtolower($key);
    $base = strtolower(basename($key));

    if ($base === 'logo.png' || strpos($base, 'social-') === 0) {
        return 'brand';
    }
    if (strpos($lower, '/faculty images/') !== false) {
        return 'leadership';
    }
    if (strpos($lower, '/school images/') !== false || strpos($base, 'school-building') === 0) {
        return 'campus';
    }
    return 'other';
}

function media_groups()
{
    return [
        'brand'      => 'Logo & Social Icons',
        'leadership' => 'Leadership Photos',
        'campus'     => 'Campus & Activity Photos',
        'other'      => 'Other Images',
    ];
}

// "Student playing in Playground.jpg" -> "Student playing in Playground"
function media_label_for($key)
{
    $name = pathinfo($key, PATHINFO_FILENAME);
    $name = str_replace(['-', '_'], ' ', $name);
    $name = preg_replace('/\s+/', ' ', trim($name));
    return $name === '' ? basename($key) : ucfirst($name);
}

/**
 * Every photo the site ships with, merged from the page scan and the disk scan.
 *
 * @return array key => ['label','group','pages','alt','bytes','width','height','exists','used']
 */
function media_catalog()
{
    $pages = media_scan_pages();
    $files = media_scan_files();
    $keys = array_unique(array_merge(array_keys($files), array_keys($pages)));

    $catalog = [];
    foreach ($keys as $key) {
        // A page can reference an upload or a file outside assets/img; only
        // catalogue things that are actually images we can find or replace.
        $ext = strtolower(pathinfo($key, PATHINFO_EXTENSION));
        if (!in_array($ext, MEDIA_EXTENSIONS, true)) {
            continue;
        }
        $facts = $files[$key] ?? media_file_facts(media_site_root() . '/' . $key);
        $catalog[$key] = [
            'label'  => media_label_for($key),
            'group'  => media_group_for($key),
            'pages'  => $pages[$key]['pages'] ?? [],
            'alt'    => $pages[$key]['alt'] ?? '',
            'used'   => isset($pages[$key]),
            'bytes'  => $facts['bytes'],
            'width'  => $facts['width'],
            'height' => $facts['height'],
            'exists' => is_file(media_site_root() . '/' . $key),
        ];
    }

    uksort($catalog, function ($a, $b) use ($catalog) {
        $order = array_keys(media_groups());
        $ga = array_search($catalog[$a]['group'], $order, true);
        $gb = array_search($catalog[$b]['group'], $order, true);
        if ($ga !== $gb) {
            return $ga <=> $gb;
        }
        return strnatcasecmp($a, $b);
    });

    return $catalog;
}

/* ---------------------------------------------------------------------------
   Override map — the small JSON file the front end reads.
   { "assets/img/logo.png": {"url": "backend/uploads/site/x.png", "hidden": false} }

   `url` is the replacement, `hidden` keeps the photo off the site. They are
   independent: a photo can be replaced and hidden at the same time, and showing
   it again brings the replacement back rather than the original.

   Older maps recorded a hidden photo as {"url": null} on its own, so hiding a
   replaced photo threw the replacement away. Those entries are still read
   correctly — see media_override_state().
   --------------------------------------------------------------------------- */

/**
 * Read a map entry as ['url' => string|null, 'hidden' => bool, 'at' => string].
 *
 * Everything that interprets the map goes through this, so the older one-field
 * shape only has to be understood in one place.
 */
function media_override_state($override)
{
    $state = ['url' => null, 'hidden' => false, 'at' => ''];
    if (!is_array($override)) {
        return $state;
    }

    $url = $override['url'] ?? null;
    if (is_string($url) && trim($url) !== '') {
        $state['url'] = $url;
    }

    $state['hidden'] = array_key_exists('hidden', $override)
        ? !empty($override['hidden'])
        // Legacy shape: a null url with no flag was the only way to say "hidden".
        : ($state['url'] === null && array_key_exists('url', $override));

    $state['at'] = isset($override['at']) ? (string) $override['at'] : '';
    return $state;
}

/**
 * Build a map entry, or null when there is nothing left to record.
 *
 * Returning null is what keeps the map free of rows that say "unchanged": undo
 * the last change to a photo and its entry goes away rather than lingering.
 *
 * @return array|null
 */
function media_override_entry($url, $hidden)
{
    if (($url === null || $url === '') && !$hidden) {
        return null;
    }
    return [
        'url'    => ($url === '' ? null : $url),
        'hidden' => (bool) $hidden,
        'at'     => gmdate('Y-m-d H:i') . ' UTC',
    ];
}

function media_map_file()
{
    return __DIR__ . '/media_map.json';
}

function media_load_map()
{
    $file = media_map_file();
    if (!is_file($file)) {
        return [];
    }
    $data = json_decode((string) file_get_contents($file), true);
    return is_array($data) ? $data : [];
}

/** @return true on success; writes a JSON error and exits on failure. */
function media_save_map(array $map)
{
    $file = media_map_file();
    $json = json_encode($map, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    if ($json === false) {
        http_response_code(500);
        echo json_encode(['ok' => false, 'message' => 'Could not encode the image list']);
        exit;
    }
    // Temp file first, so a failed write can never truncate a working map.
    $tmp = $file . '.tmp';
    if (@file_put_contents($tmp, $json) === false || !@rename($tmp, $file)) {
        @unlink($tmp);
        http_response_code(500);
        echo json_encode([
            'ok' => false,
            'message' => 'Could not save media_map.json — set the backend/ folder to '
                . 'permission 755 in cPanel File Manager.',
        ]);
        exit;
    }
    return true;
}
