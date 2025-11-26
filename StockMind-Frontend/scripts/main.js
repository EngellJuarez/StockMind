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

// Check de login y empresa al cargar dashboard
const token = localStorage.getItem('stockmind_token');
const empresaNombre = localStorage.getItem('stockmind_empresa_nombre');
if (!token || !empresaNombre) {
    showLogin();  // Redirige si no hay login o empresa
}

// Display Empresa Info
if (empresaNombre && userInfo) {
    console.log('DEBUG: Buscando empresa por nombre:', empresaNombre);
    fetch(`http://localhost:1337/api/empresas?filters[Nombre][$eq]=${encodeURIComponent(empresaNombre)}`)
        .then(response => {
            console.log('DEBUG: Respuesta status:', response.status);
            return response.json();
        })
        .then(data => {
            console.log('DEBUG: Datos empresa:', data);
            const empresa = data.data && data.data.length > 0 ? data.data[0] : null;
            const empresaNombreDisplay = empresa ? empresa.Nombre : 'Empresa';
            console.log('DEBUG: Nombre display:', empresaNombreDisplay);
            const empresaElement = userInfo.querySelector('.empresa-name');
            if (empresaElement) {
                empresaElement.textContent = empresaNombreDisplay;
            }
            const avatarElement = userInfo.querySelector('.user-avatar');
            if (avatarElement && empresaNombreDisplay) {
                avatarElement.textContent = empresaNombreDisplay.charAt(0).toUpperCase();
            }
        })
        .catch(error => {
            console.error('DEBUG: Error en fetch:', error);
            const empresaElement = userInfo.querySelector('.empresa-name');
            if (empresaElement) empresaElement.textContent = 'Empresa';
        });

    // Mostrar usuario (igual)
    const storedUser = localStorage.getItem('stockmind_user');
    if (storedUser) {
        try {
            const user = JSON.parse(storedUser);
            const userElement = userInfo.querySelector('.user-name');
            if (userElement) {
                userElement.textContent = user.username || 'Usuario';
            }
        } catch (e) {
            console.error('Error parsing user info:', e);
        }
    }
} else {
    console.log('DEBUG: No hay empresaNombre o userInfo');
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
    const empresaNombre = localStorage.getItem('stockmind_empresa_nombre');  // Cambia a nombre
    if (!empresaNombre) {
        alert('No tienes empresa asignada');
        showLogin();
        return;
    }

    if (viewName === 'products') {
        if (window.initProducts) window.initProducts(empresaNombre);  // Pasa empresaId
    }
    if (viewName === 'users') {
        if (window.initUsers) window.initUsers(empresaNombre);
    }
    if (viewName === 'suppliers') {
        if (window.initSuppliers) window.initSuppliers(empresaNombre);
    }
    // Agrega más vistas aquí si las tienes (ej. orders, inventory)
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
