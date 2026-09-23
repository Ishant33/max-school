<?php
// Authenticated endpoint behind the CMS "Site Photos" screen.
//
// Replacing a photo never overwrites the file in assets/img. The new file goes
// to backend/uploads/site/ and media_map.json records the swap, so "Restore
// original" is always available and a fresh filename sidesteps the one-year
// image cache set in the root .htaccess.
require_once __DIR__ . '/session_init.php';
session_start();
header('Content-Type: application/json');

if (empty($_SESSION['cms_logged'])) {
    http_response_code(401);
    echo json_encode(['ok' => false, 'message' => 'Not authenticated']);
    exit;
}

require_once __DIR__ . '/media_catalog.php';

$action = $_GET['action'] ?? $_POST['action'] ?? '';

function media_fail($message, $status = 400)
{
    http_response_code($status);
    echo json_encode(['ok' => false, 'message' => $message]);
    exit;
}

// Only paths the catalogue knows about may be overridden. Without this a caller
// could invent a key and have the front end swap an arbitrary image.
function media_require_key($catalog)
{
    $key = media_key($_POST['path'] ?? $_GET['path'] ?? '');
    if ($key === null || !isset($catalog[$key])) {
        media_fail('Unknown image');
    }
    return $key;
}

// Uploads may only ever be deleted from inside backend/uploads/, checked with
// realpath so ../ cannot walk out of it.
function media_uploads_realpath($relative)
{
    $uploads = realpath(__DIR__ . '/uploads');
    if ($uploads === false) {
        return null;
    }
    $candidate = realpath(media_site_root() . '/' . ltrim($relative, '/'));
    if ($candidate === false) {
        return null;
    }
    $uploads = str_replace('\\', '/', $uploads);
    $candidate = str_replace('\\', '/', $candidate);
    if (strpos($candidate, $uploads . '/') !== 0) {
        return null;
    }
    return $candidate;
}

// Write one photo's override, dropping the entry when there is nothing left to
// record. `replace`, `hide` and `show` each change a single field and leave the
// other alone, which is what lets a replaced photo be hidden and shown again
// without losing the replacement.
function media_write_override($key, $url, $hidden)
{
    $map = media_load_map();
    $entry = media_override_entry($url, $hidden);
    if ($entry === null) {
        unset($map[$key]);
    } else {
        $map[$key] = $entry;
    }
    media_save_map($map);
}

/* -------------------------------------------------------------------------
   list — the catalogue merged with whatever has been overridden
   ------------------------------------------------------------------------- */

if ($action === 'list') {
    $catalog = media_catalog();
    $map = media_load_map();

    $items = [];
    foreach ($catalog as $key => $meta) {
        $state = media_override_state($map[$key] ?? null);
        $replacement = $state['url'];

        $items[] = [
            'path'         => $key,
            'label'        => $meta['label'],
            'group'        => $meta['group'],
            'pages'        => $meta['pages'],
            'alt'          => $meta['alt'],
            'used'         => $meta['used'],
            'exists'       => $meta['exists'],
            'width'        => $meta['width'],
            'height'       => $meta['height'],
            'bytes'        => $meta['bytes'],
            'original_url' => $key,
            // What the card shows. A hidden photo still previews its replacement
            // so an editor can see what will come back when they show it again.
            'current_url'  => $replacement ?: $key,
            'replaced'     => $replacement !== null,
            'hidden'       => $state['hidden'],
            'replaced_at'  => $state['at'],
        ];
    }

    echo json_encode([
        'ok'     => true,
        'groups' => media_groups(),
        'data'   => $items,
    ]);
    exit;
}

/* -------------------------------------------------------------------------
   library — everything uploaded through the CMS, for reuse elsewhere
   ------------------------------------------------------------------------- */

if ($action === 'library') {
    $files = [];
    foreach (['uploads/site', 'uploads/cms'] as $dir) {
        foreach (media_scan_files('backend/' . $dir) as $key => $facts) {
            $files[$key] = $facts + ['label' => media_label_for($key)];
        }
    }
    // Newest first — most recently uploaded is what an editor wants to grab.
    uksort($files, function ($a, $b) {
        $ta = @filemtime(media_site_root() . '/' . $a) ?: 0;
        $tb = @filemtime(media_site_root() . '/' . $b) ?: 0;
        return $tb <=> $ta;
    });

    $out = [];
    foreach ($files as $key => $facts) {
        $out[] = ['path' => $key, 'url' => $key] + $facts;
    }
    echo json_encode(['ok' => true, 'data' => $out]);
    exit;
}

/* -------------------------------------------------------------------------
   upload — put a file in the library without attaching it to anything
   ------------------------------------------------------------------------- */

if ($action === 'upload') {
    require_once __DIR__ . '/upload_helper.php';
    $result = handle_upload($_FILES['file'] ?? [], 'site');
    if (!empty($result['status'])) {
        http_response_code($result['status']);
    }
    echo json_encode($result);
    exit;
}

/* -------------------------------------------------------------------------
   replace — upload a file (or point at one already in the library) and record
   it as the override for a catalogued path
   ------------------------------------------------------------------------- */

if ($action === 'replace') {
    $catalog = media_catalog();
    $key = media_require_key($catalog);

    $url = '';
    if (!empty($_FILES['file']['name'])) {
        require_once __DIR__ . '/upload_helper.php';
        $result = handle_upload($_FILES['file'], 'site');
        if (empty($result['ok'])) {
            media_fail($result['message'] ?? 'Upload failed', $result['status'] ?? 400);
        }
        $url = $result['path'];
    } else {
        // Reusing a library file: it must resolve inside backend/uploads/.
        $candidate = media_key($_POST['url'] ?? '');
        if ($candidate === null || media_uploads_realpath($candidate) === null) {
            media_fail('Choose a file to upload, or pick one from the library');
        }
        $url = $candidate;
    }

    // Replacing a hidden photo swaps the file behind it and leaves it hidden.
    // Hiding is an editorial decision of its own, and there is a Show on site
    // button for undoing it — a file upload should not undo it by side effect.
    $was = media_override_state(media_load_map()[$key] ?? null);
    media_write_override($key, $url, $was['hidden']);

    echo json_encode(['ok' => true, 'path' => $key, 'url' => $url, 'hidden' => $was['hidden']]);
    exit;
}

/* -------------------------------------------------------------------------
   hide / show — take the photo off the site, or put it back, keeping any
   replacement recorded either way
   ------------------------------------------------------------------------- */

if ($action === 'hide' || $action === 'show') {
    $catalog = media_catalog();
    $key = media_require_key($catalog);

    // The logo and the social icons are links as well as pictures — hiding them
    // would leave dead link targets in the header and footer, so they can be
    // replaced but not removed.
    if ($action === 'hide' && $catalog[$key]['group'] === 'brand') {
        media_fail('The logo and social icons can be replaced but not hidden');
    }

    $state = media_override_state(media_load_map()[$key] ?? null);
    media_write_override($key, $state['url'], $action === 'hide');

    echo json_encode(['ok' => true, 'path' => $key, 'hidden' => $action === 'hide']);
    exit;
}

/* -------------------------------------------------------------------------
   reset — drop the replacement, back to the photo the site shipped with.
   Whether the photo is hidden is left alone, so this and Show on site each
   undo exactly one thing.
   ------------------------------------------------------------------------- */

if ($action === 'reset') {
    $catalog = media_catalog();
    $key = media_require_key($catalog);

    $state = media_override_state(media_load_map()[$key] ?? null);
    media_write_override($key, null, $state['hidden']);

    echo json_encode(['ok' => true, 'path' => $key, 'hidden' => $state['hidden']]);
    exit;
}

/* -------------------------------------------------------------------------
   library_delete — remove an uploaded file from disk, plus any override or
   CMS row still pointing at it
   ------------------------------------------------------------------------- */

if ($action === 'library_delete') {
    $relative = media_key($_POST['url'] ?? '');
    if ($relative === null) {
        media_fail('Nothing to delete');
    }
    $absolute = media_uploads_realpath($relative);
    if ($absolute === null) {
        media_fail('That file is not one of the CMS uploads');
    }

    $map = media_load_map();
    $stillUsed = [];
    foreach ($map as $key => $override) {
        // A hidden photo still counts: its replacement comes back the moment an
        // editor presses Show on site, so the file behind it is still in use.
        if (media_override_state($override)['url'] === $relative) {
            $stillUsed[] = $key;
        }
    }
    if ($stillUsed && empty($_POST['force'])) {
        media_fail(
            'That file is currently shown in place of ' . count($stillUsed) . ' photo(s). '
            . 'Restore the original first, or tick "delete anyway".',
            409
        );
    }
    // Forced: the overrides would otherwise point at a missing file. Drop the
    // replacement but keep the photo hidden if that is how it was left.
    foreach ($stillUsed as $key) {
        $state = media_override_state($map[$key]);
        $entry = media_override_entry(null, $state['hidden']);
        if ($entry === null) {
            unset($map[$key]);
        } else {
            $map[$key] = $entry;
        }
    }
    if ($stillUsed) {
        media_save_map($map);
    }

    if (!@unlink($absolute)) {
        media_fail('Could not delete the file — check folder permissions', 500);
    }
    echo json_encode(['ok' => true, 'reverted' => $stillUsed]);
    exit;
}

media_fail('Unknown action');
