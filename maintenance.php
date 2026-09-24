<?php
// Maintenance Mode Gate for Max International School
// Password: school1234

$ACCESS_PASS = 'school1234';
$COOKIE_NAME = 'mis_access';
$COOKIE_VAL  = 'authorized';
$error = '';

// Re-lock / clear authorization
if (isset($_GET['lock'])) {
    setcookie($COOKIE_NAME, '', time() - 3600, '/');
    header('Location: maintenance.php');
    exit;
}

// Handle POST password submission via standard PHP
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $submitted = trim((string)($_POST['password'] ?? ''));
    if ($submitted === $ACCESS_PASS) {
        setcookie($COOKIE_NAME, $COOKIE_VAL, time() + (86400 * 30), '/');
        header('Location: index.html');
        exit;
    } else {
        $error = 'Incorrect password. Please try again.';
    }
}

$isAuthorized = (isset($_COOKIE[$COOKIE_NAME]) && $_COOKIE[$COOKIE_NAME] === $COOKIE_VAL);
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Under Maintenance | Max International School, Assandh</title>
  <meta name="robots" content="noindex, nofollow">
  <link rel="icon" type="image/png" href="assets/img/logo.png">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --gc-navy: #0973bb;
      --gc-navy-dark: #052a4a;
      --gc-heading: #073860;
      --gc-orange: #f1791e;
      --gc-orange-hover: #d96611;
      --gc-surface: #f8fafc;
      --gc-card-bg: #ffffff;
      --gc-text-main: #1e293b;
      --gc-text-muted: #64748b;
      --radius: 16px;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
      background: radial-gradient(circle at 10% 20%, #073860 0%, #052a4a 60%, #03172b 100%);
      color: #ffffff;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      padding: 24px 16px;
      position: relative;
      overflow-x: hidden;
    }

    body::before {
      content: '';
      position: absolute;
      width: 480px;
      height: 480px;
      background: radial-gradient(circle, rgba(241, 121, 30, 0.18) 0%, rgba(241, 121, 30, 0) 70%);
      top: -100px;
      right: -100px;
      border-radius: 50%;
      pointer-events: none;
    }

    body::after {
      content: '';
      position: absolute;
      width: 550px;
      height: 550px;
      background: radial-gradient(circle, rgba(9, 115, 187, 0.22) 0%, rgba(9, 115, 187, 0) 70%);
      bottom: -150px;
      left: -150px;
      border-radius: 50%;
      pointer-events: none;
    }

    .main-wrap {
      width: 100%;
      max-width: 620px;
      background: rgba(255, 255, 255, 0.05);
      backdrop-filter: blur(18px);
      -webkit-backdrop-filter: blur(18px);
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 24px;
      padding: 44px 36px;
      text-align: center;
      position: relative;
      z-index: 10;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
    }

    .school-logo {
      height: 72px;
      width: auto;
      margin-bottom: 20px;
      filter: drop-shadow(0 6px 12px rgba(0,0,0,0.3));
    }

    .badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: rgba(241, 121, 30, 0.18);
      border: 1px solid rgba(241, 121, 30, 0.4);
      color: #ffaa66;
      font-size: 13px;
      font-weight: 700;
      padding: 6px 16px;
      border-radius: 999px;
      margin-bottom: 22px;
      letter-spacing: 0.4px;
      text-transform: uppercase;
    }

    .badge-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--gc-orange);
      box-shadow: 0 0 10px var(--gc-orange);
      animation: pulse 1.8s infinite;
    }

    @keyframes pulse {
      0% { transform: scale(0.9); opacity: 0.8; }
      50% { transform: scale(1.3); opacity: 1; }
      100% { transform: scale(0.9); opacity: 0.8; }
    }

    h1 {
      font-family: 'Outfit', sans-serif;
      font-size: 32px;
      font-weight: 800;
      line-height: 1.25;
      margin-bottom: 14px;
      letter-spacing: -0.5px;
    }

    h1 span {
      color: var(--gc-orange);
    }

    p.lead-msg {
      font-size: 15.5px;
      line-height: 1.65;
      color: #cbd5e1;
      margin-bottom: 30px;
    }

    .contact-box {
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 16px;
      padding: 20px;
      margin-bottom: 32px;
      text-align: left;
    }

    .contact-box-title {
      font-size: 13.5px;
      font-weight: 700;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 14px;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .contact-links {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
    }

    .contact-chip {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.15);
      color: #ffffff;
      text-decoration: none;
      font-size: 13.5px;
      font-weight: 600;
      padding: 8px 16px;
      border-radius: 10px;
      transition: all 0.2s ease;
    }

    .contact-chip:hover {
      background: var(--gc-navy);
      border-color: var(--gc-navy);
      transform: translateY(-2px);
    }

    .contact-chip.wp:hover {
      background: #25D366;
      border-color: #25D366;
    }

    .password-card {
      background: rgba(9, 115, 187, 0.12);
      border: 1px solid rgba(9, 115, 187, 0.35);
      border-radius: 18px;
      padding: 24px;
      text-align: left;
    }

    .password-header {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 14px;
    }

    .password-header h3 {
      font-family: 'Outfit', sans-serif;
      font-size: 17px;
      font-weight: 700;
      color: #ffffff;
    }

    .password-header p {
      font-size: 13px;
      color: #94a3b8;
    }

    .form-row {
      display: flex;
      gap: 10px;
      margin-top: 12px;
    }

    .pwd-input-wrap {
      position: relative;
      flex: 1;
    }

    .pwd-input {
      width: 100%;
      background: rgba(5, 42, 74, 0.8);
      border: 1.5px solid rgba(255, 255, 255, 0.2);
      border-radius: 12px;
      padding: 12px 42px 12px 16px;
      font-size: 15px;
      color: #ffffff;
      outline: none;
      transition: border-color 0.2s;
    }

    .pwd-input:focus {
      border-color: var(--gc-orange);
      box-shadow: 0 0 0 3px rgba(241, 121, 30, 0.25);
    }

    .toggle-pwd-btn {
      position: absolute;
      right: 12px;
      top: 50%;
      transform: translateY(-50%);
      background: transparent;
      border: none;
      color: #94a3b8;
      cursor: pointer;
      font-size: 16px;
      padding: 4px;
    }

    .submit-btn {
      background: var(--gc-orange);
      color: #ffffff;
      border: none;
      border-radius: 12px;
      font-size: 15px;
      font-weight: 700;
      padding: 12px 24px;
      cursor: pointer;
      white-space: nowrap;
      transition: all 0.2s ease;
      box-shadow: 0 4px 14px rgba(241, 121, 30, 0.35);
    }

    .submit-btn:hover {
      background: var(--gc-orange-hover);
      transform: translateY(-1px);
    }

    .status-msg {
      margin-top: 12px;
      font-size: 13.5px;
      font-weight: 600;
      padding: 10px 14px;
      border-radius: 8px;
      display: none;
    }

    .status-msg.error {
      display: block;
      background: rgba(239, 68, 68, 0.2);
      color: #fca5a5;
      border: 1px solid rgba(239, 68, 68, 0.4);
    }

    .status-msg.success {
      display: block;
      background: rgba(34, 197, 94, 0.2);
      color: #86efac;
      border: 1px solid rgba(34, 197, 94, 0.4);
    }

    .footer-note {
      margin-top: 24px;
      font-size: 12.5px;
      color: #64748b;
    }

    .authorized-banner {
      display: <?php echo $isAuthorized ? 'block' : 'none'; ?>;
      margin-top: 14px;
      padding: 12px;
      background: rgba(34, 197, 94, 0.15);
      border: 1px solid rgba(34, 197, 94, 0.3);
      border-radius: 10px;
      font-size: 13.5px;
    }

    .authorized-banner a {
      color: #86efac;
      font-weight: 700;
      text-decoration: underline;
      margin-left: 8px;
    }

    .relock-link {
      display: inline-block;
      margin-top: 8px;
      color: #f87171;
      font-size: 12px;
      cursor: pointer;
      text-decoration: underline;
    }

    @media (max-width: 580px) {
      .main-wrap {
        padding: 32px 20px;
      }
      h1 {
        font-size: 26px;
      }
      .form-row {
        flex-direction: column;
      }
      .submit-btn {
        width: 100%;
      }
      .contact-links {
        flex-direction: column;
      }
    }
  </style>
</head>
<body>

  <div class="main-wrap">
    <img src="assets/img/logo.png" alt="Max International School Logo" class="school-logo">

    <div class="badge">
      <span class="badge-dot"></span>
      Scheduled Maintenance &amp; Upgrades
    </div>

    <h1>We'll Be Back <span>Shortly.</span></h1>
    <p class="lead-msg">
      The Max International School website is currently undergoing scheduled updates to enhance our academic and admissions experience. We appreciate your patience!
    </p>

    <!-- Urgent contact options for parents -->
    <div class="contact-box">
      <div class="contact-box-title">
        <span>📞</span> Admissions &amp; Office Help Desk
      </div>
      <div class="contact-links">
        <a href="tel:+919050294300" class="contact-chip">
          <span>📞</span> 9050294300
        </a>
        <a href="tel:+919050248300" class="contact-chip">
          <span>📞</span> 9050248300
        </a>
        <a href="https://wa.me/919050294300" target="_blank" rel="noopener noreferrer" class="contact-chip wp">
          <span>💬</span> WhatsApp Office
        </a>
        <a href="mailto:principal@maxinternationalschool.com" class="contact-chip">
          <span>✉️</span> Email Principal
        </a>
      </div>
    </div>

    <!-- Authorized Preview Gate -->
    <div class="password-card">
      <div class="password-header">
        <span style="font-size: 24px;">🔒</span>
        <div>
          <h3>Staff &amp; Authorized Preview</h3>
          <p>Have an access password? Enter below to view the website.</p>
        </div>
      </div>

      <form id="accessForm" method="POST" action="maintenance.php">
        <div class="form-row">
          <div class="pwd-input-wrap">
            <input 
              type="password" 
              id="accessPassword" 
              name="password"
              class="pwd-input" 
              placeholder="Enter password" 
              autocomplete="current-password" 
              required
            >
            <button type="button" id="togglePwd" class="toggle-pwd-btn" aria-label="Toggle password visibility">👁️</button>
          </div>
          <button type="submit" class="submit-btn" id="submitBtn">Enter Website →</button>
        </div>
      </form>

      <?php if (!empty($error)): ?>
        <div class="status-msg error" style="display:block;"><?php echo htmlspecialchars($error); ?></div>
      <?php endif; ?>

      <div id="statusMsg" class="status-msg"></div>

      <div id="authorizedBanner" class="authorized-banner">
        <span>✓ You already have authorized access.</span>
        <a href="index.html">Go to Website →</a>
        <br>
        <a href="maintenance.php?lock=1" class="relock-link">Lock site again (remove access)</a>
      </div>
    </div>

    <div class="footer-note">
      Max International School, Safidon Road, Assandh (Karnal) · CBSE Affiliated
    </div>
  </div>

  <script>
    (function() {
      var ACCESS_PASS = 'school1234';
      var COOKIE_NAME = 'mis_access';
      var form = document.getElementById('accessForm');
      var pwdInput = document.getElementById('accessPassword');
      var toggleBtn = document.getElementById('togglePwd');
      var statusMsg = document.getElementById('statusMsg');
      var authorizedBanner = document.getElementById('authorizedBanner');

      function isAuthorized() {
        var hasCookie = document.cookie.indexOf(COOKIE_NAME + '=authorized') !== -1;
        var hasStorage = localStorage.getItem(COOKIE_NAME) === 'authorized';
        return hasCookie || hasStorage;
      }

      function showStatus(text, type) {
        statusMsg.className = 'status-msg ' + type;
        statusMsg.textContent = text;
        statusMsg.style.display = 'block';
      }

      if (isAuthorized()) {
        authorizedBanner.style.display = 'block';
      }

      toggleBtn.addEventListener('click', function() {
        var isPwd = pwdInput.type === 'password';
        pwdInput.type = isPwd ? 'text' : 'password';
        toggleBtn.textContent = isPwd ? '🙈' : '👁️';
      });

      form.addEventListener('submit', function(e) {
        var val = pwdInput.value.trim();

        if (val === ACCESS_PASS) {
          // Set cookie client-side as well
          var expires = new Date();
          expires.setTime(expires.getTime() + (30 * 24 * 60 * 60 * 1000));
          document.cookie = COOKIE_NAME + '=authorized; expires=' + expires.toUTCString() + '; path=/; SameSite=Lax';
          localStorage.setItem(COOKIE_NAME, 'authorized');

          showStatus('✅ Access Granted! Redirecting to website...', 'success');
          // Allow normal POST or redirect directly
          setTimeout(function() {
            window.location.href = 'index.html';
          }, 500);
        } else {
          e.preventDefault();
          showStatus('❌ Incorrect password. Please try again.', 'error');
          pwdInput.select();
        }
      });
    })();
  </script>
</body>
</html>
