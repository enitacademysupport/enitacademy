import { supabase } from "./supabase.js";

const PANEL = {
  docente:    "/paginas/panel_docente.html",
  estudiante: "/paginas/panel_estudiante.html",
};

// ── Cargar componentes HTML ───────────────────
function cargarComponente(url, idContenedor, callback) {
  fetch(url)
    .then(r => r.text())
    .then(html => {
      const el = document.getElementById(idContenedor);
      if (!el) return;
      el.innerHTML = html;
      if (callback) setTimeout(callback, 0);
    })
    .catch(err => console.warn("Error cargando:", url, err));
}

cargarComponente("/paginas/header.html",      "header",          iniciarHeader);
cargarComponente("/paginas/footer.html",      "footer");
cargarComponente("/paginas/modal_login.html", "modal-container");

// ── Header: auth + menú ───────────────────────
function iniciarHeader() {
  const botonesAuth  = document.getElementById("botonesAuth");
  const cajaUsuario  = document.getElementById("cajaUsuario");
  const nombreUsuario = document.getElementById("nombreUsuario");
  const rolUsuario   = document.getElementById("rolUsuario");
  const fotoUsuario  = document.getElementById("fotoUsuario");
  const dropdown     = document.getElementById("menuUsuario");
  const btnMiPanel   = document.getElementById("btnMiPanel");
  const btnSalir     = document.getElementById("btnSalir");

  if (!botonesAuth || !cajaUsuario) return;

  // Actualizar UI según sesión
  async function actualizarUI() {
    const { data: { session } } = await supabase.auth.getSession();
    const usuario = session?.user;

    if (usuario) {
      const { data: perfil } = await supabase
        .from("perfiles")
        .select("nombre, apellido, rol")
        .eq("id", usuario.id)
        .single();

      botonesAuth.style.display = "none";
      cajaUsuario.style.display = "flex";

      const nombre = perfil?.nombre || "Usuario";
      const rol    = perfil?.rol    || "";

      if (nombreUsuario) nombreUsuario.textContent = nombre;
      if (rolUsuario)    rolUsuario.textContent = rol.charAt(0).toUpperCase() + rol.slice(1);
      if (fotoUsuario)   fotoUsuario.src = usuario.user_metadata?.avatar_url || "/imagenes/logo.png";
      if (btnMiPanel)    btnMiPanel.dataset.href = PANEL[rol] || PANEL.estudiante;

    } else {
      botonesAuth.style.display = "flex";
      cajaUsuario.style.display = "none";
    }
  }

  actualizarUI();

  // Escuchar cambios de sesión (NO redirigir automáticamente aquí)
  supabase.auth.onAuthStateChange((evento) => {
    // Solo actualizar la UI, nunca redirigir desde el header
    actualizarUI();
  });

  // Abrir/cerrar dropdown usuario
  cajaUsuario.addEventListener("click", e => {
    e.stopPropagation();
    dropdown?.classList.toggle("visible");
  });
  document.addEventListener("click", () => dropdown?.classList.remove("visible"));

  // Ir a mi panel
  btnMiPanel?.addEventListener("click", () => {
    window.location.href = btnMiPanel.dataset.href;
  });

  // Cerrar sesión → inicio
  btnSalir?.addEventListener("click", async () => {
    await supabase.auth.signOut();
    window.location.href = "/index.html";
  });

  // ── Menú hamburguesa ──────────────────────
  const botonMenu  = document.getElementById("botonMenu");
  const menuPpal   = document.getElementById("menuPrincipal");
  const fondoMenu  = document.getElementById("fondoMenu");
  const cerrarMenu = document.getElementById("cerrarMenu");

  const abrirMenu  = () => { menuPpal?.classList.add("activo"); fondoMenu?.classList.add("visible"); document.body.style.overflow = "hidden"; };
  const ocultarMenu = () => { menuPpal?.classList.remove("activo"); fondoMenu?.classList.remove("visible"); document.body.style.overflow = ""; };

  botonMenu?.addEventListener("click",  e => { e.stopPropagation(); menuPpal?.classList.contains("activo") ? ocultarMenu() : abrirMenu(); });
  fondoMenu?.addEventListener("click",  ocultarMenu);
  cerrarMenu?.addEventListener("click", ocultarMenu);
  window.addEventListener("resize",    () => { if (window.innerWidth > 900) ocultarMenu(); });

  // Dropdowns en móvil
  document.querySelectorAll(".tiene-submenu > a").forEach(link => {
    link.addEventListener("click", e => {
      if (window.innerWidth > 900) return;
      e.preventDefault();
      link.closest(".tiene-submenu").classList.toggle("abierto");
    });
  });
}