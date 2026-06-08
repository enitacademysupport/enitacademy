import { supabase } from "./supabase.js";

// ── Verificar sesión ──────────────────────────
async function verificarSesion() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) { window.location.replace("/index.html"); return null; }

  const { data: perfil } = await supabase
    .from("perfiles").select("*").eq("id", session.user.id).single();

  if (!perfil) { window.location.replace("/index.html"); return null; }
  if (perfil.rol !== "docente") { window.location.replace("/paginas/panel_estudiante.html"); return null; }

  return { usuario: session.user, perfil };
}

// ── Helpers ───────────────────────────────────
function generarCodigo() {
  const letras = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 8 }, () => letras[Math.floor(Math.random() * letras.length)]).join("");
}

function mostrarAlerta(id, tipo, msg) {
  const el = document.getElementById(id);
  if (!el) return;
  el.className = `alerta alerta-${tipo}`;
  el.innerHTML = `<i class="fa-solid ${tipo === "ok" ? "fa-circle-check" : "fa-circle-exclamation"}"></i> ${msg}`;
}

function limpiarAlerta(id) {
  const el = document.getElementById(id);
  if (el) { el.className = "alerta"; el.innerHTML = ""; }
}

function mostrarVista(nombre) {
  document.querySelectorAll(".vista").forEach(v => v.classList.add("oculto"));
  document.getElementById("vista-" + nombre)?.classList.remove("oculto");
  document.querySelectorAll(".nav-btn").forEach(b => b.classList.toggle("activo", b.dataset.vista === nombre));
  document.querySelector(".panel-sidebar")?.classList.remove("sidebar-abierto");
  document.getElementById("fondoSidebar")?.classList.remove("visible");
}

function activarPestana(nombre) {
  document.querySelectorAll(".pestana-btn").forEach(b => b.classList.toggle("activa", b.dataset.pestana === nombre));
  document.querySelectorAll(".pestana-panel").forEach(p => p.classList.toggle("oculto", p.dataset.panel !== nombre));
}

// ── Cursos ────────────────────────────────────
let cursoActual = null;

async function cargarCursos(docenteId) {
  const { data: cursos } = await supabase
    .from("cursos").select("*").eq("docente_id", docenteId)
    .order("creado_at", { ascending: false });

  const contenedor = document.getElementById("listaCursos");
  const sinDatos   = document.getElementById("msgSinCursos");
  contenedor.innerHTML = "";

  if (!cursos?.length) { contenedor.appendChild(sinDatos); sinDatos.style.display = "block"; return; }
  sinDatos.style.display = "none";

  cursos.forEach(c => {
    const tarjeta = document.createElement("div");
    tarjeta.className = "tarjeta-curso";
    tarjeta.innerHTML = `
      <div class="tarjeta-top">
        <span class="etiqueta-nivel nivel-${c.nivel}">${c.nivel || "—"}</span>
        <span class="codigo-texto"><i class="fa-solid fa-key"></i> ${c.codigo}</span>
      </div>
      <h3>${c.nombre}</h3>
      <p>${c.descripcion || "Sin descripción"}</p>
      <button class="btn-ver-curso">Abrir curso <i class="fa-solid fa-arrow-right"></i></button>
    `;
    tarjeta.querySelector(".btn-ver-curso").addEventListener("click", () => abrirCurso(c));
    contenedor.appendChild(tarjeta);
  });
}

async function abrirCurso(curso) {
  cursoActual = curso;
  document.getElementById("cursoTitulo").textContent = curso.nombre;
  document.getElementById("cursoCodigo").textContent = curso.codigo;
  document.getElementById("cursoDesc").textContent   = curso.descripcion || "";
  const nivelEl = document.getElementById("cursoNivel");
  nivelEl.textContent = curso.nivel || "";
  nivelEl.className   = `etiqueta-nivel nivel-${curso.nivel}`;

  await Promise.all([
    cargarAlumnosDelCurso(curso.id),
    cargarAnunciosDelCurso(curso.id),
    cargarArchivosDelCurso(curso.id),
    cargarTareasDelCurso(curso.id),
  ]);

  activarPestana("alumnos");
  mostrarVista("detalle");
}

// ── Alumnos ───────────────────────────────────
async function cargarAlumnosDelCurso(cursoId) {
  const { data } = await supabase
    .from("inscripciones")
    .select("estudiante_id, perfiles(id, nombre, apellido)")
    .eq("curso_id", cursoId);

  const lista = document.getElementById("listaAlumnosCurso");
  lista.innerHTML = data?.length
    ? data.map(i => `
        <div class="fila-alumno">
          <div class="icono-alumno"><i class="fa-solid fa-user-graduate"></i></div>
          <span>${i.perfiles.nombre} ${i.perfiles.apellido}</span>
          <button class="btn-ver-alumno btn-icono" data-id="${i.perfiles.id}" data-nombre="${i.perfiles.nombre} ${i.perfiles.apellido}" title="Ver archivos">
            <i class="fa-solid fa-folder-open"></i>
          </button>
        </div>`).join("")
    : "<p class='sin-datos'>Sin alumnos inscritos aún.</p>";

  lista.querySelectorAll(".btn-ver-alumno").forEach(btn => {
    btn.addEventListener("click", () => verArchivosAlumno(btn.dataset.id, btn.dataset.nombre));
  });
}

async function verArchivosAlumno(estudianteId, nombre) {
  const { data } = await supabase
    .from("archivos_estudiante")
    .select("*, cursos(nombre)")
    .eq("estudiante_id", estudianteId)
    .order("creado_at", { ascending: false });

  const modal = document.getElementById("modalArchivosAlumno");
  document.getElementById("modalAlumnoNombre").textContent = nombre;

  const lista = document.getElementById("modalListaArchivos");
  lista.innerHTML = data?.length
    ? data.map(a => `
        <div class="tarjeta-archivo">
          <i class="fa-solid fa-file icono-archivo"></i>
          <div class="info-archivo">
            <span class="nombre-archivo">${a.nombre}</span>
            <span class="texto-curso"><i class="fa-solid fa-book-open"></i> ${a.cursos?.nombre || "—"}</span>
            <span class="fecha-texto">${new Date(a.creado_at).toLocaleDateString("es-PE")}</span>
          </div>
          <a href="${a.url}" target="_blank" class="btn-icono"><i class="fa-solid fa-download"></i></a>
        </div>`).join("")
    : "<p class='sin-datos'>Este estudiante no ha subido archivos.</p>";

  modal.style.display = "flex";
}

// ── Anuncios ──────────────────────────────────
async function cargarAnunciosDelCurso(cursoId) {
  const { data } = await supabase
    .from("anuncios").select("*").eq("curso_id", cursoId)
    .order("creado_at", { ascending: false });

  const lista = document.getElementById("listaAnunciosCurso");
  lista.innerHTML = data?.length
    ? data.map(a => `
        <div class="tarjeta-anuncio">
          <div class="anuncio-cabecera">
            <h4>${a.titulo}</h4>
            <span class="fecha-texto">${new Date(a.creado_at).toLocaleDateString("es-PE")}</span>
            <button class="btn-icono btn-eliminar" data-id="${a.id}" data-tabla="anuncios">
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
          <p>${a.contenido}</p>
        </div>`).join("")
    : "<p class='sin-datos'>No hay anuncios en este curso.</p>";

  lista.querySelectorAll(".btn-eliminar").forEach(btn => {
    btn.addEventListener("click", () => eliminarItem(btn.dataset.tabla, btn.dataset.id, () => cargarAnunciosDelCurso(cursoId)));
  });
}

async function publicarAnuncio(docenteId) {
  const titulo    = document.getElementById("anuncioTitulo").value.trim();
  const contenido = document.getElementById("anuncioContenido").value.trim();
  if (!titulo || !contenido) { mostrarAlerta("alertaAnuncio", "error", "Completa título y contenido."); return; }

  const { error } = await supabase.from("anuncios").insert({ curso_id: cursoActual.id, docente_id: docenteId, titulo, contenido });
  if (error) { mostrarAlerta("alertaAnuncio", "error", error.message); return; }

  mostrarAlerta("alertaAnuncio", "ok", "Anuncio publicado.");
  document.getElementById("anuncioTitulo").value    = "";
  document.getElementById("anuncioContenido").value = "";
  setTimeout(() => cargarAnunciosDelCurso(cursoActual.id), 800);
}

// ── Archivos ──────────────────────────────────
const ICONOS = { pdf:"fa-file-pdf", doc:"fa-file-word", docx:"fa-file-word", ppt:"fa-file-powerpoint", pptx:"fa-file-powerpoint", mp4:"fa-file-video", mp3:"fa-file-audio", jpg:"fa-file-image", jpeg:"fa-file-image", png:"fa-file-image" };

async function cargarArchivosDelCurso(cursoId) {
  const { data } = await supabase
    .from("archivos").select("*").eq("curso_id", cursoId)
    .order("creado_at", { ascending: false });

  const lista = document.getElementById("listaArchivosCurso");
  lista.innerHTML = data?.length
    ? data.map(a => {
        const ext  = a.nombre_archivo?.split(".").pop()?.toLowerCase() || "";
        const icon = ICONOS[ext] || "fa-file";
        return `<div class="tarjeta-archivo">
          <i class="fa-solid ${icon} icono-archivo"></i>
          <div class="info-archivo">
            <span class="nombre-archivo">${a.nombre_archivo}</span>
            <span class="fecha-texto">${new Date(a.creado_at).toLocaleDateString("es-PE")}</span>
          </div>
          <div class="acciones-archivo">
            <a href="${a.url}" target="_blank" class="btn-icono"><i class="fa-solid fa-download"></i></a>
            <button class="btn-icono btn-eliminar" data-id="${a.id}" data-tabla="archivos"><i class="fa-solid fa-trash"></i></button>
          </div>
        </div>`;
      }).join("")
    : "<p class='sin-datos'>No hay archivos en este curso.</p>";

  lista.querySelectorAll(".btn-eliminar").forEach(btn => {
    btn.addEventListener("click", () => eliminarItem(btn.dataset.tabla, btn.dataset.id, () => cargarArchivosDelCurso(cursoId)));
  });
}

async function subirArchivo(docenteId) {
  const nombre = document.getElementById("archivoNombre").value.trim();
  const url    = document.getElementById("archivoUrl").value.trim();
  if (!nombre || !url) { mostrarAlerta("alertaArchivo", "error", "Completa nombre y enlace."); return; }

  const { error } = await supabase.from("archivos").insert({ curso_id: cursoActual.id, docente_id: docenteId, nombre_archivo: nombre, url });
  if (error) { mostrarAlerta("alertaArchivo", "error", error.message); return; }

  mostrarAlerta("alertaArchivo", "ok", "Archivo agregado.");
  document.getElementById("archivoNombre").value = "";
  document.getElementById("archivoUrl").value    = "";
  setTimeout(() => cargarArchivosDelCurso(cursoActual.id), 800);
}

// ── Tareas ────────────────────────────────────
async function cargarTareasDelCurso(cursoId) {
  const { data } = await supabase
    .from("tareas").select("*").eq("curso_id", cursoId)
    .order("fecha_entrega", { ascending: true, nullsFirst: false });

  const lista = document.getElementById("listaTareasCurso");
  const hoy   = new Date();

  if (!data?.length) { lista.innerHTML = "<p class='sin-datos'>No hay tareas en este curso.</p>"; return; }

  const tareasConEntregas = await Promise.all(data.map(async t => {
    const { count }        = await supabase.from("entregas").select("id", { count: "exact", head: true }).eq("tarea_id", t.id);
    const { count: noVistas } = await supabase.from("entregas").select("id", { count: "exact", head: true }).eq("tarea_id", t.id).eq("visto", false);
    return { ...t, totalEntregas: count || 0, noVistas: noVistas || 0 };
  }));

  lista.innerHTML = tareasConEntregas.map(t => {
    const vence   = t.fecha_entrega ? new Date(t.fecha_entrega).toLocaleDateString("es-PE") : "Sin fecha";
    const vencida = t.fecha_entrega && new Date(t.fecha_entrega) < hoy;
    return `
      <div class="tarjeta-tarea ${vencida ? "tarea-vencida" : ""}">
        <div class="tarea-cabecera">
          <h4>${t.titulo}</h4>
          <span class="fecha-texto ${vencida ? "texto-vencido" : ""}">
            <i class="fa-solid fa-clock"></i> ${vence}
          </span>
          <button class="btn-icono btn-eliminar" data-id="${t.id}" data-tabla="tareas">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
        ${t.descripcion ? `<p>${t.descripcion}</p>` : ""}
        ${t.puntos ? `<span class="puntos-badge"><i class="fa-solid fa-star"></i> ${t.puntos} pts</span>` : ""}
        <div class="entregas-resumen">
          <span class="entregas-total"><i class="fa-solid fa-paper-plane"></i> ${t.totalEntregas} entregas</span>
          ${t.noVistas > 0 ? `<span class="entregas-nuevas"><i class="fa-solid fa-circle-exclamation"></i> ${t.noVistas} sin revisar</span>` : ""}
          <button class="btn-ver-entregas btn-pequeno" data-id="${t.id}" data-titulo="${t.titulo}">Ver entregas</button>
        </div>
      </div>`;
  }).join("");

  lista.querySelectorAll(".btn-eliminar").forEach(btn => {
    btn.addEventListener("click", () => eliminarItem(btn.dataset.tabla, btn.dataset.id, () => cargarTareasDelCurso(cursoId)));
  });
  lista.querySelectorAll(".btn-ver-entregas").forEach(btn => {
    btn.addEventListener("click", () => verEntregas(btn.dataset.id, btn.dataset.titulo));
  });
}

async function verEntregas(tareaId, titulo) {
  const { data } = await supabase
    .from("entregas")
    .select("*, perfiles(nombre, apellido)")
    .eq("tarea_id", tareaId)
    .order("entregado_at", { ascending: false });

  const modal = document.getElementById("modalEntregas");
  document.getElementById("modalEntregasTitulo").textContent = titulo;

  const lista = document.getElementById("modalListaEntregas");
  lista.innerHTML = data?.length
    ? data.map(e => `
        <div class="tarjeta-entrega ${!e.visto ? "entrega-nueva" : ""}">
          <div class="entrega-cabecera">
            <div class="icono-alumno"><i class="fa-solid fa-user-graduate"></i></div>
            <div>
              <strong>${e.perfiles.nombre} ${e.perfiles.apellido}</strong>
              <span class="fecha-texto">${new Date(e.entregado_at).toLocaleDateString("es-PE")}</span>
            </div>
            ${!e.visto ? '<span class="badge-nueva">Nueva</span>' : '<span class="badge-vista">Revisada</span>'}
            <button class="btn-marcar-visto btn-pequeno ${e.visto ? "oculto" : ""}" data-id="${e.id}">Marcar revisada</button>
          </div>
          ${e.comentario ? `<p class="entrega-comentario">${e.comentario}</p>` : ""}
          ${e.url_archivo ? `<a href="${e.url_archivo}" target="_blank" class="btn-icono btn-descargar"><i class="fa-solid fa-download"></i> Descargar entrega</a>` : ""}
        </div>`).join("")
    : "<p class='sin-datos'>Ningún estudiante ha entregado aún.</p>";

  lista.querySelectorAll(".btn-marcar-visto").forEach(btn => {
    btn.addEventListener("click", async () => {
      await supabase.from("entregas").update({ visto: true }).eq("id", btn.dataset.id);
      verEntregas(tareaId, titulo);
    });
  });

  modal.style.display = "flex";
}

async function crearTarea(docenteId) {
  const titulo = document.getElementById("tareaTitulo").value.trim();
  const desc   = document.getElementById("tareaDesc").value.trim();
  const fecha  = document.getElementById("tareaFecha").value;
  const puntos = document.getElementById("tareaPuntos").value;
  if (!titulo) { mostrarAlerta("alertaTarea", "error", "El título es obligatorio."); return; }

  const { error } = await supabase.from("tareas").insert({
    curso_id: cursoActual.id, docente_id: docenteId,
    titulo, descripcion: desc, fecha_entrega: fecha || null, puntos: puntos || null
  });
  if (error) { mostrarAlerta("alertaTarea", "error", error.message); return; }

  mostrarAlerta("alertaTarea", "ok", "Tarea creada.");
  ["tareaTitulo","tareaDesc","tareaFecha","tareaPuntos"].forEach(id => { document.getElementById(id).value = ""; });
  setTimeout(() => cargarTareasDelCurso(cursoActual.id), 800);
}

// ── Eliminar genérico ─────────────────────────
async function eliminarItem(tabla, id, callback) {
  if (!confirm("¿Eliminar este elemento?")) return;
  await supabase.from(tabla).delete().eq("id", id);
  callback();
}

// ── Estudiantes ───────────────────────────────
async function cargarEstudiantes() {
  const { data } = await supabase.from("perfiles").select("id,nombre,apellido").eq("rol","estudiante").order("nombre");
  const lista = document.getElementById("listaCheckEstudiantes");
  if (!lista) return;
  if (!data?.length) { lista.innerHTML = "<p class='sin-datos'>No hay estudiantes registrados.</p>"; return; }

  lista.innerHTML = data.map(e => `
    <label class="item-check">
      <input type="checkbox" value="${e.id}">
      <div class="icono-check"><i class="fa-solid fa-user-graduate"></i></div>
      <span>${e.nombre} ${e.apellido}</span>
    </label>`).join("");

  document.getElementById("buscarEstudiante")?.addEventListener("input", ev => {
    const q = ev.target.value.toLowerCase();
    lista.querySelectorAll(".item-check").forEach(item => {
      item.style.display = item.querySelector("span").textContent.toLowerCase().includes(q) ? "" : "none";
    });
  });
}

async function cargarTablaEstudiantes() {
  const { data } = await supabase.from("perfiles").select("id,nombre,apellido,creado_at").eq("rol","estudiante").order("nombre");
  const tabla  = document.getElementById("tablaEstudiantes");
  const filtro = document.getElementById("buscarTablaEstudiante");
  if (!tabla) return;
  if (!data?.length) { tabla.innerHTML = "<p class='sin-datos'>No hay estudiantes aún.</p>"; return; }

  function dibujar(lista) {
    tabla.innerHTML = `
      <div class="fila-tabla fila-encabezado">
        <span>Nombre</span><span>Apellido</span><span>Desde</span>
      </div>
      ${lista.map(e => `
        <div class="fila-tabla">
          <span><i class="fa-solid fa-user-graduate"></i> ${e.nombre}</span>
          <span>${e.apellido}</span>
          <span>${new Date(e.creado_at).toLocaleDateString("es-PE")}</span>
        </div>`).join("")}`;
  }
  dibujar(data);
  filtro?.addEventListener("input", ev => {
    const q = ev.target.value.toLowerCase();
    dibujar(data.filter(e => `${e.nombre} ${e.apellido}`.toLowerCase().includes(q)));
  });
}

// ── Crear curso ───────────────────────────────
function initFormCurso(docenteId) {
  document.getElementById("formCrearCurso")?.addEventListener("submit", async e => {
    e.preventDefault();
    limpiarAlerta("alertaCrearCurso");

    const nombre = document.getElementById("cNombre").value.trim();
    const desc   = document.getElementById("cDesc").value.trim();
    const nivel  = document.getElementById("cNivel").value;

    document.getElementById("errCNombre").textContent = "";
    document.getElementById("errCNivel").textContent  = "";

    let valido = true;
    if (!nombre) { document.getElementById("errCNombre").textContent = "Nombre obligatorio."; valido = false; }
    if (!nivel)  { document.getElementById("errCNivel").textContent  = "Selecciona un nivel."; valido = false; }
    if (!valido) return;

    const btn = e.target.querySelector("button[type=submit]");
    btn.disabled = true; btn.textContent = "Guardando...";

    const codigo = generarCodigo();
    const { data: curso, error } = await supabase
      .from("cursos")
      .insert({ docente_id: docenteId, nombre, descripcion: desc, nivel, codigo })
      .select().single();

    btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Guardar curso';

    if (error) { mostrarAlerta("alertaCrearCurso", "error", error.message); return; }

    const seleccionados = [...document.querySelectorAll("#listaCheckEstudiantes input:checked")].map(c => c.value);
    if (seleccionados.length) {
      await supabase.from("inscripciones").insert(seleccionados.map(sid => ({ curso_id: curso.id, estudiante_id: sid })));
    }

    mostrarAlerta("alertaCrearCurso", "ok", `Curso creado. Código: ${codigo}`);
    e.target.reset();
    document.querySelectorAll("#listaCheckEstudiantes input").forEach(c => c.checked = false);
    setTimeout(() => { cargarCursos(docenteId); mostrarVista("cursos"); }, 1800);
  });
}

// ── Eliminar curso ────────────────────────────
function initEliminarCurso(docenteId) {
  document.getElementById("btnEliminarCurso")?.addEventListener("click", async () => {
    if (!cursoActual) return;
    if (!confirm(`¿Eliminar "${cursoActual.nombre}"? No se puede deshacer.`)) return;
    await supabase.from("cursos").delete().eq("id", cursoActual.id);
    cursoActual = null;
    await cargarCursos(docenteId);
    mostrarVista("cursos");
  });
}

// ── Copiar código ─────────────────────────────
function initCopiarCodigo() {
  document.getElementById("btnCopiarCodigo")?.addEventListener("click", () => {
    navigator.clipboard.writeText(document.getElementById("cursoCodigo").textContent).then(() => {
      const btn = document.getElementById("btnCopiarCodigo");
      btn.innerHTML = '<i class="fa-solid fa-check"></i>';
      setTimeout(() => { btn.innerHTML = '<i class="fa-regular fa-copy"></i>'; }, 1500);
    });
  });
}

// ── Modales ───────────────────────────────────
function initModales() {
  document.querySelectorAll(".modal-fondo").forEach(modal => {
    modal.addEventListener("click", e => { if (e.target === modal) modal.style.display = "none"; });
  });
  document.querySelectorAll(".btn-cerrar-modal").forEach(btn => {
    btn.addEventListener("click", () => { btn.closest(".modal-fondo").style.display = "none"; });
  });
}

// ── Perfil ────────────────────────────────────
function initFormPerfil(usuario, perfil) {
  document.getElementById("pNombre").value   = perfil.nombre   || "";
  document.getElementById("pApellido").value = perfil.apellido || "";
  document.getElementById("pEmail").value    = usuario.email   || "";
  document.getElementById("perfilDesde").textContent =
    "Miembro desde " + new Date(perfil.creado_at).toLocaleDateString("es-PE", { year: "numeric", month: "long" });

  document.querySelector(".btn-ojo")?.addEventListener("click", function() {
    const input = document.getElementById(this.dataset.objetivo);
    const ver   = input.type === "password";
    input.type  = ver ? "text" : "password";
    this.querySelector("i").className = ver ? "fa-regular fa-eye-slash" : "fa-regular fa-eye";
  });

  document.getElementById("formPerfil")?.addEventListener("submit", async e => {
    e.preventDefault();
    limpiarAlerta("alertaPerfil");

    const nombre   = document.getElementById("pNombre").value.trim();
    const apellido = document.getElementById("pApellido").value.trim();
    const clave    = document.getElementById("pClave").value;

    document.getElementById("errPNombre").textContent   = "";
    document.getElementById("errPApellido").textContent = "";
    document.getElementById("errPClave").textContent    = "";

    let valido = true;
    if (!nombre)   { document.getElementById("errPNombre").textContent   = "Nombre obligatorio.";   valido = false; }
    if (!apellido) { document.getElementById("errPApellido").textContent = "Apellido obligatorio."; valido = false; }
    if (clave && clave.length < 6) { document.getElementById("errPClave").textContent = "Mínimo 6 caracteres."; valido = false; }
    if (!valido) return;

    const btn = e.target.querySelector("button[type=submit]");
    btn.disabled = true; btn.textContent = "Guardando...";

    await supabase.from("perfiles").update({ nombre, apellido }).eq("id", usuario.id);
    await supabase.auth.updateUser({ data: { nombre, apellido } });

    if (clave) {
      const { error } = await supabase.auth.updateUser({ password: clave });
      if (error) {
        mostrarAlerta("alertaPerfil", "error", error.message);
        btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Guardar cambios';
        return;
      }
    }

    btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Guardar cambios';
    document.getElementById("sideNombre").textContent = `${nombre} ${apellido}`;
    document.getElementById("pClave").value = "";
    mostrarAlerta("alertaPerfil", "ok", "Perfil actualizado.");
  });
}

// ── Sidebar móvil ─────────────────────────────
function initSidebarMovil() {
  const btn     = document.getElementById("btnAbrirSidebar");
  const sidebar = document.querySelector(".panel-sidebar");
  const fondo   = document.getElementById("fondoSidebar");
  btn?.addEventListener("click",   () => { sidebar?.classList.toggle("sidebar-abierto"); fondo?.classList.toggle("visible"); });
  fondo?.addEventListener("click", () => { sidebar?.classList.remove("sidebar-abierto"); fondo?.classList.remove("visible"); });
}

// ── INICIO ────────────────────────────────────
window.addEventListener("DOMContentLoaded", async () => {
  const sesion = await verificarSesion();
  if (!sesion) return;

  const { usuario, perfil } = sesion;
  document.getElementById("sideNombre").textContent = `${perfil.nombre} ${perfil.apellido}`;

  await Promise.all([
    cargarCursos(perfil.id),
    cargarEstudiantes(),
    cargarTablaEstudiantes(),
  ]);

  initFormCurso(perfil.id);
  initEliminarCurso(perfil.id);
  initCopiarCodigo();
  initFormPerfil(usuario, perfil);
  initSidebarMovil();
  initModales();

  document.querySelectorAll(".nav-btn").forEach(btn => {
    btn.addEventListener("click", () => mostrarVista(btn.dataset.vista));
  });
  document.querySelectorAll(".pestana-btn").forEach(btn => {
    btn.addEventListener("click", () => activarPestana(btn.dataset.pestana));
  });

  document.getElementById("btnVolverCursos")?.addEventListener("click", () => mostrarVista("cursos"));
  document.getElementById("btnPublicarAnuncio")?.addEventListener("click", () => publicarAnuncio(perfil.id));
  document.getElementById("btnSubirArchivo")?.addEventListener("click",    () => subirArchivo(perfil.id));
  document.getElementById("btnCrearTarea")?.addEventListener("click",      () => crearTarea(perfil.id));

  document.getElementById("btnCerrarSesion2")?.addEventListener("click", async () => {
    await supabase.auth.signOut();
    window.location.href = "/index.html";
  });
});