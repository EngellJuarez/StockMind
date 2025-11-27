// scripts/movements.js

const API_MOVEMENTS_URL = 'http://localhost:1337/api/movimientos';
const API_PRODUCTS_URL = 'http://localhost:1337/api/productos';
const API_WAREHOUSES_URL_MOV = 'http://localhost:1337/api/almacens';

let allMovements = [];

// Initialize Movements View
function initMovements() {
    console.log('Initializing Movements View');
    loadMovements();
    loadProductsForSelect();
    loadWarehousesForSelect();

    // Set default date to now
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    document.getElementById('movementDate').value = now.toISOString().slice(0, 16);

    // Setup event listeners
    const form = document.getElementById('movementForm');
    if (form) {
        form.removeEventListener('submit', handleMovementSubmit);
        form.addEventListener('submit', handleMovementSubmit);
    }

    // Close modal on outside click
    window.onclick = function (event) {
        const modal = document.getElementById('movementModal');
        if (event.target == modal) {
            closeMovementModal();
        }
    }
}

// Load Movements History
async function loadMovements() {
    try {
        const token = localStorage.getItem('stockmind_token');
        const response = await fetch(`${API_MOVEMENTS_URL}?populate=*&sort=Fecha:desc`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('Error loading movements');

        const data = await response.json();
        allMovements = data.data || [];

        renderMovements(allMovements);
        updateMovementStats(allMovements);
    } catch (error) {
        console.error('Error:', error);
    }
}

// Load Products for Select
async function loadProductsForSelect() {
    try {
        const token = localStorage.getItem('stockmind_token');
        const response = await fetch(API_PRODUCTS_URL, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        const select = document.getElementById('movementProduct');
        select.innerHTML = '<option value="">Seleccione un producto</option>';

        (data.data || []).forEach(p => {
            const option = document.createElement('option');
            option.value = p.documentId;
            option.textContent = p.Nombre;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading products:', error);
    }
}

// Load Warehouses for Select
async function loadWarehousesForSelect() {
    try {
        const token = localStorage.getItem('stockmind_token');
        const response = await fetch(API_WAREHOUSES_URL_MOV, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        const select = document.getElementById('movementWarehouse');
        select.innerHTML = '<option value="">Seleccione un almacén</option>';

        (data.data || []).forEach(w => {
            const option = document.createElement('option');
            option.value = w.documentId;
            option.textContent = w.Nombre;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading warehouses:', error);
    }
}

// Render Movements Table
function renderMovements(movements) {
    const tbody = document.getElementById('movementsTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';

    movements.forEach(mov => {
        const tr = document.createElement('tr');
        const datetime = new Date(mov.Fecha).toLocaleString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        const prodName = mov.producto ? mov.producto.Nombre : '-';
        const whName = mov.almacen ? mov.almacen.Nombre : '-';
        const userName = mov.usuario ? mov.usuario.username : 'Admin';

        tr.innerHTML = `
            <td>${datetime}</td>
            <td>${prodName}</td>
            <td><span class="status-badge status-${mov.Tipo.toLowerCase()}">${mov.Tipo}</span></td>
            <td class="${mov.Tipo === 'Entrada' ? 'text-success' : 'text-danger'}" style="font-weight: bold;">
                ${mov.Tipo === 'Entrada' ? '+' : '-'}${mov.Cantidad}
            </td>
            <td>${whName}</td>
            <td>${userName}</td>
            <td>${mov.Observaciones || '-'}</td>
            <td>
                <div style="display: flex; flex-direction: column; gap: 5px;">
                    <button class="btn btn-sm btn-primary" onclick="editMovement('${mov.documentId}')" style="width: 100%;">
                        Modificar
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteMovement('${mov.documentId}')" style="width: 100%;">
                        Eliminar
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Update Stats
function updateMovementStats(movements) {
    // Movements today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayMovements = movements.filter(m => {
        const d = new Date(m.Fecha);
        d.setHours(0, 0, 0, 0);
        return d.getTime() === today.getTime();
    });

    document.getElementById('movementsToday').textContent = todayMovements.length;

    // Calculate balance (entries vs exits)
    const totalIn = movements
        .filter(m => m.Tipo === 'Entrada')
        .reduce((acc, curr) => acc + curr.Cantidad, 0);

    const totalOut = movements
        .filter(m => m.Tipo === 'Salida')
        .reduce((acc, curr) => acc + curr.Cantidad, 0);

    const balance = totalIn - totalOut;
    const balancePercent = totalOut > 0 ? Math.round((balance / totalOut) * 100) : 0;

    const balanceEl = document.getElementById('balancePercentage');
    balanceEl.textContent = (balancePercent >= 0 ? '+' : '') + balancePercent + '%';
}

// Filter Movements
function filterMovements() {
    alert('Función de filtrado en desarrollo');
}

// Modal Functions
function openMovementModal() {
    document.getElementById('movementForm').reset();
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    document.getElementById('movementDate').value = now.toISOString().slice(0, 16);

    document.getElementById('movementModal').classList.add('active');
}

function closeMovementModal() {
    document.getElementById('movementModal').classList.remove('active');
}

// Handle Form Submit
async function handleMovementSubmit(e) {
    e.preventDefault();

    const formData = {
        data: {
            Tipo: document.getElementById('movementType').value,
            producto: document.getElementById('movementProduct').value,
            almacen: document.getElementById('movementWarehouse').value,
            Cantidad: parseInt(document.getElementById('movementQuantity').value),
            Fecha: document.getElementById('movementDate').value,
            Observaciones: document.getElementById('movementNotes').value
        }
    };

    try {
        const token = localStorage.getItem('stockmind_token');
        const response = await fetch(API_MOVEMENTS_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(formData)
        });

        if (response.ok) {
            closeMovementModal();
            loadMovements();
        } else {
            const error = await response.json();
            alert('Error al registrar: ' + (error.error?.message || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error de conexión');
    }
}

// Delete Movement
async function deleteMovement(docId) {
    if (confirm('¿Estás seguro de eliminar este movimiento?')) {
        try {
            const token = localStorage.getItem('stockmind_token');
            const response = await fetch(`${API_MOVEMENTS_URL}/${docId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                loadMovements();
            } else {
                alert('Error al eliminar movimiento');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error de conexión');
        }
    }
}

// Edit Movement
function editMovement(docId) {
    alert('Función de edición en desarrollo');
}

// Expose functions globally
window.initMovements = initMovements;
window.openMovementModal = openMovementModal;
window.closeMovementModal = closeMovementModal;
window.filterMovements = filterMovements;
window.editMovement = editMovement;
window.deleteMovement = deleteMovement;
