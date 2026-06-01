import { supabase } from "./supabase.js";

console.log("🔥 login.js cargado");

document.addEventListener("click", (e) => {

    const form = document.querySelector("#loginForm");

    if (!form) return;

    if (e.target.closest("#loginForm button[type='submit']")) {

        e.preventDefault();

        console.log("📩 CLICK EN INGRESAR");

        const email = form.querySelector('input[type="email"]').value.trim();
        const password = form.querySelector('input[type="password"]').value;

        console.log({ email, password });

        if (!email || !password) {
            alert("Completa todos los campos");
            return;
        }

        supabase.auth.signInWithPassword({
            email,
            password
        }).then(({ data, error }) => {

            console.log("RESPUESTA:", data, error);

            if (error) {
                alert(error.message);
                return;
            }

            alert("Bienvenido 👋");
            window.location.href = "../paginas/dashboard.html";

        });

    }

});

