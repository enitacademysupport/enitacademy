/* ════════════════════════════════════════════
   ENIT Academy — panel_estudiante.js
   ════════════════════════════════════════════ */
import { supabase } from "./supabase.js";

// ── Guardia de sesión ─────────────────────────
async function verificarSesion() {
  return new Promise((resolve) => {
    let resolved = false;

    const timeout = setTimeout(() => {
      if (!resolved) { resolved = true; window.location.href = "/index.html"; resolve(null); }
    }, 8000);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event !== "INITIAL_SESSION" && event !== "SIGNED_IN") return;
      if (resolved) return;
      resolved = true;
      clearTimeout(timeout);
      subscription.unsubscribe();

      if (!session) { window.location.href = "/index.html"; resolve(null); return; }

      const { data: perfil, error } = await supabase
        .from("perfiles").select("*").eq("id", session.user.id).single();

      if (error || !perfil) { window.location.href = "/index.html"; resolve(null); return; }
      if (perfil.rol !== "estudiante") { window.location.href = "/paginas/panel_docente.html"; resolve(null); return; }

      resolve({ user: session.user, perfil });
    });
  });
}

// ── Helpers ───────────────────────────────────
function alerta(id, tipo, msg) {
  const el = document.getElementById(id);
  if (!el) return;
  el.className = `form-alerta visible alerta-${tipo}`;
  el.innerHTML = `<i class="fa-solid ${tipo === "ok" ? "fa-circle-check" : "fa-circle-exclamation"}"></i><span>${msg}</span>`;
}

function limpiarAlerta(id) {
  const el = document.getElementById(id);
  if (el) { el.className = "form-alerta"; el.innerHTML = ""; }
}

function mostrarVista(nombre) {
  document.querySelectorAll(".vista").forEach(v => v.classList.add("oculto"));
  const key = nombre[0].toUpperCase() + nombre.slice(1);
  const el  = document.getElementById("vista" + key);
  if (el) el.classList.remove("oculto");
  document.querySelectorAll(".nav-item").forEach(b =>
    b.classList.toggle("active", b.dataset.vista === nombre)
  );
  document.querySelector(".sidebar")?.classList.remove("sidebar-open");
  document.getElementById("sidebarOverlay")?.classList.remove("visible");
}

// ── Stats ─────────────────────────────────────
async function cargarStats(estudianteId) {
  const { data } = await supabase
    .from("inscripciones")
    .select("curso_id, cursos(nivel, docente_id)")
    .eq("estudiante_id", estudianteId);

  const totalCursos = data?.length || 0;
  const docentes    = new Set(data?.map(d => d.cursos?.docente_id).filter(Boolean));
  const niveles     = data?.map(d => d.cursos?.nivel).filter(Boolean);
  const nivelTop    = niveles?.length ? niveles[niveles.length - 1] : "—";

  document.getElementById("statCursos").textContent   = totalCursos;
  document.getElementById("statDocentes").textContent = docentes.size;
  document.getElementById("statNivel").textContent    = nivelTop;
}

// ── Cursos ────────────────────────────────────
let cursosEstudiante = [];

async function cargarCursos(estudianteId) {
  const { data } = await supabase
    .from("inscripciones")
    .select("inscrito_at, cursos(id,nombre,descripcion,nivel,codigo,perfiles(nombre,apellido))")
    .eq("estudiante_id", estudianteId)
    .order("inscrito_at", { ascending: false });

  cursosEstudiante = data?.map(d => d.cursos) || [];

  const lista = document.getElementById("listaCursos");
  const vacio = document.getElementById("msgVacio");
  lista.innerHTML = "";

  if (!data?.length) {
    lista.appendChild(vacio);
    vacio.style.display = "block";
    return;
  }
  vacio.style.display = "none";

  data.forEach(({ cursos: c, inscrito_at }) => {
    const card = document.createElement("div");
    card.className = "card-curso";
    card.innerHTML = `
      <div class="card-top">
        <span class="badge-nivel nivel-${c.nivel}">${c.nivel || "—"}</span>
        <span class="fecha-inscripcion">${new Date(inscrito_at).toLocaleDateString("es-PE")}</span>
      </div>
      <h3>${c.nombre}</h3>
      <p>${c.descripcion || "Sin descripción"}</p>
      <div class="card-footer">
        <span class="docente-small">
          <i class="fa-solid fa-chalkboard-teacher"></i>
          ${c.perfiles?.nombre ?? ""} ${c.perfiles?.apellido ?? ""}
        </span>
      </div>
    `;
    lista.appendChild(card);
  });

  // Poblar filtros de curso en las otras vistas
  ["filtroAnunciosCurso","filtroArchivosCurso","filtroTareasCurso"].forEach(selId => {
    const sel = document.getElementById(selId);
    if (!sel) return;
    sel.innerHTML = '<option value="">Todos los cursos</option>';
    cursosEstudiante.forEach(c => { sel.innerHTML += `<option value="${c.id}">${c.nombre}</option>`; });
  });
}

// ── Anuncios ──────────────────────────────────
let todosAnuncios = [];

async function cargarAnuncios(estudianteId) {
  const { data } = await supabase
    .from("inscripciones")
    .select("curso_id").eq("estudiante_id", estudianteId);

  if (!data?.length) { document.getElementById("listaAnunciosEst").innerHTML = "<p class='txt-vacio'>Aún no estás inscrito en ningún curso.</p>"; return; }

  const ids = data.map(d => d.curso_id);
  const { data: anuncios } = await supabase
    .from("anuncios")
    .select("*, cursos(nombre)")
    .in("curso_id", ids)
    .order("creado_at", { ascending: false });

  todosAnuncios = anuncios || [];
  renderAnuncios(todosAnuncios);
}

function renderAnuncios(lista) {
  const el = document.getElementById("listaAnunciosEst");
  if (!lista.length) { el.innerHTML = "<p class='txt-vacio'>No hay anuncios por ahora.</p>"; return; }

  el.innerHTML = lista.map(a => `
    <div class="anuncio-card anuncio-estudiante">
      <div class="anuncio-header">
        <span class="anuncio-curso"><i class="fa-solid fa-book-open"></i> ${a.cursos?.nombre || "—"}</span>
        <span class="anuncio-fecha">${new Date(a.creado_at).toLocaleDateString("es-PE")}</span>
      </div>
      <h4>${a.titulo}</h4>
      <p>${a.contenido}</p>
    </div>`).join("");
}

// ── Archivos ──────────────────────────────────
let todosArchivos = [];

async function cargarArchivos(estudianteId) {
  const { data } = await supabase
    .from("inscripciones").select("curso_id").eq("estudiante_id", estudianteId);

  if (!data?.length) { document.getElementById("listaArchivosEst").innerHTML = "<p class='txt-vacio'>Aún no estás inscrito en ningún curso.</p>"; return; }

  const ids = data.map(d => d.curso_id);
  const { data: archivos } = await supabase
    .from("archivos")
    .select("*, cursos(nombre)")
    .in("curso_id", ids)
    .order("creado_at", { ascending: false });

  todosArchivos = archivos || [];
  renderArchivos(todosArchivos);
}

function renderArchivos(lista) {
  const el = document.getElementById("listaArchivosEst");
  const iconMap = { pdf:"fa-file-pdf", doc:"fa-file-word", docx:"fa-file-word", ppt:"fa-file-powerpoint", pptx:"fa-file-powerpoint", xls:"fa-file-excel", xlsx:"fa-file-excel", mp4:"fa-file-video", mp3:"fa-file-audio", jpg:"fa-file-image", jpeg:"fa-file-image", png:"fa-file-image" };
  
  if (!lista.length) { el.innerHTML = "<p class='txt-vacio'>No hay archivos disponibles aún.</p>"; return; }

  el.innerHTML = lista.map(a => {
    const ext = a.nombre_archivo?.split(".").pop()?.toLowerCase() || "";
    const icon = iconMap[ext] || "fa-file";
    return `
    <div class="archivo-card">
      <div class="archivo-icon"><i class="fa-solid ${icon}"></i></div>
      <div class="archivo-info">
        <span class="archivo-nombre">${a.nombre_archivo}</span>
        <span class="archivo-curso"><i class="fa-solid fa-book-open"></i> ${a.cursos?.nombre || "—"}</span>
        <span class="archivo-fecha">${new Date(a.creado_at).toLocaleDateString("es-PE")}</span>
      </div>
      <a href="${a.url}" target="_blank" class="btn-icon btn-download" title="Descargar">
        <i class="fa-solid fa-download"></i>
      </a>
    </div>`;
  }).join("");
}

// ── Tareas ────────────────────────────────────
let todasTareas = [];

async function cargarTareas(estudianteId) {
  const { data } = await supabase
    .from("inscripciones").select("curso_id").eq("estudiante_id", estudianteId);

  if (!data?.length) { document.getElementById("listaTareasEst").innerHTML = "<p class='txt-vacio'>Aún no estás inscrito en ningún curso.</p>"; return; }

  const ids = data.map(d => d.curso_id);
  const { data: tareas } = await supabase
    .from("tareas")
    .select("*, cursos(nombre)")
    .in("curso_id", ids)
    .order("fecha_entrega", { ascending: true, nullsFirst: false });

  todasTareas = tareas || [];
  renderTareas(todasTareas);
}

function renderTareas(lista) {
  const el = document.getElementById("listaTareasEst");
  if (!lista.length) { el.innerHTML = "<p class='txt-vacio'>No hay tareas asignadas aún.</p>"; return; }

  const hoy = new Date();
  el.innerHTML = lista.map(t => {
    const vence   = t.fecha_entrega ? new Date(t.fecha_entrega).toLocaleDateString("es-PE") : "Sin fecha límite";
    const vencida = t.fecha_entrega && new Date(t.fecha_entrega) < hoy;
    const urgente = t.fecha_entrega && !vencida && (new Date(t.fecha_entrega) - hoy) < 3 * 86400000;
    return `
    <div class="tarea-card ${vencida ? "tarea-vencida" : urgente ? "tarea-urgente" : ""}">
      <div class="tarea-header">
        <span class="anuncio-curso"><i class="fa-solid fa-book-open"></i> ${t.cursos?.nombre || "—"}</span>
        <span class="tarea-fecha ${vencida ? "vencida" : urgente ? "urgente" : ""}">
          <i class="fa-solid fa-clock"></i> ${vence}
          ${vencida ? '<span class="badge-vencida">Vencida</span>' : urgente ? '<span class="badge-urgente">Pronto</span>' : ""}
        </span>
      </div>
      <h4>${t.titulo}</h4>
      ${t.descripcion ? `<p>${t.descripcion}</p>` : ""}
      ${t.puntos ? `<span class="tarea-puntos"><i class="fa-solid fa-star"></i> ${t.puntos} pts</span>` : ""}
    </div>`;
  }).join("");
}

// ── Filtros por curso ──────────────────────────
function initFiltros() {
  document.getElementById("filtroAnunciosCurso")?.addEventListener("change", e => {
    const v = e.target.value;
    renderAnuncios(v ? todosAnuncios.filter(a => a.curso_id === v) : todosAnuncios);
  });
  document.getElementById("filtroArchivosCurso")?.addEventListener("change", e => {
    const v = e.target.value;
    renderArchivos(v ? todosArchivos.filter(a => a.curso_id === v) : todosArchivos);
  });
  document.getElementById("filtroTareasCurso")?.addEventListener("change", e => {
    const v = e.target.value;
    renderTareas(v ? todasTareas.filter(t => t.curso_id === v) : todasTareas);
  });
}

// ── Unirse por código ─────────────────────────
function initFormCodigo(estudianteId) {
  document.getElementById("formCodigo").addEventListener("submit", async e => {
    e.preventDefault();
    limpiarAlerta("alertaCodigo");
    document.getElementById("errCodigo").textContent = "";

    const codigo = document.getElementById("codigoInput").value.trim().toUpperCase();
    if (!codigo) { document.getElementById("errCodigo").textContent = "Ingresa un código."; return; }

    const btn = e.target.querySelector("button[type=submit]");
    btn.disabled = true; btn.textContent = "Buscando...";

    const { data: curso, error } = await supabase
      .from("cursos").select("id,nombre").eq("codigo", codigo).single();

    if (error || !curso) {
      alerta("alertaCodigo","error","Código inválido. Verifica e intenta de nuevo.");
      btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-right-to-bracket"></i> Unirme al curso';
      return;
    }

    const { data: yaInscrito } = await supabase
      .from("inscripciones").select("id")
      .eq("curso_id", curso.id).eq("estudiante_id", estudianteId).maybeSingle();

    if (yaInscrito) {
      alerta("alertaCodigo","error","Ya estás inscrito en este curso.");
      btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-right-to-bracket"></i> Unirme al curso';
      return;
    }

    const { error: errIns } = await supabase
      .from("inscripciones").insert({ curso_id: curso.id, estudiante_id: estudianteId });

    btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-right-to-bracket"></i> Unirme al curso';

    if (errIns) { alerta("alertaCodigo","error",errIns.message); return; }

    alerta("alertaCodigo","ok",`¡Te uniste a "${curso.nombre}"!`);
    e.target.reset();
    setTimeout(async () => {
      await cargarCursos(estudianteId);
      await Promise.all([cargarAnuncios(estudianteId), cargarArchivos(estudianteId), cargarTareas(estudianteId)]);
      cargarStats(estudianteId);
      mostrarVista("cursos");
    }, 1600);
  });
}

// ── Perfil ────────────────────────────────────
function initFormPerfil(user, perfil) {
  document.getElementById("pNombre").value   = perfil.nombre   || "";
  document.getElementById("pApellido").value = perfil.apellido || "";
  document.getElementById("pEmail").value    = user.email      || "";
  document.getElementById("perfilDesde").textContent =
    "Miembro desde " + new Date(perfil.creado_at).toLocaleDateString("es-PE", { year:"numeric", month:"long" });

  document.querySelector(".toggle-pw")?.addEventListener("click", function () {
    const input = document.getElementById(this.dataset.target);
    const show  = input.type === "password";
    input.type  = show ? "text" : "password";
    this.querySelector("i").className = show ? "fa-regular fa-eye-slash" : "fa-regular fa-eye";
  });

  document.getElementById("formPerfil").addEventListener("submit", async e => {
    e.preventDefault();
    limpiarAlerta("alertaPerfil");

    const nombre    = document.getElementById("pNombre").value.trim();
    const apellido  = document.getElementById("pApellido").value.trim();
    const passNueva = document.getElementById("pPassNueva").value;

    document.getElementById("errPNombre").textContent   = "";
    document.getElementById("errPApellido").textContent = "";
    document.getElementById("errPPass").textContent     = "";

    let ok = true;
    if (!nombre)   { document.getElementById("errPNombre").textContent   = "Nombre obligatorio.";   ok = false; }
    if (!apellido) { document.getElementById("errPApellido").textContent = "Apellido obligatorio."; ok = false; }
    if (passNueva && passNueva.length < 6) { document.getElementById("errPPass").textContent = "Mínimo 6 caracteres."; ok = false; }
    if (!ok) return;

    const btn = e.target.querySelector("button[type=submit]");
    btn.disabled = true; btn.textContent = "Guardando...";

    await supabase.from("perfiles").update({ nombre, apellido }).eq("id", user.id);
    await supabase.auth.updateUser({ data: { nombre, apellido } });

    if (passNueva) {
      const { error: errPass } = await supabase.auth.updateUser({ password: passNueva });
      if (errPass) {
        alerta("alertaPerfil","error",errPass.message);
        btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Guardar cambios';
        return;
      }
    }

    btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Guardar cambios';
    document.getElementById("sideNombre").textContent = `${nombre} ${apellido}`;
    document.getElementById("pPassNueva").value = "";
    alerta("alertaPerfil","ok","¡Perfil actualizado correctamente!");
  });
}

// ── Sidebar móvil ─────────────────────────────
function initSidebarMobile() {
  const toggle  = document.getElementById("sidebarToggle");
  const sidebar = document.querySelector(".sidebar");
  const overlay = document.getElementById("sidebarOverlay");

  toggle?.addEventListener("click", () => {
    sidebar.classList.toggle("sidebar-open");
    overlay.classList.toggle("visible");
  });
  overlay?.addEventListener("click", () => {
    sidebar.classList.remove("sidebar-open");
    overlay.classList.remove("visible");
  });
}

// ── Init ──────────────────────────────────────
window.addEventListener("DOMContentLoaded", async () => {
  const sesion = await verificarSesion();
  if (!sesion) return;

  const { user, perfil } = sesion;
  document.getElementById("sideNombre").textContent = `${perfil.nombre} ${perfil.apellido}`;

  await Promise.all([
    cargarCursos(perfil.id),
    cargarStats(perfil.id),
    cargarAnuncios(perfil.id),
    cargarArchivos(perfil.id),
    cargarTareas(perfil.id),
  ]);

  initFormCodigo(perfil.id);
  initFormPerfil(user, perfil);
  initFiltros();
  initSidebarMobile();

  document.querySelectorAll(".nav-item").forEach(btn => {
    btn.addEventListener("click", () => mostrarVista(btn.dataset.vista));
  });

  document.getElementById("btnCerrar")?.addEventListener("click", async () => {
    await supabase.auth.signOut();
    window.location.href = "/index.html";
  });
});
