document.addEventListener("DOMContentLoaded", () => {

    const supabaseUrl = "https://ugjgpirjcmyjfsgspajd.supabase.co";
    const supabaseKey = "sb_publishable_ZtIzJy0I3EVeYTslg48MXQ_9QFdpahe"; // ⚠️ pon tu key correcta

    const { createClient } = supabase;
    const supabaseClient = createClient(supabaseUrl, supabaseKey);

    const form = document.getElementById("formRegistro");

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const nombre = document.getElementById("nombre").value;
        const apellido = document.getElementById("apellido").value;
        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;
        const confirmPassword = document.getElementById("confirmPassword").value;

        // 🔍 DEBUG (puedes quitar luego)
        console.log("PASS:", password);
        console.log("CONFIRM:", confirmPassword);

        // ✅ Validación correcta
        if (password.trim() !== confirmPassword.trim()) {
            alert("Las contraseñas no coinciden");
            return;
        }

        // 🚀 Insertar en Supabase
        const { data, error } = await supabaseClient
            .from("usuarios")
            .insert([
                {
                    nombre: nombre.trim(),
                    apellido: apellido.trim(),
                    email: email.trim(),
                    password: password.trim()
                }
            ]);

        console.log("DATA:", data);
        console.log("ERROR:", error);

        if (error) {
    console.error("ERROR COMPLETO:", error);
    alert("Error: " + error.message);
} else {
    alert("Registro exitoso");
}
    });

});
