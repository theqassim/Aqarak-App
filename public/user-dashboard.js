// متغيرات الدفع العامة
let selectedMethod = 'card'; 
let PRICE_PER_POINT = 1; // قيمة ابتدائية هتتغير لما نجيب السعر من السيرفر

document.addEventListener('DOMContentLoaded', async () => {
    
    // ----------------------------------------------------
    // 💰 1. إعدادات الدفع والتحقق من المعاملات (Paymob)
    // ----------------------------------------------------
    
    // أ. جلب سعر النقطة الحالي من الأدمن
    try {
        const res = await fetch('/api/config/payment-price');
        const data = await res.json();
        PRICE_PER_POINT = data.pointPrice || 1;
        // console.log(`Current Point Price: ${PRICE_PER_POINT} EGP`);
    } catch (e) {
        console.error("Failed to fetch price");
    }

    // ب. فحص نتيجة الدفع (لو المستخدم راجع من Paymob)
    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get('payment');

    if (paymentStatus === 'success') {
        window.history.replaceState({}, document.title, window.location.pathname);
        // عرض رسالة نجاح
        // نستخدم setTimeout عشان نضمن إن المودال ستايل اتحمل
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
    // 👤 2. بيانات المستخدم والواجهة الأساسية
    // ----------------------------------------------------

    // تحميل بيانات المستخدم (رصيد + صلاحيات)
    await loadUserData();

    // تعريف العناصر
    const favoritesBtn = document.getElementById('show-favorites');
    const favoritesArea = document.getElementById('favorites-area');
    const favoritesContainer = document.getElementById('favorites-listings');
    const modal = document.getElementById("passwordModal");

    // تشغيل زر عرض المفضلة
    if (favoritesBtn) {
        favoritesBtn.addEventListener('click', () => {
            if (favoritesArea) {
                favoritesArea.style.display = 'block';
                favoritesArea.scrollIntoView({ behavior: 'smooth' });
            }
            fetchFavorites();
        });
    }

    // تشغيل مودال تسجيل الخروج الفخم
    setupLogoutModal();

    // تشغيل مودال تغيير كلمة المرور
    const openModalBtn = document.getElementById('open-password-modal');
    if(openModalBtn) {
        openModalBtn.addEventListener('click', () => {
            if(modal) modal.style.display = "block";
            const userPhone = localStorage.getItem('userPhone');
            if (typeof checkAuthAndFillPhone === 'function') {
                checkAuthAndFillPhone(userPhone);
            }
        });
    }

    // ----------------------------------------------------
    // 🔥 الدوال الداخلية (Functions)
    // ----------------------------------------------------

    // أ. جلب بيانات المستخدم
    async function loadUserData() {
        try {
            const response = await fetch('/api/auth/me', { headers: { 'Cache-Control': 'no-cache' } });
            if (!response.ok) return;
            
            const data = await response.json();
            
            if (data.isAuthenticated) {
                // تغيير العنوان
                const titleEl = document.getElementById('welcome-title');
                if (titleEl && data.name) {
                    titleEl.textContent = `لوحة التحكم الخاصة بـ ${data.name}`;
                }

                // عرض الرصيد (لو الدفع مفعل)
                if (data.isPaymentActive === true && data.balance !== undefined) {
                    const balanceEl = document.getElementById('user-balance-display');
                    const numberEl = document.getElementById('balance-number');
                    if (balanceEl && numberEl) {
                        balanceEl.style.display = 'flex';
                        balanceEl.style.alignItems = 'center';
                        balanceEl.style.gap = '5px';
                        numberEl.textContent = data.balance;
                        
                        // إضافة زر الشحن (+) لو مش موجود
                        if (!document.getElementById('add-balance-btn')) {
                            const addBtn = document.createElement('i');
                            addBtn.id = 'add-balance-btn';
                            addBtn.className = 'fas fa-plus-circle';
                            addBtn.style.cssText = 'color: #00ff88; cursor: pointer; margin-right: 5px; font-size: 1.1rem;';
                            addBtn.onclick = openChargeModal; // ربط زر الشحن
                            balanceEl.prepend(addBtn);
                        }
                    }
                } else {
                    const balanceEl = document.getElementById('user-balance-display');
                    if (balanceEl) balanceEl.style.display = 'none';
                }

                // كارت الأدمن
                if (data.role === 'admin') {
                    const adminCard = document.getElementById('admin-card');
                    if (adminCard) adminCard.style.display = 'block';
                }
            }
        } catch (e) { console.error('Failed to load user data:', e); }
    }
    
    // ب. جلب المفضلة
    async function fetchFavorites() {
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
                
                const cardHTML = `
                    <div class="fav-card">
                        <a href="property-details?id=${property.id}" class="fav-img-link">
                            <img src="${imgUrl}" alt="${property.title}" class="fav-img">
                        </a>
                        <div class="fav-content">
                            <h3 class="fav-title" title="${property.title}">${property.title}</h3> 
                            <p class="fav-price">${price} ج.م</p> 
                            <div class="fav-actions">
                                <a href="property-details?id=${property.id}" class="btn-fav-view"><i class="fas fa-eye"></i> التفاصيل</a>
                                <button class="remove-favorite-btn btn-fav-remove" data-id="${property.id}" title="حذف من المفضلة"><i class="fas fa-trash-alt"></i></button>
                            </div>
                        </div>
                    </div>
                `;
                favoritesContainer.innerHTML += cardHTML;
            });
            
            addRemoveFavoriteListeners();

        } catch (error) { 
            favoritesContainer.innerHTML = `<p style="text-align:center; color:red;">حدث خطأ أثناء التحميل.</p>`; 
        }
    }

    // ج. تفعيل أزرار الحذف للمفضلة
    function addRemoveFavoriteListeners() {
        document.querySelectorAll('.remove-favorite-btn').forEach(button => {
            button.addEventListener('click', async (e) => {
                if (!confirm('هل أنت متأكد من إزالة هذا العقار من المفضلة؟')) return;
                const btn = e.currentTarget; 
                const card = btn.closest('.fav-card'); 
                try {
                    await fetch(`/api/favorites/${btn.dataset.id}`, { method: 'DELETE' });
                    if(card) {
                        card.style.transition = 'all 0.3s ease';
                        card.style.opacity = '0';
                        card.style.transform = 'translateX(20px)';
                        setTimeout(() => {
                            card.remove();
                            if (favoritesContainer.children.length === 0) fetchFavorites();
                        }, 300);
                    }
                } catch (error) { alert('فشل الحذف'); }
            });
        });
    }

    // د. إعداد مودال الخروج
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
                </div>
            `;
            document.body.insertAdjacentHTML('beforeend', logoutHTML);
        }

        const modal = document.getElementById('luxLogoutModal');
        const confirmBtn = document.getElementById('confirmLogoutBtn');
        const cancelBtn = document.getElementById('cancelLogoutBtn');
        
        document.querySelectorAll('.logout-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                modal.style.display = 'flex';
                confirmBtn.onclick = async () => {
                    confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
                    try {
                        await fetch('/api/logout', { method: 'POST' });
                        localStorage.clear();
                        window.location.href = 'index';
                    } catch (e) { window.location.href = 'index'; }
                };
            });
        });

        cancelBtn.onclick = () => modal.style.display = 'none';
        modal.onclick = (e) => { if(e.target === modal) modal.style.display = 'none'; };
    }

}); // ✅ نهاية DOMContentLoaded

// ----------------------------------------------------
// 💰 دوال الدفع (Payment Logic) - الجديد
// ----------------------------------------------------

// فتح مودال الشحن
function openChargeModal() {
    const modal = document.getElementById('charge-modal');
    if(modal) {
        modal.style.display = 'block';
        calculatePrice(); // تحديث السعر الافتراضي
    } else {
        alert('جاري تحميل نظام الدفع...');
    }
}

// حساب السعر بناءً على سعر النقطة من السيرفر
function calculatePrice() {
    const pointsInput = document.getElementById('charge-points');
    const priceDisplay = document.getElementById('price-display');
    if (!pointsInput || !priceDisplay) return;

    const points = pointsInput.value;
    if(points && points >= 0) {
        // الحساب بناءً على السعر اللي جاي من الداتابيز
        priceDisplay.innerText = (points * PRICE_PER_POINT).toLocaleString();
    } else {
        priceDisplay.innerText = '0';
    }
}

// تبديل طريقة الدفع (فيزا / محفظة)
function selectPaymentMethod(method) {
    selectedMethod = method;
    
    // تغيير شكل الزراير
    const cardBtn = document.getElementById('btn-card');
    const walletBtn = document.getElementById('btn-wallet');
    
    if(cardBtn) cardBtn.classList.toggle('active', method === 'card');
    if(walletBtn) walletBtn.classList.toggle('active', method === 'wallet');

    // إظهار/إخفاء حقل رقم المحفظة
    const walletInput = document.getElementById('wallet-input-container');
    if (walletInput) {
        walletInput.style.display = (method === 'wallet') ? 'block' : 'none';
    }
}

// بدء عملية الشحن
async function startChargeProcess() {
    const points = document.getElementById('charge-points').value;
    const btn = document.querySelector('button[onclick="startChargeProcess()"]');
    
    // التحقق من النقاط
    if (!points || points < 10) return alert('أقل عدد نقاط للشحن هو 10');

    // التحقق من رقم المحفظة لو اختار فودافون كاش
    let mobileNumber = null;
    if (selectedMethod === 'wallet') {
        mobileNumber = document.getElementById('wallet-number').value;
        if (!mobileNumber || mobileNumber.length < 11) return alert('يرجى كتابة رقم محفظة صحيح');
    }

    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الاتصال...';
    btn.disabled = true;

    try {
        const res = await fetch('/api/payment/charge', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                points: points, 
                method: selectedMethod,
                mobileNumber: mobileNumber
            })
        });
        const data = await res.json();

        if (res.ok) {
            if (data.iframeUrl) {
                // لو فيزا -> Iframe
                window.location.href = data.iframeUrl;
            } else if (data.redirectUrl) {
                // لو محفظة -> Redirect
                window.location.href = data.redirectUrl;
            }
        } else {
            alert('❌ ' + (data.message || 'حدث خطأ'));
        }
    } catch (e) {
        console.error(e);
        alert('خطأ في الاتصال');
    } finally {
        btn.innerHTML = 'تأكيد وشراء النقاط <i class="fas fa-check-circle"></i>';
        btn.disabled = false;
    }
}

// ----------------------------------------------------
// 🔐 دوال الأمان (تغيير كلمة المرور)
// ----------------------------------------------------

async function checkAuthAndFillPhone(storedPhone) {
    const phoneInput = document.getElementById('reset-phone');
    if (!phoneInput) return;
    if (storedPhone) { phoneInput.value = storedPhone; switchPassMode('normal'); } 
    else { switchPassMode('otp'); }
}

function closeModal() { 
    const m = document.getElementById("passwordModal");
    if(m) m.style.display = "none"; 
}

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
        const response = await fetch('/api/auth/send-otp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone: phoneInput, type: 'reset' }) });
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