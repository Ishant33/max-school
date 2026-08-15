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

/* Numbered three-column table, matching the layout the static page used.
   Rows are numbered by position so reordering renumbers automatically; a row
   may override that with an explicit 'sno' (CBSE uses 11.1 in section B). */
function disclosure_numbered_table(array $rows, string $colHead, string $valHead, bool $asPdf): void {
    if (!$rows) {
        echo '<p class="disclosure-empty">Details available at the school office.</p>';
        return;
    }
    echo '<div class="disclosure-table-wrap"><table class="disclosure-table document-table"><thead><tr>'
       . '<th>S. No.</th><th>' . e($colHead) . '</th><th>' . e($valHead) . '</th>'
       . '</tr></thead><tbody>';
    $n = 0;
    foreach ($rows as $row) {
        $n++;
        $sno   = ($row['sno'] ?? '') !== '' ? $row['sno'] : (string) $n;
        $name  = $row['title'] ?? $row['label'] ?? '';
        $value = $row['description'] ?? $row['value'] ?? '';
        $pdf   = $row['pdf_url'] ?? '';
        echo '<tr><td>' . e($sno) . '</td><td>' . e($name) . '</td><td>';
        if ($asPdf) {
            echo $pdf !== ''
                ? '<a class="document-action" href="' . e($pdf) . '" target="_blank" rel="noopener">View PDF</a>'
                : '<span class="document-office">At school office</span>';
        } else {
            echo e($value);
        }
        echo '</td></tr>';
    }
    echo '</tbody></table></div>';
}

// Renders a label/value table; adds a PDF link column only if any row has one.
function disclosure_table(array $rows): void {
    if (!$rows) {
        echo '<p class="disclosure-empty">Details available at the school office.</p>';
        return;
    }
    echo '<div class="disclosure-table-wrap"><table class="disclosure-table"><tbody>';
    foreach ($rows as $row) {
        $label = $row['label'] ?? '';
        $value = $row['value'] ?? '';
        $pdf   = $row['pdf_url'] ?? '';
        echo '<tr><th scope="row">' . e($label) . '</th><td>' . e($value);
        if ($pdf !== '') {
            echo ' <a class="disclosure-pdf" href="' . e($pdf) . '" target="_blank" rel="noopener">View PDF</a>';
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
              <a href="academics.html#planner">Yearly Planner</a>
              <a href="academics.html#curriculum">Curriculum</a>
              <a href="academics.html#pedagogy">Pedagogy</a>
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
          <li><a href="admission.html#promax">Pro Max</a></li>
          <li>
            <a href="admission.html">Admission <span class="car">▾</span></a>
            <div class="dropdown">
              <a href="admission.html#requisites">Requisites &amp; Procedure</a>
              <a href="admission.html#fees">Fee Structure</a>
              <a href="admission.html#apply">Apply Now</a>
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

  <section class="disclosure-hero">
    <div class="container">
      <span class="eyebrow">CBSE Compliance</span>
      <h1>Mandatory Public Disclosure</h1>
      <p>Statutory information and records for Max International School, Assandh.</p>
      <?php if ($disclosure['updated'] !== ''): ?><span class="disclosure-updated">Academic session: <?= e($disclosure['updated']) ?></span><?php endif; ?>
    </div>
  </section>

  <nav class="disclosure-nav" aria-label="Disclosure sections"><div class="container">
    <a href="#general">A. General</a><a href="#documents">B. Documents</a><a href="#academics">C. Academics</a><a href="#staff">D. Staff</a><a href="#infrastructure">E. Infrastructure</a>
  </div></nav>

  <main class="disclosure-main">
    <div class="container">
      <div class="disclosure-intro"><span class="eyebrow">Transparency</span><h2>Information for parents and visitors</h2><p>The following information is published in accordance with CBSE requirements. Records that require physical inspection are available at the school office during working hours.</p></div>

      <section class="disclosure-section" id="general"><div class="disclosure-heading"><b>A</b><div><h2>General Information</h2><p>Basic school and affiliation details.</p></div></div><?php disclosure_table($disclosure['general']); ?></section>

      <section class="disclosure-section" id="documents"><div class="disclosure-heading"><b>B</b><div><h2>Documents and Information</h2><p>Statutory certificates maintained by the school.</p></div></div><?php disclosure_numbered_table($disclosure['documents'], 'Documents / Information', 'Upload Documents', true); ?></section>

      <section class="disclosure-section" id="academics"><div class="disclosure-heading"><b>C</b><div><h2>Result and Academics</h2><p>Academic records and school committees.</p></div></div><?php disclosure_numbered_table($disclosure['academics'], 'Documents / Information', 'Upload Documents', true); ?></section>

      <section class="disclosure-section" id="staff"><div class="disclosure-heading"><b>D</b><div><h2>Staff and Teaching</h2><p>Teaching and student-support details.</p></div></div><?php disclosure_numbered_table($disclosure['staff'], 'Information', 'Details', false); ?></section>

      <section class="disclosure-section" id="infrastructure"><div class="disclosure-heading"><b>E</b><div><h2>School Infrastructure</h2><p>Learning, wellbeing and activity facilities.</p></div></div><div class="infrastructure-list"><?php foreach ($disclosure['infrastructure'] as $item): ?><span><?= e($item) ?></span><?php endforeach; ?></div></section>

      <aside class="disclosure-help"><strong>Need assistance?</strong><span>For inspection of records or clarification, please contact the school office during working hours.</span><a class="btn btn-navy" href="contact-us.html">Contact the school</a></aside>
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
            <li><a href="admission.html#promax">Pro-Max Competitive Classes</a></li>
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
