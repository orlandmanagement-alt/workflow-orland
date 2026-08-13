//const TURNSTILE_SITE_KEY = "0x4AAAAAACs8dTzAqMf1YwNJ";
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

    const tTitle = document.getElementById('single-id-title');
    const tDesc = document.getElementById('single-id-desc');
    const tPurp = document.getElementById('single-id-purpose');
    const tBtn = document.getElementById('single-id-btn');

    if(target === 'view-login-otp' && tTitle) { tTitle.innerText = "Login via OTP"; tDesc.innerText = "Kami akan mengirimkan OTP (Berlaku 3 Menit)."; tPurp.value = "login"; tBtn.innerText = "Kirim OTP"; window.showView('view-input-id-only'); }
    if(target === 'view-forgot' && tTitle) { tTitle.innerText = "Lupa Password"; tDesc.innerText = "Kami akan mengirimkan Link Reset Rahasia ke Email Anda."; tPurp.value = "reset"; tBtn.innerText = "Kirim Link Reset"; window.showView('view-input-id-only'); }
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
    window.resetTurnstile();
}

// --- [DISABLED TURNSTILE SEMENTARA] ---
// window.renderTurnstileWidgets = function() { return; /* if (!window.turnstile) return; ['turnstile-login', 'turnstile-register'].forEach(id => { const el = document.getElementById(id); if (el && !el.hasChildNodes()) window.turnstile.render(el, { sitekey: TURNSTILE_SITE_KEY, theme: 'light' }); }); */ }
// window.resetTurnstile = function() { return; /* if (window.turnstile) window.turnstile.reset(); */ }
// --------------------------------------

// Tambahkan di mana saja (disarankan di dekat fungsi login lainnya)
window.handleGoogleLogin = async function(response) {
    if (!response || !response.credential) {
        return window.showToast("Google Login dibatalkan atau gagal", "error");
    }
    
    window.showToast("Memverifikasi Google...", "info");
    
    // Nanti kamu bisa menambahkan endpoint `/api/auth/google` di backend
    // untuk memproses JWT token ini (response.credential)
    console.log("Token JWT dari Google:", response.credential);
    
    // Contoh pemanggilan ke backend (sementara di-comment karena belum ada endpoint-nya di backend)
    /*
    const res = await sendApi('google', { token: response.credential });
    if(res.status === 'ok') { 
        doRedirectCountdown(res.role || 'User', "Login Google Sukses!", res.redirect_url); 
    } else { 
        window.showToast(res.message, "error"); 
    }
    */
}
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

function startOtpTimer() {
    clearInterval(otpInterval); let timeLeft = 180; const timerEl = document.getElementById('otp-timer'), resendBtn = document.getElementById('btn-resend-otp');
    if(timerEl && resendBtn) {
        timerEl.parentElement.classList.remove('hidden'); resendBtn.classList.add('hidden'); timerEl.innerText = "03:00";
        otpInterval = setInterval(() => { 
            timeLeft--; 
            const m = Math.floor(timeLeft/60).toString().padStart(2, '0');
            const s = (timeLeft%60).toString().padStart(2,'0'); 
            timerEl.innerText = `${m}:${s}`; 
            if(timeLeft<=0) { clearInterval(otpInterval); timerEl.parentElement.classList.add('hidden'); resendBtn.classList.remove('hidden'); } 
        }, 1000);
    }
}

// MODIFIKASI: Redirect menggunakan targetUrl dari backend agar token ikut terbawa
function doRedirectCountdown(role, title = "Anda Sudah Login!", targetUrl) {
    document.getElementById('success-title').innerText = title;
    const roleEl = document.getElementById('logged-in-role');
    if (roleEl) roleEl.innerText = role || 'User';
    
    window.showView('view-success-redirect');
    
    let count = 5; // Hitung mundur 5 detik
    const timerEl = document.getElementById('redirect-timer');
    if (timerEl) timerEl.innerText = count;
    
    const intervalId = setInterval(() => { 
        count--; 
        if(timerEl) timerEl.innerText = count; 
        
        if(count <= 0) {
            clearInterval(intervalId);
            // FALLBACK AMAN: Jika targetUrl kosong/undefined, otomatis arahkan ke Homepage
            const finalUrl = targetUrl ? targetUrl : 'https://www.orlandmanagement.com';
            window.location.href = finalUrl; 
        } 
    }, 1000);
}

window.doLogout = async function() { window.showToast("Logout...", "info"); await fetch('/api/auth/logout', { method: 'POST' }); window.location.href = "/"; }

window.handleRegisterSubmit = async function() {
	// --- [DISABLED TURNSTILE SEMENTARA] ---
   // const ts = document.querySelector('#turnstile-register [name="cf-turnstile-response"]')?.value; if(!ts && window.turnstile) return window.showToast("Centang Captcha", "error");
    const ts = "";
	// --------------------------------------
	if(document.getElementById('reg-pass').value.length < 8) return window.showToast("Password minimal 8 karakter", "error");
    window.showToast("Memproses...", "info");
    const res = await sendApi('register', { fullName: document.getElementById('reg-user').value, email: document.getElementById('reg-email').value, phone: document.getElementById('reg-phone').value, password: document.getElementById('reg-pass').value, role: document.querySelector('input[name="reg-role"]:checked').value, turnstile_token: ts });
    // window.resetTurnstile();
    if(res.status === 'ok') { window.showToast("Sukses!", "success"); window.showView('view-msg-email'); } else window.showToast(res.message, "error");
}

window.submitSingleId = async function() {
    const id = document.getElementById('single-id-input').value; const purp = document.getElementById('single-id-purpose').value;
    window.showToast("Meminta...", "info");
    const endpoint = purp === 'reset' ? 'request-reset' : 'request-otp';
    const res = await sendApi(endpoint, { identifier: id, purpose: purp });
    if(res.status === 'ok') {
        if(purp === 'reset') { window.showToast("Sukses!", "success"); document.getElementById('msg-email-desc').innerText = "Link Rahasia untuk Reset Password telah dikirim ke email Anda."; window.showView('view-msg-email'); } 
        else { window.showToast("Terkirim!", "success"); document.getElementById('otp-identifier').value = id; document.getElementById('otp-purpose').value = purp; document.getElementById('otp-target-display').innerText = id; window.showView('view-otp-verify'); startOtpTimer(); }
    } else window.showToast(res.message, "error");
}

window.submitNewPassword = async function() {
    const token = document.getElementById('reset-token-hidden').value; const newPass = document.getElementById('new-pass').value; const confPass = document.getElementById('confirm-new-pass').value;
    if(newPass.length < 8) return window.showToast("Minimal 8 karakter", "error"); if(newPass !== confPass) return window.showToast("Password tidak cocok", "error");
    window.showToast("Menyimpan password baru...", "info");
    const res = await sendApi('reset-password', { token: token, new_password: newPass });
    if(res.status === 'ok') { window.showToast("Password berhasil diubah!", "success"); setTimeout(() => window.switchMode('login'), 2000); } else window.showToast(res.message, "error");
}

window.checkPinStatus = async function() {
    const id = document.getElementById('pin-check-id').value; window.showToast("Mengecek identitas...", "info");
    const res = await sendApi('check-pin', { identifier: id });
    if(res.status === 'ok') {
        if(res.has_pin) { document.getElementById('pin-login-identifier').value = res.email; document.getElementById('pin-input-email').innerText = res.email; window.showView('view-pin-input'); } 
        else { document.getElementById('pin-setup-identifier').value = res.email; window.showView('view-pin-setup'); }
    } else window.showToast(res.message, "error");
}

window.requestPinOtp = async function() {
    const p1 = document.getElementById('new-pin-setup').value, p2 = document.getElementById('confirm-pin-setup').value;
    if(p1.length !== 6 || p1 !== p2) return window.showToast("PIN harus 6 digit dan cocok.", "error");
    const id = document.getElementById('pin-setup-identifier').value; window.showToast("Meminta OTP Keamanan...", "info");
    const res = await sendApi('request-otp', { identifier: id, purpose: 'setup-pin' });
    if(res.status === 'ok') { window.showToast("OTP Terkirim!", "success"); document.getElementById('otp-identifier').value = id; document.getElementById('otp-purpose').value = 'setup-pin'; document.getElementById('otp-target-display').innerText = id; window.showView('view-otp-verify'); startOtpTimer(); } else window.showToast(res.message, "error");
}

window.loginWithPin = async function() {
    const id = document.getElementById('pin-login-identifier').value, pin = document.getElementById('pin-code').value; window.showToast("Verifikasi PIN...", "info");
    const res = await sendApi('login-pin', { identifier: id, pin: pin });
    if(res.status === 'ok') { window.showToast("Login Sukses!", "success"); doRedirectCountdown(res.role || 'User', "Login Sukses!", res.redirect_url); } else window.showToast(res.message, "error");
}

window.submitOtp = async function() {
    const id = document.getElementById('otp-identifier').value, purp = document.getElementById('otp-purpose').value, code = document.getElementById('otp-code').value;
    const endpoint = purp === 'login' ? 'login-otp' : 'setup-pin';
    const payload = { identifier: id, otp: code };
    if (purp === 'setup-pin') payload.new_pin = document.getElementById('new-pin-setup')?.value;
    window.showToast("Memverifikasi...", "info");
    const res = await sendApi(endpoint, payload);
    if(res.status === 'ok') { clearInterval(otpInterval); window.showToast("Akses Diberikan!", "success"); doRedirectCountdown(res.role || 'User', "Akses Diberikan!", res.redirect_url); } else window.showToast(res.message, "error");
}

window.resendOtp = async function() {
    const id = document.getElementById('otp-identifier').value, purp = document.getElementById('otp-purpose').value; window.showToast("Mengirim ulang...", "info");
    const res = await sendApi('request-otp', { identifier: id, purpose: purp });
    if(res.status === 'ok') { window.showToast("Terkirim ulang", "success"); startOtpTimer(); } else window.showToast(res.message, "error");
}

window.handleRegularLogin = async function() {
	// --- [DISABLED TURNSTILE SEMENTARA] ---
    // const ts = document.querySelector('#turnstile-login [name="cf-turnstile-response"]')?.value; if(!ts && window.turnstile) return window.showToast("Harap centang Captcha", "error");
    const ts = "";
	// --------------------------------------
	window.showToast("Memverifikasi...", "info");
    const res = await sendApi('login-password', { identifier: document.getElementById('login-id').value, password: document.getElementById('login-pass').value, turnstile_token: ts });
   // window.resetTurnstile();
    if(res.status === 'ok') { window.showToast("Login Berhasil!", "success"); doRedirectCountdown(res.role || 'User', "Login Sukses!", res.redirect_url); } else window.showToast(res.message, "error");
}

document.addEventListener('DOMContentLoaded', async () => { 
    setTimeout(window.renderTurnstileWidgets, 500); 
    const urlParams = new URLSearchParams(window.location.search);
    
    if (urlParams.get('activation_token')) {
        window.showToast("Memverifikasi Aktivasi...", "info");
        const res = await sendApi('verify-activation', { token: urlParams.get('activation_token') });
        if(res.status === 'ok') { 
            doRedirectCountdown(res.role, "Aktivasi Berhasil!", res.redirect_url); 
            window.history.replaceState({}, document.title, window.location.pathname); 
            return; 
        } else { 
            alert("GAGAL AKTIVASI: " + res.message); 
            window.showToast(res.message, "error"); 
            window.history.replaceState({}, document.title, window.location.pathname); 
        }
    }

    try { 
        const meRes = await fetch('/api/auth/me'); 
        if (meRes.ok) { 
            const data = await meRes.json(); 
            doRedirectCountdown(data.user.role, "Anda Sudah Login!", data.redirect_url); 
            return; 
        } 
    } catch(e) {}
});

window.addEventListener('resize', () => { if(!document.getElementById('view-register')?.classList.contains('hidden') && window.innerWidth > 767) { document.getElementById('main-container')?.classList.add('flex-row-reverse'); document.getElementById('blue-panel')?.classList.add('reverse'); } });
