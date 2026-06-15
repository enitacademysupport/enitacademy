/* ════════════════════════════════════════════
   ENIT Academy — cursos_publicos_index.js
   ════════════════════════════════════════════ */

import { supabase } from "./supabase.js";

document.addEventListener("DOMContentLoaded", cargarCursosPublicos);

async function cargarCursosPublicos() {
  const grid = document.getElementById("gridCursosPublicos");
  if (!grid) return;

  const { data: cursos, error } = await supabase
    .from("cursos")
    .select(`
      id, nombre, descripcion, nivel, codigo, creado_at,
      perfiles:docente_id ( nombre, apellido )
    `)
    .eq("es_publico", true)
    .order("creado_at", { ascending: false });

  if (error || !cursos || cursos.length === 0) {
    grid.innerHTML = `<p class="sin-cursos-pub">No hay cursos públicos disponibles aún.</p>`;
    return;
  }

  grid.innerHTML = cursos.map(c => {
    const docente = c.perfiles
      ? `${c.perfiles.nombre} ${c.perfiles.apellido}`
      : "Docente ENIT";
    return `
      <div class="tarjeta-pub">
        <div class="tarjeta-pub-top">
          ${c.nivel ? `<span class="etiqueta-nivel ${c.nivel}">${c.nivel}</span>` : ""}
          <span class="badge-visibilidad publico" style="margin-left:auto;">
            <i class="fa-solid fa-globe"></i> Público
          </span>
        </div>
        <h3 class="tarjeta-pub-titulo">${c.nombre}</h3>
        <p class="tarjeta-pub-desc">${c.descripcion || "Sin descripción."}</p>
        <div class="tarjeta-pub-footer">
          <span class="pub-docente"><i class="fa-solid fa-chalkboard-teacher"></i> ${docente}</span>
          <button
            class="btn-inscribirse"
            onclick="abrirModalInscripcion('${c.id}', '${c.nombre.replace(/'/g,"\\'")}')">
            Inscribirme
          </button>
        </div>
      </div>`;
  }).join("");
}

/* ── Modal de inscripción ─────────────────────────────────────────────────── */
window.abrirModalInscripcion = async function(cursoId, nombreCurso) {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    // Guardar el curso que quería inscribirse para retomar después del login
    sessionStorage.setItem("inscribir_pendiente", cursoId);
    sessionStorage.setItem("inscribir_nombre",    nombreCurso);

    // Abrir el modal de login del header en lugar de redirigir
    const modal = document.getElementById("modalLogin");
    if (modal) {
      modal.style.display = "flex";          // como lo abre tu header_footer.js
    } else {
      // Fallback: si el modal aún no cargó, esperar y reintentar
      setTimeout(() => window.abrirModalInscripcion(cursoId, nombreCurso), 400);
    }
    return;
  }

  const userId = session.user.id;

  // Verificar si ya está inscrito
  const { data: yaInscrito } = await supabase
    .from("inscripciones")
    .select("id")
    .eq("curso_id", cursoId)
    .eq("estudiante_id", userId)
    .maybeSingle();

  if (yaInscrito) {
    mostrarToast("Ya estás inscrito en este curso.", "info");
    return;
  }

  // Inscribir
  const { error } = await supabase.from("inscripciones").insert({
    curso_id:      cursoId,
    estudiante_id: userId,
  });

  if (error) {
    mostrarToast("Error al inscribirse. Inténtalo de nuevo.", "error");
    return;
  }

  mostrarToast(`¡Inscrito en "${nombreCurso}" exitosamente! 🎉`, "ok");
  setTimeout(() => { window.location.href = "/paginas/panel_estudiante.html"; }, 1500);
};

/* ── Retomar inscripción pendiente tras login ─────────────────────────────── */
// Se ejecuta cuando el usuario cierra sesión/inicia sesión (evento del header)
supabase.auth.onAuthStateChange(async (event, session) => {
  if (event !== "SIGNED_IN" || !session) return;

  const cursoId    = sessionStorage.getItem("inscribir_pendiente");
  const nombreCurso = sessionStorage.getItem("inscribir_nombre");
  if (!cursoId) return;

  // Limpiar antes de inscribir para no repetir
  sessionStorage.removeItem("inscribir_pendiente");
  sessionStorage.removeItem("inscribir_nombre");

  // Cerrar modal de login si sigue abierto
  const modal = document.getElementById("modalLogin");
  if (modal) modal.style.display = "none";

  // Intentar inscribir automáticamente
  await window.abrirModalInscripcion(cursoId, nombreCurso);
});

/* ── Toast liviano ────────────────────────────────────────────────────────── */
function mostrarToast(msg, tipo = "ok") {
  let toast = document.getElementById("enit-toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "enit-toast";
    document.body.appendChild(toast);
  }
  toast.className = `enit-toast toast-${tipo} toast-visible`;
  toast.innerHTML = `<i class="fa-solid ${
    tipo === "ok"    ? "fa-circle-check" :
    tipo === "error" ? "fa-circle-exclamation" :
    "fa-circle-info"
  }"></i> ${msg}`;
  clearTimeout(toast._t);
  toast._t = setTimeout(() => toast.classList.remove("toast-visible"), 3500);
}