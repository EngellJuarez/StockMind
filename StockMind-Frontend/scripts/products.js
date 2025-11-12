// scripts/products.js

const API_BASE_URL = 'http://localhost:1337/api/productos';
const API_CATEGORIAS_URL = 'http://localhost:1337/api/categorias'; // Nueva URL para categorías
let currentEditingDocId = null; // Usar documentId para Strapi

// Función para obtener productos (con populate)
async function getProductos() {
    try {
        console.log('Intentando obtener productos con populate');
        const response = await fetch(API_BASE_URL + '?populate=categoria');
        if (!response.ok) throw new Error('Error al obtener productos: ' + response.status);
        const data = await response.json();
        console.log('Productos obtenidos:', data);
        return data.data || [];
    } catch (error) {
        console.error('Error al obtener productos:', error);
        return [];
    }
}

// Función para obtener categorías
async function getCategorias() {
    try {
        const response = await fetch(API_CATEGORIAS_URL);
        if (!response.ok) throw new Error('Error al obtener categorías');
        const data = await response.json();
        return data.data || [];
    } catch (error) {
        console.error('Error al obtener categorías:', error);
        return [];
    }
}

// Función para crear producto
async function createProducto(producto) {
    try {
        console.log('Creando producto:', producto);
        const response = await fetch(API_BASE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data: producto })
        });
        if (!response.ok) throw new Error('Error al crear producto: ' + response.status);
        const data = await response.json();
        console.log('Producto creado:', data);
        return data.data;
    } catch (error) {
        console.error('Error al crear producto:', error);
        return null;
    }
}

// Función para actualizar producto
async function updateProducto(docId, producto) {
    try {
        console.log('Actualizando producto documentId:', docId, 'con:', producto);
        const response = await fetch(`${API_BASE_URL}/${docId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data: producto })
        });
        if (!response.ok) throw new Error('Error al actualizar producto: ' + response.status);
        const data = await response.json();
        console.log('Producto actualizado:', data);
        return data.data;
    } catch (error) {
        console.error('Error al actualizar producto:', error);
        return null;
    }
}

// Función para eliminar producto
async function deleteProducto(docId) {
    try {
        console.log('Eliminando producto documentId:', docId);
        const response = await fetch(`${API_BASE_URL}/${docId}`, {
            method: 'DELETE'
        });
        if (!response.ok) throw new Error('Error al eliminar producto: ' + response.status);
        console.log('Producto eliminado');
        return true;
    } catch (error) {
        console.error('Error al eliminar producto:', error);
        return false;
    }
}

// Función para actualizar estadísticas
async function updateStats() {
    const productos = await getProductos();
    const categorias = await getCategorias();
    
    document.getElementById('totalProductos').textContent = productos.length;
    document.getElementById('totalCategorias').textContent = categorias.length;
}

// Función para cargar categorías en los selects
async function loadCategorias() {
    console.log('Cargando categorías...');
    const categorias = await getCategorias();
    console.log('Categorías obtenidas:', categorias);

    // Para el modal de producto
    const selectProducto = document.getElementById('categoria');
    if (selectProducto) {
        selectProducto.innerHTML = '<option value="">Selecciona una categoría</option>';
        categorias.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat.documentId;
            option.textContent = cat.Nombre;
            selectProducto.appendChild(option);
        });
    } else {
        console.error('Select de producto no encontrado');
    }

    // Para el modal de filtro
    const selectFiltro = document.getElementById('filterCategoria');
    if (selectFiltro) {
        selectFiltro.innerHTML = '<option value="">Todas las categorías</option>';
        categorias.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat.Nombre;
            option.textContent = cat.Nombre;
            selectFiltro.appendChild(option);
        });
    } else {
        console.error('Select de filtro no encontrado');
    }

    console.log('Categorías cargadas en selects');
}

// Función para cargar productos en la tabla
async function loadProductos(filter = {}) {
    console.log('Cargando productos con filtro:', filter);
    let productos = await getProductos();

    // Aplicar filtro si existe
    if (filter.id) {
        productos = productos.filter(p => p.id == filter.id);
    }
    if (filter.Nombre) {
        productos = productos.filter(p => p.Nombre.toLowerCase().includes(filter.Nombre.toLowerCase()));
    }
    if (filter.Categoria) {
        productos = productos.filter(p => {
            const categoriaNombre = p.categoria ? p.categoria.Nombre : '';
            return categoriaNombre.toLowerCase().includes(filter.Categoria.toLowerCase());
        });
    }

    const tableBody = document.querySelector('#productsView .table tbody');
    if (!tableBody) {
        console.error('No se encontró el tbody de la tabla');
        return;
    }

    tableBody.innerHTML = '';

    productos.forEach(producto => {
        const nombre = producto.Nombre;
        const descripcion = producto.Descripcion;
        const categoria = producto.categoria ? producto.categoria.Nombre : 'Sin categoría';
        const precioCompra = producto.PrecioCompra;
        const precioVenta = producto.PrecioVenta;
        const docId = producto.documentId;

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${producto.id}</td>
            <td>${nombre}</td>
            <td>${descripcion}</td>
            <td>${categoria}</td>
            <td>C$ ${precioCompra}</td>
            <td>C$ ${precioVenta}</td>
            <td>
                <div class="table-actions-buttons">
                    <button class="btn btn-warning" onclick="handleEdit('${docId}')">Modificar</button>
                    <button class="btn btn-danger" onclick="handleDelete('${docId}')">Eliminar</button>
                </div>
            </td>
        `;
        tableBody.appendChild(row);
    });
    console.log('Productos cargados en tabla:', productos.length);
}

// Funciones para manejar clics (no async para onclick)
function handleEdit(docId) {
    editProducto(docId);
}

function handleDelete(docId) {
    if (confirm('¿Estás seguro de eliminar este producto?')) {
        deleteProducto(docId).then(success => {
            if (success) {
                loadProductos();
                updateStats(); // Actualizar stats al eliminar
            }
        });
    }
}

// Función para abrir modal de agregar
function addProducto() {
    console.log('Abriendo modal para agregar');
    currentEditingDocId = null;
    document.getElementById('modalTitle').textContent = 'Agregar Producto';
    clearForm();
    document.getElementById('productModal').classList.add('active'); // Usar clase
}

// Función para editar producto
async function editProducto(docId) {
    console.log('Editando producto documentId:', docId);
    currentEditingDocId = docId;
    const productos = await getProductos();
    const producto = productos.find(p => p.documentId === docId);
    if (producto) {
        document.getElementById('modalTitle').textContent = 'Modificar Producto';
        document.getElementById('documentId').value = docId;
        document.getElementById('nombre').value = producto.Nombre;
        document.getElementById('descripcion').value = producto.Descripcion;
        const categoriaId = producto.categoria ? producto.categoria.documentId : '';
        document.getElementById('categoria').value = categoriaId;
        document.getElementById('precioCompra').value = producto.PrecioCompra;
        document.getElementById('precioVenta').value = producto.PrecioVenta;
        document.getElementById('productModal').classList.add('active'); // Usar clase
    } else {
        console.error('Producto no encontrado para editar');
    }
}

// Función para cerrar modal
function closeModal() {
    document.getElementById('productModal').classList.remove('active'); // Usar clase
    document.getElementById('filterModal').classList.remove('active'); // Usar clase
}

// Función para limpiar formulario
function clearForm() {
    document.getElementById('productForm').reset();
    document.getElementById('documentId').value = '';
    currentEditingDocId = null;
    document.getElementById('modalTitle').textContent = 'Agregar Producto';
}

// Función para limpiar filtro
function clearFilter() {
    document.getElementById('filterForm').reset();
    loadProductos();
}

// Función para abrir modal de filtro
function filterProductos() {
    document.getElementById('filterModal').classList.add('active'); // Usar clase
}

// Función de inicialización (llamada desde main.js)
function initProducts() {
    console.log('Inicializando productos desde main.js');
    closeModal(); // Cerrar modales al iniciar
    loadProductos();
    loadCategorias();
    updateStats(); // Actualizar stats al iniciar

    // Asignar event listeners aquí
    document.getElementById('productForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('Formulario de producto enviado, no debería recargar');

        const formData = new FormData(e.target);
        const producto = Object.fromEntries(formData);
        delete producto.documentId;
        producto.categoria = producto.categoria;
        console.log('Datos a enviar:', producto);

        if (!producto.Nombre || !producto.Descripcion || !producto.categoria || !producto.PrecioCompra || !producto.PrecioVenta) {
            alert('Todos los campos son obligatorios');
            return;
        }

        try {
            let success;
            if (currentEditingDocId) {
                success = await updateProducto(currentEditingDocId, producto);
            } else {
                success = await createProducto(producto);
            }
            if (success) {
                loadProductos();
                updateStats(); // Actualizar stats al guardar
                closeModal();
                alert('Producto guardado exitosamente');
            } else {
                alert('Error al guardar');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error: ' + error.message);
        }
    });

    document.getElementById('filterForm').addEventListener('submit', (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('Filtro enviado, no debería recargar');

        const formData = new FormData(e.target);
        const filter = Object.fromEntries(formData);
        console.log('Filtro aplicado:', filter);
        loadProductos(filter);
        closeModal();
    });

    // Cerrar modal al hacer clic fuera
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            closeModal();
        }
    });
}

// Exponer la función globalmente
window.initProducts = initProducts;