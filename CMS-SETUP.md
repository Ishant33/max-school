# Faculty CMS setup (PHP file-backed)

1. Configure administrator credentials in `backend/config.php` (change `admin_email` and `admin_password`).
2. Start a local PHP-capable web server from the project root, e.g.:

```bash
php -S localhost:8000
```

3. Open `admin.html` in the browser. Sign in using the credentials from `backend/config.php`.
4. The CMS stores content in `backend/cms_storage.json` and uploaded images in `backend/uploads/cms/`.

Notes:
- Public pages fetch published content from `backend/cms_list.php?module=...`.
- Form submissions are handled by `backend/form_submit.php` (saves to `backend/contacts.csv` and sends notification emails).

