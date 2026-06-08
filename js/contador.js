import { supabase } from "./supabase.js";

// ── Contador de visitas ───────────────────────
async function contarVisita() {
  const span = document.getElementById("contadorVisitas");
  if (!span) return;

  const { data } = await supabase.from("site_stats").select("visitas").eq("id", 1).single();
  if (!data) return;

  let total = data.visitas || 0;

  if (!sessionStorage.getItem("visita_contada")) {
    sessionStorage.setItem("visita_contada", "1");
    total++;
    await supabase.from("site_stats").update({ visitas: total }).eq("id", 1);
  }

  let actual = 0;
  const paso = Math.ceil(total / 60);
  const intervalo = setInterval(() => {
    actual = Math.min(actual + paso, total);
    span.textContent = actual.toLocaleString("es-PE");
    if (actual >= total) clearInterval(intervalo);
  }, 30);
}

// ── Estadísticas de la plataforma ────────────
async function cargarStats() {
  const { count: totalEst } = await supabase
    .from("perfiles").select("id", { count: "exact", head: true }).eq("rol", "estudiante");

  const { count: totalCursos } = await supabase
    .from("cursos").select("id", { count: "exact", head: true });

  const elEst    = document.getElementById("totalEstudiantes");
  const elCursos = document.getElementById("totalCursos");
  if (elEst)    elEst.textContent    = totalEst    || 0;
  if (elCursos) elCursos.textContent = totalCursos || 0;
}

contarVisita();
cargarStats();



// ── Modo oscuro ───────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  setTimeout(() => {
    const btnOscuro = document.getElementById("modoOscuro");
    if (!btnOscuro) return;

    // Aplicar modo guardado
    const modoOscuroActivo = localStorage.getItem("modoOscuro") === "true";

    if (modoOscuroActivo) {
      document.body.classList.add("dark");

      const icono = btnOscuro.querySelector("i");
      if (icono) {
        icono.classList.remove("fa-moon");
        icono.classList.add("fa-sun");
      }
    }

    btnOscuro.addEventListener("click", () => {
      document.body.classList.toggle("dark");

      const icono = btnOscuro.querySelector("i");
      if (icono) {
        icono.classList.toggle("fa-moon");
        icono.classList.toggle("fa-sun");
      }

      // Guardar preferencia
      localStorage.setItem(
        "modoOscuro",
        document.body.classList.contains("dark")
      );
    });
  }, 400);
});