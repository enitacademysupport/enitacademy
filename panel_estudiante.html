/* ════════════════════════════════════════════
   ENIT Academy — login.js
   ════════════════════════════════════════════ */
import { supabase } from "./supabase.js";

const RUTAS = {
  docente:    "/paginas/panel_docente.html",
  estudiante: "/paginas/panel_estudiante.html",
};

// ── Modal abrir/cerrar ────────────────────────
document.addEventListener("click", function (e) {
  const modal = document.getElementById("modalLogin");
  if (!modal) return;
  if (e.target.closest("#btnLogin") || e.target.closest(".abrir-login")) {
    e.preventDefault();
    modal.style.display = "flex";
  }
  if (e.target.classList.contains("cerrar") || e.target.id === "modalLogin") {
    modal.style.display = "none";
  }
});

// ── Ojo contraseña ────────────────────────────
document.addEventListener("click", function (e) {
  if (e.target.id !== "togglePassword") return;
  const input = document.getElementById("loginPassword");
  if (!input) return;
  const show = input.type === "password";
  input.type = show ? "text" : "password";
  e.target.classList.toggle("fa-eye",      !show);
  e.target.classList.toggle("fa-eye-slash", show);
});

// ── Submit login ──────────────────────────────
document.addEventListener("click", async (e) => {
  if (!e.target.closest("#loginForm button[type='submit']")) return;
  e.preventDefault();

  const form = document.querySelector("#loginForm");
  if (!form) return;

  const email    = form.querySelector('input[type="email"]').value.trim();
  const password = form.querySelector('input[type="password"]').value;

  limpiarAlerta();
  if (!email || !password) { mostrarAlerta("error", "Completa todos los campos."); return; }

  const btn = e.target.closest("button");
  btn.disabled    = true;
  btn.textContent = "Ingresando...";

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    btn.disabled    = false;
    btn.textContent = "Ingresar";
    mostrarAlerta("error", "Correo o contraseña incorrectos.");
    return;
  }

  mostrarAlerta("ok", "¡Bienvenido! Redirigiendo...");
  btn.textContent = "Redirigiendo...";

  // Sesión ya en data.session, leer rol directamente
  const session = data.session;
  if (!session) { window.location.href = "/index.html"; return; }

  const { data: perfil } = await supabase
    .from("perfiles")
    .select("rol")
    .eq("id", session.user.id)
    .single();

  const ruta = RUTAS[perfil?.rol] ?? "/paginas/panel_estudiante.html";
  window.location.href = ruta;
});

// ── Recuperar contraseña ──────────────────────
document.addEventListener("click", async (e) => {
  if (!e.target.closest("#resetPassword")) return;
  e.preventDefault();

  const email = prompt("Ingresa tu correo electrónico:");
  if (!email) return;

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin + "/paginas/reset-password.html",
  });

  if (error) { alert(error.message); return; }
  alert("Se envió un correo para restablecer tu contraseña.");
});

// ── Helpers alerta ────────────────────────────
function mostrarAlerta(tipo, msg) {
  const alerta = document.getElementById("loginAlerta");
  if (!alerta) { alert(msg); return; }
  alerta.className = `form-alerta visible alerta-${tipo}`;
  alerta.innerHTML = `
    <i class="fa-solid ${tipo === "ok" ? "fa-circle-check" : "fa-circle-exclamation"}"></i>
    <span>${msg}</span>
  `;
}

function limpiarAlerta() {
  const alerta = document.getElementById("loginAlerta");
  if (alerta) { alerta.className = "form-alerta"; alerta.innerHTML = ""; }
}
