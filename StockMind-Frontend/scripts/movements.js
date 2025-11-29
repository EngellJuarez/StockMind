// scripts/movements.js

const API_MOVEMENTS_URL = 'http://localhost:1337/api/movimientos';
const API_PRODUCTS_MOVEMENTS_URL = 'http://localhost:1337/api/productos';
const API_WAREHOUSES_MOVEMENTS_URL = 'http://localhost:1337/api/almacens';

let allMovements = [];

// Initialize Movements View
function initMovements(empresaNombre) {
    console.log('Initializing Movements View for empresa:', empresaNombre);
    loadMovements(empresaNombre);
    loadProductsForSelect(empresaNombre);
    loadWarehousesForSelect(empresaNombre);

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

    // Setup filter form
    const filterForm = document.getElementById('filterMovementForm');
    if (filterForm) {
        filterForm.removeEventListener('submit', handleFilterSubmit);
        filterForm.addEventListener('submit', handleFilterSubmit);
    }

    // Close modal on outside click
    window.onclick = function (event) {
        const modal = document.getElementById('movementModal');
        const filterModal = document.getElementById('filterMovementModal');
        if (event.target == modal) {
            closeMovementModal();
        }
        if (event.target == filterModal) {
            closeMovementModal();
        }
    }
}

// Load Movements History
async function loadMovements(empresaNombre) {
    try {
        const response = await fetch(`${API_MOVEMENTS_URL}?populate=*&sort=Fecha:desc`);
        if (!response.ok) throw new Error('Error loading movements');

        const data = await response.json();
        allMovements = (data.data || []).filter(m => m.empresa && m.empresa.Nombre === empresaNombre);

        renderMovements(allMovements);
        updateMovementStats(allMovements);
    } catch (error) {
        console.error('Error:', error);
    }
}

// Load Products for Select
async function loadProductsForSelect(empresaNombre) {
    try {
        const response = await fetch(API_PRODUCTS_MOVEMENTS_URL + '?populate=empresa');
        const data = await response.json();
        const select = document.getElementById('movementProduct');
        select.innerHTML = '<option value="">Seleccione un producto</option>';

        (data.data || []).filter(p => p.empresa && p.empresa.Nombre === empresaNombre).forEach(p => {
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
async function loadWarehousesForSelect(empresaNombre) {
    try {
        const response = await fetch(API_WAREHOUSES_MOVEMENTS_URL + '?populate=empresa');
        const data = await response.json();
        const select = document.getElementById('movementWarehouse');
        select.innerHTML = '<option value="">Seleccione un almacén</option>';

        (data.data || []).filter(w => w.empresa && w.empresa.Nombre === empresaNombre).forEach(w => {
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
                    <button class="btn btn-sm btn-warning" onclick="editMovement('${mov.documentId}')" style="width: 100%;">
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
    document.getElementById('filterMovementModal').classList.add('active');
}

// Handle Filter Submit
function handleFilterSubmit(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const filter = Object.fromEntries(formData);

    let filtered = allMovements;
    if (filter.Tipo) {
        filtered = allMovements.filter(m => m.Tipo === filter.Tipo);
    }
    renderMovements(filtered);
    closeMovementModal();
}

// Clear Filter
function clearFilterMovement() {
    document.getElementById('filterMovementForm').reset();
    renderMovements(allMovements);
    closeMovementModal();
}

// Modal Functions
function openMovementModal() {
    document.getElementById('movementForm').reset();
    document.getElementById('movementForm').removeAttribute('data-editing');
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    document.getElementById('movementDate').value = now.toISOString().slice(0, 16);

    document.getElementById('movementModal').classList.add('active');
}

function closeMovementModal() {
    document.getElementById('movementModal').classList.remove('active');
    document.getElementById('filterMovementModal').classList.remove('active');
}

// Handle Form Submit
async function handleMovementSubmit(e) {
    e.preventDefault();

    const empresaNombre = localStorage.getItem('stockmind_empresa_nombre');
    const empresaId = await getEmpresaId(empresaNombre);
    const editingDocId = document.getElementById('movementForm').getAttribute('data-editing');

    const formData = {
        data: {
            Tipo: document.getElementById('movementType').value,
            producto: document.getElementById('movementProduct').value,
            almacen: document.getElementById('movementWarehouse').value,
            Cantidad: parseInt(document.getElementById('movementQuantity').value),
            Fecha: document.getElementById('movementDate').value,
            Observaciones: document.getElementById('movementNotes').value,
            empresa: empresaId
        }
    };

    if (!formData.data.empresa || formData.data.empresa === '') {
        delete formData.data.empresa;
        console.log('Empresa no asignada, omitiendo');
    }

    if (!formData.data.Tipo || !formData.data.producto || !formData.data.almacen || !formData.data.Cantidad || !formData.data.Fecha) {
        alert('Todos los campos obligatorios deben llenarse');
        return;
    }

    try {
        let response;
        if (editingDocId) {
            // Para edición, revertir el movimiento anterior y aplicar el nuevo
            const oldMovement = allMovements.find(m => m.documentId === editingDocId);
            if (oldMovement) {
                await updateInventoryForMovement(oldMovement.producto.documentId, oldMovement.Cantidad, oldMovement.Tipo === 'Entrada' ? 'Salida' : 'Entrada', empresaNombre);
            }
            response = await fetch(`${API_MOVEMENTS_URL}/${editingDocId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
        } else {
            response = await fetch(API_MOVEMENTS_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
        }

        if (response.ok) {
            // Actualizar inventario
            await updateInventoryForMovement(formData.data.producto, formData.data.Cantidad, formData.data.Tipo, empresaNombre);

            closeMovementModal();
            loadMovements(empresaNombre);
            document.getElementById('movementForm').removeAttribute('data-editing');
        } else {
            const error = await response.json();
            alert('Error al registrar: ' + (error.error?.message || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error de conexión');
    }
}

// Función para actualizar inventario basado en movimiento
async function updateInventoryForMovement(productoDocId, cantidad, tipo, empresaNombre) {
    try {
        // Obtener inventario del producto
        const response = await fetch(`http://localhost:1337/api/inventarios?populate=producto,empresa&filters[producto][documentId][$eq]=${productoDocId}`);
        const data = await response.json();
        const inventario = data.data.filter(i => i.empresa && i.empresa.Nombre === empresaNombre)[0];

        if (inventario) {
            // Actualizar stock
            let nuevoStock = inventario.StockActual;
            if (tipo === 'Entrada') {
                nuevoStock += cantidad;
            } else if (tipo === 'Salida') {
                nuevoStock -= cantidad;
            }

            // Asegurar no negativo
            nuevoStock = Math.max(0, nuevoStock);

            const updateResponse = await fetch(`http://localhost:1337/api/inventarios/${inventario.documentId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: { StockActual: nuevoStock } })
            });
            if (!updateResponse.ok) throw new Error('Error al actualizar inventario');
        } else {
            // Crear inventario si no existe
            const empresaId = await getEmpresaId(empresaNombre);
            const createResponse = await fetch('http://localhost:1337/api/inventarios', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    data: {
                        producto: productoDocId,
                        StockActual: tipo === 'Entrada' ? cantidad : 0,
                        StockMinimo: 0,
                        empresa: empresaId
                    }
                })
            });
            if (!createResponse.ok) throw new Error('Error al crear inventario');
        }
    } catch (error) {
        console.error('Error al actualizar inventario:', error);
    }
}

// Delete Movement
async function deleteMovementAsync(docId) {
    try {
        // Obtener el movimiento antes de eliminar
        const response = await fetch(`${API_MOVEMENTS_URL}/${docId}?populate=*`);
        const data = await response.json();
        const movement = data.data;

        // Revertir inventario
        const empresaNombre = localStorage.getItem('stockmind_empresa_nombre');
        if (movement) {
            await updateInventoryForMovement(movement.producto.documentId, movement.Cantidad, movement.Tipo === 'Entrada' ? 'Salida' : 'Entrada', empresaNombre);
        }

        // Eliminar movimiento
        const deleteResponse = await fetch(`${API_MOVEMENTS_URL}/${docId}`, {
            method: 'DELETE'
        });

        if (deleteResponse.ok) {
            loadMovements(empresaNombre);
        } else {
            alert('Error al eliminar movimiento');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error de conexión');
    }
}

// Delete Movement
function deleteMovement(docId) {
    if (confirm('¿Estás seguro de eliminar este movimiento?')) {
        deleteMovementAsync(docId);
    }
}

// Edit Movement
function editMovement(docId) {
    const movement = allMovements.find(m => m.documentId === docId);
    if (movement) {
        document.getElementById('movementType').value = movement.Tipo;
        document.getElementById('movementProduct').value = movement.producto ? movement.producto.documentId : '';
        document.getElementById('movementWarehouse').value = movement.almacen ? movement.almacen.documentId : '';
        document.getElementById('movementQuantity').value = movement.Cantidad;
        document.getElementById('movementDate').value = new Date(movement.Fecha).toISOString().slice(0, 16);
        document.getElementById('movementNotes').value = movement.Observaciones || '';
        document.getElementById('movementModal').classList.add('active');
        document.getElementById('movementForm').setAttribute('data-editing', docId);
    }
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

// Expose functions globally
window.initMovements = initMovements;
window.openMovementModal = openMovementModal;
window.closeMovementModal = closeMovementModal;
window.filterMovements = filterMovements;
window.editMovement = editMovement;
window.deleteMovement = deleteMovement;
window.clearFilterMovement = clearFilterMovement;
