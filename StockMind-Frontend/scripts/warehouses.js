// scripts/warehouses.js

const API_WAREHOUSES_URL = 'http://localhost:1337/api/almacens';

let currentEditingWarehouseDocId = null;

// Función para obtener almacenes (filtrado por empresa)
async function getWarehouses(empresaNombre) {
    try {
        const response = await fetch(API_WAREHOUSES_URL + '?populate=empresa');
        if (!response.ok) throw new Error('Error al obtener almacenes');
        const data = await response.json();
        return data.data.filter(w => w.empresa && w.empresa.Nombre === empresaNombre);
    } catch (error) {
        console.error('Error al obtener almacenes:', error);
        return [];
    }
}

// Función para obtener inventario (filtrado por empresa)
async function getInventarioWarehouses(empresaNombre) {
    try {
        const response = await fetch('http://localhost:1337/api/inventarios?populate=producto,almacen,empresa');
        if (!response.ok) throw new Error('Error al obtener inventario');
        const data = await response.json();
        return data.data.filter(i => i.empresa && i.empresa.Nombre === empresaNombre);
    } catch (error) {
        console.error('Error al obtener inventario:', error);
        return [];
    }
}

// Función para crear almacén
async function createWarehouse(warehouse) {
    try {
        const response = await fetch(API_WAREHOUSES_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data: warehouse })
        });
        if (!response.ok) throw new Error('Error al crear almacén');
        const data = await response.json();
        return data.data;
    } catch (error) {
        console.error('Error al crear almacén:', error);
        return null;
    }
}

// Función para actualizar almacén
async function updateWarehouse(docId, warehouse) {
    try {
        const response = await fetch(`${API_WAREHOUSES_URL}/${docId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data: warehouse })
        });
        if (!response.ok) throw new Error('Error al actualizar almacén');
        const data = await response.json();
        return data.data;
    } catch (error) {
        console.error('Error al actualizar almacén:', error);
        return null;
    }
}

// Función para eliminar almacén
async function deleteWarehouseAsync(docId) {
    try {
        const response = await fetch(`${API_WAREHOUSES_URL}/${docId}`, {
            method: 'DELETE'
        });
        if (!response.ok) throw new Error('Error al eliminar almacén');
        return true;
    } catch (error) {
        console.error('Error al eliminar almacén:', error);
        return false;
    }
}

// Función para cargar almacenes en la tabla
async function loadWarehouses(empresaNombre) {
    const warehouses = await getWarehouses(empresaNombre);
    const inventario = await getInventarioWarehouses(empresaNombre);
    const tableBody = document.getElementById('warehousesTableBody');
    tableBody.innerHTML = '';

    warehouses.forEach(warehouse => {
        const estadoClass = warehouse.Estado === 'Activo' ? 'status-high' : warehouse.Estado === 'Mantenimiento' ? 'status-medium' : 'status-low';

        // Calcular productos en este almacén
        const productosEnAlmacen = inventario.filter(i => i.almacen && i.almacen.documentId === warehouse.documentId).length;
        const ocupacion = warehouse.Capacidad > 0 ? Math.round((productosEnAlmacen / warehouse.Capacidad) * 100) : 0;

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${warehouse.Nombre}</td>
            <td>${warehouse.Ubicacion}</td>
            <td>${warehouse.Capacidad} m²</td>
            <td>${ocupacion}%</td>
            <td>${productosEnAlmacen}</td>
            <td><span class="status-badge ${estadoClass}">${warehouse.Estado}</span></td>
            <td>
                <div class="table-actions-buttons">
                    <button class="btn btn-warning" onclick="editWarehouse('${warehouse.documentId}')">Modificar</button>
                    <button class="btn btn-danger" onclick="deleteWarehouse('${warehouse.documentId}')">Eliminar</button>
                </div>
            </td>
        `;
        tableBody.appendChild(row);
    });

    updateWarehouseStats(warehouses, inventario);
}

// Función para actualizar estadísticas
function updateWarehouseStats(warehouses, inventario) {
    const activos = warehouses.filter(w => w.Estado === 'Activo').length;
    const capacidadTotal = warehouses.reduce((sum, w) => sum + w.Capacidad, 0);
    const productosTotal = inventario.length;
    const capacidadUtilizada = capacidadTotal > 0 ? Math.round((productosTotal / capacidadTotal) * 100) : 0;

    document.getElementById('activeWarehouses').textContent = activos;
    document.getElementById('capacityUsed').textContent = document.getElementById('capacityUsed').textContent = capacidadUtilizada + '%';
}

// Función para abrir modal de agregar
function addWarehouse() {
    currentEditingWarehouseDocId = null;
    document.getElementById('modalTitle').textContent = 'Agregar Almacén';
    clearWarehouseForm();

    document.getElementById('warehouseModal').classList.add('active');
}

// Función para editar almacén
async function editWarehouse(docId) {
    currentEditingWarehouseDocId = docId;
    const empresaNombre = localStorage.getItem('stockmind_empresa_nombre');
    const warehouses = await getWarehouses(empresaNombre);
    const warehouse = warehouses.find(w => w.documentId === docId);
    if (warehouse) {
        document.getElementById('modalTitle').textContent = 'Modificar Almacén';
        document.getElementById('warehouseId').value = docId;
        document.getElementById('warehouseName').value = warehouse.Nombre;
        document.getElementById('warehouseLocation').value = warehouse.Ubicacion;
        document.getElementById('warehouseCapacity').value = warehouse.Capacidad;
        document.getElementById('warehouseStatus').value = warehouse.Estado;
        document.getElementById('warehouseModal').classList.add('active');
    }
}

// Función para eliminar almacén
function deleteWarehouse(docId) {
    if (confirm('¿Estás seguro de eliminar este almacén?')) {
        deleteWarehouseAsync(docId).then(success => {
            if (success) {
                const empresaNombre = localStorage.getItem('stockmind_empresa_nombre');
                loadWarehouses(empresaNombre);
            }
        });
    }
}

// Función para cerrar modal
function closeWarehouseModal() {
    document.getElementById('warehouseModal').classList.remove('active');
}

// Función para limpiar formulario
function clearWarehouseForm() {
    document.getElementById('warehouseForm').reset();
    document.getElementById('warehouseId').value = '';
    currentEditingWarehouseDocId = null;
}

// Función para ver mapa
function viewWarehouseMap() {
    alert('Función de mapa no implementada aún');
}

// Función de inicialización
function initWarehouses(empresaNombre) {
    loadWarehouses(empresaNombre);

    // Event listener para warehouseForm
    document.getElementById('warehouseForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const warehouse = Object.fromEntries(formData);
        warehouse.empresa = await getEmpresaId(empresaNombre);
        delete warehouse.warehouseId;

        if (!warehouse.empresa || warehouse.empresa === '') {
            delete warehouse.empresa;
            console.log('Empresa no asignada, omitiendo');
        }

        if (!warehouse.Nombre || !warehouse.Ubicacion || !warehouse.Capacidad || !warehouse.Estado) {
            alert('Todos los campos obligatorios deben llenarse');
            return;
        }

        let success;
        if (currentEditingWarehouseDocId) {
            success = await updateWarehouse(currentEditingWarehouseDocId, warehouse);
        } else {
            success = await createWarehouse(warehouse);
        }
        if (success) {
            loadWarehouses(empresaNombre);
            closeWarehouseModal();
            alert('Almacén guardado');
        } else {
            alert('Error al guardar');
        }
    });
}

// Función para obtener ID de empresa
async function getEmpresaId(empresaNombre) {
    try {
        const response = await fetch(`http://localhost:1337/api/empresas?filters[Nombre][$eq]=${encodeURIComponent(empresaNombre)}`);
        const data = await response.json();
        return data.data && data.data.length > 0 ? data.data[0].id : null;
    } catch (error) {
        console.error('Error getting empresa ID:', error);
        return null;
    }
}

// Exponer la función globalmente
window.initWarehouses = initWarehouses;
window.addWarehouse = addWarehouse;
window.editWarehouse = editWarehouse;
window.deleteWarehouse = deleteWarehouse;
window.closeWarehouseModal = closeWarehouseModal;
window.clearWarehouseForm = clearWarehouseForm;
window.viewWarehouseMap = viewWarehouseMap;
