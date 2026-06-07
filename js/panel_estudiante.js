import { supabase } from "./supabase.js";

// ── Verificar sesión ──────────────────────────
async function verificarSesion() {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) { window.location.replace("/index.html"); return null; }

  const { data: perfil } = await supabase
    .from("perfiles").select("*").eq("id", session.user.id).single();

  if (!perfil) { window.location.replace("/index.html"); return null; }
  if (perfil.rol !== "estudiante") { window.location.replace("/paginas/panel_docente.html"); return null; }

  return { usuario: session.user, perfil };
}

// ── Helpers ───────────────────────────────────
function mostrarAlerta(idElemento, tipo, mensaje) {
  const el = document.getElementById(idElemento);
  if (!el) return;
  el.className = `alerta alerta-${tipo}`;
  el.innerHTML = `<i class="fa-solid ${tipo === "ok" ? "fa-circle-check" : "fa-circle-exclamation"}"></i> ${mensaje}`;
}
function limpiarAlerta(idElemento) {
  const el = document.getElementById(idElemento);
  if (el) { el.className = "alerta"; el.innerHTML = ""; }
}

function mostrarVista(nombre) {
  document.querySelectorAll(".vista").forEach(v => v.classList.add("oculto"));
  document.getElementById("vista-" + nombre)?.classList.remove("oculto");
  document.querySelectorAll(".nav-btn").forEach(b => b.classList.toggle("activo", b.dataset.vista === nombre));
  document.querySelector(".panel-sidebar")?.classList.remove("sidebar-abierto");
  document.getElementById("fondoSidebar")?.classList.remove("visible");
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

// ── Cursos inscritos ──────────────────────────
let misCursos = [];

async function cargarCursos(estudianteId) {
  const { data } = await supabase
    .from("inscripciones")
    .select("inscrito_at, cursos(id,nombre,descripcion,nivel,codigo,perfiles(nombre,apellido))")
    .eq("estudiante_id", estudianteId)
    .order("inscrito_at", { ascending: false });

  misCursos = data?.map(d => d.cursos) || [];

  const contenedor = document.getElementById("listaCursos");
  const sinDatos   = document.getElementById("msgSinCursos");
  contenedor.innerHTML = "";

  if (!data?.length) { contenedor.appendChild(sinDatos); sinDatos.style.display = "block"; return; }
  sinDatos.style.display = "none";

  data.forEach(({ cursos: c, inscrito_at }) => {
    const tarjeta = document.createElement("div");
    tarjeta.className = "tarjeta-curso";
    tarjeta.innerHTML = `
      <div class="tarjeta-top">
        <span class="etiqueta-nivel nivel-${c.nivel}">${c.nivel || "—"}</span>
        <span class="fecha-texto">${new Date(inscrito_at).toLocaleDateString("es-PE")}</span>
      </div>
      <h3>${c.nombre}</h3>
      <p>${c.descripcion || "Sin descripción"}</p>
      <div class="tarjeta-pie">
        <span class="texto-docente">
          <i class="fa-solid fa-chalkboard-teacher"></i>
          ${c.perfiles?.nombre ?? ""} ${c.perfiles?.apellido ?? ""}
        </span>
      </div>
    `;
    contenedor.appendChild(tarjeta);
  });

  // Poblar filtros
  ["filtroAnuncios","filtroArchivos","filtroTareas"].forEach(id => {
    const sel = document.getElementById(id);
    if (!sel) return;
    sel.innerHTML = '<option value="">Todos los cursos</option>';
    misCursos.forEach(c => { sel.innerHTML += `<option value="${c.id}">${c.nombre}</option>`; });
  });
}

// ── Anuncios ──────────────────────────────────
let todosAnuncios = [];

async function cargarAnuncios(estudianteId) {
  const { data: inscripciones } = await supabase.from("inscripciones").select("curso_id").eq("estudiante_id", estudianteId);
  if (!inscripciones?.length) { dibujarAnuncios([]); return; }

  const ids = inscripciones.map(i => i.curso_id);
  const { data } = await supabase.from("anuncios").select("*, cursos(nombre)").in("curso_id", ids).order("creado_at", { ascending: false });
  todosAnuncios = data || [];
  dibujarAnuncios(todosAnuncios);
}

function dibujarAnuncios(lista) {
  const el = document.getElementById("listaAnuncios");
  if (!lista.length) { el.innerHTML = "<p class='sin-datos'>No hay anuncios por ahora.</p>"; return; }
  el.innerHTML = lista.map(a => `
    <div class="tarjeta-anuncio">
      <div class="anuncio-cabecera">
        <span class="texto-curso"><i class="fa-solid fa-book-open"></i> ${a.cursos?.nombre || "—"}</span>
        <span class="fecha-texto">${new Date(a.creado_at).toLocaleDateString("es-PE")}</span>
      </div>
      <h4>${a.titulo}</h4>
      <p>${a.contenido}</p>
    </div>`).join("");
}

// ── Archivos ──────────────────────────────────
let todosArchivos = [];
const ICONOS = { pdf:"fa-file-pdf", doc:"fa-file-word", docx:"fa-file-word", ppt:"fa-file-powerpoint", pptx:"fa-file-powerpoint", mp4:"fa-file-video", mp3:"fa-file-audio", jpg:"fa-file-image", jpeg:"fa-file-image", png:"fa-file-image" };

async function cargarArchivos(estudianteId) {
  const { data: inscripciones } = await supabase.from("inscripciones").select("curso_id").eq("estudiante_id", estudianteId);
  if (!inscripciones?.length) { dibujarArchivos([]); return; }

  const ids = inscripciones.map(i => i.curso_id);
  const { data } = await supabase.from("archivos").select("*, cursos(nombre)").in("curso_id", ids).order("creado_at", { ascending: false });
  todosArchivos = data || [];
  dibujarArchivos(todosArchivos);
}

function dibujarArchivos(lista) {
  const el = document.getElementById("listaArchivos");
  if (!lista.length) { el.innerHTML = "<p class='sin-datos'>No hay archivos disponibles aún.</p>"; return; }
  el.innerHTML = lista.map(a => {
    const ext  = a.nombre_archivo?.split(".").pop()?.toLowerCase() || "";
    const icon = ICONOS[ext] || "fa-file";
    return `<div class="tarjeta-archivo">
      <i class="fa-solid ${icon} icono-archivo"></i>
      <div class="info-archivo">
        <span class="nombre-archivo">${a.nombre_archivo}</span>
        <span class="texto-curso"><i class="fa-solid fa-book-open"></i> ${a.cursos?.nombre || "—"}</span>
        <span class="fecha-texto">${new Date(a.creado_at).toLocaleDateString("es-PE")}</span>
      </div>
      <a href="${a.url}" target="_blank" class="btn-icono" title="Descargar"><i class="fa-solid fa-download"></i></a>
    </div>`;
  }).join("");
}

// ── Tareas ────────────────────────────────────
let todasTareas = [];

async function cargarTareas(estudianteId) {
  const { data: inscripciones } = await supabase.from("inscripciones").select("curso_id").eq("estudiante_id", estudianteId);
  if (!inscripciones?.length) { dibujarTareas([]); return; }

  const ids = inscripciones.map(i => i.curso_id);
  const { data } = await supabase.from("tareas").select("*, cursos(nombre)").in("curso_id", ids).order("fecha_entrega", { ascending: true, nullsFirst: false });
  todasTareas = data || [];
  dibujarTareas(todasTareas);
}

function dibujarTareas(lista) {
  const el  = document.getElementById("listaTareas");
  const hoy = new Date();
  if (!lista.length) { el.innerHTML = "<p class='sin-datos'>No hay tareas asignadas aún.</p>"; return; }
  el.innerHTML = lista.map(t => {
    const vence   = t.fecha_entrega ? new Date(t.fecha_entrega).toLocaleDateString("es-PE") : "Sin fecha";
    const vencida = t.fecha_entrega && new Date(t.fecha_entrega) < hoy;
    const urgente = t.fecha_entrega && !vencida && (new Date(t.fecha_entrega) - hoy) < 3 * 86400000;
    return `<div class="tarjeta-tarea ${vencida ? "tarea-vencida" : urgente ? "tarea-urgente" : ""}">
      <div class="tarea-cabecera">
        <span class="texto-curso"><i class="fa-solid fa-book-open"></i> ${t.cursos?.nombre || "—"}</span>
        <span class="fecha-texto ${vencida ? "texto-vencido" : urgente ? "texto-urgente" : ""}">
          <i class="fa-solid fa-clock"></i> ${vence}
          ${vencida ? '<span class="etiqueta-vencida">Vencida</span>' : urgente ? '<span class="etiqueta-urgente">¡Pronto!</span>' : ""}
        </span>
      </div>
      <h4>${t.titulo}</h4>
      ${t.descripcion ? `<p>${t.descripcion}</p>` : ""}
      ${t.puntos ? `<span class="puntos-badge"><i class="fa-solid fa-star"></i> ${t.puntos} pts</span>` : ""}
    </div>`;
  }).join("");
}

// ── Filtros ───────────────────────────────────
function initFiltros() {
  document.getElementById("filtroAnuncios")?.addEventListener("change", e => {
    const v = e.target.value;
    dibujarAnuncios(v ? todosAnuncios.filter(a => a.curso_id === v) : todosAnuncios);
  });
  document.getElementById("filtroArchivos")?.addEventListener("change", e => {
    const v = e.target.value;
    dibujarArchivos(v ? todosArchivos.filter(a => a.curso_id === v) : todosArchivos);
  });
  document.getElementById("filtroTareas")?.addEventListener("change", e => {
    const v = e.target.value;
    dibujarTareas(v ? todasTareas.filter(t => t.curso_id === v) : todasTareas);
  });
}

// ── Unirse por código ─────────────────────────
function initFormCodigo(estudianteId) {
  document.getElementById("formCodigo")?.addEventListener("submit", async e => {
    e.preventDefault();
    limpiarAlerta("alertaCodigo");
    document.getElementById("errCodigo").textContent = "";

    const codigo = document.getElementById("inputCodigo").value.trim().toUpperCase();
    if (!codigo) { document.getElementById("errCodigo").textContent = "Ingresa un código."; return; }

    const btn = e.target.querySelector("button[type=submit]");
    btn.disabled = true; btn.textContent = "Buscando...";

    const { data: curso, error } = await supabase.from("cursos").select("id,nombre").eq("codigo", codigo).single();
    if (error || !curso) {
      mostrarAlerta("alertaCodigo", "error", "Código inválido.");
      btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-right-to-bracket"></i> Unirme';
      return;
    }

    const { data: yaInscrito } = await supabase.from("inscripciones")
      .select("id").eq("curso_id", curso.id).eq("estudiante_id", estudianteId).maybeSingle();

    if (yaInscrito) {
      mostrarAlerta("alertaCodigo", "error", "Ya estás inscrito en este curso.");
      btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-right-to-bracket"></i> Unirme';
      return;
    }

    const { error: errIns } = await supabase.from("inscripciones").insert({ curso_id: curso.id, estudiante_id: estudianteId });
    btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-right-to-bracket"></i> Unirme';

    if (errIns) { mostrarAlerta("alertaCodigo", "error", errIns.message); return; }

    mostrarAlerta("alertaCodigo", "ok", `¡Te uniste a "${curso.nombre}"!`);
    e.target.reset();
    setTimeout(async () => {
      await cargarCursos(estudianteId);
      await Promise.all([cargarAnuncios(estudianteId), cargarArchivos(estudianteId), cargarTareas(estudianteId)]);
      cargarStats(estudianteId);
      mostrarVista("cursos");
    }, 1500);
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
    const mostrar = input.type === "password";
    input.type = mostrar ? "text" : "password";
    this.querySelector("i").className = mostrar ? "fa-regular fa-eye-slash" : "fa-regular fa-eye";
  });

  document.getElementById("formPerfil")?.addEventListener("submit", async e => {
    e.preventDefault();
    limpiarAlerta("alertaPerfil");

    const nombre    = document.getElementById("pNombre").value.trim();
    const apellido  = document.getElementById("pApellido").value.trim();
    const clave     = document.getElementById("pClave").value;

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
      const { error: errClave } = await supabase.auth.updateUser({ password: clave });
      if (errClave) {
        mostrarAlerta("alertaPerfil", "error", errClave.message);
        btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Guardar cambios';
        return;
      }
    }

    btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Guardar cambios';
    document.getElementById("sideNombre").textContent = `${nombre} ${apellido}`;
    document.getElementById("pClave").value = "";
    mostrarAlerta("alertaPerfil", "ok", "Perfil actualizado correctamente.");
  });
}

// ── Sidebar móvil ─────────────────────────────
function initSidebarMovil() {
  const btnAbrir = document.getElementById("btnAbrirSidebar");
  const sidebar  = document.querySelector(".panel-sidebar");
  const fondo    = document.getElementById("fondoSidebar");

  btnAbrir?.addEventListener("click", () => { sidebar?.classList.toggle("sidebar-abierto"); fondo?.classList.toggle("visible"); });
  fondo?.addEventListener("click",   () => { sidebar?.classList.remove("sidebar-abierto"); fondo?.classList.remove("visible"); });
}

// ── INICIO ────────────────────────────────────
window.addEventListener("DOMContentLoaded", async () => {
  const sesion = await verificarSesion();
  if (!sesion) return;

  const { usuario, perfil } = sesion;
  document.getElementById("sideNombre").textContent = `${perfil.nombre} ${perfil.apellido}`;

  await Promise.all([
    cargarCursos(perfil.id),
    cargarStats(perfil.id),
    cargarAnuncios(perfil.id),
    cargarArchivos(perfil.id),
    cargarTareas(perfil.id),
  ]);

  initFormCodigo(perfil.id);
  initFormPerfil(usuario, perfil);
  initFiltros();
  initSidebarMovil();

  document.querySelectorAll(".nav-btn").forEach(btn => {
    btn.addEventListener("click", () => mostrarVista(btn.dataset.vista));
  });

  document.getElementById("btnSalir")?.addEventListener("click", async () => {
    await supabase.auth.signOut();
    window.location.href = "/index.html";
  });
});