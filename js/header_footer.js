import { supabase } from "./supabase.js";

/* =========================
   LOAD COMPONENTS (FIXED)
========================= */

function loadComponent(url, id, callback) {

    fetch(url)
        .then(res => res.text())
        .then(html => {

            const el = document.getElementById(id);
            if (!el) return;

            el.innerHTML = html;

            // esperar DOM del componente
            setTimeout(() => {
                if (callback) callback();
            }, 0);

        })
        .catch(err => console.error("Error:", err));
}

/* =========================
   CARGA GLOBAL
========================= */

loadComponent("/paginas/header.html", "header", initAuth);
loadComponent("/paginas/footer.html", "footer");
loadComponent("/paginas/modal_login.html", "modal-container");

/* =========================
   AUTH HEADER GLOBAL
========================= */

function initAuth() {

    const authButtons = document.getElementById("authButtons");
    const userBox = document.getElementById("userBox");
    const userNameHeader = document.getElementById("userNameHeader");
    const userPhoto = document.getElementById("userPhoto");

    if (!authButtons || !userBox) return;

    async function updateUI() {

        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user;

        if (user) {

            authButtons.style.display = "none";
            userBox.style.display = "flex";

            userNameHeader.textContent =
                user.user_metadata?.nombre || "Usuario";

            userPhoto.src =
                user.user_metadata?.avatar_url || "./imagenes/default-user.png";

        } else {

            authButtons.style.display = "flex";
            userBox.style.display = "none";
        }
    }

    updateUI();

    supabase.auth.onAuthStateChange(() => {
        updateUI();
    });

    // ir al dashboard SOLO al hacer click
    userBox.addEventListener("click", () => {
        window.location.href = "/paginas/dashboard.html";
    });
}

/* =========================
   MENU MOBILE (igual que tuyo)
========================= */

document.addEventListener("click", function (e) {

    const menu = document.querySelector(".menu");

    if (e.target.closest("#menuToggle")) {
        menu?.classList.toggle("activo");
    }
});