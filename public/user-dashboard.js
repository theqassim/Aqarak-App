document.addEventListener('DOMContentLoaded', () => {
    // 1. المتغيرات
    const userPhone = localStorage.getItem('userPhone'); 
    const favoritesBtn = document.getElementById('show-favorites');
    const favoritesArea = document.getElementById('favorites-area');
    const favoritesContainer = document.getElementById('favorites-listings');
    const modal = document.getElementById("passwordModal");

    // 2. منطق المفضلة
    if (favoritesBtn) {
        favoritesBtn.addEventListener('click', () => {
            if (favoritesArea) {
                favoritesArea.style.display = 'block';
                favoritesArea.scrollIntoView({ behavior: 'smooth' });
            }
            fetchFavorites();
        });
    }

    async function fetchFavorites() {
        if (!favoritesContainer) return;
        
        favoritesContainer.innerHTML = '<p style="text-align:center; color:#00d4ff;"><i class="fas fa-spinner fa-spin"></i> جاري تحميل العقارات...</p>';

        try {
            const response = await fetch('/api/favorites');
            
            if (response.status === 401) {
                favoritesContainer.innerHTML = '<p style="text-align:center; color:#ff4444;">انتهت الجلسة، يرجى تسجيل الدخول مرة أخرى.</p>';
                return;
            }
            
            if (!response.ok) throw new Error('فشل الاتصال بالسيرفر');
            
            const properties = await response.json();
            favoritesContainer.innerHTML = '';

            if (properties.length === 0) {
                favoritesContainer.innerHTML = `
                    <div style="grid-column: 1/-1; text-align: center; padding: 40px; background: rgba(255,255,255,0.02); border-radius: 15px; border: 1px dashed #444;">
                        <i class="far fa-heart" style="font-size: 3rem; color: #444; margin-bottom: 15px;"></i>
                        <p style="color: #888;">لم تقم بإضافة أي عقارات للمفضلة بعد.</p>
                        <a href="home" style="color: #00ff88; text-decoration: none; font-weight: bold; margin-top: 10px; display: inline-block;">تصفح العقارات الآن</a>
                    </div>`;
                return;
            }

            // رسم الكروت بالشكل الجديد (Grid Card)
            properties.forEach(property => {
                // تنسيق السعر
                const priceFormatted = Number(property.price).toLocaleString('ar-EG');
                
                const cardHTML = `
                    <div class="fav-property-card" id="fav-card-${property.id}">
                        <div class="fav-img-box">
                            <img src="${property.imageUrl || 'logo.png'}" alt="${property.title}">
                            <span style="position:absolute; top:10px; right:10px; background:rgba(0,0,0,0.7); color:white; padding:3px 8px; border-radius:6px; font-size:0.8rem;">
                                ${property.type === 'rent' || property.type === 'إيجار' ? 'للإيجار' : 'للبيع'}
                            </span>
                        </div>
                        <div class="fav-content">
                            <h3 class="fav-title">${property.title}</h3> 
                            <p class="fav-price">${priceFormatted} ج.م</p> 
                            <p style="color:#888; font-size:0.85rem; margin-bottom:10px;">
                                <i class="fas fa-bed"></i> ${property.rooms || 0} غرف &nbsp;|&nbsp; 
                                <i class="fas fa-ruler-combined"></i> ${property.area} م²
                            </p>
                            
                            <div class="fav-actions">
                                <a href="property-details.html?id=${property.id}" class="btn-view">التفاصيل</a>
                                <button class="btn-remove remove-favorite-btn" data-id="${property.id}" title="إزالة من المفضلة">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                `;
                favoritesContainer.innerHTML += cardHTML;
            });

            addRemoveFavoriteListeners();

        } catch (error) {
            console.error('Error fetching favorites:', error);
            favoritesContainer.innerHTML = `<p style="text-align:center; color:#ff4444;">حدث خطأ: ${error.message}</p>`;
        }
    }

    function addRemoveFavoriteListeners() {
        document.querySelectorAll('.remove-favorite-btn').forEach(button => {
            button.addEventListener('click', async (e) => {
                const btn = e.currentTarget; 
                const propertyId = btn.dataset.id;

                if (!confirm('إزالة من المفضلة؟')) return;

                const originalHTML = btn.innerHTML;
                btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

                try {
                    const response = await fetch(`/api/favorites/${propertyId}`, { method: 'DELETE' });
                    if (!response.ok) throw new Error('فشل الإزالة.');

                    const card = document.getElementById(`fav-card-${propertyId}`);
                    if (card) {
                        card.style.transform = 'scale(0.9)';
                        card.style.opacity = '0';
                        setTimeout(() => {
                            card.remove();
                            // إعادة التحميل لو القائمة فضيت
                            if (document.querySelectorAll('.fav-property-card').length === 0) fetchFavorites();
                        }, 300);
                    }

                } catch (error) {
                    alert(`خطأ: ${error.message}`);
                    btn.innerHTML = originalHTML;
                }
            });
        });
    }

    // 3. منطق المودال (نفس المنطق القديم مع تحسينات بسيطة)
    const openModalBtn = document.getElementById('open-password-modal');
    if(openModalBtn) {
        openModalBtn.addEventListener('click', () => {
            modal.style.display = "block";
            checkAuthAndFillPhone(userPhone);
        });
    }
});

// دوال مساعدة (Global)
window.closeModal = () => { document.getElementById("passwordModal").style.display = "none"; };

window.switchPassMode = (mode) => {
    const normalDiv = document.getElementById('normal-change-mode');
    const otpDiv = document.getElementById('otp-change-mode');
    const msgs = document.querySelectorAll('.message');
    msgs.forEach(m => m.textContent = ''); 

    if (mode === 'otp') {
        normalDiv.style.display = 'none';
        otpDiv.style.display = 'block';
    } else {
        otpDiv.style.display = 'none';
        normalDiv.style.display = 'block';
    }
};

async function checkAuthAndFillPhone(storedPhone) {
    const phoneInput = document.getElementById('reset-phone');
    if (!phoneInput) return;

    if (storedPhone) {
        phoneInput.value = storedPhone;
        switchPassMode('normal');
    } else {
        try {
            const res = await fetch('/api/auth/me');
            const data = await res.json();
            if (data.isAuthenticated) {
                phoneInput.value = data.phone;
                switchPassMode('normal');
            } else { switchPassMode('otp'); }
        } catch (e) { switchPassMode('otp'); }
    }
}

// أ) تغيير الباسورد العادي
async function changePasswordNormal() {
    const msg = document.getElementById('pass-msg');
    const phoneVal = document.getElementById('reset-phone').value; 
    const currentPassword = document.getElementById('current-pass').value;
    const newPassword = document.getElementById('new-pass-1').value;

    if (!currentPassword || !newPassword) {
        msg.textContent = 'املأ جميع الحقول'; msg.style.color = '#ff4444'; return;
    }

    msg.textContent = 'جاري التحديث...'; msg.style.color = '#00d4ff';

    try {
        const response = await fetch('/api/user/change-password', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone: phoneVal, currentPassword, newPassword })
        });
        
        const data = await response.json();
        if (data.success) {
            msg.textContent = '✅ تم تغيير كلمة المرور بنجاح';
            msg.style.color = '#00ff88';
            setTimeout(closeModal, 1500);
        } else {
            msg.textContent = '❌ ' + data.message;
            msg.style.color = '#ff4444';
        }
    } catch (e) { msg.textContent = 'خطأ في الاتصال'; msg.style.color = '#ff4444'; }
}

// ب) إرسال كود OTP
async function sendResetOTP() {
    const phoneInput = document.getElementById('reset-phone').value;
    const msg = document.getElementById('otp-msg');
    
    if (!phoneInput) { msg.textContent = 'أدخل الرقم أولاً'; msg.style.color = '#ff4444'; return; }

    msg.textContent = 'جاري إرسال الكود...'; msg.style.color = '#00d4ff';

    try {
        const response = await fetch('/api/auth/send-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone: phoneInput })
        });
        const data = await response.json();
        
        if (data.success) {
            msg.textContent = '✅ تم الإرسال! أدخل الكود.';
            msg.style.color = '#00ff88';
            document.getElementById('step-send-otp').style.display = 'none';
            document.getElementById('step-verify-otp').style.display = 'block';
        } else {
            msg.textContent = '❌ ' + data.message;
            msg.style.color = '#ff4444';
        }
    } catch (e) { msg.textContent = 'خطأ في الاتصال'; msg.style.color = '#ff4444'; }
}

// ج) تأكيد الكود
async function resetPasswordViaOTP() {
    const phoneInput = document.getElementById('reset-phone').value;
    const otp = document.getElementById('otp-code').value;
    const newPassword = document.getElementById('new-pass-2').value;
    const msg = document.getElementById('otp-msg');

    if (!otp || !newPassword) { msg.textContent = 'أكمل البيانات'; return; }

    try {
        const response = await fetch('/api/auth/reset-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone: phoneInput, otp, newPassword })
        });
        const data = await response.json();

        if (data.success) {
            msg.textContent = '🎉 تم تغيير كلمة المرور!';
            msg.style.color = '#00ff88';
            setTimeout(closeModal, 1500);
        } else {
            msg.textContent = '❌ ' + data.message;
            msg.style.color = '#ff4444';
        }
    } catch (e) { msg.textContent = 'خطأ'; msg.style.color = '#ff4444'; }
}