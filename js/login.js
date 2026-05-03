document.addEventListener("click", function(e){

    const modal = document.getElementById("modalLogin");

    // =========================
    // ABRIR MODAL
    // =========================
    if(e.target.closest("#btnLogin") || e.target.closest(".abrir-login")){
    e.preventDefault();
    modal.style.display = "flex";
}

    // =========================
    // CERRAR MODAL
    // =========================
    if(e.target.classList.contains("cerrar")){
        if(modal) modal.style.display = "none";
    }

    if(e.target.id === "modalLogin"){
        if(modal) modal.style.display = "none";
    }

    // =========================
    // OJITO PASSWORD
    // =========================
    if(e.target.id === "togglePassword"){

        const input = document.getElementById("password");

        if(!input) return;

        const type = input.type === "password" ? "text" : "password";
        input.type = type;

        e.target.classList.toggle("fa-eye");
        e.target.classList.toggle("fa-eye-slash");
    }

});