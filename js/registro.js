const form = document.querySelector("form");

form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const nombre = form.querySelector("input[placeholder='Nombre']").value;
    const apellido = form.querySelector("input[placeholder='Apellido']").value;
    const email = form.querySelector("input[type='email']").value;
    const password = form.querySelectorAll("input[type='password']")[0].value;

    // 1. REGISTRAR EN SUPABASE AUTH
    const { data, error } = await supabase.auth.signUp({
        email: email,
        password: password
    });

    if(error){
        alert(error.message);
        return;
    }

    // 2. GUARDAR DATOS EN TU TABLA
    await supabase.from("usuarios").insert({
        id: data.user.id,
        nombre: nombre,
        apellido: apellido,
        email: email
    });

    alert("Registro exitoso 🚀");

    // redirigir (opcional)
    window.location.href = "/index.html";
});