// scripts/main.js

// Función para mostrar el login (redirige a index.html)
function showLogin() {
    window.location.href = '../index.html';  // Desde html/dashboard.html, vuelve a index.html
}

// Elementos del DOM (solo si existen en la página actual)
const tabBtns = document.querySelectorAll('.tab-btn');
const authForms = document.querySelectorAll('.auth-form');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const menuToggle = document.getElementById('menuToggle');
const sidebar = document.getElementById('sidebar');
const navLinks = document.querySelectorAll('.nav-link');
const userInfo = document.getElementById('userInfo');
const userDropdown = document.getElementById('userDropdown');
const content = document.getElementById('content');  // Contenedor para cargar vistas dinámicamente

// Tab switching functionality (solo en index.html)
if (tabBtns.length > 0) {
    tabBtns.forEach(btn => {
        btn.addEventListener('click', function () {
            const targetTab = this.getAttribute('data-tab');

            // Remove active class from all tabs and forms
            tabBtns.forEach(tab => tab.classList.remove('active'));
            authForms.forEach(form => form.classList.remove('active'));

            // Add active class to clicked tab
            this.classList.add('active');

            // Show corresponding form
            if (targetTab === 'login') {
                loginForm.classList.add('active');
            } else {
                registerForm.classList.add('active');
            }
        });
    });
}

// Login functionality (solo en index.html)
if (loginForm) {
    loginForm.addEventListener('submit', function (e) {
        e.preventDefault();
        // Redirige al dashboard y carga la vista del panel por defecto
        window.location.href = 'html/dashboard.html';
    });
}

// Register functionality (solo en index.html)
if (registerForm) {
    registerForm.addEventListener('submit', function (e) {
        e.preventDefault();
        const password = document.getElementById('registerPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        if (password !== confirmPassword) {
            alert('Las contraseñas no coinciden');
            return;
        }

        // Redirige al dashboard y carga la vista del panel por defecto
        window.location.href = 'html/dashboard.html';
    });
}

// Función para cargar vistas dinámicamente (solo en dashboard.html)
function loadView(viewName) {
    if (!content) return;
    
    const viewFile = `${viewName}.html`;
    
    fetch(viewFile)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Error al cargar ${viewFile}`);
            }
            return response.text();
        })
        .then(html => {
            content.innerHTML = html;
            window.location.hash = viewName;
            loadViewScript(viewName);
            
            // Resaltar el menú correcto
            navLinks.forEach(l => l.classList.remove('active'));
            const activeLink = document.querySelector(`[data-view="${viewName}"]`);
            if (activeLink) activeLink.classList.add('active');
        })
        .catch(error => {
            console.error('Error cargando la vista:', error);
            content.innerHTML = '<p>Error al cargar la vista. Inténtalo de nuevo.</p>';
        });
}

// Función para cargar script específico de la vista
function loadViewScript(viewName) {
    // Para productos, el script ya está cargado en dashboard.html
    if (viewName === 'products') {
        if (window.initProducts) window.initProducts();
    }
    // Aquí puedes agregar más: if (viewName === 'inventory') { ... }
}

// Navigation (solo en dashboard.html)
if (navLinks.length > 0) {
    navLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();

            // Remove active class from all links
            navLinks.forEach(l => l.classList.remove('active'));
            // Add active class to clicked link
            this.classList.add('active');

            // Get the view name from data-view attribute
            const viewName = this.getAttribute('data-view');
            if (viewName) {
                loadView(viewName);  // Carga la vista dinámicamente
            }

            // Close sidebar on mobile
            if (window.innerWidth < 1400) {
                sidebar.classList.remove('active');
            }
        });
    });

    // Cargar vista desde hash al iniciar
    function initFromHash() {
        const hash = window.location.hash.substring(1); // Quitar #
        if (hash && ['panel', 'inventory', 'products', 'suppliers', 'orders', 'movements', 'warehouses', 'analytics', 'ai', 'reports', 'settings'].includes(hash)) {
            loadView(hash);
        } else {
            loadView('panel'); // Vista por defecto
        }
    }

    // Escuchar cambios de hash
    window.addEventListener('hashchange', () => {
        initFromHash();
    });

    // Inicializar
    initFromHash();
}

// Menu toggle (solo en dashboard.html)
if (menuToggle && sidebar) {
    menuToggle.addEventListener('click', function () {
        sidebar.classList.toggle('active');
    });
}

// Dropdown del usuario (solo en dashboard.html)
if (userInfo && userDropdown) {
    userInfo.addEventListener('click', function (e) {
        e.stopPropagation();
        userDropdown.classList.toggle('active');
    });

    // Cerrar dropdown al hacer clic fuera
    document.addEventListener('click', function () {
        userDropdown.classList.remove('active');
    });
}

// Funciones del dropdown
function editProfile() {
    alert('Función de editar perfil - aquí iría el formulario de edición');
    userDropdown.classList.remove('active');
}

function viewSettings() {
    alert('Función de configuración - aquí irían los ajustes del usuario');
    userDropdown.classList.remove('active');
}

function viewNotifications() {
    alert('Función de notificaciones - aquí irían las notificaciones del usuario');
    userDropdown.classList.remove('active');
}

function logout() {
    if (confirm('¿Estás seguro que deseas cerrar sesión?')) {
        showLogin();
    }
    userDropdown.classList.remove('active');
}

// Cerrar sidebar al hacer clic fuera en móviles (solo en dashboard.html)
if (sidebar) {
    document.addEventListener('click', function (e) {
        if (window.innerWidth < 1400) {
            if (!sidebar.contains(e.target) && !menuToggle.contains(e.target)) {
                sidebar.classList.remove('active');
            }
        }
    });
}