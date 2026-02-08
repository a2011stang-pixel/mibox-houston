// Admin Dashboard Main Script
let zones = [];
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

// Format currency
function formatCurrency(cents) {
    return '$' + (cents / 100).toFixed(2);
}

// Dashboard
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
            '<tr><td>' + z.name + '</td><td>' + z.display_name + '</td><td>' + 
            formatCurrency(z.delivery_fee) + '</td><td>' + (z.zip_count || 0) + '</td></tr>'
        ).join('');
    } catch (err) {
        showToast('Error', err.message, 'error');
    }
}

// Zones
async function loadZones() {
    try {
        const data = await api.getZones();
        zones = data.zones;
        
        const tbody = document.getElementById('zonesTable');
        tbody.innerHTML = zones.map(z => 
            '<tr>' +
            '<td>' + z.name + '</td>' +
            '<td>' + z.display_name + '</td>' +
            '<td>' + formatCurrency(z.delivery_fee) + '</td>' +
            '<td>' + formatCurrency(z.pickup_fee) + '</td>' +
            '<td>' + formatCurrency(z.relocation_fee) + '</td>' +
            '<td>' + (z.zip_count || 0) + '</td>' +
            '<td><span class="badge ' + (z.is_active ? 'bg-success' : 'bg-secondary') + '">' + 
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

// ZIP Codes
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
            zones.map(z => '<option value="' + z.id + '">' + z.display_name + '</option>').join('');
        
        const zipZoneSelect = document.getElementById('zipZone');
        zipZoneSelect.innerHTML = zones.map(z => 
            '<option value="' + z.id + '">' + z.display_name + '</option>'
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
            zone: zone || undefined,
            limit: zipLimit,
            offset: zipPage * zipLimit,
        });
        
        const tbody = document.getElementById('zipsTable');
        tbody.innerHTML = data.zips.map(z => 
            '<tr>' +
            '<td>' + z.zip + '</td>' +
            '<td>' + (z.zone_display_name || '<span class="text-muted">Unassigned</span>') + '</td>' +
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

// Pricing
async function loadPricing() {
    try {
        const data = await api.getPricing();
        
        for (const p of data.pricing) {
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

// Audit Log
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
            '<td>' + e.user_email + '</td>' +
            '<td><code>' + e.action + '</code></td>' +
            '<td>' + e.entity_type + (e.entity_id ? ' #' + e.entity_id : '') + '</td>' +
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

// Utilities
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
