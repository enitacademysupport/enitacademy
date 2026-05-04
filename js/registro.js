const supabaseUrl = "TU_URL";
const supabaseKey = "TU_ANON_KEY";

const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

const form = document.getElementById("formRegistro");

form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const nombre = document.getElementById("nombre").value;
    const apellido = document.getElementById("apellido").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    if (password !== confirmPassword) {
        alert("Las contraseñas no coinciden");
        return;
    }

    // Guardar en Supabase
    const { data, error } = await supabase
        .from("usuarios")
        .insert([
            { nombre, apellido, email, password }
        ]);

    if (error) {
        console.error(error);
        alert("Error al registrar");
    } else {
        alert("Registro exitoso");
        form.reset();
    }
});
