// scripts/warehouses.js

const API_WAREHOUSES_URL = 'http://localhost:1337/api/almacens';

let allWarehouses = [];

// Initialize Warehouses View
function initWarehouses() {
    console.log('Initializing Warehouses View');
    loadWarehouses();

    // Setup event listeners
    const form = document.getElementById('warehouseForm');
    if (form) {
        form.removeEventListener('submit', handleWarehouseSubmit);
        form.addEventListener('submit', handleWarehouseSubmit);
    }

    // Close modal on outside click
    window.onclick = function (event) {
        const modal = document.getElementById('warehouseModal');
        if (event.target == modal) {
            closeWarehouseModal();
        }
    }
}

// Load Warehouses
async function loadWarehouses() {
    try {
        const token = localStorage.getItem('stockmind_token');
        const response = await fetch(API_WAREHOUSES_URL, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('Error loading warehouses');

        const data = await response.json();
        allWarehouses = data.data || [];

        renderWarehouses(allWarehouses);
        updateWarehouseStats(allWarehouses);
    } catch (error) {
        console.error('Error:', error);
    }
}

// Render Warehouses Table
function renderWarehouses(warehouses) {
    const tbody = document.getElementById('warehousesTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';

    warehouses.forEach(w => {
        const tr = document.createElement('tr');
        const ocupacion = Math.floor(Math.random() * 100); // Placeholder
        const productos = Math.floor(Math.random() * 1000); // Placeholder

        tr.innerHTML = `
            <td><strong>${w.Nombre}</strong></td>
            <td>${w.Ubicacion || '-'}</td>
            <td>${w.Capacidad || '-'} m²</td>
            <td>${ocupacion}%</td>
            <td>${productos}</td>
            <td><span class="status-badge status-${w.Estado.toLowerCase()}">${w.Estado}</span></td>
            <td>
                <div style="display: flex; flex-direction: column; gap: 5px;">
                    <button class="btn btn-sm btn-primary" onclick="editWarehouse('${w.documentId}')" style="width: 100%;">
                        Modificar
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteWarehouse('${w.documentId}')" style="width: 100%;">
                        Eliminar
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Update Stats
function updateWarehouseStats(warehouses) {
    const activeCount = warehouses.filter(w => w.Estado === 'Activo').length;
    document.getElementById('activeWarehouses').textContent = activeCount;

    // Placeholder capacity calculation
    const capacityUsed = 78;
    document.getElementById('capacityUsed').textContent = capacityUsed + '%';
}

// Modal Functions
function addWarehouse() {
    document.getElementById('warehouseForm').reset();
    document.getElementById('warehouseId').value = '';
    document.getElementById('modalTitle').textContent = 'Agregar Almacén';
    document.getElementById('warehouseModal').classList.add('active');
}

function closeWarehouseModal() {
    document.getElementById('warehouseModal').classList.remove('active');
}

// Handle Form Submit
async function handleWarehouseSubmit(e) {
    e.preventDefault();

    const docId = document.getElementById('warehouseId').value;
    const method = docId ? 'PUT' : 'POST';
    const url = docId ? `${API_WAREHOUSES_URL}/${docId}` : API_WAREHOUSES_URL;

    const formData = {
        data: {
            Nombre: document.getElementById('warehouseName').value,
            Ubicacion: document.getElementById('warehouseLocation').value,
            Capacidad: document.getElementById('warehouseCapacity').value,
            Estado: document.getElementById('warehouseStatus').value,
            empresa: localStorage.getItem('stockmind_empresa')
        }
    };

    try {
        const token = localStorage.getItem('stockmind_token');
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(formData)
        });

        if (response.ok) {
            closeWarehouseModal();
            loadWarehouses();
        } else {
            const error = await response.json();
            alert('Error: ' + (error.error?.message || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error de conexión');
    }
}

// Edit Warehouse
async function editWarehouse(docId) {
    try {
        const token = localStorage.getItem('stockmind_token');
        const response = await fetch(`${API_WAREHOUSES_URL}/${docId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            const data = await response.json();
            const warehouse = data.data;

            document.getElementById('warehouseId').value = warehouse.documentId;
            document.getElementById('warehouseName').value = warehouse.Nombre;
            document.getElementById('warehouseLocation').value = warehouse.Ubicacion || '';
            document.getElementById('warehouseCapacity').value = warehouse.Capacidad || '';
            document.getElementById('warehouseStatus').value = warehouse.Estado;

            document.getElementById('modalTitle').textContent = 'Editar Almacén';
            document.getElementById('warehouseModal').classList.add('active');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error al cargar almacén');
    }
}

// Delete Warehouse
async function deleteWarehouse(docId) {
    if (confirm('¿Estás seguro de eliminar este almacén?')) {
        try {
            const token = localStorage.getItem('stockmind_token');
            const response = await fetch(`${API_WAREHOUSES_URL}/${docId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                loadWarehouses();
            } else {
                alert('Error al eliminar almacén');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error de conexión');
        }
    }
}

// View Warehouse Map
function viewWarehouseMap() {
    alert('Función de mapa en desarrollo');
}

// Expose functions globally
window.initWarehouses = initWarehouses;
window.addWarehouse = addWarehouse;
window.editWarehouse = editWarehouse;
window.deleteWarehouse = deleteWarehouse;
window.closeWarehouseModal = closeWarehouseModal;
window.viewWarehouseMap = viewWarehouseMap;
