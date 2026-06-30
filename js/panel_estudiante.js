
import { supabase } from "./supabase.js";

// ══ ESTADO GLOBAL ═════════════════════════════════════════════════════════════
let perfilActual    = null;
let cursosInscritos = [];

const URL_PARAMS      = new URLSearchParams(window.location.search);
const PREVIEW_DOCENTE = URL_PARAMS.get("preview_docente");

// ══ INIT ══════════════════════════════════════════════════════════════════════
window.addEventListener("DOMContentLoaded", async () => {
  if (PREVIEW_DOCENTE) {
    mostrarBannerPreview();
    await cargarDatosPreview(PREVIEW_DOCENTE);
  } else {
    await verificarSesion();
    await cargarPerfil();
    await cargarDatos();
  }
  initNav();
  initSidebar();
  initCerrarSesion();
  initVolverDetalleCurso();
  initBloqueUnirseToggle();
  initAsideVerTodos();
});

// ══ BANNER PREVIEW ════════════════════════════════════════════════════════════
function mostrarBannerPreview() {
  const banner = document.createElement("div");
  banner.style.cssText = `
    position: fixed; top: 0; left: 0; right: 0; z-index: 9999;
    background: linear-gradient(135deg, #ff4fa0, #8b5cf6);
    color: white; padding: .7rem 1.5rem;
    display: flex; align-items: center; justify-content: space-between;
    font-weight: 700; font-size: .9rem; font-family: 'Nunito', sans-serif;
    box-shadow: 0 2px 12px rgba(0,0,0,0.15);
  `;
  banner.innerHTML = `
    <span><i class="fa-solid fa-eye" style="margin-right:.5rem;"></i>
      Modo vista previa — así ven tus cursos los estudiantes
    </span>
    <button onclick="window.close()" style="
      background:white; color:#8b5cf6; border:none;
      border-radius:8px; padding:.3rem .9rem;
      font-weight:800; cursor:pointer; font-size:.85rem;
    ">✕ Cerrar</button>
  `;
  document.body.prepend(banner);
  document.body.style.paddingTop = "48px";
}

// ══ CARGA DE DATOS EN MODO PREVIEW ════════════════════════════════════════════
async function cargarDatosPreview(docenteId) {
  const h2 = document.getElementById("saludoH2");
  const p  = document.getElementById("saludoFrase");
  if (h2) h2.innerHTML = `Vista previa <span>del estudiante</span> 👁️`;
  if (p)  p.textContent = "Así verían tus cursos tus estudiantes.";
  const sideNombre = document.getElementById("sideNombre");
  if (sideNombre) sideNombre.textContent = "Vista Previa";

  ["vista-perfil"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.remove();
  });
  document.querySelectorAll(".nav-btn[data-vista='perfil']").forEach(btn => btn.remove());

  const { data: cursos } = await supabase
    .from("cursos")
    .select("id, nombre, descripcion, nivel, codigo, docente_id, imagen_url, perfiles(nombre, apellido)")
    .eq("docente_id", docenteId)
    .order("creado_at", { ascending: false });

  cursosInscritos = cursos || [];
  renderCursosInicio();
  renderCursosLista();

  if (cursosInscritos.length === 0) {
    renderAsideVacio();
    await renderMiniCursosDisponibles();
    return;
  }

  const cursoIds = cursosInscritos.map(c => c.id);
  const { data: anunciosRaw } = await supabase
    .from("anuncios")
    .select("*, cursos(nombre)")
    .in("curso_id", cursoIds)
    .order("creado_at", { ascending: false })
    .limit(5);

  const { tareas, archivos } = await cargarItemsModulosPorCursos(cursoIds);

  renderAsideAnuncios(normalizarAnuncios(anunciosRaw || []));
  renderAsideTareas(tareas);
  renderAsideArchivos(archivos);
  renderAnunciosVista(anunciosRaw || []);
  renderTareasVista(tareas);
  renderArchivosVista(archivos);
  llenarFiltros(cursosInscritos);
  actualizarBadges(cursosInscritos, anunciosRaw || [], archivos, tareas);
  await renderMiniCursosDisponibles();
}

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

  const nombreCompleto = `${perfil.nombre} ${perfil.apellido}`;
  const el = document.getElementById("sideNombre");
  if (el) el.textContent = nombreCompleto;

  const pNombreCompleto = document.getElementById("perfilNombreCompleto");
  const pEmail          = document.getElementById("perfilEmailVista");
  const pDesde          = document.getElementById("perfilDesde");
  const pNombre         = document.getElementById("pNombre");
  const pApellido       = document.getElementById("pApellido");
  const pEmailInput     = document.getElementById("pEmail");

  if (pNombreCompleto) pNombreCompleto.textContent = nombreCompleto;
  if (pEmail)          pEmail.textContent = user.email;
  if (pDesde)          pDesde.textContent = `Miembro desde ${formatFecha(user.created_at)}`;
  if (pNombre)         pNombre.value = perfil.nombre;
  if (pApellido)       pApellido.value = perfil.apellido;
  if (pEmailInput)     pEmailInput.value = user.email;
}

// ══ CARGAR TODOS LOS DATOS ════════════════════════════════════════════════════
async function cargarDatos() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data: inscripciones } = await supabase
    .from("inscripciones")
    .select("curso_id, cursos(id, nombre, descripcion, nivel, codigo, imagen_url, docente_id, perfiles(nombre, apellido))")
    .eq("estudiante_id", user.id);

  cursosInscritos = (inscripciones || []).map(i => i.cursos).filter(Boolean);

  renderCursosInicio();
  renderCursosLista();

  const cursoIds = cursosInscritos.map(c => c.id);
  if (cursoIds.length === 0) {
    renderAsideVacio();
    await renderMiniCursosDisponibles();
    return;
  }

  const { data: anunciosRaw } = await supabase
    .from("anuncios")
    .select("*, cursos(nombre), modulos(nombre)")
    .in("curso_id", cursoIds)
    .order("creado_at", { ascending: false })
    .limit(10);

  const { tareas, archivos } = await cargarItemsModulosPorCursos(cursoIds);

  renderAsideAnuncios(normalizarAnuncios(anunciosRaw || []));
  renderAsideTareas(tareas);
  renderAsideArchivos(archivos);
  renderAnunciosVista(anunciosRaw || []);
  renderTareasVista(tareas);
  renderArchivosVista(archivos);
  llenarFiltros(cursosInscritos);
  actualizarBadges(cursosInscritos, anunciosRaw || [], archivos, tareas);
  await renderMiniCursosDisponibles();
}

function normalizarAnuncios(anuncios) {
  return anuncios.map(a => ({
    ...a,
    curso_nombre:  a.cursos?.nombre  || "",
    modulo_nombre: a.modulos?.nombre || null,
  }));
}

// ══ RENDER GRILLA DE CURSOS ═══════════════════════════════════════════════════
function renderCursosInicio() {
  const contenedor = document.getElementById("listaCursosInicio");
  const msg        = document.getElementById("msgSinCursosInicio");
  if (!contenedor) return;

  if (cursosInscritos.length === 0) {
    if (msg) msg.style.display = "";
    contenedor.querySelectorAll(".tarjeta-curso").forEach(el => el.remove());
    return;
  }
  if (msg) msg.style.display = "none";

  contenedor.innerHTML = cursosInscritos.map(c => {
    const imgHtml = c.imagen_url
      ? `<img src="${c.imagen_url}" class="curso-img-portada" alt="${c.nombre}">`
      : `<div class="curso-img-placeholder"><i class="fa-solid fa-book-open"></i></div>`;

    return `
    <div class="tarjeta-curso" data-curso-id="${c.id}" onclick="abrirDetalleCursoEst('${c.id}')" style="cursor:pointer;">
      <div class="curso-img-wrap">${imgHtml}</div>
      <div class="tarjeta-curso-header">
        <div class="curso-badges">
          ${c.nivel ? `<span class="etiqueta-nivel ${c.nivel}">${c.nivel}</span>` : ""}
        </div>
        <h3>${c.nombre}</h3>
        <p>${c.descripcion || ""}</p>
      </div>
      <div class="tarjeta-curso-footer" style="position:static; padding:0 1.3rem 1.1rem; width:100%;">
        <span style="font-size:0.78rem; color:var(--texto-claro); font-weight:600;">
          <i class="fa-solid fa-chalkboard-teacher"></i> ${c.perfiles?.nombre || ""} ${c.perfiles?.apellido || ""}
        </span>
      </div>
    </div>`;
  }).join("");
}

// ══ DETALLE DE UN CURSO ═══════════════════════════════════════════════════════
window.abrirDetalleCursoEst = async function(cursoId) {
  const curso = cursosInscritos.find(c => c.id === cursoId);
  if (!curso) return;

  document.getElementById("cursoTituloEst").textContent  = curso.nombre;
  document.getElementById("cursoDescEst").textContent    = curso.descripcion || "Sin descripción.";
  document.getElementById("cursoDocenteEst").textContent = `${curso.perfiles?.nombre || ""} ${curso.perfiles?.apellido || ""}`;

  const nivelEl = document.getElementById("cursoNivelEst");
  if (nivelEl) { nivelEl.textContent = curso.nivel || "Sin nivel"; nivelEl.className = `etiqueta-nivel ${curso.nivel || ""}`; }

  const fondo = document.getElementById("cursoHeroFondoEst");
  if (fondo) {
    fondo.style.backgroundImage = curso.imagen_url
      ? `url('${curso.imagen_url}')`
      : "linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)";
  }

  document.querySelectorAll("#vista-detalle .pestana-btn").forEach(b => b.classList.remove("activa"));
  document.querySelector("#vista-detalle .pestana-btn[data-pestana='modulos']")?.classList.add("activa");
  document.querySelectorAll("#vista-detalle .pestana-panel").forEach(p => p.classList.add("oculto"));
  document.getElementById("detalleModulosEst")?.classList.remove("oculto");

  document.querySelectorAll(".vista").forEach(v => v.classList.add("oculto"));
  document.getElementById("vista-detalle")?.classList.remove("oculto");
  document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("activo"));

  initPestanasDetalleEst();
  moduloExpandidoIdEst = null;
  await cargarModulosCursoEst(cursoId);
  await cargarAnunciosCursoEst(cursoId);
};

function initPestanasDetalleEst() {
  document.querySelectorAll("#vista-detalle .pestana-btn").forEach(btn => {
    const nuevo = btn.cloneNode(true);
    btn.replaceWith(nuevo);
  });
  document.querySelectorAll("#vista-detalle .pestana-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll("#vista-detalle .pestana-btn").forEach(b => b.classList.remove("activa"));
      document.querySelectorAll("#vista-detalle .pestana-panel").forEach(p => p.classList.add("oculto"));
      btn.classList.add("activa");
      document.querySelector(`#vista-detalle .pestana-panel[data-panel="${btn.dataset.pestana}"]`)?.classList.remove("oculto");
    });
  });
}

function initVolverDetalleCurso() {
  document.getElementById("btnVolverCursosEst")?.addEventListener("click", () => {
    document.querySelectorAll(".vista").forEach(v => v.classList.add("oculto"));
    document.getElementById("vista-cursos")?.classList.remove("oculto");
    document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("activo"));
    document.querySelector(".nav-btn[data-vista='cursos']")?.classList.add("activo");
  });
}

// ══ MÓDULOS DEL CURSO (solo lectura) ══════════════════════════════════════════
let modulosActivoEst     = [];
let moduloExpandidoIdEst = null;
let cursoIdAbiertoEst    = null;

async function cargarModulosCursoEst(cursoId) {
  cursoIdAbiertoEst = cursoId;
  const cont = document.getElementById("detalleModulosEst");
  if (!cont) return;

  try {
    const { data: modulos, error: errM } = await supabase
      .from("modulos").select("*")
      .eq("curso_id", cursoId).order("orden", { ascending: true });

    if (errM) throw errM;

    modulosActivoEst = modulos || [];
    const moduloIds = modulosActivoEst.map(m => m.id);
    let itemsPorModulo = {};

    if (moduloIds.length) {
      const { data: items, error: errI } = await supabase
        .from("modulo_items").select("*")
        .in("modulo_id", moduloIds).order("creado_at", { ascending: true });
      if (errI) throw errI;
      (items || []).forEach(it => {
        if (!itemsPorModulo[it.modulo_id]) itemsPorModulo[it.modulo_id] = [];
        itemsPorModulo[it.modulo_id].push(it);
      });
    }

    modulosActivoEst = modulosActivoEst.map(m => ({ ...m, items: itemsPorModulo[m.id] || [] }));
    renderModulosEst();
  } catch (e) {
    console.error("Error cargando módulos del curso:", e);
    cont.innerHTML = `<p class="sin-datos">No se pudieron cargar los módulos. Intenta de nuevo.</p>`;
  }
}

function renderModulosEst() {
  const cont = document.getElementById("detalleModulosEst");
  if (!cont) return;

  if (!modulosActivoEst.length) {
    cont.innerHTML = `<p class="sin-datos">El docente todavía no agregó módulos a este curso.</p>`;
    return;
  }

  cont.innerHTML = modulosActivoEst.map((m, idx) => {
    const expandido = m.id === moduloExpandidoIdEst;
    return `
    <div class="modulo-tarjeta ${expandido ? "expandido" : ""}" data-modulo-id="${m.id}">
      <div class="modulo-cabecera" onclick="toggleModuloEst('${m.id}')">
        <div class="modulo-numero">${idx + 1}</div>
        <div class="modulo-info">
          <h3>${m.titulo}</h3>
          ${m.descripcion ? `<p>${m.descripcion}</p>` : ""}
        </div>
        <div class="modulo-meta">
          <span class="modulo-conteo">${m.items.length} ${m.items.length === 1 ? "elemento" : "elementos"}</span>
        </div>
        <i class="fa-solid fa-chevron-down modulo-chevron"></i>
      </div>
      <div class="modulo-cuerpo ${expandido ? "" : "oculto"}">
        ${renderItemsModuloEst(m)}
      </div>
    </div>`;
  }).join("");

  // Inyectar botones de entrega según estado real
  inyectarBotonesEntrega();
}

async function inyectarBotonesEntrega() {
  const entregadas = await cargarEntregasEstudiante();

  // Cargamos el detalle completo de las entregas para mostrarlas
  const { data: { user } } = await supabase.auth.getUser();
  const { data: detalleEntregas } = await supabase
    .from("entregas")
    .select("tarea_id, url_archivo, comentario, entregado_at")
    .eq("estudiante_id", user.id);

  const mapaEntregas = {};
  (detalleEntregas || []).forEach(e => { mapaEntregas[e.tarea_id] = e; });

  modulosActivoEst.forEach(m => {
    m.items.filter(it => it.tipo === "tarea").forEach(it => {
      const slot = document.getElementById(`btn-entrega-${it.id}`);
      if (!slot) return;

      if (entregadas.has(it.id)) {
        const e = mapaEntregas[it.id];
        slot.innerHTML = `
          <button onclick="verDetalleEntrega('${it.id}')"
            style="display:inline-flex;align-items:center;gap:0.35rem;font-size:0.78rem;
              font-weight:800;color:var(--color-ok,#1aaa6b);background:#effaf5;
              border:1.3px solid #a3e6c8;border-radius:50px;padding:0.28rem 0.75rem;
              cursor:pointer;font-family:'Nunito',sans-serif;transition:background 0.15s;">
            <i class="fa-solid fa-circle-check"></i> Entregado
          </button>`;
      } else {
        slot.innerHTML = `
          <button class="btn-primario btn-pequeno"
            onclick="abrirModalEntrega('${it.id}','${(it.titulo||'').replace(/'/g,"\\'")}','${it.fecha_entrega||''}')">
            <i class="fa-solid fa-paper-plane"></i> Entregar
          </button>`;
      }
    });
  });
}

function renderItemsModuloEst(modulo) {
  if (!modulo.items.length) {
    return `<div class="modulo-sin-contenido">Este módulo todavía no tiene contenido.</div>`;
  }

  return modulo.items.map(it => {
    if (it.tipo === "texto") {
      return `
      <div class="modulo-item">
        <div class="modulo-item-icono icono-texto"><i class="fa-solid fa-align-left"></i></div>
        <div class="modulo-item-cuerpo">
          <strong>${it.titulo || "Texto"}</strong>
          <p>${it.contenido || ""}</p>
        </div>
      </div>`;
    }

    if (it.tipo === "archivo") {
      const tieneUrl     = !!it.url;
      const tieneArchivo = !!it.archivo_url;
      return `
      <div class="modulo-item">
        <div class="modulo-item-icono icono-archivo"><i class="fa-solid ${tieneArchivo ? "fa-file-arrow-down" : "fa-link"}"></i></div>
        <div class="modulo-item-cuerpo">
          <strong>${it.titulo}</strong>
          <div class="modulo-item-enlaces">
            ${tieneUrl     ? `<a href="${it.url}" target="_blank" rel="noopener"><i class="fa-solid fa-link"></i> Enlace</a>` : ""}
            ${tieneArchivo ? `<a href="${it.archivo_url}" target="_blank" rel="noopener"><i class="fa-solid fa-file-arrow-down"></i> Archivo</a>` : ""}
          </div>
        </div>
      </div>`;
    }

    // tarea — se renderiza con placeholder, luego se actualiza con estado de entrega
    const venceTxt = it.fecha_entrega
      ? `<span class="vence-tag ${urgencia(it.fecha_entrega)}">Vence: ${formatFecha(it.fecha_entrega)}</span>`
      : "";

    return `
    <div class="modulo-item" id="modulo-item-${it.id}">
      <div class="modulo-item-icono icono-tarea"><i class="fa-solid fa-clipboard-list"></i></div>
      <div class="modulo-item-cuerpo">
        <strong>${it.titulo}${it.puntos ? ` <span style="color:#8b5cf6;font-weight:700;font-size:.78rem;">· ${it.puntos} pts</span>` : ""}</strong>
        <p>${it.contenido || ""}</p>
        <div style="display:flex;gap:.6rem;align-items:center;margin-top:.4rem;flex-wrap:wrap;">
          ${venceTxt}
          ${it.url        ? `<a href="${it.url}" target="_blank" class="archivo-ref"><i class="fa-solid fa-link"></i> Enlace</a>` : ""}
          ${it.archivo_url ? `<a href="${it.archivo_url}" target="_blank" class="archivo-ref"><i class="fa-solid fa-file-arrow-down"></i> Archivo adjunto</a>` : ""}
          <span id="btn-entrega-${it.id}" style="margin-left:auto;">
            <i class="fa-solid fa-spinner fa-spin" style="color:var(--texto-claro);font-size:0.8rem;"></i>
          </span>
        </div>
      </div>
    </div>`;
  }).join("");
}

window.toggleModuloEst = function(moduloId) {
  moduloExpandidoIdEst = moduloExpandidoIdEst === moduloId ? null : moduloId;
  renderModulosEst();
};

// ══ ANUNCIOS DEL CURSO ABIERTO ════════════════════════════════════════════════
async function cargarAnunciosCursoEst(cursoId) {
  const elA = document.getElementById("detalleAnunciosEst");
  if (!elA) return;

  try {
    const { data: anuncios, error } = await supabase
      .from("anuncios").select("*")
      .eq("curso_id", cursoId).order("creado_at", { ascending: false });

    if (error) throw error;

    elA.innerHTML = anuncios?.length
      ? anuncios.map(a => `
          <div class="item-anuncio">
            <strong>${a.titulo}</strong>
            <p>${a.contenido}</p>
            <span class="meta-fecha">${formatFecha(a.creado_at)}</span>
          </div>`).join("")
      : `<p class="sin-datos">Sin anuncios.</p>`;
  } catch (e) {
    console.error("Error cargando anuncios del curso:", e);
    elA.innerHTML = `<p class="sin-datos">No se pudieron cargar. Intenta de nuevo.</p>`;
  }
}

// ══ RENDER CURSOS LISTA ═══════════════════════════════════════════════════════
function renderCursosLista() {
  const contenedor = document.getElementById("listaCursos");
  const msg        = document.getElementById("msgSinCursos");
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

// ══ ASIDE DETALLADO ═══════════════════════════════════════════════════════════

function renderAsideVacio() {
  const vacioHtml = `<p class="sin-datos">Sin datos</p>`;
  ["listaAnunciosAside","listaTareasAside","listaArchivosAside"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = vacioHtml;
  });
}

/* ── Fecha relativa ── */
function fechaRelativa(fechaStr) {
  if (!fechaStr) return "";
  const ahora = new Date();
  const fecha  = new Date(fechaStr);
  const diff   = Math.floor((ahora - fecha) / 86400000);
  if (diff === 0) return "Hoy";
  if (diff === 1) return "Ayer";
  if (diff < 7)  return `Hace ${diff} días`;
  return fecha.toLocaleDateString("es", { day: "numeric", month: "short" });
}

/* ── Estado de vencimiento ── */
function estadoVencimiento(fechaVence) {
  if (!fechaVence) return { texto: "", clase: "" };
  const diff = Math.floor((new Date(fechaVence) - new Date()) / 86400000);
  if (diff < 0)   return { texto: "Vencida",           clase: "vencida" };
  if (diff === 0) return { texto: "Vence hoy",         clase: "urgente" };
  if (diff <= 2)  return { texto: `Vence en ${diff}d`, clase: "urgente" };
  return            { texto: `Vence en ${diff}d`,      clase: "normal"  };
}

/* ── Breadcrumb chips HTML ── */
function breadcrumbHtml(cursoNombre, moduloNombre) {
  return `
    <div class="aside-item-breadcrumb">
      <span class="aside-chip chip-curso">
        <i class="fa-solid fa-book-open" style="font-size:0.58rem;"></i>
        ${cursoNombre || "Curso"}
      </span>
      ${moduloNombre ? `
      <span class="aside-chip-sep">›</span>
      <span class="aside-chip chip-modulo">
        <i class="fa-solid fa-layer-group" style="font-size:0.58rem;"></i>
        ${moduloNombre}
      </span>` : ""}
    </div>`;
}

/* ── ANUNCIOS en aside ── */
function renderAsideAnuncios(anuncios) {
  const contenedor = document.getElementById("listaAnunciosAside");
  if (!contenedor) return;

  // Actualizar badge
  const badge = document.getElementById("badgeAnuncios");
  if (badge) badge.textContent = anuncios.length > 0 ? anuncios.length : "";

  if (!anuncios.length) {
    contenedor.innerHTML = `<p class="sin-datos">Sin anuncios recientes.</p>`;
    return;
  }

  contenedor.innerHTML = anuncios.slice(0, 3).map(a => `
    <div class="aside-item" data-tipo="anuncio" data-id="${a.id}" tabindex="0" role="button">
      <div class="aside-item-header">
        <div class="aside-item-icono tipo-anuncio">
          <i class="fa-solid fa-bullhorn"></i>
        </div>
        <span class="aside-item-titulo">${a.titulo}</span>
      </div>
      <div class="aside-item-meta">
        ${breadcrumbHtml(a.curso_nombre, a.modulo_nombre)}
        ${a.contenido ? `<p class="aside-item-desc">${a.contenido}</p>` : ""}
        <div class="aside-item-footer" style="padding-left:0;margin-top:0.2rem;">
          <span class="aside-item-fecha">${fechaRelativa(a.creado_at)}</span>
        </div>
      </div>
    </div>
  `).join("");

  contenedor.querySelectorAll(".aside-item").forEach(item => {
    const ir = () => document.querySelector('.nav-btn[data-vista="anuncios"]')?.click();
    item.addEventListener("click", ir);
    item.addEventListener("keydown", e => { if (e.key === "Enter") ir(); });
  });
}

/* ── TAREAS en aside ── */
function renderAsideTareas(tareas) {
  const contenedor = document.getElementById("listaTareasAside");
  if (!contenedor) return;

  const pendientes = tareas.filter(t =>
    !t.fecha_entrega || new Date(t.fecha_entrega) >= new Date()
  );

  const badge = document.getElementById("badgeTareas");
  if (badge) badge.textContent = pendientes.length > 0 ? pendientes.length : "";

  if (!pendientes.length) {
    contenedor.innerHTML = `<p class="sin-datos">Sin tareas pendientes.</p>`;
    return;
  }

  cargarEntregasEstudiante().then(entregadas => {
    contenedor.innerHTML = pendientes.slice(0, 3).map(t => {
      const { texto: textoVence, clase } = estadoVencimiento(t.fecha_entrega);
      const yaEntrego = entregadas.has(t.id);

      const btnEntrega = yaEntrego
        ? `<span style="display:inline-flex;align-items:center;gap:0.35rem;font-size:0.68rem;font-weight:800;color:var(--color-ok,#1aaa6b);background:#effaf5;border:1.3px solid #a3e6c8;border-radius:50px;padding:0.22rem 0.65rem;">
             <i class="fa-solid fa-circle-check"></i> Entregado
           </span>`
        : `<button class="btn-primario" style="font-size:0.68rem;padding:0.22rem 0.7rem;border-radius:50px;"
             onclick="abrirModalEntrega('${t.id}','${(t.titulo||'').replace(/'/g,"\\'")}','${t.fecha_entrega||''}')">
             <i class="fa-solid fa-paper-plane"></i> Entregar
           </button>`;

      return `
      <div class="aside-item" data-tipo="tarea" data-id="${t.id}" tabindex="0" role="button">
        <div class="aside-item-header">
          <div class="aside-item-icono tipo-tarea">
            <i class="fa-solid fa-clipboard-list"></i>
          </div>
          <span class="aside-item-titulo">${t.titulo}</span>
        </div>
        <div class="aside-item-meta">
          ${breadcrumbHtml(t.cursos?.nombre || t.curso_nombre || "", t.modulo_nombre || "")}
          ${t.descripcion || t.contenido
            ? `<p class="aside-item-desc">${t.descripcion || t.contenido}</p>`
            : ""}
          <div class="aside-item-footer" style="padding-left:0;margin-top:0.35rem;gap:0.5rem;">
            ${textoVence
              ? `<span class="aside-item-vence ${clase}">${textoVence}</span>`
              : `<span class="aside-item-fecha">Sin fecha límite</span>`}
            ${t.puntos ? `<span style="font-size:0.68rem;color:#8b5cf6;font-weight:800;">${t.puntos} pts</span>` : ""}
            ${btnEntrega}
          </div>
        </div>
      </div>`;
    }).join("");

    // clicks en el item navegan a la vista tareas (excepto el botón)
    contenedor.querySelectorAll(".aside-item").forEach(item => {
      item.addEventListener("click", e => {
        if (e.target.closest("button")) return;
        document.querySelector('.nav-btn[data-vista="tareas"]')?.click();
      });
    });
  });
}

/* ── ARCHIVOS en aside ── */
function renderAsideArchivos(archivos) {
  const contenedor = document.getElementById("listaArchivosAside");
  if (!contenedor) return;

  const badge = document.getElementById("badgeArchivos");
  if (badge) badge.textContent = archivos.length > 0 ? archivos.length : "";

  if (!archivos.length) {
    contenedor.innerHTML = `<p class="sin-datos">Sin archivos recientes.</p>`;
    return;
  }

  function iconoArchivo(mime) {
    if (!mime) return "fa-file-lines";
    if (mime.includes("pdf"))   return "fa-file-pdf";
    if (mime.includes("image")) return "fa-file-image";
    if (mime.includes("video")) return "fa-file-video";
    if (mime.includes("audio")) return "fa-file-audio";
    if (mime.includes("word") || mime.includes("document"))    return "fa-file-word";
    if (mime.includes("sheet") || mime.includes("excel"))      return "fa-file-excel";
    if (mime.includes("presentation") || mime.includes("powerpoint")) return "fa-file-powerpoint";
    if (mime.includes("zip") || mime.includes("rar") || mime.includes("compress")) return "fa-file-zipper";
    return "fa-file-lines";
  }

  contenedor.innerHTML = archivos.slice(0, 3).map(f => {
    const nombre   = f.nombre_archivo || f.titulo || "Archivo";
    const url      = f.url || f.archivo_url || "";
    const mime     = f.tipo_mime || f.mime || "";
    const cursoN   = f.cursos?.nombre || f.curso_nombre || "";
    const moduloN  = f.modulo_nombre || "";
    const fecha    = f.fecha_subida  || f.creado_at || "";

    return `
    <div class="aside-item" data-tipo="archivo" data-id="${f.id}" tabindex="0" role="button">
      <div class="aside-item-header">
        <div class="aside-item-icono tipo-archivo">
          <i class="fa-solid ${iconoArchivo(mime)}"></i>
        </div>
        <span class="aside-item-titulo">${nombre}</span>
      </div>
      <div class="aside-item-meta">
        ${breadcrumbHtml(cursoN, moduloN)}
        <div class="aside-item-footer" style="padding-left:0;margin-top:0.2rem;">
          <span class="aside-item-fecha">${fechaRelativa(fecha)}</span>
          ${url ? `<a href="${url}" target="_blank" rel="noopener"
              style="font-size:0.68rem;color:var(--lila);font-weight:800;text-decoration:none;margin-left:auto;"
              onclick="event.stopPropagation()">
            <i class="fa-solid fa-arrow-up-right-from-square" style="font-size:0.62rem;"></i> Abrir
          </a>` : ""}
        </div>
      </div>
    </div>`;
  }).join("");

  contenedor.querySelectorAll(".aside-item").forEach(item => {
    const ir = () => document.querySelector('.nav-btn[data-vista="archivos"]')?.click();
    item.addEventListener("click", ir);
    item.addEventListener("keydown", e => { if (e.key === "Enter") ir(); });
  });
}

// ══ VISTAS COMPLETAS (anuncios / tareas / archivos) ═══════════════════════════

function renderAnunciosVista(anuncios) {
  const el = document.getElementById("listaAnunciosVista");
  if (!el) return;
  el.innerHTML = anuncios.length
    ? anuncios.map(a => `
      <div class="item-anuncio">
        <div class="anuncio-meta">
          <span class="curso-tag">${a.cursos?.nombre || ""}</span>
          ${a.modulos?.nombre ? `<span class="curso-tag" style="background:#fff0f8;color:var(--rosa);">${a.modulos.nombre}</span>` : ""}
          <span class="meta-fecha">${formatFecha(a.creado_at)}</span>
        </div>
        <strong>${a.titulo}</strong>
        <p>${a.contenido}</p>
      </div>`).join("")
    : `<p class="sin-datos">Sin anuncios en tus cursos.</p>`;
}

function renderTareasVista(tareas) {
  const el = document.getElementById("listaTareasVista");
  if (!el) return;
  if (!tareas.length) { el.innerHTML = `<p class="sin-datos">Sin tareas.</p>`; return; }

  // Primero cargamos qué tareas ya entregó este estudiante
  cargarEntregasEstudiante().then(entregadas => {
    el.innerHTML = tareas.map(t => {
      const yaEntrego   = entregadas.has(t.id);
      const vence       = t.fecha_entrega ? `<span class="vence-tag ${urgencia(t.fecha_entrega)}">Vence: ${formatFecha(t.fecha_entrega)}</span>` : "";
      const modTag      = t.modulo_nombre ? `<span class="curso-tag" style="background:#fff0f8;color:var(--rosa);">${t.modulo_nombre}</span>` : "";

      const notaTarea = window.__mapaNotasEst?.[t.id];
const tieneNota = notaTarea !== null && notaTarea !== undefined;

const btnEntrega  = yaEntrego
  ? `<button onclick="verDetalleEntrega('${t.id}')"
       style="display:inline-flex;align-items:center;gap:0.4rem;font-size:0.82rem;font-weight:800;
         color:${tieneNota ? "var(--lila)" : "var(--color-ok,#1aaa6b)"};
         background:${tieneNota ? "#f0ecff" : "#effaf5"};
         border:1.3px solid ${tieneNota ? "#d4c4fb" : "#a3e6c8"};
         border-radius:50px;padding:0.3rem 0.9rem;margin-left:auto;cursor:pointer;
         font-family:'Nunito',sans-serif;">
       <i class="fa-solid ${tieneNota ? "fa-star" : "fa-circle-check"}"></i>
       ${tieneNota ? `Nota: ${notaTarea}${t.puntos ? `/${t.puntos}` : ""}` : "Entregado"}
     </button>`
  : `<button class="btn-primario btn-pequeno" style="margin-left:auto;"
     onclick="abrirModalEntrega('${t.id}','${(t.titulo||'').replace(/'/g,"\\'")}','${t.fecha_entrega||''}')">
     <i class="fa-solid fa-paper-plane"></i> Entregar
   </button>`;

      return `
      <div class="item-tarea">
        <div class="anuncio-meta">
          <span class="curso-tag">${t.cursos?.nombre || ""}</span>
          ${modTag}
          ${vence}
        </div>
        <strong>${t.titulo}</strong>
        <p>${t.descripcion || t.contenido || ""}</p>
        <div style="display:flex;gap:.6rem;align-items:center;flex-wrap:wrap;margin-top:.5rem;">
          ${t.puntos ? `<span style="font-size:0.8rem;color:#8b5cf6;font-weight:700;">${t.puntos} pts</span>` : ""}
          ${t.url ? `<a href="${t.url}" target="_blank" class="archivo-ref"><i class="fa-solid fa-link"></i> Enlace</a>` : ""}
          ${t.archivo_url ? `<a href="${t.archivo_url}" target="_blank" class="archivo-ref"><i class="fa-solid fa-file-arrow-down"></i> Archivo adjunto</a>` : ""}
          ${btnEntrega}
        </div>
      </div>`;
    }).join("");
  });
}

async function cargarEntregasEstudiante() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Set();
  const { data } = await supabase
    .from("entregas")
    .select("tarea_id, nota")
    .eq("estudiante_id", user.id);
  window.__mapaNotasEst = {};
  (data || []).forEach(e => { window.__mapaNotasEst[e.tarea_id] = e.nota; });
  return new Set((data || []).map(e => e.tarea_id));
}

function renderArchivosVista(archivos) {
  const el = document.getElementById("listaArchivosVista");
  if (!el) return;
  el.innerHTML = archivos.length
    ? archivos.map(a => `
      <div class="item-archivo">
        <div class="anuncio-meta">
          <span class="curso-tag">${a.cursos?.nombre || ""}</span>
          ${a.modulo_nombre ? `<span class="curso-tag" style="background:#fff0f8;color:var(--rosa);">${a.modulo_nombre}</span>` : ""}
          <span class="meta-fecha">${formatFecha(a.creado_at)}</span>
        </div>
        <a href="${a.url || a.archivo_url || ""}" target="_blank">
          <i class="fa-solid fa-file"></i> ${a.nombre_archivo || a.titulo || "Archivo"}
        </a>
      </div>`).join("")
    : `<p class="sin-datos">Sin archivos.</p>`;
}

// ══ ITEMS DE MÓDULOS (tareas y archivos con módulo y curso) ═══════════════════
async function cargarItemsModulosPorCursos(cursoIds) {
  if (!cursoIds || cursoIds.length === 0) return { tareas: [], archivos: [] };

  try {
    const { data: modulos, error: errM } = await supabase
      .from("modulos")
      .select("id, titulo, curso_id, cursos(nombre)")
      .in("curso_id", cursoIds);

    if (errM) throw errM;

    const moduloIds = (modulos || []).map(m => m.id);
    if (moduloIds.length === 0) return { tareas: [], archivos: [] };

    // Mapa moduloId → { cursos, modulo_nombre }
    const mapaModulo = {};
    (modulos || []).forEach(m => {
      mapaModulo[m.id] = { cursos: m.cursos, modulo_nombre: m.titulo };
    });

    const { data: items, error: errI } = await supabase
      .from("modulo_items")
      .select("*")
      .in("modulo_id", moduloIds)
      .in("tipo", ["tarea", "archivo"]);

    if (errI) throw errI;

    const tareas = (items || [])
      .filter(it => it.tipo === "tarea")
      .map(it => ({
        ...it,
        descripcion:   it.contenido,
        cursos:        mapaModulo[it.modulo_id]?.cursos || {},
        modulo_nombre: mapaModulo[it.modulo_id]?.modulo_nombre || null,
      }))
      .sort((a, b) => {
        if (!a.fecha_entrega) return 1;
        if (!b.fecha_entrega) return -1;
        return new Date(a.fecha_entrega) - new Date(b.fecha_entrega);
      });

    const archivos = (items || [])
      .filter(it => it.tipo === "archivo")
      .map(it => ({
        ...it,
        nombre_archivo: it.titulo,
        url:            it.archivo_url || it.url,
        cursos:         mapaModulo[it.modulo_id]?.cursos || {},
        modulo_nombre:  mapaModulo[it.modulo_id]?.modulo_nombre || null,
      }))
      .sort((a, b) => new Date(b.creado_at) - new Date(a.creado_at))
      .slice(0, 10);

    return { tareas, archivos };
  } catch (e) {
    console.error("Error cargando items de módulos:", e);
    return { tareas: [], archivos: [] };
  }
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

// ══ CURSOS DISPONIBLES ════════════════════════════════════════════════════════
let cursosDisponiblesData = [];

async function renderMiniCursosDisponibles() {
  const el    = document.getElementById("miniListaCursos");
  const badge = document.getElementById("badgeDisponibles");

  const { data: cursos, error } = await supabase
    .from("cursos")
    .select("id, nombre, descripcion, nivel, imagen_url, perfiles(nombre, apellido)")
    .eq("es_publico", true)
    .order("creado_at", { ascending: false });

  if (!el) return;

  if (error) {
    console.error("Error cargando cursos disponibles:", error);
    el.innerHTML = `<p class="sin-datos">No se pudieron cargar los cursos disponibles.</p>`;
    return;
  }

  cursosDisponiblesData = cursos || [];
  const idsInscritos = new Set(cursosInscritos.map(c => c.id));

  if (cursosDisponiblesData.length === 0) {
    el.innerHTML = `<p class="sin-datos">No hay cursos públicos disponibles por ahora.</p>`;
    if (badge) badge.textContent = "";
    return;
  }

  if (badge) {
    const noInscritos = cursosDisponiblesData.filter(c => !idsInscritos.has(c.id)).length;
    badge.textContent = noInscritos > 0 ? noInscritos : "";
  }

  el.innerHTML = cursosDisponiblesData.map(c => {
    const yaInscrito = idsInscritos.has(c.id);
    const imgHtml = c.imagen_url
      ? `<img src="${c.imagen_url}" class="curso-img-portada" alt="${c.nombre}">`
      : `<div class="curso-img-placeholder"><i class="fa-solid fa-book-open"></i></div>`;

    return `
    <div class="tarjeta-curso" data-curso-id="${c.id}">
      <div class="curso-img-wrap">${imgHtml}</div>
      <div class="tarjeta-curso-header">
        <div class="curso-badges">
          ${c.nivel ? `<span class="etiqueta-nivel ${c.nivel}">${c.nivel}</span>` : ""}
          ${yaInscrito ? `<span class="badge-visibilidad publico"><i class="fa-solid fa-circle-check"></i> Inscrita</span>` : ""}
        </div>
        <h3>${c.nombre}</h3>
        <p>${c.descripcion || ""}</p>
      </div>
      <div class="tarjeta-curso-footer" style="position:static; padding:0 1.3rem 1.1rem; width:100%; display:flex; flex-direction:column; gap:0.6rem; align-items:stretch;">
        <span style="font-size:0.78rem; color:var(--texto-claro); font-weight:600;">
          <i class="fa-solid fa-chalkboard-teacher"></i> ${c.perfiles?.nombre || ""} ${c.perfiles?.apellido || ""}
        </span>
        ${yaInscrito
          ? `<button class="btn-secundario" onclick="irACursoDisponible('${c.id}')"
               style="width:100%;justify-content:center;align-items:center;gap:0.5rem;border-color:var(--color-ok);color:var(--color-ok);">
               <i class="fa-solid fa-circle-check"></i> Ya estás inscrita — Ver curso
             </button>`
          : `<button class="btn-primario btn-pequeno" onclick="inscribirseACursoDisponible('${c.id}')"
               id="btn-inscribir-${c.id}" style="width:100%;">
               <i class="fa-solid fa-plus"></i> Inscribirme
             </button>`
        }
      </div>
    </div>`;
  }).join("");
}

window.inscribirseACursoDisponible = async function(cursoId) {
  const btn = document.getElementById(`btn-inscribir-${cursoId}`);
  if (btn) { btn.disabled = true; btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Inscribiendo...`; }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data: yaInscrito } = await supabase
    .from("inscripciones").select("id")
    .eq("curso_id", cursoId).eq("estudiante_id", user.id).single();

  if (yaInscrito) {
    await cargarDatos();
    window.abrirDetalleCursoEst(cursoId);
    return;
  }

  const { error } = await supabase
    .from("inscripciones").insert({ curso_id: cursoId, estudiante_id: user.id });

  if (error) {
    if (btn) { btn.disabled = false; btn.innerHTML = `<i class="fa-solid fa-plus"></i> Inscribirme`; }
    mostrarToast(`No se pudo inscribir: ${error.message || "intenta de nuevo."}`, "error");
    return;
  }

  mostrarToast("¡Te inscribiste correctamente! 🎉", "ok");
  await cargarDatos();
  window.abrirDetalleCursoEst(cursoId);
};

window.irACursoDisponible = function(cursoId) {
  window.abrirDetalleCursoEst(cursoId);
};

// ══ BADGES ════════════════════════════════════════════════════════════════════
function actualizarBadges(cursos, anuncios, archivos, tareas) {
  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val || ""; };
  set("badgeMisCursos", cursos.length  || "");
  // Los badges de anuncios/tareas/archivos se setean dentro de sus render functions
}

// ══ TOGGLE BLOQUE "UNIRSE CON CÓDIGO" (en vista Disponibles) ═════════════════
function initBloqueUnirseToggle() {
  const btnAbrir   = document.getElementById("btnToggleUnirse");
  const overlay    = document.getElementById("modalCodigoOverlay");
  const btnCerrar  = document.getElementById("btnCerrarModalCodigo");
  const btnCancelar = document.getElementById("btnCancelarModalCodigo");

  const abrir = () => {
    overlay.style.display = "flex";
    document.body.style.overflow = "hidden";
    setTimeout(() => document.getElementById("inputCodigo")?.focus(), 100);
  };

  const cerrar = () => {
    overlay.style.display = "none";
    document.body.style.overflow = "";
    document.getElementById("inputCodigo").value = "";
    document.getElementById("errCodigo").textContent = "";
    document.getElementById("alertaCodigo").className = "alerta";
  };

  btnAbrir?.addEventListener("click", abrir);
  btnCerrar?.addEventListener("click", cerrar);
  btnCancelar?.addEventListener("click", cerrar);
  overlay?.addEventListener("click", e => {
    if (e.target === overlay) cerrar();
  });
}

// ══ "VER TODOS" en el aside → navega a la vista correspondiente ═══════════════
function initAsideVerTodos() {
  document.querySelectorAll(".aside-ver-todos[data-vista-ir]").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelector(`.nav-btn[data-vista="${btn.dataset.vistaIr}"]`)?.click();
    });
  });
}

// ══ FORMULARIO UNIRSE CON CÓDIGO ══════════════════════════════════════════════
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("formCodigo");
  if (!form) return;

  form.addEventListener("submit", async e => {
    e.preventDefault();
    const codigo    = document.getElementById("inputCodigo")?.value.trim().toUpperCase();
    const alerta    = document.getElementById("alertaCodigo");
    const errCodigo = document.getElementById("errCodigo");

    if (!codigo) { if (errCodigo) errCodigo.textContent = "Ingresa un código."; return; }
    if (errCodigo) errCodigo.textContent = "";

    const { data: { user } } = await supabase.auth.getUser();

    const { data: curso, error: errBuscar } = await supabase
      .from("cursos").select("id, nombre").eq("codigo", codigo).single();

    if (errBuscar || !curso) {
      mostrarAlerta(alerta, "error", "Código incorrecto. Verifica con tu docente.");
      return;
    }

    const { data: yaInscrito } = await supabase
      .from("inscripciones").select("id")
      .eq("curso_id", curso.id).eq("estudiante_id", user.id).single();

    if (yaInscrito) { mostrarAlerta(alerta, "info", "Ya estás inscrito en este curso."); return; }

    const { error: errInscribir } = await supabase
      .from("inscripciones").insert({ curso_id: curso.id, estudiante_id: user.id });

    if (errInscribir) { mostrarAlerta(alerta, "error", "No se pudo inscribir. Intenta de nuevo."); return; }

    mostrarAlerta(alerta, "ok", `¡Te uniste a "${curso.nombre}" exitosamente!`);
    document.getElementById("inputCodigo").value = "";

    // Cerrar el bloque y recargar datos
    document.getElementById("bloqueUnirsecodigo")?.classList.remove("visible");
    await cargarDatos();
    mostrarToast(`¡Bienvenida a "${curso.nombre}"! 🎉`, "ok");
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
    if (!nombre)   { setErr("errPNombre",   "Campo obligatorio."); valido = false; } else setErr("errPNombre", "");
    if (!apellido) { setErr("errPApellido", "Campo obligatorio."); valido = false; } else setErr("errPApellido", "");
    if (clave && clave.length < 6) { setErr("errPClave", "Mínimo 6 caracteres."); valido = false; } else setErr("errPClave", "");
    if (!valido) return;

    const { data: { user } } = await supabase.auth.getUser();
    const { error: errPerfil } = await supabase.from("perfiles").update({ nombre, apellido }).eq("id", user.id);
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
  document.getElementById("btnCerrarSesion3")?.addEventListener("click", async () => {
    await supabase.auth.signOut();
    window.location.href = "/index.html";
  });
}

// ══ UTILS ═════════════════════════════════════════════════════════════════════
function formatFecha(str) {
  if (!str) return "";
  return new Date(str).toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" });
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

function mostrarToast(msg, tipo = "ok") {
  let t = document.getElementById("enit-toast");
  if (!t) { t = document.createElement("div"); t.id = "enit-toast"; document.body.appendChild(t); }
  t.className = `enit-toast toast-${tipo} toast-visible`;
  t.innerHTML = `<i class="fa-solid ${tipo === "ok" ? "fa-circle-check" : tipo === "error" ? "fa-circle-exclamation" : "fa-circle-info"}"></i> ${msg}`;
  clearTimeout(t._t);
  t._t = setTimeout(() => t.classList.remove("toast-visible"), 3500);
}

// ══ MODAL ENTREGA DE TAREA ════════════════════════════════════════════════════
let entregaTareaId = null;
let entregaArchivoFile = null;

window.abrirModalEntrega = function(tareaId, tareaTitulo, fechaEntrega) {
  entregaTareaId    = tareaId;
  entregaArchivoFile = null;

  document.getElementById("entregaTareaTitulo").textContent = tareaTitulo;
  document.getElementById("entregaTareaVence").textContent  = fechaEntrega
    ? `Fecha límite: ${formatFecha(fechaEntrega)}`
    : "Sin fecha límite";

  document.getElementById("entregaArchivoSel").classList.remove("visible");
  document.getElementById("entregaArchivoNombre").textContent = "";
  document.getElementById("entregaInputFile").value = "";
  document.getElementById("entregaNota").value = "";
  document.getElementById("entregaProgreso").classList.remove("visible");
  document.getElementById("entregaProgresoFill").style.width = "0%";
  document.getElementById("alertaEntrega").className = "alerta";
  document.getElementById("btnConfirmarEntrega").disabled = false;

  document.getElementById("modalEntregaOverlay").style.display = "flex";
  document.body.style.overflow = "hidden";
};


function cerrarModalEntrega() {
  document.getElementById("modalEntregaOverlay").style.display = "none";
  document.body.style.overflow = "";
  entregaTareaId    = null;
  entregaArchivoFile = null;
}

document.addEventListener("DOMContentLoaded", () => {
  // Cerrar modal
  document.getElementById("btnCerrarEntrega")?.addEventListener("click", cerrarModalEntrega);
  document.getElementById("btnCancelarEntrega")?.addEventListener("click", cerrarModalEntrega);
  document.getElementById("modalEntregaOverlay")?.addEventListener("click", e => {
    if (e.target === e.currentTarget) cerrarModalEntrega();
  });

  // Zona drag & drop
  const zona  = document.getElementById("entregaZona");
  const input = document.getElementById("entregaInputFile");

  zona?.addEventListener("click", () => input?.click());

  zona?.addEventListener("dragover", e => {
    e.preventDefault();
    zona.classList.add("drag-over");
  });
  zona?.addEventListener("dragleave", () => zona.classList.remove("drag-over"));
  zona?.addEventListener("drop", e => {
    e.preventDefault();
    zona.classList.remove("drag-over");
    const file = e.dataTransfer?.files?.[0];
    if (file) seleccionarArchivoEntrega(file);
  });

  input?.addEventListener("change", e => {
    const file = e.target.files?.[0];
    if (file) seleccionarArchivoEntrega(file);
  });

  // Quitar archivo
  document.getElementById("entregaQuitarArchivo")?.addEventListener("click", () => {
    entregaArchivoFile = null;
    document.getElementById("entregaArchivoSel").classList.remove("visible");
    document.getElementById("entregaArchivoNombre").textContent = "";
    if (input) input.value = "";
  });

  // Enviar entrega
  document.getElementById("btnConfirmarEntrega")?.addEventListener("click", enviarEntrega);
});

function seleccionarArchivoEntrega(file) {
  const maxMB = 20;
  if (file.size > maxMB * 1024 * 1024) {
    mostrarAlerta(document.getElementById("alertaEntrega"), "error", `El archivo supera los ${maxMB} MB.`);
    return;
  }
  entregaArchivoFile = file;
  document.getElementById("entregaArchivoNombre").textContent = file.name;
  document.getElementById("entregaArchivoSel").classList.add("visible");
  document.getElementById("alertaEntrega").className = "alerta";
}

async function enviarEntrega() {
  const alerta = document.getElementById("alertaEntrega");
  const nota   = document.getElementById("entregaNota")?.value.trim();
  const btn    = document.getElementById("btnConfirmarEntrega");

  if (!entregaArchivoFile && !nota) {
    mostrarAlerta(alerta, "error", "Adjunta un archivo o escribe un comentario antes de enviar.");
    return;
  }

  btn.disabled = true;
  btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Enviando...`;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    btn.disabled = false;
    btn.innerHTML = `<i class="fa-solid fa-paper-plane"></i> Enviar entrega`;
    mostrarAlerta(alerta, "error", "Sesión expirada. Recarga la página.");
    return;
  }

  let archivoUrl = null;

  // Subir archivo a Supabase Storage
  if (entregaArchivoFile) {
    const progreso = document.getElementById("entregaProgreso");
    const fill     = document.getElementById("entregaProgresoFill");
    const texto    = document.getElementById("entregaProgresoTexto");
    progreso?.classList.add("visible");
    fill.classList.add("indeterminado");
    texto.textContent = "Subiendo archivo...";

    const ext  = entregaArchivoFile.name.split(".").pop();
    const path = `entregas/${user.id}/${entregaTareaId}/${Date.now()}.${ext}`;

    const { data: uploadData, error: uploadErr } = await supabase.storage
      .from("entregas")
      .upload(path, entregaArchivoFile, { upsert: false });

    fill.classList.remove("indeterminado");
    fill.style.width = "100%";

    if (uploadErr) {
      progreso?.classList.remove("visible");
      btn.disabled = false;
      btn.innerHTML = `<i class="fa-solid fa-paper-plane"></i> Enviar entrega`;
      mostrarAlerta(alerta, "error", `No se pudo subir el archivo: ${uploadErr.message}`);
      return;
    }

    const { data: urlData } = supabase.storage
      .from("entregas")
      .getPublicUrl(uploadData.path);
    archivoUrl = urlData?.publicUrl || null;
    texto.textContent = "¡Archivo subido!";
  }

  // Guardar entrega en la tabla "entregas"
const { error: insertErr } = await supabase
  .from("entregas")
  .insert({
    tarea_id:      entregaTareaId,
    estudiante_id: user.id,
    url_archivo:   archivoUrl,
    comentario:    nota || null,
  });

  if (insertErr) {
    document.getElementById("entregaProgreso")?.classList.remove("visible");
    btn.disabled = false;
    btn.innerHTML = `<i class="fa-solid fa-paper-plane"></i> Enviar entrega`;
    // Si la tabla no existe aún, igual mostramos éxito local
    if (insertErr.code === "42P01") {
      mostrarToast("¡Entrega enviada! (tabla pendiente de crear en BD) 📎", "info");
      cerrarModalEntrega();
      return;
    }
    mostrarAlerta(alerta, "error", `Error al registrar la entrega: ${insertErr.message}`);
    return;
  }

  mostrarToast("¡Entrega enviada correctamente! 🎉", "ok");
  cerrarModalEntrega();
  // Refrescar botones en la vista del curso abierto
inyectarBotonesEntrega();
}

// ══ MODAL DETALLE DE ENTREGA ══════════════════════════════════════════════════
window.verDetalleEntrega = async function(tareaId) {
  const { data: { user } } = await supabase.auth.getUser();
  const { data: entrega } = await supabase
    .from("entregas")
    .select("url_archivo, comentario, entregado_at, nota, feedback")
    .eq("tarea_id", tareaId)
    .eq("estudiante_id", user.id)
    .single();

  if (!entrega) { mostrarToast("No se encontró la entrega.", "error"); return; }

  // Fecha
  document.getElementById("detalleEntregaFecha").textContent =
    entrega.entregado_at ? formatFecha(entrega.entregado_at) : "—";

  // Archivo
  const archivoWrap = document.getElementById("detalleEntregaArchivoWrap");
  if (entrega.url_archivo) {
    const link   = document.getElementById("detalleEntregaArchivoLink");
    const nombre = entrega.url_archivo.split("/").pop().split("?")[0];
    link.href    = entrega.url_archivo;
    document.getElementById("detalleEntregaArchivoNombre").textContent = decodeURIComponent(nombre);
    archivoWrap.style.display = "";
  } else {
    archivoWrap.style.display = "none";
  }

  // Comentario
  const comentarioWrap = document.getElementById("detalleEntregaComentarioWrap");
  if (entrega.comentario) {
    document.getElementById("detalleEntregaComentario").textContent = entrega.comentario;
    comentarioWrap.style.display = "";
  } else {
    comentarioWrap.style.display = "none";
  }

  // Calificación
  const notaEl    = document.getElementById("detalleEntregaNota");
  const estadoEl  = document.getElementById("detalleEntregaEstadoCalif");
  const feedbackEl = document.getElementById("detalleEntregaFeedback");
  const yaCalificada = entrega.nota !== null && entrega.nota !== undefined;

  if (yaCalificada) {
    notaEl.textContent = entrega.nota;
    estadoEl.textContent = "Calificado";
    estadoEl.style.background = "#effaf5";
    estadoEl.style.color = "var(--color-ok,#1aaa6b)";
  } else {
    notaEl.textContent = "Pendiente";
    estadoEl.textContent = "Sin calificar";
    estadoEl.style.background = "#fff4e0";
    estadoEl.style.color = "#b8860b";
  }

  if (entrega.feedback) {
    feedbackEl.textContent = entrega.feedback;
    feedbackEl.style.display = "block";
  } else {
    feedbackEl.style.display = "none";
  }

  document.getElementById("modalDetalleEntregaOverlay").style.display = "flex";
  document.body.style.overflow = "hidden";
};

document.addEventListener("DOMContentLoaded", () => {
  const cerrarDetalleEntrega = () => {
    document.getElementById("modalDetalleEntregaOverlay").style.display = "none";
    document.body.style.overflow = "";
  };
  document.getElementById("btnCerrarDetalleEntrega")?.addEventListener("click", cerrarDetalleEntrega);
  document.getElementById("modalDetalleEntregaOverlay")?.addEventListener("click", e => {
    if (e.target === e.currentTarget) cerrarDetalleEntrega();
  });
});