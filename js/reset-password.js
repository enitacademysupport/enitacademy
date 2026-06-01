import { supabase } from "./supabase.js";

const form = document.getElementById("formNuevaPassword");

form.addEventListener("submit", async (e) => {

    e.preventDefault();

    const password = document.getElementById("password").value;

    const { error } = await supabase.auth.updateUser({
        password
    });

    if (error) {
        alert(error.message);
        return;
    }

    alert("Contraseña actualizada correctamente");

    window.location.href = "../index.html";
});
