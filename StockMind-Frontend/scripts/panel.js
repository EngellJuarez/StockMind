// scripts/panel.js

const API_PRODUCTOS_PANEL_URL = 'http://localhost:1337/api/productos';
const API_INVENTARIO_PANEL_URL = 'http://localhost:1337/api/inventarios';
const API_ORDENES_PANEL_URL = 'http://localhost:1337/api/ordens';
const API_MOVIMIENTOS_PANEL_URL = 'http://localhost:1337/api/movimientos';

// Función para obtener productos (filtrado por empresa)
async function getProductosPanel(empresaNombre) {
    try {
        const response = await fetch(API_PRODUCTOS_PANEL_URL + '?populate=empresa');
        if (!response.ok) throw new Error('Error al obtener productos');
        const data = await response.json();
        return data.data.filter(p => p.empresa && p.empresa.Nombre === empresaNombre);
    } catch (error) {
        console.error('Error al obtener productos:', error);
        return [];
    }
}

// Función para obtener inventario (filtrado por empresa)
async function getInventarioPanel(empresaNombre) {
    try {
        const response = await fetch(API_INVENTARIO_PANEL_URL + '?populate=*');
        if (!response.ok) throw new Error('Error al obtener inventario');
        const data = await response.json();
        return data.data.filter(i => i.empresa && i.empresa.Nombre === empresaNombre);
    } catch (error) {
        console.error('Error al obtener inventario:', error);
        return [];
    }
}

// Función para obtener órdenes (filtrado por empresa)
async function getOrdenesPanel(empresaNombre) {
    try {
        const response = await fetch(API_ORDENES_PANEL_URL + '?populate=*');
        if (!response.ok) throw new Error('Error al obtener órdenes');
        const data = await response.json();
        return data.data.filter(o => o.empresa && o.empresa.Nombre === empresaNombre);
    } catch (error) {
        console.error('Error al obtener órdenes:', error);
        return [];
    }
}

// Función para cargar stats
async function loadPanelStats(empresaNombre) {
    const productos = await getProductosPanel(empresaNombre);
    const inventario = await getInventarioPanel(empresaNombre);

    const totalProductos = productos.length;
    const stockBajo = inventario.filter(i => i.StockActual <= i.StockMinimo).length;
    const valorInventario = inventario.reduce((sum, i) => sum + (i.StockActual * (i.producto ? i.producto.PrecioVenta : 0)), 0);
    const rotacion = inventario.length > 0 ? (inventario.reduce((sum, i) => sum + i.StockActual, 0) / inventario.length).toFixed(1) : 0;

    document.getElementById('totalProductos').textContent = totalProductos;
    document.getElementById('stockBajo').textContent = stockBajo;
    document.getElementById('valorInventario').textContent = `C$ ${valorInventario.toFixed(2)}`;
    document.getElementById('rotacion').textContent = `${rotacion}x`;
}

// Función para cargar recomendaciones IA
async function loadPanelRecommendations(empresaNombre) {
    const inventario = await getInventarioPanel(empresaNombre);
    const recomendaciones = [];

    // Recomendación 1: Productos con stock bajo
    const stockBajo = inventario.filter(i => i.StockActual <= i.StockMinimo);
    if (stockBajo.length > 0) {
        recomendaciones.push({
            title: 'Reponer Stock',
            description: `Hay ${stockBajo.length} productos con stock bajo. Considera reponer.`,
            icon: 'fas fa-exclamation-triangle',
            type: 'warning'
        });
    }

    // Recomendación 2: Valor alto de inventario
    const valorInventario = inventario.reduce((sum, i) => sum + (i.StockActual * (i.producto ? i.producto.PrecioVenta : 0)), 0);
    if (valorInventario > 10000) {
        recomendaciones.push({
            title: 'Optimizar Inventario',
            description: 'El valor del inventario es alto. Considera vender productos lentos.',
            icon: 'fas fa-chart-line',
            type: 'info'
        });
    }

    // Recomendación 3: Productos sin movimiento
    const productosSinMovimiento = inventario.filter(i => i.StockActual === i.StockMinimo);
    if (productosSinMovimiento.length > 0) {
        recomendaciones.push({
            title: 'Productos Inactivos',
            description: `Hay ${productosSinMovimiento.length} productos sin movimiento. Revisa precios.`,
            icon: 'fas fa-pause',
            type: 'neutral'
        });
    }

    const grid = document.getElementById('recommendationsGrid');
    grid.innerHTML = '';
    recomendaciones.forEach(rec => {
        const card = document.createElement('div');
        card.className = `recommendation-card ${rec.type}`;
        card.innerHTML = `
            <div class="rec-header">
                <i class="${rec.icon} rec-icon"></i>
                <h4>${rec.title}</h4>
            </div>
            <p>${rec.description}</p>
        `;
        grid.appendChild(card);
    });
}

// Función para obtener movimientos recientes (filtrado por empresa)
async function getMovimientosPanel(empresaNombre) {
    try {
        const response = await fetch('http://localhost:1337/api/movimientos?populate=empresa&sort=Fecha:desc');
        if (!response.ok) throw new Error('Error al obtener movimientos');
        const data = await response.json();
        // Filtrar por empresa
        const movimientosFiltrados = data.data.filter(m => m.empresa && m.empresa.Nombre === empresaNombre).slice(0, 10);
        const movimientosConDatos = movimientosFiltrados.map((mov) => {
            // Producto
            let productoNombre = 'N/A';
            if (mov.producto?.data?.attributes?.Nombre) {
                productoNombre = mov.producto.data.attributes.Nombre;
            }

            // Almacén
            let almacenNombre = 'N/A';
            if (mov.almacen?.data?.attributes?.Nombre) {
                almacenNombre = mov.almacen.data.attributes.Nombre;
            }

            return {
                ...mov,
                productoNombre,
                almacenNombre
            };
        });

        return movimientosConDatos;
    } catch (error) {
        console.error('Error al obtener movimientos:', error);
        return [];
    }
}

// Función para cargar actividad reciente
async function loadPanelActivity(empresaNombre) {
    console.log('DEBUG: loadPanelActivity llamado con empresaNombre:', empresaNombre);
    const movimientos = await getMovimientosPanel(empresaNombre);
    console.log('DEBUG: Movimientos obtenidos:', movimientos);
    const actividad = movimientos.slice(0, 10); // Últimas 10 movimientos

    const tableBody = document.getElementById('panelTableBody');
    tableBody.innerHTML = '';

    if (actividad.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="5">No hay actividad reciente</td></tr>';
    } else {
        actividad.forEach(mov => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${mov.productoNombre}</td>
                <td>${mov.Tipo}</td>
                <td>${mov.Cantidad}</td>
                <td>${mov.Estado || 'Completado'}</td>
                <td>${new Date(mov.Fecha).toLocaleDateString()}</td>
            `;
            tableBody.appendChild(row);
        });
    }
}

// Función de inicialización
function initPanel(empresaNombre) {
    loadPanelStats(empresaNombre);
    loadPanelRecommendations(empresaNombre);
    loadPanelActivity(empresaNombre);
}

// Exponer la función globalmente
window.initPanel = initPanel;
