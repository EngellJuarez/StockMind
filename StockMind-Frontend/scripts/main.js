// scripts/main.js

// Función para mostrar el login (redirige a index.html)
function showLogin() {
    window.location.href = '../index.html';
}

// Elementos del DOM
const menuToggle = document.getElementById('menuToggle');
const sidebar = document.getElementById('sidebar');
const navLinks = document.querySelectorAll('.nav-link');
const userInfo = document.getElementById('userInfo');
const userDropdown = document.getElementById('userDropdown');
const content = document.getElementById('content');

// Display User Info
const storedUser = localStorage.getItem('stockmind_user');
if (storedUser && userInfo) {
    try {
        const user = JSON.parse(storedUser);
        const userNameElement = userInfo.querySelector('.hidden-mobile');
        if (userNameElement) {
            userNameElement.textContent = user.username || 'Usuario';
        }
        const avatarElement = userInfo.querySelector('.user-avatar');
        if (avatarElement && user.username) {
            avatarElement.textContent = user.username.charAt(0).toUpperCase();
        }
    } catch (e) {
        console.error('Error parsing user info:', e);
    }
} else if (!storedUser && window.location.pathname.includes('dashboard.html')) {
    // Optional: Redirect if not logged in
    // window.location.href = '../index.html';
}

// Función para cargar vistas dinámicamente
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
    if (viewName === 'products') {
        if (window.initProducts) window.initProducts();
    }
    if (viewName === 'users') {
        if (window.initUsers) window.initUsers();
    }
    if (viewName === 'suppliers') {
        if (window.initSuppliers) window.initSuppliers();
    }
}

// Navigation
if (navLinks.length > 0) {
    navLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            navLinks.forEach(l => l.classList.remove('active'));
            this.classList.add('active');
            const viewName = this.getAttribute('data-view');
            if (viewName) {
                loadView(viewName);
            }
            if (window.innerWidth < 1400) {
                sidebar.classList.remove('active');
            }
        });
    });

    function initFromHash() {
        const hash = window.location.hash.substring(1);
        if (hash && ['panel', 'inventory', 'products', 'suppliers', 'orders', 'movements', 'warehouses', 'analytics', 'ai', 'reports', 'settings', 'users'].includes(hash)) {
            loadView(hash);
        } else {
            loadView('panel');
        }
    }

    window.addEventListener('hashchange', () => {
        initFromHash();
    });

    initFromHash();
}

// Menu toggle
if (menuToggle && sidebar) {
    menuToggle.addEventListener('click', function () {
        sidebar.classList.toggle('active');
    });
}

// Dropdown del usuario
if (userInfo && userDropdown) {
    userInfo.addEventListener('click', function (e) {
        e.stopPropagation();
        userDropdown.classList.toggle('active');
    });

    document.addEventListener('click', function () {
        userDropdown.classList.remove('active');
    });
}

// Funciones del dropdown
function editProfile() {
    alert('Función de editar perfil');
    userDropdown.classList.remove('active');
}

function viewSettings() {
    alert('Función de configuración');
    userDropdown.classList.remove('active');
}

function viewNotifications() {
    alert('Función de notificaciones');
    userDropdown.classList.remove('active');
}

function logout() {
    if (confirm('¿Estás seguro que deseas cerrar sesión?')) {
        localStorage.removeItem('stockmind_token');
        localStorage.removeItem('stockmind_user');
        localStorage.removeItem('stockmind_empresa_id');
        showLogin();
    }
    userDropdown.classList.remove('active');
}

// Cerrar sidebar al hacer clic fuera en móviles
if (sidebar) {
    document.addEventListener('click', function (e) {
        if (window.innerWidth < 1400) {
            if (!sidebar.contains(e.target) && !menuToggle.contains(e.target)) {
                sidebar.classList.remove('active');
            }
        }
    });
}