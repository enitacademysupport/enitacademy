const supabaseUrl = "https://ugjgpirjcmyjfsgspajd.supabase.co";
const supabaseKey = "sb_publishable_ZtIzJy0I3EVeYTslg48MXQ_9QFdpahe";

const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

document.getElementById("formRegistro").addEventListener("submit", async (e) => {
    e.preventDefault();

    const nombre = document.getElementById("nombre").value;
    const apellido = document.getElementById("apellido").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    // 1. Crear usuario en Auth (seguro)
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
    });

    if (error) {
        alert(error.message);
        return;
    }

    // 2. Guardar datos extra en tu tabla
    const user = data.user;

    await supabase.from("usuarios").insert([
        {
            id: user.id,
            nombre,
            apellido,
            email
        }
    ]);

    alert("Registro exitoso. Revisa tu correo.");
});
