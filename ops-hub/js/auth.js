// Authentication handling for login page
let tempToken = null;

document.addEventListener('DOMContentLoaded', () => {
    // Check if already logged in
    const token = localStorage.getItem('admin_token');
    const expires = localStorage.getItem('admin_token_expires');

    if (token && expires && parseInt(expires) > Date.now()) {
        window.location.href = '/ops-hub/';
        return;
    }

    // Login form
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const errorDiv = document.getElementById('loginError');

        try {
            errorDiv.classList.add('d-none');
            const result = await api.login(email, password);

            if (result.requiresMfaSetup) {
                tempToken = result.tempToken;
                api.token = tempToken;
                await showMfaSetup();
            } else if (result.requiresMfa) {
                tempToken = result.tempToken;
                api.token = tempToken;
                showTotpForm();
            } else if (result.token) {
                api.setToken(result.token, result.expiresAt);
                window.location.href = '/ops-hub/';
            }
        } catch (err) {
            errorDiv.textContent = err.message;
            errorDiv.classList.remove('d-none');
        }
    });

    // TOTP verification form
    document.getElementById('totpForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const code = document.getElementById('totpCode').value;
        const errorDiv = document.getElementById('totpError');

        try {
            errorDiv.classList.add('d-none');
            const result = await api.verifyTotp(code);

            if (result.token) {
                api.setToken(result.token, result.expiresAt);
                window.location.href = '/ops-hub/';
            }
        } catch (err) {
            errorDiv.textContent = err.message;
            errorDiv.classList.remove('d-none');
        }
    });

    // MFA setup confirmation form
    document.getElementById('mfaConfirmForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const code = document.getElementById('mfaCode').value;
        const errorDiv = document.getElementById('mfaError');

        try {
            errorDiv.classList.add('d-none');
            const result = await api.enableTotp(code);

            if (result.token) {
                api.setToken(result.token, result.expiresAt);
                window.location.href = '/ops-hub/';
            }
        } catch (err) {
            errorDiv.textContent = err.message;
            errorDiv.classList.remove('d-none');
        }
    });
});

function showTotpForm() {
    document.getElementById('loginForm').classList.add('d-none');
    document.getElementById('mfaSetup').classList.add('d-none');
    document.getElementById('totpForm').classList.remove('d-none');
    document.getElementById('totpCode').focus();
}

async function showMfaSetup() {
    try {
        const setup = await api.setupTotp();

        // Use the QR code URL from the API
        document.getElementById('qrCode').src = setup.qrCodeUrl;
        document.getElementById('totpSecret').textContent = setup.secret;

        document.getElementById('loginForm').classList.add('d-none');
        document.getElementById('totpForm').classList.add('d-none');
        document.getElementById('mfaSetup').classList.remove('d-none');
        document.getElementById('mfaCode').focus();
    } catch (err) {
        document.getElementById('loginError').textContent = err.message;
        document.getElementById('loginError').classList.remove('d-none');
    }
}
