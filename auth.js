/* ============================================================
   ShopIQ – Auth Logic (CAPTCHA, Validation, UI)
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
    // If already logged in, skip auth pages
    if (localStorage.getItem('isLoggedIn') === 'true') {
        window.location.href = "index.html";
        return;
    }

    // Determine which page we are on
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');

    if (loginForm) initLoginPage();
    if (signupForm) initSignupPage();
});

/**
 * Common Functionality: CAPTCHA Generator
 */
class CaptchaManager {
    constructor(canvasId, refreshBtnId) {
        this.canvas = document.getElementById(canvasId);
        this.refreshBtn = document.getElementById(refreshBtnId);
        this.currentValue = "";
        
        if (this.canvas) {
            this.ctx = this.canvas.getContext('2d');
            this.init();
        }
    }

    init() {
        this.generate();
        this.refreshBtn?.addEventListener('click', () => this.generate());
    }

    generate() {
        const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Avoid ambiguous chars
        this.currentValue = "";
        for (let i = 0; i < 5; i++) {
            this.currentValue += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        this.draw();
    }

    draw() {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;

        // Background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, w, h);

        // Distraction lines
        for (let i = 0; i < 6; i++) {
            ctx.strokeStyle = `rgba(${Math.random() * 255},${Math.random() * 255},${Math.random() * 255}, 0.3)`;
            ctx.beginPath();
            ctx.moveTo(Math.random() * w, Math.random() * h);
            ctx.lineTo(Math.random() * w, Math.random() * h);
            ctx.stroke();
        }

        // Text
        ctx.font = 'bold 30px Inter';
        ctx.textBaseline = 'middle';
        
        for (let i = 0; i < this.currentValue.length; i++) {
            ctx.save();
            const x = 30 + i * 40;
            const y = h / 2;
            const angle = (Math.random() - 0.5) * 0.4; // Rotate slightly
            
            ctx.translate(x, y);
            ctx.rotate(angle);
            ctx.fillStyle = i % 2 === 0 ? '#1e40af' : '#2563eb';
            ctx.fillText(this.currentValue[i], 0, 0);
            ctx.restore();
        }

        // Noise dots
        for (let i = 0; i < 50; i++) {
            ctx.fillStyle = `rgba(0,0,0,${Math.random() * 0.1})`;
            ctx.beginPath();
            ctx.arc(Math.random() * w, Math.random() * h, 1, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    validate(input) {
        return input.trim().toUpperCase() === this.currentValue;
    }
}

/**
 * Login Page Initialization
 */
function initLoginPage() {
    const captcha = new CaptchaManager('loginCaptchaCanvas', 'loginCaptchaRefresh');
    const eyeBtn = document.getElementById('loginEyeBtn');
    const pwdInput = document.getElementById('loginPassword');
    const emailInput = document.getElementById('loginEmail');
    const captchaInput = document.getElementById('loginCaptchaInput');

    // Toggle Password
    eyeBtn?.addEventListener('click', () => {
        const isPwd = pwdInput.type === 'password';
        pwdInput.type = isPwd ? 'text' : 'password';
        const icon = document.getElementById('eyeIconLogin');
        if (isPwd) {
            icon.innerHTML = '<path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zm0-4.5C7 2.5 2.73 5.61 1 10c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z" fill="currentColor"/>';
        } else {
            icon.innerHTML = '<path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" fill="currentColor"/>';
        }
    });

    // Handle Form Submit
    document.getElementById('loginForm').addEventListener('submit', (e) => {
        e.preventDefault();
        clearErrors(['loginEmailErr', 'loginPasswordErr', 'loginCaptchaErr']);

        let valid = true;

        if (!validateEmail(emailInput.value)) {
            showError('loginEmailErr', 'Please enter a valid email address');
            valid = false;
        }

        if (pwdInput.value.length < 6) {
            showError('loginPasswordErr', 'Password must be at least 6 characters');
            valid = false;
        }

        if (!captcha.validate(captchaInput.value)) {
            showError('loginCaptchaErr', 'Invalid CAPTCHA code');
            captcha.generate();
            valid = false;
        }

        if (valid) {
            if (!localStorage.getItem('userEmail')) {
                localStorage.setItem('userFirstName', 'ShopIQ');
                localStorage.setItem('userLastName', 'User');
                localStorage.setItem('userEmail', emailInput.value.trim());
            }
            simulateSubmit('loginSubmitBtn', 'loginBtnText', 'loginBtnSpinner');
        }
    });

    // Google Sign-In
    const googleBtn = document.getElementById('googleSignInBtn');
    if (googleBtn) {
        googleBtn.addEventListener('click', () => {
            googleBtn.innerHTML = `<span class="btn-spinner" style="display:inline-block; border-color: currentColor transparent currentColor transparent; width: 14px; height: 14px; margin-right: 8px;"></span> Connecting to Google...`;
            googleBtn.disabled = true;
            setTimeout(() => {
                localStorage.setItem('isLoggedIn', 'true');
                if (!localStorage.getItem('userEmail')) {
                    localStorage.setItem('userFirstName', 'Google');
                    localStorage.setItem('userLastName', 'User');
                    localStorage.setItem('userEmail', 'google.user@gmail.com');
                }
                window.location.href = "index.html";
            }, 1200);
        });
    }
}

/**
 * Signup Page Initialization
 */
function initSignupPage() {
    const captcha = new CaptchaManager('signupCaptchaCanvas', 'signupCaptchaRefresh');
    const pwdInput = document.getElementById('signupPassword');
    const confirmInput = document.getElementById('signupConfirmPassword');
    const strengthFill = document.getElementById('strengthFill');
    const strengthLabel = document.getElementById('strengthLabel');
    const strengthWrap = document.getElementById('strengthWrap');

    // Password Eye Toggles
    setupEyeToggle('signupEyeBtn', 'signupPassword', 'eyeIconSignup');
    setupEyeToggle('signupConfirmEyeBtn', 'signupConfirmPassword', 'eyeIconConfirm');

    // Password Strength
    pwdInput.addEventListener('input', () => {
        const val = pwdInput.value;
        if (val === "") {
            strengthWrap.style.display = 'none';
            return;
        }
        strengthWrap.style.display = 'block';
        const strength = calculateStrength(val);
        updateStrengthUI(strength);
    });

    // Handle Form Submit
    document.getElementById('signupForm').addEventListener('submit', (e) => {
        e.preventDefault();
        clearErrors(['signupFirstNameErr', 'signupLastNameErr', 'signupEmailErr', 'signupPasswordErr', 'signupConfirmErr', 'signupCaptchaErr', 'agreeTermsErr']);

        let valid = true;

        if (document.getElementById('signupFirstName').value.trim() === "") {
            showError('signupFirstNameErr', 'Required');
            valid = false;
        }
        
        if (!validateEmail(document.getElementById('signupEmail').value)) {
            showError('signupEmailErr', 'Enter a valid email');
            valid = false;
        }

        if (pwdInput.value.length < 8) {
            showError('signupPasswordErr', 'Min 8 characters');
            valid = false;
        }

        if (pwdInput.value !== confirmInput.value) {
            showError('signupConfirmErr', 'Passwords do not match');
            valid = false;
        }

        if (!captcha.validate(document.getElementById('signupCaptchaInput').value)) {
            showError('signupCaptchaErr', 'Invalid CAPTCHA');
            captcha.generate();
            valid = false;
        }

        if (!document.getElementById('agreeTerms').checked) {
            showError('agreeTermsErr', 'You must agree to the terms');
            valid = false;
        }

        if (valid) {
            localStorage.setItem('userFirstName', document.getElementById('signupFirstName').value.trim());
            localStorage.setItem('userLastName', document.getElementById('signupLastName').value.trim());
            localStorage.setItem('userEmail', document.getElementById('signupEmail').value.trim());
            simulateSubmit('signupSubmitBtn', 'signupBtnText', 'signupBtnSpinner');
        }
    });

    // Google Sign-Up
    const googleBtn = document.getElementById('googleSignUpBtn');
    if (googleBtn) {
        googleBtn.addEventListener('click', () => {
            googleBtn.innerHTML = `<span class="btn-spinner" style="display:inline-block; border-color: currentColor transparent currentColor transparent; width: 14px; height: 14px; margin-right: 8px;"></span> Connecting to Google...`;
            googleBtn.disabled = true;
            setTimeout(() => {
                localStorage.setItem('isLoggedIn', 'true');
                localStorage.setItem('userFirstName', 'Google');
                localStorage.setItem('userLastName', 'User');
                localStorage.setItem('userEmail', 'google.user@gmail.com');
                window.location.href = "index.html";
            }, 1200);
        });
    }
}

/**
 * Helpers
 */
function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function showError(id, msg) {
    const el = document.getElementById(id);
    if (el) el.innerText = msg;
}

function clearErrors(ids) {
    ids.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerText = "";
    });
}

function setupEyeToggle(btnId, inputId, iconId) {
    const btn = document.getElementById(btnId);
    const input = document.getElementById(inputId);
    const icon = document.getElementById(iconId);
    
    btn?.addEventListener('click', () => {
        const isPwd = input.type === 'password';
        input.type = isPwd ? 'text' : 'password';
        if (isPwd) {
            icon.innerHTML = '<path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zm0-4.5C7 2.5 2.73 5.61 1 10c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z" fill="currentColor"/>';
        } else {
            icon.innerHTML = '<path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" fill="currentColor"/>';
        }
    });
}

function calculateStrength(pwd) {
    let s = 0;
    if (pwd.length > 7) s++;
    if (/[A-Z]/.test(pwd)) s++;
    if (/[0-9]/.test(pwd)) s++;
    if (/[^A-Za-z0-9]/.test(pwd)) s++;
    return s;
}

function updateStrengthUI(s) {
    const fill = document.getElementById('strengthFill');
    const label = document.getElementById('strengthLabel');
    const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e'];
    const labels = ['Weak', 'Fair', 'Good', 'Strong'];
    
    fill.style.width = ((s + 1) * 25) + '%';
    fill.style.background = colors[s] || colors[0];
    label.innerText = labels[s] || labels[0];
    label.style.color = colors[s] || colors[0];
}

function simulateSubmit(btnId, textId, spinnerId) {
    const btn = document.getElementById(btnId);
    const text = document.getElementById(textId);
    const spinner = document.getElementById(spinnerId);

    btn.disabled = true;
    text.style.display = 'none';
    spinner.style.display = 'block';

    setTimeout(() => {
        localStorage.setItem('isLoggedIn', 'true');
        alert("Success! Redirecting to dashboard...");
        window.location.href = "index.html";
    }, 2000);
}
