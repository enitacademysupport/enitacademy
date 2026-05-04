document.addEventListener("DOMContentLoaded", () => {

    console.log("JS CARGADO");

    const supabaseUrl = "https://ugjgpirjcmyjfsgspajd.supabase.co";
    const supabaseKey = "TU_ANON_PUBLIC_KEY_AQUI"; // ⚠️ reemplaza esto

    const { createClient } = supabase;
    const supabaseClient = createClient(supabaseUrl, supabaseKey);

    console.log("SUPABASE:", supabaseClient);

    const form = document.getElementById("formRegistro");

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        console.log("CLICK");

        const nombre = document.getElementById("nombre").value.trim();
        const apellido = document.getElementById("apellido").value.trim();
        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value.trim();
        const confirmPassword = document.getElementById("confirmPassword").value.trim();

        console.log("PASS:", password);
        console.log("CONFIRM:", confirmPassword);

        if (password !== confirmPassword) {
            alert("Las contraseñas no coinciden");
            return;
        }

        const { data, error } = await supabaseClient
            .from("usuarios")
            .insert([
                { nombre, apellido, email, password }
            ]);

        console.log("DATA:", data);
        console.log("ERROR:", error);

        if (error) {
            alert("Error: " + error.message);
        } else {
            alert("Registro exitoso");
            form.reset();
        }
    });

});
