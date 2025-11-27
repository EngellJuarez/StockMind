// scripts/reports.js

const API_PRODUCTS_URL_REPORTS = 'http://localhost:1337/api/productos';
const API_MOVEMENTS_URL_REPORTS = 'http://localhost:1337/api/movimientos';
const API_WAREHOUSES_URL_REPORTS = 'http://localhost:1337/api/almacens';

// Initialize Reports View
function initReports() {
    console.log('Initializing Reports View');
    loadReportsData();
}

// Load all data for reports
async function loadReportsData() {
    try {
        const token = localStorage.getItem('stockmind_token');

        // Fetch all data in parallel
        const [productsRes, movementsRes, warehousesRes] = await Promise.all([
            fetch(`${API_PRODUCTS_URL_REPORTS}?populate=categoria`, {
                headers: { 'Authorization': `Bearer ${token}` }
            }),
            fetch(`${API_MOVEMENTS_URL_REPORTS}?populate=*&sort=Fecha:desc`, {
                headers: { 'Authorization': `Bearer ${token}` }
            }),
            fetch(`${API_WAREHOUSES_URL_REPORTS}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
        ]);

        const productsData = await productsRes.json();
        const movementsData = await movementsRes.json();
        const warehousesData = await warehousesRes.json();

        const products = productsData.data || [];
        const movements = movementsData.data || [];
        const warehouses = warehousesData.data || [];

        // Update stats
        updateReportStats(products, movements, warehouses);

        // Generate reports
        generateCategoryReport(products);
        generateWarehouseReport(warehouses);

    } catch (error) {
        console.error('Error loading reports data:', error);
    }
}

// Update main statistics
function updateReportStats(products, movements, warehouses) {
    // Placeholder values - can be calculated from actual data
    document.getElementById('totalReportsGenerated').textContent = '127';
    document.getElementById('totalAutomaticReports').textContent = '15';

    // Update last generated dates (placeholder)
    const today = new Date().toLocaleDateString('es-ES');
    document.getElementById('lastInventoryReport').textContent = today;
    document.getElementById('lastLowStockReport').textContent = today;
    document.getElementById('lastSalesReport').textContent = '-';
}

// Generate products by category report
function generateCategoryReport(products) {
    const tbody = document.getElementById('categoryReportBody');
    tbody.innerHTML = '';

    // Group by category
    const categoryMap = {};
    products.forEach(p => {
        const categoryName = p.categoria ? p.categoria.Nombre : 'Sin Categoría';
        categoryMap[categoryName] = (categoryMap[categoryName] || 0) + 1;
    });

    // Sort by count descending
    const sortedCategories = Object.entries(categoryMap)
        .sort((a, b) => b[1] - a[1]);

    if (sortedCategories.length === 0) {
        tbody.innerHTML = '<tr><td colspan="2" style="text-align: center;">No hay datos</td></tr>';
        return;
    }

    sortedCategories.forEach(([category, count]) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${category}</td>
            <td><strong>${count}</strong></td>
        `;
        tbody.appendChild(tr);
    });
}

// Generate warehouse status report
function generateWarehouseReport(warehouses) {
    const tbody = document.getElementById('warehouseReportBody');
    tbody.innerHTML = '';

    if (warehouses.length === 0) {
        tbody.innerHTML = '<tr><td colspan="2" style="text-align: center;">No hay almacenes</td></tr>';
        return;
    }

    warehouses.forEach(w => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${w.Nombre}</td>
            <td><span class="status-badge status-${w.Estado.toLowerCase()}">${w.Estado}</span></td>
        `;
        tbody.appendChild(tr);
    });
}

// Report action functions
function scheduleReport() {
    alert('Función de programación en desarrollo');
}

function generateReport() {
    alert('Función de generación en desarrollo');
}

function generateSpecificReport(type) {
    alert(`Generando reporte de ${type}...`);
}

function configureReport(type) {
    alert(`Configurando reporte de ${type}...`);
}

// Expose functions globally
window.initReports = initReports;
window.scheduleReport = scheduleReport;
window.generateReport = generateReport;
window.generateSpecificReport = generateSpecificReport;
window.configureReport = configureReport;
