/* ═══════════════════════════════════════════════
   ENIT Academy — Panel Docente + Estudiante CSS
   Compartido con panel_estudiante.css (mismo archivo)
   ═══════════════════════════════════════════════ */

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --rosa:      #ff4fa0;
  --lila:      #8b5cf6;
  --azul:      #1e2a58;
  --fondo:     #f4f2ff;
  --blanco:    #ffffff;
  --gris:      #6b7280;
  --gris-c:    #e5e7eb;
  --texto:     #1f2937;
  --sombra:    0 4px 20px rgba(139,92,246,.12);
  --radio:     16px;
}

body {
  font-family: 'Nunito', sans-serif;
  background: var(--fondo);
  color: var(--texto);
  overflow-x: hidden;
}

/* ─── LAYOUT ─────────────────────────────────── */
.panel-layout {
  display: flex;
  min-height: 100vh;
}

.contenido-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

/* ─── TOPBAR MÓVIL ───────────────────────────── */
.panel-topbar {
  display: none;
  align-items: center;
  gap: 12px;
  background: var(--blanco);
  padding: 12px 18px;
  border-bottom: 1px solid var(--gris-c);
  position: sticky;
  top: 0;
  z-index: 50;
}

.panel-topbar-title {
  font-weight: 700;
  font-size: 1rem;
  color: var(--azul);
}

.sidebar-toggle {
  background: none;
  border: none;
  font-size: 1.25rem;
  color: var(--lila);
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 8px;
  transition: background .2s;
}
.sidebar-toggle:hover { background: var(--fondo); }

/* ─── SIDEBAR ────────────────────────────────── */
.sidebar {
  width: 260px;
  min-width: 260px;
  background: var(--blanco);
  border-right: 1px solid var(--gris-c);
  display: flex;
  flex-direction: column;
  padding: 28px 16px;
  gap: 8px;
  position: sticky;
  top: 0;
  height: 100vh;
  overflow-y: auto;
}

.sidebar-overlay {
  display: none;
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,.4);
  z-index: 99;
  opacity: 0;
  transition: opacity .25s;
}
.sidebar-overlay.visible { opacity: 1; }

/* Perfil sidebar */
.sidebar-perfil {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 4px 20px;
  border-bottom: 1px solid var(--gris-c);
  margin-bottom: 8px;
}

.avatar-wrap { position: relative; flex-shrink: 0; }

.avatar {
  width: 46px; height: 46px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--lila), var(--rosa));
  display: flex; align-items: center; justify-content: center;
  color: #fff; font-size: 1.1rem;
}

.avatar-lg {
  width: 72px; height: 72px; font-size: 1.8rem;
  border: 3px solid var(--lila);
}

.avatar-badge {
  position: absolute;
  bottom: -2px; right: -2px;
  width: 20px; height: 20px;
  border-radius: 50%;
  background: var(--lila);
  border: 2px solid var(--blanco);
  display: flex; align-items: center; justify-content: center;
  color: #fff; font-size: .55rem;
}

.sidebar-info { min-width: 0; }
.sidebar-nombre { font-weight: 700; font-size: .9rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.sidebar-rol { font-size: .75rem; color: var(--lila); font-weight: 600; text-transform: uppercase; letter-spacing: .04em; }

/* Nav items */
.sidebar-nav { display: flex; flex-direction: column; gap: 4px; flex: 1; }

.nav-item {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 14px;
  border-radius: 10px;
  border: none; background: none;
  color: var(--gris); font-family: 'Nunito', sans-serif;
  font-size: .9rem; font-weight: 600;
  cursor: pointer; text-align: left;
  transition: all .2s;
}
.nav-item:hover { background: var(--fondo); color: var(--lila); }
.nav-item.active { background: linear-gradient(135deg,#ede9fe,#fce7f3); color: var(--lila); }
.nav-item i { width: 18px; text-align: center; }

.btn-cerrar {
  display: flex; align-items: center; gap: 8px;
  padding: 10px 14px; border-radius: 10px;
  border: none; background: #fef2f2;
  color: #dc2626; font-family: 'Nunito', sans-serif;
  font-size: .875rem; font-weight: 600;
  cursor: pointer; transition: all .2s;
  margin-top: auto;
}
.btn-cerrar:hover { background: #fee2e2; }

/* ─── CONTENIDO ──────────────────────────────── */
.contenido {
  flex: 1;
  padding: 32px;
  max-width: 1100px;
  width: 100%;
}

/* Stats bar */
.stats-bar {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 28px;
}

.stat-card {
  background: var(--blanco);
  border-radius: var(--radio);
  padding: 20px;
  display: flex; align-items: center; gap: 14px;
  box-shadow: var(--sombra);
  border: 1px solid var(--gris-c);
}

.stat-card i {
  font-size: 1.6rem;
  width: 44px; height: 44px;
  border-radius: 12px;
  background: linear-gradient(135deg,#ede9fe,#fce7f3);
  color: var(--lila);
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}

.stat-card span { font-size: 1.5rem; font-weight: 800; color: var(--azul); display: block; }
.stat-card p { font-size: .78rem; color: var(--gris); font-weight: 600; margin-top: 2px; }

/* Vista header */
.vista-header {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap; gap: 10px;
}
.vista-header h2 { font-size: 1.4rem; font-weight: 800; color: var(--azul); }

.subtitulo-vista { color: var(--gris); margin-bottom: 24px; font-size: .95rem; }

/* ─── VISTAS ─────────────────────────────────── */
.vista { animation: fadeIn .2s ease; }
.oculto { display: none !important; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }

/* ─── CURSOS GRID ────────────────────────────── */
.grid-cursos {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(270px, 1fr));
  gap: 20px;
}

.card-curso {
  background: var(--blanco);
  border-radius: var(--radio);
  padding: 22px;
  border: 1px solid var(--gris-c);
  box-shadow: var(--sombra);
  display: flex; flex-direction: column; gap: 10px;
  transition: transform .2s, box-shadow .2s;
}
.card-curso:hover { transform: translateY(-3px); box-shadow: 0 8px 28px rgba(139,92,246,.18); }

.card-top {
  display: flex; justify-content: space-between; align-items: center;
}

.badge-nivel {
  padding: 3px 10px; border-radius: 20px;
  font-size: .72rem; font-weight: 700; text-transform: uppercase; letter-spacing: .05em;
}
.nivel-basico    { background: #d1fae5; color: #065f46; }
.nivel-intermedio{ background: #dbeafe; color: #1e40af; }
.nivel-avanzado  { background: #fce7f3; color: #9d174d; }

.codigo-small { font-size: .75rem; color: var(--gris); }

.card-curso h3 { font-size: 1rem; font-weight: 700; color: var(--azul); }
.card-curso p  { font-size: .85rem; color: var(--gris); flex: 1; }

.card-footer { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 6px; }
.docente-small { font-size: .8rem; color: var(--lila); font-weight: 600; }
.fecha-inscripcion { font-size: .75rem; color: var(--gris); }

.btn-ver {
  margin-top: 4px;
  padding: 8px 16px;
  border-radius: 8px; border: none;
  background: linear-gradient(135deg, var(--lila), var(--rosa));
  color: #fff; font-size: .82rem; font-weight: 700;
  cursor: pointer; transition: opacity .2s;
  display: flex; align-items: center; gap: 6px; align-self: flex-end;
}
.btn-ver:hover { opacity: .88; }

/* ─── FORMULARIOS ────────────────────────────── */
.form-panel { display: flex; flex-direction: column; gap: 18px; max-width: 700px; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }

.grupo { display: flex; flex-direction: column; gap: 6px; }
.grupo label { font-size: .85rem; font-weight: 700; color: var(--azul); }

.grupo input, .grupo select, .grupo textarea {
  padding: 10px 14px;
  border: 1.5px solid var(--gris-c);
  border-radius: 10px;
  font-family: 'Nunito', sans-serif; font-size: .9rem;
  background: var(--blanco); color: var(--texto);
  transition: border-color .2s, box-shadow .2s;
  width: 100%;
}
.grupo input:focus, .grupo select:focus, .grupo textarea:focus {
  outline: none; border-color: var(--lila);
  box-shadow: 0 0 0 3px rgba(139,92,246,.12);
}
.grupo input:disabled { background: var(--fondo); cursor: not-allowed; color: var(--gris); }
.grupo textarea { resize: vertical; min-height: 90px; }

.error { font-size: .78rem; color: #dc2626; font-weight: 600; min-height: 14px; }
.nota  { font-size: .78rem; color: var(--gris); }

/* Botones */
.btn-primary {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 11px 24px; border-radius: 10px; border: none;
  background: linear-gradient(135deg, var(--lila), var(--rosa));
  color: #fff; font-family: 'Nunito', sans-serif; font-size: .9rem; font-weight: 700;
  cursor: pointer; transition: opacity .2s, transform .2s;
}
.btn-primary:hover:not(:disabled) { opacity: .9; transform: translateY(-1px); }
.btn-primary:disabled { opacity: .55; cursor: not-allowed; }
.btn-sm { padding: 8px 16px; font-size: .82rem; }

.btn-outline {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 9px 18px; border-radius: 10px;
  border: 1.5px solid var(--gris-c);
  background: var(--blanco); color: var(--gris);
  font-family: 'Nunito', sans-serif; font-size: .85rem; font-weight: 600;
  cursor: pointer; transition: all .2s;
}
.btn-outline:hover { border-color: #dc2626; color: #dc2626; background: #fef2f2; }

.btn-volver {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 8px 16px; border-radius: 8px; border: none;
  background: var(--fondo); color: var(--gris);
  font-family: 'Nunito', sans-serif; font-size: .85rem; font-weight: 600;
  cursor: pointer; transition: all .2s; margin-bottom: 20px;
}
.btn-volver:hover { background: var(--gris-c); color: var(--azul); }

.btn-icon {
  width: 34px; height: 34px; border-radius: 8px;
  border: none; background: var(--fondo); color: var(--gris);
  display: inline-flex; align-items: center; justify-content: center;
  font-size: .85rem; cursor: pointer; transition: all .2s; text-decoration: none;
}
.btn-icon:hover { background: var(--gris-c); }
.btn-delete:hover { background: #fef2f2; color: #dc2626; }
.btn-download:hover { background: #d1fae5; color: #065f46; }

/* Alerta */
.form-alerta { display: none; padding: 10px 14px; border-radius: 10px; font-size: .85rem; font-weight: 600; gap: 8px; align-items: center; }
.form-alerta.visible { display: flex; }
.alerta-ok    { background: #d1fae5; color: #065f46; }
.alerta-error { background: #fee2e2; color: #dc2626; }

/* Tabs asignar */
.tabs-asignar { display: flex; gap: 8px; flex-wrap: wrap; }
.tab-btn {
  padding: 7px 14px; border-radius: 8px; border: 1.5px solid var(--gris-c);
  background: var(--blanco); color: var(--gris);
  font-family: 'Nunito', sans-serif; font-size: .82rem; font-weight: 600;
  cursor: pointer; transition: all .2s; display: flex; align-items: center; gap: 6px;
}
.tab-btn.active { border-color: var(--lila); background: #ede9fe; color: var(--lila); }

.tab-panel { padding-top: 12px; }

#buscarEstudiante { margin-bottom: 10px; }

.lista-check {
  max-height: 240px; overflow-y: auto;
  border: 1.5px solid var(--gris-c); border-radius: 10px; padding: 8px;
  display: flex; flex-direction: column; gap: 4px;
}

.check-item {
  display: flex; align-items: center; gap: 10px;
  padding: 8px 10px; border-radius: 8px; cursor: pointer; transition: background .15s;
}
.check-item:hover { background: var(--fondo); }
.check-item input { accent-color: var(--lila); width: 15px; height: 15px; flex-shrink: 0; }
.check-avatar { width: 28px; height: 28px; border-radius: 50%; background: var(--fondo); color: var(--lila); display: flex; align-items: center; justify-content: center; font-size: .75rem; flex-shrink: 0; }
.check-item span { font-size: .85rem; font-weight: 600; }

.info-codigo {
  padding: 14px; border-radius: 10px; background: #eff6ff;
  border-left: 3px solid #3b82f6; font-size: .85rem; color: #1e40af;
  display: flex; align-items: flex-start; gap: 10px; line-height: 1.5;
}

/* Detalle curso */
.detalle-cabecera {
  display: flex; justify-content: space-between; align-items: flex-start;
  gap: 20px; flex-wrap: wrap;
  background: var(--blanco); border-radius: var(--radio); padding: 24px;
  border: 1px solid var(--gris-c); box-shadow: var(--sombra); margin-bottom: 16px;
}
.detalle-desc { color: var(--gris); margin-top: 8px; font-size: .9rem; }

.detalle-codigo-box {
  display: flex; align-items: center; gap: 10px;
  background: var(--fondo); border-radius: 12px; padding: 12px 18px;
  flex-shrink: 0;
}
.detalle-codigo-box p { font-size: .75rem; color: var(--gris); margin-bottom: 4px; }
.detalle-codigo-box strong { font-size: 1.2rem; letter-spacing: .1em; color: var(--azul); }

.btn-copiar { width: 30px; height: 30px; border-radius: 8px; border: none; background: var(--gris-c); color: var(--gris); cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: .8rem; transition: all .2s; }
.btn-copiar:hover { background: var(--lila); color: #fff; }

.detalle-acciones { margin-bottom: 20px; }

.lista-inscritos { display: flex; flex-direction: column; gap: 8px; }
.inscrito-item {
  display: flex; align-items: center; gap: 12px;
  background: var(--blanco); border: 1px solid var(--gris-c); border-radius: 10px; padding: 12px 16px;
}
.inscrito-avatar { width: 34px; height: 34px; border-radius: 50%; background: linear-gradient(135deg,#ede9fe,#fce7f3); color: var(--lila); display: flex; align-items: center; justify-content: center; font-size: .9rem; flex-shrink: 0; }
.inscrito-item span { font-weight: 600; font-size: .9rem; }

/* Tabla estudiantes */
.buscador { width: 100%; max-width: 400px; margin-bottom: 16px; }

.tabla-estudiantes { display: flex; flex-direction: column; gap: 0; border-radius: var(--radio); overflow: hidden; border: 1px solid var(--gris-c); }

.tabla-header, .tabla-fila {
  display: grid; grid-template-columns: 1fr 1fr 1fr;
  padding: 12px 18px; gap: 10px;
}
.tabla-header { background: var(--fondo); font-size: .78rem; font-weight: 700; color: var(--gris); text-transform: uppercase; letter-spacing: .05em; }
.tabla-fila { background: var(--blanco); border-top: 1px solid var(--gris-c); font-size: .875rem; transition: background .15s; }
.tabla-fila:hover { background: #f9f5ff; }
.tabla-fila span { display: flex; align-items: center; gap: 8px; }

/* Perfil */
.perfil-avatar-section { display: flex; align-items: center; gap: 18px; }
.perfil-rol-badge { font-size: .85rem; font-weight: 700; color: var(--lila); display: flex; align-items: center; gap: 6px; margin-bottom: 4px; }
.perfil-desde { font-size: .8rem; color: var(--gris); }
.divisor { border: none; border-top: 1px solid var(--gris-c); }

.campo-password .input-wrapper { position: relative; }
.campo-password input { padding-right: 40px; }
.toggle-pw { position: absolute; right: 10px; top: 50%; transform: translateY(-50%); background: none; border: none; color: var(--gris); cursor: pointer; font-size: .9rem; }

/* ─── CLASSROOM (Anuncios / Archivos / Tareas) ─ */
.classroom-grid {
  display: grid;
  grid-template-columns: 380px 1fr;
  gap: 24px;
  align-items: start;
}

.form-card {
  background: var(--blanco);
  border: 1px solid var(--gris-c);
  border-radius: var(--radio);
  padding: 24px;
  box-shadow: var(--sombra);
}
.form-card h3 { font-size: 1rem; font-weight: 700; color: var(--azul); margin-bottom: 18px; display: flex; align-items: center; gap: 8px; }
.classroom-list-col h3 { font-size: 1rem; font-weight: 700; color: var(--azul); margin-bottom: 14px; display: flex; align-items: center; gap: 8px; }

.lista-classroom { display: flex; flex-direction: column; gap: 12px; }

/* Anuncios */
.anuncio-card {
  background: var(--blanco);
  border: 1px solid var(--gris-c);
  border-radius: var(--radio);
  padding: 18px 20px;
  box-shadow: var(--sombra);
  border-left: 4px solid var(--lila);
}
.anuncio-estudiante { border-left-color: var(--rosa); }

.anuncio-header { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-bottom: 8px; }
.anuncio-curso { font-size: .75rem; font-weight: 700; color: var(--lila); display: flex; align-items: center; gap: 4px; background: #ede9fe; padding: 2px 8px; border-radius: 20px; }
.anuncio-fecha { font-size: .75rem; color: var(--gris); margin-left: auto; }
.anuncio-card h4 { font-size: .95rem; font-weight: 700; color: var(--azul); margin-bottom: 6px; }
.anuncio-card p  { font-size: .875rem; color: var(--gris); line-height: 1.6; }

/* Archivos */
.archivo-card {
  background: var(--blanco);
  border: 1px solid var(--gris-c);
  border-radius: var(--radio);
  padding: 14px 16px;
  display: flex; align-items: center; gap: 14px;
  box-shadow: var(--sombra);
  transition: transform .15s;
}
.archivo-card:hover { transform: translateY(-2px); }

.archivo-icon {
  width: 44px; height: 44px; border-radius: 10px;
  background: linear-gradient(135deg,#ede9fe,#fce7f3);
  color: var(--lila); font-size: 1.3rem;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.fa-file-pdf   { color: #dc2626; }
.fa-file-word  { color: #2563eb; }
.fa-file-excel { color: #16a34a; }
.fa-file-powerpoint { color: #ea580c; }
.fa-file-image { color: #8b5cf6; }
.fa-file-video { color: #db2777; }
.fa-file-audio { color: #0891b2; }

.archivo-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 3px; }
.archivo-nombre { font-size: .875rem; font-weight: 700; color: var(--azul); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.archivo-curso  { font-size: .75rem; color: var(--lila); display: flex; align-items: center; gap: 4px; }
.archivo-fecha  { font-size: .72rem; color: var(--gris); }
.archivo-acciones { display: flex; gap: 6px; flex-shrink: 0; }

/* Tareas */
.tarea-card {
  background: var(--blanco);
  border: 1px solid var(--gris-c);
  border-radius: var(--radio);
  padding: 18px 20px;
  box-shadow: var(--sombra);
  border-left: 4px solid #10b981;
}
.tarea-vencida { border-left-color: #dc2626; background: #fff5f5; }
.tarea-urgente { border-left-color: #f59e0b; background: #fffbeb; }

.tarea-header { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-bottom: 8px; }
.tarea-fecha { font-size: .75rem; font-weight: 600; color: var(--gris); display: flex; align-items: center; gap: 4px; margin-left: auto; }
.tarea-fecha.vencida { color: #dc2626; }
.tarea-fecha.urgente { color: #d97706; }

.badge-vencida { background: #fee2e2; color: #dc2626; padding: 1px 6px; border-radius: 10px; font-size: .7rem; font-weight: 700; }
.badge-urgente { background: #fef3c7; color: #d97706; padding: 1px 6px; border-radius: 10px; font-size: .7rem; font-weight: 700; }

.tarea-card h4 { font-size: .95rem; font-weight: 700; color: var(--azul); margin-bottom: 6px; }
.tarea-card p  { font-size: .875rem; color: var(--gris); line-height: 1.6; margin-bottom: 8px; }
.tarea-puntos  { font-size: .78rem; font-weight: 700; color: #10b981; display: flex; align-items: center; gap: 4px; }

/* Filtro select */
.filtro-select {
  padding: 7px 12px; border: 1.5px solid var(--gris-c); border-radius: 8px;
  font-family: 'Nunito', sans-serif; font-size: .85rem; background: var(--blanco);
  color: var(--texto); cursor: pointer;
}
.filtro-select:focus { outline: none; border-color: var(--lila); }

/* Unirse código */
.form-codigo { max-width: 400px; }
.input-codigo-wrap { position: relative; }
.input-icono { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--gris); font-size: .9rem; }

/* Vacío */
.txt-vacio { color: var(--gris); font-size: .875rem; text-align: center; padding: 20px; }

/* ─── RESPONSIVE ─────────────────────────────── */
@media (max-width: 1100px) {
  .classroom-grid { grid-template-columns: 1fr; }
}

@media (max-width: 900px) {
  .stats-bar { grid-template-columns: repeat(3,1fr); }
}

@media (max-width: 768px) {
  .panel-topbar { display: flex; }

  .sidebar {
    position: fixed;
    left: -280px;
    top: 0;
    height: 100vh;
    z-index: 100;
    transition: left .25s ease;
    padding-top: 20px;
  }
  .sidebar.sidebar-open { left: 0; }
  .sidebar-overlay { display: block; pointer-events: none; }
  .sidebar-overlay.visible { pointer-events: auto; }

  .contenido { padding: 16px; }
  .stats-bar { grid-template-columns: repeat(3,1fr); gap: 10px; }
  .stat-card { padding: 12px; gap: 8px; flex-direction: column; text-align: center; }
  .stat-card i { width: 36px; height: 36px; font-size: 1.1rem; margin: 0 auto; }
  .stat-card span { font-size: 1.2rem; }
  .form-row { grid-template-columns: 1fr; }
  .detalle-cabecera { flex-direction: column; }
}

@media (max-width: 480px) {
  .stats-bar { grid-template-columns: 1fr 1fr; }
  .grid-cursos { grid-template-columns: 1fr; }
  .vista-header { flex-direction: column; align-items: flex-start; }
  .tabla-header, .tabla-fila { grid-template-columns: 1fr 1fr; }
  .tabla-header span:nth-child(3),
  .tabla-fila span:nth-child(3) { display: none; }
}
