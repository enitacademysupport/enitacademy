/* ════════════════════════════════════════════
   ENIT Academy — panel_docente.js
   ════════════════════════════════════════════ */
import { supabase } from "./supabase.js";

// ── Guardia de sesión ─────────────────────────
// Usa getSession() directo — no depende de eventos async
async function verificarSesion() {
  // Supabase ya cargó la sesión desde localStorage en el import
  // getSession() la devuelve de memoria, sin red
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    window.location.replace("/index.html");
    return null;
  }

  const { data: perfil, error } = await supabase
    .from("perfiles")
    .select("*")
    .eq("id", session.user.id)
    .single();

  if (error || !perfil) {
    window.location.replace("/index.html");
    return null;
  }

  if (perfil.rol !== "docente") {
    window.location.replace("/paginas/panel_estudiante.html");
    return null;
  }

  return { user: session.user, perfil };
}

// ── Helpers ───────────────────────────────────
function generarCodigo() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

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
async function cargarStats(docenteId) {
  const { data: cursos } = await supabase
    .from("cursos").select("id,nivel").eq("docente_id", docenteId);

  const totalCursos = cursos?.length || 0;
  let totalEst = 0;

  if (cursos?.length) {
    const ids = cursos.map(c => c.id);
    const { count } = await supabase
      .from("inscripciones").select("id", { count: "exact", head: true }).in("curso_id", ids);
    totalEst = count || 0;
  }

  const nivelCount = {};
  cursos?.forEach(c => { if (c.nivel) nivelCount[c.nivel] = (nivelCount[c.nivel] || 0) + 1; });
  const nivelTop = Object.entries(nivelCount).sort((a, b) => b[1] - a[1])[0]?.[0] || "—";

  document.getElementById("statCursos").textContent      = totalCursos;
  document.getElementById("statEstudiantes").textContent = totalEst;
  document.getElementById("statNivel").textContent       = nivelTop;
}

// ── Cursos ────────────────────────────────────
let cursoActivo = null;

async function cargarCursos(docenteId) {
  const { data: cursos } = await supabase
    .from("cursos").select("*").eq("docente_id", docenteId)
    .order("creado_at", { ascending: false });

  const lista = document.getElementById("listaCursos");
  const vacio = document.getElementById("msgVacio");
  lista.innerHTML = "";

  if (!cursos?.length) {
    lista.appendChild(vacio);
    vacio.style.display = "block";
    return;
  }
  vacio.style.display = "none";

  cursos.forEach(c => {
    const card = document.createElement("div");
    card.className = "card-curso";
    card.innerHTML = `
      <div class="card-top">
        <span class="badge-nivel nivel-${c.nivel}">${c.nivel || "—"}</span>
        <span class="codigo-small"><i class="fa-solid fa-key"></i> ${c.codigo}</span>
      </div>
      <h3>${c.nombre}</h3>
      <p>${c.descripcion || "Sin descripción"}</p>
      <button class="btn-ver">Ver detalle <i class="fa-solid fa-arrow-right"></i></button>
    `;
    card.querySelector(".btn-ver").addEventListener("click", () => verDetalle(c));
    lista.appendChild(card);
  });
}

async function verDetalle(curso) {
  cursoActivo = curso;
  document.getElementById("detalleTitulo").textContent = curso.nombre;
  document.getElementById("detalleCodigo").textContent = curso.codigo;
  document.getElementById("detalleDesc").textContent   = curso.descripcion || "";
  const nEl = document.getElementById("detalleNivel");
  nEl.textContent = curso.nivel || "";
  nEl.className   = `badge-nivel nivel-${curso.nivel}`;

  const { data } = await supabase
    .from("inscripciones")
    .select("estudiante_id, perfiles(nombre,apellido)")
    .eq("curso_id", curso.id);

  document.getElementById("listaInscritos").innerHTML = data?.length
    ? data.map(i => `
        <div class="inscrito-item">
          <div class="inscrito-avatar"><i class="fa-solid fa-user-graduate"></i></div>
          <span>${i.perfiles.nombre} ${i.perfiles.apellido}</span>
        </div>`).join("")
    : "<p class='txt-vacio'>Sin estudiantes inscritos aún.</p>";

  mostrarVista("detalle");
}

// ── Estudiantes ───────────────────────────────
async function cargarEstudiantes() {
  const { data } = await supabase
    .from("perfiles").select("id,nombre,apellido").eq("rol","estudiante").order("nombre");

  const lista = document.getElementById("listaEstudiantes");
  if (!data?.length) { lista.innerHTML = "<p class='txt-vacio'>No hay estudiantes registrados.</p>"; return; }

  lista.innerHTML = data.map(e => `
    <label class="check-item">
      <input type="checkbox" value="${e.id}">
      <div class="check-avatar"><i class="fa-solid fa-user-graduate"></i></div>
      <span>${e.nombre} ${e.apellido}</span>
    </label>`).join("");

  document.getElementById("buscarEstudiante")?.addEventListener("input", ev => {
    const q = ev.target.value.toLowerCase();
    lista.querySelectorAll(".check-item").forEach(item => {
      item.style.display = item.querySelector("span").textContent.toLowerCase().includes(q) ? "" : "none";
    });
  });
}

async function cargarTablaEstudiantes() {
  const { data } = await supabase
    .from("perfiles").select("id,nombre,apellido,creado_at").eq("rol","estudiante").order("nombre");

  const tabla  = document.getElementById("tablaEstudiantes");
  const filtro = document.getElementById("filtroEstudiantes");

  if (!data?.length) { tabla.innerHTML = "<p class='txt-vacio'>No hay estudiantes registrados aún.</p>"; return; }

  function render(list) {
    tabla.innerHTML = `
      <div class="tabla-header"><span>Nombre</span><span>Apellido</span><span>Miembro desde</span></div>
      ${list.map(e => `
        <div class="tabla-fila">
          <span><i class="fa-solid fa-user-graduate"></i> ${e.nombre}</span>
          <span>${e.apellido}</span>
          <span>${new Date(e.creado_at).toLocaleDateString("es-PE")}</span>
        </div>`).join("")}`;
  }
  render(data);
  filtro?.addEventListener("input", ev => {
    const q = ev.target.value.toLowerCase();
    render(data.filter(e => `${e.nombre} ${e.apellido}`.toLowerCase().includes(q)));
  });
}

// ── Tabs crear curso ──────────────────────────
function initTabs() {
  document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      btn.closest(".tabs-asignar").querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      const container = btn.closest(".grupo");
      container.querySelectorAll(".tab-panel").forEach(p => p.classList.add("oculto"));
      const id = "tab" + btn.dataset.tab[0].toUpperCase() + btn.dataset.tab.slice(1);
      document.getElementById(id)?.classList.remove("oculto");
    });
  });
}

// ── Crear curso ───────────────────────────────
function initFormCurso(docenteId) {
  document.getElementById("formCurso").addEventListener("submit", async e => {
    e.preventDefault();
    limpiarAlerta("alertaCurso");

    const nombre = document.getElementById("cNombre").value.trim();
    const desc   = document.getElementById("cDesc").value.trim();
    const nivel  = document.getElementById("cNivel").value;

    document.getElementById("errNombre").textContent = "";
    document.getElementById("errNivel").textContent  = "";

    let ok = true;
    if (!nombre) { document.getElementById("errNombre").textContent = "Nombre obligatorio."; ok = false; }
    if (!nivel)  { document.getElementById("errNivel").textContent  = "Selecciona un nivel."; ok = false; }
    if (!ok) return;

    const btn = e.target.querySelector("button[type=submit]");
    btn.disabled = true; btn.textContent = "Guardando...";

    const codigo = generarCodigo();
    const { data: curso, error } = await supabase
      .from("cursos")
      .insert({ docente_id: docenteId, nombre, descripcion: desc, nivel, codigo })
      .select().single();

    btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Guardar curso';

    if (error) { alerta("alertaCurso","error",error.message); return; }

    const seleccionados = [...document.querySelectorAll("#listaEstudiantes input:checked")].map(c => c.value);
    if (seleccionados.length) {
      await supabase.from("inscripciones").insert(
        seleccionados.map(sid => ({ curso_id: curso.id, estudiante_id: sid }))
      );
    }

    alerta("alertaCurso","ok",`✅ Curso creado. Código: ${codigo}`);
    e.target.reset();
    document.querySelectorAll("#listaEstudiantes input").forEach(c => c.checked = false);
    setTimeout(() => { cargarCursos(docenteId); cargarStats(docenteId); mostrarVista("cursos"); }, 1800);
  });
}

// ── Eliminar curso ────────────────────────────
function initEliminarCurso(docenteId) {
  document.getElementById("btnEliminarCurso")?.addEventListener("click", async () => {
    if (!cursoActivo) return;
    if (!confirm(`¿Eliminar "${cursoActivo.nombre}"? No se puede deshacer.`)) return;
    await supabase.from("cursos").delete().eq("id", cursoActivo.id);
    cursoActivo = null;
    await cargarCursos(docenteId);
    cargarStats(docenteId);
    mostrarVista("cursos");
  });
}

// ── Copiar código ─────────────────────────────
function initCopiarCodigo() {
  document.getElementById("btnCopiarCodigo")?.addEventListener("click", () => {
    const cod = document.getElementById("detalleCodigo").textContent;
    navigator.clipboard.writeText(cod).then(() => {
      const btn = document.getElementById("btnCopiarCodigo");
      btn.innerHTML = '<i class="fa-solid fa-check"></i>';
      setTimeout(() => { btn.innerHTML = '<i class="fa-regular fa-copy"></i>'; }, 1500);
    });
  });
}

// ── ANUNCIOS ──────────────────────────────────
async function cargarCursosSelect(docenteId) {
  const { data: cursos } = await supabase
    .from("cursos").select("id,nombre").eq("docente_id", docenteId);
  ["anuncioCurso","archivoCurso","tareaCurso"].forEach(selId => {
    const sel = document.getElementById(selId);
    if (!sel) return;
    sel.innerHTML = '<option value="">— Selecciona un curso —</option>';
    cursos?.forEach(c => { sel.innerHTML += `<option value="${c.id}">${c.nombre}</option>`; });
  });
}

async function cargarAnuncios(docenteId) {
  const { data: cursos } = await supabase.from("cursos").select("id").eq("docente_id", docenteId);
  if (!cursos?.length) { document.getElementById("listaAnuncios").innerHTML = "<p class='txt-vacio'>Aún no tienes cursos.</p>"; return; }
  const ids = cursos.map(c => c.id);
  const { data } = await supabase.from("anuncios").select("*, cursos(nombre)").in("curso_id", ids).order("creado_at", { ascending: false });
  const lista = document.getElementById("listaAnuncios");
  if (!data?.length) { lista.innerHTML = "<p class='txt-vacio'>No has publicado anuncios aún.</p>"; return; }
  lista.innerHTML = data.map(a => `
    <div class="anuncio-card">
      <div class="anuncio-header">
        <span class="anuncio-curso"><i class="fa-solid fa-book-open"></i> ${a.cursos?.nombre || "—"}</span>
        <span class="anuncio-fecha">${new Date(a.creado_at).toLocaleDateString("es-PE")}</span>
        <button class="btn-icon btn-delete" data-id="${a.id}"><i class="fa-solid fa-trash"></i></button>
      </div>
      <h4>${a.titulo}</h4>
      <p>${a.contenido}</p>
    </div>`).join("");
  lista.querySelectorAll(".btn-delete").forEach(btn => {
    btn.addEventListener("click", async () => {
      if (!confirm("¿Eliminar este anuncio?")) return;
      await supabase.from("anuncios").delete().eq("id", btn.dataset.id);
      cargarAnuncios(docenteId);
    });
  });
}

function initFormAnuncio(docenteId) {
  document.getElementById("formAnuncio")?.addEventListener("submit", async e => {
    e.preventDefault();
    const titulo    = document.getElementById("anuncioTitulo").value.trim();
    const contenido = document.getElementById("anuncioContenido").value.trim();
    const cursoId   = document.getElementById("anuncioCurso").value;
    if (!titulo || !contenido || !cursoId) { alerta("alertaAnuncio","error","Completa todos los campos."); return; }
    const btn = e.target.querySelector("button[type=submit]");
    btn.disabled = true; btn.textContent = "Publicando...";
    const { error } = await supabase.from("anuncios").insert({ curso_id: cursoId, docente_id: docenteId, titulo, contenido });
    btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-bullhorn"></i> Publicar anuncio';
    if (error) { alerta("alertaAnuncio","error",error.message); return; }
    alerta("alertaAnuncio","ok","✅ Anuncio publicado.");
    e.target.reset();
    setTimeout(() => cargarAnuncios(docenteId), 800);
  });
}

// ── ARCHIVOS ──────────────────────────────────
async function cargarArchivos(docenteId) {
  const { data: cursos } = await supabase.from("cursos").select("id").eq("docente_id", docenteId);
  if (!cursos?.length) { document.getElementById("listaArchivos").innerHTML = "<p class='txt-vacio'>Aún no tienes cursos.</p>"; return; }
  const ids = cursos.map(c => c.id);
  const { data } = await supabase.from("archivos").select("*, cursos(nombre)").in("curso_id", ids).order("creado_at", { ascending: false });
  const lista = document.getElementById("listaArchivos");
  if (!data?.length) { lista.innerHTML = "<p class='txt-vacio'>No has subido archivos aún.</p>"; return; }
  const iconMap = { pdf:"fa-file-pdf", doc:"fa-file-word", docx:"fa-file-word", ppt:"fa-file-powerpoint", pptx:"fa-file-powerpoint", xls:"fa-file-excel", xlsx:"fa-file-excel", mp4:"fa-file-video", mp3:"fa-file-audio", jpg:"fa-file-image", jpeg:"fa-file-image", png:"fa-file-image" };
  lista.innerHTML = data.map(a => {
    const ext = a.nombre_archivo?.split(".").pop()?.toLowerCase() || "";
    const icon = iconMap[ext] || "fa-file";
    return `<div class="archivo-card">
      <div class="archivo-icon"><i class="fa-solid ${icon}"></i></div>
      <div class="archivo-info">
        <span class="archivo-nombre">${a.nombre_archivo}</span>
        <span class="archivo-curso"><i class="fa-solid fa-book-open"></i> ${a.cursos?.nombre || "—"}</span>
        <span class="archivo-fecha">${new Date(a.creado_at).toLocaleDateString("es-PE")}</span>
      </div>
      <div class="archivo-acciones">
        <a href="${a.url}" target="_blank" class="btn-icon"><i class="fa-solid fa-download"></i></a>
        <button class="btn-icon btn-delete" data-id="${a.id}"><i class="fa-solid fa-trash"></i></button>
      </div>
    </div>`;
  }).join("");
  lista.querySelectorAll(".btn-delete").forEach(btn => {
    btn.addEventListener("click", async () => {
      if (!confirm("¿Eliminar este archivo?")) return;
      await supabase.from("archivos").delete().eq("id", btn.dataset.id);
      cargarArchivos(docenteId);
    });
  });
}

function initFormArchivo(docenteId) {
  document.getElementById("formArchivo")?.addEventListener("submit", async e => {
    e.preventDefault();
    const nombre  = document.getElementById("archivoNombre").value.trim();
    const url     = document.getElementById("archivoUrl").value.trim();
    const cursoId = document.getElementById("archivoCurso").value;
    const tipo    = document.getElementById("archivoTipo").value;
    if (!nombre || !url || !cursoId) { alerta("alertaArchivo","error","Completa todos los campos."); return; }
    const btn = e.target.querySelector("button[type=submit]");
    btn.disabled = true; btn.textContent = "Guardando...";
    const { error } = await supabase.from("archivos").insert({ curso_id: cursoId, docente_id: docenteId, nombre_archivo: nombre, url, tipo });
    btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-cloud-arrow-up"></i> Subir archivo';
    if (error) { alerta("alertaArchivo","error",error.message); return; }
    alerta("alertaArchivo","ok","✅ Archivo subido correctamente.");
    e.target.reset();
    setTimeout(() => cargarArchivos(docenteId), 800);
  });
}

// ── TAREAS ────────────────────────────────────
async function cargarTareas(docenteId) {
  const { data: cursos } = await supabase.from("cursos").select("id").eq("docente_id", docenteId);
  if (!cursos?.length) { document.getElementById("listaTareas").innerHTML = "<p class='txt-vacio'>Aún no tienes cursos.</p>"; return; }
  const ids = cursos.map(c => c.id);
  const { data } = await supabase.from("tareas").select("*, cursos(nombre)").in("curso_id", ids).order("creado_at", { ascending: false });
  const lista = document.getElementById("listaTareas");
  if (!data?.length) { lista.innerHTML = "<p class='txt-vacio'>No has creado tareas aún.</p>"; return; }
  const hoy = new Date();
  lista.innerHTML = data.map(t => {
    const vence   = t.fecha_entrega ? new Date(t.fecha_entrega).toLocaleDateString("es-PE") : "Sin fecha límite";
    const vencida = t.fecha_entrega && new Date(t.fecha_entrega) < hoy;
    return `<div class="tarea-card ${vencida ? "tarea-vencida" : ""}">
      <div class="tarea-header">
        <span class="anuncio-curso"><i class="fa-solid fa-book-open"></i> ${t.cursos?.nombre || "—"}</span>
        <span class="tarea-fecha ${vencida ? "vencida" : ""}"><i class="fa-solid fa-clock"></i> ${vence}</span>
        <button class="btn-icon btn-delete" data-id="${t.id}"><i class="fa-solid fa-trash"></i></button>
      </div>
      <h4>${t.titulo}</h4>
      <p>${t.descripcion || ""}</p>
      ${t.puntos ? `<span class="tarea-puntos"><i class="fa-solid fa-star"></i> ${t.puntos} pts</span>` : ""}
    </div>`;
  }).join("");
  lista.querySelectorAll(".btn-delete").forEach(btn => {
    btn.addEventListener("click", async () => {
      if (!confirm("¿Eliminar esta tarea?")) return;
      await supabase.from("tareas").delete().eq("id", btn.dataset.id);
      cargarTareas(docenteId);
    });
  });
}

function initFormTarea(docenteId) {
  document.getElementById("formTarea")?.addEventListener("submit", async e => {
    e.preventDefault();
    const titulo      = document.getElementById("tareaTitulo").value.trim();
    const descripcion = document.getElementById("tareaDesc").value.trim();
    const cursoId     = document.getElementById("tareaCurso").value;
    const fecha       = document.getElementById("tareaFecha").value;
    const puntos      = document.getElementById("tareaPuntos").value;
    if (!titulo || !cursoId) { alerta("alertaTarea","error","Título y curso son obligatorios."); return; }
    const btn = e.target.querySelector("button[type=submit]");
    btn.disabled = true; btn.textContent = "Creando...";
    const { error } = await supabase.from("tareas").insert({ curso_id: cursoId, docente_id: docenteId, titulo, descripcion, fecha_entrega: fecha || null, puntos: puntos || null });
    btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-plus"></i> Crear tarea';
    if (error) { alerta("alertaTarea","error",error.message); return; }
    alerta("alertaTarea","ok","✅ Tarea creada correctamente.");
    e.target.reset();
    setTimeout(() => cargarTareas(docenteId), 800);
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
      if (errPass) { alerta("alertaPerfil","error",errPass.message); btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Guardar cambios'; return; }
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
  toggle?.addEventListener("click", () => { sidebar.classList.toggle("sidebar-open"); overlay.classList.toggle("visible"); });
  overlay?.addEventListener("click", () => { sidebar.classList.remove("sidebar-open"); overlay.classList.remove("visible"); });
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
    cargarEstudiantes(),
    cargarTablaEstudiantes(),
    cargarCursosSelect(perfil.id),
    cargarAnuncios(perfil.id),
    cargarArchivos(perfil.id),
    cargarTareas(perfil.id),
  ]);

  initTabs();
  initFormCurso(perfil.id);
  initEliminarCurso(perfil.id);
  initCopiarCodigo();
  initFormPerfil(user, perfil);
  initFormAnuncio(perfil.id);
  initFormArchivo(perfil.id);
  initFormTarea(perfil.id);
  initSidebarMobile();

  document.querySelectorAll(".nav-item").forEach(btn => {
    btn.addEventListener("click", () => mostrarVista(btn.dataset.vista));
  });
  document.getElementById("btnVolver")?.addEventListener("click", () => mostrarVista("cursos"));
  document.getElementById("btnCerrar")?.addEventListener("click", async () => {
    await supabase.auth.signOut();
    window.location.href = "/index.html";
  });
});
