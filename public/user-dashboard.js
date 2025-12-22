document.addEventListener('DOMContentLoaded', async () => {
    
    // 🔥 1. فحص صلاحية الأدمن (من الباك اند مباشرة)
    // لا نعتمد على أي شيء مخزن محلياً لهذا الغرض الأمني
    await checkAdminRoleFromBackend();

    // 2. باقي المنطق (المفضلة، المودال)
    const userPhone = localStorage.getItem('userPhone'); // هذا فقط لتسهيل الكتابة في المودال وليس للتحقق
    const favoritesBtn = document.getElementById('show-favorites');
    const favoritesArea = document.getElementById('favorites-area');
    const favoritesContainer = document.getElementById('favorites-listings');
    const modal = document.getElementById("passwordModal");

    if (favoritesBtn) {
        favoritesBtn.addEventListener('click', () => {
            if (favoritesArea) {
                favoritesArea.style.display = 'block';
                favoritesArea.scrollIntoView({ behavior: 'smooth' });
            }
            fetchFavorites();
        });
    }

    // --- دالة التحقق الأمني ---
    async function checkAdminRoleFromBackend() {
        try {
            // طلب مباشر للسيرفر للتحقق من الجلسة (Session) الحالية
            const response = await fetch('/api/auth/me', {
                method: 'GET',
                headers: { 
                    'Cache-Control': 'no-cache', // منع الكاش لضمان دقة المعلومة
                    'Pragma': 'no-cache'
                }
            });

            if (!response.ok) return; // لو السيرفر مرجعش OK، يبقى مش أدمن

            const data = await response.json();
            
            // الشرط: مسجل دخول + الرتبة أدمن (من قاعدة البيانات مباشرة)
            if (data.isAuthenticated === true && data.role === 'admin') {
                const adminCard = document.getElementById('admin-card');
                if (adminCard) {
                    adminCard.style.display = 'block'; // إظهار الكارت
                }
            }
        } catch (e) {
            console.error('Security Check Failed:', e);
        }
    }

    // --- جلب المفضلة ---
    async function fetchFavorites() {
        if (!favoritesContainer) return;
        favoritesContainer.innerHTML = '<p class="empty-message info" style="text-align:center; color:#00d4ff;">جاري تحميل المفضلة...</p>';

        try {
            const response = await fetch('/api/favorites');
            if (response.status === 401) {
                favoritesContainer.innerHTML = '<p class="empty-message error" style="text-align:center; color:red;">انتهت الجلسة.</p>';
                return;
            }
            const properties = await response.json();
            favoritesContainer.innerHTML = '';

            if (properties.length === 0) {
                favoritesContainer.innerHTML = `<div style="text-align:center; padding:20px; border:1px dashed #444; border-radius:10px;">
                    <i class="fas fa-heart" style="color: #444; font-size: 2em;"></i>
                    <p style="color: #888; margin-top: 10px;">لا يوجد عقارات في المفضلة.</p>
                </div>`;
                return;
            }

            properties.forEach(property => {
                const price = Number(property.price).toLocaleString();
                const cardHTML = `
                    <div style="background:#1a1a1a; border:1px solid #333; border-radius:12px; overflow:hidden; margin-bottom:15px; display:flex; align-items:center; padding:10px;">
                        <img src="${property.imageUrl || 'logo.png'}" style="width:80px; height:80px; object-fit:cover; border-radius:8px; margin-left:15px;">
                        <div style="flex:1;">
                            <h3 style="font-size:1rem; margin:0; color:white;">${property.title}</h3> 
                            <p style="color:#00ff88; font-weight:bold; margin:5px 0;">${price} ج.م</p> 
                            <div style="display:flex; gap:10px;">
                                <a href="property-details?id=${property.id}" style="color:#00d4ff; text-decoration:none; font-size:0.9rem;">التفاصيل</a>
                                <button class="remove-favorite-btn" data-id="${property.id}" style="background:none; border:none; color:#ff4444; cursor:pointer;">حذف</button>
                            </div>
                        </div>
                    </div>
                `;
                favoritesContainer.innerHTML += cardHTML;
            });
            addRemoveFavoriteListeners();
        } catch (error) { favoritesContainer.innerHTML = `<p style="text-align:center; color:red;">خطأ: ${error.message}</p>`; }
    }

    function addRemoveFavoriteListeners() {
        document.querySelectorAll('.remove-favorite-btn').forEach(button => {
            button.addEventListener('click', async (e) => {
                if (!confirm('حذف من المفضلة؟')) return;
                const btn = e.currentTarget; 
                try {
                    await fetch(`/api/favorites/${btn.dataset.id}`, { method: 'DELETE' });
                    btn.parentElement.parentElement.parentElement.remove();
                    if (favoritesContainer.children.length === 0) fetchFavorites();
                } catch (error) { alert('فشل الحذف'); }
            });
        });
    }

    // Modal Logic
    const openModalBtn = document.getElementById('open-password-modal');
    if(openModalBtn) {
        openModalBtn.addEventListener('click', () => {
            modal.style.display = "block";
            checkAuthAndFillPhone(userPhone);
        });
    }
});

// Helper Functions
async function checkAuthAndFillPhone(storedPhone) {
    const phoneInput = document.getElementById('reset-phone');
    if (!phoneInput) return;
    if (storedPhone) { phoneInput.value = storedPhone; switchPassMode('normal'); } 
    else { switchPassMode('otp'); }
}

function closeModal() { document.getElementById("passwordModal").style.display = "none"; }

function switchPassMode(mode) {
    const normalDiv = document.getElementById('normal-change-mode');
    const otpDiv = document.getElementById('otp-change-mode');
    document.querySelectorAll('.message').forEach(m => m.textContent = ''); 
    if (mode === 'otp') { normalDiv.style.display='none'; otpDiv.style.display='block'; } 
    else { otpDiv.style.display='none'; normalDiv.style.display='block'; }
}

async function changePasswordNormal() {
    const msg = document.getElementById('pass-msg');
    const phoneVal = document.getElementById('reset-phone').value; 
    const currentPassword = document.getElementById('current-pass').value;
    const newPassword = document.getElementById('new-pass-1').value;
    if (!currentPassword || !newPassword) { msg.textContent = 'املأ الحقول'; msg.style.color = 'red'; return; }
    msg.textContent = 'جاري التحديث...';
    try {
        const response = await fetch('/api/user/change-password', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone: phoneVal, currentPassword, newPassword }) });
        const data = await response.json();
        if (data.success) { msg.textContent = '✅ تم التغيير'; msg.style.color = '#00ff88'; setTimeout(closeModal, 1500); } 
        else { msg.textContent = '❌ ' + data.message; msg.style.color = 'red'; }
    } catch (e) { msg.textContent = 'خطأ'; msg.style.color = 'red'; }
}

async function sendResetOTP() {
    const phoneInput = document.getElementById('reset-phone').value;
    const msg = document.getElementById('otp-msg');
    if (!phoneInput) { msg.textContent = 'رقم الهاتف مطلوب'; msg.style.color = 'red'; return; }
    msg.textContent = 'جاري الإرسال...';
    try {
        const response = await fetch('/api/auth/send-otp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone: phoneInput }) });
        const data = await response.json();
        if (data.success) { 
            msg.textContent = '✅ تم الإرسال'; msg.style.color = '#00ff88'; 
            document.getElementById('step-send-otp').style.display='none'; 
            document.getElementById('step-verify-otp').style.display='block'; 
        } else { msg.textContent = '❌ ' + data.message; msg.style.color = 'red'; }
    } catch (e) { msg.textContent = 'خطأ'; msg.style.color = 'red'; }
}

async function resetPasswordViaOTP() {
    const phoneInput = document.getElementById('reset-phone').value;
    const otp = document.getElementById('otp-code').value;
    const newPassword = document.getElementById('new-pass-2').value;
    const msg = document.getElementById('otp-msg');
    if (!otp || !newPassword) { msg.textContent = 'اكمل البيانات'; return; }
    try {
        const response = await fetch('/api/auth/reset-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone: phoneInput, otp, newPassword }) });
        const data = await response.json();
        if (data.success) { msg.textContent = '🎉 تم التغيير!'; msg.style.color = '#00ff88'; setTimeout(closeModal, 1500); } 
        else { msg.textContent = '❌ ' + data.message; msg.style.color = 'red'; }
    } catch (e) { msg.textContent = 'خطأ'; msg.style.color = 'red'; }
}
