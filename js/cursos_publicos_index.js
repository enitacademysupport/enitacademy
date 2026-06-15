/* ════════════════════════════════════════════
   ENIT Academy — cursos_publicos_index.js
   Pegar este import en index.html y añadir
   el bloque HTML indicado abajo.
   ════════════════════════════════════════════ */
 
import { supabase } from "./supabase.js";
 
/* ──────────────────────────────────────────────────────────────────────────
   AÑADE ESTO EN TU index.html donde quieras mostrar los cursos públicos:
 
   
 
   Y en tu CSS (o en un <style> del index):  →  ver bloque CSS al final de este archivo.
────────────────────────────────────────────────────────────────────────── */
 
document.addEventListener("DOMContentLoaded", cargarCursosPublicos);
 
async function cargarCursosPublicos() {
  const grid = document.getElementById("gridCursosPublicos");
  if (!grid) return;
 
  // Traer cursos públicos junto con el nombre del docente
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
  // Verificar sesión
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    // Redirigir al login con parámetro de retorno
    window.location.href = `/index.html?inscribir=${cursoId}`;
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
 
  // Inscribir directamente (curso público, sin código)
  const { error } = await supabase.from("inscripciones").insert({
    curso_id:      cursoId,
    estudiante_id: userId,
  });
 
  if (error) {
    mostrarToast("Error al inscribirse. Inténtalo de nuevo.", "error");
    return;
  }
 
  mostrarToast(`¡Inscrito en "${nombreCurso}" exitosamente! 🎉`, "ok");
 
  // Redirigir al panel del estudiante después de 1.5 s
  setTimeout(() => {
    window.location.href = "/pages/panel_estudiante.html";
  }, 1500);
};
 
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
    tipo === "ok" ? "fa-circle-check" :
    tipo === "error" ? "fa-circle-exclamation" :
    "fa-circle-info"
  }"></i> ${msg}`;
  clearTimeout(toast._t);
  toast._t = setTimeout(() => toast.classList.remove("toast-visible"), 3500);
}