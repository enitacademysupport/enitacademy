/* ═══════════════════════════════════════
   ENIT Academy — inicio.css
   ═══════════════════════════════════════ */

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
a { text-decoration: none; }

:root {
  --rosa:    #ff4fa0;
  --lila:    #8b5cf6;
  --amarillo:#ffd84d;
  --azul:    #1e2a58;
  --fondo:   #fdf6ff;
  --gris:    #6b7280;
  --blanco:  #ffffff;
  --negro:   #111827;
  --radio:   20px;
  --sombra:  0 4px 24px rgba(139,92,246,.10);
}

body {
  font-family: 'Nunito', Arial, sans-serif;
  background: var(--fondo);
  color: var(--negro);
  overflow-x: hidden;
  line-height: 1.6;
}

img { width: 100%; display: block; object-fit: cover; }

/* ─── SECCIONES ─────────────────────── */
.seccion {
  padding: 80px 8%;
}

.seccion-titulo {
  text-align: center;
  margin-bottom: 50px;
}
.seccion-titulo h2 {
  font-size: 2.2rem;
  font-weight: 900;
  color: var(--azul);
  margin-bottom: 10px;
}
.seccion-titulo p {
  color: var(--gris);
  font-size: 1.05rem;
}

/* ─── GRIDS ─────────────────────────── */
.grid-4 { display: grid; grid-template-columns: repeat(4,1fr); gap: 24px; }
.grid-3 { display: grid; grid-template-columns: repeat(3,1fr); gap: 28px; }

/* ─── HERO ──────────────────────────── */
.hero {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 48px;
  padding: 100px 8%;
  background: linear-gradient(270deg, var(--rosa), var(--lila), var(--rosa));
  background-size: 400% 400%;
  animation: gradMove 10s ease infinite;
}

.hero-texto { flex: 1; min-width: 300px; }

.titulo-hover {
  display: flex;
  gap: 14px;
  flex-wrap: wrap;
  font-size: 3rem;
  font-weight: 900;
  color: var(--blanco);
  margin-bottom: 20px;
  line-height: 1.1;
}

.palabra { display: flex; transition: transform .35s, color .35s; cursor: pointer; }
.palabra:hover { transform: translateY(-10px) scale(1.06); }
.palabra:nth-child(odd):hover  { color: var(--amarillo); text-shadow: 0 0 20px rgba(255,217,0,.7); }
.palabra:nth-child(even):hover { color: var(--fondo);    text-shadow: 0 0 20px rgba(255,255,255,.5); }

.palabra span {
  transition: transform .2s, color .2s;
  display: inline-block;
}
.palabra span:hover { color: var(--amarillo); transform: translateY(-5px); }

.hero-texto p {
  font-size: 1.15rem;
  color: rgba(255,255,255,.92);
  font-weight: 600;
  max-width: 520px;
  margin-bottom: 32px;
}

.btn-hero {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 16px 36px;
  border-radius: 50px;
  background: var(--negro);
  color: var(--blanco);
  font-size: 1rem;
  font-weight: 800;
  transition: transform .25s, box-shadow .25s, background .25s;
}
.btn-hero:hover {
  transform: translateY(-4px);
  background: var(--blanco);
  color: var(--negro);
  box-shadow: 0 12px 32px rgba(0,0,0,.18);
}

.hero-img { flex: 1; max-width: 500px; min-width: 260px; animation: float 4s ease-in-out infinite; }
.hero-img img { filter: drop-shadow(0 20px 40px rgba(0,0,0,.2)); border-radius: 12px; }

/* ─── CARDS APRENDER ────────────────── */
.queaprenderas { background: var(--blanco); }

.card-aprender {
  border-radius: var(--radio);
  overflow: hidden;
  background: var(--fondo);
  border: 1.5px solid rgba(139,92,246,.1);
  text-align: center;
  padding: 0 0 20px;
  transition: transform .3s, box-shadow .3s;
  box-shadow: var(--sombra);
}
.card-aprender:hover { transform: translateY(-8px); box-shadow: 0 16px 40px rgba(139,92,246,.18); }
.card-aprender img { height: 180px; object-fit: cover; width: 100%; }
.card-aprender h3 { font-size: 1.05rem; font-weight: 800; margin: 14px 0 6px; color: var(--azul); }
.card-aprender p  { font-size: .875rem; color: var(--gris); padding: 0 16px; }

/* ─── NIVELES ───────────────────────── */
.niveles-sec {
  background: linear-gradient(160deg, #f5f0ff 0%, #fff0f8 100%);
}

.card-nivel {
  border-radius: var(--radio);
  padding: 30px 24px;
  background: var(--blanco);
  border: 1.5px solid rgba(139,92,246,.15);
  text-align: center;
  box-shadow: var(--sombra);
  transition: transform .3s, box-shadow .3s;
  display: flex; flex-direction: column; align-items: center; gap: 10px;
}
.card-nivel:hover { transform: translateY(-10px); box-shadow: 0 18px 44px rgba(139,92,246,.2); }
.card-nivel img { width: 150px; height: 150px; object-fit: contain; }
.card-nivel h3 { font-size: 1.2rem; font-weight: 800; color: var(--azul); }
.card-nivel p  { font-size: .875rem; color: var(--gris); flex: 1; }
.card-nivel a  {
  margin-top: 8px;
  display: inline-block;
  padding: 10px 26px;
  border-radius: 50px;
  background: var(--negro);
  color: var(--blanco);
  font-size: .875rem;
  font-weight: 700;
  transition: background .25s, transform .2s;
}
.card-nivel a:hover { background: var(--rosa); transform: translateY(-2px); }
.card-nivel--featured {
  border: 2px solid var(--lila);
  background: linear-gradient(135deg, #f5f3ff, #fff0f8);
  transform: scale(1.03);
}
.card-nivel--featured:hover { transform: scale(1.03) translateY(-10px); }

/* ─── BENEFICIOS ────────────────────── */
.beneficios-sec { background: var(--blanco); }

.card-beneficio {
  border-radius: var(--radio);
  padding: 32px 20px;
  background: var(--fondo);
  border: 1.5px solid rgba(139,92,246,.1);
  text-align: center;
  box-shadow: var(--sombra);
  transition: transform .3s, box-shadow .3s;
}
.card-beneficio:hover { transform: translateY(-8px); box-shadow: 0 16px 40px rgba(139,92,246,.18); }

.beneficio-icon {
  width: 60px; height: 60px;
  border-radius: 16px;
  background: linear-gradient(135deg,#ede9fe,#fce7f3);
  display: flex; align-items: center; justify-content: center;
  margin: 0 auto 16px;
  font-size: 1.5rem;
  color: var(--lila);
}
.card-beneficio h3 { font-size: 1rem; font-weight: 800; color: var(--azul); margin-bottom: 8px; }
.card-beneficio p  { font-size: .875rem; color: var(--gris); }

/* ─── STATS ─────────────────────────── */
.stats-sec {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0;
  padding: 60px 8%;
  background: linear-gradient(135deg, var(--lila), var(--rosa));
}
.stat-item { text-align: center; flex: 1; }
.stat-num   { display: block; font-size: 2.5rem; font-weight: 900; color: var(--blanco); }
.stat-label { display: block; font-size: .875rem; font-weight: 600; color: rgba(255,255,255,.8); margin-top: 4px; }
.stat-sep   { width: 1px; height: 50px; background: rgba(255,255,255,.3); }

/* ─── OPINIONES ─────────────────────── */
.opiniones-sec { background: var(--fondo); overflow: hidden; }

.scroll-wrapper { overflow: hidden; }
.comentarios-scroll {
  display: flex;
  gap: 20px;
  width: max-content;
  animation: scrollLeft 30s linear infinite;
}
.comentarios-scroll:hover { animation-play-state: paused; }

.slide {
  width: 260px; min-width: 260px;
  padding: 24px;
  border-radius: var(--radio);
  background: var(--blanco);
  border: 1.5px solid rgba(139,92,246,.12);
  box-shadow: var(--sombra);
  transition: transform .3s;
}
.slide:hover { transform: translateY(-6px); }
.slide p  { font-size: .875rem; color: var(--gris); line-height: 1.7; margin-bottom: 12px; font-style: italic; }
.slide h4 { font-size: .875rem; font-weight: 700; color: var(--rosa); }

/* ─── FAQ ────────────────────────────── */
.faq-sec { background: var(--blanco); }

.lista-faq {
  max-width: 820px;
  margin: 0 auto;
  display: flex; flex-direction: column; gap: 12px;
}

.lista-faq details {
  background: var(--fondo);
  border: 1.5px solid rgba(139,92,246,.12);
  border-radius: 14px;
  padding: 18px 22px;
  transition: box-shadow .2s;
}
.lista-faq details:hover { box-shadow: 0 4px 18px rgba(139,92,246,.14); }
.lista-faq details[open] { border-color: var(--lila); background: #f9f5ff; }

.lista-faq summary {
  font-size: 1rem; font-weight: 700; cursor: pointer;
  list-style: none; display: flex; justify-content: space-between; align-items: center;
  color: var(--azul);
}
.lista-faq summary::-webkit-details-marker { display: none; }
.lista-faq summary::after { content: "+"; color: var(--rosa); font-size: 1.3rem; font-weight: 900; }
.lista-faq details[open] summary::after { content: "×"; }
.lista-faq p { margin-top: 12px; color: var(--gris); font-size: .9rem; line-height: 1.7; }

/* ─── UBICACIÓN ─────────────────────── */
.ubicacion-sec { background: var(--fondo); }
.ubicacion-sec .seccion-titulo p { display: flex; align-items: center; justify-content: center; gap: 6px; }
.ubicacion-sec .seccion-titulo p i { color: var(--rosa); }

.mapa-wrap { border-radius: var(--radio); overflow: hidden; box-shadow: var(--sombra); max-width: 900px; margin: 0 auto; }
.mapa-wrap iframe { width: 100%; height: 360px; border: none; display: block; }

/* ─── ANIMACIONES ───────────────────── */
@keyframes gradMove {
  0%,100% { background-position: 0% 50%; }
  50%      { background-position: 100% 50%; }
}
@keyframes float {
  0%,100% { transform: translateY(0); }
  50%      { transform: translateY(-18px); }
}
@keyframes scrollLeft {
  from { transform: translateX(0); }
  to   { transform: translateX(-50%); }
}

/* ─── RESPONSIVE ────────────────────── */
@media (max-width: 1100px) {
  .grid-4 { grid-template-columns: repeat(2,1fr); }
  .grid-3 { grid-template-columns: repeat(3,1fr); }
}

@media (max-width: 900px) {
  .grid-3 { grid-template-columns: repeat(2,1fr); }
  .seccion-titulo h2 { font-size: 1.8rem; }
  .card-nivel--featured { transform: none; }
  .card-nivel--featured:hover { transform: translateY(-10px); }
}

@media (max-width: 768px) {
  .seccion { padding: 60px 5%; }
  .hero { padding: 72px 5%; flex-direction: column; text-align: center; gap: 32px; }
  .titulo-hover { font-size: 2.2rem; justify-content: center; }
  .hero-img { max-width: 320px; margin: 0 auto; }
  .hero-texto p { margin: 0 auto 28px; }
  .btn-hero { margin: 0 auto; }
  .grid-4 { grid-template-columns: repeat(2,1fr); }
  .grid-3 { grid-template-columns: 1fr; }
  .stats-sec { flex-direction: column; gap: 24px; padding: 48px 5%; }
  .stat-sep { width: 60px; height: 1px; }
  .stat-num { font-size: 2rem; }
}

@media (max-width: 480px) {
  .titulo-hover { font-size: 1.75rem; }
  .grid-4 { grid-template-columns: 1fr; }
  .seccion-titulo h2 { font-size: 1.5rem; }
  .slide { width: 220px; min-width: 220px; }
}
