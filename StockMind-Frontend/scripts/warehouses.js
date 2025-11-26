// scripts/warehouses.js

const API_WAREHOUSES_URL = 'http://localhost:1337/api/almacens';
let currentWarehouseId = null;
let allWarehouses = [];

// Initialize Warehouses View
function initWarehouses() {
    console.log('Initializing Warehouses View');
    loadWarehouses();

    // Setup event listeners
    const form = document.getElementById('warehouseForm');
    if (form) {
        form.removeEventListener('submit', handleWarehouseSubmit); // Prevent duplicates
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

// Load Warehouses from API
async function loadWarehouses() {
    try {
        const empresaNombre = localStorage.getItem('stockmind_empresa_nombre');
        // Filter by empresa if needed, for now getting all or filtering client side if relation not set up in query
        // Ideally: ?filters[empresa][Nombre][$eq]=${empresaNombre}

        const token = localStorage.getItem('stockmind_token');
        const response = await fetch(API_WAREHOUSES_URL, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!response.ok) throw new Error('Error loading warehouses');

        const data = await response.json();
        allWarehouses = data.data || [];

        renderWarehouses(allWarehouses);
        updateWarehouseStats(allWarehouses);
    } catch (error) {
        console.error('Error:', error);
        // alert('Error al cargar almacenes');
    }
}

// Render Warehouses Table
function renderWarehouses(warehouses) {
    const tbody = document.getElementById('warehousesTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';

    warehouses.forEach(warehouse => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${warehouse.Nombre}</td>
            <td>${warehouse.Ubicacion || '-'}</td>
            <td>${warehouse.Capacidad || '-'}</td>
            <td><span class="status-badge status-${warehouse.Estado.toLowerCase()}">${warehouse.Estado}</span></td>
            <td>
                <div class="table-actions-buttons">
                    <button class="btn btn-sm btn-warning" onclick="editWarehouse('${warehouse.documentId}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteWarehouse('${warehouse.documentId}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Update Stats
function updateWarehouseStats(warehouses) {
    const totalElement = document.getElementById('totalWarehouses');
    const capacityElement = document.getElementById('totalCapacity');

    if (totalElement) totalElement.textContent = warehouses.filter(w => w.Estado === 'Activo').length;

    // Simple capacity sum if numeric, otherwise just count
    if (capacityElement) {
        // Try to parse capacity as number
        const totalCap = warehouses.reduce((acc, curr) => {
            const cap = parseInt(curr.Capacidad) || 0;
            return acc + cap;
        }, 0);
        capacityElement.textContent = totalCap > 0 ? totalCap : warehouses.length;
    }
}

// Filter Warehouses
function filterWarehouses() {
    const searchTerm = document.getElementById('searchWarehouse').value.toLowerCase();
    const filtered = allWarehouses.filter(w =>
        w.Nombre.toLowerCase().includes(searchTerm) ||
        (w.Ubicacion && w.Ubicacion.toLowerCase().includes(searchTerm))
    );
    renderWarehouses(filtered);
}

// Modal Functions
function addWarehouse() {
    currentWarehouseId = null;
    document.getElementById('warehouseForm').reset();
    document.getElementById('modalTitle').textContent = 'Agregar Almacén';
    document.getElementById('warehouseModal').classList.add('active');
}

function closeWarehouseModal() {
    document.getElementById('warehouseModal').classList.remove('active');
}

async function editWarehouse(docId) {
    currentWarehouseId = docId;
    const warehouse = allWarehouses.find(w => w.documentId === docId);

    if (warehouse) {
        document.getElementById('warehouseName').value = warehouse.Nombre;
        document.getElementById('warehouseLocation').value = warehouse.Ubicacion || '';
        document.getElementById('warehouseCapacity').value = warehouse.Capacidad || '';
        document.getElementById('warehouseStatus').value = warehouse.Estado;

        document.getElementById('modalTitle').textContent = 'Editar Almacén';
        document.getElementById('warehouseModal').classList.add('active');
    }
}

// Handle Form Submit
async function handleWarehouseSubmit(e) {
    e.preventDefault();

    const formData = {
        data: {
            Nombre: document.getElementById('warehouseName').value,
            Ubicacion: document.getElementById('warehouseLocation').value,
            Capacidad: document.getElementById('warehouseCapacity').value,
            Estado: document.getElementById('warehouseStatus').value
        }
    };

    try {
        let url = API_WAREHOUSES_URL;
        let method = 'POST';

        if (currentWarehouseId) {
            url = `${API_WAREHOUSES_URL}/${currentWarehouseId}`;
            method = 'PUT';
        }

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
            // alert('Almacén guardado exitosamente');
        } else {
            const error = await response.json();
            alert('Error al guardar: ' + (error.error?.message || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error de conexión');
    }
}

async function deleteWarehouse(docId) {
    if (confirm('¿Estás seguro de eliminar este almacén?')) {
        try {
            const token = localStorage.getItem('stockmind_token');
            const response = await fetch(`${API_WAREHOUSES_URL}/${docId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
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

// Expose functions globally
window.initWarehouses = initWarehouses;
window.addWarehouse = addWarehouse;
window.closeWarehouseModal = closeWarehouseModal;
window.editWarehouse = editWarehouse;
window.deleteWarehouse = deleteWarehouse;
window.filterWarehouses = filterWarehouses;
