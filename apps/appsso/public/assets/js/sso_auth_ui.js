const TURNSTILE_SITE_KEY = "0x4AAAAAACs8dTzAqMf1YwNJ";
const allViews = ['view-success-redirect', 'view-login', 'view-register', 'view-msg-email', 'view-reset-password', 'view-pin-check', 'view-pin-input', 'view-pin-setup', 'view-otp-verify', 'view-input-id-only', 'view-social-role'];
let otpInterval;

window.enforceNumeric = function(input) { input.value = input.value.replace(/[^0-9]/g, ''); }
window.togglePw = function(inputId, icon) { const el = document.getElementById(inputId); if(el.type === "password") { el.type = "text"; icon.classList.replace("fa-eye-slash", "fa-eye"); } else { el.type = "password"; icon.classList.replace("fa-eye", "fa-eye-slash"); } }

window.showToast = function(message, type = 'success', duration = 4000) {
    const container = document.getElementById('toast-container'); if(!container) return;
    const toast = document.createElement('div');
    let icon = type === 'success' ? '<i class="fa-solid fa-circle-check text-green-500 text-xl"></i>' : type === 'error' ? '<i class="fa-solid fa-circle-xmark text-red-500 text-xl"></i>' : '<i class="fa-solid fa-circle-info text-blue-500 text-xl"></i>';
    toast.className = `toast flex items-center ${type}`; toast.innerHTML = `${icon}<div class="text-sm font-medium text-gray-700">${message}</div>`;
    container.appendChild(toast); setTimeout(() => toast.classList.add('show'), 10); setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 300); }, duration);
}

window.showView = function(target) {
    allViews.forEach(v => { const el = document.getElementById(v); if(el) el.classList.add('hidden'); });
    const targetEl = document.getElementById(target); if(targetEl) targetEl.classList.remove('hidden');
    const bp = document.getElementById('blue-panel');
    if(target !== 'view-login' && target !== 'view-register') {
        if(window.innerWidth < 768 && bp) bp.classList.add('hidden');
    } else {
        if(bp) bp.classList.remove('hidden');
    }
}

window.switchMode = function(mode) {
    const mc = document.getElementById('main-container'), bp = document.getElementById('blue-panel');
    const pLogin = document.getElementById('panel-content-login'), pReg = document.getElementById('panel-content-register');
    if(bp) bp.classList.remove('hidden');
    if (mode === 'register') {
        if(window.innerWidth > 767) { if(mc) mc.classList.add('flex-row-reverse'); if(bp) bp.classList.add('reverse'); }
        if(pLogin) pLogin.classList.add('hidden'); if(pReg) pReg.classList.remove('hidden'); window.showView('view-register');
    } else {
        if(mc) mc.classList.remove('flex-row-reverse'); if(bp) bp.classList.remove('reverse');
        if(pReg) pReg.classList.add('hidden'); if(pLogin) pLogin.classList.remove('hidden'); window.showView('view-login');
    }
    document.querySelectorAll('form').forEach(form => form.reset());
}

async function sendApi(action, payload) { 
    try { 
        const res = await fetch(`https://api.orlandmanagement.com/api/v1/auth/${action}`, { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify(payload) 
        }); 
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
            return await res.json();
        } else {
            return { status: 'error', message: 'Terjadi kesalahan sistem.' };
        }
    } catch(e) { 
        return { status: 'error', message: 'Koneksi terputus.' }; 
    } 
}

// THE SMART REDIRECT ENGINE
function doSmartRedirect(role, token = null) {
    window.showView('view-success-redirect');
    const urlParams = new URLSearchParams(window.location.search);
    const intentUrl = urlParams.get('redirect'); 

    let targetUrl = '';
    if (intentUrl) {
        targetUrl = token ? `${intentUrl}?token=${token}` : intentUrl;
    } else {
        if (role === 'CLIENT') {
            targetUrl = token ? `https://client.orlandmanagement.com/dashboard?token=${token}` : 'https://client.orlandmanagement.com/dashboard';
        } else if (role === 'TALENT') {
            targetUrl = token ? `https://talent.orlandmanagement.com/dashboard?token=${token}` : 'https://talent.orlandmanagement.com/dashboard';
        } else {
            targetUrl = 'https://orlandmanagement.com';
        }
    }

    let count = 2;
    const timerEl = document.getElementById('redirect-timer');
    setInterval(() => { 
        count--; 
        if(timerEl) timerEl.innerText = count; 
        if(count <= 0) window.location.href = targetUrl; 
    }, 1000);
}

window.handleRegularLogin = async function() {
    window.showToast("Memverifikasi...", "info");
    const res = await sendApi('login', { identifier: document.getElementById('login-id').value, password: document.getElementById('login-pass').value });
    
    if(res.status === 'ok' || res.token) { 
        window.showToast("Login Berhasil!", "success"); 
        sessionStorage.setItem('temp_sso_token', res.token);
        doSmartRedirect(res.role || 'CLIENT', res.token);
    } else {
        window.showToast(res.message || "Gagal Login", "error");
    }
}

document.addEventListener('DOMContentLoaded', async () => { 
    const tempToken = sessionStorage.getItem('temp_sso_token');
    if (tempToken) {
        doSmartRedirect('CLIENT', tempToken); 
        return;
    }
});
