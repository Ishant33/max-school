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
        <span>📞 <a href="tel:+919050294300">9050294300</a> · <a href="tel:+919050248300">9050248300</a></span>
        <span>📱 <a href="tel:+919050294300">+91 90502 94300</a></span>
      </div>
      <div class="topbar-social">
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
              <a href="about-us.html#secretary">Message from Secretary</a>
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
        <a href="#" class="login-pill">Log In <span class="car">▾</span></a>
        <a href="admission.html" class="btn btn-orange">Apply Now</a>
        <div class="burger"><span></span><span></span><span></span></div>
      </div>
    </div>
  </header>

  <?php
  // Prepare Part A mapping
  $generalMap = [];
  if (!empty($disclosure['general'])) {
      foreach ($disclosure['general'] as $g) {
          $k = strtolower(trim((string)($g['label'] ?? '')));
          $generalMap[$k] = trim((string)($g['value'] ?? ''));
      }
  }
  $schoolName = $generalMap['school name'] ?? 'MAX INTERNATIONAL SCHOOL';
  $affilNo    = $generalMap['affiliation no.(if applicable)'] ?? $generalMap['affiliation no'] ?? '531608';
  $schoolCode = $generalMap['school code (if applicable)'] ?? $generalMap['school code'] ?? '41608';
  $address    = $generalMap['address'] ?? $generalMap['complete address with pin code'] ?? 'SAFIDON ROAD, ASSANDH, DISTRICT KARNAL, HARYANA - 132039';
  $principal  = $generalMap['principal name'] ?? $generalMap['principal name & qualification:'] ?? 'MS. SONIKA RAI, M.A., B.Ed.';
  $email      = $generalMap['school email id'] ?? 'principal@maxinternationalschool.com';
  $contact    = $generalMap['school contact number'] ?? $generalMap['contact details (landline/mobile)'] ?? '9050294300, 9050248300';

  // Prepare Part B documents
  $primaryDocTitles = [
      1 => 'COPIES OF AFFILIATION/UPGRADATION LETTER AND RECENT EXTENSION OF AFFILIATION, IF ANY',
      2 => 'COPIES OF SOCIETIES/TRUST/COMPANY REGISTRATION/RENEWAL CERTIFICATE, AS APPLICABLE',
      3 => 'COPY OF NO OBJECTION CERTIFICATE (NOC) ISSUED, IF APPLICABLE, BY THE STATE GOVT./UT',
      4 => "COPIES OF RECOGNITION CERTIFICATE UNDER RTE ACT, 2009, AND IT'S RENEWAL IF APPLICABLE",
      5 => 'COPY OF VALID BUILDING SAFETY CERTIFICATE AS PER THE NATIONAL BUILDING CODE',
      6 => 'COPY OF VALID FIRE SAFETY CERTIFICATE ISSUED BY THE COMPETENT AUTHORITY',
      7 => 'COPY OF THE DEO CERTIFICATE SUBMITTED BY THE SCHOOL FOR AFFILIATION/UPGRADATION/EXTENSION OF AFFILIATIONOR SELF CERTIFICATION BY SCHOOL',
      8 => 'COPIES OF VALID DRINKING WATER, HEALTH AND SANITATION CERTIFICATES AND WATER TESTING REPORT',
  ];
  $primaryDocPdfs = [
      1 => 'backend/uploads/disclosure/b/1.pdf',
      2 => 'backend/uploads/disclosure/b/2.pdf',
      3 => 'backend/uploads/disclosure/b/3.pdf',
      4 => 'backend/uploads/disclosure/b/4.pdf',
      5 => 'backend/uploads/disclosure/b/5.pdf',
      6 => 'backend/uploads/disclosure/b/6.pdf',
      7 => 'backend/uploads/disclosure/b/7.pdf',
      8 => 'backend/uploads/disclosure/b/8.pdf',
  ];
  $additionalDocs = [];
  if (!empty($disclosure['documents'])) {
      foreach ($disclosure['documents'] as $d) {
          $id  = (int)($d['id'] ?? 0);
          $t   = trim((string)($d['title'] ?? ''));
          $pdf = trim((string)($d['pdf_url'] ?? ''));
          if ($id >= 1 && $id <= 8 && $pdf !== '') {
              $primaryDocPdfs[$id] = $pdf;
          } elseif ($pdf !== '') {
              $additionalDocs[] = ['title' => $t, 'pdf' => $pdf];
          }
      }
  }

  // Prepare Part C academics
  $academicPdfs = [
      1 => 'backend/uploads/disclosure/c/1.pdf',
      2 => 'backend/uploads/disclosure/c/2.pdf',
      3 => 'backend/uploads/disclosure/c/3.pdf',
      4 => 'backend/uploads/disclosure/c/4.pdf',
  ];
  if (!empty($disclosure['academics'])) {
      foreach ($disclosure['academics'] as $a) {
          $id  = (int)($a['id'] ?? 0);
          $pdf = trim((string)($a['pdf_url'] ?? ''));
          if ($id >= 1 && $id <= 4 && $pdf !== '') {
              $academicPdfs[$id] = $pdf;
          }
      }
  }

  $resultX = [
      ['sno' => '1', 'year' => '2021-22', 'registered' => '70', 'passed' => '65', 'pct' => '92.86%', 'pdf' => 'backend/uploads/disclosure/c/5.pdf'],
      ['sno' => '2', 'year' => '2022-23', 'registered' => '81', 'passed' => '74', 'pct' => '91.36%', 'pdf' => 'backend/uploads/disclosure/c/6.pdf'],
      ['sno' => '3', 'year' => '2023-24', 'registered' => '99', 'passed' => '89', 'pct' => '89.90%', 'pdf' => 'backend/uploads/disclosure/c/7.pdf'],
  ];
  $resultXII = [
      ['sno' => '1', 'year' => '2021-22', 'registered' => '74', 'passed' => '66', 'pct' => '89.19%', 'pdf' => 'backend/uploads/disclosure/c/8.pdf'],
      ['sno' => '2', 'year' => '2022-23', 'registered' => '103', 'passed' => '94', 'pct' => '91.26%', 'pdf' => 'backend/uploads/disclosure/c/9.pdf'],
      ['sno' => '3', 'year' => '2023-24', 'registered' => '94', 'passed' => '88', 'pct' => '93.62%', 'pdf' => 'backend/uploads/disclosure/c/10.pdf'],
  ];

  // Prepare Part D staff
  $staffMap = [];
  if (!empty($disclosure['staff'])) {
      foreach ($disclosure['staff'] as $st) {
          $k = strtolower(trim((string)($st['label'] ?? '')));
          $staffMap[$k] = trim((string)($st['value'] ?? ''));
      }
  }
  $principalCount  = $staffMap['principal'] ?? '1';
  $totalTeachers   = $staffMap['total no. of teachers'] ?? '54';
  $pgtCount        = $staffMap['pgt'] ?? '16';
  $tgtCount        = $staffMap['tgt'] ?? '15';
  $prtCount        = $staffMap['prt'] ?? '23';
  $ratio           = $staffMap['teacher student ratio'] ?? $staffMap['teachers section ratio'] ?? '1:1.5';
  $specialEducator = $staffMap['special educator'] ?? 'Ms. Neetu (B.A., Diploma in Special Education)';
  $counsellor      = $staffMap['wellness teacher'] ?? $staffMap['counsellor & wellness teacher'] ?? 'Ms. Sonia (M.A. Hindi, Pol. Science, NTT, B.Ed.)';
  ?>

  <main class="cbse-disclosure-page">
    <div class="container">

      <div class="cbse-toolbar">
        <div class="cbse-toolbar-note">
          Official CBSE Appendix-IX Revised Format | Mandatory Public Disclosure
        </div>
        <button type="button" class="cbse-print-btn" onclick="window.print()">
          <svg viewBox="0 0 24 24"><path d="M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zm-3 11H8v-5h8v5zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-1-9H6v4h12V3z"/></svg>
          <span>Print / Save PDF</span>
        </button>
      </div>

      <div class="cbse-disclosure-doc">
        <!-- CBSE Official Appendix IX Header -->
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
          <div class="cbse-appendix-meta">
            APPENDIX - IX<br>REVISED FORMAT
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
              <tr>
                <td class="col-sno">1</td>
                <td class="col-info">NAME OF THE SCHOOL</td>
                <td><?= e(strtoupper($schoolName)) ?></td>
              </tr>
              <tr>
                <td class="col-sno">2</td>
                <td class="col-info">AFFILIATION NO.(IF APPLICABLE)</td>
                <td><?= e($affilNo) ?></td>
              </tr>
              <tr>
                <td class="col-sno">3</td>
                <td class="col-info">SCHOOL CODE (IF APPLICABLE)</td>
                <td><?= e($schoolCode) ?></td>
              </tr>
              <tr>
                <td class="col-sno">4</td>
                <td class="col-info">COMPLETE ADDRESS WITH PIN CODE</td>
                <td><?= e(strtoupper($address)) ?></td>
              </tr>
              <tr>
                <td class="col-sno">5</td>
                <td class="col-info">PRINCIPAL NAME &amp; QUALIFICATION:</td>
                <td><?= e(strtoupper($principal)) ?></td>
              </tr>
              <tr>
                <td class="col-sno">6</td>
                <td class="col-info">SCHOOL EMAIL ID</td>
                <td><?= e($email) ?></td>
              </tr>
              <tr>
                <td class="col-sno">7</td>
                <td class="col-info">CONTACT DETAILS (LANDLINE/MOBILE)</td>
                <td><?= e($contact) ?></td>
              </tr>
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
              <?php for ($i = 1; $i <= 8; $i++): ?>
              <tr>
                <td class="col-sno"><?= $i ?></td>
                <td><?= e($primaryDocTitles[$i]) ?></td>
                <td class="col-center">
                  <?php if (!empty($primaryDocPdfs[$i])): ?>
                    <a class="cbse-link-btn" href="<?= e($primaryDocPdfs[$i]) ?>" target="_blank" rel="noopener">
                      <?= pdf_icon_svg() ?><span>VIEW DOCUMENT</span>
                    </a>
                  <?php else: ?>
                    <span>-</span>
                  <?php endif; ?>
                </td>
              </tr>
              <?php endfor; ?>
            </tbody>
          </table>
        </div>

        <!-- Statutory Note -->
        <div class="cbse-note-box">
          <strong>NOTE:</strong> THE SCHOOLS NEEDS TO UPLOAD THE SELF ATTESTED COPIES OF ABOVE LISTED DOCUMETNS BY CHAIRMAN/MANAGER/SECRETARY AND PRINCIPAL. IN CASE, IT IS NOTICED AT LATER STAGE THAT UPLOADED DOCUMENTS ARE NOT GENUINE THEN SCHOOL SHALL BE LIABLE FOR ACTION AS PER NORMS.
        </div>

        <?php if (!empty($additionalDocs)): ?>
        <div class="cbse-sub-section-title">ADDITIONAL STATUTORY / RELEVANT DOCUMENTS:</div>
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
              <?php $adIndex = 0; foreach ($additionalDocs as $ad): $adIndex++; ?>
              <tr>
                <td class="col-sno"><?= $adIndex ?></td>
                <td><?= e(strtoupper($ad['title'])) ?></td>
                <td class="col-center">
                  <a class="cbse-link-btn" href="<?= e($ad['pdf']) ?>" target="_blank" rel="noopener">
                    <?= pdf_icon_svg() ?><span>VIEW DOCUMENT</span>
                  </a>
                </td>
              </tr>
              <?php endforeach; ?>
            </tbody>
          </table>
        </div>
        <?php endif; ?>

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
              <tr>
                <td class="col-sno">1</td>
                <td>FEE STRUCTURE OF THE SCHOOL</td>
                <td class="col-center">
                  <a class="cbse-link-btn" href="<?= e($academicPdfs[1]) ?>" target="_blank" rel="noopener">
                    <?= pdf_icon_svg() ?><span>VIEW DOCUMENT</span>
                  </a>
                </td>
              </tr>
              <tr>
                <td class="col-sno">2</td>
                <td>ANNUAL ACADEMIC CALANDER.</td>
                <td class="col-center">
                  <a class="cbse-link-btn" href="<?= e($academicPdfs[2]) ?>" target="_blank" rel="noopener">
                    <?= pdf_icon_svg() ?><span>VIEW DOCUMENT</span>
                  </a>
                </td>
              </tr>
              <tr>
                <td class="col-sno">3</td>
                <td>LIST OF SCHOOL MANAGEMENT COMMITTEE (SMC)</td>
                <td class="col-center">
                  <a class="cbse-link-btn" href="<?= e($academicPdfs[3]) ?>" target="_blank" rel="noopener">
                    <?= pdf_icon_svg() ?><span>VIEW DOCUMENT</span>
                  </a>
                </td>
              </tr>
              <tr>
                <td class="col-sno">4</td>
                <td>LIST OF PARENTS TEACHERS ASSOCIATION (PTA) MEMBERS</td>
                <td class="col-center">
                  <a class="cbse-link-btn" href="<?= e($academicPdfs[4]) ?>" target="_blank" rel="noopener">
                    <?= pdf_icon_svg() ?><span>VIEW DOCUMENT</span>
                  </a>
                </td>
              </tr>
              <tr>
                <td class="col-sno">5</td>
                <td>LAST THREE-YEAR RESULT OF THE BOARD EXAMINATION (AS PER APPLICABLILITY)</td>
                <td class="col-center" style="font-weight:700;">AS DETAILED BELOW</td>
              </tr>
            </tbody>
          </table>
        </div>

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
                  <a class="cbse-link-btn" href="<?= e($rx['pdf']) ?>" target="_blank" rel="noopener">
                    <?= pdf_icon_svg() ?><span>VIEW PDF</span>
                  </a>
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
                  <a class="cbse-link-btn" href="<?= e($rx['pdf']) ?>" target="_blank" rel="noopener">
                    <?= pdf_icon_svg() ?><span>VIEW PDF</span>
                  </a>
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
              <tr>
                <td class="col-sno">1.</td>
                <td class="col-info">PRINCIPAL</td>
                <td class="col-center"><?= e($principalCount) ?></td>
                <td><?= e(strtoupper($principal)) ?></td>
              </tr>
              <tr>
                <td class="col-sno">2.</td>
                <td class="col-info">VICE PRINCIPAL</td>
                <td class="col-center">0</td>
                <td>-</td>
              </tr>
              <tr>
                <td class="col-sno">3.</td>
                <td class="col-info">HEADMISTRESS/HEADMASTER</td>
                <td class="col-center">-</td>
                <td>-</td>
              </tr>
              <tr>
                <td class="col-sno">4.</td>
                <td class="col-info">TOTAL NO. OF TEACHERS</td>
                <td class="col-center"><?= e($totalTeachers) ?></td>
                <td>
                  <a href="backend/uploads/disclosure/b/9.pdf" target="_blank" rel="noopener" class="cbse-link-btn">
                    <?= pdf_icon_svg() ?><span>UPLOAD LIST/DETAILS</span>
                  </a>
                </td>
              </tr>
              <tr class="sub-level">
                <td></td>
                <td class="indent-sub">▪ PGT</td>
                <td class="col-center"><?= e($pgtCount) ?></td>
                <td>
                  <a href="backend/uploads/disclosure/b/9.pdf" target="_blank" rel="noopener" class="cbse-text-link">
                    NAME-DESIGNATION -QUALIFICATION (PROVIDE LINK)
                  </a>
                </td>
              </tr>
              <tr class="sub-level">
                <td></td>
                <td class="indent-sub">▪ TGT</td>
                <td class="col-center"><?= e($tgtCount) ?></td>
                <td>
                  <a href="backend/uploads/disclosure/b/9.pdf" target="_blank" rel="noopener" class="cbse-text-link">
                    NAME-DESIGNATION -QUALIFICATION (PROVIDE LINK)
                  </a>
                </td>
              </tr>
              <tr class="sub-level">
                <td></td>
                <td class="indent-sub">▪ PRT</td>
                <td class="col-center"><?= e($prtCount) ?></td>
                <td>
                  <a href="backend/uploads/disclosure/b/9.pdf" target="_blank" rel="noopener" class="cbse-text-link">
                    NAME-DESIGNATION -QUALIFICATION (PROVIDE LINK)
                  </a>
                </td>
              </tr>
              <tr>
                <td class="col-sno">5.</td>
                <td class="col-info">TEACHERS SECTION RATIO</td>
                <td class="col-center"><?= e($ratio) ?></td>
                <td>-</td>
              </tr>
              <tr>
                <td class="col-sno">6.</td>
                <td class="col-info">DETAILS OF SPECIAL EDUCATOR</td>
                <td class="col-center">1</td>
                <td><?= e(strtoupper($specialEducator)) ?></td>
              </tr>
              <tr>
                <td class="col-sno">7.</td>
                <td class="col-info">DETAILS OF COUNSELLOR &amp; WELLNESS TEACHER</td>
                <td class="col-center">1</td>
                <td><?= e(strtoupper($counsellor)) ?></td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- E: SCHOOL INFRASTRUCTURE -->
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
              <tr>
                <td class="col-sno">1.</td>
                <td class="col-info">TOTAL CAMPUS AREA OF THE SCHOOL (IN SQR MTR)</td>
                <td>10117 SQ MTR (2.5 ACRES)</td>
              </tr>
              <tr>
                <td class="col-sno">2.</td>
                <td class="col-info">NO. AND SIZE OF THE CLASSSROOM (IN SQR MTR)</td>
                <td>42 CLASSROOMS (55 SQ MTR EACH)</td>
              </tr>
              <tr>
                <td class="col-sno">3.</td>
                <td class="col-info">NO. AND SIZE OF LABORATORIES INCLUDING COMPUTER LABS (IN SQR MTR)</td>
                <td>5 LABORATORIES (PHYSICS, CHEMISTRY, BIOLOGY, COMPOSITE SCIENCE, COMPUTER LAB - 75 SQ MTR EACH)</td>
              </tr>
              <tr>
                <td class="col-sno">4.</td>
                <td class="col-info">NO. AND SIZE OF LIBRARY (IN SQR MTR)</td>
                <td>1 LIBRARY (120 SQ MTR)</td>
              </tr>
              <tr>
                <td class="col-sno">5.</td>
                <td class="col-info">INTERNET FACILITY (YES/NO)</td>
                <td>YES (HIGH-SPEED BROADBAND &amp; WI-FI ACROSS CAMPUS)</td>
              </tr>
              <tr>
                <td class="col-sno">6.</td>
                <td class="col-info">NO. OF GIRLS TOILETS</td>
                <td>16</td>
              </tr>
              <tr>
                <td class="col-sno">7.</td>
                <td class="col-info">NO. OF BOYS TOILETS</td>
                <td>16</td>
              </tr>
              <tr>
                <td class="col-sno">8.</td>
                <td class="col-info">NO. OF CWSN TOILETS</td>
                <td>2 (BARRIER-FREE TOILETS FOR CHILDREN WITH SPECIAL NEEDS)</td>
              </tr>
              <tr>
                <td class="col-sno">9.</td>
                <td class="col-info">LINK OF YOU TUBE VIDEO OF THE INSPECTION OF SCHOOL COVERING THE INFRASTRUCTURE OPF THE SCHOOL</td>
                <td>
                  <a href="https://www.youtube.com/@maxinternationalschool2041" target="_blank" rel="noopener" class="cbse-text-link">
                    PROVIDE LINK (WATCH VIDEO)
                  </a>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="cbse-doc-footer">
          <span>Max International School, Safidon Road, Assandh, Karnal (HR)</span>
          <span>CBSE Appendix-IX Mandatory Public Disclosure</span>
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
          </div>
        </div>
        <div>
          <h5>About Max</h5>
          <ul>
            <li><a href="about-us.html">About Max International</a></li>
            <li><a href="about-us.html#chairman">Chairman's Message</a></li>
            <li><a href="about-us.html#secretary">Secretary's Message</a></li>
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
            <li><a href="beyond-activities.html">Defense Wing – NDA Prep</a></li>
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
