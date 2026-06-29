/* ════════════════════════════════════════════
   ENIT Academy — panel_docente.js  (v3 — módulos + hero editable)
   ════════════════════════════════════════════ */

import { supabase } from "./supabase.js";

let perfilActual  = null;
let cursosDocente = [];
let cursoActivo   = null;
let modulosActivo = [];          // módulos del curso abierto
let moduloExpandidoId = null;    // id del módulo abierto en el acordeón
let moduloContenidoId = null;    // módulo destino del modal "Agregar contenido"

// ══ INIT ══════════════════════════════════════════════════════════════════════
window.addEventListener("DOMContentLoaded", async () => {
  await verificarSesion();
  await cargarPerfil();
  await cargarCursos();
  initNav();
  initSidebar();
  initCerrarSesion();
  initFormCrearCurso();
  initFormEditarCurso();
  initFormPerfil();
  initVistaEstudiante();
  initCopiaCodigo();
  initVolverCursos();
  initModalesModulo();
  initModalConfirmar();
  initFormPublicidad();
  cargarPublicidad();
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
  const { data: perfil } = await supabase.from("perfiles").select("*").eq("id", user.id).single();
  if (!perfil) return;
  perfilActual = { ...perfil, email: user.email, created_at: user.created_at };

  const nombreCompleto = `${perfil.nombre} ${perfil.apellido}`;
  const sideNombre = document.getElementById("sideNombre");
  if (sideNombre) sideNombre.textContent = nombreCompleto;

  const pN = document.getElementById("pNombre");
  const pA = document.getElementById("pApellido");
  const pE = document.getElementById("pEmail");
  const pD = document.getElementById("perfilDesde");
  if (pN) pN.value = perfil.nombre;
  if (pA) pA.value = perfil.apellido;
  if (pE) pE.value = user.email;
  if (pD) pD.textContent = `Miembro desde ${formatFecha(user.created_at)}`;

  // Poblar tarjeta de identidad
  const displayNombre = document.getElementById("perfilNombreDisplay");
  const displayEmail  = document.getElementById("perfilEmailDisplay");
  if (displayNombre) displayNombre.textContent = nombreCompleto;
  if (displayEmail)  displayEmail.textContent  = user.email;
}

// ══ CARGAR CURSOS ═════════════════════════════════════════════════════════════
async function cargarCursos() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  const { data: cursos } = await supabase
    .from("cursos").select("*")
    .eq("docente_id", user.id)
    .order("creado_at", { ascending: false });
  cursosDocente = cursos || [];
  renderCursos();
  cargarListaEstudiantes();
}

function renderCursos() {
  const contenedor = document.getElementById("listaCursos");
  const msg        = document.getElementById("msgSinCursos");
  if (!contenedor) return;

  if (cursosDocente.length === 0) {
    if (msg) msg.style.display = "";
    contenedor.querySelectorAll(".tarjeta-curso").forEach(el => el.remove());
    return;
  }
  if (msg) msg.style.display = "none";

  contenedor.innerHTML = cursosDocente.map(c => {
    const imgHtml = c.imagen_url
      ? `<img src="${c.imagen_url}" class="curso-img-portada" alt="${c.nombre}">`
      : `<div class="curso-img-placeholder"><i class="fa-solid fa-book-open"></i></div>`;

    return `
    <div class="tarjeta-curso" data-curso-id="${c.id}">
      <div class="curso-img-wrap" onclick="abrirDetalle('${c.id}')" style="cursor:pointer;">${imgHtml}</div>
      <div class="tarjeta-curso-header" onclick="abrirDetalle('${c.id}')" style="cursor:pointer;">
        <div class="curso-badges">
          ${c.nivel ? `<span class="etiqueta-nivel ${c.nivel}">${c.nivel}</span>` : ""}
          <span class="badge-visibilidad ${c.es_publico ? 'publico' : 'privado'}">
            <i class="fa-solid ${c.es_publico ? 'fa-globe' : 'fa-lock'}"></i>
            ${c.es_publico ? "Público" : "Con código"}
          </span>
        </div>
        <h3>${c.nombre}</h3>
        <p>${c.descripcion || ""}</p>
      </div>
<div class="tarjeta-curso-footer">
  <button class="btn-ojo-vis" title="${c.es_publico ? 'Hacer privado' : 'Hacer público'}"
    onclick="toggleVisibilidadCurso('${c.id}', event)">
    <i class="fa-solid ${c.es_publico ? 'fa-eye' : 'fa-eye-slash'}"></i>
  </button>
  <button class="btn-ojo-vis" title="Eliminar curso"
    style="border-color:#fca5a5; color:#ef4444;"
    onclick="eliminarCursoDesdeGrilla('${c.id}', event)">
    <i class="fa-solid fa-trash"></i>
  </button>
</div>
      </div>
    </div>`;
  }).join("");
}
window.eliminarCursoDesdeGrilla = async function(cursoId, e) {
  e?.stopPropagation();
  const curso = cursosDocente.find(c => c.id === cursoId);
  const confirmado = await confirmarAccion({
    titulo: `¿Eliminar "${curso?.nombre}"?`,
    mensaje: "Se eliminarán todos sus módulos, tareas, anuncios e inscripciones. Esta acción no se puede deshacer.",
    textoBoton: "Eliminar curso",
  });
  if (!confirmado) return;

  const { error } = await supabase.from("cursos").delete().eq("id", cursoId);
  if (error) { mostrarToast(`No se pudo eliminar: ${error.message}`, "error"); return; }
  cursosDocente = cursosDocente.filter(c => c.id !== cursoId);
  renderCursos();
  mostrarToast("Curso eliminado.", "info");
};


window.toggleVisibilidadCurso = async function(cursoId, e) {
  e?.stopPropagation();
  const curso = cursosDocente.find(c => c.id === cursoId);
  if (!curso) return;
  const nuevo = !curso.es_publico;
  const { error } = await supabase.from("cursos").update({ es_publico: nuevo }).eq("id", cursoId);
  if (error) { mostrarToast(`Error al cambiar visibilidad: ${error.message || "intenta de nuevo."}`, "error"); return; }

  cursosDocente = cursosDocente.map(c => c.id === cursoId ? { ...c, es_publico: nuevo } : c);
  if (cursoActivo?.id === cursoId) cursoActivo.es_publico = nuevo;
  renderCursos();

  mostrarToast(nuevo ? "Curso publicado en el inicio. 🌍" : "Curso privado. Solo con código. 🔒", nuevo ? "ok" : "info");
};

// ══ DETALLE CURSO ═════════════════════════════════════════════════════════════
window.abrirDetalle = async function(cursoId) {
  cursoActivo = cursosDocente.find(c => c.id === cursoId);
  if (!cursoActivo) return;

  pintarHeroCurso();
  mostrarVista("detalle");

  document.querySelectorAll(".pestana-btn").forEach(b => b.classList.remove("activa"));
  document.querySelectorAll(".pestana-panel").forEach(p => p.classList.add("oculto"));
  document.querySelector(".pestana-btn[data-pestana='modulos']")?.classList.add("activa");
  document.querySelector(".pestana-panel[data-panel='modulos']")?.classList.remove("oculto");

  moduloExpandidoId = null;
  await cargarModulosCurso(cursoId);
  await cargarAlumnosCurso(cursoId);
  await cargarAnunciosCurso(cursoId);
  initPestanas(cursoId);
  initAccionesCurso(cursoId);
};

function pintarHeroCurso() {
  if (!cursoActivo) return;
  document.getElementById("cursoTitulo").textContent = cursoActivo.nombre;
  document.getElementById("cursoDesc").textContent   = cursoActivo.descripcion || "Aún no agregaste una descripción para este curso.";
  document.getElementById("cursoCodigo").textContent = cursoActivo.codigo;

  const nivelEl = document.getElementById("cursoNivel");
  if (nivelEl) { nivelEl.textContent = cursoActivo.nivel || "Sin nivel"; nivelEl.className = `etiqueta-nivel ${cursoActivo.nivel || ""}`; }

  const fondo = document.getElementById("cursoHeroFondo");
  if (fondo) {
    fondo.style.backgroundImage = cursoActivo.imagen_url
      ? `url('${cursoActivo.imagen_url}')`
      : "linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)";
  }

  actualizarBadgeYBotonVis();
}

function actualizarBadgeYBotonVis() {
  const badgeVis = document.getElementById("cursoVisibilidad");
  const btnVis   = document.getElementById("btnCambiarVisibilidad");
  if (!cursoActivo) return;

  const esPublico = cursoActivo.es_publico;

  if (badgeVis) {
    badgeVis.className = `badge-visibilidad ${esPublico ? "publico" : "privado"}`;
    badgeVis.innerHTML = `<i class="fa-solid ${esPublico ? "fa-globe" : "fa-lock"}"></i>
      ${esPublico ? "Público — aparece en el inicio" : "Con código — acceso restringido"}`;
  }
  if (btnVis) {
    btnVis.innerHTML = `<i class="fa-solid ${esPublico ? "fa-eye" : "fa-eye-slash"}"></i>`;
    btnVis.title = esPublico ? "Hacer privado" : "Hacer público";
    btnVis.classList.toggle("activo", esPublico);
  }
  pintarAlertaVisibilidad();
}

function pintarAlertaVisibilidad() {
  const el = document.getElementById("alertaVisibilidad");
  if (!el || !cursoActivo) return;
  const esPublico = cursoActivo.es_publico;

  el.className = `alerta-vis visible ${esPublico ? "publico" : "privado"}`;
  el.innerHTML = `
    <div class="alerta-vis-icono"><i class="fa-solid ${esPublico ? "fa-globe" : "fa-lock"}"></i></div>
    <div class="alerta-vis-texto">
      <strong>${esPublico ? "Curso público" : "Curso privado"}</strong>
      <span>${esPublico ? "Cualquiera puede verlo desde el inicio." : "Solo entra quien tenga el código del curso."}</span>
    </div>`;
}

function initCopiaCodigo() {
  document.getElementById("btnCopiarCodigo")?.addEventListener("click", () => {
    const codigo = document.getElementById("cursoCodigo")?.textContent;
    if (!codigo) return;
    navigator.clipboard.writeText(codigo).then(() => {
      const btn = document.getElementById("btnCopiarCodigo");
      btn.innerHTML = `<i class="fa-solid fa-check"></i>`;
      setTimeout(() => { btn.innerHTML = `<i class="fa-regular fa-copy"></i>`; }, 1500);
    });
  });
}

function initVolverCursos() {
  document.getElementById("btnVolverCursos")?.addEventListener("click", () => mostrarVista("cursos"));
}

// ══════════════════════════════════════════════════════════════════════════════
// EDITAR CURSO (lápiz del hero)
// ══════════════════════════════════════════════════════════════════════════════
function abrirModalEditarCurso() {
  if (!cursoActivo) return;
  document.getElementById("eNombre").value = cursoActivo.nombre || "";
  document.getElementById("eNivel").value  = cursoActivo.nivel  || "";
  document.getElementById("eDesc").value   = cursoActivo.descripcion || "";

  const drop = document.getElementById("dropImagenEdit");
  const prev = document.getElementById("prevImagenEdit");
  const img  = document.getElementById("imgPreviewEdit");
  const inputImgE = document.getElementById("eImagen");
  if (inputImgE) inputImgE.value = "";
  window.__quitarImagenCurso = false;

  if (cursoActivo.imagen_url) {
    img.src = cursoActivo.imagen_url;
    drop.style.display = "none";
    prev.style.display = "block";
  } else {
    prev.style.display = "none";
    drop.style.display = "flex";
  }

  setErr("errENombre", ""); setErr("errENivel", "");
  document.getElementById("alertaEditarCurso").className = "alerta";

  document.getElementById("modalEditarCurso").style.display = "flex";
  document.body.style.overflow = "hidden";
}

function cerrarModalEditarCurso() {
  document.getElementById("modalEditarCurso").style.display = "none";
  document.body.style.overflow = "";
}

function initFormEditarCurso() {
  document.getElementById("btnEditarHero")?.addEventListener("click", abrirModalEditarCurso);
  document.getElementById("btnCerrarModalEditar")?.addEventListener("click", cerrarModalEditarCurso);
  document.getElementById("btnCancelarModalEditar")?.addEventListener("click", cerrarModalEditarCurso);
  document.getElementById("modalEditarCurso")?.addEventListener("click", e => { if (e.target.id === "modalEditarCurso") cerrarModalEditarCurso(); });

  const form = document.getElementById("formEditarCurso");
  if (!form) return;

  form.addEventListener("submit", async e => {
    e.preventDefault();
    if (!cursoActivo) return;

    const nombre = document.getElementById("eNombre")?.value.trim();
    const nivel  = document.getElementById("eNivel")?.value;
    const desc   = document.getElementById("eDesc")?.value.trim();
    const alerta = document.getElementById("alertaEditarCurso");
    const btnGuardar = form.querySelector('[type="submit"]');

    let valido = true;
    if (!nombre) { setErr("errENombre", "Campo obligatorio."); valido = false; } else setErr("errENombre", "");
    if (!nivel)  { setErr("errENivel",  "Elige un nivel.");   valido = false; } else setErr("errENivel", "");
    if (!valido) return;

    if (btnGuardar) { btnGuardar.disabled = true; btnGuardar.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Guardando...`; }

    const cambios = { nombre, nivel, descripcion: desc || null };

    const imgFile = document.getElementById("eImagen")?.files[0];
    if (imgFile) {
      const imgPath = `cursos/${cursoActivo.id}/portada_${Date.now()}.${imgFile.name.split(".").pop()}`;
      const { error: errImg } = await supabase.storage.from("imagenes-cursos").upload(imgPath, imgFile, { upsert: true });
      if (!errImg) {
        const { data: imgUrl } = supabase.storage.from("imagenes-cursos").getPublicUrl(imgPath);
        cambios.imagen_url = imgUrl.publicUrl;
      }
    } else if (window.__quitarImagenCurso) {
      cambios.imagen_url = null;
    }

    const { error } = await supabase.from("cursos").update(cambios).eq("id", cursoActivo.id);

    if (error) {
      mostrarAlerta(alerta, "error", "Error al guardar los cambios.");
      if (btnGuardar) { btnGuardar.disabled = false; btnGuardar.innerHTML = `<i class="fa-solid fa-floppy-disk"></i> Guardar cambios`; }
      return;
    }

    cursoActivo = { ...cursoActivo, ...cambios };
    cursosDocente = cursosDocente.map(c => c.id === cursoActivo.id ? cursoActivo : c);
    pintarHeroCurso();
    renderCursos();

    mostrarAlerta(alerta, "ok", "¡Curso actualizado!");
    if (btnGuardar) { btnGuardar.disabled = false; btnGuardar.innerHTML = `<i class="fa-solid fa-floppy-disk"></i> Guardar cambios`; }
    setTimeout(cerrarModalEditarCurso, 900);
  });
}

// ══ ALUMNOS ═══════════════════════════════════════════════════════════════════
async function cargarAlumnosCurso(cursoId) {
  const { data } = await supabase.from("inscripciones")
    .select("estudiante_id, perfiles(nombre, apellido, id)").eq("curso_id", cursoId);
  const el = document.getElementById("listaAlumnosCurso");
  if (!el) return;
  el.innerHTML = data?.length
    ? `<div class="tabla-estudiantes">${data.map(i => `
        <div class="fila-estudiante">
          <div class="avatar-mini"><i class="fa-solid fa-user-graduate"></i></div>
          <span>${i.perfiles?.nombre || ""} ${i.perfiles?.apellido || ""}</span>
          <button class="btn-peligro btn-mini" onclick="expulsarEstudiante('${cursoId}','${i.estudiante_id}')">
            <i class="fa-solid fa-user-minus"></i>
          </button>
        </div>`).join("")}</div>`
    : `<p class="sin-datos">Sin estudiantes inscritos.</p>`;
}

window.expulsarEstudiante = async function(cursoId, estudianteId) {
  const confirmado = await confirmarAccion({
    titulo: "¿Retirar a este estudiante?",
    mensaje: "Perderá el acceso a este curso y a todo su contenido. Podrás volver a inscribirlo más tarde si lo necesitas.",
    textoBoton: "Retirar",
    icono: "fa-user-minus",
  });
  if (!confirmado) return;

  const { error } = await supabase.from("inscripciones")
    .delete().eq("curso_id", cursoId).eq("estudiante_id", estudianteId);

  if (error) {
    mostrarToast(`No se pudo retirar al estudiante: ${error.message || "intenta de nuevo."}`, "error");
    return;
  }
  await cargarAlumnosCurso(cursoId);
  mostrarToast("Estudiante retirado del curso.", "ok");
};

// ══ ANUNCIOS ══════════════════════════════════════════════════════════════════
async function cargarAnunciosCurso(cursoId) {
  const { data } = await supabase.from("anuncios").select("*")
    .eq("curso_id", cursoId).order("creado_at", { ascending: false });
  const el = document.getElementById("listaAnunciosCurso");
  if (!el) return;
  el.innerHTML = data?.length
    ? data.map(a => `
      <div class="item-anuncio" data-anuncio-id="${a.id}">
        <div class="anuncio-meta"><span class="meta-fecha">${formatFecha(a.creado_at)}</span>
          <div class="modulo-item-acciones">
            <button class="btn-icono-peq" title="Editar" onclick="editarAnuncioInline('${a.id}')"><i class="fa-solid fa-pen"></i></button>
            <button class="btn-icono-peq peligro" title="Eliminar" onclick="eliminarAnuncio('${a.id}','${cursoId}')"><i class="fa-solid fa-trash"></i></button>
          </div>
        </div>
        <div class="anuncio-vista">
          <strong>${a.titulo}</strong><p>${a.contenido}</p>
        </div>
      </div>`).join("")
    : `<p class="sin-datos">Sin anuncios.</p>`;
}

window.editarAnuncioInline = function(anuncioId) {
  const tarjeta = document.querySelector(`.item-anuncio[data-anuncio-id="${anuncioId}"]`);
  if (!tarjeta) return;
  const vista = tarjeta.querySelector(".anuncio-vista");
  const tituloActual    = vista.querySelector("strong")?.textContent || "";
  const contenidoActual = vista.querySelector("p")?.textContent || "";

  vista.innerHTML = `
    <div class="campo"><label>Título</label><input type="text" class="edit-anuncio-titulo" value="${tituloActual.replace(/"/g,'&quot;')}"></div>
    <div class="campo mt-2"><label>Contenido</label><textarea class="edit-anuncio-contenido" rows="3">${contenidoActual}</textarea></div>
    <div class="modal-footer" style="border-top:none; padding-top:.6rem;">
      <button type="button" class="btn-secundario" onclick="cargarAnunciosCursoActivo()">Cancelar</button>
      <button type="button" class="btn-primario btn-pequeno" onclick="guardarAnuncioInline('${anuncioId}')"><i class="fa-solid fa-floppy-disk"></i> Guardar</button>
    </div>`;
};

window.guardarAnuncioInline = async function(anuncioId) {
  const tarjeta = document.querySelector(`.item-anuncio[data-anuncio-id="${anuncioId}"]`);
  if (!tarjeta) return;
  const titulo    = tarjeta.querySelector(".edit-anuncio-titulo")?.value.trim();
  const contenido = tarjeta.querySelector(".edit-anuncio-contenido")?.value.trim();
  if (!titulo || !contenido) { mostrarToast("Completa título y contenido.", "error"); return; }

  const { error } = await supabase.from("anuncios").update({ titulo, contenido }).eq("id", anuncioId);
  if (error) { mostrarToast("Error al guardar el anuncio.", "error"); return; }
  mostrarToast("Anuncio actualizado.", "ok");
  await cargarAnunciosCursoActivo();
};

window.cargarAnunciosCursoActivo = async function() {
  if (cursoActivo) await cargarAnunciosCurso(cursoActivo.id);
};

// ══════════════════════════════════════════════════════════════════════════════
// MÓDULOS — listado, acordeón y CRUD
// ══════════════════════════════════════════════════════════════════════════════
async function cargarModulosCurso(cursoId) {
  const { data: modulos } = await supabase.from("modulos").select("*")
    .eq("curso_id", cursoId).order("orden", { ascending: true });
  modulosActivo = modulos || [];

  // Cargar items de todos los módulos de una sola vez
  const moduloIds = modulosActivo.map(m => m.id);
  let itemsPorModulo = {};
  if (moduloIds.length) {
    const { data: items } = await supabase.from("modulo_items").select("*")
      .in("modulo_id", moduloIds).order("creado_at", { ascending: true });
    (items || []).forEach(it => {
      if (!itemsPorModulo[it.modulo_id]) itemsPorModulo[it.modulo_id] = [];
      itemsPorModulo[it.modulo_id].push(it);
    });
  }
  modulosActivo = modulosActivo.map(m => ({ ...m, items: itemsPorModulo[m.id] || [] }));

  renderModulos(cursoId);
}

function renderModulos(cursoId) {
  const cont = document.getElementById("listaModulosCurso");
  if (!cont) return;

  if (!modulosActivo.length) {
    cont.innerHTML = `<p class="sin-datos">Aún no creaste módulos. Usa "Nuevo módulo" para empezar a organizar el contenido.</p>`;
    return;
  }

  cont.innerHTML = modulosActivo.map((m, idx) => {
    const expandido = m.id === moduloExpandidoId;
    return `
    <div class="modulo-tarjeta ${expandido ? "expandido" : ""}" data-modulo-id="${m.id}">
      <div class="modulo-cabecera" onclick="toggleModulo('${m.id}','${cursoId}')">
        <div class="modulo-numero">${idx + 1}</div>
        <div class="modulo-info">
          <h3>${m.titulo}</h3>
          ${m.descripcion ? `<p>${m.descripcion}</p>` : ""}
        </div>
        <div class="modulo-meta">
          <span class="modulo-conteo">${m.items.length} ${m.items.length === 1 ? "elemento" : "elementos"}</span>
        </div>
        <div class="modulo-acciones">
          <button class="btn-icono-peq" title="Editar módulo" onclick="event.stopPropagation(); abrirModalModulo('${cursoId}','${m.id}')"><i class="fa-solid fa-pen"></i></button>
          <button class="btn-icono-peq peligro" title="Eliminar módulo" onclick="event.stopPropagation(); eliminarModulo('${m.id}','${cursoId}')"><i class="fa-solid fa-trash"></i></button>
        </div>
        <i class="fa-solid fa-chevron-down modulo-chevron"></i>
      </div>
      <div class="modulo-cuerpo ${expandido ? "" : "oculto"}">
        <div class="modulo-cuerpo-cabecera">
          <div class="dropdown-agregar" data-modulo-id="${m.id}">
            <button class="btn-primario btn-pequeno" onclick="toggleDropdownAgregar('${m.id}', event)">
              <i class="fa-solid fa-plus"></i> Agregar contenido <i class="fa-solid fa-chevron-down dropdown-flecha"></i>
            </button>
            <div class="dropdown-menu-agregar oculto">
              <button type="button" onclick="elegirTipoContenido('${m.id}','texto')">
                <span class="dropdown-icono icono-texto"><i class="fa-solid fa-align-left"></i></span>
                <span class="dropdown-texto"><strong>Texto</strong><small>Escribe contenido para la clase</small></span>
              </button>
              <button type="button" onclick="elegirTipoContenido('${m.id}','archivo')">
                <span class="dropdown-icono icono-archivo"><i class="fa-solid fa-paperclip"></i></span>
                <span class="dropdown-texto"><strong>Archivo</strong><small>Sube un archivo o pega un enlace</small></span>
              </button>
              <button type="button" onclick="elegirTipoContenido('${m.id}','tarea')">
                <span class="dropdown-icono icono-tarea"><i class="fa-solid fa-clipboard-list"></i></span>
                <span class="dropdown-texto"><strong>Tarea</strong><small>Crea una tarea con fecha y puntos</small></span>
              </button>
            </div>
          </div>
        </div>
        ${renderItemsModulo(m, cursoId)}
      </div>
    </div>`;
  }).join("");
}

function renderItemsModulo(modulo, cursoId) {
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
        <div class="modulo-item-acciones">
          <button class="btn-icono-peq" title="Editar" onclick="abrirModalContenido('${modulo.id}','${it.id}')"><i class="fa-solid fa-pen"></i></button>
          <button class="btn-icono-peq peligro" title="Eliminar" onclick="eliminarItemModulo('${it.id}','${modulo.id}','${cursoId}')"><i class="fa-solid fa-trash"></i></button>
        </div>
      </div>`;
    }
    if (it.tipo === "archivo") {
      const tieneUrl     = !!it.url;
      const tieneArchivo = !!it.archivo_url;
      return `
      <div class="modulo-item">
        <div class="modulo-item-icono icono-archivo"><i class="fa-solid ${tieneArchivo ? 'fa-file-arrow-down' : 'fa-link'}"></i></div>
        <div class="modulo-item-cuerpo">
          <strong>${it.titulo}</strong>
          <div class="modulo-item-enlaces">
            ${tieneUrl ? `<a href="${it.url}" target="_blank" rel="noopener"><i class="fa-solid fa-link"></i> Enlace</a>` : ""}
            ${tieneArchivo ? `<a href="${it.archivo_url}" target="_blank" rel="noopener"><i class="fa-solid fa-file-arrow-down"></i> Archivo subido</a>` : ""}
          </div>
          <p>${formatFecha(it.creado_at)}</p>
        </div>
        <div class="modulo-item-acciones">
          <button class="btn-icono-peq" title="Editar" onclick="abrirModalContenido('${modulo.id}','${it.id}')"><i class="fa-solid fa-pen"></i></button>
          <button class="btn-icono-peq peligro" title="Eliminar" onclick="eliminarItemModulo('${it.id}','${modulo.id}','${cursoId}')"><i class="fa-solid fa-trash"></i></button>
        </div>
      </div>`;
    }
    // tarea
    const venceTxt = it.fecha_entrega ? `<span class="vence-tag ${urgencia(it.fecha_entrega)}">Vence: ${formatFecha(it.fecha_entrega)}</span>` : "";
    return `
    <div class="modulo-item">
      <div class="modulo-item-icono icono-tarea"><i class="fa-solid fa-clipboard-list"></i></div>
      <div class="modulo-item-cuerpo">
        <strong>${it.titulo} ${it.puntos ? `<span style="color:#8b5cf6;font-weight:700;font-size:.78rem;">· ${it.puntos} pts</span>` : ""}</strong>
        <p>${it.contenido || ""}</p>
        <div style="display:flex; gap:.6rem; align-items:center; margin-top:.3rem; flex-wrap:wrap;">
          ${venceTxt}
          ${it.url ? `<a href="${it.url}" target="_blank" class="archivo-ref"><i class="fa-solid fa-link"></i> Enlace</a>` : ""}
          ${it.archivo_url ? `<a href="${it.archivo_url}" target="_blank" class="archivo-ref"><i class="fa-solid fa-file-arrow-down"></i> Archivo adjunto</a>` : ""}
        </div>
      </div>
      <div class="modulo-item-acciones">
        <button class="btn-icono-peq" title="Editar" onclick="abrirModalContenido('${modulo.id}','${it.id}')"><i class="fa-solid fa-pen"></i></button>
        <button class="btn-icono-peq peligro" title="Eliminar" onclick="eliminarItemModulo('${it.id}','${modulo.id}','${cursoId}')"><i class="fa-solid fa-trash"></i></button>
      </div>
    </div>`;
  }).join("");
}

window.toggleModulo = function(moduloId, cursoId) {
  moduloExpandidoId = moduloExpandidoId === moduloId ? null : moduloId;
  renderModulos(cursoId);
};

window.eliminarModulo = async function(moduloId, cursoId) {
  const confirmado = await confirmarAccion({
    titulo: "¿Eliminar este módulo?",
    mensaje: "Se eliminará junto con todo su contenido: textos, archivos y tareas. Esta acción no se puede deshacer.",
    textoBoton: "Eliminar módulo",
  });
  if (!confirmado) return;

  await supabase.from("modulo_items").delete().eq("modulo_id", moduloId);
  const { error } = await supabase.from("modulos").delete().eq("id", moduloId);
  if (error) { mostrarToast(`No se pudo eliminar el módulo: ${error.message || "intenta de nuevo."}`, "error"); return; }

  if (moduloExpandidoId === moduloId) moduloExpandidoId = null;
  await cargarModulosCurso(cursoId);
  mostrarToast("Módulo eliminado.", "info");
};

window.eliminarItemModulo = async function(itemId, moduloId, cursoId) {
  const confirmado = await confirmarAccion({
    titulo: "¿Eliminar este elemento?",
    mensaje: "Se quitará del módulo de forma permanente.",
    textoBoton: "Eliminar",
  });
  if (!confirmado) return;

  const { error } = await supabase.from("modulo_items").delete().eq("id", itemId);
  if (error) { mostrarToast(`No se pudo eliminar: ${error.message || "intenta de nuevo."}`, "error"); return; }
  await cargarModulosCurso(cursoId);
  mostrarToast("Elemento eliminado.", "ok");
};

// ── Modal crear/editar módulo ──
window.abrirModalModulo = function(cursoId, moduloId = null) {
  const titulo = document.getElementById("modalModuloTitulo");
  const form   = document.getElementById("formModulo");
  form.dataset.cursoId = cursoId;
  document.getElementById("moduloId").value = moduloId || "";
  setErr("errModuloTitulo", "");
  document.getElementById("alertaModulo").className = "alerta";

  if (moduloId) {
    const m = modulosActivo.find(mm => mm.id === moduloId);
    titulo.innerHTML = `<i class="fa-solid fa-pen"></i> Editar módulo`;
    document.getElementById("moduloTitulo").value = m?.titulo || "";
    document.getElementById("moduloDesc").value   = m?.descripcion || "";
  } else {
    titulo.innerHTML = `<i class="fa-solid fa-layer-group"></i> Nuevo módulo`;
    document.getElementById("moduloTitulo").value = "";
    document.getElementById("moduloDesc").value   = "";
  }

  document.getElementById("modalModulo").style.display = "flex";
  document.body.style.overflow = "hidden";
};

function cerrarModalModulo() {
  document.getElementById("modalModulo").style.display = "none";
  document.body.style.overflow = "";
}

// ── Dropdown "Agregar contenido" (Texto / Archivo / Tarea) ──
window.toggleDropdownAgregar = function(moduloId, e) {
  e?.stopPropagation();
  const wrapper = document.querySelector(`.dropdown-agregar[data-modulo-id="${moduloId}"]`);
  if (!wrapper) return;
  const boton = wrapper.querySelector("button");
  const menu  = wrapper.querySelector(".dropdown-menu-agregar");
  const yaAbierto = !menu.classList.contains("oculto");

  // Cerrar cualquier otro dropdown abierto antes de abrir este
  document.querySelectorAll(".dropdown-menu-agregar").forEach(m => m.classList.add("oculto"));
  document.querySelectorAll(".dropdown-agregar").forEach(w => w.classList.remove("abierto"));

  if (!yaAbierto) {
    // Como el menú es position:fixed (para no quedar recortado por el overflow
    // de la tarjeta de módulo), su posición se calcula en JS según el botón.
    const rect = boton.getBoundingClientRect();
    const anchoMenu = 250;
    let left = rect.right - anchoMenu;
    if (left < 8) left = 8; // no se sale por la izquierda en pantallas chicas
    menu.style.top  = `${rect.bottom + 8}px`;
    menu.style.left = `${left}px`;

    menu.classList.remove("oculto");
    wrapper.classList.add("abierto");

    // Si se sale por abajo del viewport, lo mostramos arriba del botón en su lugar
    requestAnimationFrame(() => {
      const menuRect = menu.getBoundingClientRect();
      if (menuRect.bottom > window.innerHeight - 8) {
        menu.style.top = `${rect.top - menuRect.height - 8}px`;
      }
    });
  }
};

window.elegirTipoContenido = function(moduloId, tipo) {
  document.querySelectorAll(".dropdown-menu-agregar").forEach(m => m.classList.add("oculto"));
  document.querySelectorAll(".dropdown-agregar").forEach(w => w.classList.remove("abierto"));
  window.abrirModalContenido(moduloId, null, tipo);
};

// Cerrar el dropdown si se hace clic en cualquier otro lugar de la página
document.addEventListener("click", (e) => {
  if (e.target.closest(".dropdown-agregar")) return;
  document.querySelectorAll(".dropdown-menu-agregar").forEach(m => m.classList.add("oculto"));
  document.querySelectorAll(".dropdown-agregar").forEach(w => w.classList.remove("abierto"));
});

// Como el menú usa position:fixed, su posición calculada queda obsoleta
// si la página se desplaza o cambia de tamaño — lo cerramos en ese caso.
window.addEventListener("scroll", () => {
  document.querySelectorAll(".dropdown-menu-agregar").forEach(m => m.classList.add("oculto"));
  document.querySelectorAll(".dropdown-agregar").forEach(w => w.classList.remove("abierto"));
}, true);
window.addEventListener("resize", () => {
  document.querySelectorAll(".dropdown-menu-agregar").forEach(m => m.classList.add("oculto"));
  document.querySelectorAll(".dropdown-agregar").forEach(w => w.classList.remove("abierto"));
});

// ── Modal agregar / editar contenido de un módulo ──
window.abrirModalContenido = function(moduloId, itemId = null, tipoInicial = "texto") {
  moduloContenidoId = itemId ? null : moduloId; // se recalcula abajo si es edición
  document.getElementById("contenidoModuloId").value = moduloId;
  document.getElementById("contenidoItemId").value = itemId || "";

  const tituloModal = document.getElementById("modalContenidoTitulo");
  const tabsWrap     = document.getElementById("tabsTipoContenido");

  // Reset campos
  ["ctTitulo","ctContenido","caNombre","archivoUrl","tareaTitulo","tareaDesc","tareaFecha","tareaPuntos","tareaUrl"].forEach(id => {
    const el = document.getElementById(id); if (el) el.value = "";
  });
  const archivoFile = document.getElementById("archivoFile"); if (archivoFile) archivoFile.value = "";
  const tareaFile = document.getElementById("tareaFile"); if (tareaFile) tareaFile.value = "";

  const archivoActualInfo = document.getElementById("archivoActualInfo");
  if (archivoActualInfo) { archivoActualInfo.className = "archivo-actual-info oculto"; archivoActualInfo.innerHTML = ""; }
  const tareaArchivoActualInfo = document.getElementById("tareaArchivoActualInfo");
  if (tareaArchivoActualInfo) { tareaArchivoActualInfo.className = "archivo-actual-info oculto"; tareaArchivoActualInfo.innerHTML = ""; }

  ["alertaContTexto","alertaContArchivo","alertaContTarea"].forEach(id => {
    const el = document.getElementById(id); if (el) el.className = "alerta";
  });

  let tipoForzado = tipoInicial || "texto";

  if (itemId) {
    // ── Modo edición: buscar el item y precargar sus datos ──
    const modulo = modulosActivo.find(m => m.id === moduloId);
    const item    = modulo?.items.find(i => i.id === itemId);
    if (!item) return;
    moduloContenidoId = moduloId;
    tipoForzado = item.tipo;

    if (item.tipo === "texto") {
      document.getElementById("ctTitulo").value    = item.titulo || "";
      document.getElementById("ctContenido").value = item.contenido || "";
      document.getElementById("btnGuardarTexto").innerHTML = `<i class="fa-solid fa-floppy-disk"></i> Guardar cambios`;
    } else if (item.tipo === "archivo") {
      document.getElementById("caNombre").value = item.titulo || "";
      document.getElementById("archivoUrl").value = item.url || "";
      if (item.archivo_url && archivoActualInfo) {
        archivoActualInfo.className = "archivo-actual-info";
        archivoActualInfo.innerHTML = `<i class="fa-solid fa-circle-check"></i> Ya hay un archivo subido. <a href="${item.archivo_url}" target="_blank" rel="noopener">Verlo</a> — selecciona otro arriba para reemplazarlo.`;
      }
      document.getElementById("btnGuardarArchivo").innerHTML = `<i class="fa-solid fa-floppy-disk"></i> Guardar cambios`;
    } else if (item.tipo === "tarea") {
      document.getElementById("tareaTitulo").value = item.titulo || "";
      document.getElementById("tareaDesc").value    = item.contenido || "";
      document.getElementById("tareaFecha").value   = item.fecha_entrega || "";
      document.getElementById("tareaPuntos").value  = item.puntos || "";
      document.getElementById("tareaUrl").value     = item.url || "";
      if (item.archivo_url && tareaArchivoActualInfo) {
        tareaArchivoActualInfo.className = "archivo-actual-info";
        tareaArchivoActualInfo.innerHTML = `<i class="fa-solid fa-circle-check"></i> Ya hay un archivo adjunto. <a href="${item.archivo_url}" target="_blank" rel="noopener">Verlo</a> — selecciona otro arriba para reemplazarlo.`;
      }
      document.getElementById("btnGuardarTarea").innerHTML = `<i class="fa-solid fa-floppy-disk"></i> Guardar cambios`;
    }

    tituloModal.innerHTML = `<i class="fa-solid fa-pen"></i> Editar contenido`;
    // En edición no se permite cambiar el tipo de contenido
    tabsWrap.classList.add("oculto");
  } else {
    moduloContenidoId = moduloId;
    const etiquetas = { texto: "Agregar texto", archivo: "Agregar archivo", tarea: "Agregar tarea" };
    tituloModal.innerHTML = `<i class="fa-solid fa-circle-plus"></i> ${etiquetas[tipoForzado] || "Agregar contenido"}`;
    tabsWrap.classList.remove("oculto");
    document.getElementById("btnGuardarTexto").innerHTML   = `<i class="fa-solid fa-floppy-disk"></i> Agregar texto`;
    document.getElementById("btnGuardarArchivo").innerHTML = `<i class="fa-solid fa-cloud-arrow-up"></i> Agregar archivo`;
    document.getElementById("btnGuardarTarea").innerHTML   = `<i class="fa-solid fa-plus"></i> Crear tarea`;
  }

  // Activar el tab correspondiente (forzado en edición, "texto" por defecto al crear)
  document.querySelectorAll(".tab-cont").forEach(b => b.classList.remove("activo-tab"));
  document.querySelector(`.tab-cont[data-cont="${tipoForzado}"]`)?.classList.add("activo-tab");
  document.querySelectorAll(".cont-panel").forEach(p => p.classList.add("oculto"));
  document.querySelector(`.cont-panel[data-cont-panel="${tipoForzado}"]`)?.classList.remove("oculto");

  document.getElementById("modalContenidoModulo").style.display = "flex";
  document.body.style.overflow = "hidden";
};

function cerrarModalContenido() {
  document.getElementById("modalContenidoModulo").style.display = "none";
  document.body.style.overflow = "";
  moduloContenidoId = null;
  document.getElementById("contenidoItemId").value = "";
  document.getElementById("tabsTipoContenido")?.classList.remove("oculto");
}

function initModalesModulo() {
  document.getElementById("btnCerrarModalModulo")?.addEventListener("click", cerrarModalModulo);
  document.getElementById("btnCancelarModalModulo")?.addEventListener("click", cerrarModalModulo);
  document.getElementById("modalModulo")?.addEventListener("click", e => { if (e.target.id === "modalModulo") cerrarModalModulo(); });

  document.getElementById("btnNuevoModulo")?.addEventListener("click", () => {
    if (cursoActivo) window.abrirModalModulo(cursoActivo.id);
  });

  document.getElementById("formModulo")?.addEventListener("submit", async e => {
    e.preventDefault();
    const cursoId   = e.target.dataset.cursoId;
    const moduloId  = document.getElementById("moduloId")?.value;
    const titulo    = document.getElementById("moduloTitulo")?.value.trim();
    const desc      = document.getElementById("moduloDesc")?.value.trim();
    const alerta    = document.getElementById("alertaModulo");

    if (!titulo) { setErr("errModuloTitulo", "El título es obligatorio."); return; }
    setErr("errModuloTitulo", "");

    if (moduloId) {
      const { error } = await supabase.from("modulos").update({ titulo, descripcion: desc || null }).eq("id", moduloId);
      if (error) { mostrarAlerta(alerta, "error", "Error al guardar el módulo."); return; }
      mostrarAlerta(alerta, "ok", "Módulo actualizado.");
    } else {
      const { data: { user } } = await supabase.auth.getUser();
      const orden = modulosActivo.length;
      const { error } = await supabase.from("modulos").insert({
        curso_id: cursoId, docente_id: user.id, titulo, descripcion: desc || null, orden,
      });
      if (error) { mostrarAlerta(alerta, "error", "Error al crear el módulo."); return; }
      mostrarAlerta(alerta, "ok", "Módulo creado.");
    }

    await cargarModulosCurso(cursoId);
    setTimeout(cerrarModalModulo, 700);
  });

  // ── Modal contenido: cerrar ──
  document.getElementById("btnCerrarModalContenido")?.addEventListener("click", cerrarModalContenido);
  document.getElementById("modalContenidoModulo")?.addEventListener("click", e => { if (e.target.id === "modalContenidoModulo") cerrarModalContenido(); });
  document.querySelectorAll(".btn-cerrar-contenido").forEach(btn => btn.addEventListener("click", cerrarModalContenido));

  // ── Submit: contenido tipo texto (crear o editar) ──
  document.getElementById("formContenidoTexto")?.addEventListener("submit", async e => {
    e.preventDefault();
    const titulo    = document.getElementById("ctTitulo")?.value.trim();
    const contenido = document.getElementById("ctContenido")?.value.trim();
    const alerta    = document.getElementById("alertaContTexto");
    const itemId    = document.getElementById("contenidoItemId")?.value;
    const btn       = document.getElementById("btnGuardarTexto");
    if (!contenido) { mostrarAlerta(alerta, "error", "Escribe el contenido del módulo."); return; }

    if (btn) { btn.disabled = true; }
    const { data: { user } } = await supabase.auth.getUser();

    let error;
    if (itemId) {
      ({ error } = await supabase.from("modulo_items")
        .update({ titulo: titulo || "Texto", contenido })
        .eq("id", itemId));
    } else {
      ({ error } = await supabase.from("modulo_items").insert({
        modulo_id: moduloContenidoId, docente_id: user.id,
        tipo: "texto", titulo: titulo || "Texto", contenido,
      }));
    }

    if (btn) { btn.disabled = false; }
    if (error) { mostrarAlerta(alerta, "error", `Error al guardar: ${error.message || "intenta de nuevo."}`); return; }

    mostrarAlerta(alerta, "ok", itemId ? "Texto actualizado." : "Texto agregado.");
    await cargarModulosCurso(cursoActivo.id);
    setTimeout(cerrarModalContenido, 700);
  });

  // ── Submit: contenido tipo archivo (crear o editar) — URL y archivo combinables ──
  document.getElementById("formContenidoArchivo")?.addEventListener("submit", async e => {
    e.preventDefault();
    const nombre = document.getElementById("caNombre")?.value.trim();
    const url     = document.getElementById("archivoUrl")?.value.trim();
    const alerta = document.getElementById("alertaContArchivo");
    const itemId = document.getElementById("contenidoItemId")?.value;
    const btn    = document.getElementById("btnGuardarArchivo");
    const fileInput = document.getElementById("archivoFile");
    const file      = fileInput?.files[0];
    const { data: { user } } = await supabase.auth.getUser();

    if (!nombre) { mostrarAlerta(alerta, "error", "Escribe el nombre del archivo."); return; }
    if (!url && !file && !itemId) {
      mostrarAlerta(alerta, "error", "Agrega un enlace, sube un archivo, o ambos."); return;
    }
    if (file && file.size > 50 * 1024 * 1024) { mostrarAlerta(alerta, "error", "El archivo supera 50 MB."); return; }

    if (btn) btn.disabled = true;

    const payload = { titulo: nombre, url: url || null };

    if (file) {
      const progreso     = document.getElementById("progresoUpload");
      const progresoFill = document.getElementById("progresoFill");
      const progresoTxt  = document.getElementById("progresoTexto");
      if (progreso) progreso.classList.remove("oculto");
      if (progresoFill) { progresoFill.style.width = "0%"; progresoFill.classList.add("indeterminado"); }
      if (progresoTxt) progresoTxt.textContent = "Subiendo archivo...";

      // Nota: el SDK de Supabase Storage (v2) no expone progreso real de subida
      // (no existe la opción onUploadProgress), por eso se usa una animación indeterminada.
      const path = `cursos/${cursoActivo.id}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
      const { error: errUp } = await supabase.storage.from("materiales").upload(path, file, { upsert: true });

      if (progreso) progreso.classList.add("oculto");
      if (progresoFill) progresoFill.classList.remove("indeterminado");

      if (errUp) {
        if (btn) btn.disabled = false;
        mostrarAlerta(alerta, "error", `Error al subir el archivo: ${errUp.message || "verifica el bucket 'materiales' en Supabase Storage."}`);
        return;
      }

      const { data: urlData } = supabase.storage.from("materiales").getPublicUrl(path);
      payload.archivo_url = urlData?.publicUrl;
      payload.es_upload = true;
    }
    // Si no se eligió un archivo nuevo, no se toca archivo_url (se conserva el que ya hubiera al editar)

    let error;
    if (itemId) {
      ({ error } = await supabase.from("modulo_items").update(payload).eq("id", itemId));
    } else {
      ({ error } = await supabase.from("modulo_items").insert({
        modulo_id: moduloContenidoId, docente_id: user.id, tipo: "archivo", ...payload,
      }));
    }
    if (btn) btn.disabled = false;
    if (error) { mostrarAlerta(alerta, "error", `Error al guardar: ${error.message || "intenta de nuevo."}`); return; }
    mostrarAlerta(alerta, "ok", itemId ? "Archivo actualizado." : "Archivo añadido.");

    await cargarModulosCurso(cursoActivo.id);
    setTimeout(cerrarModalContenido, 700);
  });

  // ── Submit: contenido tipo tarea (crear o editar) — enlace y archivo combinables ──
  document.getElementById("formContenidoTarea")?.addEventListener("submit", async e => {
    e.preventDefault();
    const titulo  = document.getElementById("tareaTitulo")?.value.trim();
    const desc    = document.getElementById("tareaDesc")?.value.trim();
    const fecha   = document.getElementById("tareaFecha")?.value;
    const puntos  = document.getElementById("tareaPuntos")?.value;
    const urlRef  = document.getElementById("tareaUrl")?.value.trim();
    const alerta  = document.getElementById("alertaContTarea");
    const itemId  = document.getElementById("contenidoItemId")?.value;
    const btn     = document.getElementById("btnGuardarTarea");
    const file    = document.getElementById("tareaFile")?.files[0];
    const { data: { user } } = await supabase.auth.getUser();
    if (!titulo) { mostrarAlerta(alerta, "error", "El título es obligatorio."); return; }
    if (file && file.size > 50 * 1024 * 1024) { mostrarAlerta(alerta, "error", "El archivo supera 50 MB."); return; }

    if (btn) btn.disabled = true;

    const payload = {
      titulo, contenido: desc || null,
      fecha_entrega: fecha || null,
      puntos: puntos ? parseInt(puntos) : null,
      url: urlRef || null,
    };

    if (file) {
      const path = `tareas/${cursoActivo.id}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
      const { error: errUp } = await supabase.storage.from("materiales").upload(path, file, { upsert: true });
      if (errUp) {
        if (btn) btn.disabled = false;
        mostrarAlerta(alerta, "error", `Error al subir adjunto: ${errUp.message || "intenta de nuevo."}`);
        return;
      }
      const { data: urlData } = supabase.storage.from("materiales").getPublicUrl(path);
      payload.archivo_url = urlData?.publicUrl;
    }
    // Si no se seleccionó un archivo nuevo, no se toca archivo_url (se conserva el existente al editar)

    let error;
    if (itemId) {
      ({ error } = await supabase.from("modulo_items").update(payload).eq("id", itemId));
    } else {
      ({ error } = await supabase.from("modulo_items").insert({
        modulo_id: moduloContenidoId, docente_id: user.id, tipo: "tarea", ...payload,
      }));
    }
    if (btn) btn.disabled = false;
    if (error) { mostrarAlerta(alerta, "error", `Error al guardar la tarea: ${error.message || "intenta de nuevo."}`); return; }
    mostrarAlerta(alerta, "ok", itemId ? "Tarea actualizada." : "Tarea creada.");

    await cargarModulosCurso(cursoActivo.id);
    setTimeout(cerrarModalContenido, 700);
  });
}

// ══ ACCIONES DETALLE CURSO (anuncios, visibilidad, eliminar curso) ═══════════
function initAccionesCurso(cursoId) {
  reemplazarYEscuchar("btnPublicarAnuncio", async () => {
    const titulo    = document.getElementById("anuncioTitulo")?.value.trim();
    const contenido = document.getElementById("anuncioContenido")?.value.trim();
    const alerta    = document.getElementById("alertaAnuncio");
    const { data: { user } } = await supabase.auth.getUser();
    if (!titulo || !contenido) { mostrarAlerta(alerta, "error", "Completa título y contenido."); return; }
    const { error } = await supabase.from("anuncios").insert({ curso_id: cursoId, docente_id: user.id, titulo, contenido });
    if (error) { mostrarAlerta(alerta, "error", "Error al publicar."); return; }
    mostrarAlerta(alerta, "ok", "Anuncio publicado.");
    document.getElementById("anuncioTitulo").value    = "";
    document.getElementById("anuncioContenido").value = "";
    await cargarAnunciosCurso(cursoId);
  });

  reemplazarYEscuchar("btnCambiarVisibilidad", async () => {
    const nuevo = !cursoActivo.es_publico;
    const { error } = await supabase.from("cursos").update({ es_publico: nuevo }).eq("id", cursoActivo.id);
    if (error) { mostrarToast(`Error al cambiar visibilidad: ${error.message || "intenta de nuevo."}`, "error"); return; }
    cursoActivo.es_publico = nuevo;
    cursosDocente = cursosDocente.map(c => c.id === cursoActivo.id ? { ...c, es_publico: nuevo } : c);
    actualizarBadgeYBotonVis(); // ya repinta la alerta-vis con el nuevo estado
    mostrarToast(nuevo ? "Curso publicado. 🌍" : "Curso privado. Solo con código. 🔒", nuevo ? "ok" : "info");
  });

  reemplazarYEscuchar("btnEliminarCurso", async () => {
    const confirmado = await confirmarAccion({
      titulo: `¿Eliminar "${cursoActivo.nombre}"?`,
      mensaje: "Se eliminarán también todos sus módulos, archivos, tareas, anuncios y la lista de estudiantes inscritos. Esta acción no se puede deshacer.",
      textoBoton: "Eliminar curso",
    });
    if (!confirmado) return;

    const { error } = await supabase.from("cursos").delete().eq("id", cursoActivo.id);
    if (error) { mostrarToast(`No se pudo eliminar el curso: ${error.message || "intenta de nuevo."}`, "error"); return; }
    cursosDocente = cursosDocente.filter(c => c.id !== cursoActivo.id);
    renderCursos();
    mostrarVista("cursos");
    mostrarToast("Curso eliminado.", "info");
  });
}

// ══ ELIMINAR ANUNCIOS ═════════════════════════════════════════════════════════
window.eliminarAnuncio = async (id, cursoId) => {
  const confirmado = await confirmarAccion({
    titulo: "¿Eliminar este anuncio?",
    mensaje: "Los estudiantes ya no podrán verlo.",
    textoBoton: "Eliminar",
  });
  if (!confirmado) return;

  const { error } = await supabase.from("anuncios").delete().eq("id", id);
  if (error) { mostrarToast(`No se pudo eliminar el anuncio: ${error.message || "intenta de nuevo."}`, "error"); return; }
  await cargarAnunciosCurso(cursoId);
  mostrarToast("Anuncio eliminado.", "ok");
};

// ══ PESTAÑAS DETALLE ══════════════════════════════════════════════════════════
function initPestanas(cursoId) {
  document.querySelectorAll(".pestana-btn").forEach(btn => {
    const nuevo = btn.cloneNode(true); btn.replaceWith(nuevo);
  });
  document.querySelectorAll(".pestana-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".pestana-btn").forEach(b => b.classList.remove("activa"));
      document.querySelectorAll(".pestana-panel").forEach(p => p.classList.add("oculto"));
      btn.classList.add("activa");
      document.querySelector(`.pestana-panel[data-panel="${btn.dataset.pestana}"]`)?.classList.remove("oculto");
      if (btn.dataset.pestana === "entregas") cargarEntregasCurso(cursoId);
    });
  });
}

// ══ CREAR CURSO (con imagen) ═══════════════════════════════════════════════════
function initFormCrearCurso() {
  const form = document.getElementById("formCrearCurso");
  if (!form) return;
  cargarCheckEstudiantes();

  document.getElementById("buscarEstudiante")?.addEventListener("input", e => {
    const q = e.target.value.toLowerCase();
    document.querySelectorAll(".check-item").forEach(item => {
      item.style.display = item.textContent.toLowerCase().includes(q) ? "" : "none";
    });
  });

  form.addEventListener("submit", async e => {
    e.preventDefault();
    const nombre    = document.getElementById("cNombre")?.value.trim();
    const nivel     = document.getElementById("cNivel")?.value;
    const desc      = document.getElementById("cDesc")?.value.trim();
    const esPublico = document.querySelector('input[name="cVisibilidad"]:checked')?.value === "publico";
    const alerta    = document.getElementById("alertaCrearCurso");
    const btnGuardar = form.querySelector('[type="submit"]');

    let valido = true;
    if (!nombre) { setErr("errCNombre", "Campo obligatorio."); valido = false; } else setErr("errCNombre", "");
    if (!nivel)  { setErr("errCNivel",  "Elige un nivel.");   valido = false; } else setErr("errCNivel", "");
    if (!valido) return;

    if (btnGuardar) { btnGuardar.disabled = true; btnGuardar.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Guardando...`; }

    const { data: { user } } = await supabase.auth.getUser();
    const codigo = generarCodigo();

    const { data: cursoDB, error } = await supabase.from("cursos").insert({
      docente_id: user.id, nombre,
      descripcion: desc || null, nivel, codigo,
      es_publico: esPublico,
    }).select().single();

    if (error) {
      mostrarAlerta(alerta, "error", "Error al crear el curso.");
      if (btnGuardar) { btnGuardar.disabled = false; btnGuardar.innerHTML = `<i class="fa-solid fa-floppy-disk"></i> Guardar curso`; }
      return;
    }

    const imgFile = document.getElementById("cImagen")?.files[0];
    if (imgFile) {
      const imgPath = `cursos/${cursoDB.id}/portada_${Date.now()}.${imgFile.name.split(".").pop()}`;
      const { error: errImg } = await supabase.storage.from("imagenes-cursos").upload(imgPath, imgFile, { upsert: true });
      if (!errImg) {
        const { data: imgUrl } = supabase.storage.from("imagenes-cursos").getPublicUrl(imgPath);
        await supabase.from("cursos").update({ imagen_url: imgUrl.publicUrl }).eq("id", cursoDB.id);
        cursoDB.imagen_url = imgUrl.publicUrl;
      }
    }

    const checks = document.querySelectorAll(".check-estudiante:checked");
    if (checks.length > 0) {
      await supabase.from("inscripciones").insert(
        Array.from(checks).map(c => ({ curso_id: cursoDB.id, estudiante_id: c.value }))
      );
    }

    mostrarAlerta(alerta, "ok",
      esPublico ? `Curso creado y publicado. Código: ${codigo}` : `Curso creado. Código: ${codigo}`);
    form.reset();
    const prev = document.getElementById("prevImagen");
    const drop = document.getElementById("dropImagen");
    if (prev) prev.style.display = "none";
    if (drop) drop.style.display = "flex";

    await cargarCursos();
    if (btnGuardar) { btnGuardar.disabled = false; btnGuardar.innerHTML = `<i class="fa-solid fa-floppy-disk"></i> Guardar curso`; }
    setTimeout(() => {
      if (typeof cerrarModalCrearCurso === "function") cerrarModalCrearCurso();
      mostrarVista("cursos");
    }, 1500);
  });
}

async function cargarCheckEstudiantes() {
  const { data } = await supabase.from("perfiles").select("id, nombre, apellido").eq("rol", "estudiante");
  const lista = document.getElementById("listaCheckEstudiantes");
  if (!lista || !data) return;
  lista.innerHTML = data.length
    ? data.map(e => `<label class="check-item"><input type="checkbox" class="check-estudiante" value="${e.id}"> ${e.nombre} ${e.apellido}</label>`).join("")
    : `<p class="sin-datos" style="font-size:.82rem;">No hay estudiantes registrados aún.</p>`;
}

async function cargarListaEstudiantes() {
  const cursoIds = cursosDocente.map(c => c.id);
  const tabla = document.getElementById("tablaEstudiantes");
  if (!tabla) return;

  const { data: todosEstudiantes } = await supabase
    .from("perfiles")
    .select("id, nombre, apellido")
    .eq("rol", "estudiante")
    .order("nombre", { ascending: true });

  let inscripciones = [];
  if (cursoIds.length > 0) {
    const { data } = await supabase
      .from("inscripciones")
      .select("estudiante_id, curso_id, cursos(nombre)")
      .in("curso_id", cursoIds);
    inscripciones = data || [];
  }

  window.__estudiantesData = (todosEstudiantes || []).map(e => ({
    id: e.id,
    nombre: `${e.nombre} ${e.apellido}`.trim(),
    inscripciones: inscripciones
      .filter(i => i.estudiante_id === e.id)
      .map(i => ({ cursoId: i.curso_id, cursoNombre: i.cursos?.nombre || "" })),
  }));

  const renderTabla = (lista) => {
    tabla.innerHTML = lista.length
      ? lista.map(e => `
          <div class="fila-estudiante" style="align-items:flex-start; flex-wrap:wrap; gap:.6rem;">
            <div class="avatar-mini" style="margin-top:.2rem;"><i class="fa-solid fa-user-graduate"></i></div>
            <span style="flex:1; min-width:120px; font-weight:700;">${e.nombre}</span>
            <div style="display:flex; gap:.4rem; flex-wrap:wrap; flex:2; align-items:center;">
              ${e.inscripciones.length
                ? e.inscripciones.map(ins => `
                    <span style="display:inline-flex; align-items:center; gap:.3rem;" class="curso-tag">
                      ${ins.cursoNombre}
                      <button class="btn-icono-peq peligro btn-quitar-curso"
                        data-estudiante-id="${e.id}"
                        data-curso-id="${ins.cursoId}"
                        title="Quitar de este curso"
                        style="width:20px; height:20px; font-size:.65rem; border-radius:6px;">
                        <i class="fa-solid fa-xmark"></i>
                      </button>
                    </span>`).join("")
                : `<span style="font-size:.78rem; color:var(--texto-claro); font-weight:600;">Sin cursos</span>`
              }
              ${cursosDocente.length ? `
                <div style="display:inline-flex; align-items:center; gap:.3rem;">
                  <select class="select-inscribir" data-estudiante-id="${e.id}"
                    style="font-size:.75rem; padding:.2rem .5rem; border:1.5px solid var(--borde);
                    border-radius:8px; font-family:'Nunito',sans-serif; color:var(--texto);
                    background:var(--blanco); outline:none; cursor:pointer; max-width:160px;">
                    <option value="">+ Añadir a curso...</option>
                    ${cursosDocente
                      .filter(c => !e.inscripciones.some(i => i.cursoId === c.id))
                      .map(c => `<option value="${c.id}">${c.nombre}</option>`)
                      .join("")}
                  </select>
                </div>` : ""}
            </div>
          </div>`).join("")
      : `<p class="sin-datos">Sin resultados.</p>`;

    tabla.querySelectorAll(".btn-quitar-curso").forEach(btn => {
      btn.addEventListener("click", () => {
        window.quitarDeUnCurso(btn.dataset.estudianteId, btn.dataset.cursoId);
      });
    });

    tabla.querySelectorAll(".select-inscribir").forEach(sel => {
      sel.addEventListener("change", async () => {
        const estudianteId = sel.dataset.estudianteId;
        const cursoId = sel.value;
        if (!cursoId) return;

        const { error } = await supabase.from("inscripciones").insert({
          estudiante_id: estudianteId,
          curso_id: cursoId,
        });

        if (error) {
          mostrarToast(`Error al inscribir: ${error.message}`, "error");
          sel.value = "";
          return;
        }

        const curso = cursosDocente.find(c => c.id === cursoId);
        mostrarToast(`Estudiante añadido a "${curso?.nombre}". ✅`, "ok");
        await cargarListaEstudiantes();
      });
    });
  };

  renderTabla(window.__estudiantesData);

  const buscarViejo = document.getElementById("buscarTablaEstudiante");
  if (buscarViejo) {
    const buscarNuevo = buscarViejo.cloneNode(true);
    buscarViejo.replaceWith(buscarNuevo);
    buscarNuevo.addEventListener("input", e => {
      const q = e.target.value.toLowerCase();
      renderTabla(window.__estudiantesData.filter(e => e.nombre.toLowerCase().includes(q)));
    });
  }
}

window.quitarDeUnCurso = async function(estudianteId, cursoId) {
  const curso = cursosDocente.find(c => c.id === cursoId);
  const confirmado = await confirmarAccion({
    titulo: "¿Quitar de este curso?",
    mensaje: `El estudiante perderá el acceso a "${curso?.nombre || "este curso"}".`,
    textoBoton: "Quitar",
    icono: "fa-user-minus",
  });
  if (!confirmado) return;

  const { error } = await supabase.from("inscripciones")
    .delete()
    .eq("estudiante_id", estudianteId)
    .eq("curso_id", cursoId);

  if (error) {
    mostrarToast(`No se pudo quitar: ${error.message || "intenta de nuevo."}`, "error");
    return;
  }
  mostrarToast("Estudiante quitado del curso.", "ok");
  await cargarListaEstudiantes();
};
// ══ VISTA COMO ESTUDIANTE ═════════════════════════════════════════════════════
function initVistaEstudiante() {
  const abrirVista = () => {
    if (!perfilActual?.id) return;
    window.open(`/paginas/panel_estudiante.html?preview_docente=${perfilActual.id}`, "_blank");
  };
  // Botón flotante (esquina superior)
  document.getElementById("btnVistaEstudiante")?.addEventListener("click", abrirVista);
  // Botón del sidebar (reemplaza cerrar sesión)
  document.getElementById("btnVistaEstudianteSidebar")?.addEventListener("click", abrirVista);
}

// ══ PERFIL ════════════════════════════════════════════════════════════════════
function initFormPerfil() {
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
    const { error } = await supabase.from("perfiles").update({ nombre, apellido }).eq("id", user.id);
    if (error) { mostrarAlerta(alerta, "error", "Error al guardar."); return; }
    if (clave) {
      const { error: errC } = await supabase.auth.updateUser({ password: clave });
      if (errC) { mostrarAlerta(alerta, "error", "Perfil guardado pero error al cambiar contraseña."); return; }
    }
    mostrarAlerta(alerta, "ok", "¡Cambios guardados!");
    const sN = document.getElementById("sideNombre"); if (sN) sN.textContent = `${nombre} ${apellido}`;
  });

  document.querySelectorAll(".btn-ojo").forEach(btn => {
    btn.addEventListener("click", () => {
      const input = document.getElementById(btn.dataset.objetivo);
      const icon  = btn.querySelector("i");
      if (!input) return;
      const show = input.type === "password";
      input.type = show ? "text" : "password";
      icon.className = show ? "fa-regular fa-eye-slash" : "fa-regular fa-eye";
    });
  });
}

// ══ NAV ═══════════════════════════════════════════════════════════════════════
function initNav() {
  document.querySelectorAll(".nav-btn[data-vista]").forEach(btn => {
    btn.addEventListener("click", () => {
      const vista = btn.dataset.vista;
      if (vista === "crear") {
        if (typeof abrirModalCrearCurso === "function") abrirModalCrearCurso();
        cerrarSidebar(); return;
      }
      document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("activo"));
      btn.classList.add("activo");
      mostrarVista(vista);
      cerrarSidebar();
    });
  });
}

function mostrarVista(nombre) {
  document.querySelectorAll(".vista").forEach(v => v.classList.add("oculto"));
  document.getElementById(`vista-${nombre}`)?.classList.remove("oculto");
}

function cerrarSidebar() {
  document.querySelector(".panel-sidebar")?.classList.remove("abierto");
  document.getElementById("fondoSidebar")?.classList.remove("activo");
}

function initSidebar() {
  document.getElementById("btnAbrirSidebar")?.addEventListener("click", () => {
    document.querySelector(".panel-sidebar")?.classList.toggle("abierto");
    document.getElementById("fondoSidebar")?.classList.toggle("activo");
  });
  document.getElementById("fondoSidebar")?.addEventListener("click", cerrarSidebar);
}

function initCerrarSesion() {
  document.getElementById("btnCerrarSesion2")?.addEventListener("click", async () => {
    await supabase.auth.signOut();
    window.location.href = "/index.html";
  });
}

// ══ UTILS ═════════════════════════════════════════════════════════════════════
function reemplazarYEscuchar(id, fn) {
  const el = document.getElementById(id);
  if (!el) return;
  const nuevo = el.cloneNode(true);
  el.replaceWith(nuevo);
  nuevo.addEventListener("click", fn);
}

function generarCodigo() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

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

// ══ MODAL DE CONFIRMACIÓN (reemplaza confirm() nativo) ═══════════════════════
let resolverConfirmacion = null;

function confirmarAccion({ titulo, mensaje, textoBoton = "Eliminar", icono = "fa-trash" } = {}) {
  const modal   = document.getElementById("modalConfirmar");
  const tituloE = document.getElementById("confirmarTitulo");
  const msgE    = document.getElementById("confirmarMensaje");
  const iconoE  = document.getElementById("confirmarIcono");
  const btnOk   = document.getElementById("btnConfirmarAceptar");

  if (tituloE) tituloE.textContent = titulo || "¿Estás seguro?";
  if (msgE) msgE.textContent = mensaje || "Esta acción no se puede deshacer.";
  if (iconoE) iconoE.innerHTML = `<i class="fa-solid ${icono}"></i>`;
  if (btnOk) btnOk.innerHTML = `<i class="fa-solid ${icono}"></i> ${textoBoton}`;

  modal.style.display = "flex";
  document.body.style.overflow = "hidden";

  return new Promise((resolve) => {
    resolverConfirmacion = resolve;
  });
}

function cerrarModalConfirmar(resultado) {
  const modal = document.getElementById("modalConfirmar");
  if (modal) modal.style.display = "none";
  document.body.style.overflow = "";
  if (resolverConfirmacion) {
    resolverConfirmacion(resultado);
    resolverConfirmacion = null;
  }
}

function initModalConfirmar() {
  document.getElementById("btnConfirmarCancelar")?.addEventListener("click", () => cerrarModalConfirmar(false));
  document.getElementById("btnConfirmarAceptar")?.addEventListener("click", () => cerrarModalConfirmar(true));
  document.getElementById("modalConfirmar")?.addEventListener("click", (e) => {
    if (e.target.id === "modalConfirmar") cerrarModalConfirmar(false);
  });
}

function mostrarAlerta(el, tipo, msg) {
  if (!el) return;
  el.className = `alerta alerta-${tipo} visible`;
  el.innerHTML = `<i class="fa-solid ${tipo === "ok" ? "fa-circle-check" : "fa-circle-exclamation"}"></i> ${msg}`;
  setTimeout(() => el.classList.remove("visible"), 4000);
}

function mostrarToast(msg, tipo = "ok") {
  let t = document.getElementById("enit-toast");
  if (!t) { t = document.createElement("div"); t.id = "enit-toast"; document.body.appendChild(t); }
  t.className = `enit-toast toast-${tipo} toast-visible`;
  t.innerHTML = `<i class="fa-solid ${tipo==="ok"?"fa-circle-check":tipo==="error"?"fa-circle-exclamation":"fa-circle-info"}"></i> ${msg}`;
  clearTimeout(t._t);
  t._t = setTimeout(() => t.classList.remove("toast-visible"), 3500);
}

function setErr(id, msg) {
  const el = document.getElementById(id); if (el) el.textContent = msg;
}

// ══ ENTREGAS POR CURSO ════════════════════════════════════════════════════════
async function cargarEntregasCurso(cursoId) {
  const el = document.getElementById("listaEntregasCurso");
  if (!el) return;
  el.innerHTML = `<p class="sin-datos"><i class="fa-solid fa-spinner fa-spin"></i> Cargando entregas...</p>`;

  const { data: modulos } = await supabase
    .from("modulos").select("id, titulo")
    .eq("curso_id", cursoId).order("orden", { ascending: true });

  if (!modulos?.length) { el.innerHTML = `<p class="sin-datos">Este curso no tiene módulos.</p>`; return; }

  const moduloIds = modulos.map(m => m.id);
  const { data: tareas } = await supabase
    .from("modulo_items").select("id, titulo, puntos, fecha_entrega, modulo_id")
    .in("modulo_id", moduloIds).eq("tipo", "tarea");

  if (!tareas?.length) { el.innerHTML = `<p class="sin-datos">No hay tareas en este curso.</p>`; return; }

  const tareaIds = tareas.map(t => t.id);

  const { data: entregas, error: errE } = await supabase
    .from("entregas").select("id, tarea_id, estudiante_id, url_archivo, comentario, entregado_at, visto")
    .in("tarea_id", tareaIds)
    .order("entregado_at", { ascending: false });

  if (errE) { el.innerHTML = `<p class="sin-datos">Error al cargar entregas: ${errE.message}</p>`; return; }

  // Cargar perfiles de estudiantes por separado
  const estudianteIds = [...new Set((entregas || []).map(e => e.estudiante_id))];
  const mapaPerfiles = {};
  if (estudianteIds.length) {
    const { data: perfiles } = await supabase
      .from("perfiles").select("id, nombre, apellido")
      .in("id", estudianteIds);
    (perfiles || []).forEach(p => { mapaPerfiles[p.id] = p; });
  }

  // Agrupar módulo → tarea → entregas
  const mapaModulo = {};
  modulos.forEach(m => { mapaModulo[m.id] = { ...m, tareas: [] }; });
  tareas.forEach(t => {
    if (mapaModulo[t.modulo_id]) {
      mapaModulo[t.modulo_id].tareas.push({
        ...t,
        entregas: (entregas || [])
          .filter(e => e.tarea_id === t.id)
          .map(e => ({ ...e, perfiles: mapaPerfiles[e.estudiante_id] || null })),
      });
    }
  });

  el.innerHTML = Object.values(mapaModulo).map(modulo => {
    if (!modulo.tareas.length) return "";

    const tareasHtml = modulo.tareas.map(tarea => {
      const totalEntregas = tarea.entregas.length;
      const sinVer = tarea.entregas.filter(e => !e.visto).length;

      const entregasHtml = tarea.entregas.length
        ? tarea.entregas.map(e => {
            const nombre = `${e.perfiles?.nombre || "?"} ${e.perfiles?.apellido || ""}`.trim();
            const fecha  = formatFecha(e.entregado_at);
            const comentarioEscapado = (e.comentario || "").replace(/\\/g,"\\\\").replace(/`/g,"\\`").replace(/'/g,"\\'");
            return `
            <div class="entrega-fila ${!e.visto ? "entrega-nueva" : ""}" data-entrega-id="${e.id}">
              <div class="entrega-fila-izq">
                <div class="avatar-mini"><i class="fa-solid fa-user-graduate"></i></div>
                <div class="entrega-fila-info">
                  <strong>${nombre}</strong>
                  <span class="entrega-fila-fecha">
                    <i class="fa-regular fa-clock"></i> ${fecha}
                    ${!e.visto ? `<span class="badge-nueva">Nuevo</span>` : ""}
                  </span>
                </div>
              </div>
              <div class="entrega-fila-der">
                ${e.url_archivo
                  ? `<a href="${e.url_archivo}" target="_blank" rel="noopener"
                       class="btn-entrega-archivo" onclick="marcarVisto('${e.id}')">
                       <i class="fa-solid fa-file-arrow-down"></i> Ver archivo
                     </a>`
                  : `<span style="font-size:0.78rem;color:var(--texto-claro);font-weight:600;">Sin archivo</span>`}
                ${e.comentario
                  ? `<button class="btn-icono" title="Ver comentario"
                       onclick="verComentarioEntrega('${e.id}','${comentarioEscapado}','${nombre.replace(/'/g,"\\'")}')">
                       <i class="fa-solid fa-comment-dots"></i>
                     </button>`
                  : ""}
              </div>
            </div>`;
          }).join("")
        : `<p class="sin-datos" style="padding:0.7rem 1rem;">Nadie ha entregado esta tarea aún.</p>`;

      return `
      <div class="entrega-tarea-bloque">
        <div class="entrega-tarea-cab">
          <div style="display:flex;align-items:center;gap:0.6rem;flex:1;min-width:0;">
            <div class="modulo-item-icono icono-tarea" style="flex-shrink:0;">
              <i class="fa-solid fa-clipboard-list"></i>
            </div>
            <div style="min-width:0;">
              <strong style="font-size:0.95rem;color:var(--texto);display:block;">${tarea.titulo}</strong>
              <span style="font-size:0.75rem;color:var(--texto-claro);font-weight:600;">
                ${tarea.puntos ? `${tarea.puntos} pts · ` : ""}
                ${tarea.fecha_entrega ? `Vence: ${formatFecha(tarea.fecha_entrega)}` : "Sin fecha límite"}
              </span>
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:0.5rem;flex-shrink:0;">
            <span class="modulo-conteo">${totalEntregas} ${totalEntregas === 1 ? "entrega" : "entregas"}</span>
            ${sinVer > 0 ? `<span class="badge-nueva">${sinVer} nuevo${sinVer > 1 ? "s" : ""}</span>` : ""}
          </div>
        </div>
        <div class="entrega-tarea-lista">${entregasHtml}</div>
      </div>`;
    }).join("");

    return `
    <div class="entrega-modulo-bloque">
      <div class="entrega-modulo-titulo">
        <i class="fa-solid fa-layer-group"></i> ${modulo.titulo}
      </div>
      ${tareasHtml}
    </div>`;
  }).join("");

  // Marcar como vistos
  const noVistos = (entregas || []).filter(e => !e.visto).map(e => e.id);
  if (noVistos.length) {
    await supabase.from("entregas").update({ visto: true }).in("id", noVistos);
  }
}

window.marcarVisto = async function(entregaId) {
  await supabase.from("entregas").update({ visto: true }).eq("id", entregaId);
  const fila = document.querySelector(`.entrega-fila[data-entrega-id="${entregaId}"]`);
  if (fila) {
    fila.classList.remove("entrega-nueva");
    fila.querySelector(".badge-nueva")?.remove();
  }
};

window.verComentarioEntrega = function(entregaId, comentario, nombreEstudiante) {
  let modal = document.getElementById("modalComentarioEntrega");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "modalComentarioEntrega";
    modal.className = "modal-overlay";
    modal.innerHTML = `
      <div class="modal-caja" style="max-width:420px;">
        <div class="modal-cabecera">
          <h2><i class="fa-solid fa-comment-dots" style="color:var(--rosa);"></i>
            Comentario de <span id="comentarioNombreEst"></span>
          </h2>
          <button class="modal-cerrar"
            onclick="document.getElementById('modalComentarioEntrega').style.display='none';document.body.style.overflow='';">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>
        <div class="modal-cuerpo">
          <div id="comentarioEntregaTexto"
               style="background:var(--fondo);border:1.5px solid var(--borde);
                 border-radius:12px;padding:1rem 1.1rem;font-size:0.9rem;
                 color:var(--texto);line-height:1.65;white-space:pre-wrap;">
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secundario"
            onclick="document.getElementById('modalComentarioEntrega').style.display='none';document.body.style.overflow='';">
            Cerrar
          </button>
        </div>
      </div>`;
    document.body.appendChild(modal);
    modal.addEventListener("click", e => {
      if (e.target === modal) { modal.style.display = "none"; document.body.style.overflow = ""; }
    });
  }
  document.getElementById("comentarioNombreEst").textContent = nombreEstudiante;
  document.getElementById("comentarioEntregaTexto").textContent = comentario;
  modal.style.display = "flex";
  document.body.style.overflow = "hidden";
};

/* ══════════════════════════════════════════════════════════════
   AGREGAR A panel_docente.js
   ══════════════════════════════════════════════════════════════
   1. Agrega "initFormPublicidad();" y "cargarPublicidad();"
      dentro del addEventListener("DOMContentLoaded", ...) ya existente,
      junto a las demás llamadas init.
   2. Pega todo este bloque de funciones en cualquier parte del archivo
      (por ejemplo, después de initFormPerfil).
   ══════════════════════════════════════════════════════════════ */

let publicidadActual = null;

const MAX_PUBLICIDADES = 2;
let publicidadesDocente = [];   // ahora es una lista, no un solo objeto
let editandoPublicidadId = null; // si estamos editando una existente
 
// ══ CARGAR PUBLICIDADES DEL DOCENTE ══════════════════════════════════════════
async function cargarPublicidad() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
 
  const { data } = await supabase
    .from("publicidad")
    .select("*")
    .eq("docente_id", user.id)
    .order("creado_at", { ascending: true });
 
  publicidadesDocente = data || [];
  pintarListaPublicidades();
  actualizarFormularioSegunCupo();
}
 
function pintarListaPublicidades() {
  const cont = document.getElementById("previewPublicidadActiva");
  const contador = document.getElementById("contadorPublicidades");
  if (contador) contador.textContent = publicidadesDocente.length;
  if (!cont) return;
 
  if (publicidadesDocente.length === 0) {
    cont.innerHTML = `<p class="sin-datos">Aún no tienes publicidad activa.</p>`;
    return;
  }
 
  cont.innerHTML = publicidadesDocente.map(pub => `
    <div style="border:1.5px solid var(--borde);border-radius:14px;overflow:hidden;background:var(--blanco);margin-bottom:.9rem;">
      <img src="${pub.imagen_url}" alt="Publicidad" style="width:100%;height:140px;object-fit:cover;display:block;">
      <div style="padding:.9rem 1rem;">
        <strong style="font-size:.95rem;color:var(--texto);display:block;margin-bottom:.3rem;">${pub.titulo}</strong>
        <p style="font-size:.83rem;color:var(--texto-claro);line-height:1.5;margin:0 0 .7rem;">${pub.contenido || ""}</p>
        <div style="display:flex;gap:.5rem;">
          <button type="button" class="btn-icono-peq" title="Editar" onclick="editarPublicidad('${pub.id}')"><i class="fa-solid fa-pen"></i></button>
          <button type="button" class="btn-icono-peq peligro" title="Eliminar" onclick="eliminarPublicidad('${pub.id}')"><i class="fa-solid fa-trash"></i></button>
        </div>
      </div>
    </div>`).join("");
}
 
// Habilita/deshabilita el formulario según si ya llegó al máximo (y no está editando)
function actualizarFormularioSegunCupo() {
  const form = document.getElementById("formPublicidad");
  const btnGuardar = form?.querySelector('[type="submit"]');
  const avisoLimite = document.getElementById("avisoLimitePublicidad");
 
  const llegoAlTope = publicidadesDocente.length >= MAX_PUBLICIDADES && !editandoPublicidadId;
 
  if (btnGuardar) btnGuardar.disabled = llegoAlTope;
  if (avisoLimite) avisoLimite.style.display = llegoAlTope ? "flex" : "none";
}
 
window.editarPublicidad = function (id) {
  const pub = publicidadesDocente.find(p => p.id === id);
  if (!pub) return;
  editandoPublicidadId = id;
 
  document.getElementById("pubTitulo").value = pub.titulo || "";
  document.getElementById("pubContenido").value = pub.contenido || "";
  document.getElementById("pubLink").value = pub.link_destino || "";
 
  const drop = document.getElementById("dropImagenPub");
  const prev = document.getElementById("prevImagenPub");
  const img  = document.getElementById("imgPreviewPub");
  if (pub.imagen_url) {
    img.src = pub.imagen_url;
    drop.style.display = "none";
    prev.style.display = "block";
  }
 
  document.getElementById("formPublicidad")?.scrollIntoView({ behavior: "smooth", block: "start" });
  actualizarFormularioSegunCupo();
 
  const btnGuardar = document.querySelector('#formPublicidad [type="submit"]');
  if (btnGuardar) btnGuardar.innerHTML = `<i class="fa-solid fa-floppy-disk"></i> Guardar cambios`;
};
 
window.eliminarPublicidad = async function (id) {
  const confirmado = await confirmarAccion({
    titulo: "¿Eliminar esta publicidad?",
    mensaje: "Dejará de mostrarse en la página principal de inmediato.",
    textoBoton: "Eliminar publicidad",
  });
  if (!confirmado) return;
 
  const { error } = await supabase.from("publicidad").delete().eq("id", id);
  if (error) { mostrarToast(`No se pudo eliminar: ${error.message || "intenta de nuevo."}`, "error"); return; }
 
  if (editandoPublicidadId === id) cancelarEdicionPublicidad();
  await cargarPublicidad();
  mostrarToast("Publicidad eliminada.", "info");
};
 
function cancelarEdicionPublicidad() {
  editandoPublicidadId = null;
  document.getElementById("formPublicidad")?.reset();
  document.getElementById("prevImagenPub").style.display = "none";
  document.getElementById("dropImagenPub").style.display = "flex";
  const btnGuardar = document.querySelector('#formPublicidad [type="submit"]');
  if (btnGuardar) btnGuardar.innerHTML = `<i class="fa-solid fa-bullhorn"></i> Publicar`;
  actualizarFormularioSegunCupo();
}
 
// ══ FORMULARIO: CREAR / EDITAR UNA PUBLICIDAD (hasta 2 por docente) ══════════
function initFormPublicidad() {
  const form = document.getElementById("formPublicidad");
  if (!form) return;
 
  const inputImg = document.getElementById("pubImagen");
  const drop = document.getElementById("dropImagenPub");
  const prev = document.getElementById("prevImagenPub");
  const img  = document.getElementById("imgPreviewPub");
 
  inputImg?.addEventListener("change", () => {
    const file = inputImg.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
      img.src = e.target.result;
      drop.style.display = "none";
      prev.style.display = "block";
    };
    reader.readAsDataURL(file);
  });
 
  document.getElementById("btnQuitarImgPub")?.addEventListener("click", () => {
    inputImg.value = "";
    prev.style.display = "none";
    drop.style.display = "flex";
  });
 
  document.getElementById("btnCancelarEdicionPub")?.addEventListener("click", cancelarEdicionPublicidad);
 
  drop?.addEventListener("dragover", e => { e.preventDefault(); drop.classList.add("drag-over"); });
  drop?.addEventListener("dragleave", () => drop.classList.remove("drag-over"));
  drop?.addEventListener("drop", e => {
    e.preventDefault();
    drop.classList.remove("drag-over");
    const file = e.dataTransfer.files[0];
    if (file) { inputImg.files = e.dataTransfer.files; inputImg.dispatchEvent(new Event("change")); }
  });
 
  form.addEventListener("submit", async e => {
    e.preventDefault();
    const titulo    = document.getElementById("pubTitulo")?.value.trim();
    const contenido = document.getElementById("pubContenido")?.value.trim();
    const link      = document.getElementById("pubLink")?.value.trim();
    const alerta    = document.getElementById("alertaPublicidad");
    const btnGuardar = form.querySelector('[type="submit"]');
 
    setErr("errPubTitulo", "");
    setErr("errPubImagen", "");
 
    if (!titulo) { setErr("errPubTitulo", "El título es obligatorio."); return; }
 
    // Tope de 2 publicidades, salvo que se esté editando una existente
    if (!editandoPublicidadId && publicidadesDocente.length >= MAX_PUBLICIDADES) {
      mostrarAlerta(alerta, "error", `Ya tienes el máximo de ${MAX_PUBLICIDADES} publicidades. Elimina una para poder agregar otra.`);
      return;
    }
 
    const imgFile = inputImg?.files[0];
    const pubExistente = editandoPublicidadId
      ? publicidadesDocente.find(p => p.id === editandoPublicidadId)
      : null;
 
    if (!imgFile && !pubExistente?.imagen_url) {
      setErr("errPubImagen", "Sube una imagen para tu publicidad.");
      return;
    }
 
    if (btnGuardar) { btnGuardar.disabled = true; btnGuardar.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Guardando...`; }
 
    const { data: { user } } = await supabase.auth.getUser();
    const payload = {
      docente_id: user.id,
      titulo,
      contenido: contenido || null,
      link_destino: link || null,
      activa: true,
    };
 
    if (imgFile) {
      const ext = imgFile.name.split(".").pop();
      const path = `${user.id}/banner_${Date.now()}.${ext}`;
      const { error: errImg } = await supabase.storage
        .from("publicidad")
        .upload(path, imgFile, { upsert: true });
 
      if (errImg) {
        mostrarAlerta(alerta, "error", `Error al subir la imagen: ${errImg.message || "intenta de nuevo."}`);
        if (btnGuardar) { btnGuardar.disabled = false; btnGuardar.innerHTML = `<i class="fa-solid fa-bullhorn"></i> Publicar`; }
        return;
      }
      const { data: urlData } = supabase.storage.from("publicidad").getPublicUrl(path);
      payload.imagen_url = urlData.publicUrl;
    } else if (pubExistente?.imagen_url) {
      payload.imagen_url = pubExistente.imagen_url;
    }
 
    let error;
    if (editandoPublicidadId) {
      ({ error } = await supabase.from("publicidad").update(payload).eq("id", editandoPublicidadId));
    } else {
      ({ error } = await supabase.from("publicidad").insert(payload));
    }
 
    if (btnGuardar) { btnGuardar.disabled = false; btnGuardar.innerHTML = `<i class="fa-solid fa-bullhorn"></i> Publicar`; }
 
    if (error) {
      mostrarAlerta(alerta, "error", `Error al guardar: ${error.message || "intenta de nuevo."}`);
      return;
    }
 
    mostrarAlerta(alerta, "ok", editandoPublicidadId ? "¡Publicidad actualizada!" : "¡Publicidad publicada!");
    mostrarToast("Tu publicidad ya es visible en la página principal. 📣", "ok");
 
    cancelarEdicionPublicidad();
    await cargarPublicidad();
  });
}