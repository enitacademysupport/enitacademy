import { supabase } from "./supabase.js";

console.log("🔥 registro.js cargado");

window.addEventListener("DOMContentLoaded", () => {

    const form = document.getElementById("registerForm");

    console.log("FORM:", form);

    if (!form) {
        console.error("❌ No se encontró registerForm");
        return;
    }

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        console.log("📩 SUBMIT DETECTADO");

        const nombre = form.querySelector('input[name="nombre"]').value.trim();
        const apellido = form.querySelector('input[name="apellido"]').value.trim();
        const email = form.querySelector('input[name="email"]').value.trim();
        const password = form.querySelector('input[name="password"]').value;
        const confirmar = form.querySelector('input[name="confirmar"]').value;

        console.log({ nombre, apellido, email, password, confirmar });

        if (!nombre || !apellido || !email || !password || !confirmar) {
            alert("Completa todos los campos");
            return;
        }

        if (password !== confirmar) {
            alert("Las contraseñas no coinciden");
            return;
        }

        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { nombre, apellido }
            }
        });

        if (error) {
            console.error(error);
            alert(error.message);
            return;
        }

        alert("Registro exitoso");
        window.location.href = "../paginas/index.html";
    });

});