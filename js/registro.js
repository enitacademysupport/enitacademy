const supabaseUrl = "https://ugjgpirjcmyjfsgspajd.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVnamdwaXJqY215amZzZ3NwYWpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc4NDI2MDAsImV4cCI6MjA5MzQxODYwMH0.OuERi9MUuFbxnC2Jvj_bjO4W90FbHagBKmvPSsd6Hm4"; 

const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

document.getElementById("formRegistro").addEventListener("submit", async (e) => {
    e.preventDefault();

    // ✅ obtener datos del formulario
    const nombre = document.getElementById("nombre").value;
    const apellido = document.getElementById("apellido").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    // 1. registro seguro
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
    });

    if (error) {
        alert(error.message);
        return;
    }

    if (!data.user) {
        alert("Revisa tu correo para confirmar la cuenta");
        return;
    }

    const user = data.user;

    // 2. guardar datos extra
    const { error: errorDB } = await supabase.from("usuarios").insert([
        {
            id: user.id,
            nombre,
            apellido,
            email
        }
    ]);

    if (errorDB) {
        alert("Error al guardar en BD: " + errorDB.message);
    } else {
        alert("Registro exitoso");
    }
});
