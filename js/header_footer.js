/* ════════════════════════════════════════════
   ENIT Academy — header_footer.js
   ════════════════════════════════════════════ */
import { supabase } from "./supabase.js";

const RUTAS_PANEL = {
  docente:    "/paginas/panel_docente.html",
  estudiante: "/paginas/panel_estudiante.html",
};

// ── Carga componentes ─────────────────────────
function loadComponent(url, id, callback) {
  fetch(url)
    .then(r => r.text())
    .then(html => {
      const el = document.getElementById(id);
      if (!el) return;
      el.innerHTML = html;
      if (callback) setTimeout(callback, 0);
    })
    .catch(err => console.warn("loadComponent error:", url, err));
}

loadComponent("/paginas/header.html",      "header",         initHeader);
loadComponent("/paginas/footer.html",      "footer");
loadComponent("/paginas/modal_login.html", "modal-container", initLoginModal);

// ── Auth header ───────────────────────────────
function initHeader() {
  const authButtons  = document.getElementById("authButtons");
  const userBox      = document.getElementById("userBox");
  const userNameEl   = document.getElementById("userNameHeader");
  const userPhoto    = document.getElementById("userPhoto");
  const userRolEl    = document.getElementById("userRolHeader");
  const btnCerrarSes = document.getElementById("btnCerrarSesion");
  const userDropdown = document.getElementById("userDropdown");
  const btnMiPanel   = document.getElementById("btnMiPanel");

  if (!authButtons || !userBox) return;

  async function updateUI() {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;

    if (user) {
      const { data: perfil } = await supabase
        .from("perfiles").select("nombre,apellido,rol").eq("id", user.id).single();

      authButtons.style.display = "none";
      userBox.style.display     = "flex";

      const nombre = perfil?.nombre || user.user_metadata?.nombre || "Usuario";
      const rol    = perfil?.rol    || "";

      if (userNameEl) userNameEl.textContent = nombre;
      if (userRolEl)  userRolEl.textContent  = rol.charAt(0).toUpperCase() + rol.slice(1);
      if (userPhoto)  userPhoto.src = user.user_metadata?.avatar_url || "/imagenes/logo.png";
      if (btnMiPanel) btnMiPanel.dataset.href = RUTAS_PANEL[rol] || "/paginas/panel_estudiante.html";
    } else {
      authButtons.style.display = "flex";
      userBox.style.display     = "none";
    }
  }

  updateUI();
  supabase.auth.onAuthStateChange(() => updateUI());

  // Dropdown usuario
  userBox.addEventListener("click", e => {
    e.stopPropagation();
    userDropdown?.classList.toggle("visible");
  });
  document.addEventListener("click", () => userDropdown?.classList.remove("visible"));

  // Mi panel
  btnMiPanel?.addEventListener("click", () => {
    window.location.href = btnMiPanel.dataset.href;
  });

  // Cerrar sesión
  btnCerrarSes?.addEventListener("click", async () => {
    await supabase.auth.signOut();
    window.location.href = "/index.html";
  });

  // ── Menú hamburguesa ──────────────────────
  const toggle   = document.getElementById("menuToggle");
  const menu     = document.getElementById("menuPrincipal");
  const overlay  = document.getElementById("menuOverlay");
  const closeBtn = document.getElementById("menuClose");

  function openMenu() {
    menu?.classList.add("activo");
    overlay?.classList.add("visible");
    toggle?.classList.add("active");
    document.body.style.overflow = "hidden";
  }
  function closeMenu() {
    menu?.classList.remove("activo");
    overlay?.classList.remove("visible");
    toggle?.classList.remove("active");
    document.body.style.overflow = "";
    // Cerrar todos los dropdowns abiertos
    document.querySelectorAll(".dropdown.open, .submenu.open").forEach(el => el.classList.remove("open"));
  }

  toggle?.addEventListener("click", e => {
    e.stopPropagation();
    menu?.classList.contains("activo") ? closeMenu() : openMenu();
  });
  overlay?.addEventListener("click", closeMenu);
  closeBtn?.addEventListener("click", closeMenu);

  // Dropdowns en móvil: toggle al hacer clic
  document.querySelectorAll(".dropdown > .dropdown-toggle").forEach(btn => {
    btn.addEventListener("click", e => {
      if (window.innerWidth > 900) return;
      e.preventDefault();
      e.stopPropagation();
      const li = btn.closest(".dropdown");
      li.classList.toggle("open");
    });
  });

  document.querySelectorAll(".submenu > a").forEach(btn => {
    btn.addEventListener("click", e => {
      if (window.innerWidth > 900) return;
      e.preventDefault();
      e.stopPropagation();
      const li = btn.closest(".submenu");
      li.classList.toggle("open");
    });
  });

  // Cerrar al redimensionar
  window.addEventListener("resize", () => {
    if (window.innerWidth > 900) closeMenu();
  });
}

// ── Login modal (si existe en la página) ──────
function initLoginModal() {
  // El login.js maneja la apertura, esto solo se asegura de que esté listo
}
