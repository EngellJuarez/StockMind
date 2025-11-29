// scripts/analytics.js

const API_PRODUCTS_URL_ANALYTICS = 'http://localhost:1337/api/productos';
const API_MOVEMENTS_URL_ANALYTICS = 'http://localhost:1337/api/movimientos';

let movementsHistoryChartInstance = null;
let topProductsChartInstance = null;

// Initialize Analytics View
function initAnalytics() {
    console.log('Initializing Analytics View');
    loadAnalyticsData();
}

// Load Data
async function loadAnalyticsData() {
    try {
        const token = localStorage.getItem('stockmind_token');

        const [productsRes, movementsRes] = await Promise.all([
            fetch(`${API_PRODUCTS_URL_ANALYTICS}?populate=categoria`, {
                headers: { 'Authorization': `Bearer ${token}` }
            }),
            fetch(`${API_MOVEMENTS_URL_ANALYTICS}?populate=*&sort=Fecha:desc`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
        ]);

        const productsData = await productsRes.json();
        const movementsData = await movementsRes.json();

        const products = productsData.data || [];
        const movements = movementsData.data || [];

        renderMovementsHistoryChart(movements);
        renderTopProductsChart(movements);

    } catch (error) {
        console.error('Error loading analytics data:', error);
    }
}

// 1. Movements History (Line Chart)
function renderMovementsHistoryChart(movements) {
    const ctx = document.getElementById('movementsHistoryChart').getContext('2d');

    // Group by date (last 7 days)
    const last7Days = {};
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toLocaleDateString('es-ES');
        last7Days[dateStr] = { entrada: 0, salida: 0 };
    }

    movements.forEach(m => {
        const dateStr = new Date(m.Fecha).toLocaleDateString('es-ES');
        if (last7Days[dateStr]) {
            if (m.Tipo === 'Entrada') last7Days[dateStr].entrada += m.Cantidad;
            if (m.Tipo === 'Salida') last7Days[dateStr].salida += m.Cantidad;
        }
    });

    const labels = Object.keys(last7Days);
    const dataIn = labels.map(date => last7Days[date].entrada);
    const dataOut = labels.map(date => last7Days[date].salida);

    if (movementsHistoryChartInstance) movementsHistoryChartInstance.destroy();

    movementsHistoryChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Entradas',
                    data: dataIn,
                    borderColor: '#00c853',
                    backgroundColor: 'rgba(0, 200, 83, 0.1)',
                    tension: 0.4,
                    fill: true
                },
                {
                    label: 'Salidas',
                    data: dataOut,
                    borderColor: '#d32f2f',
                    backgroundColor: 'rgba(211, 47, 47, 0.1)',
                    tension: 0.4,
                    fill: true
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { beginAtZero: true }
            }
        }
    });
}

// 2. Top Products (Bar Chart)
function renderTopProductsChart(movements) {
    const ctx = document.getElementById('topProductsChart').getContext('2d');

    // Count movements per product
    const productCount = {};

    movements.forEach(m => {
        if (m.producto) {
            const name = m.producto.Nombre;
            productCount[name] = (productCount[name] || 0) + m.Cantidad;
        }
    });

    // Sort and take top 5
    const sortedProducts = Object.entries(productCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

    const labels = sortedProducts.map(item => item[0]);
    const data = sortedProducts.map(item => item[1]);

    if (topProductsChartInstance) topProductsChartInstance.destroy();

    topProductsChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Total Unidades Movidas',
                data: data,
                backgroundColor: '#1976d2',
                borderRadius: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { beginAtZero: true }
            }
        }
    });
}

// Expose globally
window.initAnalytics = initAnalytics;
