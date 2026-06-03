import { supabase } from "./supabase.js";

document.addEventListener("DOMContentLoaded", async () => {

    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        window.location.href = "../index.html";
        return;
    }

    const user = session.user;

    const userName = document.getElementById("userName");

    if (userName) {
        userName.textContent =
            user.user_metadata?.nombre ||
            user.email;
    }

    // LOGOUT SOLO AQUÍ
    const logoutBtn = document.getElementById("logout");

    if (logoutBtn) {
        logoutBtn.addEventListener("click", async (e) => {
            e.preventDefault();

            await supabase.auth.signOut();

            window.location.href = "../index.html";
        });
    }
});