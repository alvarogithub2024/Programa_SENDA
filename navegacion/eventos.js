
function setupEventListeners() {
    var logoutBtn = document.getElementById("logout-professional");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", function(e) {
            e.preventDefault();
            if (window.cerrarSesion) {
                window.cerrarSesion();
            }
        });
    }


    var menuBtns = document.querySelectorAll(".menu-btn[data-tab]");
    menuBtns.forEach(function(btn) {
        btn.addEventListener("click", function(e) {
            var tabId = btn.dataset.tab;
            if (window.cambiarTab) {
                window.cambiarTab(tabId);
            }
        });
    });
    
}
   
    var logo = document.getElementById("logo-senda");
    if (logo) {
        logo.addEventListener("click", function(e) {
            if (window.cambiarTab) {
                window.cambiarTab("inicio");
            }
        });
    }

window.setupEventListeners = setupEventListeners;
