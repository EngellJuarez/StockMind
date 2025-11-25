// scripts/products.js

const API_BASE_URL = 'http://localhost:1337/api/productos';
const API_CATEGORIAS_URL = 'http://localhost:1337/api/categorias';
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

    // Event listener para guardar categoría (dentro de initProducts, con logs)
    document.getElementById('categoriaForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        e.stopImmediatePropagation(); // Previene cualquier otro evento

        const nombre = document.getElementById('categoriaNombre').value.trim();
        if (!nombre) {
            alert('Ingresa un nombre para la categoría');
            return;
        }

        const categoria = { Nombre: nombre };
        const docId = document.getElementById('categoriaDocumentId').value;

        console.log('Intentando guardar categoría:', categoria, 'DocId:', docId);

        try {
            let url = API_CATEGORIAS_URL;
            let method = 'POST';
            if (docId) {
                url = `${API_CATEGORIAS_URL}/${docId}`;
                method = 'PUT';
            }

            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: categoria })
            });

            console.log('Respuesta del servidor:', response.status);

            if (response.ok) {
                const result = await response.json();
                console.log('Categoría guardada:', result);
                loadCategoriaTable(); // Recarga tabla sin cerrar modal
                loadProductos(); // Actualiza productos
                updateStats(); // Actualiza stats
                clearCategoriaForm(); // Limpia form
                // NO alert, NO cierra modal
            } else {
                const errorText = await response.text();
                console.error('Error al guardar:', response.status, errorText);
                alert('Error al guardar: ' + response.status + ' - ' + errorText);
            }
        } catch (error) {
            console.error('Error de red:', error);
            alert('Error de red: ' + error.message);
        }
    });

    // Cerrar modal al hacer clic fuera
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            closeModal();
        }
    });
}

// Función para abrir modal de categorías
function manageCategorias() {
    loadCategoriaTable();
    document.getElementById('categoriaModal').classList.add('active');
}

// Función para cargar tabla de categorías
async function loadCategoriaTable() {
    try {
        const categorias = await getCategorias();
        const filterValue = document.getElementById('filterCategoriaNombre').value.toLowerCase();
        const filtered = categorias.filter(cat => cat.Nombre.toLowerCase().includes(filterValue));
        const tableBody = document.getElementById('categoriaTableBody');
        tableBody.innerHTML = '';

        filtered.forEach(categoria => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${categoria.id}</td>
                <td>${categoria.Nombre}</td>
                <td>
                    <div class="table-actions-buttons">
                        <button class="btn btn-warning" onclick="editCategoria('${categoria.documentId}')">Modificar</button>
                        <button class="btn btn-danger" onclick="deleteCategoria('${categoria.documentId}')">Eliminar</button>
                    </div>
                </td>
            `;
            tableBody.appendChild(row);
        });
    } catch (error) {
        console.error('Error cargando categorías:', error);
    }
}

// Función para filtrar categorías (con botón)
function filterCategorias() {
    loadCategoriaTable();
}

// Función para editar categoría (no cierra modal)
async function editCategoria(docId) {
    try {
        const categorias = await getCategorias();
        const categoria = categorias.find(c => c.documentId === docId);
        if (categoria) {
            document.getElementById('categoriaDocumentId').value = docId;
            document.getElementById('categoriaNombre').value = categoria.Nombre;
        }
    } catch (error) {
        console.error('Error editando categoría:', error);
    }
}

// Función para eliminar categoría (no cierra modal)
async function deleteCategoria(docId) {
    if (confirm('¿Estás seguro de eliminar esta categoría?')) {
        try {
            const response = await fetch(`${API_CATEGORIAS_URL}/${docId}`, {
                method: 'DELETE'
            });
            if (response.ok) {
                loadCategoriaTable();
                loadProductos(); // Actualizar productos
                updateStats();
            } else {
                alert('Error al eliminar: ' + response.status);
            }
        } catch (error) {
            alert('Error: ' + error.message);
        }
    }
}

// Función para limpiar formulario de categoría
function clearCategoriaForm() {
    document.getElementById('categoriaForm').reset();
    document.getElementById('categoriaDocumentId').value = '';
}

// Función para cerrar modal (remueve active de todos)
function closeModal() {
    document.getElementById('productModal').classList.remove('active');
    document.getElementById('filterModal').classList.remove('active');
    document.getElementById('categoriaModal').classList.remove('active'); // Agregado
}

// Exponer la función globalmente
window.initProducts = initProducts;