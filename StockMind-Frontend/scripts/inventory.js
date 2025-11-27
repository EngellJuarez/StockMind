// scripts/inventory.js

const API_INVENTARIO_URL = 'http://localhost:1337/api/inventarios';
const API_PRODUCTOS_URL = 'http://localhost:1337/api/productos';

let currentEditingInventoryDocId = null;

// Función para obtener inventario (filtrado por empresa)
async function getInventario(empresaNombre) {
    try {
        console.log('DEBUG: Obteniendo inventario para empresa:', empresaNombre);
        const response = await fetch(API_INVENTARIO_URL + '?populate=producto.categoria&populate=empresa');
        if (!response.ok) throw new Error('Error al obtener inventario');
        const data = await response.json();
        console.log('DEBUG: Inventario crudo:', data.data);
        // Filtrar por empresa
        const inventarioFiltrado = data.data.filter(i => {
            console.log('DEBUG: Item empresa:', i.empresa);
            return i.empresa && i.empresa.Nombre === empresaNombre;
        });
        console.log('DEBUG: Inventario filtrado:', inventarioFiltrado);
        return inventarioFiltrado || [];
    } catch (error) {
        console.error('Error al obtener inventario:', error);
        return [];
    }
}

// Función para obtener productos (filtrado por empresa)
async function getProductosParaInventario(empresaNombre) {
    try {
        const response = await fetch(API_PRODUCTOS_URL + '?populate=empresa');
        if (!response.ok) throw new Error('Error al obtener productos');
        const data = await response.json();
        // Filtrar por empresa
        const productosFiltrados = data.data.filter(p => p.empresa && p.empresa.Nombre === empresaNombre);
        return productosFiltrados || [];
    } catch (error) {
        console.error('Error al obtener productos:', error);
        return [];
    }
}

// Función para crear inventario
async function createInventario(inventario) {
    try {
        const response = await fetch(API_INVENTARIO_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data: inventario })
        });
        if (!response.ok) throw new Error('Error al crear inventario');
        const data = await response.json();
        return data.data;
    } catch (error) {
        console.error('Error al crear inventario:', error);
        return null;
    }
}

// Función para actualizar inventario
async function updateInventario(docId, inventario) {
    try {
        console.log('DEBUG: Actualizando inventario documentId:', docId, 'con:', inventario);
        console.log('DEBUG: URL:', `${API_INVENTARIO_URL}/${docId}`);
        const response = await fetch(`${API_INVENTARIO_URL}/${docId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data: inventario })
        });
        console.log('DEBUG: Respuesta status:', response.status);
        if (!response.ok) {
            const errorText = await response.text();
            console.log('DEBUG: Error text:', errorText);
            throw new Error('Error al actualizar inventario: ' + response.status);
        }
        const data = await response.json();
        console.log('DEBUG: Inventario actualizado:', data);
        return data.data;
    } catch (error) {
        console.error('Error al actualizar inventario:', error);
        return null;
    }
}

// Función para eliminar inventario
async function deleteInventario(docId) {
    try {
        const response = await fetch(`${API_INVENTARIO_URL}/${docId}`, {
            method: 'DELETE'
        });
        if (!response.ok) throw new Error('Error al eliminar inventario');
        return true;
    } catch (error) {
        console.error('Error al eliminar inventario:', error);
        return false;
    }
}

// Función para cargar inventario en la tabla
async function loadInventory(empresaNombre, filter = {}) {
    const inventario = await getInventario(empresaNombre);
    let filtered = inventario;

    // Aplicar filtros
    if (filter.Producto) {
        filtered = filtered.filter(i => i.producto && i.producto.Nombre.toLowerCase().includes(filter.Producto.toLowerCase()));
    }
    if (filter.Estado) {
        filtered = filtered.filter(i => {
            if (filter.Estado === 'En Stock') return i.StockActual > i.StockMinimo;
            if (filter.Estado === 'Stock Crítico') return i.StockActual <= i.StockMinimo && i.StockActual > 0;
            if (filter.Estado === 'Sin Stock') return i.StockActual === 0;
            return true;
        });
    }

    const tableBody = document.getElementById('inventoryTableBody');
    tableBody.innerHTML = '';

    filtered.forEach(item => {
        const estado = item.StockActual > item.StockMinimo ? 'En Stock' : item.StockActual > 0 ? 'Stock Crítico' : 'Sin Stock';
        const estadoClass = estado === 'En Stock' ? 'status-high' : estado === 'Stock Crítico' ? 'status-medium' : 'status-low';

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.producto ? item.producto.id : 'N/A'}</td>
            <td>${item.producto ? item.producto.Nombre : 'N/A'}</td>
            <td>${item.producto && item.producto.categoria ? item.producto.categoria.Nombre : 'Sin categoría'}</td>
            <td>${item.StockActual}</td>
            <td>${item.StockMinimo}</td>
            <td>C$ ${item.producto ? item.producto.PrecioVenta : 'N/A'}</td>
            <td><span class="status-badge ${estadoClass}">${estado}</span></td>
            <td>
                <div class="table-actions-buttons">
                    <button class="btn btn-warning" onclick="editInventory('${item.documentId}')">Modificar</button>
                    <button class="btn btn-danger" onclick="deleteInventory('${item.documentId}')">Eliminar</button>
                </div>
            </td>
        `;
        tableBody.appendChild(row);
    });

    updateInventoryStats(filtered);
}

// Función para actualizar estadísticas
function updateInventoryStats(inventario) {
    const productosEnStock = inventario.filter(i => i.StockActual > 0).length;
    const stockCritico = inventario.filter(i => i.StockActual <= i.StockMinimo && i.StockActual > 0).length;

    document.getElementById('productosEnStock').textContent = productosEnStock;
    document.getElementById('stockCritico').textContent = stockCritico;
}

// Función para cargar productos en el select
async function loadProductosSelect(empresaNombre) {
    const productos = await getProductosParaInventario(empresaNombre);
    const select = document.getElementById('inventoryProducto');
    select.innerHTML = '<option value="">Selecciona un producto</option>';
    productos.forEach(p => {
        const option = document.createElement('option');
        option.value = p.documentId;
        option.textContent = p.Nombre;
        select.appendChild(option);
    });
}

// Función para abrir modal de agregar
function addInventory() {
    currentEditingInventoryDocId = null;
    document.getElementById('inventoryModalTitle').textContent = 'Agregar Inventario';
    clearInventoryForm();

    const empresaNombre = localStorage.getItem('stockmind_empresa_nombre');
    loadProductosSelect(empresaNombre);

    // Asignar empresa
    fetch(`http://localhost:1337/api/empresas?filters[Nombre][$eq]=${encodeURIComponent(empresaNombre)}`)
        .then(response => response.json())
        .then(data => {
            if (data.data && data.data.length > 0) {
                document.getElementById('inventoryEmpresaId').value = data.data[0].id;
            }
        });

    document.getElementById('inventoryModal').classList.add('active');
}

// Función para editar inventario
async function editInventory(docId) {
    currentEditingInventoryDocId = docId;
    const empresaNombre = localStorage.getItem('stockmind_empresa_nombre');
    const inventario = await getInventario(empresaNombre);
    const item = inventario.find(i => i.documentId === docId);
    if (item) {
        document.getElementById('inventoryModalTitle').textContent = 'Modificar Inventario';
        document.getElementById('inventoryDocumentId').value = docId;
        document.getElementById('inventoryProducto').value = item.producto ? item.producto.documentId : '';
        document.getElementById('stockActual').value = item.StockActual;
        document.getElementById('stockMinimo').value = item.StockMinimo;
        document.getElementById('inventoryModal').classList.add('active');
    }
}

// Función para eliminar inventario
function deleteInventory(docId) {
    if (confirm('¿Estás seguro de eliminar este inventario?')) {
        deleteInventario(docId).then(success => {
            if (success) {
                const empresaNombre = localStorage.getItem('stockmind_empresa_nombre');
                loadInventory(empresaNombre);
            }
        });
    }
}

// Función para cerrar modal
function closeInventoryModal() {
    document.getElementById('inventoryModal').classList.remove('active');
    document.getElementById('filterInventoryModal').classList.remove('active');
}

// Función para limpiar formulario
function clearInventoryForm() {
    document.getElementById('inventoryForm').reset();
    document.getElementById('inventoryDocumentId').value = '';
    currentEditingInventoryDocId = null;
}

// Función para abrir modal de filtro
function filterInventory() {
    document.getElementById('filterInventoryModal').classList.add('active');
}

// Función para limpiar filtro
function clearFilterInventory() {
    document.getElementById('filterInventoryForm').reset();
    const empresaNombre = localStorage.getItem('stockmind_empresa_nombre');
    loadInventory(empresaNombre);
}

// Función para exportar
function exportInventory() {
    alert('Función de exportar no implementada aún');
}

// Función de inicialización
function initInventory(empresaNombre) {
    loadInventory(empresaNombre);
    loadProductosSelect(empresaNombre);

    // Event listener para inventoryForm
    document.getElementById('inventoryForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const inventario = Object.fromEntries(formData);
        inventario.empresa = document.getElementById('inventoryEmpresaId').value;
        delete inventario.inventoryDocumentId;
        inventario.producto = inventario.producto;

        console.log('DEBUG: Inventario a enviar:', inventario);

        if (!inventario.empresa || inventario.empresa === '') {
            delete inventario.empresa;
            console.log('Empresa no asignada, omitiendo');
        }

        if (!inventario.producto || !inventario.StockActual || !inventario.StockMinimo) {
            alert('Todos los campos son obligatorios');
            return;
        }

        let success;
        if (currentEditingInventoryDocId) {
            success = await updateInventario(currentEditingInventoryDocId, inventario);
        } else {
            success = await createInventario(inventario);
        }
        if (success) {
            console.log('DEBUG: Inventario guardado, recargando');
            loadInventory(empresaNombre);
            closeInventoryModal();
            alert('Inventario guardado');
        } else {
            alert('Error al guardar');
        }
    });

    // Event listener para filterForm
    document.getElementById('filterInventoryForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const filter = Object.fromEntries(formData);
        loadInventory(empresaNombre, filter);
        closeInventoryModal();
    });
}

// Exponer la función globalmente
window.initInventory = initInventory;