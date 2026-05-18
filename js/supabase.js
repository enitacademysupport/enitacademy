import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabaseUrl = "https://koaocyzmgnbuleimrzyz.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtvYW9jeXptZ25idWxlaW1yenl6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkwMzcwMDAsImV4cCI6MjA5NDYxMzAwMH0.yX6k69eApkDGDN_bgJGgEEhT33EYR_Daxtg6P8ElTwM";

export const supabase = createClient(supabaseUrl, supabaseKey);