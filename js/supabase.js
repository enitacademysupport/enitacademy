const supabaseClient = supabase.createClient(
    "https://ugjgpirjcmyjfsgspajd.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVnamdwaXJqY215amZzZ3NwYWpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc4NDI2MDAsImV4cCI6MjA5MzQxODYwMH0.OuERi9MUuFbxnC2Jvj_bjO4W90FbHagBKmvPSsd6Hm4"
);

window.supabaseClient = supabaseClient;
