const supabaseUrl = "https://ugjgpirjcmyjfsgspajd.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVnamdwaXJqY215amZzZ3NwYWpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc4NDI2MDAsImV4cCI6MjA5MzQxODYwMH0.OuERi9MUuFbxnC2Jvj_bjO4W90FbHagBKmvPSsd6Hm4";

const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

document.addEventListener("DOMContentLoaded", () => {
    console.log("registro.js OK");

    const form = document.getElementById("formRegistro");

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        console.log("submit funcionando");

        const nombre = document.getElementById("nombre").value.trim();
        const apellido = document.getElementById("apellido").value.trim();
        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;
        const confirmPassword = document.getElementById("confirmPassword").value;

        if (!nombre || !apellido || !email || !password || !confirmPassword) {
            alert("Todos los campos son obligatorios");
            return;
        }

        const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailValido.test(email)) {
            alert("Correo inválido");
            return;
        }

        if (password.length < 8) {
            alert("Mínimo 8 caracteres");
            return;
        }

        if (password !== confirmPassword) {
            alert("Las contraseñas no coinciden");
            return;
        }

        const { data, error } = await supabase.auth.signUp({
            email,
            password,
        });

        console.log("auth:", data, error);

        if (error) {
            alert(error.message);
            return;
        }

        if (!data.user) {
            alert("Revisa tu correo para confirmar la cuenta");
            return;
        }

        const { error: errorDB } = await supabase.from("usuarios").insert([
            {
                id: data.user.id,
                nombre,
                apellido,
                email
            }
        ]);

        console.log("db:", errorDB);

        if (errorDB) {
            alert("Error BD: " + errorDB.message);
        } else {
            alert("Registro exitoso 🎉");
        }
    });
});
