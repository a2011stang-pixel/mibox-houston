// Admin API Client
const API_BASE = '/api';

class AdminAPI {
    constructor() {
        this.token = localStorage.getItem('admin_token');
    }

    async request(method, endpoint, data = null) {
        const headers = {
            'Content-Type': 'application/json',
        };
        
        if (this.token) {
            headers['Authorization'] = 'Bearer ' + this.token;
        }

        const options = { method, headers };
        
        if (data) {
            options.body = JSON.stringify(data);
        }

        const response = await fetch(API_BASE + endpoint, options);
        
        if (response.status === 401) {
            localStorage.removeItem('admin_token');
            localStorage.removeItem('admin_token_expires');
            window.location.href = '/admin/login.html';
            throw new Error('Session expired');
        }

        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.error || 'Request failed');
        }

        return result;
    }

    // Auth
    async getMe() {
        return this.request('GET', '/auth/me');
    }

    async logout() {
        await this.request('POST', '/auth/logout');
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_token_expires');
    }

    // Zones
    async getZones() {
        return this.request('GET', '/zones');
    }

    async getZone(id) {
        return this.request('GET', '/zones/' + id);
    }

    async createZone(data) {
        return this.request('POST', '/zones', data);
    }

    async updateZone(id, data) {
        return this.request('PUT', '/zones/' + id, data);
    }

    async deleteZone(id) {
        return this.request('DELETE', '/zones/' + id);
    }

    // ZIP Codes
    async getZips(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request('GET', '/zips' + (query ? '?' + query : ''));
    }

    async updateZip(zip, data) {
        return this.request('PUT', '/zips/' + zip, data);
    }

    async deleteZip(zip) {
        return this.request('DELETE', '/zips/' + zip);
    }

    async importZips(csv) {
        return this.request('POST', '/zips/import', { csv });
    }

    getExportZipsUrl() {
        return API_BASE + '/zips/export';
    }

    // Pricing
    async getPricing() {
        return this.request('GET', '/pricing');
    }

    async updatePricing(data) {
        return this.request('PUT', '/pricing', data);
    }

    // Audit
    async getAudit(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request('GET', '/audit' + (query ? '?' + query : ''));
    }

    getExportAuditUrl(params = {}) {
        const query = new URLSearchParams(params).toString();
        return API_BASE + '/audit/export' + (query ? '?' + query : '');
    }
}

const api = new AdminAPI();
