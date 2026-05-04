const supabaseUrl = "https://ugjgpirjcmyjfsgspajd.supabase.co";
const supabaseKey = "TU_ANON_KEY";

const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

document.getElementById("formRegistro").addEventListener("submit", async (e) => {
    e.preventDefault();

    const nombre = document.getElementById("nombre").value.trim();
    const apellido = document.getElementById("apellido").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    // 🧪 VALIDACIONES

    // 1. Campos vacíos
    if (!nombre || !apellido || !email || !password || !confirmPassword) {
        alert("Todos los campos son obligatorios");
        return;
    }

    // 2. Email válido
    const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailValido.test(email)) {
        alert("Ingresa un correo válido");
        return;
    }

    // 3. Contraseña mínima
    if (password.length < 8) {
        alert("La contraseña debe tener mínimo 8 caracteres");
        return;
    }

    // 4. Confirmación de contraseña
    if (password !== confirmPassword) {
        alert("Las contraseñas no coinciden");
        return;
    }

    // 🔐 REGISTRO SEGURO
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

    // 🗄️ Guardar datos extra
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
        alert("Registro exitoso 🎉");
    }
});
