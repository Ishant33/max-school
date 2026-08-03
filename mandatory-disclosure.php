<?php
$disclosure = require __DIR__ . '/cms/mandatory-disclosure-data.php';

function disclosure_table(array $rows): void {
    echo '<div class="disclosure-table-wrap"><table class="disclosure-table"><tbody>';
    foreach ($rows as [$label, $value]) {
        echo '<tr><th scope="row">' . htmlspecialchars($label) . '</th><td>' . htmlspecialchars($value) . '</td></tr>';
    }
    echo '</tbody></table></div>';
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="CBSE mandatory public disclosure for Max International School, Assandh.">
  <title>Mandatory Public Disclosure | Max International School</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
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
          <li>
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
              <a href="mandatory-disclosure.html">CBSE Mandatory Disclosure</a>
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
          <li>
            <a href="gallery.html">Gallery <span class="car">▾</span></a>
            <div class="dropdown">
              <a href="gallery.html#newsletter">E-Newsletter</a>
              <a href="gallery.html#events">Events &amp; Notifications</a>
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
          <li class="active"><a href="mandatory-disclosure.html">Mandatory Disclosure</a></li>
          <li><a href="career.html">Career</a></li>
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
      <span class="disclosure-updated">Academic session: <?= htmlspecialchars($disclosure['updated']) ?></span>
    </div>
  </section>

  <nav class="disclosure-nav" aria-label="Disclosure sections"><div class="container">
    <a href="#general">A. General</a><a href="#documents">B. Documents</a><a href="#academics">C. Academics</a><a href="#staff">D. Staff</a><a href="#infrastructure">E. Infrastructure</a>
  </div></nav>

  <main class="disclosure-main">
    <div class="container">
      <div class="disclosure-intro"><span class="eyebrow">Transparency</span><h2>Information for parents and visitors</h2><p>The following information is published in accordance with CBSE requirements. Records that require physical inspection are available at the school office during working hours.</p></div>

      <section class="disclosure-section" id="general"><div class="disclosure-heading"><b>A</b><div><h2>General Information</h2><p>Basic school and affiliation details.</p></div></div><?php disclosure_table($disclosure['general']); ?></section>

      <section class="disclosure-section" id="documents"><div class="disclosure-heading"><b>B</b><div><h2>Documents and Information</h2><p>Statutory certificates maintained by the school.</p></div></div><div class="document-grid">
      <?php foreach ($disclosure['documents'] as [$name, $description, $url]): ?>
        <article class="document-card"><span class="document-icon">PDF</span><h3><?= htmlspecialchars($name) ?></h3><p><?= htmlspecialchars($description) ?></p><?php if ($url): ?><a href="<?= htmlspecialchars($url) ?>" target="_blank" rel="noopener">View document</a><?php else: ?><span class="document-office">Available at school office</span><?php endif; ?></article>
      <?php endforeach; ?>
      </div></section>

      <section class="disclosure-section" id="academics"><div class="disclosure-heading"><b>C</b><div><h2>Results and Academics</h2><p>Academic and school information.</p></div></div><?php disclosure_table($disclosure['academics']); ?></section>

      <section class="disclosure-section" id="staff"><div class="disclosure-heading"><b>D</b><div><h2>Staff Details</h2><p>Information for the current academic session.</p></div></div><?php disclosure_table($disclosure['staff']); ?></section>

      <section class="disclosure-section" id="infrastructure"><div class="disclosure-heading"><b>E</b><div><h2>School Infrastructure</h2><p>Learning, wellbeing and activity facilities.</p></div></div><div class="infrastructure-list"><?php foreach ($disclosure['infrastructure'] as $item): ?><span><?= htmlspecialchars($item) ?></span><?php endforeach; ?></div></section>

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
            <li><a href="mandatory-disclosure.html">Mandatory Disclosure</a></li>
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
