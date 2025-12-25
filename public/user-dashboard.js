// متغيرات الدفع العامة
let selectedMethod = 'card'; 
let PRICE_PER_POINT = 1; 

document.addEventListener('DOMContentLoaded', async () => {
    
    // ----------------------------------------------------
    // 💰 1. إعدادات الدفع والتحقق
    // ----------------------------------------------------
    try {
        const res = await fetch('/api/config/payment-price');
        const data = await res.json();
        PRICE_PER_POINT = data.pointPrice || 1;
    } catch (e) { console.error("Failed to fetch price"); }

    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get('payment');

    if (paymentStatus === 'success') {
        window.history.replaceState({}, document.title, window.location.pathname);
        setTimeout(() => {
            if(window.showStatusModal) window.showStatusModal('success', 'تم الشحن بنجاح! 💰', 'تمت إضافة النقاط إلى محفظتك.');
            else alert('تم الشحن بنجاح!');
        }, 500);
    } else if (paymentStatus === 'failed') {
        window.history.replaceState({}, document.title, window.location.pathname);
        setTimeout(() => {
            if(window.showStatusModal) window.showStatusModal('rejected', 'فشلت العملية', 'لم يتم خصم أي مبلغ.');
            else alert('فشلت عملية الدفع.');
        }, 500);
    }

    // ----------------------------------------------------
    // 👤 2. البيانات والواجهة
    // ----------------------------------------------------
    await loadUserData();
    setupLogoutModal();
    checkNotifications();
    setInterval(checkNotifications, 60000);
    updateGreetingWidget();

    // تشغيل زر عرض المفضلة
    const favoritesBtn = document.getElementById('show-favorites');
    if (favoritesBtn) {
        favoritesBtn.addEventListener('click', () => {
            const favoritesArea = document.getElementById('favorites-area');
            if (favoritesArea) {
                favoritesArea.style.display = 'block';
                favoritesArea.scrollIntoView({ behavior: 'smooth' });
            }
            fetchFavorites();
        });
    }

    // تشغيل مودال تغيير كلمة المرور
    const openModalBtn = document.getElementById('open-password-modal');
    if(openModalBtn) {
        openModalBtn.addEventListener('click', () => {
            const modal = document.getElementById("passwordModal");
            if(modal) modal.style.display = "block";
            const userPhone = localStorage.getItem('userPhone');
            if (typeof checkAuthAndFillPhone === 'function') checkAuthAndFillPhone(userPhone);
        });
    }
}); 

// ----------------------------------------------------
// 🔥 الدوال الأساسية (Global Functions)
// ----------------------------------------------------

// أ. جلب بيانات المستخدم
async function loadUserData() {
    try {
        const response = await fetch('/api/auth/me', { headers: { 'Cache-Control': 'no-cache' } });
        if (!response.ok) return;
        
        const data = await response.json();
        
        if (data.isAuthenticated) {
            const titleEl = document.getElementById('welcome-title');
            if (titleEl && data.name) titleEl.textContent = `لوحة التحكم الخاصة بـ ${data.name}`;

            const headerImg = document.getElementById('header-profile-img');
            if (headerImg) headerImg.src = data.profile_picture || 'logo.jpg';

            const dropName = document.getElementById('dropdown-username');
            const dropBalance = document.getElementById('dropdown-balance');
            
            if (dropName) dropName.textContent = data.name || data.username;
            
            if (data.isPaymentActive === true) {
                if (dropBalance) {
                    dropBalance.innerHTML = `${data.balance || 0} <i class="fas fa-coins"></i>`;
                    dropBalance.style.display = 'flex';
                }
            } else {
                if (dropBalance) dropBalance.style.display = 'none';
            }

            if (data.role === 'admin') {
                const adminCard = document.getElementById('admin-card');
                if (adminCard) adminCard.style.display = 'block';
            }
        }
    } catch (e) { console.error('Failed to load user data:', e); }
}

// ب. جلب المفضلة
async function fetchFavorites() {
    const favoritesContainer = document.getElementById('favorites-listings');
    if (!favoritesContainer) return;
    favoritesContainer.innerHTML = '<div style="text-align:center; padding:20px; width:100%;"><i class="fas fa-spinner fa-spin" style="color:var(--neon-primary); font-size:2rem;"></i></div>';

    try {
        const response = await fetch('/api/favorites');
        if (response.status === 401) {
            favoritesContainer.innerHTML = '<p class="empty-message error" style="text-align:center; color:red;">انتهت الجلسة.</p>';
            return;
        }
        const properties = await response.json();
        favoritesContainer.innerHTML = '';

        if (properties.length === 0) {
            favoritesContainer.innerHTML = `
                <div style="text-align:center; padding:40px; border:1px dashed #444; border-radius:15px; width:100%;">
                    <i class="fas fa-heart-broken" style="color: #444; font-size: 3rem; margin-bottom:15px;"></i>
                    <p style="color: #888; font-size:1.1rem;">لا يوجد عقارات في المفضلة حالياً.</p>
                    <a href="home" style="color:var(--neon-secondary); margin-top:10px; display:inline-block; text-decoration:none;">تصفح العقارات</a>
                </div>`;
            return;
        }

        properties.forEach(property => {
            const price = Number(property.price).toLocaleString();
            const imgUrl = property.imageUrl || 'logo.png';
            favoritesContainer.innerHTML += `
                <div class="fav-card">
                    <a href="property-details?id=${property.id}" class="fav-img-link">
                        <img src="${imgUrl}" alt="${property.title}" class="fav-img">
                    </a>
                    <div class="fav-content">
                        <h3 class="fav-title" title="${property.title}">${property.title}</h3> 
                        <p class="fav-price">${price} ج.م</p> 
                        <div class="fav-actions">
                            <a href="property-details?id=${property.id}" class="btn-fav-view"><i class="fas fa-eye"></i> التفاصيل</a>
                            <button class="remove-favorite-btn btn-fav-remove" data-id="${property.id}" onclick="removeFromFav(this, ${property.id})"><i class="fas fa-trash-alt"></i></button>
                        </div>
                    </div>
                </div>`;
        });
    } catch (error) { 
        favoritesContainer.innerHTML = `<p style="text-align:center; color:red;">حدث خطأ أثناء التحميل.</p>`; 
    }
}

// دالة حذف من المفضلة (تم تحسينها لتكون Global)
window.removeFromFav = async function(btn, id) {
    if (!confirm('هل أنت متأكد من إزالة هذا العقار من المفضلة؟')) return;
    const card = btn.closest('.fav-card'); 
    try {
        await fetch(`/api/favorites/${id}`, { method: 'DELETE' });
        if(card) {
            card.style.transition = 'all 0.3s ease';
            card.style.opacity = '0';
            setTimeout(() => {
                card.remove();
                if (document.getElementById('favorites-listings').children.length === 0) fetchFavorites();
            }, 300);
        }
    } catch (error) { alert('فشل الحذف'); }
};

// ==========================================
// 💰 دوال الدفع (Payment Logic)
// ==========================================

window.openChargeModal = function() {
    const modal = document.getElementById('charge-modal');
    if(modal) {
        modal.style.display = 'block';
        window.calculatePrice(); 
    } else {
        alert('جاري تحميل نظام الدفع...');
    }
}

window.calculatePrice = function() {
    const pointsInput = document.getElementById('charge-points');
    const priceDisplay = document.getElementById('price-display');
    if (!pointsInput || !priceDisplay) return;
    const points = pointsInput.value;
    priceDisplay.innerText = (points && points >= 0) ? (points * PRICE_PER_POINT).toLocaleString() : '0';
}

window.selectPaymentMethod = function(method) {
    selectedMethod = method;
    const cardBtn = document.getElementById('btn-card');
    const walletBtn = document.getElementById('btn-wallet');
    if(cardBtn) cardBtn.classList.toggle('active', method === 'card');
    if(walletBtn) walletBtn.classList.toggle('active', method === 'wallet');
    const walletInput = document.getElementById('wallet-input-container');
    if (walletInput) walletInput.style.display = (method === 'wallet') ? 'block' : 'none';
}

window.startChargeProcess = async function() {
    const points = document.getElementById('charge-points').value;
    const btn = document.querySelector('button[onclick="startChargeProcess()"]');
    if (!points || points < 10) return alert('أقل عدد نقاط للشحن هو 10');
    let mobileNumber = null;
    if (selectedMethod === 'wallet') {
        mobileNumber = document.getElementById('wallet-number').value;
        if (!mobileNumber || mobileNumber.length < 11) return alert('يرجى كتابة رقم محفظة صحيح');
    }
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الاتصال...';
    btn.disabled = true;
    try {
        const res = await fetch('/api/payment/charge', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ points: points, method: selectedMethod, mobileNumber: mobileNumber })
        });
        const data = await res.json();
        if (res.ok) {
            if (data.iframeUrl) window.location.href = data.iframeUrl;
            else if (data.redirectUrl) window.location.href = data.redirectUrl;
        } else { alert('❌ ' + (data.message || 'حدث خطأ')); }
    } catch (e) { alert('خطأ في الاتصال'); } 
    finally { btn.innerHTML = 'تأكيد وشراء النقاط <i class="fas fa-check-circle"></i>'; btn.disabled = false; }
}

// ==========================================
// 🔔 دوال الإشعارات والتحيات
// ==========================================

function updateGreetingWidget() {
    const greetingEl = document.getElementById('time-greeting');
    const iconEl = document.getElementById('greeting-icon');
    const dateEl = document.getElementById('current-date');
    if (!greetingEl) return;
    const now = new Date();
    const hour = now.getHours();
    if (hour >= 5 && hour < 12) {
        greetingEl.textContent = 'صباح الخير ☀️'; iconEl.className = 'fas fa-sun'; iconEl.style.color = '#FFD700';
    } else if (hour >= 12 && hour < 17) {
        greetingEl.textContent = 'طاب يومك 🌤️'; iconEl.className = 'fas fa-cloud-sun'; iconEl.style.color = '#FFA500';
    } else {
        greetingEl.textContent = 'مساء الخير 🌙'; iconEl.className = 'fas fa-moon'; iconEl.style.color = '#00d4ff';
    }
    dateEl.textContent = now.toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'short' });
}

window.toggleNotificationMenu = function(e) {
    e.stopPropagation();
    const menu = document.getElementById('notif-dropdown');
    document.getElementById('profile-dropdown').style.display = 'none'; // إغلاق البروفايل لو مفتوح
    menu.style.display = (menu.style.display === 'block') ? 'none' : 'block';
}

async function checkNotifications() {
    try {
        const res = await fetch('/api/user/notifications');
        const data = await res.json();
        const dot = document.getElementById('notif-dot');
        const list = document.getElementById('notif-list');
        if (data.unreadCount > 0) {
            dot.style.display = 'block';
            dot.textContent = data.unreadCount > 9 ? '+9' : data.unreadCount;
        } else { dot.style.display = 'none'; }
        if (data.notifications && data.notifications.length > 0) {
            list.innerHTML = data.notifications.map(n => `
                <div class="notif-item ${n.is_read ? '' : 'unread'}">
                    <h4>${n.title}</h4>
                    <p>${n.message}</p>
                    <span class="notif-time">${new Date(n.created_at).toLocaleTimeString('ar-EG', {hour:'2-digit', minute:'2-digit'})}</span>
                </div>`).join('');
        }
    } catch (e) { console.error("Notif Error", e); }
}

window.markNotificationsRead = async function() {
    try {
        await fetch('/api/user/notifications/read', { method: 'POST' });
        document.getElementById('notif-dot').style.display = 'none';
        document.querySelectorAll('.notif-item.unread').forEach(el => el.classList.remove('unread'));
    } catch (e) {}
}

// ==========================================
// 🚪 تسجيل الخروج (Fixed)
// ==========================================

function setupLogoutModal() {
    if (!document.getElementById('luxLogoutModal')) {
        const logoutHTML = `
            <style>
                #luxLogoutModal { display: none; position: fixed; z-index: 99999; left: 0; top: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.9); backdrop-filter: blur(8px); justify-content: center; align-items: center; }
                .lux-logout-card { background: linear-gradient(145deg, #1a1a1a, #111); padding: 40px; border-radius: 25px; border: 1px solid #ff4444; box-shadow: 0 0 50px rgba(255, 68, 68, 0.15); text-align: center; max-width: 90%; width: 400px; animation: popIn 0.4s; }
                .lux-logout-icon { font-size: 3.5rem; color: #ff4444; margin-bottom: 20px; }
                .lux-logout-title { color: white; font-size: 1.6rem; margin-bottom: 10px; font-weight: bold; }
                .lux-logout-desc { color: #ccc; margin-bottom: 30px; font-size: 1.1rem; }
                .lux-logout-btns { display: flex; gap: 15px; justify-content: center; }
                .lux-btn { padding: 12px 35px; border-radius: 50px; cursor: pointer; font-weight: bold; border: none; transition: 0.3s; font-size: 1rem; }
                .lux-btn-yes { background: #ff4444; color: white; }
                .lux-btn-yes:hover { background: #ff2222; transform: translateY(-2px); }
                .lux-btn-no { background: transparent; color: white; border: 1px solid #555; }
                .lux-btn-no:hover { background: rgba(255, 255, 255, 0.1); }
                @keyframes popIn { from { transform: scale(0.8); opacity: 0; } to { transform: scale(1); opacity: 1; } }
            </style>
            <div id="luxLogoutModal">
                <div class="lux-logout-card">
                    <i class="fas fa-sign-out-alt lux-logout-icon"></i>
                    <h3 class="lux-logout-title">تسجيل الخروج</h3>
                    <p class="lux-logout-desc">هل أنت متأكد أنك تريد المغادرة؟</p>
                    <div class="lux-logout-btns">
                        <button id="confirmLogoutBtn" class="lux-btn lux-btn-yes">نعم، خروج</button>
                        <button id="cancelLogoutBtn" class="lux-btn lux-btn-no">إلغاء</button>
                    </div>
                </div>
            </div>`;
        document.body.insertAdjacentHTML('beforeend', logoutHTML);
        
        // تفعيل أزرار المودال
        document.getElementById('confirmLogoutBtn').onclick = async function() {
            this.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
            try {
                await fetch('/api/logout', { method: 'POST' });
                localStorage.clear();
                window.location.href = 'index';
            } catch (e) { window.location.href = 'index'; }
        };
        document.getElementById('cancelLogoutBtn').onclick = function() {
            document.getElementById('luxLogoutModal').style.display = 'none';
        };
    }
}

// دالة فتح مودال الخروج (عامة)
window.openLogoutModal = function() {
    setupLogoutModal(); // التأكد من وجود المودال
    document.getElementById('luxLogoutModal').style.display = 'flex';
}

// ==========================================
// 🧩 دوال القوائم العامة
// ==========================================

window.toggleProfileMenu = function() {
    const menu = document.getElementById('profile-dropdown');
    document.getElementById('notif-dropdown').style.display = 'none'; // إغلاق الإشعارات لو مفتوحة
    menu.style.display = (menu.style.display === 'block') ? 'none' : 'block';
}

window.onclick = function(e) {
    if (!e.target.closest('.profile-menu-container')) {
        const menu = document.getElementById('profile-dropdown');
        if (menu) menu.style.display = 'none';
    }
    if (!e.target.closest('.header-notification-btn')) {
        const menu = document.getElementById('notif-dropdown');
        if (menu) menu.style.display = 'none';
    }
    const modal = document.getElementById("passwordModal");
    if (e.target == modal) modal.style.display = "none";
}

// دوال تغيير كلمة المرور (نفس القديمة)
window.checkAuthAndFillPhone = async function(storedPhone) {
    const phoneInput = document.getElementById('reset-phone');
    if (!phoneInput) return;
    if (storedPhone) { phoneInput.value = storedPhone; window.switchPassMode('normal'); } 
    else { window.switchPassMode('otp'); }
}
window.closeModal = function() { document.getElementById("passwordModal").style.display = "none"; }
window.switchPassMode = function(mode) {
    const normalDiv = document.getElementById('normal-change-mode');
    const otpDiv = document.getElementById('otp-change-mode');
    document.querySelectorAll('.message').forEach(m => m.textContent = ''); 
    if (mode === 'otp') { normalDiv.style.display='none'; otpDiv.style.display='block'; } 
    else { otpDiv.style.display='none'; normalDiv.style.display='block'; }
}
window.changePasswordNormal = async function() {
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
