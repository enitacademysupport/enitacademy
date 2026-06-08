/* ════════════════════════════════════════════
   ENIT Academy — reset-password.js
   ════════════════════════════════════════════ */
import { supabase } from "./supabase.js";

// ── Ojitos ────────────────────────────────────
document.querySelectorAll(".btn-ojo").forEach(btn => {
  btn.addEventListener("click", () => {
    const input = document.getElementById(btn.dataset.objetivo);
    const ver   = input.type === "password";
    input.type  = ver ? "text" : "password";
    btn.querySelector("i").className = ver ? "fa-regular fa-eye-slash" : "fa-regular fa-eye";
  });
});

// ── Requisitos en tiempo real ─────────────────
const inputNueva = document.getElementById("nuevaClave");

inputNueva?.addEventListener("input", () => {
  const val = inputNueva.value;
  marcarRequisito("reqLongitud", val.length >= 6);
  marcarRequisito("reqMayuscula", /[A-Z]/.test(val));
  marcarRequisito("reqNumero",   /[0-9]/.test(val));
});

function marcarRequisito(id, cumple) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.toggle("cumple", cumple);
  el.querySelector("i").className = cumple ? "fa-solid fa-circle-check" : "fa-regular fa-circle";
}

// ── Alertas ───────────────────────────────────
function mostrarAlerta(tipo, msg) {
  const el = document.getElementById("alerta");
  if (!el) return;
  el.className = `alerta visible alerta-${tipo}`;
  el.innerHTML = `<i class="fa-solid ${tipo === "ok" ? "fa-circle-check" : "fa-circle-exclamation"}"></i><span>${msg}</span>`;
}

// ── Guardar contraseña ────────────────────────
document.getElementById("btnGuardar")?.addEventListener("click", async () => {
  const nueva     = document.getElementById("nuevaClave").value;
  const confirmar = document.getElementById("confirmarClave").value;

  document.getElementById("errNueva").textContent     = "";
  document.getElementById("errConfirmar").textContent = "";

  let valido = true;
  if (!nueva || nueva.length < 6) {
    document.getElementById("errNueva").textContent = "Mínimo 6 caracteres.";
    valido = false;
  }
  if (!confirmar) {
    document.getElementById("errConfirmar").textContent = "Confirma tu contraseña.";
    valido = false;
  } else if (nueva !== confirmar) {
    document.getElementById("errConfirmar").textContent = "Las contraseñas no coinciden.";
    valido = false;
  }
  if (!valido) return;

  const btn = document.getElementById("btnGuardar");
  btn.disabled    = true;
  btn.textContent = "Guardando...";

  try {
    const { error } = await supabase.auth.updateUser({ password: nueva });

    if (error) {
      mostrarAlerta("error", error.message);
      btn.disabled = false;
      btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Guardar contraseña';
      return;
    }

    // Mostrar estado éxito
    document.getElementById("formulario").style.display   = "none";
    document.getElementById("estadoExito").style.display  = "flex";

  } catch(err) {
    console.error(err);
    mostrarAlerta("error", "Error de conexión. Intenta de nuevo.");
    btn.disabled = false;
    btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Guardar contraseña';
  }
});