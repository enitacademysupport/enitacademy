/* ════════════════════════════════════════════
   ENIT Academy — reset-password.js
   Maneja el restablecimiento de contraseña
   después de que el usuario llega desde el
   enlace del correo de Supabase.
   ════════════════════════════════════════════ */

import { supabase } from "./supabase.js";

const formulario   = document.getElementById("formulario");
const estadoExito  = document.getElementById("estadoExito");
const btnGuardar   = document.getElementById("btnGuardar");
const inputNueva   = document.getElementById("nuevaClave");
const inputConfirm = document.getElementById("confirmarClave");
const errNueva     = document.getElementById("errNueva");
const errConfirmar = document.getElementById("errConfirmar");
const alerta       = document.getElementById("alerta");

// ── Detectar sesión desde el enlace del correo ──
// Supabase pone el token en el hash (#access_token=...) o como query param
// onAuthStateChange lo captura automáticamente con el evento PASSWORD_RECOVERY

supabase.auth.onAuthStateChange(async (event, session) => {
  if (event === "PASSWORD_RECOVERY") {
    // El usuario llegó desde el enlace de reset — mostrar el formulario normalmente
    console.log("Modo recuperación de contraseña activo");
  }

  if (event === "SIGNED_IN" && session) {
    // Si llegó desde un enlace de CONFIRMACIÓN de email (registro)
    // redirigir al panel según su rol
    const { data: perfil } = await supabase
      .from("perfiles").select("rol").eq("id", session.user.id).single();
    const RUTAS = {
      docente:    "/paginas/panel_docente.html",
      estudiante: "/paginas/panel_estudiante.html",
    };
    // Solo redirigir si NO estamos en flujo de reset (no hay hash de recovery)
    if (!window.location.hash.includes("type=recovery")) {
      window.location.href = RUTAS[perfil?.rol] ?? RUTAS.estudiante;
    }
  }
});

// ── Requisitos visuales ───────────────────────
inputNueva?.addEventListener("input", () => {
  const val = inputNueva.value;
  toggle("reqLongitud",  val.length >= 6);
  toggle("reqMayuscula", /[A-Z]/.test(val));
  toggle("reqNumero",    /[0-9]/.test(val));
});

function toggle(id, cumple) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.toggle("cumple", cumple);
  el.querySelector("i").className = cumple
    ? "fa-solid fa-circle-check"
    : "fa-regular fa-circle";
}

// ── Ojito ──────────────────────────────────────
document.querySelectorAll(".btn-ojo").forEach(btn => {
  btn.addEventListener("click", () => {
    const input = document.getElementById(btn.dataset.objetivo);
    if (!input) return;
    const ver = input.type === "password";
    input.type = ver ? "text" : "password";
    btn.querySelector("i").className = ver
      ? "fa-regular fa-eye-slash"
      : "fa-regular fa-eye";
  });
});

// ── Guardar nueva contraseña ───────────────────
btnGuardar?.addEventListener("click", async () => {
  // Limpiar errores
  errNueva.textContent     = "";
  errConfirmar.textContent = "";
  ocultarAlerta();

  const nueva     = inputNueva.value;
  const confirmar = inputConfirm.value;

  let valido = true;

  if (!nueva)             { errNueva.textContent = "Ingresa una contraseña.";   valido = false; }
  else if (nueva.length < 6) { errNueva.textContent = "Mínimo 6 caracteres.";  valido = false; }

  if (!confirmar)               { errConfirmar.textContent = "Confirma la contraseña.";       valido = false; }
  else if (nueva !== confirmar) { errConfirmar.textContent = "Las contraseñas no coinciden."; valido = false; }

  if (!valido) return;

  btnGuardar.disabled     = true;
  btnGuardar.textContent  = "Guardando...";

  const { error } = await supabase.auth.updateUser({ password: nueva });

  if (error) {
    btnGuardar.disabled    = false;
    btnGuardar.innerHTML   = '<i class="fa-solid fa-floppy-disk"></i> Guardar contraseña';
    mostrarAlerta("error", error.message);
    return;
  }

  // Éxito — mostrar pantalla de confirmación
  formulario.style.display  = "none";
  estadoExito.style.display = "flex";
});

// ── Helpers alerta ─────────────────────────────
function mostrarAlerta(tipo, msg) {
  alerta.className = `alerta visible alerta-${tipo}`;
  alerta.innerHTML = `<i class="fa-solid ${tipo === "ok" ? "fa-circle-check" : "fa-circle-exclamation"}"></i> ${msg}`;
}
function ocultarAlerta() {
  alerta.className = "alerta";
  alerta.innerHTML = "";
}

window.addEventListener("error", e => {
  console.error("ERROR GLOBAL:", e.error);
});

window.addEventListener("unhandledrejection", e => {
  console.error("PROMESA FALLIDA:", e.reason);
});