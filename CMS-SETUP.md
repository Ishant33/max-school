# Faculty CMS setup (Supabase)

1. Create a Supabase project, then open its SQL Editor and run `supabase/schema.sql`.
2. In Authentication > Providers > Email, disable public sign-ups. Create or invite faculty users from the Supabase dashboard.
3. In Settings > API, copy the project URL and publishable key into `assets/js/supabase-config.js`.
4. Start any local web server for this folder, then open `admin.html` and sign in with a faculty account.

The dashboard manages About Us, Academics, Admission, Career, and Gallery updates. Gallery items can use an image URL or upload a JPG, PNG, or WebP image up to 5 MB. Published items appear automatically on their relevant public page.
