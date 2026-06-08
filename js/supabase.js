/* ════════════════════════════════════════════
   ENIT Academy — supabase.js
   ════════════════════════════════════════════ */

// El cliente se inicializa desde window.supabase
// que se carga via script UMD en cada HTML
export const supabase = window.supabase.createClient(
  "https://koaocyzmgnbuleimrzyz.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtvYW9jeXptZ25idWxlaW1yenl6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkwMzcwMDAsImV4cCI6MjA5NDYxMzAwMH0.yX6k69eApkDGDN_bgJGgEEhT33EYR_Daxtg6P8ElTwM",
  {
    auth: {
      persistSession:     true,
      autoRefreshToken:   true,
      detectSessionInUrl: true,
    },
  }
);