<?php
/* Data now comes from backend/disclosure_data.json, written by the CMS panel.
   The old cms/mandatory-disclosure-data.php is kept as a fallback so the page
   still renders if the JSON is missing or unreadable on a fresh deploy. */
$defaults = [
    'updated' => '', 'general' => [], 'documents' => [],
    'academics' => [], 'staff' => [], 'infrastructure' => [],
];

$disclosure = null;
$jsonFile = __DIR__ . '/backend/disclosure_data.json';
clearstatcache(true, $jsonFile);
if (is_readable($jsonFile)) {
    $disclosure = json_decode((string) file_get_contents($jsonFile), true);
}
if (!is_array($disclosure)) {
    $legacy = __DIR__ . '/cms/mandatory-disclosure-data.php';
    $old = is_readable($legacy) ? require $legacy : [];
    // Convert the legacy positional arrays into the labelled shape.
    $pairs = function ($rows) {
        return array_map(function ($r) {
            return ['label' => $r[0] ?? '', 'value' => $r[1] ?? ''];
        }, is_array($rows) ? $rows : []);
    };
    $disclosure = [
        'updated'   => $old['updated'] ?? '',
        'general'   => $pairs($old['general'] ?? []),
        'staff'     => $pairs($old['staff'] ?? []),
        'academics' => $pairs($old['academics'] ?? []),
        'documents' => array_map(function ($r) {
            return ['title' => $r[0] ?? '', 'description' => $r[1] ?? '', 'pdf_url' => $r[2] ?? ''];
        }, $old['documents'] ?? []),
        'infrastructure' => $old['infrastructure'] ?? [],
    ];
}
$disclosure = array_merge($defaults, $disclosure);

function e($value): string {
    return htmlspecialchars((string) $value, ENT_QUOTES, 'UTF-8');
}

/* PDF Icon SVG helper */
function pdf_icon_svg(): string {
    return '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 2l5 5h-5V4zM8.5 13.5h1.75a1.25 1.25 0 0 1 0 2.5H8.5v-2.5zm0-1.5H6.5v7h2v-2h1.75a2.75 2.75 0 0 0 0-5.5H8.5v.5zm4.5 7h-1.5v-7h2.2a2.5 2.5 0 0 1 2.5 2.5v2a2.5 2.5 0 0 1-2.5 2.5H13v-2.5v2.5zm0-5.5v4h.7a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1H13zm5-1.5h3v1.5h-1.5v1.2h1.2v1.5h-1.2v2.8H18v-7z"/></svg>';
}

/* Numbered three-column table, matching DPS Karnal layout with S.NO., INFORMATION, DETAILS / DOWNLOAD */
function disclosure_numbered_table(array $rows, string $colHead, string $valHead, bool $asPdf): void {
    if (!$rows) {
        echo '<p class="disclosure-empty">Details available at the school office.</p>';
        return;
    }
    echo '<div class="disclosure-table-wrap"><table class="disclosure-table"><thead><tr>'
       . '<th style="width:75px; text-align:center;">S.NO.</th><th>' . e($colHead) . '</th><th style="width:200px; text-align:center;">' . e($valHead) . '</th>'
       . '</tr></thead><tbody>';
    $n = 0;
    foreach ($rows as $row) {
        $n++;
        $sno   = ($row['sno'] ?? '') !== '' ? $row['sno'] : (string) $n;
        $name  = $row['title'] ?? $row['label'] ?? '';
        $value = $row['description'] ?? $row['value'] ?? '';
        $pdf   = $row['pdf_url'] ?? '';
        echo '<tr><td style="text-align:center; font-weight:600;">' . e($sno) . '</td><td>' . e($name) . '</td><td style="text-align:center;">';
        if ($asPdf) {
            echo $pdf !== ''
                ? '<a class="document-action" href="' . e($pdf) . '" target="_blank" rel="noopener">' . pdf_icon_svg() . '<span>View PDF</span></a>'
                : '<span class="document-office">At school office</span>';
        } else {
            echo e($value);
        }
        echo '</td></tr>';
    }
    echo '</tbody></table></div>';
}

// Renders General Information table matching DPS Karnal Part A layout
function disclosure_table(array $rows): void {
    if (!$rows) {
        echo '<p class="disclosure-empty">Details available at the school office.</p>';
        return;
    }
    echo '<div class="disclosure-table-wrap"><table class="disclosure-table"><thead><tr>'
       . '<th style="width:75px; text-align:center;">S.NO.</th><th style="width:36%;">INFORMATION</th><th>DETAILS</th>'
       . '</tr></thead><tbody>';
    $n = 0;
    foreach ($rows as $row) {
        $n++;
        $label = $row['label'] ?? '';
        $value = $row['value'] ?? '';
        $pdf   = $row['pdf_url'] ?? '';
        echo '<tr><td style="text-align:center; font-weight:600;">' . $n . '</td><td style="font-weight:600;">' . e($label) . '</td><td>' . e($value);
        if ($pdf !== '') {
            echo ' <a class="document-action" style="margin-left:10px;" href="' . e($pdf) . '" target="_blank" rel="noopener">' . pdf_icon_svg() . '<span>View PDF</span></a>';
        }
        echo '</td></tr>';
    }
    echo '</tbody></table></div>';
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Mandatory Public Disclosure | Max International School</title>
<!-- meta:start -->
<meta name="description" content="CBSE Mandatory Public Disclosure for Max International School, Assandh - school documents, infrastructure details, staff and results.">
<link rel="canonical" href="https://www.maxinternationalschool.com/mandatory-disclosure.php">
<link rel="icon" href="assets/img/logo.png" type="image/png">
<link rel="apple-touch-icon" href="assets/img/logo.png">
<meta name="theme-color" content="#0B2E59">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Max International School">
<meta property="og:title" content="Mandatory Public Disclosure | Max International School">
<meta property="og:description" content="CBSE Mandatory Public Disclosure for Max International School, Assandh - school documents, infrastructure details, staff and results.">
<meta property="og:url" content="https://www.maxinternationalschool.com/mandatory-disclosure.php">
<meta property="og:image" content="https://www.maxinternationalschool.com/assets/img/school-building-1.jpg">
<meta property="og:image:alt" content="Max International School campus, Assandh">
<meta property="og:locale" content="en_IN">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="Mandatory Public Disclosure | Max International School">
<meta name="twitter:description" content="CBSE Mandatory Public Disclosure for Max International School, Assandh - school documents, infrastructure details, staff and results.">
<meta name="twitter:image" content="https://www.maxinternationalschool.com/assets/img/school-building-1.jpg">
<!-- meta:end -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@500;600;700;800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="assets/css/style.css">
  <!-- Applies photo swaps made in the CMS. Loaded here, not deferred, so a
       replaced photo is in place before the browser requests the original. -->
  <script src="assets/js/site-images.js"></script>
</head>
<body>
  <div class="topbar">
    <div class="container">
      <div class="topbar-left">
        <span>📍 Safidon Road, Assandh, Karnal (HR)</span>
        <span>📞 <a href="tel:+919050294300">+91 90502 94300</a></span>
      </div>
      <div class="topbar-right">
        <span>✉️ <a href="mailto:info@maxinternationalschool.com">info@maxinternationalschool.com</a></span>
      </div>
    </div>
  </div>
  <header class="main-nav">
    <div class="container nav-inner">
      <a href="index.html" class="logo-wrap"><img src="assets/img/logo.png" alt="Max International School logo"></a>
      <nav class="menu" aria-label="Primary navigation">
        <ul>
          <li><a href="index.html">Homepage</a></li>
          <li class="active">
            <a href="about-us.html">About Us <span class="car">▾</span></a>
            <div class="dropdown">
              <div class="sub-head">About Max</div>
              <a href="about-us.html#philosophy">Philosophy</a>
              <a href="about-us.html#mission">Mission</a>
              <a href="about-us.html#vision">Vision</a>
              <a href="about-us.html#chairman">Message from Chairperson</a>
              <a href="about-us.html#director">Message from Director</a>
              <a href="about-us.html#principal">Message from Principal</a>
              <div class="sub-head">Infrastructure</div>
              <a href="about-us.html#infra">360° View</a>
              <a href="about-us.html#infra">Virtual Tour</a>
              <a href="about-us.html#infra">Facilities</a>
              <a href="mandatory-disclosure.php">CBSE Mandatory Disclosure</a>
              <a href="about-us.html#awards">Awards &amp; Honours</a>
            </div>
          </li>
          <li>
            <a href="academics.html">Academics <span class="car">▾</span></a>
            <div class="dropdown">
              <a href="academics.html#wings">Three Wings (Junior, Primary, Senior)</a>
              <a href="promax.html">PRO Max Classes</a>
              <a href="academics.html#how-we-teach">How We Teach</a>
              <a href="academics.html#curriculum">Curriculum</a>
              <a href="academics.html#beyond">Beyond Textbook</a>
              <a href="academics.html#planner">Yearly Planner</a>
            </div>
          </li>
          <li>
            <a href="beyond-activities.html">Beyond Activities <span class="car">▾</span></a>
            <div class="dropdown">
              <a href="beyond-activities.html#calendar">Co-Curricular Calendar</a>
              <a href="beyond-activities.html#sports">Sports</a>
              <a href="beyond-activities.html#council">Student Council</a>
              <a href="beyond-activities.html#exchange">Intl. Educational Exchange Programs</a>
              <a href="beyond-activities.html#visits">Educational Visits</a>
              <div class="sub-head">Gallery</div>
              <a href="gallery.html#events">Photo Gallery</a>
              <a href="gallery.html#newsletter">E-Newsletter</a>
              <a href="gallery.html#notif">Events &amp; Notifications</a>
            </div>
          </li>
          <li><a href="promax.html">Pro Max</a></li>
          <li>
            <a href="admission.html">Admission <span class="car">▾</span></a>
            <div class="dropdown">
              <a href="admission.html#process">Admission Process</a>
              <a href="admission.html#apply">Apply Now</a>
              <a href="admission.html#fees">Fee Structure</a>
              <a href="admission.html#refund-policy">Refund Policy</a>
            </div>
          </li>
          <li><a href="career.html">Career</a></li>
          <li class="active"><a href="mandatory-disclosure.php">Mandatory Disclosure</a></li>
          <li><a href="contact-us.html">Contact Us</a></li>
        </ul>
      </nav>
      <div class="nav-cta">
        <a href="admin.html" class="login-pill">Log In</a>
        <a href="admission.html#apply" class="btn btn-orange">Apply Now</a>
        <div class="burger"><span></span><span></span><span></span></div>
      </div>
    </div>
  </header>

  <?php
  $academicSession = trim((string)($disclosure['updated'] ?? '2026-27'));

  // Prepare Part A: General Information
  $standardGeneralKeys = [
      'school name', 'affiliation no.(if applicable)', 'affiliation no',
      'school code (if applicable)', 'school code', 'complete address with pin code',
      'address', 'principal name & qualification:', 'principal name',
      'school email id', 'email', 'contact details (landline/mobile)',
      'school contact number', 'contact'
  ];
  $generalMap = [];
  $extraGeneral = [];
  if (!empty($disclosure['general'])) {
      foreach ($disclosure['general'] as $g) {
          $lbl = trim((string)($g['label'] ?? ''));
          $val = trim((string)($g['value'] ?? ''));
          $k = strtolower($lbl);
          if ($lbl === '' && $val === '') continue;
          $generalMap[$k] = $val;
          if (!in_array($k, $standardGeneralKeys, true)) {
              $extraGeneral[] = ['label' => $lbl, 'value' => $val];
          }
      }
  }
  $schoolName = $generalMap['school name'] ?? 'MAX INTERNATIONAL SCHOOL';
  $affilNo    = $generalMap['affiliation no.(if applicable)'] ?? $generalMap['affiliation no'] ?? '';
  $schoolCode = $generalMap['school code (if applicable)'] ?? $generalMap['school code'] ?? '';
  $address    = $generalMap['address'] ?? $generalMap['complete address with pin code'] ?? 'SAFIDON ROAD, ASSANDH, DISTRICT KARNAL, HARYANA - 132039';
  $principal  = $generalMap['principal name'] ?? $generalMap['principal name & qualification:'] ?? 'MS. SONIKA RAI, M.A., B.Ed.';
  $email      = $generalMap['school email id'] ?? $generalMap['email'] ?? 'principal@maxinternationalschool.com';
  $contact    = $generalMap['school contact number'] ?? $generalMap['contact details (landline/mobile)'] ?? '9050294300, 9050248300';

  // Prepare Part B: Documents and Information
  $defaultDocTitles = [
      1 => 'COPIES OF AFFILIATION/UPGRADATION LETTER AND RECENT EXTENSION OF AFFILIATION, IF ANY',
      2 => 'COPIES OF SOCIETIES/TRUST/COMPANY REGISTRATION/RENEWAL CERTIFICATE, AS APPLICABLE',
      3 => 'COPY OF NO OBJECTION CERTIFICATE (NOC) ISSUED, IF APPLICABLE, BY THE STATE GOVT./UT',
      4 => "COPIES OF RECOGNITION CERTIFICATE UNDER RTE ACT, 2009, AND IT'S RENEWAL IF APPLICABLE",
      5 => 'COPY OF VALID BUILDING SAFETY CERTIFICATE AS PER THE NATIONAL BUILDING CODE',
      6 => 'COPY OF VALID FIRE SAFETY CERTIFICATE ISSUED BY THE COMPETENT AUTHORITY',
      7 => 'COPY OF THE DEO CERTIFICATE SUBMITTED BY THE SCHOOL FOR AFFILIATION/UPGRADATION/EXTENSION OF AFFILIATIONOR SELF CERTIFICATION BY SCHOOL',
      8 => 'COPIES OF VALID DRINKING WATER, HEALTH AND SANITATION CERTIFICATES AND WATER TESTING REPORT',
  ];
  $defaultDocPdfs = [
      1 => 'backend/uploads/disclosure/b/1.pdf',
      2 => 'backend/uploads/disclosure/b/2.pdf',
      3 => 'backend/uploads/disclosure/b/3.pdf',
      4 => 'backend/uploads/disclosure/b/4.pdf',
      5 => 'backend/uploads/disclosure/b/5.pdf',
      6 => 'backend/uploads/disclosure/b/6.pdf',
      7 => 'backend/uploads/disclosure/b/7.pdf',
      8 => 'backend/uploads/disclosure/b/8.pdf',
  ];
  $allDocs = !empty($disclosure['documents']) ? $disclosure['documents'] : [];
  $primaryDocs = [];
  $additionalDocs = [];
  if (!empty($allDocs)) {
      $docIdx = 0;
      foreach ($allDocs as $d) {
          $docIdx++;
          $id    = (int)($d['id'] ?? 0);
          $title = trim((string)($d['title'] ?? ''));
          $pdf   = trim((string)($d['pdf_url'] ?? ''));
          $desc  = trim((string)($d['description'] ?? ''));
          $sno   = trim((string)($d['sno'] ?? ''));
          $primaryDocs[] = [
              'id'          => $id,
              'sno'         => (is_numeric($sno) || $sno === '') ? (string)$docIdx : $sno,
              'title'       => $title !== '' ? $title : ('Document #' . $docIdx),
              'description' => $desc,
              'pdf_url'     => $pdf,
          ];
      }
  } else {
      for ($i = 1; $i <= 8; $i++) {
          $primaryDocs[] = [
              'id'          => $i,
              'sno'         => (string)$i,
              'title'       => $defaultDocTitles[$i],
              'pdf_url'     => $defaultDocPdfs[$i],
              'description' => '',
          ];
      }
  }

  // Prepare Part C: Results and Academics
  $defaultAcademicTitles = [
      1 => 'FEE STRUCTURE OF THE SCHOOL',
      2 => 'ANNUAL ACADEMIC CALANDER.',
      3 => 'LIST OF SCHOOL MANAGEMENT COMMITTEE (SMC)',
      4 => 'LIST OF PARENTS TEACHERS ASSOCIATION (PTA) MEMBERS',
  ];
  $defaultAcademicPdfs = [
      1 => 'backend/uploads/disclosure/c/1.pdf',
      2 => 'backend/uploads/disclosure/c/2.pdf',
      3 => 'backend/uploads/disclosure/c/3.pdf',
      4 => 'backend/uploads/disclosure/c/4.pdf',
  ];
  $allAcademics = !empty($disclosure['academics']) ? $disclosure['academics'] : [];
  $primaryAcademics = [];
  $additionalAcademics = [];
  if (!empty($allAcademics)) {
      $acIdx = 0;
      foreach ($allAcademics as $a) {
          $acIdx++;
          $id    = (int)($a['id'] ?? 0);
          $label = trim((string)($a['label'] ?? ''));
          $val   = trim((string)($a['value'] ?? ''));
          $pdf   = trim((string)($a['pdf_url'] ?? ''));
          $sno   = trim((string)($a['sno'] ?? ''));
          $primaryAcademics[] = [
              'id'      => $id,
              'sno'     => (is_numeric($sno) || $sno === '') ? (string)$acIdx : $sno,
              'title'   => $label !== '' ? $label : ('Academic Notice #' . $acIdx),
              'value'   => $val,
              'pdf_url' => $pdf,
          ];
      }
  } else {
      for ($i = 1; $i <= 4; $i++) {
          $primaryAcademics[] = [
              'id'      => $i,
              'sno'     => (string)$i,
              'title'   => $defaultAcademicTitles[$i],
              'pdf_url' => $defaultAcademicPdfs[$i],
              'value'   => '',
          ];
      }
  }

  $resultX = !empty($disclosure['results_x']) ? $disclosure['results_x'] : [
      ['sno' => '1', 'year' => '2021-22', 'registered' => '70', 'passed' => '65', 'pct' => '92.86%', 'pdf' => $resultsPdfs['x_2022']],
      ['sno' => '2', 'year' => '2022-23', 'registered' => '81', 'passed' => '74', 'pct' => '91.36%', 'pdf' => $resultsPdfs['x_2023']],
      ['sno' => '3', 'year' => '2023-24', 'registered' => '99', 'passed' => '89', 'pct' => '89.90%', 'pdf' => $resultsPdfs['x_2024']],
  ];
  $resultXII = !empty($disclosure['results_xii']) ? $disclosure['results_xii'] : [
      ['sno' => '1', 'year' => '2021-22', 'registered' => '74', 'passed' => '66', 'pct' => '89.19%', 'pdf' => $resultsPdfs['xii_2022']],
      ['sno' => '2', 'year' => '2022-23', 'registered' => '103', 'passed' => '94', 'pct' => '91.26%', 'pdf' => $resultsPdfs['xii_2023']],
      ['sno' => '3', 'year' => '2023-24', 'registered' => '94', 'passed' => '88', 'pct' => '93.62%', 'pdf' => $resultsPdfs['xii_2024']],
  ];

  // Prepare Part D: Staff (Teaching)
  $standardStaffKeys = [
      'principal', 'vice principal', 'headmistress/headmaster', 'headmaster', 'headmistress',
      'total no. of teachers', 'total teachers', 'pgt', 'tgt', 'prt', 'ntt', 'pet',
      'teacher student ratio', 'teachers section ratio', 'special educator',
      'wellness teacher', 'counsellor & wellness teacher', 'counsellor'
  ];
  $staffMap = [];
  $extraStaff = [];
  if (!empty($disclosure['staff'])) {
      foreach ($disclosure['staff'] as $st) {
          $lbl = trim((string)($st['label'] ?? ''));
          $val = trim((string)($st['value'] ?? ''));
          $k = strtolower($lbl);
          if ($lbl === '' && $val === '') continue;
          $staffMap[$k] = $val;
          if (!in_array($k, $standardStaffKeys, true)) {
              $extraStaff[] = ['label' => $lbl, 'value' => $val];
          }
      }
  }
  $principalCount  = $staffMap['principal'] ?? '1';
  $vicePrincipal   = $staffMap['vice principal'] ?? '0';
  $headmaster      = $staffMap['headmistress/headmaster'] ?? $staffMap['headmaster'] ?? $staffMap['headmistress'] ?? '-';
  $totalTeachers   = $staffMap['total no. of teachers'] ?? $staffMap['total teachers'] ?? '54';
  $pgtCount        = $staffMap['pgt'] ?? '16';
  $tgtCount        = $staffMap['tgt'] ?? '15';
  $prtCount        = $staffMap['prt'] ?? '23';
  $nttCount        = $staffMap['ntt'] ?? '6';
  $petCount        = $staffMap['pet'] ?? '2';
  $ratio           = $staffMap['teacher student ratio'] ?? $staffMap['teachers section ratio'] ?? '1:1.5';
  $specialEducator = $staffMap['special educator'] ?? 'Ms. Neetu (B.A., Diploma in Special Education)';
  $counsellor      = $staffMap['wellness teacher'] ?? $staffMap['counsellor & wellness teacher'] ?? $staffMap['counsellor'] ?? 'Ms. Sonia (M.A. Hindi, Pol. Science, NTT, B.Ed.)';

  // Dynamic Staff Details PDF URL (from doc id 9 or title 'Staff Detail')
  $staffListPdf = 'backend/uploads/disclosure/b/9.pdf';
  if (!empty($disclosure['documents'])) {
      foreach ($disclosure['documents'] as $d) {
          if ((int)($d['id'] ?? 0) === 9 || stripos($d['title'] ?? '', 'Staff Detail') !== false) {
              if (!empty($d['pdf_url'])) {
                  $staffListPdf = $d['pdf_url'];
                  break;
              }
          }
      }
  }
  ?>

  <main class="cbse-disclosure-page">
    <div class="container">

      <div class="cbse-toolbar">
        <div class="cbse-toolbar-note">
          Official CBSE Mandatory Public Disclosure
          <span class="cbse-session-badge">Session <?= e($academicSession) ?></span>
        </div>
    
      </div>

      <div class="cbse-disclosure-doc">
        <!-- CBSE Official Header -->
        <header class="cbse-header">
          <div class="cbse-header-top">
            <div class="cbse-emblem-left">
              <img src="assets/img/national-emblem.png" alt="State Emblem of India">
            </div>
            <div class="cbse-header-titles">
              <div class="cbse-title-hi">केन्द्रीय माध्यमिक शिक्षा बोर्ड</div>
              <div class="cbse-sub-hi">( मानव संसाधन विकास मंत्रालय, भारत सरकार के अधीन एक स्वायत्त संगठन )</div>
              <div class="cbse-title-en">CENTRAL BOARD OF SECONDARY EDUCATION</div>
              <div class="cbse-sub-en">(An Autonomous Organisation under the Ministry of Human Resource Development, Govt. of India)</div>
            </div>
            <div class="cbse-emblem-right">
              <img src="assets/img/cbse-logo.png" alt="CBSE Emblem">
            </div>
          </div>
        </header>

        <h1 class="cbse-main-title">MANDATORY PUBLIC DISCLOSURE</h1>

        <!-- A: GENERAL INFORMATION -->
        <div class="cbse-section-title">A: GENERAL INFORMATION:</div>
        <div class="cbse-table-wrap">
          <table class="cbse-table">
            <thead>
              <tr>
                <th class="col-sno">SL NO.</th>
                <th style="width:44%;">INFORMATION</th>
                <th>DETAILS</th>
              </tr>
            </thead>
            <tbody>
              <?php
              $defaultGeneral = array_values(array_filter([
                  ['label' => 'NAME OF THE SCHOOL', 'value' => $schoolName],
                  $affilNo !== '' ? ['label' => 'AFFILIATION NO.(IF APPLICABLE)', 'value' => $affilNo] : null,
                  $schoolCode !== '' ? ['label' => 'SCHOOL CODE (IF APPLICABLE)', 'value' => $schoolCode] : null,
                  ['label' => 'COMPLETE ADDRESS WITH PIN CODE', 'value' => $address],
                  ['label' => 'PRINCIPAL NAME & QUALIFICATION:', 'value' => $principal],
                  ['label' => 'SCHOOL EMAIL ID', 'value' => $email],
                  ['label' => 'CONTACT DETAILS (LANDLINE/MOBILE)', 'value' => $contact],
              ]));
              $generalRows = !empty($disclosure['general']) ? $disclosure['general'] : $defaultGeneral;
              $gIndex = 0;
              foreach ($generalRows as $gr):
                  $gLbl = trim((string)($gr['label'] ?? ''));
                  $gVal = trim((string)($gr['value'] ?? ''));
                  if ($gLbl === '' && $gVal === '') continue;
                  $gIndex++;
                  $isEmailOrUrl = stripos($gLbl, 'email') !== false || filter_var($gVal, FILTER_VALIDATE_URL) || filter_var($gVal, FILTER_VALIDATE_EMAIL);
                  $dispVal = $isEmailOrUrl ? $gVal : strtoupper($gVal);
              ?>
              <tr>
                <td class="col-sno"><?= $gIndex ?></td>
                <td class="col-info"><?= e(strtoupper($gLbl)) ?></td>
                <td><?= e($dispVal) ?></td>
              </tr>
              <?php endforeach; ?>
            </tbody>
          </table>
        </div>

        <!-- B: DOCUMENTS AND INFORMATION -->
        <div class="cbse-section-title">B: DOCUMENTS AND INFORMATION:</div>
        <div class="cbse-table-wrap">
          <table class="cbse-table">
            <thead>
              <tr>
                <th class="col-sno">SL NO.</th>
                <th>DOCUMENTS/INFORMATION</th>
                <th class="col-center" style="width:210px;">UPLOAD DOCUMENTS</th>
              </tr>
            </thead>
            <tbody>
              <?php $pdIndex = 0; foreach ($primaryDocs as $pd): $pdIndex++; ?>
              <tr>
                <td class="col-sno"><?= !empty($pd['sno']) ? e($pd['sno']) : $pdIndex ?></td>
                <td>
                  <?= e(strtoupper($pd['title'])) ?>
                  <?php if (!empty($pd['description'])): ?>
                    <div style="font-size:11.5px;color:#64748b;margin-top:2px;font-weight:normal;"><?= e($pd['description']) ?></div>
                  <?php endif; ?>
                </td>
                <td class="col-center">
                  <?php if (!empty($pd['pdf_url'])): ?>
                    <a class="cbse-link-btn" href="<?= e($pd['pdf_url']) ?>" target="_blank" rel="noopener">
                      <?= pdf_icon_svg() ?><span>VIEW DOCUMENT</span>
                    </a>
                  <?php else: ?>
                    <span class="cbse-office-text">Available at school office</span>
                  <?php endif; ?>
                </td>
              </tr>
              <?php endforeach; ?>
            </tbody>
          </table>
        </div>

        <!-- C: RESULT AND ACADEMICS -->
        <div class="cbse-section-title">C: RESULT AND ACADEMICS:</div>
        <div class="cbse-table-wrap">
          <table class="cbse-table">
            <thead>
              <tr>
                <th class="col-sno">S.NO.</th>
                <th>DOCUMENTS/INFORMATION</th>
                <th class="col-center" style="width:210px;">UPLOAD DOCUMENTS</th>
              </tr>
            </thead>
            <tbody>
              <?php $paIndex = 0; foreach ($primaryAcademics as $pa): $paIndex++; ?>
              <tr>
                <td class="col-sno"><?= !empty($pa['sno']) ? e($pa['sno']) : $paIndex ?></td>
                <td>
                  <?= e(strtoupper($pa['title'])) ?>
                  <?php if (!empty($pa['value'])): ?>
                    <div style="font-size:11.5px;color:#64748b;margin-top:2px;font-weight:normal;"><?= e($pa['value']) ?></div>
                  <?php endif; ?>
                </td>
                <td class="col-center">
                  <?php if (!empty($pa['pdf_url'])): ?>
                    <a class="cbse-link-btn" href="<?= e($pa['pdf_url']) ?>" target="_blank" rel="noopener">
                      <?= pdf_icon_svg() ?><span>VIEW DOCUMENT</span>
                    </a>
                  <?php else: ?>
                    <span class="cbse-office-text">Available at school office</span>
                  <?php endif; ?>
                </td>
              </tr>
              <?php endforeach; ?>
              <tr>
                <td class="col-sno"><?= count($primaryAcademics) + 1 ?></td>
                <td>LAST THREE-YEAR RESULT OF THE BOARD EXAMINATION (AS PER APPLICABLILITY)</td>
                <td class="col-center" style="font-weight:700;">AS DETAILED BELOW</td>
              </tr>
            </tbody>
          </table>
        </div>

        <?php if (!empty($additionalAcademics)): ?>
        <div class="cbse-sub-section-title">ADDITIONAL ACADEMIC DOCUMENTS &amp; INFORMATION:</div>
        <div class="cbse-table-wrap">
          <table class="cbse-table">
            <thead>
              <tr>
                <th class="col-sno">S.NO.</th>
                <th>DOCUMENTS/INFORMATION</th>
                <th class="col-center" style="width:210px;">UPLOAD DOCUMENTS</th>
              </tr>
            </thead>
            <tbody>
              <?php $aacIndex = 0; foreach ($additionalAcademics as $aac): $aacIndex++; ?>
              <tr>
                <td class="col-sno"><?= !empty($aac['sno']) ? e($aac['sno']) : $aacIndex ?></td>
                <td>
                  <?= e(strtoupper($aac['title'])) ?>
                  <?php if (!empty($aac['value'])): ?>
                    <div style="font-size:11.5px;color:#64748b;margin-top:2px;font-weight:normal;"><?= e($aac['value']) ?></div>
                  <?php endif; ?>
                </td>
                <td class="col-center">
                  <?php if (!empty($aac['pdf_url'])): ?>
                    <a class="cbse-link-btn" href="<?= e($aac['pdf_url']) ?>" target="_blank" rel="noopener">
                      <?= pdf_icon_svg() ?><span>VIEW DOCUMENT</span>
                    </a>
                  <?php else: ?>
                    <span class="cbse-office-text">Available at school office</span>
                  <?php endif; ?>
                </td>
              </tr>
              <?php endforeach; ?>
            </tbody>
          </table>
        </div>
        <?php endif; ?>

        <div class="cbse-sub-section-title">RESULT CLASS: X</div>
        <div class="cbse-table-wrap">
          <table class="cbse-table">
            <thead>
              <tr>
                <th class="col-sno">S.NO.</th>
                <th class="col-center">YEAR</th>
                <th class="col-center">NO. OF REGISTERED STUDENTS</th>
                <th class="col-center">NO. OF STUDETNS PASSED</th>
                <th class="col-center">PASS PERCENTAGE</th>
                <th class="col-center" style="width:160px;">REMARKS</th>
              </tr>
            </thead>
            <tbody>
              <?php foreach ($resultX as $rx): ?>
              <tr>
                <td class="col-sno"><?= e($rx['sno']) ?></td>
                <td class="col-center" style="font-weight:700;"><?= e($rx['year']) ?></td>
                <td class="col-center"><?= e($rx['registered']) ?></td>
                <td class="col-center"><?= e($rx['passed']) ?></td>
                <td class="col-center" style="font-weight:700;"><?= e($rx['pct']) ?></td>
                <td class="col-center">
                  <?php if (!empty($rx['pdf'])): ?>
                    <a class="cbse-link-btn" href="<?= e($rx['pdf']) ?>" target="_blank" rel="noopener">
                      <?= pdf_icon_svg() ?><span>VIEW PDF</span>
                    </a>
                  <?php else: ?>
                    <span class="cbse-office-text">-</span>
                  <?php endif; ?>
                </td>
              </tr>
              <?php endforeach; ?>
            </tbody>
          </table>
        </div>

        <div class="cbse-sub-section-title">RESULT CLASS: XII</div>
        <div class="cbse-table-wrap">
          <table class="cbse-table">
            <thead>
              <tr>
                <th class="col-sno">S.NO.</th>
                <th class="col-center">YEAR</th>
                <th class="col-center">NO. OF REGISTERED STUDENTS</th>
                <th class="col-center">NO. OF STUDETNS PASSED</th>
                <th class="col-center">PASS PERCENTAGE</th>
                <th class="col-center" style="width:160px;">REMARKS</th>
              </tr>
            </thead>
            <tbody>
              <?php foreach ($resultXII as $rx): ?>
              <tr>
                <td class="col-sno"><?= e($rx['sno']) ?></td>
                <td class="col-center" style="font-weight:700;"><?= e($rx['year']) ?></td>
                <td class="col-center"><?= e($rx['registered']) ?></td>
                <td class="col-center"><?= e($rx['passed']) ?></td>
                <td class="col-center" style="font-weight:700;"><?= e($rx['pct']) ?></td>
                <td class="col-center">
                  <?php if (!empty($rx['pdf'])): ?>
                    <a class="cbse-link-btn" href="<?= e($rx['pdf']) ?>" target="_blank" rel="noopener">
                      <?= pdf_icon_svg() ?><span>VIEW PDF</span>
                    </a>
                  <?php else: ?>
                    <span class="cbse-office-text">-</span>
                  <?php endif; ?>
                </td>
              </tr>
              <?php endforeach; ?>
            </tbody>
          </table>
        </div>

        <!-- D: STAFF (TEACHING) -->
        <div class="cbse-section-title">D: STAFF (TEACHING):</div>
        <div class="cbse-table-wrap">
          <table class="cbse-table">
            <thead>
              <tr>
                <th class="col-sno">S. No.</th>
                <th>INFORMATION</th>
                <th class="col-center" style="width:180px;">NUMBER/STRENGTH</th>
                <th>NAME AND QUALIFICATIONS</th>
              </tr>
            </thead>
            <tbody>
              <?php
              $staffItems = !empty($disclosure['staff']) ? $disclosure['staff'] : [
                  ['label' => 'Principal', 'value' => $principalCount],
                  ['label' => 'Vice Principal', 'value' => $vicePrincipal],
                  ['label' => 'Headmistress/Headmaster', 'value' => $headmaster],
                  ['label' => 'Total No. of Teachers', 'value' => $totalTeachers],
                  ['label' => 'PGT', 'value' => $pgtCount],
                  ['label' => 'TGT', 'value' => $tgtCount],
                  ['label' => 'PRT', 'value' => $prtCount],
                  ['label' => 'NTT', 'value' => $nttCount],
                  ['label' => 'PET', 'value' => $petCount],
                  ['label' => 'Teachers Section Ratio', 'value' => $ratio],
                  ['label' => 'Details of Special Educator', 'value' => $specialEducator],
                  ['label' => 'Details of Counsellor & Wellness Teacher', 'value' => $counsellor],
              ];

              $sNoCount = 0;
              foreach ($staffItems as $st):
                  $sLbl = trim((string)($st['label'] ?? ''));
                  $sVal = trim((string)($st['value'] ?? ''));
                  if ($sLbl === '' && $sVal === '') continue;
                  $k = strtolower($sLbl);

                  $isSubLevel = in_array($k, ['pgt', 'tgt', 'prt', 'ntt', 'pet'], true) || strpos($sLbl, '▪') === 0;

                  if ($isSubLevel) {
                      $subName = ltrim($sLbl, '▪ ');
              ?>
              <tr class="sub-level">
                <td></td>
                <td class="indent-sub">▪ <?= e(strtoupper($subName)) ?></td>
                <td class="col-center"><?= e($sVal) ?></td>
                <td>
                  <a href="<?= e($staffListPdf) ?>" target="_blank" rel="noopener" class="cbse-text-link">
                    NAME-DESIGNATION -QUALIFICATION (PROVIDE LINK)
                  </a>
                </td>
              </tr>
              <?php
                  } else {
                      $sNoCount++;
                      $colStrength = '-';
                      $colDetails = '-';

                      if ($k === 'principal') {
                          $colStrength = ($sVal !== '' && $sVal !== '0') ? $sVal : '1';
                          $colDetails = strtoupper($principal);
                      } elseif ($k === 'vice principal') {
                          $colStrength = $sVal;
                          $colDetails = ($sVal !== '0' && $sVal !== '-') ? $sVal : '-';
                      } elseif (strpos($k, 'headmaster') !== false || strpos($k, 'headmistress') !== false) {
                          $colStrength = $sVal;
                          $colDetails = ($sVal !== '-') ? $sVal : '-';
                      } elseif (strpos($k, 'total') !== false && strpos($k, 'teacher') !== false) {
                          $colStrength = $sVal;
                          $colDetails = 'LINK_BTN';
                      } elseif (strpos($k, 'ratio') !== false) {
                          $colStrength = $sVal;
                          $colDetails = '-';
                      } elseif (strpos($k, 'special educator') !== false) {
                          $colStrength = '1';
                          $colDetails = strtoupper($sVal);
                      } elseif (strpos($k, 'counsellor') !== false || strpos($k, 'wellness') !== false) {
                          $colStrength = '1';
                          $colDetails = strtoupper($sVal);
                      } else {
                          if (is_numeric($sVal)) {
                              $colStrength = $sVal;
                              $colDetails = '-';
                          } else {
                              $colStrength = '-';
                              $colDetails = strtoupper($sVal);
                          }
                      }
              ?>
              <tr>
                <td class="col-sno"><?= $sNoCount ?>.</td>
                <td class="col-info"><?= e(strtoupper($sLbl)) ?></td>
                <td class="col-center"><?= e($colStrength) ?></td>
                <td>
                  <?php if ($colDetails === 'LINK_BTN'): ?>
                    <a href="<?= e($staffListPdf) ?>" target="_blank" rel="noopener" class="cbse-link-btn">
                      <?= pdf_icon_svg() ?><span>UPLOAD LIST/DETAILS</span>
                    </a>
                  <?php else: ?>
                    <?= e($colDetails) ?>
                  <?php endif; ?>
                </td>
              </tr>
              <?php
                  }
              endforeach;
              ?>
            </tbody>
          </table>
        </div>

        <!-- E: SCHOOL INFRASTRUCTURE -->
        <?php
        $infraSpecs = !empty($disclosure['infrastructure_specs']) ? $disclosure['infrastructure_specs'] : [
            ['sno' => '1.', 'label' => 'TOTAL CAMPUS AREA OF THE SCHOOL (IN SQR MTR)', 'value' => '10117 SQ MTR (2.5 ACRES)'],
            ['sno' => '2.', 'label' => 'NO. AND SIZE OF THE CLASSSROOM (IN SQR MTR)', 'value' => '42 CLASSROOMS (55 SQ MTR EACH)'],
            ['sno' => '3.', 'label' => 'NO. AND SIZE OF LABORATORIES INCLUDING COMPUTER LABS (IN SQR MTR)', 'value' => '5 LABORATORIES (PHYSICS, CHEMISTRY, BIOLOGY, COMPOSITE SCIENCE, COMPUTER LAB - 75 SQ MTR EACH)'],
            ['sno' => '4.', 'label' => 'NO. AND SIZE OF LIBRARY (IN SQR MTR)', 'value' => '1 LIBRARY (120 SQ MTR)'],
            ['sno' => '5.', 'label' => 'INTERNET FACILITY (YES/NO)', 'value' => 'YES (HIGH-SPEED BROADBAND & WI-FI ACROSS CAMPUS)'],
            ['sno' => '6.', 'label' => 'NO. OF GIRLS TOILETS', 'value' => '16'],
            ['sno' => '7.', 'label' => 'NO. OF BOYS TOILETS', 'value' => '16'],
            ['sno' => '8.', 'label' => 'NO. OF CWSN TOILETS', 'value' => '2 (BARRIER-FREE TOILETS FOR CHILDREN WITH SPECIAL NEEDS)'],
            ['sno' => '9.', 'label' => 'LINK OF YOU TUBE VIDEO OF THE INSPECTION OF SCHOOL COVERING THE INFRASTRUCTURE OPF THE SCHOOL', 'value' => 'https://www.youtube.com/@maxinternationalschool2041'],
        ];
        ?>
        <div class="cbse-section-title">E: SCHOOL INFRASTRUCTURE:</div>
        <div class="cbse-table-wrap">
          <table class="cbse-table">
            <thead>
              <tr>
                <th class="col-sno">S. No.</th>
                <th style="width:55%;">INFORMATION</th>
                <th>DETAILS</th>
              </tr>
            </thead>
            <tbody>
              <?php $isIdx = 0; foreach ($infraSpecs as $ispec): $isIdx++; ?>
              <tr>
                <td class="col-sno"><?= e(!empty($ispec['sno']) ? $ispec['sno'] : ($isIdx . '.')) ?></td>
                <td class="col-info"><?= e(strtoupper($ispec['label'] ?? '')) ?></td>
                <td>
                  <?php
                  $specVal = trim((string)($ispec['value'] ?? ''));
                  $isUrl = filter_var($specVal, FILTER_VALIDATE_URL) || stripos($ispec['label'] ?? '', 'video') !== false || stripos($ispec['label'] ?? '', 'youtube') !== false;
                  if ($isUrl && !empty($specVal)): ?>
                    <a href="<?= e($specVal) ?>" target="_blank" rel="noopener" class="cbse-text-link">
                      PROVIDE LINK (WATCH VIDEO)
                    </a>
                  <?php else: ?>
                    <?= e($specVal) ?>
                  <?php endif; ?>
                </td>
              </tr>
              <?php endforeach; ?>
            </tbody>
          </table>
        </div>


        <div class="cbse-doc-footer">
          <span>Max International School, Safidon Road, Assandh, Karnal (HR)</span>
          <span>CBSE Mandatory Public Disclosure</span>
        </div>

      </div>
    </div>
  </main>

  <footer id="contact-footer">
    <div class="container">
      <div class="foot-grid">
        <div>
          <div class="foot-logo">
            <img src="assets/img/logo.png" alt="Max International School">
          </div>
          <p>Affiliated to CBSE, New Delhi. A stress-free environment for students and educators to draw out the best in every child.</p>
          <div class="foot-social">
            <a href="https://www.facebook.com/maxinternationalschoolassandh" aria-label="Facebook" target="_blank" rel="noopener noreferrer">
              <img src="assets/img/social-facebook.png" alt="Facebook">
            </a>
            <a href="https://www.instagram.com/maxinternationalassandh?igsh=MWlybHdhb3M5c29iZg%3D%3D&utm_source=qr" aria-label="Instagram" target="_blank" rel="noopener noreferrer">
              <img src="assets/img/social-instagram.png" alt="Instagram">
            </a>
            <a href="https://www.youtube.com/@maxinternationalschool2041" aria-label="YouTube" target="_blank" rel="noopener noreferrer">
              <img src="assets/img/social-youtube.png" alt="YouTube">
            </a>
            <a href="https://wa.me/919050294300" aria-label="WhatsApp" target="_blank" rel="noopener noreferrer">
              <img src="assets/img/social-whatsapp.png" alt="WhatsApp">
            </a>
          </div>
        </div>
        <div>
          <h5>About Max</h5>
          <ul>
            <li><a href="about-us.html">About Max International</a></li>
            <li><a href="about-us.html#chairman">Chairman's Message</a></li>
            <li><a href="about-us.html#director">Director's Message</a></li>
            <li><a href="about-us.html#principal">Principal's Message</a></li>
            <li><a href="mandatory-disclosure.php">Mandatory Disclosure</a></li>
          </ul>
        </div>
        <div>
          <h5>Infrastructure</h5>
          <ul>
            <li><a href="about-us.html#infra">School Building</a></li>
            <li><a href="about-us.html#infra">Science Labs</a></li>
            <li><a href="about-us.html#infra">Computer Lab</a></li>
            <li><a href="about-us.html#infra">Playground</a></li>
          </ul>
        </div>
        <div>
          <h5>Life @ Max</h5>
          <ul>
            <li><a href="beyond-activities.html">Achievements</a></li>
            <li><a href="promax.html">Pro-Max Competitive Classes</a></li>
            <li><a href="beyond-activities.html#sports">Sports &amp; Fitness</a></li>
          </ul>
        </div>
        <div>
          <h5>Reach Us</h5>
          <ul>
            <li>Safidon Road, Assandh, District Karnal (HR)</li>
            <li><a href="mailto:principal@maxinternationalschool.com">principal@maxinternationalschool.com</a></li>
            <li><a href="mailto:info@maxinternationalschool.com">info@maxinternationalschool.com</a></li>
            <li><a href="tel:+919050294300">9050294300</a> · <a href="tel:+919050248300">9050248300</a></li>
          </ul>
        </div>
      </div>
      <div class="foot-bottom">
        <span>© Max International School, Assandh — All rights reserved.</span>
      </div>
    </div>
  </footer>
  <script src="assets/js/menu.js"></script>
  <script src="assets/js/chatbot.js"></script>
</body>
</html>
