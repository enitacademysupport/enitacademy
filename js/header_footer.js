fetch("../paginas/header.html")
.then(r => r.text())
.then(data => document.getElementById("header").innerHTML = data);

fetch("../paginas/footer.html")
.then(r => r.text())
.then(data => document.getElementById("footer").innerHTML = data);

fetch("../paginas/modal_login.html")
.then(r => r.text())
.then(data => {
    document.getElementById("modal-container").innerHTML = data;
});

// =========================
// MENU MOBILE
// =========================
document.addEventListener("click", function(e){

    const menu = document.querySelector(".menu");

    if(e.target.closest("#menuToggle")){
        menu.classList.toggle("activo");
    }

    if(window.innerWidth < 900){

        if(e.target.closest(".menu > li > a")){
            const li = e.target.closest("li");

            if(li.querySelector(".menu-vertical")){
                e.preventDefault();
                li.classList.toggle("activo");
            }
        }

        if(e.target.closest(".menu-vertical > li > a")){
            const li = e.target.closest("li");

            if(li.querySelector(".submenu-lateral")){
                e.preventDefault();
                li.classList.toggle("activo");
            }
        }

    }

});