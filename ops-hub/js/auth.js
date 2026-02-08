// Admin Authentication Handler
const API_BASE = 'https://mibox-houston-api.cmykprnt.workers.dev/api';

let tempToken = null;

// Check if already logged in
document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('admin_token');
    if (token) {
        window.location.href = '/ops-hub/';
    }
});

// Login form handler
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const btn = e.target.querySelector('button');
    const spinner = btn.querySelector('.spinner-border');
    const errorDiv = document.getElementById('loginError');
    
    btn.disabled = true;
    spinner.classList.remove('d-none');
    errorDiv.classList.add('d-none');
    
    try {
        const response = await fetch(API_BASE + '/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Login failed');
        }
        
        tempToken = data.temp_token;
        
        if (data.requires_mfa_setup) {
            await setupMFA();
        } else if (data.requires_totp) {
            showTOTPForm();
        }
    } catch (err) {
        errorDiv.textContent = err.message;
        errorDiv.classList.remove('d-none');
    } finally {
        btn.disabled = false;
        spinner.classList.add('d-none');
    }
});

// TOTP verification form handler
document.getElementById('totpForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const code = document.getElementById('totpCode').value;
    const btn = e.target.querySelector('button');
    const spinner = btn.querySelector('.spinner-border');
    const errorDiv = document.getElementById('totpError');
    
    btn.disabled = true;
    spinner.classList.remove('d-none');
    errorDiv.classList.add('d-none');
    
    try {
        const response = await fetch(API_BASE + '/auth/verify-totp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ temp_token: tempToken, code }),
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Verification failed');
        }
        
        localStorage.setItem('admin_token', data.access_token);
        localStorage.setItem('admin_token_expires', Date.now() + (data.expires_in * 1000));
        window.location.href = '/ops-hub/';
    } catch (err) {
        errorDiv.textContent = err.message;
        errorDiv.classList.remove('d-none');
        document.getElementById('totpCode').value = '';
    } finally {
        btn.disabled = false;
        spinner.classList.add('d-none');
    }
});

// MFA confirmation form handler
document.getElementById('mfaConfirmForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const code = document.getElementById('mfaCode').value;
    const btn = e.target.querySelector('button');
    const spinner = btn.querySelector('.spinner-border');
    const errorDiv = document.getElementById('mfaError');
    
    btn.disabled = true;
    spinner.classList.remove('d-none');
    errorDiv.classList.add('d-none');
    
    try {
        const response = await fetch(API_BASE + '/auth/enable-totp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ temp_token: tempToken, code }),
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Verification failed');
        }
        
        localStorage.setItem('admin_token', data.access_token);
        localStorage.setItem('admin_token_expires', Date.now() + (data.expires_in * 1000));
        window.location.href = '/ops-hub/';
    } catch (err) {
        errorDiv.textContent = err.message;
        errorDiv.classList.remove('d-none');
        document.getElementById('mfaCode').value = '';
    } finally {
        btn.disabled = false;
        spinner.classList.add('d-none');
    }
});

function showTOTPForm() {
    document.getElementById('loginForm').classList.add('d-none');
    document.getElementById('totpForm').classList.remove('d-none');
    document.getElementById('totpCode').focus();
}

async function setupMFA() {
    try {
        const response = await fetch(API_BASE + '/auth/setup-totp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ temp_token: tempToken }),
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Failed to setup MFA');
        }
        
        document.getElementById('loginForm').classList.add('d-none');
        document.getElementById('mfaSetup').classList.remove('d-none');
        document.getElementById('totpSecret').textContent = data.secret;
        
        // Generate QR code
        const qrContainer = document.getElementById('qrCode');
        await QRCode.toCanvas(qrContainer, data.otpauth_uri, { width: 200 });
        
        document.getElementById('mfaCode').focus();
    } catch (err) {
        const errorDiv = document.getElementById('loginError');
        errorDiv.textContent = err.message;
        errorDiv.classList.remove('d-none');
    }
}
