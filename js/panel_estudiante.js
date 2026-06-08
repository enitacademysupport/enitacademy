import { supabase } from "./supabase.js";

// ══════════════════════════════════════════════
//  VERIFICAR SESIÓN
// ══════════════════════════════════════════════
async function verificarSesion() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) { window.location.replace("/index.html"); return null; }

  const { data: perfil } = await supabase
    .from("perfiles").select("*").eq("id", session.user.id).single();

  if (!perfil) { window.location.replace("/index.html"); return null; }
  if (perfil.rol !== "estudiante") { window.location.replace("/paginas/panel_docente.html"); return null; }

  return { usuario: session.user, perfil };
}

// ══════════════════════════════════════════════
//  HELPERS UI
// ══════════════════════════════════════════════
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
  document.querySelectorAll(".nav-btn").forEach(b =>
    b.classList.toggle("activo", b.dataset.vista === nombre)
  );
  document.querySelector(".panel-sidebar")?.classList.remove("sidebar-abierto");
  document.getElementById("fondoSidebar")?.classList.remove("visible");
}

const ICONOS_EXT = {
  pdf:"fa-file-pdf", doc:"fa-file-word", docx:"fa-file-word",
  ppt:"fa-file-powerpoint", pptx:"fa-file-powerpoint",
  mp4:"fa-file-video", mp3:"fa-file-audio",
  jpg:"fa-file-image", jpeg:"fa-file-image", png:"fa-file-image",
  zip:"fa-file-zipper", rar:"fa-file-zipper",
  xls:"fa-file-excel", xlsx:"fa-file-excel",
};
function iconoArchivo(nombre) {
  const ext = nombre?.split(".").pop()?.toLowerCase() || "";
  return ICONOS_EXT[ext] || "fa-file";
}

// ══════════════════════════════════════════════
//  DATOS GLOBALES
// ══════════════════════════════════════════════
let misCursos      = [];
let todosAnuncios  = [];
let todosArchivos  = [];
let todasTareas    = [];

// ══════════════════════════════════════════════
//  ASIDE GENERAL (resumen)
// ══════════════════════════════════════════════
function renderAsideAnuncios() {
  const el = document.getElementById("asideAnuncios");
  if (!el) return;
  const lista = todosAnuncios.slice(0, 4);
  if (!lista.length) { el.innerHTML = "<p class='aside-sin-datos'>Sin anuncios</p>"; return; }
  el.innerHTML = lista.map(a => `
    <div class="aside-mini-item">
      <strong>${a.titulo}</strong>
      <span>${a.contenido?.substring(0, 60)}${a.contenido?.length > 60 ? "…" : ""}</span>
      <span class="curso-tag">${a.cursos?.nombre || "—"}</span>
    </div>`).join("");
}

function renderAsideTareas() {
  const el = document.getElementById("asideTareas");
  if (!el) return;
  const hoy   = new Date();
  // solo tareas no vencidas o próximas, ordenadas por fecha
  const lista = todasTareas
    .filter(t => t.fecha_entrega)
    .sort((a, b) => new Date(a.fecha_entrega) - new Date(b.fecha_entrega))
    .slice(0, 4);

  if (!lista.length) { el.innerHTML = "<p class='aside-sin-datos'>Sin tareas próximas</p>"; return; }

  el.innerHTML = lista.map(t => {
    const fecha   = new Date(t.fecha_entrega);
    const vencida = fecha < hoy;
    const urgente = !vencida && (fecha - hoy) < 3 * 86400000;
    const cls     = vencida ? "vencida" : urgente ? "urgente" : "";
    const label   = vencida ? "Vencida" : urgente ? "¡Pronto!" : fecha.toLocaleDateString("es-PE");
    return `<div class="aside-mini-item">
      <strong>${t.titulo}</strong>
      <span class="curso-tag">${t.cursos?.nombre || "—"}</span>
      <span class="vence-tag ${cls}"><i class="fa-solid fa-clock"></i> ${label}</span>
    </div>`;
  }).join("");
}

function renderAsideArchivos() {
  const el = document.getElementById("asideArchivos");
  if (!el) return;
  const lista = todosArchivos.slice(0, 4);
  if (!lista.length) { el.innerHTML = "<p class='aside-sin-datos'>Sin archivos</p>"; return; }
  el.innerHTML = lista.map(a => `
    <div class="aside-mini-item">
      <strong><i class="fa-solid ${iconoArchivo(a.nombre_archivo)}" style="color:#ff4fa0;margin-right:4px"></i>${a.nombre_archivo}</strong>
      <span class="curso-tag">${a.cursos?.nombre || "—"}</span>
    </div>`).join("");
}

// ══════════════════════════════════════════════
//  CARGAR TODOS LOS DATOS DEL ESTUDIANTE
// ══════════════════════════════════════════════
async function cargarTodosLosDatos(estudianteId) {
  const { data: inscripciones } = await supabase
    .from("inscripciones")
    .select("inscrito_at, cursos(id,nombre,descripcion,nivel,codigo,perfiles(nombre,apellido))")
    .eq("estudiante_id", estudianteId)
    .order("inscrito_at", { ascending: false });

  misCursos = (inscripciones || []).map(d => d.cursos);

  if (!misCursos.length) {
    todosAnuncios = []; todosArchivos = []; todasTareas = [];
    return { inscripciones: inscripciones || [] };
  }

  const ids = misCursos.map(c => c.id);

  const [resAnuncios, resArchivos, resTareas] = await Promise.all([
    supabase.from("anuncios").select("*, cursos(nombre)").in("curso_id", ids).order("creado_at", { ascending: false }),
    supabase.from("archivos").select("*, cursos(nombre)").in("curso_id", ids).order("creado_at", { ascending: false }),
    supabase.from("tareas").select("*, cursos(nombre)").in("curso_id", ids).order("fecha_entrega", { ascending: true, nullsFirst: false }),
  ]);

  todosAnuncios = resAnuncios.data || [];
  todosArchivos = resArchivos.data || [];
  todasTareas   = resTareas.data  || [];

  return { inscripciones: inscripciones || [] };
}

// ══════════════════════════════════════════════
//  VISTA INICIO: cursos expandibles con pestañas
// ══════════════════════════════════════════════
function renderCursosInicio(inscripciones) {
  const contenedor = document.getElementById("listaCursosInicio");
  const sinDatos   = document.getElementById("msgSinCursosInicio");
  if (!contenedor) return;
  contenedor.innerHTML = "";

  if (!inscripciones.length) {
    contenedor.appendChild(sinDatos);
    sinDatos.style.display = "block";
    return;
  }
  sinDatos.style.display = "none";

  inscripciones.forEach(({ cursos: c, inscrito_at }) => {
    const anuncios = todosAnuncios.filter(a => a.curso_id === c.id);
    const archivos = todosArchivos.filter(a => a.curso_id === c.id);
    const tareas   = todasTareas.filter(t => t.curso_id === c.id);

    const div = document.createElement("div");
    div.className = "tarjeta-curso-est";
    div.innerHTML = `
      <div class="curso-cabecera" data-curso-id="${c.id}">
        <div class="curso-cabecera-info">
          <h3>${c.nombre}</h3>
          <p>${c.descripcion || "Sin descripción"} &nbsp;·&nbsp;
            <i class="fa-solid fa-chalkboard-teacher"></i>
            ${c.perfiles?.nombre ?? ""} ${c.perfiles?.apellido ?? ""}
          </p>
        </div>
        <div class="curso-cabecera-meta">
          <span class="etiqueta-nivel nivel-${c.nivel}">${c.nivel || "—"}</span>
          <button class="btn-toggle-curso" aria-label="Expandir">
            <i class="fa-solid fa-chevron-down"></i>
          </button>
        </div>
      </div>

      <div class="curso-body">
        <!-- Pestañas -->
        <div class="pestanas-curso">
          <button class="pestana-curso-btn activa" data-panel="anuncios-${c.id}">
            <i class="fa-solid fa-bullhorn"></i> Anuncios
            ${anuncios.length ? `<span class="badge-count">${anuncios.length}</span>` : ""}
          </button>
          <button class="pestana-curso-btn" data-panel="archivos-${c.id}">
            <i class="fa-solid fa-folder-open"></i> Archivos
            ${archivos.length ? `<span class="badge-count">${archivos.length}</span>` : ""}
          </button>
          <button class="pestana-curso-btn" data-panel="tareas-${c.id}">
            <i class="fa-solid fa-clipboard-list"></i> Tareas
            ${tareas.length ? `<span class="badge-count">${tareas.length}</span>` : ""}
          </button>
          <button class="pestana-curso-btn" data-panel="misarchivos-${c.id}">
            <i class="fa-solid fa-cloud-arrow-up"></i> Mis archivos
          </button>
        </div>

        <!-- Panel Anuncios -->
        <div class="pestana-curso-panel visible" id="anuncios-${c.id}">
          ${anuncios.length
            ? anuncios.map(a => `
                <div class="tarjeta-anuncio">
                  <div class="anuncio-cabecera">
                    <h4>${a.titulo}</h4>
                    <span class="fecha-texto">${new Date(a.creado_at).toLocaleDateString("es-PE")}</span>
                  </div>
                  <p>${a.contenido}</p>
                </div>`).join("")
            : "<p class='sin-datos'>No hay anuncios en este curso.</p>"
          }
        </div>

        <!-- Panel Archivos del docente -->
        <div class="pestana-curso-panel" id="archivos-${c.id}">
          ${archivos.length
            ? archivos.map(a => `
                <div class="tarjeta-archivo">
                  <i class="fa-solid ${iconoArchivo(a.nombre_archivo)} icono-archivo"></i>
                  <div class="info-archivo">
                    <span class="nombre-archivo">${a.nombre_archivo}</span>
                    <span class="fecha-texto">${new Date(a.creado_at).toLocaleDateString("es-PE")}</span>
                  </div>
                  <a href="${a.url}" target="_blank" class="btn-icono" title="Descargar">
                    <i class="fa-solid fa-download"></i>
                  </a>
                </div>`).join("")
            : "<p class='sin-datos'>No hay archivos en este curso.</p>"
          }
        </div>

        <!-- Panel Tareas -->
        <div class="pestana-curso-panel" id="tareas-${c.id}">
          ${renderTareasHTML(tareas)}
        </div>

        <!-- Panel Mis archivos (subida desde PC) -->
        <div class="pestana-curso-panel" id="misarchivos-${c.id}">
          <div class="zona-subir" id="zona-${c.id}">
            <i class="fa-solid fa-cloud-arrow-up"></i>
            <p>Arrastra un archivo aquí o <strong>haz clic para elegir</strong></p>
            <p style="font-size:0.75rem;color:#a08ab8;margin-top:0.3rem;">Máx. 10 MB — PDF, DOC, DOCX, PPT, PPTX, MP4, MP3, JPG, PNG, ZIP</p>
            <input type="file" id="inputArchivo-${c.id}" accept=".pdf,.doc,.docx,.ppt,.pptx,.mp4,.mp3,.jpg,.jpeg,.png,.zip,.rar,.xlsx,.xls">
          </div>
          <div class="barra-progreso-wrap" id="progreso-wrap-${c.id}">
            <div class="barra-progreso"><div class="barra-progreso-fill" id="progreso-fill-${c.id}"></div></div>
            <p class="barra-progreso-txt" id="progreso-txt-${c.id}">Subiendo…</p>
          </div>
          <div id="alerta-misarchivos-${c.id}" class="alerta"></div>
          <div id="lista-misarchivos-${c.id}" class="lista-archivos" style="margin-top:1rem;"></div>
        </div>
      </div>
    `;

    // Toggle expandir/colapsar
    const cabecera   = div.querySelector(".curso-cabecera");
    const body       = div.querySelector(".curso-body");
    const btnToggle  = div.querySelector(".btn-toggle-curso");
    cabecera.addEventListener("click", (e) => {
      if (e.target.closest(".btn-toggle-curso") || e.target === cabecera || e.target.closest(".curso-cabecera")) {
        const abierto = body.classList.toggle("visible");
        btnToggle.classList.toggle("abierto", abierto);
        if (abierto) cargarMisArchivos(c.id, estudianteActualId);
      }
    });

    // Pestañas internas del curso
    div.querySelectorAll(".pestana-curso-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const panelId = btn.dataset.panel;
        div.querySelectorAll(".pestana-curso-btn").forEach(b => b.classList.remove("activa"));
        div.querySelectorAll(".pestana-curso-panel").forEach(p => p.classList.remove("visible"));
        btn.classList.add("activa");
        div.querySelector(`#${panelId}`)?.classList.add("visible");
        if (panelId.startsWith("misarchivos-")) cargarMisArchivos(c.id, estudianteActualId);
      });
    });

    // Zona de subida de archivos
    initZonaSubida(c.id, estudianteActualId, div);

    contenedor.appendChild(div);
  });
}

function renderTareasHTML(tareas) {
  if (!tareas.length) return "<p class='sin-datos'>No hay tareas en este curso.</p>";
  const hoy = new Date();
  return tareas.map(t => {
    const fecha   = t.fecha_entrega ? new Date(t.fecha_entrega) : null;
    const vence   = fecha ? fecha.toLocaleDateString("es-PE") : "Sin fecha";
    const vencida = fecha && fecha < hoy;
    const urgente = fecha && !vencida && (fecha - hoy) < 3 * 86400000;
    return `<div class="tarjeta-tarea ${vencida ? "tarea-vencida" : urgente ? "tarea-urgente" : ""}">
      <div class="tarea-cabecera">
        <h4>${t.titulo}</h4>
        <span class="fecha-texto ${vencida ? "texto-vencido" : urgente ? "texto-urgente" : ""}">
          <i class="fa-solid fa-clock"></i> ${vence}
          ${vencida ? '<span class="etiqueta-vencida">Vencida</span>' : urgente ? '<span class="etiqueta-urgente">¡Pronto!</span>' : ""}
        </span>
      </div>
      ${t.descripcion ? `<p>${t.descripcion}</p>` : ""}
      ${t.puntos ? `<span class="puntos-badge"><i class="fa-solid fa-star"></i> ${t.puntos} pts</span>` : ""}
    </div>`;
  }).join("");
}

// ══════════════════════════════════════════════
//  SUBIDA DE ARCHIVOS DESDE PC
// ══════════════════════════════════════════════
let estudianteActualId = null;

function initZonaSubida(cursoId, estudianteId, contenedor) {
  const zona      = contenedor.querySelector(`#zona-${cursoId}`);
  const inputFile = contenedor.querySelector(`#inputArchivo-${cursoId}`);
  if (!zona || !inputFile) return;

  // Click abre selector
  zona.addEventListener("click", () => inputFile.click());

  // Drag & Drop
  zona.addEventListener("dragover",  (e) => { e.preventDefault(); zona.classList.add("drag-over"); });
  zona.addEventListener("dragleave", ()  => zona.classList.remove("drag-over"));
  zona.addEventListener("drop", (e) => {
    e.preventDefault();
    zona.classList.remove("drag-over");
    const archivo = e.dataTransfer.files[0];
    if (archivo) subirArchivoPC(archivo, cursoId, estudianteId, contenedor);
  });

  // Selección normal
  inputFile.addEventListener("change", () => {
    const archivo = inputFile.files[0];
    if (archivo) {
      subirArchivoPC(archivo, cursoId, estudianteId, contenedor);
      inputFile.value = ""; // reset para permitir subir el mismo archivo de nuevo
    }
  });
}

async function subirArchivoPC(archivo, cursoId, estudianteId, contenedor) {
  const alertaId    = `alerta-misarchivos-${cursoId}`;
  const progresoWrap = contenedor.querySelector(`#progreso-wrap-${cursoId}`);
  const progresoFill = contenedor.querySelector(`#progreso-fill-${cursoId}`);
  const progresoTxt  = contenedor.querySelector(`#progreso-txt-${cursoId}`);

  limpiarAlerta(alertaId);

  // Validar tamaño (10 MB)
  if (archivo.size > 10 * 1024 * 1024) {
    mostrarAlerta(alertaId, "error", "El archivo supera los 10 MB permitidos.");
    return;
  }

  // Mostrar barra de progreso
  progresoWrap?.classList.add("visible");
  if (progresoFill) progresoFill.style.width = "10%";
  if (progresoTxt)  progresoTxt.textContent  = "Preparando…";

  // Nombre único en el bucket
  const ext      = archivo.name.split(".").pop();
  const nombreFinal = `${estudianteId}/${cursoId}/${Date.now()}_${archivo.name}`;

  // Simular progreso mientras sube (Supabase JS no tiene evento de progreso nativo)
  let progreso = 10;
  const intervalo = setInterval(() => {
    progreso = Math.min(progreso + 10, 85);
    if (progresoFill) progresoFill.style.width = progreso + "%";
  }, 200);

  const { data: uploadData, error: uploadError } = await supabase
    .storage
    .from("archivos-estudiantes")   // nombre del bucket en Supabase Storage
    .upload(nombreFinal, archivo, { upsert: false });

  clearInterval(intervalo);

  if (uploadError) {
    progresoWrap?.classList.remove("visible");
    mostrarAlerta(alertaId, "error", `Error al subir: ${uploadError.message}`);
    return;
  }

  // Obtener URL pública
  const { data: urlData } = supabase.storage.from("archivos-estudiantes").getPublicUrl(nombreFinal);
  const url = urlData?.publicUrl || "";

  if (progresoFill) progresoFill.style.width = "95%";
  if (progresoTxt)  progresoTxt.textContent  = "Guardando registro…";

  // Guardar en tabla archivos_estudiante
  const { error: dbError } = await supabase.from("archivos_estudiante").insert({
    estudiante_id: estudianteId,
    curso_id:      cursoId,
    nombre:        archivo.name,
    url:           url,
  });

  if (dbError) {
    progresoWrap?.classList.remove("visible");
    mostrarAlerta(alertaId, "error", `Error al guardar: ${dbError.message}`);
    return;
  }

  if (progresoFill) progresoFill.style.width = "100%";
  if (progresoTxt)  progresoTxt.textContent  = "¡Listo!";

  setTimeout(() => progresoWrap?.classList.remove("visible"), 1200);
  mostrarAlerta(alertaId, "ok", `"${archivo.name}" subido correctamente.`);

  // Recargar lista de mis archivos
  await cargarMisArchivos(cursoId, estudianteId);
}

// Cargar archivos que el estudiante subió en ese curso
async function cargarMisArchivos(cursoId, estudianteId) {
  if (!estudianteId) return;
  const { data } = await supabase
    .from("archivos_estudiante")
    .select("*")
    .eq("curso_id", cursoId)
    .eq("estudiante_id", estudianteId)
    .order("creado_at", { ascending: false });

  const lista = document.getElementById(`lista-misarchivos-${cursoId}`);
  if (!lista) return;

  if (!data?.length) {
    lista.innerHTML = "<p class='sin-datos'>Aún no has subido archivos en este curso.</p>";
    return;
  }

  lista.innerHTML = data.map(a => `
    <div class="tarjeta-archivo">
      <i class="fa-solid ${iconoArchivo(a.nombre)} icono-archivo"></i>
      <div class="info-archivo">
        <span class="nombre-archivo">${a.nombre}</span>
        <span class="fecha-texto">${new Date(a.creado_at).toLocaleDateString("es-PE")}</span>
      </div>
      <div class="acciones-archivo">
        <a href="${a.url}" target="_blank" class="btn-icono" title="Descargar">
          <i class="fa-solid fa-download"></i>
        </a>
        <button class="btn-icono btn-eliminar-archivo" data-id="${a.id}" data-path="${a.url}" title="Eliminar">
          <i class="fa-solid fa-trash"></i>
        </button>
      </div>
    </div>`).join("");

  // Botones eliminar
  lista.querySelectorAll(".btn-eliminar-archivo").forEach(btn => {
    btn.addEventListener("click", async () => {
      if (!confirm("¿Eliminar este archivo?")) return;
      await supabase.from("archivos_estudiante").delete().eq("id", btn.dataset.id);
      await cargarMisArchivos(cursoId, estudianteId);
    });
  });
}

// ══════════════════════════════════════════════
//  VISTA MIS CURSOS (lista simple sin expandir)
// ══════════════════════════════════════════════
function renderCursosSimple(inscripciones) {
  const contenedor = document.getElementById("listaCursos");
  const sinDatos   = document.getElementById("msgSinCursos");
  if (!contenedor) return;
  contenedor.innerHTML = "";

  if (!inscripciones.length) {
    contenedor.appendChild(sinDatos);
    sinDatos.style.display = "block";
    return;
  }
  sinDatos.style.display = "none";

  inscripciones.forEach(({ cursos: c, inscrito_at }) => {
    const div = document.createElement("div");
    div.className = "tarjeta-curso";
    div.innerHTML = `
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
      </div>`;
    contenedor.appendChild(div);
  });
}

// ══════════════════════════════════════════════
//  VISTAS GENERALES (Anuncios / Archivos / Tareas)
// ══════════════════════════════════════════════
function dibujarAnuncios(lista) {
  const el = document.getElementById("listaAnuncios");
  if (!el) return;
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

function dibujarArchivos(lista) {
  const el = document.getElementById("listaArchivos");
  if (!el) return;
  if (!lista.length) { el.innerHTML = "<p class='sin-datos'>No hay archivos disponibles aún.</p>"; return; }
  el.innerHTML = lista.map(a => `
    <div class="tarjeta-archivo">
      <i class="fa-solid ${iconoArchivo(a.nombre_archivo)} icono-archivo"></i>
      <div class="info-archivo">
        <span class="nombre-archivo">${a.nombre_archivo}</span>
        <span class="texto-curso"><i class="fa-solid fa-book-open"></i> ${a.cursos?.nombre || "—"}</span>
        <span class="fecha-texto">${new Date(a.creado_at).toLocaleDateString("es-PE")}</span>
      </div>
      <a href="${a.url}" target="_blank" class="btn-icono" title="Descargar">
        <i class="fa-solid fa-download"></i>
      </a>
    </div>`).join("");
}

function dibujarTareas(lista) {
  const el  = document.getElementById("listaTareas");
  if (!el) return;
  const hoy = new Date();
  if (!lista.length) { el.innerHTML = "<p class='sin-datos'>No hay tareas asignadas aún.</p>"; return; }
  el.innerHTML = lista.map(t => {
    const fecha   = t.fecha_entrega ? new Date(t.fecha_entrega) : null;
    const vence   = fecha ? fecha.toLocaleDateString("es-PE") : "Sin fecha";
    const vencida = fecha && fecha < hoy;
    const urgente = fecha && !vencida && (fecha - hoy) < 3 * 86400000;
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

// ══════════════════════════════════════════════
//  FILTROS
// ══════════════════════════════════════════════
function initFiltros() {
  // Poblar selectores con los cursos del estudiante
  ["filtroAnuncios","filtroArchivos","filtroTareas"].forEach(id => {
    const sel = document.getElementById(id);
    if (!sel) return;
    sel.innerHTML = '<option value="">Todos los cursos</option>';
    misCursos.forEach(c => { sel.innerHTML += `<option value="${c.id}">${c.nombre}</option>`; });
  });

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

// ══════════════════════════════════════════════
//  UNIRSE POR CÓDIGO
// ══════════════════════════════════════════════
function initFormCodigo(estudianteId) {
  document.getElementById("formCodigo")?.addEventListener("submit", async e => {
    e.preventDefault();
    limpiarAlerta("alertaCodigo");
    document.getElementById("errCodigo").textContent = "";

    const codigo = document.getElementById("inputCodigo").value.trim().toUpperCase();
    if (!codigo) { document.getElementById("errCodigo").textContent = "Ingresa un código."; return; }

    const btn = e.target.querySelector("button[type=submit]");
    btn.disabled = true; btn.textContent = "Buscando…";

    const { data: curso, error } = await supabase
      .from("cursos").select("id,nombre").eq("codigo", codigo).single();

    if (error || !curso) {
      mostrarAlerta("alertaCodigo", "error", "Código inválido. Verifica e intenta de nuevo.");
      btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-right-to-bracket"></i> Unirme';
      return;
    }

    const { data: yaInscrito } = await supabase
      .from("inscripciones").select("id")
      .eq("curso_id", curso.id).eq("estudiante_id", estudianteId).maybeSingle();

    if (yaInscrito) {
      mostrarAlerta("alertaCodigo", "error", "Ya estás inscrito en este curso.");
      btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-right-to-bracket"></i> Unirme';
      return;
    }

    const { error: errIns } = await supabase
      .from("inscripciones").insert({ curso_id: curso.id, estudiante_id: estudianteId });

    btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-right-to-bracket"></i> Unirme';

    if (errIns) { mostrarAlerta("alertaCodigo", "error", errIns.message); return; }

    mostrarAlerta("alertaCodigo", "ok", `¡Te uniste a "${curso.nombre}"! 🎉`);
    e.target.reset();

    // Recargar todo
    setTimeout(async () => {
      const { inscripciones } = await cargarTodosLosDatos(estudianteId);
      renderCursosInicio(inscripciones);
      renderCursosSimple(inscripciones);
      dibujarAnuncios(todosAnuncios);
      dibujarArchivos(todosArchivos);
      dibujarTareas(todasTareas);
      renderAsideAnuncios();
      renderAsideTareas();
      renderAsideArchivos();
      initFiltros();
      mostrarVista("inicio");
    }, 1500);
  });
}

// ══════════════════════════════════════════════
//  PERFIL
// ══════════════════════════════════════════════
function initFormPerfil(usuario, perfil) {
  document.getElementById("pNombre").value   = perfil.nombre   || "";
  document.getElementById("pApellido").value = perfil.apellido || "";
  document.getElementById("pEmail").value    = usuario.email   || "";

  // Card de resumen de perfil
  const nombreCompleto = document.getElementById("perfilNombreCompleto");
  const emailVista     = document.getElementById("perfilEmailVista");
  if (nombreCompleto) nombreCompleto.textContent = `${perfil.nombre} ${perfil.apellido}`;
  if (emailVista)     emailVista.textContent     = usuario.email;

  const desdeEl = document.getElementById("perfilDesde");
  if (desdeEl && perfil.creado_at) {
    desdeEl.textContent = "Miembro desde " +
      new Date(perfil.creado_at).toLocaleDateString("es-PE", { year: "numeric", month: "long" });
  }

  // Toggle ojo contraseña
  document.querySelector(".btn-ojo")?.addEventListener("click", function() {
    const input   = document.getElementById(this.dataset.objetivo);
    const mostrar = input.type === "password";
    input.type    = mostrar ? "text" : "password";
    this.querySelector("i").className = mostrar ? "fa-regular fa-eye-slash" : "fa-regular fa-eye";
  });

  document.getElementById("formPerfil")?.addEventListener("submit", async e => {
    e.preventDefault();
    limpiarAlerta("alertaPerfil");

    const nombre   = document.getElementById("pNombre").value.trim();
    const apellido = document.getElementById("pApellido").value.trim();
    const clave    = document.getElementById("pClave").value;

    ["errPNombre","errPApellido","errPClave"].forEach(id => {
      document.getElementById(id).textContent = "";
    });

    let valido = true;
    if (!nombre)   { document.getElementById("errPNombre").textContent   = "Nombre obligatorio.";   valido = false; }
    if (!apellido) { document.getElementById("errPApellido").textContent = "Apellido obligatorio."; valido = false; }
    if (clave && clave.length < 6) { document.getElementById("errPClave").textContent = "Mínimo 6 caracteres."; valido = false; }
    if (!valido) return;

    const btn = e.target.querySelector("button[type=submit]");
    btn.disabled = true; btn.textContent = "Guardando…";

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

    // Actualizar sidebar y card de perfil
    document.getElementById("sideNombre").textContent = `${nombre} ${apellido}`;
    if (nombreCompleto) nombreCompleto.textContent = `${nombre} ${apellido}`;
    document.getElementById("pClave").value = "";
    mostrarAlerta("alertaPerfil", "ok", "Perfil actualizado correctamente. ✅");
  });
}

// ══════════════════════════════════════════════
//  SIDEBAR MÓVIL
// ══════════════════════════════════════════════
function initSidebarMovil() {
  const btn     = document.getElementById("btnAbrirSidebar");
  const sidebar = document.querySelector(".panel-sidebar");
  const fondo   = document.getElementById("fondoSidebar");
  btn?.addEventListener("click",   () => { sidebar?.classList.toggle("sidebar-abierto"); fondo?.classList.toggle("visible"); });
  fondo?.addEventListener("click", () => { sidebar?.classList.remove("sidebar-abierto"); fondo?.classList.remove("visible"); });
}

// ══════════════════════════════════════════════
//  INICIO
// ══════════════════════════════════════════════
window.addEventListener("DOMContentLoaded", async () => {
  const sesion = await verificarSesion();
  if (!sesion) return;

  const { usuario, perfil } = sesion;
  estudianteActualId = perfil.id;

  document.getElementById("sideNombre").textContent = `${perfil.nombre} ${perfil.apellido}`;

  // Cargar todos los datos de una vez
  const { inscripciones } = await cargarTodosLosDatos(perfil.id);

  // Renderizar vistas
  renderCursosInicio(inscripciones);
  renderCursosSimple(inscripciones);
  dibujarAnuncios(todosAnuncios);
  dibujarArchivos(todosArchivos);
  dibujarTareas(todasTareas);
  renderAsideAnuncios();
  renderAsideTareas();
  renderAsideArchivos();
  initFiltros();

  // Init formularios
  initFormCodigo(perfil.id);
  initFormPerfil(usuario, perfil);
  initSidebarMovil();

  // Navegación sidebar
  document.querySelectorAll(".nav-btn").forEach(btn => {
    btn.addEventListener("click", () => mostrarVista(btn.dataset.vista));
  });

  // Cerrar sesión
  document.getElementById("btnCerrarSesion3")?.addEventListener("click", async () => {
    await supabase.auth.signOut();
    window.location.href = "/index.html";
  });
});