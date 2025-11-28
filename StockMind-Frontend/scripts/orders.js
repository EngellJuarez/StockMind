// scripts/orders.js

const API_ORDENES_URL = 'http://localhost:1337/api/ordens';
const API_PROVEEDORES_ORDERS_URL = 'http://localhost:1337/api/proveedors';

let currentEditingOrderDocId = null;

// Función para obtener órdenes (filtrado por empresa)
async function getOrdenes(empresaNombre) {
    try {
        const response = await fetch(API_ORDENES_URL + '?populate=*');
        if (!response.ok) throw new Error('Error al obtener órdenes');
        const data = await response.json();
        // Filtrar por empresa
        const ordenesFiltradas = data.data.filter(o => o.empresa && o.empresa.Nombre === empresaNombre);
        return ordenesFiltradas || [];
    } catch (error) {
        console.error('Error al obtener órdenes:', error);
        return [];
    }
}

// Función para obtener proveedores para select
async function getProveedoresParaOrdenes(empresaNombre) {
    try {
        const response = await fetch(API_PROVEEDORES_ORDERS_URL + '?populate=empresa');
        if (!response.ok) throw new Error('Error al obtener proveedores');
        const data = await response.json();
        // Filtrar por empresa
        const proveedoresFiltrados = data.data.filter(p => p.empresa && p.empresa.Nombre === empresaNombre);
        return proveedoresFiltrados || [];
    } catch (error) {
        console.error('Error al obtener proveedores:', error);
        return [];
    }
}

// Función para crear orden
async function createOrden(orden) {
    try {
        const response = await fetch(API_ORDENES_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data: orden })
        });
        if (!response.ok) throw new Error('Error al crear orden');
        const data = await response.json();
        return data.data;
    } catch (error) {
        console.error('Error al crear orden:', error);
        return null;
    }
}

// Función para actualizar orden
async function updateOrden(docId, orden) {
    try {
        const response = await fetch(`${API_ORDENES_URL}/${docId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data: orden })
        });
        if (!response.ok) throw new Error('Error al actualizar orden');
        const data = await response.json();
        return data.data;
    } catch (error) {
        console.error('Error al actualizar orden:', error);
        return null;
    }
}

// Función para eliminar orden
async function deleteOrden(docId) {
    try {
        const response = await fetch(`${API_ORDENES_URL}/${docId}`, {
            method: 'DELETE'
        });
        if (!response.ok) throw new Error('Error al eliminar orden');
        return true;
    } catch (error) {
        console.error('Error al eliminar orden:', error);
        return false;
    }
}

// Función para cargar órdenes en la tabla
async function loadOrders(empresaNombre, filter = {}) {
    const ordenes = await getOrdenes(empresaNombre);
    let filtered = ordenes;

    // Aplicar filtros
    if (filter.Proveedor) {
        filtered = filtered.filter(o => o.proveedor && o.proveedor.NombreEmpresa.toLowerCase().includes(filter.Proveedor.toLowerCase()));
    }
    if (filter.Estado) {
        filtered = filtered.filter(o => o.Estado === filter.Estado);
    }

    const tableBody = document.getElementById('ordersTableBody');
    tableBody.innerHTML = '';

    filtered.forEach(orden => {
        const estadoClass = orden.Estado === 'Pendiente' ? 'status-medium' : orden.Estado === 'Entregado' ? 'status-high' : 'status-low';

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${orden.NumeroOrden}</td>
            <td>${orden.proveedor ? orden.proveedor.NombreEmpresa : 'N/A'}</td>
            <td>${new Date(orden.Fecha).toLocaleDateString()}</td>
            <td>C$ ${orden.Total}</td>
            <td><span class="status-badge ${estadoClass}">${orden.Estado}</span></td>
            <td>${orden.EntregaEsperada ? new Date(orden.EntregaEsperada).toLocaleDateString() : 'N/A'}</td>
            <td>
                <div class="table-actions-buttons">
                    <button class="btn btn-warning" onclick="editOrder('${orden.documentId}')">Modificar</button>
                    <button class="btn btn-danger" onclick="deleteOrder('${orden.documentId}')">Eliminar</button>
                </div>
            </td>
        `;
        tableBody.appendChild(row);
    });

    updateOrderStats(filtered);
}

// Función para actualizar estadísticas
function updateOrderStats(ordenes) {
    const pendientes = ordenes.filter(o => o.Estado === 'Pendiente').length;
    const mesActual = new Date().getMonth();
    const valorMes = ordenes.filter(o => new Date(o.Fecha).getMonth() === mesActual).reduce((sum, o) => sum + o.Total, 0);

    document.getElementById('ordenesPendientes').textContent = pendientes;
    document.getElementById('valorTotalMes').textContent = `C$ ${valorMes.toFixed(2)}`;
}

// Función para cargar proveedores en el select
async function loadProveedoresSelect(empresaNombre) {
    const proveedores = await getProveedoresParaOrdenes(empresaNombre);
    const select = document.getElementById('orderProveedor');
    select.innerHTML = '<option value="">Selecciona un proveedor</option>';
    proveedores.forEach(p => {
        const option = document.createElement('option');
        option.value = p.documentId;
        option.textContent = p.NombreEmpresa;
        select.appendChild(option);
    });
}

// Función para abrir modal de agregar
function addOrder() {
    currentEditingOrderDocId = null;
    document.getElementById('orderModalTitle').textContent = 'Agregar Orden';
    clearOrderForm();

    const empresaNombre = localStorage.getItem('stockmind_empresa_nombre');
    loadProveedoresSelect(empresaNombre);

    // Asignar empresa
    fetch(`http://localhost:1337/api/empresas?filters[Nombre][$eq]=${encodeURIComponent(empresaNombre)}`)
        .then(response => response.json())
        .then(data => {
            if (data.data && data.data.length > 0) {
                document.getElementById('orderEmpresaId').value = data.data[0].id;
            }
        });

    document.getElementById('orderModal').classList.add('active');
}

// Función para editar orden
async function editOrder(docId) {
    currentEditingOrderDocId = docId;
    const empresaNombre = localStorage.getItem('stockmind_empresa_nombre');
    const ordenes = await getOrdenes(empresaNombre);
    const orden = ordenes.find(o => o.documentId === docId);
    if (orden) {
        document.getElementById('orderModalTitle').textContent = 'Modificar Orden';
        document.getElementById('orderDocumentId').value = docId;
        document.getElementById('numeroOrden').value = orden.NumeroOrden;
        document.getElementById('orderProveedor').value = orden.proveedor ? orden.proveedor.documentId : '';
        document.getElementById('fecha').value = orden.Fecha.split('T')[0];
        document.getElementById('total').value = orden.Total;
        document.getElementById('estado').value = orden.Estado;
        document.getElementById('entregaEsperada').value = orden.EntregaEsperada ? orden.EntregaEsperada.split('T')[0] : '';
        document.getElementById('orderModal').classList.add('active');
    }
}

// Función para eliminar orden
function deleteOrder(docId) {
    if (confirm('¿Estás seguro de eliminar esta orden?')) {
        deleteOrden(docId).then(success => {
            if (success) {
                const empresaNombre = localStorage.getItem('stockmind_empresa_nombre');
                loadOrders(empresaNombre);
            }
        });
    }
}

// Función para cerrar modal
function closeOrderModal() {
    document.getElementById('orderModal').classList.remove('active');
    document.getElementById('filterOrderModal').classList.remove('active');
}

// Función para limpiar formulario
function clearOrderForm() {
    document.getElementById('orderForm').reset();
    document.getElementById('orderDocumentId').value = '';
    currentEditingOrderDocId = null;
}

// Función para abrir modal de filtro
function filterOrders() {
    document.getElementById('filterOrderModal').classList.add('active');
}

// Función para limpiar filtro
function clearFilterOrder() {
    document.getElementById('filterOrderForm').reset();
    const empresaNombre = localStorage.getItem('stockmind_empresa_nombre');
    loadOrders(empresaNombre);
}

// Función para exportar
function exportOrders() {
    alert('Función de exportar no implementada aún');
}

// Función de inicialización
function initOrders(empresaNombre) {
    console.log('DEBUG: initOrders ejecutado con empresaNombre:', empresaNombre);
    loadOrders(empresaNombre);
    loadProveedoresSelect(empresaNombre);

    // Event listener para orderForm
    document.getElementById('orderForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const orden = Object.fromEntries(formData);
        orden.empresa = document.getElementById('orderEmpresaId').value;
        delete orden.orderDocumentId;
        orden.proveedor = orden.proveedor;

        if (!orden.empresa || orden.empresa === '') {
            delete orden.empresa;
            console.log('Empresa no asignada, omitiendo');
        }

        if (!orden.NumeroOrden || !orden.proveedor || !orden.Fecha || !orden.Total || !orden.Estado) {
            alert('Todos los campos obligatorios deben llenarse');
            return;
        }

        let success;
        if (currentEditingOrderDocId) {
            success = await updateOrden(currentEditingOrderDocId, orden);
        } else {
            success = await createOrden(orden);
        }
        if (success) {
            loadOrders(empresaNombre);
            closeOrderModal();
            alert('Orden guardada');
        } else {
            alert('Error al guardar');
        }
    });

    // Event listener para filterForm
    document.getElementById('filterOrderForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const filter = Object.fromEntries(formData);
        loadOrders(empresaNombre, filter);
        closeOrderModal();
    });
}

// Exponer la función globalmente
window.initOrders = initOrders;