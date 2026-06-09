import { supabase } from "./supabase.js";

const RUTAS = {
  docente:    "/paginas/panel_docente.html",
  estudiante: "/paginas/panel_estudiante.html",
};

// ── Modal ─────────────────────────────────────
document.addEventListener("click", function(e) {
  const modal = document.getElementById("modalLogin");
  if (!modal) return;
  if (e.target.closest("#btnLogin") || e.target.closest(".abrir-login")) {
    e.preventDefault();
    modal.style.display = "flex";
    limpiarAlerta();
  }
  if (e.target.classList.contains("cerrar") || e.target.id === "modalLogin") {
    modal.style.display = "none";
  }
});

// ── Ojo contraseña ────────────────────────────
document.addEventListener("click", function(e) {
  if (e.target.id !== "togglePassword") return;
  const input = document.getElementById("loginPassword");
  if (!input) return;
  const ver  = input.type === "password";
  input.type = ver ? "text" : "password";
  e.target.classList.toggle("fa-eye",      !ver);
  e.target.classList.toggle("fa-eye-slash",  ver);
});

// ── Submit ────────────────────────────────────
document.addEventListener("click", async function(e) {
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

  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      btn.disabled    = false;
      btn.textContent = "Ingresar";
      const msgs = {
        "Invalid login credentials": "Correo o contraseña incorrectos.",
        "Email not confirmed":       "Debes confirmar tu correo primero.",
      };
      mostrarAlerta("error", msgs[error.message] || error.message);
      return;
    }

    mostrarAlerta("ok", "¡Bienvenid@! Redirigiendo...");
    btn.textContent = "Redirigiendo...";

    const { data: perfil } = await supabase
      .from("perfiles").select("rol").eq("id", data.user.id).single();

    window.location.href = RUTAS[perfil?.rol] ?? RUTAS.estudiante;

  } catch(err) {
    console.error("Error login:", err);
    btn.disabled    = false;
    btn.textContent = "Ingresar";
    mostrarAlerta("error", "Error de conexión. Intenta de nuevo.");
  }
});

// ── Recuperar contraseña ──────────────────────
document.addEventListener("click", async function(e) {
  if (!e.target.closest("#resetPassword")) return;
  e.preventDefault();
  const email = prompt("Ingresa tu correo:");
  if (!email) return;
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin + "/paginas/reset-password.html",
  });
  if (error) { alert(error.message); return; }
  alert("Revisa tu correo para restablecer tu contraseña.");
});

// ── Helpers ───────────────────────────────────
function mostrarAlerta(tipo, msg) {
  const el = document.getElementById("loginAlerta");
  if (!el) return;
  el.className = `form-alerta visible alerta-${tipo}`;
  el.innerHTML = `<i class="fa-solid ${tipo === "ok" ? "fa-circle-check" : "fa-circle-exclamation"}"></i><span>${msg}</span>`;
}
function limpiarAlerta() {
  const el = document.getElementById("loginAlerta");
  if (el) { el.className = "form-alerta"; el.innerHTML = ""; }
}


window.addEventListener("error", e => {
  console.error("ERROR GLOBAL:", e.error);
});

window.addEventListener("unhandledrejection", e => {
  console.error("PROMESA FALLIDA:", e.reason);
});