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
                // Need to set up MFA
                tempToken = result.tempToken;
                api.token = tempToken;
                await showMfaSetup();
            } else if (result.requiresMfa) {
                // Need to verify MFA
                tempToken = result.tempToken;
                api.token = tempToken;
                showTotpForm();
            } else if (result.token) {
                // Login successful (shouldn't happen without MFA)
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

    // MFA setup form
    document.getElementById('mfaSetupForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const code = document.getElementById('setupCode').value;
        const errorDiv = document.getElementById('mfaSetupError');

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
    document.getElementById('loginCard').classList.add('d-none');
    document.getElementById('mfaSetupCard').classList.add('d-none');
    document.getElementById('totpCard').classList.remove('d-none');
    document.getElementById('totpCode').focus();
}

async function showMfaSetup() {
    try {
        const setup = await api.setupTotp();

        document.getElementById('qrCode').src = setup.qrCodeUrl;
        document.getElementById('mfaSecret').textContent = setup.secret;

        document.getElementById('loginCard').classList.add('d-none');
        document.getElementById('totpCard').classList.add('d-none');
        document.getElementById('mfaSetupCard').classList.remove('d-none');
        document.getElementById('setupCode').focus();
    } catch (err) {
        document.getElementById('loginError').textContent = err.message;
        document.getElementById('loginError').classList.remove('d-none');
    }
}
