/* ════════════════════════════════════════════
   ENIT Academy — registro.js
   ════════════════════════════════════════════ */
import { supabase } from "./supabase.js";


const RUTAS = {
  docente:    "/paginas/panel_docente.html",
  estudiante: "/paginas/panel_estudiante.html",
};

const ROL_ICONOS = {
  estudiante: "fa-user-graduate",
  docente:    "fa-chalkboard-teacher",
};

let rolActual = null;

// ── Selección de rol ──────────────────────────
window.elegirRol = function (card) {
  document.querySelectorAll(".rol-card").forEach(c => c.classList.remove("seleccionado"));
  card.classList.add("seleccionado");
  rolActual = card.dataset.rol;
  document.getElementById("btnContinuar").disabled = false;
};

window.mostrarFormulario = function () {
  if (!rolActual) return;
  const texto = rolActual.charAt(0).toUpperCase() + rolActual.slice(1);
  document.getElementById("badgeTexto").textContent = texto;
  document.getElementById("badgeIcono").className   = "fa-solid " + ROL_ICONOS[rolActual];
  document.getElementById("rolSeleccionado").value  = rolActual;
  document.getElementById("stepRol").classList.add("step-oculto");
  document.getElementById("stepForm").classList.remove("step-oculto");
};

window.volverARol = function () {
  document.getElementById("stepForm").classList.add("step-oculto");
  document.getElementById("stepRol").classList.remove("step-oculto");
};

// ── Toggle password ───────────────────────────
function initTogglePassword() {
  document.querySelectorAll(".toggle-pw").forEach(btn => {
    btn.addEventListener("click", () => {
      const input = btn.closest(".input-wrapper").querySelector("input");
      const icon  = btn.querySelector("i");
      const show  = input.type === "password";
      input.type     = show ? "text" : "password";
      icon.className = show ? "fa-regular fa-eye-slash" : "fa-regular fa-eye";
    });
  });
}

// ── Errores de campo ──────────────────────────
function setError(name, msg) {
  const input = document.querySelector(`[name="${name}"]`);
  const small = input?.closest(".grupo-input")?.querySelector(".error");
  if (small) small.textContent = msg;
  input?.addEventListener("input", () => { if (small) small.textContent = ""; }, { once: true });
}

function clearErrors() {
  document.querySelectorAll(".grupo-input .error").forEach(el => { el.textContent = ""; });
}

function setAlerta(tipo, msg) {
  const el = document.getElementById("formAlerta");
  if (!el) return;
  el.className = `form-alerta visible alerta-${tipo}`;
  el.innerHTML = `<i class="fa-solid ${tipo === "ok" ? "fa-circle-check" : "fa-circle-exclamation"}"></i><span>${msg}</span>`;
}

function clearAlerta() {
  const el = document.getElementById("formAlerta");
  if (el) { el.className = "form-alerta"; el.innerHTML = ""; }
}

// ── Submit ────────────────────────────────────
window.addEventListener("DOMContentLoaded", () => {
  initTogglePassword();

  const form = document.getElementById("registerForm");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearErrors();
    clearAlerta();

    const rol       = document.getElementById("rolSeleccionado").value.trim();
    const nombre    = form.querySelector('[name="nombre"]').value.trim();
    const apellido  = form.querySelector('[name="apellido"]').value.trim();
    const email     = form.querySelector('[name="email"]').value.trim();
    const password  = form.querySelector('[name="password"]').value;
    const confirmar = form.querySelector('[name="confirmar"]').value;

    // Validaciones
    if (!rol) { setAlerta("error", "Elige tu rol antes de continuar."); return; }

    let ok = true;
    if (!nombre)   { setError("nombre",   "El nombre es obligatorio.");   ok = false; }
    if (!apellido) { setError("apellido", "El apellido es obligatorio."); ok = false; }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("email", "Ingresa un correo válido."); ok = false;
    }
    if (!password || password.length < 6) {
      setError("password", "Mínimo 6 caracteres."); ok = false;
    }
    if (!confirmar || password !== confirmar) {
      setError("confirmar", "Las contraseñas no coinciden."); ok = false;
    }
    if (!ok) return;

    const btn = document.getElementById("btnRegister");
    btn.disabled    = true;
    btn.textContent = "Registrando...";

    try {
      // 1. Crear usuario en Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { nombre, apellido, rol } },
      });

      if (authError) {
        btn.disabled    = false;
        btn.textContent = "Registrarme";
        setAlerta("error", tradError(authError.message));
        return;
      }

      const userId = authData.user?.id;
      if (!userId) {
        btn.disabled    = false;
        btn.textContent = "Registrarme";
        setAlerta("error", "No se pudo obtener el ID del usuario. Intenta de nuevo.");
        return;
      }

      // 2. Crear perfil en la tabla perfiles
      //    (necesario porque el panel lo busca ahí para saber el rol)
      const { error: perfilError } = await supabase
        .from("perfiles")
        .upsert({
          id:       userId,
          nombre,
          apellido,
          rol,
          email,
        }, { onConflict: "id" });

      if (perfilError) {
        // Si falla el perfil, igual dejamos pasar (el trigger de Supabase pudo haberlo creado)
        console.warn("Perfil upsert error (puede ser normal si hay trigger):", perfilError.message);
      }

      // 3. Iniciar sesión inmediatamente para no pedir verificación
      //    (Solo si Supabase no requiere confirmación de email)
      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      btn.disabled    = false;
      btn.textContent = "Registrarme";

      if (loginError) {
        // Registro ok pero no pudo logear (ej: requiere confirmar email)
        setAlerta("ok", "¡Registro exitoso! Revisa tu correo para confirmar tu cuenta.");
        return;
      }

      // 4. Verificar que el perfil existe (si hay trigger puede haberse creado ahora)
      const { data: perfilCheck } = await supabase
        .from("perfiles")
        .select("id, rol")
        .eq("id", loginData.session.user.id)
        .single();

      // Si aún no existe el perfil (raro), crearlo de nuevo
      if (!perfilCheck) {
        await supabase.from("perfiles").upsert({
          id: userId, nombre, apellido, rol, email,
        }, { onConflict: "id" });
      }

      setAlerta("ok", "¡Registro exitoso! Redirigiendo...");
      setTimeout(() => {
        window.location.replace(RUTAS[rol] ?? RUTAS.estudiante);
      }, 800);

    } catch (err) {
      btn.disabled    = false;
      btn.textContent = "Registrarme";
      setAlerta("error", "Error inesperado. Intenta de nuevo.");
      console.error(err);
    }
  });
});

// ── Traduce errores comunes de Supabase ────────
function tradError(msg) {
  if (!msg) return "Error desconocido.";
  if (msg.includes("already registered") || msg.includes("User already registered"))
    return "Este correo ya está registrado. ¿Quieres iniciar sesión?";
  if (msg.includes("invalid email"))
    return "El correo no es válido.";
  if (msg.includes("Password should be"))
    return "La contraseña debe tener al menos 6 caracteres.";
  if (msg.includes("rate limit"))
    return "Demasiados intentos. Espera un momento.";
  return msg;
}
