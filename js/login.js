import { supabase } from "./supabase.js";

const PANEL = {
  docente:    "/paginas/panel_docente.html",
  estudiante: "/paginas/panel_estudiante.html",
};

// ── Abrir / cerrar modal ──────────────────────
document.addEventListener("click", function(e) {
  const modal = document.getElementById("modalLogin");
  if (!modal) return;

  if (e.target.closest(".abrir-login") || e.target.closest("#btnLogin")) {
    e.preventDefault();
    modal.style.display = "flex";
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
  const mostrar = input.type === "password";
  input.type = mostrar ? "text" : "password";
  e.target.classList.toggle("fa-eye",       !mostrar);
  e.target.classList.toggle("fa-eye-slash",  mostrar);
});

// ── Ingresar ──────────────────────────────────
document.addEventListener("click", async function(e) {
  if (!e.target.closest("#loginForm button[type='submit']")) return;
  e.preventDefault();

  const form = document.querySelector("#loginForm");
  if (!form) return;

  const email    = form.querySelector('input[type="email"]').value.trim();
  const password = form.querySelector('input[type="password"]').value;

  setAlerta("");
  if (!email || !password) { setAlerta("Completa todos los campos.", "error"); return; }

  const btn = e.target.closest("button");
  btn.disabled    = true;
  btn.textContent = "Ingresando...";

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    btn.disabled    = false;
    btn.textContent = "Ingresar";
    setAlerta("Correo o contraseña incorrectos.", "error");
    return;
  }

  // Leer rol y redirigir — sin setTimeout, sin onAuthStateChange
  const { data: perfil } = await supabase
    .from("perfiles")
    .select("rol")
    .eq("id", data.user.id)
    .single();

  // Guardar en sessionStorage para que el panel sepa que viene de login
  sessionStorage.setItem("desde_login", "1");

  window.location.href = PANEL[perfil?.rol] ?? PANEL.estudiante;
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

// ── Helper alerta ─────────────────────────────
function setAlerta(msg, tipo = "ok") {
  const el = document.getElementById("loginAlerta");
  if (!el) return;
  if (!msg) { el.className = "form-alerta"; el.innerHTML = ""; return; }
  el.className = `form-alerta visible alerta-${tipo}`;
  el.innerHTML = `<i class="fa-solid ${tipo === "ok" ? "fa-circle-check" : "fa-circle-exclamation"}"></i><span>${msg}</span>`;
}