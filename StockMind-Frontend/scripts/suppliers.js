// scripts/suppliers.js

const API_PROVEEDORES_URL = 'http://localhost:1337/api/proveedors';
const API_PRODUCTOS_SUPPLIERS_URL = 'http://localhost:1337/api/productos';

let currentEditingSupplierDocId = null;

// Función para obtener proveedores (filtrado por empresa)
async function getProveedores(empresaNombre) {
    try {
        console.log('DEBUG: Obteniendo proveedores para empresa:', empresaNombre);
        const response = await fetch(API_PROVEEDORES_URL + '?populate=*');
        if (!response.ok) throw new Error('Error al obtener proveedores');
        const data = await response.json();
        console.log('DEBUG: Proveedores crudos:', data.data);
        // Filtrar por empresa
        const proveedoresFiltrados = data.data.filter(p => {
            console.log('DEBUG: Proveedor empresa:', p.empresa);
            return p.empresa && p.empresa.Nombre === empresaNombre;
        });
        console.log('DEBUG: Proveedores filtrados:', proveedoresFiltrados);
        return proveedoresFiltrados || [];
    } catch (error) {
        console.error('Error al obtener proveedores:', error);
        return [];
    }
}

// Función para obtener productos para select
async function getProductosParaProveedores(empresaNombre) {
    try {
        const response = await fetch(API_PRODUCTOS_SUPPLIERS_URL + '?populate=empresa');
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

// Función para crear proveedor
async function createProveedor(proveedor) {
    try {
        console.log('DEBUG: Creando proveedor con:', proveedor);
        const response = await fetch(API_PROVEEDORES_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data: proveedor })
        });
        console.log('DEBUG: Respuesta status:', response.status);
        if (!response.ok) {
            const errorText = await response.text();
            console.log('DEBUG: Error text:', errorText);
            throw new Error('Error al crear proveedor: ' + response.status);
        }
        const data = await response.json();
        console.log('DEBUG: Proveedor creado:', data);
        return data.data;
    } catch (error) {
        console.error('Error al crear proveedor:', error);
        return null;
    }
}

// Función para actualizar proveedor
async function updateProveedor(docId, proveedor) {
    try {
        const response = await fetch(`${API_PROVEEDORES_URL}/${docId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data: proveedor })
        });
        if (!response.ok) throw new Error('Error al actualizar proveedor');
        const data = await response.json();
        return data.data;
    } catch (error) {
        console.error('Error al actualizar proveedor:', error);
        return null;
    }
}

// Función para eliminar proveedor
async function deleteProveedor(docId) {
    try {
        const response = await fetch(`${API_PROVEEDORES_URL}/${docId}`, {
            method: 'DELETE'
        });
        if (!response.ok) throw new Error('Error al eliminar proveedor');
        return true;
    } catch (error) {
        console.error('Error al eliminar proveedor:', error);
        return false;
    }
}

// Función para cargar proveedores en la tabla
async function loadSuppliers(empresaNombre, filter = {}) {
    const proveedores = await getProveedores(empresaNombre);
    let filtered = proveedores;

    // Aplicar filtros
    if (filter.NombreEmpresa) {
        filtered = filtered.filter(p => p.NombreEmpresa.toLowerCase().includes(filter.NombreEmpresa.toLowerCase()));
    }
    if (filter.Estado) {
        filtered = filtered.filter(p => p.Estado === filter.Estado);
    }

    const tableBody = document.getElementById('suppliersTableBody');
    tableBody.innerHTML = '';

    filtered.forEach(proveedor => {
        const productos = proveedor.productos ? proveedor.productos.map(p => p.Nombre).join(', ') : 'Ninguno';
        const estadoClass = proveedor.Estado === 'Activo' ? 'status-high' : 'status-low';

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${proveedor.NombreEmpresa}</td>
            <td>${proveedor.Contacto}</td>
            <td>${proveedor.Telefono}</td>
            <td>${productos}</td>
            <td>${proveedor.Evaluacion}/5</td>
            <td><span class="status-badge ${estadoClass}">${proveedor.Estado}</span></td>
            <td>
                <div class="table-actions-buttons">
                    <button class="btn btn-warning" onclick="editSupplier('${proveedor.documentId}')">Modificar</button>
                    <button class="btn btn-danger" onclick="deleteSupplier('${proveedor.documentId}')">Eliminar</button>
                </div>
            </td>
        `;
        tableBody.appendChild(row);
    });

    updateSupplierStats(filtered);
}

// Función para actualizar estadísticas
function updateSupplierStats(proveedores) {
    const activos = proveedores.filter(p => p.Estado === 'Activo').length;
    const evaluaciones = proveedores.map(p => p.Evaluacion).filter(e => e > 0);
    const promedio = evaluaciones.length > 0 ? (evaluaciones.reduce((a, b) => a + b, 0) / evaluaciones.length).toFixed(1) : 0;

    document.getElementById('proveedoresActivos').textContent = activos;
    document.getElementById('evaluacionPromedio').textContent = `${promedio}/5`;
}

// Función para cargar productos en el select
async function loadProductosSelectSuppliers(empresaNombre) {
    const productos = await getProductosParaProveedores(empresaNombre);
    const select = document.getElementById('productos');
    select.innerHTML = '';
    productos.forEach(p => {
        const option = document.createElement('option');
        option.value = p.documentId;
        option.textContent = p.Nombre;
        select.appendChild(option);
    });
}

// Función para abrir modal de agregar
function addSupplier() {
    currentEditingSupplierDocId = null;
    document.getElementById('supplierModalTitle').textContent = 'Agregar Proveedor';
    clearSupplierForm();

    const empresaNombre = localStorage.getItem('stockmind_empresa_nombre');
    loadProductosSelect(empresaNombre);

    // Asignar empresa
    fetch(`http://localhost:1337/api/empresas?filters[Nombre][$eq]=${encodeURIComponent(empresaNombre)}`)
        .then(response => response.json())
        .then(data => {
            if (data.data && data.data.length > 0) {
                document.getElementById('supplierEmpresaId').value = data.data[0].id;
            }
        });

    document.getElementById('supplierModal').classList.add('active');
}

// Función para editar proveedor
async function editSupplier(docId) {
    currentEditingSupplierDocId = docId;
    const empresaNombre = localStorage.getItem('stockmind_empresa_nombre');
    const proveedores = await getProveedores(empresaNombre);
    const proveedor = proveedores.find(p => p.documentId === docId);
    if (proveedor) {
        document.getElementById('supplierModalTitle').textContent = 'Modificar Proveedor';
        document.getElementById('supplierDocumentId').value = docId;
        document.getElementById('nombreEmpresa').value = proveedor.NombreEmpresa;
        document.getElementById('contacto').value = proveedor.Contacto;
        document.getElementById('telefono').value = proveedor.Telefono;
        document.getElementById('evaluacion').value = proveedor.Evaluacion;
        document.getElementById('estado').value = proveedor.Estado;
        // Productos (manejar multiple)
        const productosSelect = document.getElementById('productos');
        Array.from(productosSelect.options).forEach(option => {
            option.selected = proveedor.productos ? proveedor.productos.some(p => p.documentId === option.value) : false;
        });
        document.getElementById('supplierModal').classList.add('active');
    }
}

// Función para eliminar proveedor
function deleteSupplier(docId) {
    if (confirm('¿Estás seguro de eliminar este proveedor?')) {
        deleteProveedor(docId).then(success => {
            if (success) {
                const empresaNombre = localStorage.getItem('stockmind_empresa_nombre');
                loadSuppliers(empresaNombre);
            }
        });
    }
}

// Función para cerrar modal
function closeSupplierModal() {
    document.getElementById('supplierModal').classList.remove('active');
    document.getElementById('filterSupplierModal').classList.remove('active');
}

// Función para limpiar formulario
function clearSupplierForm() {
    document.getElementById('supplierForm').reset();
    document.getElementById('supplierDocumentId').value = '';
    currentEditingSupplierDocId = null;
}

// Función para abrir modal de filtro
function filterSuppliers() {
    document.getElementById('filterSupplierModal').classList.add('active');
}

// Función para limpiar filtro
function clearFilterSupplier() {
    document.getElementById('filterSupplierForm').reset();
    const empresaNombre = localStorage.getItem('stockmind_empresa_nombre');
    loadSuppliers(empresaNombre);
}

// Función para exportar
function exportSuppliers() {
    alert('Función de exportar no implementada aún');
}

// Función de inicialización
function initSuppliers(empresaNombre) {
    console.log('DEBUG: initSuppliers ejecutado con empresaNombre:', empresaNombre);
    loadSuppliers(empresaNombre);
    loadProductosSelectSuppliers(empresaNombre);

    // Event listener para supplierForm (evitar duplicados)
    if (!document.getElementById('supplierForm').hasAttribute('data-listener')) {
        document.getElementById('supplierForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const proveedor = Object.fromEntries(formData);
            proveedor.empresa = document.getElementById('supplierEmpresaId').value;
            delete proveedor.supplierDocumentId;
            // Productos (array de documentIds)
            const productosSeleccionados = Array.from(document.getElementById('productos').selectedOptions).map(option => option.value);
            proveedor.productos = { set: productosSeleccionados };

            if (!proveedor.empresa || proveedor.empresa === '') {
                delete proveedor.empresa;
                console.log('Empresa no asignada, omitiendo');
            }

            if (!proveedor.NombreEmpresa || !proveedor.Contacto || !proveedor.Telefono || !proveedor.Evaluacion || !proveedor.Estado) {
                alert('Todos los campos obligatorios deben llenarse');
                return;
            }

            let success;
            if (currentEditingSupplierDocId) {
                success = await updateProveedor(currentEditingSupplierDocId, proveedor);
            } else {
                success = await createProveedor(proveedor);
            }
            if (success) {
                loadSuppliers(empresaNombre);
                closeSupplierModal();
                alert('Proveedor guardado');
            } else {
                alert('Error al guardar');
            }
        });
        document.getElementById('supplierForm').setAttribute('data-listener', 'true');
    }

    // Event listener para filterForm
    document.getElementById('filterSupplierForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const filter = Object.fromEntries(formData);
        loadSuppliers(empresaNombre, filter);
        closeSupplierModal();
    });
}

// Exponer la función globalmente
window.initSuppliers = initSuppliers;