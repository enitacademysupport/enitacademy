/* ════════════════════════════════════════════
   ENIT Academy — panel_docente.js
   ════════════════════════════════════════════ */

import { supabase } from "./supabase.js";

// ══ ESTADO ════════════════════════════════════════════════════════════════════
let perfilActual  = null;
let cursosDocente = [];
let cursoActivo   = null;

// ══ INIT ══════════════════════════════════════════════════════════════════════
window.addEventListener("DOMContentLoaded", async () => {
  await verificarSesion();
  await cargarPerfil();
  await cargarCursos();
  initNav();
  initSidebar();
  initCerrarSesion();
  initFormCrearCurso();
  initFormPerfil();
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

  const nombreCompleto = `${perfil.nombre} ${perfil.apellido}`;
  const sideNombre = document.getElementById("sideNombre");
  if (sideNombre) sideNombre.textContent = nombreCompleto;

  const pNombre    = document.getElementById("pNombre");
  const pApellido  = document.getElementById("pApellido");
  const pEmail     = document.getElementById("pEmail");
  const pDesde     = document.getElementById("perfilDesde");

  if (pNombre)   pNombre.value   = perfil.nombre;
  if (pApellido) pApellido.value = perfil.apellido;
  if (pEmail)    pEmail.value    = user.email;
  if (pDesde)    pDesde.textContent = `Miembro desde ${formatFecha(user.created_at)}`;
}

// ══ CARGAR CURSOS ═════════════════════════════════════════════════════════════
async function cargarCursos() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data: cursos } = await supabase
    .from("cursos")
    .select("*")
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
    return;
  }
  if (msg) msg.style.display = "none";

  contenedor.innerHTML = cursosDocente.map(c => `
    <div class="tarjeta-curso" onclick="abrirDetalle('${c.id}')" style="cursor:pointer;">
      <div class="tarjeta-curso-header">
        <div style="display:flex;align-items:center;gap:0.5rem;flex-wrap:wrap;margin-bottom:0.4rem;">
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
        <span><i class="fa-solid fa-key"></i> ${c.codigo}</span>
      </div>
    </div>
  `).join("");
}

// ══ DETALLE CURSO ═════════════════════════════════════════════════════════════
window.abrirDetalle = async function(cursoId) {
  cursoActivo = cursosDocente.find(c => c.id === cursoId);
  if (!cursoActivo) return;

  document.getElementById("cursoTitulo").textContent = cursoActivo.nombre;
  document.getElementById("cursoDesc").textContent   = cursoActivo.descripcion || "";
  document.getElementById("cursoCodigo").textContent = cursoActivo.codigo;

  const nivelEl = document.getElementById("cursoNivel");
  if (nivelEl) {
    nivelEl.textContent = cursoActivo.nivel || "";
    nivelEl.className = `etiqueta-nivel ${cursoActivo.nivel || ""}`;
  }

  // Badge de visibilidad en detalle
  const badgeVis = document.getElementById("cursoVisibilidad");
  if (badgeVis) {
    badgeVis.className = `badge-visibilidad ${cursoActivo.es_publico ? "publico" : "privado"}`;
    badgeVis.innerHTML = `<i class="fa-solid ${cursoActivo.es_publico ? "fa-globe" : "fa-lock"}"></i>
      ${cursoActivo.es_publico ? "Público — aparece en el inicio" : "Con código — acceso restringido"}`;
  }

  mostrarVista("detalle");

  document.querySelectorAll(".pestana-btn").forEach(b => b.classList.remove("activa"));
  document.querySelectorAll(".pestana-panel").forEach(p => p.classList.add("oculto"));
  document.querySelector(".pestana-btn[data-pestana='alumnos']")?.classList.add("activa");
  document.querySelector(".pestana-panel[data-panel='alumnos']")?.classList.remove("oculto");

  await cargarAlumnosCurso(cursoId);
  await cargarAnunciosCurso(cursoId);
  await cargarArchivosCurso(cursoId);
  await cargarTareasCurso(cursoId);
  initPestanas(cursoId);
  initAccionesCurso(cursoId);
};

// Copiar código
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("btnCopiarCodigo")?.addEventListener("click", () => {
    const codigo = document.getElementById("cursoCodigo")?.textContent;
    if (codigo) navigator.clipboard.writeText(codigo).then(() => {
      const btn = document.getElementById("btnCopiarCodigo");
      btn.innerHTML = `<i class="fa-solid fa-check"></i>`;
      setTimeout(() => { btn.innerHTML = `<i class="fa-regular fa-copy"></i>`; }, 1500);
    });
  });

  document.getElementById("btnVolverCursos")?.addEventListener("click", () => {
    mostrarVista("cursos");
  });
});

async function cargarAlumnosCurso(cursoId) {
  const { data } = await supabase
    .from("inscripciones")
    .select("estudiante_id, perfiles(nombre, apellido, id)")
    .eq("curso_id", cursoId);

  const el = document.getElementById("listaAlumnosCurso");
  if (!el) return;

  if (!data || data.length === 0) {
    el.innerHTML = `<p class="sin-datos">Sin estudiantes inscritos.</p>`;
    return;
  }

  el.innerHTML = `
    <div class="tabla-estudiantes">
      ${data.map(i => `
        <div class="fila-estudiante">
          <div class="avatar-mini"><i class="fa-solid fa-user-graduate"></i></div>
          <span>${i.perfiles?.nombre || ""} ${i.perfiles?.apellido || ""}</span>
          <button class="btn-peligro btn-mini" onclick="expulsarEstudiante('${cursoId}','${i.estudiante_id}')">
            <i class="fa-solid fa-user-minus"></i>
          </button>
        </div>
      `).join("")}
    </div>`;
}

window.expulsarEstudiante = async function(cursoId, estudianteId) {
  if (!confirm("¿Retirar a este estudiante del curso?")) return;
  await supabase.from("inscripciones").delete()
    .eq("curso_id", cursoId).eq("estudiante_id", estudianteId);
  await cargarAlumnosCurso(cursoId);
};

async function cargarAnunciosCurso(cursoId) {
  const { data } = await supabase.from("anuncios").select("*")
    .eq("curso_id", cursoId).order("creado_at", { ascending: false });

  const el = document.getElementById("listaAnunciosCurso");
  if (!el) return;
  el.innerHTML = data?.length
    ? data.map(a => `
      <div class="item-anuncio">
        <div class="anuncio-meta"><span class="meta-fecha">${formatFecha(a.creado_at)}</span>
          <button class="btn-peligro btn-mini" onclick="eliminarAnuncio('${a.id}','${cursoId}')"><i class="fa-solid fa-trash"></i></button>
        </div>
        <strong>${a.titulo}</strong>
        <p>${a.contenido}</p>
      </div>`).join("")
    : `<p class="sin-datos">Sin anuncios.</p>`;
}

async function cargarArchivosCurso(cursoId) {
  const { data } = await supabase.from("archivos").select("*")
    .eq("curso_id", cursoId).order("creado_at", { ascending: false });

  const el = document.getElementById("listaArchivosCurso");
  if (!el) return;
  el.innerHTML = data?.length
    ? data.map(a => `
      <div class="item-archivo">
        <a href="${a.url}" target="_blank"><i class="fa-solid fa-file"></i> ${a.nombre_archivo}</a>
        <span class="meta-fecha">${formatFecha(a.creado_at)}</span>
        <button class="btn-peligro btn-mini" onclick="eliminarArchivo('${a.id}','${cursoId}')"><i class="fa-solid fa-trash"></i></button>
      </div>`).join("")
    : `<p class="sin-datos">Sin archivos.</p>`;
}

async function cargarTareasCurso(cursoId) {
  const { data } = await supabase.from("tareas").select("*")
    .eq("curso_id", cursoId).order("fecha_entrega", { ascending: true });

  const el = document.getElementById("listaTareasCurso");
  if (!el) return;
  el.innerHTML = data?.length
    ? data.map(t => `
      <div class="item-tarea">
        <div class="anuncio-meta">
          ${t.fecha_entrega ? `<span class="vence-tag ${urgencia(t.fecha_entrega)}">Vence: ${formatFecha(t.fecha_entrega)}</span>` : ""}
          <button class="btn-peligro btn-mini" onclick="eliminarTarea('${t.id}','${cursoId}')"><i class="fa-solid fa-trash"></i></button>
        </div>
        <strong>${t.titulo}</strong>
        <p>${t.descripcion || ""}</p>
        ${t.puntos ? `<span style="font-size:0.8rem;color:#8b5cf6;font-weight:700;">${t.puntos} pts</span>` : ""}
      </div>`).join("")
    : `<p class="sin-datos">Sin tareas.</p>`;
}

// ══ ACCIONES DETALLE ══════════════════════════════════════════════════════════
function initAccionesCurso(cursoId) {
  // Publicar anuncio
  document.getElementById("btnPublicarAnuncio")?.replaceWith(
    document.getElementById("btnPublicarAnuncio").cloneNode(true)
  );
  document.getElementById("btnPublicarAnuncio")?.addEventListener("click", async () => {
    const titulo    = document.getElementById("anuncioTitulo")?.value.trim();
    const contenido = document.getElementById("anuncioContenido")?.value.trim();
    const alerta    = document.getElementById("alertaAnuncio");
    const { data: { user } } = await supabase.auth.getUser();

    if (!titulo || !contenido) { mostrarAlerta(alerta, "error", "Completa título y contenido."); return; }

    const { error } = await supabase.from("anuncios")
      .insert({ curso_id: cursoId, docente_id: user.id, titulo, contenido });

    if (error) { mostrarAlerta(alerta, "error", "Error al publicar."); return; }
    mostrarAlerta(alerta, "ok", "Anuncio publicado.");
    document.getElementById("anuncioTitulo").value = "";
    document.getElementById("anuncioContenido").value = "";
    await cargarAnunciosCurso(cursoId);
  });

  // Subir archivo
  document.getElementById("btnSubirArchivo")?.replaceWith(
    document.getElementById("btnSubirArchivo").cloneNode(true)
  );
  document.getElementById("btnSubirArchivo")?.addEventListener("click", async () => {
    const nombre = document.getElementById("archivoNombre")?.value.trim();
    const url    = document.getElementById("archivoUrl")?.value.trim();
    const alerta = document.getElementById("alertaArchivo");
    const { data: { user } } = await supabase.auth.getUser();

    if (!nombre || !url) { mostrarAlerta(alerta, "error", "Completa nombre y URL."); return; }

    const { error } = await supabase.from("archivos")
      .insert({ curso_id: cursoId, docente_id: user.id, nombre_archivo: nombre, url });

    if (error) { mostrarAlerta(alerta, "error", "Error al agregar archivo."); return; }
    mostrarAlerta(alerta, "ok", "Archivo agregado.");
    document.getElementById("archivoNombre").value = "";
    document.getElementById("archivoUrl").value    = "";
    await cargarArchivosCurso(cursoId);
  });

  // Crear tarea
  document.getElementById("btnCrearTarea")?.replaceWith(
    document.getElementById("btnCrearTarea").cloneNode(true)
  );
  document.getElementById("btnCrearTarea")?.addEventListener("click", async () => {
    const titulo  = document.getElementById("tareaTitulo")?.value.trim();
    const desc    = document.getElementById("tareaDesc")?.value.trim();
    const fecha   = document.getElementById("tareaFecha")?.value;
    const puntos  = document.getElementById("tareaPuntos")?.value;
    const alerta  = document.getElementById("alertaTarea");
    const { data: { user } } = await supabase.auth.getUser();

    if (!titulo) { mostrarAlerta(alerta, "error", "El título es obligatorio."); return; }

    const { error } = await supabase.from("tareas").insert({
      curso_id: cursoId,
      docente_id: user.id,
      titulo,
      descripcion: desc || null,
      fecha_entrega: fecha || null,
      puntos: puntos ? parseInt(puntos) : null,
    });

    if (error) { mostrarAlerta(alerta, "error", "Error al crear tarea."); return; }
    mostrarAlerta(alerta, "ok", "Tarea creada.");
    document.getElementById("tareaTitulo").value = "";
    document.getElementById("tareaDesc").value   = "";
    document.getElementById("tareaFecha").value  = "";
    document.getElementById("tareaPuntos").value = "";
    await cargarTareasCurso(cursoId);
  });

  // ── Cambiar visibilidad ────────────────────────────────────────────────────
  const btnVis = document.getElementById("btnCambiarVisibilidad");
  if (btnVis) {
    const nuevoEstado = !cursoActivo.es_publico;
    btnVis.innerHTML  = nuevoEstado
      ? `<i class="fa-solid fa-globe"></i> Hacer público`
      : `<i class="fa-solid fa-lock"></i> Hacer privado (código)`;

    btnVis.replaceWith(btnVis.cloneNode(true));
    document.getElementById("btnCambiarVisibilidad")?.addEventListener("click", async () => {
      const toggle = !cursoActivo.es_publico;
      const { error } = await supabase.from("cursos")
        .update({ es_publico: toggle })
        .eq("id", cursoActivo.id);

      if (error) { alert("Error al cambiar visibilidad."); return; }

      // Actualizar estado local
      cursoActivo.es_publico = toggle;
      cursosDocente = cursosDocente.map(c =>
        c.id === cursoActivo.id ? { ...c, es_publico: toggle } : c
      );

      // Refrescar badge en detalle
      const badgeVis = document.getElementById("cursoVisibilidad");
      if (badgeVis) {
        badgeVis.className = `badge-visibilidad ${toggle ? "publico" : "privado"}`;
        badgeVis.innerHTML = `<i class="fa-solid ${toggle ? "fa-globe" : "fa-lock"}"></i>
          ${toggle ? "Público — aparece en el inicio" : "Con código — acceso restringido"}`;
      }

      // Actualizar el propio botón
      const b = document.getElementById("btnCambiarVisibilidad");
      if (b) {
        b.innerHTML = toggle
          ? `<i class="fa-solid fa-lock"></i> Hacer privado (código)`
          : `<i class="fa-solid fa-globe"></i> Hacer público`;
      }

      mostrarAlerta(
        document.getElementById("alertaVisibilidad"),
        "ok",
        toggle ? "Curso publicado. Ahora aparece en el inicio." : "Curso privado. Solo con código."
      );
    });
  }

  // Eliminar curso
  document.getElementById("btnEliminarCurso")?.replaceWith(
    document.getElementById("btnEliminarCurso").cloneNode(true)
  );
  document.getElementById("btnEliminarCurso")?.addEventListener("click", async () => {
    if (!confirm(`¿Eliminar "${cursoActivo.nombre}"? Esta acción no se puede deshacer.`)) return;
    const { error } = await supabase.from("cursos").delete().eq("id", cursoActivo.id);
    if (error) { alert("Error al eliminar."); return; }
    cursosDocente = cursosDocente.filter(c => c.id !== cursoActivo.id);
    renderCursos();
    mostrarVista("cursos");
  });
}

// Eliminar elementos
window.eliminarAnuncio = async function(id, cursoId) {
  if (!confirm("¿Eliminar este anuncio?")) return;
  await supabase.from("anuncios").delete().eq("id", id);
  await cargarAnunciosCurso(cursoId);
};
window.eliminarArchivo = async function(id, cursoId) {
  if (!confirm("¿Eliminar este archivo?")) return;
  await supabase.from("archivos").delete().eq("id", id);
  await cargarArchivosCurso(cursoId);
};
window.eliminarTarea = async function(id, cursoId) {
  if (!confirm("¿Eliminar esta tarea?")) return;
  await supabase.from("tareas").delete().eq("id", id);
  await cargarTareasCurso(cursoId);
};

// ══ PESTAÑAS DETALLE ══════════════════════════════════════════════════════════
function initPestanas(cursoId) {
  document.querySelectorAll(".pestana-btn").forEach(btn => {
    btn.replaceWith(btn.cloneNode(true));
  });
  document.querySelectorAll(".pestana-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".pestana-btn").forEach(b => b.classList.remove("activa"));
      document.querySelectorAll(".pestana-panel").forEach(p => p.classList.add("oculto"));
      btn.classList.add("activa");
      document.querySelector(`.pestana-panel[data-panel="${btn.dataset.pestana}"]`)?.classList.remove("oculto");
    });
  });
}

// ══ CREAR CURSO ═══════════════════════════════════════════════════════════════
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
    // ── Visibilidad ──────────────────────────────────────────────────────────
    const esPublico = document.querySelector('input[name="cVisibilidad"]:checked')?.value === "publico";
    const alerta    = document.getElementById("alertaCrearCurso");

    let valido = true;
    if (!nombre) { setErr("errCNombre", "Campo obligatorio."); valido = false; } else setErr("errCNombre", "");
    if (!nivel)  { setErr("errCNivel", "Elige un nivel.");    valido = false; } else setErr("errCNivel", "");
    if (!valido) return;

    const { data: { user } } = await supabase.auth.getUser();
    const codigo = generarCodigo();

    const { data: cursoDB, error } = await supabase.from("cursos").insert({
      docente_id: user.id,
      nombre,
      descripcion: desc || null,
      nivel,
      codigo,
      es_publico: esPublico,       // ← campo nuevo
    }).select().single();

    if (error) { mostrarAlerta(alerta, "error", "Error al crear el curso."); return; }

    const checks = document.querySelectorAll(".check-estudiante:checked");
    if (checks.length > 0) {
      const inscripciones = Array.from(checks).map(c => ({
        curso_id: cursoDB.id,
        estudiante_id: c.value,
      }));
      await supabase.from("inscripciones").insert(inscripciones);
    }

    mostrarAlerta(alerta, "ok",
      esPublico
        ? `Curso creado y publicado en el inicio. Código: ${codigo}`
        : `Curso creado. Código: ${codigo}`
    );
    form.reset();
    await cargarCursos();
    setTimeout(() => mostrarVista("cursos"), 1500);
  });
}

async function cargarCheckEstudiantes() {
  const { data } = await supabase.from("perfiles").select("id, nombre, apellido").eq("rol", "estudiante");
  const lista = document.getElementById("listaCheckEstudiantes");
  if (!lista || !data) return;

  lista.innerHTML = data.length
    ? data.map(e => `
      <label class="check-item">
        <input type="checkbox" class="check-estudiante" value="${e.id}">
        ${e.nombre} ${e.apellido}
      </label>`).join("")
    : `<p class="sin-datos" style="font-size:0.82rem;">No hay estudiantes registrados aún.</p>`;
}

// ══ LISTA ESTUDIANTES VISTA ═══════════════════════════════════════════════════
async function cargarListaEstudiantes() {
  const cursoIds = cursosDocente.map(c => c.id);
  if (cursoIds.length === 0) {
    const tabla = document.getElementById("tablaEstudiantes");
    if (tabla) tabla.innerHTML = `<p class="sin-datos">Aún no tienes cursos.</p>`;
    return;
  }

  const { data } = await supabase
    .from("inscripciones")
    .select("estudiante_id, curso_id, perfiles(nombre, apellido), cursos(nombre)")
    .in("curso_id", cursoIds);

  const tabla = document.getElementById("tablaEstudiantes");
  if (!tabla || !data) return;

  const buscador = document.getElementById("buscarTablaEstudiante");
  let items = data;

  const renderTabla = (lista) => {
    tabla.innerHTML = lista.length
      ? `<div class="tabla-estudiantes">
          ${lista.map(i => `
            <div class="fila-estudiante">
              <div class="avatar-mini"><i class="fa-solid fa-user-graduate"></i></div>
              <span>${i.perfiles?.nombre || ""} ${i.perfiles?.apellido || ""}</span>
              <span class="curso-tag">${i.cursos?.nombre || ""}</span>
            </div>`).join("")}
        </div>`
      : `<p class="sin-datos">Sin resultados.</p>`;
  };

  renderTabla(items);

  buscador?.addEventListener("input", e => {
    const q = e.target.value.toLowerCase();
    renderTabla(items.filter(i =>
      `${i.perfiles?.nombre} ${i.perfiles?.apellido}`.toLowerCase().includes(q)
    ));
  });
}

// ══ PERFIL FORM ═══════════════════════════════════════════════════════════════
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
      const { error: errClave } = await supabase.auth.updateUser({ password: clave });
      if (errClave) { mostrarAlerta(alerta, "error", "Perfil guardado pero error al cambiar contraseña."); return; }
    }

    mostrarAlerta(alerta, "ok", "¡Cambios guardados!");
    document.getElementById("sideNombre").textContent = `${nombre} ${apellido}`;
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
      document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("activo"));
      btn.classList.add("activo");
      mostrarVista(btn.dataset.vista);
      document.querySelector(".panel-sidebar")?.classList.remove("abierto");
      document.getElementById("fondoSidebar")?.classList.remove("activo");
    });
  });
}

function mostrarVista(nombre) {
  document.querySelectorAll(".vista").forEach(v => v.classList.add("oculto"));
  document.getElementById(`vista-${nombre}`)?.classList.remove("oculto");
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
  document.getElementById("btnCerrarSesion2")?.addEventListener("click", async () => {
    await supabase.auth.signOut();
    window.location.href = "/index.html";
  });
}

// ══ UTILS ═════════════════════════════════════════════════════════════════════
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

function mostrarAlerta(el, tipo, msg) {
  if (!el) return;
  el.className = `alerta alerta-${tipo} visible`;
  el.innerHTML = `<i class="fa-solid ${tipo === "ok" ? "fa-circle-check" : "fa-circle-exclamation"}"></i> ${msg}`;
  setTimeout(() => el.classList.remove("visible"), 4000);
}

function setErr(id, msg) {
  const el = document.getElementById(id);
  if (el) el.textContent = msg;
}

document.getElementById("btnVistaEstudiante")?.addEventListener("click", () => {
    window.open("/pages/panel_estudiante.html", "_blank");
});
