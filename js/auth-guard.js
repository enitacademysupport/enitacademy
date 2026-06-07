/* ════════════════════════════════════════════
   ENIT Academy — auth-guard.js
   ════════════════════════════════════════════ */
import { supabase } from "./supabase.js";

export async function verificarSesion(rolRequerido) {

  // 1. Obtener sesión — primero directo, luego esperar evento
  let session = null;

  try {
    const { data } = await supabase.auth.getSession();
    session = data?.session ?? null;
  } catch (_) {}

  // 2. Si no hay sesión todavía, esperar INITIAL_SESSION hasta 5s
  if (!session) {
    session = await new Promise((resolve) => {
      const timer = setTimeout(() => { sub?.unsubscribe(); resolve(null); }, 5000);
      const { data: { subscription: sub } } = supabase.auth.onAuthStateChange((event, s) => {
        if (event === "INITIAL_SESSION" || event === "SIGNED_IN") {
          clearTimeout(timer);
          sub.unsubscribe();
          resolve(s);
        }
      });
    });
  }

  // 3. Sin sesión → index
  if (!session?.user) {
    window.location.replace("/index.html");
    return null;
  }

  // 4. Leer perfil
  let perfil = null;
  const { data, error } = await supabase
    .from("perfiles")
    .select("*")
    .eq("id", session.user.id)
    .single();

  if (!error && data) {
    perfil = data;
  } else {
    // Perfil no existe en la tabla: crearlo con datos del auth
    const meta = session.user.user_metadata || {};
    const rol  = meta.rol || "estudiante";
    const { data: nuevo } = await supabase
      .from("perfiles")
      .upsert({
        id:       session.user.id,
        email:    session.user.email,
        nombre:   meta.nombre   || "Usuario",
        apellido: meta.apellido || "",
        rol,
      }, { onConflict: "id" })
      .select()
      .single();
    perfil = nuevo;
  }

  // 5. Si aún no hay perfil, algo está muy roto
  if (!perfil) {
    console.error("auth-guard: no se pudo obtener ni crear el perfil");
    window.location.replace("/index.html");
    return null;
  }

  // 6. Verificar rol
  if (rolRequerido && perfil.rol !== rolRequerido) {
    const ruta = perfil.rol === "docente"
      ? "/paginas/panel_docente.html"
      : "/paginas/panel_estudiante.html";
    window.location.replace(ruta);
    return null;
  }

  return { user: session.user, perfil };
}
