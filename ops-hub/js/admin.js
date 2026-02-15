// Admin Dashboard Main Script
let zones = [];
let promotions = [];
let reviews = [];
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
        case 'quick-quote': await loadQuickQuote(); break;
        case 'advanced-quote': await loadAdvancedQuote(); break;
        case 'quote-history': await loadQuoteHistory(); break;
        case 'audit': await loadAudit(); break;
        case 'reviews': await loadReviews(); break;
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

        // Load quote stats
        try {
            const stats = await api.getQuoteStats();
            document.getElementById('statQuotesWeek').textContent = stats.this_week;
            document.getElementById('statConvertedWeek').textContent = stats.converted_this_week;
            document.getElementById('statQuotesDraft').textContent = stats.draft_count + stats.sent_count;
        } catch (e) {
            // Non-critical - quote tables may not exist yet
        }
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
        const params = { limit: auditLimit, offset: auditPage * auditLimit };
        if (fromDate) params.from = fromDate;
        if (toDate) params.to = toDate;
        if (type) params.type = type;

        const data = await api.getAudit(params);

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
// Quick Quote
// ============================================================
let qqZoneData = null;
let qqPricingData = null;
let qqContainers = [{ size: '16', location: 'onsite' }];
let qqSavedQuoteId = null;
let qqActivePromos = [];
let qqZipDebounceTimer = null;

async function loadQuickQuote() {
    // Reset state
    qqZoneData = null;
    qqPricingData = null;
    qqContainers = [{ size: '16', location: 'onsite' }];
    qqSavedQuoteId = null;

    // Reset form fields
    const fields = ['qqName', 'qqPhone', 'qqEmail', 'qqZip', 'qqAddress', 'qqCity', 'qqPromoCode', 'qqOverride', 'qqOverrideReason', 'qqNotes'];
    fields.forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
    document.getElementById('qqState').value = 'TX';
    document.getElementById('qqServiceType').value = 'Storage at Your Location';
    document.getElementById('qqDeliveryDate').value = '';
    document.getElementById('qqMonths').value = '1';
    document.getElementById('qqPromo').value = '';
    document.getElementById('qqZipStatus').textContent = '';
    document.getElementById('qqZipStatus').className = 'qq-zip-status';
    document.getElementById('qqNumberBadge').style.display = 'none';
    document.getElementById('qqActions').style.display = 'none';
    document.getElementById('qqSaveBtn').disabled = false;
    document.getElementById('qqEmailBtn').disabled = true;
    document.getElementById('qqStellaBtn').disabled = true;

    qqRenderContainers();
    qqRenderSummary();

    // Load promotions for dropdown
    try {
        const data = await api.getPromotions();
        const now = new Date().toISOString().split('T')[0];
        qqActivePromos = (data.promotions || []).filter(p => p.is_active && p.start_date <= now && p.end_date >= now);
        const select = document.getElementById('qqPromo');
        select.innerHTML = '<option value="">No promotion</option>' +
            qqActivePromos.map(p => '<option value="' + p.id + '">' + escapeHtml(p.name) +
                ' (' + (p.discount_type === 'percent' ? p.discount_value + '%' : '$' + Number(p.discount_value).toFixed(2)) + ' off)' +
                '</option>').join('');
    } catch (err) {
        // Non-critical, promos just won't be available
    }
}

function qqRenderContainers() {
    const wrap = document.getElementById('qqContainersWrap');
    wrap.innerHTML = qqContainers.map((c, i) =>
        '<div class="qq-container-item">' +
            '<span style="font-weight:700;color:var(--gray-400);font-size:12px;width:20px;">#' + (i + 1) + '</span>' +
            '<select class="form-select" onchange="qqUpdateContainer(' + i + ', \'size\', this.value)">' +
                '<option value="16"' + (c.size === '16' ? ' selected' : '') + '>16-ft Container</option>' +
                '<option value="20"' + (c.size === '20' ? ' selected' : '') + '>20-ft Container</option>' +
            '</select>' +
            '<select class="form-select" onchange="qqUpdateContainer(' + i + ', \'location\', this.value)">' +
                '<option value="onsite"' + (c.location === 'onsite' ? ' selected' : '') + '>Onsite Storage</option>' +
                '<option value="facility_inside"' + (c.location === 'facility_inside' ? ' selected' : '') + '>Facility Inside</option>' +
                '<option value="facility_outside"' + (c.location === 'facility_outside' ? ' selected' : '') + '>Facility Outside</option>' +
            '</select>' +
            (qqContainers.length > 1
                ? '<button class="btn btn-sm btn-outline-danger btn-remove" onclick="qqRemoveContainer(' + i + ')" type="button"><i class="bi bi-x-lg"></i></button>'
                : '') +
        '</div>'
    ).join('');
}

function qqUpdateContainer(idx, field, value) {
    qqContainers[idx][field === 'size' ? 'size' : 'location'] = value;
    qqRecalculate();
}
window.qqUpdateContainer = qqUpdateContainer;

function qqAddContainer() {
    if (qqContainers.length >= 10) {
        showToast('Limit', 'Maximum 10 containers per quote', 'error');
        return;
    }
    qqContainers.push({ size: '16', location: 'onsite' });
    qqRenderContainers();
    qqRecalculate();
}

function qqRemoveContainer(idx) {
    if (qqContainers.length <= 1) return;
    qqContainers.splice(idx, 1);
    qqRenderContainers();
    qqRecalculate();
}
window.qqRemoveContainer = qqRemoveContainer;

function qqRecalculate() {
    if (!qqZoneData || !qqPricingData) {
        qqRenderSummary();
        return;
    }

    qqRenderSummary();
}

function qqGetPricing() {
    if (!qqZoneData || !qqPricingData) return null;

    const monthly = qqPricingData.monthly || {};
    const firstMonth = qqPricingData.first_month || {};
    const count = qqContainers.length;

    // Build items with rates
    const items = qqContainers.map(c => {
        const sizeRates = monthly[c.size] || {};
        const monthlyRate = sizeRates[c.location] || 0;
        const firstMonthRate = firstMonth[c.size] || monthlyRate;
        return {
            container_size: c.size,
            storage_location: c.location,
            monthly_rate: monthlyRate,      // in dollars
            first_month_rate: firstMonthRate // in dollars
        };
    });

    // Delivery fee per container (from zone, in dollars)
    const deliveryFeeEach = qqZoneData.delivery_fee || 0;
    const deliveryTotal = deliveryFeeEach * count;

    // Monthly subtotal
    let monthlySubtotal = items.reduce((s, i) => s + i.monthly_rate, 0);

    // Override
    const overrideVal = parseFloat(document.getElementById('qqOverride').value);
    const hasOverride = !isNaN(overrideVal) && overrideVal > 0;
    if (hasOverride) {
        monthlySubtotal = overrideVal * count;
    }

    // Multi-container discount (monthly only)
    let multiPct = 0;
    if (count === 2) multiPct = 5;
    else if (count >= 3) multiPct = 10;
    const multiDiscount = monthlySubtotal * multiPct / 100;

    // Promo discount
    let promoDiscount = 0;
    const promoId = document.getElementById('qqPromo').value;
    if (promoId) {
        const promo = qqActivePromos.find(p => p.id === parseInt(promoId));
        if (promo) {
            const appliesTo = safeJsonParse(promo.applies_to, []);
            if (appliesTo.includes('rent')) {
                const applicableMonthly = monthlySubtotal - multiDiscount;
                promoDiscount += promo.discount_type === 'percent'
                    ? applicableMonthly * promo.discount_value / 100
                    : promo.discount_value;
            }
            if (appliesTo.includes('delivery')) {
                promoDiscount += promo.discount_type === 'percent'
                    ? deliveryTotal * promo.discount_value / 100
                    : promo.discount_value;
            }
        }
    }

    const totalMonthly = monthlySubtotal - multiDiscount;
    const firstMonthRent = items.reduce((s, i) => s + i.first_month_rate, 0);
    const firstMonthTotal = firstMonthRent + deliveryTotal - promoDiscount;
    const dueTodayVal = firstMonthTotal;

    return {
        items,
        deliveryFeeEach,
        deliveryTotal,
        monthlySubtotal,
        multiPct,
        multiDiscount,
        promoDiscount,
        totalMonthly,
        firstMonthRent,
        firstMonthTotal,
        dueToday: dueTodayVal,
        hasOverride,
        count,
    };
}

function qqRenderSummary() {
    const body = document.getElementById('qqSummaryBody');
    const pricing = qqGetPricing();

    if (!pricing) {
        body.innerHTML = '<p class="text-muted text-center py-4">Enter a ZIP code to begin</p>';
        document.getElementById('qqActions').style.display = 'none';
        return;
    }

    document.getElementById('qqActions').style.display = '';

    const fmt = v => '$' + Number(v).toFixed(2);
    const name = document.getElementById('qqName').value;
    const zip = document.getElementById('qqZip').value;

    let html = '';

    // Customer section
    if (name || zip) {
        html += '<div class="qq-section-label">Customer</div>';
        if (name) html += '<div class="qq-summary-row"><span class="label">' + escapeHtml(name) + '</span></div>';
        if (zip) html += '<div class="qq-summary-row"><span class="label">ZIP ' + escapeHtml(zip) + '</span><span class="value">' + escapeHtml(qqZoneData.zone_name || '') + '</span></div>';
    }

    // Containers section
    html += '<div class="qq-section-label">Containers';
    if (pricing.multiPct > 0) {
        html += ' <span class="qq-discount-badge">' + pricing.multiPct + '% multi-discount</span>';
    }
    html += '</div>';

    pricing.items.forEach((item, i) => {
        const locLabel = { onsite: 'Onsite', facility_inside: 'Facility In', facility_outside: 'Facility Out' }[item.storage_location] || item.storage_location;
        html += '<div class="qq-summary-row"><span class="label">' + item.container_size + "' " + locLabel + '</span><span class="value">' + fmt(item.monthly_rate) + '/mo</span></div>';
    });

    // Pricing section
    html += '<div class="qq-section-label">Pricing</div>';
    html += '<div class="qq-summary-row"><span class="label">First Month Rent</span><span class="value">' + fmt(pricing.firstMonthRent) + '</span></div>';
    html += '<div class="qq-summary-row"><span class="label">Delivery' + (pricing.count > 1 ? ' (x' + pricing.count + ')' : '') + '</span><span class="value">' + fmt(pricing.deliveryTotal) + '</span></div>';

    if (pricing.multiDiscount > 0) {
        html += '<div class="qq-summary-row discount"><span class="label">Multi-Container (' + pricing.multiPct + '%)</span><span class="value">-' + fmt(pricing.multiDiscount) + '</span></div>';
    }

    if (pricing.promoDiscount > 0) {
        html += '<div class="qq-summary-row discount"><span class="label">Promo Discount</span><span class="value">-' + fmt(pricing.promoDiscount) + '</span></div>';
    }

    if (pricing.hasOverride) {
        html += '<div class="qq-summary-row"><span class="label" style="color:var(--orange);font-weight:700;">Override Applied</span></div>';
    }

    // Totals
    html += '<div class="qq-summary-row total"><span class="label">Due at Delivery</span><span class="value">' + fmt(pricing.dueToday) + '</span></div>';
    html += '<div class="qq-summary-row"><span class="label">Monthly After First</span><span class="value">' + fmt(pricing.totalMonthly) + '</span></div>';

    body.innerHTML = html;
}

// ZIP lookup with debounce
document.getElementById('qqZip').addEventListener('input', function() {
    clearTimeout(qqZipDebounceTimer);
    const zip = this.value.trim();
    const statusEl = document.getElementById('qqZipStatus');

    if (zip.length < 5) {
        qqZoneData = null;
        qqPricingData = null;
        statusEl.textContent = '';
        statusEl.className = 'qq-zip-status';
        qqRecalculate();
        return;
    }

    if (!/^\d{5}$/.test(zip)) return;

    statusEl.innerHTML = '<i class="bi bi-arrow-repeat"></i>';
    statusEl.className = 'qq-zip-status qq-zip-loading';

    qqZipDebounceTimer = setTimeout(async () => {
        try {
            const data = await api.request('GET', '/public/pricing/' + zip, null, true);
            qqZoneData = {
                zone: data.zone,
                zone_name: data.zone_name,
                delivery_fee: data.delivery_fee,
                pickup_fee: data.pickup_fee,
                relocation_fee: data.relocation_fee,
            };
            qqPricingData = {
                monthly: data.monthly,
                first_month: data.first_month,
            };
            statusEl.innerHTML = '<i class="bi bi-check-circle-fill"></i>';
            statusEl.className = 'qq-zip-status qq-zip-ok';
            qqRecalculate();
        } catch (err) {
            qqZoneData = null;
            qqPricingData = null;
            statusEl.innerHTML = '<i class="bi bi-x-circle-fill"></i>';
            statusEl.className = 'qq-zip-status qq-zip-error';
            qqRecalculate();
        }
    }, 400);
});

// Recalculate on input changes
['qqServiceType', 'qqMonths', 'qqPromo'].forEach(id => {
    document.getElementById(id).addEventListener('change', qqRecalculate);
});
['qqOverride', 'qqName'].forEach(id => {
    document.getElementById(id).addEventListener('input', qqRecalculate);
});

// Promo selection updates promo code display
document.getElementById('qqPromo').addEventListener('change', function() {
    const promoId = this.value;
    const codeInput = document.getElementById('qqPromoCode');
    if (promoId) {
        const promo = qqActivePromos.find(p => p.id === parseInt(promoId));
        codeInput.value = promo?.promo_code || '';
    } else {
        codeInput.value = '';
    }
    qqRecalculate();
});

// Add Container button
document.getElementById('qqAddContainerBtn').addEventListener('click', qqAddContainer);

// Save Quote
document.getElementById('qqSaveBtn').addEventListener('click', async function() {
    const name = document.getElementById('qqName').value.trim();
    const zip = document.getElementById('qqZip').value.trim();

    if (!name) { showToast('Validation', 'Customer name is required', 'error'); return; }
    if (!zip || !/^\d{5}$/.test(zip)) { showToast('Validation', 'Valid ZIP code is required', 'error'); return; }
    if (!qqZoneData) { showToast('Validation', 'ZIP code not in service area', 'error'); return; }

    const overrideVal = parseFloat(document.getElementById('qqOverride').value);
    const hasOverride = !isNaN(overrideVal) && overrideVal > 0;
    const overrideReason = document.getElementById('qqOverrideReason').value.trim();
    if (hasOverride && !overrideReason) {
        showToast('Validation', 'Override reason is required', 'error');
        return;
    }

    const promoId = document.getElementById('qqPromo').value;

    const data = {
        customer_name: name,
        phone: document.getElementById('qqPhone').value.trim() || undefined,
        email: document.getElementById('qqEmail').value.trim() || undefined,
        address: document.getElementById('qqAddress').value.trim() || undefined,
        city: document.getElementById('qqCity').value.trim() || undefined,
        state: document.getElementById('qqState').value.trim() || undefined,
        zip: zip,
        service_type: document.getElementById('qqServiceType').value,
        delivery_date: document.getElementById('qqDeliveryDate').value || undefined,
        months_needed: parseInt(document.getElementById('qqMonths').value) || 1,
        items: qqContainers.map(c => ({
            container_size: c.size,
            storage_location: c.location,
        })),
        promo_id: promoId ? parseInt(promoId) : undefined,
        promo_code: document.getElementById('qqPromoCode').value || undefined,
        override_monthly_cents: hasOverride ? Math.round(overrideVal * 100) : undefined,
        override_reason: hasOverride ? overrideReason : undefined,
        notes: document.getElementById('qqNotes').value.trim() || undefined,
    };

    this.disabled = true;
    this.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Saving...';

    try {
        const result = await api.createStaffQuote(data);
        qqSavedQuoteId = result.quote.id;

        // Show quote number badge
        const badge = document.getElementById('qqNumberBadge');
        badge.textContent = result.quote.quote_number;
        badge.style.display = '';

        // Enable action buttons
        document.getElementById('qqEmailBtn').disabled = !result.quote.email;
        document.getElementById('qqStellaBtn').disabled = false;
        this.innerHTML = '<i class="bi bi-check-lg me-1"></i>Saved';

        showToast('Quote Saved', 'Quote ' + result.quote.quote_number + ' created');
    } catch (err) {
        showToast('Error', err.message, 'error');
        this.disabled = false;
        this.innerHTML = '<i class="bi bi-save me-1"></i>Save Quote';
    }
});

// Email Quote
document.getElementById('qqEmailBtn').addEventListener('click', async function() {
    if (!qqSavedQuoteId) return;
    this.disabled = true;
    this.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Sending...';

    try {
        await api.emailStaffQuote(qqSavedQuoteId);
        this.innerHTML = '<i class="bi bi-check-lg me-1"></i>Email Sent';
        showToast('Email Sent', 'Quote emailed to customer');
    } catch (err) {
        showToast('Error', err.message, 'error');
        this.disabled = false;
        this.innerHTML = '<i class="bi bi-envelope me-1"></i>Email to Customer';
    }
});

// Send to Stella
document.getElementById('qqStellaBtn').addEventListener('click', async function() {
    if (!qqSavedQuoteId) return;
    this.disabled = true;
    this.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Sending...';

    try {
        await api.convertStaffQuote(qqSavedQuoteId);
        this.innerHTML = '<i class="bi bi-check-lg me-1"></i>Sent to Stella';
        showToast('Stella CRM', 'Quote forwarded to Stella');
    } catch (err) {
        showToast('Error', err.message, 'error');
        this.disabled = false;
        this.innerHTML = '<i class="bi bi-send me-1"></i>Send to Stella CRM';
    }
});

// Print
document.getElementById('qqPrintBtn').addEventListener('click', function() {
    window.print();
});

// ============================================================
// Quote History
// ============================================================
let qhPage = 0;
const qhLimit = 25;

async function loadQuoteHistory() {
    await refreshQuoteHistory();
    // Load stats
    try {
        const stats = await api.getQuoteStats();
        document.getElementById('qhDraftCount').textContent = stats.draft_count;
        document.getElementById('qhSentCount').textContent = stats.sent_count;
        document.getElementById('qhConvertedCount').textContent = stats.converted_count;
    } catch (err) {
        // Non-critical
    }
}

async function refreshQuoteHistory() {
    const search = document.getElementById('qhSearch').value;
    const status = document.getElementById('qhStatusFilter').value;

    try {
        const data = await api.getStaffQuotes({
            search: search || undefined,
            status: status || undefined,
            limit: qhLimit,
            offset: qhPage * qhLimit,
        });

        const tbody = document.getElementById('qhTable');
        if (!data.quotes || data.quotes.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted py-4">No quotes found</td></tr>';
        } else {
            tbody.innerHTML = data.quotes.map(q => {
                const statusClass = 'badge-' + q.status;
                const created = new Date(q.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                return '<tr>' +
                    '<td><code>' + escapeHtml(q.quote_number) + '</code></td>' +
                    '<td>' + escapeHtml(q.customer_name) + (q.email ? '<br><small class="text-muted">' + escapeHtml(q.email) + '</small>' : '') + '</td>' +
                    '<td>' + escapeHtml(q.zip) + '</td>' +
                    '<td>' + q.container_count + '</td>' +
                    '<td><strong>' + formatCurrency(q.due_today_cents) + '</strong></td>' +
                    '<td><span class="badge ' + statusClass + '">' + capitalize(q.status) + '</span></td>' +
                    '<td class="small">' + created + '</td>' +
                    '<td><button class="btn btn-sm btn-outline-primary" onclick="viewQuoteDetail(' + q.id + ')"><i class="bi bi-eye"></i></button></td>' +
                    '</tr>';
            }).join('');
        }

        renderPagination('qhPagination', data.total, qhLimit, qhPage, (p) => {
            qhPage = p;
            refreshQuoteHistory();
        });
    } catch (err) {
        showToast('Error', err.message, 'error');
    }
}

document.getElementById('qhSearch').addEventListener('input', debounce(() => { qhPage = 0; refreshQuoteHistory(); }, 300));
document.getElementById('qhStatusFilter').addEventListener('change', () => { qhPage = 0; refreshQuoteHistory(); });

async function viewQuoteDetail(id) {
    try {
        const data = await api.getStaffQuote(id);
        const q = data.quote;
        const items = q.items || [];

        document.getElementById('quoteDetailTitle').textContent = 'Quote ' + q.quote_number;

        const fmt = cents => '$' + (cents / 100).toFixed(2);
        const locLabel = loc => ({ onsite: 'Onsite', facility_inside: 'Facility Inside', facility_outside: 'Facility Outside' }[loc] || loc);

        let html = '<div class="mb-3"><span class="badge badge-' + q.status + '" style="font-size:13px;">' + capitalize(q.status) + '</span></div>';

        html += '<h6 style="font-weight:700;">Customer</h6>';
        html += '<table class="table table-sm"><tbody>';
        html += '<tr><td class="text-muted">Name</td><td>' + escapeHtml(q.customer_name) + '</td></tr>';
        if (q.email) html += '<tr><td class="text-muted">Email</td><td>' + escapeHtml(q.email) + '</td></tr>';
        if (q.phone) html += '<tr><td class="text-muted">Phone</td><td>' + escapeHtml(q.phone) + '</td></tr>';
        html += '<tr><td class="text-muted">ZIP</td><td>' + escapeHtml(q.zip) + ' (' + escapeHtml(q.zone_name || '') + ')</td></tr>';
        if (q.address) html += '<tr><td class="text-muted">Address</td><td>' + escapeHtml(q.address) + '</td></tr>';
        html += '</tbody></table>';

        html += '<h6 style="font-weight:700;">Containers</h6>';
        html += '<table class="table table-sm"><tbody>';
        items.forEach((item, i) => {
            html += '<tr><td>' + item.container_size + "' " + locLabel(item.storage_location) + '</td><td class="text-end">' + fmt(item.monthly_rate_cents) + '/mo</td></tr>';
        });
        html += '</tbody></table>';

        html += '<h6 style="font-weight:700;">Pricing</h6>';
        html += '<table class="table table-sm"><tbody>';
        html += '<tr><td class="text-muted">Delivery' + (q.container_count > 1 ? ' (x' + q.container_count + ')' : '') + '</td><td class="text-end">' + fmt(q.delivery_fee_cents * q.container_count) + '</td></tr>';
        if (q.multi_discount_percent > 0) {
            html += '<tr><td class="text-muted">Multi-Container (' + q.multi_discount_percent + '%)</td><td class="text-end text-success">-' + fmt(q.discount_monthly_cents) + '</td></tr>';
        }
        if (q.promo_discount_cents > 0) {
            html += '<tr><td class="text-muted">Promo Discount</td><td class="text-end text-success">-' + fmt(q.promo_discount_cents) + '</td></tr>';
        }
        html += '<tr style="border-top:2px solid var(--yellow);"><td><strong>Due at Delivery</strong></td><td class="text-end"><strong>' + fmt(q.due_today_cents) + '</strong></td></tr>';
        html += '<tr><td class="text-muted">Monthly After First</td><td class="text-end">' + fmt(q.total_monthly_cents) + '</td></tr>';
        html += '</tbody></table>';

        html += '<h6 style="font-weight:700;">Tracking</h6>';
        html += '<table class="table table-sm"><tbody>';
        html += '<tr><td class="text-muted">Created by</td><td>' + escapeHtml(q.created_by) + '</td></tr>';
        html += '<tr><td class="text-muted">Created</td><td>' + new Date(q.created_at).toLocaleString() + '</td></tr>';
        if (q.email_sent) html += '<tr><td class="text-muted">Email Sent</td><td>' + new Date(q.email_sent_at).toLocaleString() + '</td></tr>';
        if (q.stella_forwarded) html += '<tr><td class="text-muted">Stella</td><td>Forwarded</td></tr>';
        if (q.notes) html += '<tr><td class="text-muted">Notes</td><td>' + escapeHtml(q.notes) + '</td></tr>';
        html += '</tbody></table>';

        document.getElementById('quoteDetailBody').innerHTML = html;

        // Wire up drawer action buttons
        document.getElementById('qdEmailBtn').disabled = !q.email || q.email_sent;
        document.getElementById('qdEmailBtn').onclick = async function() {
            this.disabled = true;
            try {
                await api.emailStaffQuote(q.id);
                showToast('Email Sent', 'Quote emailed');
                this.innerHTML = '<i class="bi bi-check-lg me-1"></i>Sent';
            } catch (err) { showToast('Error', err.message, 'error'); this.disabled = false; }
        };

        document.getElementById('qdStellaBtn').disabled = q.stella_forwarded;
        document.getElementById('qdStellaBtn').onclick = async function() {
            this.disabled = true;
            try {
                await api.convertStaffQuote(q.id);
                showToast('Stella', 'Forwarded to Stella');
                this.innerHTML = '<i class="bi bi-check-lg me-1"></i>Sent';
            } catch (err) { showToast('Error', err.message, 'error'); this.disabled = false; }
        };

        new bootstrap.Modal(document.getElementById('quoteDetailModal')).show();
    } catch (err) {
        showToast('Error', err.message, 'error');
    }
}
window.viewQuoteDetail = viewQuoteDetail;

// ============================================================
// Advanced Quote
// ============================================================
let aqContainers = [];
let aqSavedQuoteId = null;
let aqActivePromos = [];
let aqAutocompleteInstances = [];
let aqZipTimers = {};

const AQ_SERVICE_TYPES = [
    'Storage at Your Location',
    'Facility Storage (Inside)',
    'Facility Storage (Outside)',
    'Moving - Local',
    'Relocation',
];

const AQ_SERVICE_LOCATION_MAP = {
    'Storage at Your Location': 'onsite',
    'Facility Storage (Inside)': 'facility_inside',
    'Facility Storage (Outside)': 'facility_outside',
    'Moving - Local': 'onsite',
    'Relocation': 'onsite',
};

function aqGetAddressFields(serviceType) {
    switch (serviceType) {
        case 'Storage at Your Location':
            return [{ label: 'Delivery Address', key: '1' }];
        case 'Moving - Local':
            return [{ label: 'Pickup Address', key: '1' }, { label: 'Destination Address', key: '2' }];
        case 'Relocation':
            return [{ label: 'Current Location', key: '1' }, { label: 'New Location', key: '2' }];
        default: // Facility Storage
            return [];
    }
}

function aqGetDeliveryFeeType(serviceType) {
    switch (serviceType) {
        case 'Storage at Your Location':
        case 'Moving - Local':
            return 'delivery';
        case 'Relocation':
            return 'relocation';
        default:
            return 'none';
    }
}

async function loadAdvancedQuote() {
    aqContainers = [{
        size: '16', serviceType: 'Storage at Your Location',
        addr1: '', apt1: '', city1: '', state1: 'TX', zip1: '',
        addr2: '', apt2: '', city2: '', state2: 'TX', zip2: '',
        zoneData: null, pricingData: null,
    }];
    aqSavedQuoteId = null;
    aqAutocompleteInstances = [];
    aqZipTimers = {};

    const fields = ['aqName', 'aqPhone', 'aqEmail', 'aqPromoCode', 'aqOverride', 'aqOverrideReason', 'aqNotes'];
    fields.forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
    document.getElementById('aqDeliveryDate').value = '';
    document.getElementById('aqMonths').value = '1';
    document.getElementById('aqPromo').value = '';
    document.getElementById('aqNumberBadge').style.display = 'none';
    document.getElementById('aqActions').style.display = 'none';
    document.getElementById('aqSaveBtn').disabled = false;
    document.getElementById('aqSaveBtn').innerHTML = '<i class="bi bi-save me-1"></i>Save Quote';
    document.getElementById('aqEmailBtn').disabled = true;
    document.getElementById('aqStellaBtn').disabled = true;

    aqRenderContainers();
    aqRenderSummary();

    // Load promos
    try {
        const data = await api.getPromotions();
        const now = new Date().toISOString().split('T')[0];
        aqActivePromos = (data.promotions || []).filter(p => p.is_active && p.start_date <= now && p.end_date >= now);
        const select = document.getElementById('aqPromo');
        select.innerHTML = '<option value="">No promotion</option>' +
            aqActivePromos.map(p => '<option value="' + p.id + '">' + escapeHtml(p.name) +
                ' (' + (p.discount_type === 'percent' ? p.discount_value + '%' : '$' + Number(p.discount_value).toFixed(2)) + ' off)' +
                '</option>').join('');
    } catch (err) {
        // Non-critical
    }
}

function aqRenderContainers() {
    // Clean up old autocomplete instances
    aqAutocompleteInstances.forEach(ac => {
        if (ac && ac.unbindAll) ac.unbindAll();
    });
    aqAutocompleteInstances = [];

    const wrap = document.getElementById('aqContainersWrap');
    wrap.innerHTML = aqContainers.map((c, i) => {
        const addrFields = aqGetAddressFields(c.serviceType);
        const svcOptions = AQ_SERVICE_TYPES.map(s =>
            '<option value="' + s + '"' + (c.serviceType === s ? ' selected' : '') + '>' + s + '</option>'
        ).join('');

        let html = '<div class="aq-container-card">';
        // Header row: badge + size + service type + remove
        html += '<div class="aq-container-header">';
        html += '<span class="aq-badge">#' + (i + 1) + '</span>';
        html += '<select class="form-select form-select-sm" onchange="aqUpdateContainer(' + i + ',\'size\',this.value)">' +
            '<option value="16"' + (c.size === '16' ? ' selected' : '') + '>16-ft</option>' +
            '<option value="20"' + (c.size === '20' ? ' selected' : '') + '>20-ft</option>' +
            '</select>';
        html += '<select class="form-select form-select-sm" onchange="aqServiceTypeChanged(' + i + ',this.value)">' + svcOptions + '</select>';
        if (aqContainers.length > 1) {
            html += '<button class="btn btn-sm btn-outline-danger btn-remove" onclick="aqRemoveContainer(' + i + ')" type="button"><i class="bi bi-x-lg"></i></button>';
        }
        html += '</div>';

        // Address blocks
        addrFields.forEach(af => {
            const key = af.key; // '1' or '2'
            const addrVal = c['addr' + key] || '';
            const aptVal = c['apt' + key] || '';
            const cityVal = c['city' + key] || '';
            const stateVal = c['state' + key] || 'TX';
            const zipVal = c['zip' + key] || '';

            html += '<div class="aq-address-block">';
            html += '<div class="aq-address-label">' + escapeHtml(af.label) + '</div>';
            html += '<div class="row g-2">';
            html += '<div class="col-md-8"><input type="text" class="form-control form-control-sm aq-autocomplete" id="aqAddr_' + i + '_' + key + '" placeholder="Start typing address..." value="' + escapeHtml(addrVal) + '" data-idx="' + i + '" data-key="' + key + '"></div>';
            html += '<div class="col-md-4"><input type="text" class="form-control form-control-sm" placeholder="Apt/Suite" value="' + escapeHtml(aptVal) + '" onchange="aqUpdateAddr(' + i + ',\'apt' + key + '\',this.value)"></div>';
            html += '<div class="col-md-4"><input type="text" class="form-control form-control-sm" placeholder="City" value="' + escapeHtml(cityVal) + '" onchange="aqUpdateAddr(' + i + ',\'city' + key + '\',this.value)"></div>';
            html += '<div class="col-md-3"><input type="text" class="form-control form-control-sm" placeholder="State" value="' + escapeHtml(stateVal) + '" maxlength="2" onchange="aqUpdateAddr(' + i + ',\'state' + key + '\',this.value)"></div>';
            html += '<div class="col-md-5"><div class="position-relative"><input type="text" class="form-control form-control-sm" placeholder="ZIP" value="' + escapeHtml(zipVal) + '" maxlength="5" id="aqZip_' + i + '_' + key + '" oninput="aqZipInput(' + i + ',\'' + key + '\',this.value)"><span class="aq-zip-status" id="aqZipStatus_' + i + '_' + key + '"></span></div></div>';
            html += '</div>';
            html += '</div>';
        });

        // Pricing preview
        const pricingInfo = aqGetContainerPricing(i);
        if (pricingInfo) {
            html += '<div class="aq-container-pricing">';
            html += '<span>' + escapeHtml(pricingInfo.zoneName || '') + '</span>';
            html += '<span>';
            html += '<span class="aq-price">$' + (pricingInfo.monthlyRate / 100).toFixed(2) + '/mo</span>';
            if (pricingInfo.deliveryFee > 0) {
                html += ' &middot; Delivery $' + (pricingInfo.deliveryFee / 100).toFixed(2);
            }
            html += '</span>';
            html += '</div>';
        }

        html += '</div>';
        return html;
    }).join('');

    // Init Google Places autocomplete on address inputs
    setTimeout(() => aqInitAllAutocomplete(), 100);
}

function aqInitAllAutocomplete() {
    if (typeof google === 'undefined' || !google.maps || !google.maps.places) return;

    document.querySelectorAll('.aq-autocomplete').forEach(input => {
        const idx = parseInt(input.dataset.idx);
        const key = input.dataset.key;

        const ac = new google.maps.places.Autocomplete(input, {
            componentRestrictions: { country: 'us' },
            fields: ['address_components', 'formatted_address'],
            types: ['address'],
        });

        ac.addListener('place_changed', () => {
            const place = ac.getPlace();
            if (!place.address_components) return;

            let street = '';
            let city = '';
            let state = '';
            let zip = '';

            for (const comp of place.address_components) {
                const types = comp.types;
                if (types.includes('street_number')) street = comp.long_name + ' ';
                if (types.includes('route')) street += comp.short_name;
                if (types.includes('locality')) city = comp.long_name;
                if (types.includes('administrative_area_level_1')) state = comp.short_name;
                if (types.includes('postal_code')) zip = comp.long_name;
            }

            aqContainers[idx]['addr' + key] = street.trim();
            aqContainers[idx]['city' + key] = city;
            aqContainers[idx]['state' + key] = state;
            aqContainers[idx]['zip' + key] = zip;

            // Update the visible fields
            const cityEl = input.closest('.aq-address-block').querySelector('[placeholder="City"]');
            const stateEl = input.closest('.aq-address-block').querySelector('[placeholder="State"]');
            const zipEl = document.getElementById('aqZip_' + idx + '_' + key);
            if (cityEl) cityEl.value = city;
            if (stateEl) stateEl.value = state;
            if (zipEl) zipEl.value = zip;

            input.value = street.trim();

            // Trigger zone lookup
            if (zip && /^\d{5}$/.test(zip) && key === '1') {
                aqDoZipLookup(idx, key, zip);
            }
        });

        aqAutocompleteInstances.push(ac);
    });
}

function aqUpdateContainer(idx, field, value) {
    aqContainers[idx][field] = value;
    aqRecalculate();
}
window.aqUpdateContainer = aqUpdateContainer;

function aqUpdateAddr(idx, field, value) {
    aqContainers[idx][field] = value;
}
window.aqUpdateAddr = aqUpdateAddr;

function aqServiceTypeChanged(idx, value) {
    aqContainers[idx].serviceType = value;
    // Clear zone data when service type changes
    aqContainers[idx].zoneData = null;
    aqContainers[idx].pricingData = null;
    aqRenderContainers();
    aqRenderSummary();
}
window.aqServiceTypeChanged = aqServiceTypeChanged;

function aqZipInput(idx, key, value) {
    aqContainers[idx]['zip' + key] = value;
    clearTimeout(aqZipTimers[idx + '_' + key]);

    const statusEl = document.getElementById('aqZipStatus_' + idx + '_' + key);
    if (value.length < 5) {
        if (key === '1') {
            aqContainers[idx].zoneData = null;
            aqContainers[idx].pricingData = null;
        }
        if (statusEl) { statusEl.textContent = ''; statusEl.className = 'aq-zip-status'; }
        aqRenderSummary();
        return;
    }

    if (!/^\d{5}$/.test(value)) return;

    if (statusEl) {
        statusEl.innerHTML = '<i class="bi bi-arrow-repeat"></i>';
        statusEl.className = 'aq-zip-status qq-zip-loading';
    }

    aqZipTimers[idx + '_' + key] = setTimeout(() => aqDoZipLookup(idx, key, value), 400);
}
window.aqZipInput = aqZipInput;

async function aqDoZipLookup(idx, key, zip) {
    const statusEl = document.getElementById('aqZipStatus_' + idx + '_' + key);
    try {
        const data = await api.request('GET', '/public/pricing/' + zip, null, true);
        if (key === '1') {
            aqContainers[idx].zoneData = {
                zone: data.zone,
                zone_name: data.zone_name,
                delivery_fee: data.delivery_fee,
                pickup_fee: data.pickup_fee,
                relocation_fee: data.relocation_fee,
            };
            aqContainers[idx].pricingData = {
                monthly: data.monthly,
                first_month: data.first_month,
            };
        }
        if (statusEl) {
            statusEl.innerHTML = '<i class="bi bi-check-circle-fill"></i>';
            statusEl.className = 'aq-zip-status qq-zip-ok';
        }
        aqRenderSummary();
        // Re-render just the pricing preview for this container
        aqUpdateContainerPricingPreview(idx);
    } catch (err) {
        if (key === '1') {
            aqContainers[idx].zoneData = null;
            aqContainers[idx].pricingData = null;
        }
        if (statusEl) {
            statusEl.innerHTML = '<i class="bi bi-x-circle-fill"></i>';
            statusEl.className = 'aq-zip-status qq-zip-error';
        }
        aqRenderSummary();
    }
}

function aqUpdateContainerPricingPreview(idx) {
    const card = document.querySelectorAll('.aq-container-card')[idx];
    if (!card) return;

    let existing = card.querySelector('.aq-container-pricing');
    const info = aqGetContainerPricing(idx);

    if (!info) {
        if (existing) existing.remove();
        return;
    }

    const html = '<span>' + escapeHtml(info.zoneName || '') + '</span>' +
        '<span><span class="aq-price">$' + (info.monthlyRate / 100).toFixed(2) + '/mo</span>' +
        (info.deliveryFee > 0 ? ' &middot; Delivery $' + (info.deliveryFee / 100).toFixed(2) : '') +
        '</span>';

    if (existing) {
        existing.innerHTML = html;
    } else {
        const div = document.createElement('div');
        div.className = 'aq-container-pricing';
        div.innerHTML = html;
        card.appendChild(div);
    }
}

function aqGetContainerPricing(idx) {
    const c = aqContainers[idx];
    if (!c.zoneData || !c.pricingData) {
        // Facility storage doesn't need zone data
        if (c.serviceType.startsWith('Facility Storage') && c.pricingData) {
            // We might not have pricingData either for facility — skip for now
        }
        if (!c.pricingData) return null;
    }

    const storageLocation = AQ_SERVICE_LOCATION_MAP[c.serviceType] || 'onsite';
    const monthly = c.pricingData?.monthly || {};
    const sizeRates = monthly[c.size] || {};
    const monthlyRate = sizeRates[storageLocation];
    if (monthlyRate === undefined) return null;

    const feeType = aqGetDeliveryFeeType(c.serviceType);
    let deliveryFee = 0;
    if (c.zoneData && feeType !== 'none') {
        deliveryFee = feeType === 'relocation'
            ? (c.zoneData.relocation_fee || 0)
            : (c.zoneData.delivery_fee || 0);
    }

    return {
        monthlyRate: Math.round(monthlyRate * 100),
        deliveryFee: deliveryFee, // already in cents from zone
        zoneName: c.zoneData?.zone_name || '',
    };
}

function aqGetPricing() {
    const count = aqContainers.length;
    let allReady = true;
    const items = [];
    let totalDeliveryFee = 0;

    for (let i = 0; i < count; i++) {
        const c = aqContainers[i];
        const storageLocation = AQ_SERVICE_LOCATION_MAP[c.serviceType] || 'onsite';
        const isFacility = c.serviceType.startsWith('Facility Storage');

        // For non-facility, we need zone data
        if (!isFacility && !c.zoneData) { allReady = false; continue; }
        if (!c.pricingData) { allReady = false; continue; }

        const monthly = c.pricingData.monthly || {};
        const firstMonth = c.pricingData.first_month || {};
        const sizeRates = monthly[c.size] || {};
        const monthlyRate = sizeRates[storageLocation];
        if (monthlyRate === undefined) { allReady = false; continue; }

        const firstMonthRate = firstMonth[c.size] || monthlyRate;
        const feeType = aqGetDeliveryFeeType(c.serviceType);
        let deliveryFee = 0;
        if (c.zoneData && feeType !== 'none') {
            deliveryFee = feeType === 'relocation'
                ? (c.zoneData.relocation_fee || 0)
                : (c.zoneData.delivery_fee || 0);
        }
        totalDeliveryFee += deliveryFee;

        items.push({
            container_size: c.size,
            storage_location: storageLocation,
            service_type: c.serviceType,
            monthly_rate: monthlyRate,
            first_month_rate: firstMonthRate,
            delivery_fee: deliveryFee,
            zone_name: c.zoneData?.zone_name || '',
        });
    }

    if (!allReady || items.length === 0) return null;

    // Multi-container discount
    let multiPct = 0;
    if (count === 2) multiPct = 5;
    else if (count >= 3) multiPct = 10;

    let monthlySubtotal = items.reduce((s, i) => s + i.monthly_rate, 0);

    // Override
    const overrideVal = parseFloat(document.getElementById('aqOverride').value);
    const hasOverride = !isNaN(overrideVal) && overrideVal > 0;
    if (hasOverride) monthlySubtotal = overrideVal * count;

    const multiDiscount = monthlySubtotal * multiPct / 100;

    // Promo discount
    let promoDiscount = 0;
    const promoId = document.getElementById('aqPromo').value;
    if (promoId) {
        const promo = aqActivePromos.find(p => p.id === parseInt(promoId));
        if (promo) {
            const appliesTo = safeJsonParse(promo.applies_to, []);
            if (appliesTo.includes('rent')) {
                const applicableMonthly = monthlySubtotal - multiDiscount;
                promoDiscount += promo.discount_type === 'percent'
                    ? applicableMonthly * promo.discount_value / 100
                    : promo.discount_value;
            }
            if (appliesTo.includes('delivery')) {
                const deliveryDollars = totalDeliveryFee / 100;
                promoDiscount += promo.discount_type === 'percent'
                    ? deliveryDollars * promo.discount_value / 100
                    : promo.discount_value;
            }
        }
    }

    const totalMonthly = monthlySubtotal - multiDiscount;
    const firstMonthRent = items.reduce((s, i) => s + i.first_month_rate, 0);
    const firstMonthTotal = firstMonthRent + (totalDeliveryFee / 100) - promoDiscount;

    return {
        items,
        totalDeliveryFee: totalDeliveryFee / 100,
        monthlySubtotal,
        multiPct,
        multiDiscount,
        promoDiscount,
        totalMonthly,
        firstMonthRent,
        firstMonthTotal,
        dueToday: firstMonthTotal,
        hasOverride,
        count,
    };
}

function aqRenderSummary() {
    const body = document.getElementById('aqSummaryBody');
    const pricing = aqGetPricing();

    if (!pricing) {
        body.innerHTML = '<p class="text-muted text-center py-4">Add containers and enter ZIP codes to begin</p>';
        document.getElementById('aqActions').style.display = 'none';
        return;
    }

    document.getElementById('aqActions').style.display = '';
    const fmt = v => '$' + Number(v).toFixed(2);
    const name = document.getElementById('aqName').value;

    let html = '';

    if (name) {
        html += '<div class="qq-section-label">Customer</div>';
        html += '<div class="qq-summary-row"><span class="label">' + escapeHtml(name) + '</span></div>';
    }

    // Containers section
    html += '<div class="qq-section-label">Containers';
    if (pricing.multiPct > 0) {
        html += ' <span class="qq-discount-badge">' + pricing.multiPct + '% multi-discount</span>';
    }
    html += '</div>';

    pricing.items.forEach((item, i) => {
        html += '<div class="qq-summary-row"><span class="label">' + item.container_size + "' " + escapeHtml(item.service_type) + '</span><span class="value">' + fmt(item.monthly_rate) + '/mo</span></div>';
        if (item.zone_name) {
            html += '<div class="qq-summary-row"><span class="label" style="padding-left:12px;font-size:12px;color:var(--gray-400);">' + escapeHtml(item.zone_name) + '</span>';
            if (item.delivery_fee > 0) {
                html += '<span class="value" style="font-size:12px;color:var(--gray-500);">Delivery ' + fmt(item.delivery_fee / 100) + '</span>';
            }
            html += '</div>';
        }
    });

    // Pricing section
    html += '<div class="qq-section-label">Pricing</div>';
    html += '<div class="qq-summary-row"><span class="label">First Month Rent</span><span class="value">' + fmt(pricing.firstMonthRent) + '</span></div>';
    html += '<div class="qq-summary-row"><span class="label">Delivery Fees</span><span class="value">' + fmt(pricing.totalDeliveryFee) + '</span></div>';

    if (pricing.multiDiscount > 0) {
        html += '<div class="qq-summary-row discount"><span class="label">Multi-Container (' + pricing.multiPct + '%)</span><span class="value">-' + fmt(pricing.multiDiscount) + '</span></div>';
    }
    if (pricing.promoDiscount > 0) {
        html += '<div class="qq-summary-row discount"><span class="label">Promo Discount</span><span class="value">-' + fmt(pricing.promoDiscount) + '</span></div>';
    }
    if (pricing.hasOverride) {
        html += '<div class="qq-summary-row"><span class="label" style="color:var(--orange);font-weight:700;">Override Applied</span></div>';
    }

    html += '<div class="qq-summary-row total"><span class="label">Due at Delivery</span><span class="value">' + fmt(pricing.dueToday) + '</span></div>';
    html += '<div class="qq-summary-row"><span class="label">Monthly After First</span><span class="value">' + fmt(pricing.totalMonthly) + '</span></div>';

    body.innerHTML = html;
}

function aqRecalculate() {
    aqRenderSummary();
}

function aqAddContainer() {
    if (aqContainers.length >= 10) {
        showToast('Limit', 'Maximum 10 containers per quote', 'error');
        return;
    }
    aqContainers.push({
        size: '16', serviceType: 'Storage at Your Location',
        addr1: '', apt1: '', city1: '', state1: 'TX', zip1: '',
        addr2: '', apt2: '', city2: '', state2: 'TX', zip2: '',
        zoneData: null, pricingData: null,
    });
    aqRenderContainers();
    aqRecalculate();
}

function aqRemoveContainer(idx) {
    if (aqContainers.length <= 1) return;
    aqContainers.splice(idx, 1);
    aqRenderContainers();
    aqRecalculate();
}
window.aqRemoveContainer = aqRemoveContainer;

// For facility storage, we need pricing data even without a zone
// Try to load pricing from any other container that has it
function aqEnsureFacilityPricing(idx) {
    const c = aqContainers[idx];
    if (!c.serviceType.startsWith('Facility Storage')) return;
    if (c.pricingData) return;

    // Copy pricing data from any other container that has it
    for (const other of aqContainers) {
        if (other.pricingData) {
            c.pricingData = other.pricingData;
            return;
        }
    }
}

// Save Advanced Quote
document.getElementById('aqSaveBtn').addEventListener('click', async function() {
    const name = document.getElementById('aqName').value.trim();
    if (!name) { showToast('Validation', 'Customer name is required', 'error'); return; }

    // Validate each container
    for (let i = 0; i < aqContainers.length; i++) {
        const c = aqContainers[i];
        const isFacility = c.serviceType.startsWith('Facility Storage');
        if (!isFacility && (!c.zip1 || !/^\d{5}$/.test(c.zip1))) {
            showToast('Validation', 'Container #' + (i + 1) + ': valid ZIP code is required', 'error');
            return;
        }
        aqEnsureFacilityPricing(i);
        if (!isFacility && !c.zoneData) {
            showToast('Validation', 'Container #' + (i + 1) + ': ZIP not in service area', 'error');
            return;
        }
    }

    const overrideVal = parseFloat(document.getElementById('aqOverride').value);
    const hasOverride = !isNaN(overrideVal) && overrideVal > 0;
    const overrideReason = document.getElementById('aqOverrideReason').value.trim();
    if (hasOverride && !overrideReason) {
        showToast('Validation', 'Override reason is required', 'error');
        return;
    }

    const promoId = document.getElementById('aqPromo').value;

    // Build per-item data
    const itemsPayload = aqContainers.map(c => {
        const storageLocation = AQ_SERVICE_LOCATION_MAP[c.serviceType] || 'onsite';
        return {
            container_size: c.size,
            storage_location: storageLocation,
            service_type: c.serviceType,
            address_1: c.addr1 || undefined,
            apt_1: c.apt1 || undefined,
            city_1: c.city1 || undefined,
            state_1: c.state1 || undefined,
            zip_1: c.zip1 || undefined,
            address_2: c.addr2 || undefined,
            apt_2: c.apt2 || undefined,
            city_2: c.city2 || undefined,
            state_2: c.state2 || undefined,
            zip_2: c.zip2 || undefined,
        };
    });

    // Use first non-facility container's ZIP as global
    const firstZip = aqContainers.find(c => c.zip1)?.zip1 || '00000';
    const firstServiceType = aqContainers[0].serviceType;

    const data = {
        customer_name: name,
        phone: document.getElementById('aqPhone').value.trim() || undefined,
        email: document.getElementById('aqEmail').value.trim() || undefined,
        zip: firstZip,
        service_type: firstServiceType,
        delivery_date: document.getElementById('aqDeliveryDate').value || undefined,
        months_needed: parseInt(document.getElementById('aqMonths').value) || 1,
        items: itemsPayload,
        promo_id: promoId ? parseInt(promoId) : undefined,
        promo_code: document.getElementById('aqPromoCode').value || undefined,
        override_monthly_cents: hasOverride ? Math.round(overrideVal * 100) : undefined,
        override_reason: hasOverride ? overrideReason : undefined,
        notes: document.getElementById('aqNotes').value.trim() || undefined,
        quote_type: 'advanced',
    };

    this.disabled = true;
    this.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Saving...';

    try {
        const result = await api.createStaffQuote(data);
        aqSavedQuoteId = result.quote.id;

        const badge = document.getElementById('aqNumberBadge');
        badge.textContent = result.quote.quote_number;
        badge.style.display = '';

        document.getElementById('aqEmailBtn').disabled = !result.quote.email;
        document.getElementById('aqStellaBtn').disabled = false;
        this.innerHTML = '<i class="bi bi-check-lg me-1"></i>Saved';

        showToast('Quote Saved', 'Quote ' + result.quote.quote_number + ' created');
    } catch (err) {
        showToast('Error', err.message, 'error');
        this.disabled = false;
        this.innerHTML = '<i class="bi bi-save me-1"></i>Save Quote';
    }
});

// Email Advanced Quote
document.getElementById('aqEmailBtn').addEventListener('click', async function() {
    if (!aqSavedQuoteId) return;
    this.disabled = true;
    this.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Sending...';

    try {
        await api.emailStaffQuote(aqSavedQuoteId);
        this.innerHTML = '<i class="bi bi-check-lg me-1"></i>Email Sent';
        showToast('Email Sent', 'Quote emailed to customer');
    } catch (err) {
        showToast('Error', err.message, 'error');
        this.disabled = false;
        this.innerHTML = '<i class="bi bi-envelope me-1"></i>Email to Customer';
    }
});

// Stella Advanced Quote
document.getElementById('aqStellaBtn').addEventListener('click', async function() {
    if (!aqSavedQuoteId) return;
    this.disabled = true;
    this.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Sending...';

    try {
        await api.convertStaffQuote(aqSavedQuoteId);
        this.innerHTML = '<i class="bi bi-check-lg me-1"></i>Sent to Stella';
        showToast('Stella CRM', 'Quote forwarded to Stella');
    } catch (err) {
        showToast('Error', err.message, 'error');
        this.disabled = false;
        this.innerHTML = '<i class="bi bi-send me-1"></i>Send to Stella CRM';
    }
});

// Print Advanced Quote
document.getElementById('aqPrintBtn').addEventListener('click', function() {
    window.print();
});

// Add Container button
document.getElementById('aqAddContainerBtn').addEventListener('click', aqAddContainer);

// Recalculate on input changes
['aqPromo', 'aqMonths'].forEach(id => {
    document.getElementById(id).addEventListener('change', aqRecalculate);
});
['aqOverride', 'aqName'].forEach(id => {
    document.getElementById(id).addEventListener('input', aqRecalculate);
});

// Promo selection updates promo code display
document.getElementById('aqPromo').addEventListener('change', function() {
    const promoId = this.value;
    const codeInput = document.getElementById('aqPromoCode');
    if (promoId) {
        const promo = aqActivePromos.find(p => p.id === parseInt(promoId));
        codeInput.value = promo?.promo_code || '';
    } else {
        codeInput.value = '';
    }
    aqRecalculate();
});

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

// ==========================================
// Reviews Management
// ==========================================

function escapeHtmlAdmin(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
}

async function loadReviews() {
    try {
        const params = {};
        const search = document.getElementById('reviewSearch')?.value;
        const tag = document.getElementById('reviewTagFilter')?.value;
        const featured = document.getElementById('reviewFeaturedFilter')?.value;

        if (search) params.search = search;
        if (tag) params.tag = tag;
        if (featured) params.featured = featured;

        const data = await api.getReviews(params);
        reviews = data.reviews || [];

        // Update stats
        let featuredCount = 0;
        let activeCount = 0;
        reviews.forEach(r => {
            if (r.is_featured) featuredCount++;
            if (r.is_active) activeCount++;
        });
        document.getElementById('reviewStatTotal').textContent = data.total || reviews.length;
        document.getElementById('reviewStatAvg').textContent = '5.0';
        document.getElementById('reviewStatFeatured').textContent = featuredCount;
        document.getElementById('reviewStatActive').textContent = activeCount;

        renderReviewsTable();

        // Load tags for filter dropdown
        try {
            const tagData = await api.getReviewTags();
            const tagSelect = document.getElementById('reviewTagFilter');
            if (tagSelect && tagData.tags) {
                const currentVal = tagSelect.value;
                tagSelect.innerHTML = '<option value="">All Tags</option>';
                tagData.tags.forEach(t => {
                    tagSelect.innerHTML += '<option value="' + escapeHtmlAdmin(t.tag) + '">' +
                        escapeHtmlAdmin(t.tag) + ' (' + t.count + ')</option>';
                });
                tagSelect.value = currentVal;
            }
        } catch (e) {}
    } catch (err) {
        showToast('Error', 'Failed to load reviews: ' + err.message, 'danger');
    }
}

function renderReviewsTable() {
    const tbody = document.getElementById('reviewsTable');
    if (!tbody) return;

    if (reviews.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted py-4">No reviews found</td></tr>';
        return;
    }

    tbody.innerHTML = reviews.map(r => {
        const stars = '<span style="color:#FFDD00;">' + '&#9733;'.repeat(r.rating) + '</span>';
        const snippet = r.review_snippet
            ? escapeHtmlAdmin(r.review_snippet.length > 60 ? r.review_snippet.substring(0, 60) + '...' : r.review_snippet)
            : '<span class="text-muted">-</span>';
        const tags = (r.tags || []).map(t =>
            '<span class="badge bg-secondary me-1">' + escapeHtmlAdmin(t) + '</span>'
        ).join('');

        return '<tr>' +
            '<td><strong>' + escapeHtmlAdmin(r.reviewer_name) + '</strong></td>' +
            '<td>' + stars + '</td>' +
            '<td>' + snippet + '</td>' +
            '<td>' + (tags || '<span class="text-muted">-</span>') + '</td>' +
            '<td>' + escapeHtmlAdmin(r.review_date) + '</td>' +
            '<td><div class="form-check form-switch"><input class="form-check-input" type="checkbox" ' +
                (r.is_featured ? 'checked' : '') +
                ' onchange="toggleReviewFeatured(' + r.id + ', this.checked)"></div></td>' +
            '<td><div class="form-check form-switch"><input class="form-check-input" type="checkbox" ' +
                (r.is_active ? 'checked' : '') +
                ' onchange="toggleReviewActive(' + r.id + ', this.checked)"></div></td>' +
            '<td>' +
                '<button class="btn btn-sm btn-outline-primary me-1" onclick="editReview(' + r.id + ')"><i class="bi bi-pencil"></i></button>' +
                '<button class="btn btn-sm btn-outline-danger" onclick="deleteReview(' + r.id + ')"><i class="bi bi-trash"></i></button>' +
            '</td>' +
        '</tr>';
    }).join('');
}

async function toggleReviewFeatured(id, isFeatured) {
    try {
        await api.toggleReviewFeatured(id, isFeatured);
        showToast('Success', 'Featured status updated');
        await loadReviews();
    } catch (err) {
        showToast('Error', err.message, 'danger');
        await loadReviews();
    }
}

async function toggleReviewActive(id, isActive) {
    try {
        await api.toggleReviewActive(id, isActive);
        showToast('Success', 'Active status updated');
        await loadReviews();
    } catch (err) {
        showToast('Error', err.message, 'danger');
        await loadReviews();
    }
}

function editReview(id) {
    const review = reviews.find(r => r.id === id);
    if (!review) return;

    document.getElementById('reviewModalTitle').textContent = 'Edit Review';
    document.getElementById('reviewEditId').value = id;
    document.getElementById('reviewName').value = review.reviewer_name;
    document.getElementById('reviewRating').value = review.rating;
    document.getElementById('reviewDate').value = review.review_date;
    document.getElementById('reviewText').value = review.review_text;
    document.getElementById('reviewSnippet').value = review.review_snippet || '';
    document.getElementById('reviewServiceType').value = review.service_type || '';
    document.getElementById('reviewTags').value = (review.tags || []).join(', ');
    document.getElementById('reviewOwnerResponse').value = review.owner_response || '';
    document.getElementById('reviewIsFeatured').checked = !!review.is_featured;
    document.getElementById('reviewIsActive').checked = !!review.is_active;

    new bootstrap.Modal(document.getElementById('reviewModal')).show();
}

async function deleteReview(id) {
    const review = reviews.find(r => r.id === id);
    if (!review) return;

    if (!confirm('Delete review from ' + review.reviewer_name + '?')) return;

    try {
        await api.deleteReview(id);
        showToast('Success', 'Review deleted');
        await loadReviews();
    } catch (err) {
        showToast('Error', err.message, 'danger');
    }
}

// Add Review button
document.getElementById('addReviewBtn')?.addEventListener('click', () => {
    document.getElementById('reviewModalTitle').textContent = 'Add Review';
    document.getElementById('reviewForm').reset();
    document.getElementById('reviewEditId').value = '';
    document.getElementById('reviewIsActive').checked = true;
    new bootstrap.Modal(document.getElementById('reviewModal')).show();
});

// Review form submit
document.getElementById('reviewForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const id = document.getElementById('reviewEditId').value;
    const tagsStr = document.getElementById('reviewTags').value;
    const tags = tagsStr ? tagsStr.split(',').map(t => t.trim().toLowerCase()).filter(Boolean) : [];

    const data = {
        reviewer_name: document.getElementById('reviewName').value,
        rating: parseInt(document.getElementById('reviewRating').value),
        review_date: document.getElementById('reviewDate').value,
        review_text: document.getElementById('reviewText').value,
        review_snippet: document.getElementById('reviewSnippet').value || null,
        service_type: document.getElementById('reviewServiceType').value || null,
        owner_response: document.getElementById('reviewOwnerResponse').value || null,
        is_featured: document.getElementById('reviewIsFeatured').checked,
        is_active: document.getElementById('reviewIsActive').checked,
        tags: tags,
    };

    try {
        if (id) {
            await api.updateReview(id, data);
            showToast('Success', 'Review updated');
        } else {
            await api.createReview(data);
            showToast('Success', 'Review created');
        }
        bootstrap.Modal.getInstance(document.getElementById('reviewModal')).hide();
        await loadReviews();
    } catch (err) {
        showToast('Error', err.message, 'danger');
    }
});

// Review filter button
document.getElementById('applyReviewFilters')?.addEventListener('click', () => {
    loadReviews();
});

// Quick-add toggle
let qaAddedCount = 0;
document.getElementById('quickAddToggle')?.addEventListener('click', () => {
    const body = document.getElementById('quickAddBody');
    const chevron = document.getElementById('quickAddChevron');
    if (body) {
        body.classList.toggle('d-none');
        chevron.classList.toggle('bi-chevron-down');
        chevron.classList.toggle('bi-chevron-up');
    }
});

// Quick-add form submit
document.getElementById('quickAddForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const btn = document.getElementById('qaSubmitBtn');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span>';

    const tagsStr = document.getElementById('qaTags').value;
    const tags = tagsStr ? tagsStr.split(',').map(t => t.trim().toLowerCase()).filter(Boolean) : [];

    const data = {
        reviewer_name: document.getElementById('qaName').value.trim(),
        rating: 5,
        review_date: document.getElementById('qaDate').value.trim(),
        review_text: document.getElementById('qaText').value.trim(),
        review_snippet: document.getElementById('qaSnippet').value.trim() || null,
        service_type: document.getElementById('qaService').value || null,
        is_featured: document.getElementById('qaFeatured').checked,
        is_active: true,
        tags: tags,
    };

    try {
        await api.createReview(data);
        qaAddedCount++;
        document.getElementById('qaCount').textContent = qaAddedCount + ' added';

        // Clear fields but keep tags and service type for rapid entry
        document.getElementById('qaName').value = '';
        document.getElementById('qaDate').value = '';
        document.getElementById('qaText').value = '';
        document.getElementById('qaSnippet').value = '';
        document.getElementById('qaFeatured').checked = false;

        // Focus back to name for next entry
        document.getElementById('qaName').focus();

        showToast('Success', 'Review saved (' + qaAddedCount + ')');
        await loadReviews();
    } catch (err) {
        showToast('Error', err.message, 'danger');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="bi bi-plus-lg me-1"></i>Save';
    }
});
