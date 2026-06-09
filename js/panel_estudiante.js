/* ════════════════════════════════════════════
   ENIT Academy — panel_estudiante.js
   ════════════════════════════════════════════ */

import { supabase } from "./supabase.js";

// ══ ESTADO GLOBAL ═════════════════════════════════════════════════════════════
let perfilActual = null;
let cursosInscritos = [];

// ══ INIT ══════════════════════════════════════════════════════════════════════
window.addEventListener("DOMContentLoaded", async () => {
  await verificarSesion();
  await cargarPerfil();
  await cargarDatos();
  initNav();
  initSidebar();
  initCerrarSesion();
});

// ══ SESIÓN ════════════════════════════════════════════════════════════════════
async function verificarSesion() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) window.location.href = "/index.html";
}

// ══ PERFIL ════════════════════════════════════════════════════════════════════
async function cargarPerfil() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data: perfil } = await supabase
    .from("perfiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!perfil) return;
  perfilActual = { ...perfil, email: user.email, created_at: user.created_at };

  // Sidebar
  const nombreCompleto = `${perfil.nombre} ${perfil.apellido}`;
  const el = document.getElementById("sideNombre");
  if (el) el.textContent = nombreCompleto;

  // Perfil vista
  const pNombreCompleto = document.getElementById("perfilNombreCompleto");
  const pEmail = document.getElementById("perfilEmailVista");
  const pDesde = document.getElementById("perfilDesde");
  const pNombre = document.getElementById("pNombre");
  const pApellido = document.getElementById("pApellido");
  const pEmailInput = document.getElementById("pEmail");

  if (pNombreCompleto) pNombreCompleto.textContent = nombreCompleto;
  if (pEmail) pEmail.textContent = user.email;
  if (pDesde) pDesde.textContent = `Miembro desde ${formatFecha(user.created_at)}`;
  if (pNombre) pNombre.value = perfil.nombre;
  if (pApellido) pApellido.value = perfil.apellido;
  if (pEmailInput) pEmailInput.value = user.email;
}

// ══ CARGAR TODOS LOS DATOS ════════════════════════════════════════════════════
async function cargarDatos() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  // Cursos inscritos
  const { data: inscripciones } = await supabase
    .from("inscripciones")
    .select("curso_id, cursos(id, nombre, descripcion, nivel, codigo, docente_id, perfiles(nombre, apellido))")
    .eq("estudiante_id", user.id);

  cursosInscritos = (inscripciones || []).map(i => i.cursos).filter(Boolean);

  renderCursosInicio();
  renderCursosLista();

  // Anuncios, tareas, archivos de todos sus cursos
  const cursoIds = cursosInscritos.map(c => c.id);
  if (cursoIds.length === 0) {
    renderAsideVacio();
    return;
  }

  const [{ data: anuncios }, { data: tareas }, { data: archivos }] = await Promise.all([
    supabase.from("anuncios").select("*, cursos(nombre)").in("curso_id", cursoIds).order("creado_at", { ascending: false }).limit(5),
    supabase.from("tareas").select("*, cursos(nombre)").in("curso_id", cursoIds).order("fecha_entrega", { ascending: true }),
    supabase.from("archivos").select("*, cursos(nombre)").in("curso_id", cursoIds).order("creado_at", { ascending: false }).limit(5),
  ]);

  renderAsideAnuncios(anuncios || []);
  renderAsideTareas(tareas || []);
  renderAsideArchivos(archivos || []);
  renderAnunciosVista(anuncios || [], cursoIds);
  renderTareasVista(tareas || [], cursoIds);
  renderArchivosVista(archivos || [], cursoIds);
  llenarFiltros(cursosInscritos);
}

// ══ RENDER CURSOS INICIO ══════════════════════════════════════════════════════
function renderCursosInicio() {
  const contenedor = document.getElementById("listaCursosInicio");
  const msg = document.getElementById("msgSinCursosInicio");
  if (!contenedor) return;

  if (cursosInscritos.length === 0) {
    if (msg) msg.style.display = "";
    return;
  }
  if (msg) msg.style.display = "none";

  contenedor.innerHTML = cursosInscritos.map(c => `
    <div class="tarjeta-curso-est">
      <div class="curso-cabecera" onclick="toggleCurso('${c.id}')">
        <div class="curso-cabecera-info">
          <h3>${c.nombre}</h3>
          <p>Docente: ${c.perfiles?.nombre || ""} ${c.perfiles?.apellido || ""}</p>
        </div>
        <div class="curso-cabecera-meta">
          ${c.nivel ? `<span class="etiqueta-nivel ${c.nivel}">${c.nivel}</span>` : ""}
          <button class="btn-toggle-curso" id="toggle-${c.id}">
            <i class="fa-solid fa-chevron-down"></i>
          </button>
        </div>
      </div>
      <div class="curso-body" id="body-${c.id}">
        <p style="margin:1rem 0 0.5rem; font-size:0.85rem; color:#6b5478;">${c.descripcion || "Sin descripción."}</p>
        <div id="pestanas-${c.id}">
          <div class="pestanas-curso">
            <button class="pestana-curso-btn activa" onclick="verPestana('${c.id}','anuncios',this)"><i class="fa-solid fa-bullhorn"></i> Anuncios</button>
            <button class="pestana-curso-btn" onclick="verPestana('${c.id}','archivos',this)"><i class="fa-solid fa-folder-open"></i> Archivos</button>
            <button class="pestana-curso-btn" onclick="verPestana('${c.id}','tareas',this)"><i class="fa-solid fa-clipboard-list"></i> Tareas</button>
          </div>
          <div class="pestana-curso-panel visible" id="${c.id}-anuncios"><p class="sin-datos">Cargando...</p></div>
          <div class="pestana-curso-panel" id="${c.id}-archivos"><p class="sin-datos">Cargando...</p></div>
          <div class="pestana-curso-panel" id="${c.id}-tareas"><p class="sin-datos">Cargando...</p></div>
        </div>
      </div>
    </div>
  `).join("");
}

window.toggleCurso = async function(cursoId) {
  const body = document.getElementById(`body-${cursoId}`);
  const btn = document.getElementById(`toggle-${cursoId}`);
  if (!body) return;

  const abierto = body.classList.toggle("visible");
  btn?.classList.toggle("abierto", abierto);

  if (abierto) await cargarDetalleCurso(cursoId);
};

async function cargarDetalleCurso(cursoId) {
  const [{ data: anuncios }, { data: archivos }, { data: tareas }] = await Promise.all([
    supabase.from("anuncios").select("*").eq("curso_id", cursoId).order("creado_at", { ascending: false }),
    supabase.from("archivos").select("*").eq("curso_id", cursoId).order("creado_at", { ascending: false }),
    supabase.from("tareas").select("*").eq("curso_id", cursoId).order("fecha_entrega", { ascending: true }),
  ]);

  const elA = document.getElementById(`${cursoId}-anuncios`);
  const elAr = document.getElementById(`${cursoId}-archivos`);
  const elT = document.getElementById(`${cursoId}-tareas`);

  if (elA) elA.innerHTML = (anuncios?.length)
    ? anuncios.map(a => `<div class="item-anuncio"><strong>${a.titulo}</strong><p>${a.contenido}</p><span class="meta-fecha">${formatFecha(a.creado_at)}</span></div>`).join("")
    : `<p class="sin-datos">Sin anuncios.</p>`;

  if (elAr) elAr.innerHTML = (archivos?.length)
    ? archivos.map(a => `<div class="item-archivo"><a href="${a.url}" target="_blank"><i class="fa-solid fa-file"></i> ${a.nombre_archivo}</a></div>`).join("")
    : `<p class="sin-datos">Sin archivos.</p>`;

  if (elT) elT.innerHTML = (tareas?.length)
    ? tareas.map(t => `<div class="item-tarea"><strong>${t.titulo}</strong>${t.fecha_entrega ? `<span class="vence-tag ${urgencia(t.fecha_entrega)}">Vence: ${formatFecha(t.fecha_entrega)}</span>` : ""}<p>${t.descripcion || ""}</p></div>`).join("")
    : `<p class="sin-datos">Sin tareas.</p>`;
}

window.verPestana = function(cursoId, pestana, btn) {
  document.querySelectorAll(`#pestanas-${cursoId} .pestana-curso-btn`).forEach(b => b.classList.remove("activa"));
  document.querySelectorAll(`#pestanas-${cursoId} .pestana-curso-panel`).forEach(p => p.classList.remove("visible"));
  btn.classList.add("activa");
  document.getElementById(`${cursoId}-${pestana}`)?.classList.add("visible");
};

// ══ RENDER CURSOS LISTA ═══════════════════════════════════════════════════════
function renderCursosLista() {
  const contenedor = document.getElementById("listaCursos");
  const msg = document.getElementById("msgSinCursos");
  if (!contenedor) return;

  if (cursosInscritos.length === 0) {
    if (msg) msg.style.display = "";
    return;
  }
  if (msg) msg.style.display = "none";

  contenedor.innerHTML = cursosInscritos.map(c => `
    <div class="tarjeta-curso">
      <div class="tarjeta-curso-header">
        ${c.nivel ? `<span class="etiqueta-nivel ${c.nivel}">${c.nivel}</span>` : ""}
        <h3>${c.nombre}</h3>
        <p>${c.descripcion || ""}</p>
      </div>
      <div class="tarjeta-curso-footer">
        <span><i class="fa-solid fa-chalkboard-teacher"></i> ${c.perfiles?.nombre || ""} ${c.perfiles?.apellido || ""}</span>
      </div>
    </div>
  `).join("");
}

// ══ ASIDE ═════════════════════════════════════════════════════════════════════
function renderAsideVacio() {
  ["asideAnuncios","asideTareas","asideArchivos"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = `<p class="aside-sin-datos">Sin datos</p>`;
  });
}

function renderAsideAnuncios(anuncios) {
  const el = document.getElementById("asideAnuncios");
  if (!el) return;
  el.innerHTML = anuncios.length
    ? anuncios.slice(0,3).map(a => `
      <div class="aside-mini-item">
        <strong>${a.titulo}</strong>
        <span class="curso-tag">${a.cursos?.nombre || ""}</span>
      </div>`).join("")
    : `<p class="aside-sin-datos">Sin anuncios</p>`;
}

function renderAsideTareas(tareas) {
  const el = document.getElementById("asideTareas");
  if (!el) return;
  const pendientes = tareas.filter(t => t.fecha_entrega && new Date(t.fecha_entrega) >= new Date());
  el.innerHTML = pendientes.length
    ? pendientes.slice(0,3).map(t => `
      <div class="aside-mini-item">
        <strong>${t.titulo}</strong>
        <span class="vence-tag ${urgencia(t.fecha_entrega)}">Vence: ${formatFecha(t.fecha_entrega)}</span>
      </div>`).join("")
    : `<p class="aside-sin-datos">Sin tareas</p>`;
}

function renderAsideArchivos(archivos) {
  const el = document.getElementById("asideArchivos");
  if (!el) return;
  el.innerHTML = archivos.length
    ? archivos.slice(0,3).map(a => `
      <div class="aside-mini-item">
        <a href="${a.url}" target="_blank" style="color:#8b5cf6;font-size:0.82rem;"><i class="fa-solid fa-file"></i> ${a.nombre_archivo}</a>
        <span class="curso-tag">${a.cursos?.nombre || ""}</span>
      </div>`).join("")
    : `<p class="aside-sin-datos">Sin archivos</p>`;
}

// ══ VISTAS GENERALES ══════════════════════════════════════════════════════════
function renderAnunciosVista(anuncios, cursoIds) {
  const el = document.getElementById("listaAnuncios");
  if (!el) return;
  el.innerHTML = anuncios.length
    ? anuncios.map(a => `
      <div class="item-anuncio">
        <div class="anuncio-meta"><span class="curso-tag">${a.cursos?.nombre || ""}</span><span class="meta-fecha">${formatFecha(a.creado_at)}</span></div>
        <strong>${a.titulo}</strong>
        <p>${a.contenido}</p>
      </div>`).join("")
    : `<p class="sin-datos">Sin anuncios en tus cursos.</p>`;
}

function renderTareasVista(tareas, cursoIds) {
  const el = document.getElementById("listaTareas");
  if (!el) return;
  el.innerHTML = tareas.length
    ? tareas.map(t => `
      <div class="item-tarea">
        <div class="anuncio-meta"><span class="curso-tag">${t.cursos?.nombre || ""}</span>${t.fecha_entrega ? `<span class="vence-tag ${urgencia(t.fecha_entrega)}">Vence: ${formatFecha(t.fecha_entrega)}</span>` : ""}</div>
        <strong>${t.titulo}</strong>
        <p>${t.descripcion || ""}</p>
        ${t.puntos ? `<span style="font-size:0.8rem;color:#8b5cf6;font-weight:700;">${t.puntos} pts</span>` : ""}
      </div>`).join("")
    : `<p class="sin-datos">Sin tareas.</p>`;
}

function renderArchivosVista(archivos, cursoIds) {
  const el = document.getElementById("listaArchivos");
  if (!el) return;
  el.innerHTML = archivos.length
    ? archivos.map(a => `
      <div class="item-archivo">
        <span class="curso-tag">${a.cursos?.nombre || ""}</span>
        <a href="${a.url}" target="_blank"><i class="fa-solid fa-file"></i> ${a.nombre_archivo}</a>
        <span class="meta-fecha">${formatFecha(a.creado_at)}</span>
      </div>`).join("")
    : `<p class="sin-datos">Sin archivos.</p>`;
}

function llenarFiltros(cursos) {
  ["filtroAnuncios","filtroArchivos","filtroTareas"].forEach(id => {
    const sel = document.getElementById(id);
    if (!sel) return;
    cursos.forEach(c => {
      const opt = document.createElement("option");
      opt.value = c.id;
      opt.textContent = c.nombre;
      sel.appendChild(opt);
    });
  });
}

// ══ UNIRSE A CURSO ════════════════════════════════════════════════════════════
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("formCodigo");
  if (!form) return;

  form.addEventListener("submit", async e => {
    e.preventDefault();
    const codigo = document.getElementById("inputCodigo")?.value.trim().toUpperCase();
    const alerta = document.getElementById("alertaCodigo");
    const errCodigo = document.getElementById("errCodigo");

    if (!codigo) { if (errCodigo) errCodigo.textContent = "Ingresa un código."; return; }
    if (errCodigo) errCodigo.textContent = "";

    const { data: { user } } = await supabase.auth.getUser();

    // Buscar curso
    const { data: curso, error: errBuscar } = await supabase
      .from("cursos")
      .select("id, nombre")
      .eq("codigo", codigo)
      .single();

    if (errBuscar || !curso) {
      mostrarAlerta(alerta, "error", "Código incorrecto. Verifica con tu docente.");
      return;
    }

    // Ya inscrito?
    const { data: yaInscrito } = await supabase
      .from("inscripciones")
      .select("id")
      .eq("curso_id", curso.id)
      .eq("estudiante_id", user.id)
      .single();

    if (yaInscrito) {
      mostrarAlerta(alerta, "info", "Ya estás inscrito en este curso.");
      return;
    }

    // Inscribir
    const { error: errInscribir } = await supabase
      .from("inscripciones")
      .insert({ curso_id: curso.id, estudiante_id: user.id });

    if (errInscribir) {
      mostrarAlerta(alerta, "error", "No se pudo inscribir. Intenta de nuevo.");
      return;
    }

    mostrarAlerta(alerta, "ok", `¡Te uniste a "${curso.nombre}" exitosamente!`);
    document.getElementById("inputCodigo").value = "";
    await cargarDatos();
  });
});

// ══ PERFIL FORM ═══════════════════════════════════════════════════════════════
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("formPerfil");
  if (!form) return;

  form.addEventListener("submit", async e => {
    e.preventDefault();
    const nombre   = document.getElementById("pNombre")?.value.trim();
    const apellido = document.getElementById("pApellido")?.value.trim();
    const clave    = document.getElementById("pClave")?.value;
    const alerta   = document.getElementById("alertaPerfil");

    let valido = true;
    if (!nombre)   { setErr("errPNombre", "Campo obligatorio."); valido = false; } else setErr("errPNombre", "");
    if (!apellido) { setErr("errPApellido", "Campo obligatorio."); valido = false; } else setErr("errPApellido", "");
    if (clave && clave.length < 6) { setErr("errPClave", "Mínimo 6 caracteres."); valido = false; } else setErr("errPClave", "");
    if (!valido) return;

    const { data: { user } } = await supabase.auth.getUser();

    const { error: errPerfil } = await supabase
      .from("perfiles")
      .update({ nombre, apellido })
      .eq("id", user.id);

    if (errPerfil) { mostrarAlerta(alerta, "error", "No se pudo actualizar el perfil."); return; }

    if (clave) {
      const { error: errClave } = await supabase.auth.updateUser({ password: clave });
      if (errClave) { mostrarAlerta(alerta, "error", "Perfil guardado, pero error al cambiar contraseña."); return; }
    }

    mostrarAlerta(alerta, "ok", "¡Cambios guardados correctamente!");
    document.getElementById("sideNombre").textContent = `${nombre} ${apellido}`;
    document.getElementById("perfilNombreCompleto").textContent = `${nombre} ${apellido}`;
  });
});

// ══ NAV SIDEBAR ═══════════════════════════════════════════════════════════════
function initNav() {
  document.querySelectorAll(".nav-btn[data-vista]").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("activo"));
      document.querySelectorAll(".vista").forEach(v => v.classList.add("oculto"));
      btn.classList.add("activo");
      document.getElementById(`vista-${btn.dataset.vista}`)?.classList.remove("oculto");
      // cerrar sidebar en móvil
      document.querySelector(".panel-sidebar")?.classList.remove("abierto");
      document.getElementById("fondoSidebar")?.classList.remove("activo");
    });
  });
}

function initSidebar() {
  const btnAbrir = document.getElementById("btnAbrirSidebar");
  const sidebar  = document.querySelector(".panel-sidebar");
  const fondo    = document.getElementById("fondoSidebar");

  btnAbrir?.addEventListener("click", () => {
    sidebar?.classList.toggle("abierto");
    fondo?.classList.toggle("activo");
  });
  fondo?.addEventListener("click", () => {
    sidebar?.classList.remove("abierto");
    fondo?.classList.remove("activo");
  });
}

function initCerrarSesion() {
  ["btnCerrarSesion3"].forEach(id => {
    document.getElementById(id)?.addEventListener("click", async () => {
      await supabase.auth.signOut();
      window.location.href = "/index.html";
    });
  });
}

// ══ UTILS ═════════════════════════════════════════════════════════════════════
function formatFecha(str) {
  if (!str) return "";
  const d = new Date(str);
  return d.toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" });
}

function urgencia(fecha) {
  if (!fecha) return "";
  const diff = (new Date(fecha) - new Date()) / (1000 * 60 * 60 * 24);
  if (diff < 0) return "vencida";
  if (diff < 2) return "urgente";
  return "";
}

function mostrarAlerta(el, tipo, msg) {
  if (!el) return;
  el.className = `alerta alerta-${tipo} visible`;
  el.innerHTML = `<i class="fa-solid ${tipo === "ok" ? "fa-circle-check" : tipo === "info" ? "fa-circle-info" : "fa-circle-exclamation"}"></i> ${msg}`;
  setTimeout(() => el.classList.remove("visible"), 4000);
}

function setErr(id, msg) {
  const el = document.getElementById(id);
  if (el) el.textContent = msg;
}