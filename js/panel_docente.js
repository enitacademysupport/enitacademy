/* ════════════════════════════════════════════
   ENIT Academy — panel_docente.js  (v2)
   ════════════════════════════════════════════ */

import { supabase } from "./supabase.js";

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
  initVistaEstudiante();
  initCopiaCodigo();
  initVolverCursos();
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
        <span><i class="fa-solid fa-key"></i> ${c.codigo}</span>
        <button class="btn-ojo-vis tooltip-wrap" title="${c.es_publico ? 'Ocultar (hacer privado)' : 'Publicar (hacer público)'}"
          onclick="toggleVisibilidadCurso('${c.id}', event)">
          <i class="fa-solid ${c.es_publico ? 'fa-eye' : 'fa-eye-slash'}"></i>
        </button>
      </div>
    </div>`;
  }).join("");
}

window.toggleVisibilidadCurso = async function(cursoId, e) {
  e?.stopPropagation();
  const curso = cursosDocente.find(c => c.id === cursoId);
  if (!curso) return;
  const nuevo = !curso.es_publico;
  const { error } = await supabase.from("cursos").update({ es_publico: nuevo }).eq("id", cursoId);
  if (error) { alert("Error al cambiar visibilidad."); return; }

  cursosDocente = cursosDocente.map(c => c.id === cursoId ? { ...c, es_publico: nuevo } : c);
  if (cursoActivo?.id === cursoId) cursoActivo.es_publico = nuevo;
  renderCursos();

  mostrarToast(nuevo ? "Curso publicado en el inicio. 🌍" : "Curso privado. Solo con código. 🔒", nuevo ? "ok" : "info");
};

// ══ DETALLE CURSO ═════════════════════════════════════════════════════════════
window.abrirDetalle = async function(cursoId) {
  cursoActivo = cursosDocente.find(c => c.id === cursoId);
  if (!cursoActivo) return;

  document.getElementById("cursoTitulo").textContent = cursoActivo.nombre;
  document.getElementById("cursoDesc").textContent   = cursoActivo.descripcion || "";
  document.getElementById("cursoCodigo").textContent = cursoActivo.codigo;

  const nivelEl = document.getElementById("cursoNivel");
  if (nivelEl) { nivelEl.textContent = cursoActivo.nivel || ""; nivelEl.className = `etiqueta-nivel ${cursoActivo.nivel || ""}`; }

  actualizarBadgeYBotonVis();
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

function actualizarBadgeYBotonVis() {
  const badgeVis = document.getElementById("cursoVisibilidad");
  const btnVis   = document.getElementById("btnCambiarVisibilidad");
  if (!cursoActivo) return;

  if (badgeVis) {
    badgeVis.className = `badge-visibilidad ${cursoActivo.es_publico ? "publico" : "privado"}`;
    badgeVis.innerHTML = `<i class="fa-solid ${cursoActivo.es_publico ? "fa-globe" : "fa-lock"}"></i>
      ${cursoActivo.es_publico ? "Público — aparece en el inicio" : "Con código — acceso restringido"}`;
  }
  if (btnVis) {
    btnVis.innerHTML = cursoActivo.es_publico
      ? `<i class="fa-solid fa-lock"></i> Hacer privado`
      : `<i class="fa-solid fa-globe"></i> Hacer público`;
  }
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
  if (!confirm("¿Retirar a este estudiante del curso?")) return;
  await supabase.from("inscripciones").delete().eq("curso_id", cursoId).eq("estudiante_id", estudianteId);
  await cargarAlumnosCurso(cursoId);
};

// ══ ANUNCIOS ══════════════════════════════════════════════════════════════════
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
        <strong>${a.titulo}</strong><p>${a.contenido}</p>
      </div>`).join("")
    : `<p class="sin-datos">Sin anuncios.</p>`;
}

// ══ ARCHIVOS + UPLOAD DESDE PC ════════════════════════════════════════════════
async function cargarArchivosCurso(cursoId) {
  const { data } = await supabase.from("archivos").select("*")
    .eq("curso_id", cursoId).order("creado_at", { ascending: false });
  const el = document.getElementById("listaArchivosCurso");
  if (!el) return;
  el.innerHTML = data?.length
    ? data.map(a => {
        const esUpload = a.tipo === "upload";
        return `<div class="item-archivo">
          <a href="${a.url}" target="_blank" rel="noopener">
            <i class="fa-solid ${esUpload ? 'fa-file-arrow-down' : 'fa-link'}"></i> ${a.nombre_archivo}
          </a>
          <span class="meta-fecha">${formatFecha(a.creado_at)}</span>
          <button class="btn-peligro btn-mini" onclick="eliminarArchivo('${a.id}','${cursoId}')"><i class="fa-solid fa-trash"></i></button>
        </div>`;
      }).join("")
    : `<p class="sin-datos">Sin archivos.</p>`;
}

// ══ TAREAS ════════════════════════════════════════════════════════════════════
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
        <strong>${t.titulo}</strong><p>${t.descripcion || ""}</p>
        ${t.puntos ? `<span style="font-size:.8rem;color:#8b5cf6;font-weight:700;">${t.puntos} pts</span>` : ""}
        ${t.url ? `<a href="${t.url}" target="_blank" class="archivo-ref"><i class="fa-solid fa-link"></i> Material de referencia</a>` : ""}
      </div>`).join("")
    : `<p class="sin-datos">Sin tareas.</p>`;
}

// ══ ACCIONES DETALLE CURSO ════════════════════════════════════════════════════
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

  reemplazarYEscuchar("btnSubirArchivo", async () => {
    const nombre = document.getElementById("archivoNombre")?.value.trim();
    const alerta = document.getElementById("alertaArchivo");
    const { data: { user } } = await supabase.auth.getUser();
    if (!nombre) { mostrarAlerta(alerta, "error", "Escribe el nombre del archivo."); return; }

    const tabActivo = document.querySelector(".tab-arch.activo-tab")?.dataset.arch || "url";

    if (tabActivo === "url") {
      const url = document.getElementById("archivoUrl")?.value.trim();
      if (!url) { mostrarAlerta(alerta, "error", "Ingresa la URL."); return; }
      const { error } = await supabase.from("archivos")
        .insert({ curso_id: cursoId, docente_id: user.id, nombre_archivo: nombre, url, tipo: "link" });
      if (error) { mostrarAlerta(alerta, "error", "Error al agregar."); return; }
      mostrarAlerta(alerta, "ok", "Archivo añadido.");
      document.getElementById("archivoNombre").value = "";
      document.getElementById("archivoUrl").value    = "";
    } else {
      const fileInput = document.getElementById("archivoFile");
      const file      = fileInput?.files[0];
      if (!file) { mostrarAlerta(alerta, "error", "Selecciona un archivo."); return; }
      if (file.size > 50 * 1024 * 1024) { mostrarAlerta(alerta, "error", "El archivo supera 50 MB."); return; }

      const progreso     = document.getElementById("progresoUpload");
      const progresoFill = document.getElementById("progresoFill");
      const progresoTxt  = document.getElementById("progresoTexto");
      if (progreso) progreso.classList.remove("oculto");

      const path = `cursos/${cursoId}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
      const { error: errUp } = await supabase.storage.from("materiales").upload(path, file, {
        onUploadProgress: (p) => {
          const pct = Math.round((p.loaded / p.total) * 100);
          if (progresoFill) progresoFill.style.width = pct + "%";
          if (progresoTxt) progresoTxt.textContent = `Subiendo... ${pct}%`;
        },
      });
      if (progreso) progreso.classList.add("oculto");
      if (errUp) { mostrarAlerta(alerta, "error", "Error al subir el archivo."); return; }

      const { data: urlData } = supabase.storage.from("materiales").getPublicUrl(path);
      const url = urlData?.publicUrl;
      const { error } = await supabase.from("archivos")
        .insert({ curso_id: cursoId, docente_id: user.id, nombre_archivo: nombre, url, tipo: "upload" });
      if (error) { mostrarAlerta(alerta, "error", "Error al registrar archivo."); return; }
      mostrarAlerta(alerta, "ok", "Archivo subido exitosamente.");
      document.getElementById("archivoNombre").value = "";
      fileInput.value = "";
    }
    await cargarArchivosCurso(cursoId);
  });

  reemplazarYEscuchar("btnCrearTarea", async () => {
    const titulo  = document.getElementById("tareaTitulo")?.value.trim();
    const desc    = document.getElementById("tareaDesc")?.value.trim();
    const fecha   = document.getElementById("tareaFecha")?.value;
    const puntos  = document.getElementById("tareaPuntos")?.value;
    const alerta  = document.getElementById("alertaTarea");
    const { data: { user } } = await supabase.auth.getUser();
    if (!titulo) { mostrarAlerta(alerta, "error", "El título es obligatorio."); return; }

    const tabActivo = document.querySelector(".tab-tar.activo-tab")?.dataset.tar || "sinarchivo";
    let urlTarea = null;

    if (tabActivo === "urltarea") {
      urlTarea = document.getElementById("tareaUrl")?.value.trim() || null;
    } else if (tabActivo === "pctarea") {
      const file = document.getElementById("tareaFile")?.files[0];
      if (file) {
        const path = `tareas/${cursoId}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
        const { error: errUp } = await supabase.storage.from("materiales").upload(path, file);
        if (errUp) { mostrarAlerta(alerta, "error", "Error al subir adjunto."); return; }
        const { data: urlData } = supabase.storage.from("materiales").getPublicUrl(path);
        urlTarea = urlData?.publicUrl;
      }
    }

    const { error } = await supabase.from("tareas").insert({
      curso_id: cursoId, docente_id: user.id,
      titulo, descripcion: desc || null,
      fecha_entrega: fecha || null,
      puntos: puntos ? parseInt(puntos) : null,
      url: urlTarea,
    });
    if (error) { mostrarAlerta(alerta, "error", "Error al crear tarea."); return; }
    mostrarAlerta(alerta, "ok", "Tarea creada.");
    ["tareaTitulo","tareaDesc","tareaFecha","tareaPuntos","tareaUrl"].forEach(id => {
      const el = document.getElementById(id); if (el) el.value = "";
    });
    const tareaFile = document.getElementById("tareaFile"); if (tareaFile) tareaFile.value = "";
    await cargarTareasCurso(cursoId);
  });

  reemplazarYEscuchar("btnCambiarVisibilidad", async () => {
    const nuevo = !cursoActivo.es_publico;
    const { error } = await supabase.from("cursos").update({ es_publico: nuevo }).eq("id", cursoActivo.id);
    if (error) { alert("Error al cambiar visibilidad."); return; }
    cursoActivo.es_publico = nuevo;
    cursosDocente = cursosDocente.map(c => c.id === cursoActivo.id ? { ...c, es_publico: nuevo } : c);
    actualizarBadgeYBotonVis();
    mostrarAlerta(document.getElementById("alertaVisibilidad"), "ok",
      nuevo ? "Curso publicado. 🌍 Ahora aparece en el inicio." : "Curso privado. Solo con código. 🔒");
  });

  reemplazarYEscuchar("btnEliminarCurso", async () => {
    if (!confirm(`¿Eliminar "${cursoActivo.nombre}"? Esta acción no se puede deshacer.`)) return;
    const { error } = await supabase.from("cursos").delete().eq("id", cursoActivo.id);
    if (error) { alert("Error al eliminar."); return; }
    cursosDocente = cursosDocente.filter(c => c.id !== cursoActivo.id);
    renderCursos();
    mostrarVista("cursos");
  });
}

// ══ ELIMINAR ELEMENTOS ════════════════════════════════════════════════════════
window.eliminarAnuncio = async (id, cursoId) => {
  if (!confirm("¿Eliminar este anuncio?")) return;
  await supabase.from("anuncios").delete().eq("id", id);
  await cargarAnunciosCurso(cursoId);
};
window.eliminarArchivo = async (id, cursoId) => {
  if (!confirm("¿Eliminar este archivo?")) return;
  await supabase.from("archivos").delete().eq("id", id);
  await cargarArchivosCurso(cursoId);
};
window.eliminarTarea = async (id, cursoId) => {
  if (!confirm("¿Eliminar esta tarea?")) return;
  await supabase.from("tareas").delete().eq("id", id);
  await cargarTareasCurso(cursoId);
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

// ══ LISTA TODOS ESTUDIANTES ═══════════════════════════════════════════════════
async function cargarListaEstudiantes() {
  const cursoIds = cursosDocente.map(c => c.id);
  const tabla = document.getElementById("tablaEstudiantes");
  if (!tabla) return;
  if (cursoIds.length === 0) { tabla.innerHTML = `<p class="sin-datos">Aún no tienes cursos.</p>`; return; }

  const { data } = await supabase.from("inscripciones")
    .select("estudiante_id, curso_id, perfiles(nombre, apellido), cursos(nombre)")
    .in("curso_id", cursoIds);

  let items = data || [];
  const renderTabla = (lista) => {
    tabla.innerHTML = lista.length
      ? `<div class="tabla-estudiantes">${lista.map(i => `
          <div class="fila-estudiante">
            <div class="avatar-mini"><i class="fa-solid fa-user-graduate"></i></div>
            <span>${i.perfiles?.nombre || ""} ${i.perfiles?.apellido || ""}</span>
            <span class="curso-tag">${i.cursos?.nombre || ""}</span>
          </div>`).join("")}</div>`
      : `<p class="sin-datos">Sin resultados.</p>`;
  };
  renderTabla(items);
  document.getElementById("buscarTablaEstudiante")?.addEventListener("input", e => {
    const q = e.target.value.toLowerCase();
    renderTabla(items.filter(i => `${i.perfiles?.nombre} ${i.perfiles?.apellido}`.toLowerCase().includes(q)));
  });
}

// ══ VISTA COMO ESTUDIANTE ═════════════════════════════════════════════════════
function initVistaEstudiante() {
  document.getElementById("btnVistaEstudiante")?.addEventListener("click", () => {
    if (!perfilActual?.id) return;
    window.open(`/paginas/panel_estudiante.html?preview_docente=${perfilActual.id}`, "_blank");
  });
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