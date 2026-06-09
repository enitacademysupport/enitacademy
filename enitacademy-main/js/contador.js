import { supabase } from "./supabase.js";

/* ── Contador de visitas ─── */
async function contarVisita() {
  const span = document.getElementById("contadorVisitas");
  if (!span) return;

  try {
    const { data } = await supabase
      .from("site_stats").select("visitas").eq("id", 1).single();

    if (!data) { span.textContent = "—"; return; }

    let total = data.visitas || 0;

    if (!sessionStorage.getItem("visita_contada")) {
      sessionStorage.setItem("visita_contada", "1");
      total++;
      await supabase.from("site_stats").update({ visitas: total }).eq("id", 1);
    }

    let actual = 0;
    const paso = Math.max(1, Math.ceil(total / 60));
    const intervalo = setInterval(() => {
      actual = Math.min(actual + paso, total);
      span.textContent = actual.toLocaleString("es-PE");
      if (actual >= total) clearInterval(intervalo);
    }, 30);

  } catch (e) {
    console.warn("contador: tabla site_stats no disponible", e);
    const span = document.getElementById("contadorVisitas");
    if (span) span.textContent = "—";
  }
}

/* ── Stats de la plataforma ─── */
async function cargarStats() {
  try {
    const [{ count: totalEst }, { count: totalCursos }] = await Promise.all([
      supabase.from("perfiles").select("id", { count: "exact", head: true }).eq("rol", "estudiante"),
      supabase.from("cursos").select("id", { count: "exact", head: true }),
    ]);
    const elEst    = document.getElementById("totalEstudiantes");
    const elCursos = document.getElementById("totalCursos");
    if (elEst)    elEst.textContent    = (totalEst    || 0).toLocaleString("es-PE");
    if (elCursos) elCursos.textContent = (totalCursos || 0).toLocaleString("es-PE");
  } catch (e) {
    console.warn("stats no disponibles", e);
  }
}

/* ── Modo oscuro ─── */
function initModoOscuro() {
  const btn = document.getElementById("modoOscuro");
  if (!btn) { setTimeout(initModoOscuro, 300); return; }

  if (localStorage.getItem("modoOscuro") === "true") {
    document.body.classList.add("dark");
    const i = btn.querySelector("i");
    if (i) { i.classList.remove("fa-moon"); i.classList.add("fa-sun"); }
  }

  btn.addEventListener("click", () => {
    document.body.classList.toggle("dark");
    const i = btn.querySelector("i");
    if (i) { i.classList.toggle("fa-moon"); i.classList.toggle("fa-sun"); }
    localStorage.setItem("modoOscuro", document.body.classList.contains("dark"));
  });
}

contarVisita();
cargarStats();
initModoOscuro();
