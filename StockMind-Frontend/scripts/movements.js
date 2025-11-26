// scripts/movements.js

const API_MOVEMENTS_URL = 'http://localhost:1337/api/movimientos';
const API_PRODUCTS_URL = 'http://localhost:1337/api/productos';
const API_WAREHOUSES_URL_MOV = 'http://localhost:1337/api/almacens'; // Use different var name to avoid conflict if loaded globally

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
        // Populate relations: producto, almacen
        const response = await fetch(`${API_MOVEMENTS_URL}?populate=*&sort=Fecha:desc`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
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
        const date = new Date(mov.Fecha).toLocaleString();
        const productName = mov.producto ? mov.producto.Nombre : 'Producto eliminado';
        const warehouseName = mov.almacen ? mov.almacen.Nombre : 'Almacén eliminado';

        tr.innerHTML = `
            <td>${date}</td>
            <td><span class="status-badge status-${mov.Tipo.toLowerCase()}">${mov.Tipo}</span></td>
            <td>${productName}</td>
            <td>${warehouseName}</td>
            <td class="${mov.Tipo === 'Entrada' ? 'text-success' : 'text-danger'} font-weight-bold">
                ${mov.Tipo === 'Entrada' ? '+' : '-'}${mov.Cantidad}
            </td>
            <td>${mov.Observaciones || '-'}</td>
        `;
        tbody.appendChild(tr);
    });
}

// Update Stats
function updateMovementStats(movements) {
    const totalInElement = document.getElementById('totalIn');
    const totalOutElement = document.getElementById('totalOut');

    // Filter for current month
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const monthlyMovements = movements.filter(m => {
        const d = new Date(m.Fecha);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    const totalIn = monthlyMovements
        .filter(m => m.Tipo === 'Entrada')
        .reduce((acc, curr) => acc + curr.Cantidad, 0);

    const totalOut = monthlyMovements
        .filter(m => m.Tipo === 'Salida')
        .reduce((acc, curr) => acc + curr.Cantidad, 0);

    if (totalInElement) totalInElement.textContent = totalIn;
    if (totalOutElement) totalOutElement.textContent = totalOut;
}

// Filter Movements
function filterMovements() {
    const searchTerm = document.getElementById('searchMovement').value.toLowerCase();
    const filtered = allMovements.filter(m => {
        const productName = m.producto ? m.producto.Nombre.toLowerCase() : '';
        const warehouseName = m.almacen ? m.almacen.Nombre.toLowerCase() : '';
        return productName.includes(searchTerm) ||
            warehouseName.includes(searchTerm) ||
            m.Tipo.toLowerCase().includes(searchTerm);
    });
    renderMovements(filtered);
}

// Modal Functions
function openMovementModal() {
    document.getElementById('movementForm').reset();
    // Reset date
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
            // alert('Movimiento registrado exitosamente');
        } else {
            const error = await response.json();
            alert('Error al registrar: ' + (error.error?.message || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error de conexión');
    }
}

// Expose functions globally
window.initMovements = initMovements;
window.openMovementModal = openMovementModal;
window.closeMovementModal = closeMovementModal;
window.filterMovements = filterMovements;
