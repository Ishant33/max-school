<?php
// Administrator credentials and site settings.
//
// The password is stored as a bcrypt hash in 'admin_password_hash'.
// On first login after upgrading, if the hash is empty the plaintext
// 'admin_password' below is used once, then automatically replaced with
// a hash and the plaintext is cleared. Change your password from the
// CMS dashboard (Change Password) rather than editing this file.

return [
    'admin_email' => 'admin@maxinternationalschool.com',
    'admin_password_hash' => '',
    // Legacy plaintext — used only for the one-time migration above.
    'admin_password' => 'changeme',
    // Public emails to receive enquiry notifications
    'notify_emails' => "info@maxinternationalschool.com,principal@maxinternationalschool.com,ishantc33@gmail.com",
];
