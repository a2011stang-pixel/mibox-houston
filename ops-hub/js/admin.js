// Admin Dashboard Main Script
let zones = [];
let promotions = [];
let currentPage = 'dashboard';

// Check authentication on load
document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('admin_token');
    const expires = localStorage.getItem('admin_token_expires');

    if (!token || (expires && Date.now() > parseInt(expires))) {
        window.location.href = '/ops-hub/login.html';
        return;
    }

    try {
        const user = await api.getMe();
        document.getElementById('userEmail').textContent = user.email;
        await loadDashboard();
    } catch (err) {
        window.location.href = '/ops-hub/login.html';
    }
});

// Navigation
document.querySelectorAll('[data-page]').forEach(link => {
    link.addEventListener('click', async (e) => {
        e.preventDefault();
        const page = e.target.closest('[data-page]').dataset.page;
        await navigateTo(page);
    });
});

async function navigateTo(page) {
    document.querySelectorAll('.page-content').forEach(p => p.classList.add('d-none'));
    document.querySelectorAll('[data-page]').forEach(l => l.classList.remove('active'));

    document.getElementById('page-' + page).classList.remove('d-none');
    document.querySelector('[data-page="' + page + '"]').classList.add('active');

    currentPage = page;

    switch (page) {
        case 'dashboard': await loadDashboard(); break;
        case 'zones': await loadZones(); break;
        case 'zips': await loadZips(); break;
        case 'pricing': await loadPricing(); break;
        case 'promotions': await loadPromotions(); break;
        case 'audit': await loadAudit(); break;
    }
}

// Logout
document.getElementById('logoutBtn').addEventListener('click', async (e) => {
    e.preventDefault();
    await api.logout();
    window.location.href = '/ops-hub/login.html';
});

// Toast notifications
function showToast(title, message, type = 'success') {
    const toast = document.getElementById('toast');
    const toastTitle = document.getElementById('toastTitle');
    const toastBody = document.getElementById('toastBody');

    toast.className = 'toast';
    if (type === 'error') toast.classList.add('bg-danger', 'text-white');
    else if (type === 'success') toast.classList.add('bg-success', 'text-white');

    toastTitle.textContent = title;
    toastBody.textContent = message;

    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();
}

// Utility: Format currency from cents
function formatCurrency(cents) {
    return '$' + (cents / 100).toFixed(2);
}

// Utility: Escape HTML for XSS safety
function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// ============================================================
// Dashboard
// ============================================================
async function loadDashboard() {
    try {
        const zonesData = await api.getZones();
        zones = zonesData.zones;

        const zipsData = await api.getZips({ limit: 1 });
        const auditData = await api.getAudit({ limit: 1 });

        document.getElementById('statZones').textContent = zones.length;
        document.getElementById('statZips').textContent = zipsData.total;
        document.getElementById('statChanges').textContent = auditData.total;

        const tbody = document.getElementById('zoneSummaryTable');
        tbody.innerHTML = zones.map(z =>
            '<tr><td>' + escapeHtml(z.name) + '</td><td>' + escapeHtml(z.display_name) + '</td><td>' +
            formatCurrency(z.delivery_fee) + '</td><td>' + (z.zip_count || 0) + '</td></tr>'
        ).join('');
    } catch (err) {
        showToast('Error', err.message, 'error');
    }
}

// ============================================================
// Zones
// ============================================================
async function loadZones() {
    try {
        const data = await api.getZones();
        zones = data.zones;

        const tbody = document.getElementById('zonesTable');
        tbody.innerHTML = zones.map(z =>
            '<tr>' +
            '<td><code>' + escapeHtml(z.name) + '</code></td>' +
            '<td>' + escapeHtml(z.display_name) + '</td>' +
            '<td>' + formatCurrency(z.delivery_fee) + '</td>' +
            '<td>' + formatCurrency(z.pickup_fee) + '</td>' +
            '<td>' + formatCurrency(z.relocation_fee) + '</td>' +
            '<td>' + (z.zip_count || 0) + '</td>' +
            '<td><span class="badge ' + (z.is_active ? 'badge-active' : 'badge-inactive') + '">' +
                (z.is_active ? 'Active' : 'Inactive') + '</span></td>' +
            '<td>' +
                '<button class="btn btn-sm btn-outline-primary me-1" onclick="editZone(' + z.id + ')">' +
                    '<i class="bi bi-pencil"></i></button>' +
                '<button class="btn btn-sm btn-outline-danger" onclick="deleteZone(' + z.id + ')">' +
                    '<i class="bi bi-trash"></i></button>' +
            '</td></tr>'
        ).join('');
    } catch (err) {
        showToast('Error', err.message, 'error');
    }
}

document.getElementById('addZoneBtn').addEventListener('click', () => {
    document.getElementById('zoneModalTitle').textContent = 'Add Zone';
    document.getElementById('zoneForm').reset();
    document.getElementById('zoneId').value = '';
    document.getElementById('zoneName').disabled = false;
    new bootstrap.Modal(document.getElementById('zoneModal')).show();
});

async function editZone(id) {
    const zone = zones.find(z => z.id === id);
    if (!zone) return;

    document.getElementById('zoneModalTitle').textContent = 'Edit Zone';
    document.getElementById('zoneId').value = zone.id;
    document.getElementById('zoneName').value = zone.name;
    document.getElementById('zoneName').disabled = true;
    document.getElementById('zoneDisplayName').value = zone.display_name;
    document.getElementById('zoneDeliveryFee').value = (zone.delivery_fee / 100).toFixed(2);
    document.getElementById('zonePickupFee').value = (zone.pickup_fee / 100).toFixed(2);
    document.getElementById('zoneRelocationFee').value = (zone.relocation_fee / 100).toFixed(2);

    new bootstrap.Modal(document.getElementById('zoneModal')).show();
}
window.editZone = editZone;

async function deleteZone(id) {
    if (!confirm('Are you sure you want to delete this zone?')) return;

    try {
        await api.deleteZone(id);
        showToast('Success', 'Zone deleted');
        await loadZones();
    } catch (err) {
        showToast('Error', err.message, 'error');
    }
}
window.deleteZone = deleteZone;

document.getElementById('zoneForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const id = document.getElementById('zoneId').value;
    const data = {
        name: document.getElementById('zoneName').value,
        display_name: document.getElementById('zoneDisplayName').value,
        delivery_fee: Math.round(parseFloat(document.getElementById('zoneDeliveryFee').value) * 100),
        pickup_fee: Math.round(parseFloat(document.getElementById('zonePickupFee').value) * 100),
        relocation_fee: Math.round(parseFloat(document.getElementById('zoneRelocationFee').value) * 100),
    };

    try {
        if (id) {
            await api.updateZone(id, data);
            showToast('Success', 'Zone updated');
        } else {
            await api.createZone(data);
            showToast('Success', 'Zone created');
        }
        bootstrap.Modal.getInstance(document.getElementById('zoneModal')).hide();
        await loadZones();
    } catch (err) {
        showToast('Error', err.message, 'error');
    }
});

// ============================================================
// ZIP Codes
// ============================================================
let zipPage = 0;
const zipLimit = 50;

async function loadZips() {
    await loadZoneFilter();
    await refreshZips();
}

async function loadZoneFilter() {
    try {
        const data = await api.getZones();
        zones = data.zones;

        const select = document.getElementById('zipZoneFilter');
        select.innerHTML = '<option value="">All Zones</option>' +
            zones.map(z => '<option value="' + z.id + '">' + escapeHtml(z.display_name) + '</option>').join('');

        const zipZoneSelect = document.getElementById('zipZone');
        zipZoneSelect.innerHTML = zones.map(z =>
            '<option value="' + z.id + '">' + escapeHtml(z.display_name) + '</option>'
        ).join('');
    } catch (err) {
        showToast('Error', err.message, 'error');
    }
}

async function refreshZips() {
    const search = document.getElementById('zipSearch').value;
    const zone = document.getElementById('zipZoneFilter').value;

    try {
        const data = await api.getZips({
            search: search || undefined,
            zone_id: zone || undefined,
            limit: zipLimit,
            offset: zipPage * zipLimit,
        });

        const tbody = document.getElementById('zipsTable');
        tbody.innerHTML = data.zips.map(z =>
            '<tr>' +
            '<td><code>' + escapeHtml(z.zip) + '</code></td>' +
            '<td>' + (z.zone_display_name ? escapeHtml(z.zone_display_name) : '<span class="text-muted">Unassigned</span>') + '</td>' +
            '<td>' + new Date(z.updated_at * 1000).toLocaleDateString() + '</td>' +
            '<td>' +
                '<button class="btn btn-sm btn-outline-primary me-1" onclick="editZip(\'' + z.zip + '\', ' + z.zone_id + ')">' +
                    '<i class="bi bi-pencil"></i></button>' +
                '<button class="btn btn-sm btn-outline-danger" onclick="deleteZip(\'' + z.zip + '\')">' +
                    '<i class="bi bi-trash"></i></button>' +
            '</td></tr>'
        ).join('');

        renderPagination('zipsPagination', data.total, zipLimit, zipPage, (p) => {
            zipPage = p;
            refreshZips();
        });
    } catch (err) {
        showToast('Error', err.message, 'error');
    }
}

document.getElementById('zipSearch').addEventListener('input', debounce(refreshZips, 300));
document.getElementById('zipZoneFilter').addEventListener('change', () => { zipPage = 0; refreshZips(); });

document.getElementById('addZipBtn').addEventListener('click', () => {
    document.getElementById('zipForm').reset();
    document.getElementById('zipCode').disabled = false;
    new bootstrap.Modal(document.getElementById('zipModal')).show();
});

async function editZip(zip, zoneId) {
    document.getElementById('zipCode').value = zip;
    document.getElementById('zipCode').disabled = true;
    document.getElementById('zipZone').value = zoneId;
    new bootstrap.Modal(document.getElementById('zipModal')).show();
}
window.editZip = editZip;

async function deleteZip(zip) {
    if (!confirm('Remove ZIP code ' + zip + ' from service area?')) return;

    try {
        await api.deleteZip(zip);
        showToast('Success', 'ZIP code removed');
        await refreshZips();
    } catch (err) {
        showToast('Error', err.message, 'error');
    }
}
window.deleteZip = deleteZip;

document.getElementById('zipForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const zip = document.getElementById('zipCode').value;
    const zoneId = parseInt(document.getElementById('zipZone').value);

    try {
        await api.updateZip(zip, { zone_id: zoneId });
        showToast('Success', 'ZIP code saved');
        bootstrap.Modal.getInstance(document.getElementById('zipModal')).hide();
        await refreshZips();
    } catch (err) {
        showToast('Error', err.message, 'error');
    }
});

document.getElementById('exportZipsBtn').addEventListener('click', () => {
    window.open(api.getExportZipsUrl(), '_blank');
});

document.getElementById('importZipsBtn').addEventListener('click', () => {
    document.getElementById('importForm').reset();
    document.getElementById('importPreview').classList.add('d-none');
    new bootstrap.Modal(document.getElementById('importModal')).show();
});

document.getElementById('csvFile').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        const lines = event.target.result.split('\n').slice(0, 6);
        document.getElementById('importPreviewText').textContent = lines.join('\n');
        document.getElementById('importPreview').classList.remove('d-none');
    };
    reader.readAsText(file);
});

document.getElementById('importForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const file = document.getElementById('csvFile').files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
        try {
            const result = await api.importZips(event.target.result);
            showToast('Import Complete', 'Imported ' + result.imported + ' ZIP codes. Errors: ' + result.errors.length);
            bootstrap.Modal.getInstance(document.getElementById('importModal')).hide();
            await refreshZips();
        } catch (err) {
            showToast('Error', err.message, 'error');
        }
    };
    reader.readAsText(file);
});

// ============================================================
// Pricing
// ============================================================
async function loadPricing() {
    try {
        const data = await api.getPricing();

        for (const p of data.raw) {
            const id = 'price_' + p.container_size + '_' + p.rate_type;
            const input = document.getElementById(id);
            if (input) {
                input.value = (p.amount / 100).toFixed(2);
            }
        }
    } catch (err) {
        showToast('Error', err.message, 'error');
    }
}

document.getElementById('pricingForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const updates = [
        { container_size: '16', rate_type: 'first_month', amount: Math.round(parseFloat(document.getElementById('price_16_first_month').value) * 100) },
        { container_size: '16', rate_type: 'onsite', amount: Math.round(parseFloat(document.getElementById('price_16_onsite').value) * 100) },
        { container_size: '16', rate_type: 'facility_inside', amount: Math.round(parseFloat(document.getElementById('price_16_facility_inside').value) * 100) },
        { container_size: '16', rate_type: 'facility_outside', amount: Math.round(parseFloat(document.getElementById('price_16_facility_outside').value) * 100) },
        { container_size: '20', rate_type: 'first_month', amount: Math.round(parseFloat(document.getElementById('price_20_first_month').value) * 100) },
        { container_size: '20', rate_type: 'onsite', amount: Math.round(parseFloat(document.getElementById('price_20_onsite').value) * 100) },
        { container_size: '20', rate_type: 'facility_inside', amount: Math.round(parseFloat(document.getElementById('price_20_facility_inside').value) * 100) },
        { container_size: '20', rate_type: 'facility_outside', amount: Math.round(parseFloat(document.getElementById('price_20_facility_outside').value) * 100) },
    ];

    try {
        for (const update of updates) {
            await api.updatePricing(update);
        }
        showToast('Success', 'Pricing updated');
    } catch (err) {
        showToast('Error', err.message, 'error');
    }
});

// ============================================================
// Promotions
// ============================================================

async function loadPromotions() {
    try {
        const data = await api.getPromotions();
        promotions = data.promotions;

        // Update stats
        const now = new Date().toISOString().split('T')[0];
        const active = promotions.filter(p => p.is_active && p.start_date <= now && p.end_date >= now);
        const scheduled = promotions.filter(p => p.is_active && p.start_date > now);

        document.getElementById('promoActiveCount').textContent = active.length;
        document.getElementById('promoScheduledCount').textContent = scheduled.length;
        document.getElementById('promoTotalCount').textContent = promotions.length;

        const tbody = document.getElementById('promotionsTable');
        if (promotions.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted py-4">No promotions yet. Click "Create Promotion" to get started.</td></tr>';
            return;
        }

        tbody.innerHTML = promotions.map(p => {
            const appliesTo = safeJsonParse(p.applies_to, []);
            const status = getPromoStatus(p);
            const containerLabel = p.container_sizes === 'all' ? 'All' : p.container_sizes + '-ft Only';

            return '<tr>' +
                '<td><strong>' + escapeHtml(p.name) + '</strong>' +
                    (p.promo_code ? '<br><code class="small text-muted">' + escapeHtml(p.promo_code) + '</code>' : '') + '</td>' +
                '<td><span class="badge badge-' + p.discount_type + '">' +
                    (p.discount_type === 'percent' ? '% Off' : '$ Off') + '</span></td>' +
                '<td><strong>' + formatDiscount(p) + '</strong></td>' +
                '<td>' + appliesTo.map(a => '<span class="tag">' + escapeHtml(a) + '</span>').join(' ') + '</td>' +
                '<td><span class="tag">' + escapeHtml(containerLabel) + '</span></td>' +
                '<td class="small">' + formatDateRange(p.start_date, p.end_date) + '</td>' +
                '<td><span class="badge badge-' + status + '">' + capitalize(status) + '</span></td>' +
                '<td class="text-nowrap">' +
                    '<button class="btn btn-sm btn-outline-primary me-1" onclick="editPromotion(' + p.id + ')" title="Edit">' +
                        '<i class="bi bi-pencil"></i></button>' +
                    '<button class="btn btn-sm btn-outline-primary me-1" onclick="togglePromotion(' + p.id + ')" title="' + (p.is_active ? 'Deactivate' : 'Activate') + '">' +
                        '<i class="bi bi-' + (p.is_active ? 'toggle-on' : 'toggle-off') + '"></i></button>' +
                    '<button class="btn btn-sm btn-outline-danger" onclick="deletePromotion(' + p.id + ')" title="Delete">' +
                        '<i class="bi bi-trash"></i></button>' +
                '</td></tr>';
        }).join('');
    } catch (err) {
        showToast('Error', err.message, 'error');
    }
}

function getPromoStatus(p) {
    if (!p.is_active) return 'inactive';
    const now = new Date().toISOString().split('T')[0];
    if (p.start_date > now) return 'scheduled';
    if (p.end_date < now) return 'expired';
    return 'active';
}

function formatDiscount(p) {
    if (p.discount_type === 'percent') return p.discount_value + '%';
    return '$' + Number(p.discount_value).toFixed(2);
}

function formatDateRange(start, end) {
    const fmt = d => {
        if (!d) return '';
        const date = new Date(d + 'T00:00:00');
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };
    if (start && end) return fmt(start) + ' &ndash; ' + fmt(end);
    if (start) return 'From ' + fmt(start);
    if (end) return 'Until ' + fmt(end);
    return 'Always';
}

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function safeJsonParse(str, fallback) {
    try { return JSON.parse(str); } catch { return fallback; }
}

// Discount type prefix toggle
document.getElementById('promoDiscountType').addEventListener('change', updateDiscountPrefix);

function updateDiscountPrefix() {
    const type = document.getElementById('promoDiscountType').value;
    const prefix = document.getElementById('promoValuePrefix');
    const input = document.getElementById('promoDiscountValue');
    if (type === 'percent') {
        prefix.textContent = '%';
        input.max = 100;
        input.step = '1';
    } else {
        prefix.textContent = '$';
        input.removeAttribute('max');
        input.step = '0.01';
    }
}

// Add Promotion
document.getElementById('addPromoBtn').addEventListener('click', () => {
    document.getElementById('promoModalTitle').textContent = 'Create Promotion';
    document.getElementById('promoForm').reset();
    document.getElementById('promoId').value = '';
    document.getElementById('promoActive').checked = true;
    document.getElementById('promoSizeAll').checked = true;
    updateDiscountPrefix();
    new bootstrap.Modal(document.getElementById('promoModal')).show();
});

// Edit Promotion
async function editPromotion(id) {
    const promo = promotions.find(p => p.id === id);
    if (!promo) return;

    document.getElementById('promoModalTitle').textContent = 'Edit Promotion';
    document.getElementById('promoId').value = promo.id;
    document.getElementById('promoName').value = promo.name;
    document.getElementById('promoDiscountType').value = promo.discount_type;
    document.getElementById('promoDiscountValue').value = promo.discount_value;

    const appliesTo = safeJsonParse(promo.applies_to, []);
    document.getElementById('promoAppliesRent').checked = appliesTo.includes('rent');
    document.getElementById('promoAppliesDelivery').checked = appliesTo.includes('delivery');
    document.getElementById('promoAppliesPickup').checked = appliesTo.includes('pickup');
    document.getElementById('promoAppliesRelocation').checked = appliesTo.includes('relocation');

    // Container sizes radio
    const sizeVal = promo.container_sizes || 'all';
    const sizeRadio = document.querySelector('input[name="promoContainerSize"][value="' + sizeVal + '"]');
    if (sizeRadio) sizeRadio.checked = true;

    document.getElementById('promoStartDate').value = promo.start_date || '';
    document.getElementById('promoEndDate').value = promo.end_date || '';
    document.getElementById('promoCode').value = promo.promo_code || '';
    document.getElementById('promoNotes').value = promo.notes || '';
    document.getElementById('promoActive').checked = !!promo.is_active;

    updateDiscountPrefix();
    new bootstrap.Modal(document.getElementById('promoModal')).show();
}
window.editPromotion = editPromotion;

// Toggle Promotion
async function togglePromotion(id) {
    const promo = promotions.find(p => p.id === id);
    if (!promo) return;

    try {
        await api.updatePromotion(id, { is_active: promo.is_active ? 0 : 1 });
        showToast('Success', 'Promotion ' + (promo.is_active ? 'deactivated' : 'activated'));
        await loadPromotions();
    } catch (err) {
        showToast('Error', err.message, 'error');
    }
}
window.togglePromotion = togglePromotion;

// Delete Promotion
async function deletePromotion(id) {
    if (!confirm('Are you sure you want to delete this promotion?')) return;

    try {
        await api.deletePromotion(id);
        showToast('Success', 'Promotion deleted');
        await loadPromotions();
    } catch (err) {
        showToast('Error', err.message, 'error');
    }
}
window.deletePromotion = deletePromotion;

// Save Promotion
document.getElementById('promoForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const id = document.getElementById('promoId').value;
    const discountType = document.getElementById('promoDiscountType').value;
    const rawValue = parseFloat(document.getElementById('promoDiscountValue').value);

    // Gather applies_to checkboxes
    const appliesTo = [];
    if (document.getElementById('promoAppliesRent').checked) appliesTo.push('rent');
    if (document.getElementById('promoAppliesDelivery').checked) appliesTo.push('delivery');
    if (document.getElementById('promoAppliesPickup').checked) appliesTo.push('pickup');
    if (document.getElementById('promoAppliesRelocation').checked) appliesTo.push('relocation');

    if (appliesTo.length === 0) {
        showToast('Validation', 'Select at least one "Applies To" option', 'error');
        return;
    }

    // Validate discount
    if (discountType === 'percent' && (rawValue < 1 || rawValue > 100)) {
        showToast('Validation', 'Percentage must be between 1 and 100', 'error');
        return;
    }
    if (rawValue <= 0) {
        showToast('Validation', 'Discount value must be greater than 0', 'error');
        return;
    }

    // Validate dates
    const startDate = document.getElementById('promoStartDate').value;
    const endDate = document.getElementById('promoEndDate').value;
    if (!startDate || !endDate) {
        showToast('Validation', 'Start and end dates are required', 'error');
        return;
    }
    if (endDate <= startDate) {
        showToast('Validation', 'End date must be after start date', 'error');
        return;
    }

    // Get container size
    const containerSize = document.querySelector('input[name="promoContainerSize"]:checked').value;

    const data = {
        name: document.getElementById('promoName').value,
        discount_type: discountType,
        discount_value: rawValue,
        applies_to: JSON.stringify(appliesTo),
        container_sizes: containerSize,
        start_date: startDate,
        end_date: endDate,
        promo_code: document.getElementById('promoCode').value || null,
        notes: document.getElementById('promoNotes').value || null,
        is_active: document.getElementById('promoActive').checked ? 1 : 0,
    };

    try {
        if (id) {
            await api.updatePromotion(id, data);
            showToast('Success', 'Promotion updated');
        } else {
            await api.createPromotion(data);
            showToast('Success', 'Promotion created');
        }
        bootstrap.Modal.getInstance(document.getElementById('promoModal')).hide();
        await loadPromotions();
    } catch (err) {
        showToast('Error', err.message, 'error');
    }
});

// ============================================================
// Audit Log
// ============================================================
let auditPage = 0;
const auditLimit = 50;

async function loadAudit() {
    await refreshAudit();
}

async function refreshAudit() {
    const fromDate = document.getElementById('auditFromDate').value;
    const toDate = document.getElementById('auditToDate').value;
    const type = document.getElementById('auditTypeFilter').value;

    try {
        const data = await api.getAudit({
            from: fromDate || undefined,
            to: toDate || undefined,
            type: type || undefined,
            limit: auditLimit,
            offset: auditPage * auditLimit,
        });

        const tbody = document.getElementById('auditTable');
        tbody.innerHTML = data.entries.map(e =>
            '<tr>' +
            '<td class="small">' + new Date(e.created_at * 1000).toLocaleString() + '</td>' +
            '<td>' + escapeHtml(e.user_email) + '</td>' +
            '<td><code>' + escapeHtml(e.action) + '</code></td>' +
            '<td>' + escapeHtml(e.entity_type) + (e.entity_id ? ' #' + escapeHtml(e.entity_id) : '') + '</td>' +
            '<td class="small">' + formatChanges(e.old_value, e.new_value) + '</td>' +
            '</tr>'
        ).join('');

        renderPagination('auditPagination', data.total, auditLimit, auditPage, (p) => {
            auditPage = p;
            refreshAudit();
        });
    } catch (err) {
        showToast('Error', err.message, 'error');
    }
}

document.getElementById('applyAuditFilters').addEventListener('click', () => {
    auditPage = 0;
    refreshAudit();
});

document.getElementById('exportAuditBtn').addEventListener('click', () => {
    const fromDate = document.getElementById('auditFromDate').value;
    const toDate = document.getElementById('auditToDate').value;
    window.open(api.getExportAuditUrl({ from: fromDate, to: toDate }), '_blank');
});

function formatChanges(oldVal, newVal) {
    if (!oldVal && !newVal) return '-';
    if (!oldVal) return '<span class="text-success">Created</span>';
    if (!newVal) return '<span class="text-danger">Deleted</span>';
    return '<span class="text-warning">Modified</span>';
}

// ============================================================
// Utilities
// ============================================================
function debounce(fn, delay) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => fn.apply(this, args), delay);
    };
}

function renderPagination(containerId, total, limit, currentPage, onPageChange) {
    const totalPages = Math.ceil(total / limit);
    if (totalPages <= 1) {
        document.getElementById(containerId).innerHTML = '';
        return;
    }

    let html = '<ul class="pagination pagination-sm justify-content-center">';

    if (currentPage > 0) {
        html += '<li class="page-item"><a class="page-link" href="#" data-page="' + (currentPage - 1) + '">Previous</a></li>';
    }

    for (let i = 0; i < totalPages; i++) {
        if (i === currentPage) {
            html += '<li class="page-item active"><span class="page-link">' + (i + 1) + '</span></li>';
        } else if (i < 3 || i >= totalPages - 3 || Math.abs(i - currentPage) < 2) {
            html += '<li class="page-item"><a class="page-link" href="#" data-page="' + i + '">' + (i + 1) + '</a></li>';
        } else if (i === 3 || i === totalPages - 4) {
            html += '<li class="page-item disabled"><span class="page-link">...</span></li>';
        }
    }

    if (currentPage < totalPages - 1) {
        html += '<li class="page-item"><a class="page-link" href="#" data-page="' + (currentPage + 1) + '">Next</a></li>';
    }

    html += '</ul>';

    const container = document.getElementById(containerId);
    container.innerHTML = html;

    container.querySelectorAll('[data-page]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            onPageChange(parseInt(e.target.dataset.page));
        });
    });
}
