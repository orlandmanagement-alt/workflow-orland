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

// MENGGUNAKAN RELATIVE PATH KE BACKEND SSO (auth.ts)
async function sendApi(action, payload) { 
    try { 
        const res = await fetch(`/api/auth/${action}`, { 
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

window.doLogout = async function() { 
    window.showToast("Logout...", "info"); 
    await fetch('/api/auth/logout', { method: 'POST' }); 
    window.location.href = "/"; 
}

window.handleRegularLogin = async function() {
    window.showToast("Memverifikasi...", "info");
    
    // MENEMBAK KE /login-password SESUAI auth.ts
    const res = await sendApi('login-password', { 
        identifier: document.getElementById('login-id').value, 
        password: document.getElementById('login-pass').value 
    });
    
    if(res.status === 'ok') { 
        window.showToast("Login Berhasil!", "success"); 
        
        // Eksekusi redirect dari auth.ts
        if (res.redirect_url) {
            window.showView('view-success-redirect');
            setTimeout(() => window.location.href = res.redirect_url, 1000);
        }
    } else {
        window.showToast(res.message || "Gagal Login", "error");
    }
}

document.addEventListener('DOMContentLoaded', async () => { 
    // CEK SESI SAAT HALAMAN DIBUKA
    try { 
        const meRes = await fetch('/api/auth/me'); 
        if (meRes.ok) { 
            const data = await meRes.json(); 
            if(data.user && data.redirect_url) {
                window.showView('view-success-redirect');
                window.location.href = data.redirect_url; 
            }
        } 
    } catch(e) {}
});
