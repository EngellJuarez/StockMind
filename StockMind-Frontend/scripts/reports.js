// scripts/reports.js

// Función para obtener productos (filtrado por empresa)
async function getProductosReports(empresaNombre) {
    try {
        const response = await fetch('http://localhost:1337/api/productos?populate=empresa');
        if (!response.ok) throw new Error('Error al obtener productos');
        const data = await response.json();
        return data.data.filter(p => p.empresa && p.empresa.Nombre === empresaNombre);
    } catch (error) {
        console.error('Error al obtener productos:', error);
        return [];
    }
}

// Función para obtener inventario (filtrado por empresa)
async function getInventarioReports(empresaNombre) {
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
async function getOrdenesReports(empresaNombre) {
    try {
        const response = await fetch('http://localhost:1337/api/ordens?populate=empresa');
        if (!response.ok) throw new Error('Error al obtener órdenes');
        const data = await response.json();
        return data.data.filter(o => o.empresa && o.empresa.Nombre === empresaNombre);
    } catch (error) {
        console.error('Error al obtener órdenes:', error);
        return [];
    }
}

// Función para obtener movimientos (filtrado por empresa)
async function getMovimientosReports(empresaNombre) {
    try {
        const response = await fetch('http://localhost:1337/api/movimientos?populate=empresa');
        if (!response.ok) throw new Error('Error al obtener movimientos');
        const data = await response.json();
        return data.data.filter(m => m.empresa && m.empresa.Nombre === empresaNombre);
    } catch (error) {
        console.error('Error al obtener movimientos:', error);
        return [];
    }
}

// Función para cargar stats de reportes
async function loadReportsStats(empresaNombre) {
    const productos = await getProductosReports(empresaNombre);
    const inventario = await getInventarioReports(empresaNombre);
    const ordenes = await getOrdenesReports(empresaNombre);
    const movimientos = await getMovimientosReports(empresaNombre);

    const totalProductos = productos.length;
    const valorInventario = inventario.reduce((sum, i) => sum + (i.StockActual * (i.producto ? i.producto.PrecioVenta : 0)), 0);
    const ordenesPendientes = ordenes.filter(o => o.Estado === 'Pendiente').length;
    const movimientosHoy = movimientos.filter(m => {
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        const fechaMov = new Date(m.Fecha);
        fechaMov.setHours(0, 0, 0, 0);
        return fechaMov.getTime() === hoy.getTime();
    }).length;

    document.getElementById('reportTotalProductos').textContent = totalProductos;
    document.getElementById('reportValorInventario').textContent = `C$ ${valorInventario.toFixed(2)}`;
    document.getElementById('reportOrdenesPendientes').textContent = ordenesPendientes;
    document.getElementById('reportMovimientosHoy').textContent = movimientosHoy;
}

// Función para actualizar fecha de generación
function updateReportDate(reportType) {
    const now = new Date().toLocaleString('es-ES');
    const rows = document.querySelectorAll('#reportsTableBody tr');
    rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells[0].textContent.includes(reportType)) {
            cells[2].textContent = now;
        }
    });
}

// Función para generar reporte de inventario
function generateInventoryReport() {
    alert('Generando reporte de inventario...');
    updateReportDate('Inventario');
    // Aquí puedes implementar la lógica para generar y descargar el reporte
}

// Función para generar reporte de movimientos
function generateMovementsReport() {
    alert('Generando reporte de movimientos...');
    updateReportDate('Movimientos');
    // Aquí puedes implementar la lógica para generar y descargar el reporte
}

// Función para generar reporte de órdenes
function generateOrdersReport() {
    alert('Generando reporte de órdenes...');
    updateReportDate('Órdenes');
    // Aquí puedes implementar la lógica para generar y descargar el reporte
}

// Función para generar reporte de proveedores
function generateSuppliersReport() {
    alert('Generando reporte de proveedores...');
    updateReportDate('Proveedores');
    // Aquí puedes implementar la lógica para generar y descargar el reporte
}

// Función para exportar reporte
function exportReport() {
    alert('Exportando reporte...');
    // Aquí puedes implementar la lógica para exportar el reporte
}

// Función de inicialización
function initReports(empresaNombre) {
    loadReportsStats(empresaNombre);
}

// Exponer la función globalmente
window.initReports = initReports;
window.generateInventoryReport = generateInventoryReport;
window.generateMovementsReport = generateMovementsReport;
window.generateOrdersReport = generateOrdersReport;
window.generateSuppliersReport = generateSuppliersReport;
window.exportReport = exportReport;