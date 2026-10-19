/**
 * Dashboard View Controller (Arabic 100%)
 */

async function renderDashboard() {
    const container = document.getElementById('view-dashboard');
    if (!container) return;

    if (typeof showLoader === 'function') showLoader();

    try {
        // Fetch operations and stats from Firestore
        const [receiptsSnap, deliveriesSnap, movesSnap] = await Promise.all([
            db.collection('receipts').get(),
            db.collection('deliveries').get(),
            db.collection('move_history').orderBy('timestamp', 'desc').limit(10).get()
        ]);

        const receipts = receiptsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const deliveries = deliveriesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const recentMoves = movesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // حساب الإحصائيات
        const rLate = receipts.filter(r => r.status === 'draft' || r.status === 'waiting').length;
        const rWaiting = receipts.filter(r => r.status === 'ready').length;
        const rTotal = receipts.length;

        const dLate = deliveries.filter(d => d.status === 'draft' || d.status === 'waiting').length;
        const dWaiting = deliveries.filter(d => d.status === 'ready').length;
        const dTotal = deliveries.length;

        container.innerHTML = `
            <div class="page-header" style="margin-bottom: 1.5rem;">
                <h2 style="font-weight: 700;">لوحة التحكم</h2>
            </div>

            <!-- كروت الإحصائيات الرئيسية -->
            <div class="kpi-grid">
                <div class="kpi-card" onclick="navigateTo('receipts')" style="cursor: pointer;">
                    <div class="kpi-title" style="font-weight: 600;">أذون الاستلام (الوارد)</div>
                    <div class="kpi-main-stat" style="font-size: 2.5rem; font-weight: bold; margin: 10px 0;">${rTotal}</div>
                    <div class="kpi-details">
                        <div class="kpi-row" style="display:flex; justify-content:space-between; margin-bottom:5px;">
                            <span>متأخر</span>
                            <span class="val text-danger" style="font-weight: bold; color: #dc3545;">${rLate}</span>
                        </div>
                        <div class="kpi-row" style="display:flex; justify-content:space-between; margin-bottom:5px;">
                            <span>قيد الانتظار</span>
                            <span class="val text-warning" style="font-weight: bold; color: #ffc107;">${rWaiting}</span>
                        </div>
                        <div class="kpi-row" style="display:flex; justify-content:space-between;">
                            <span>إجمالي العمليات</span>
                            <span class="val" style="font-weight: bold;">${rTotal}</span>
                        </div>
                    </div>
                </div>

                <div class="kpi-card" onclick="navigateTo('deliveries')" style="cursor: pointer;">
                    <div class="kpi-title" style="font-weight: 600;">أذون الصرف (المنصرف)</div>
                    <div class="kpi-main-stat" style="font-size: 2.5rem; font-weight: bold; margin: 10px 0;">${dTotal}</div>
                    <div class="kpi-details">
                        <div class="kpi-row" style="display:flex; justify-content:space-between; margin-bottom:5px;">
                            <span>متأخر</span>
                            <span class="val text-danger" style="font-weight: bold; color: #dc3545;">${dLate}</span>
                        </div>
                        <div class="kpi-row" style="display:flex; justify-content:space-between; margin-bottom:5px;">
                            <span>قيد الانتظار</span>
                            <span class="val text-warning" style="font-weight: bold; color: #ffc107;">${dWaiting}</span>
                        </div>
                        <div class="kpi-row" style="display:flex; justify-content:space-between;">
                            <span>إجمالي العمليات</span>
                            <span class="val" style="font-weight: bold;">${dTotal}</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- جدول العمليات الأخيرة -->
            <div class="card mt-4" style="background:#fff; border-radius:8px; border:1px solid #e5e7eb; margin-top:1.5rem;">
                <div class="card-header d-flex justify-between align-center" style="padding: 1rem 1.25rem; border-bottom:1px solid #e5e7eb; display:flex; justify-content:space-between; align-items:center;">
                    <h3 style="font-size: 1.1rem; font-weight: 600; margin:0;">أحدث الحركات والعمليات (آخر 10)</h3>
                    <div class="table-filters" style="display:flex; gap:6px;">
                        <button class="btn btn-sm btn-secondary active" onclick="filterDashboardMoves('all', this)">الكل</button>
                        <button class="btn btn-sm btn-secondary" onclick="filterDashboardMoves('receipt', this)">الوارد</button>
                        <button class="btn btn-sm btn-secondary" onclick="filterDashboardMoves('delivery', this)">المنصرف</button>
                        <button class="btn btn-sm btn-secondary" onclick="filterDashboardMoves('transfer', this)">التحويلات</button>
                    </div>
                </div>
                <div class="card-body p-0">
                    <div class="table-responsive">
                        <table class="table" id="dashboard-recent-table" style="width:100%; border-collapse:collapse; text-align:right;">
                            <thead>
                                <tr style="background:#f9fafb; border-bottom:1px solid #e5e7eb;">
                                    <th style="padding:10px 14px;">رقم المرجع / الإذن</th>
                                    <th style="padding:10px 14px;">نوع العملية</th>
                                    <th style="padding:10px 14px;">العميل / المورد</th>
                                    <th style="padding:10px 14px;">من</th>
                                    <th style="padding:10px 14px;">إلى</th>
                                    <th style="padding:10px 14px;">الكمية</th>
                                    <th style="padding:10px 14px;">الحالة</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${recentMoves.length === 0 ? `
                                    <tr>
                                        <td colspan="7" class="text-center py-4" style="text-align:center; padding:20px; color:#6b7280;">لا توجد حركات مسجلة حالياً</td>
                                    </tr>
                                ` : recentMoves.map(m => `
                                    <tr class="move-row type-${m.type || 'unknown'}" style="border-bottom:1px solid #f3f4f6;">
                                        <td style="padding:10px 14px;"><strong>${m.reference || '-'}</strong></td>
                                        <td style="padding:10px 14px;">${translateMoveType(m.type)}</td>
                                        <td style="padding:10px 14px;">${m.contact || '-'}</td>
                                        <td style="padding:10px 14px;">${translateLocation(m.fromLocation || m.from)}</td>
                                        <td style="padding:10px 14px;">${translateLocation(m.toLocation || m.to)}</td>
                                        <td style="padding:10px 14px;">
                                            <span style="font-weight:bold; color: ${m.quantity > 0 ? '#10b981' : '#ef4444'};">
                                                ${m.quantity || 0}
                                            </span>
                                        </td>
                                        <td style="padding:10px 14px;">
                                            <span class="badge ${getStatusBadgeClass(m.status)}" style="padding:4px 8px; border-radius:4px; font-size:0.85rem;">
                                                ${translateStatus(m.status)}
                                            </span>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <!-- قسم الرسم البياني -->
            <div class="card mt-4" style="background:#fff; border-radius:8px; border:1px solid #e5e7eb; margin-top:1.5rem; padding:1.25rem;">
                <div class="card-header" style="margin-bottom:1rem;">
                    <h3 style="font-size: 1.1rem; font-weight: 600; margin:0;">📊 تحليلات حركة المخزون</h3>
                </div>
                <div class="card-body">
                    <div class="chart-container" style="position: relative; height:300px;">
                        <canvas id="dashboardChart"></canvas>
                    </div>
                </div>
            </div>
        `;

        if (typeof initDashboardChart === 'function') {
            initDashboardChart(receipts, deliveries);
        }

    } catch (err) {
        console.error('Error rendering dashboard:', err);
        if (typeof showToast === 'function') showToast('حدث خطأ أثناء تحميل لوحة التحكم', 'error');
    } finally {
        if (typeof hideLoader === 'function') hideLoader();
    }
}

// ترجمة نوع العملية
function translateMoveType(type) {
    switch (type) {
        case 'receipt': return '<span style="color:#10b981; font-weight:600;">إذن استلام (وارد)</span>';
        case 'delivery': return '<span style="color:#ef4444; font-weight:600;">إذن صرف (منصرف)</span>';
        case 'transfer': return '<span style="color:#3b82f6; font-weight:600;">تحويل داخلي</span>';
        case 'adjustment': return '<span style="color:#f59e0b; font-weight:600;">تسوية مخزنية</span>';
        default: return type || '-';
    }
}

// ترجمة الأماكن والمستودعات الشائعة
function translateLocation(loc) {
    if (!loc) return '-';
    if (loc === 'Main Warehouse') return 'المستودع الرئيسي';
    if (loc === 'BuildCo HQ') return 'مقر شركة بيلدكو';
    if (loc === 'Acme Corp') return 'شركة أكمي';
    return loc;
}

// ترجمة الحالات
function translateStatus(status) {
    switch (status) {
        case 'draft': return 'مسودة';
        case 'waiting': return 'قيد الانتظار';
        case 'ready': return 'جاهز';
        case 'done': return 'مكتمل';
        case 'cancelled': return 'ملغي';
        default: return status || 'مكتمل';
    }
}

function getStatusBadgeClass(status) {
    switch (status) {
        case 'done': return 'badge-success';
        case 'ready': return 'badge-primary';
        case 'waiting': return 'badge-warning';
        case 'draft': return 'badge-secondary';
        case 'cancelled': return 'badge-danger';
        default: return 'badge-success';
    }
}

function filterDashboardMoves(type, btn) {
    const buttons = btn.parentElement.querySelectorAll('button');
    buttons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    const rows = document.querySelectorAll('#dashboard-recent-table tbody tr.move-row');
    rows.forEach(r => {
        if (type === 'all' || r.classList.contains(`type-${type}`)) {
            r.style.display = '';
        } else {
            r.style.display = 'none';
        }
    });
}

function initDashboardChart(receipts, deliveries) {
    const ctx = document.getElementById('dashboardChart');
    if (!ctx) return;

    if (window.myDashboardChart) {
        window.myDashboardChart.destroy();
    }

    window.myDashboardChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['أذون الاستلام (الوارد)', 'أذون الصرف (المنصرف)'],
            datasets: [{
                label: 'إجمالي العمليات المسجلة',
                data: [receipts.length, deliveries.length],
                backgroundColor: ['#10B981', '#EF4444'],
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        font: { family: 'Cairo' }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { precision: 0 }
                }
            }
        }
    });
}
