import { supabase } from "./supabase.js";

document.getElementById("formNuevaPassword")
.addEventListener("submit", async (e) => {

    e.preventDefault();

    const password = document.getElementById("password").value;

    const { error } = await supabase.auth.updateUser({
        password
    });

    if (error) {
        alert(error.message);
        return;
    }

    alert("Contraseña actualizada");
    window.location.href = "login.html";
});
