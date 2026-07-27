window.cmsSupabase = (() => {
  const config = window.SUPABASE_CONFIG || {};
  if (!config.url || config.url.startsWith('YOUR_') || !config.publishableKey || config.publishableKey.startsWith('YOUR_')) return null;
  return window.supabase.createClient(config.url, config.publishableKey);
})();
