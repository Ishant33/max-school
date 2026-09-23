<?php
// Enquiries submitted through the contact form, for the CMS "Enquiries" screen.
// backend/form_submit.php is the only writer; everything here is read, mark as
// read/unread, delete, and a CSV export.
require_once __DIR__ . '/session_init.php';
session_start();

if (empty($_SESSION['cms_logged'])) {
    http_response_code(401);
    header('Content-Type: application/json');
    echo json_encode(['ok' => false, 'message' => 'Not authenticated']);
    exit;
}

$dataFile = __DIR__ . '/enquiries.json';
$action = $_GET['action'] ?? $_POST['action'] ?? '';

function enquiries_load($file)
{
    if (!is_file($file)) {
        return [];
    }
    $list = json_decode((string) file_get_contents($file), true);
    return is_array($list) ? $list : [];
}

/**
 * Read, transform and write back inside one exclusive lock, so an enquiry
 * arriving mid-edit cannot be lost.
 *
 * @param callable $mutate array $list => array $list
 */
function enquiries_mutate($file, callable $mutate)
{
    $fh = @fopen($file, 'c+');
    if (!$fh) {
        http_response_code(500);
        echo json_encode([
            'ok' => false,
            'message' => 'Could not open enquiries.json — set the backend/ folder to '
                . 'permission 755 in cPanel File Manager.',
        ]);
        exit;
    }
    if (!flock($fh, LOCK_EX)) {
        fclose($fh);
        http_response_code(500);
        echo json_encode(['ok' => false, 'message' => 'enquiries.json is busy — try again']);
        exit;
    }

    $list = json_decode((string) stream_get_contents($fh), true);
    if (!is_array($list)) {
        $list = [];
    }
    $list = $mutate($list);

    $json = json_encode(array_values($list), JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    $ok = false;
    if ($json !== false) {
        rewind($fh);
        $ok = ftruncate($fh, 0) && fwrite($fh, $json) !== false;
        fflush($fh);
    }
    flock($fh, LOCK_UN);
    fclose($fh);

    if (!$ok) {
        http_response_code(500);
        echo json_encode(['ok' => false, 'message' => 'Could not save enquiries.json']);
        exit;
    }
    return $list;
}

/* -------------------------------------------------------------------------
   export — download everything as a CSV, before the JSON header is sent
   ------------------------------------------------------------------------- */

if ($action === 'export') {
    $list = enquiries_load($dataFile);
    header('Content-Type: text/csv; charset=UTF-8');
    header('Content-Disposition: attachment; filename="enquiries-' . date('Y-m-d') . '.csv"');

    $out = fopen('php://output', 'w');
    // BOM so Excel opens the file as UTF-8 rather than mangling any accents.
    fwrite($out, "\xEF\xBB\xBF");
    fputcsv($out, ['Received', 'Name', 'Phone', 'Email', 'Interest', 'Message', 'Read']);
    foreach (array_reverse($list) as $row) {
        fputcsv($out, [
            $row['created'] ?? '',
            $row['name'] ?? '',
            $row['phone'] ?? '',
            $row['email'] ?? '',
            $row['interest'] ?? '',
            str_replace("\n", ' ', (string) ($row['message'] ?? '')),
            empty($row['is_read']) ? 'No' : 'Yes',
        ]);
    }
    fclose($out);
    exit;
}

header('Content-Type: application/json');

/* -------------------------------------------------------------------------
   list — newest first, with an unread count for the sidebar badge
   ------------------------------------------------------------------------- */

if ($action === 'list') {
    $list = enquiries_load($dataFile);

    $filter = $_GET['filter'] ?? 'all';
    if ($filter === 'unread') {
        $list = array_filter($list, function ($row) {
            return empty($row['is_read']);
        });
    }

    $search = trim((string) ($_GET['q'] ?? ''));
    if ($search !== '') {
        $needle = mb_strtolower($search);
        $list = array_filter($list, function ($row) use ($needle) {
            $hay = mb_strtolower(implode(' ', [
                $row['name'] ?? '', $row['phone'] ?? '', $row['email'] ?? '',
                $row['interest'] ?? '', $row['message'] ?? '',
            ]));
            return mb_strpos($hay, $needle) !== false;
        });
    }

    $list = array_values($list);
    usort($list, function ($a, $b) {
        return ($b['id'] ?? 0) <=> ($a['id'] ?? 0);
    });

    $all = enquiries_load($dataFile);
    $unread = count(array_filter($all, function ($row) {
        return empty($row['is_read']);
    }));

    echo json_encode([
        'ok'     => true,
        'data'   => $list,
        'total'  => count($all),
        'unread' => $unread,
    ], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}

/* -------------------------------------------------------------------------
   read — flip one enquiry's read flag
   ------------------------------------------------------------------------- */

if ($action === 'read') {
    $id = (int) ($_POST['id'] ?? 0);
    $isRead = !empty($_POST['is_read']);

    enquiries_mutate($dataFile, function ($list) use ($id, $isRead) {
        foreach ($list as &$row) {
            if ((int) ($row['id'] ?? 0) === $id) {
                $row['is_read'] = $isRead;
            }
        }
        return $list;
    });

    echo json_encode(['ok' => true, 'id' => $id, 'is_read' => $isRead]);
    exit;
}

/* -------------------------------------------------------------------------
   read_all — clear the unread badge in one go
   ------------------------------------------------------------------------- */

if ($action === 'read_all') {
    enquiries_mutate($dataFile, function ($list) {
        foreach ($list as &$row) {
            $row['is_read'] = true;
        }
        return $list;
    });

    echo json_encode(['ok' => true]);
    exit;
}

/* -------------------------------------------------------------------------
   delete
   ------------------------------------------------------------------------- */

if ($action === 'delete') {
    $id = (int) ($_POST['id'] ?? 0);

    enquiries_mutate($dataFile, function ($list) use ($id) {
        return array_filter($list, function ($row) use ($id) {
            return (int) ($row['id'] ?? 0) !== $id;
        });
    });

    echo json_encode(['ok' => true, 'id' => $id]);
    exit;
}

http_response_code(400);
echo json_encode(['ok' => false, 'message' => 'Unknown action']);
