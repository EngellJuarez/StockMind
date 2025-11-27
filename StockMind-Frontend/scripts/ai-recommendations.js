// scripts/ai-recommendations.js

const API_PRODUCTS_URL_AI = 'http://localhost:1337/api/productos';
const API_MOVEMENTS_URL_AI = 'http://localhost:1337/api/movimientos';

// Initialize AI View
function initAIRecommendations() {
    console.log('Initializing AI Recommendations View');
    runAIAnalysis();
}

// Run Heuristic Analysis
async function runAIAnalysis() {
    try {
        const token = localStorage.getItem('stockmind_token');

        const [productsRes, movementsRes] = await Promise.all([
            fetch(`${API_PRODUCTS_URL_AI}?populate=categoria`, {
                headers: { 'Authorization': `Bearer ${token}` }
            }),
            fetch(`${API_MOVEMENTS_URL_AI}?populate=*&sort=Fecha:desc`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
        ]);

        const productsData = await productsRes.json();
        const movementsData = await movementsRes.json();

        const products = productsData.data || [];
        const movements = movementsData.data || [];

        const recommendations = generateRecommendations(products, movements);
        renderRecommendationsTable(recommendations);

    } catch (error) {
        console.error('Error running AI analysis:', error);
        document.getElementById('aiRecommendationsBody').innerHTML = '<tr><td colspan="6" class="text-center text-danger">Error al analizar datos.</td></tr>';
    }
}

// Generate Recommendations List
function generateRecommendations(products, movements) {
    const recommendations = [];

    // 1. Reabastecimiento (Low Stock)
    const lowStockThreshold = 10;
    products.filter(p => (p.Stock || 0) <= lowStockThreshold).forEach(p => {
        const unitsToOrder = 50; // Simple heuristic
        const cost = (p.Precio || 0) * unitsToOrder; // Estimated cost
        recommendations.push({
            type: 'Reabastecimiento',
            product: p.Nombre,
            recommendation: `Ordenar ${unitsToOrder} unidades`,
            impact: `C$ ${cost.toLocaleString()}`,
            priority: 'Alta',
            action: 'Aplicar'
        });
    });

    // 2. Liquidación (Dead Stock)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const activeProductIds = new Set();
    movements.forEach(m => {
        if (m.Tipo === 'Salida' && new Date(m.Fecha) >= thirtyDaysAgo && m.producto) {
            activeProductIds.add(m.producto.documentId);
        }
    });

    products.filter(p => !activeProductIds.has(p.documentId) && (p.Stock || 0) > 0).slice(0, 3).forEach(p => {
        const potentialRevenue = (p.Precio || 0) * (p.Stock || 0) * 0.3; // 30% discount impact
        recommendations.push({
            type: 'Liquidación',
            product: p.Nombre,
            recommendation: 'Descuento del 30%',
            impact: `C$ ${potentialRevenue.toLocaleString()}`,
            priority: 'Media',
            action: 'Revisar'
        });
    });

    // 3. Alta Demanda (Trending)
    // (Logic similar to previous implementation, added here for completeness if needed, 
    // but the image focused on Reabastecimiento and Liquidación mostly)

    return recommendations;
}

// Render Table
function renderRecommendationsTable(recommendations) {
    const tbody = document.getElementById('aiRecommendationsBody');
    tbody.innerHTML = '';

    if (recommendations.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">No hay recomendaciones activas.</td></tr>';
        return;
    }

    recommendations.forEach(rec => {
        const tr = document.createElement('tr');

        let priorityClass = 'badge-warning'; // Default Media
        if (rec.priority === 'Alta') priorityClass = 'badge-danger';
        if (rec.priority === 'Baja') priorityClass = 'badge-success';

        // Custom badge styles for this view if not in main.css
        const badgeStyle = rec.priority === 'Alta'
            ? 'background-color: #ffebee; color: #c62828; padding: 5px 10px; border-radius: 15px; font-size: 0.85em; font-weight: 600;'
            : 'background-color: #fff3e0; color: #ef6c00; padding: 5px 10px; border-radius: 15px; font-size: 0.85em; font-weight: 600;';

        tr.innerHTML = `
            <td>${rec.type}</td>
            <td>${rec.product}</td>
            <td>${rec.recommendation}</td>
            <td>${rec.impact}</td>
            <td><span style="${badgeStyle}">${rec.priority}</span></td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="applyRecommendation('${rec.product}')">${rec.action}</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Placeholder Actions
function configureAI() {
    alert('Configuración de IA en desarrollo');
}

function generateAIReport() {
    alert('Generando reporte de IA...');
}

function applyRecommendation(productName) {
    alert(`Aplicando recomendación para: ${productName}`);
}

// Expose globally
window.initAIRecommendations = initAIRecommendations;
window.configureAI = configureAI;
window.generateAIReport = generateAIReport;
window.applyRecommendation = applyRecommendation;
